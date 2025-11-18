const SKY_COLORS = [
  { y: 0, cold: [16, 30, 58], warm: [60, 78, 110] },
  { y: 0.28, cold: [42, 72, 118], warm: [94, 124, 154] },
  { y: 0.55, cold: [88, 118, 148], warm: [156, 154, 160] },
  { y: 0.78, cold: [128, 156, 168], warm: [206, 172, 162] },
  { y: 1, cold: [156, 178, 186], warm: [230, 194, 170] }
];

class MistLayer {
  constructor(p, depth) {
    this.p = p;
    this.depth = depth;
    this.offset = p.random(1000);
  }

  draw(multiplier = 1) {
    const p = this.p;
    const baseY = p.height * (0.5 + this.depth * 0.35);
    const amplitude = p.height * 0.08 * (1 - this.depth);
    p.noStroke();
    const alpha = p.map(1 - this.depth, 0, 1, 40, 120, true);
    p.fill(220, 240, 250, alpha);
    p.beginShape();
    p.vertex(0, p.height);
    for (let x = 0; x <= p.width; x += 18) {
      const noiseVal = p.noise((x + this.offset + p.frameCount * 0.05 * multiplier) * 0.002, this.depth * 4.2);
      const y = baseY - noiseVal * amplitude;
      p.vertex(x, y);
    }
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);
  }
}

function drawSky(p, warmth) {
  const h = p.height;
  for (let i = 0; i < SKY_COLORS.length - 1; i++) {
    const a = SKY_COLORS[i];
    const b = SKY_COLORS[i + 1];
    const start = a.y * h;
    const end = b.y * h;
    for (let y = start; y <= end; y++) {
      const t = (y - start) / Math.max(1, end - start);
      const coldR = p.lerp(a.cold[0], b.cold[0], t);
      const coldG = p.lerp(a.cold[1], b.cold[1], t);
      const coldB = p.lerp(a.cold[2], b.cold[2], t);
      const warmR = p.lerp(a.warm[0], b.warm[0], t);
      const warmG = p.lerp(a.warm[1], b.warm[1], t);
      const warmB = p.lerp(a.warm[2], b.warm[2], t);
      const r = p.lerp(coldR, warmR, warmth);
      const g = p.lerp(coldG, warmG, warmth);
      const bl = p.lerp(coldB, warmB, warmth);
      p.stroke(r, g, bl);
      p.line(0, y, p.width, y);
    }
  }
}

function mountainHeightAt(p, x, depth) {
  const baseY = p.height * (0.62 + depth * 0.18);
  const height = p.height * (0.1 + (1 - depth) * 0.18);
  const noiseVal = p.noise(x * 0.0008 + depth * 3.3, depth * 2.1);
  return baseY - noiseVal * height;
}

function ridgeHeightAt(p, layers, x) {
  let ridge = p.height;
  for (let i = 0; i < layers; i++) {
    const depth = i / layers;
    ridge = Math.min(ridge, mountainHeightAt(p, x, depth));
  }
  return ridge;
}

function drawSun(p, sunPosition, warmth, visibility, ridgeDelta) {
  const sunRadius = p.height * 0.15;
  const { x: sunX, y: sunY } = sunPosition;
  const brightPass = p.map(Math.abs(ridgeDelta), 0, sunRadius * 0.6, 1.4, 1, true);
  const glow = p.lerp(120, 240, warmth) * (0.45 + 0.65 * visibility) * brightPass;
  const sunCoreCool = [242, 210, 170];
  const sunCoreWarm = [255, 170, 80];
  const sunHaloCool = [242, 196, 150];
  const sunHaloWarm = [255, 160, 70];
  p.noStroke();
  for (let i = 6; i >= 1; i--) {
    const radius = sunRadius * (1 + i * 0.28);
    const alpha = glow / (i * 1.08);
    const haloR = p.lerp(sunHaloCool[0], sunHaloWarm[0], warmth);
    const haloG = p.lerp(sunHaloCool[1], sunHaloWarm[1], warmth);
    const haloB = p.lerp(sunHaloCool[2], sunHaloWarm[2], warmth);
    p.fill(haloR, haloG, haloB, alpha);
    p.ellipse(sunX, sunY, radius * 2);
  }
  const coreR = p.lerp(sunCoreCool[0], sunCoreWarm[0], warmth);
  const coreG = p.lerp(sunCoreCool[1], sunCoreWarm[1], warmth);
  const coreB = p.lerp(sunCoreCool[2], sunCoreWarm[2], warmth);
  p.fill(coreR, coreG, coreB, 245 + 10 * visibility);
  p.ellipse(sunX, sunY, sunRadius * 1.35);
}

