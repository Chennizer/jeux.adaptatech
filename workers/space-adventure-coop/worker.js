import { Server, routePartykitRequest } from 'partyserver';
import {
  DIFFICULTIES, FRAME_INTERVAL, GAME_PATH, INPUT_MODES, LEGACY_ROOM_CODE, MAX_FRAME_BYTES, ONLINE_PARTIES_PATH,
  PARTIES_PATH, ROOM_CODE, ROOM_PING, ROOM_PONG, SNAPSHOT_MS, cleanPlayerName
} from '../../arcade/space-adventure-coop/protocol.js';
import { createRound, finishRound, fire, snapshot, stepRound, STEP_MS } from './match.js';

const ROOM_LIFETIME_MS = 2 * 60 * 60 * 1000;
const CHECKPOINT_MS = 10000;
const PLAYER_KEY = /^[a-f0-9]{32}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      return new Response(null, {
        status: 302,
        headers: { Location: new URL(GAME_PATH, url).href, 'X-Robots-Tag': 'noindex' }
      });
    }
    if (!url.pathname.startsWith('/parties/')) return env.ASSETS.fetch(request);

    const path = [PARTIES_PATH, ONLINE_PARTIES_PATH].find(prefix => url.pathname.startsWith(prefix));
    const codePattern = path === PARTIES_PATH ? LEGACY_ROOM_CODE : ROOM_CODE;
    if (!path || !codePattern.test(url.pathname.slice(path.length))) return new Response('Room not found', { status: 404 });
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket required', { status: 426 });
    const origin = request.headers.get('Origin');
    const allowedOrigins = (env.FRONTEND_ORIGINS || '').split(',').map(value => value.trim());
    if (origin !== url.origin && !allowedOrigins.includes(origin)) return new Response('Origin forbidden', { status: 403 });

    return await routePartykitRequest(request, env) ?? new Response('Room not found', { status: 404 });
  }
};

class RoomSeats extends Server {
  static options = { hibernate: true };

  slots = null;

  onCreate() {}

  seatStorage() { return { slots: this.slots }; }

  async join(connection, { key, create, input, difficulty, name }) {
    if (typeof key !== 'string' || !PLAYER_KEY.test(key) || !INPUT_MODES.includes(input)) return;
    let initialAlarm = null;
    if (!this.slots) {
      if (create !== true) return this.reject(connection, 'missing');
      this.slots = [{ key, input, name: cleanPlayerName(name) }, null];
      initialAlarm = this.onCreate(difficulty) ?? Date.now() + ROOM_LIFETIME_MS;
    }

    let seat = this.slots.findIndex(player => player?.key === key);
    if (seat < 0 && create === true) return this.reject(connection, 'code-taken');
    const existing = seat < 0 ? null : this.connectedPlayers()[seat];
    if (seat < 0) {
      seat = this.slots.indexOf(null);
      if (seat < 0) return this.reject(connection, 'full');
      this.slots[seat] = { key, input, name: cleanPlayerName(name) };
    }

    connection.setState({ seat, ready: existing?.state.ready ?? false });
    if (existing) {
      existing.setState(null);
      existing.close(4002, 'Player connected on another tab');
    }

    const player = this.slots[seat];
    const saved = this.ctx.storage.put(this.seatStorage());
    if (initialAlarm !== null) await this.ctx.storage.setAlarm(initialAlarm);
    await saved;
    this.send(connection, { type: 'welcome', seat, input: player.input, name: player.name ?? '' });
    await this.onPlayerJoin(connection);
  }

