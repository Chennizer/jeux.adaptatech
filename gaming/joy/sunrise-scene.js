const SKY_STOPS = [
  { y: 0, color: [255, 238, 207] },
  { y: 0.35, color: [255, 206, 160] },
  { y: 0.72, color: [255, 175, 126] },
  { y: 1, color: [255, 142, 122] }
];

function createCloud(p) {
  return {
    x: p.random(p.width),
    y: p.random(p.height * 0.15, p.height * 0.45),
    speed: p.random(0.2, 0.8),
    scale: p.random(0.8, 1.6),
    alpha: p.random(110, 180)
  };
}

function createSparkle(p, cx, cy) {
  return {
    x: cx + p.random(-30, 30),
    y: cy + p.random(-30, 30),
    size: p.random(4, 9),
    life: p.random(40, 80),
    spin: p.random(p.TWO_PI),
    hue: p.random(30, 60)
  };
}

export function createSunriseScene(p) {
  let clouds = [];
  let sparkles = [];
  let speedMultiplier = 1;
  let pulseActive = 0;

  function ensureClouds() {
    const desired = Math.max(6, Math.floor((p.width + p.height) * 0.006));
    while (clouds.length < desired) clouds.push(createCloud(p));
    if (clouds.length > desired) clouds.length = desired;
  }

  function drawGradient() {
    for (let i = 0; i < SKY_STOPS.length - 1; i += 1) {
      const a = SKY_STOPS[i];
      const b = SKY_STOPS[i + 1];
      const yStart = a.y * p.height;
      const yEnd = b.y * p.height;
      for (let y = yStart; y <= yEnd; y += 1) {
        const t = p.map(y, yStart, yEnd, 0, 1, true);
        const r = p.lerp(a.color[0], b.color[0], t);
        const g = p.lerp(a.color[1], b.color[1], t);
        const bl = p.lerp(a.color[2], b.color[2], t);
        p.stroke(r, g, bl);
        p.line(0, y, p.width, y);
      }
    }
  }

  function drawSun() {
    const centerX = p.width * 0.5;
    const centerY = p.height * 0.62;
    const baseRadius = Math.min(p.width, p.height) * 0.22;
    const pulse = 1 + 0.04 * p.sin(p.frameCount * 0.03) + pulseActive * 0.15;
    const radius = baseRadius * pulse;

    p.noStroke();
    for (let i = 12; i >= 1; i -= 1) {
      const t = i / 12;
      p.fill(255, 210, 110, 10 + t * 40);
      p.circle(centerX, centerY, radius * t * 2.4);
    }

    p.fill(255, 230, 150, 240);
    p.circle(centerX, centerY, radius * 1.12);
    p.fill(255, 240, 200);
    p.circle(centerX, centerY, radius * 0.72);

    if (pulseActive > 0.01) {
      p.stroke(255, 240, 170, 130 * pulseActive);
      p.strokeWeight(2);
      const rays = 22;
      for (let i = 0; i < rays; i += 1) {
        const ang = (p.TWO_PI / rays) * i + p.frameCount * 0.01;
        const r1 = radius * 0.8;
        const r2 = radius * 1.55;
        p.line(centerX + p.cos(ang) * r1, centerY + p.sin(ang) * r1, centerX + p.cos(ang) * r2, centerY + p.sin(ang) * r2);
      }
    }

    return { x: centerX, y: centerY };
  }

  function drawGround() {
    const baseY = p.height * 0.72;
    p.noStroke();
    for (let i = 0; i < 3; i += 1) {
      const offset = i * 18;
      p.fill(80 + i * 20, 190 + i * 8, 120 + i * 12, 220);
      p.beginShape();
      for (let x = 0; x <= p.width; x += 24) {
        const y = baseY + p.sin((x * 0.004) + i) * 18 + offset;
        p.vertex(x, y);
      }
      p.vertex(p.width, p.height);
      p.vertex(0, p.height);
      p.endShape(p.CLOSE);
    }
  }

  function drawCloud(cloud) {
    p.noStroke();
    p.fill(255, 255, 255, cloud.alpha);
    const w = 90 * cloud.scale;
    const h = 50 * cloud.scale;
    p.ellipse(cloud.x, cloud.y, w, h);
    p.ellipse(cloud.x - w * 0.35, cloud.y + h * 0.05, w * 0.7, h * 0.7);
    p.ellipse(cloud.x + w * 0.25, cloud.y - h * 0.05, w * 0.8, h * 0.85);
  }

  function updateCloud(cloud) {
    cloud.x += cloud.speed * speedMultiplier;
    if (cloud.x - 180 > p.width) {
      cloud.x = -p.random(120, 200);
      cloud.y = p.random(p.height * 0.15, p.height * 0.45);
      cloud.speed = p.random(0.2, 0.8);
      cloud.scale = p.random(0.8, 1.6);
    }
  }

  function drawSparkles() {
    for (let i = sparkles.length - 1; i >= 0; i -= 1) {
      const s = sparkles[i];
      s.life -= 1.3 * speedMultiplier;
      s.spin += 0.07;
      const alpha = p.map(s.life, 0, 80, 0, 180, true);
      p.push();
      p.translate(s.x, s.y);
      p.rotate(s.spin);
      p.fill(255, 210, 140, alpha);
      p.noStroke();
      p.rectMode(p.CENTER);
      p.rect(0, 0, s.size, s.size * 1.2, 2);
      p.pop();
      if (s.life <= 0) {
        sparkles.splice(i, 1);
      }
    }
  }

  return {
    id: 'sunrise',
    name: 'Aube dorée',
    description: 'Soleil levant, collines et nuages doux',
    enter() {
      pulseActive = 0.6;
      sparkles = [];
    },
    resize() {
      ensureClouds();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
      pulseActive = Math.max(0, pulseActive - 0.01 * multiplier);
    },
    pulse() {
      pulseActive = 1;
      const { x, y } = { x: p.width * 0.5, y: p.height * 0.62 };
      for (let i = 0; i < 22; i += 1) {
        sparkles.push(createSparkle(p, x, y));
      }
    },
    draw() {
      ensureClouds();
      drawGradient();
      drawSun();
      clouds.forEach(updateCloud);
      clouds.forEach(drawCloud);
      drawGround();
      drawSparkles();
      if (pulseActive > 0) {
        pulseActive = Math.max(0, pulseActive - 0.006 * speedMultiplier);
      }
    }
  };
}
