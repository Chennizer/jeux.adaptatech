const TWO_PI = Math.PI * 2;

class SunGlyph {
  constructor(p) {
    this.p = p;
    this.rays = [];
    this.haloBuffer = null;
    this.rotation = 0;
    this.basePulse = 1;
    this.computeSizes();
    this.buildHalo();
    this.resetRays();
  }

  computeSizes() {
    const { p } = this;
    const base = Math.min(p.width, p.height) * 0.15;
    this.sunRadius = base;
    this.innerR = base * 1.2;
    this.longLen = base * 2.2;
    this.shortLen = base * 2;
    this.strokeW = base * 0.08;
    this.cx = p.width / 2;
    this.cy = p.height * 0.3;
  }

  buildHalo() {
    const { p } = this;
    const size = Math.floor(Math.min(p.width, p.height) * 0.6);
    const g = p.createGraphics(size, size);
    g.noStroke();
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2;
    for (let i = 0; i < 80; i += 1) {
      const t = i / 79;
      const alpha = 80 * (1 - t) * (1 - t);
      g.fill(255, 220, 120, alpha);
      const r = maxR * t;
      g.ellipse(cx, cy, r * 2, r * 2);
    }
    this.haloBuffer = g;
  }

  resetRays() {
    const { p } = this;
    this.rays = Array.from({ length: 8 }, (_, i) => ({
      angle: (i * TWO_PI) / 8,
      currLen: this.innerR,
      targetLen: i % 2 ? this.shortLen : this.longLen,
      alpha: 255,
      seed: p.random(10000)
    }));
  }

  resize() {
    this.computeSizes();
    this.buildHalo();
    this.resetRays();
  }

  draw() {
    const { p } = this;
    this.basePulse = 1 + 0.05 * p.sin(p.frameCount * 0.03);
    this.rotation += 0.003;

    const breathe = 0.995 + 0.01 * p.sin(p.frameCount * 0.02);
    const tightness = 2.2;
    const s = (this.sunRadius * tightness) / (this.haloBuffer.width / 2);
    const haloScale = s * breathe;

    p.push();
    p.translate(this.cx, this.cy);
    p.scale(haloScale);
    p.imageMode(p.CENTER);
    p.image(this.haloBuffer, 0, 0);
    p.pop();

    p.noStroke();
    p.push();
    p.translate(this.cx, this.cy);
    p.rotate(this.rotation);
    p.scale(this.basePulse);
    p.fill(255, 180, 50);
    p.ellipse(0, 0, this.sunRadius * 2, this.sunRadius * 2);

    p.stroke(255, 210, 100);
    p.strokeWeight(this.strokeW);
    for (const r of this.rays) {
      const n1 = p.noise(r.seed, p.frameCount * 0.01);
      const n2 = p.noise(r.seed + 1000, p.frameCount * 0.015);
      const angOff = p.radians(-3 + 6 * n1);
      const lenJit = -3 + 6 * n2;
      const a = r.angle + angOff;
      const tgt = r.targetLen + lenJit;

      r.currLen = p.lerp(r.currLen, tgt, 0.06);
      r.alpha = p.lerp(r.alpha, 255, 0.12);
      p.stroke(255, 210, 100, r.alpha);
      p.line(
        this.innerR * Math.cos(a),
        this.innerR * Math.sin(a),
        r.currLen * Math.cos(a),
        r.currLen * Math.sin(a)
      );
    }
    p.pop();

    p.push();
    p.translate(this.cx, this.cy);
    p.noStroke();
    p.fill(255, 200, 90);
    p.ellipse(0, 0, this.sunRadius * 1.6, this.sunRadius * 1.6);
    p.fill(255, 230, 160, 200);
    p.ellipse(0, 0, this.sunRadius * 1.2, this.sunRadius * 1.2);
    p.pop();
  }
}

