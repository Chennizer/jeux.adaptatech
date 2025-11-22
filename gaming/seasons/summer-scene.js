class Wave {
  constructor(p, depth) {
    this.p = p;
    this.depth = depth;
    this.offset = p.random(1000);
  }

  draw(speedMultiplier) {
    const p = this.p;
    const h = p.height;
    const baseline = h * (0.6 + this.depth * 0.12);
    const amp = h * 0.02 * (1 - this.depth);
    const yScale = h * 0.03;
    p.noStroke();
    const brightness = p.map(this.depth, 0, 1, 220, 120, true);
    p.fill(30, 144, brightness, p.map(1 - this.depth, 0, 1, 80, 180));
    p.beginShape();
    p.vertex(-20, h);
    for (let x = -20; x <= p.width + 20; x += 12) {
      const y = baseline + Math.sin((x + this.offset + p.frameCount * 0.8 * speedMultiplier) * 0.015) * yScale;
      const wobble = p.noise((x + this.offset) * 0.002, this.depth * 2, p.frameCount * 0.005 * speedMultiplier) * amp;
      p.vertex(x, y - wobble);
    }
    p.vertex(p.width + 20, h);
    p.endShape(p.CLOSE);
  }
}

class Sparkle {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height * 0.35, p.height * 0.7);
    this.speed = p.random(0.5, 1.2);
    this.size = p.random(2, 6);
    this.life = p.random(120, 220);
  }

  update(multiplier) {
    this.life -= 1.2 * multiplier;
    this.x += 0.3 * multiplier;
    if (this.life <= 0 || this.x > this.p.width + 10) {
      this.reset();
      this.x = -10;
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(255, 255, 200, p.map(this.life, 0, 200, 0, 140, true));
    p.ellipse(this.x, this.y, this.size, this.size * 0.7);
  }
}

export function createSummerScene(p) {
  let speedMultiplier = 1;
  let shimmer = 0;
  const waves = [];
  const sparkles = [];

  function resize() {
    waves.length = 0;
    sparkles.length = 0;
    const layers = 4;
    for (let i = 0; i < layers; i += 1) {
      waves.push(new Wave(p, i / layers));
    }
    const sparkleCount = Math.floor(Math.max(40, (p.width * p.height) / 18000));
    for (let i = 0; i < sparkleCount; i += 1) {
      sparkles.push(new Sparkle(p));
    }
  }

  return {
    id: 'summer',
    name: 'Été',
    description: 'Soleil et vagues calmes',
    resize,
    enter() {
      shimmer = 1;
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      shimmer = 1.2;
    },
    draw() {
      const skyTop = p.color(34, 178, 255);
      const skyBottom = p.color(176, 232, 255);
      for (let y = 0; y < p.height; y += 2) {
        const mix = p.map(y, 0, p.height, 0, 1, true);
        const col = p.lerpColor(skyTop, skyBottom, mix);
        p.stroke(col);
        p.line(0, y, p.width, y);
      }

      const sunRadius = p.height * 0.12;
      const sunY = p.height * 0.28;
      const sunX = p.width * 0.22;
      const glow = Math.max(0, shimmer - 0.05);
      shimmer = p.lerp(shimmer, 0, 0.01 * speedMultiplier);
      for (let i = 3; i >= 0; i -= 1) {
        const alpha = 120 / (i + 1) + glow * 80;
        p.noStroke();
        p.fill(255, 240, 160, alpha);
        p.ellipse(sunX, sunY, sunRadius * 2.2 + i * 40);
      }
      p.fill(255, 220, 120);
      p.ellipse(sunX, sunY, sunRadius * 1.4);

      waves.forEach(layer => layer.draw(speedMultiplier));
      sparkles.forEach(sparkle => {
        sparkle.update(speedMultiplier);
        sparkle.draw();
      });
    }
  };
}
