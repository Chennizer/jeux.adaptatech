class GrassBlade {
  constructor(p, x, groundFn, palette) {
    this.p = p;
    this.x = x;
    this.groundFn = groundFn;
    this.seed = p.random(1000);
    this.height = p.random(p.height * 0.12, p.height * 0.22);
    this.baseLean = p.random(-0.35, 0.35);
    this.thickness = p.random(1.1, 2.4);
    const shadeShift = p.random(-8, 12);
    const color = palette[Math.floor(p.random(palette.length))];
    this.color = p.color(
      p.red(color) + shadeShift,
      p.green(color) + shadeShift,
      p.blue(color) + shadeShift,
      220
    );
    this.shadowColor = p.color(94, 141, 140, 90);
  }

  draw(pointer, wind, movementFactor, speedMultiplier) {
    const p = this.p;
    const baseY = this.groundFn(this.x);
    const baseHeight = this.height * (0.85 + p.noise(this.seed, p.frameCount * 0.002 * speedMultiplier) * 0.3);
    const sway = Math.sin(p.frameCount * 0.01 * speedMultiplier + this.seed) * 4;
    const drift = (p.noise(this.seed, p.frameCount * 0.003 * speedMultiplier) - 0.5) * 10;

    const dx = this.x - pointer.x;
    const dy = baseY - pointer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const influenceRadius = Math.max(p.width * 0.14, 140);
    const parting = dist < influenceRadius ? (1 - dist / influenceRadius) * movementFactor : 0;
    const direction = dx >= 0 ? 1 : -1;

    const lean = this.baseLean * 0.6 + wind * 0.8 + sway * 0.04 + drift * 0.02 + direction * parting * 1.2;
    const tipX = this.x + lean * baseHeight;
    const tipY = baseY - baseHeight;

    p.stroke(this.shadowColor);
    p.strokeWeight(this.thickness + 1.1);
    p.line(this.x + 2, baseY + 1, tipX + 2, tipY + 1);

    p.stroke(this.color);
    p.strokeWeight(this.thickness);
    p.line(this.x, baseY, tipX, tipY);
  }
}

class CicadaGlint {
  constructor(p, groundFn) {
    this.p = p;
    this.groundFn = groundFn;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width * 0.05, p.width * 0.95);
    const horizon = p.height * 0.25;
    const ground = this.groundFn(this.x) - p.height * 0.2;
    this.y = p.random(horizon, Math.max(horizon + 20, ground));
    this.scale = p.random(0.8, 1.6);
    this.seed = p.random(1000);
  }

  draw(heatStrength) {
    const p = this.p;
    const shimmer = Math.sin(p.frameCount * 0.04 + this.seed) * 0.5 + (p.noise(this.seed, p.frameCount * 0.01) - 0.5) * 1.4;
    const alpha = p.map(shimmer * heatStrength, -1, 1, 10, 180, true);
    if (alpha < 8) return;
    const size = 2.2 * this.scale + heatStrength * 0.8;
    p.noStroke();
    p.fill(255, 232, 180, alpha);
    p.ellipse(this.x, this.y, size * 2, size * 1.2);
    p.fill(152, 201, 197, alpha * 0.5);
    p.ellipse(this.x + 1, this.y - 1, size * 1.3, size * 0.8);
  }
}

class FallingLeaf {
  constructor(p, originX, originY) {
    this.p = p;
    this.reset(originX, originY);
  }

  reset(originX, originY) {
    const p = this.p;
    this.x = originX + p.random(-40, 40);
    this.y = originY + p.random(-20, 20);
    this.size = p.random(10, 20);
    this.angle = p.random(p.TWO_PI);
    this.spin = p.random(-0.02, 0.02);
    this.speed = p.random(0.25, 0.6);
    this.drift = p.random(-0.3, 0.35);
    this.life = p.random(320, 520);
    this.color = p.color(215, 184, 120, 200);
    this.shadow = p.color(106, 148, 147, 120);
  }

  update(multiplier) {
    this.life -= 1.4 * multiplier;
    this.x += this.drift * 1.5 * multiplier;
    this.y += this.speed * 2.1 * multiplier;
    this.angle += this.spin * multiplier;
  }

  draw() {
    const p = this.p;
    if (this.life <= 0) return false;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.noStroke();
    p.fill(this.shadow);
    p.ellipse(2, 3, this.size * 0.9, this.size * 0.5);
    p.fill(this.color);
    p.ellipse(0, 0, this.size, this.size * 0.55);
    p.pop();
    return true;
  }
}

