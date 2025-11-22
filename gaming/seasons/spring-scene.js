function createPetal(p, width, height) {
  return {
    x: p.random(width),
    y: p.random(height),
    size: p.random(8, 20),
    speed: p.random(0.35, 1.2),
    drift: p.random(-0.6, 0.6),
    rotation: p.random(p.TWO_PI),
    spin: p.random(-0.012, 0.012),
    tint: p.random(0.35, 1)
  };
}

export function createSpringScene(p) {
  let petals = [];
  let speedMultiplier = 1;
  let bloomPulse = 0;
  const baseColors = {
    top: p.color(22, 30, 56),
    middle: p.color(48, 92, 110),
    bottom: p.color(122, 186, 168)
  };

  function resize() {
    petals = Array.from({ length: 90 }, () => createPetal(p, p.width, p.height));
  }

  function drawGradient() {
    const steps = 32;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const mixTop = p.lerpColor(baseColors.top, baseColors.middle, t);
      const mixBottom = p.lerpColor(baseColors.middle, baseColors.bottom, t);
      const shade = p.lerpColor(mixTop, mixBottom, Math.pow(t, 1.25));
      p.noStroke();
      p.fill(shade.levels[0], shade.levels[1], shade.levels[2], 255);
      const y = p.height * t;
      p.rect(0, y, p.width, p.height / steps + 1);
    }
  }

  function drawMist() {
    p.noStroke();
    for (let i = 0; i < 8; i++) {
      const y = p.height * (0.15 + i * 0.1);
      const w = p.width * p.random(0.3, 0.8);
      const h = p.height * p.random(0.08, 0.18);
      const x = p.width * p.random(-0.1, 0.9);
      const alpha = p.map(i, 0, 7, 42, 14);
      p.fill(220, 240, 250, alpha);
      p.ellipse(x, y, w, h);
    }
  }

  return {
    id: 'spring',
    name: 'Éclosion douce',
    description: 'Pétales légers et brume pastel',
    enter() {
      bloomPulse = 1;
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      bloomPulse = 1;
      for (let i = 0; i < 18; i++) {
        petals.push({ ...createPetal(p, p.width, p.height), y: p.height + p.random(40, 140) });
      }
    },
    draw() {
      drawGradient();
      drawMist();

      p.noStroke();
      const lightPulse = Math.max(0, bloomPulse);
      if (lightPulse > 0.01) {
        const alpha = p.map(lightPulse, 0, 1, 0, 85, true);
        p.fill(255, 210, 230, alpha);
        p.rect(0, 0, p.width, p.height);
        bloomPulse = Math.max(0, bloomPulse - 0.01 * speedMultiplier);
      }

      petals.forEach(petal => {
        petal.x += petal.drift * speedMultiplier;
        petal.y -= petal.speed * (0.6 + speedMultiplier * 0.55);
        petal.rotation += petal.spin * speedMultiplier;
        if (petal.y < -40 || petal.x < -60 || petal.x > p.width + 60) {
          Object.assign(petal, createPetal(p, p.width, p.height));
          petal.y = p.height + p.random(20, 120);
        }

        const glow = p.map(petal.tint, 0.35, 1, 80, 160, true);
        p.fill(255, 210, 220, glow * 0.35);
        p.push();
        p.translate(petal.x, petal.y);
        p.rotate(petal.rotation);
        p.ellipse(0, 0, petal.size * 1.6, petal.size * 0.9);
        p.fill(255, 240, 245, glow);
        p.ellipse(0, 0, petal.size, petal.size * 0.66);
        p.pop();
      });

      p.noStroke();
      p.fill(160, 230, 220, 90);
      p.ellipse(p.width * 0.18, p.height * 0.8, p.width * 0.28, p.height * 0.16);
      p.fill(120, 190, 170, 70);
      p.ellipse(p.width * 0.72, p.height * 0.82, p.width * 0.34, p.height * 0.18);
    }
  };
}