function drawMountains(p, layers, warmth) {
  for (let i = 0; i < layers; i++) {
    const depth = i / layers;
    const coolColor = [28 + depth * 88, 58 + depth * 86, 96 + depth * 74];
    const warmColor = [70 + depth * 112, 92 + depth * 102, 88 + depth * 76];
    const col = p.color(
      p.lerp(coolColor[0], warmColor[0], warmth),
      p.lerp(coolColor[1], warmColor[1], warmth),
      p.lerp(coolColor[2], warmColor[2], warmth),
      255
    );
    p.fill(col);
    p.noStroke();
    p.beginShape();
    p.vertex(0, p.height);
    for (let x = 0; x <= p.width; x += 18) {
      const y = mountainHeightAt(p, x, depth);
      p.vertex(x, y);
    }
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);
  }
}

export function createMountainScene(p) {
  let mistLayers = [];
  let speedMultiplier = 1;
  let breathePulse = 0;
  const startDelay = 1.5;
  const cycleDuration = 30; // seconds for a full left-to-right sunset arc

  function resize() {
    const count = 4;
    mistLayers = Array.from({ length: count }, (_, i) => new MistLayer(p, i / count));
  }

  return {
    id: 'mountain',
    name: 'Aube sur les sommets',
    description: 'Lever de soleil doux sur les montagnes',
    enter() {
      breathePulse = 1;
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      breathePulse = 1;
    },
    draw() {
      const seconds = p.millis() * 0.001 * speedMultiplier;
      const rawProgress = (seconds - startDelay) / cycleDuration;
      const loopProgress = ((rawProgress % 1) + 1) % 1; // wrap safely for negatives
      const eased = 0.5 - 0.5 * Math.cos(Math.min(1, loopProgress) * Math.PI);
      const arcRise = Math.sin(eased * Math.PI);

      const baseWarmth = p.constrain(p.map(eased, 0, 0.65, 0.25, 1), 0.25, 1);
      const sunRadius = p.height * 0.15;
      const sunPathY = p.height * 0.64;
      const sunLift = p.height * 0.3;
      const sunY = seconds < startDelay ? p.height * 0.76 : sunPathY - arcRise * sunLift;
      const sunX = p.lerp(-sunRadius * 0.8, p.width + sunRadius * 0.8, eased);
      const ridgeHeight = ridgeHeightAt(p, 5, sunX);
      const delta = sunY - ridgeHeight;
      const visibilityBase = seconds < startDelay ? 0 : p.map(delta, -sunRadius, sunRadius, 1, 0, true);
      const intensityRamp = p.map(eased, 0, 0.75, 0.65, 1.15, true);
      const sunVisibility = p.constrain(visibilityBase * intensityRamp, 0, 1);
      const warmthLift = p.map(sunVisibility, 0.35, 0.75, 0, 0.2, true);
      const warmth = p.constrain(baseWarmth + warmthLift, 0.25, 1);
      const darkness = Math.pow(1 - sunVisibility, 1.25);

      drawSky(p, warmth);
      drawSun(p, { x: sunX, y: sunY }, warmth, sunVisibility, delta);
      drawMountains(p, 5, warmth);

      mistLayers.forEach(layer => layer.draw(speedMultiplier));

      if (breathePulse > 0.01) {
        const alpha = p.map(breathePulse, 0, 1, 0, 90, true);
        p.noStroke();
        p.fill(255, 220, 180, alpha);
        p.rect(0, 0, p.width, p.height);
        breathePulse *= 0.9;
      }

      if (darkness > 0.01) {
        const nightTone = p.lerpColor(p.color(12, 18, 26, 0), p.color(6, 10, 14, 220), darkness);
        p.noStroke();
        p.fill(nightTone);
        p.rect(0, 0, p.width, p.height);
      }

      p.noStroke();
      p.fill(28, 52, 60, 180);
      p.rect(0, p.height * 0.9, p.width, p.height * 0.12);
    }
  };
}
