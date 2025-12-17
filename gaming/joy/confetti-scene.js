const FLASH_DURATION = 1600;
const INTENSITY_MULTIPLIER = 3;
const GRADIENT_STOPS = [
  { y: 0.0, color: [255, 244, 214] },
  { y: 0.35, color: [255, 207, 227] },
  { y: 1.0, color: [235, 241, 255] }
];

const CONFETTI_COLORS = [
  [255, 138, 128],
  [255, 209, 102],
  [137, 220, 235],
  [156, 236, 180],
  [255, 182, 242]
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
    this.len = p.lerp(8, 16, this.depth);
    this.baseSpeed = p.lerp(2.1, 6.4, this.depth);
    this.width = p.lerp(4, 10, this.depth);
    this.alpha = p.lerp(120, 210, this.depth);
    this.hue = p.random(CONFETTI_COLORS);
    this.tilt = p.random(p.TWO_PI);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    const drift = p.sin((p.frameCount + this.y) * 0.01) * 0.6 * this.depth;
    this.y += this.baseSpeed * speedMultiplier;
    this.x += drift * speedMultiplier;
    this.tilt += 0.05 * speedMultiplier;
    if (this.y - this.len > p.height) {
      this.reset(true);
      this.y -= p.height;
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.tilt);
    p.noStroke();
    p.fill(this.hue[0], this.hue[1], this.hue[2], this.alpha);
    p.rect(-this.width * 0.5, -this.len * 0.5, this.width, this.len, 3);
    p.pop();
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
    this.radius = p.random(2.5, 5.5);
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
    p.fill(255, 255, 255, this.alpha);
    p.ellipse(this.x, this.y, this.radius * 2, this.radius * 1.2);
  }
}

export function createConfettiScene(p) {
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

  function spawnSparkles({ reset = true } = {}) {
    if (reset) {
      sparkles = [];
    }
    const base = Math.floor(p.width * p.height * 0.00003) + 18;
    const scaledBase = Math.max(1, Math.ceil(base * INTENSITY_MULTIPLIER));
    const pulseBase = Math.max(1, Math.ceil(base * 0.4 * INTENSITY_MULTIPLIER));
    const count = reset ? scaledBase : pulseBase;
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
    id: 'confetti',
    name: 'Confettis solaires',
    description: 'Pluie de couleurs et éclats festifs',
    enter() {
      flashStart = p.millis();
      spawnSparkles({ reset: true });
    },
    resize() {
      ensureDrops();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      spawnSparkles({ reset: false });
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
        const maxFlash = Math.min(255, 120 * INTENSITY_MULTIPLIER);
        const intensity = p.map(Math.pow(1 - elapsed / FLASH_DURATION, 3), 0, 1, 0, maxFlash, true);
        p.noStroke();
        p.fill(255, 235, 200, intensity);
        p.rect(0, 0, p.width, p.height);
      }

      const horizon = p.height * 0.82;
      p.noStroke();
      p.fill(255, 255, 255, 120);
      p.rect(0, horizon, p.width, p.height - horizon);
    }
  };
}
