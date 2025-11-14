class Star {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height);
    this.twinkleSpeed = p.random(0.01, 0.04);
    this.baseAlpha = p.random(40, 140);
    this.radius = p.random(1, 3);
    this.phase = p.random(p.TAU);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    this.phase += this.twinkleSpeed * speedMultiplier;
  }

  draw(breath = 0) {
    const p = this.p;
    const alpha = this.baseAlpha + p.sin(this.phase) * 40 + breath * 60;
    p.noStroke();
    p.fill(210, 240, 255, alpha);
    p.ellipse(this.x, this.y, this.radius * 2);
  }
}

class Ribbon {
  constructor(p, colorStops) {
    this.p = p;
    this.colorStops = colorStops;
    this.offset = p.random(1000);
    this.speed = p.random(0.0006, 0.0014);
    this.amplitude = p.random(60, 110);
  }

  draw(speedMultiplier = 1) {
    const p = this.p;
    p.noFill();
    p.strokeWeight(2.5);
    for (let y = 0; y < p.height; y += 4) {
      const t = y / Math.max(1, p.height - 1);
      const colorIndex = t * (this.colorStops.length - 1);
      const idx = Math.floor(colorIndex);
      const frac = colorIndex - idx;
      const a = this.colorStops[idx];
      const b = this.colorStops[Math.min(this.colorStops.length - 1, idx + 1)];
      p.stroke(p.lerp(a[0], b[0], frac), p.lerp(a[1], b[1], frac), p.lerp(a[2], b[2], frac), 80);
      const wave = p.noise(this.offset + y * 0.01, p.frameCount * this.speed * speedMultiplier) * this.amplitude;
      const x = p.width * 0.5 + (wave - this.amplitude * 0.5);
      p.line(x - 90, y, x + 90, y);
    }
  }
}

export function createCelestialBreathScene(p) {
  const stars = [];
  const ribbons = [];
  let speedMultiplier = 1;
  let breath = 0;
  let breathPhase = 0;

  function ensureElements() {
    if (!stars.length) {
      const target = Math.floor(p.width * p.height / 9000) + 60;
      for (let i = 0; i < target; i++) {
        stars.push(new Star(p));
      }
    }

    if (!ribbons.length) {
      const palette = [
        [38, 94, 140],
        [90, 148, 199],
        [162, 212, 240],
        [208, 236, 255]
      ];
      for (let i = 0; i < 3; i++) {
        ribbons.push(new Ribbon(p, palette));
      }
    }
  }

  function drawBackground() {
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const r = p.lerp(6, 12, t);
      const g = p.lerp(12, 34, t);
      const b = p.lerp(30, 70, t);
      p.stroke(r, g, b);
      p.line(0, y, p.width, y);
    }
  }

  return {
    id: 'celestial-breath',
    name: 'Respiration céleste',
    description: 'Constellations et aurore douce',
    enter() {
      breath = 1;
    },
    resize() {
      stars.length = 0;
      ribbons.length = 0;
      ensureElements();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      breath = 1;
    },
    draw() {
      ensureElements();
      drawBackground();

      breathPhase += 0.005 * speedMultiplier;
      const breathing = (Math.sin(breathPhase) + 1) * 0.5;
      const breathScale = p.lerp(0.6, 1.15, breathing);

      ribbons.forEach((ribbon, index) => {
        p.push();
        p.translate(0, index * 20);
        ribbon.draw(speedMultiplier);
        p.pop();
      });

      stars.forEach(star => {
        star.update(speedMultiplier);
        star.draw(breath);
      });

      const centerX = p.width * 0.5;
      const centerY = p.height * 0.6;
      const baseRadius = p.height * 0.22;
      const radius = baseRadius * breathScale;

      for (let i = 0; i < 80; i++) {
        const t = i / 80;
        p.fill(132, 210, 255, (1 - t) * 90);
        p.noStroke();
        p.ellipse(centerX, centerY, radius * (1 - t));
      }

      if (breath > 0.01) {
        p.noStroke();
        p.fill(120, 210, 255, breath * 70);
        p.rect(0, 0, p.width, p.height);
        breath = Math.max(0, breath - 0.01 * speedMultiplier);
      }

      p.noStroke();
      p.fill(6, 20, 38, 220);
      p.rect(0, p.height * 0.92, p.width, p.height * 0.08);
    }
  };
}
