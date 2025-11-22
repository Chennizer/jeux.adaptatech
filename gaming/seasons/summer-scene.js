const TWO_PI = Math.PI * 2;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(p, c1, c2, t) {
  const col1 = p.color(...c1);
  const col2 = p.color(...c2);
  return p.lerpColor(col1, col2, t);
}

class GrassBlade {
  constructor(p, x, groundY, height, depth, palette) {
    this.p = p;
    this.x = x;
    this.groundY = groundY;
    this.height = height;
    this.depth = depth;
    this.seed = p.random(1000);
    this.palette = palette;
  }

  draw(playerX, movement, shadowTint) {
    const p = this.p;
    const sway = (p.noise(this.seed, p.frameCount * 0.002) - 0.5) * this.height * 0.14;
    const breeze = Math.sin((p.frameCount * 0.01) + this.seed) * this.height * (0.05 + movement * 0.08);
    const parting = movement * 30 * Math.exp(-Math.abs(this.x - playerX) / 120) * Math.sign(this.x - playerX);

    const tipX = this.x + sway + breeze + parting;
    const tipY = this.groundY - this.height * lerp(0.85, 0.65, this.depth);
    const midY = lerp(this.groundY, tipY, 0.55);
    const midX = lerp(this.x, tipX, 0.6);

    const baseWidth = lerp(4.5, 2, this.depth);
    const color = p.color(this.palette.base);
    color.setAlpha(p.map(this.depth, 0, 1, 200, 120));
    p.strokeWeight(baseWidth);
    p.stroke(color);
    p.noFill();
    p.bezier(this.x, this.groundY, this.x, midY, midX, midY, tipX, tipY);

    if (p.random() < 0.06) {
      p.stroke(shadowTint.levels[0], shadowTint.levels[1], shadowTint.levels[2], 60);
      p.strokeWeight(baseWidth * 0.35);
      p.line(this.x, this.groundY, this.x + (tipX - this.x) * 0.2, this.groundY + 4);
    }
  }
}

class HeatVeil {
  constructor(p, horizonY, palette) {
    this.p = p;
    this.horizonY = horizonY;
    this.palette = palette;
    this.seed = p.random(3000);
    this.columns = [];
  }

  regenerate(width) {
    const p = this.p;
    this.columns.length = 0;
    const count = Math.max(10, Math.floor(width / 70));
    for (let i = 0; i < count; i += 1) {
      this.columns.push({
        x: p.map(i, 0, count - 1, -20, width + 20) + p.random(-12, 12),
        wobble: p.random(0.5, 1.2),
        width: p.random(14, 26)
      });
    }
  }

  draw(intensity) {
    const p = this.p;
    if (intensity <= 0.05) return;

    p.push();
    p.blendMode(p.SOFT_LIGHT);
    p.noStroke();
    const alphaBase = p.map(intensity, 0, 1, 0, 80);
    this.columns.forEach(col => {
      const shimmer = (p.noise(this.seed + col.x * 0.01, p.frameCount * 0.01) - 0.5);
      const sway = shimmer * 20 * col.wobble * intensity;
      const top = this.horizonY - p.height * 0.04 + shimmer * 18;
      const height = p.height * 0.45 + shimmer * 20;
      const tint = p.color(...this.palette.veil);
      tint.setAlpha(alphaBase);
      p.fill(tint);
      p.rect(col.x + sway * 0.35, top, col.width + shimmer * 6, height, 10);
    });
    p.pop();
  }
}

class SunHalo {
  constructor(p, palette) {
    this.p = p;
    this.palette = palette;
    this.phase = p.random(TWO_PI);
    this.resize(p.width, p.height);
  }

  resize(width, height) {
    this.x = width * 0.82;
    this.y = height * 0.14;
    this.radius = Math.min(width, height) * 0.11;
  }

  draw(intensity) {
    const p = this.p;
    this.phase += 0.01 + intensity * 0.02;
    const pulse = (Math.sin(this.phase) + 1) * 0.5;
    const baseRadius = this.radius * lerp(0.92, 1.08, pulse);

    p.push();
    p.translate(this.x, this.y);
    p.noStroke();
    p.blendMode(p.SOFT_LIGHT);

    for (let i = 0; i < 3; i += 1) {
      const ringRadius = baseRadius + i * 12;
      const alpha = lerp(140, 60, i / 2) * lerp(0.9, 1.2, intensity);
      const hue = lerpColor(p, this.palette.skyTop, [255, 226, 180], i / 3);
      hue.setAlpha(alpha);
      p.fill(hue);
      const wobble = (p.noise(this.phase + i * 10) - 0.5) * 6 * intensity;
      p.ellipse(0, wobble, ringRadius * 2.1, ringRadius * 2.0);
    }

    p.blendMode(p.SCREEN);
    const core = p.color(255, 240, 210, 210);
    p.fill(core);
    p.ellipse(0, 0, baseRadius * 1.6, baseRadius * 1.5);
    p.pop();
    p.blendMode(p.BLEND);
  }
}

