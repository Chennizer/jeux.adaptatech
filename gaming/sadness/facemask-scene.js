const RIBBON_COLORS = [
  'rgba(70, 140, 200, 0.12)',
  'rgba(120, 160, 220, 0.1)',
  'rgba(180, 210, 255, 0.08)'
];

class TearDrop {
  constructor(p, origin, speedMultiplier = 1) {
    this.p = p;
    this.origin = origin;
    this.reset(speedMultiplier);
  }

  reset(speedMultiplier = 1) {
    const p = this.p;
    this.x = this.origin.x + p.randomGaussian(0, 6);
    this.y = this.origin.y + p.random(-6, 6);
    this.speed = p.random(2.4, 4.4) * speedMultiplier;
    this.thickness = p.random(2, 4);
    this.length = p.random(16, 26);
    this.alpha = p.random(140, 210);
    this.curveOffset = p.random(-0.3, 0.3);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    const sway = p.sin((p.frameCount + this.y) * 0.01) * 0.6 + this.curveOffset;
    this.x += sway * speedMultiplier;
    this.y += this.speed * speedMultiplier;
    return this.y - this.length < p.height * 1.05;
  }

  draw() {
    const p = this.p;
    p.strokeWeight(this.thickness);
    p.stroke(140, 180, 240, this.alpha);
    p.line(this.x, this.y, this.x, this.y - this.length);
    p.noStroke();
    p.fill(190, 220, 255, this.alpha);
    p.ellipse(this.x, this.y, this.thickness * 1.6, this.thickness * 1.2);
  }
}

function drawGradientBackground(p) {
  const ctx = p.drawingContext;
  const gradient = ctx.createLinearGradient(0, 0, p.width, p.height);
  gradient.addColorStop(0, '#0a0f1a');
  gradient.addColorStop(0.32, '#0e1624');
  gradient.addColorStop(0.68, '#0b1220');
  gradient.addColorStop(1, '#080c16');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, p.width, p.height);
}

function drawRibbons(p) {
  p.noFill();
  p.strokeWeight(90);
  for (let i = 0; i < 3; i++) {
    p.stroke(RIBBON_COLORS[i]);
    const offset = (p.frameCount * 0.3 + i * 80) % p.height;
    p.beginShape();
    for (let x = -100; x <= p.width + 100; x += 90) {
      const y = offset + p.sin((x + i * 200) * 0.012) * 120;
      p.curveVertex(x, y - p.height * 0.5);
    }
    p.endShape();
  }
}

export function createFacemaskScene(p) {
  const maskPath = '../../images/facemask.png';
  let maskImg = null;
  let speedMultiplier = 1;
  let tears = [];
  let lastSpawn = 0;
  let maskBox = { x: 0, y: 0, w: 0, h: 0 };

  p.loadImage(maskPath, img => {
    maskImg = img;
  });

  function computeMaskBox() {
    if (!maskImg) {
      maskBox = { x: p.width / 2, y: p.height / 2, w: p.width * 0.6, h: p.height * 0.6 };
      return;
    }
    const targetW = Math.min(p.width * 0.7, p.height * 0.85);
    const ratio = maskImg.height / maskImg.width;
    const w = targetW;
    const h = w * ratio;
    maskBox = { x: p.width / 2, y: p.height * 0.52, w, h };
  }

  function tearOrigins() {
    const { x, y, w, h } = maskBox;
    const eyeOffsetY = -h * 0.08;
    const leftX = x - w * 0.14;
    const rightX = x + w * 0.16;
    return [
      { x: leftX, y: y + eyeOffsetY },
      { x: rightX, y: y + eyeOffsetY }
    ];
  }

  function spawnTears(count = 1, multiplier = 1) {
    const origins = tearOrigins();
    for (let i = 0; i < count; i++) {
      const origin = origins[i % origins.length];
      tears.push(new TearDrop(p, origin, multiplier));
    }
  }

  function updateTears() {
    const now = p.millis();
    const interval = 260 / Math.max(0.3, speedMultiplier);
    if (now - lastSpawn > interval) {
      spawnTears(2, speedMultiplier);
      lastSpawn = now;
    }
    for (let i = tears.length - 1; i >= 0; i--) {
      const tear = tears[i];
      const alive = tear.update(speedMultiplier);
      if (!alive) {
        tears.splice(i, 1);
      }
    }
  }

  return {
    id: 'facemask',
    name: 'Masque en larmes',
    description: 'Un masque figé avec des larmes lentes et un fond onirique',
    enter() {
      computeMaskBox();
      tears = [];
      spawnTears(8);
      lastSpawn = p.millis();
    },
    resize() {
      computeMaskBox();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      spawnTears(6, Math.max(1.2, speedMultiplier * 1.4));
    },
    draw() {
      computeMaskBox();
      drawGradientBackground(p);
      drawRibbons(p);

      updateTears();
      tears.forEach(t => t.draw());

      if (maskImg) {
        p.imageMode(p.CENTER);
        p.push();
        p.translate(maskBox.x, maskBox.y);
        const sway = p.sin(p.frameCount * 0.01) * 3;
        p.rotate(p.radians(sway * 0.05));
        p.image(maskImg, 0, 0, maskBox.w, maskBox.h);
        p.pop();
      } else {
        p.noStroke();
        p.fill(255, 255, 255, 18);
        p.rectMode(p.CENTER);
        p.rect(maskBox.x, maskBox.y, maskBox.w * 0.9, maskBox.h * 0.65, 28);
      }

      p.noStroke();
      p.fill(12, 20, 36, 180);
      p.rect(0, p.height * 0.92, p.width, p.height * 0.1);
    }
  };
}
