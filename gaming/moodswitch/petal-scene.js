const BACK_COLORS = [
  { y: 0, color: [18, 10, 26] },
  { y: 0.45, color: [46, 20, 44] },
  { y: 1, color: [80, 34, 52] }
];

class Petal {
  constructor(p, spawnAnywhere = true) {
    this.p = p;
    this.reset(spawnAnywhere);
  }

  reset(spawnAnywhere = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = spawnAnywhere ? p.random(-p.height, p.height) : -p.random(p.height * 0.2);
    this.size = p.random(26, 48);
    this.vx = p.random(-0.35, 0.35);
    this.vy = p.random(0.35, 0.9);
    this.spin = p.random(-0.02, 0.02);
    this.angle = p.random(p.TWO_PI);
    this.life = 0;
    this.alpha = p.random(90, 170);
    this.wobble = p.random(0.5, 1.2);
    this.offset = p.random(p.TWO_PI);
  }

  update() {
    const p = this.p;
    this.life += 1;
    this.x += this.vx + Math.sin(this.offset + this.life * 0.025) * this.wobble;
    this.y += this.vy;
    this.angle += this.spin;
    if (this.y > p.height + this.size) this.reset();
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    const base = this.size;
    p.noStroke();
    p.fill(236, 184, 210, this.alpha);
    p.beginShape();
    p.vertex(0, 0);
    p.bezierVertex(base * 0.7, -base * 0.5, base * 0.8, base * 0.3, 0, base);
    p.bezierVertex(-base * 0.8, base * 0.3, -base * 0.7, -base * 0.5, 0, 0);
    p.endShape(p.CLOSE);

    p.fill(255, 220, 236, this.alpha * 0.6);
    p.beginShape();
    p.vertex(0, base * 0.2);
    p.bezierVertex(base * 0.4, 0, base * 0.3, base * 0.6, 0, base * 0.75);
    p.bezierVertex(-base * 0.3, base * 0.6, -base * 0.4, 0, 0, base * 0.2);
    p.endShape(p.CLOSE);
    p.pop();
  }
}

export function createPetalScene(p) {
  const petals = [];
  let highlightStart = 0;
  let targetCount = 0;

  function ensurePetals() {
    const desired = Math.floor((p.width * p.height) * 0.00018);
    targetCount = desired;
    while (petals.length < desired) petals.push(new Petal(p, true));
    if (petals.length > desired) petals.length = desired;
  }

  function drawBackground() {
    const h = p.height;
    for (let i = 0; i < BACK_COLORS.length - 1; i++) {
      const a = BACK_COLORS[i];
      const b = BACK_COLORS[i + 1];
      const yStart = a.y * h;
      const yEnd = b.y * h;
      for (let y = yStart; y < yEnd; y++) {
        const t = (y - yStart) / Math.max(1, yEnd - yStart);
        const r = p.lerp(a.color[0], b.color[0], t);
        const g = p.lerp(a.color[1], b.color[1], t);
        const bl = p.lerp(a.color[2], b.color[2], t);
        p.stroke(r, g, bl);
        p.line(0, y, p.width, y);
      }
    }
  }

  return {
    name: 'Pétales en suspens',
    description: 'Souffle pastel et souvenirs flottants',
    enter() {
      highlightStart = p.millis();
    },
    resize() {
      ensurePetals();
    },
    draw() {
      if (petals.length !== targetCount) ensurePetals();
      drawBackground();

      const focusX = p.width * 0.35 + Math.sin(p.millis() * 0.0004) * p.width * 0.08;
      const focusY = p.height * 0.45 + Math.cos(p.millis() * 0.0006) * p.height * 0.06;
      for (let i = 6; i >= 0; i--) {
        const radius = (i + 1) * 80;
        const alpha = p.map(i, 6, 0, 10, 80);
        p.noStroke();
        p.fill(150, 80, 120, alpha);
        p.ellipse(focusX, focusY, radius * 1.3, radius);
      }

      petals.forEach(pt => pt.update());
      petals.forEach(pt => pt.draw());

      const elapsed = p.millis() - highlightStart;
      const glow = p.constrain(1 - elapsed / 2000, 0, 1);
      if (glow > 0) {
        p.fill(255, 200, 220, 80 * glow);
        p.rect(0, 0, p.width, p.height);
      }

      p.noStroke();
      const mistCount = Math.min(18, Math.floor(targetCount * 0.05));
      for (let i = 0; i < mistCount; i++) {
        const seed = i * 519.2;
        const x = p.noise(seed, p.millis() * 0.0006) * p.width;
        const y = p.noise(seed * 1.9, p.millis() * 0.0004) * p.height;
        const w = p.lerp(120, 260, p.noise(seed * 2.3));
        const h = p.lerp(40, 120, p.noise(seed * 3.1));
        p.fill(120, 60, 100, 12);
        p.ellipse(x, y, w, h);
      }
    }
  };
}
