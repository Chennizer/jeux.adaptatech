const CONFETTI_COLORS = [
  [255, 102, 128],
  [255, 183, 94],
  [255, 244, 126],
  [120, 235, 173],
  [110, 191, 255],
  [196, 148, 255]
];

function createConfetto(p) {
  return {
    x: p.random(p.width),
    y: p.random(-p.height, 0),
    vy: p.random(1, 3.2),
    vx: p.random(-0.8, 0.8),
    size: p.random(8, 18),
    angle: p.random(p.TWO_PI),
    spin: p.random(-0.08, 0.08),
    color: p.random(CONFETTI_COLORS)
  };
}

function createStreamer(p) {
  const points = [];
  const startX = p.random(p.width);
  const startY = p.random(-30, p.height * 0.2);
  const length = p.random(90, 140);
  const bends = 8;
  for (let i = 0; i <= bends; i += 1) {
    const t = i / bends;
    const sway = p.sin(t * p.TWO_PI + p.random(-0.5, 0.5)) * p.random(14, 26);
    points.push({
      x: startX + sway,
      y: startY + t * length,
      alpha: p.random(160, 230)
    });
  }
  return {
    points,
    color: p.random(CONFETTI_COLORS),
    drift: p.random(-0.3, 0.3),
    fall: p.random(0.3, 0.7)
  };
}

export function createConfettiScene(p) {
  let confetti = [];
  let streamers = [];
  let speedMultiplier = 1;
  let pulseGlow = 0;

  function ensureConfetti() {
    const desired = Math.max(60, Math.floor((p.width * p.height) * 0.00012));
    while (confetti.length < desired) confetti.push(createConfetto(p));
    if (confetti.length > desired) confetti.length = desired;
  }

  function ensureStreamers() {
    const desired = 7;
    while (streamers.length < desired) streamers.push(createStreamer(p));
    if (streamers.length > desired) streamers.length = desired;
  }

  function drawBackground() {
    p.noStroke();
    const top = [255, 248, 231];
    const bottom = [255, 220, 190];
    for (let y = 0; y < p.height; y += 1) {
      const t = y / p.height;
      const r = p.lerp(top[0], bottom[0], t);
      const g = p.lerp(top[1], bottom[1], t);
      const b = p.lerp(top[2], bottom[2], t);
      p.stroke(r, g, b);
      p.line(0, y, p.width, y);
    }
    if (pulseGlow > 0.01) {
      p.fill(255, 230, 180, 60 * pulseGlow);
      p.rect(0, 0, p.width, p.height);
      pulseGlow = Math.max(0, pulseGlow - 0.01 * speedMultiplier);
    }
  }

  function drawConfetti() {
    confetti.forEach(c => {
      c.y += c.vy * speedMultiplier;
      c.x += c.vx * speedMultiplier;
      c.angle += c.spin * speedMultiplier;
      if (c.y - c.size > p.height) {
        Object.assign(c, createConfetto(p));
        c.y = -c.size;
      }
      if (c.x < -20) c.x = p.width + 10;
      if (c.x > p.width + 20) c.x = -10;
      p.push();
      p.translate(c.x, c.y);
      p.rotate(c.angle);
      p.noStroke();
      p.fill(c.color[0], c.color[1], c.color[2], 220);
      p.rectMode(p.CENTER);
      p.rect(0, 0, c.size * 0.8, c.size * 1.3, 3);
      p.pop();
    });
  }

  function drawStreamers() {
    streamers.forEach(s => {
      p.noFill();
      p.stroke(s.color[0], s.color[1], s.color[2], 180);
      p.strokeWeight(4);
      p.beginShape();
      s.points.forEach(pt => {
        pt.x += s.drift * speedMultiplier;
        pt.y += s.fall * speedMultiplier;
        p.curveVertex(pt.x, pt.y);
      });
      p.endShape();
      if (s.points[0].y > p.height + 40) {
        Object.assign(s, createStreamer(p));
      }
    });
  }

  return {
    id: 'confetti',
    name: 'Pluie de confettis',
    description: 'Rubans et confettis célébration',
    enter() {
      pulseGlow = 0.5;
    },
    resize() {
      ensureConfetti();
      ensureStreamers();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      pulseGlow = 1;
      for (let i = 0; i < 12; i += 1) {
        confetti.push(createConfetto(p));
      }
    },
    draw() {
      ensureConfetti();
      ensureStreamers();
      drawBackground();
      drawStreamers();
      drawConfetti();
    }
  };
}
