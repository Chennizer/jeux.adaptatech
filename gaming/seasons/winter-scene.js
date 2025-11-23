class Snowflake {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-p.width * 0.1, p.width * 1.1);
    this.y = p.random(-p.height, -10);
    this.size = p.random(2, 5);
    this.speed = p.random(0.7, 1.2);
    this.drift = p.random(-0.6, 0.6);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    const p = this.p;
    this.phase += 0.01 * multiplier;
    this.x += Math.sin(this.phase) * this.drift * multiplier;
    this.y += this.speed * 2.2 * multiplier;
    if (this.y > p.height + this.size) {
      this.reset();
      this.y = -this.size;
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(238, 244, 255, 210);
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
    this.x = p.random(-p.width * 0.05, p.width * 1.05);
    this.y = p.random(p.height * 0.02, p.height * 0.35);
    this.size = p.random(1, 2);
    this.base = p.random(120, 190);
    this.twinkleSpeed = p.random(0.008, 0.016);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    this.phase += this.twinkleSpeed * multiplier;
  }

  draw() {
    const p = this.p;
    const twinkle = (Math.sin(this.phase) + 1) * 0.5;
    const alpha = p.map(twinkle, 0, 1, this.base - 40, this.base + 50, true);
    p.noStroke();
    p.fill(240, 248, 255, alpha);
    p.circle(this.x, this.y, this.size + twinkle * 0.6);
  }
}

class FogBand {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.y = p.random(p.height * 0.45, p.height * 0.82);
    this.height = p.random(p.height * 0.04, p.height * 0.08);
    this.alpha = p.random(18, 36);
    this.speed = p.random(0.2, 0.45);
    this.offset = p.random(p.width);
  }

  update(multiplier) {
    this.offset += this.speed * multiplier;
    if (this.offset > this.p.width * 1.5) {
      this.reset();
      this.offset = -this.p.width * 0.5;
    }
  }

  draw() {
    const p = this.p;
    const gradientRect = (x, y, w, h, stops) => {
      const ctx = p.drawingContext;
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      stops.forEach(stop => grad.addColorStop(stop.at, stop.color));
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
    };

    gradientRect(-p.width + this.offset, this.y, p.width * 2, this.height, [
      { at: 0, color: `rgba(200, 222, 242, 0)` },
      { at: 0.5, color: `rgba(200, 222, 242, ${this.alpha / 255})` },
      { at: 1, color: `rgba(200, 222, 242, 0)` }
    ]);
  }
}

export function createWinterScene(p) {
  const snowflakes = [];
  const stars = [];
  const fogBands = [];
  let horizonY = 0;
  let speedMultiplier = 1;

  const gradientRect = (x, y, w, h, stops) => {
    const ctx = p.drawingContext;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    stops.forEach(stop => grad.addColorStop(stop.at, stop.color));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  };

  const drawMountains = () => {
    const layers = [
      { color: [20, 36, 60], noise: 0.0028, amp: 80 },
      { color: [32, 56, 88], noise: 0.0034, amp: 120 }
    ];

    layers.forEach((layer, idx) => {
      const yBase = horizonY * (0.72 + idx * 0.08);
      p.noStroke();
      p.fill(...layer.color);
      p.beginShape();
      p.vertex(0, horizonY);
      for (let x = 0; x <= p.width; x += 12) {
        const n = p.noise(x * layer.noise, idx * 80);
        const y = yBase - n * layer.amp;
        p.vertex(x, y);
      }
      p.vertex(p.width, horizonY);
      p.vertex(p.width, p.height);
      p.vertex(0, p.height);
      p.endShape(p.CLOSE);
    });
  };

  const drawPines = () => {
    p.noStroke();
    const rows = 2;
    for (let r = 0; r < rows; r += 1) {
      const depth = 1 - r * 0.22;
      const baseY = horizonY + p.height * (0.08 + r * 0.05);
      const spread = 26 - r * 4;
      const color = p.lerpColor(p.color(26, 46, 70), p.color(38, 74, 102), r * 0.5);
      for (let x = -40; x <= p.width + 40; x += spread) {
        const jitter = p.random(-10, 10);
        const h = p.random(p.height * 0.08, p.height * 0.12) * depth;
        const w = h * 0.6;
        p.fill(color);
        p.triangle(x + jitter, baseY, x + jitter - w, baseY + h, x + jitter + w, baseY + h);
      }
    }
  };

  const drawPath = () => {
    const pathWidth = p.width * 0.42;
    const left = p.width * 0.3;
    const right = left + pathWidth;
    p.noStroke();
    p.fill(210, 220, 230, 140);
    p.beginShape();
    p.vertex(left, p.height);
    p.vertex(right, p.height);
    p.vertex(right * 0.96, horizonY + p.height * 0.08);
    p.vertex(left * 1.05, horizonY + p.height * 0.08);
    p.endShape(p.CLOSE);

    p.fill(255, 255, 255, 90);
    p.beginShape();
    p.vertex(left + 8, p.height);
    p.vertex(right - 8, p.height);
    p.vertex(right * 0.95, horizonY + p.height * 0.1);
    p.vertex(left * 1.03, horizonY + p.height * 0.1);
    p.endShape(p.CLOSE);
  };

  const drawSnowField = () => {
    gradientRect(0, horizonY, p.width, p.height - horizonY, [
      { at: 0, color: 'rgba(214, 224, 232, 0.9)' },
      { at: 1, color: 'rgba(184, 200, 214, 0.96)' }
    ]);

    p.noStroke();
    p.fill(255, 255, 255, 24);
    for (let i = 0; i < 6; i += 1) {
      const y = horizonY + p.height * 0.08 + i * p.height * 0.05;
      p.rect(0, y, p.width, 2);
    }
  };

  function resize() {
    snowflakes.length = 0;
    const snowCount = Math.floor(Math.max(180, (p.width * p.height) / 5000));
    for (let i = 0; i < snowCount; i += 1) {
      snowflakes.push(new Snowflake(p));
    }

    stars.length = 0;
    const starCount = Math.floor(Math.max(40, (p.width * p.height) / 18000));
    for (let i = 0; i < starCount; i += 1) {
      stars.push(new Star(p));
    }

    fogBands.length = 0;
    const fogCount = Math.max(3, Math.floor(p.width / 260));
    for (let i = 0; i < fogCount; i += 1) {
      fogBands.push(new FogBand(p));
    }

    horizonY = p.height * 0.58;
  }

  return {
    id: 'winter',
    name: 'Hiver',
    description: 'Sentier nocturne enneigé',
    resize,
    enter() {},
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {},
    draw() {
      p.colorMode(p.RGB);
      gradientRect(0, 0, p.width, p.height, [
        { at: 0, color: 'rgb(14, 28, 52)' },
        { at: 0.45, color: 'rgb(24, 46, 78)' },
        { at: 1, color: 'rgb(46, 76, 110)' }
      ]);

      stars.forEach(star => {
        star.update(speedMultiplier);
        star.draw();
      });

      drawMountains();
      drawPines();
      drawSnowField();
      drawPath();

      fogBands.forEach(fog => {
        fog.update(speedMultiplier);
        fog.draw();
      });

      snowflakes.forEach(flake => {
        flake.update(speedMultiplier);
        flake.draw();
      });
    }
  };
}
