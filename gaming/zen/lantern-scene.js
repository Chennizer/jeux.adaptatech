const SKY_GRADIENT = [
  { y: 0.0, color: [8, 18, 38] },
  { y: 0.5, color: [18, 42, 78] },
  { y: 1.0, color: [35, 70, 96] }
];

class Lantern {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height * 0.4, p.height * 1.2);
    this.size = p.random(p.width * 0.02, p.width * 0.05);
    this.speed = p.random(0.18, 0.32);
    this.sway = p.random(0.02, 0.06);
    this.phase = p.random(p.TWO_PI);
    this.twinkle = p.random(140, 220);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.y -= this.speed * multiplier * 2.2;
    this.phase += this.sway * multiplier;
    if (this.y < -this.size * 2) {
      this.reset();
      this.y = p.height * 1.1;
    }
  }

  draw() {
    const p = this.p;
    const offset = Math.sin(this.phase) * this.size * 0.25;
    p.push();
    p.translate(this.x + offset, this.y);
    p.noStroke();
    const glow = this.twinkle + Math.sin(p.frameCount * 0.02 + this.phase) * 20;
    p.fill(255, 150, 80, p.constrain(glow * 0.2, 35, 90));
    p.ellipse(0, 0, this.size * 2.8, this.size * 3.1);
    p.fill(255, 190, 120, p.constrain(glow, 120, 210));
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.size * 1.2, this.size * 1.6, this.size * 0.2);
    p.fill(255, 230, 160, 220);
    p.rect(0, 0, this.size * 0.9, this.size * 1.3, this.size * 0.2);
    p.fill(255, 250, 200, 200);
    p.rect(0, 0, this.size * 0.5, this.size * 0.9, this.size * 0.2);
    p.fill(255, 200, 120, 180);
    p.rect(0, -this.size * 0.95, this.size * 0.8, this.size * 0.2, this.size * 0.1);
    p.fill(255, 170, 110, 160);
    p.rect(0, this.size * 0.95, this.size * 0.8, this.size * 0.2, this.size * 0.1);
    p.fill(255, 200, 120, 120);
    p.rect(0, 0, this.size * 1.2, this.size * 0.15, this.size * 0.1);
    p.pop();

    p.push();
    p.noStroke();
    p.fill(255, 160, 80, 32);
    p.ellipse(this.x + offset, this.y + this.size * 1.1, this.size * 1.6, this.size * 0.4);
    p.pop();
  }
}

class Ember {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height);
    this.speed = p.random(0.08, 0.18);
    this.alpha = p.random(40, 120);
    this.size = p.random(1.5, 3.2);
  }

  update(multiplier = 1) {
    this.y -= this.speed * multiplier;
    this.alpha *= 0.995;
    if (this.y < -10 || this.alpha < 6) {
      this.reset();
      this.y = this.p.height + 6;
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(255, 190, 120, this.alpha);
    p.ellipse(this.x, this.y, this.size, this.size * 1.6);
  }
}

function drawGradient(p) {
  const h = p.height;
  for (let i = 0; i < SKY_GRADIENT.length - 1; i++) {
    const a = SKY_GRADIENT[i];
    const b = SKY_GRADIENT[i + 1];
    const yStart = a.y * h;
    const yEnd = b.y * h;
    for (let y = yStart; y <= yEnd; y++) {
      const t = (y - yStart) / Math.max(1, yEnd - yStart);
      const r = p.lerp(a.color[0], b.color[0], t);
      const g = p.lerp(a.color[1], b.color[1], t);
      const bl = p.lerp(a.color[2], b.color[2], t);
      p.stroke(r, g, bl);
      p.line(0, y, p.width, y);
    }
  }
}

export function createLanternScene(p) {
  let lanterns = [];
  let embers = [];
  let wavePhase = 0;
  let speedMultiplier = 1;
  let glowPulse = 0;

  function resize() {
    const lanternCount = Math.max(10, Math.floor(p.width * 0.02));
    lanterns = Array.from({ length: lanternCount }, () => new Lantern(p));
    const emberCount = Math.max(40, Math.floor(p.width * 0.05));
    embers = Array.from({ length: emberCount }, () => new Ember(p));
  }

  return {
    id: 'lanterns',
    name: 'Lanternes célestes',
    description: 'Lanternes qui montent dans la nuit calme',
    enter() {
      glowPulse = 1;
      lanterns.forEach(l => l.reset());
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      glowPulse = 1;
      for (let i = 0; i < 2; i++) {
        const lantern = new Lantern(p);
        lantern.y = p.height;
        lanterns.push(lantern);
      }
    },
    draw() {
      drawGradient(p);

      const horizon = p.height * 0.62;
      wavePhase += 0.0008 * speedMultiplier;

      p.noStroke();
      p.fill(6, 22, 36, 200);
      p.rect(0, horizon, p.width, p.height - horizon);

      const mountains = 4;
      for (let i = 0; i < mountains; i++) {
        const depth = (i + 1) / mountains;
        const height = p.height * (0.16 + depth * 0.28);
        const yBase = horizon + p.height * 0.05 - depth * p.height * 0.12;
        p.fill(10 + depth * 30, 30 + depth * 40, 50 + depth * 60, 180 - depth * 90);
        p.beginShape();
        p.vertex(0, yBase);
        for (let x = 0; x <= p.width; x += 20) {
          const noiseVal = p.noise(x * 0.0012, depth * 2.3);
          const y = yBase - noiseVal * height;
          p.vertex(x, y);
        }
        p.vertex(p.width, yBase);
        p.endShape(p.CLOSE);
      }

      embers.forEach(ember => {
        ember.update(speedMultiplier);
        ember.draw();
      });

      lanterns.forEach(lantern => {
        lantern.update(speedMultiplier);
        lantern.draw();
      });

      lanterns = lanterns.slice(-120);

      if (glowPulse > 0.01) {
        const alpha = p.map(glowPulse, 0, 1, 0, 110, true);
        p.noStroke();
        p.fill(255, 200, 120, alpha);
        p.rect(0, 0, p.width, p.height);
        glowPulse *= 0.92;
      }

      const waveHeight = p.height * 0.008;
      p.noFill();
      p.stroke(210, 230, 245, 40);
      p.strokeWeight(2);
      for (let i = 0; i < 4; i++) {
        const y = horizon + i * waveHeight * 6;
        p.beginShape();
        for (let x = 0; x <= p.width; x += 12) {
          const phase = wavePhase * (i + 1) + x * 0.01;
          const offset = Math.sin(phase) * waveHeight * (1 + i * 0.2);
          p.vertex(x, y + offset);
        }
        p.endShape();
      }
    }
  };
}
