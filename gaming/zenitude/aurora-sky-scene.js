const SKY_COLORS = [
  [6, 14, 32],
  [9, 24, 52],
  [2, 6, 18]
];

class AuroraRibbon {
  constructor(p, level) {
    this.p = p;
    this.level = level;
    this.phase = p.random(p.TWO_PI);
    this.amplitude = p.random(40, 110) * (0.6 + level * 0.2);
    this.frequency = p.random(0.0007, 0.0014);
    this.height = p.random(p.height * 0.25, p.height * 0.6);
    this.color = [
      p.random(60, 120),
      p.random(160, 240),
      p.random(140, 220)
    ];
  }

  update(multiplier = 1) {
    this.phase += 0.0025 * multiplier;
  }

  draw() {
    const p = this.p;
    const points = 90;
    const baseAlpha = p.map(this.level, 0, 3, 70, 35);
    p.noStroke();
    p.beginShape();
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * p.width;
      const offset = Math.sin(this.phase + x * this.frequency) * this.amplitude;
      const y = this.height + offset;
      const alpha = baseAlpha + Math.sin(this.phase * 2 + i * 0.3) * 18;
      p.fill(this.color[0], this.color[1], this.color[2], alpha);
      p.vertex(x, y);
    }
    p.vertex(p.width, p.height);
    p.vertex(0, p.height);
    p.endShape(p.CLOSE);
  }
}

class FloatingStar {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(spawnAnywhere = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = spawnAnywhere ? p.random(p.height * 0.9) : p.random(p.height * 0.45);
    this.speed = p.random(0.02, 0.08);
    this.size = p.random(1.2, 2.3);
    this.twinkle = p.random(p.TWO_PI);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.y -= this.speed * multiplier;
    this.twinkle += 0.02 * multiplier;
    if (this.y < -20) {
      this.reset();
      this.y = p.height + 20;
    }
  }

  draw() {
    const p = this.p;
    const alpha = 120 + Math.sin(this.twinkle) * 80;
    p.noStroke();
    p.fill(220, 240, 255, alpha);
    p.circle(this.x, this.y, this.size);
  }
}

export function createAuroraSkyScene(p) {
  const ribbons = [];
  const stars = [];
  let speedMultiplier = 1;

  function ensureRibbons() {
    if (!ribbons.length) {
      for (let i = 0; i < 4; i++) {
        ribbons.push(new AuroraRibbon(p, i));
      }
    }
  }

  function ensureStars() {
    const target = Math.floor(p.width * 0.18);
    while (stars.length < target) stars.push(new FloatingStar(p));
    if (stars.length > target) stars.length = target;
  }

  function drawSky() {
    const gradientSteps = SKY_COLORS.length - 1;
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const scaled = t * gradientSteps;
      const idx = Math.min(gradientSteps - 1, Math.floor(scaled));
      const localT = scaled - idx;
      const a = SKY_COLORS[idx];
      const b = SKY_COLORS[idx + 1] || SKY_COLORS[idx];
      const r = p.lerp(a[0], b[0], localT);
      const g = p.lerp(a[1], b[1], localT);
      const bl = p.lerp(a[2], b[2], localT);
      p.stroke(r, g, bl);
      p.line(0, y, p.width, y);
    }
  }

  return {
    id: 'aurora',
    name: 'Ciel boréal',
    description: 'Voiles d\'aurore qui ondulent',
    enter() {
      ensureRibbons();
      ensureStars();
    },
    resize() {
      ensureStars();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      ribbons.forEach(ribbon => {
        ribbon.amplitude *= 1.1;
        setTimeout(() => {
          ribbon.amplitude *= 0.91;
        }, 1200);
      });
    },
    draw() {
      drawSky();
      ensureRibbons();
      ensureStars();

      stars.forEach(star => {
        star.update(speedMultiplier * 0.6);
        star.draw();
      });

      ribbons.forEach(ribbon => {
        ribbon.update(speedMultiplier);
        ribbon.draw();
      });

      const horizon = p.height * 0.72;
      p.noStroke();
      p.fill(8, 24, 32, 220);
      p.rect(0, horizon, p.width, p.height - horizon);
      p.fill(12, 32, 40, 150);
      p.triangle(0, horizon, p.width * 0.25, horizon - 80, p.width * 0.5, horizon);
      p.triangle(p.width * 0.35, horizon, p.width * 0.62, horizon - 120, p.width * 0.9, horizon);
      p.triangle(p.width * 0.6, horizon, p.width * 0.84, horizon - 70, p.width, horizon);
    }
  };
}
