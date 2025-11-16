const SKY_BANDS = [
  { start: 0, end: 0.35, from: [16, 28, 46], to: [46, 69, 109] },
  { start: 0.35, end: 0.7, from: [46, 69, 109], to: [78, 104, 141] },
  { start: 0.7, end: 1, from: [78, 104, 141], to: [116, 146, 173] }
];

const WATER_BANDS = [
  { start: 0, end: 0.4, from: [20, 52, 84], to: [26, 70, 101] },
  { start: 0.4, end: 0.75, from: [26, 70, 101], to: [18, 91, 120] },
  { start: 0.75, end: 1, from: [18, 91, 120], to: [10, 74, 104] }
];

function drawBandGradient(p, bands, yStart, yEnd) {
  p.push();
  p.noStroke();
  const height = Math.max(1, yEnd - yStart);
  const slices = 8;

  bands.forEach(({ start, end, from, to }) => {
    const bandTop = yStart + start * height;
    const bandBottom = yStart + end * height;
    const step = Math.max(1, (bandBottom - bandTop) / slices);
    for (let y = bandTop; y < bandBottom; y += step) {
      const t = p.map(y, bandTop, bandBottom, 0, 1, true);
      const r = p.lerp(from[0], to[0], t);
      const g = p.lerp(from[1], to[1], t);
      const b = p.lerp(from[2], to[2], t);
      p.fill(r, g, b);
      p.rect(0, y, p.width, step + 1);
    }
  });

  p.pop();
}

export function createZenShoreScene(p) {
  let speedMultiplier = 1;
  let phase = 0;
  let reflectionOffset = 0;
  let shorelineBase = 0;

  function resize() {
    shorelineBase = p.height * 0.62;
  }

  function drawSky() {
    drawBandGradient(p, SKY_BANDS, 0, p.height * 0.48);
  }

  function drawWater() {
    const waterTop = p.height * 0.48;
    drawBandGradient(p, WATER_BANDS, waterTop, p.height);
  }

  function getShorelinePoints() {
    const points = [];
    const amplitude = p.height * 0.03;
    const frequency = 0.008;
    const offset = p.height * 0.02 * p.sin(phase * 0.35);
    for (let x = -20; x <= p.width + 20; x += 14) {
      const wave = Math.sin((x * frequency) + phase) * amplitude;
      const y = shorelineBase + offset + wave;
      points.push({ x, y });
    }
    return points;
  }

  function drawSand(points) {
    const gradient = p.drawingContext.createLinearGradient(0, shorelineBase - 40, 0, p.height);
    gradient.addColorStop(0, 'rgba(234, 216, 180, 0.75)');
    gradient.addColorStop(1, 'rgba(208, 180, 138, 0.95)');

    p.push();
    p.drawingContext.fillStyle = gradient;
    p.noStroke();
    p.beginShape();
    p.vertex(0, p.height);
    p.vertex(p.width, p.height);
    for (let i = points.length - 1; i >= 0; i -= 1) {
      const pt = points[i];
      p.vertex(pt.x, pt.y);
    }
    p.endShape(p.CLOSE);
    p.pop();
  }

  function drawShoreHighlight(points) {
    p.push();
    p.noFill();
    p.stroke(255, 245, 226, 180);
    p.strokeWeight(1.5);
    p.beginShape();
    points.forEach(pt => {
      p.vertex(pt.x, pt.y - 1);
    });
    p.endShape();
    p.pop();
  }

  function drawSunReflection(waterTop) {
    const drift = Math.sin((phase * 0.22) + reflectionOffset) * p.width * 0.12;
    const x = p.width * 0.5 + drift;
    const y = p.lerp(waterTop, p.height, 0.32);
    const w = p.width * 0.22;
    const h = p.height * 0.06;

    p.push();
    p.noStroke();
    p.fill(255, 232, 180, 90);
    p.ellipse(x, y, w, h);
    p.fill(255, 244, 210, 70);
    p.ellipse(x, y + h * 0.06, w * 0.75, h * 0.8);
    p.pop();
  }

  return {
    id: 'zen-shore',
    name: 'Rivage zen',
    description: 'Dégradés larges et rivage sinueux avec reflets doux',
    enter() {
      phase = 0;
      reflectionOffset = p.random(0, p.TWO_PI);
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      phase += 0.3;
    },
    draw() {
      if (!shorelineBase) resize();
      phase += 0.01 * speedMultiplier;
      reflectionOffset += 0.005 * speedMultiplier;

      const waterTop = p.height * 0.48;
      drawSky();
      drawWater();

      const shoreline = getShorelinePoints();
      drawSand(shoreline);
      drawShoreHighlight(shoreline);
      drawSunReflection(waterTop);
    }
  };
}
