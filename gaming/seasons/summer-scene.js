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
    const sway = (p.noise(this.seed, p.frameCount * 0.003) - 0.5) * this.height * 0.16;
    const breeze = Math.sin((p.frameCount * 0.01 + this.seed) * (0.5 + movement)) * this.height * 0.08;
    const parting = movement * 36 * Math.exp(-Math.abs(this.x - playerX) / 140) * Math.sign(this.x - playerX);

    const tipX = this.x + sway + breeze + parting;
    const tipY = this.groundY - this.height * p.lerp(0.86, 0.7, this.depth);
    const midY = p.lerp(this.groundY, tipY, 0.55);
    const midX = p.lerp(this.x, tipX, 0.6);

    const baseWidth = p.lerp(5, 2, this.depth);
    p.strokeWeight(baseWidth * this.taper);
    const color = p.color(this.palette.base);
    color.setAlpha(p.map(this.depth, 0, 1, 190, 120));
    p.stroke(color);
    p.noFill();
    p.bezier(this.x, this.groundY, this.x, midY, midX, midY, tipX, tipY);

    if (stillness > 0.2 && p.random() < 0.02) {
      p.stroke(shadowTint.levels[0], shadowTint.levels[1], shadowTint.levels[2], 70);
      p.strokeWeight(baseWidth * 0.35);
      p.line(this.x, this.groundY, this.x + (tipX - this.x) * 0.25, this.groundY + 6);
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
    const alpha = p.map(pulse, 0, 1, 25, 90) * p.lerp(1.2, 1.8, stillness);
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
    const wobble = (p.noise(this.seed, p.frameCount * 0.006) - 0.5) * 16 * stillness;
    const height = 8 + stillness * 14;
    p.noStroke();
    p.fill(255, 235, 190, 32 * stillness);
    p.beginShape();
    for (let x = -20; x <= p.width + 20; x += 28) {
      const offset = (p.noise(this.seed + x * 0.003, p.frameCount * 0.01) - 0.5) * 20 * stillness;
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
    const count = Math.max(12, Math.floor(width / 60));
    for (let i = 0; i < count; i += 1) {
      this.columns.push({
        x: p.map(i, 0, count - 1, -20, p.width + 20) + p.random(-10, 10),
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
      const sway = shimmer * 18 * col.wobble * stillness;
      const top = this.horizonY - p.height * 0.06 + shimmer * 20;
      const height = p.height * 0.5 + shimmer * 28 * stillness;
      const gradientSteps = 5;
      for (let i = 0; i < gradientSteps; i += 1) {
        const stepAlpha = alphaBase * p.lerp(0.18, 0.65, i / (gradientSteps - 1));
        const tint = p.color(255, 235, 190, stepAlpha);
        p.fill(tint);
        const stepTop = p.lerp(top, top + height, i / gradientSteps);
        const stepHeight = height / gradientSteps;
        p.rect(col.x + sway * 0.3, stepTop, col.width + shimmer * 6, stepHeight, 8);
      }
    });
    p.pop();
  }
}

class Leaf {
  constructor(p, originX, originY) {
    this.p = p;
    this.reset(originX, originY);
  }

  reset(originX, originY) {
    const p = this.p;
    this.x = originX + p.random(-40, 40);
    this.y = originY + p.random(-40, 10);
    this.vx = p.random(-0.2, 0.25);
    this.vy = p.random(0.2, 0.6);
    this.spin = p.random(-0.01, 0.01);
    this.angle = p.random(p.TWO_PI);
    this.size = p.random(10, 20);
    this.life = p.random(220, 360);
    this.hue = p.random([p.color(226, 200, 120), p.color(198, 171, 120)]);
  }

  update(multiplier) {
    const p = this.p;
    this.x += this.vx * (0.6 + multiplier);
    this.y += this.vy * (0.8 + multiplier * 0.4);
    this.angle += this.spin;
    this.life -= 1.2;
  }

  draw(shadowTint) {
    const p = this.p;
    if (this.life <= 0) return false;
    const sway = Math.sin(this.angle) * 6;
    p.push();
    p.translate(this.x + sway, this.y);
    p.rotate(this.angle * 0.6);
    p.noStroke();
    const c = p.color(this.hue);
    c.setAlpha(160);
    p.fill(c);
    p.ellipse(0, 0, this.size * 1.2, this.size * 0.9);
    p.fill(shadowTint.levels[0], shadowTint.levels[1], shadowTint.levels[2], 90);
    p.ellipse(-this.size * 0.1, this.size * -0.1, this.size * 0.5, this.size * 0.35);
    p.pop();
    return true;
  }
}

class SeedTuft {
  constructor(p, horizonY, palette) {
    this.p = p;
    this.horizonY = horizonY;
    this.palette = palette;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-30, p.width + 30);
    this.y = p.random(this.horizonY - 40, this.horizonY + 40);
    this.vx = p.random(-0.15, 0.25);
    this.vy = p.random(-0.05, 0.15);
    this.spin = p.random(-0.015, 0.015);
    this.angle = p.random(p.TWO_PI);
    this.size = p.random(6, 11);
    this.wobbleSeed = p.random(1000);
  }

  update({ movement, stillness }) {
    const p = this.p;
    const wobble = (p.noise(this.wobbleSeed, p.frameCount * 0.01) - 0.5) * 0.4;
    this.vx += wobble * 0.08 + movement * 0.01;
    this.vy += (0.02 + stillness * 0.02) * (p.noise(this.wobbleSeed + 1, p.frameCount * 0.01) - 0.5);
    this.x += this.vx * (0.6 + movement * 0.4);
    this.y += this.vy * (0.7 + stillness * 0.3);
    this.angle += this.spin;

    if (this.x < -40) this.x = this.p.width + 30;
    if (this.x > this.p.width + 40) this.x = -30;
    if (this.y < this.horizonY - 70 || this.y > this.horizonY + 90) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.noStroke();
    const fluff = p.color(255, 245, 220, 130);
    const stem = p.color(...this.palette.shadow);
    stem.setAlpha(160);
    p.fill(fluff);
    p.ellipse(0, 0, this.size, this.size * 0.8);
    p.fill(stem);
    p.rect(-this.size * 0.05, -this.size * 0.4, this.size * 0.1, this.size * 0.8, 2);
    p.pop();
  }
}

