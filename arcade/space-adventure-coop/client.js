import { copy } from './copy.js';
import {
  DIFFICULTIES, DWELL_MS, FRAME_INTERVAL, GAME_PATH, INPUT_MODES, ONLINE_PARTIES_PATH,
  ONLINE_WORLD, ROOM_ALPHABET, ROOM_CODE, ROOM_PING, cleanPlayerName
} from './protocol.js';

const get = id => document.getElementById(id);
const defaultWorker = 'space-adventure-coop.gui98789.workers.dev';
const siteDomains = ['www.adaptatech.org', 'adaptatech.org'];
const accessButtons = [...document.querySelectorAll('[data-access]')];
const difficultyButtons = [...document.querySelectorAll('#stop-action-mode-segmented-control [data-mode]')];
const playerRows = [...get('room-players').children];
const pilotNames = [...document.querySelectorAll('.ship-card .pilot-name')];
const gamePilotNames = [...get('game-pilot-names').children];
const nameInput = get('player-name');
const fullscreenButton = get('fullscreen-room');
const PING_AFTER_MS = 8000;
const PING_TIMEOUT_MS = 8000;

let input = localStorage.getItem('spaceAdventureCoopInput') === 'gaze' ? 'gaze' : 'switch';
let difficulty = 'normal';
let game;
let session;
let socket;
let seat = null;
let state;
let status = '';
let reconnectTimer;
let attempts = 0;
let activeRound;
let incomingFrame;
let hostActed = false;
let lastPublishedAt = 0;
let lastReceivedAt = 0;
let lastRequestedAt = 0;
let lastMessageAt = 0;
let pingSentAt = 0;
let readyPending = false;

nameInput.value = cleanPlayerName(localStorage.getItem('spaceAdventureCoopName'));

function text(key) {
  return (copy[document.documentElement.lang] ?? copy.fr)[key] ?? '';
}

const online = {
  ...ONLINE_WORLD,
  frameInterval: FRAME_INTERVAL,
  get input() { return input; },
  get isHost() { return seat === 0; },
  get inputs() { return state?.round?.inputs ?? [input, input]; },
  get gazeField() { return this.inputs.every(mode => mode === 'gaze'); },
  playerName(index) { return state?.players[index]?.name ?? ''; },
  positionPlayerNames(blueX, redX) {
    if (!gamePilotNames[0].hidden) gamePilotNames[0].style.left = `${100 * blueX / this.width}%`;
    if (!gamePilotNames[1].hidden) gamePilotNames[1].style.left = `${100 * redX / this.width}%`;
  },
  attach(engine) { game = engine; },
  chooseDifficulty,
  render,
  ready,
  requestFrame() {
    if (seat !== 1 || document.hidden || state?.phase !== 'playing' || !session?.connected) return;
    const now = performance.now();
    if (now - lastReceivedAt < FRAME_INTERVAL * 2 || now - lastRequestedAt < FRAME_INTERVAL) return;
    lastRequestedAt = now;
    send({ type: 'frame-request', roundId: activeRound });
  },
  fire(targetId) {
    if (state?.phase !== 'playing' || !session?.connected) return;
    if (this.isHost) {
      game.fire(seat, targetId);
      hostActed = true;
    } else {
      send({ type: 'fire', roundId: activeRound, targetId });
    }
  },
  publish(makeFrame) {
    if (!this.isHost || state?.phase !== 'playing' || !session?.connected || socket?.bufferedAmount > 96_000) return;
    const now = performance.now();
    if (now - lastPublishedAt < FRAME_INTERVAL) return;
    lastPublishedAt = now;
    if (send({ type: 'frame', roundId: activeRound, activity: hostActed, data: makeFrame() })) {
      hostActed = false;
    }
  },
  finish() {
    if (activeRound) send({ type: 'finish', roundId: activeRound });
  }
};
window.spaceAdventureOnline = online;

function invite(code) {
  const url = new URL(GAME_PATH, location.origin);
  if (code) url.searchParams.set('room', code);
  return url;
}

