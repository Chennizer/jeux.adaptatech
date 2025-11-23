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
    const baseY = p.height * 0.32 + Math.sin(p.frameCount * 0.008 * multiplier + this.offset) * p.height * 0.02;
    p.noFill();
    for (let i = 0; i < 5; i += 1) {
      const alpha = 16 + i * 6;
      const hue = p.map(Math.sin(this.offset + i * 0.7), -1, 1, 180, 220);
      p.stroke(hue, 220, 255, alpha);
      p.beginShape();
      for (let x = -30; x <= p.width + 30; x += 26) {
        const wave = Math.sin((x * 0.006) + this.offset + i * 0.4 + p.frameCount * 0.005 * multiplier);
        const sway = Math.sin(x * 0.01 + this.offset) * 8;
        const y = baseY + wave * p.height * 0.035 + sway;
        p.vertex(x, y);
      }
      p.endShape();
    }
  }
}

class IceShard {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-20, p.width + 20);
    this.base = p.random(p.height * 0.74, p.height * 0.82);
    this.height = p.random(p.height * 0.05, p.height * 0.16);
    this.tilt = p.random(-0.2, 0.2);
    this.alpha = p.random(18, 35);
  }

  draw() {
    const p = this.p;
    p.noStroke();
    const h = this.height;
    p.fill(180, 210, 240, this.alpha);
    p.quad(
      this.x - h * 0.12, this.base,
      this.x + h * 0.12, this.base,
      this.x + h * this.tilt, this.base - h,
      this.x - h * this.tilt, this.base - h * 0.92
    );
  }
}

class FrostMote {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-40, p.width + 40);
    this.y = p.random(p.height * 0.1, p.height * 0.75);
    this.speed = p.random(0.05, 0.2);
    this.size = p.random(1, 2.6);
    this.phase = p.random(p.TWO_PI);
  }

  update(multiplier) {
    const p = this.p;
    this.phase += 0.008 * multiplier;
    this.x += this.speed * multiplier;
    this.y += Math.sin(this.phase) * 0.2 * multiplier;
    if (this.x > p.width + 45) {
      this.x = -45;
      this.y = p.random(p.height * 0.1, p.height * 0.75);
    }
  }

  draw() {
    const p = this.p;
    const twinkle = (Math.sin(this.phase * 1.2) + 1) * 0.5;
    p.noStroke();
    p.fill(220, 240, 255, p.map(twinkle, 0, 1, 40, 120));
    p.circle(this.x, this.y, this.size + twinkle * 0.4);
  }
}

export function createWinterScene(p) {
  const snowflakes = [];
  const stars = [];
  const sparkles = [];
  const moon = new Moon(p);
  const shards = [];
  const frostMotes = [];
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
      new AuroraRibbon(p, Math.PI / 2.4)
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

    shards.length = 0;
    const shardCount = Math.floor(Math.max(18, p.width / 40));
    for (let i = 0; i < shardCount; i += 1) {
      shards.push(new IceShard(p));
    }

    frostMotes.length = 0;
    const moteCount = Math.floor(Math.max(20, p.width / 28));
    for (let i = 0; i < moteCount; i += 1) {
      frostMotes.push(new FrostMote(p));
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
      const top = p.color(10, 20, 38);
      const bottom = p.color(36, 70, 104);
      for (let y = 0; y < p.height; y += 2) {
        const mix = p.map(y, 0, p.height, 0, 1, true);
        const col = p.lerpColor(top, bottom, mix);
        p.stroke(col);
        p.line(0, y, p.width, y);
      }

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
      p.strokeWeight(1.5);
      ribbons.forEach(ribbon => ribbon.draw(speedMultiplier));
      p.strokeWeight(1);

      p.noStroke();
      const snowTop = p.height * 0.8;
      const snowHeight = p.height - snowTop;
      p.fill(224, 234, 245);
      p.rect(0, snowTop, p.width, snowHeight);

      shards.forEach(shard => shard.draw());

      const sheen = p.drawingContext.createLinearGradient(0, snowTop, 0, p.height);
      sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
      sheen.addColorStop(1, 'rgba(200,220,235,0.14)');
      p.drawingContext.fillStyle = sheen;
      p.rect(0, snowTop, p.width, snowHeight);

      frostMotes.forEach(mote => {
        mote.update(speedMultiplier);
        mote.draw();
      });

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