class Dragonfly {
  constructor(p, horizonY, palette) {
    this.p = p;
    this.horizonY = horizonY;
    this.palette = palette;
    this.seed = p.random(5000);
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-60, p.width + 60);
    this.y = p.random(this.horizonY - 60, this.horizonY + 30);
    this.vx = p.random(-0.4, 0.4);
    this.vy = p.random(-0.2, 0.2);
    this.wingPhase = p.random(p.TWO_PI);
    this.scale = p.random(0.7, 1.2);
    this.dashCooldown = p.random(40, 160);
    this.loopPhase = p.random(p.TWO_PI);
    this.loopAmplitude = p.random(12, 26);
    this.orbitOffset = p.random(-90, 90);
    this.climb = p.random(-0.12, 0.12);
  }

  update({ movement, stillness, playerX }) {
    const p = this.p;
    this.wingPhase += 0.25 + movement * 1.4;

    const drift = (p.noise(this.seed, p.frameCount * 0.003) - 0.5) * 0.34;
    this.vy += drift * (0.6 + stillness * 0.8);

    const follow = p.map(movement, 0, 1, 0.002, 0.018);
    const orbitPull = Math.sin(this.loopPhase * 0.8) * 0.35;
    this.vx += (playerX + this.orbitOffset - this.x) * follow + orbitPull;
    this.vy += this.climb * 0.45;

    this.dashCooldown -= 1;
    if (this.dashCooldown <= 0 && movement > 0.15) {
      const dashAngle = p.random(-0.7, 0.7) + (playerX - this.x) * 0.0011;
      const dashSpeed = p.random(2.8, 4.2) * (0.6 + movement);
      this.vx += Math.cos(dashAngle) * dashSpeed;
      this.vy += Math.sin(dashAngle) * dashSpeed * 0.55;
      this.dashCooldown = p.random(50, 120);
    }

    this.loopPhase += 0.03 + movement * 0.08;
    this.vy += Math.sin(this.loopPhase) * (this.loopAmplitude * 0.006);

    this.vx *= 0.96;
    this.vy *= 0.95;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -80) this.x = p.width + 60;
    if (this.x > p.width + 80) this.x = -60;
    if (this.y < this.horizonY - 110 || this.y > this.horizonY + 80) {
      this.vy *= -0.6;
      this.y = p.constrain(this.y, this.horizonY - 110, this.horizonY + 80);
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.scale(this.scale, this.scale);

    const wingFlap = Math.sin(this.wingPhase) * 8 + 10;
    p.stroke(255, 255, 255, 180);
    p.strokeWeight(1.6);
    p.noFill();
    p.push();
    p.rotate(0.15);
    p.ellipse(4, 0, wingFlap, 10);
    p.rotate(-0.3);
    p.ellipse(-4, 0, wingFlap, 10);
    p.pop();

    p.strokeWeight(2.2);
    const body = p.color(...this.palette.shadow);
    body.setAlpha(200);
    p.stroke(body);
    p.line(-6, 0, 6, 0);

    p.strokeWeight(3.2);
    p.point(6, 0);

    p.pop();
  }
}

