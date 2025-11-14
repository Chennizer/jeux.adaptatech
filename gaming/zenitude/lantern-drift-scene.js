const SKY_GRADIENT = [
  [18, 15, 36],
  [44, 28, 56],
  [12, 8, 24]
];

class Lantern {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(spawnAnywhere = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = spawnAnywhere ? p.random(-p.height * 0.2, p.height) : p.height + p.random(40, 160);
    this.speed = p.random(0.35, 0.9);
    this.wiggle = p.random(0.01, 0.018);
    this.phase = p.random(p.TWO_PI);
    this.size = p.random(p.width * 0.018, p.width * 0.05);
    this.warmth = p.random(0.8, 1.2);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.y -= this.speed * multiplier;
    this.phase += this.wiggle * multiplier;
    this.x += Math.sin(this.phase) * 0.4 * multiplier;
    if (this.y < -100) {
      this.reset();
    }
  }

  draw(glowStrength = 1) {
    const p = this.p;
    const bodyHeight = this.size * 1.6;
    const flicker = 0.85 + Math.sin(this.phase * 2) * 0.15;
    const glow = 90 * glowStrength;

    p.noStroke();
    p.fill(255, 140 * this.warmth, 70 * this.warmth, 25 * glowStrength);
    p.ellipse(this.x, this.y, this.size * 3, bodyHeight * 2.6);

    p.fill(255, 190 * this.warmth, 120 * this.warmth, 180 * flicker);
    p.rect(this.x - this.size * 0.5, this.y - bodyHeight * 0.5, this.size, bodyHeight, this.size * 0.4);

    p.fill(255, 210, 160, 220);
    p.rect(this.x - this.size * 0.45, this.y - bodyHeight * 0.3, this.size * 0.9, bodyHeight * 0.6, this.size * 0.3);

    p.fill(255, 240, 200, 200 * flicker);
    p.rect(this.x - this.size * 0.2, this.y - bodyHeight * 0.15, this.size * 0.4, bodyHeight * 0.3, this.size * 0.2);
  }
}

class Firefly {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(spawnAnywhere = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = spawnAnywhere ? p.random(p.height) : p.random(p.height * 0.3, p.height * 0.9);
    this.phase = p.random(p.TWO_PI);
    this.speed = p.random(0.02, 0.08);
  }

  update(multiplier = 1) {
    this.phase += 0.04 * multiplier;
    this.x += Math.cos(this.phase) * this.speed * 40 * multiplier;
    this.y += Math.sin(this.phase * 0.8) * this.speed * 30 * multiplier;
    if (this.x < -20) this.x = this.p.width + 20;
    if (this.x > this.p.width + 20) this.x = -20;
    if (this.y < -20) this.y = this.p.height + 20;
    if (this.y > this.p.height + 20) this.y = -20;
  }

  draw() {
    const p = this.p;
    const alpha = 120 + Math.sin(this.phase * 3) * 80;
    p.noStroke();
    p.fill(255, 220, 120, alpha);
    p.circle(this.x, this.y, 3);
  }
}

export function createLanternDriftScene(p) {
  const lanterns = [];
  const fireflies = [];
  let speedMultiplier = 1;
  let pulseStrength = 0;

  function ensureLanterns() {
    const target = Math.max(12, Math.floor(p.width * 0.035));
    while (lanterns.length < target) lanterns.push(new Lantern(p));
    if (lanterns.length > target) lanterns.length = target;
  }

  function ensureFireflies() {
    const target = Math.max(24, Math.floor(p.width * 0.07));
    while (fireflies.length < target) fireflies.push(new Firefly(p));
    if (fireflies.length > target) fireflies.length = target;
  }

  function drawGradient() {
    const steps = SKY_GRADIENT.length - 1;
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const scaled = t * steps;
      const idx = Math.min(steps - 1, Math.floor(scaled));
      const localT = scaled - idx;
      const a = SKY_GRADIENT[idx];
      const b = SKY_GRADIENT[idx + 1] || SKY_GRADIENT[idx];
      const r = p.lerp(a[0], b[0], localT);
      const g = p.lerp(a[1], b[1], localT);
      const bcol = p.lerp(a[2], b[2], localT);
      p.stroke(r, g, bcol);
      p.line(0, y, p.width, y);
    }
  }

  return {
    id: 'lanterns',
    name: 'Lanterne flottantes',
    description: 'Lueurs qui montent dans la nuit',
    enter() {
      ensureLanterns();
      ensureFireflies();
      pulseStrength = 0;
    },
    resize() {
      ensureLanterns();
      ensureFireflies();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      pulseStrength = 1;
    },
    draw() {
      drawGradient();
      ensureLanterns();
      ensureFireflies();

      fireflies.forEach(f => {
        f.update(speedMultiplier);
        f.draw();
      });

      const horizon = p.height * 0.75;
      p.noStroke();
      p.fill(20, 18, 30, 220);
      p.rect(0, horizon, p.width, p.height - horizon);
      p.fill(40, 34, 56, 200);
      p.rect(0, horizon - 8, p.width, 12);

      lanterns.forEach(lantern => {
        lantern.update(speedMultiplier);
        const glow = 1 + pulseStrength * 0.8;
        lantern.draw(glow);
      });

      pulseStrength *= 0.92;
    }
  };
}
