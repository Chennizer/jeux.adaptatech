class Particle {
  constructor(p, { x, y, baseHue }) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = p.random(-3, 3);
    this.vy = p.random(-5, -2);
    this.life = p.random(50, 90);
    this.baseHue = baseHue;
    this.hue = (baseHue + p.random(-20, 20) + 360) % 360;
    this.size = p.random(2, 5);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.x += this.vx * multiplier;
    this.y += this.vy * multiplier;
    this.vy += 0.08 * multiplier;
    this.life -= 1 * multiplier;
    return this.life > 0;
  }

  draw() {
    const p = this.p;
    p.noStroke();
    const alpha = p.map(this.life, 0, 90, 0, 100);
    p.fill(this.hue, 90, 100, alpha);
    p.circle(this.x, this.y, this.size);
  }
}

class Trail {
  constructor(p, { x, hue }) {
    this.p = p;
    this.x = x;
    this.y = p.height + 30;
    this.hue = hue;
    this.speed = p.random(6, 9);
    this.sparks = [];
  }

  update(multiplier = 1) {
    const p = this.p;
    this.y -= this.speed * multiplier;
    this.speed *= 0.985;
    this.sparks.push({
      x: this.x + p.random(-2, 2),
      y: this.y + p.random(-3, 3),
      life: 16
    });
    if (this.sparks.length > 20) this.sparks.shift();
    return this.speed > 1;
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(this.hue, 80, 100, 80);
    p.rect(this.x - 3, this.y, 6, 16);
    this.sparks.forEach(s => {
      s.life -= 1;
      p.fill(this.hue, 70, 100, s.life * 5);
      p.circle(s.x, s.y, 3);
    });
  }
}

export function createFireworkScene(p) {
  let particles = [];
  let trails = [];
  let sparkles = [];
  let speedMultiplier = 1;
  let skyHue = 210;

  function spawnFirework(fromTrail = null) {
    const x = fromTrail?.x ?? p.random(p.width * 0.1, p.width * 0.9);
    const y = fromTrail?.y ?? p.random(p.height * 0.2, p.height * 0.45);
    const baseHue = p.random(0, 360);
    const count = p.random(45, 70);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(p, { x, y, baseHue }));
    }
  }

  function spawnTrail() {
    const hue = p.random(0, 360);
    trails.push(new Trail(p, { x: p.random(p.width * 0.2, p.width * 0.8), hue }));
    if (trails.length > 8) trails.shift();
  }

  function spawnSparkles() {
    const count = Math.max(80, Math.floor(p.width * p.height * 0.00005));
    sparkles = Array.from({ length: count }, () => ({
      x: p.random(p.width),
      y: p.random(p.height),
      hue: p.random(0, 360),
      tw: p.random(0.02, 0.06),
      size: p.random(1.5, 2.4)
    }));
  }

  return {
    id: 'fireworks',
    enter() {
      p.colorMode(p.HSB, 360, 100, 100, 100);
      particles = [];
      trails = [];
      spawnSparkles();
    },
    resize() {
      spawnSparkles();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      spawnTrail();
      spawnFirework();
    },
    draw() {
      skyHue = (skyHue + 0.05) % 360;
      p.background(skyHue, 45, 12, 100);

      sparkles.forEach(star => {
        const flicker = (p.sin(p.frameCount * star.tw) + 1) * 0.5;
        p.noStroke();
        p.fill(star.hue, 60, 100, 40 + flicker * 60);
        p.circle(star.x, star.y, star.size + flicker * 1.3);
      });

      for (let i = trails.length - 1; i >= 0; i--) {
        const trail = trails[i];
        const alive = trail.update(speedMultiplier);
        trail.draw();
        if (!alive) {
          spawnFirework(trail);
          trails.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        const alive = particle.update(speedMultiplier);
        particle.draw();
        if (!alive) particles.splice(i, 1);
      }

      if (particles.length < 80 && Math.random() < 0.02 * speedMultiplier) {
        spawnTrail();
      }
    }
  };
}
