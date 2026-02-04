const elements = {
  ablyKey: document.getElementById('ablyKey'),
  roomName: document.getElementById('roomName'),
  connectBtn: document.getElementById('connectBtn'),
  hostBtn: document.getElementById('hostBtn'),
  spawnBtn: document.getElementById('spawnBtn'),
  connectionStatus: document.getElementById('connectionStatus'),
  scoreList: document.getElementById('scoreList'),
  arena: document.getElementById('arena'),
  target: document.getElementById('target'),
  targetId: document.getElementById('targetId'),
  remoteCursor: document.getElementById('remoteCursor'),
  localCursor: document.getElementById('localCursor'),
  dwellState: document.getElementById('dwellState'),
};

const DWELL_MS = 700;
const SEND_INTERVAL_MS = 40;
const TARGET_RADIUS = 45;

let realtime = null;
let channel = null;
let clientId = null;
let isHost = false;
let target = { id: null, x: 0.5, y: 0.5 };
let scoredTargetId = null;
let presenceMap = new Map();
let scores = new Map();
let localPosition = { x: 0.5, y: 0.5 };
let remotePosition = { x: 0.5, y: 0.5 };
let lastInsideAt = null;
let lastSendAt = 0;

const savedKey = localStorage.getItem('hotspotCaptureKey');
if (savedKey) {
  elements.ablyKey.value = savedKey;
}

const savedHost = localStorage.getItem('hotspotCaptureHost');
isHost = savedHost === 'true';
updateHostButton();

function updateStatus(message, isError = false) {
  elements.connectionStatus.textContent = message;
  elements.connectionStatus.style.color = isError ? '#c22a2a' : '#1f2a44';
}

function updateHostButton() {
  elements.hostBtn.textContent = isHost ? 'Hosting target sync' : 'Become host';
}

function setTarget(newTarget) {
  target = newTarget;
  scoredTargetId = null;
  lastInsideAt = null;
  elements.targetId.textContent = target.id ? target.id.toString() : '—';
  updateTargetPosition();
}

function updateTargetPosition() {
  const rect = elements.arena.getBoundingClientRect();
  elements.target.style.left = `${target.x * rect.width}px`;
  elements.target.style.top = `${target.y * rect.height}px`;
}

function updateCursorPosition(cursorEl, position) {
  const rect = elements.arena.getBoundingClientRect();
  cursorEl.style.left = `${position.x * rect.width}px`;
  cursorEl.style.top = `${position.y * rect.height}px`;
}

function updateScoreList() {
  const entries = Array.from(scores.entries()).map(([id, score]) => ({
    id,
    name: presenceMap.get(id) || id,
    score,
  }));

  entries.sort((a, b) => b.score - a.score);
  elements.scoreList.innerHTML = '';

  entries.forEach(({ id, name, score }) => {
    const li = document.createElement('li');
    li.textContent = name;
    const span = document.createElement('span');
    span.textContent = score;
    li.appendChild(span);
    if (id === clientId) {
      li.style.fontWeight = '700';
    }
    elements.scoreList.appendChild(li);
  });
}

function spawnTarget() {
  if (!channel) {
    return;
  }
  const newTarget = {
    id: Date.now(),
    x: Math.random() * 0.8 + 0.1,
    y: Math.random() * 0.8 + 0.1,
  };
  channel.publish('target', newTarget);
}

function handleCapture() {
  if (!channel || scoredTargetId || !target.id) {
    return;
  }
  scoredTargetId = target.id;
  channel.publish('score', { playerId: clientId, targetId: target.id });
  spawnTarget();
}

function trackDwell() {
  if (!target.id) {
    elements.dwellState.textContent = '0 ms';
    return;
  }
  const rect = elements.arena.getBoundingClientRect();
  const localX = localPosition.x * rect.width;
  const localY = localPosition.y * rect.height;
  const targetX = target.x * rect.width;
  const targetY = target.y * rect.height;
  const distance = Math.hypot(localX - targetX, localY - targetY);

  if (distance <= TARGET_RADIUS) {
    if (!lastInsideAt) {
      lastInsideAt = performance.now();
    }
    const dwellTime = performance.now() - lastInsideAt;
    elements.dwellState.textContent = `${Math.round(dwellTime)} ms`;
    if (dwellTime >= DWELL_MS && !scoredTargetId) {
      handleCapture();
    }
  } else {
    lastInsideAt = null;
    elements.dwellState.textContent = '0 ms';
  }
}

