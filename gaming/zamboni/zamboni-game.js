function createIceSparkle(p) {
  return {
    x: p.random(p.width * 0.1, p.width * 0.9),
    y: p.random(p.height * 0.3, p.height * 0.85),
    r: p.random(1, 3.5),
    alpha: p.random(60, 140),
    drift: p.random(-0.4, 0.4)
  };
}

function createConfetti(p) {
  return {
    x: p.random(p.width * 0.2, p.width * 0.8),
    y: p.random(-p.height * 0.2, p.height * 0.1),
    vx: p.random(-1.2, 1.2),
    vy: p.random(2, 4.5),
    size: p.random(6, 12),
    color: p.color(p.random(120, 255), p.random(120, 255), p.random(120, 255)),
    spin: p.random(-0.1, 0.1),
    angle: p.random(p.TWO_PI)
  };
}

export function createZamboniGame(p) {
  const rows = 5;
  const cleanedRows = new Array(rows).fill(false);
  const sparkles = [];
  const confetti = [];
  let activeRow = -1;
  let sweepProgress = 0;
  let direction = 1;
  let cleaning = false;
  let complete = false;
  let celebrationStart = null;

  function spawnSparkles() {
    sparkles.length = 0;
    for (let i = 0; i < 80; i += 1) {
      sparkles.push(createIceSparkle(p));
    }
  }

  function drawRink() {
    const margin = p.width * 0.08;
    const top = p.height * 0.18;
    const rinkWidth = p.width - margin * 2;
    const rinkHeight = p.height * 0.6;
    p.push();
    p.noStroke();
    p.fill(200, 230, 255, 200);
    p.rect(margin, top, rinkWidth, rinkHeight, 40);
    p.fill(220, 245, 255, 230);
    p.rect(margin + 10, top + 10, rinkWidth - 20, rinkHeight - 20, 32);
    p.stroke(255, 80, 80, 200);
    p.strokeWeight(4);
    p.noFill();
    p.line(margin + 10, top + rinkHeight / 2, margin + rinkWidth - 10, top + rinkHeight / 2);
    p.pop();
    return { margin, top, rinkWidth, rinkHeight };
  }

  function drawCleanedStripes(area) {
    const rowHeight = area.rinkHeight / rows;
    p.push();
    p.noStroke();
    cleanedRows.forEach((done, index) => {
      if (!done) return;
      const y = area.top + index * rowHeight;
      p.fill(245, 252, 255, 220);
      p.rect(area.margin + 20, y + 6, area.rinkWidth - 40, rowHeight - 12, 18);
    });
    p.pop();
  }

  function updateSweep(delta) {
    if (!cleaning) return;
    sweepProgress += delta * 0.00018;
    if (sweepProgress >= 1) {
      sweepProgress = 1;
      cleanedRows[activeRow] = true;
      cleaning = false;
      direction *= -1;
      if (cleanedRows.every(Boolean)) {
        celebrationStart = p.millis();
        complete = true;
      }
    }
  }

  function drawZamboni(area) {
    const rowHeight = area.rinkHeight / rows;
    const row = Math.max(0, activeRow);
    const y = area.top + row * rowHeight + rowHeight * 0.2;
    const xStart = area.margin + 30;
    const xEnd = area.margin + area.rinkWidth - 30;
    const t = direction === 1 ? sweepProgress : 1 - sweepProgress;
    const x = p.lerp(xStart, xEnd, cleaning ? t : direction === 1 ? 0 : 1);

    p.push();
    p.translate(x, y);
    p.scale(direction, 1);
    p.noStroke();
    p.fill(255, 190, 70);
    p.rect(-50, -10, 100, 40, 12);
    p.fill(255, 120, 70);
    p.rect(-30, -32, 50, 26, 10);
    p.fill(255, 255, 255, 200);
    p.rect(10, -32, 30, 22, 8);
    p.fill(80, 90, 110);
    p.rect(-45, 24, 30, 10, 6);
    p.rect(15, 24, 30, 10, 6);
    p.fill(255, 240, 220, 200);
    p.circle(55, -4, 16);
    p.pop();
  }

  function drawConfetti() {
    if (!complete) return;
    if (confetti.length < 120) {
      for (let i = 0; i < 40; i += 1) {
        confetti.push(createConfetti(p));
      }
    }
    p.push();
    p.noStroke();
    confetti.forEach(piece => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += 0.02;
      piece.angle += piece.spin;
      p.fill(piece.color);
      p.push();
      p.translate(piece.x, piece.y);
      p.rotate(piece.angle);
      p.rect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
      p.pop();
      if (piece.y > p.height + 40) {
        piece.y = p.random(-200, -50);
        piece.x = p.random(p.width * 0.2, p.width * 0.8);
      }
    });
    p.pop();
  }

  function drawSparkles() {
    p.push();
    p.noStroke();
    sparkles.forEach(star => {
      star.alpha += star.drift;
      if (star.alpha < 40 || star.alpha > 160) star.drift *= -1;
      p.fill(255, 255, 255, star.alpha);
      p.circle(star.x, star.y, star.r);
    });
    p.pop();
  }

  function handlePress() {
    if (cleaning || complete) return;
    const nextRow = cleanedRows.findIndex(row => !row);
    if (nextRow === -1) return;
    activeRow = nextRow;
    sweepProgress = 0;
    cleaning = true;
  }

  spawnSparkles();

  return {
    id: 'zamboni',
    enter() {
      cleanedRows.fill(false);
      activeRow = -1;
      sweepProgress = 0;
      cleaning = false;
      complete = false;
      celebrationStart = null;
      confetti.length = 0;
    },
    update(delta) {
      updateSweep(delta);
      if (complete && celebrationStart && p.millis() - celebrationStart > 6000) {
        celebrationStart = null;
      }
    },
    draw() {
      p.background(8, 22, 40);
      const area = drawRink();
      drawCleanedStripes(area);
      drawSparkles();
      drawZamboni(area);
      drawConfetti();
      p.push();
      p.fill(240, 248, 255, 230);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(Math.min(24, p.width * 0.028));
      p.text('Zamboni — Nettoie 5 pistes', p.width / 2, p.height * 0.1);
      if (complete) {
        p.textSize(Math.min(28, p.width * 0.032));
        p.text('Glace parfaite !', p.width / 2, p.height * 0.18);
      }
      p.pop();
    },
    handlePress,
    isComplete() {
      return complete;
    },
    resize() {
      spawnSparkles();
    }
  };
}
