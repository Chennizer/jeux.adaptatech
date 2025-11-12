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
    this.baseVx = p.random(-0.35, 0.35);
    this.baseVy = p.random(0.35, 0.9);
    this.baseSpin = p.random(-0.02, 0.02);
    this.angle = p.random(p.TWO_PI);
    this.life = 0;
    this.alpha = p.random(90, 170);
    this.wobble = p.random(0.5, 1.2);
    this.offset = p.random(p.TWO_PI);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    this.life += speedMultiplier;
    const wobble = Math.sin(this.offset + this.life * 0.025) * this.wobble;
    this.x += (this.baseVx * speedMultiplier) + wobble * speedMultiplier;
    this.y += this.baseVy * speedMultiplier;
    this.angle += this.baseSpin * speedMultiplier;
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

class PetalSparkle {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height * 0.7);
    this.size = p.random(2, 4.2);
    this.life = p.random(80, 140);
    this.vx = p.random(-0.25, 0.25);
    this.vy = p.random(-0.05, 0.18);
    this.alpha = p.random(110, 190);
    this.tint = p.random([0, 1, 2]);
  }

  update(speedMultiplier = 1) {
    this.x += this.vx * speedMultiplier;
    this.y += this.vy * speedMultiplier;
    this.life -= speedMultiplier;
    this.alpha *= 0.97;
    return this.life > 0 && this.alpha > 12;
  }

  draw() {
    const p = this.p;
    let color;
    if (this.tint === 0) {
      color = [236, 184, 210];
    } else if (this.tint === 1) {
      color = [255, 220, 236];
    } else {
      color = [208, 160, 198];
    }
    p.noStroke();
    p.fill(color[0], color[1], color[2], this.alpha);
    p.circle(this.x, this.y, this.size * 2.2);
  }
}

export function createPetalScene(p) {
  const petals = [];
  let highlightStart = 0;
  let targetCount = 0;
  let speedMultiplier = 1;
  let sparkles = [];

  function ensurePetals() {
    const desired = Math.floor((p.width * p.height) * 0.00018);
    targetCount = desired;
    while (petals.length < desired) petals.push(new Petal(p, true));
    if (petals.length > desired) petals.length = desired;
  }

  function spawnSparkles({ reset = true } = {}) {
    if (reset) {
      sparkles = [];
    }
    const base = Math.floor(p.width * p.height * 0.000022) + 26;
    const count = reset ? base : Math.ceil(base * 0.5);
    for (let i = 0; i < count; i++) {
      sparkles.push(new PetalSparkle(p));
    }
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
      spawnSparkles({ reset: true });
    },
    resize() {
      ensurePetals();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      spawnSparkles({ reset: false });
    },
    draw() {
      if (petals.length !== targetCount) ensurePetals();
      drawBackground();

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sparkle = sparkles[i];
        const alive = sparkle.update(speedMultiplier);
        sparkle.draw();
        if (!alive) sparkles.splice(i, 1);
      }

      petals.forEach(pt => pt.update(speedMultiplier));
      petals.forEach(pt => pt.draw());

      const elapsed = p.millis() - highlightStart;
      const glow = p.constrain(1 - elapsed / 2000, 0, 1);
      if (glow > 0) {
        p.fill(255, 200, 220, 80 * glow);
        p.rect(0, 0, p.width, p.height);
      }
    }
  };
}
