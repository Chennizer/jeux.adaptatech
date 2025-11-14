class Wave {
  constructor(p, amplitude, speed, wavelength, phase) {
    this.p = p;
    this.amplitude = amplitude;
    this.speed = speed;
    this.wavelength = wavelength;
    this.phase = phase;
  }

  sample(x, time) {
    const p = this.p;
    return this.amplitude * p.sin((x / this.wavelength) + time * this.speed + this.phase);
  }
}

export function createShoreScene(p) {
  let waves = [];
  let foamOffsets = [];
  let time = 0;
  let speedMultiplier = 1;
  let sparklePhase = 0;

  function rebuildWaves() {
    waves = [
      new Wave(p, 6, 0.00018, 220, 0),
      new Wave(p, 4, 0.00026, 340, p.PI / 3),
      new Wave(p, 3, 0.00034, 480, p.PI / 6)
    ];
    foamOffsets = Array.from({ length: 120 }, () => ({
      x: p.random(p.width),
      y: p.random(-16, 8),
      size: p.random(22, 36),
      alpha: p.random(70, 130)
    }));
  }

  return {
    id: 'shore',
    name: 'Rivage paisible',
    description: 'Vagues douces sur le sable',
    enter() {
      rebuildWaves();
      time = 0;
      sparklePhase = 0;
    },
    resize() {
      rebuildWaves();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      sparklePhase = 1;
    },
    draw() {
      time += 12 * speedMultiplier;
      sparklePhase = p.max(0, sparklePhase - 0.004 * speedMultiplier);

      const sandTop = p.height * 0.5;
      const sandHeight = p.height - sandTop;

      const waterSteps = 200;
      const waterHeight = sandTop + 40;
      p.noStroke();
      for (let i = 0; i < waterSteps; i++) {
        const t = i / (waterSteps - 1);
        const r = p.lerp(26, 60, t);
        const g = p.lerp(88, 146, t);
        const b = p.lerp(112, 176, t);
        p.fill(r, g, b);
        p.rect(0, (waterHeight / waterSteps) * i, p.width, waterHeight / waterSteps + 1);
      }

      const sandSteps = Math.max(1, Math.floor(sandHeight));
      for (let i = 0; i < sandSteps; i++) {
        const t = i / Math.max(1, sandSteps - 1);
        p.fill(216, 198, 158, p.lerp(210, 140, t));
        p.rect(0, sandTop + i, p.width, 1.2);
      }

      const shorelineBase = sandTop - 18;
      const segments = 240;
      const waveY = [];
      const amplitudeScale = p.lerp(0.85, 1.1, sparklePhase);
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        const slowDrift = p.sin((time * 0.00005) + x * 0.0003) * 4;
        const y = waves.reduce((sum, wave) => sum + wave.sample(x, time), 0) * amplitudeScale + slowDrift;
        waveY[i] = y;
      }

      p.fill(48, 138, 170, 220);
      p.beginShape();
      p.vertex(0, 0);
      p.vertex(0, shorelineBase + waveY[0]);
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        p.vertex(x, shorelineBase + waveY[i]);
      }
      p.vertex(p.width, 0);
      p.endShape(p.CLOSE);

      p.fill(200, 234, 240, 160);
      p.beginShape();
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        p.vertex(x, shorelineBase + waveY[i] * 0.6 + 10);
      }
      p.vertex(p.width, shorelineBase + sandHeight + 40);
      p.vertex(0, shorelineBase + sandHeight + 40);
      p.endShape(p.CLOSE);

      foamOffsets.forEach(foam => {
        const foamY = shorelineBase + foam.y + waves[0].sample(foam.x, time) * 0.4;
        p.fill(255, 255, 255, foam.alpha);
        p.ellipse(foam.x, foamY, foam.size, foam.size * 0.5);
      });

      p.noStroke();
      p.fill(255, 255, 255, 30 + sparklePhase * 30);
      const sparkleCount = Math.floor(30 + sparklePhase * 30);
      for (let i = 0; i < sparkleCount; i++) {
        const x = p.random(p.width);
        const y = shorelineBase + p.random(-26, 12);
        const size = p.random(1.5, 3.5);
        p.ellipse(x, y, size, size);
      }
    }
  };
}
