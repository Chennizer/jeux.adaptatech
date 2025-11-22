function createWavePoint(p, yBase) {
  return {
    amplitude: p.random(8, 22),
    wavelength: p.random(120, 280),
    phase: p.random(p.TWO_PI),
    speed: p.random(0.003, 0.008),
    yBase
  };
}

function createBubble(p, width, height) {
  return {
    x: p.random(width),
    y: height + p.random(60),
    radius: p.random(6, 16),
    speed: p.random(0.35, 0.95),
    drift: p.random(-0.35, 0.35),
    alpha: p.random(40, 120)
  };
}

export function createSummerScene(p) {
  let waves = [];
  let bubbles = [];
  let speedMultiplier = 1;
  let shimmer = 0;

  function resize() {
    waves = [
      createWavePoint(p, p.height * 0.65),
      createWavePoint(p, p.height * 0.7),
      createWavePoint(p, p.height * 0.75)
    ];
    bubbles = Array.from({ length: 40 }, () => createBubble(p, p.width, p.height));
  }

  function drawSky() {
    const top = p.color(252, 222, 164);
    const middle = p.color(112, 200, 220);
    const bottom = p.color(30, 70, 120);
    const steps = 48;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const color = p.lerpColor(top, p.lerpColor(middle, bottom, Math.pow(t, 1.2)), Math.pow(t, 0.85));
      p.stroke(color);
      const y = p.height * t;
      p.line(0, y, p.width, y);
    }
  }

  function drawSun() {
    const centerX = p.width * 0.5;
    const centerY = p.height * 0.32;
    const baseRadius = p.height * 0.15;
    const pulse = 1 + shimmer * 0.35;
    for (let i = 6; i >= 0; i--) {
      const r = baseRadius * (1 + i * 0.25 * pulse);
      const alpha = p.map(i, 0, 6, 40, 160) * (1 + shimmer * 0.35);
      p.noStroke();
      p.fill(255, 220, 120, alpha);
      p.ellipse(centerX, centerY, r * 2);
    }
    p.fill(255, 240, 180);
    p.ellipse(centerX, centerY, baseRadius * 1.6);
  }

  function drawWaves() {
    p.noStroke();
    const waveColors = [p.color(70, 170, 210), p.color(40, 120, 170), p.color(24, 72, 130)];
    waves.forEach((wave, idx) => {
      p.fill(waveColors[idx % waveColors.length]);
      p.beginShape();
      p.vertex(0, p.height);
      const density = 12;
      for (let x = 0; x <= p.width + density; x += density) {
        const angle = (x / wave.wavelength) * p.TWO_PI + wave.phase + p.millis() * wave.speed * speedMultiplier;
        const y = wave.yBase + Math.sin(angle) * wave.amplitude * (1 + 0.4 * shimmer);
        p.vertex(x, y);
      }
      p.vertex(p.width, p.height);
      p.endShape(p.CLOSE);
    });
  }

  return {
    id: 'summer',
    name: 'Éclat estival',
    description: 'Soleil doux, vagues et bulles légères',
    enter() {
      shimmer = 0.6;
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      shimmer = 1;
      for (let i = 0; i < 10; i++) {
        bubbles.push(createBubble(p, p.width, p.height));
      }
    },
    draw() {
      drawSky();
      drawSun();
      drawWaves();

      bubbles.forEach(bubble => {
        bubble.y -= bubble.speed * (0.5 + speedMultiplier * 0.9);
        bubble.x += bubble.drift * speedMultiplier;
        if (bubble.y < -40) {
          Object.assign(bubble, createBubble(p, p.width, p.height));
        }
        p.noFill();
        p.stroke(255, bubble.alpha);
        p.strokeWeight(2);
        p.circle(bubble.x, bubble.y, bubble.radius * 2);
      });

      if (shimmer > 0.01) {
        p.noStroke();
        p.fill(255, 255, 220, p.map(shimmer, 0, 1, 0, 85, true));
        p.rect(0, 0, p.width, p.height);
        shimmer = Math.max(0, shimmer - 0.012 * speedMultiplier);
      }
    }
  };
}
