// Simplified summer scene focused on shimmering heat and a golden herb field

class GoldenHerb {
  constructor(p, x, groundY, height, depth, palette) {
    this.p = p;
    this.x = x;
    this.groundY = groundY;
    this.height = height;
    this.depth = depth;
    this.palette = palette;
    this.seed = p.random(2000);
  }

  draw({ movement }) {
    const p = this.p;
    const sway = (p.noise(this.seed, p.frameCount * 0.002) - 0.5) * this.height * 0.12;
    const breeze = Math.sin(p.frameCount * 0.01 + this.seed) * this.height * 0.08 * (0.4 + movement);
    const tipX = this.x + sway + breeze;
    const tipY = this.groundY - this.height * p.lerp(0.82, 0.65, this.depth);

    const baseWidth = p.lerp(5, 2.2, this.depth);
    const stem = p.color(...this.palette.stem);
    stem.setAlpha(p.map(this.depth, 0, 1, 220, 120));
    p.stroke(stem);
    p.strokeWeight(baseWidth);
    p.noFill();

    const midY = p.lerp(this.groundY, tipY, 0.55);
    const midX = p.lerp(this.x, tipX, 0.6);
    p.bezier(this.x, this.groundY, this.x, midY, midX, midY, tipX, tipY);

    const head = p.color(...this.palette.head);
    head.setAlpha(p.map(this.depth, 0, 1, 190, 130));
    p.noStroke();
    p.fill(head);
    p.ellipse(tipX, tipY, p.lerp(12, 7, this.depth), p.lerp(14, 8, this.depth));
  }
}

class CicadaShimmer {
  constructor(p, horizonY) {
    this.p = p;
    this.horizonY = horizonY;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-20, p.width + 20);
    this.y = p.random(this.horizonY * 0.7, this.horizonY + 60);
    this.phase = p.random(p.TWO_PI);
    this.scale = p.random(0.7, 1.3);
  }

  update(stillness) {
    const p = this.p;
    this.phase += 0.02 + stillness * 0.015;
    if (this.phase > p.TWO_PI) this.phase -= p.TWO_PI;
    if (p.random() < 0.002) this.reset();
  }

  draw(stillness) {
    const p = this.p;
    const pulse = (Math.sin(this.phase) + 1) * 0.5;
    const alpha = p.map(pulse, 0, 1, 24, 80) * p.lerp(1, 1.4, stillness);
    p.noStroke();
    p.fill(255, 232, 188, alpha);
    const size = p.lerp(3, 7, pulse) * this.scale;
    p.ellipse(this.x, this.y, size * 1.1, size * 0.8);
  }
}

class HeatVeil {
  constructor(p, horizonY) {
    this.p = p;
    this.horizonY = horizonY;
    this.seed = p.random(4000);
    this.columns = [];
  }

  regenerate(width) {
    const p = this.p;
    this.columns = [];
    const count = Math.max(10, Math.floor(width / 80));
    for (let i = 0; i < count; i += 1) {
      this.columns.push({
        x: p.map(i, 0, count - 1, -30, p.width + 30) + p.random(-8, 8),
        width: p.random(12, 20),
        wobble: p.random(0.5, 1.1)
      });
    }
  }

  draw(intensity) {
    const p = this.p;
    if (intensity <= 0.01) return;

    p.noStroke();
    p.push();
    p.blendMode(p.SOFT_LIGHT);
    const alphaBase = p.map(intensity, 0, 1, 0, 70);
    this.columns.forEach(col => {
      const shimmer = (p.noise(this.seed + col.x * 0.01, p.frameCount * 0.01) - 0.5);
      const sway = shimmer * 18 * col.wobble * intensity;
      const top = this.horizonY - p.height * 0.05 + shimmer * 16;
      const height = p.height * 0.52 + shimmer * 24 * intensity;
      const tint = p.color(255, 234, 194, alphaBase * 0.6);
      p.fill(tint);
      p.rect(col.x + sway * 0.3, top, col.width + shimmer * 6, height, 10);
    });
    p.pop();
  }
}

class SunGlyph {
  constructor(p, palette) {
    this.p = p;
    this.palette = palette;
    this.phase = p.random(p.TWO_PI);
    this.rippleSeed = p.random(2000);
    this.resize(p.width, p.height);
  }

  resize(width, height) {
    this.x = width * 0.82;
    this.y = height * 0.16;
    this.radius = Math.min(width, height) * 0.11;
  }

  update(stillness) {
    const p = this.p;
    this.phase += 0.01 + stillness * 0.02;
    this.tremor = (p.noise(this.rippleSeed, p.frameCount * 0.01) - 0.5) * 5 * (0.6 + stillness);
  }

