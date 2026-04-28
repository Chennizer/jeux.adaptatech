export function createWinterScene(p) {
  const flakes = [];
  let shimmer = 0;

  function resetFlakes() {
    flakes.length = 0;
    const count = Math.max(60, Math.floor((p.width + p.height) / 14));
    for (let i = 0; i < count; i += 1) {
      flakes.push({
        x: p.random(-p.width * 0.1, p.width * 1.1),
        y: p.random(-p.height * 0.2, p.height * 1.1),
        size: p.random(2, 8),
        speed: p.random(0.4, 1.2),
        drift: p.random(0.5, 1.4),
        twirl: p.random(0.01, 0.02)
      });
    }
  }

  function drawBackdrop() {
    const gradientTop = p.color(14, 26, 46);
    const gradientBottom = p.color(6, 10, 18);
    for (let y = 0; y < p.height; y += 2) {
      const t = y / p.height;
      const c = p.lerpColor(gradientTop, gradientBottom, t);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }

    // moon glow
    p.noStroke();
    p.fill(180, 220, 255, 30 + 20 * Math.sin(shimmer));
    p.ellipse(p.width * 0.78, p.height * 0.25, p.width * 0.36, p.width * 0.36);

    p.fill(8, 10, 14, 220);
    p.rect(p.width / 2, p.height / 2, p.width, p.height, 42);
  }

  function drawFlakes() {
    flakes.forEach(flake => {
      const sway = Math.sin(flake.y * 0.012 + shimmer) * 8 * flake.drift;
      const x = flake.x + sway;
      const y = flake.y;
      p.noStroke();
      p.fill(220, 240, 255, 200);
      p.circle(x, y, flake.size * 2);
      p.stroke(200, 230, 255, 120);
      p.strokeWeight(1);
      p.line(x - flake.size, y, x + flake.size, y);
      p.line(x, y - flake.size, x, y + flake.size);

      flake.y += flake.speed;
      flake.x += flake.drift * 0.2;
      flake.twirl += 0.0008;
      if (flake.y > p.height + 20) {
        flake.y = -20;
        flake.x = p.random(-p.width * 0.1, p.width * 1.1);
      }
    });
  }

  function drawCurtains() {
    p.noStroke();
    p.fill(8, 12, 18, 200);
    const width = p.width * 0.1 + Math.sin(shimmer * 0.5) * 4;
    p.rect(width / 2, p.height / 2, width, p.height);
    p.rect(p.width - width / 2, p.height / 2, width, p.height);
  }

  return {
    id: 'winter',
    enter() {
      resetFlakes();
    },
    draw() {
      shimmer += 0.01;
      drawBackdrop();
      drawFlakes();
      drawCurtains();
      p.noStroke();
      p.fill(180, 210, 255, 24);
      p.rect(p.width / 2, p.height / 2, p.width * 0.86, p.height * 0.86, 30);
    },
    resize() {
      resetFlakes();
    }
  };
}
