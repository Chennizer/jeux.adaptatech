class Snowflake {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-p.width * 0.1, p.width * 1.1);
    this.y = p.random(-p.height, -10);
    this.size = p.random(2, 6);
    this.speed = p.random(0.6, 1.2);
    this.drift = p.random(-0.6, 0.6);
    this.angle = p.random(p.TWO_PI);
  }

  update(multiplier) {
    const p = this.p;
    this.angle += 0.01 * multiplier;
    this.x += Math.sin(this.angle) * this.drift * multiplier;
    this.y += this.speed * 1.8 * multiplier;
    if (this.y > p.height + this.size) {
      this.reset();
      this.y = -this.size;
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(240, 248, 255, 200);
    p.circle(this.x, this.y, this.size);
  }
}

class AuroraRibbon {
  constructor(p, offset) {
    this.p = p;
    this.offset = offset;
  }

  draw(multiplier) {
    const p = this.p;
    const baseY = p.height * 0.3 + Math.sin(p.frameCount * 0.01 * multiplier + this.offset) * p.height * 0.04;
    p.noFill();
    for (let i = 0; i < 8; i += 1) {
      const alpha = 28 + i * 4;
      const hue = p.map(Math.sin(this.offset + i), -1, 1, 140, 220);
      p.stroke(hue, 220, 255, alpha);
      p.beginShape();
      for (let x = -20; x <= p.width + 20; x += 32) {
        const y = baseY + Math.sin((x * 0.004) + this.offset + i * 0.3 + p.frameCount * 0.006 * multiplier) * p.height * 0.05;
        p.vertex(x, y + Math.sin(x * 0.008 + this.offset) * 10);
      }
      p.endShape();
    }
  }
}

export function createWinterScene(p) {
  const snowflakes = [];
  let ribbons = [];
  let speedMultiplier = 1;
  let glow = 0;

  function resize() {
    snowflakes.length = 0;
    const count = Math.floor(Math.max(90, (p.width * p.height) / 9000));
    for (let i = 0; i < count; i += 1) {
      snowflakes.push(new Snowflake(p));
    }
    ribbons = [
      new AuroraRibbon(p, 0),
      new AuroraRibbon(p, Math.PI / 3),
      new AuroraRibbon(p, Math.PI * 0.7)
    ];
  }

  return {
    id: 'winter',
    name: 'Hiver',
    description: 'Neige légère et aurore',
    resize,
    enter() {
      glow = 1;
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      glow = 1.3;
    },
    draw() {
      p.colorMode(p.RGB);
      const top = p.color(12, 22, 46);
      const bottom = p.color(48, 84, 120);
      for (let y = 0; y < p.height; y += 2) {
        const mix = p.map(y, 0, p.height, 0, 1, true);
        const col = p.lerpColor(top, bottom, mix);
        p.stroke(col);
        p.line(0, y, p.width, y);
      }

      p.colorMode(p.RGB);
      p.noStroke();
      p.fill(255, 255, 255, 12);
      const halo = Math.max(0, glow - 0.02);
      glow = p.lerp(glow, 0, 0.01 * speedMultiplier);
      if (halo > 0.01) {
        p.rect(0, 0, p.width, p.height);
      }

      p.colorMode(p.RGB);
      p.strokeWeight(2);
      ribbons.forEach(ribbon => ribbon.draw(speedMultiplier));
      p.strokeWeight(1);

      p.noStroke();
      p.fill(230, 240, 250);
      p.rect(0, p.height * 0.85, p.width, p.height * 0.15);

      snowflakes.forEach(flake => {
        flake.update(speedMultiplier);
        flake.draw();
      });
    }
  };
}
