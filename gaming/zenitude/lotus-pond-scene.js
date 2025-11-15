const WATER_COLORS = [
  { stop: 0, color: [6, 26, 38] },
  { stop: 0.55, color: [9, 48, 66] },
  { stop: 1, color: [3, 14, 24] }
];

class LotusPad {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(spawnAnywhere = false) {
    const p = this.p;
    const margin = p.width * 0.1;
    this.x = p.random(margin, p.width - margin);
    this.y = spawnAnywhere ? p.random(p.height * 0.2, p.height * 0.82) : p.random(p.height * 0.55, p.height * 0.8);
    this.radius = p.random(p.width * 0.04, p.width * 0.08);
    this.angle = p.random(p.TWO_PI);
    this.drift = p.random(0.0008, 0.0016);
    this.z = p.random(0.4, 1);
    this.bloom = p.random() < 0.35;
    this.hueOffset = p.random(0.75, 1.25);
  }

  update(multiplier = 1) {
    this.angle += this.drift * multiplier;
  }

  draw() {
    const p = this.p;
    const sway = p.sin(this.angle) * this.radius * 0.04;
    const x = this.x + sway;
    const y = this.y + p.sin(this.angle * 0.8) * this.radius * 0.035;
    const r = this.radius;

    p.noStroke();
    p.fill(52 * this.hueOffset, 132 * this.hueOffset, 117 * this.hueOffset, 160);
    p.ellipse(x, y, r * 2.1, r * 1.6);

    p.fill(32 * this.hueOffset, 92 * this.hueOffset, 82 * this.hueOffset, 180);
    p.ellipse(x, y, r * 1.5, r * 1.1);

    if (this.bloom) {
      const petals = 6;
      for (let i = 0; i < petals; i++) {
        const angle = (p.TWO_PI / petals) * i + this.angle * 0.5;
        const px = x + p.cos(angle) * r * 0.36;
        const py = y + p.sin(angle) * r * 0.32;
        const w = r * 0.45;
        const h = r * 0.52;
        p.fill(220, 180 + 20 * p.sin(this.angle + i), 200, 160);
        p.ellipse(px, py, w, h);
      }
      p.fill(255, 230, 160, 220);
      p.ellipse(x, y, r * 0.38, r * 0.38);
    }
  }
}

class Ripple {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.life = 0;
    this.duration = p.random(2000, 3800);
    this.maxRadius = p.random(p.width * 0.12, p.width * 0.2);
  }

  update(multiplier = 1) {
    this.life += multiplier * 16;
    return this.life < this.duration;
  }

  draw() {
    const p = this.p;
    const t = this.life / this.duration;
    const radius = p.lerp(0, this.maxRadius, t);
    const alpha = p.map(1 - t, 0, 1, 0, 140, true);
    p.noFill();
    p.stroke(180, 220, 230, alpha);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, radius * 2, radius * 0.65);
  }
}

function interpolateStops(stops, t, p) {
  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].stop && t <= stops[i + 1].stop) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }
  const range = Math.max(0.0001, upper.stop - lower.stop);
  const localT = (t - lower.stop) / range;
  const r = p.lerp(lower.color[0], upper.color[0], localT);
  const g = p.lerp(lower.color[1], upper.color[1], localT);
  const b = p.lerp(lower.color[2], upper.color[2], localT);
  return [r, g, b];
}

export function createLotusPondScene(p) {
  const pads = [];
  const ripples = [];
  let speedMultiplier = 1;
  let sparkleOffset = 0;

  function ensurePads() {
    const target = Math.max(6, Math.floor(p.width * 0.016));
    while (pads.length < target) pads.push(new LotusPad(p));
    if (pads.length > target) pads.length = target;
  }

  function drawGradient() {
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const [r, g, b] = interpolateStops(WATER_COLORS, t, p);
      p.stroke(r, g, b);
      p.line(0, y, p.width, y);
    }
  }

  return {
    id: 'lotus',
    name: 'Étang lotus',
    description: 'Nénuphars et fleurs au crépuscule',
    enter() {
      sparkleOffset = p.random(1000);
      if (!pads.length) {
        ensurePads();
      }
    },
    resize() {
      ensurePads();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      const pad = pads[Math.floor(p.random(pads.length))];
      if (pad) {
        ripples.push(new Ripple(p, pad.x, pad.y));
      }
    },
    draw() {
      drawGradient();

      if (pads.length === 0) ensurePads();

      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        const alive = ripple.update(speedMultiplier);
        ripple.draw();
        if (!alive) {
          ripples.splice(i, 1);
        }
      }

      pads.forEach(pad => {
        pad.update(speedMultiplier);
        pad.draw();
      });

      sparkleOffset += 0.003 * speedMultiplier;
      const sparkleCount = Math.floor(p.width * 0.12);
      p.noStroke();
      for (let i = 0; i < sparkleCount; i++) {
        const x = (i / Math.max(1, sparkleCount)) * p.width + p.sin(sparkleOffset + i * 0.6) * 12;
        const y = p.height * 0.88 + p.sin(sparkleOffset * 1.4 + i) * 6;
        const alpha = 100 + 60 * p.sin(sparkleOffset * 2 + i);
        p.fill(210, 240, 255, alpha);
        p.ellipse(x, y, 2.5, 2.5);
      }
    }
  };
}
