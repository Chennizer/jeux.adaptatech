class Ribbon {
  constructor(p, hue) {
    this.p = p;
    this.hue = hue;
    this.offset = p.random(1000);
    this.amplitude = p.random(20, 60);
    this.speed = p.random(0.0015, 0.0032);
  }

  draw(yBase, speedMultiplier = 1) {
    const p = this.p;
    p.noFill();
    p.strokeWeight(4);
    p.stroke(this.hue[0], this.hue[1], this.hue[2], 160);
    p.beginShape();
    for (let x = 0; x <= p.width; x += 18) {
      const t = this.offset + x * 0.004 + p.frameCount * this.speed * speedMultiplier;
      const y = yBase + Math.sin(t) * this.amplitude + Math.sin(t * 0.7) * this.amplitude * 0.4;
      p.curveVertex(x, y);
    }
    p.endShape();
  }
}

class Spark { 
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height * 0.5, p.height * 0.9);
    this.size = p.random(3, 8);
    this.speed = p.random(0.2, 0.6);
    this.alpha = p.random(120, 200);
  }

  update(multiplier = 1) {
    this.alpha -= 0.8 * multiplier;
    this.y -= this.speed * multiplier;
    if (this.alpha <= 0) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(255, 220, 120, this.alpha);
    p.ellipse(this.x, this.y, this.size, this.size * 0.8);
  }
}

export function createSummerScene(p) {
  let speedMultiplier = 1;
  const ribbons = [
    new Ribbon(p, [74, 180, 255]),
    new Ribbon(p, [50, 140, 230]),
    new Ribbon(p, [32, 110, 200])
  ];
  const sparks = Array.from({ length: 90 }, () => new Spark(p));

  return {
    id: 'summer',
    name: 'Été',
    description: 'Ondes océanes et lueurs solaires',
    enter() {},
    resize() {},
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      sparks.forEach(s => s.alpha = 220);
    },
    draw() {
      p.background(6, 46, 82);
      const gradientHeight = p.height * 0.72;
      for (let y = 0; y < gradientHeight; y++) {
        const t = y / Math.max(1, gradientHeight - 1);
        const r = p.lerp(8, 62, t);
        const g = p.lerp(62, 160, t);
        const b = p.lerp(120, 210, t);
        p.stroke(r, g, b);
        p.line(0, y, p.width, y);
      }

      ribbons.forEach((ribbon, i) => {
        const yBase = p.height * 0.55 + i * 26;
        ribbon.draw(yBase, speedMultiplier);
      });

      p.noStroke();
      p.fill(255, 240, 190, 40);
      p.ellipse(p.width * 0.2, p.height * 0.18, 180, 180);
      p.fill(255, 220, 120, 120);
      p.ellipse(p.width * 0.2, p.height * 0.18, 120, 120);

      sparks.forEach(s => s.update(speedMultiplier));
      sparks.forEach(s => s.draw());

      p.noStroke();
      p.fill(2, 24, 45, 220);
      p.rect(0, p.height * 0.78, p.width, p.height * 0.22);
    }
  };
}
