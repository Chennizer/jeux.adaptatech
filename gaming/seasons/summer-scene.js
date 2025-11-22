// Simplified summer scene focused on a calm, shimmering heat mood
class HerbStalk {
  constructor(p, x, baseY, height, depth, palette) {
    this.p = p;
    this.x = x;
    this.baseY = baseY;
    this.height = height;
    this.depth = depth;
    this.seed = p.random(2000);
    this.palette = palette;
  }

  draw({ playerX, movement, stillness }) {
    const p = this.p;
    const sway = (p.noise(this.seed, p.frameCount * 0.003) - 0.5) * this.height * 0.1;
    const breeze = Math.sin((p.frameCount * 0.01 + this.seed) * (0.6 + movement)) * this.height * 0.06;
    const parting = movement * 26 * Math.exp(-Math.abs(this.x - playerX) / 150) * Math.sign(this.x - playerX);

    const tipX = this.x + sway + breeze + parting;
    const tipY = this.baseY - this.height * p.lerp(0.8, 0.6, this.depth);
    const midX = p.lerp(this.x, tipX, 0.6);
    const midY = p.lerp(this.baseY, tipY, 0.5);

    const stemColor = p.color(...this.palette.stem);
    stemColor.setAlpha(p.map(this.depth, 0, 1, 200, 120));
    p.stroke(stemColor);
    p.strokeWeight(p.lerp(5, 2.4, this.depth));
    p.noFill();
    p.bezier(this.x, this.baseY, this.x, midY, midX, midY, tipX, tipY);

    const headColor = p.color(...this.palette.head);
    headColor.setAlpha(p.map(this.depth, 0, 1, 170, 110));
    p.noStroke();
    p.fill(headColor);
    p.ellipse(tipX, tipY, p.lerp(10, 6, this.depth), p.lerp(12, 7, this.depth));
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
    this.y = p.random(this.horizonY * 0.7, this.horizonY + 70);
    this.phase = p.random(p.TWO_PI);
    this.scale = p.random(0.6, 1.3);
  }

  update(stillness) {
    const p = this.p;
    this.phase += 0.02 + stillness * 0.01;
    if (this.phase > p.TWO_PI) this.phase -= p.TWO_PI;
    if (p.random() < 0.002) this.reset();
  }

  draw(stillness) {
    const p = this.p;
    const pulse = (Math.sin(this.phase) + 1) * 0.5;
    const alpha = p.map(pulse, 0, 1, 25, 75) * p.lerp(1, 1.6, stillness);
    p.noStroke();
    p.fill(255, 236, 190, alpha);
    const size = p.lerp(3, 7, pulse) * this.scale;
    p.ellipse(this.x, this.y, size * 1.2, size * 0.8);
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
    const count = Math.max(10, Math.floor(width / 90));
    for (let i = 0; i < count; i += 1) {
      this.columns.push({
        x: p.map(i, 0, count - 1, -30, p.width + 30) + p.random(-12, 12),
        width: p.random(14, 24),
        wobble: p.random(0.5, 1.1)
      });
    }
  }

  draw(stillness) {
    const p = this.p;
    if (stillness <= 0.05) return;
    p.push();
    p.noStroke();
    p.blendMode(p.SOFT_LIGHT);
    const alphaBase = p.map(stillness, 0, 1, 0, 70);
    this.columns.forEach(col => {
      const shimmer = (p.noise(this.seed + col.x * 0.01, p.frameCount * 0.01) - 0.5);
      const sway = shimmer * 16 * col.wobble * stillness;
      const top = this.horizonY - p.height * 0.05 + shimmer * 18;
      const height = p.height * 0.45 + shimmer * 26 * stillness;
      const gradientSteps = 5;
      for (let i = 0; i < gradientSteps; i += 1) {
        const stepAlpha = alphaBase * p.lerp(0.2, 0.6, i / (gradientSteps - 1));
        p.fill(255, 230, 188, stepAlpha);
        const stepTop = p.lerp(top, top + height, i / gradientSteps);
        const stepHeight = height / gradientSteps;
        p.rect(col.x + sway * 0.35, stepTop, col.width + shimmer * 5, stepHeight, 8);
      }
    });
    p.pop();
    p.blendMode(p.BLEND);
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
    this.y = height * 0.15;
    this.radius = Math.min(width, height) * 0.1;
  }

  update(stillness) {
    const p = this.p;
    this.phase += 0.01 + stillness * 0.02;
    this.tremor = (p.noise(this.rippleSeed, p.frameCount * 0.01) - 0.5) * 6 * (0.6 + stillness);
  }

