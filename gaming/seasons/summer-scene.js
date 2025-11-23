const TWO_PI = Math.PI * 2;

class SunGlyph {
  constructor(p) {
    this.p = p;
    this.phase = p.random(TWO_PI);
    this.flash = 0;
    this.resize(p.width, p.height);
  }

  resize(width, height) {
    this.radius = Math.min(width, height) * 0.18;
    this.x = width * 0.55;
    this.y = height * 0.18;
  }

  pulse() {
    this.flash = 1;
  }

  draw(intensity) {
    const p = this.p;
    this.phase += 0.01 + intensity * 0.02;
    this.flash = p.lerp(this.flash, 0, 0.05);

    const pulse = (Math.sin(this.phase) + 1) * 0.5;
    const glow = p.lerp(0.9, 1.2, pulse) + this.flash * 0.35;
    const baseRadius = this.radius * glow;

    p.push();
    p.translate(this.x, this.y);
    p.noStroke();
    p.blendMode(p.SCREEN);

    const haloColors = [
      p.color(255, 240, 210, 180),
      p.color(255, 220, 180, 120),
      p.color(255, 200, 150, 80)
    ];

    haloColors.forEach((col, i) => {
      const r = baseRadius * (1.1 + i * 0.24);
      const wobble = (p.noise(this.phase * 0.6 + i * 2) - 0.5) * 8 * (1 + intensity);
      p.fill(col);
      p.ellipse(0, wobble, r * 2.1, r * 1.95);
    });

    p.fill(255, 245, 225, 230);
    p.ellipse(0, 0, baseRadius * 1.6, baseRadius * 1.55);

    p.push();
    p.rotate(this.phase * 0.25);
    p.fill(255, 230, 170, 150);
    const rayCount = 24;
    for (let i = 0; i < rayCount; i += 1) {
      const angle = (TWO_PI / rayCount) * i;
      const rayLen = p.lerp(baseRadius * 0.8, baseRadius * 1.4, pulse) * (1 + this.flash * 0.4);
      const thickness = p.lerp(6, 10, pulse);
      p.push();
      p.rotate(angle);
      p.triangle(rayLen * 0.7, -thickness, rayLen * 1.05, 0, rayLen * 0.7, thickness);
      p.pop();
    }
    p.pop();

    p.pop();
    p.blendMode(p.BLEND);
  }
}

function drawSky(p, palette, skyHeight) {
  const ctx = p.drawingContext;
  const grad = ctx.createLinearGradient(0, 0, 0, skyHeight);
  grad.addColorStop(0, `rgba(${palette.skyTop.join(',')},1)`);
  grad.addColorStop(0.55, `rgba(${palette.skyMid.join(',')},1)`);
  grad.addColorStop(1, `rgba(${palette.skyHorizon.join(',')},1)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, p.width, skyHeight);
}

function drawWater(p, palette, time, skyHeight) {
  const ctx = p.drawingContext;
  const segments = 200;
  const shorelineBase = p.height * 0.7;
  const shorelineAmplitude = 22;
  const shorelineFrequency = (p.TWO_PI / p.width) * 1.05;
  const verticalSwell = p.sin(time * 0.0006) * 18;

  const shoreline = [];
  for (let i = 0; i <= segments; i += 1) {
    const x = (i / segments) * p.width;
    const sine = p.sin(x * shorelineFrequency + time * 0.0009);
    shoreline[i] = shorelineBase + sine * shorelineAmplitude + verticalSwell;
  }

  const maxShoreline = Math.max(...shoreline);
  const waterGrad = ctx.createLinearGradient(0, skyHeight, 0, maxShoreline);
  waterGrad.addColorStop(0, `rgba(${palette.waterDeep.join(',')},1)`);
  waterGrad.addColorStop(0.4, `rgba(${palette.waterMid.join(',')},1)`);
  waterGrad.addColorStop(0.75, `rgba(${palette.waterLagoon.join(',')},1)`);
  waterGrad.addColorStop(1, `rgba(${palette.waterShore.join(',')},1)`);

  ctx.fillStyle = waterGrad;
  ctx.beginPath();
  ctx.moveTo(0, skyHeight);
  ctx.lineTo(p.width, skyHeight);
  for (let i = segments; i >= 0; i -= 1) {
    const x = (i / segments) * p.width;
    const y = Math.max(skyHeight, shoreline[i]);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  p.noStroke();
  p.fill(...palette.sand, 245);
  p.beginShape();
  for (let i = 0; i <= segments; i += 1) {
    const x = (i / segments) * p.width;
    p.vertex(x, shoreline[i]);
  }
  p.vertex(p.width, p.height);
  p.vertex(0, p.height);
  p.endShape(p.CLOSE);

  p.noStroke();
  p.fill(palette.tideGlass[0], palette.tideGlass[1], palette.tideGlass[2], 160);
  p.beginShape();
  p.vertex(0, skyHeight);
  for (let i = 0; i <= segments; i += 1) {
    const x = (i / segments) * p.width;
    p.vertex(x, shoreline[i]);
  }
  p.vertex(p.width, shoreline[segments]);
  p.vertex(p.width, skyHeight);
  p.endShape(p.CLOSE);

  p.stroke(255, 245, 230, 200);
  p.strokeWeight(1.6);
  p.noFill();
  p.beginShape();
  for (let i = 0; i <= segments; i += 1) {
    const x = (i / segments) * p.width;
    p.vertex(x, shoreline[i] - 2);
  }
  p.endShape();

  return shoreline;
}

export function createSummerScene(p) {
  const palette = {
    skyTop: [52, 100, 168],
    skyMid: [110, 160, 208],
    skyHorizon: [226, 206, 182],
    waterDeep: [24, 106, 154],
    waterMid: [52, 148, 186],
    waterLagoon: [84, 190, 188],
    waterShore: [148, 216, 212],
    sand: [224, 199, 160],
    tideGlass: [170, 218, 230]
  };

  let time = 0;
  let speedMultiplier = 1;
  let sun;
  let skyHeight;

  function resize() {
    skyHeight = p.height * 0.7;
    if (sun) {
      sun.resize(p.width, p.height);
    } else {
      sun = new SunGlyph(p);
    }
  }

  return {
    id: 'summer',
    name: 'Été',
    description: 'Horizon de plage et soleil vibrant',
    resize,
    enter() {
      time = 0;
      resize();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      sun?.pulse();
    },
    draw() {
      const intensity = p.constrain(1.05 - speedMultiplier * 0.6, 0, 1);
      time += 16 * speedMultiplier;

      drawSky(p, palette, skyHeight);
      sun.draw(intensity);
      drawWater(p, palette, time, skyHeight);
    }
  };
}
