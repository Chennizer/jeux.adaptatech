const SKY_COLOR_TOP = [12, 32, 34];
const SKY_COLOR_BOTTOM = [18, 60, 66];

class BambooStalk {
  constructor(p, x, height, thickness) {
    this.p = p;
    this.x = x;
    this.height = height;
    this.thickness = thickness;
    this.joints = Math.max(4, Math.floor(height / 70));
    this.phase = p.random(p.TWO_PI);
    this.leaves = Array.from({ length: Math.max(6, Math.floor(height / 90)) }, () => ({
      offsetY: p.random(40, height - 20),
      angle: p.random(-0.6, 0.6),
      length: p.random(50, 90),
      flip: p.random([1, -1]),
      spread: p.random(0.2, 0.5),
      sway: p.random(0.5, 1.2)
    }));
  }

  draw(baseWind, multiplier = 1) {
    const p = this.p;
    const sway = Math.sin(this.phase + baseWind) * 0.12 * multiplier;
    const xOffset = Math.sin(this.phase + baseWind * 0.7) * 12 * multiplier;

    p.push();
    p.translate(this.x + xOffset, p.height);
    p.rotate(sway);
    p.noStroke();

    for (let i = 0; i < this.joints; i++) {
      const segmentHeight = this.height / this.joints;
      const yTop = -segmentHeight * (i + 1);
      const yBottom = -segmentHeight * i;
      p.fill(58, 120, 82, 220);
      p.rect(-this.thickness / 2, yTop, this.thickness, segmentHeight + 1, this.thickness * 0.1);
      p.fill(40, 90, 68, 180);
      p.rect(-this.thickness / 2, yBottom - 2, this.thickness, 4, this.thickness * 0.08);
    }

    this.leaves.forEach(leaf => {
      const swayAngle = Math.sin(this.phase * leaf.sway + baseWind * 1.6) * 0.25 * multiplier;
      p.push();
      p.translate(0, -leaf.offsetY);
      p.rotate(leaf.angle + swayAngle);
      const gradientSteps = 6;
      for (let i = 0; i < gradientSteps; i++) {
        const t = i / (gradientSteps - 1);
        const color = p.lerpColor(p.color(80, 170, 110, 180), p.color(120, 220, 160, 120), t);
        p.fill(color);
        p.beginShape();
        p.vertex(0, 0);
        p.bezierVertex(leaf.length * 0.2 * leaf.flip, -leaf.length * leaf.spread * 0.6, leaf.length * leaf.flip, -leaf.length * leaf.spread, leaf.length * leaf.flip, -leaf.length * leaf.spread);
        p.bezierVertex(leaf.length * 0.3 * leaf.flip, -leaf.length * leaf.spread * 0.35, 0, -leaf.length * 0.6, 0, -leaf.length * 0.6);
        p.endShape();
      }
      p.pop();
    });

    p.pop();
  }
}

class Firefly {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height * 0.4, p.height * 0.95);
    this.speedX = p.random(-0.15, 0.15);
    this.speedY = p.random(-0.06, 0.06);
    this.alpha = p.random(90, 160);
    this.size = p.random(2, 4.2);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.x += this.speedX * multiplier * 4;
    this.y += this.speedY * multiplier * 2;
    this.phase += 0.04 * multiplier;
    if (this.x < -10 || this.x > p.width + 10 || this.y < p.height * 0.3 || this.y > p.height) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    const intensity = (Math.sin(this.phase) + 1) * 0.5;
    p.noStroke();
    p.fill(220, 255, 200, this.alpha * intensity);
    p.ellipse(this.x, this.y, this.size * 3, this.size * 2);
  }
}

function drawBackground(p) {
  for (let y = 0; y <= p.height; y++) {
    const t = y / Math.max(1, p.height);
    const r = p.lerp(SKY_COLOR_TOP[0], SKY_COLOR_BOTTOM[0], t);
    const g = p.lerp(SKY_COLOR_TOP[1], SKY_COLOR_BOTTOM[1], t);
    const b = p.lerp(SKY_COLOR_TOP[2], SKY_COLOR_BOTTOM[2], t);
    p.stroke(r, g, b);
    p.line(0, y, p.width, y);
  }
}

export function createBambooScene(p) {
  let stalks = [];
  let fireflies = [];
  let baseWind = 0;
  let windPulse = 0;
  let speedMultiplier = 1;

  function resize() {
    const count = Math.max(6, Math.floor(p.width / 140));
    const spacing = p.width / (count + 1);
    stalks = Array.from({ length: count }, (_, i) => {
      const x = spacing * (i + 1) + p.random(-spacing * 0.3, spacing * 0.3);
      const height = p.height * p.random(0.55, 0.86);
      const thickness = p.lerp(16, 32, p.random());
      return new BambooStalk(p, x, height, thickness);
    });
    const fireflyCount = Math.max(18, Math.floor(p.width * 0.03));
    fireflies = Array.from({ length: fireflyCount }, () => new Firefly(p));
  }

  return {
    id: 'bamboo',
    name: 'Forêt de bambous',
    description: 'Respiration lente dans une clairière de bambous',
    enter() {
      windPulse = 0;
      baseWind = 0;
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      windPulse = 1;
    },
    draw() {
      drawBackground(p);

      baseWind += 0.002 * speedMultiplier;
      if (windPulse > 0) {
        baseWind += 0.01 * windPulse;
        windPulse *= 0.92;
      }

      p.noStroke();
      p.fill(6, 18, 20, 200);
      p.rect(0, p.height * 0.85, p.width, p.height * 0.15);

      stalks.forEach(stalk => {
        stalk.draw(baseWind, speedMultiplier);
      });

      fireflies.forEach(firefly => {
        firefly.update(speedMultiplier);
        firefly.draw();
      });

      p.noStroke();
      p.fill(0, 0, 0, 60);
      for (const stalk of stalks) {
        p.ellipse(stalk.x, p.height * 0.86, stalk.thickness * 1.6, stalk.thickness * 0.6);
      }
    }
  };
}
