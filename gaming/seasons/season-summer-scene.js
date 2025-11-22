class Wave {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.amplitude = p.random(6, 16);
    this.wavelength = p.random(120, 220);
    this.speed = p.random(0.4, 1.2);
    this.phase = p.random(0, Math.PI * 2);
    this.y = p.random(p.height * 0.55, p.height * 0.9);
    this.alpha = p.random(60, 110);
  }

  draw(multiplier = 1) {
    const p = this.p;
    this.phase += 0.01 * this.speed * multiplier;
    p.noFill();
    p.stroke(210, 240, 255, this.alpha);
    p.strokeWeight(2);
    p.beginShape();
    for (let x = -20; x <= p.width + 20; x += 12) {
      const y = this.y + Math.sin((x / this.wavelength) * Math.PI * 2 + this.phase) * this.amplitude;
      p.vertex(x, y);
    }
    p.endShape();
  }
}

class Sparkle {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset(forceY = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = forceY ? p.random(p.height) : p.random(p.height * 0.35, p.height * 0.6);
    this.size = p.random(3, 9);
    this.speed = p.random(0.2, 0.7);
    this.alpha = p.random(120, 200);
  }

  draw(multiplier = 1) {
    const p = this.p;
    this.y += this.speed * multiplier;
    if (this.y > p.height * 0.9) {
      this.reset();
      this.y = p.random(p.height * 0.3, p.height * 0.5);
    }
    p.noStroke();
    p.fill(255, 240, 184, this.alpha);
    p.ellipse(this.x, this.y, this.size);
  }
}

export function createSummerScene(p) {
  let waves = [];
  let sparkles = [];
  let speedMultiplier = 1;
  let pulseGlow = 0;

  function populate() {
    const waveCount = 6;
    waves = Array.from({ length: waveCount }, () => new Wave(p));
    const sparkleCount = Math.floor((p.width * p.height) / 18000);
    sparkles = Array.from({ length: sparkleCount }, () => new Sparkle(p));
  }

  function resize() {
    populate();
  }

  populate();

  return {
    id: 'summer',
    name: 'Vagues ensoleillées',
    description: 'Soleil bas, reflets et mer calme',
    enter() {
      pulseGlow = 1;
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      pulseGlow = 1.5;
    },
    draw() {
      const horizon = p.height * 0.58;
      p.noStroke();
      const skyTop = p.color(28, 96, 168);
      const skyBottom = p.color(118, 196, 255);
      for (let y = 0; y < horizon; y++) {
        const t = y / Math.max(1, horizon);
        const c = p.lerpColor(skyTop, skyBottom, t);
        p.stroke(c);
        p.line(0, y, p.width, y);
      }
      const seaTop = p.color(20, 90, 140);
      const seaBottom = p.color(10, 46, 94);
      for (let y = horizon; y <= p.height; y++) {
        const t = (y - horizon) / Math.max(1, p.height - horizon);
        const c = p.lerpColor(seaTop, seaBottom, t);
        p.stroke(c);
        p.line(0, y, p.width, y);
      }

      const sunY = horizon - p.height * 0.1;
      const sunX = p.width * 0.72;
      const sunRadius = p.height * 0.08 * (1 + pulseGlow * 0.1);
      const baseAlpha = 180 + pulseGlow * 60;
      for (let i = 6; i >= 1; i--) {
        p.fill(255, 210, 120, baseAlpha / i);
        p.noStroke();
        p.ellipse(sunX, sunY, sunRadius * i * 0.6);
      }

      const shimmer = 60 + pulseGlow * 30;
      p.fill(255, 220, 150, shimmer);
      p.noStroke();
      p.ellipse(sunX, horizon + 6, sunRadius * 2.4, sunRadius * 0.55);

      pulseGlow = p.lerp(pulseGlow, 0, 0.02);
      sparkles.forEach(sparkle => sparkle.draw(speedMultiplier));
      waves.forEach(wave => wave.draw(speedMultiplier));
    }
  };
}
