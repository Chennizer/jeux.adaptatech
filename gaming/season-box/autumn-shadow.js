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

function createLeaf(p) {
  return {
    x: p.random(p.width * 0.1, p.width * 0.9),
    y: p.random(-p.height * 0.3, p.height * 0.5),
    size: p.random(16, 34),
    angle: p.random(p.TWO_PI),
    fallSpeed: p.random(0.5, 1.2),
    sway: p.random(0.5, 1.6),
    tint: p.color(200 + p.random(-20, 30), 120 + p.random(-10, 20), 30 + p.random(-10, 20), 150)
  };
}

function drawLeaf(p, leaf) {
  p.push();
  p.translate(leaf.x, leaf.y);
  p.rotate(leaf.angle + Math.sin(p.frameCount * 0.02 + leaf.x * 0.001) * 0.6);
  p.noStroke();
  p.fill(leaf.tint);
  p.beginShape();
  p.vertex(0, -leaf.size * 0.6);
  p.bezierVertex(leaf.size * 0.4, -leaf.size * 0.3, leaf.size * 0.6, leaf.size * 0.3, 0, leaf.size * 0.7);
  p.bezierVertex(-leaf.size * 0.6, leaf.size * 0.3, -leaf.size * 0.4, -leaf.size * 0.3, 0, -leaf.size * 0.6);
  p.endShape(p.CLOSE);
  p.pop();
}

function createTree(p, x, baseY) {
  const points = [];
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const y = p.lerp(baseY, p.height * 0.28, t);
    const xOffset = Math.sin(t * 3) * 80 + p.noise(t * 2 + x * 0.01) * 60 - 30;
    points.push({ x: x + xOffset, y });
  }
  return points;
}

export function createAutumnShadow(p) {
  let leaves = [];
  let trunks = [];
  let paneColorTop;
  let paneColorBottom;

  function resize() {
    leaves = Array.from({ length: Math.max(60, Math.floor((p.width * p.height) * 0.00007)) }, () => createLeaf(p));
    const baseY = p.height * 0.9;
    trunks = [
      createTree(p, p.width * 0.32, baseY),
      createTree(p, p.width * 0.65, baseY)
    ];
    paneColorTop = p.color(36, 20, 14);
    paneColorBottom = p.color(80, 40, 16);
  }

  function drawTrees() {
    p.push();
    trunks.forEach(branches => {
      p.stroke(16, 10, 8, 210);
      p.strokeWeight(30);
      p.noFill();
      p.beginShape();
      branches.forEach(pt => p.curveVertex(pt.x, pt.y));
      p.endShape();

      p.stroke(22, 12, 8, 230);
      p.strokeWeight(14);
      p.beginShape();
      branches.forEach(pt => p.curveVertex(pt.x + 6, pt.y + 4));
      p.endShape();
    });
    p.pop();
  }

  function drawLeaves() {
    leaves.forEach(leaf => {
      leaf.y += leaf.fallSpeed + Math.sin(p.frameCount * 0.01 + leaf.x * 0.003) * 0.3;
      leaf.x += Math.sin(leaf.y * 0.01) * leaf.sway;
      if (leaf.y > p.height * 0.96) {
        Object.assign(leaf, createLeaf(p));
        leaf.y = -p.random(20, p.height * 0.3);
      }
      drawLeaf(p, leaf);
    });
  }

  function drawIdle() {
    p.background(12, 8, 6);
    drawBacklitPanel(p, { topColor: paneColorTop, bottomColor: paneColorBottom });
  }

  function draw() {
    drawBacklitPanel(p, { topColor: paneColorTop, bottomColor: paneColorBottom });
    drawTrees();
    drawLeaves();
    p.noStroke();
    p.fill(0, 80);
    p.rect(0, 0, p.width, p.height);
  }

  resize();

  return {
    id: 'autumn',
    resize,
    enter: () => {
      leaves.forEach((_, idx) => { leaves[idx] = createLeaf(p); });
    },
    draw,
    drawIdle
  };
}
