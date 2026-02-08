const canvas = document.getElementById('rink');
const ctx = canvas.getContext('2d');
const menuOverlay = document.getElementById('menuOverlay');
const startButton = document.getElementById('startButton');

const BASE_W = 1920;
const BASE_H = 1080;

function getUiScale() {
  return Math.max(
    0.55,
    Math.min(1.6, Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H))
  );
}

const zamboniImg = new Image();
zamboniImg.src = '../../images/zamboni.png';

const backgroundMusic = new Audio('../../sounds/beatles.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.25;

const zamboniMoveSound = new Audio('../../sounds/africa-sound.wav');
zamboniMoveSound.loop = false;
zamboniMoveSound.volume = 0.4;

const victorySound = new Audio('../../sounds/asia-sound.wav');
victorySound.volume = 0.6;

let audioUnlocked = false;

const stage = {
  current: 'menu',
  transitioning: false,
  next: null,
  transitionStart: 0,
  transitionDelay: 0,
};

const opening = {
  ringCount: 0,
  fireworks: [],
  finalBurst: false,
  finalStart: 0,
};

const snow = {
  presses: 0,
  particles: [],
  mountainProgress: 0,
};

const zamboniState = {
  finished: false,
  isAnimating: false,
  animationStart: 0,
  smoothing: 0,
  targetSmoothing: 0,
  currentSweepRow: 0,
  lastCleanCol: 0,
  celebrationTime: 0,
  victoryPlayed: false,
  victoryLapDone: false,
};

const grid = {
  cols: 28,
  rows: 5,
  cells: [],
  cleaned: 0,
  total: 0,
};

const zamboni = {
  col: 1,
  row: 0,
  dir: 1,
  lineStride: 1,
};

const sweep = {
  startCol: 1,
  endCol: 26,
  durationMs: 4500,
  progress: 0,
};

const arena = { glow: 0 };

const sparkle = {
  flakes: [],
  stars: [],
  orbs: [],
  lastTime: 0,
};

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildGrid();
}
window.addEventListener('resize', resize);

function idx(c, r) {
  return r * grid.cols + c;
}

function buildGrid() {
  const { cols, rows } = grid;
  grid.cells = new Array(cols * rows).fill(0);
  grid.cleaned = 0;
  grid.total = cols * rows;

  zamboni.col = 1;
  zamboni.row = 0;
  zamboni.dir = 1;

  zamboniState.currentSweepRow = zamboni.row;
  sweep.progress = 0;

  buildSparkles();
  zamboniState.targetSmoothing = 0;
}

function cleanCell(c, r) {
  if (c < 0 || r < 0 || c >= grid.cols || r >= grid.rows) return;
  const i = idx(c, r);
  if (grid.cells[i] < 1) {
    grid.cells[i] = 1;
    grid.cleaned += 1;
  }
}

function updateProgress() {
  zamboniState.targetSmoothing = grid.cleaned / grid.total;
  if (!zamboniState.finished && grid.cleaned >= grid.total) {
    triggerCelebration();
  }
}

function cleanLine(row) {
  for (let c = 0; c < grid.cols; c++) cleanCell(c, row);
  updateProgress();
}

function cleanSegment(row, fromCol, toCol) {
  const start = Math.round(Math.min(fromCol, toCol));
  const end = Math.round(Math.max(fromCol, toCol));
  for (let c = start; c <= end; c++) cleanCell(c, row);
  updateProgress();
}

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  backgroundMusic.play().catch(() => {});
}

function startSweep(fromSpace = false) {
  zamboniState.isAnimating = true;
  zamboniState.animationStart = performance.now();
  zamboniState.currentSweepRow = zamboni.row;

  sweep.startCol = zamboni.dir === 1 ? 1 : grid.cols - 2;
  sweep.endCol = zamboni.dir === 1 ? grid.cols - 2 : 1;
  sweep.progress = 0;

  zamboniState.lastCleanCol = sweep.startCol;

  if (fromSpace) {
    zamboniMoveSound.pause();
    zamboniMoveSound.currentTime = 0;
    zamboniMoveSound.play().catch(() => {});
  }
}

