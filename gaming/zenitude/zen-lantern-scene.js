const SKY_COLORS = [
  [3, 12, 20],
  [6, 32, 46],
  [13, 64, 86],
  [28, 92, 112]
];

class Lantern {
  constructor(p, width, height) {
    this.p = p;
    this.boundsWidth = width;
    this.boundsHeight = height;
    this.reset(true);
  }

  reset(randomY = false) {
    const p = this.p;
    this.x = p.random(this.boundsWidth * 0.1, this.boundsWidth * 0.9);
    this.y = randomY
      ? p.random(this.boundsHeight * 0.3, this.boundsHeight * 0.85)
      : this.boundsHeight * 0.85;
    this.scale = p.random(0.6, 1.35);
    this.speed = p.random(0.08, 0.22);
    this.wobbleOffset = p.random(p.TWO_PI);
    this.glow = p.random(140, 200);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    const wobble = p.sin(p.frameCount * 0.01 + this.wobbleOffset) * 0.12;
    this.y -= this.speed * speedMultiplier;
    this.x += wobble * this.scale;
    if (this.y < this.boundsHeight * 0.25) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    const lanternWidth = 36 * this.scale;
    const lanternHeight = 58 * this.scale;

    const gradientSteps = 18;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / (gradientSteps - 1);
      const r = p.lerp(255, 255, t);
      const g = p.lerp(210, 140, t);
      const b = p.lerp(120, 60, t);
      p.noStroke();
      p.fill(r, g, b, this.glow * (1 - Math.pow(t, 1.4)));
      p.rect(
        this.x - lanternWidth * 0.5,
        this.y - lanternHeight * 0.5 + t * lanternHeight,
        lanternWidth,
        lanternHeight / gradientSteps + 1,
        6
      );
    }

    p.noStroke();
    p.fill(255, 200, 140, this.glow * 0.55);
    const reflectionY = this.boundsHeight * 0.86;
    const reflectionHeight = 60 * this.scale;
    p.beginShape();
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const wobble = p.sin(t * p.PI) * 12 * this.scale;
      const localX = this.x + (t - 0.5) * lanternWidth * 1.6 + wobble * 0.3;
      const localY = reflectionY + t * reflectionHeight;
      p.vertex(localX, localY);
    }
    p.endShape(p.CLOSE);
  }
}

function drawSkyGradient(p) {
  const h = p.height;
  const step = Math.max(1, Math.floor(h / 240));
  for (let y = 0; y <= h; y += step) {
    const t = y / Math.max(1, h);
    const index = Math.min(SKY_COLORS.length - 2, Math.floor(t * (SKY_COLORS.length - 1)));
    const localT = (t * (SKY_COLORS.length - 1)) - index;
    const a = SKY_COLORS[index];
    const b = SKY_COLORS[index + 1];
    const r = p.lerp(a[0], b[0], localT);
    const g = p.lerp(a[1], b[1], localT);
    const bl = p.lerp(a[2], b[2], localT);
    p.stroke(r, g, bl);
    p.line(0, y, p.width, y);
  }
}

export function createLanternScene(p) {
  let lanterns = [];
  let mountainNoiseOffset = 0;
  let speedMultiplier = 1;

  function ensureLanterns() {
    const desired = Math.max(6, Math.floor((p.width * p.height) * 0.00002));
    while (lanterns.length < desired) {
      const lantern = new Lantern(p, p.width, p.height);
      lantern.reset(true);
      lanterns.push(lantern);
    }
    if (lanterns.length > desired) {
      lanterns.length = desired;
    }
  }

  return {
    id: 'lantern',
    name: 'Lanternes flottantes',
    description: 'Lucioles sur un lac tranquille',
    enter() {
      mountainNoiseOffset = p.random(1000);
      lanterns.forEach(lantern => lantern.reset(true));
    },
    resize() {
      lanterns = lanterns.map(l => new Lantern(p, p.width, p.height));
      ensureLanterns();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      lanterns.forEach(lantern => {
        lantern.glow = Math.min(255, lantern.glow + 45);
      });
    },
    draw() {
      ensureLanterns();
      drawSkyGradient(p);

      const horizon = p.height * 0.78;
      p.noStroke();
      p.fill(2, 18, 28);
      p.rect(0, horizon, p.width, p.height - horizon);

      p.noStroke();
      p.fill(4, 32, 44);
      const mountainBase = p.height * 0.65;
      const mountainPeak = p.height * 0.48;
      p.beginShape();
      p.vertex(0, p.height);
      p.vertex(0, mountainBase);
      for (let x = 0; x <= p.width; x += 4) {
        const noiseVal = p.noise(mountainNoiseOffset + x * 0.0015);
        const y = p.lerp(mountainBase, mountainPeak, noiseVal);
        p.vertex(x, y);
      }
      p.vertex(p.width, mountainBase);
      p.vertex(p.width, p.height);
      p.endShape(p.CLOSE);

      lanterns.forEach(lantern => {
        lantern.update(speedMultiplier);
        lantern.draw();
        lantern.glow = p.lerp(lantern.glow, 160, 0.02 * speedMultiplier);
      });

      p.noStroke();
      for (let i = 0; i < lanterns.length; i++) {
        const lantern = lanterns[i];
        p.fill(255, 200, 140, 14);
        const rippleWidth = 140 * lantern.scale;
        const rippleHeight = 24 * lantern.scale;
        p.ellipse(lantern.x, horizon + 10 * lantern.scale, rippleWidth, rippleHeight);
      }

      mountainNoiseOffset += 0.0004 * speedMultiplier;
    }
  };
}
