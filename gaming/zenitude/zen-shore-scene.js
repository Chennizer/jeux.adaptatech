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
  let shorelineOffsets = [];
  let time = 0;
  let speedMultiplier = 1;
  let sparklePhase = 0;
  const segments = 260;

  function rebuildWaves() {
    waves = [
      new Wave(p, 10, 0.00018, 210, 0),
      new Wave(p, 6, 0.00023, 330, p.PI / 3),
      new Wave(p, 4, 0.00031, 520, p.PI / 6)
    ];
    foamOffsets = Array.from({ length: 140 }, () => ({
      x: p.random(p.width),
      size: p.random(20, 34),
      alpha: p.random(60, 120)
    }));
    shorelineOffsets = Array.from({ length: segments + 1 }, (_, i) => {
      const t = i / segments;
      return p.noise(t * 3.2, 0.6);
    });
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
      const waterHeight = sandTop + 60;
      p.noStroke();
      for (let i = 0; i < waterSteps; i++) {
        const t = i / (waterSteps - 1);
        const r = p.lerp(26, 68, t);
        const g = p.lerp(88, 158, t);
        const b = p.lerp(112, 190, t);
        p.fill(r, g, b);
        p.rect(0, (waterHeight / waterSteps) * i, p.width, waterHeight / waterSteps + 1);
      }

      const sandSteps = Math.max(1, Math.floor(sandHeight));
      for (let i = 0; i < sandSteps; i++) {
        const t = i / Math.max(1, sandSteps - 1);
        p.fill(216, 198, 158, p.lerp(210, 140, t));
        p.rect(0, sandTop + i, p.width, 1.2);
      }

      const shorelineBase = sandTop - 12;
      const washCycle = (p.sin(time * 0.0003) + 1) * 0.5;
      const washReach = p.lerp(10, 42, washCycle);

      const waveY = [];
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        const irregular = p.map(shorelineOffsets[i], 0, 1, -26, 18);
        const slowDrift = p.sin((time * 0.00004) + x * 0.0015) * 6;
        const crest = waves.reduce((sum, wave) => sum + wave.sample(x, time), 0) * 0.9;
        waveY[i] = shorelineBase + irregular + slowDrift + crest - washReach;
      }

      p.fill(48, 138, 170, 220);
      p.beginShape();
      p.vertex(0, 0);
      p.vertex(0, waveY[0]);
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        p.vertex(x, waveY[i]);
      }
      p.vertex(p.width, 0);
      p.endShape(p.CLOSE);

      p.fill(200, 234, 240, 190);
      p.beginShape();
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        const foamLift = p.sin(time * 0.0012 + x * 0.009) * washCycle * 6;
        const foamY = waveY[i] + 12 + foamLift;
        p.vertex(x, foamY);
      }
      p.vertex(p.width, shorelineBase + sandHeight + 40);
      p.vertex(0, shorelineBase + sandHeight + 40);
      p.endShape(p.CLOSE);

      foamOffsets.forEach(foam => {
        const idx = Math.floor((foam.x / p.width) * segments);
        const baseY = waveY[idx] + 6;
        p.fill(255, 255, 255, foam.alpha * p.lerp(0.5, 1, washCycle));
        p.ellipse(foam.x, baseY + p.random(-6, 6), foam.size, foam.size * 0.55);
      });

      p.noStroke();
      p.fill(255, 255, 255, 30 + sparklePhase * 30);
      const sparkleCount = Math.floor(30 + sparklePhase * 30);
      for (let i = 0; i < sparkleCount; i++) {
        const x = p.random(p.width);
        const idx = Math.floor((x / p.width) * segments);
        const y = waveY[idx] + p.random(-22, 16);
        const size = p.random(1.5, 3.5);
        p.ellipse(x, y, size, size);
      }
    }
  };
}