  draw(stillness) {
    const p = this.p;
    this.update(stillness);
    const pulse = (Math.sin(this.phase) + 1) * 0.5;
    const baseRadius = this.radius * p.lerp(0.94, 1.06, pulse);

    p.push();
    p.translate(this.x, this.y + this.tremor);
    p.noStroke();
    p.blendMode(p.SOFT_LIGHT);

    for (let i = 0; i < 3; i += 1) {
      const ringRadius = baseRadius + i * 14;
      const alpha = p.map(i, 0, 2, 160, 60) * p.lerp(0.9, 1.2, stillness);
      const hue = p.lerpColor(p.color(...this.palette.skyTop), p.color(255, 222, 186), i / 3);
      hue.setAlpha(alpha);
      p.fill(hue);
      const wobble = (p.noise(this.rippleSeed + i * 10, p.frameCount * 0.008) - 0.5) * 5 * stillness;
      p.ellipse(0, wobble, ringRadius * 2.1, ringRadius * 2.0);
    }

    p.blendMode(p.SCREEN);
    p.stroke(255, 238, 206, 110);
    p.strokeWeight(2);
    const rayCount = 12;
    for (let i = 0; i < rayCount; i += 1) {
      const angle = (p.TWO_PI / rayCount) * i + pulse * 0.4;
      const inner = baseRadius * 0.85;
      const outer = inner + p.lerp(14, 26, stillness);
      p.line(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer);
    }

    p.noStroke();
    const core = p.color(255, 238, 206, 190);
    p.fill(core);
    p.ellipse(0, 0, baseRadius * 1.5, baseRadius * 1.4);

    p.pop();
    p.blendMode(p.BLEND);
  }
}

export function createSummerScene(p) {
  let speedMultiplier = 1;
  let shimmer = 0;

  const herbs = [];
  const cicadas = [];
  let sunGlyph;
  let heatVeil;

  const palette = {
    skyTop: [248, 226, 178],
    skyBottom: [210, 202, 180],
    meadowLight: [234, 210, 150],
    meadowDeep: [204, 184, 126],
    shadow: [70, 120, 130],
    herbHead: [242, 206, 134]
  };

  function populateHerbs() {
    herbs.length = 0;
    const rows = 8;
    const cols = Math.floor(p.width / 30) + 22;
    for (let r = 0; r < rows; r += 1) {
      const rowMix = r / (rows - 1 || 1);
      const depth = p.constrain(p.lerp(0.1, 0.95, rowMix) + p.random(-0.05, 0.05), 0, 1);
      const baseY = p.lerp(p.height * 0.55, p.height * 0.98, rowMix) + p.random(-4, 6);
      for (let c = 0; c < cols; c += 1) {
        const x = p.map(c, 0, cols - 1, -40, p.width + 40) + p.random(-6, 6);
        const height = p.lerp(p.height * 0.2, p.height * 0.38, 1 - depth) * p.random(0.9, 1.05);
        herbs.push(
          new GoldenHerb(p, x, baseY, height, depth, {
            stem: p.lerpColor(p.color(palette.meadowLight), p.color(palette.meadowDeep), depth).levels,
            head: palette.herbHead
          })
        );
      }
    }
  }

  function populateCicadas(horizonY) {
    cicadas.length = 0;
    const count = Math.floor(Math.max(12, p.width / 60));
    for (let i = 0; i < count; i += 1) {
      cicadas.push(new CicadaShimmer(p, horizonY));
    }
  }

  function resize() {
    const horizonY = p.height * 0.48;
    populateHerbs();
    populateCicadas(horizonY);
    sunGlyph = new SunGlyph(p, palette);
    sunGlyph.resize(p.width, p.height);
    heatVeil = new HeatVeil(p, horizonY);
    heatVeil.regenerate(p.width);
  }

  function drawBackground(stillness) {
    const top = p.color(...palette.skyTop);
    const bottom = p.color(...palette.skyBottom);
    for (let y = 0; y < p.height; y += 2) {
      const mix = p.map(y, 0, p.height, 0, 1, true);
      const col = p.lerpColor(top, bottom, mix);
      p.stroke(col);
      p.line(0, y, p.width, y);
    }

    sunGlyph.draw(stillness);

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

  function drawHerbs(movement) {
    const layered = [...herbs];
    layered.sort((a, b) => a.depth - b.depth);
    layered.forEach(herb => {
      herb.draw({ movement });
    });
  }

  return {
    id: 'summer',
    name: 'Été',
    description: 'Prairie alangui, chaleur vibrante',
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
      const stillness = p.constrain(1.2 - speedMultiplier, 0, 1);
      const movement = p.constrain((speedMultiplier - 0.25) / 1.2, 0, 1);

      drawBackground(stillness + shimmer * 0.08);

      drawHerbs(movement);

      cicadas.forEach(cicada => {
        cicada.update(stillness);
        cicada.draw(stillness + shimmer * 0.3);
      });

      heatVeil.draw(stillness + shimmer * 0.4);

      shimmer = p.lerp(shimmer, 0, 0.01 * speedMultiplier);
    }
  };
}
