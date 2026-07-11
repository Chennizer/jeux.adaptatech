function drawBacklitPanel(p, { topColor, bottomColor }) {
  p.push();
  for (let y = 0; y <= p.height; y++) {
    const t = y / Math.max(1, p.height);
    const c = p.lerpColor(topColor, bottomColor, t);
    p.stroke(c);
    p.line(0, y, p.width, y);
  }
  p.noStroke();
  p.fill(0, 90);
  p.rect(0, 0, p.width, p.height);
  p.pop();
}

function createFlake(p) {
  return {
    x: p.random(p.width * 0.05, p.width * 0.95),
    y: p.random(-p.height * 0.4, p.height * 0.9),
    size: p.random(2, 5),
    fall: p.random(0.35, 0.9),
    sway: p.random(0.5, 1.1),
    alpha: p.random(120, 210)
  };
}

function drawFlake(p, flake) {
  p.push();
  p.noStroke();
  p.fill(220, 240, 255, flake.alpha);
  p.circle(flake.x, flake.y, flake.size * 2);
  p.pop();
}

function createAuroraBand(p) {
  return {
    offset: p.random(-80, 80),
    height: p.random(120, 220),
    speed: p.random(0.0008, 0.0016),
    hue: p.random(160, 210)
  };
}

function drawAurora(p, band) {
  p.push();
  const gradient = p.drawingContext.createLinearGradient(0, 0, p.width, 0);
  const hue = band.hue + Math.sin(p.frameCount * 0.01) * 10;
  gradient.addColorStop(0, `hsla(${hue}, 70%, 70%, 0.04)`);
  gradient.addColorStop(0.5, `hsla(${hue + 20}, 80%, 82%, 0.12)`);
  gradient.addColorStop(1, `hsla(${hue + 40}, 70%, 72%, 0.05)`);
  p.noStroke();
  p.drawingContext.fillStyle = gradient;
  const y = p.height * 0.3 + Math.sin(p.frameCount * band.speed + band.offset) * 80;
  p.beginShape();
  p.vertex(0, y);
  p.bezierVertex(p.width * 0.25, y - band.height, p.width * 0.45, y + band.height * 0.4, p.width * 0.65, y);
  p.bezierVertex(p.width * 0.85, y - band.height * 0.6, p.width, y + band.height * 0.2, p.width, y + 20);
  p.vertex(p.width, y + band.height);
  p.vertex(0, y + band.height * 0.6);
  p.endShape(p.CLOSE);
  p.pop();
}

function drawMountainSilhouette(p) {
  p.push();
  p.noStroke();
  p.fill(8, 14, 24, 230);
  p.beginShape();
  p.vertex(0, p.height * 0.82);
  p.vertex(p.width * 0.25, p.height * 0.55);
  p.vertex(p.width * 0.45, p.height * 0.68);
  p.vertex(p.width * 0.6, p.height * 0.5);
  p.vertex(p.width * 0.78, p.height * 0.66);
  p.vertex(p.width, p.height * 0.56);
  p.vertex(p.width, p.height);
  p.vertex(0, p.height);
  p.endShape(p.CLOSE);
  p.pop();
}

export function createWinterShadow(p) {
  let flakes = [];
  let auroras = [];
  let paneColorTop;
  let paneColorBottom;

  function resize() {
    flakes = Array.from({ length: Math.max(140, Math.floor((p.width * p.height) * 0.0001)) }, () => createFlake(p));
    auroras = [createAuroraBand(p), createAuroraBand(p)];
    paneColorTop = p.color(10, 18, 32);
    paneColorBottom = p.color(4, 8, 16);
  }

  function drawSnow() {
    flakes.forEach(flake => {
      flake.y += flake.fall;
      flake.x += Math.sin(flake.y * 0.01) * flake.sway;
      if (flake.y > p.height * 0.98) {
        Object.assign(flake, createFlake(p));
        flake.y = -p.random(10, p.height * 0.4);
      }
      drawFlake(p, flake);
    });
  }

  function drawIdle() {
    p.background(6, 10, 18);
    drawBacklitPanel(p, { topColor: paneColorTop, bottomColor: paneColorBottom });
  }

  function draw() {
    drawBacklitPanel(p, { topColor: paneColorTop, bottomColor: paneColorBottom });
    auroras.forEach(band => drawAurora(p, band));
    drawMountainSilhouette(p);
    drawSnow();
    p.noStroke();
    p.fill(0, 110);
    p.rect(0, 0, p.width, p.height);
  }

  resize();

  return {
    id: 'winter',
    resize,
    enter: () => {
      flakes.forEach((_, idx) => { flakes[idx] = createFlake(p); });
    },
    draw,
    drawIdle
  };
}
