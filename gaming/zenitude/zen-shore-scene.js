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
  let waveFronts = [];
  let lastWaveStart = 0;
  let time = 0;
  let speedMultiplier = 1;
  let shorelinePhase = 0;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

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
    waveFronts = [];
    lastWaveStart = 0;
    shorelinePhase = p.random(1000);
  }

  return {
    id: 'shore',
    name: 'Rivage paisible',
    description: 'Vagues douces sur le sable',
    enter() {
      rebuildWaves();
      time = 0;
    },
    resize() {
      rebuildWaves();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {},
    draw() {
      time += 12 * speedMultiplier;

      const sandTop = p.height * 0.55;
      const sandHeight = p.height - sandTop;

      const waterSteps = 200;
      const waterHeight = sandTop + 80;
      p.noStroke();
      for (let i = 0; i < waterSteps; i++) {
        const t = i / (waterSteps - 1);
        const r = p.lerp(28, 66, t);
        const g = p.lerp(120, 170, t);
        const b = p.lerp(168, 214, t);
        p.fill(r, g, b);
        p.rect(0, (waterHeight / waterSteps) * i, p.width, waterHeight / waterSteps + 1);
      }

      const sandSteps = Math.max(1, Math.floor(sandHeight));
      for (let i = 0; i < sandSteps; i++) {
        const t = i / Math.max(1, sandSteps - 1);
        p.fill(227, 205, 162, p.lerp(210, 150, t));
        p.rect(0, sandTop + i, p.width, 1.2);
      }

      const shorelineBase = sandTop - 10;
      const segments = 240;
      const shorelineY = [];
      const amplitudeScale = 1;
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        const macroCurve = p.sin(x * 0.0012 + shorelinePhase) * 42;
        const slowDrift = p.sin((time * 0.00004) + x * 0.00015) * 12;
        const irregularity = p.noise(x * 0.003, time * 0.00006) * 50 - 25;
        const y = shorelineBase + macroCurve + irregularity + slowDrift;
        shorelineY[i] = y + waves.reduce((sum, wave) => sum + wave.sample(x, time), 0) * amplitudeScale * 0.35;
      }

      const wetBand = 30;
      p.fill(214, 198, 160, 90);
      p.beginShape();
      p.vertex(0, shorelineY[0]);
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        p.vertex(x, shorelineY[i] + wetBand * 0.35);
      }
      p.vertex(p.width, shorelineY[segments] + wetBand);
      p.vertex(p.width, shorelineY[segments] + wetBand * 1.5);
      p.vertex(0, shorelineY[0] + wetBand * 1.5);
      p.endShape(p.CLOSE);

      const now = time;
      const desiredInterval = 2600 / speedMultiplier;
      if (waveFronts.length === 0 || now - lastWaveStart > desiredInterval) {
        waveFronts.push({ start: now, duration: 9000 / speedMultiplier, foamSeed: p.random(1000) });
        lastWaveStart = now;
      }

      waveFronts = waveFronts.filter(front => {
        const progress = (now - front.start) / front.duration;
        if (progress > 1.05) return false;
        const eased = easeOutCubic(p.constrain(progress, 0, 1));
        const crestOffset = p.lerp(-60, 32, eased);
        const foamThickness = p.lerp(46, 18, eased);
        const waterAlpha = p.lerp(160, 40, eased);
        const foamAlpha = p.lerp(200, 80, eased);

        p.fill(90, 170, 210, waterAlpha);
        p.beginShape();
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * p.width;
          const crest = shorelineY[i] + crestOffset + p.sin(x * 0.008 + now * 0.0006) * 3 * (1 - eased);
          p.vertex(x, crest);
        }
        p.vertex(p.width, shorelineY[segments] + crestOffset + foamThickness + 50);
        p.vertex(0, shorelineY[0] + crestOffset + foamThickness + 50);
        p.endShape(p.CLOSE);

        p.fill(255, 255, 255, foamAlpha);
        p.beginShape();
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * p.width;
          const wobble = p.noise(x * 0.012, front.foamSeed) * 10 - 5;
          const crest = shorelineY[i] + crestOffset + wobble;
          p.vertex(x, crest);
        }
        for (let i = segments; i >= 0; i--) {
          const x = (i / segments) * p.width;
          const wobble = p.noise(x * 0.015, front.foamSeed + 40) * 10 - 5;
          const crest = shorelineY[i] + crestOffset + foamThickness + wobble;
          p.vertex(x, crest);
        }
        p.endShape(p.CLOSE);

        foamOffsets.forEach(foam => {
          const foamY = shorelineY[Math.floor((foam.x / p.width) * segments)] + crestOffset + p.random(-4, 6);
          p.fill(255, 255, 255, foam.alpha * p.lerp(1, 0.4, eased));
          p.ellipse(foam.x, foamY, foam.size * 0.8, foam.size * 0.5);
        });

        return true;
      });
    }
  };
}