function completeSweep() {
  cleanLine(zamboniState.currentSweepRow);

  zamboni.row += zamboni.lineStride;
  if (zamboni.row >= grid.rows) zamboni.row = 0;

  zamboni.dir *= -1;

  zamboniState.isAnimating = false;
  zamboniState.animationStart = 0;
}

function triggerCelebration() {
  zamboniState.finished = true;
  zamboniState.celebrationTime = performance.now();
  if (!zamboniState.victoryPlayed) {
    zamboniState.victoryPlayed = true;
    victorySound.currentTime = 0;
    victorySound.play().catch(() => {});
  }
}

function updateSweep(now) {
  const elapsed = now - zamboniState.animationStart;
  const progress = Math.min(1, elapsed / sweep.durationMs);
  sweep.progress = progress;

  const dist = sweep.endCol - sweep.startCol;
  const currentCol = sweep.startCol + dist * progress;

  cleanSegment(zamboniState.currentSweepRow, zamboniState.lastCleanCol, currentCol);
  zamboniState.lastCleanCol = currentCol;

  zamboni.col = currentCol;
  zamboni.row = zamboniState.currentSweepRow;

  if (progress >= 1) {
    completeSweep();
  }
}

function buildSparkles() {
  const uiScale = getUiScale();
  sparkle.flakes = [];
  sparkle.stars = [];
  sparkle.orbs = [];
  for (let i = 0; i < 90; i += 1) {
    sparkle.flakes.push({
      x: Math.random(),
      y: Math.random(),
      size: (2 + Math.random() * 4) * uiScale,
      speed: 0.15 + Math.random() * 0.4,
      drift: -0.25 + Math.random() * 0.5,
      alpha: 0.3 + Math.random() * 0.5,
    });
  }
  for (let i = 0; i < 50; i += 1) {
    sparkle.stars.push({
      x: Math.random(),
      y: Math.random(),
      radius: (1 + Math.random() * 3) * uiScale,
      alpha: 0.25 + Math.random() * 0.6,
    });
  }
  for (let i = 0; i < 6; i += 1) {
    sparkle.orbs.push({
      x: Math.random(),
      y: Math.random(),
      radius: (40 + Math.random() * 80) * uiScale,
      alpha: 0.05 + Math.random() * 0.12,
    });
  }
}

function scheduleTransition(next, delayMs = 2400) {
  stage.transitioning = true;
  stage.next = next;
  stage.transitionStart = performance.now();
  stage.transitionDelay = delayMs;
}

function setStage(name) {
  stage.current = name;
  stage.transitioning = false;
  stage.next = null;
  stage.transitionDelay = 0;
  stage.transitionStart = 0;

  if (name === 'opening') {
    opening.ringCount = 0;
    opening.fireworks = [];
    opening.finalBurst = false;
    opening.finalStart = 0;
  }

  if (name === 'snow') {
    snow.presses = 0;
    snow.particles = [];
    snow.mountainProgress = 0;
  }

  if (name === 'zamboni') {
    zamboniState.finished = false;
    zamboniState.isAnimating = false;
    zamboniState.animationStart = 0;
    zamboniState.smoothing = 0;
    zamboniState.targetSmoothing = 0;
    zamboniState.currentSweepRow = 0;
    zamboniState.lastCleanCol = 0;
    zamboniState.celebrationTime = 0;
    zamboniState.victoryPlayed = false;
    zamboniState.victoryLapDone = false;
    buildGrid();
  }
}

function spawnFirework() {
  const burst = {
    x: 0.2 + Math.random() * 0.6,
    y: 0.2 + Math.random() * 0.35,
    radius: 0,
    particles: [],
  };
  const colors = ['#4fc3f7', '#ffeb3b', '#ef5350', '#66bb6a', '#ab47bc'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < 80; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    burst.particles.push({
      x: burst.x,
      y: burst.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color,
    });
  }
  opening.fireworks.push(burst);
}

