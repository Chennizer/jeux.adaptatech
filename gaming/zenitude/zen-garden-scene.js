const SAND_COLORS = [
  [218, 206, 186],
  [202, 188, 168],
  [190, 176, 156]
];

class SandRipple {
  constructor(p, angle) {
    this.p = p;
    this.angle = angle;
    this.offset = p.random(1000);
  }

  draw(multiplier = 1) {
    const p = this.p;
    const spacing = 26;
    const diag = Math.sqrt(p.width * p.width + p.height * p.height);
    const lines = Math.ceil(diag / spacing) + 2;

    p.push();
    p.translate(p.width / 2, p.height / 2);
    p.rotate(this.angle);
    p.translate(-diag / 2, -diag / 2);

    for (let i = -1; i < lines; i++) {
      const y = i * spacing + Math.sin(this.offset + i * 0.2 + p.frameCount * 0.002 * multiplier) * 6;
      p.stroke(230, 220, 204, 120);
      p.strokeWeight(1.5);
      p.noFill();
      p.line(0, y, diag, y);
    }
    p.pop();
  }
}

class Stone {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width * 0.1, p.width * 0.9);
    this.y = p.random(p.height * 0.2, p.height * 0.8);
    this.size = p.random(p.width * 0.04, p.width * 0.08);
    this.rotation = p.random(p.TWO_PI);
    this.tint = p.random(0.85, 1.05);
  }

  draw(multiplier = 1) {
    const p = this.p;
    const wobble = Math.sin(p.frameCount * 0.0015 * multiplier + this.x) * 0.05;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation + wobble);
    p.noStroke();
    p.fill(130 * this.tint, 126 * this.tint, 118 * this.tint, 220);
    p.ellipse(0, 0, this.size * 1.4, this.size);
    p.fill(180 * this.tint, 176 * this.tint, 168 * this.tint, 200);
    p.ellipse(-this.size * 0.2, -this.size * 0.12, this.size * 0.8, this.size * 0.54);
    p.pop();
  }
}

class FallingLeaf {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(spawnAnywhere = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = spawnAnywhere ? p.random(-p.height * 0.3, p.height) : -p.random(20, 120);
    this.speed = p.random(0.4, 0.9);
    this.angle = p.random(p.TWO_PI);
    this.spin = p.random(0.02, 0.04);
    this.scale = p.random(12, 20);
  }

  update(multiplier = 1) {
    this.y += this.speed * multiplier;
    this.x += Math.sin(this.angle) * 0.4 * multiplier;
    this.angle += this.spin * multiplier;
    if (this.y > this.p.height + 80) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(Math.sin(this.angle) * 0.6);
    p.noStroke();
    p.fill(180, 200, 160, 160);
    p.ellipse(0, 0, this.scale * 1.3, this.scale * 0.6);
    p.fill(200, 220, 180, 140);
    p.ellipse(0, 0, this.scale * 0.7, this.scale * 0.3);
    p.pop();
  }
}

export function createZenGardenScene(p) {
  const ripples = [new SandRipple(p, -Math.PI / 10), new SandRipple(p, Math.PI / 12)];
  const stones = [];
  const leaves = [];
  let speedMultiplier = 1;
  let pulseGlow = 0;

  function ensureStones() {
    const target = 5;
    while (stones.length < target) stones.push(new Stone(p));
    if (stones.length > target) stones.length = target;
  }

  function ensureLeaves() {
    const target = Math.max(12, Math.floor(p.width * 0.02));
    while (leaves.length < target) leaves.push(new FallingLeaf(p));
    if (leaves.length > target) leaves.length = target;
  }

  function drawSand() {
    const steps = SAND_COLORS.length - 1;
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const scaled = t * steps;
      const idx = Math.min(steps - 1, Math.floor(scaled));
      const localT = scaled - idx;
      const a = SAND_COLORS[idx];
      const b = SAND_COLORS[idx + 1] || SAND_COLORS[idx];
      const r = p.lerp(a[0], b[0], localT);
      const g = p.lerp(a[1], b[1], localT);
      const bl = p.lerp(a[2], b[2], localT);
      p.stroke(r, g, bl);
      p.line(0, y, p.width, y);
    }
  }

  return {
    id: 'garden',
    name: 'Jardin zen',
    description: 'Sable ratissé et feuilles portées par le vent',
    enter() {
      ensureStones();
      ensureLeaves();
      pulseGlow = 0;
    },
    resize() {
      stones.forEach(stone => stone.reset());
      ensureLeaves();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      pulseGlow = 1;
    },
    draw() {
      drawSand();
      ripples.forEach(ripple => ripple.draw(speedMultiplier));

      ensureStones();
      stones.forEach(stone => stone.draw(speedMultiplier));

      ensureLeaves();
      leaves.forEach(leaf => {
        leaf.update(speedMultiplier * 0.8);
        leaf.draw();
      });

      if (pulseGlow > 0.01) {
        p.noStroke();
        p.fill(255, 255, 240, 40 * pulseGlow);
        p.rect(0, 0, p.width, p.height);
        pulseGlow *= 0.9;
      }
    }
  };
}
