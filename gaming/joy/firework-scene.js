const MAX_LAUNCHES = 7;
const MAX_PARTICLES = 3200;
class Launch {
  constructor(p, x, color) {
    this.p = p;
    this.x = x;
    this.y = p.height + 20;
    this.vx = p.random(-0.55, 0.55);
    this.vy = p.random(-10.5, -14.5);
    this.color = color;
    this.fuse = p.random(40, 56);
    this.sparkLife = [];
  }

  update(multiplier) {
    const p = this.p;
    this.x += this.vx * multiplier;
    this.y += this.vy * multiplier;
    this.vy *= 0.992;
    this.vy += 0.1 * multiplier;
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
        drag: 0.992,
        gravity: 0.095,
        fade: 0.011,
        twinkle: 0.45,
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
  let speedMultiplier = 1;
  let autoTimer = 0;

  function paintBackdrop() {
    p.background(0, 0, 100);
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
    const countBase = type === 'ring' ? 240 : type === 'double' ? 280 : heavyStyles.includes(type) ? 320 : 240;
    const wobble = type === 'chrysanthemum' ? 0.4 : 0.1;
    const glow = type === 'brocade' || type === 'willow' ? 1 : 0;

    for (let i = 0; i < countBase; i++) {
      const angle = p.random(p.TWO_PI);
      const spread = type === 'palm' ? p.random(0.4, 1.2) : p.random(0.65, 1.1);
      const speedBase = p.random(6.5, 11.8) * spread;
      let speed = speedBase;
      if (type === 'willow' || type === 'brocade') speed = p.random(5.5, 10) * spread;
      const vx = Math.cos(angle) * speed * (type === 'ring' ? 0.88 : 1);
      const vy = Math.sin(angle) * speed;
      const hueChoice = p.random(palette);
      const hueShift = p.random(-14, 14);
      const sat = type === 'brocade' ? p.random(55, 80) : p.random(70, 100);
      const size = type === 'palm' ? p.random(5.5, 8.8) : type === 'willow' ? p.random(4.4, 7.4) : p.random(3.8, 7);
      const life = heavyStyles.includes(type) ? p.random(180, 260) : p.random(140, 210);
      const fade = heavyStyles.includes(type) ? 0.008 : 0.011;
      const drag = type === 'willow' ? 0.995 : type === 'brocade' ? 0.993 : 0.992;
      const gravity = type === 'willow' ? 0.075 : 0.095;
      const twinkle = type === 'ring' ? 0.3 : 0.5;

      particles.push(
        new BurstParticle(p, {
          x,
          y,
          vx: vx + p.random(-wobble, wobble),
          vy: vy - (type === 'palm' ? 2.6 : 0),
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
            life: life * 0.95,
            maxLife: life * 0.95,
            size: size * 0.75,
            fade: fade * 1.1,
            drag: 0.993,
            gravity: 0.1,
            twinkle: 0.55,
            glow: 0
          })
        );
      }
    }

    // lingering embers to stretch the finale
    const emberCount = 70;
    for (let i = 0; i < emberCount; i++) {
      const angle = p.random(p.TWO_PI);
      const speed = p.random(1.4, 3.2);
      const hueChoice = p.random(palette);
      particles.push(
        new BurstParticle(p, {
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          hue: (hueChoice + p.random(-10, 10) + 360) % 360,
          sat: p.random(55, 95),
          life: p.random(190, 260),
          maxLife: 260,
          size: p.random(2.4, 4.2),
          fade: 0.006,
          drag: 0.996,
          gravity: 0.06,
          twinkle: 0.6,
          glow: 1
        })
      );
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
    },
    resize() {
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      spawnLaunch();
    },
    draw() {
      paintBackdrop();

      autoTimer += 1 * speedMultiplier;
      if (autoTimer > 75) {
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
