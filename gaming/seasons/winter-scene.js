class Snowflake {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(startTop = false) {
    const p = this.p;
    this.x = p.random(-p.width * 0.1, p.width * 1.1);
    this.y = startTop ? p.random(-p.height, -8) : p.random(-p.height * 0.2, p.height);
    this.size = p.random(1.4, 4.2);
    this.speed = p.random(0.5, 1.3);
    this.drift = p.random(-0.5, 0.5);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    const p = this.p;
    this.phase += 0.008 * multiplier;
    this.x += Math.sin(this.phase) * this.drift * multiplier;
    this.y += this.speed * 1.7 * multiplier;
    if (this.y > p.height + this.size * 2) {
      this.reset(true);
      this.y = -this.size;
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(235, 245, 255, 210);
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
    this.y = p.random(p.height * 0.02, p.height * 0.5);
    this.size = p.random(1, 2.2);
    this.base = p.random(140, 210);
    this.twinkleSpeed = p.random(0.004, 0.012);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    this.phase += this.twinkleSpeed * multiplier;
  }

  draw() {
    const p = this.p;
    const twinkle = (Math.sin(this.phase) + 1) * 0.5;
    const alpha = p.map(twinkle, 0, 1, this.base - 50, this.base + 60, true);
    p.noStroke();
    p.fill(240, 248, 255, alpha);
    p.circle(this.x, this.y, this.size + twinkle * 0.7);
    if (twinkle > 0.82) {
      p.stroke(240, 248, 255, alpha * 0.8);
      p.strokeWeight(1);
      p.line(this.x - 3, this.y, this.x + 3, this.y);
      p.line(this.x, this.y - 3, this.x, this.y + 3);
    }
  }
}

class Lantern {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.anchorY = p.random(p.height * 0.6, p.height * 0.85);
    this.x = p.random(-p.width * 0.1, p.width * 1.1);
    this.y = this.anchorY - p.random(10, p.height * 0.3);
    this.size = p.random(10, 20);
    this.sway = p.random(8, 16);
    this.speed = p.random(0.12, 0.25);
    this.drift = p.random(0.4, 1.2);
    this.hue = p.random(32, 58);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    const p = this.p;
    this.phase += 0.01 * multiplier;
    this.y -= this.speed * 25 * multiplier;
    this.x += Math.sin(this.phase) * this.sway * 0.02 * multiplier;
    if (this.y < p.height * 0.14) {
      this.reset();
      this.y = this.anchorY;
    }
    this.anchorY -= this.speed * 18 * multiplier;
  }

  draw() {
    const p = this.p;
    const glow = (Math.sin(this.phase * 2) + 1) * 0.4 + 0.4;
    const cx = this.x + Math.sin(this.phase) * this.sway * 0.3;
    const cy = this.y;

    p.stroke(200, 200, 215, 50);
    p.strokeWeight(1);
    p.line(cx, cy, cx, this.anchorY);

    p.noStroke();
    p.fill(this.hue + 10, 120, 90, 30);
    p.circle(cx, cy, this.size * 2.6);

    p.fill(this.hue, 150, 200, 200);
    p.circle(cx, cy, this.size * (0.9 + glow * 0.3));
    p.fill(255, 245, 225, 240);
    p.circle(cx, cy, this.size * (0.55 + glow * 0.25));
  }
}

class FrostSpark {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-10, p.width + 10);
    this.y = p.random(p.height * 0.68, p.height * 0.95);
    this.size = p.random(1, 2.8);
    this.alpha = p.random(40, 120);
    this.angle = p.random(p.TWO_PI);
  }

  draw(multiplier) {
    const p = this.p;
    const shimmer = (Math.sin(p.frameCount * 0.01 * multiplier + this.angle) + 1) * 0.5;
    p.noStroke();
    p.fill(210, 230, 250, this.alpha * (0.4 + shimmer * 0.6));
    p.circle(this.x, this.y, this.size + shimmer * 0.7);
  }
}

