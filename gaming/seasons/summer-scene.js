const TWO_PI = Math.PI * 2;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

class SunGlyph {
  constructor(p) {
    this.p = p;
    this.rays = Array.from({ length: 8 }, (_, i) => ({
      angle: (i * TWO_PI) / 8,
      currLen: 0,
      targetLen: 0,
      alpha: 0,
      seed: p.random(10000)
    }));
    this.basePulse = 1;
    this.sunRot = 0;
    this.haloBuffer = null;
    this.resize(p.width, p.height);
  }

  resize(width, height) {
    const base = Math.min(width, height) * 0.12;
    this.sunRadius = base;
    this.innerR = base * 1.2;
    this.longLen = base * 2.2;
    this.shortLen = base * 2;
    this.strokeW = base * 0.08;
    this.cx = width * 0.82;
    this.cy = height * 0.28;
    this.buildHaloBuffer();
    this.rays.forEach((ray, i) => {
      ray.currLen = this.innerR;
      ray.targetLen = i % 2 ? this.shortLen : this.longLen;
      ray.alpha = 0;
    });
  }

  buildHaloBuffer() {
    const p = this.p;
    const sz = Math.floor(Math.min(p.width, p.height) * 0.5);
    this.haloBuffer = p.createGraphics(sz, sz);
    const g = this.haloBuffer;
    g.noStroke();
    const cx = sz / 2;
    const cy = sz / 2;
    const maxR = sz / 2;
    for (let i = 0; i < 80; i += 1) {
      const t = i / 79;
      const alpha = 80 * (1 - t) * (1 - t);
      // Slightly warm halo
      g.fill(255, 220, 120, alpha);
      const r = maxR * t;
      g.ellipse(cx, cy, r * 2, r * 2);
    }
  }

  draw(scale = 1) {
    const p = this.p;
    this.basePulse = 1 + 0.05 * p.sin(p.frameCount * 0.03);
    this.sunRot += 0.003;

    const breathe = 0.995 + 0.01 * p.sin(p.frameCount * 0.02);
    const tightness = 2.2;
    const s = (this.sunRadius * tightness) / (this.haloBuffer.width / 2);
    const haloScale = s * breathe;

    p.push();
    p.translate(this.cx, this.cy);
    p.scale(scale);
    p.imageMode(p.CENTER);
    p.push();
    p.scale(haloScale);
    p.image(this.haloBuffer, 0, 0);
    p.pop();

    p.rotate(this.sunRot);
    p.scale(this.basePulse);
    p.noStroke();
    p.fill(255, 180, 50);
    p.ellipse(0, 0, this.sunRadius * 2, this.sunRadius * 2);

    p.stroke(255, 210, 100);
    p.strokeWeight(this.strokeW);
    for (const ray of this.rays) {
      const n1 = p.noise(ray.seed, p.frameCount * 0.01);
      const n2 = p.noise(ray.seed + 1000, p.frameCount * 0.015);
      const angOff = p.radians(-3 + 6 * n1);
      const lenJit = -3 + 6 * n2;
      const angle = ray.angle + angOff;
      const target = ray.targetLen + lenJit;

      ray.currLen = lerp(ray.currLen, target, 0.06);
      ray.alpha = lerp(ray.alpha, 255, 0.12);
      p.stroke(255, 210, 100, ray.alpha);
      p.line(
        this.innerR * Math.cos(angle),
        this.innerR * Math.sin(angle),
        ray.currLen * Math.cos(angle),
        ray.currLen * Math.sin(angle)
      );
    }
    p.pop();
  }
}

