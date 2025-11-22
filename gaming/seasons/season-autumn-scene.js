const LEAF_COLORS = [
  [214, 115, 64],
  [236, 156, 74],
  [168, 86, 42],
  [190, 122, 80],
  [222, 138, 98]
];

class Leaf {
  constructor(p, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
    this.reset(true);
  }

  reset(forceY = false) {
    const p = this.p;
    this.x = p.random(-this.width * 0.1, this.width * 1.1);
    this.y = forceY ? p.random(-this.height, this.height) : p.random(-this.height, -30);
    this.speed = p.random(0.6, 1.4);
    this.swing = p.random(20, 60);
    this.size = p.random(12, 26);
    this.rotation = p.random(360);
    this.rotationSpeed = p.random(-1, 1);
    this.color = p.random(LEAF_COLORS);
  }

  step(multiplier = 1) {
    const p = this.p;
    this.y += this.speed * 1.4 * multiplier;
    this.x += Math.sin(p.radians(this.rotation)) * 0.8 * multiplier;
    this.rotation += this.rotationSpeed * multiplier;
    if (this.y > this.height + 40) {
      this.reset();
    }
  }

  draw(glow = 0) {
    const p = this.p;
    p.push();
    p.translate(this.x + Math.sin(p.frameCount * 0.01) * this.swing * 0.05, this.y);
    p.rotate(p.radians(this.rotation));
    p.noStroke();
    const [r, g, b] = this.color;
    p.fill(r + glow * 40, g + glow * 20, b, 220);
    p.beginShape();
    p.vertex(-this.size * 0.6, 0);
    p.bezierVertex(-this.size * 0.6, -this.size * 0.6, this.size * 0.6, -this.size * 0.6, this.size * 0.6, 0);
    p.bezierVertex(this.size * 0.6, this.size * 0.6, -this.size * 0.6, this.size * 0.6, -this.size * 0.6, 0);
    p.endShape(p.CLOSE);
    p.pop();
  }
}

export function createAutumnScene(p) {
  let leaves = [];
  let speedMultiplier = 1;
  let glow = 0;

  function populate() {
    const count = Math.floor((p.width * p.height) / 13000);
    leaves = Array.from({ length: count }, () => new Leaf(p, p.width, p.height));
  }

  function resize() {
    populate();
  }

  populate();

  return {
    id: 'autumn',
    name: 'Vent d\'ambre',
    description: 'Feuilles ambrées qui tourbillonnent',
    enter() {
      glow = 1;
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      glow = 1.2;
    },
    draw() {
      const top = p.color(44, 24, 12);
      const mid = p.color(92, 46, 20);
      const bottom = p.color(138, 70, 28);
      for (let y = 0; y <= p.height; y++) {
        const t = y / Math.max(1, p.height);
        const c = t < 0.5 ? p.lerpColor(top, mid, t * 2) : p.lerpColor(mid, bottom, (t - 0.5) * 2);
        p.stroke(c);
        p.line(0, y, p.width, y);
      }

      glow = p.lerp(glow, 0, 0.025);
      leaves.forEach(leaf => {
        leaf.step(speedMultiplier);
        leaf.draw(glow);
      });

      p.noStroke();
      p.fill(255, 195, 120, 25 + glow * 20);
      p.rect(0, 0, p.width, p.height);
    }
  };
}
