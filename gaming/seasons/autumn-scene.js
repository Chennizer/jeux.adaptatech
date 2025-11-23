class Leaf {
  constructor(p, palette) {
    this.p = p;
    this.palette = palette;
  }

  reset(groundY, settleBandTop = groundY) {
    const p = this.p;
    this.x = p.random(-p.width * 0.1, p.width * 1.1);
    this.y = p.random(-p.height * 0.2, -10);
    this.size = p.random(12, 26);
    this.rotation = p.random(p.TWO_PI);
    this.spin = p.random(-0.02, 0.02);
    this.speed = p.random(0.6, 1.2);
    this.sway = p.random(0.6, 1.4);
    this.color = p.color(this.palette[p.floor(p.random(this.palette.length))]);
    const bandBottom = this.p.height - this.size * 0.5;
    this.settleY = this.p.random(settleBandTop, bandBottom);
  }

  update(multiplier, groundY, landedLeaves, settleBandTop) {
    const p = this.p;
    this.rotation += this.spin * multiplier;
    this.x += Math.sin(this.rotation * 1.2) * this.sway * multiplier;
    this.y += this.speed * 1.7 * multiplier;

    const settleY = Math.min(Math.max(this.settleY, settleBandTop), p.height - this.size * 0.25);
    if (this.y >= settleY) {
      landedLeaves.push({
        x: this.x,
        y: settleY,
        size: this.size,
        rotation: this.rotation,
        color: this.color
      });
      this.reset(groundY, settleBandTop);
      this.y = -this.size;
    } else if (this.y > p.height + this.size) {
      this.reset(groundY, settleBandTop);
      this.y = -this.size;
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    p.noStroke();
    p.fill(this.color);
    p.beginShape();
    p.vertex(0, -this.size * 0.6);
    p.bezierVertex(this.size * 0.6, -this.size * 0.4, this.size * 0.8, this.size * 0.4, 0, this.size * 0.8);
    p.bezierVertex(-this.size * 0.8, this.size * 0.4, -this.size * 0.6, -this.size * 0.4, 0, -this.size * 0.6);
    p.endShape(p.CLOSE);
    p.pop();
  }
}

export function createAutumnScene(p) {
  const leaves = [];
  const landedLeaves = [];
  const trunks = [];
  let groundY = 0;
  let settleBandTop = 0;
  let speedMultiplier = 1;
  let pulse = 0;

  function resize() {
    leaves.length = 0;
    landedLeaves.length = 0;
    trunks.length = 0;
    const palette = [
      [255, 196, 112],
      [227, 133, 66],
      [189, 90, 53],
      [255, 229, 180]
    ];

    groundY = p.height * 0.82;
    const groundHeight = p.height - groundY;
    settleBandTop = groundY - groundHeight * 0.9;

    const count = Math.floor(Math.max(50, (p.width * p.height) / 13000));
    for (let i = 0; i < count; i += 1) {
      const leaf = new Leaf(p, palette);
      leaf.reset(groundY, settleBandTop);
      leaves.push(leaf);
    }

    const trunkCount = Math.max(3, Math.floor(p.width / 200));
    for (let i = 0; i < trunkCount; i += 1) {
      const x = p.random(-20, p.width + 20);
      const width = p.random(14, 32);
      const height = p.random(p.height * 0.9, p.height * 1.5);
      trunks.push({ x, width, height, baseY: groundY });
    }
  }

  function drawLeafShape({ x, y, size, rotation, color }) {
    p.push();
    p.translate(x, y);
    p.rotate(rotation);
    p.noStroke();
    p.fill(color);
    p.beginShape();
    p.vertex(0, -size * 0.6);
    p.bezierVertex(size * 0.6, -size * 0.4, size * 0.8, size * 0.4, 0, size * 0.8);
    p.bezierVertex(-size * 0.8, size * 0.4, -size * 0.6, -size * 0.4, 0, -size * 0.6);
    p.endShape(p.CLOSE);
    p.pop();
  }

  return {
    id: 'autumn',
    name: 'Automne',
    description: 'Feuilles dorées et brise fraîche',
    resize,
    enter() {
      pulse = 1;
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      pulse = 1.2;
    },
    draw() {
      const fog = Math.max(0, pulse - 0.02);
      pulse = p.lerp(pulse, 0, 0.01 * speedMultiplier);
      const ctx = p.drawingContext;
      const skyGradient = ctx.createLinearGradient(0, 0, 0, p.height);
      skyGradient.addColorStop(0, 'rgba(70, 44, 27, 1)');
      skyGradient.addColorStop(1, 'rgba(142, 94, 62, 1)');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, p.width, p.height);

      if (fog > 0.01) {
        p.noStroke();
        p.fill(255, 210, 170, 80 * fog);
        p.rect(0, 0, p.width, p.height);
      }

      trunks.forEach(trunk => {
        const gradient = ctx.createLinearGradient(trunk.x, trunk.baseY - trunk.height, trunk.x, trunk.baseY + 10);
        gradient.addColorStop(0, 'rgba(32, 20, 12, 0.5)');
        gradient.addColorStop(1, 'rgba(54, 34, 18, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(trunk.x, trunk.baseY - trunk.height, trunk.width, trunk.height + 12);
      });

      p.noStroke();
      p.fill(64, 42, 24);
      p.rect(0, groundY, p.width, p.height * 0.2);
      p.fill(118, 78, 41);
      p.beginShape();
      p.vertex(-20, p.height);
      for (let x = -20; x <= p.width + 20; x += 18) {
        const elevation = p.noise(x * 0.002, 0.5) * p.height * 0.05;
        p.vertex(x, groundY - elevation);
      }
      p.vertex(p.width + 20, p.height);
      p.endShape(p.CLOSE);

      leaves.forEach(leaf => {
        leaf.update(speedMultiplier, groundY, landedLeaves, settleBandTop);
        leaf.draw();
      });

      landedLeaves.forEach(leaf => drawLeafShape(leaf));
    }
  };
}
