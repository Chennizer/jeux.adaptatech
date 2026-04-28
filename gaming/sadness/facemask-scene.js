const BACK_COLORS = [
  { y: 0, color: [14, 10, 26] },
  { y: 0.45, color: [32, 24, 52] },
  { y: 1, color: [6, 12, 20] }
];

class Tear {
  constructor(p, getEyePosition) {
    this.p = p;
    this.getEyePosition = getEyePosition;
    this.reset();
  }

  reset() {
    const p = this.p;
    const origin = this.getEyePosition();
    this.x = origin.x + p.random(-6, 6);
    this.y = origin.y + p.random(-4, 4);
    this.vy = p.random(1.3, 2.2);
    this.vxOffset = p.random(p.TWO_PI);
    this.wobble = p.random(0.35, 0.8);
    this.length = p.random(12, 22);
    this.alpha = p.random(130, 200);
    this.gloss = p.random(0.4, 0.9);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    const drift = Math.sin(this.vxOffset + p.frameCount * 0.03) * this.wobble;
    this.x += drift * speedMultiplier;
    this.y += this.vy * speedMultiplier;
    this.vy = Math.min(this.vy + 0.003 * speedMultiplier, 3.4);
    if (this.y - this.length > p.height) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.strokeWeight(2);
    p.stroke(160, 200, 235, this.alpha);
    p.line(this.x, this.y, this.x, this.y - this.length);
    p.stroke(200, 230, 255, this.alpha * 0.85);
    p.line(this.x + 1.5, this.y - this.length * 0.25, this.x + 1.5, this.y - this.length * 0.65);
    p.pop();
  }
}

class FloatingVeil {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height);
    this.radius = p.random(90, 180);
    this.speed = p.random(0.08, 0.18);
    this.alpha = p.random(18, 32);
    this.hue = p.random([180, 200, 220, 260]);
    this.offset = p.random(p.TWO_PI);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    this.y -= this.speed * speedMultiplier * 0.6;
    this.x += Math.sin(this.offset + p.frameCount * 0.005) * 0.2 * speedMultiplier;
    if (this.y + this.radius < 0) {
      this.y = p.height + this.radius;
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    const gradient = p.drawingContext.createRadialGradient(
      this.x, this.y, this.radius * 0.05,
      this.x, this.y, this.radius
    );
    gradient.addColorStop(0, `rgba(${this.hue}, ${this.hue - 40}, 255, ${this.alpha / 255})`);
    gradient.addColorStop(1, 'rgba(10, 16, 24, 0)');
    p.drawingContext.save();
    p.drawingContext.fillStyle = gradient;
    p.beginShape();
    for (let a = 0; a < p.TWO_PI; a += p.TWO_PI / 48) {
      const r = this.radius * (0.75 + 0.25 * Math.sin(a * 3 + this.offset));
      p.vertex(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r);
    }
    p.endShape(p.CLOSE);
    p.drawingContext.restore();
  }
}

export function createFaceMaskScene(p) {
  let maskImage = null;
  let imageLoaded = false;
  let tears = [];
  let veils = [];
  let speedMultiplier = 1;

  const MAX_TEARS = 60;

  p.loadImage('../../images/facemask.png', img => {
    maskImage = img;
    imageLoaded = true;
  });

  function ensureVeils() {
    const desired = Math.max(6, Math.floor((p.width * p.height) * 0.000005));
    while (veils.length < desired) veils.push(new FloatingVeil(p));
    if (veils.length > desired) veils.length = desired;
  }

  function drawBackground() {
    const h = p.height;
    for (let i = 0; i < BACK_COLORS.length - 1; i++) {
      const a = BACK_COLORS[i];
      const b = BACK_COLORS[i + 1];
      const yStart = a.y * h;
      const yEnd = b.y * h;
      for (let y = yStart; y < yEnd; y++) {
        const t = (y - yStart) / Math.max(1, yEnd - yStart);
        const r = p.lerp(a.color[0], b.color[0], t);
        const g = p.lerp(a.color[1], b.color[1], t);
        const bl = p.lerp(a.color[2], b.color[2], t);
        p.stroke(r, g, bl);
        p.line(0, y, p.width, y);
      }
    }
  }

  function computeMaskMetrics() {
    const fallbackRatio = 1;
    const ratio = imageLoaded && maskImage ? maskImage.width / maskImage.height : fallbackRatio;
    const maxHeight = p.height * 0.7;
    const maxWidth = p.width * 0.8;
    let targetHeight = maxHeight;
    let targetWidth = targetHeight * ratio;
    if (targetWidth > maxWidth) {
      targetWidth = maxWidth;
      targetHeight = targetWidth / ratio;
    }
    const x = (p.width - targetWidth) / 2;
    const y = (p.height - targetHeight) / 2;
    return { x, y, width: targetWidth, height: targetHeight, ratio };
  }

  function getEyePositions() {
    const metrics = computeMaskMetrics();
    const centerX = metrics.x + metrics.width / 2;
    const centerY = metrics.y + metrics.height * 0.42;
    const eyeOffsetX = metrics.width * 0.16;
    const eyeOffsetY = metrics.height * -0.04;
    return [
      { x: centerX - eyeOffsetX, y: centerY + eyeOffsetY },
      { x: centerX + eyeOffsetX, y: centerY + eyeOffsetY }
    ];
  }

  function ensureTears() {
    const eyes = getEyePositions();
    const getEyePosition = () => eyes[Math.floor(Math.random() * eyes.length)];
    const desired = MAX_TEARS;
    while (tears.length < desired) tears.push(new Tear(p, getEyePosition));
    if (tears.length > desired) tears.length = desired;
  }

  function drawMask() {
    const metrics = computeMaskMetrics();
    if (imageLoaded && maskImage) {
      p.image(maskImage, metrics.x, metrics.y, metrics.width, metrics.height);
    } else {
      p.push();
      p.noStroke();
      p.fill(200, 220, 240, 80);
      p.rect(metrics.x, metrics.y + metrics.height * 0.3, metrics.width, metrics.height * 0.4, metrics.height * 0.1);
      p.fill(160, 180, 210, 100);
      p.rect(metrics.x + metrics.width * 0.18, metrics.y + metrics.height * 0.25, metrics.width * 0.64, metrics.height * 0.5, metrics.height * 0.12);
      p.pop();
    }
  }

  return {
    id: 'mask',
    name: 'Masque en larmes',
    description: 'Masque blanc et larmes lentes sur fond brumeux',
    enter() {
      ensureVeils();
      ensureTears();
    },
    resize() {
      ensureVeils();
      ensureTears();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      tears.push(new Tear(p, () => {
        const eyes = getEyePositions();
        return eyes[Math.floor(Math.random() * eyes.length)];
      }));
      if (tears.length > MAX_TEARS + 6) {
        tears.shift();
      }
    },
    draw() {
      drawBackground();
      ensureVeils();
      veils.forEach(v => v.update(speedMultiplier));
      veils.forEach(v => v.draw());

      drawMask();
      ensureTears();
      tears.forEach(t => t.update(speedMultiplier));
      tears.forEach(t => t.draw());

      p.noStroke();
      p.fill(8, 10, 18, 80);
      p.rect(0, 0, p.width, p.height);
    }
  };
}