class CicadaGlint {
  constructor(p, horizonY) {
    this.p = p;
    this.horizonY = horizonY;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-20, p.width + 20);
    this.y = p.random(this.horizonY * 0.7, this.horizonY + 60);
    this.phase = p.random(TWO_PI);
    this.scale = p.random(0.7, 1.2);
  }

  update(intensity) {
    const p = this.p;
    this.phase += 0.018 + intensity * 0.012;
    if (this.phase > TWO_PI) this.phase -= TWO_PI;
    if (p.random() < 0.002) this.reset();
  }

  draw(intensity) {
    const p = this.p;
    const pulse = (Math.sin(this.phase) + 1) * 0.5;
    const alpha = p.map(pulse, 0, 1, 30, 90) * lerp(1.0, 1.5, intensity);
    p.noStroke();
    p.fill(255, 238, 180, alpha);
    const size = lerp(3, 6, pulse) * this.scale;
    p.ellipse(this.x, this.y, size * 1.3, size * 0.9);
  }
}

export function createSummerScene(p) {
  const palette = {
    skyTop: [248, 226, 178],
    skyBottom: [214, 203, 177],
    meadowLight: [235, 212, 153],
    meadowDeep: [203, 181, 123],
    shadow: [76, 124, 132],
    veil: [255, 235, 190]
  };

  let speedMultiplier = 1;
  let shimmer = 0;
  let playerX = 0;

  const grass = [];
  const cicadas = [];
  let heatVeil;
  let sunHalo;

  function populateGrass() {
    grass.length = 0;
    const rows = 6;
    const cols = Math.floor(p.width / 28) + 30;
    for (let r = 0; r < rows; r += 1) {
      const rowMix = r / Math.max(rows - 1, 1);
      const depth = p.constrain(lerp(0.12, 0.9, rowMix) + p.random(-0.05, 0.05), 0, 1);
      const baseY = lerp(p.height * 0.56, p.height * 0.98, rowMix) + p.random(-6, 6);
      for (let c = 0; c < cols; c += 1) {
        const x = p.map(c, 0, cols - 1, -50, p.width + 50) + p.random(-8, 8);
        const height = lerp(p.height * 0.18, p.height * 0.36, 1 - depth) * p.random(0.9, 1.05);
        grass.push(new GrassBlade(p, x, baseY + p.random(-6, 6), height, depth, {
          base: lerpColor(p, palette.meadowLight, palette.meadowDeep, depth)
        }));
      }
    }
  }

  function populateCicadas(horizonY) {
    cicadas.length = 0;
    const count = Math.floor(Math.max(18, p.width / 30));
    for (let i = 0; i < count; i += 1) {
      cicadas.push(new CicadaGlint(p, horizonY));
    }
  }

  function resize() {
    playerX = p.width * 0.45;
    const horizonY = p.height * 0.5;
    populateGrass();
    populateCicadas(horizonY);
    heatVeil = new HeatVeil(p, horizonY, palette);
    heatVeil.regenerate(p.width);
    sunHalo = new SunHalo(p, palette);
    sunHalo.resize(p.width, p.height);
  }

  function drawBackground(intensity) {
    const top = p.color(...palette.skyTop);
    const bottom = p.color(...palette.skyBottom);
    for (let y = 0; y < p.height; y += 2) {
      const mix = p.map(y, 0, p.height, 0, 1, true);
      const col = p.lerpColor(top, bottom, mix);
      p.stroke(col);
      p.line(0, y, p.width, y);
    }

    sunHalo.draw(intensity);

    p.noStroke();
    const light = p.color(...palette.meadowLight);
    const deep = p.color(...palette.meadowDeep);
    for (let y = p.height * 0.5; y <= p.height; y += 4) {
      const mix = p.map(y, p.height * 0.5, p.height, 0, 1, true);
      const col = p.lerpColor(light, deep, mix);
      p.fill(col);
      p.rect(0, y, p.width, 4);
    }
  }

  function drawGrass(movement) {
    const shadowTint = p.color(...palette.shadow);
    grass.sort((a, b) => a.depth - b.depth);
    grass.forEach(blade => blade.draw(playerX, movement, shadowTint));
  }

  return {
    id: 'summer',
    name: 'Été',
    description: 'Prairie alanguie et chants de cigales',
    resize,
    enter() {
      shimmer = 1;
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      shimmer = 1.2;
    },
    draw() {
      const stillness = p.constrain(1.1 - speedMultiplier, 0, 1);
      const movement = p.constrain((speedMultiplier - 0.25) / 1.1, 0, 1);

      drawBackground(stillness + shimmer * 0.08);
      const drift = (p.noise(p.frameCount * 0.0012) - 0.5) * 24 * (0.4 + movement);
      const targetX = (p.mouseIsPressed && p.mouseX) ? p.mouseX : p.width * 0.45 + drift;
      playerX = p.lerp(playerX, targetX, 0.025 + movement * 0.06);

      drawGrass(movement);

      heatVeil.draw(stillness + shimmer * 0.2);
      cicadas.forEach(cicada => {
        cicada.update(stillness);
        cicada.draw(stillness + shimmer * 0.25);
      });

      shimmer = p.lerp(shimmer, 0, 0.01 * speedMultiplier);
    }
  };
}