function handleResize() {
  updateTargetPosition();
  updateCursorPosition(elements.localCursor, localPosition);
  updateCursorPosition(elements.remoteCursor, remotePosition);
}

function connect() {
  const key = elements.ablyKey.value.trim();
  if (!key) {
    updateStatus('Please enter an Ably API key.', true);
    return;
  }

  localStorage.setItem('hotspotCaptureKey', key);
  clientId = localStorage.getItem('hotspotCaptureClientId');
  if (!clientId) {
    clientId = `player-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('hotspotCaptureClientId', clientId);
  }

  if (realtime) {
    realtime.close();
  }

  updateStatus('Connecting...');

  realtime = new Ably.Realtime({ key, clientId });
  channel = realtime.channels.get(elements.roomName.value.trim() || 'hotspot-capture');

  realtime.connection.once('connected', () => {
    updateStatus('Connected. Waiting for opponent...');
    channel.presence.enter({ name: clientId });
  });

  realtime.connection.once('failed', (stateChange) => {
    updateStatus(`Connection failed: ${stateChange.reason?.message || 'Unknown error'}`, true);
  });

  channel.subscribe('coords', (message) => {
    if (!message.data || message.data.id === clientId) {
      return;
    }
    remotePosition = { x: message.data.x, y: message.data.y };
    updateCursorPosition(elements.remoteCursor, remotePosition);
  });

  channel.subscribe('target', (message) => {
    if (!message.data) {
      return;
    }
    setTarget(message.data);
  });

  channel.subscribe('score', (message) => {
    const { playerId, targetId } = message.data || {};
    if (!playerId || !targetId || scoredTargetId === targetId) {
      return;
    }
    scoredTargetId = targetId;
    scores.set(playerId, (scores.get(playerId) || 0) + 1);
    updateScoreList();
  });

  channel.presence.subscribe((presenceMessage) => {
    const memberId = presenceMessage.clientId;
    if (presenceMessage.action === 'enter' || presenceMessage.action === 'update') {
      presenceMap.set(memberId, presenceMessage.data?.name || memberId);
      if (!scores.has(memberId)) {
        scores.set(memberId, 0);
      }
    }
    if (presenceMessage.action === 'leave') {
      presenceMap.delete(memberId);
    }
    updateScoreList();
  });

  channel.presence.get((err, members) => {
    if (err) {
      return;
    }
    members.forEach((member) => {
      presenceMap.set(member.clientId, member.data?.name || member.clientId);
      if (!scores.has(member.clientId)) {
        scores.set(member.clientId, 0);
      }
    });
    updateScoreList();
  });

  if (isHost) {
    setTimeout(() => {
      if (!target.id) {
        spawnTarget();
      }
    }, 600);
  }
}

function sendLocalPosition() {
  if (!channel) {
    return;
  }
  const now = performance.now();
  if (now - lastSendAt < SEND_INTERVAL_MS) {
    return;
  }
  lastSendAt = now;
  channel.publish('coords', { id: clientId, x: localPosition.x, y: localPosition.y });
}

function handlePointerMove(event) {
  const rect = elements.arena.getBoundingClientRect();
  const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
  const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
  localPosition = { x, y };
  updateCursorPosition(elements.localCursor, localPosition);
  trackDwell();
  sendLocalPosition();
}

elements.connectBtn.addEventListener('click', connect);

elements.hostBtn.addEventListener('click', () => {
  isHost = !isHost;
  localStorage.setItem('hotspotCaptureHost', isHost.toString());
  updateHostButton();
  if (isHost && channel && !target.id) {
    spawnTarget();
  }
});

elements.spawnBtn.addEventListener('click', () => {
  if (!isHost) {
    updateStatus('Only the host can spawn targets.', true);
    return;
  }
  spawnTarget();
});

elements.arena.addEventListener('mousemove', handlePointerMove);

window.addEventListener('resize', handleResize);

setTarget({ id: null, x: 0.5, y: 0.5 });
updateCursorPosition(elements.localCursor, localPosition);
updateCursorPosition(elements.remoteCursor, remotePosition);
setInterval(trackDwell, 100);
