const SKY_COLORS = [
  [12, 32, 40],
  [24, 60, 68],
  [4, 18, 26]
];

class Ridge {
  constructor(p, index) {
    this.p = p;
    this.index = index;
    this.noiseOffset = p.random(1000);
    this.reset();
  }

  reset() {
    const p = this.p;
    this.height = p.map(this.index, 0, 4, p.height * 0.3, p.height * 0.75);
    this.color = [
      p.map(this.index, 0, 4, 60, 20),
      p.map(this.index, 0, 4, 90, 40),
      p.map(this.index, 0, 4, 80, 50),
      p.map(this.index, 0, 4, 210, 120)
    ];
    this.noiseScale = p.map(this.index, 0, 4, 0.0015, 0.004);
  }

  draw(multiplier = 1) {
    const p = this.p;
    const segments = 80;
    p.noStroke();
    p.fill(...this.color);
    p.beginShape();
    p.vertex(0, p.height);
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * p.width;
      const noiseValue = p.noise(this.noiseOffset + x * this.noiseScale, multiplier * 0.02);
      const y = this.height - noiseValue * p.height * 0.18;
      p.vertex(x, y);
    }
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);
  }
}

class MistParticle {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(spawnAnywhere = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = spawnAnywhere ? p.random(p.height * 0.6, p.height) : p.height * 0.72 + p.random(-40, 40);
    this.speed = p.random(0.1, 0.3);
    this.alpha = p.random(70, 140);
    this.size = p.random(p.width * 0.04, p.width * 0.12);
  }

  update(multiplier = 1) {
    this.x += this.speed * multiplier;
    this.y += Math.sin(this.x * 0.002) * 0.1 * multiplier;
    if (this.x - this.size > this.p.width + 20) {
      this.x = -this.size;
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(220, 235, 240, this.alpha);
    p.ellipse(this.x, this.y, this.size, this.size * 0.45);
  }
}

export function createMountainMistScene(p) {
  const ridges = [];
  const mists = [];
  let speedMultiplier = 1;
  let pulseAlpha = 0;

  function ensureRidges() {
    if (!ridges.length) {
      for (let i = 0; i < 5; i++) {
        ridges.push(new Ridge(p, i));
      }
    }
  }

  function ensureMist() {
    const target = Math.max(10, Math.floor(p.width * 0.02));
    while (mists.length < target) mists.push(new MistParticle(p));
    if (mists.length > target) mists.length = target;
  }

  function drawSky() {
    const steps = SKY_COLORS.length - 1;
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const scaled = t * steps;
      const idx = Math.min(steps - 1, Math.floor(scaled));
      const localT = scaled - idx;
      const a = SKY_COLORS[idx];
      const b = SKY_COLORS[idx + 1] || SKY_COLORS[idx];
      const r = p.lerp(a[0], b[0], localT);
      const g = p.lerp(a[1], b[1], localT);
      const bl = p.lerp(a[2], b[2], localT);
      p.stroke(r, g, bl);
      p.line(0, y, p.width, y);
    }
  }

  return {
    id: 'mountain',
    name: 'Montagnes brumeuses',
    description: 'Cimes calmes et nappes de brume',
    enter() {
      ensureRidges();
      ensureMist();
      pulseAlpha = 0;
    },
    resize() {
      ridges.forEach(r => r.reset());
      ensureMist();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      pulseAlpha = 1;
    },
    draw() {
      drawSky();
      ensureRidges();
      ridges.forEach((ridge, idx) => {
        ridge.draw(speedMultiplier * (1 + idx * 0.02));
      });

      ensureMist();
      mists.forEach(mist => {
        mist.update(speedMultiplier * 0.6);
        mist.draw();
      });

      if (pulseAlpha > 0.01) {
        p.noStroke();
        p.fill(200, 220, 230, 40 * pulseAlpha);
        p.rect(0, 0, p.width, p.height);
        pulseAlpha *= 0.9;
      }
    }
  };
}