function connect(code, create = false) {
  if (session || !ROOM_CODE.test(code)) return;
  saveName();
  const storageKey = `spaceAdventureCoop.online.${code}`;
  const key = sessionStorage.getItem(storageKey) ??
    Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem(storageKey, key);
  session = { code, key, storageKey, create };
  status = 'connecting';
  attempts = 0;
  openSocket();
}

function openSocket() {
  const current = session;
  if (!current) return;
  const url = new URL(`${ONLINE_PARTIES_PATH}${current.code}`, location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  if (siteDomains.includes(location.hostname) || location.hostname.endsWith('.netlify.app')) url.host = defaultWorker;
  const next = new WebSocket(url);
  socket = next;
  const timeout = setTimeout(() => { if (!current.connected) next.close(); }, 5000);
  next.addEventListener('open', () => send({
    type: 'hello', key: current.key, create: current.create, input, difficulty, name: nameInput.value
  }));
  next.addEventListener('message', ({ data }) => {
    if (socket !== next) return;
    lastMessageAt = performance.now();
    pingSentAt = 0;
    const message = JSON.parse(data);
    if (message.type === 'error') {
      if (message.reason === 'idle' || message.reason === 'reconnect-expired') {
        history.replaceState(null, '', invite());
        get('room-input').value = '';
      }
      reset(message.reason, true);
    } else if (message.type === 'welcome') {
      clearTimeout(timeout);
      current.connected = true;
      current.create = false;
      attempts = 0;
      const changedSeat = seat !== message.seat;
      seat = message.seat;
      input = message.input;
      if (changedSeat && typeof message.name === 'string') nameInput.value = message.name;
      status = '';
      history.replaceState(null, '', invite(current.code));
      if (changedSeat) game.assignShip(seat === 0 ? 'blue' : 'red');
      render();
    } else if (message.type === 'state') {
      if (message.phase === 'playing' && state?.phase !== 'playing') lastReceivedAt = performance.now();
      state = message;
      readyPending = false;
      if (status === 'reconnecting') status = '';
      render();
    } else if (message.type === 'frame' && state?.round?.id === message.roundId) {
      lastReceivedAt = performance.now();
      incomingFrame = message.data;
      if (activeRound === message.roundId && !online.isHost) game.receive(incomingFrame);
      else render();
    } else if (message.type === 'fire' && online.isHost && message.roundId === activeRound) {
      game.fire(message.seat, message.targetId);
    } else if (message.type === 'frame-request' && online.isHost && message.roundId === activeRound) {
      game.advanceBackgroundFrame();
    }
  });
  next.addEventListener('close', event => {
    clearTimeout(timeout);
    if (socket !== next) return;
    current.connected = false;
    socket = null;
    game?.pause(true);
    if (event.code === 4002) return reset('replaced');
    if (attempts >= 5) return reset('unavailable');
    status = seat === null ? 'connecting' : 'reconnecting';
    reconnectTimer = setTimeout(openSocket, Math.min(5000, 500 * 2 ** attempts++));
    render();
  });
  render();
}

function send(message) {
  if (socket?.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify(message));
  return true;
}

function reset(reason = '', forget = false) {
  clearTimeout(reconnectTimer);
  if (forget && session) sessionStorage.removeItem(session.storageKey);
  const previous = socket;
  socket = null;
  session = null;
  seat = null;
  state = null;
  activeRound = null;
  incomingFrame = null;
  hostActed = false;
  readyPending = false;
  status = reason;
  previous?.close();
  if (document.fullscreenElement === document.documentElement) document.exitFullscreen().catch(() => {});
  get('room-share-value').hidden = true;
  game?.lobby();
  render();
}

function leave() {
  send({ type: 'leave' });
  history.replaceState(null, '', invite());
  get('room-input').value = '';
  reset('', true);
  get('create-room').focus();
}

function chooseDifficulty(mode) {
  if (!DIFFICULTIES.includes(mode) || seat === 1) return;
  difficulty = mode;
  if (session?.connected && state?.phase === 'lobby') send({ type: 'difficulty', difficulty });
}

function ready() {
  const me = state?.players[seat];
  if (!session?.connected || !me || readyPending || !game?.loaded || !state.players.every(player => player.connected)) return;
  if (state.phase === 'finished' && me.ready) return;
  if (!['lobby', 'finished'].includes(state.phase)) return;
  if (!me.ready) enterFullscreen();
  readyPending = send({ type: 'ready', input, ready: !me.ready });
  status = '';
  render();
}

function enterFullscreen() {
  if (!document.fullscreenEnabled || document.fullscreenElement || navigator.userActivation?.isActive === false) return;
  document.documentElement.requestFullscreen().catch(() => {});
}

function renderFullscreenButton() {
  const phase = state?.phase;
  fullscreenButton.hidden = !document.fullscreenEnabled || Boolean(document.fullscreenElement) ||
    (phase !== 'playing' && phase !== 'paused');
}

function render() {
  const joined = seat !== null;
  const me = state?.players[seat];
  const phase = state?.phase ?? 'lobby';
  const inGame = phase === 'playing' || phase === 'paused';
  const paused = inGame && (phase === 'paused' || !session?.connected);
  const finished = phase === 'finished';
  const canReady = Boolean(game?.loaded && session?.connected && !readyPending && state?.players.every(player => player.connected));
  get('room-entry').hidden = joined;
  get('room-info').hidden = !joined;
  get('create-room').disabled = Boolean(session);
  get('join-room-button').disabled = Boolean(session);
  nameInput.disabled = Boolean(session && (!session.connected || me?.ready || phase !== 'lobby'));
  get('room-code').textContent = session?.code ?? '';
  get('room-status').textContent = text(status || (joined && state?.players.some(player => !player.connected) ? 'waiting' : ''));
  get('exit-room').hidden = !inGame && !finished;
  renderFullscreenButton();
  get('online-pause').hidden = !paused;
  if (paused) get('online-pause').textContent = text(session?.connected ? 'paused' : 'reconnecting');

  for (const button of accessButtons) {
    const selected = button.dataset.access === input;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.disabled = Boolean(session && (!session.connected || me?.ready || inGame));
  }
  for (const button of difficultyButtons) button.disabled = seat === 1 || inGame || Boolean(me?.ready);
  if (game && state?.difficulty) {
    difficulty = state.difficulty;
    game.setDifficulty(difficulty);
  }

  const readyButton = get('control-panel-start-button');
  readyButton.disabled = !canReady || inGame;
  readyButton.textContent = text(!game?.loaded ? 'loading' : me?.ready ? 'cancel' : 'ready');
  get('continue-button').disabled = !canReady || Boolean(me?.ready);
  get('continue-button').textContent = text(me?.ready ? 'retryWaiting' : 'retry');
  if (finished) {
    const hint = state.round?.reason === 'idle' ? 'idleRound' : (input === 'gaze' ? 'retry' : '');
    get('retry-hint').textContent = text(me?.ready ? 'retryWaiting' : hint);
  }

  pilotNames.forEach((badge, i) => {
    const nickname = online.playerName(i);
    for (const nameTag of [badge, gamePilotNames[i]]) {
      nameTag.hidden = !nickname;
      if (nameTag.textContent !== nickname) nameTag.textContent = nickname;
    }
    const player = state?.players[i];
    if (!player) return;
    const ship = text(i === 0 ? 'blue' : 'red');
    const name = nickname ? `${nickname} · ${ship}` : ship;
    const detail = player.connected ? `${text(player.input)} · ${text(player.ready ? 'ready' : 'connected')}` : text('absent');
    const label = `${name}${i === seat ? ` (${text('you')})` : ''} · ${detail}`;
    if (playerRows[i].textContent !== label) playerRows[i].textContent = label;
  });

  if (!game?.loaded || !state?.round) return;
  if (inGame && activeRound !== state.round.id) {
    if (state.hasFrame && !incomingFrame) return;
    activeRound = state.round.id;
    lastPublishedAt = 0;
    hostActed = false;
    game.start();
    if (incomingFrame) game.receive(incomingFrame, online.isHost);
    incomingFrame = null;
  }
  if (inGame) game.pause(paused);
  if (finished) {
    activeRound = null;
    incomingFrame = null;
    game.result(state.round.score);
  }
}

async function copyRoom(kind) {
  const current = session;
  if (!current) return;
  const value = kind === 'code' ? current.code : invite(current.code).href;
  const copied = await navigator.clipboard?.writeText(value).then(() => true, () => false);
  if (session !== current) return;
  const fallback = get('room-share-value');
  fallback.hidden = Boolean(copied);
  if (!copied) {
    fallback.value = value;
    fallback.setAttribute('aria-label', text(kind));
    fallback.select();
  }
  status = copied ? 'copied' : 'manual';
  render();
}

for (const button of accessButtons) button.addEventListener('click', () => {
  if (!INPUT_MODES.includes(button.dataset.access)) return;
  input = button.dataset.access;
  localStorage.setItem('spaceAdventureCoopInput', input);
  if (session?.connected) send({ type: 'ready', input, ready: false });
  render();
});
function saveName() {
  const name = cleanPlayerName(nameInput.value);
  nameInput.value = name;
  localStorage.setItem('spaceAdventureCoopName', name);
  if (session?.connected && state?.phase === 'lobby' && name !== online.playerName(seat)) send({ type: 'name', name });
}
nameInput.addEventListener('change', saveName);
get('create-room').addEventListener('click', () => {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(8)), byte => ROOM_ALPHABET[byte & 31]).join('');
  connect(code, true);
});
get('join-room').addEventListener('submit', event => {
  event.preventDefault();
  const code = get('room-input').value.trim().toUpperCase();
  if (ROOM_CODE.test(code)) connect(code);
  else { status = 'invalid'; render(); }
});
get('copy-room-code').addEventListener('click', () => copyRoom('code'));
get('copy-room-link').addEventListener('click', () => copyRoom('link'));
get('leave-room').addEventListener('click', leave);
get('exit-room').addEventListener('click', leave);
fullscreenButton.addEventListener('click', enterFullscreen);
document.addEventListener('fullscreenchange', renderFullscreenButton);

