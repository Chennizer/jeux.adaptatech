function createGradient(p) {
  const colors = [
    [255, 231, 150],
    [255, 193, 180],
    [255, 245, 225]
  ];
  for (let y = 0; y < p.height; y++) {
    const t = y / Math.max(1, p.height - 1);
    const idx = t * (colors.length - 1);
    const low = Math.floor(idx);
    const high = Math.min(colors.length - 1, low + 1);
    const localT = idx - low;
    const c1 = colors[low];
    const c2 = colors[high];
    const r = p.lerp(c1[0], c2[0], localT);
    const g = p.lerp(c1[1], c2[1], localT);
    const b = p.lerp(c1[2], c2[2], localT);
    p.stroke(r, g, b);
    p.line(0, y, p.width, y);
  }
}

function createOrbs(p, count) {
  const orbs = [];
  for (let i = 0; i < count; i++) {
    orbs.push({
      angle: p.random(p.TWO_PI),
      radius: p.random(p.width * 0.12, p.width * 0.34),
      r: p.random(18, 70),
      hue: p.random(0, 360),
      alpha: p.random(45, 90),
      speed: p.random(0.002, 0.01),
      wobble: p.random(0.002, 0.006)
    });
  }
  return orbs;
}

export function createSunburstScene(p) {
  let rays = [];
  let orbs = [];
  let speedMultiplier = 1;
  let pulseBoost = 0;

  function initRays() {
    const count = 120;
    rays = new Array(count).fill(0).map((_, i) => ({
      angle: (i / count) * p.TWO_PI,
      speed: p.random(0.0008, 0.0016),
      width: p.random(10, 36),
      hue: p.random(20, 60)
    }));
  }

  function drawSun() {
    p.push();
    p.translate(p.width * 0.5, p.height * 0.52);
    p.noStroke();
    for (const ray of rays) {
      const wobble = p.sin(p.frameCount * ray.speed * 90) * 0.12;
      const len = p.lerp(p.height * 0.2, p.height * 0.42, (p.sin(p.frameCount * ray.speed * 60) + 1) * 0.5);
      p.fill((ray.hue + wobble * 40) % 360, 82, 100, 0.65 * 100);
      p.beginShape();
      p.vertex(0, 0);
      p.vertex(p.cos(ray.angle + wobble) * len, p.sin(ray.angle + wobble) * len);
      p.vertex(p.cos(ray.angle - wobble) * len, p.sin(ray.angle - wobble) * len);
      p.endShape(p.CLOSE);
    }

    const sunRadius = p.width * 0.12;
    p.fill(50, 95, 100, 95);
    p.circle(0, 0, sunRadius * 2);
    p.pop();
  }

  function drawOrbs() {
    p.noStroke();
    const cx = p.width * 0.5;
    const cy = p.height * 0.52;
    for (const orb of orbs) {
      const boost = 1 + pulseBoost * 4.2;
      orb.angle += orb.speed * speedMultiplier * boost;
      const breathing = p.sin(p.frameCount * orb.wobble) * 0.5;
      const radius = orb.radius + breathing * 16;
      const x = cx + p.cos(orb.angle) * radius;
      const y = cy + p.sin(orb.angle) * radius * 0.85;
      const glow = orb.r * 1.5;
      p.fill((orb.hue + p.frameCount * 0.4) % 360, 70, 100, orb.alpha);
      p.circle(x, y, glow);
      p.fill((orb.hue + 20) % 360, 60, 90, orb.alpha + 20);
      p.circle(x, y, orb.r);
    }
  }

  return {
    id: 'sunburst',
    enter() {
      p.colorMode(p.HSB, 360, 100, 100, 100);
      initRays();
      orbs = createOrbs(p, Math.max(20, Math.floor((p.width * p.height) * 0.00004)));
    },
    resize() {
      orbs = createOrbs(p, Math.max(20, Math.floor((p.width * p.height) * 0.00004)));
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      pulseBoost = 1;
      orbs.push(...createOrbs(p, 6));
      if (orbs.length > 120) {
        orbs.splice(0, orbs.length - 120);
      }
    },
    draw() {
      createGradient(p);
      drawSun();
      drawOrbs();
      pulseBoost = Math.max(0, pulseBoost - 0.08);
    }
  };
}
