export function createAutumnScene(p) {
  const leaves = [];
  let gustTimer = 0;

  function resetLeaves() {
    leaves.length = 0;
    const count = Math.max(50, Math.floor((p.width + p.height) / 18));
    for (let i = 0; i < count; i += 1) {
      leaves.push({
        x: p.random(-p.width * 0.1, p.width * 1.1),
        y: p.random(-p.height * 0.2, p.height * 1.1),
        size: p.random(10, 28),
        speed: p.random(0.7, 1.8),
        drift: p.random(0.6, 1.4),
        rotation: p.random(p.TWO_PI),
        tumble: p.random(0.01, 0.025)
      });
    }
  }

  function drawBackdrop() {
    const top = p.color(46, 20, 10);
    const bottom = p.color(14, 8, 6);
    for (let y = 0; y < p.height; y += 2) {
      const t = y / p.height;
      const c = p.lerpColor(top, bottom, t);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }
    p.noStroke();
    p.fill(20, 10, 6, 160);
    p.rect(p.width / 2, p.height / 2, p.width, p.height, 42);
  }

  function drawForeground() {
    p.noStroke();
    p.fill(16, 10, 8, 220);
    p.rect(p.width / 2, p.height * 0.82, p.width, p.height * 0.4);

    p.push();
    p.translate(p.width * 0.15, p.height * 0.6);
    p.stroke(20, 14, 12);
    p.strokeWeight(30);
    p.line(0, p.height * 0.25, p.width * 0.7, -p.height * 0.05);
    p.strokeWeight(12);
    p.line(p.width * 0.35, p.height * 0.08, p.width * 0.55, -p.height * 0.1);
    p.line(p.width * 0.25, p.height * 0.12, p.width * 0.45, -p.height * 0.04);
    p.pop();
  }

  function drawLeaves() {
    leaves.forEach(leaf => {
      const wobble = Math.sin(leaf.y * 0.01 + gustTimer * 0.03) * 12 * leaf.drift;
      const x = leaf.x + wobble + Math.sin(gustTimer * 0.005) * 10;
      const y = leaf.y;
      p.push();
      p.translate(x, y);
      p.rotate(leaf.rotation);
      const color = p.lerpColor(p.color(240, 160, 80, 210), p.color(180, 90, 40, 210), Math.random());
      p.noStroke();
      p.fill(color);
      p.beginShape();
      p.vertex(-leaf.size * 0.6, 0);
      p.vertex(0, -leaf.size * 0.4);
      p.vertex(leaf.size * 0.7, 0);
      p.vertex(0, leaf.size * 0.5);
      p.endShape(p.CLOSE);
      p.pop();

      leaf.y += leaf.speed;
      leaf.x += leaf.drift;
      leaf.rotation += leaf.tumble;

      if (leaf.y > p.height + 20) {
        leaf.y = -20;
        leaf.x = p.random(-p.width * 0.1, p.width * 1.1);
      }
    });
  }

  return {
    id: 'autumn',
    enter() {
      resetLeaves();
      gustTimer = 0;
    },
    draw() {
      gustTimer += 1;
      drawBackdrop();
      drawForeground();
      drawLeaves();
      p.noStroke();
      p.fill(140, 80, 40, 28);
      p.rect(p.width / 2, p.height / 2, p.width * 0.84, p.height * 0.84, 26);
    },
    resize() {
      resetLeaves();
    }
  };
}
