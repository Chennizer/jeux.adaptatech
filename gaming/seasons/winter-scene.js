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

class Star {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width * -0.05, p.width * 1.05);
    this.y = p.random(p.height * 0.02, p.height * 0.55);
    this.size = p.random(1, 2.4);
    this.base = p.random(130, 210);
    this.twinkleSpeed = p.random(0.005, 0.014);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    this.phase += this.twinkleSpeed * multiplier;
  }

  draw() {
    const p = this.p;
    const twinkle = (Math.sin(this.phase) + 1) * 0.5;
    const alpha = p.map(twinkle, 0, 1, this.base - 50, this.base + 40, true);
    p.noStroke();
    p.fill(240, 248, 255, alpha);
    p.circle(this.x, this.y, this.size + twinkle * 0.8);
    if (twinkle > 0.8) {
      p.stroke(240, 248, 255, alpha * 0.8);
      p.strokeWeight(1);
      p.line(this.x - 3, this.y, this.x + 3, this.y);
      p.line(this.x, this.y - 3, this.x, this.y + 3);
    }
  }
}

class IceGlimmer {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-10, p.width + 10);
    this.y = p.random(p.height * 0.72, p.height * 0.95);
    this.size = p.random(1, 2.4);
    this.alpha = p.random(50, 130);
    this.twinkleSpeed = p.random(0.006, 0.02);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    this.phase += this.twinkleSpeed * multiplier;
  }

  draw() {
    const p = this.p;
    const twinkle = (Math.sin(this.phase) + 1) * 0.5;
    const a = p.map(twinkle, 0, 1, this.alpha * 0.25, this.alpha, true);
    p.noStroke();
    p.fill(220, 240, 255, a);
    p.circle(this.x, this.y, this.size + twinkle * 0.9);
    p.stroke(210, 230, 255, a * 0.5);
    p.strokeWeight(0.6);
    p.line(this.x - 2, this.y, this.x + 2, this.y);
  }
}

class Moon {
  constructor(p) {
    this.p = p;
    this.position = { x: 0, y: 0, r: 0 };
  }

  resize() {
    const p = this.p;
    const r = Math.min(p.width, p.height) * 0.08;
    this.position = {
      x: p.width * 0.18,
      y: p.height * 0.18,
      r
    };
  }

  draw(glow) {
    const p = this.p;
    const { x, y, r } = this.position;
    p.noStroke();
    p.fill(240, 245, 255, 220);
    p.circle(x, y, r * 1.05);

    for (let i = 0; i < 4; i += 1) {
      const alpha = 40 - i * 8;
      p.fill(200, 215, 255, alpha * glow);
      p.circle(x, y, r * (1.8 + i * 0.6));
    }

    p.stroke(255, 255, 255, 90 * glow);
    p.strokeWeight(1);
    p.noFill();
    p.circle(x, y, r * 2.8);
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
  const stars = [];
  const glimmers = [];
  const moon = new Moon(p);
  let ribbons = [];
  let windStreaks = [];
  let speedMultiplier = 1;
  let glow = 0;

  const gradientRect = (x, y, w, h, stops) => {
    const ctx = p.drawingContext;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    stops.forEach(stop => grad.addColorStop(stop.at, stop.color));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  };

  class WindStreak {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = p.random(-p.width * 0.2, p.width);
      this.y = p.random(p.height * 0.15, p.height * 0.85);
      this.len = p.random(p.width * 0.1, p.width * 0.28);
      this.alpha = p.random(20, 50);
      this.weight = p.random(1, 2.2);
      this.speed = p.random(1.4, 2.4);
    }

    update(multiplier) {
      this.x += this.speed * multiplier;
      if (this.x - this.len > p.width + 40) {
        this.reset();
        this.x = -this.len - 20;
      }
    }

    draw() {
      p.stroke(220, 235, 255, this.alpha);
      p.strokeWeight(this.weight);
      p.line(this.x, this.y, this.x - this.len, this.y + p.random(-2, 2));
    }
  }

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

    stars.length = 0;
    const starCount = Math.floor(Math.max(50, (p.width * p.height) / 15000));
    for (let i = 0; i < starCount; i += 1) {
      stars.push(new Star(p));
    }

    glimmers.length = 0;
    const glimmerCount = Math.floor(Math.max(36, p.width / 14));
    for (let i = 0; i < glimmerCount; i += 1) {
      glimmers.push(new IceGlimmer(p));
    }

    const streakCount = Math.floor(Math.max(6, p.width / 160));
    windStreaks = Array.from({ length: streakCount }, () => new WindStreak());

    moon.resize();
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
      gradientRect(0, 0, p.width, p.height, [
        { at: 0, color: 'rgb(10, 18, 34)' },
        { at: 0.45, color: 'rgb(20, 34, 68)' },
        { at: 1, color: 'rgb(32, 66, 102)' }
      ]);

      p.noStroke();
      p.fill(8, 14, 26, 120);
      p.rect(0, 0, p.width, p.height);

      stars.forEach(star => {
        star.update(speedMultiplier);
        star.draw();
      });

      moon.draw(Math.max(0.8, glow));

      const horizonY = p.height * 0.52;
      p.noStroke();
      p.fill(12, 24, 38);
      p.beginShape();
      p.vertex(0, horizonY + p.height * 0.04);
      p.bezierVertex(p.width * 0.2, horizonY, p.width * 0.4, horizonY + p.height * 0.06, p.width * 0.6, horizonY + p.height * 0.02);
      p.bezierVertex(p.width * 0.76, horizonY + p.height * 0.04, p.width * 0.88, horizonY - p.height * 0.02, p.width, horizonY + p.height * 0.03);
      p.vertex(p.width, p.height);
      p.vertex(0, p.height);
      p.endShape(p.CLOSE);

      p.fill(18, 32, 54);
      p.beginShape();
      p.vertex(0, horizonY + p.height * 0.08);
      p.bezierVertex(p.width * 0.3, horizonY + p.height * 0.02, p.width * 0.5, horizonY + p.height * 0.1, p.width * 0.8, horizonY + p.height * 0.05);
      p.vertex(p.width, p.height);
      p.vertex(0, p.height);
      p.endShape(p.CLOSE);

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

      gradientRect(0, horizonY, p.width, p.height - horizonY, [
        { at: 0, color: 'rgba(180, 210, 232, 0.9)' },
        { at: 1, color: 'rgba(120, 170, 208, 0.94)' }
      ]);

      const reflectionSize = Math.min(p.width, p.height) * 0.18;
      p.fill(255, 255, 255, 16);
      p.ellipse(moon.position.x, horizonY + reflectionSize * 0.4, reflectionSize, reflectionSize * 0.45);
      p.fill(200, 225, 245, 12);
      p.ellipse(moon.position.x, horizonY + reflectionSize * 0.45, reflectionSize * 1.3, reflectionSize * 0.6);

      glimmers.forEach(glimmer => {
        glimmer.update(speedMultiplier);
        glimmer.draw();
      });

      windStreaks.forEach(streak => {
        streak.update(speedMultiplier);
        streak.draw();
      });

      snowflakes.forEach(flake => {
        flake.update(speedMultiplier);
        flake.draw();
      });
    }
  };
}
