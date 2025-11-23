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
    this.x = p.random(-p.width * 0.05, p.width * 1.05);
    this.w = p.random(p.width * 0.03, p.width * 0.08);
    this.height = p.random(p.height * 0.25, p.height * 0.42);
    this.alpha = p.random(28, 60);
    this.hue = p.random(180, 220);
    this.offset = p.random(p.TWO_PI);
  }

  draw(multiplier) {
    const p = this.p;
    this.offset += 0.004 * multiplier;
    const shimmer = (Math.sin(this.offset) + 1) * 0.5;
    const x = this.x + Math.sin(this.offset * 1.5) * this.w * 0.08;
    const yTop = p.height * 0.52 - this.height;
    const yBot = p.height * 0.52;

    const grad = p.drawingContext.createLinearGradient(x, yTop, x, yBot);
    const color = `hsla(${this.hue}, 80%, 80%, ${this.alpha / 255})`;
    grad.addColorStop(0, `${color}`);
    grad.addColorStop(0.45, `hsla(${this.hue}, 80%, 85%, ${(this.alpha + 40) / 255})`);
    grad.addColorStop(1, `hsla(${this.hue}, 70%, 80%, ${(this.alpha * 0.2 + shimmer * 20) / 255})`);

    p.drawingContext.fillStyle = grad;
    p.noStroke();
    p.rect(x - this.w * 0.5, yTop, this.w, this.height);
  }
}

class FrostWisp {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-p.width * 0.05, p.width * 1.05);
    this.y = p.random(p.height * 0.7, p.height * 0.9);
    this.len = p.random(p.width * 0.05, p.width * 0.12);
    this.alpha = p.random(30, 80);
    this.speed = p.random(0.2, 0.6);
  }

  update(multiplier) {
    const p = this.p;
    this.x += this.speed * multiplier;
    if (this.x > p.width + this.len) {
      this.x = -this.len;
      this.y = p.random(p.height * 0.7, p.height * 0.9);
    }
  }

  draw() {
    const p = this.p;
    const grad = p.drawingContext.createLinearGradient(this.x, this.y, this.x + this.len, this.y);
    grad.addColorStop(0, `rgba(200,230,255,${this.alpha / 255})`);
    grad.addColorStop(1, `rgba(200,230,255,0)`);
    p.drawingContext.fillStyle = grad;
    p.noStroke();
    p.rect(this.x, this.y - 2, this.len, 4);
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
  const sparkles = [];
  const pillars = [];
  const wisps = [];
  const moon = new Moon(p);
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
    const pillarCount = Math.max(3, Math.floor(p.width / 260));
    for (let i = 0; i < pillarCount; i += 1) {
      pillars.push(new LightPillar(p));
    }

    wisps.length = 0;
    const wispCount = Math.max(4, Math.floor(p.width / 220));
    for (let i = 0; i < wispCount; i += 1) {
      wisps.push(new FrostWisp(p));
    }

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
      const skyGrad = p.drawingContext.createLinearGradient(0, 0, 0, p.height * 0.65);
      skyGrad.addColorStop(0, 'rgb(10,18,34)');
      skyGrad.addColorStop(0.45, 'rgb(18,36,68)');
      skyGrad.addColorStop(1, 'rgb(32,64,96)');
      p.drawingContext.fillStyle = skyGrad;
      p.noStroke();
      p.rect(0, 0, p.width, p.height * 0.65);

      stars.forEach(star => {
        star.update(speedMultiplier);
        star.draw();
      });

      moon.draw(Math.max(0.8, glow));

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

      pillars.forEach(pillar => pillar.draw(speedMultiplier));

      const reflectionTop = p.height * 0.52;
      const reflectionHeight = p.height * 0.22;
      const reflectGrad = p.drawingContext.createLinearGradient(0, reflectionTop, 0, reflectionTop + reflectionHeight);
      reflectGrad.addColorStop(0, 'rgba(28,52,82,0.6)');
      reflectGrad.addColorStop(1, 'rgba(18,36,58,0.9)');
      p.drawingContext.fillStyle = reflectGrad;
      p.rect(0, reflectionTop, p.width, reflectionHeight);

      p.push();
      p.translate(0, reflectionTop * 2);
      p.scale(1, -1);
      p.strokeWeight(2);
      p.stroke(200, 220, 255, 80);
      ribbons.forEach(ribbon => ribbon.draw(speedMultiplier * 0.8));
      p.pop();

      wisps.forEach(wisp => {
        wisp.update(speedMultiplier);
        wisp.draw();
      });

      p.noStroke();
      const snowTop = p.height * 0.74;
      const snowHeight = p.height - snowTop;
      p.fill(236, 244, 252);
      p.rect(0, snowTop, p.width, snowHeight);

      const sheen = p.drawingContext.createLinearGradient(0, snowTop, 0, p.height);
      sheen.addColorStop(0, 'rgba(255,255,255,0.25)');
      sheen.addColorStop(1, 'rgba(210,228,240,0.18)');
      p.drawingContext.fillStyle = sheen;
      p.rect(0, snowTop, p.width, snowHeight);

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
