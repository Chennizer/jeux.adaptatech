const canvas = document.getElementById('rink');
const ctx = canvas.getContext('2d');

const overlay = document.getElementById('promptOverlay');
const startButton = document.getElementById('startButton');
const stageHud = document.getElementById('stageHud');
const stageHint = document.getElementById('stageHint');

const BASE_W = 1920;
const BASE_H = 1080;

const stageLabels = [
  'Cérémonie d\'ouverture',
  'Canon à neige',
  'Zamboni olympique'
];

const stageHints = [
  'Appuyez sur ESPACE pour lancer les feux d\'artifice et créer un anneau.',
  'Appuyez 5 fois sur le canon à neige pour former la montagne.',
  'Appuyez pour faire avancer la zamboni et nettoyer la glace.'
];

function getUiScale(){
  return Math.max(0.55, Math.min(1.6, Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)));
}

const backgroundMusic = new Audio('../../sounds/beatles.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.25;

const zamboniMoveSound = new Audio('../../sounds/africa-sound.wav');
zamboniMoveSound.loop = false;
zamboniMoveSound.volume = 0.4;

const victorySound = new Audio('../../sounds/asia-sound.wav');
victorySound.volume = 0.6;

let audioUnlocked = false;

function unlockAudio(){
  if(audioUnlocked) return;
  audioUnlocked = true;
  backgroundMusic.play().catch(() => {});
}

const openingStage = {
  ringPresses: 0,
  ringTimes: [],
  fireworks: [],
  launches: [],
  flashes: [],
  stars: [],
  complete: false,
  completeTime: 0,
  lastPressTime: 0,
};

const snowStage = {
  presses: 0,
  particles: [],
  settled: [],
  streamEndTime: 0,
  complete: false,
  completeTime: 0,
  lastPressTime: 0,
};

const zamboniStage = {
  finished:false,
  isAnimating:false,
  animationStart:0,
  lastPressTime: 0,
  smoothing:0,
  targetSmoothing:0,
  currentSweepRow:0,
  lastCleanCol:0,
  celebrationTime:0,
  victoryPlayed:false,
  victoryLapDone:false,
  arenaGlow:0,
  grid: {
    cols:28,
    rows:5,
    cells:[],
    cleaned:0,
    total:0,
  },
  zamboni: {
    col:1,
    row:0,
    dir:1,
    lineStride:1,
  },
  sweep: {
    startCol:1,
    endCol:26,
    durationMs:4500,
    progress:0,
  },
  sparkle: {
    flakes:[],
    stars:[],
    orbs:[],
    lastTime:0,
  }
};

const zamboniImg = new Image();
zamboniImg.src = '../../images/zamboni.png';

const stageState = {
  index: -1,
  transition: false,
};

function resize(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(stageState.index === 0){
    buildStars();
  }
}
window.addEventListener('resize', resize);

function setStage(index){
  stageState.index = index;
  stageState.transition = false;
  stageHud.textContent = stageLabels[index];
  stageHint.textContent = stageHints[index];
  stageHud.style.display = 'block';
  stageHint.style.display = 'block';

  if(index === 0){
    openingStage.ringPresses = 0;
    openingStage.ringTimes = [];
    openingStage.fireworks = [];
    openingStage.launches = [];
    openingStage.flashes = [];
    openingStage.stars = [];
    openingStage.complete = false;
    openingStage.completeTime = 0;
    openingStage.lastPressTime = 0;
    buildStars();
  }

  if(index === 1){
    snowStage.presses = 0;
    snowStage.particles = [];
    snowStage.settled = [];
    snowStage.complete = false;
    snowStage.completeTime = 0;
    snowStage.lastPressTime = 0;
  }

  if(index === 2){
    resetZamboni();
  }
}

function advanceStage(){
  if(stageState.transition) return;
  stageState.transition = true;
  const nextIndex = stageState.index + 1;
  if(nextIndex < stageLabels.length){
    setTimeout(() => setStage(nextIndex), 1800);
  }
}

function handleOpeningPress(){
  const now = performance.now();
  if(now - openingStage.lastPressTime < 3000) return;
  openingStage.lastPressTime = now;
  if(openingStage.complete) return;
  unlockAudio();
  if(openingStage.ringPresses < 5){
    openingStage.ringPresses += 1;
    openingStage.ringTimes.push(performance.now());
    spawnFirework();
  }
  if(openingStage.ringPresses >= 5 && !openingStage.complete){
    openingStage.complete = true;
    openingStage.completeTime = performance.now();
    spawnFinalFireworks();
    advanceStage();
  }
}

function handleSnowPress(){
  const now = performance.now();
  if(now - snowStage.lastPressTime < 3000) return;
  snowStage.lastPressTime = now;
  if(snowStage.complete) return;
  unlockAudio();
  if(snowStage.presses < 5){
    snowStage.presses += 1;
    spawnSnowBurst();
    snowStage.streamEndTime = performance.now() + 900;
  }
  if(snowStage.presses >= 5 && !snowStage.complete){
    snowStage.complete = true;
    snowStage.completeTime = performance.now();
    advanceStage();
  }
}

function handleZamboniPress(fromSpace=false){
  const now = performance.now();
  if(now - zamboniStage.lastPressTime < 3000) return;
  zamboniStage.lastPressTime = now;
  if(zamboniStage.finished || zamboniStage.isAnimating) return;
  unlockAudio();
  startSweep(fromSpace);
}

function onKey(e){
  if(e.code === 'Space'){
    e.preventDefault();
    if(stageState.index === 0) handleOpeningPress();
    if(stageState.index === 1) handleSnowPress();
    if(stageState.index === 2) handleZamboniPress(true);
  }
}
window.addEventListener('keydown', onKey, {passive:false});

window.addEventListener('pointerdown', (event) => {
  if(stageState.index === 0){
    handleOpeningPress();
    return;
  }
  if(stageState.index === 1){
    if(isPointerOnCannon(event.clientX, event.clientY)){
      handleSnowPress();
    }
    return;
  }
  if(stageState.index === 2){
    handleZamboniPress(false);
  }
});

startButton.addEventListener('click', () => {
  overlay.style.display = 'none';
  if(document.documentElement.requestFullscreen){
    document.documentElement.requestFullscreen().catch(() => {});
  }
  setStage(0);
});

function spawnFirework(){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = vw * (0.2 + Math.random() * 0.6);
  const y = vh * (0.18 + Math.random() * 0.35);
  const hue = Math.random() * 360;
  const type = ['peony', 'ring', 'chrysanthemum', 'willow'][Math.floor(Math.random() * 4)];
  const count = type === 'ring' ? 220 : 340;
  const baseSpeed = type === 'willow' ? 3.6 : 5.4;

  openingStage.launches.push({
    x,
    y: vh + 40,
    targetY: y,
    vx: (Math.random() - 0.5) * 0.6,
    vy: - (9 + Math.random() * 4),
    hue,
    life: 0,
    ttl: 90,
  });
  openingStage.flashes.push({
    x,
    y,
    life: 0,
    ttl: 22,
    hue,
  });

  for(let i=0;i<count;i++){
    const angle = type === 'ring' ? (i / count) * Math.PI * 2 : Math.random() * Math.PI * 2;
    const spread = type === 'chrysanthemum' ? (0.8 + Math.random() * 0.5) : (0.6 + Math.random() * 0.8);
    const speed = baseSpeed * spread;
    const hueShift = (Math.random() - 0.5) * 40;
    openingStage.fireworks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      ttl: type === 'willow' ? 200 + Math.random() * 40 : 150 + Math.random() * 50,
      hue: (hue + hueShift + 360) % 360,
      sat: type === 'willow' ? 70 + Math.random() * 20 : 80 + Math.random() * 15,
      size: type === 'ring' ? 5.2 : 4 + Math.random() * 3.2,
      glow: type === 'willow' ? 1 : Math.random() > 0.7 ? 1 : 0,
      twinkle: 0.4 + Math.random() * 0.5,
      drag: type === 'willow' ? 0.994 : 0.992,
      gravity: type === 'willow' ? 0.06 : 0.085,
    });
  }
}