export function createSummerScene(p) {
  const palette = {
    skyGradient: [
      [34, 62, 110],
      [82, 116, 168],
      [146, 176, 204],
      [212, 214, 214]
    ],
    waterGradient: [
      { r: 18, g: 102, b: 146 },
      { r: 44, g: 146, b: 176 },
      { r: 66, g: 188, b: 184 },
      { r: 140, g: 216, b: 214 }
    ],
    sand: [224, 199, 160],
    foam: [255, 245, 225]
  };

  let time = 0;
  let speedMultiplier = 1;
  let sunGlyph;

  function resize() {
    sunGlyph = new SunGlyph(p);
    sunGlyph.resize();
  }

  function drawSky() {
    const skyHeight = p.height * 0.45;
    const ctx = p.drawingContext;
    const grad = ctx.createLinearGradient(0, 0, 0, skyHeight);
    grad.addColorStop(0, `rgba(${palette.skyGradient[0][0]}, ${palette.skyGradient[0][1]}, ${palette.skyGradient[0][2]}, 1)`);
    grad.addColorStop(0.35, `rgba(${palette.skyGradient[1][0]}, ${palette.skyGradient[1][1]}, ${palette.skyGradient[1][2]}, 1)`);
    grad.addColorStop(0.7, `rgba(${palette.skyGradient[2][0]}, ${palette.skyGradient[2][1]}, ${palette.skyGradient[2][2]}, 1)`);
    grad.addColorStop(1, `rgba(${palette.skyGradient[3][0]}, ${palette.skyGradient[3][1]}, ${palette.skyGradient[3][2]}, 1)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, p.width, skyHeight);

    sunGlyph.draw();
  }

  function drawShore() {
    const skyHeight = p.height * 0.45;
    const waterTop = skyHeight;
    const shorelineBase = p.height * 0.62;
    const shorelineAmplitude = 26;
    const shorelineFrequency = (p.TWO_PI / p.width) * 1.1;
    const verticalSwell = p.sin(time * 0.00075) * 22;

    const segments = 160;
    const baseShoreline = [];
    for (let i = 0; i <= segments; i += 1) {
      const x = (i / segments) * p.width;
      const sine = p.sin(x * shorelineFrequency);
      baseShoreline[i] = shorelineBase + sine * shorelineAmplitude;
    }

    const shorelineY = baseShoreline.map(y => y + verticalSwell);
    const maxShoreline = Math.max(...shorelineY);

    const ctx = p.drawingContext;
    const waterGradient = ctx.createLinearGradient(0, waterTop, 0, maxShoreline);
    waterGradient.addColorStop(0, `rgba(${palette.waterGradient[0].r}, ${palette.waterGradient[0].g}, ${palette.waterGradient[0].b}, 1)`);
    waterGradient.addColorStop(0.42, `rgba(${palette.waterGradient[1].r}, ${palette.waterGradient[1].g}, ${palette.waterGradient[1].b}, 1)`);
    waterGradient.addColorStop(0.7, `rgba(${palette.waterGradient[2].r}, ${palette.waterGradient[2].g}, ${palette.waterGradient[2].b}, 1)`);
    waterGradient.addColorStop(1, `rgba(${palette.waterGradient[3].r}, ${palette.waterGradient[3].g}, ${palette.waterGradient[3].b}, 1)`);
    ctx.fillStyle = waterGradient;
    ctx.beginPath();
    ctx.moveTo(0, waterTop);
    ctx.lineTo(p.width, waterTop);
    for (let i = segments; i >= 0; i -= 1) {
      const x = (i / segments) * p.width;
      const y = Math.max(waterTop, shorelineY[i]);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    p.noStroke();
    p.fill(...palette.sand);
    p.beginShape();
    for (let i = 0; i <= segments; i += 1) {
      const x = (i / segments) * p.width;
      p.vertex(x, shorelineY[i]);
    }
    p.vertex(p.width, p.height);
    p.vertex(0, p.height);
    p.endShape(p.CLOSE);

    p.noStroke();
    p.fill(170, 218, 230, 165);
    p.beginShape();
    p.vertex(0, waterTop);
    for (let i = 0; i <= segments; i += 1) {
      const x = (i / segments) * p.width;
      p.vertex(x, shorelineY[i]);
    }
    p.vertex(p.width, shorelineY[segments]);
    p.vertex(p.width, waterTop);
    p.endShape(p.CLOSE);

    p.stroke(...palette.foam, 200);
    p.strokeWeight(1.4);
    p.noFill();
    p.beginShape();
    for (let i = 0; i <= segments; i += 1) {
      const x = (i / segments) * p.width;
      p.vertex(x, shorelineY[i] - 1.5);
    }
    p.endShape();
  }

  return {
    id: 'summer',
    name: 'Été',
    description: 'Rivage solaire et chaleur marine',
    resize,
    enter() {
      time = 0;
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {},
    draw() {
      time += 16 * speedMultiplier;
      drawSky();
      drawShore();
    }
  };
}
