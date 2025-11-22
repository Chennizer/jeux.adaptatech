class GrassBlade {
  constructor(p, x, groundY, height, depth, palette) {
    this.p = p;
    this.x = x;
    this.groundY = groundY;
    this.height = height;
    this.depth = depth;
    this.palette = palette;
    this.seed = p.random(1000);
    this.taper = p.random(0.4, 0.85);
  }

  draw({ playerX, movement, stillness, shadowTint }) {
    const p = this.p;
    const sway = (p.noise(this.seed, p.frameCount * 0.003) - 0.5) * this.height * 0.12;
    const breeze = Math.sin((p.frameCount * 0.01 + this.seed) * (0.4 + movement)) * this.height * 0.08;
    const parting = movement * 24 * Math.exp(-Math.abs(this.x - playerX) / 160) * Math.sign(this.x - playerX);

    const tipX = this.x + sway + breeze + parting;
    const tipY = this.groundY - this.height * p.lerp(0.9, 0.72, this.depth);
    const midY = p.lerp(this.groundY, tipY, 0.55);
    const midX = p.lerp(this.x, tipX, 0.6);

    const baseWidth = p.lerp(5, 2, this.depth);
    p.strokeWeight(baseWidth * this.taper);
    const color = p.color(this.palette.base);
    color.setAlpha(p.map(this.depth, 0, 1, 190, 120));
    p.stroke(color);
    p.noFill();
    p.bezier(this.x, this.groundY, this.x, midY, midX, midY, tipX, tipY);

    if (stillness > 0.25 && p.random() < 0.01) {
      p.stroke(shadowTint.levels[0], shadowTint.levels[1], shadowTint.levels[2], 60);
      p.strokeWeight(baseWidth * 0.3);
      p.line(this.x, this.groundY, this.x + (tipX - this.x) * 0.2, this.groundY + 5);
    }
  }
}

class MeadowPlant {
  constructor(p, x, groundY, height, depth, palette, options = {}) {
    this.p = p;
    this.x = x;
    this.groundY = groundY;
    this.height = height;
    this.depth = depth;
    this.palette = palette;
    this.seed = p.random(4000);
    this.stemCount = Math.floor(p.random(2, 4));
    this.tuftLean = p.random(-0.15, 0.15);
    this.motionScale = options.motionScale ?? 0.3;
    const headOptions = options.headOptions || [palette.headWarm];
    this.headOptions = headOptions.map(color => p.color(color));
  }

  draw({ playerX, movement, stillness, shadowTint }) {
    const p = this.p;
    const sway = (p.noise(this.seed, p.frameCount * 0.003) - 0.5) * this.height * 0.1 * this.motionScale;
    const breeze = Math.sin((p.frameCount * 0.012 + this.seed) * (0.5 + movement)) * this.height * 0.08 * this.motionScale;
    const parting = movement * 20 * Math.exp(-Math.abs(this.x - playerX) / 180) * Math.sign(this.x - playerX) * this.motionScale;

    const baseWidth = p.lerp(6, 2.5, this.depth);
    const stemColor = p.color(this.palette.stem);
    stemColor.setAlpha(p.map(this.depth, 0, 1, 200, 120));
    p.stroke(stemColor);
    p.strokeWeight(baseWidth * 0.65);
    p.noFill();

    for (let i = 0; i < this.stemCount; i += 1) {
      const offset = (i - this.stemCount / 2) * p.lerp(4, 2, this.depth);
      const tipX = this.x + sway + breeze + parting + offset * 0.35 + this.tuftLean * this.height * 0.18;
      const tipY = this.groundY - this.height * p.lerp(0.82, 0.64, this.depth) + p.random(-3, 3);
      const midY = p.lerp(this.groundY, tipY, 0.55);
      const midX = p.lerp(this.x + offset * 0.3, tipX, 0.6);
      p.bezier(this.x + offset, this.groundY, this.x + offset, midY, midX, midY, tipX, tipY);

      p.noStroke();
      const headColor = p.color(p.random(this.headOptions));
      headColor.setAlpha(p.map(this.depth, 0, 1, 170, 110));
      p.fill(headColor);
      p.ellipse(tipX, tipY, p.lerp(10, 6, this.depth), p.lerp(12, 7, this.depth));
      p.stroke(shadowTint.levels[0], shadowTint.levels[1], shadowTint.levels[2], 70);
      p.strokeWeight(1.1);
      p.line(tipX, tipY + 1, tipX, tipY + p.lerp(5, 4, this.depth));
      p.noStroke();
    }
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
    this.y = p.random(this.horizonY * 0.7, this.horizonY + 80);
    this.phase = p.random(p.TWO_PI);
    this.scale = p.random(0.6, 1.4);
  }