export function createSummerScene(p) {
  let time = 0;
  let speedMultiplier = 1;
  let sunGlyph;
  let contemplativeMode = false;
  let neutralFrames = 0;
  let sunScale = 1;
  let sunFlash = 0;
  let sunPulse = null;

  // Contemplative sun pulse parameters
  const SUN_BASE_SCALE = 0.7;         // bigger base than before
  const SUN_MAX_SCALE = 1.4;          // larger maximum size for a more impressive pulse
  const SUN_GROW_DURATION = 3200;     // slower grow
  const SUN_SHRINK_DURATION = 3200;   // slower shrink
  const SUN_FLASH_DURATION = 1200;    // slower flash

  function resize() {
    sunGlyph = new SunGlyph(p);
    sunGlyph.resize(p.width, p.height);
  }

  function drawSky() {
    const ctx = p.drawingContext;
    const skyHeight = p.height * 0.55;
    const skyGradient = ctx.createLinearGradient(0, 0, 0, skyHeight);
    skyGradient.addColorStop(0, 'rgba(34, 62, 110, 1)');
    skyGradient.addColorStop(0.35, 'rgba(82, 116, 168, 1)');
    skyGradient.addColorStop(0.7, 'rgba(146, 176, 204, 1)');
    skyGradient.addColorStop(1, 'rgba(212, 214, 214, 1)');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, p.width, skyHeight);

    sunGlyph.draw(sunScale);
  }

  function drawShore() {
    const skyHeight = p.height * 0.55;
    const waterTop = skyHeight;
    const ctx = p.drawingContext;

    const shorelineBase = p.height * 0.7;
    const shorelineAmplitude = 22;
    const shorelineFrequency = (p.TWO_PI / p.width) * 1.1;
    const verticalSwell = p.sin(time * 0.00075) * 18;

    const segments = 120;
    const baseShoreline = [];
    for (let i = 0; i <= segments; i += 1) {
      const x = (i / segments) * p.width;
      const sine = p.sin(x * shorelineFrequency);
      baseShoreline[i] = shorelineBase + sine * shorelineAmplitude;
    }

    const shorelineY = baseShoreline.map(y => y + verticalSwell);
    const maxShoreline = Math.max(...shorelineY);

    const deepWaterColor = { r: 18, g: 102, b: 146 };
    const midWaterColor = { r: 44, g: 146, b: 176 };
    const lagoonColor = { r: 66, g: 188, b: 184 };
    const shoreWaterColor = { r: 140, g: 216, b: 214 };
    const waterGradient = ctx.createLinearGradient(0, waterTop, 0, maxShoreline);
    waterGradient.addColorStop(0, `rgba(${deepWaterColor.r}, ${deepWaterColor.g}, ${deepWaterColor.b}, 1)`);
    waterGradient.addColorStop(0.42, `rgba(${midWaterColor.r}, ${midWaterColor.g}, ${midWaterColor.b}, 1)`);
    waterGradient.addColorStop(0.7, `rgba(${lagoonColor.r}, ${lagoonColor.g}, ${lagoonColor.b}, 1)`);
    waterGradient.addColorStop(1, `rgba(${shoreWaterColor.r}, ${shoreWaterColor.g}, ${shoreWaterColor.b}, 1)`);

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
    p.fill(224, 199, 160);
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

    p.stroke(255, 245, 225, 200);
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
    description: 'Grand soleil sur rivage paisible',
    resize,
    enter() {
      time = 0;
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
      if (multiplier < 0.95) {
        contemplativeMode = true;
        neutralFrames = 0;
      } else if (multiplier >= 0.95 && multiplier <= 1.05) {
        neutralFrames += 1;
        if (neutralFrames > 20) {
          contemplativeMode = false;
        }
      } else {
        neutralFrames = 0;
      }

      if (!contemplativeMode) {
        sunScale = 1;
        sunFlash = 0;
        sunPulse = null;
      }
    },
    pulse() {
      if (contemplativeMode) {
        sunPulse = { start: p.millis() };
        sunFlash = 0;
      }
    },
    draw() {
      if (contemplativeMode) {
        const now = p.millis();
        if (sunPulse) {
          const elapsed = now - sunPulse.start;

          if (elapsed < SUN_GROW_DURATION) {
            // Slow, big growth
            sunScale = p.map(
              elapsed,
              0,
              SUN_GROW_DURATION,
              SUN_BASE_SCALE,
              SUN_MAX_SCALE,
              true
            );
            sunFlash = 0;
          } else if (elapsed < SUN_GROW_DURATION + SUN_FLASH_DURATION) {
            // Hold at max size, slow warm flash
            sunScale = SUN_MAX_SCALE;
            const t = (elapsed - SUN_GROW_DURATION) / SUN_FLASH_DURATION;
            sunFlash = 1 - p.constrain(t, 0, 1);
          } else if (elapsed < SUN_GROW_DURATION + SUN_FLASH_DURATION + SUN_SHRINK_DURATION) {
            // Slow shrink back down
            const t = (elapsed - SUN_GROW_DURATION - SUN_FLASH_DURATION) / SUN_SHRINK_DURATION;
            sunScale = p.map(
              t,
              0,
              1,
              SUN_MAX_SCALE,
              SUN_BASE_SCALE,
              true
            );
            sunFlash = 0;
          } else {
            sunPulse = null;
            sunScale = SUN_BASE_SCALE;
            sunFlash = 0;
          }
        } else {
          sunScale = SUN_BASE_SCALE;
          sunFlash = 0;
        }
      } else {
        sunScale = 1;
        sunFlash = 0;
      }

      time += 16 * speedMultiplier;
      drawSky();
      drawShore();

      if (sunFlash > 0.001) {
        p.noStroke();
        // Warmer, slower light flash
        p.fill(255, 215, 160, 220 * sunFlash);
        p.rect(0, 0, p.width, p.height);
      }
    }
  };
}
