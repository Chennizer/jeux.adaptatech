class Snowflake {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.depth = p.random(0.4, 1.2);
    this.x = p.random(-p.width * 0.1, p.width * 1.1);
    this.y = p.random(-p.height, p.height);
    this.size = p.map(this.depth, 0.4, 1.2, 1.4, 3.8);
    this.speed = p.map(this.depth, 0.4, 1.2, 0.4, 1.6);
    this.drift = p.random(-0.4, 0.4);
    this.angle = p.random(p.TWO_PI);
  }

  update(multiplier) {
    const p = this.p;
    this.angle += 0.01 * multiplier;
    this.x += Math.sin(this.angle) * this.drift * multiplier;
    this.y += this.speed * 1.5 * multiplier;
    if (this.y > p.height + this.size) {
      this.reset();
      this.y = -this.size;
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(240, 248, 255, 220);
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
    this.y = p.random(p.height * 0.02, p.height * 0.45);
    this.size = p.random(1, 2.4);
    this.base = p.random(150, 220);
    this.twinkleSpeed = p.random(0.004, 0.013);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    this.phase += this.twinkleSpeed * multiplier;
  }

  draw(boost = 0) {
    const p = this.p;
    const twinkle = (Math.sin(this.phase) + 1) * 0.5;
    const alpha = p.map(twinkle, 0, 1, this.base - 40, this.base + 30, true) + boost;
    p.noStroke();
    p.fill(235, 245, 255, alpha);
    p.circle(this.x, this.y, this.size + twinkle * 0.7);
    if (twinkle > 0.82) {
      p.stroke(235, 245, 255, alpha * 0.8);
      p.strokeWeight(1);
      p.line(this.x - 3, this.y, this.x + 3, this.y);
      p.line(this.x, this.y - 3, this.x, this.y + 3);
    }
  }
}

class MistBand {
  constructor(p, y) {
    this.p = p;
    this.baseY = y;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-p.width, 0);
    this.speed = p.random(0.3, 0.7);
    this.alpha = p.random(18, 36);
    this.height = p.random(p.height * 0.05, p.height * 0.12);
    this.wobble = p.random(0.3, 0.7);
  }

  update(multiplier) {
    this.x += this.speed * multiplier;
    if (this.x > this.p.width) {
      this.reset();
      this.x = -this.p.width;
    }
  }

  draw() {
    const p = this.p;
    const ctx = p.drawingContext;
    const gradient = ctx.createLinearGradient(0, this.baseY, 0, this.baseY + this.height);
    gradient.addColorStop(0, `rgba(200, 220, 240, ${this.alpha / 255})`);
    gradient.addColorStop(1, `rgba(200, 220, 240, ${(this.alpha - 8) / 255})`);
    ctx.save();
    ctx.translate(this.x, Math.sin(p.frameCount * 0.002 * this.wobble) * 6);
    ctx.fillStyle = gradient;
    ctx.fillRect(-30, this.baseY, p.width + 60, this.height);
    ctx.restore();
  }
}

class Lantern {
  constructor(p, x, baseY) {
    this.p = p;
    this.x = x;
    this.baseY = baseY;
    this.height = p.random(p.height * 0.08, p.height * 0.14);
    this.flickerPhase = p.random(p.TWO_PI);
    this.flickerSpeed = p.random(0.03, 0.05);
    this.warmth = p.random(180, 220);
  }

  update(multiplier) {
    this.flickerPhase += this.flickerSpeed * multiplier;
  }

  draw(glow) {
    const p = this.p;
    const sway = Math.sin(this.flickerPhase * 0.4) * 1.5;
    const poleTopY = this.baseY - this.height;
    p.stroke(60, 70, 90, 180);
    p.strokeWeight(3);
    p.line(this.x, this.baseY, this.x + sway, poleTopY);

    const twinkle = (Math.sin(this.flickerPhase) + 1) * 0.5;
    const intensity = p.map(twinkle, 0, 1, 180, 255) * glow;
    p.noStroke();
    p.fill(255, 210, 140, intensity);
    p.circle(this.x + sway, poleTopY - 6, 12 + twinkle * 2);

    p.fill(255, 195, 120, intensity * 0.4);
    p.circle(this.x + sway, poleTopY - 6, 28 + twinkle * 3);
  }
}

class Constellation {
  constructor(p, points) {
    this.p = p;
    this.points = points;
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    this.phase += 0.004 * multiplier;
  }

  draw() {
    const p = this.p;
    const glow = (Math.sin(this.phase) + 1) * 0.5;
    p.stroke(220, 235, 255, 80 + glow * 80);
    p.strokeWeight(1);
    p.noFill();
    p.beginShape();
    this.points.forEach(pt => p.vertex(pt.x, pt.y));
    p.endShape();
    this.points.forEach(pt => {
      p.noStroke();
      p.fill(230, 240, 255, 150 + glow * 80);
      p.circle(pt.x, pt.y, 3.6 + glow);
    });
  }
}