export function createSummerScene(p) {
  let speedMultiplier = 1;
  let heatPulse = 0;
  let grassBlades = [];
  let cicadas = [];
  let leaves = [];
  let groundYFn = x => p.height * 0.7;
  let tree = { x: 0, baseY: 0, width: 0, height: 0 };
  let pointer = { x: p.width * 0.5, y: p.height * 0.6, movedAt: 0 };
  let lastPointer = { x: null, y: null };
  let lastLeafTrigger = -1000;

  const meadowPalette = [
    p.color(235, 206, 138),
    p.color(227, 193, 120),
    p.color(240, 214, 150),
    p.color(222, 188, 112)
  ];

  function groundHeight(x) {
    return groundYFn(x);
  }

  function resize() {
    groundYFn = x => {
      const base = p.height * 0.72;
      const undulation = p.noise(x * 0.0014, 3.2) * p.height * 0.08;
      const slowRise = Math.sin(x * 0.0013) * p.height * 0.03;
      return base - undulation + slowRise;
    };

    tree = {
      x: p.width * 0.78,
      baseY: groundHeight(p.width * 0.78),
      width: p.width * 0.12,
      height: p.height * 0.42
    };

    grassBlades = [];
    const count = Math.floor(Math.max(220, (p.width * p.height) / 3500));
    for (let i = 0; i < count; i += 1) {
      const x = (i / count) * p.width + p.random(-6, 6);
      grassBlades.push(new GrassBlade(p, x, groundHeight, meadowPalette));
    }

    cicadas = [];
    const cicadaCount = Math.floor(Math.max(24, p.width / 30));
    for (let i = 0; i < cicadaCount; i += 1) {
      cicadas.push(new CicadaGlint(p, groundHeight));
    }

    leaves = [];
    pointer = { x: p.width * 0.5, y: p.height * 0.6, movedAt: p.millis() };
  }

  function spawnLeaves(count = 10) {
    for (let i = 0; i < count; i += 1) {
      leaves.push(
        new FallingLeaf(
          p,
          tree.x + p.random(-tree.width * 0.35, tree.width * 0.25),
          tree.baseY - tree.height * 0.92
        )
      );
    }
  }

  function updatePointer() {
    const currentX = p.mouseX ?? pointer.x;
    const currentY = p.mouseY ?? pointer.y;
    if (Number.isFinite(currentX) && Number.isFinite(currentY)) {
      if (currentX !== lastPointer.x || currentY !== lastPointer.y) {
        pointer.x = currentX;
        pointer.y = currentY;
        pointer.movedAt = p.millis();
        lastPointer = { x: currentX, y: currentY };
      }
    }
  }

  function drawSky(heatStrength) {
    const top = p.color(187, 219, 210);
    const mid = p.color(232, 218, 176);
    const bottom = p.color(236, 214, 150);
    for (let y = 0; y <= p.height; y += 2) {
      const t = p.map(y, 0, p.height, 0, 1, true);
      const col = y < p.height * 0.5 ? p.lerpColor(top, mid, t * 1.3) : p.lerpColor(mid, bottom, (t - 0.5) * 2);
      p.stroke(col);
      const offset = (p.noise(y * 0.01, p.frameCount * 0.002) - 0.5) * heatStrength * 4;
      p.line(-10, y + offset, p.width + 10, y + offset);
    }

    const sunRadius = p.height * 0.28;
    p.noStroke();
    p.fill(255, 244, 210, 50 + heatStrength * 30);
    p.ellipse(p.width * 0.22, p.height * 0.28, sunRadius * 1.5);
    p.fill(255, 241, 200, 90);
    p.ellipse(p.width * 0.22, p.height * 0.28, sunRadius * 0.8);
  }

  function drawHeatHaze(heatStrength) {
    const bands = 9;
    p.noStroke();
    for (let i = 0; i < bands; i += 1) {
      const y = p.map(i, 0, bands - 1, p.height * 0.35, p.height * 0.75);
      const alpha = p.map(i, 0, bands - 1, 40, 12) * heatStrength;
      const wobble = (p.noise(i * 0.3, p.frameCount * 0.01) - 0.5) * 14 * heatStrength;
      p.fill(255, 227, 178, alpha);
      p.rect(-10, y + wobble, p.width + 20, 10);
    }
  }

  function drawGround(heatStrength) {
    p.noStroke();
    p.beginShape();
    for (let x = -20; x <= p.width + 20; x += 22) {
      const y = groundHeight(x) + (p.noise(x * 0.01, p.frameCount * 0.002) - 0.5) * 4 * heatStrength;
      p.fill(233, 207, 144);
      p.vertex(x, y);
    }
    p.vertex(p.width + 20, p.height + 20);
    p.vertex(-20, p.height + 20);
    p.endShape(p.CLOSE);

    p.fill(215, 188, 130, 120);
    p.beginShape();
    for (let x = -20; x <= p.width + 20; x += 28) {
      const y = groundHeight(x) + p.height * 0.02 + (p.noise(x * 0.013, 12.7) - 0.5) * 12;
      p.vertex(x, y);
    }
    p.vertex(p.width + 20, p.height + 20);
    p.vertex(-20, p.height + 20);
    p.endShape(p.CLOSE);
  }

  function drawTree(heatStrength) {
    p.push();
    p.noStroke();
    const trunkWidth = tree.width * 0.25;
    const trunkBase = tree.baseY;
    const trunkTop = trunkBase - tree.height * 0.65;
    p.fill(120, 150, 145, 200);
    p.rectMode(p.CENTER);
    p.rect(tree.x, (trunkBase + trunkTop) / 2, trunkWidth, trunkBase - trunkTop, 8);

    p.fill(104, 146, 142, 220);
    p.rect(tree.x - trunkWidth * 0.35, (trunkBase + trunkTop * 0.9) / 2, trunkWidth * 0.4, (trunkBase - trunkTop) * 0.55, 6);

    const canopyWidth = tree.width * 1.4;
    const canopyHeight = tree.height * 0.9;
    const canopyCenterY = trunkTop - canopyHeight * 0.08;
    const teal = p.color(110, 166, 165, 210);
    const deepTeal = p.color(76, 126, 126, 230);
    for (let i = 0; i < 6; i += 1) {
      const offsetX = (p.noise(i * 0.4, p.frameCount * 0.003) - 0.5) * 24;
      const offsetY = (p.noise(i * 0.6, p.frameCount * 0.004) - 0.5) * 12;
      const layerWidth = canopyWidth * (0.9 - i * 0.08);
      const layerHeight = canopyHeight * (0.9 - i * 0.1);
      const mix = p.map(i, 0, 5, 0.2, 0.9);
      p.fill(p.lerpColor(teal, deepTeal, mix));
      p.ellipse(tree.x + offsetX, canopyCenterY + offsetY, layerWidth, layerHeight);
    }

    p.fill(102, 150, 148, 90 + heatStrength * 30);
    const shadowLength = tree.width * 2.4;
    const baseY = tree.baseY;
    p.beginShape();
    p.vertex(tree.x, baseY);
    p.vertex(tree.x - shadowLength, baseY + shadowLength * 0.12);
    p.vertex(tree.x - shadowLength * 0.55, baseY + shadowLength * 0.2);
    p.vertex(tree.x + shadowLength * 0.15, baseY + shadowLength * 0.08);
    p.endShape(p.CLOSE);
    p.pop();
  }

  function drawGrass(movementFactor, heatStrength) {
    const wind = Math.sin(p.frameCount * 0.004 * speedMultiplier) * 0.5 + (p.noise(p.frameCount * 0.0018) - 0.5) * 1.2;
    for (let i = 0; i < grassBlades.length; i += 1) {
      const blade = grassBlades[i];
      blade.draw(pointer, wind, movementFactor, speedMultiplier);
    }

    p.noStroke();
    p.fill(186, 214, 203, 40 + heatStrength * 30);
    p.rect(0, p.height * 0.55, p.width, p.height * 0.5);
  }

  function drawCicadas(heatStrength) {
    cicadas.forEach(glint => glint.draw(heatStrength));
  }

  function drawLeaves() {
    leaves = leaves.filter(leaf => {
      leaf.update(speedMultiplier);
      return leaf.draw();
    });
  }

  return {
    id: 'summer',
    name: 'Été',
    description: 'Prairie dorée, cigales et chaleur somnolente',
    resize,
    enter() {
      pointer.movedAt = p.millis();
      heatPulse = 1.1;
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      heatPulse = 1.4;
      spawnLeaves(14);
    },
    draw() {
      updatePointer();

      const now = p.millis();
      const stillness = p.map(now - pointer.movedAt, 0, 4000, 0.2, 1.2, true);
      const heatStrength = Math.min(1.4, stillness + heatPulse);
      heatPulse = p.lerp(heatPulse, 0, 0.01 * speedMultiplier);

      const movementFactor = p.map(now - pointer.movedAt, 0, 1400, 1, 0.35, true);

      if (p.mouseIsPressed && p.frameCount - lastLeafTrigger > 16) {
        spawnLeaves(p.random(6, 12));
        lastLeafTrigger = p.frameCount;
        pointer.movedAt = now;
      }

      drawSky(heatStrength);
      drawHeatHaze(heatStrength);
      drawGround(heatStrength);
      drawTree(heatStrength);
      drawCicadas(heatStrength);
      drawGrass(movementFactor, heatStrength);
      drawLeaves();
    }
  };
}
