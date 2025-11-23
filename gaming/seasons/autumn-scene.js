class Leaf {
  constructor(p, palette) {
    this.p = p;
    this.palette = palette;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-p.width * 0.1, p.width * 1.1);
    this.y = p.random(-p.height * 0.2, -10);
    this.size = p.random(12, 26);
    this.rotation = p.random(p.TWO_PI);
    this.spin = p.random(-0.02, 0.02);
    this.speed = p.random(0.6, 1.2);
    this.sway = p.random(0.6, 1.4);
    this.color = p.color(this.palette[p.floor(p.random(this.palette.length))]);
  }

  update(multiplier, groundY, settledLeaves) {
    const p = this.p;
    this.rotation += this.spin * multiplier;
    this.x += Math.sin(this.rotation * 1.2) * this.sway * multiplier;
    this.y += this.speed * 1.7 * multiplier;
    const groundLevel = groundY(this.x);
    if (this.y + this.size * 0.6 >= groundLevel) {
      this.y = groundLevel;
      settledLeaves.push({
        x: this.x,
        y: groundLevel,
        rotation: this.rotation + p.random(-0.2, 0.2),
        size: this.size,
        color: this.color
      });
      if (settledLeaves.length > 400) {
        settledLeaves.shift();
      }
      this.reset();
      this.y = -this.size;
    } else if (this.y > p.height + this.size) {
      this.reset();
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
  const settledLeaves = [];
  const trunks = [];
  let speedMultiplier = 1;
  let pulse = 0;
  let groundNoiseSeed = 0;

  function resize() {
    leaves.length = 0;
    settledLeaves.length = 0;
    trunks.length = 0;
    groundNoiseSeed = p.random(0, 1000);
    const palette = [
      [255, 196, 112],
      [227, 133, 66],
      [189, 90, 53],
      [255, 229, 180]
    ];
    const count = Math.floor(Math.max(50, (p.width * p.height) / 13000));
    for (let i = 0; i < count; i += 1) {
      leaves.push(new Leaf(p, palette));
    }

    const trunkCount = Math.max(3, Math.floor(p.width / 180));
    for (let i = 0; i < trunkCount; i += 1) {
      trunks.push({
        x: p.random(-40, p.width + 40),
        width: p.random(24, 52),
        lean: p.random(-0.12, 0.12),
        height: p.random(p.height * 1.1, p.height * 1.5)
      });
    }
  }

  const groundY = x => {
    const elevation = p.noise(x * 0.002, groundNoiseSeed) * p.height * 0.05;
    return p.height * 0.82 - elevation;
  };

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

      trunks.forEach(trunk => {
        const baseY = groundY(trunk.x);
        const topY = baseY - trunk.height;
        p.push();
        p.translate(trunk.x, baseY);
        p.rotate(trunk.lean);
        p.noStroke();
        p.fill(46, 32, 20, 180);
        p.beginShape();
        const wobble = trunk.width * 0.3;
        p.vertex(-trunk.width * 0.5 - wobble * 0.3, 0);
        p.vertex(trunk.width * 0.5 + wobble * 0.2, 0);
        p.vertex(trunk.width * 0.3, topY);
        p.vertex(-trunk.width * 0.3, topY);
        p.endShape(p.CLOSE);
        p.pop();
      });

      if (fog > 0.01) {
        p.noStroke();
        p.fill(255, 210, 170, 80 * fog);
        p.rect(0, 0, p.width, p.height);
      }

      p.noStroke();
      p.fill(64, 42, 24);
      p.rect(0, p.height * 0.82, p.width, p.height * 0.2);
      p.fill(118, 78, 41);
      p.beginShape();
      p.vertex(-20, p.height);
      for (let x = -20; x <= p.width + 20; x += 18) {
        p.vertex(x, groundY(x));
      }
      p.vertex(p.width + 20, p.height);
      p.endShape(p.CLOSE);

      settledLeaves.forEach(({ x, y, rotation, size, color }) => {
        p.push();
        p.translate(x, y);
        p.rotate(rotation);
        p.noStroke();
        p.fill(color.levels[0], color.levels[1], color.levels[2], 220);
        p.beginShape();
        p.vertex(0, -size * 0.6);
        p.bezierVertex(size * 0.6, -size * 0.4, size * 0.8, size * 0.4, 0, size * 0.8);
        p.bezierVertex(-size * 0.8, size * 0.4, -size * 0.6, -size * 0.4, 0, -size * 0.6);
        p.endShape(p.CLOSE);
        p.pop();
      });

      leaves.forEach(leaf => {
        leaf.update(speedMultiplier, groundY, settledLeaves);
        leaf.draw();
      });
    }
  };
}
