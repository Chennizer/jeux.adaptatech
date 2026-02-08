const canvas = document.getElementById('olympicCanvas');
const ctx = canvas.getContext('2d');
const menuOverlay = document.getElementById('menuOverlay');
const startButton = document.getElementById('startButton');

const BASE_W = 1920;
const BASE_H = 1080;

function getUiScale(){
  return Math.max(0.55, Math.min(1.6, Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)));
}

const olympicColors = ['#1e88e5', '#fbc02d', '#000000', '#43a047', '#e53935'];

const stage = {
  name: 'menu',
  startTime: 0,
};

const opening = {
  rings: [],
  fireworks: [],
  presses: 0,
  completed: false,
  completeAt: 0,
};

const snow = {
  presses: 0,
  particles: [],
  completed: false,
  completeAt: 0,
};

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

const zamboniState = {
  finished:false,
  isAnimating:false,
  animationStart:0,
  smoothing:0,
  targetSmoothing:0,
  currentSweepRow:0,
  lastCleanCol:0,
  celebrationTime:0,
  victoryPlayed:false,
  victoryLapDone:false,
};

const grid = {
  cols:28,
  rows:5,
  cells:[],
  cleaned:0,
  total:0,
};

const zamboni = {
  col:1,
  row:0,
  dir:1,
  lineStride:1,
};

const sweep = {
  startCol:1,
  endCol:26,
  durationMs:4500,
  progress:0,
};

const arena = { glow:0 };

const sparkle = {
  flakes:[],
  stars:[],
  orbs:[],
  lastTime:0,
};

function resize(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(stage.name === 'zamboni'){
    buildGrid();
  }
}
window.addEventListener('resize', resize);

function setStage(name){
  stage.name = name;
  stage.startTime = performance.now();

  if(name === 'opening'){
    opening.rings = [];
    opening.fireworks = [];
    opening.presses = 0;
    opening.completed = false;
    opening.completeAt = 0;
  }

  if(name === 'snow'){
    snow.presses = 0;
    snow.particles = [];
    snow.completed = false;
    snow.completeAt = 0;
  }

  if(name === 'zamboni'){
    restartZamboni();
  }
}

function startGame(){
  menuOverlay.style.display = 'none';
  setStage('opening');
}

startButton.addEventListener('click', startGame);

function unlockAudio(){
  if(audioUnlocked) return;
  audioUnlocked = true;
  backgroundMusic.play().catch(() => {});
}

function handleSwitchPress(fromSpace=false){
  if(stage.name === 'menu'){
    startGame();
    return;
  }

  if(stage.name === 'opening'){
    triggerOpeningPress();
    return;
  }

  if(stage.name === 'snow'){
    triggerSnowPress();
    return;
  }

  if(stage.name === 'zamboni'){
    unlockAudio();
    handleZamboniPress(fromSpace);
  }
}

function onKey(e){
  if(e.code === 'Space'){
    e.preventDefault();
    handleSwitchPress(true);
  }
}

window.addEventListener('keydown', onKey, {passive:false});
window.addEventListener('pointerdown', () => handleSwitchPress(false));

function triggerOpeningPress(){
  if(opening.completed) return;
  if(opening.presses >= 5) return;

  const ringIndex = opening.presses;
  opening.presses += 1;

  const ring = {
    index: ringIndex,
    reveal: 0,
    revealStart: performance.now(),
  };

  opening.rings.push(ring);
  const ringCenter = getRingCenters()[ringIndex];
  spawnFirework(ringCenter.x, ringCenter.y, olympicColors[ringIndex]);

  if(opening.presses === 5){
    opening.completed = true;
    opening.completeAt = performance.now();
    for(let i=0;i<6;i++){
      const offset = (i - 2.5) * 80;
      spawnFirework(ringCenter.x + offset, ringCenter.y - 60, olympicColors[i % olympicColors.length]);
    }
  }
}

function triggerSnowPress(){
  if(snow.completed) return;
  if(snow.presses >= 5) return;

  snow.presses += 1;
  emitSnowBurst();

  if(snow.presses === 5){
    snow.completed = true;
    snow.completeAt = performance.now();
  }
}

