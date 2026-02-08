const lerp = (a, b, t) => a + (b - a) * t;

export function createZamboniGame(p) {
  let rows = 6;
  let currentRow = 0;
  let direction = 1;
  let zamboniX = 0;
  let zamboniY = 0;
  let moving = false;
  let cleanedRows = [];
  let complete = false;
  let celebrationStart = null;
  let glints = [];

  const reset = () => {
    rows = 6;
    currentRow = 0;
    direction = 1;
    zamboniX = direction === 1 ? p.width * 0.2 : p.width * 0.8;
    zamboniY = p.height * 0.25;
    moving = false;
    cleanedRows = new Array(rows).fill(0);
    complete = false;
    celebrationStart = null;
    glints = Array.from({ length: 120 }, () => ({
      x: Math.random() * p.width,
      y: Math.random() * p.height,
      r: 1 + Math.random() * 2,
      a: Math.random() * Math.PI * 2
    }));
  };

  const onPress = () => {
    if (complete || moving) return;
    if (currentRow >= rows) return;
    moving = true;
  };

  const updateMovement = () => {
    if (!moving) return;
    const targetX = direction === 1 ? p.width * 0.82 : p.width * 0.18;
    zamboniX = lerp(zamboniX, targetX, 0.025);
    if (Math.abs(zamboniX - targetX) < 2) {
      zamboniX = targetX;
      cleanedRows[currentRow] = 1;
      moving = false;
      currentRow += 1;
      direction *= -1;
      if (currentRow < rows) {
        zamboniX = direction === 1 ? p.width * 0.18 : p.width * 0.82;
      }
      if (currentRow >= rows) {
        celebrationStart = performance.now();
      }
    }
  };

  const drawIce = () => {
    p.background(190, 220, 255);
    for (let i = 0; i < 40; i += 1) {
      const t = i / 39;
      p.noStroke();
      p.fill(180 + t * 20, 210 + t * 30, 250, 90);
      p.rect(0, t * p.height, p.width, p.height / 40 + 1);
    }
    glints.forEach(glint => {
      glint.a += 0.02;
      const shimmer = 0.5 + Math.sin(glint.a) * 0.5;
      p.noStroke();
      p.fill(255, 255, 255, 120 * shimmer);
      p.circle(glint.x, glint.y, glint.r + shimmer * 2);
    });
  };

  const drawRink = () => {
    const rink = {
      x: p.width * 0.12,
      y: p.height * 0.18,
      w: p.width * 0.76,
      h: p.height * 0.64
    };
    p.noFill();
    p.stroke(255, 255, 255, 200);
    p.strokeWeight(6);
    p.rect(rink.x, rink.y, rink.w, rink.h, 30);
    p.stroke(120, 160, 210, 120);
    p.strokeWeight(2);
    for (let i = 1; i < rows; i += 1) {
      const y = rink.y + (rink.h / rows) * i;
      p.line(rink.x + 10, y, rink.x + rink.w - 10, y);
    }
    return rink;
  };

  const drawCleaned = rink => {
    p.noStroke();
    cleanedRows.forEach((val, index) => {
      if (!val) return;
      const rowHeight = rink.h / rows;
      const y = rink.y + index * rowHeight;
      p.fill(230, 245, 255, 150);
      p.rect(rink.x + 6, y + 4, rink.w - 12, rowHeight - 8, 18);
    });
  };

  const drawZamboni = rink => {
    const rowHeight = rink.h / rows;
    const rowY = rink.y + currentRow * rowHeight + rowHeight * 0.5;
    zamboniY = lerp(zamboniY, rowY, 0.08);
    const size = Math.min(rink.w, rink.h) * 0.08;
    p.push();
    p.translate(zamboniX, zamboniY);
    p.noStroke();
    p.fill(230, 80, 80);
    p.rect(-size * 0.6, -size * 0.35, size * 1.2, size * 0.7, 12);
    p.fill(255, 220, 220);
    p.rect(-size * 0.2, -size * 0.45, size * 0.4, size * 0.3, 8);
    p.fill(30, 40, 60);
    p.rect(-size * 0.65, size * 0.15, size * 1.3, size * 0.2, 6);
    p.fill(255, 245, 200, 200);
    p.ellipse(size * 0.55, 0, size * 0.25, size * 0.2);
    p.pop();
  };

  const drawCrowd = () => {
    const baseY = p.height * 0.08;
    for (let i = 0; i < 10; i += 1) {
      const t = i / 9;
      p.noStroke();
      p.fill(20 + t * 20, 30 + t * 20, 50 + t * 30, 160);
      p.rect(0, baseY + t * 18, p.width, 20);
    }
    p.fill(255, 255, 255, 120);
    for (let i = 0; i < 120; i += 1) {
      p.circle(Math.random() * p.width, baseY + Math.random() * 160, 2 + Math.random() * 3);
    }
  };

  const drawText = () => {
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont('Nunito');
    p.textSize(Math.min(p.width, p.height) * 0.032);
    p.fill(40, 60, 90, 200);
    p.text('Zamboni', p.width * 0.5, p.height * 0.12);
  };

  const drawCelebration = () => {
    if (!celebrationStart) return;
    const elapsed = performance.now() - celebrationStart;
    const glow = p.constrain(elapsed / 2400, 0, 1);
    p.noStroke();
    p.fill(255, 255, 255, 120 * glow);
    p.ellipse(p.width * 0.5, p.height * 0.5, p.width * 0.9, p.height * 0.6);
    if (elapsed > 3200) {
      complete = true;
    }
  };

  const draw = () => {
    updateMovement();
    drawIce();
    drawCrowd();
    const rink = drawRink();
    drawCleaned(rink);
    drawZamboni(rink);
    drawCelebration();
    drawText();
  };

  const resize = () => {
    reset();
  };

  const enter = () => {
    reset();
  };

  const isComplete = () => complete;

  return {
    id: 'zamboni',
    enter,
    draw,
    onPress,
    resize,
    isComplete
  };
}
