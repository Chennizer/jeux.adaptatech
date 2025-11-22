function createSnow(p, width, height) {
  return {
    x: p.random(width),
    y: p.random(-height, height),
    radius: p.random(2, 6),
    fall: p.random(0.4, 1.2),
    drift: p.random(-0.4, 0.4)
  };
}

function createStar(p, width, height) {
  return {
    x: p.random(width),
    y: p.random(height * 0.6),
    brightness: p.random(120, 200),
    twinkleSpeed: p.random(0.002, 0.006)
  };
}

export function createWinterScene(p) {
  let snowflakes = [];
  let stars = [];
  let auroraPhase = 0;
  let speedMultiplier = 1;
  let glow = 0;

  function resize() {
    snowflakes = Array.from({ length: 120 }, () => createSnow(p, p.width, p.height));
    stars = Array.from({ length: 60 }, () => createStar(p, p.width, p.height));
  }

  function drawBackground() {
    const top = p.color(10, 20, 38);
    const middle = p.color(20, 34, 64);
    const bottom = p.color(38, 70, 102);
    const steps = 64;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const shade = p.lerpColor(top, p.lerpColor(middle, bottom, Math.pow(t, 1.2)), Math.pow(t, 0.6));
      p.stroke(shade);
      const y = p.height * t;
      p.line(0, y, p.width, y);
    }
  }

  function drawAurora() {
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const alpha = p.map(i, 0, layers - 1, 28, 8) * (1 + glow * 0.4);
      const yBase = p.height * (0.22 + i * 0.05);
      p.noStroke();
      for (let x = -40; x < p.width + 40; x += 14) {
        const noiseVal = p.noise(x * 0.01, auroraPhase * 0.002 + i * 0.2);
        const y = yBase + Math.sin((x * 0.007) + auroraPhase * 0.015) * 16 + noiseVal * 30;
        p.fill(80, 200, 220, alpha);
        p.ellipse(x, y, 60, 120);
      }
    }
    auroraPhase += speedMultiplier;
  }

  return {
    id: 'winter',
    name: 'Silence hivernal',
    description: 'Flocons et aurores calmes',
    enter() {
      glow = 0.8;
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      glow = 1;
      for (let i = 0; i < 12; i++) {
        snowflakes.push({ ...createSnow(p, p.width, p.height), y: -p.random(20, 120) });
      }
    },
    draw() {
      drawBackground();
      drawAurora();

      stars.forEach(star => {
        const twinkle = Math.sin(p.millis() * star.twinkleSpeed + star.x) * 0.5 + 0.5;
        p.noStroke();
        p.fill(220, 240, 255, star.brightness * twinkle);
        p.circle(star.x, star.y, 2.5);
      });

      snowflakes.forEach(flake => {
        flake.y += flake.fall * (0.7 + speedMultiplier * 0.45);
        flake.x += flake.drift * speedMultiplier;
        if (flake.y > p.height + 20) {
          Object.assign(flake, createSnow(p, p.width, p.height));
          flake.y = -p.random(20, 80);
        }
        if (flake.x < -40 || flake.x > p.width + 40) {
          flake.x = (flake.x + p.width + 40) % (p.width + 40);
        }
        p.noStroke();
        p.fill(235, 245, 255, 220);
        p.circle(flake.x, flake.y, flake.radius * 2);
      });

      if (glow > 0.01) {
        p.noStroke();
        p.fill(180, 220, 255, p.map(glow, 0, 1, 0, 80, true));
        p.rect(0, 0, p.width, p.height);
        glow = Math.max(0, glow - 0.01 * speedMultiplier);
      }
    }
  };
}