function getRingCenters(){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ringSize = Math.min(vw, vh) * 0.16;
  const gap = ringSize * 0.95;
  const centerX = vw * 0.5;
  const centerY = vh * 0.45;

  return [
    {x: centerX - gap, y: centerY},
    {x: centerX, y: centerY},
    {x: centerX + gap, y: centerY},
    {x: centerX - gap * 0.5, y: centerY + ringSize * 0.55},
    {x: centerX + gap * 0.5, y: centerY + ringSize * 0.55},
  ];
}

function spawnFirework(x, y, color){
  const count = 26;
  for(let i=0;i<count;i++){
    const angle = (Math.PI * 2 * i) / count;
    const speed = 1.5 + Math.random() * 2.2;
    opening.fireworks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color,
    });
  }
}

function updateFireworks(dt){
  opening.fireworks.forEach(fx => {
    fx.x += fx.vx * dt * 0.06;
    fx.y += fx.vy * dt * 0.06;
    fx.vy += 0.01 * dt * 0.06;
    fx.life -= dt * 0.0006;
  });
  opening.fireworks = opening.fireworks.filter(fx => fx.life > 0);
}

function emitSnowBurst(){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const origin = {x: vw * 0.12, y: vh * 0.78};
  for(let i=0;i<40;i++){
    const angle = (-Math.PI / 4) + Math.random() * (Math.PI / 5);
    const speed = 1.2 + Math.random() * 2.2;
    snow.particles.push({
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.1,
      life: 1,
      size: 2 + Math.random() * 3,
    });
  }
}

function updateSnowParticles(dt){
  snow.particles.forEach(p => {
    p.x += p.vx * dt * 0.08;
    p.y += p.vy * dt * 0.08;
    p.vy += 0.015 * dt * 0.08;
    p.life -= dt * 0.0007;
  });
  snow.particles = snow.particles.filter(p => p.life > 0);
}

function buildGrid(){
  const {cols,rows} = grid;
  grid.cells = new Array(cols*rows).fill(0);
  grid.cleaned = 0;
  grid.total = cols*rows;

  zamboni.col = 1;
  zamboni.row = 0;
  zamboni.dir = 1;

  zamboniState.currentSweepRow = zamboni.row;
  sweep.progress = 0;

  buildSparkles();
  zamboniState.targetSmoothing = 0;
}

function restartZamboni(){
  zamboniState.finished = false;
  zamboniState.isAnimating = false;
  zamboniState.animationStart = 0;
  zamboniState.smoothing = 0;
  zamboniState.targetSmoothing = 0;
  zamboniState.currentSweepRow = 0;
  zamboniState.victoryPlayed = false;
  zamboniState.victoryLapDone = false;
  arena.glow = 0;

  buildSparkles();
  buildGrid();

  try { zamboniMoveSound.pause(); } catch(e){}
  zamboniMoveSound.currentTime = 0;
}

function idx(c,r){ return r*grid.cols + c; }

function cleanCell(c,r){
  if(c < 0 || r < 0 || c >= grid.cols || r >= grid.rows) return;
  const i = idx(c,r);
  if(grid.cells[i] < 1){
    grid.cells[i] = 1;
    grid.cleaned += 1;
  }
}

function updateProgress(){
  zamboniState.targetSmoothing = grid.cleaned / grid.total;
  if(!zamboniState.finished && grid.cleaned >= grid.total){
    triggerCelebration();
  }
}

function cleanLine(row){
  for(let c = 0; c < grid.cols; c++) cleanCell(c,row);
  updateProgress();
}

function cleanSegment(row, fromCol, toCol){
  const start = Math.round(Math.min(fromCol, toCol));
  const end = Math.round(Math.max(fromCol, toCol));
  for(let c = start; c <= end; c++) cleanCell(c,row);
  updateProgress();
}

function handleZamboniPress(fromSpace=false){
  if(zamboniState.finished || zamboniState.isAnimating) return;
  startSweep(fromSpace);
}

function startSweep(fromSpace=false){
  zamboniState.isAnimating = true;
  zamboniState.animationStart = performance.now();
  zamboniState.currentSweepRow = zamboni.row;

  sweep.startCol = zamboni.dir === 1 ? 1 : grid.cols - 2;
  sweep.endCol   = zamboni.dir === 1 ? grid.cols - 2 : 1;
  sweep.progress = 0;

  zamboniState.lastCleanCol = sweep.startCol;

  if(fromSpace){
    try { zamboniMoveSound.pause(); } catch(e){}
    zamboniMoveSound.currentTime = 0;
    zamboniMoveSound.play().catch(() => {});
  }
}

