const RING_COLORS = [
  [0, 133, 199],
  [0, 0, 0],
  [238, 51, 78],
  [252, 177, 49],
  [0, 159, 61]
];

const RING_LAYOUT = [
  { x: -2, y: 0, color: 0 },
  { x: 0, y: 0, color: 1 },
  { x: 2, y: 0, color: 2 },
  { x: -1, y: 1.1, color: 3 },
  { x: 1, y: 1.1, color: 4 }
];

const FIREWORK_GRAVITY = 0.05;

function createFireworkBurst(p, x, y, palette) {
  const particles = [];
  const count = p.int(p.random(90, 150));
  for (let i = 0; i < count; i += 1) {
    const angle = p.random(p.TWO_PI);
    const speed = p.random(1.5, 5.8);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: p.random(70, 140),
      hue: palette[p.int(p.random(palette.length))]
    });
  }
  return particles;
}

export function createOpeningCeremony(p) {
  const ringProgress = new Array(5).fill(0);
  const fireworks = [];
  const shimmer = [];
  let presses = 0;
  let finaleStart = null;
  let complete = false;

  const palette = [
    p.color(246, 211, 97),
    p.color(250, 142, 82),
    p.color(101, 198, 255),
    p.color(252, 240, 255),
    p.color(255, 108, 150)
  ];

  function spawnShimmer() {
    for (let i = 0; i < 70; i += 1) {
      shimmer.push({
        x: p.random(p.width),
        y: p.random(p.height * 0.6),
        r: p.random(1, 3),
        alpha: p.random(80, 180),
        drift: p.random(-0.2, 0.2)
      });
    }
  }

  function drawSky() {
    p.noFill();
    for (let y = 0; y < p.height; y += 3) {
      const t = y / p.height;
      const top = p.color(4, 12, 28);
      const bottom = p.color(16, 30, 60);
      const gradient = p.lerpColor(top, bottom, t);
      p.stroke(gradient);
      p.line(0, y, p.width, y);
    }
    p.noStroke();
  }

  function updateFireworks() {
    fireworks.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += FIREWORK_GRAVITY;
      particle.life -= 1;
    });
    for (let i = fireworks.length - 1; i >= 0; i -= 1) {
      if (fireworks[i].life <= 0) fireworks.splice(i, 1);
    }
  }

  function drawFireworks() {
    p.push();
    p.blendMode(p.ADD);
    fireworks.forEach(particle => {
      const alpha = p.map(particle.life, 0, 140, 0, 200);
      p.noStroke();
      p.fill(particle.hue.levels[0], particle.hue.levels[1], particle.hue.levels[2], alpha);
      p.circle(particle.x, particle.y, p.random(2, 4));
    });
    p.pop();
  }

  function drawRings() {
    const minSide = Math.min(p.width, p.height);
    const ringRadius = minSide * 0.12;
    const ringSpacing = ringRadius * 0.9;
    const centerX = p.width / 2;
    const centerY = p.height * 0.62;
    const strokeW = ringRadius * 0.12;

    RING_LAYOUT.forEach((ring, index) => {
      const progress = ringProgress[index];
      const color = RING_COLORS[ring.color];
      p.stroke(color[0], color[1], color[2]);
      p.noFill();
      p.strokeWeight(strokeW);
      p.strokeCap(p.ROUND);
      const x = centerX + ring.x * ringSpacing;
      const y = centerY + ring.y * ringSpacing;
      p.arc(x, y, ringRadius * 2, ringRadius * 2, -p.HALF_PI, -p.HALF_PI + p.TWO_PI * progress);
      if (progress === 0) {
        p.stroke(color[0], color[1], color[2], 80);
        p.arc(x, y, ringRadius * 2, ringRadius * 2, 0, p.TWO_PI);
      }
    });
  }

  function drawStadiumGlow() {
    p.push();
    p.noStroke();
    p.fill(255, 245, 220, 40);
    p.ellipse(p.width * 0.5, p.height * 0.85, p.width * 0.9, p.height * 0.5);
    p.fill(255, 205, 140, 50);
    p.ellipse(p.width * 0.5, p.height * 0.9, p.width * 0.6, p.height * 0.3);
    p.pop();
  }

  function triggerFinale() {
    if (finaleStart) return;
    finaleStart = p.millis();
    for (let i = 0; i < 6; i += 1) {
      fireworks.push(...createFireworkBurst(
        p,
        p.random(p.width * 0.2, p.width * 0.8),
        p.random(p.height * 0.1, p.height * 0.4),
        palette
      ));
    }
  }

  function handlePress() {
    if (complete) return;
    if (presses < 5) {
      fireworks.push(...createFireworkBurst(
        p,
        p.random(p.width * 0.2, p.width * 0.8),
        p.random(p.height * 0.12, p.height * 0.45),
        palette
      ));
      ringProgress[presses] = Math.max(ringProgress[presses], 0.02);
      presses += 1;
    }
    if (presses >= 5) {
      triggerFinale();
    }
  }

  spawnShimmer();

  return {
    id: 'opening',
    enter() {
      presses = 0;
      finaleStart = null;
      complete = false;
      ringProgress.fill(0);
      fireworks.length = 0;
    },
    update(delta) {
      for (let i = 0; i < ringProgress.length; i += 1) {
        if (ringProgress[i] > 0 && ringProgress[i] < 1) {
          ringProgress[i] = Math.min(1, ringProgress[i] + delta * 0.0012);
        }
      }
      updateFireworks();
      shimmer.forEach(star => {
        star.alpha += star.drift;
        if (star.alpha < 60 || star.alpha > 200) star.drift *= -1;
      });
      if (presses >= 5 && ringProgress.every(progress => progress >= 0.98)) {
        triggerFinale();
      }
      if (finaleStart && p.millis() - finaleStart > 5200) {
        complete = true;
      }
    },
    draw() {
      drawSky();
      p.push();
      p.noStroke();
      shimmer.forEach(star => {
        p.fill(255, 255, 255, star.alpha);
        p.circle(star.x, star.y, star.r);
      });
      p.pop();
      drawStadiumGlow();
      drawRings();
      drawFireworks();
      p.push();
      p.fill(255, 240, 220, 220);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(Math.min(26, p.width * 0.03));
      p.text('Cérémonie d\'ouverture — Appuie sur espace', p.width / 2, p.height * 0.15);
      p.pop();
    },
    handlePress,
    isComplete() {
      return complete;
    },
    resize() {
      shimmer.length = 0;
      spawnShimmer();
    }
  };
}
