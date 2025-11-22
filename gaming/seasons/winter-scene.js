class Snowflake {
  constructor(p, spawnAnywhere = false) {
    this.p = p;
    this.reset(spawnAnywhere);
  }

  reset(spawnAnywhere = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = spawnAnywhere ? p.random(-p.height, p.height) : p.random(-p.height * 0.2, 0);
    this.size = p.random(1.5, 4.5);
    this.speed = p.random(0.5, 1.4);
    this.drift = p.random(0.4, 1.2);
    this.alpha = p.random(120, 220);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.y += this.speed * multiplier;
    this.x += Math.sin(p.frameCount * 0.01 + this.y * 0.01) * this.drift * multiplier;
    if (this.y > p.height + 10) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(230, 245, 255, this.alpha);
    p.circle(this.x, this.y, this.size * 2);
  }
}

export function createWinterScene(p) {
  const flakes = [];
  let gradientCache;
  let speedMultiplier = 1;

  function ensureFlakes() {
    const target = Math.floor((p.width * p.height) * 0.00022);
    while (flakes.length < target) flakes.push(new Snowflake(p, true));
    if (flakes.length > target) flakes.length = target;
  }

  function drawGradient() {
    if (gradientCache && gradientCache.width === p.width && gradientCache.height === p.height) {
      p.image(gradientCache, 0, 0, p.width, p.height);
      return;
    }
    gradientCache = p.createGraphics(p.width, p.height);
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const r = p.lerp(6, 32, t);
      const g = p.lerp(18, 64, t);
      const b = p.lerp(34, 120, t);
      gradientCache.stroke(r, g, b);
      gradientCache.line(0, y, p.width, y);
    }
    p.image(gradientCache, 0, 0, p.width, p.height);
  }

  return {
    id: 'winter',
    name: 'Hiver',
    description: 'Chute lente de flocons lumineux',
    enter() {},
    resize() {
      gradientCache = null;
      ensureFlakes();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      flakes.forEach(flake => {
        flake.alpha = Math.min(255, flake.alpha + 40);
      });
    },
    draw() {
      drawGradient();
      ensureFlakes();
      flakes.forEach(flake => flake.update(speedMultiplier));
      flakes.forEach(flake => flake.draw());

      p.noStroke();
      p.fill(12, 26, 46, 200);
      p.rect(0, p.height * 0.78, p.width, p.height * 0.22);
    }
  };
}
