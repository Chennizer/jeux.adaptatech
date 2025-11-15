const WATER_COLORS = [
  [6, 36, 47],
  [11, 61, 75],
  [18, 92, 107]
];

class Ripple {
  constructor(p, centerY) {
    this.p = p;
    this.centerY = centerY;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.amplitude = p.random(8, 16);
    this.wavelength = p.random(140, 220);
    this.speed = p.random(0.0018, 0.0032);
    this.phase = p.random(p.TAU);
    this.alpha = p.random(40, 70);
  }

  draw(speedMultiplier = 1) {
    const p = this.p;
    this.phase += this.speed * speedMultiplier * 60;
    const resolution = 420;
    p.noFill();
    p.stroke(190, 235, 242, this.alpha);
    p.strokeWeight(1.5);
    p.beginShape();
    for (let x = 0; x <= resolution; x++) {
      const t = x / resolution;
      const posX = p.lerp(-0.1 * p.width, p.width * 1.1, t);
      const y = this.centerY + p.sin(this.phase + posX / this.wavelength) * this.amplitude;
      p.curveVertex(posX, y);
    }
    p.endShape();
  }
}

class LilyPad {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.baseX = p.random(p.width);
    this.baseY = p.random(p.height * 0.35, p.height * 0.72);
    this.scale = p.random(0.55, 1.2);
    this.angle = p.random(p.TAU);
    this.driftSpeed = p.random(0.08, 0.2);
    this.swaySpeed = p.random(0.0015, 0.0025);
    this.pulseProgress = 0;
  }

  pulse() {
    this.pulseProgress = 1;
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    this.angle += this.swaySpeed * speedMultiplier * 60;
    this.baseX += p.cos(this.angle * 0.25) * this.driftSpeed * speedMultiplier * 0.4;
    this.baseX = p.constrain(this.baseX, -50, p.width + 50);
    if (this.pulseProgress > 0) {
      this.pulseProgress = Math.max(0, this.pulseProgress - 0.02 * speedMultiplier);
    }
    this.currentX = this.baseX + p.sin(this.angle * 0.7) * 18 * this.scale;
    this.currentY = this.baseY + p.cos(this.angle * 0.6) * 12 * this.scale;
  }

  draw(speedMultiplier = 1) {
    const p = this.p;
    const size = 90 * this.scale;
    p.push();
    p.translate(this.currentX, this.currentY);
    const gentleLift = p.sin(this.angle * 0.5) * 4 * this.scale;
    p.translate(0, gentleLift);
    const glow = p.map(this.pulseProgress, 0, 1, 0, 80, true);
    if (glow > 2) {
      p.noStroke();
      p.fill(122, 240, 203, glow);
      p.ellipse(0, 6, size * 1.45, size * 0.9);
    }
    p.rotate(this.angle * 0.06);
    p.noStroke();
    p.fill(92, 186, 156, 180);
    p.ellipse(0, 0, size * 1.05, size * 0.82);
    p.fill(118, 214, 181, 220);
    p.ellipse(0, 0, size, size * 0.76);
    p.fill(153, 239, 206, 200);
    p.arc(0, 0, size * 0.84, size * 0.62, -p.QUARTER_PI * 0.6, p.PI + p.QUARTER_PI * 0.5, p.PIE);
    p.pop();
  }
}

export function createLagoonScene(p) {
  const ripples = [];
  const pads = [];
  let speedMultiplier = 1;
  let highlight = 0;

  function ensureElements() {
    ripples.length = 0;
    const rows = 3;
    for (let i = 0; i < rows; i++) {
      const y = p.height * p.map(i, 0, rows - 1, 0.35, 0.75);
      ripples.push(new Ripple(p, y));
    }

    pads.length = 0;
    const target = Math.floor((p.width * p.height) / 28000) + 6;
    for (let i = 0; i < target; i++) {
      const pad = new LilyPad(p);
      pads.push(pad);
      pad.update();
    }
  }

  function drawGradient() {
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const colorIndex = t * (WATER_COLORS.length - 1);
      const idx = Math.floor(colorIndex);
      const frac = colorIndex - idx;
      const a = WATER_COLORS[idx];
      const b = WATER_COLORS[Math.min(WATER_COLORS.length - 1, idx + 1)];
      const r = p.lerp(a[0], b[0], frac);
      const g = p.lerp(a[1], b[1], frac);
      const bl = p.lerp(a[2], b[2], frac);
      p.stroke(r, g, bl);
      p.line(0, y, p.width, y);
    }
  }

  return {
    id: 'lagoon',
    name: 'Lagune paisible',
    description: 'Reflets turquoise et nénuphars flottants',
    enter() {
      highlight = 1;
    },
    resize() {
      ensureElements();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      highlight = 1;
      pads.forEach(pad => pad.pulse());
    },
    draw() {
      if (!ripples.length || !pads.length) {
        ensureElements();
      }

      drawGradient();

      ripples.forEach(ripple => ripple.draw(speedMultiplier));

      pads.forEach(pad => {
        pad.update(speedMultiplier);
        pad.draw(speedMultiplier);
      });

      if (highlight > 0.01) {
        const glow = p.pow(highlight, 1.5);
        p.noStroke();
        p.fill(138, 255, 224, glow * 80);
        p.rect(0, 0, p.width, p.height);
        highlight = Math.max(0, highlight - 0.01 * speedMultiplier);
      }

      // Mist layer
      const mistY = p.height * 0.25;
      const mistHeight = p.height * 0.4;
      p.noStroke();
      for (let i = 0; i < 6; i++) {
        const alpha = p.map(i, 0, 5, 12, 40);
        p.fill(200, 242, 239, alpha);
        const offset = p.sin((p.frameCount * 0.003 + i) * speedMultiplier) * 40;
        p.rect(offset - 60, mistY + i * (mistHeight / 6), p.width + 120, mistHeight / 6 + 6);
      }
    }
  };
}
