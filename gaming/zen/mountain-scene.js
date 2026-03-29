const SKY_COLORS = [
  { y: 0, color: [18, 34, 52] },
  { y: 0.5, color: [46, 80, 120] },
  { y: 1, color: [128, 164, 180] }
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

function drawSky(p) {
  const h = p.height;
  for (let i = 0; i < SKY_COLORS.length - 1; i++) {
    const a = SKY_COLORS[i];
    const b = SKY_COLORS[i + 1];
    const start = a.y * h;
    const end = b.y * h;
    for (let y = start; y <= end; y++) {
      const t = (y - start) / Math.max(1, end - start);
      const r = p.lerp(a.color[0], b.color[0], t);
      const g = p.lerp(a.color[1], b.color[1], t);
      const bl = p.lerp(a.color[2], b.color[2], t);
      p.stroke(r, g, bl);
      p.line(0, y, p.width, y);
    }
  }
}

function drawMountains(p, layers, sunHeight, multiplier) {
  for (let i = 0; i < layers; i++) {
    const depth = i / layers;
    const baseY = p.height * (0.35 + depth * 0.45);
    const height = p.height * (0.25 + (1 - depth) * 0.35);
    const col = p.color(30 + depth * 90, 60 + depth * 80, 90 + depth * 60, 220 - depth * 120);
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
  const sunY = p.lerp(p.height * 0.75, p.height * 0.28, sunHeight);
  const sunX = p.width * 0.5;
  const glow = p.lerp(50, 160, sunHeight);
  p.noStroke();
  for (let i = 5; i >= 1; i--) {
    const radius = sunRadius * (1 + i * 0.28);
    const alpha = glow / (i * 1.6);
    p.fill(255, 220, 160, alpha);
    p.ellipse(sunX, sunY, radius * 2);
  }
  p.fill(255, 230, 190, 220);
  p.ellipse(sunX, sunY, sunRadius * 1.4);
}

export function createMountainScene(p) {
  let mistLayers = [];
  let sunHeight = 0;
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
      drawSky(p);

      sunHeight = (Math.sin(p.millis() * 0.00005 * speedMultiplier) + 1) * 0.5;
      drawMountains(p, 5, sunHeight, speedMultiplier);

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
