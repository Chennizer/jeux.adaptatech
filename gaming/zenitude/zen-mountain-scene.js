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

function drawMountains(p, layers, sunPosition, warmth, multiplier) {
  for (let i = 0; i < layers; i++) {
    const depth = i / layers;
    const baseY = p.height * (0.35 + depth * 0.45);
    const height = p.height * (0.25 + (1 - depth) * 0.35);
    const coolColor = [28 + depth * 88, 58 + depth * 86, 96 + depth * 74];
    const warmColor = [70 + depth * 112, 92 + depth * 102, 88 + depth * 76];
    const col = p.color(
      p.lerp(coolColor[0], warmColor[0], warmth),
      p.lerp(coolColor[1], warmColor[1], warmth),
      p.lerp(coolColor[2], warmColor[2], warmth),
      220 - depth * 120
    );
    p.fill(col);
    p.noStroke();
    p.beginShape();
    p.vertex(0, p.height);
    for (let x = 0; x <= p.width; x += 18) {
      const noiseVal = p.noise(x * 0.0008 + depth * 3.3, depth * 2.1);
      const y = baseY - noiseVal * height;
      p.vertex(x, y);
    }
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);
  }

  const sunRadius = p.height * 0.15;
  const { x: sunX, y: sunY } = sunPosition;
  const glow = p.lerp(90, 200, warmth);
  const sunCoreCool = [240, 220, 200];
  const sunCoreWarm = [255, 215, 150];
  const sunHaloCool = [230, 210, 190];
  const sunHaloWarm = [255, 200, 140];
  p.noStroke();
  for (let i = 5; i >= 1; i--) {
    const radius = sunRadius * (1 + i * 0.28);
    const alpha = glow / (i * 1.15);
    const haloR = p.lerp(sunHaloCool[0], sunHaloWarm[0], warmth);
    const haloG = p.lerp(sunHaloCool[1], sunHaloWarm[1], warmth);
    const haloB = p.lerp(sunHaloCool[2], sunHaloWarm[2], warmth);
    p.fill(haloR, haloG, haloB, alpha);
    p.ellipse(sunX, sunY, radius * 2);
  }
  const coreR = p.lerp(sunCoreCool[0], sunCoreWarm[0], warmth);
  const coreG = p.lerp(sunCoreCool[1], sunCoreWarm[1], warmth);
  const coreB = p.lerp(sunCoreCool[2], sunCoreWarm[2], warmth);
  p.fill(coreR, coreG, coreB, 250);
  p.ellipse(sunX, sunY, sunRadius * 1.45);
}

export function createMountainScene(p) {
  let mistLayers = [];
  let speedMultiplier = 1;
  let breathePulse = 0;

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
      const time = p.millis() * 0.00003 * speedMultiplier;
      const swing = (Math.sin(time) + 1) * 0.5; // left → right → left
      const arcHeight = 1 - Math.pow(2 * swing - 1, 2); // highest at center of swing
      const warmth = swing;

      const sunY = p.lerp(p.height * 0.8, p.height * 0.24, arcHeight);
      const sunX = p.lerp(p.width * 0.35, p.width * 0.85, swing);

      drawSky(p, warmth);
      drawMountains(p, 5, { x: sunX, y: sunY }, warmth, speedMultiplier);

      mistLayers.forEach(layer => layer.draw(speedMultiplier));

      if (breathePulse > 0.01) {
        const alpha = p.map(breathePulse, 0, 1, 0, 90, true);
        p.noStroke();
        p.fill(255, 220, 180, alpha);
        p.rect(0, 0, p.width, p.height);
        breathePulse *= 0.9;
      }

      p.noStroke();
      p.fill(28, 52, 60, 180);
      p.rect(0, p.height * 0.9, p.width, p.height * 0.12);
    }
  };
}
