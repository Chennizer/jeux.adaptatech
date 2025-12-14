const SKY_TOP = { h: 215, s: 55, b: 8 };
const SKY_BOTTOM = { h: 215, s: 40, b: 4 };
const MAX_LAUNCHES = 9;
const MAX_PARTICLES = 2600;
const STAR_COUNT = 120;

class Launch {
  constructor(p, x, color) {
    this.p = p;
    this.x = x;
    this.y = p.height + 20;
    this.vx = p.random(-0.65, 0.65);
    this.vy = p.random(-11.5, -15.5);
    this.color = color;
    this.fuse = p.random(34, 48);
    this.sparkLife = [];
  }

  update(multiplier) {
    const p = this.p;
    this.x += this.vx * multiplier;
    this.y += this.vy * multiplier;
    this.vy *= 0.99;
    this.vy += 0.12 * multiplier;
    this.fuse -= 1 * multiplier;

    // trail spark bookkeeping
    this.sparkLife.push(14);
    if (this.sparkLife.length > 16) this.sparkLife.shift();

    const heightReached = this.y < p.height * 0.32;
    const slowing = this.vy > -1.2;
    const fuseOut = this.fuse <= 0;
    return !(heightReached || slowing || fuseOut);
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(this.color, 70, 100, 90);
    p.rect(this.x - 3, this.y - 6, 6, 12);

    for (let i = 0; i < this.sparkLife.length; i++) {
      const t = this.sparkLife[i] -= 1;
      const alpha = p.max(t * 6, 0);
      p.fill(this.color, 60, 100, alpha);
      const offsetY = i * 2.5;
      p.circle(this.x + p.random(-2, 2), this.y + offsetY, 4);
    }
  }
}

class BurstParticle {
  constructor(p, opts) {
    this.p = p;
    Object.assign(
      this,
      {
        drag: 0.99,
        gravity: 0.12,
        fade: 0.015,
        twinkle: 0.4,
        glow: 0
      },
      opts
    );
  }

  update(multiplier) {
    const p = this.p;
    this.x += this.vx * multiplier;
    this.y += this.vy * multiplier;
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += this.gravity * multiplier;
    this.life -= 1 * multiplier;
    this.size = p.max(this.size - this.fade * multiplier, 0);
    return this.life > 0 && this.size > 0.4;
  }

  draw() {
    const p = this.p;
    const alpha = p.map(this.life, 0, this.maxLife, 0, 90);
    const flicker = 0.8 + this.twinkle * p.noise(this.x * 0.01, this.y * 0.01, p.frameCount * 0.02);
    p.noStroke();
    const glowAlpha = this.glow ? alpha * 0.8 : alpha;
    if (this.glow) {
      p.fill(this.hue, this.sat * 0.6, 100, glowAlpha * 0.4);
      p.circle(this.x, this.y, this.size * 2.8);
    }
    p.fill(this.hue, this.sat, 100, alpha * flicker);
    p.circle(this.x, this.y, this.size * flicker);
  }
}