export function createWinterScene(p) {
  const snowflakes = [];
  const stars = [];
  const lanterns = [];
  const mists = [];
  const constellations = [];
  let speedMultiplier = 1;
  let glow = 1;
  let horizonY = 0;

  const gradientRect = (x, y, w, h, stops) => {
    const ctx = p.drawingContext;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    stops.forEach(stop => grad.addColorStop(stop.at, stop.color));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  };

  function buildConstellation(count) {
    const pts = [];
    for (let i = 0; i < count; i += 1) {
      pts.push({
        x: p.random(p.width * 0.1, p.width * 0.9),
        y: p.random(p.height * 0.08, p.height * 0.35)
      });
    }
    pts.sort((a, b) => a.x - b.x);
    return new Constellation(p, pts);
  }

  function resize() {
    horizonY = p.height * 0.62;

    snowflakes.length = 0;
    const snowCount = Math.floor(Math.max(110, (p.width * p.height) / 9000));
    for (let i = 0; i < snowCount; i += 1) {
      snowflakes.push(new Snowflake(p));
    }

    stars.length = 0;
    const starCount = Math.floor(Math.max(80, (p.width * p.height) / 14000));
    for (let i = 0; i < starCount; i += 1) {
      stars.push(new Star(p));
    }

    constellations.length = 0;
    constellations.push(buildConstellation(5));
    constellations.push(buildConstellation(6));

    mists.length = 0;
    mists.push(new MistBand(p, p.height * 0.32));
    mists.push(new MistBand(p, p.height * 0.42));

    lanterns.length = 0;
    const lanternCount = Math.max(5, Math.floor(p.width / 140));
    for (let i = 0; i < lanternCount; i += 1) {
      const x = p.map(i, 0, lanternCount - 1, p.width * 0.08, p.width * 0.92) + p.random(-12, 12);
      lanterns.push(new Lantern(p, x, p.height * 0.9 + p.random(-6, 8)));
    }
  }

  return {
    id: 'winter',
    name: 'Hiver',
    description: 'Soirée d’hiver aux lanternes',
    resize,
    enter() {
      glow = 1.1;
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      glow = 1.6;
    },
    draw() {
      p.colorMode(p.RGB);
      gradientRect(0, 0, p.width, p.height, [
        { at: 0, color: 'rgb(18, 26, 46)' },
        { at: 0.35, color: 'rgb(28, 44, 78)' },
        { at: 1, color: 'rgb(18, 32, 52)' }
      ]);

      p.noStroke();
      p.fill(12, 20, 34, 120);
      p.rect(0, 0, p.width, p.height);

      stars.forEach(star => {
        star.update(speedMultiplier);
        star.draw(glow * 10);
      });

      constellations.forEach(c => {
        c.update(speedMultiplier);
        c.draw();
      });

      mists.forEach(mist => {
        mist.update(speedMultiplier);
        mist.draw();
      });

      p.noStroke();
      p.fill(18, 28, 44);
      p.beginShape();
      p.vertex(0, horizonY + p.height * 0.06);
      p.bezierVertex(p.width * 0.22, horizonY - p.height * 0.06, p.width * 0.48, horizonY + p.height * 0.02, p.width * 0.68, horizonY - p.height * 0.05);
      p.bezierVertex(p.width * 0.82, horizonY + p.height * 0.01, p.width * 0.92, horizonY - p.height * 0.02, p.width, horizonY + p.height * 0.04);
      p.vertex(p.width, p.height);
      p.vertex(0, p.height);
      p.endShape(p.CLOSE);

      p.fill(26, 40, 60);
      p.beginShape();
      p.vertex(0, horizonY + p.height * 0.12);
      p.bezierVertex(p.width * 0.18, horizonY + p.height * 0.03, p.width * 0.46, horizonY + p.height * 0.14, p.width * 0.76, horizonY + p.height * 0.06);
      p.vertex(p.width, p.height);
      p.vertex(0, p.height);
      p.endShape(p.CLOSE);

      gradientRect(0, horizonY, p.width, p.height - horizonY, [
        { at: 0, color: 'rgba(180, 206, 230, 0.9)' },
        { at: 1, color: 'rgba(140, 176, 208, 0.96)' }
      ]);

      const halo = Math.max(0, glow - 1);
      glow = p.lerp(glow, 1, 0.015 * speedMultiplier);
      if (halo > 0.01) {
        p.fill(255, 255, 255, 18 * halo);
        p.rect(0, 0, p.width, p.height);
      }

      lanterns.forEach(lantern => {
        lantern.update(speedMultiplier);
        lantern.draw(glow);
      });

      snowflakes.forEach(flake => {
        flake.update(speedMultiplier);
        flake.draw();
      });
    }
  };
}
