const FLASH_DURATION = 1600;
const GRADIENT_STOPS = [
  { y: 0.0, color: [12, 16, 30] },
  { y: 0.35, color: [17, 24, 41] },
  { y: 1.0, color: [6, 8, 16] }
];

class Drop {
  constructor(p, spawnAnywhere = true) {
    this.p = p;
    this.reset(spawnAnywhere);
  }

  reset(spawnAnywhere = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = spawnAnywhere ? p.random(-p.height, p.height) : p.random(-p.height * 0.2, 0);
    this.depth = p.random(0.3, 1);
    this.len = p.lerp(8, 18, this.depth);
    this.speed = p.lerp(2.4, 7.2, this.depth);
    this.weight = p.lerp(0.8, 2.2, this.depth);
    this.alpha = p.lerp(90, 190, this.depth);
  }

  update() {
    const p = this.p;
    this.y += this.speed;
    this.x += p.sin((p.frameCount + this.y) * 0.01) * 0.6 * this.depth;
    if (this.y - this.len > p.height) {
      this.reset(true);
      this.y -= p.height;
    }
  }

  draw() {
    const p = this.p;
    p.strokeWeight(this.weight);
    p.stroke(164, 183, 210, this.alpha);
    p.line(this.x, this.y, this.x, this.y - this.len);
  }
}

export function createRainScene(p) {
  const drops = [];
  let flashStart = 0;
  let targetCount = 0;

  function ensureDrops() {
    const desired = Math.floor((p.width * p.height) * 0.00055);
    targetCount = desired;
    while (drops.length < desired) drops.push(new Drop(p, true));
    if (drops.length > desired) drops.length = desired;
  }

  function drawGradient() {
    const h = p.height;
    for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
      const a = GRADIENT_STOPS[i];
      const b = GRADIENT_STOPS[i + 1];
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
    name: 'Pluie nocturne',
    description: 'Gouttes fines et reflets dans la nuit',
    enter() {
      flashStart = p.millis();
    },
    resize() {
      ensureDrops();
    },
    draw() {
      if (drops.length !== targetCount) ensureDrops();
      drawGradient();

      drops.forEach(d => d.update());
      drops.forEach(d => d.draw());

      const elapsed = p.millis() - flashStart;
      if (elapsed < FLASH_DURATION) {
        const intensity = p.map(Math.pow(1 - elapsed / FLASH_DURATION, 3), 0, 1, 0, 120, true);
        p.noStroke();
        p.fill(180, 200, 255, intensity);
        p.rect(0, 0, p.width, p.height);
      }

      const horizon = p.height * 0.82;
      p.noStroke();
      p.fill(10, 12, 24, 180);
      p.rect(0, horizon, p.width, p.height - horizon);
    }
  };
}
