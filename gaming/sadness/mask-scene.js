const BACKGROUND_LAYERS = [
  { colors: [ [18, 16, 32, 220], [36, 28, 56, 140] ], scale: 0.0012, speed: 0.05 },
  { colors: [ [12, 22, 44, 180], [10, 12, 24, 160] ], scale: 0.0018, speed: 0.08 }
];

const TEAR_COLOR = [96, 169, 255];
const TEAR_BASE_RATE = 28; // milliseconds between drops per eye when multiplier is 1

class TearDrop {
  constructor(p, origin) {
    this.p = p;
    this.reset(origin);
  }

  reset(origin) {
    const p = this.p;
    this.x = origin.x + p.random(-4, 4);
    this.y = origin.y + p.random(-2, 2);
    this.len = p.random(12, 22);
    this.speed = p.random(1.4, 2.4);
    this.drift = p.random(-0.35, 0.35);
    this.alpha = p.random(140, 220);
    this.thickness = p.random(1.2, 2.6);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.y += this.speed * multiplier;
    this.x += this.drift * multiplier * 0.6;
    this.alpha *= 0.993;
    return this.alpha > 10 && this.y < p.height + this.len * 2;
  }

  draw() {
    const p = this.p;
    p.strokeWeight(this.thickness);
    p.stroke(TEAR_COLOR[0], TEAR_COLOR[1], TEAR_COLOR[2], this.alpha);
    p.line(this.x, this.y, this.x, this.y + this.len);
    p.noStroke();
    p.fill(TEAR_COLOR[0], TEAR_COLOR[1], TEAR_COLOR[2], this.alpha * 0.6);
    p.ellipse(this.x, this.y + this.len, this.thickness * 2.2, this.thickness * 1.6);
  }
}

export function createMaskScene(p) {
  let maskImg = null;
  let maskReady = false;
  const tearDrops = [];
  const backgroundSeeds = BACKGROUND_LAYERS.map(() => p.random(10_000));
  const eyeOrigins = [ { x: 0, y: 0 }, { x: 0, y: 0 } ];
  let renderSize = { w: 0, h: 0 };
  let speedMultiplier = 1;
  let lastSpawn = 0;

  p.loadImage('../../images/facemask.png', img => {
    maskImg = img;
    maskReady = true;
    updateLayout();
  });

  function updateLayout() {
    if (!maskReady || !maskImg) return;
    const targetWidth = p.width * 0.65;
    const targetHeight = p.height * 0.78;
    const scale = Math.min(targetWidth / maskImg.width, targetHeight / maskImg.height);
    renderSize = {
      w: maskImg.width * scale,
      h: maskImg.height * scale
    };
    const centerX = p.width / 2;
    const centerY = p.height / 2.1;
    const offsetX = renderSize.w * 0.22;
    const offsetY = renderSize.h * -0.02;
    eyeOrigins[0] = { x: centerX - offsetX, y: centerY + offsetY };
    eyeOrigins[1] = { x: centerX + offsetX, y: centerY + offsetY };
  }

  function drawBackground() {
    BACKGROUND_LAYERS.forEach((layer, idx) => {
      const seed = backgroundSeeds[idx];
      const scale = layer.scale;
      const t = p.frameCount * layer.speed * speedMultiplier;
      for (let y = 0; y < p.height; y += 3) {
        const n = p.noise(seed, y * scale, t * 0.005);
        const c0 = layer.colors[0];
        const c1 = layer.colors[1];
        const r = p.lerp(c0[0], c1[0], n);
        const g = p.lerp(c0[1], c1[1], n);
        const b = p.lerp(c0[2], c1[2], n);
        const a = p.lerp(c0[3], c1[3], n);
        p.stroke(r, g, b, a);
        p.line(0, y, p.width, y);
      }
    });

    p.noStroke();
    const gradientSteps = 8;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / (gradientSteps - 1);
      const alpha = p.lerp(60, 5, t);
      const radius = p.lerp(Math.max(p.width, p.height) * 0.2, Math.max(p.width, p.height) * 1.1, t);
      p.fill(40, 30, 80, alpha);
      p.ellipse(p.width / 2, p.height / 2, radius, radius * 0.9);
    }
  }

  function drawMask() {
    if (!maskReady || !maskImg) return;
    const x = p.width / 2 - renderSize.w / 2;
    const y = p.height / 2.1 - renderSize.h / 2;
    p.image(maskImg, x, y, renderSize.w, renderSize.h);
  }

  function spawnTears(now) {
    if (!maskReady) return;
    const interval = TEAR_BASE_RATE / Math.max(0.25, speedMultiplier);
    if (now - lastSpawn < interval) return;
    lastSpawn = now;
    eyeOrigins.forEach(origin => {
      tearDrops.push(new TearDrop(p, origin));
      if (p.random() < 0.22) {
        tearDrops.push(new TearDrop(p, origin));
      }
    });
  }

  function drawTears() {
    for (let i = tearDrops.length - 1; i >= 0; i -= 1) {
      const tear = tearDrops[i];
      const alive = tear.update(speedMultiplier);
      tear.draw();
      if (!alive) {
        tearDrops.splice(i, 1);
      }
    }
  }

  return {
    id: 'mask',
    name: 'Masque et larmes',
    description: 'Silence immobile, larmes lentes sur un visage masqué',
    enter() {
      tearDrops.length = 0;
      lastSpawn = 0;
    },
    resize() {
      updateLayout();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      // drop a small burst when the user interacts
      eyeOrigins.forEach(origin => tearDrops.push(new TearDrop(p, origin)));
    },
    draw() {
      const now = performance.now();
      drawBackground();
      drawMask();
      spawnTears(now);
      drawTears();
    }
  };
}
