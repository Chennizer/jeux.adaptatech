export function createSummerScene(p) {
  const palette = {
    skyTop: [252, 216, 158],
    skyBottom: [224, 188, 134],
    meadowLight: [232, 204, 126],
    meadowShadow: [184, 168, 124],
    grassLight: [230, 197, 118],
    grassShadow: [120, 149, 146],
    oakBark: [96, 70, 42],
    oakCanopy: [122, 154, 142]
  };

  class MeadowBlade {
    constructor(groundFn) {
      this.reset(groundFn);
    }

    reset(groundFn) {
      this.x = p.random(p.width * -0.05, p.width * 1.05);
      this.baseHeight = p.random(p.height * 0.08, p.height * 0.18);
      this.thickness = p.random(2, 4);
      this.seed = p.random(10_000);
      this.hueBias = p.random(0.6, 1);
      this.groundFn = groundFn;
    }

    draw(focus, sway, partingRadius) {
      const baseY = this.groundFn(this.x);
      const distance = p.dist(this.x, baseY, focus.x, focus.y);
      const parting = p.constrain(1 - distance / partingRadius, 0, 1);
      const away = Math.sign(this.x - focus.x) || (p.random() > 0.5 ? 1 : -1);
      const lean = (sway + (away * parting * 0.9)) * 12;
      const height = this.baseHeight * (0.9 + parting * 0.15);
      const shadowMix = p.map(baseY, p.height * 0.5, p.height, 0.35, 0.8, true);
      const col = p.lerpColor(
        p.color(palette.grassLight[0], palette.grassLight[1], palette.grassLight[2], 220),
        p.color(palette.grassShadow[0], palette.grassShadow[1], palette.grassShadow[2], 240),
        shadowMix * this.hueBias
      );

      p.push();
      p.translate(this.x, baseY);
      p.stroke(col);
      p.strokeWeight(this.thickness);
      p.line(0, 0, lean, -height * 0.7);
      p.strokeWeight(this.thickness * 0.7);
      p.line(lean, -height * 0.7, lean * 1.12, -height);
      p.pop();
    }
  }

  class CicadaGlimmer {
    constructor(groundFn) {
      this.groundFn = groundFn;
      this.reset();
    }

    reset() {
      this.x = p.random(p.width);
      this.y = p.random(p.height * 0.28, p.height * 0.62);
      this.flicker = p.random(10_000);
      this.size = p.random(3, 6);
    }

    update(multiplier) {
      this.x += p.sin(p.frameCount * 0.003 + this.flicker) * 0.2 * multiplier;
      if (this.x < -10 || this.x > p.width + 10) this.reset();
    }

    draw(intensity) {
      const alpha = 80 + p.noise(this.flicker, p.frameCount * 0.01) * 120 * intensity;
      p.noStroke();
      p.fill(255, 240, 180, alpha);
      p.ellipse(this.x, this.y, this.size, this.size * 0.6);
    }
  }

  class FallingLeaf {
    constructor(origin) {
      this.origin = origin;
      this.reset();
    }

    reset() {
      this.x = this.origin.x + p.random(-50, 50);
      this.y = this.origin.y + p.random(-40, 40);
      this.speed = p.random(0.5, 1.2);
      this.spin = p.random(-0.02, 0.02);
      this.angle = p.random(p.TWO_PI);
      this.size = p.random(10, 18);
      this.life = p.random(160, 260);
      this.hue = p.random(0.65, 1);
    }

    update(multiplier) {
      this.life -= 1.1 * multiplier;
      this.angle += this.spin * multiplier;
      this.x += Math.sin(this.angle * 1.3) * 0.7 * multiplier;
      this.y += this.speed * 1.5 * multiplier;
      if (this.life <= 0 || this.y > p.height + 20) {
        this.reset();
        this.life = p.random(120, 220);
      }
    }

    draw() {
      p.push();
      p.translate(this.x, this.y);
      p.rotate(this.angle);
      const baseColor = p.lerpColor(
        p.color(palette.oakCanopy[0], palette.oakCanopy[1], palette.oakCanopy[2]),
        p.color(240, 208, 148),
        0.3
      );
      p.fill(
        p.red(baseColor) * this.hue,
        p.green(baseColor) * this.hue,
        p.blue(baseColor) * this.hue,
        p.map(this.life, 0, 200, 0, 210, true)
      );
      p.noStroke();
      p.beginShape();
      p.vertex(0, -this.size * 0.6);
      p.bezierVertex(this.size * 0.6, -this.size * 0.4, this.size * 0.8, this.size * 0.4, 0, this.size * 0.8);
      p.bezierVertex(-this.size * 0.8, this.size * 0.4, -this.size * 0.6, -this.size * 0.4, 0, -this.size * 0.6);
      p.endShape(p.CLOSE);
      p.pop();
    }
  }

  let speedMultiplier = 1;
  let idleTimer = 0;
  let focus = { x: 0, y: 0 };
  let groundFn = x => p.height * 0.72;
  const meadow = [];
  const glimmers = [];
  const leaves = [];

  function rebuildGround() {
    const hillSeed = p.random(10_000);
    groundFn = x => {
      const base = p.height * 0.72;
      const undulation = p.noise(x * 0.0015, hillSeed) * p.height * 0.05;
      return base + undulation;
    };
  }

  function resize() {
    rebuildGround();
    meadow.length = 0;
    glimmers.length = 0;
    leaves.length = 0;
    const bladeCount = Math.floor(Math.max(200, (p.width * p.height) / 6500));
    for (let i = 0; i < bladeCount; i += 1) {
      meadow.push(new MeadowBlade(groundFn));
    }
    const cicadaCount = Math.floor(Math.max(40, (p.width * p.height) / 22_000));
    for (let i = 0; i < cicadaCount; i += 1) {
      glimmers.push(new CicadaGlimmer(groundFn));
    }
    const origin = { x: p.width * 0.78, y: groundFn(p.width * 0.78) - p.height * 0.26 };
    for (let i = 0; i < 26; i += 1) {
      leaves.push(new FallingLeaf(origin));
    }
    focus = { x: p.width * 0.4, y: groundFn(p.width * 0.4) };
  }

  const oak = {
    draw() {
      const baseX = p.width * 0.78;
      const baseY = groundFn(baseX);
      const canopyHeight = p.height * 0.32;
      const canopyWidth = p.width * 0.26;
      p.noStroke();

      // shade
      p.push();
      p.translate(baseX, baseY);
      const shadowColor = p.color(90, 118, 112, 70);
      p.fill(shadowColor);
      p.beginShape();
      p.vertex(0, 0);
      p.vertex(-p.width * 0.42, p.height * 0.06);
      p.vertex(-p.width * 0.46, p.height * 0.1);
      p.vertex(-p.width * 0.08, p.height * 0.12);
      p.vertex(p.width * 0.06, p.height * 0.11);
      p.endShape(p.CLOSE);
      p.pop();

      // trunk
      p.push();
      p.translate(baseX, baseY);
      p.fill(palette.oakBark[0], palette.oakBark[1], palette.oakBark[2]);
      p.rect(-14, -p.height * 0.18, 28, p.height * 0.2, 14);
      p.fill(palette.oakBark[0] + 18, palette.oakBark[1] + 14, palette.oakBark[2] + 6, 180);
      p.quad(-30, -p.height * 0.12, -12, -p.height * 0.18, -6, -p.height * 0.18, -18, -p.height * 0.08);
      p.pop();

      // canopy
      p.push();
      p.translate(baseX, baseY - canopyHeight * 0.6);
      const canopyColor = p.color(palette.oakCanopy[0], palette.oakCanopy[1], palette.oakCanopy[2], 210);
      for (let i = 0; i < 6; i += 1) {
        const offsetX = (i - 3) * (canopyWidth * 0.12);
        const offsetY = p.random(-canopyHeight * 0.08, canopyHeight * 0.08);
        p.fill(canopyColor);
        p.ellipse(offsetX, offsetY, canopyWidth * 0.85, canopyHeight * 0.5);
      }
      p.fill(palette.oakCanopy[0] - 12, palette.oakCanopy[1] - 8, palette.oakCanopy[2] - 8, 190);
      p.ellipse(0, -canopyHeight * 0.08, canopyWidth, canopyHeight * 0.68);
      p.pop();
    }
  };

  const heatHaze = {
    draw(intensity) {
      const layers = 5;
      for (let i = 0; i < layers; i += 1) {
        const y = p.map(i, 0, layers - 1, p.height * 0.25, p.height * 0.7);
        const wobble = p.sin((p.frameCount * 0.01 + i) * (0.6 + intensity)) * 12 * intensity;
        p.noStroke();
        p.fill(255, 224, 160, 16 + intensity * 24);
        p.rect(-20, y + wobble, p.width + 40, p.height * 0.08, 28);
      }
    }
  };

  function drawSky() {
    const skyTop = p.color(palette.skyTop[0], palette.skyTop[1], palette.skyTop[2]);
    const skyBottom = p.color(palette.skyBottom[0], palette.skyBottom[1], palette.skyBottom[2]);
    for (let y = 0; y < p.height; y += 2) {
      const mix = p.map(y, 0, p.height, 0, 1, true);
      const col = p.lerpColor(skyTop, skyBottom, mix);
      p.stroke(col);
      p.line(0, y, p.width, y);
    }
  }

  function drawMeadowBase() {
    const strips = 5;
    for (let i = 0; i < strips; i += 1) {
      const t = i / (strips - 1);
      const col = p.lerpColor(
        p.color(palette.meadowLight[0], palette.meadowLight[1], palette.meadowLight[2]),
        p.color(palette.meadowShadow[0], palette.meadowShadow[1], palette.meadowShadow[2]),
        t
      );
      p.noStroke();
      p.fill(col);
      p.beginShape();
      p.vertex(-20, p.height);
      for (let x = -20; x <= p.width + 20; x += 24) {
        const bump = p.noise(x * 0.002, i * 0.2) * p.height * 0.04;
        p.vertex(x, groundFn(x) + bump + t * 10);
      }
      p.vertex(p.width + 20, p.height);
      p.endShape(p.CLOSE);
    }
  }

  function updateFocus() {
    const dx = Math.abs(p.mouseX - p.pmouseX) + Math.abs(p.mouseY - p.pmouseY);
    const moved = dx > 0.5;
    if (moved) {
      focus.x = p.lerp(focus.x, p.mouseX, 0.15);
      focus.y = p.lerp(focus.y, groundFn(p.mouseX), 0.2);
      idleTimer = 0;
    } else {
      idleTimer = Math.min(idleTimer + 1, 600);
      const wander = p.noise(p.frameCount * 0.002) - 0.5;
      focus.x = p.lerp(focus.x, p.width * 0.5 + wander * p.width * 0.1, 0.01);
      focus.y = p.lerp(focus.y, groundFn(focus.x), 0.04);
    }
  }

  return {
    id: 'summer',
    name: 'Été',
    description: 'Chaleur assoupie, prairie dorée',
    resize,
    enter() {
      idleTimer = 0;
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      // Trigger a gentle leaf shower when the player taps the switch.
      leaves.forEach(leaf => {
        leaf.life = Math.max(leaf.life, 140);
        leaf.y -= p.random(20, 60);
      });
      idleTimer = Math.max(0, idleTimer - 60);
    },
    draw() {
      updateFocus();
      const idleIntensity = p.constrain(idleTimer / 240, 0, 1);
      const partRadius = p.width * 0.22;

      drawSky();
      heatHaze.draw(0.4 + idleIntensity * 0.9);
      drawMeadowBase();
      oak.draw();

      const sway = Math.sin(p.frameCount * 0.01 * speedMultiplier) * 0.08;
      meadow.forEach(blade => {
        blade.draw(focus, sway + p.noise(blade.seed, p.frameCount * 0.002) * 0.2, partRadius);
      });

      glimmers.forEach(glimmer => {
        glimmer.update(speedMultiplier);
        glimmer.draw(0.6 + idleIntensity * 0.6);
      });

      leaves.forEach(leaf => {
        leaf.update(speedMultiplier);
        leaf.draw();
      });
    }
  };
}
