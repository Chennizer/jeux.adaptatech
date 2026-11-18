import { Server, routePartykitRequest } from 'partyserver';
import { GAME_PATH, INPUT_MODES, PARTIES_PATH, ROOM_CODE, SNAPSHOT_MS } from '../../arcade/space-adventure-coop/protocol.js';
import { createRound, finishRound, fire, snapshot, stepRound, STEP_MS } from './match.js';

const ROOM_LIFETIME_MS = 2 * 60 * 60 * 1000;
const CHECKPOINT_MS = 10000;
const PLAYER_KEY = /^[a-f0-9]{32}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') return Response.redirect(new URL(GAME_PATH, url), 302);
    if (!url.pathname.startsWith('/parties/')) return env.ASSETS.fetch(request);

    const code = url.pathname.slice(PARTIES_PATH.length);
    if (!url.pathname.startsWith(PARTIES_PATH) || !ROOM_CODE.test(code)) return new Response('Room not found', { status: 404 });
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket required', { status: 426 });
    const origin = request.headers.get('Origin');
    const allowedOrigins = (env.FRONTEND_ORIGINS || '').split(',').map(value => value.trim());
    if (origin !== url.origin && !allowedOrigins.includes(origin)) return new Response('Origin forbidden', { status: 403 });

    return await routePartykitRequest(request, env) ?? new Response('Room not found', { status: 404 });
  }
};

export class GameRoom extends Server {
  static options = { hibernate: true };

  slots = null;
  round = null;
  loop = null;

  async onStart() {
    const stored = await this.ctx.storage.get(['slots', 'round']);
    this.slots = stored.get('slots') ?? null;
    this.round = stored.get('round') ?? null;
    this.resumeIfReady();
  }

  async onMessage(connection, raw) {
    if (typeof raw !== 'string' || raw.length > 512) return;
    let message;
    try { message = JSON.parse(raw); } catch { return; }
    if (!message || typeof message !== 'object') return;

    if (message.type === 'hello' && !connection.state) {
      await this.join(connection, message);
      return;
    }
    if (!connection.state || !this.slots) return;
    const { seat } = connection.state;

    if (message.type === 'ready' && this.round?.phase !== 'playing') {
      if (!INPUT_MODES.includes(message.input) || typeof message.ready !== 'boolean') return;
      const storedPlayer = this.slots[seat];
      if (!storedPlayer) return;
      storedPlayer.input = message.input;
      connection.setState({ seat, ready: message.ready });
      const players = this.connectedPlayers();
      if (players.every(player => player?.state.ready)) {
        this.round = createRound(crypto.randomUUID());
        for (const player of players) player.setState({ seat: player.state.seat, ready: false });
        this.resumeIfReady();
        await this.ctx.storage.setAlarm(Date.now() + ROOM_LIFETIME_MS);
        await this.checkpoint();
      } else {
        await this.ctx.storage.put('slots', this.slots);
      }
      this.publish();
    }

    if (message.type === 'fire' && this.loop !== null) {
      const player = this.slots[seat];
      if (player) fire(this.round, seat, player.input, message.targetId);
    }

    if (message.type === 'leave') await this.leave(connection);
  }

  async join(connection, { key, create, input }) {
    if (typeof key !== 'string' || !PLAYER_KEY.test(key) || !INPUT_MODES.includes(input)) return;
    let created = false;
    if (!this.slots) {
      if (create !== true) return this.reject(connection, 'missing');
      this.slots = [{ key, input }, null];
      created = true;
    }

    let seat = this.slots.findIndex(player => player?.key === key);
    if (seat < 0 && create === true) return this.reject(connection, 'code-taken');
    const existing = seat < 0 ? null : this.connectedPlayers()[seat];
    if (seat < 0) {
      seat = this.slots.indexOf(null);
      if (seat < 0) return this.reject(connection, 'full');
      this.slots[seat] = { key, input };
    }

    connection.setState({ seat, ready: existing?.state.ready ?? false });
    if (existing) {
      existing.setState(null);
      existing.close(4002, 'Player connected on another tab');
    }

    const saved = this.ctx.storage.put('slots', this.slots);
    if (created) await this.ctx.storage.setAlarm(Date.now() + ROOM_LIFETIME_MS);
    await saved;
    this.send(connection, { type: 'welcome', seat, input: this.slots[seat]?.input ?? input });
    this.resumeIfReady();
    this.publish();
  }

  connectedPlayers(except) {
    const players = [null, null];
    for (const connection of this.getConnections()) {
      if (connection.state && connection.id !== except) players[connection.state.seat] = connection;
    }
    return players;
  }

  resumeIfReady() {
    if (this.loop !== null || this.round?.phase !== 'playing' || !this.connectedPlayers().every(Boolean)) return;
    this.lastTick = Date.now();
    this.lastSnapshot = this.lastTick;
    this.lastCheckpoint = this.lastTick;
    this.loop = setInterval(() => this.tick(), STEP_MS);
  }

  stop() {
    if (this.loop !== null) clearInterval(this.loop);
    this.loop = null;
  }

  tick() {
    const now = Date.now();
    let dt = Math.min(now - this.lastTick, 250);
    this.lastTick = now;
    while (dt > 0 && this.round.phase === 'playing') {
      const step = Math.min(dt, STEP_MS);
      stepRound(this.round, step);
      dt -= step;
    }
    if (this.round.phase === 'finished') this.stop();
    if (this.loop === null || now - this.lastSnapshot >= SNAPSHOT_MS - STEP_MS / 3) {
      this.lastSnapshot = now;
      this.publish();
    }
    if (this.loop === null || now - this.lastCheckpoint >= CHECKPOINT_MS) {
      this.lastCheckpoint = now;
      this.checkpoint().catch(error => console.error('Unable to save match state', error));
    }
  }

  async onClose(connection) {
    if (!connection.state) return;
    if (this.loop !== null && !this.connectedPlayers(connection.id).every(Boolean)) {
      this.stop();
      await this.checkpoint();
    }
    this.publish(connection.id);
  }

  async leave(connection) {
    const { seat } = connection.state;
    this.slots[seat] = null;
    connection.setState(null);
    if (this.round?.phase === 'playing') {
      finishRound(this.round);
      this.stop();
    }
    await this.checkpoint();
    connection.close(1000, 'Left room');
    this.publish();
  }

  async onAlarm() {
    this.stop();
    this.round = null;
    this.slots = null;
    for (const connection of this.getConnections()) this.reject(connection, 'missing');
    await this.ctx.storage.deleteAll();
  }

  checkpoint() {
    return this.ctx.storage.put({ slots: this.slots, round: this.round });
  }

  publish(except) {
    if (!this.slots) return;
    const players = this.connectedPlayers(except);
    const phase = this.round?.phase === 'playing' && this.loop === null ? 'paused' : this.round?.phase ?? 'lobby';
    const message = JSON.stringify({
      type: 'state', phase,
      players: this.slots.map((player, i) => ({
        connected: Boolean(players[i]), ready: players[i]?.state.ready ?? false, input: player?.input ?? null
      })),
      round: this.round && snapshot(this.round)
    });
    for (const player of players) {
      if (player) this.send(player, message);
    }
    if (this.round) this.round.effects = [];
  }

  send(connection, message) {
    try {
      connection.send(typeof message === 'string' ? message : JSON.stringify(message));
    } catch {
      connection.close(1011, 'Connection interrupted');
    }
  }

  reject(connection, reason) {
    this.send(connection, { type: 'error', reason });
    connection.close(4001, reason);
  }
}
