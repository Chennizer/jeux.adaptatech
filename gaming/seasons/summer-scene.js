class GrassBlade {
  constructor(p, x, groundY, palette) {
    this.p = p;
    this.x = x;
    this.groundY = groundY;
    this.height = p.random(p.height * 0.12, p.height * 0.22);
    this.curve = p.random(0.6, 1.2);
    this.swayOffset = p.random(1000);
    this.thickness = p.random(1.3, 2.4);
    this.palette = palette;
    this.shadowMix = p.random(0.1, 0.3);
  }

  update(speedMultiplier, wind, playerPos) {
    const p = this.p;
    const swayNoise = p.noise(this.swayOffset + p.frameCount * 0.0025 * speedMultiplier);
    this.sway = (swayNoise - 0.5) * 26 * wind;
    const partRadius = p.width * 0.28;
    const distToPlayer = Math.abs(playerPos.x - this.x);
    const influence = p.constrain(1 - distToPlayer / partRadius, 0, 1);
    this.parting = influence * 18;
  }

  draw(shadowTint) {
    const p = this.p;
    p.push();
    p.translate(this.x, this.groundY);
    const sway = this.sway + this.parting;
    const tipX = sway * 1.2;
    const tipY = -this.height;

    p.noFill();
    const baseColor = p.color(...this.palette.base);
    const highlight = p.color(...this.palette.tip);
    const shadow = p.lerpColor(baseColor, shadowTint, this.shadowMix);

    p.stroke(shadow);
    p.strokeWeight(this.thickness + 0.8);
    p.bezier(0, 0, sway * 0.2, tipY * 0.35, sway * 0.5, tipY * 0.68, tipX, tipY);

    p.stroke(baseColor);
    p.strokeWeight(this.thickness);
    p.bezier(0, 0, sway * 0.25, tipY * 0.38, sway * 0.6, tipY * 0.7, tipX, tipY);

    p.stroke(highlight);
    p.strokeWeight(this.thickness * 0.55);
    p.bezier(0, 0, sway * 0.32, tipY * 0.4, sway * 0.75, tipY * 0.74, tipX + 2, tipY - 6);
    p.pop();
  }
}

class CicadaGlint {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height * 0.12, p.height * 0.55);
    this.size = p.random(1.5, 4);
    this.life = p.random(80, 180);
    this.twinkleSpeed = p.random(0.05, 0.12);
  }

  update(multiplier, shimmerStrength) {
    this.life -= 1 * multiplier;
    if (this.life <= 0) {
      this.reset();
      return;
    }
    this.twinkle = (Math.sin(this.life * this.twinkleSpeed) + 1) * 0.5 * shimmerStrength;
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(255, 229, 180, p.map(this.twinkle, 0, 1, 30, 140, true));
    p.ellipse(this.x, this.y, this.size * 1.5, this.size);
  }
}

class FallingLeaf {
  constructor(p, originX, originY) {
    this.p = p;
    this.originX = originX;
    this.originY = originY;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = this.originX + p.random(-30, 30);
    this.y = this.originY + p.random(-20, 20);
    this.size = p.random(9, 14);
    this.rotation = p.random(p.TWO_PI);
    this.spin = p.random(-0.02, 0.02);
    this.speedY = p.random(0.5, 1.2);
    this.sway = p.random(0.5, 1.1);
    this.life = p.random(140, 220);
  }

  update(multiplier) {
    const p = this.p;
    this.rotation += this.spin * multiplier;
    this.x += Math.sin(this.rotation * 2) * this.sway * multiplier;
    this.y += this.speedY * multiplier;
    this.life -= 1 * multiplier;
    if (this.y > p.height || this.life <= 0) {
      this.reset();
      this.life = p.random(60, 120);
    }
  }

  draw(color) {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    p.noStroke();
    p.fill(color);
    p.beginShape();
    p.vertex(0, -this.size * 0.4);
    p.bezierVertex(this.size * 0.6, -this.size * 0.2, this.size * 0.6, this.size * 0.5, 0, this.size * 0.7);
    p.bezierVertex(-this.size * 0.6, this.size * 0.4, -this.size * 0.5, -this.size * 0.2, 0, -this.size * 0.4);
    p.endShape(p.CLOSE);
    p.pop();
  }
}