export function createFireworkScene(p) {
  let launches = [];
  let particles = [];
  let stars = [];
  let speedMultiplier = 1;
  let autoTimer = 0;

  function gradientBackground() {
    p.background(0, 0, 0, 100);
    p.noStroke();
    for (let y = 0; y <= p.height; y += 2) {
      const t = y / p.height;
      const h = p.lerp(SKY_TOP.h, SKY_BOTTOM.h, t);
      const s = p.lerp(SKY_TOP.s, SKY_BOTTOM.s, t);
      const b = p.lerp(SKY_TOP.b, SKY_BOTTOM.b, t);
      p.fill(h, s, b, 100);
      p.rect(0, y, p.width, 2);
    }
  }

  function spawnStars() {
    const count = STAR_COUNT + Math.floor(p.width * p.height * 0.00005);
    stars = Array.from({ length: count }, () => ({
      x: p.random(p.width),
      y: p.random(p.height * 0.8),
      tw: p.random(0.01, 0.05),
      size: p.random(1.2, 2.6),
      hue: p.random(180, 240)
    }));
  }

  function drawStars() {
    stars.forEach(star => {
      const flicker = (p.sin(p.frameCount * star.tw) + 1.5) * 0.4;
      p.noStroke();
      p.fill(star.hue, 30, 100, 50 + flicker * 40);
      p.circle(star.x, star.y, star.size + flicker);
    });
  }

  function choosePalette(baseHue) {
    const palettes = [
      [baseHue, (baseHue + 40) % 360, (baseHue + 200) % 360],
      [baseHue, (baseHue + 20) % 360, (baseHue + 340) % 360],
      [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360],
      [baseHue, (baseHue + 180) % 360]
    ];
    return p.random(palettes);
  }

  function spawnLaunch() {
    const hue = p.random(0, 360);
    const margin = p.width * 0.12;
    const x = p.random(margin, p.width - margin);
    launches.push(new Launch(p, x, hue));
    if (launches.length > MAX_LAUNCHES) launches.shift();
  }

  function spawnBurst(x, y, hue) {
    const type = p.random(['peony', 'chrysanthemum', 'ring', 'palm', 'willow', 'brocade', 'double']);
    const palette = choosePalette(hue);
    const heavyStyles = ['willow', 'brocade'];
    const countBase = type === 'ring' ? 180 : type === 'double' ? 220 : heavyStyles.includes(type) ? 240 : 180;
    const wobble = type === 'chrysanthemum' ? 0.5 : 0.12;
    const glow = type === 'brocade' || type === 'willow' ? 1 : 0;

    for (let i = 0; i < countBase; i++) {
      const angle = p.random(p.TWO_PI);
      const spread = type === 'palm' ? p.random(0.35, 1.15) : p.random(0.65, 1.1);
      const speedBase = p.random(6.5, 11.5) * spread;
      let speed = speedBase;
      if (type === 'willow' || type === 'brocade') speed = p.random(5.5, 10) * spread;
      const vx = Math.cos(angle) * speed * (type === 'ring' ? 0.92 : 1);
      const vy = Math.sin(angle) * speed;
      const hueChoice = p.random(palette);
      const hueShift = p.random(-14, 14);
      const sat = type === 'brocade' ? p.random(55, 80) : p.random(70, 100);
      const size = type === 'palm' ? p.random(4.5, 7.5) : type === 'willow' ? p.random(3.6, 6.2) : p.random(3, 6.2);
      const life = heavyStyles.includes(type) ? p.random(150, 220) : p.random(110, 170);
      const fade = heavyStyles.includes(type) ? 0.01 : 0.013;
      const drag = type === 'willow' ? 0.994 : type === 'brocade' ? 0.992 : 0.99;
      const gravity = type === 'willow' ? 0.09 : 0.11;
      const twinkle = type === 'ring' ? 0.25 : 0.45;

      particles.push(
        new BurstParticle(p, {
          x,
          y,
          vx: vx + p.random(-wobble, wobble),
          vy: vy - (type === 'palm' ? 2.4 : 0),
          hue: (hueChoice + hueShift + 360) % 360,
          sat: p.constrain(sat, 25, 100),
          life,
          maxLife: life,
          size,
          fade,
          drag,
          gravity,
          twinkle,
          glow
        })
      );

      if (type === 'double' && i % 3 === 0) {
        const innerHue = (hueChoice + 180) % 360;
        const innerSpeed = speedBase * 0.6;
        particles.push(
          new BurstParticle(p, {
            x,
            y,
            vx: Math.cos(angle) * innerSpeed,
            vy: Math.sin(angle) * innerSpeed,
            hue: innerHue,
            sat: p.random(60, 90),
            life: life * 0.8,
            maxLife: life * 0.8,
            size: size * 0.65,
            fade: fade * 1.2,
            drag: 0.991,
            gravity: 0.12,
            twinkle: 0.5,
            glow: 0
          })
        );
      }
    }

    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES);
    }
  }

  return {
    id: 'fireworks',
    enter() {
      p.colorMode(p.HSB, 360, 100, 100, 100);
      launches = [];
      particles = [];
      autoTimer = 0;
      spawnStars();
    },
    resize() {
      spawnStars();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      spawnLaunch();
    },
    draw() {
      gradientBackground();
      drawStars();

      autoTimer += 1 * speedMultiplier;
      if (autoTimer > 40) {
        spawnLaunch();
        autoTimer = 0;
      }

      for (let i = launches.length - 1; i >= 0; i--) {
        const launch = launches[i];
        const keepGoing = launch.update(speedMultiplier);
        launch.draw();
        if (!keepGoing) {
          spawnBurst(launch.x, p.max(launch.y, p.height * 0.12), launch.color);
          launches.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        const alive = particle.update(speedMultiplier);
        particle.draw();
        if (!alive) particles.splice(i, 1);
      }
    }
  };
}
