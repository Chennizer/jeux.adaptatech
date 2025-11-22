const LEAF_COLORS = [
  [210, 120, 60],
  [186, 98, 44],
  [232, 168, 80],
  [152, 84, 56]
];

class Leaf {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(initial = false) {
    const p = this.p;
    this.x = initial ? p.random(p.width) : p.random(-40, p.width + 40);
    this.y = initial ? p.random(p.height) : p.random(-60, -20);
    this.size = p.random(14, 30);
    this.speed = p.random(0.7, 1.5);
    this.swing = p.random(0.6, 1.3);
    this.angle = p.random(p.TWO_PI);
    this.rotSpeed = p.random(-0.015, 0.015);
    this.color = p.random(LEAF_COLORS);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.angle += this.rotSpeed * multiplier;
    this.y += this.speed * 1.4 * multiplier;
    this.x += Math.sin(p.frameCount * 0.02 + this.y * 0.02) * this.swing * multiplier * 3;
    if (this.y > p.height + 30) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], 220);
    p.beginShape();
    p.vertex(-this.size * 0.4, 0);
    p.vertex(0, -this.size * 0.6);
    p.vertex(this.size * 0.5, 0);
    p.vertex(0, this.size * 0.8);
    p.endShape(p.CLOSE);
    p.stroke(255, 160);
    p.strokeWeight(1);
    p.line(0, -this.size * 0.55, 0, this.size * 0.7);
    p.pop();
  }
}

export function createAutumnScene(p) {
  const leaves = [];
  let hills;
  let speedMultiplier = 1;

  function ensureLeaves() {
    const target = Math.floor((p.width * p.height) * 0.00018);
    while (leaves.length < target) leaves.push(new Leaf(p));
    if (leaves.length > target) leaves.length = target;
  }

  function createHills() {
    hills = p.createGraphics(p.width, p.height);
    hills.noStroke();
    for (let i = 0; i < 3; i++) {
      const baseY = p.height * (0.55 + i * 0.12);
      const color = [34 - i * 4, 22 + i * 12, 12 + i * 18];
      hills.fill(color[0], color[1], color[2], 200);
      hills.beginShape();
      hills.vertex(0, p.height);
      for (let x = 0; x <= p.width; x += 8) {
        const offset = Math.sin((x * 0.004) + i) * 28 * (i + 1);
        hills.vertex(x, baseY - offset);
      }
      hills.vertex(p.width, p.height);
      hills.endShape(p.CLOSE);
    }
  }

  return {
    id: 'autumn',
    name: 'Automne',
    description: 'Feuilles rouges qui tourbillonnent',
    enter() {
      leaves.forEach(leaf => leaf.reset(true));
    },
    resize() {
      createHills();
      ensureLeaves();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      leaves.forEach(leaf => {
        leaf.rotSpeed *= 1.2;
      });
    },
    draw() {
      if (!hills || hills.width !== p.width || hills.height !== p.height) {
        createHills();
      }
      p.background(20, 9, 6);
      p.noStroke();
      p.fill(56, 26, 14, 180);
      p.rect(0, 0, p.width, p.height);
      p.image(hills, 0, 0, p.width, p.height);
      ensureLeaves();
      leaves.forEach(leaf => leaf.update(speedMultiplier));
      leaves.forEach(leaf => leaf.draw());
    }
  };
}