  connectedPlayers(except) {
    const players = [null, null];
    for (const connection of this.getConnections()) {
      if (connection.state && connection.id !== except) players[connection.state.seat] = connection;
    }
    return players;
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

export class GameRoom extends RoomSeats {
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

  onPlayerJoin() {
    this.resumeIfReady();
    this.publish();
  }
}

const CHECKPOINT_INTERVAL = 10_000;
const IDLE_TIMEOUT_MS = {
  lobby: 5 * 60_000,
  playing: 2 * 60_000,
  finished: 60_000,
  reconnect: 60_000
};

function isOnlineFrame(frame) {
  return frame && typeof frame === 'object' && Number.isFinite(frame.now) &&
    Number.isSafeInteger(frame.score) && frame.score >= 0 && Number.isSafeInteger(frame.lives) &&
    frame.players?.blue && frame.players?.red && frame.player && frame.energy && frame.timers &&
    Array.isArray(frame.enemies) && Array.isArray(frame.bullets) && Array.isArray(frame.effects);
}

export class OnlineRoom extends RoomSeats {
  difficulty = 'normal';
  match = null;
  frame = null;
  expiry = null;
  lastFrameAt = 0;
  lastFrameRequestAt = 0;
  lastSavedAt = 0;
  lastGuestFireAt = 0;

  async onStart() {
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(ROOM_PING, ROOM_PONG));
    const stored = await this.ctx.storage.get(['slots', 'difficulty', 'match', 'frame', 'expiry']);
    this.slots = stored.get('slots') ?? null;
    this.difficulty = stored.get('difficulty') ?? 'normal';
    this.match = stored.get('match') ?? null;
    this.frame = stored.get('frame') ?? null;
    this.expiry = stored.get('expiry') ?? null;
    if (this.slots && !this.expiry) {
      const phase = this.match?.phase ?? 'lobby';
      const disconnected = phase === 'playing' && !this.connectedPlayers().every(Boolean);
      await this.scheduleExpiry(disconnected ? 'reconnect' : phase);
    }
  }

  onCreate(difficulty) {
    if (DIFFICULTIES.includes(difficulty)) this.difficulty = difficulty;
    return this.renewExpiry('lobby');
  }

  seatStorage() {
    return { slots: this.slots, difficulty: this.difficulty, expiry: this.expiry };
  }

  async onPlayerJoin(connection) {
    const phase = this.match?.phase ?? 'lobby';
    const bothConnected = this.connectedPlayers().every(Boolean);
    if (phase === 'playing') {
      if (bothConnected && this.expiry?.phase === 'reconnect') await this.scheduleExpiry('playing');
    } else if (bothConnected || this.expiry?.phase === 'reconnect') {
      await this.scheduleExpiry(phase);
    }
    this.publish();
    if (this.frame && this.match?.phase === 'playing') {
      this.send(connection, { type: 'frame', roundId: this.match.id, data: this.frame });
    }
  }

  async onMessage(connection, raw) {
    if (typeof raw !== 'string' || raw.length > MAX_FRAME_BYTES) return;
    let message;
    try { message = JSON.parse(raw); } catch { return; }
    if (!message || typeof message !== 'object') return;

    if (message.type === 'hello' && !connection.state && raw.length <= 512) {
      await this.join(connection, message);
      return;
    }
    if (!connection.state || !this.slots) return;
    const { seat } = connection.state;
    const players = this.connectedPlayers();

    if (message.type === 'name' && !this.match && !connection.state.ready && raw.length <= 512) {
      if (typeof message.name !== 'string') return;
      const name = cleanPlayerName(message.name);
      if (name === (this.slots[seat].name ?? '')) return;
      this.slots[seat].name = name;
      await this.ctx.storage.put('slots', this.slots);
      this.publish();
      return;
    }

    if (message.type === 'difficulty' && seat === 0 && this.match?.phase !== 'playing') {
      if (!DIFFICULTIES.includes(message.difficulty) || connection.state.ready) return;
      this.difficulty = message.difficulty;
      await this.scheduleExpiry(this.match?.phase ?? 'lobby');
      this.publish();
      return;
    }

    if (message.type === 'ready' && this.match?.phase !== 'playing') {
      if (!INPUT_MODES.includes(message.input) || typeof message.ready !== 'boolean') return;
      this.slots[seat].input = message.input;
      connection.setState({ seat, ready: message.ready });
      if (players.every(player => player?.state.ready)) {
        this.match = {
          id: crypto.randomUUID(), difficulty: this.difficulty, phase: 'playing', score: 0,
          inputs: this.slots.map(player => player.input)
        };
        for (const player of players) player.setState({ seat: player.state.seat, ready: false });
        this.frame = null;
        this.lastFrameAt = 0;
        this.lastFrameRequestAt = 0;
        this.lastGuestFireAt = 0;
      }
      await this.scheduleExpiry(this.match?.phase ?? 'lobby');
      this.publish();
      return;
    }

    if (message.type === 'leave') {
      this.slots[seat] = null;
      connection.setState(null);
      connection.close(1000, 'Left room');
      if (!this.slots.some(Boolean)) {
        await this.closeRoom('idle');
        return;
      }
      this.finish();
      await this.scheduleExpiry(this.match?.phase ?? 'lobby');
      this.publish();
      return;
    }

    if (this.match?.phase !== 'playing' || message.roundId !== this.match.id) return;

    if (message.type === 'finish' && seat === 0) {
      this.finish();
      await this.scheduleExpiry('finished');
      this.publish();
      return;
    }

    if (!players.every(Boolean)) return;

    if (message.type === 'frame-request' && seat === 1) {
      const now = Date.now();
      if (now - this.lastFrameAt < FRAME_INTERVAL || now - this.lastFrameRequestAt < FRAME_INTERVAL) return;
      this.lastFrameRequestAt = now;
      this.send(players[0], { type: 'frame-request', roundId: this.match.id });
    }

    if (message.type === 'frame' && seat === 0 && isOnlineFrame(message.data)) {
      const now = Date.now();
      if (now - this.lastFrameAt < 45) return;
      this.lastFrameAt = now;
      this.frame = message.data;
      this.send(players[1], raw);
      await this.saveProgress(now, message.activity === true);
    }

    if (message.type === 'fire' && seat === 1) {
      const gaze = this.match.inputs[seat] === 'gaze';
      if (gaze && (!Number.isSafeInteger(message.targetId) || message.targetId < 1)) return;
      const now = Date.now();
      if (now - this.lastGuestFireAt < (gaze ? 750 : 75)) return;
      this.lastGuestFireAt = now;
      this.send(players[0], { type: 'fire', roundId: this.match.id, seat, targetId: message.targetId });
      await this.saveProgress(now, true);
    }
  }

  async saveProgress(now, activity) {
    // Coalesce renewals so the deadline survives hibernation without a write for every input.
    const activityAt = Math.ceil(now / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL;
    const extended = activity && this.expiry.at < activityAt + IDLE_TIMEOUT_MS.playing;
    if (extended) this.renewExpiry('playing', activityAt);
    if (now - this.lastSavedAt >= CHECKPOINT_INTERVAL) {
      await this.checkpoint();
    } else if (extended) {
      await this.ctx.storage.put('expiry', this.expiry);
    }
  }

  finish(reason) {
    if (this.match?.phase !== 'playing') return;
    this.match.phase = 'finished';
    this.match.score = this.frame?.score ?? 0;
    if (reason) this.match.reason = reason;
    this.frame = null;
  }

  async onClose(connection) {
    if (!connection.state || !this.slots) return;
    const remaining = this.connectedPlayers(connection.id);
    if (this.expiry?.phase !== 'reconnect') {
      if (this.match?.phase === 'playing' || (!remaining.some(Boolean) &&
          this.expiry?.at > Date.now() + IDLE_TIMEOUT_MS.reconnect)) {
        await this.scheduleExpiry('reconnect');
      }
    }
    this.publish(connection.id);
  }

  async onAlarm() {
    if (!this.expiry) return;
    if (this.expiry.at > Date.now()) {
      await this.ctx.storage.setAlarm(this.expiry.at);
      return;
    }
    if (this.expiry.phase === 'playing') {
      this.finish('idle');
      await this.scheduleExpiry('finished');
      this.publish();
      return;
    }
    await this.closeRoom(this.expiry.phase === 'reconnect' ? 'reconnect-expired' : 'idle');
  }

  renewExpiry(phase, now = Date.now()) {
    this.expiry = { phase, at: now + IDLE_TIMEOUT_MS[phase] };
    return this.expiry.at;
  }

  async scheduleExpiry(phase) {
    const at = this.renewExpiry(phase);
    await Promise.all([this.ctx.storage.setAlarm(at), this.checkpoint()]);
  }

  async closeRoom(reason) {
    this.slots = null;
    this.match = null;
    this.frame = null;
    this.expiry = null;
    this.difficulty = 'normal';
    for (const connection of this.getConnections()) {
      if (connection.state) this.reject(connection, reason);
    }
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  checkpoint() {
    this.lastSavedAt = Date.now();
    return this.ctx.storage.put({ ...this.seatStorage(), match: this.match, frame: this.frame });
  }

  publish(except) {
    if (!this.slots) return;
    const players = this.connectedPlayers(except);
    const phase = this.match?.phase === 'playing' && !players.every(Boolean) ? 'paused' : this.match?.phase ?? 'lobby';
    const message = JSON.stringify({
      type: 'state', phase, difficulty: this.difficulty, round: this.match, hasFrame: Boolean(this.frame),
      players: this.slots.map((player, i) => ({
        connected: Boolean(players[i]), ready: players[i]?.state.ready ?? false, input: player?.input ?? null,
        name: player?.name ?? ''
      }))
    });
    for (const player of players) if (player) this.send(player, message);
  }
}