function completeSweep(){
  cleanLine(zamboniState.currentSweepRow);

  zamboni.row += zamboni.lineStride;
  if(zamboni.row >= grid.rows) zamboni.row = 0;

  zamboni.dir *= -1;

  zamboniState.isAnimating = false;
  sweep.progress = 0;
  zamboniState.lastCleanCol = zamboni.col;

  arena.glow = Math.min(1, arena.glow + 0.18);
}

function triggerCelebration(){
  zamboniState.finished = true;
  zamboniState.celebrationTime = performance.now();
  zamboniState.victoryLapDone = false;

  if(!zamboniState.victoryPlayed){
    zamboniState.victoryPlayed = true;
    victorySound.currentTime = 0;
    victorySound.play().catch(() => {});
  }
}

function updateSweep(){
  if(!zamboniState.isAnimating) return;

  const now = performance.now();
  const elapsed = now - zamboniState.animationStart;

  sweep.progress = Math.min(1, elapsed / sweep.durationMs);

  const col = sweep.startCol + (sweep.endCol - sweep.startCol) * sweep.progress;
  zamboni.col = col;
  zamboni.row = zamboniState.currentSweepRow;

  cleanSegment(zamboniState.currentSweepRow, zamboniState.lastCleanCol, col);
  zamboniState.lastCleanCol = col;

  if(sweep.progress >= 1) completeSweep();
}

