const RIBBON_COLORS = [
  [255, 99, 132],
  [255, 195, 87],
  [144, 238, 144],
  [95, 198, 255],
  [166, 139, 255]
];

function createRibbon(p, idx) {
  const baseY = p.height * (0.25 + idx * 0.12);
  return {
    offset: p.random(p.TWO_PI),
    amplitude: p.random(28, 52),
    speed: p.random(0.002, 0.0045),
    thickness: p.random(16, 28),
    baseY,
    color: RIBBON_COLORS[idx % RIBBON_COLORS.length]
  };
}

function createBubble(p) {
  return {
    x: p.random(p.width),
    y: p.random(p.height * 0.3, p.height * 0.85),
    r: p.random(8, 18),
    speed: p.random(0.25, 0.8),
    alpha: p.random(60, 130)
  };
}

export function createRainbowScene(p) {
  const ribbons = [];
  let bubbles = [];
  let stars = [];
  let speedMultiplier = 1;

  function init() {
    ribbons.length = 0;
    for (let i = 0; i < 5; i += 1) {
      ribbons.push(createRibbon(p, i));
    }
    bubbles = Array.from({ length: 40 }, () => createBubble(p));
    stars = [];
  }

  function drawBackground() {
    const top = [255, 250, 238];
    const bottom = [226, 242, 255];
    for (let y = 0; y <= p.height; y += 1) {
      const t = y / p.height;
      const r = p.lerp(top[0], bottom[0], t);
      const g = p.lerp(top[1], bottom[1], t);
      const b = p.lerp(top[2], bottom[2], t);
      p.stroke(r, g, b);
      p.line(0, y, p.width, y);
    }
  }

  function drawRibbon(ribbon, index) {
    p.noFill();
    p.stroke(ribbon.color[0], ribbon.color[1], ribbon.color[2], 200);
    p.strokeWeight(ribbon.thickness);
    p.beginShape();
    const frequency = 0.008 + index * 0.001;
    for (let x = -100; x <= p.width + 100; x += 12) {
      const wave = p.sin(x * frequency + p.frameCount * ribbon.speed + ribbon.offset) * ribbon.amplitude;
      const y = ribbon.baseY + wave;
      p.curveVertex(x, y);
    }
    p.endShape();
  }

  function drawBubbles() {
    p.noStroke();
    bubbles.forEach(bubble => {
      bubble.y -= bubble.speed * speedMultiplier;
      if (bubble.y + bubble.r < 0) {
        Object.assign(bubble, createBubble(p));
        bubble.y = p.height + bubble.r;
      }
      p.fill(255, 255, 255, bubble.alpha);
      p.circle(bubble.x, bubble.y, bubble.r * 2);
      p.fill(255, 255, 255, bubble.alpha * 0.4);
      p.circle(bubble.x - bubble.r * 0.3, bubble.y - bubble.r * 0.3, bubble.r);
    });
  }

  function drawStars() {
    p.noStroke();
    for (let i = stars.length - 1; i >= 0; i -= 1) {
      const star = stars[i];
      star.life -= 1.6 * speedMultiplier;
      const alpha = p.map(star.life, 0, star.maxLife, 0, 200, true);
      p.fill(255, 240, 200, alpha);
      p.push();
      p.translate(star.x, star.y);
      p.rotate(star.rot);
      p.beginShape();
      for (let k = 0; k < 5; k += 1) {
        const angle = (p.TWO_PI / 5) * k;
        const r1 = star.size;
        const r2 = star.size * 0.45;
        p.vertex(p.cos(angle) * r1, p.sin(angle) * r1);
        p.vertex(p.cos(angle + p.PI / 5) * r2, p.sin(angle + p.PI / 5) * r2);
      }
      p.endShape(p.CLOSE);
      p.pop();
      if (star.life <= 0) stars.splice(i, 1);
    }
  }

  return {
    id: 'rainbow',
    name: 'Rubans arc-en-ciel',
    description: 'Ondes colorées et bulles lumineuses',
    enter() {
      init();
    },
    resize() {
      init();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      for (let i = 0; i < 12; i += 1) {
        stars.push({
          x: p.random(p.width),
          y: p.random(p.height * 0.25, p.height * 0.75),
          size: p.random(6, 14),
          rot: p.random(p.TWO_PI),
          life: p.random(40, 90),
          maxLife: p.random(60, 100)
        });
      }
    },
    draw() {
      drawBackground();
      ribbons.forEach((ribbon, index) => drawRibbon(ribbon, index));
      drawBubbles();
      drawStars();
    }
  };
}