  update(stillness) {
    const p = this.p;
    this.phase += 0.02 + stillness * 0.015;
    if (this.phase > p.TWO_PI) {
      this.phase -= p.TWO_PI;
    }
    if (p.random() < 0.002) {
      this.reset();
    }
  }

  draw(stillness) {
    const p = this.p;
    const pulse = (Math.sin(this.phase) + 1) * 0.5;
    const alpha = p.map(pulse, 0, 1, 25, 90) * p.lerp(1.1, 1.6, stillness);
    p.noStroke();
    p.fill(255, 238, 180, alpha);
    const size = p.lerp(3, 7, pulse) * this.scale;
    p.ellipse(this.x, this.y, size * 1.2, size * 0.8);
  }
}

class HeatRibbon {
  constructor(p, y) {
    this.p = p;
    this.y = y;
    this.seed = p.random(1000);
  }

  draw(stillness) {
    const p = this.p;
    const wobble = (p.noise(this.seed, p.frameCount * 0.006) - 0.5) * 12 * stillness;
    const height = 6 + stillness * 14;
    p.noStroke();
    p.fill(255, 235, 190, 32 * stillness);
    p.beginShape();
    for (let x = -20; x <= p.width + 20; x += 28) {
      const offset = (p.noise(this.seed + x * 0.003, p.frameCount * 0.01) - 0.5) * 16 * stillness;
      p.vertex(x, this.y + wobble + offset);
    }
    p.vertex(p.width + 30, this.y + wobble + height);
    p.vertex(-30, this.y + wobble + height);
    p.endShape(p.CLOSE);
  }
}

class HeatShimmer {
  constructor(p, horizonY) {
    this.p = p;
    this.horizonY = horizonY;
    this.seed = p.random(5000);
    this.columns = [];
  }

  regenerate(width) {
    const p = this.p;
    this.columns = [];
    const count = Math.max(10, Math.floor(width / 70));
    for (let i = 0; i < count; i += 1) {
      this.columns.push({
        x: p.map(i, 0, count - 1, -20, p.width + 20) + p.random(-12, 12),
        width: p.random(12, 24),
        wobble: p.random(0.4, 1.1)
      });
    }
  }

