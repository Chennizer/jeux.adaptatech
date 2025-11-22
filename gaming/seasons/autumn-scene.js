function createLeaf(p, width, height) {
  const palette = [
    [186, 90, 52],
    [214, 132, 64],
    [238, 176, 92],
    [156, 90, 52]
  ];
  const color = palette[Math.floor(p.random(palette.length))];
  return {
    x: p.random(width),
    y: p.random(-height * 0.2, height * 0.8),
    size: p.random(12, 26),
    sway: p.random(0.003, 0.01),
    fall: p.random(0.45, 1.1),
    angle: p.random(p.TWO_PI),
    spin: p.random(-0.015, 0.015),
    color
  };
}

export function createAutumnScene(p) {
  let leaves = [];
  let gust = 0;
  let speedMultiplier = 1;

  function resize() {
    leaves = Array.from({ length: 70 }, () => createLeaf(p, p.width, p.height));
  }

  function drawBackground() {
    const steps = 48;
    const top = p.color(30, 18, 12);
    const mid = p.color(78, 44, 22);
    const bottom = p.color(140, 78, 38);
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const mix = p.lerpColor(top, bottom, Math.pow(t, 1.2));
      const tint = p.lerpColor(mix, mid, 0.25);
      p.noStroke();
      p.fill(tint);
      p.rect(0, (p.height / steps) * i, p.width, p.height / steps + 1);
    }
  }

  function drawLeaves() {
    leaves.forEach(leaf => {
      leaf.angle += leaf.spin * speedMultiplier;
      const swayX = Math.sin(p.millis() * leaf.sway * (1 + gust * 0.5)) * 28;
      leaf.x += (swayX * 0.01 + gust * 1.2) * speedMultiplier;
      leaf.y += leaf.fall * (0.7 + speedMultiplier * 0.4 + gust * 0.8);
      if (leaf.y > p.height + 60 || leaf.x < -80 || leaf.x > p.width + 80) {
        Object.assign(leaf, createLeaf(p, p.width, p.height));
        leaf.y = p.random(-p.height * 0.2, -40);
      }
      p.push();
      p.translate(leaf.x, leaf.y);
      p.rotate(leaf.angle);
      p.noStroke();
      p.fill(...leaf.color, 200);
      p.beginShape();
      p.vertex(-leaf.size * 0.5, 0);
      p.vertex(0, -leaf.size * 0.8);
      p.vertex(leaf.size * 0.6, 0);
      p.vertex(0, leaf.size * 0.6);
      p.endShape(p.CLOSE);
      p.pop();
    });
  }

  return {
    id: 'autumn',
    name: 'Souffle d\'automne',
    description: 'Feuilles orangées qui tourbillonnent',
    enter() {
      gust = 0.4;
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      gust = 1;
      for (let i = 0; i < 14; i++) {
        leaves.push({ ...createLeaf(p, p.width, p.height), y: -p.random(0, 120) });
      }
    },
    draw() {
      drawBackground();
      drawLeaves();

      if (gust > 0.01) {
        p.noStroke();
        p.fill(255, 200, 150, p.map(gust, 0, 1, 0, 70, true));
        p.rect(0, 0, p.width, p.height);
        gust = Math.max(0, gust - 0.01 * speedMultiplier);
      }
    }
  };
}
