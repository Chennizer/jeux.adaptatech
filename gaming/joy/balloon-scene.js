const PALETTE = [
  [255, 119, 119],
  [255, 187, 92],
  [255, 238, 88],
  [106, 217, 163],
  [126, 199, 255],
  [211, 133, 255]
];

function createBalloon(p) {
  const color = p.random(PALETTE);
  return {
    x: p.random(p.width),
    y: p.random(p.height * 0.65, p.height * 1.1),
    size: p.random(28, 46),
    sway: p.random(20, 42),
    speed: p.random(0.4, 1),
    anchor: p.random(0.1, 0.28),
    color,
    shine: p.random(180, 240),
    offset: p.random(p.TWO_PI)
  };
}

function createRibbon(p, balloon) {
  const points = [];
  const segments = 8;
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const px = balloon.x + p.sin(t * p.TWO_PI + balloon.offset) * balloon.sway * 0.15;
    const py = balloon.y + balloon.size * 0.8 + t * balloon.size * 2.2;
    points.push({ x: px, y: py });
  }
  return points;
}

function createBurst(p, x, y) {
  const particles = [];
  const count = 20;
  for (let i = 0; i < count; i += 1) {
    const col = p.random(PALETTE);
    particles.push({
      x,
      y,
      vx: p.random(-2, 2),
      vy: p.random(-3, -0.3),
      life: p.random(30, 70),
      color: col,
      size: p.random(4, 9)
    });
  }
  return particles;
}

export function createBalloonScene(p) {
  let balloons = [];
  let bursts = [];
  let speedMultiplier = 1;

  function ensureBalloons() {
    const desired = Math.floor((p.width * p.height) * 0.00006) + 10;
    while (balloons.length < desired) balloons.push(createBalloon(p));
    if (balloons.length > desired) balloons.length = desired;
  }

  function drawBackground() {
    const top = [255, 242, 218];
    const mid = [194, 232, 255];
    const bottom = [146, 206, 255];
    for (let y = 0; y <= p.height; y += 1) {
      const t = y / p.height;
      let color;
      if (t < 0.45) {
        const tt = t / 0.45;
        color = [
          p.lerp(top[0], mid[0], tt),
          p.lerp(top[1], mid[1], tt),
          p.lerp(top[2], mid[2], tt)
        ];
      } else {
        const tt = (t - 0.45) / 0.55;
        color = [
          p.lerp(mid[0], bottom[0], tt),
          p.lerp(mid[1], bottom[1], tt),
          p.lerp(mid[2], bottom[2], tt)
        ];
      }
      p.stroke(color[0], color[1], color[2]);
      p.line(0, y, p.width, y);
    }
  }

  function drawBalloon(balloon) {
    const sway = p.sin(p.frameCount * 0.02 + balloon.offset) * balloon.sway;
    const x = balloon.x + sway;
    const y = balloon.y;
    p.noStroke();
    p.fill(...balloon.color, 220);
    p.ellipse(x, y, balloon.size * 1.05, balloon.size * 1.3);
    p.fill(255, 255, 255, 120);
    p.ellipse(x + balloon.size * 0.18, y - balloon.size * 0.18, balloon.size * 0.28, balloon.size * 0.2);

    p.stroke(80, 70, 60, 160);
    p.strokeWeight(1.7);
    const ribbon = createRibbon(p, { ...balloon, x, y });
    p.noFill();
    p.beginShape();
    ribbon.forEach(pt => p.curveVertex(pt.x, pt.y));
    p.endShape();
  }

  function updateBalloon(balloon) {
    balloon.y -= balloon.speed * speedMultiplier;
    if (balloon.y + balloon.size * 1.3 < -40) {
      Object.assign(balloon, createBalloon(p));
      balloon.y = p.height + p.random(20, 120);
    }
  }

  function drawBursts() {
    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      const burst = bursts[i];
      burst.forEach(particle => {
        particle.x += particle.vx * speedMultiplier;
        particle.y += particle.vy * speedMultiplier;
        particle.vy += 0.05 * speedMultiplier;
        particle.life -= 1.5 * speedMultiplier;
        const alpha = p.map(particle.life, 0, 70, 0, 200, true);
        p.noStroke();
        p.fill(particle.color[0], particle.color[1], particle.color[2], alpha);
        p.circle(particle.x, particle.y, particle.size);
      });
      bursts[i] = burst.filter(part => part.life > 0);
      if (!bursts[i].length) {
        bursts.splice(i, 1);
      }
    }
  }

  return {
    id: 'balloons',
    name: 'Montgolfières colorées',
    description: 'Des ballons qui montent avec des rubans dansants',
    enter() {
      bursts = [];
    },
    resize() {
      ensureBalloons();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      const candidates = p.shuffle([...balloons]).slice(0, 3);
      candidates.forEach(balloon => {
        bursts.push(createBurst(p, balloon.x, balloon.y));
      });
    },
    draw() {
      ensureBalloons();
      drawBackground();
      balloons.forEach(updateBalloon);
      balloons.forEach(drawBalloon);
      drawBursts();
    }
  };
}
