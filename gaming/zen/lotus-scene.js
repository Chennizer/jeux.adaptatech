const WATER_GRADIENT = [
  { y: 0.0, color: [8, 26, 38] },
  { y: 0.45, color: [12, 42, 58] },
  { y: 1.0, color: [6, 20, 30] }
];

class Ripple {
  constructor(p, x, y, maxRadius) {
    this.p = p;
    this.reset(x, y, maxRadius);
  }

  reset(x, y, maxRadius) {
    const p = this.p;
    this.x = x ?? p.random(p.width);
    this.y = y ?? p.random(p.height * 0.4, p.height * 0.95);
    this.radius = p.random(4, 12);
    this.maxRadius = maxRadius ?? p.random(p.width * 0.08, p.width * 0.22);
    this.alpha = p.random(70, 120);
    this.lineWidth = p.random(0.6, 1.6);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.radius += p.lerp(0.35, 0.8, multiplier);
    this.alpha *= p.lerp(0.985, 0.96, multiplier);
    return this.alpha > 4;
  }

  draw() {
    const p = this.p;
    p.noFill();
    p.stroke(160, 210, 225, this.alpha);
    p.strokeWeight(this.lineWidth);
    p.ellipse(this.x, this.y, this.radius * 2);
  }
}

class FloatingPetal {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset(forceY) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = forceY ?? p.random(p.height * 0.35, p.height * 0.9);
    this.size = p.random(8, 20);
    this.angle = p.random(p.TWO_PI);
    this.speed = p.random(0.08, 0.2);
    this.drift = p.random(-0.08, 0.08);
    this.alpha = p.random(120, 220);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.x += this.drift * multiplier * 4;
    this.y -= this.speed * multiplier;
    this.angle += 0.0015 * multiplier;
    this.alpha *= 0.995;
    if (this.y < p.height * 0.28 || this.alpha < 6) {
      this.reset(p.height * 0.9);
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(p.sin(this.angle) * 0.3);
    p.noStroke();
    p.fill(250, 220, 230, this.alpha);
    p.ellipse(0, 0, this.size * 1.3, this.size * 0.6);
    p.fill(240, 190, 200, this.alpha * 0.8);
    p.ellipse(-this.size * 0.2, -this.size * 0.15, this.size, this.size * 0.45);
    p.pop();
  }
}

function drawGradient(p) {
  const h = p.height;
  for (let i = 0; i < WATER_GRADIENT.length - 1; i++) {
    const a = WATER_GRADIENT[i];
    const b = WATER_GRADIENT[i + 1];
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

function createLotusPads(p, count) {
  const pads = [];
  for (let i = 0; i < count; i++) {
    const size = p.random(p.width * 0.05, p.width * 0.12);
    pads.push({
      x: p.random(size, p.width - size),
      y: p.random(p.height * 0.45, p.height * 0.92),
      size,
      hue: p.random(90, 140),
      petalPhase: p.random(p.TWO_PI)
    });
  }
  return pads;
}

export function createLotusScene(p) {
  let ripples = [];
  let petals = [];
  let pads = [];
  let shimmer = 0;
  let speedMultiplier = 1;

  function resize() {
    const padCount = Math.max(6, Math.floor((p.width * p.height) * 0.00002));
    pads = createLotusPads(p, padCount);
    const petalCount = Math.max(28, Math.floor(p.width * 0.08));
    petals = Array.from({ length: petalCount }, () => new FloatingPetal(p));
    ripples = Array.from({ length: Math.max(6, Math.floor(padCount * 0.6)) }, () => new Ripple(p));
  }

  return {
    id: 'lotus',
    name: 'Etang aux lotus',
    description: 'Fleurs flottantes et ondulations calmes',
    enter() {
      shimmer = 0;
      ripples.forEach(r => r.reset());
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      shimmer = 1;
      for (let i = 0; i < 3; i++) {
        ripples.push(new Ripple(p));
      }
    },
    draw() {
      drawGradient(p);

      const horizon = p.height * 0.4;
      p.noStroke();
      p.fill(8, 16, 24);
      p.rect(0, 0, p.width, horizon);

      ripples = ripples.filter(ripple => {
        const alive = ripple.update(speedMultiplier);
        ripple.draw();
        return alive;
      });

      pads.forEach(pad => {
        p.noStroke();
        const brightness = 45 + Math.sin(p.frameCount * 0.003 + pad.x * 0.01) * 10;
        p.fill(pad.hue, 80, brightness, 220);
        p.push();
        p.translate(pad.x, pad.y);
        p.ellipse(0, 0, pad.size * 1.6, pad.size);
        p.fill(30, 120, 90, 180);
        p.ellipse(0, 0, pad.size * 0.6, pad.size * 0.35);
        const bloom = Math.sin(p.frameCount * 0.01 + pad.petalPhase) * 0.12 + 0.22;
        p.rotate(Math.sin(pad.petalPhase) * 0.1);
        p.fill(250, 235, 240, 180);
        p.ellipse(0, -pad.size * 0.18, pad.size * bloom, pad.size * bloom * 0.6);
        p.pop();
      });

      petals.forEach(petal => {
        petal.update(speedMultiplier);
        petal.draw();
      });

      if (shimmer > 0.02) {
        const alpha = p.map(shimmer, 0, 1, 0, 120, true);
        p.noStroke();
        p.fill(200, 240, 255, alpha);
        p.rect(0, 0, p.width, p.height);
        shimmer *= 0.92;
      } else {
        shimmer = 0;
      }
    }
  };
}