function spawnFinalFireworks(){
  for(let i=0;i<4;i++) spawnFirework();
}

function updateFireworks(){
  openingStage.fireworks = openingStage.fireworks.filter(p => p.life < p.ttl);
  openingStage.flashes = openingStage.flashes.filter(f => f.life < f.ttl);
  openingStage.fireworks.forEach(p => {
    p.life += 1;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.vy += p.gravity;
  });
  openingStage.flashes.forEach(f => {
    f.life += 1;
  });
}

function updateLaunches(){
  openingStage.launches = openingStage.launches.filter(l => l.life < l.ttl && l.y > l.targetY);
  openingStage.launches.forEach(l => {
    l.life += 1;
    l.x += l.vx;
    l.y += l.vy;
    l.vy += 0.12;
  });
}

function drawLaunches(){
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  openingStage.launches.forEach(l => {
    const alpha = 1 - l.life / l.ttl;
    ctx.strokeStyle = `hsla(${l.hue},85%,70%,${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y);
    ctx.lineTo(l.x - l.vx * 3, l.y - l.vy * 3);
    ctx.stroke();
    ctx.fillStyle = `hsla(${l.hue},90%,75%,${alpha})`;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function buildStars(){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const count = Math.floor((vw * vh) / 22000);
  openingStage.stars = Array.from({length: count}, () => ({
    x: Math.random() * vw,
    y: Math.random() * vh * 0.7,
    size: 0.8 + Math.random() * 1.8,
    twinkle: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 1.2,
  }));
}

function drawStars(now){
  if(!openingStage.stars.length){
    buildStars();
  }
  ctx.save();
  openingStage.stars.forEach(star => {
    const alpha = 0.45 + Math.sin(now * 0.0015 * star.speed + star.twinkle) * 0.35;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawProjectorLights(now){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const beamCount = 4;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for(let i=0;i<beamCount;i++){
    const baseX = (vw / (beamCount + 1)) * (i + 1);
    const sway = Math.sin(now * 0.0008 + i) * vw * 0.04;
    const topX = baseX + sway;
    const grad = ctx.createLinearGradient(baseX, vh, topX, vh * 0.25);
    grad.addColorStop(0, 'rgba(80,160,255,0.0)');
    grad.addColorStop(0.4, 'rgba(80,160,255,0.18)');
    grad.addColorStop(1, 'rgba(80,160,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(baseX - vw * 0.08, vh);
    ctx.lineTo(topX, vh * 0.22);
    ctx.lineTo(baseX + vw * 0.08, vh);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawOpeningStage(now){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  ctx.fillStyle = '#04060d';
  ctx.fillRect(0,0,vw,vh);
  drawStars(now);
  drawProjectorLights(now);

  updateLaunches();
  updateFireworks();
  drawLaunches();
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  openingStage.flashes.forEach(f => {
    const alpha = 1 - f.life / f.ttl;
    ctx.fillStyle = `hsla(${f.hue},90%,70%,${alpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 48 * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  openingStage.fireworks.forEach(p => {
    const alpha = 1 - p.life / p.ttl;
    const flicker = 0.7 + p.twinkle * Math.sin((p.x + p.y + now) * 0.01);
    if(p.glow){
      ctx.fillStyle = `hsla(${p.hue},${p.sat}%,65%,${alpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `hsla(${p.hue},${p.sat}%,70%,${alpha * flicker})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  drawOlympicRings(now);

  if(openingStage.complete){
    const pulse = 0.5 + Math.sin((now - openingStage.completeTime) * 0.002) * 0.2;
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${0.4 + pulse})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(vw/2, vh/2, Math.min(vw, vh) * 0.22 * (1 + pulse * 0.15), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawOlympicRings(now){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ringSize = Math.min(vw, vh) * 0.18;
  const gap = ringSize * 0.35;
  const centerX = vw / 2;
  const centerY = vh / 2.05;

  const rings = [
    {x: centerX - ringSize - gap, y: centerY - ringSize * 0.25, color: '#1e88e5'},
    {x: centerX, y: centerY - ringSize * 0.25, color: '#000000'},
    {x: centerX + ringSize + gap, y: centerY - ringSize * 0.25, color: '#e53935'},
    {x: centerX - ringSize * 0.5 - gap * 0.5, y: centerY + ringSize * 0.55, color: '#fbc02d'},
    {x: centerX + ringSize * 0.5 + gap * 0.5, y: centerY + ringSize * 0.55, color: '#43a047'},
  ];

  rings.forEach((ring, index) => {
    if(index >= openingStage.ringPresses) return;
    const appearTime = openingStage.ringTimes[index] || now;
    const t = Math.min(1, (now - appearTime) / 600);
    ctx.save();
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ringSize * (0.12 - t * 0.04);
    ctx.globalAlpha = t;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ringSize, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function spawnSnowBurst(){
  const cannon = getCannonBounds();
  const startX = cannon.x + cannon.w * 0.7;
  const startY = cannon.y + cannon.h * 0.2;
  for(let i=0;i<120;i++){
    spawnSnowParticle(startX, startY, 1);
  }
}

function spawnSnowParticle(startX, startY, intensity){
  const angle = (-Math.PI / 6.2) + Math.random() * (Math.PI / 10);
  const speed = (3.6 + Math.random() * 5.2) * intensity;
  snowStage.particles.push({
    x: startX,
    y: startY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    ttl: 150 + Math.random() * 90,
    size: 2.2 + Math.random() * 3.6,
  });
}

function updateSnowParticles(now){
  const cannon = getCannonBounds();
  const startX = cannon.x + cannon.w * 0.7;
  const startY = cannon.y + cannon.h * 0.2;
  if(now < snowStage.streamEndTime){
    for(let i=0;i<16;i++){
      spawnSnowParticle(startX, startY, 1.1);
    }
  }
  const {surfaceY} = getMountainProfile();
  snowStage.particles = snowStage.particles.filter(p => p.life < p.ttl);
  snowStage.particles.forEach(p => {
    p.life += 1;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.03;
    const surface = surfaceY(p.x);
    if(p.y >= surface){
      snowStage.settled.push({
        x: p.x,
        y: surface,
        size: p.size * 0.8,
        life: 0,
      });
      p.life = p.ttl;
    }
  });
}

function drawSnowStage(){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const grad = ctx.createLinearGradient(0,0,0,vh);
  grad.addColorStop(0, '#60b6ff');
  grad.addColorStop(1, '#d8f0ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,vw,vh);

  drawSnowMountain();
  drawSettledSnow();
  drawCannon();

  const now = performance.now();
  updateSnowParticles(now);
  ctx.save();
  snowStage.particles.forEach(p => {
    const alpha = 1 - p.life / p.ttl;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = p.size;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 2.6, p.y - p.vy * 2.6);
    ctx.stroke();
  });
  ctx.restore();
}

function drawSettledSnow(){
  if(!snowStage.settled.length) return;
  ctx.save();
  snowStage.settled.forEach(s => {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(s.x, s.y - s.size * 0.2, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawSnowMountain(){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const progress = snowStage.presses / 5;
  const peakHeight = vh * (0.2 + progress * 0.35);
  const baseY = vh;
  const baseWidth = vw * 0.9;
  const centerX = vw * 0.55;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(centerX - baseWidth * 0.45, baseY);
  ctx.lineTo(centerX, baseY - peakHeight);
  ctx.lineTo(centerX + baseWidth * 0.45, baseY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(222,242,255,0.8)';
  ctx.beginPath();
  ctx.moveTo(centerX - baseWidth * 0.15, baseY);
  ctx.lineTo(centerX, baseY - peakHeight * 0.55);
  ctx.lineTo(centerX + baseWidth * 0.15, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function getMountainProfile(){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const progress = snowStage.presses / 5;
  const peakHeight = vh * (0.2 + progress * 0.35);
  const baseY = vh;
  const baseWidth = vw * 0.9;
  const centerX = vw * 0.55;
  const leftX = centerX - baseWidth * 0.45;
  const rightX = centerX + baseWidth * 0.45;
  const peakX = centerX;
  const peakY = baseY - peakHeight;

  function surfaceY(x){
    if(x <= leftX || x >= rightX) return baseY;
    if(x <= peakX){
      const t = (x - leftX) / (peakX - leftX);
      return baseY - t * peakHeight;
    }
    const t = (x - peakX) / (rightX - peakX);
    return peakY + t * peakHeight;
  }

  return {surfaceY};
}

function getCannonBounds(){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const size = Math.min(vw, vh) * 0.18;
  const x = vw * 0.07;
  const y = vh * 0.72;
  return {x, y, w: size, h: size * 0.6};
}

function drawCannon(){
  const cannon = getCannonBounds();
  ctx.save();
  ctx.fillStyle = '#455a64';
  ctx.fillRect(cannon.x, cannon.y + cannon.h * 0.25, cannon.w * 0.5, cannon.h * 0.35);

  ctx.fillStyle = '#263238';
  ctx.fillRect(cannon.x + cannon.w * 0.45, cannon.y, cannon.w * 0.45, cannon.h * 0.3);

  ctx.beginPath();
  ctx.fillStyle = '#37474f';
  ctx.arc(cannon.x + cannon.w * 0.25, cannon.y + cannon.h * 0.6, cannon.h * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#90caf9';
  ctx.lineWidth = 3;
  ctx.strokeRect(cannon.x + cannon.w * 0.45, cannon.y, cannon.w * 0.45, cannon.h * 0.3);
  ctx.restore();
}

function isPointerOnCannon(x, y){
  const cannon = getCannonBounds();
  return x >= cannon.x && x <= cannon.x + cannon.w && y >= cannon.y && y <= cannon.y + cannon.h;
}

function resetZamboni(){
  const {grid, zamboni, sweep, sparkle} = zamboniStage;
  grid.cells = new Array(grid.cols * grid.rows).fill(0);
  grid.cleaned = 0;
  grid.total = grid.cols * grid.rows;

  zamboni.col = 1;
  zamboni.row = 0;
  zamboni.dir = 1;

  zamboniStage.finished = false;
  zamboniStage.isAnimating = false;
  zamboniStage.animationStart = 0;
  zamboniStage.smoothing = 0;
  zamboniStage.targetSmoothing = 0;
  zamboniStage.currentSweepRow = 0;
  zamboniStage.lastCleanCol = 0;
  zamboniStage.celebrationTime = 0;
  zamboniStage.victoryPlayed = false;
  zamboniStage.victoryLapDone = false;
  zamboniStage.arenaGlow = 0;

  sweep.progress = 0;

  buildSparkles();

  try { zamboniMoveSound.pause(); } catch(e){}
  zamboniMoveSound.currentTime = 0;
}

function idx(c,r){ return r * zamboniStage.grid.cols + c; }

function cleanCell(c,r){
  const {grid} = zamboniStage;
  if(c < 0 || r < 0 || c >= grid.cols || r >= grid.rows) return;
  const i = idx(c,r);
  if(grid.cells[i] < 1){
    grid.cells[i] = 1;
    grid.cleaned += 1;
  }
}

function updateProgress(){
  const {grid} = zamboniStage;
  zamboniStage.targetSmoothing = grid.cleaned / grid.total;
  if(!zamboniStage.finished && grid.cleaned >= grid.total){
    triggerCelebration();
  }
}

function cleanLine(row){
  const {grid} = zamboniStage;
  for(let c = 0; c < grid.cols; c++) cleanCell(c,row);
  updateProgress();
}

function cleanSegment(row, fromCol, toCol){
  const start = Math.round(Math.min(fromCol, toCol));
  const end = Math.round(Math.max(fromCol, toCol));
  for(let c = start; c <= end; c++) cleanCell(c,row);
  updateProgress();
}

function startSweep(fromSpace=false){
  const {zamboni, sweep} = zamboniStage;
  zamboniStage.isAnimating = true;
  zamboniStage.animationStart = performance.now();
  zamboniStage.currentSweepRow = zamboni.row;

  sweep.startCol = zamboni.dir === 1 ? 1 : zamboniStage.grid.cols - 2;
  sweep.endCol   = zamboni.dir === 1 ? zamboniStage.grid.cols - 2 : 1;
  sweep.progress = 0;

  zamboniStage.lastCleanCol = sweep.startCol;

  if(fromSpace){
    try { zamboniMoveSound.pause(); } catch(e){}
    zamboniMoveSound.currentTime = 0;
    zamboniMoveSound.play().catch(() => {});
  }
}

function completeSweep(){
  const {zamboni, sweep} = zamboniStage;
  cleanLine(zamboniStage.currentSweepRow);

  zamboni.row += zamboni.lineStride;
  if(zamboni.row >= zamboniStage.grid.rows) zamboni.row = 0;

  zamboni.dir *= -1;

  zamboniStage.isAnimating = false;
  sweep.progress = 0;
  zamboniStage.lastCleanCol = zamboni.col;

  zamboniStage.arenaGlow = Math.min(1, zamboniStage.arenaGlow + 0.18);
}

function triggerCelebration(){
  zamboniStage.finished = true;
  zamboniStage.celebrationTime = performance.now();
  zamboniStage.victoryLapDone = false;

  if(!zamboniStage.victoryPlayed){
    zamboniStage.victoryPlayed = true;
    victorySound.currentTime = 0;
    victorySound.play().catch(() => {});
  }
}

function updateSweep(){
  if(!zamboniStage.isAnimating) return;

  const now = performance.now();
  const elapsed = now - zamboniStage.animationStart;
  const {sweep, zamboni} = zamboniStage;

  sweep.progress = Math.min(1, elapsed / sweep.durationMs);

  const col = sweep.startCol + (sweep.endCol - sweep.startCol) * sweep.progress;
  zamboni.col = col;
  zamboni.row = zamboniStage.currentSweepRow;

  cleanSegment(zamboniStage.currentSweepRow, zamboniStage.lastCleanCol, col);
  zamboniStage.lastCleanCol = col;

  if(sweep.progress >= 1) completeSweep();
}

function buildSparkles(){
  const s = getUiScale();
  const {sparkle} = zamboniStage;

  const flakeCount = 50;
  const starCount = 10;
  const orbCount = 16;

  sparkle.flakes = Array.from({length: flakeCount}, () => ({
    x: Math.random(),
    y: Math.random(),
    speed: 0.08 + Math.random()*0.18,
    size: (1 + Math.random()*2) * s,
    drift: (Math.random() - 0.5) * 0.2,
  }));

  sparkle.stars = Array.from({length: starCount}, () => ({
    x: Math.random(),
    y: Math.random(),
    r: (5 + Math.random()*8) * s,
    phase: Math.random()*Math.PI*2,
    twinkle: 0.6 + Math.random()*0.4,
  }));

  sparkle.orbs = Array.from({length: orbCount}, () => ({
    x: Math.random(),
    y: Math.random(),
    size: (12 + Math.random()*22) * s,
    hue: 180 + Math.random()*140,
    driftX: (Math.random() - 0.5) * 0.08,
    driftY: (Math.random() - 0.5) * 0.06,
    pulse: Math.random()*Math.PI*2,
  }));
}

function updateSparkles(dt){
  const {sparkle} = zamboniStage;
  sparkle.flakes.forEach(flake => {
    flake.y += flake.speed * dt * 0.0006;
    flake.x += flake.drift * dt * 0.0002;
    if(flake.y > 1.1) flake.y = -0.1;
    if(flake.x > 1.1) flake.x = -0.1;
    if(flake.x < -0.1) flake.x = 1.1;
  });

  sparkle.stars.forEach(star => { star.phase += dt * 0.0015; });

  sparkle.orbs.forEach(orb => {
    orb.x += orb.driftX * dt * 0.00015;
    orb.y += orb.driftY * dt * 0.00015;
    orb.pulse += dt * 0.001;
    if(orb.x > 1.2) orb.x = -0.2;
    if(orb.x < -0.2) orb.x = 1.2;
    if(orb.y > 1.2) orb.y = -0.2;
    if(orb.y < -0.2) orb.y = 1.2;
  });
}

function drawSparkles(bounds, now, s){
  const {x,y,w,h} = bounds;
  const time = now || performance.now();
  const {sparkle} = zamboniStage;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  sparkle.orbs.forEach(orb => {
    const ox = x + orb.x * w;
    const oy = y + orb.y * h;
    const pulse = 0.6 + Math.sin(orb.pulse) * 0.25;
    const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.size * pulse);
    grad.addColorStop(0, `hsla(${orb.hue},80%,65%,0.5)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ox, oy, orb.size * pulse, 0, Math.PI*2);
    ctx.fill();
  });

  sparkle.stars.forEach(star => {
    const sx = x + star.x * w;
    const sy = y + star.y * h;
    const twinkle = (Math.sin(star.phase + time*0.0015) * 0.4 + 0.6) * star.twinkle;
    ctx.strokeStyle = `rgba(255,255,255,${0.35 * twinkle})`;
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(sx - star.r, sy);
    ctx.lineTo(sx + star.r, sy);
    ctx.moveTo(sx, sy - star.r);
    ctx.lineTo(sx, sy + star.r);
    ctx.stroke();
  });

  ctx.restore();
}

function drawSnow(bounds){
  const {x,y,w,h} = bounds;
  const {sparkle} = zamboniStage;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  sparkle.flakes.forEach(flake => {
    ctx.beginPath();
    ctx.arc(x + flake.x * w, y + flake.y * h, flake.size, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function drawStands(bounds, now, s){
  const {x,y,w,h} = bounds;
  const ringCount = 5;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for(let i=0;i<ringCount;i++){
    const inset = (i + 1) * 12 * s;
    const alpha = 0.18 + i * 0.08;
    const pulse = 1 + Math.sin((now * 0.001) + i) * 0.02;
    ctx.strokeStyle = `rgba(120,200,255,${alpha})`;
    ctx.lineWidth = (6 - i) * s;

    roundRect(
      ctx,
      x - inset * pulse,
      y - inset * pulse,
      w + inset * 2 * pulse,
      h + inset * 2 * pulse,
      (26 + i * 4) * s
    );
    ctx.stroke();
  }

  ctx.restore();
}

function drawVictoryLap(bounds, now){
  const {x,y,w,h} = bounds;
  const t = (now - zamboniStage.celebrationTime) / 1000;
  const speed = 0.08;
  const perimeter = 2 * (w + h);
  const lapTime = 1 / speed;

  if(t >= lapTime){
    zamboniStage.victoryLapDone = true;
    return;
  }

  let d = (t * speed * perimeter) % perimeter;
  let px = x;
  let py = y;
  let dir = 1;

  if(d <= w){
    px = x + d; py = y; dir = 1;
  }else if(d <= w + h){
    px = x + w; py = y + (d - w); dir = -1;
  }else if(d <= 2 * w + h){
    px = x + w - (d - (w + h)); py = y + h; dir = -1;
  }else{
    px = x; py = y + h - (d - (2 * w + h)); dir = 1;
  }

  zamboniStage.zamboni.col = (px - x) / (w / zamboniStage.grid.cols);
  zamboniStage.zamboni.row = (py - y) / (h / zamboniStage.grid.rows);
  zamboniStage.zamboni.dir = dir;
}

function drawVictoryConfetti(now, s){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const count = 80;
  const size = 6 * s;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for(let i=0;i<count;i++){
    const seed = i * 37.2;
    const t = (now * 0.001 + seed) * 0.6;
    const x = (seed * 13 + t * 120) % vw;
    const y = (seed * 29 + t * 180) % vh;
    ctx.fillStyle = `hsla(${(i*27)%360},80%,60%,0.85)`;
    ctx.fillRect(x, y, size, size);
  }

  ctx.restore();
}

function drawShine(inner, s){
  zamboniStage.smoothing += (zamboniStage.targetSmoothing - zamboniStage.smoothing) * 0.06;
  const alpha = 0.18 + zamboniStage.smoothing * 0.32 + zamboniStage.arenaGlow * 0.18;
  zamboniStage.arenaGlow *= 0.94;

  ctx.save();
  roundRect(ctx, inner.x, inner.y, inner.w, inner.h, 18 * s);
  ctx.clip();

  const grad = ctx.createLinearGradient(inner.x, inner.y, inner.x + inner.w, inner.y + inner.h);
  grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
  grad.addColorStop(0.5, `rgba(255,255,255,${alpha*0.35})`);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);

  if(zamboniStage.finished){
    const t = (performance.now() - zamboniStage.celebrationTime) / 1000;
    const sweepX = inner.x + ((t * (180*s)) % (inner.w + (200*s))) - (100*s);
    const sweep = ctx.createLinearGradient(sweepX, inner.y, sweepX + (160*s), inner.y);
    sweep.addColorStop(0, 'rgba(255,255,255,0)');
    sweep.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    sweep.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sweep;
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  }

  ctx.restore();
}

function drawRink(bounds, s){
  const {x,y,w,h} = bounds;
  const pad = Math.min(w,h) * 0.04;
  const inner = {x:x+pad,y:y+pad,w:w-pad*2,h:h-pad*2};

  const cellW = inner.w / zamboniStage.grid.cols;
  const cellH = inner.h / zamboniStage.grid.rows;

  const rOuter = 24 * s;
  const rMid   = 20 * s;
  const rInner = 18 * s;

  ctx.save();
  roundRect(ctx, x, y, w, h, rOuter);
  ctx.fillStyle = '#0e2236';
  ctx.fill();
  roundRect(ctx, x + 6*s, y + 6*s, w - 12*s, h - 12*s, rMid);
  ctx.fillStyle = '#f8fbff';
  ctx.fill();
  ctx.restore();

  const iceGrad = ctx.createLinearGradient(inner.x, inner.y, inner.x, inner.y + inner.h);
  iceGrad.addColorStop(0, '#eefbff');
  iceGrad.addColorStop(1, '#d7f1ff');
  ctx.fillStyle = iceGrad;
  roundRect(ctx, inner.x, inner.y, inner.w, inner.h, rInner);
  ctx.fill();

  ctx.save();
  roundRect(ctx, inner.x, inner.y, inner.w, inner.h, rInner);
  ctx.clip();
  for(let r=0;r<zamboniStage.grid.rows;r++){
    for(let c=0;c<zamboniStage.grid.cols;c++){
      const clean = zamboniStage.grid.cells[idx(c,r)];
      if(clean >= 1) continue;
      const cx = inner.x + c*cellW;
      const cy = inner.y + r*cellH;
      ctx.fillStyle = (c+r)%2===0 ? 'rgba(195,224,240,0.42)' : 'rgba(186,217,236,0.38)';
      ctx.fillRect(cx,cy,cellW+0.6*s,cellH+0.6*s);
    }
  }
  ctx.restore();

  const centerX = inner.x + inner.w/2;
  const centerY = inner.y + inner.h/2;

  ctx.save();
  roundRect(ctx, inner.x, inner.y, inner.w, inner.h, rInner);
  ctx.clip();

  ctx.lineWidth = Math.max(2*s, inner.w * 0.004);
  ctx.strokeStyle = 'rgba(229,57,53,0.9)';
  ctx.beginPath();
  ctx.moveTo(centerX, inner.y);
  ctx.lineTo(centerX, inner.y + inner.h);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(30,136,229,0.85)';
  const blueOffset = inner.w * 0.22;
  ctx.beginPath();
  ctx.moveTo(centerX - blueOffset, inner.y);
  ctx.lineTo(centerX - blueOffset, inner.y + inner.h);
  ctx.moveTo(centerX + blueOffset, inner.y);
  ctx.lineTo(centerX + blueOffset, inner.y + inner.h);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(229,57,53,0.85)';
  ctx.lineWidth = Math.max(2*s, inner.w * 0.005);
  ctx.beginPath();
  ctx.arc(centerX, centerY, inner.w * 0.09, 0, Math.PI*2);
  ctx.stroke();

  ctx.restore();

  drawZamboni(inner, cellW, cellH, s);
  drawShine(inner, s);
}

function drawZamboni(inner, cellW, cellH, s){
  const leftNudge = cellW * 3.2;
  const yLift = cellH * 0.5;

  const zx = inner.x + zamboniStage.zamboni.col * cellW - leftNudge;
  const zy = inner.y + zamboniStage.zamboni.row * cellH - yLift;

  const maxW = cellW * 3.2 * 4;
  const maxH = cellH * 2.1 * 4;

  ctx.save();
  ctx.translate(zx, zy);

  const flipX = (zamboniStage.zamboni.dir === 1) ? -1 : 1;
  ctx.scale(flipX, 1);

  if(zamboniImg.complete && zamboniImg.naturalWidth > 0){
    const iw = zamboniImg.naturalWidth;
    const ih = zamboniImg.naturalHeight;

    const scale = Math.min(maxW / iw, maxH / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;

    const dx = (flipX === -1) ? -drawW : 0;
    ctx.drawImage(zamboniImg, dx, 0, drawW, drawH);
  }else{
    ctx.fillStyle = '#ffc107';
    const dx = (flipX === -1) ? -maxW : 0;
    roundRect(ctx, dx, 0, maxW, maxH * 0.7, 12*s);
    ctx.fill();
  }

  ctx.restore();
}

function roundRect(ctx,x,y,w,h,r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr);
  ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr);
  ctx.arcTo(x,y,x+w,y,rr);
  ctx.closePath();
}

function drawZamboniStage(now){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  ctx.clearRect(0,0,vw,vh);

  const s = getUiScale();

  const dt = zamboniStage.sparkle.lastTime ? (now - zamboniStage.sparkle.lastTime) : 16;
  zamboniStage.sparkle.lastTime = now;

  updateSparkles(dt);
  updateSweep();

  const baseRinkW = 1200;
  const baseRinkH = 720;

  const targetW = baseRinkW * s;
  const targetH = baseRinkH * s;

  const rinkW = Math.min(vw * 0.92, targetW);
  const rinkH = Math.min(vh * 0.78, targetH);

  const rinkX = (vw - rinkW)/2;
  const rinkY = (vh - rinkH)/2;
  const bounds = {x:rinkX,y:rinkY,w:rinkW,h:rinkH};

  drawStands(bounds, now, s);
  drawSparkles(bounds, now, s);
  drawSnow(bounds);
  drawRink(bounds, s);

  if(zamboniStage.finished && !zamboniStage.victoryLapDone){
    drawVictoryLap(bounds, now);
    drawVictoryConfetti(now, s);
  }
}

function hexToRgba(hex, alpha){
  const val = hex.replace('#','');
  const bigint = parseInt(val, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function draw(){
  const now = performance.now();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  ctx.clearRect(0,0,vw,vh);

  if(stageState.index === 0){
    drawOpeningStage(now);
  }
  if(stageState.index === 1){
    drawSnowStage();
  }
  if(stageState.index === 2){
    drawZamboniStage(now);
  }

  requestAnimationFrame(draw);
}

resize();
requestAnimationFrame(draw);