export function createSummerScene(p) {
  const grass = [];
  const glints = [];
  const fallingLeaves = [];
  let groundY = p.height * 0.72;
  let speedMultiplier = 1;
  let shimmer = 0.45;
  let lastPointer = { x: p.width * 0.5, y: p.height * 0.5 };
  let movementActivity = 0;
  let pointerListenerAttached = false;

  const palette = {
    skyTop: [247, 225, 170],
    skyBottom: [214, 196, 150],
    meadow: [228, 199, 122],
    meadowDeep: [204, 170, 90],
    tealShadow: [72, 124, 118],
    leaf: [211, 177, 116],
    leafShadow: [167, 135, 99],
    grass: { base: [227, 194, 120], tip: [247, 215, 149] }
  };

  function resize() {
    groundY = p.height * 0.72;
    grass.length = 0;
    glints.length = 0;
    fallingLeaves.length = 0;

    const bladeCount = Math.floor(Math.max(220, (p.width * p.height) / 7000));
    for (let i = 0; i < bladeCount; i += 1) {
      const x = p.random(-20, p.width + 20);
      grass.push(new GrassBlade(p, x, groundY + p.random(-6, 12), palette.grass));
    }

    const glintCount = Math.floor(Math.max(28, (p.width * p.height) / 35000));
    for (let i = 0; i < glintCount; i += 1) {
      glints.push(new CicadaGlint(p));
    }

    for (let i = 0; i < 12; i += 1) {
      const originX = p.width * 0.23 + p.random(-40, 40);
      const originY = groundY - p.height * 0.24 + p.random(-10, 10);
      fallingLeaves.push(new FallingLeaf(p, originX, originY));
    }
  }

  function attachPointerListener() {
    if (pointerListenerAttached) return;
    pointerListenerAttached = true;
    const updatePointer = evt => {
      if (typeof evt.clientX === 'number') {
        lastPointer = { x: evt.clientX, y: evt.clientY };
      }
    };
    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('touchmove', evt => {
      if (evt.touches && evt.touches.length) {
        const touch = evt.touches[0];
        lastPointer = { x: touch.clientX, y: touch.clientY };
      }
    }, { passive: true });
    window.addEventListener('pointerdown', triggerLeafFall, { passive: true });
    window.addEventListener('touchstart', triggerLeafFall, { passive: true });
  }

  function triggerLeafFall() {
    const originX = p.width * 0.23;
    const originY = groundY - p.height * 0.24;
    for (let i = 0; i < 6; i += 1) {
      fallingLeaves.push(new FallingLeaf(p, originX, originY));
    }
  }

  function drawBackground() {
    const skyTop = p.color(...palette.skyTop);
    const skyBottom = p.color(...palette.skyBottom);
    for (let y = 0; y < p.height; y += 2) {
      const mix = p.map(y, 0, p.height, 0, 1, true);
      const col = p.lerpColor(skyTop, skyBottom, mix);
      p.stroke(col);
      p.line(0, y, p.width, y);
    }
  }

  function drawMeadow(shadowTint) {
    p.noStroke();
    p.fill(...palette.meadow);
    p.rect(0, groundY, p.width, p.height - groundY);

    p.fill(...palette.meadowDeep, 180);
    p.beginShape();
    p.vertex(-20, p.height);
    for (let x = -20; x <= p.width + 20; x += 30) {
      const undulation = p.noise(x * 0.003, p.frameCount * 0.0015) * p.height * 0.04;
      p.vertex(x, groundY - undulation);
    }
    p.vertex(p.width + 20, p.height);
    p.endShape(p.CLOSE);

    p.fill(shadowTint);
    p.beginShape();
    p.vertex(-20, p.height);
    for (let x = -20; x <= p.width * 0.55; x += 24) {
      const shade = p.noise(x * 0.004 + 200, p.frameCount * 0.001) * 18;
      p.vertex(x, groundY - shade);
    }
    p.vertex(p.width * 0.55, p.height);
    p.endShape(p.CLOSE);
  }

  function drawOak(shadowTint) {
    const trunkBaseX = p.width * 0.22;
    const trunkBaseY = groundY;

    p.noStroke();
    p.fill(126, 96, 62);
    p.beginShape();
    p.vertex(trunkBaseX - 16, trunkBaseY);
    p.vertex(trunkBaseX - 6, trunkBaseY - 110);
    p.vertex(trunkBaseX + 4, trunkBaseY - 160);
    p.vertex(trunkBaseX + 16, trunkBaseY);
    p.endShape(p.CLOSE);

    p.fill(158, 122, 82);
    p.beginShape();
    p.vertex(trunkBaseX - 5, trunkBaseY - 40);
    p.vertex(trunkBaseX - 10, trunkBaseY - 90);
    p.vertex(trunkBaseX + 40, trunkBaseY - 140);
    p.vertex(trunkBaseX + 25, trunkBaseY - 70);
    p.endShape(p.CLOSE);

    p.fill(...palette.leaf);
    p.ellipse(trunkBaseX + 12, trunkBaseY - 170, p.width * 0.22, p.height * 0.22);
    p.ellipse(trunkBaseX - 30, trunkBaseY - 150, p.width * 0.2, p.height * 0.19);
    p.ellipse(trunkBaseX, trunkBaseY - 120, p.width * 0.16, p.height * 0.17);

    p.fill(p.lerpColor(p.color(...palette.leaf), shadowTint, 0.4));
    p.ellipse(trunkBaseX + 24, trunkBaseY - 140, p.width * 0.18, p.height * 0.16);

    p.fill(shadowTint.levels[0], shadowTint.levels[1], shadowTint.levels[2], 120);
    p.beginShape();
    p.vertex(trunkBaseX - 70, groundY + 6);
    p.vertex(trunkBaseX + 180, groundY + 6);
    p.vertex(trunkBaseX + 260, groundY + 70);
    p.vertex(trunkBaseX - 20, groundY + 70);
    p.endShape(p.CLOSE);
  }

  function drawHeatShimmer(shimmerStrength) {
    p.noFill();
    for (let i = 0; i < 18; i += 1) {
      const y = p.height * 0.2 + i * (p.height * 0.04);
      const wobble = (p.noise(i * 0.2, p.frameCount * 0.01) - 0.5) * 18 * shimmerStrength;
      p.stroke(255, 235, 190, 30 * shimmerStrength);
      p.strokeWeight(3);
      p.beginShape();
      for (let x = -20; x <= p.width + 20; x += 22) {
        const offset = (p.noise(x * 0.01, y * 0.01, p.frameCount * 0.006) - 0.5) * 12 * shimmerStrength + wobble;
        p.vertex(x, y + offset);
      }
      p.endShape();
    }
  }

  return {
    id: 'summer',
    name: 'Été',
    description: 'Chaleur assoupissante et herbes hautes',
    resize,
    enter() {
      shimmer = 0.8;
      attachPointerListener();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      shimmer = 1;
      triggerLeafFall();
    },
    draw() {
      drawBackground();

      const pointer = {
        x: Number.isFinite(p.mouseX) ? p.mouseX : lastPointer.x,
        y: Number.isFinite(p.mouseY) ? p.mouseY : lastPointer.y
      };
      const delta = Math.hypot(pointer.x - lastPointer.x, pointer.y - lastPointer.y);
      lastPointer = pointer;
      const movementSample = p.constrain(delta / 20, 0, 1);
      movementActivity = p.lerp(movementActivity, movementSample, 0.05);
      const stillness = 1 - movementActivity;

      const shadowTint = p.color(...palette.tealShadow, 160);
      drawMeadow(shadowTint);
      drawOak(shadowTint);

      const wind = p.lerp(0.45, 0.95, speedMultiplier);
      const shimmerStrength = p.lerp(0.3, 1.05, stillness) * shimmer;
      shimmer = p.lerp(shimmer, 0.45, 0.01 * speedMultiplier);

      grass.forEach(blade => {
        blade.update(speedMultiplier, wind, pointer);
      });

      grass.sort((a, b) => a.groundY - b.groundY);
      grass.forEach(blade => blade.draw(shadowTint));

      glints.forEach(glint => {
        glint.update(speedMultiplier, shimmerStrength);
        glint.draw();
      });

      fallingLeaves.forEach(leaf => {
        leaf.update(speedMultiplier);
        leaf.draw(p.color(...palette.leafShadow, 180));
      });

      drawHeatShimmer(shimmerStrength);
    }
  };
}
