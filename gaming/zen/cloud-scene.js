const SKY_TONES = [
  { y: 0.0, color: [26, 48, 64] },
  { y: 0.4, color: [40, 80, 102] },
  { y: 1.0, color: [18, 42, 58] }
];

class Cloud {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-p.width * 0.2, p.width * 1.2);
    this.y = p.random(p.height * 0.15, p.height * 0.7);
    this.scale = p.random(0.6, 1.2);
    this.speed = p.random(0.03, 0.08);
    this.alpha = p.random(90, 160);
    this.puffs = Array.from({ length: 6 }, () => ({
      ox: p.random(-120, 120),
      oy: p.random(-60, 60),
      r: p.random(60, 140)
    }));
  }

  update(multiplier = 1) {
    const p = this.p;
    this.x += this.speed * multiplier * 22;
    if (this.x > p.width * 1.3) {
      this.reset();
      this.x = -p.width * 0.3;
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.scale(this.scale);
    p.noStroke();
    this.puffs.forEach(puff => {
      p.fill(220, 240, 250, this.alpha);
      p.ellipse(puff.ox, puff.oy, puff.r * 1.6, puff.r);
    });
    p.pop();
  }
}

class Bird {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-100, p.width + 100);
    this.y = p.random(p.height * 0.2, p.height * 0.5);
    this.speed = p.random(0.2, 0.4);
    this.phase = p.random(p.TWO_PI);
    this.scale = p.random(0.6, 1.1);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.x += this.speed * multiplier * 10;
    this.phase += 0.08 * multiplier;
    if (this.x > p.width + 120) {
      this.reset();
      this.x = -120;
    }
  }

  draw() {
    const p = this.p;
    const wing = Math.sin(this.phase) * 8;
    p.push();
    p.translate(this.x, this.y + Math.sin(this.phase * 0.7) * 6);
    p.scale(this.scale);
    p.noFill();
    p.stroke(220, 235, 240, 150);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(-18, 0);
    p.bezierVertex(-6, wing, -4, wing, 0, 0);
    p.bezierVertex(4, wing, 6, wing, 18, 0);
    p.endShape();
    p.pop();
  }
}

function drawGradient(p) {
  const h = p.height;
  for (let i = 0; i < SKY_TONES.length - 1; i++) {
    const a = SKY_TONES[i];
    const b = SKY_TONES[i + 1];
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

export function createCloudScene(p) {
  let clouds = [];
  let birds = [];
  let shimmer = 0;
  let speedMultiplier = 1;

  function resize() {
    const count = Math.max(6, Math.floor(p.width / 180));
    clouds = Array.from({ length: count }, () => new Cloud(p));
    const birdCount = Math.max(3, Math.floor(p.width / 260));
    birds = Array.from({ length: birdCount }, () => new Bird(p));
  }

  return {
    id: 'clouds',
    name: 'Mer de nuages',
    description: 'Nappes de nuages pastel qui glissent lentement',
    enter() {
      shimmer = 1;
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      shimmer = 1;
    },
    draw() {
      drawGradient(p);

      clouds.forEach(cloud => {
        cloud.update(speedMultiplier);
        cloud.draw();
      });

      birds.forEach(bird => {
        bird.update(speedMultiplier);
        bird.draw();
      });

      p.noStroke();
      p.fill(10, 30, 40, 180);
      p.rect(0, p.height * 0.78, p.width, p.height * 0.25);

      if (shimmer > 0.02) {
        const alpha = p.map(shimmer, 0, 1, 0, 80, true);
        p.noStroke();
        p.fill(220, 240, 255, alpha);
        p.rect(0, 0, p.width, p.height);
        shimmer *= 0.92;
      }
    }
  };
}