export function createWinterScene(p) {
  const snowflakes = [];
  const stars = [];
  const lanterns = [];
  const sparks = [];
  let ridges = [[], []];
  let speedMultiplier = 1;

  const gradientRect = (x, y, w, h, stops) => {
    const ctx = p.drawingContext;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    stops.forEach(stop => grad.addColorStop(stop.at, stop.color));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  };

  const generateRidge = (heightFactor, variance) => {
    const points = [];
    const segments = 16;
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const base = p.lerp(p.height * heightFactor, p.height * (heightFactor + 0.08), Math.sin(t * Math.PI));
      const jitter = p.noise(t * 2, heightFactor * 10) * variance * p.height;
      points.push({ x: p.width * t, y: base - jitter });
    }
    return points;
  };

  const drawRidge = (points, color) => {
    p.noStroke();
    p.fill(color);
    p.beginShape();
    p.vertex(0, p.height);
    points.forEach(pt => p.vertex(pt.x, pt.y));
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);
  };

  function resize() {
    snowflakes.length = 0;
    const snowCount = Math.floor(Math.max(110, (p.width * p.height) / 7500));
    for (let i = 0; i < snowCount; i += 1) snowflakes.push(new Snowflake(p));

    stars.length = 0;
    const starCount = Math.floor(Math.max(60, (p.width * p.height) / 14000));
    for (let i = 0; i < starCount; i += 1) stars.push(new Star(p));

    lanterns.length = 0;
    const lanternCount = Math.floor(Math.max(8, p.width / 120));
    for (let i = 0; i < lanternCount; i += 1) lanterns.push(new Lantern(p));

    sparks.length = 0;
    const sparkCount = Math.floor(Math.max(40, p.width / 12));
    for (let i = 0; i < sparkCount; i += 1) sparks.push(new FrostSpark(p));

    ridges = [
      generateRidge(0.62, 0.02),
      generateRidge(0.7, 0.03)
    ];
  }

  return {
    id: 'winter',
    name: 'Hiver',
    description: 'Flocons et lanternes polaires',
    resize,
    enter() {},
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      lanterns.forEach(l => {
        l.phase += 0.6;
      });
    },
    draw() {
      p.colorMode(p.RGB);
      gradientRect(0, 0, p.width, p.height, [
        { at: 0, color: 'rgb(12, 18, 34)' },
        { at: 0.4, color: 'rgb(18, 32, 58)' },
        { at: 1, color: 'rgb(40, 74, 108)' }
      ]);

      p.noStroke();
      p.fill(10, 16, 26, 80);
      p.rect(0, 0, p.width, p.height);

      stars.forEach(star => {
        star.update(speedMultiplier);
        star.draw();
      });

      // North star accent
      const northX = p.width * 0.2;
      const northY = p.height * 0.18;
      p.stroke(240, 248, 255, 150);
      p.strokeWeight(1);
      p.line(northX - 6, northY, northX + 6, northY);
      p.line(northX, northY - 6, northX, northY + 6);
      p.noStroke();
      p.fill(255, 255, 255, 200);
      p.circle(northX, northY, 3);

      drawRidge(ridges[0], p.color(20, 36, 58));
      drawRidge(ridges[1], p.color(32, 54, 80));

      gradientRect(0, p.height * 0.62, p.width, p.height * 0.4, [
        { at: 0, color: 'rgba(190, 215, 234, 0.95)' },
        { at: 1, color: 'rgba(150, 190, 214, 0.92)' }
      ]);

      p.noStroke();
      p.fill(255, 255, 255, 20);
      p.rect(0, p.height * 0.62, p.width, p.height * 0.4);

      sparks.forEach(spark => spark.draw(speedMultiplier));

      lanterns.forEach(lantern => {
        lantern.update(speedMultiplier);
        lantern.draw();
      });

      snowflakes.forEach(flake => {
        flake.update(speedMultiplier);
        flake.draw();
      });
    }
  };
}
