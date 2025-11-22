class Petal {
  constructor(p, palette) {
    this.p = p;
    this.palette = palette;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-p.width * 0.1, p.width * 1.1);
    this.y = p.random(-p.height, -20);
    this.size = p.random(10, 26);
    this.speed = p.random(0.4, 1.1);
    this.swing = p.random(0.4, 1.2);
    this.angle = p.random(p.TWO_PI);
    this.color = p.color(this.palette[p.floor(p.random(this.palette.length))]);
  }

  update(multiplier) {
    const p = this.p;
    this.angle += 0.01 * multiplier;
    this.x += Math.cos(this.angle) * this.swing * multiplier;
    this.y += this.speed * 1.5 * multiplier;
    if (this.y > p.height + this.size) {
      this.reset();
      this.y = -this.size;
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle * 0.6);
    p.noStroke();
    p.fill(this.color);
    p.ellipse(0, 0, this.size * 0.8, this.size * 1.2);
    p.ellipse(this.size * 0.3, -this.size * 0.3, this.size * 0.5, this.size);
    p.pop();
  }
}

export function createSpringScene(p) {
  const petals = [];
  let speedMultiplier = 1;
  let bloom = 0;

  function resize() {
    petals.length = 0;
    const count = Math.floor(Math.max(60, (p.width * p.height) / 12000));
    const palette = [
      [255, 219, 240],
      [250, 187, 215],
      [204, 238, 210],
      [189, 221, 255]
    ];
    for (let i = 0; i < count; i += 1) {
      petals.push(new Petal(p, palette));
    }
  }

  return {
    id: 'spring',
    name: 'Printemps',
    description: 'Brise douce et pétales flottants',
    resize,
    enter() {
      bloom = 1;
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      bloom = 1.4;
    },
    draw() {
      const t = p.millis() * 0.0002 * speedMultiplier;
      const top = p.color(212, 238, 255);
      const bottom = p.color(174, 214, 191);
      for (let y = 0; y < p.height; y += 2) {
        const mix = p.map(y, 0, p.height, 0, 1, true);
        const col = p.lerpColor(top, bottom, mix);
        p.stroke(col);
        p.line(0, y, p.width, y);
      }

      const glow = Math.max(0, bloom - 0.02);
      bloom = p.lerp(bloom, 0, 0.01 * speedMultiplier);
      if (glow > 0.01) {
        p.noStroke();
        p.fill(255, 255, 240, 80 * glow);
        p.rect(0, 0, p.width, p.height);
      }

      p.noStroke();
      const hillHeight = p.height * 0.22;
      for (let i = 0; i < 2; i += 1) {
        const baseY = p.height * 0.78 + i * 14;
        p.fill(90, 190, 130, 160 - i * 30);
        p.beginShape();
        p.vertex(-20, p.height);
        for (let x = -20; x <= p.width + 20; x += 16) {
          const offset = p.noise((x + i * 1000) * 0.003, t + i * 2) * hillHeight * 0.45;
          p.vertex(x, baseY - offset);
        }
        p.vertex(p.width + 20, p.height);
        p.endShape(p.CLOSE);
      }

      petals.forEach(petal => {
        petal.update(speedMultiplier);
        petal.draw();
      });
    }
  };
}