function updateFireworks(dt) {
  opening.fireworks.forEach((burst) => {
    burst.particles.forEach((particle) => {
      particle.x += particle.vx * dt * 0.0003;
      particle.y += particle.vy * dt * 0.0003;
      particle.vy += 0.4 * dt * 0.0002;
      particle.life -= dt * 0.00045;
    });
    burst.particles = burst.particles.filter((p) => p.life > 0);
  });
  opening.fireworks = opening.fireworks.filter((burst) => burst.particles.length > 0);
}

function drawFireworks() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  opening.fireworks.forEach((burst) => {
    burst.particles.forEach((particle) => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.beginPath();
      ctx.arc(particle.x * w, particle.y * h, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.restore();
}

function drawRings() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const uiScale = getUiScale();
  const ringRadius = 70 * uiScale;
  const gap = ringRadius * 1.3;
  const centerX = w / 2;
  const centerY = h * 0.45;
  const rings = [
    { x: centerX - gap * 2, y: centerY, color: '#1e88e5' },
    { x: centerX, y: centerY, color: '#000000' },
    { x: centerX + gap * 2, y: centerY, color: '#e53935' },
    { x: centerX - gap, y: centerY + gap * 0.75, color: '#f9a825' },
    { x: centerX + gap, y: centerY + gap * 0.75, color: '#43a047' },
  ];

  ctx.save();
  ctx.lineWidth = 12 * uiScale;
  const count = Math.min(opening.ringCount, rings.length);
  for (let i = 0; i < count; i += 1) {
    ctx.strokeStyle = rings[i].color;
    ctx.beginPath();
    ctx.arc(rings[i].x, rings[i].y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (opening.finalBurst) {
    const pulse = 1 + Math.sin((performance.now() - opening.finalStart) * 0.006) * 0.08;
    ctx.globalAlpha = 0.35;
    rings.forEach((ring) => {
      ctx.strokeStyle = ring.color;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ringRadius * pulse, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
  ctx.restore();
}

function spawnSnowBurst() {
  const burst = {
    x: 0.12,
    y: 0.82,
    particles: [],
  };
  for (let i = 0; i < 90; i += 1) {
    const angle = (-Math.PI / 3) + Math.random() * (Math.PI / 2);
    const speed = 1.2 + Math.random() * 2.8;
    burst.particles.push({
      x: burst.x,
      y: burst.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
    });
  }
  snow.particles.push(burst);
}

function updateSnow(dt) {
  snow.particles.forEach((burst) => {
    burst.particles.forEach((particle) => {
      particle.x += particle.vx * dt * 0.00035;
      particle.y += particle.vy * dt * 0.00035;
      particle.vy += 0.4 * dt * 0.0002;
      particle.life -= dt * 0.0005;
    });
    burst.particles = burst.particles.filter((p) => p.life > 0);
  });
  snow.particles = snow.particles.filter((burst) => burst.particles.length > 0);
}

function drawSnowScene() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  ctx.fillStyle = '#0b1f3a';
  ctx.fillRect(0, 0, w, h);

  const groundY = h * 0.82;
  ctx.fillStyle = '#1c3558';
  ctx.fillRect(0, groundY, w, h - groundY);

  const mountainHeight = h * (0.08 + snow.mountainProgress * 0.35);
  ctx.fillStyle = '#eef6ff';
  ctx.beginPath();
  ctx.moveTo(w * 0.05, groundY);
  ctx.lineTo(w * 0.55, groundY - mountainHeight);
  ctx.lineTo(w * 0.95, groundY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#d9e8f5';
  ctx.beginPath();
  ctx.moveTo(w * 0.2, groundY);
  ctx.lineTo(w * 0.55, groundY - mountainHeight * 0.85);
  ctx.lineTo(w * 0.9, groundY);
  ctx.closePath();
  ctx.fill();

  const cannonBaseX = w * 0.08;
  const cannonBaseY = groundY;
  ctx.fillStyle = '#9ad0ff';
  ctx.fillRect(cannonBaseX - 30, cannonBaseY - 20, 60, 30);
  ctx.fillStyle = '#bfe4ff';
  ctx.fillRect(cannonBaseX, cannonBaseY - 50, 100, 18);
  ctx.beginPath();
  ctx.arc(cannonBaseX + 100, cannonBaseY - 42, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  snow.particles.forEach((burst) => {
    burst.particles.forEach((particle) => {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.beginPath();
      ctx.arc(particle.x * w, particle.y * h, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.restore();

  drawStagePrompt('Canon à neige', `${snow.presses}/5`);
}

function drawOpeningScene() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#081a3a');
  gradient.addColorStop(1, '#040913');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  drawFireworks();
  drawRings();

  drawStagePrompt('Cérémonie', `${opening.ringCount}/5`);
}

function drawStagePrompt(title, counter) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const uiScale = getUiScale();
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `${18 * uiScale}px system-ui, sans-serif`;
  ctx.fillText(title, 40 * uiScale, 40 * uiScale);
  ctx.font = `${22 * uiScale}px system-ui, sans-serif`;
  ctx.fillText(counter, 40 * uiScale, 70 * uiScale);
  ctx.restore();
}

function drawTransitionOverlay(text) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  ctx.save();
  ctx.fillStyle = 'rgba(4,13,26,0.55)';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${28 * getUiScale()}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2);
  ctx.restore();
}

function drawZamboniScene(now) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const uiScale = getUiScale();

  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#061a2b');
  gradient.addColorStop(1, '#0b2f4d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  arena.glow = 0.5 + Math.sin(now * 0.0015) * 0.5;

  const pad = 80 * uiScale;
  const rinkWidth = w - pad * 2;
  const rinkHeight = h - pad * 2;
  const x = pad;
  const y = pad;

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x - 10 * uiScale, y - 10 * uiScale, rinkWidth + 20 * uiScale, rinkHeight + 20 * uiScale);
  ctx.restore();

  ctx.fillStyle = '#dff4ff';
  ctx.fillRect(x, y, rinkWidth, rinkHeight);

  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 4 * uiScale;
  ctx.strokeRect(x, y, rinkWidth, rinkHeight);

  const inner = {
    x: x + 30 * uiScale,
    y: y + 30 * uiScale,
    w: rinkWidth - 60 * uiScale,
    h: rinkHeight - 60 * uiScale,
  };

  ctx.fillStyle = '#cfe7f5';
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);

  ctx.lineWidth = 8 * uiScale;
  ctx.strokeStyle = '#e53935';
  ctx.beginPath();
  ctx.moveTo(inner.x, inner.y + inner.h / 2);
  ctx.lineTo(inner.x + inner.w, inner.y + inner.h / 2);
  ctx.stroke();

  ctx.strokeStyle = '#1e88e5';
  ctx.beginPath();
  ctx.moveTo(inner.x + inner.w / 2, inner.y);
  ctx.lineTo(inner.x + inner.w / 2, inner.y + inner.h);
  ctx.stroke();

  const cellW = inner.w / grid.cols;
  const cellH = inner.h / grid.rows;

  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const i = idx(c, r);
      if (grid.cells[i] >= 1) {
        ctx.fillStyle = '#f4fdff';
        ctx.fillRect(inner.x + c * cellW, inner.y + r * cellH, cellW, cellH);
      }
    }
  }

  const leftNudge = 0.4 * cellW;
  const yLift = 0.2 * cellH;
  const zx = inner.x + zamboni.col * cellW - leftNudge;
  const zy = inner.y + zamboni.row * cellH - yLift;
  const drawW = cellW * 2.4;
  const drawH = cellH * 2.1;

  ctx.save();
  ctx.translate(zx, zy + drawH / 2);
  const flipX = zamboni.dir === 1 ? -1 : 1;
  ctx.scale(flipX, 1);
  ctx.translate(-drawW / 2, -drawH / 2);

  if (zamboniImg.complete && zamboniImg.naturalWidth > 0) {
    const iw = zamboniImg.naturalWidth;
    const ih = zamboniImg.naturalHeight;
    const scale = Math.min(drawW / iw, drawH / ih);
    const dx = (drawW - iw * scale) / 2;
    const dy = (drawH - ih * scale) / 2;
    ctx.drawImage(zamboniImg, dx, dy, iw * scale, ih * scale);
  } else {
    ctx.fillStyle = '#ffb300';
    ctx.fillRect(0, 0, drawW, drawH);
  }
  ctx.restore();

  const progress = grid.cleaned / grid.total;
  zamboniState.smoothing += (zamboniState.targetSmoothing - zamboniState.smoothing) * 0.04;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(x, y + rinkHeight + 18 * uiScale, rinkWidth * zamboniState.smoothing, 10 * uiScale);

  if (zamboniState.finished) {
    drawFinalCelebration(now, w, h);
  } else {
    drawStagePrompt('Zamboni', `${Math.round(progress * 100)}%`);
  }
}

function drawFinalCelebration(now, w, h) {
  const elapsed = (now - zamboniState.celebrationTime) * 0.001;
  const glow = Math.min(1, elapsed / 1.5);
  ctx.save();
  ctx.fillStyle = `rgba(255, 213, 79, ${0.4 * glow})`;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${36 * getUiScale()}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Bravo !', w / 2, h / 2);
  ctx.restore();
}

function updateZamboni(now) {
  if (zamboniState.isAnimating) {
    updateSweep(now);
  }
}

function handleOpeningPress() {
  if (opening.ringCount >= 5) return;
  unlockAudio();
  opening.ringCount += 1;
  spawnFirework();
  if (opening.ringCount === 5) {
    opening.finalBurst = true;
    opening.finalStart = performance.now();
    scheduleTransition('snow', 3200);
  }
}

function handleSnowPress() {
  if (snow.presses >= 5) return;
  unlockAudio();
  snow.presses += 1;
  snow.mountainProgress = snow.presses / 5;
  spawnSnowBurst();
  if (snow.presses === 5) {
    scheduleTransition('zamboni', 2800);
  }
}

function handleZamboniPress(fromSpace) {
  if (zamboniState.finished || zamboniState.isAnimating) return;
  unlockAudio();
  startSweep(fromSpace);
}

function handlePrimaryPress(fromSpace = false) {
  if (stage.current === 'opening') {
    handleOpeningPress();
  } else if (stage.current === 'snow') {
    handleSnowPress();
  } else if (stage.current === 'zamboni') {
    handleZamboniPress(fromSpace);
  }
}

function onKey(event) {
  if (event.code === 'Space') {
    event.preventDefault();
    handlePrimaryPress(true);
  }
}

window.addEventListener('keydown', onKey, { passive: false });
window.addEventListener('pointerdown', () => handlePrimaryPress(false));

function drawBackground() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  ctx.fillStyle = '#040913';
  ctx.fillRect(0, 0, w, h);
}

let lastTime = performance.now();

function tick(now) {
  const dt = now - lastTime;
  lastTime = now;

  drawBackground();

  if (stage.current === 'opening') {
    updateFireworks(dt);
    drawOpeningScene();
  } else if (stage.current === 'snow') {
    updateSnow(dt);
    drawSnowScene();
  } else if (stage.current === 'zamboni') {
    updateZamboni(now);
    drawZamboniScene(now);
  }

  if (stage.transitioning) {
    if (now - stage.transitionStart >= stage.transitionDelay) {
      setStage(stage.next);
    } else {
      const message = stage.next === 'snow'
        ? 'Canon à neige…'
        : stage.next === 'zamboni'
          ? 'Zamboni…'
          : 'Suite…';
      drawTransitionOverlay(message);
    }
  }

  requestAnimationFrame(tick);
}

startButton.addEventListener('click', () => {
  menuOverlay.style.display = 'none';
  setStage('opening');
  unlockAudio();
});

resize();
requestAnimationFrame(tick);
