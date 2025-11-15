class MistLayer {
  constructor(p, index) {
    this.p = p;
    this.index = index;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.offset = p.random(1000);
    this.speed = p.random(0.0008, 0.0016);
    this.alpha = p.map(this.index, 0, 3, 40, 70);
    this.height = p.map(this.index, 0, 3, p.height * 0.55, p.height * 0.4);
  }

  draw(speedMultiplier = 1) {
    const p = this.p;
    const noiseScale = 0.0024;
    p.noStroke();
    p.fill(232, 244, 246, this.alpha);
    p.beginShape();
    p.vertex(0, p.height);
    for (let x = 0; x <= p.width; x += 12) {
      const noiseValue = p.noise(this.offset + x * noiseScale, p.frameCount * this.speed * speedMultiplier);
      const y = p.height * 0.35 + noiseValue * this.height;
      p.vertex(x, y);
    }
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);
  }
}

export function createMountainDawnScene(p) {
  const mistLayers = [];
  let sunPulse = 0;
  let speedMultiplier = 1;

  function drawSky() {
    const colors = [
      [8, 22, 54],
      [40, 74, 122],
      [234, 174, 139],
      [249, 216, 178]
    ];
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const scaled = t * (colors.length - 1);
      const idx = Math.floor(scaled);
      const frac = scaled - idx;
      const a = colors[idx];
      const b = colors[Math.min(colors.length - 1, idx + 1)];
      p.stroke(p.lerp(a[0], b[0], frac), p.lerp(a[1], b[1], frac), p.lerp(a[2], b[2], frac));
      p.line(0, y, p.width, y);
    }
  }

  function drawMountains() {
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const depth = i / (layers - 1);
      const base = p.height * p.lerp(0.8, 0.45, depth);
      const color = [
        p.lerp(20, 120, depth),
        p.lerp(37, 161, depth),
        p.lerp(54, 146, depth)
      ];
      p.noStroke();
      p.fill(color[0], color[1], color[2], p.lerp(220, 90, depth));
      p.beginShape();
      p.vertex(0, p.height);
      for (let x = 0; x <= p.width; x += 40) {
        const offset = p.noise(x * 0.005, i * 100 + p.frameCount * 0.0008) * 140;
        p.vertex(x, base - offset);
      }
      p.vertex(p.width, p.height);
      p.endShape(p.CLOSE);
    }
  }

  function ensureMist() {
    if (!mistLayers.length) {
      for (let i = 0; i < 4; i++) {
        mistLayers.push(new MistLayer(p, i));
      }
    }
  }

  return {
    id: 'mountain-dawn',
    name: 'Aube montagneuse',
    description: 'Sommets immobiles et brume pastel',
    enter() {
      sunPulse = 1;
    },
    resize() {
      mistLayers.length = 0;
      ensureMist();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      sunPulse = 1;
    },
    draw() {
      ensureMist();
      drawSky();
      drawMountains();

      const sunX = p.width * 0.5;
      const sunY = p.height * 0.42;
      const baseRadius = p.height * 0.16;
      const pulseRadius = baseRadius * (1 + sunPulse * 0.25);

      const gradientSteps = 80;
      for (let i = gradientSteps; i >= 0; i--) {
        const t = i / gradientSteps;
        const r = p.lerp(255, 255, t);
        const g = p.lerp(224, 165, t);
        const b = p.lerp(160, 120, t);
        p.fill(r, g, b, p.lerp(6, 120, t));
        p.noStroke();
        p.ellipse(sunX, sunY, pulseRadius * 2 * t);
      }

      mistLayers.forEach(layer => layer.draw(speedMultiplier));

      if (sunPulse > 0.01) {
        p.noStroke();
        p.fill(255, 220, 150, sunPulse * 90);
        p.rect(0, 0, p.width, p.height);
        sunPulse = Math.max(0, sunPulse - 0.012 * speedMultiplier);
      }

      // birds silhouettes
      p.stroke(20, 40, 60, 140);
      p.strokeWeight(2);
      p.noFill();
      for (let i = 0; i < 4; i++) {
        const baseX = p.width * (0.2 + i * 0.18);
        const baseY = p.height * (0.28 + p.sin(p.frameCount * 0.004 + i) * 0.01);
        p.beginShape();
        for (let j = 0; j <= 6; j++) {
          const t = j / 6;
          const angle = p.PI * (t - 0.5);
          const radius = 16 + i * 2;
          p.vertex(baseX + p.cos(angle) * radius, baseY + p.sin(angle) * radius * 0.4);
        }
        p.endShape();
      }
    }
  };
}
