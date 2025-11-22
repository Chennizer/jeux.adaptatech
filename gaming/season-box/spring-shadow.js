const VIGNETTE_ALPHA = 90;

function drawBacklitPanel(p, { topColor, bottomColor }) {
  p.push();
  for (let y = 0; y <= p.height; y++) {
    const t = y / Math.max(1, p.height);
    const c = p.lerpColor(topColor, bottomColor, t);
    p.stroke(c);
    p.line(0, y, p.width, y);
  }
  p.noStroke();
  p.fill(0, 80);
  p.rect(0, 0, p.width, p.height);
  p.pop();
}

function drawVignette(p) {
  const g = p.drawingContext.createRadialGradient(
    p.width / 2,
    p.height * 0.45,
    Math.min(p.width, p.height) * 0.15,
    p.width / 2,
    p.height * 0.45,
    Math.max(p.width, p.height) * 0.65
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${VIGNETTE_ALPHA / 255})`);
  p.push();
  p.noStroke();
  p.drawingContext.fillStyle = g;
  p.rect(0, 0, p.width, p.height);
  p.pop();
}

function createPetal(p) {
  return {
    x: p.random(p.width * 0.2, p.width * 0.8),
    y: p.random(-p.height * 0.2, p.height * 0.7),
    size: p.random(10, 22),
    drift: p.random(0.4, 1.2),
    sway: p.random(0.6, 1.4),
    angle: p.random(p.TWO_PI)
  };
}

function drawPetal(p, petal) {
  p.push();
  p.translate(petal.x, petal.y);
  p.rotate(Math.sin((p.frameCount + petal.x) * 0.01) * 0.4);
  const glow = p.color(180, 220, 255, 140);
  p.fill(glow);
  p.noStroke();
  p.ellipse(0, 0, petal.size, petal.size * 0.6);
  p.pop();
}

function createBranchPoints(p) {
  const points = [];
  const segments = 7;
  const left = p.width * 0.18;
  const right = p.width * 0.82;
  const top = p.height * 0.25;
  const bottom = p.height * 0.7;
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const x = p.lerp(left, right, t) + p.noise(t * 2) * 60 - 30;
    const y = p.lerp(bottom, top, t) + p.noise(t * 2 + 9) * 40 - 20;
    points.push({ x, y });
  }
  return points;
}

export function createSpringShadow(p) {
  let petals = [];
  let branches = [];
  let paneColorTop;
  let paneColorBottom;

  function resize() {
    petals = Array.from({ length: Math.max(40, Math.floor((p.width * p.height) * 0.00005)) }, () => createPetal(p));
    branches = createBranchPoints(p);
    paneColorTop = p.color(54, 92, 126);
    paneColorBottom = p.color(20, 38, 60);
  }

  function drawBranches() {
    p.push();
    p.noFill();
    p.stroke(10, 18, 28, 200);
    p.strokeWeight(28);
    p.beginShape();
    branches.forEach(pt => p.curveVertex(pt.x, pt.y));
    p.endShape();

    p.stroke(12, 26, 38, 230);
    p.strokeWeight(12);
    p.beginShape();
    branches.forEach(pt => p.curveVertex(pt.x + 8, pt.y + 6));
    p.endShape();
    p.pop();
  }

  function drawBlossoms() {
    petals.forEach(petal => {
      petal.y += petal.drift;
      petal.x += Math.sin(petal.y * 0.01) * petal.sway;
      if (petal.y > p.height * 0.95) {
        Object.assign(petal, createPetal(p));
        petal.y = -p.random(40, p.height * 0.2);
      }
      drawPetal(p, petal);
    });
  }

  function drawIdle() {
    p.background(8, 12, 20);
    drawBacklitPanel(p, { topColor: paneColorTop, bottomColor: paneColorBottom });
    drawVignette(p);
  }

  function draw() {
    drawBacklitPanel(p, { topColor: paneColorTop, bottomColor: paneColorBottom });
    drawBranches();
    drawBlossoms();
    drawVignette(p);
  }

  resize();

  return {
    id: 'spring',
    resize,
    enter: () => {
      petals.forEach((_, idx) => {
        petals[idx] = createPetal(p);
        petals[idx].y = p.random(-p.height * 0.4, p.height * 0.6);
      });
    },
    draw,
    drawIdle
  };
}