let dwell;
function clearDwell() {
  if (!dwell) return;
  cancelAnimationFrame(dwell.frame);
  dwell.button.removeAttribute('data-dwelling');
  dwell = null;
}
document.addEventListener('pointerover', event => {
  const button = event.target.closest('.online-room button, [data-access], #stop-action-mode-segmented-control button, .online-play-controls button');
  if (button === dwell?.button) return;
  clearDwell();
  if (!button || button.disabled || (input !== 'gaze' && button.dataset.access !== 'gaze') || event.pointerType === 'touch') return;
  const start = performance.now();
  dwell = { button, frame: 0 };
  button.setAttribute('data-dwelling', '');
  const step = now => {
    if (!button.matches(':hover') || !button.checkVisibility() || button.disabled) return clearDwell();
    const amount = Math.min(1, (now - start) / DWELL_MS);
    button.style.setProperty('--dwell', `${amount * 100}%`);
    if (amount < 1) dwell.frame = requestAnimationFrame(step);
    else button.click();
  };
  dwell.frame = requestAnimationFrame(step);
});
document.addEventListener('pointerout', event => {
  if (dwell && !dwell.button.contains(event.relatedTarget)) clearDwell();
});
window.addEventListener('blur', clearDwell);
window.addEventListener('offline', () => socket?.close());
window.addEventListener('online', () => {
  if (!session || socket) return;
  clearTimeout(reconnectTimer);
  openSocket();
});
document.addEventListener('visibilitychange', () => {
  lastMessageAt = performance.now();
  pingSentAt = 0;
});
setInterval(() => {
  if (document.hidden || !session?.connected || socket?.readyState !== WebSocket.OPEN) return;
  const now = performance.now();
  if (pingSentAt) {
    if (now - pingSentAt >= PING_TIMEOUT_MS) socket.close();
  } else if (now - lastMessageAt >= PING_AFTER_MS) {
    pingSentAt = now;
    socket.send(ROOM_PING);
  }
}, 1000);

await import('../space-invaders-fruits/game.js');
render();
const initialCode = new URLSearchParams(location.search).get('room')?.toUpperCase() ?? '';
if (ROOM_CODE.test(initialCode)) {
  get('room-input').value = initialCode;
  if (sessionStorage.getItem(`spaceAdventureCoop.online.${initialCode}`)) connect(initialCode);
}
