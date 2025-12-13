class Particle {
  constructor(p, { x, y, vx, vy, baseHue, size, life, twinkle }) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.baseHue = baseHue;
    this.hue = (baseHue + p.random(-24, 24) + 360) % 360;
    this.size = size;
    this.twinkle = twinkle;
  }

  update(multiplier = 1) {
    const p = this.p;
    this.x += this.vx * multiplier;
    this.y += this.vy * multiplier;
    this.vy += 0.1 * multiplier;
    this.life -= 1 * multiplier;
    return this.life > 0;
  }

  draw() {
    const p = this.p;
    p.noStroke();
    const alpha = p.map(this.life, 0, 120, 0, 100);
    const flicker = this.twinkle ? (p.sin(p.frameCount * this.twinkle) + 1.2) * 0.6 : 1;
    p.fill(this.hue, 92, 100, alpha * flicker);
    p.circle(this.x, this.y, this.size * flicker);
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
    const slowEnough = this.speed < 1.1;
    const reachedSky = this.y < p.height * 0.2;
    return !(slowEnough || reachedSky);
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
    const yTarget = fromTrail?.y ?? p.random(p.height * 0.2, p.height * 0.45);
    const y = p.constrain(yTarget, p.height * 0.15, p.height * 0.65);
    const baseHue = p.random(0, 360);
    const type = p.random(['burst', 'ring', 'palm', 'double']);
    const count = type === 'double' ? p.random(120, 160) : p.random(80, 130);

    for (let i = 0; i < count; i++) {
      const angle = p.random(p.TWO_PI);
      const power = p.random(5, 11);
      const size = p.random(3, 7);
      let vx = Math.cos(angle) * power;
      let vy = Math.sin(angle) * power;
      let life = p.random(70, 120);
      let twinkle = p.random(0.08, 0.16);

      if (type === 'ring') {
        const ringScale = p.random(8, 12);
        vx = Math.cos(angle) * ringScale;
        vy = Math.sin(angle) * ringScale * 0.85;
        twinkle = p.random(0.06, 0.12);
      } else if (type === 'palm') {
        const tilt = p.random(-p.PI / 10, p.PI / 10);
        const palmAngle = -p.HALF_PI + tilt + p.random(-0.25, 0.25);
        const palmPower = p.random(9, 13);
        vx = Math.cos(palmAngle) * palmPower * 0.65;
        vy = Math.sin(palmAngle) * palmPower;
        size = p.random(4, 8);
        life = p.random(90, 140);
      } else if (type === 'double') {
        const stagger = i % 2 === 0 ? 1 : -1;
        const doubleAngle = angle + stagger * 0.18;
        const doublePower = p.random(7, 12);
        vx = Math.cos(doubleAngle) * doublePower;
        vy = Math.sin(doubleAngle) * doublePower;
        size = p.random(3, 7.5);
      }

      particles.push(new Particle(p, { x, y, vx, vy, baseHue, size, life, twinkle }));
    }
  }

  function spawnTrail() {
    const hue = p.random(0, 360);
    trails.push(new Trail(p, { x: p.random(p.width * 0.15, p.width * 0.85), hue }));
    if (trails.length > 10) trails.shift();
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
