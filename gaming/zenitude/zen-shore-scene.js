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
      new Wave(p, 18, 0.0008, 120, 0),
      new Wave(p, 12, 0.0012, 180, p.PI / 3),
      new Wave(p, 8, 0.0018, 240, p.PI / 6)
    ];
    foamOffsets = Array.from({ length: 160 }, () => ({
      x: p.random(p.width),
      y: p.random(-12, 12),
      size: p.random(14, 28),
      alpha: p.random(80, 150)
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
      time += 16 * speedMultiplier;
      sparklePhase = p.max(0, sparklePhase - 0.008 * speedMultiplier);

      const gradientSteps = 200;
      for (let i = 0; i < gradientSteps; i++) {
        const t = i / (gradientSteps - 1);
        const r = p.lerp(6, 16, t);
        const g = p.lerp(24, 44, t);
        const b = p.lerp(42, 82, t);
        p.noStroke();
        p.fill(r, g, b);
        p.rect(0, t * p.height, p.width, p.height / gradientSteps + 1);
      }

      const shoreLine = p.height * 0.7;
      const sandHeight = p.height * 0.3;
      for (let i = 0; i < sandHeight; i += 2) {
        const t = i / sandHeight;
        p.noStroke();
        p.fill(214, 200, 168, p.lerp(180, 60, t));
        p.rect(0, shoreLine + i, p.width, 2);
      }

      p.noStroke();
      const segments = 200;
      const amplitudeScale = p.lerp(0.9, 1.3, sparklePhase);
      const waveY = [];
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        const y = waves.reduce((sum, wave) => sum + wave.sample(x, time), 0) * amplitudeScale;
        waveY[i] = y;
      }

      p.fill(32, 120, 150, 220);
      p.beginShape();
      p.vertex(0, shoreLine);
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        p.vertex(x, shoreLine + waveY[i]);
      }
      p.vertex(p.width, shoreLine + sandHeight);
      p.vertex(0, shoreLine + sandHeight);
      p.endShape(p.CLOSE);

      p.fill(180, 230, 240, 180);
      p.beginShape();
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        p.vertex(x, shoreLine + waveY[i] * 0.6);
      }
      p.vertex(p.width, shoreLine + sandHeight);
      p.vertex(0, shoreLine + sandHeight);
      p.endShape(p.CLOSE);

      foamOffsets.forEach(foam => {
        const foamY = shoreLine + foam.y + waves[0].sample(foam.x, time) * 0.6;
        p.fill(255, 255, 255, foam.alpha);
        p.ellipse(foam.x, foamY, foam.size, foam.size * 0.6);
      });

      p.noStroke();
      p.fill(255, 255, 255, 40 + sparklePhase * 40);
      const sparkleCount = Math.floor(60 + sparklePhase * 50);
      for (let i = 0; i < sparkleCount; i++) {
        const x = p.random(p.width);
        const y = shoreLine + p.random(-40, 10);
        const size = p.random(2, 5);
        p.ellipse(x, y, size, size);
      }
    }
  };
}