export function createSummerScene(p) {
  let speedMultiplier = 1;
  let shimmer = 0;
  let playerX = 0;
  let lastTouchAt = 0;

  const grass = [];
  const cicadas = [];
  const heat = [];
  const dragonflies = [];
  const seedTufts = [];
  let shimmerVeil;
  const leaves = [];
  const palette = {
    skyTop: [248, 226, 178],
    skyBottom: [212, 204, 178],
    meadowLight: [234, 210, 150],
    meadowDeep: [202, 180, 120],
    shadow: [70, 120, 130]
  };

  const groundSeed = p.random(1000);
  const groundY = x => p.height * 0.64 + (p.noise(groundSeed + x * 0.001) - 0.5) * 40;

  function populateGrass() {
    grass.length = 0;
    const count = Math.floor(Math.max(180, p.width / 5));
    for (let i = 0; i < count; i += 1) {
      const x = (i / count) * (p.width + 40) - 20;
      const depth = p.random(0, 1);
      const height = p.lerp(p.height * 0.16, p.height * 0.32, 1 - depth);
      const blade = new GrassBlade(p, x, groundY(x), height, depth, {
        base: p.lerpColor(p.color(palette.meadowLight), p.color(palette.meadowDeep), depth)
      });
      grass.push(blade);
    }
  }

  function populateCicadas(horizonY) {
    cicadas.length = 0;
    const count = Math.floor(p.width / 12);
    for (let i = 0; i < count; i += 1) {
      cicadas.push(new CicadaShimmer(p, horizonY));
    }
  }

  function populateHeat(horizonY) {
    heat.length = 0;
    for (let i = 0; i < 5; i += 1) {
      const y = horizonY + i * 18 + p.random(-6, 6);
      heat.push(new HeatRibbon(p, y));
    }
  }

  function populateDragonflies(horizonY) {
    dragonflies.length = 0;
    const count = Math.floor(p.width / 180) + 3;
    for (let i = 0; i < count; i += 1) {
      dragonflies.push(new Dragonfly(p, horizonY, palette));
    }
  }

  function populateSeedTufts(horizonY) {
    seedTufts.length = 0;
    const count = Math.floor(p.width / 120) + 8;
    for (let i = 0; i < count; i += 1) {
      seedTufts.push(new SeedTuft(p, horizonY, palette));
    }
  }

  function spawnLeaves(count = 8) {
    const treeBaseX = p.width * 0.78;
    const baseY = groundY(treeBaseX) - p.height * 0.02;
    for (let i = 0; i < count; i += 1) {
      leaves.push(new Leaf(p, treeBaseX, baseY - p.height * 0.26));
    }
  }

  function resize() {
    playerX = p.width * 0.4;
    const horizonY = p.height * 0.48;
    populateGrass();
    populateCicadas(horizonY);
    populateHeat(horizonY);
    populateDragonflies(horizonY);
    populateSeedTufts(horizonY);
    shimmerVeil = new HeatShimmer(p, horizonY);
    shimmerVeil.regenerate(p.width);
    leaves.length = 0;
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
    grass.forEach(blade => {
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
      shimmer = 1.3;
      spawnLeaves(10);
    },
    draw() {
      const stillness = p.constrain(1.2 - speedMultiplier, 0, 1);
      const movement = p.constrain((speedMultiplier - 0.25) / 1.2, 0, 1);

      drawBackground(stillness + shimmer * 0.08);

      const drift = (p.noise(p.frameCount * 0.0015) - 0.5) * 30 * (0.4 + movement);
      const targetX = (p.mouseIsPressed && p.mouseX) ? p.mouseX : p.width * 0.4 + drift;
      playerX = p.lerp(playerX, targetX, 0.03 + movement * 0.07);

      drawGrass(stillness, movement);

      seedTufts.forEach(tuft => {
        tuft.update({ movement, stillness });
        tuft.draw();
      });

      if (p.mouseIsPressed && p.millis() - lastTouchAt > 350) {
        spawnLeaves(8);
        lastTouchAt = p.millis();
      }

      const flyerInput = { movement, stillness, playerX };
      dragonflies.forEach(flyer => {
        flyer.update(flyerInput);
        flyer.draw();
      });

      for (let i = leaves.length - 1; i >= 0; i -= 1) {
        leaves[i].update(speedMultiplier);
        const alive = leaves[i].draw(p.color(...palette.shadow));
        if (!alive || leaves[i].y > p.height + 20) {
          leaves.splice(i, 1);
        }
      }

      cicadas.forEach(cicada => {
        cicada.update(stillness);
        cicada.draw(stillness + shimmer * 0.3);
      });

      shimmer = p.lerp(shimmer, 0, 0.01 * speedMultiplier);
    }
  };
}