function buildSparkles(){
  const s = getUiScale();

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
  const t = (now - zamboniState.celebrationTime) / 1000;
  const speed = 0.08;
  const perimeter = 2 * (w + h);
  const lapTime = 1 / speed;

  if(t >= lapTime){
    zamboniState.victoryLapDone = true;
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

  zamboni.col = (px - x) / (w / grid.cols);
  zamboni.row = (py - y) / (h / grid.rows);
  zamboni.dir = dir;
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
  zamboniState.smoothing += (zamboniState.targetSmoothing - zamboniState.smoothing) * 0.06;
  const alpha = 0.18 + zamboniState.smoothing * 0.32 + arena.glow * 0.18;
  arena.glow *= 0.94;

  ctx.save();
  roundRect(ctx, inner.x, inner.y, inner.w, inner.h, 18 * s);
  ctx.clip();

  const grad = ctx.createLinearGradient(inner.x, inner.y, inner.x + inner.w, inner.y + inner.h);
  grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
  grad.addColorStop(0.5, `rgba(255,255,255,${alpha*0.35})`);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);

  if(zamboniState.finished){
    const t = (performance.now() - zamboniState.celebrationTime) / 1000;
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

function drawZamboni(inner, cellW, cellH, s){
  const leftNudge = cellW * 3.2;
  const yLift = cellH * 0.5;

  const zx = inner.x + zamboni.col * cellW - leftNudge;
  const zy = inner.y + zamboni.row * cellH - yLift;

  const maxW = cellW * 3.2 * 4;
  const maxH = cellH * 2.1 * 4;

  ctx.save();
  ctx.translate(zx, zy);

  const flipX = (zamboni.dir === 1) ? -1 : 1;
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

function drawRink(bounds, s){
  const {x,y,w,h} = bounds;
  const pad = Math.min(w,h) * 0.04;
  const inner = {x:x+pad,y:y+pad,w:w-pad*2,h:h-pad*2};

  const cellW = inner.w / grid.cols;
  const cellH = inner.h / grid.rows;

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
  for(let r=0;r<grid.rows;r++){
    for(let c=0;c<grid.cols;c++){
      const clean = grid.cells[idx(c,r)];
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

function drawOpeningScene(now, dt){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gradient = ctx.createLinearGradient(0,0,0,vh);
  gradient.addColorStop(0, '#050b16');
  gradient.addColorStop(1, '#0b2545');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,vw,vh);

  updateFireworks(dt);

  opening.fireworks.forEach(fx => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, fx.life);
    ctx.fillStyle = fx.color;
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });

  const ringCenters = getRingCenters();
  const ringRadius = Math.min(vw, vh) * 0.08;
  const ringWidth = ringRadius * 0.15;

  opening.rings.forEach(ring => {
    ring.reveal = Math.min(1, (now - ring.revealStart) / 600);
    const center = ringCenters[ring.index];
    ctx.strokeStyle = olympicColors[ring.index];
    ctx.lineWidth = ringWidth;
    ctx.beginPath();
    ctx.arc(center.x, center.y, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ring.reveal);
    ctx.stroke();
  });

  if(opening.completed){
    const pulse = 0.5 + Math.sin((now - opening.completeAt) * 0.005) * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${0.15 + pulse * 0.15})`;
    ctx.fillRect(0,0,vw,vh);

    if(now - opening.completeAt > 2200){
      setStage('snow');
    }
  }

  drawSceneLabel('Cérémonie d\'ouverture', 'Opening Ceremony');
  drawProgressDots(opening.presses, 5);
}

function drawSnowScene(now, dt){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gradient = ctx.createLinearGradient(0,0,0,vh);
  gradient.addColorStop(0, '#cfe9ff');
  gradient.addColorStop(1, '#ffffff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,vw,vh);

  updateSnowParticles(dt);

  const mountainLevel = snow.presses / 5;
  const peakHeight = vh * (0.2 + mountainLevel * 0.35);
  ctx.fillStyle = '#e8f3ff';
  ctx.beginPath();
  ctx.moveTo(0, vh);
  ctx.lineTo(vw * 0.25, vh - peakHeight * 0.6);
  ctx.lineTo(vw * 0.5, vh - peakHeight);
  ctx.lineTo(vw * 0.75, vh - peakHeight * 0.65);
  ctx.lineTo(vw, vh - peakHeight * 0.4);
  ctx.lineTo(vw, vh);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#d8e7f5';
  ctx.beginPath();
  ctx.moveTo(0, vh);
  ctx.lineTo(vw * 0.3, vh - peakHeight * 0.45);
  ctx.lineTo(vw * 0.55, vh - peakHeight * 0.8);
  ctx.lineTo(vw * 0.8, vh - peakHeight * 0.55);
  ctx.lineTo(vw, vh - peakHeight * 0.3);
  ctx.lineTo(vw, vh);
  ctx.closePath();
  ctx.fill();

  const cannonX = vw * 0.08;
  const cannonY = vh * 0.78;
  const cannonW = vw * 0.08;
  const cannonH = vh * 0.06;
  ctx.fillStyle = '#415a77';
  ctx.fillRect(cannonX, cannonY, cannonW, cannonH);
  ctx.fillStyle = '#2b3a50';
  ctx.fillRect(cannonX + cannonW * 0.3, cannonY - cannonH * 0.7, cannonW * 0.6, cannonH * 0.7);

  snow.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });

  if(snow.completed && now - snow.completeAt > 1800){
    setStage('zamboni');
  }

  drawSceneLabel('Canon à neige', 'Snow Cannon');
  drawProgressDots(snow.presses, 5);
}

function drawZamboniScene(now, dt){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  ctx.clearRect(0,0,vw,vh);

  const s = getUiScale();
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

  if(zamboniState.finished && !zamboniState.victoryLapDone){
    drawVictoryLap(bounds, now);
    drawVictoryConfetti(now, s);
  }

  drawSceneLabel('Zamboni', 'Zamboni');
}

function drawSceneLabel(fr, en){
  ctx.save();
  ctx.font = `600 ${Math.max(16, window.innerWidth * 0.015)}px "Segoe UI", sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(fr, 24, 42);
  ctx.font = `400 ${Math.max(12, window.innerWidth * 0.012)}px "Segoe UI", sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(en, 24, 64);
  ctx.restore();
}

function drawProgressDots(count, total){
  const baseX = 24;
  const baseY = 90;
  const radius = 6;
  const gap = 20;
  for(let i=0;i<total;i++){
    ctx.beginPath();
    ctx.fillStyle = i < count ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)';
    ctx.arc(baseX + i * gap, baseY, radius, 0, Math.PI*2);
    ctx.fill();
  }
}

function draw(){
  const now = performance.now();
  const dt = sparkle.lastTime ? (now - sparkle.lastTime) : 16;
  sparkle.lastTime = now;

  if(stage.name === 'opening'){
    drawOpeningScene(now, dt);
  }else if(stage.name === 'snow'){
    drawSnowScene(now, dt);
  }else if(stage.name === 'zamboni'){
    drawZamboniScene(now, dt);
  }

  requestAnimationFrame(draw);
}

resize();
setStage('menu');
draw();
