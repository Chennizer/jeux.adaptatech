const MAX_LAUNCHES = 7;
const MAX_PARTICLES = 3200;
const SAND_CELL = 6;
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
  let stuckEdges = [];
  let settledSand = [];
  let sandGrid = [];
  let sandCols = 0;
  let sandRows = 0;
  let speedMultiplier = 1;
  let baseSpeed = null;
  let calmMode = false;
  let autoTimer = 0;

  function paintBackdrop() {
    p.background(0, 0, 100);
  }

  function resetSand() {
    sandCols = Math.max(1, Math.floor(p.width / SAND_CELL));
    sandRows = Math.max(1, Math.floor(p.height / SAND_CELL));
    sandGrid = Array.from({ length: sandCols }, () => Array(sandRows).fill(null));
    settledSand = [];
    stuckEdges = [];
  }

  function storeEdgeParticle(particle) {
    stuckEdges.push({
      x: particle.x,
      y: particle.y,
      hue: particle.hue,
      sat: particle.sat,
      size: p.constrain(particle.size * 0.9, 2.2, 8),
      twinkle: particle.twinkle
    });
  }

  function addSand(col, row, particle) {
    const sand = {
      x: (col + 0.5) * SAND_CELL,
      y: (row + 0.5) * SAND_CELL,
      hue: particle.hue,
      sat: particle.sat,
      size: p.constrain(particle.size, 3.2, 7.5),
      twinkle: particle.twinkle
    };
    sandGrid[col][row] = sand;
    settledSand.push(sand);
  }

  function tryStickOrSettle(particle) {
    const r = particle.size * 0.5;

    if (particle.x <= r) {
      particle.x = r;
      storeEdgeParticle(particle);
      return true;
    }
    if (particle.x >= p.width - r) {
      particle.x = p.width - r;
      storeEdgeParticle(particle);
      return true;
    }
    if (particle.y <= r) {
      particle.y = r;
      storeEdgeParticle(particle);
      return true;
    }

    let col = Math.floor(particle.x / SAND_CELL);
    let row = Math.floor(particle.y / SAND_CELL);
    col = p.constrain(col, 0, sandCols - 1);
    row = p.constrain(row, 0, sandRows - 1);

    if (row >= sandRows - 1) {
      addSand(col, sandRows - 1, particle);
      return true;
    }

    const below = sandGrid[col][row + 1];
    if (!below) return false;

    const leftFree = col > 0 && !sandGrid[col - 1][row + 1];
    const rightFree = col < sandCols - 1 && !sandGrid[col + 1][row + 1];

    if (leftFree || rightFree) {
      const dir = leftFree && rightFree ? (p.random() < 0.5 ? -1 : 1) : leftFree ? -1 : 1;
      particle.x += dir * SAND_CELL * 0.7;
      particle.y += SAND_CELL * 0.6;
      return false;
    }

    addSand(col, row, particle);
    return true;
  }

  function settleOverflowParticle(particle) {
    particle.size = Math.max(particle.size, 3.5);
    particle.life = Math.max(particle.life, 8);
    if (!tryStickOrSettle(particle)) {
      const col = p.constrain(Math.floor(particle.x / SAND_CELL), 0, sandCols - 1);
      addSand(col, sandRows - 1, particle);
    }
  }

  function trimParticles() {
    while (particles.length > MAX_PARTICLES) {
      const particle = particles.shift();
      if (!particle) break;
      settleOverflowParticle(particle);
    }
  }

  function drawStuckPieces() {
    p.noStroke();
    for (const piece of stuckEdges) {
      const flicker = 0.9 + piece.twinkle * 0.2 * p.noise(piece.x * 0.01, piece.y * 0.01, p.frameCount * 0.05);
      p.fill(piece.hue, piece.sat, 100, 70 * flicker);
      p.circle(piece.x, piece.y, piece.size * flicker);
    }

    for (const sand of settledSand) {
      const flicker = 0.9 + sand.twinkle * 0.15 * p.noise(sand.x * 0.01, sand.y * 0.01, p.frameCount * 0.05);
      p.fill(sand.hue, sand.sat, 95, 85 * flicker);
      p.circle(sand.x, sand.y, sand.size * flicker);
    }
  }

  function choosePalette(baseHue) {
    const palettes = [
      [baseHue, (baseHue + 40) % 360, (baseHue + 200) % 360],
      [baseHue, (baseHue + 20) % 360, (baseHue + 340) % 360],
      [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360],
      [baseHue, (baseHue + 180) % 360],
      [baseHue, (baseHue + 60) % 360, (baseHue + 300) % 360, (baseHue + 20) % 360]
    ];
    return p.random(palettes);
  }

  function spawnLaunch(scale = 1) {
    const hue = p.random(0, 360);
    const margin = p.width * 0.12;
    const x = p.random(margin, p.width - margin);
    const launch = new Launch(p, x, hue);
    launch.vx *= scale;
    launch.vy *= scale;
    launch.fuse *= p.lerp(0.65, 1, scale);
    launches.push(launch);
    if (launches.length > MAX_LAUNCHES) launches.shift();
  }

  function spawnBurst(x, y, hue, { scale = 1, type: forcedType } = {}) {
    const type = forcedType || p.random(['peony', 'chrysanthemum', 'ring', 'palm', 'willow', 'brocade', 'double', 'smile']);
    const palette = choosePalette(hue);

    if (type === 'smile') {
      const faceHue = p.random(palette);
      const radius = p.random(42, 68) * scale;
      const life = p.random(160, 220) * p.lerp(0.75, 1.1, scale);
      const ringCount = 140;
      for (let i = 0; i < ringCount; i++) {
        const angle = (p.TWO_PI / ringCount) * i + p.random(-0.02, 0.02);
        const r = radius + p.random(-2, 2) * scale;
        particles.push(
          new BurstParticle(p, {
            x: x + Math.cos(angle) * r,
            y: y + Math.sin(angle) * r,
            vx: p.random(-0.25, 0.25) * scale,
            vy: p.random(-0.25, 0.25) * scale,
            hue: (faceHue + p.random(-8, 8) + 360) % 360,
            sat: p.random(70, 95),
            life,
            maxLife: life,
            size: p.random(3.4, 5.2) * scale,
            fade: 0.008,
            drag: 0.994,
            gravity: 0.04 * scale,
            twinkle: 0.55,
            glow: 1
          })
        );
      }

      const eyeOffsetX = radius * 0.35;
      const eyeOffsetY = -radius * 0.25;
      const eyeCount = 16;
      for (let i = 0; i < eyeCount; i++) {
        const jitterX = p.random(-3, 3);
        const jitterY = p.random(-3, 3);
        particles.push(
          new BurstParticle(p, {
            x: x - eyeOffsetX + jitterX,
            y: y + eyeOffsetY + jitterY,
            vx: p.random(-0.2, 0.2) * scale,
            vy: p.random(-0.2, 0.2) * scale,
            hue: (faceHue + 20 + p.random(-5, 5)) % 360,
            sat: p.random(60, 90),
            life: life * 0.9,
            maxLife: life * 0.9,
            size: p.random(4.2, 5.6) * scale,
            fade: 0.0075,
            drag: 0.995,
            gravity: 0.03 * scale,
            twinkle: 0.4,
            glow: 0
          })
        );
        particles.push(
          new BurstParticle(p, {
            x: x + eyeOffsetX + jitterX,
            y: y + eyeOffsetY + jitterY,
            vx: p.random(-0.2, 0.2) * scale,
            vy: p.random(-0.2, 0.2) * scale,
            hue: (faceHue + 20 + p.random(-5, 5)) % 360,
            sat: p.random(60, 90),
            life: life * 0.9,
            maxLife: life * 0.9,
            size: p.random(4.2, 5.6) * scale,
            fade: 0.0075,
            drag: 0.995,
            gravity: 0.03 * scale,
            twinkle: 0.4,
            glow: 0
          })
        );
      }

      const smilePoints = 90;
      const smileRadius = radius * 0.55;
      for (let i = 0; i < smilePoints; i++) {
        const t = i / (smilePoints - 1);
        const angle = p.lerp(-p.PI * 0.7, -p.PI * 0.3, t);
        const sx = x + Math.cos(angle) * smileRadius;
        const sy = y + Math.sin(angle) * smileRadius + radius * 0.2;
        particles.push(
          new BurstParticle(p, {
            x: sx + p.random(-1.8, 1.8) * scale,
            y: sy + p.random(-1.8, 1.8) * scale,
            vx: p.random(-0.25, 0.25) * scale,
            vy: p.random(-0.1, 0.25) * scale,
            hue: (faceHue + 10 + p.random(-6, 6) + 360) % 360,
            sat: p.random(75, 95),
            life: life * 0.95,
            maxLife: life * 0.95,
            size: p.random(3.2, 4.6) * scale,
            fade: 0.007,
            drag: 0.994,
            gravity: 0.035 * scale,
            twinkle: 0.6,
            glow: 0
          })
        );
      }
      trimParticles();
      return;
    }

    const heavyStyles = ['willow', 'brocade'];
    const countBase = type === 'ring' ? 240 : type === 'double' ? 280 : heavyStyles.includes(type) ? 320 : 240;
    const wobble = type === 'chrysanthemum' ? 0.4 : 0.1;
    const glow = type === 'brocade' || type === 'willow' ? 1 : 0;
    const countScale = p.lerp(0.7, 1.4, scale);

    for (let i = 0; i < countBase * countScale; i++) {
      const angle = p.random(p.TWO_PI);
      const spread = type === 'palm' ? p.random(0.4, 1.2) : p.random(0.65, 1.1);
      const speedBase = p.random(6.5, 11.8) * spread * p.lerp(0.8, 1.3, scale);
      let speed = speedBase;
      if (type === 'willow' || type === 'brocade') speed = p.random(5.5, 10) * spread * p.lerp(0.85, 1.2, scale);
      const vx = Math.cos(angle) * speed * (type === 'ring' ? 0.88 : 1);
      const vy = Math.sin(angle) * speed;
      const hueChoice = p.random(palette);
      const hueShift = p.random(-14, 14);
      const sat = type === 'brocade' ? p.random(55, 80) : p.random(70, 100);
      const size = (type === 'palm' ? p.random(5.5, 8.8) : type === 'willow' ? p.random(4.4, 7.4) : p.random(3.8, 7)) * scale;
      const life = (heavyStyles.includes(type) ? p.random(180, 260) : p.random(140, 210)) * p.lerp(0.8, 1.3, scale);
      const fade = (heavyStyles.includes(type) ? 0.008 : 0.011) / p.lerp(0.9, 1.25, scale);
      const drag = type === 'willow' ? 0.995 : type === 'brocade' ? 0.993 : 0.992;
      const gravity = (type === 'willow' ? 0.075 : 0.095) * p.lerp(0.85, 1.2, scale);
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
            gravity: 0.1 * p.lerp(0.85, 1.2, scale),
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
      trimParticles();
    }
  }

  return {
    id: 'fireworks',
    enter() {
      p.colorMode(p.HSB, 360, 100, 100, 100);
      launches = [];
      particles = [];
      resetSand();
      autoTimer = 0;
      baseSpeed = null;
      calmMode = false;
    },
    resize() {
      resetSand();
    },
    setSpeedMultiplier(multiplier = 1) {
      if (baseSpeed === null) baseSpeed = multiplier;
      calmMode = baseSpeed !== null && baseSpeed < 0.9;
      if (calmMode && multiplier > baseSpeed) {
        speedMultiplier = baseSpeed;
      } else {
        speedMultiplier = multiplier;
      }
    },
    pulse() {
      if (calmMode) {
        const hue = p.random(0, 360);
        const x = p.random(p.width * 0.2, p.width * 0.8);
        const y = p.random(p.height * 0.25, p.height * 0.45);
        spawnBurst(x, y, hue, { scale: 1.35 });
      } else {
        spawnLaunch();
      }
    },
    draw() {
      paintBackdrop();
      drawStuckPieces();

      autoTimer += 1 * speedMultiplier;
      const threshold = calmMode ? 50 : 75;
      if (autoTimer > threshold) {
        if (calmMode) {
          const hue = p.random(0, 360);
          const x = p.random(p.width * 0.2, p.width * 0.8);
          const y = p.random(p.height * 0.2, p.height * 0.45);
          spawnBurst(x, y, hue, { scale: 0.45, type: p.random(['peony', 'ring', 'chrysanthemum']) });
        } else {
          spawnLaunch();
        }
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
        const stuck = tryStickOrSettle(particle);
        if (alive && !stuck) particle.draw();
        if (!alive || stuck) particles.splice(i, 1);
      }
    }
  };
}
