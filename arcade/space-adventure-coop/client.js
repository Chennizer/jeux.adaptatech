import { copy } from './copy.js';
import { createField } from './field.js';
import { DWELL_MS, GAME_PATH, INPUT_MODES, PARTIES_PATH, ROOM_ALPHABET, ROOM_CODE } from './protocol.js';

const get = id => document.getElementById(id);
const field = createField(get('field'), fire);
const defaultWorker = 'space-adventure-coop.gui98789.workers.dev';
const siteDomains = ['www.adaptatech.org', 'adaptatech.org'];
const playerCards = [get('player-1'), get('player-2')];
const inputButtons = [...document.querySelectorAll('[data-input]')];
const inviteValue = get('invite-value');
const initialCode = (new URLSearchParams(location.search).get('room') || '').toUpperCase();
const settings = readStorage(localStorage, 'siteLanguage');
let language = Object.hasOwn(copy, settings) ? settings : 'fr';
let input = readStorage(localStorage, 'spaceAdventureCoopInput') === 'gaze' ? 'gaze' : 'switch';
let sound = false;
let socket = null;
let session = null;
let seat = null;
let state = null;
let authenticated = false;
let status = '';
let reconnectTimer = null;
let connectionAttempts = 0;
let lastSnapshot = 0;
let lastEffect = 0;
let previousRound = null;

const music = new Audio('/songs/space/spacearcade1.mp3');
music.loop = true;
music.volume = .35;
music.preload = 'none';
const effects = {
  fire: '/sounds/spaceadventure/missile.mp3',
  destroy: '/sounds/spaceadventure/shipdestroyed.mp3',
  breach: '/sounds/spaceadventure/shield.mp3'
};

function readStorage(storage, name) {
  try { return storage.getItem(name); } catch { return null; }
}

function writeStorage(storage, name, value) {
  try {
    if (value === null) storage.removeItem(name);
    else storage.setItem(name, value);
  } catch { /* the room still works with temporary browser storage */ }
}

function text(key) { return copy[language][key] ?? ''; }

