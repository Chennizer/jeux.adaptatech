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
    this.baseSpeed = p.lerp(2.4, 7.2, this.depth);
    this.weight = p.lerp(0.8, 2.2, this.depth);
    this.alpha = p.lerp(90, 190, this.depth);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    const drift = p.sin((p.frameCount + this.y) * 0.01) * 0.6 * this.depth;
    this.y += this.baseSpeed * speedMultiplier;
    this.x += drift * speedMultiplier;
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

class RainSparkle {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height * 0.6);
    this.radius = p.random(2, 5);
    this.life = p.random(70, 120);
    this.vx = p.random(-0.25, 0.25);
    this.vy = p.random(0.15, 0.4);
    this.alpha = p.random(130, 200);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    this.x += this.vx * speedMultiplier;
    this.y += this.vy * speedMultiplier;
    this.life -= speedMultiplier;
    this.alpha *= 0.97;
    if (this.y > p.height * 0.9) {
      this.alpha *= 0.92;
    }
    return this.life > 0 && this.alpha > 10;
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(180, 210, 255, this.alpha);
    p.ellipse(this.x, this.y, this.radius * 2, this.radius * 1.2);
  }
}

export function createRainScene(p) {
  const drops = [];
  let flashStart = 0;
  let targetCount = 0;
  let speedMultiplier = 1;
  let sparkles = [];

  function ensureDrops() {
    const desired = Math.floor((p.width * p.height) * 0.00055);
    targetCount = desired;
    while (drops.length < desired) drops.push(new Drop(p, true));
    if (drops.length > desired) drops.length = desired;
  }

  function spawnSparkles() {
    sparkles = [];
    const count = Math.floor(p.width * p.height * 0.00003) + 18;
    for (let i = 0; i < count; i++) {
      sparkles.push(new RainSparkle(p));
    }
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
      spawnSparkles();
    },
    resize() {
      ensureDrops();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    draw() {
      if (drops.length !== targetCount) ensureDrops();
      drawGradient();

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sparkle = sparkles[i];
        const alive = sparkle.update(speedMultiplier);
        sparkle.draw();
        if (!alive) sparkles.splice(i, 1);
      }

      drops.forEach(d => d.update(speedMultiplier));
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