  draw(stillness) {
    const p = this.p;
    this.update(stillness);
    const pulse = (Math.sin(this.phase) + 1) * 0.5;
    const baseRadius = this.radius * p.lerp(0.92, 1.08, pulse);

    p.push();
    p.translate(this.x, this.y + this.tremor);
    p.noStroke();
    p.blendMode(p.SOFT_LIGHT);

    for (let i = 0; i < 4; i += 1) {
      const ringRadius = baseRadius + i * 12;
      const alpha = p.map(i, 0, 3, 180, 60) * p.lerp(0.9, 1.2, stillness);
      const hue = p.lerpColor(p.color(...this.palette.skyTop), p.color(255, 226, 180), i / 4);
      hue.setAlpha(alpha);
      p.fill(hue);
      const wobble = (p.noise(this.rippleSeed + i * 10, p.frameCount * 0.008) - 0.5) * 6 * stillness;
      p.ellipse(0, wobble, ringRadius * 2.2, ringRadius * 2.05);
    }

    p.blendMode(p.SCREEN);
    p.stroke(255, 240, 200, 120);
    p.strokeWeight(2);
    const rayCount = 12;
    for (let i = 0; i < rayCount; i += 1) {
      const angle = (p.TWO_PI / rayCount) * i + pulse * 0.4;
      const inner = baseRadius * 0.9;
      const outer = inner + p.lerp(14, 24, stillness);
      p.line(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer);
    }

    p.noStroke();
    p.fill(255, 240, 210, 200);
    p.ellipse(0, 0, baseRadius * 1.6, baseRadius * 1.5);

    p.pop();
    p.blendMode(p.BLEND);
  }
}

export function createSummerScene(p) {
  let speedMultiplier = 1;
  let shimmer = 0;
  let playerX = 0;

  const herbFloor = [];
  const cicadas = [];
  const heatVeil = { instance: null };
  let sunGlyph;

  const palette = {
    skyTop: [248, 226, 178],
    skyBottom: [212, 204, 178],
    meadowLight: [234, 210, 150],
    meadowDeep: [202, 180, 120],
    shadow: [70, 120, 130],
    accentWarm: [242, 206, 134]
  };

  function populateHerbFloor() {
    herbFloor.length = 0;
    const rows = 7;
    const cols = Math.floor(p.width / 26) + 24;
    for (let r = 0; r < rows; r += 1) {
      const rowMix = r / Math.max(rows - 1, 1);
      const depthBase = p.constrain(p.lerp(0.12, 0.92, rowMix) + p.random(-0.06, 0.06), 0, 1);
      const baseY = p.lerp(p.height * 0.52, p.height * 0.99, rowMix) + p.random(-6, 6);
      for (let c = 0; c < cols; c += 1) {
        const depth = p.constrain(depthBase + p.random(-0.04, 0.04), 0, 1);
        const x = p.map(c, 0, cols - 1, -50, p.width + 50) + p.random(-8, 8);
        const height = p.lerp(p.height * 0.22, p.height * 0.4, 1 - depth) * p.random(0.92, 1.05);
        herbFloor.push(new HerbStalk(p, x, baseY + p.random(-8, 8), height, depth, {
          stem: p.lerpColor(p.color(palette.meadowLight), p.color(palette.meadowDeep), depth).levels,
          head: palette.accentWarm
        }));
      }
    }
  }

  function populateCicadas(horizonY) {
    cicadas.length = 0;
    const count = Math.max(35, Math.floor(p.width / 14));
    for (let i = 0; i < count; i += 1) {
      cicadas.push(new CicadaShimmer(p, horizonY));
    }
  }

  function populateHeat(horizonY) {
    heatVeil.instance = new HeatVeil(p, horizonY);
    heatVeil.instance.regenerate(p.width);
  }

  function resize() {
    playerX = p.width * 0.4;
    const horizonY = p.height * 0.48;
    populateHerbFloor();
    populateCicadas(horizonY);
    populateHeat(horizonY);
    sunGlyph = new SunGlyph(p, palette);
    sunGlyph.resize(p.width, p.height);
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
      p.fill(p.lerpColor(light, deep, mix));
      p.rect(0, y, p.width, 4);
    }

    if (stillness > 0.02 && heatVeil.instance) {
      heatVeil.instance.draw(stillness);
    }
  }

  function drawHerbs(stillness, movement) {
    const layered = [...herbFloor];
    layered.sort((a, b) => a.depth - b.depth);
    layered.forEach(blade => {
      blade.draw({ playerX, movement, stillness });
    });
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
      const stillness = p.constrain(1.2 - speedMultiplier, 0, 1);
      const movement = p.constrain((speedMultiplier - 0.25) / 1.2, 0, 1);

      drawBackground(stillness + shimmer * 0.08);

      const drift = (p.noise(p.frameCount * 0.0015) - 0.5) * 30 * (0.4 + movement);
      const targetX = (p.mouseIsPressed && p.mouseX) ? p.mouseX : p.width * 0.4 + drift;
      playerX = p.lerp(playerX, targetX, 0.03 + movement * 0.07);

      drawHerbs(stillness, movement);

      cicadas.forEach(cicada => {
        cicada.update(stillness);
        cicada.draw(stillness + shimmer * 0.3);
      });

      shimmer = p.lerp(shimmer, 0, 0.01 * speedMultiplier);
    }
  };
}
