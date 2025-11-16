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
  let waveFronts = [];
  let wetness = [];
  let lastWaveStart = 0;
  let time = 0;
  let speedMultiplier = 1;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function rebuildWaves() {
    waves = [
      new Wave(p, 6, 0.00018, 220, 0),
      new Wave(p, 4, 0.00026, 340, p.PI / 3),
      new Wave(p, 3, 0.00034, 480, p.PI / 6)
    ];
    wetness = Array.from({ length: 241 }, () => 0);
    waveFronts = [];
    lastWaveStart = 0;
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
    pulse() {
    },
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

      p.noStroke();
      for (let y = sandTop; y < p.height; y += 3) {
        for (let x = 0; x < p.width; x += 4) {
          const grain = p.noise(x * 0.018, y * 0.02, time * 0.00008);
          if (grain > 0.55) {
            const alpha = p.map(grain, 0.55, 1, 12, 42, true);
            p.fill(200, 182, 145, alpha);
            p.rect(x, y, 2, 2);
          }
        }
      }

      p.stroke(196, 176, 138, 45);
      p.strokeWeight(1.2);
      for (let y = sandTop + 8; y < p.height; y += 22) {
        const undulation = p.noise(y * 0.012, time * 0.00009) * 24;
        p.beginShape();
        for (let x = 0; x <= p.width; x += 18) {
          const jitter = p.noise(x * 0.03, y * 0.02) * 8 - 4;
          p.vertex(x, y + undulation + jitter);
        }
        p.endShape();
      }

      const shorelineBase = sandTop - 10;
      const segments = 240;
      const shorelineY = [];
      const amplitudeScale = 1;
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        const slowDrift = p.sin((time * 0.00006) + x * 0.00018) * 18;
        const longSwell = p.sin(x * 0.001 + time * 0.00004) * 90;
        const largeCurves = p.noise(x * 0.00028, time * 0.00005) * 220 - 110;
        const mediumUndulation = p.noise(x * 0.0012, time * 0.00008) * 70 - 35;
        const fineRipples = p.noise(x * 0.0035, time * 0.0001) * 26 - 13;
        const y = shorelineBase + longSwell + largeCurves + mediumUndulation + fineRipples + slowDrift;
        shorelineY[i] = y + waves.reduce((sum, wave) => sum + wave.sample(x, time), 0) * amplitudeScale * 0.35;
      }

      wetness = wetness.map(w => w * 0.985);
      p.fill(200, 184, 150, 110);
      p.beginShape();
      p.vertex(0, shorelineY[0]);
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        const wetHeight = wetness[i] * 60 + 22;
        p.vertex(x, shorelineY[i] + wetHeight);
      }
      p.vertex(p.width, shorelineY[segments] + wetness[segments] * 60 + 40);
      p.vertex(0, shorelineY[0] + wetness[0] * 60 + 40);
      p.endShape(p.CLOSE);

      const now = time;
      const desiredInterval = 2000 / speedMultiplier;
      if (waveFronts.length === 0 || now - lastWaveStart > desiredInterval) {
        waveFronts.push({ start: now, duration: 6500 / speedMultiplier, foamSeed: p.random(1000) });
        lastWaveStart = now;
      }

      waveFronts = waveFronts.filter(front => {
        const progress = (now - front.start) / front.duration;
        if (progress > 1.05) return false;
        const eased = easeOutCubic(p.constrain(progress, 0, 1));
        const crestOffset = p.lerp(-150, 40, eased);
        const foamThickness = p.lerp(52, 16, eased);
        const waterAlpha = p.lerp(170, 30, eased);
        const foamAlpha = p.lerp(210, 70, eased);

        p.fill(90, 170, 210, waterAlpha);
        p.beginShape();
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * p.width;
          const crest = shorelineY[i] + crestOffset + p.sin(x * 0.008 + now * 0.0006) * 3 * (1 - eased);
          p.vertex(x, crest);
          wetness[i] = Math.min(1, Math.max(wetness[i], 0.85 - eased * 0.5));
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

        return true;
      });
    }
  };
}
