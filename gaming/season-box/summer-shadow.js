function drawBacklitPanel(p, { topColor, bottomColor }) {
  p.push();
  for (let y = 0; y <= p.height; y++) {
    const t = y / Math.max(1, p.height);
    const c = p.lerpColor(topColor, bottomColor, t);
    p.stroke(c);
    p.line(0, y, p.width, y);
  }
  p.noStroke();
  p.fill(0, 70);
  p.rect(0, 0, p.width, p.height);
  p.pop();
}

function createRipple(p) {
  return {
    x: p.random(p.width * 0.3, p.width * 0.7),
    y: p.random(p.height * 0.25, p.height * 0.7),
    radius: p.random(80, 200),
    phase: p.random(p.TWO_PI),
    weight: p.random(2, 6),
    alpha: p.random(120, 200)
  };
}

function drawShimmer(p, ripple) {
  const sway = Math.sin(p.frameCount * 0.01 + ripple.phase) * 12;
  const radius = ripple.radius + Math.sin(p.frameCount * 0.02 + ripple.phase) * 8;
  p.push();
  p.noFill();
  p.stroke(240, 205, 120, ripple.alpha);
  p.strokeWeight(ripple.weight);
  p.ellipse(ripple.x + sway, ripple.y + sway * 0.4, radius * 2.2, radius * 1.6);
  p.pop();
}

function createCicada(p) {
  return {
    x: p.random(p.width),
    y: p.random(p.height * 0.15, p.height * 0.45),
    drift: p.random(0.3, 0.6),
    phase: p.random(p.TWO_PI)
  };
}

function drawHeatHaze(p) {
  const g = p.drawingContext.createLinearGradient(0, 0, 0, p.height);
  g.addColorStop(0, 'rgba(255, 222, 150, 0.12)');
  g.addColorStop(1, 'rgba(255, 130, 90, 0.04)');
  p.push();
  p.noStroke();
  p.drawingContext.fillStyle = g;
  p.rect(0, 0, p.width, p.height);
  p.pop();
}

export function createSummerShadow(p) {
  let ripples = [];
  let cicadas = [];
  let paneColorTop;
  let paneColorBottom;

  function resize() {
    ripples = Array.from({ length: 6 }, () => createRipple(p));
    cicadas = Array.from({ length: 30 }, () => createCicada(p));
    paneColorTop = p.color(68, 33, 24);
    paneColorBottom = p.color(122, 69, 32);
  }

  function drawPalmShadows() {
    p.push();
    p.stroke(8, 6, 6, 190);
    p.strokeWeight(28);
    p.noFill();
    const midX = p.width / 2;
    const baseY = p.height * 0.82;
    p.bezier(midX - 220, baseY, midX - 120, baseY - 60, midX - 40, baseY - 180, midX, baseY - 220);
    p.bezier(midX + 180, baseY, midX + 90, baseY - 40, midX + 20, baseY - 160, midX - 40, baseY - 200);
    p.stroke(18, 14, 10, 220);
    p.strokeWeight(12);
    for (let i = -4; i <= 4; i++) {
      const len = 140 + Math.abs(i) * 18;
      const angle = p.radians(-70 + i * 12);
      p.push();
      p.translate(midX - 32, baseY - 230);
      p.rotate(angle);
      p.line(0, 0, len, 0);
      p.pop();
    }
    p.pop();
  }

  function drawCicadas() {
    p.push();
    cicadas.forEach(cicada => {
      cicada.x += Math.sin(p.frameCount * 0.005 + cicada.phase) * 0.4;
      cicada.y += cicada.drift * Math.sin(p.frameCount * 0.01 + cicada.phase);
      const wing = 22 + Math.sin(p.frameCount * 0.2 + cicada.phase) * 6;
      p.noStroke();
      p.fill(250, 220, 140, 90);
      p.ellipse(cicada.x, cicada.y, wing * 0.9, wing * 0.32);
      p.fill(255, 245, 200, 140);
      p.ellipse(cicada.x + 10, cicada.y - 2, wing, wing * 0.35);
    });
    p.pop();
  }

  function drawIdle() {
    p.background(18, 10, 6);
    drawBacklitPanel(p, { topColor: paneColorTop, bottomColor: paneColorBottom });
  }

  function draw() {
    drawBacklitPanel(p, { topColor: paneColorTop, bottomColor: paneColorBottom });
    drawHeatHaze(p);
    ripples.forEach(r => drawShimmer(p, r));
    drawPalmShadows();
    drawCicadas();
    p.noStroke();
    p.fill(0, 60);
    p.rect(0, 0, p.width, p.height);
  }

  resize();

  return {
    id: 'summer',
    resize,
    enter: () => {
      ripples.forEach((_, idx) => { ripples[idx] = createRipple(p); });
      cicadas.forEach((_, idx) => { cicadas[idx] = createCicada(p); });
    },
    draw,
    drawIdle
  };
}
