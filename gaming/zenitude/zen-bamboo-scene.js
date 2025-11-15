class BambooStalk {
  constructor(p, x, height, segments, swaySpeed) {
    this.p = p;
    this.x = x;
    this.height = height;
    this.segments = segments;
    this.swaySpeed = swaySpeed;
    this.offset = p.random(p.TWO_PI);
  }

  draw(time, wind, speedMultiplier) {
    const p = this.p;
    const stemWidth = 16;
    const segmentHeight = this.height / this.segments;
    const sway = p.sin(time * this.swaySpeed + this.offset) * 22 * wind * speedMultiplier;

    p.noStroke();
    for (let i = 0; i < this.segments; i++) {
      const segmentY = p.height - (i + 1) * segmentHeight;
      const progress = i / Math.max(1, this.segments - 1);
      const bend = sway * Math.pow(progress, 1.4);
      const gradient = p.lerpColor(p.color(22, 84, 60), p.color(82, 160, 118), progress);
      p.fill(gradient);
      const xPos = this.x + bend;
      p.rect(xPos - stemWidth * 0.5, segmentY, stemWidth, segmentHeight + 2, 8);

      p.fill(18, 72, 52, 200);
      p.rect(xPos - stemWidth * 0.5, segmentY + segmentHeight - 4, stemWidth, 6, 4);
    }
  }
}

class BambooLeaf {
  constructor(p, rootX, rootY, length, angle, swayOffset) {
    this.p = p;
    this.rootX = rootX;
    this.rootY = rootY;
    this.length = length;
    this.angle = angle;
    this.swayOffset = swayOffset;
  }

  draw(time, wind, speedMultiplier) {
    const p = this.p;
    const sway = p.sin(time * 0.0018 + this.swayOffset) * 0.4 * wind * speedMultiplier;
    p.push();
    p.translate(this.rootX, this.rootY);
    p.rotate(this.angle + sway);
    const gradient = p.lerpColor(p.color(46, 160, 118, 180), p.color(120, 220, 176, 90), 0.5);
    p.noStroke();
    p.fill(gradient);
    p.beginShape();
    p.vertex(0, 0);
    p.bezierVertex(this.length * 0.2, -this.length * 0.2, this.length * 0.6, -this.length * 0.1, this.length, 0);
    p.bezierVertex(this.length * 0.6, this.length * 0.12, this.length * 0.2, this.length * 0.18, 0, 0);
    p.endShape(p.CLOSE);
    p.pop();
  }
}

export function createBambooScene(p) {
  let stalks = [];
  let leaves = [];
  let time = 0;
  let windTarget = 0.4;
  let wind = 0.4;
  let speedMultiplier = 1;

  function rebuildElements() {
    stalks = [];
    leaves = [];
    const count = Math.max(6, Math.floor(p.width / 160));
    for (let i = 0; i < count; i++) {
      const x = p.map(i, 0, count - 1, p.width * 0.05, p.width * 0.95);
      const height = p.random(p.height * 0.55, p.height * 0.82);
      const segments = Math.floor(p.random(6, 11));
      const swaySpeed = p.random(0.0012, 0.0018);
      const stalk = new BambooStalk(p, x, height, segments, swaySpeed);
      stalks.push(stalk);

      const leavesPerStalk = Math.floor(p.random(5, 8));
      for (let j = 0; j < leavesPerStalk; j++) {
        const segmentIndex = Math.floor(p.random(1, segments));
        const rootY = p.height - segmentIndex * (height / segments);
        const rootX = x + p.random(-6, 6);
        const length = p.random(48, 96);
        const angle = p.random(-p.PI / 3, -p.PI / 12);
        leaves.push(new BambooLeaf(p, rootX, rootY, length, angle, p.random(p.TWO_PI)));
      }
    }
  }

  return {
    id: 'bamboo',
    name: 'Forêt de bambous',
    description: 'Feuilles dans la brise du soir',
    enter() {
      rebuildElements();
      wind = windTarget = 0.4;
      time = 0;
    },
    resize() {
      rebuildElements();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      windTarget = 1.1;
    },
    draw() {
      time += 16 * speedMultiplier;
      wind = p.lerp(wind, windTarget, 0.02 * speedMultiplier);
      windTarget = p.lerp(windTarget, 0.4, 0.01 * speedMultiplier);

      const gradientSteps = 160;
      for (let i = 0; i < gradientSteps; i++) {
        const t = i / (gradientSteps - 1);
        const r = p.lerp(2, 10, t);
        const g = p.lerp(30, 60, t);
        const b = p.lerp(20, 46, t);
        p.noStroke();
        p.fill(r, g, b);
        p.rect(0, t * p.height, p.width, p.height / gradientSteps + 1);
      }

      p.noStroke();
      p.fill(12, 46, 34, 180);
      p.rect(0, p.height * 0.9, p.width, p.height * 0.12);

      stalks.forEach(stalk => {
        stalk.draw(time, wind, speedMultiplier);
      });

      leaves.forEach(leaf => {
        leaf.draw(time, wind, speedMultiplier);
      });

      p.noStroke();
      p.fill(0, 0, 0, 80);
      p.rect(0, p.height - 6, p.width, 12);
    }
  };
}
