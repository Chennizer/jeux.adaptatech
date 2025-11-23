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

class GroundSparkle {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-10, p.width + 10);
    this.y = p.random(p.height * 0.8, p.height * 0.98);
    this.size = p.random(1, 2);
    this.alpha = p.random(40, 120);
    this.twinkleSpeed = p.random(0.006, 0.02);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    this.phase += this.twinkleSpeed * multiplier;
  }

  draw() {
    const p = this.p;
    const twinkle = (Math.sin(this.phase) + 1) * 0.5;
    const a = p.map(twinkle, 0, 1, this.alpha * 0.3, this.alpha, true);
    p.noStroke();
    p.fill(255, 255, 255, a);
    p.circle(this.x, this.y, this.size + twinkle * 0.8);
  }
}

class LightPillar {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width * 0.1, p.width * 0.9);
    this.width = p.random(p.width * 0.03, p.width * 0.06);
    this.height = p.random(p.height * 0.22, p.height * 0.3);
    this.alphaBase = p.random(24, 48);
    this.flicker = p.random(0.004, 0.012);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    this.phase += this.flicker * multiplier;
  }

  draw(horizon, glow) {
    const p = this.p;
    const twinkle = (Math.sin(this.phase) + 1) * 0.5;
    const alpha = (this.alphaBase + twinkle * 36) * glow;
    const grad = p.drawingContext.createLinearGradient(this.x, horizon - this.height, this.x, horizon + this.height * 0.15);
    grad.addColorStop(0, `rgba(180, 230, 255, ${alpha / 255})`);
    grad.addColorStop(0.45, `rgba(170, 210, 255, ${(alpha * 0.6) / 255})`);
    grad.addColorStop(1, 'rgba(200, 240, 255, 0)');
    p.noStroke();
    p.drawingContext.fillStyle = grad;
    p.rect(this.x - this.width * 0.5, horizon - this.height, this.width, this.height * 1.15);
  }
}

class Moon {
  constructor(p) {
    this.p = p;
    this.position = { x: 0, y: 0, r: 0 };
  }

  resize() {
    const p = this.p;
    const r = Math.min(p.width, p.height) * 0.07;
    this.position = {
      x: p.width * 0.2,
      y: p.height * 0.2,
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
    const baseY = p.height * 0.28 + Math.sin(p.frameCount * 0.008 * multiplier + this.offset) * p.height * 0.035;
    p.noFill();
    for (let i = 0; i < 8; i += 1) {
      const alpha = 24 + i * 4;
      const hue = p.map(Math.sin(this.offset + i), -1, 1, 140, 220);
      p.stroke(hue, 220, 255, alpha);
      p.beginShape();
      for (let x = -20; x <= p.width + 20; x += 34) {
        const y = baseY + Math.sin((x * 0.004) + this.offset + i * 0.3 + p.frameCount * 0.005 * multiplier) * p.height * 0.05;
        p.vertex(x, y + Math.sin(x * 0.008 + this.offset) * 10);
      }
      p.endShape();
    }
  }
}

export function createWinterScene(p) {
  const snowflakes = [];
  const stars = [];
  const sparkles = [];
  const pillars = [];
  const moon = new Moon(p);
  let ribbons = [];
  let groundProfile = [];
  let horizonY = 0;
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

    stars.length = 0;
    const starCount = Math.floor(Math.max(40, (p.width * p.height) / 18000));
    for (let i = 0; i < starCount; i += 1) {
      stars.push(new Star(p));
    }

    sparkles.length = 0;
    const sparkleCount = Math.floor(Math.max(30, p.width / 18));
    for (let i = 0; i < sparkleCount; i += 1) {
      sparkles.push(new GroundSparkle(p));
    }

    pillars.length = 0;
    const pillarCount = Math.max(3, Math.floor(p.width / 200));
    for (let i = 0; i < pillarCount; i += 1) {
      pillars.push(new LightPillar(p));
    }

    horizonY = p.height * 0.63;
    groundProfile = [];
    const segments = Math.max(24, Math.floor(p.width / 30));
    const base = p.height * 0.8;
    const amp = p.height * 0.03;
    for (let i = 0; i <= segments; i += 1) {
      const x = p.map(i, 0, segments, -20, p.width + 20);
      const y = base + Math.sin(i * 0.6) * amp * 0.2 + (p.noise(i * 0.12) - 0.5) * amp;
      groundProfile.push({ x, y });
    }

    moon.resize();
  }

  return {
    id: 'winter',
    name: 'Hiver',
    description: 'Nuit glacée, reflets et piliers de lumière',
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
      const ctx = p.drawingContext;
      const sky = ctx.createLinearGradient(0, 0, 0, p.height);
      sky.addColorStop(0, 'rgb(8, 18, 44)');
      sky.addColorStop(0.45, 'rgb(14, 40, 74)');
      sky.addColorStop(0.78, 'rgb(26, 80, 116)');
      sky.addColorStop(1, 'rgb(18, 46, 68)');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, p.width, p.height);

      stars.forEach(star => {
        star.update(speedMultiplier);
        star.draw();
      });

      moon.draw(Math.max(0.8, glow));

      p.colorMode(p.RGB);
      p.noStroke();
      const halo = Math.max(0, glow - 0.05);
      glow = p.lerp(glow, 0, 0.01 * speedMultiplier);
      if (halo > 0.01) {
        p.fill(255, 255, 255, 10 * halo);
        p.rect(0, 0, p.width, p.height);
      }

      pillars.forEach(pillar => {
        pillar.update(speedMultiplier);
        pillar.draw(horizonY, Math.max(0.7, glow));
      });

      p.strokeWeight(2);
      ribbons.forEach(ribbon => ribbon.draw(speedMultiplier));
      p.strokeWeight(1);

      ctx.save();
      const iceGrad = ctx.createLinearGradient(0, horizonY, 0, p.height);
      iceGrad.addColorStop(0, 'rgba(180, 210, 240, 0.18)');
      iceGrad.addColorStop(0.35, 'rgba(140, 180, 220, 0.22)');
      iceGrad.addColorStop(1, 'rgba(200, 220, 240, 0.35)');
      ctx.fillStyle = iceGrad;
      ctx.fillRect(0, horizonY, p.width, p.height - horizonY);

      ctx.beginPath();
      ctx.moveTo(groundProfile[0].x, groundProfile[0].y);
      for (let i = 1; i < groundProfile.length; i += 1) {
        ctx.lineTo(groundProfile[i].x, groundProfile[i].y);
      }
      ctx.lineTo(p.width + 30, p.height + 10);
      ctx.lineTo(-30, p.height + 10);
      ctx.closePath();
      const snowGrad = ctx.createLinearGradient(0, horizonY, 0, p.height);
      snowGrad.addColorStop(0, 'rgb(224, 234, 246)');
      snowGrad.addColorStop(1, 'rgb(210, 224, 238)');
      ctx.fillStyle = snowGrad;
      ctx.fill();
      ctx.restore();

      sparkles.forEach(sparkle => {
        sparkle.update(speedMultiplier);
        sparkle.draw();
      });

      snowflakes.forEach(flake => {
        flake.update(speedMultiplier);
        flake.draw();
      });
    }
  };
}
