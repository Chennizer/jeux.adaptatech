const SKY_TOP = [8, 14, 32];
const SKY_BOTTOM = [28, 36, 62];

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
    this.speed = p.random(0.4, 1.4);
    this.sway = p.random(0.6, 1.8);
    this.phase = p.random(p.TWO_PI);
    this.alpha = p.random(140, 220);
  }

  update() {
    const p = this.p;
    this.phase += 0.01;
    this.y += this.speed;
    this.x += Math.sin(this.phase) * this.sway;
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

export function createSnowScene(p) {
  const flakes = [];
  let glowStart = 0;
  let targetCount = 0;

  function ensureFlakes() {
    const desired = Math.floor((p.width * p.height) * 0.00042);
    targetCount = desired;
    while (flakes.length < desired) flakes.push(new Snowflake(p, true));
    if (flakes.length > desired) flakes.length = desired;
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
    description: 'Flocons tourbillonnants et halo lunaire',
    enter() {
      glowStart = p.millis();
    },
    resize() {
      ensureFlakes();
    },
    draw() {
      if (flakes.length !== targetCount) ensureFlakes();
      drawSky();

      const moonX = p.width * 0.75;
      const moonY = p.height * 0.25;
      p.noStroke();
      for (let i = 4; i >= 0; i--) {
        const alpha = p.map(i, 4, 0, 40, 160);
        const radius = (i + 1) * 32;
        p.fill(200, 220, 255, alpha);
        p.circle(moonX, moonY, radius);
      }

      flakes.forEach(f => f.update());
      flakes.forEach(f => f.draw());

      const elapsed = p.millis() - glowStart;
      const fade = p.constrain(1 - elapsed / 2200, 0, 1);
      if (fade > 0) {
        p.fill(220, 240, 255, 80 * fade);
        p.rect(0, 0, p.width, p.height);
      }

      const groundHeight = p.height * 0.18;
      p.fill(240, 244, 255, 220);
      p.rect(0, p.height - groundHeight, p.width, groundHeight);

      const driftCount = Math.min(10, Math.floor(targetCount * 0.02));
      for (let i = 0; i < driftCount; i++) {
        const seed = i * 271.7;
        const x = p.noise(seed, p.millis() * 0.0005) * p.width;
        const y = p.height - groundHeight + p.noise(seed * 1.7, p.millis() * 0.0008) * groundHeight * 0.8;
        const radius = p.lerp(18, 46, p.noise(seed * 3.2));
        p.fill(255, 255, 255, 30);
        p.circle(x, y, radius);
      }
    }
  };
}