  draw(stillness) {
    const p = this.p;
    if (stillness <= 0.05) return;

    p.noStroke();
    p.push();
    p.blendMode(p.SOFT_LIGHT);
    const alphaBase = p.map(stillness, 0, 1, 0, 70);
    this.columns.forEach(col => {
      const shimmer = (p.noise(this.seed + col.x * 0.01, p.frameCount * 0.01) - 0.5);
      const sway = shimmer * 16 * col.wobble * stillness;
      const top = this.horizonY - p.height * 0.06 + shimmer * 16;
      const height = p.height * 0.48 + shimmer * 24 * stillness;
      const gradientSteps = 4;
      for (let i = 0; i < gradientSteps; i += 1) {
        const stepAlpha = alphaBase * p.lerp(0.2, 0.6, i / (gradientSteps - 1));
        const tint = p.color(255, 235, 190, stepAlpha);
        p.fill(tint);
        const stepTop = p.lerp(top, top + height, i / gradientSteps);
        const stepHeight = height / gradientSteps;
        p.rect(col.x + sway * 0.3, stepTop, col.width + shimmer * 5, stepHeight, 8);
      }
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
    this.y = height * 0.15;
    this.radius = Math.min(width, height) * 0.1;
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
    const baseRadius = this.radius * p.lerp(0.94, 1.05, pulse);

    p.push();
    p.translate(this.x, this.y + this.tremor);
    p.noStroke();
    p.blendMode(p.SOFT_LIGHT);

    for (let i = 0; i < 3; i += 1) {
      const ringRadius = baseRadius + i * 10;
      const alpha = p.map(i, 0, 2, 170, 70) * p.lerp(0.9, 1.2, stillness);
      const hue = p.lerpColor(p.color(...this.palette.skyTop), p.color(255, 226, 180), i / 3);
      hue.setAlpha(alpha);
      p.fill(hue);
      const wobble = (p.noise(this.rippleSeed + i * 10, p.frameCount * 0.008) - 0.5) * 5 * stillness;
      p.ellipse(0, wobble, ringRadius * 2.1, ringRadius * 2.0);
    }

    p.blendMode(p.SCREEN);
    p.stroke(255, 240, 200, 110);
    p.strokeWeight(2);
    const rayCount = 12;
    for (let i = 0; i < rayCount; i += 1) {
      const angle = (p.TWO_PI / rayCount) * i + pulse * 0.4;
      const inner = baseRadius * 0.88;
      const outer = inner + p.lerp(14, 26, stillness);
      const x1 = Math.cos(angle) * inner;
      const y1 = Math.sin(angle) * inner;
      const x2 = Math.cos(angle) * outer;
      const y2 = Math.sin(angle) * outer;
      p.line(x1, y1, x2, y2);
    }

    p.noStroke();
    const core = p.color(255, 240, 210, 200);
    p.fill(core);
    p.ellipse(0, 0, baseRadius * 1.5, baseRadius * 1.4);

    p.pop();
    p.blendMode(p.BLEND);
  }
}

export function createSummerScene(p) {
  let speedMultiplier = 1;
  let shimmer = 0;
  let playerX = 0;

  const grass = [];
  const herbs = [];
  const cicadas = [];
  const heat = [];
  let sunGlyph;
  let shimmerVeil;
  const palette = {
    skyTop: [248, 226, 178],
    skyBottom: [212, 204, 178],
    meadowLight: [234, 210, 150],
    meadowDeep: [202, 180, 120],
    shadow: [70, 120, 130],
    accentWarm: [242, 206, 134],
    accentCool: [150, 187, 186]
  };

  const groundSeed = p.random(1000);
  const groundY = x => p.height * 0.64 + (p.noise(groundSeed + x * 0.001) - 0.5) * 40;

  function populateGrass() {
    grass.length = 0;
    const count = Math.floor(Math.max(220, p.width / 3));
    for (let i = 0; i < count; i += 1) {
      const depth = p.random(0, 1);
      const x = p.random(-30, p.width + 30);
      const height = p.lerp(p.height * 0.16, p.height * 0.3, 1 - depth) * p.lerp(1.05, 0.88, depth);
      const blade = new GrassBlade(p, x, groundY(x), height, depth, {
        base: p.lerpColor(p.color(palette.meadowLight), p.color(palette.meadowDeep), depth)
      });
      grass.push(blade);
    }
  }

  function populateHerbFloor(horizonY) {
    herbs.length = 0;
    const rows = 5;
    const cols = Math.floor(p.width / 30) + 16;
    for (let r = 0; r < rows; r += 1) {
      const rowMix = r / (rows - 1 || 1);
      const depthBase = p.constrain(p.lerp(0.2, 0.88, rowMix), 0, 1);
      const baseY = p.lerp(horizonY + p.height * 0.08, p.height * 0.98, rowMix);
      for (let c = 0; c < cols; c += 1) {
        const depth = p.constrain(depthBase + p.random(-0.03, 0.03), 0, 1);
        const x = p.map(c, 0, cols - 1, -40, p.width + 40) + p.random(-5, 5);
        const height = p.lerp(p.height * 0.18, p.height * 0.34, 1 - depth) * p.random(0.95, 1.05);
        herbs.push(new MeadowPlant(p, x, baseY + p.random(-5, 5), height, depth, {
          stem: p.lerpColor(p.color(palette.meadowLight), p.color(palette.meadowDeep), depth),
          headWarm: p.color(...palette.accentWarm),
          headCool: p.color(...palette.accentWarm)
        }, {
          motionScale: 0.18,
          headOptions: [p.color(...palette.accentWarm)]
        }));
      }
    }
  }

  function populateCicadas(horizonY) {
    cicadas.length = 0;
    const count = Math.max(18, Math.floor(p.width / 30));
    for (let i = 0; i < count; i += 1) {
      cicadas.push(new CicadaShimmer(p, horizonY));
    }
  }

  function populateHeat(horizonY) {
    heat.length = 0;
    const layers = Math.max(2, Math.floor(p.height / 320));
    for (let i = 0; i < layers; i += 1) {
      heat.push(new HeatRibbon(p, horizonY - p.height * 0.05 + i * 32));
    }
  }

  function resize() {
    playerX = p.width * 0.4;
    const horizonY = p.height * 0.48;
    populateGrass();
    populateHerbFloor(horizonY);
    populateCicadas(horizonY);
    populateHeat(horizonY);
    sunGlyph = new SunGlyph(p, palette);
    sunGlyph.resize(p.width, p.height);
    shimmerVeil = new HeatShimmer(p, horizonY);
    shimmerVeil.regenerate(p.width);
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

    if (stillness > 0.02) {
      heat.forEach(band => band.draw(stillness));
    }
    shimmerVeil.draw(stillness);
  }

  function drawGrass(stillness, movement) {
    const shadowTint = p.color(...palette.shadow);
    const layered = [...grass, ...herbs];
    layered.sort((a, b) => a.depth - b.depth);
    layered.forEach(blade => {
      blade.draw({ playerX, movement, stillness, shadowTint });
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

      drawGrass(stillness, movement);

      cicadas.forEach(cicada => {
        cicada.update(stillness);
        cicada.draw(stillness + shimmer * 0.25);
      });

      shimmer = p.lerp(shimmer, 0, 0.01 * speedMultiplier);
    }
  };
}
