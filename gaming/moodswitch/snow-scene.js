const SKY_TOP = [8, 14, 32];
const SKY_BOTTOM = [28, 36, 62];
const EFFECT_INTENSITY = 3;

class Snowflake {
  constructor(p, spawnAnywhere = true) {
    this.p = p;
    this.reset(spawnAnywhere);
  }

  reset(spawnAnywhere = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = spawnAnywhere ? p.random(-p.height, p.height) : p.random(-p.height * 0.3, 0);
    this.size = p.random(1.8, 4.6);
    this.baseSpeed = p.random(0.6, 1.8);
    this.baseSway = p.random(1.0, 2.4);
    this.phase = p.random(p.TWO_PI);
    this.alpha = p.random(140, 220);
    this.windFactor = p.random(0.6, 1.4);
  }

  update(wind = 0, speedMultiplier = 1) {
    const p = this.p;
    this.phase += 0.012 * speedMultiplier;
    this.y += this.baseSpeed * speedMultiplier;
    const sway = Math.sin(this.phase) * this.baseSway * speedMultiplier;
    this.x += sway + wind * this.windFactor * speedMultiplier;
    if (this.y > p.height) {
      this.reset();
      this.y = -20;
    }
    if (this.x < -40) this.x = p.width + 40;
    if (this.x > p.width + 40) this.x = -40;
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(230, 240, 255, this.alpha);
    p.circle(this.x, this.y, this.size * 2);
  }
}

class SnowGlitter {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height);
    this.size = p.random(1.5, 3.5);
    this.life = p.random(90, 150);
    this.vx = p.random(-0.3, 0.3);
    this.vy = p.random(-0.2, 0.1);
    this.alpha = p.random(120, 210);
    this.twinkleSpeed = p.random(0.05, 0.12);
    this.phase = p.random(p.TWO_PI);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    this.x += this.vx * speedMultiplier;
    this.y += this.vy * speedMultiplier;
    this.life -= speedMultiplier;
    this.phase += this.twinkleSpeed * speedMultiplier;
    this.alpha *= 0.98;
    if (this.y < -20) this.y = p.height + 10;
    if (this.x < -20) this.x = p.width + 20;
    if (this.x > p.width + 20) this.x = -20;
    return this.life > 0 && this.alpha > 15;
  }

  draw() {
    const p = this.p;
    const twinkle = (Math.sin(this.phase) + 1) * 0.5;
    const size = this.size * (0.8 + twinkle * 0.6);
    p.noStroke();
    p.fill(255, 255, 255, this.alpha);
    p.circle(this.x, this.y, size);
  }
}

export function createSnowScene(p) {
  const flakes = [];
  let glowStart = 0;
  let targetCount = 0;
  let wind = 0;
  let targetWind = 0;
  let speedMultiplier = 1;
  let glitter = [];

  function ensureFlakes() {
    const desired = Math.floor((p.width * p.height) * 0.00042);
    targetCount = desired;
    while (flakes.length < desired) flakes.push(new Snowflake(p, true));
    if (flakes.length > desired) flakes.length = desired;
  }

  function spawnGlitter({ reset = true } = {}) {
    if (reset) {
      glitter = [];
    }
    const base = Math.floor(p.width * p.height * 0.000025) + 24;
    const multiplier = EFFECT_INTENSITY;
    const count = reset
      ? Math.ceil(base * multiplier)
      : Math.ceil(base * 0.45 * multiplier);
    for (let i = 0; i < count; i++) {
      glitter.push(new SnowGlitter(p));
    }
  }

  function updateWind() {
    const time = p.millis() * 0.00018;
    targetWind = p.map(p.noise(time), 0, 1, -2.8, 2.8);
    wind = p.lerp(wind, targetWind, 0.02);
  }

  function drawSky() {
    const h = p.height;
    for (let y = 0; y < h; y++) {
      const t = y / Math.max(1, h - 1);
      const r = p.lerp(SKY_TOP[0], SKY_BOTTOM[0], t);
      const g = p.lerp(SKY_TOP[1], SKY_BOTTOM[1], t);
      const b = p.lerp(SKY_TOP[2], SKY_BOTTOM[2], t);
      p.stroke(r, g, b);
      p.line(0, y, p.width, y);
    }
  }

  return {
    name: 'Tempête douce',
    description: 'Flocons tourbillonnants et rafales douces',
    enter() {
      glowStart = p.millis();
      wind = p.random(-1.5, 1.5);
      targetWind = wind;
      spawnGlitter({ reset: true });
    },
    resize() {
      ensureFlakes();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      spawnGlitter({ reset: false });
    },
    draw() {
      if (flakes.length !== targetCount) ensureFlakes();
      drawSky();

      updateWind();

      for (let i = glitter.length - 1; i >= 0; i--) {
        const sparkle = glitter[i];
        const alive = sparkle.update(speedMultiplier);
        sparkle.draw();
        if (!alive) glitter.splice(i, 1);
      }

      flakes.forEach(f => f.update(wind, speedMultiplier));
      flakes.forEach(f => f.draw());

      const elapsed = p.millis() - glowStart;
      const fade = p.constrain(1 - elapsed / 2200, 0, 1);
      if (fade > 0) {
        const alpha = Math.min(255, 80 * fade * EFFECT_INTENSITY);
        p.fill(220, 240, 255, alpha);
        p.rect(0, 0, p.width, p.height);
      }

      const groundHeight = p.height * 0.18;
      p.fill(240, 244, 255, 220);
      p.rect(0, p.height - groundHeight, p.width, groundHeight);
    }
  };
}
