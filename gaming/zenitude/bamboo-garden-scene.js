class BambooStalk {
  constructor(p, index, total) {
    this.p = p;
    this.index = index;
    this.total = total;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.map(this.index, 0, this.total - 1, p.width * 0.1, p.width * 0.9) + p.random(-16, 16);
    this.height = p.random(p.height * 0.55, p.height * 0.9);
    this.width = p.random(14, 24);
    this.swayOffset = p.random(p.TAU);
    this.swaySpeed = p.random(0.002, 0.0032);
    this.leaves = Array.from({ length: p.floor(p.random(4, 7)) }, () => ({
      offsetY: p.random(40, this.height - 40),
      length: p.random(36, 72),
      spread: p.random(16, 32),
      flip: p.random([1, -1]),
      phase: p.random(p.TAU)
    }));
  }

  draw(speedMultiplier = 1, pulseOffset = 0) {
    const p = this.p;
    const sway = p.sin(p.frameCount * this.swaySpeed * speedMultiplier + this.swayOffset + pulseOffset) * 18;
    const baseX = this.x + sway;
    const topY = p.height - this.height;

    p.strokeWeight(this.width);
    p.stroke(60, 130, 90, 220);
    p.line(baseX, p.height, baseX, topY);

    this.leaves.forEach(leaf => {
      const leafSway = p.sin((p.frameCount * this.swaySpeed * 0.8 + leaf.phase) * speedMultiplier + pulseOffset) * leaf.spread * 0.4;
      p.strokeWeight(3);
      p.stroke(112, 200, 132, 220);
      p.noFill();
      const startX = baseX;
      const startY = p.height - leaf.offsetY;
      const endX = baseX + leaf.flip * (leaf.spread + leafSway);
      const endY = startY - leaf.length;
      p.beginShape();
      p.curveVertex(startX, startY);
      p.curveVertex(startX, startY);
      p.curveVertex(p.lerp(startX, endX, 0.5), startY - leaf.length * 0.2);
      p.curveVertex(endX, endY);
      p.curveVertex(endX, endY);
      p.endShape();
    });
  }
}

class Firefly {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height * 0.3, p.height * 0.8);
    this.speed = p.random(0.3, 0.6);
    this.angle = p.random(p.TAU);
    this.alpha = p.random(40, 80);
    this.radius = p.random(2, 3.5);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    this.angle += 0.012 * speedMultiplier;
    this.x += p.cos(this.angle) * this.speed * speedMultiplier;
    this.y += p.sin(this.angle * 1.3) * this.speed * 0.6 * speedMultiplier;
    this.alpha = 60 + p.sin(p.frameCount * 0.04 + this.angle) * 20;
    if (this.x < -20 || this.x > p.width + 20 || this.y < p.height * 0.2 || this.y > p.height + 20) {
      this.reset();
    }
  }

  draw(glow = 0) {
    const p = this.p;
    const alpha = this.alpha + glow * 80;
    p.noStroke();
    p.fill(182, 255, 176, alpha);
    p.ellipse(this.x, this.y, this.radius * 3);
  }
}

export function createBambooGardenScene(p) {
  const stalks = [];
  const fireflies = [];
  let speedMultiplier = 1;
  let pulse = 0;

  function ensureElements() {
    if (!stalks.length) {
      const total = Math.floor(p.width / 70) + 6;
      for (let i = 0; i < total; i++) {
        stalks.push(new BambooStalk(p, i, total));
      }
    }

    const targetFireflies = Math.floor(p.width * p.height / 28000) + 18;
    while (fireflies.length < targetFireflies) {
      fireflies.push(new Firefly(p));
    }
    fireflies.length = targetFireflies;
  }

  function drawBackground() {
    const top = [4, 30, 28];
    const bottom = [10, 54, 44];
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      p.stroke(
        p.lerp(top[0], bottom[0], t),
        p.lerp(top[1], bottom[1], t),
        p.lerp(top[2], bottom[2], t)
      );
      p.line(0, y, p.width, y);
    }
  }

  return {
    id: 'bamboo',
    name: 'Jardin de bambous',
    description: 'Feuillage qui respire et lucioles',
    enter() {
      pulse = 1;
    },
    resize() {
      stalks.length = 0;
      ensureElements();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      pulse = 1;
    },
    draw() {
      ensureElements();
      drawBackground();

      const pulseOffset = p.sin(p.frameCount * 0.01) * 0.2 + pulse * 0.4;
      stalks.forEach(stalk => {
        stalk.draw(speedMultiplier, pulseOffset);
      });

      fireflies.forEach(firefly => {
        firefly.update(speedMultiplier);
        firefly.draw(pulse);
      });

      if (pulse > 0.01) {
        p.noStroke();
        p.fill(120, 240, 180, pulse * 60);
        p.rect(0, 0, p.width, p.height);
        pulse = Math.max(0, pulse - 0.015 * speedMultiplier);
      }

      p.noStroke();
      p.fill(10, 26, 24, 220);
      p.rect(0, p.height * 0.92, p.width, p.height * 0.08);
    }
  };
}