function setText(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function updateLanguage() {
  document.documentElement.lang = language;
  get('language').value = language;
  for (const element of document.querySelectorAll('[data-copy]')) setText(element, text(element.dataset.copy));
  get('field').setAttribute('aria-label', text('field'));
  inviteValue.setAttribute('aria-label', text(inviteValue.dataset.copyLabel));
  render();
}

function render() {
  const joined = seat !== null;
  const phase = state?.phase;
  const inGame = joined && ['playing', 'paused'].includes(phase);
  const paused = inGame && (!authenticated || phase === 'paused');
  const wasInGame = !get('mission').hidden;
  const me = joined && state?.players[seat];
  get('lobby').hidden = inGame;
  get('mission').hidden = !inGame;
  get('entry').hidden = joined;
  get('room').hidden = !joined;
  get('create').disabled = Boolean(session) && !joined;
  get('join').querySelector('button').disabled = Boolean(session) && !joined;
  get('controls').disabled = Boolean(session && (!authenticated || me?.ready));
  for (const button of inputButtons) button.setAttribute('aria-pressed', String(button.dataset.input === input));

  setText(get('status'), text(status || (joined && (state?.players.every(player => player.connected) ? 'bothReady' : 'waiting'))));
  setText(get('sound'), text(sound ? 'soundOn' : 'soundOff'));
  get('sound').setAttribute('aria-pressed', String(sound));

  if (joined) {
    get('room-code').textContent = session.code;
    get('ready').disabled = !authenticated || !state;
    setText(get('ready'), text(me?.ready ? 'unready' : 'ready'));
    playerCards.forEach((card, i) => {
      const player = state?.players[i];
      card.classList.toggle('is-you', i === seat);
      setText(card.querySelector('strong'), `${text(i === 0 ? 'p1' : 'p2')}${i === seat ? ` (${text('you')})` : ''}`);
      const label = player?.connected ? `${text(player.input)} · ${text(player.ready ? 'readyState' : 'online')}` : text('absent');
      setText(card.querySelector('.player-status'), label);
    });
  }

  const finished = joined && phase === 'finished';
  get('result').hidden = !finished;
  if (finished) setText(get('result'), text('result').replace('{score}', state.round.score));

  if (inGame) {
    const { score, remaining } = state.round;
    const seconds = Math.ceil(remaining / 1000);
    setText(get('timer'), `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
    setText(get('score'), String(score));
    setText(get('ship'), text(seat === 0 ? 'blue' : 'red'));
    setText(get('mission-hint'), text(input === 'switch' ? 'fireHint' : 'gazePlayHint'));
    get('fire').hidden = input !== 'switch';
    get('fire').disabled = paused;
    get('pause').hidden = !paused;
    if (paused) setText(get('pause'), text(authenticated ? 'paused' : 'reconnecting'));
    if (!wasInGame) get('field').focus({ preventScroll: true });
  } else if (wasInGame) {
    field.hide();
    if (joined) get('ready').focus();
  }
  if (!inGame || paused) music.pause();
}

function keyForRoom(code) {
  const name = `spaceAdventureCoop.${code}`;
  let key = readStorage(sessionStorage, name);
  if (!key) {
    key = Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
    writeStorage(sessionStorage, name, key);
  }
  return key;
}

function inviteLink(code) {
  const url = new URL(GAME_PATH, location.origin);
  url.searchParams.set('room', code);
  return url;
}

function connect(code, create = false) {
  if (session || !ROOM_CODE.test(code)) return;
  session = { code, create, key: keyForRoom(code) };
  status = 'connecting';
  connectionAttempts = 0;
  openSocket();
}

function openSocket() {
  if (!session) return;
  const { code, key, create } = session;
  const url = new URL(`${PARTIES_PATH}${code}`, location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  if (siteDomains.includes(location.hostname) || location.hostname.endsWith('.netlify.app')) url.host = defaultWorker;
  const next = new WebSocket(url);
  socket = next;
  render();

  const timeout = setTimeout(() => {
    if (socket === next && !authenticated) reconnect(next);
  }, 5000);
  next.addEventListener('open', () => {
    if (socket === next) send({ type: 'hello', key, create, input });
  });
  next.addEventListener('message', event => {
    if (socket !== next) return;
    let message;
    try { message = JSON.parse(event.data); } catch { return; }

    if (message.type === 'error') {
      const reason = { missing: 'missing', full: 'full', 'code-taken': 'taken' }[message.reason] ?? 'unavailable';
      reset(reason, true);
    } else if (message.type === 'welcome') {
      clearTimeout(timeout);
      authenticated = true;
      connectionAttempts = 0;
      status = '';
      const joining = seat === null;
      seat = message.seat;
      session.create = false;
      input = message.input;
      history.replaceState(null, '', inviteLink(code));
      render();
      if (joining && state) get('ready').focus();
    } else if (message.type === 'state' && authenticated) {
      const firstState = !state;
      receiveState(message);
      if (firstState && ['lobby', 'finished'].includes(state.phase)) get('ready').focus();
    }
  });

  next.addEventListener('close', event => {
    clearTimeout(timeout);
    reconnect(next, event.code);
  });
}

function reconnect(next, code) {
  if (socket !== next) return;
  if (code === 4002) return reset('replaced', false);
  if (connectionAttempts >= 5) return reset('unavailable', false);
  socket = null;
  next.close();
  authenticated = false;
  field.disable();
  status = seat === null ? 'connecting' : 'reconnecting';
  reconnectTimer = setTimeout(openSocket, Math.min(5000, 500 * (2 ** connectionAttempts++)));
  render();
}

function receiveState(message) {
  const active = message.phase === 'playing';
  const wasActive = state?.phase === 'playing' && status !== 'reconnecting';
  state = message;
  if (!active && message.players[seat]?.ready) input = message.players[seat].input;
  if (status === 'connecting' || status === 'reconnecting') status = '';
  lastSnapshot = Date.now();
  render();
  if (message.phase !== 'playing' && message.phase !== 'paused') return;

  const round = message.round;
  if (previousRound !== round.id) {
    previousRound = round.id;
    lastEffect = 0;
    music.currentTime = 0;
  }
  const freshEffects = round.effects.filter(effect => effect.id > lastEffect);
  for (const effect of freshEffects) {
    lastEffect = effect.id;
    if (sound && active) {
      const audio = new Audio(effects[effect.kind]);
      audio.volume = .45;
      audio.play().catch(() => {});
    }
  }
  field.update(round, seat, input, active, freshEffects);
  if (active && sound && (!wasActive || music.paused)) music.play().catch(() => {});
}

function send(message) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify(message));
  return true;
}

function fire(targetId) {
  if (!authenticated || state?.phase !== 'playing' || typeof targetId === 'number' && input !== 'gaze') return false;
  return send({ type: 'fire', targetId });
}

function reset(reason = '', forget = false) {
  clearTimeout(reconnectTimer);
  if (forget && session) writeStorage(sessionStorage, `spaceAdventureCoop.${session.code}`, null);
  const previous = socket;
  socket = null;
  session = null;
  seat = null;
  state = null;
  previousRound = null;
  authenticated = false;
  status = reason;
  previous?.close();
  inviteValue.hidden = true;
  field.hide();
  render();
}

function leave() {
  send({ type: 'leave' });
  history.replaceState(null, '', GAME_PATH);
  get('code').value = '';
  reset('', true);
  get('create').focus();
}

get('language').addEventListener('change', event => {
  language = event.target.value;
  writeStorage(localStorage, 'siteLanguage', language);
  updateLanguage();
});

for (const button of inputButtons) button.addEventListener('click', () => {
  if (!INPUT_MODES.includes(button.dataset.input)) return;
  input = button.dataset.input;
  writeStorage(localStorage, 'spaceAdventureCoopInput', input);
  if (authenticated && state?.phase !== 'playing' && state?.phase !== 'paused') send({ type: 'ready', input, ready: false });
  render();
});

get('create').addEventListener('click', () => {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(8)), byte => ROOM_ALPHABET[byte & 31]).join('');
  connect(code, true);
});
get('join').addEventListener('submit', event => {
  event.preventDefault();
  const code = get('code').value.trim().toUpperCase();
  if (ROOM_CODE.test(code)) connect(code);
  else { status = 'invalid'; render(); }
});

get('ready').addEventListener('click', () => {
  status = '';
  if (state) send({ type: 'ready', input, ready: !state.players[seat].ready });
});
async function copyInvite(event) {
  const room = session;
  if (!room) return;
  const isCode = event.currentTarget.id === 'copy-code';
  const value = isCode ? room.code : inviteLink(room.code).href;
  const copied = await navigator.clipboard?.writeText(value).then(() => true, () => false);
  if (room !== session) return;
  inviteValue.hidden = Boolean(copied);
  if (copied) {
    status = isCode ? 'codeCopied' : 'copied';
  } else {
    inviteValue.value = value;
    inviteValue.dataset.copyLabel = isCode ? 'code' : 'link';
    inviteValue.setAttribute('aria-label', text(inviteValue.dataset.copyLabel));
    inviteValue.select();
    status = isCode ? 'copyCodeManual' : 'copyManual';
  }
  render();
}

get('copy-code').addEventListener('click', copyInvite);
get('copy').addEventListener('click', copyInvite);
get('leave').addEventListener('click', leave);
get('exit').addEventListener('click', leave);
get('fire').addEventListener('click', () => fire());
get('sound').addEventListener('click', () => {
  sound = !sound;
  if (sound && authenticated && state?.phase === 'playing') music.play().catch(() => {});
  else music.pause();
  render();
});

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || input !== 'switch' || state?.phase !== 'playing' ||
      (event.code !== 'Space' && event.key !== 'Enter') || event.target.closest('button, input, select, a')) return;
  event.preventDefault();
  if (!event.repeat) fire();
});

let menuDwell = null;
function clearMenuDwell() {
  if (!menuDwell) return;
  cancelAnimationFrame(menuDwell.frame);
  menuDwell.button.removeAttribute('data-dwelling');
  menuDwell = null;
}

document.addEventListener('pointerover', event => {
  const button = event.target.closest('[data-dwell]');
  if (button === menuDwell?.button) return;
  clearMenuDwell();
  if (!button || button.disabled || (input !== 'gaze' && button.dataset.input !== 'gaze') || event.pointerType === 'touch') return;
  const dwell = { button, frame: 0, start: performance.now() };
  menuDwell = dwell;
  button.setAttribute('data-dwelling', '');
  const progress = now => {
    if (menuDwell !== dwell || !button.matches(':hover') || button.disabled || !button.checkVisibility()) return clearMenuDwell();
    const portion = Math.min(1, (now - dwell.start) / DWELL_MS);
    button.style.setProperty('--dwell', `${portion * 100}%`);
    if (portion < 1) dwell.frame = requestAnimationFrame(progress);
    else button.click();
  };
  dwell.frame = requestAnimationFrame(progress);
});
document.addEventListener('pointerout', event => {
  if (menuDwell && !menuDwell.button.contains(event.relatedTarget)) clearMenuDwell();
});
window.addEventListener('blur', clearMenuDwell);

setInterval(() => {
  if (socket && authenticated && state?.phase === 'playing' && Date.now() - lastSnapshot > 4000) reconnect(socket);
}, 1000);

updateLanguage();
if (ROOM_CODE.test(initialCode)) {
  get('code').value = initialCode;
  if (readStorage(sessionStorage, `spaceAdventureCoop.${initialCode}`)) connect(initialCode);
}
