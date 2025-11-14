class Ripple {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.alpha = 160;
  }

  update(speed = 1) {
    this.radius += 0.65 * speed;
    this.alpha *= 0.985;
    return this.alpha > 6;
  }

  draw() {
    const p = this.p;
    p.noFill();
    p.stroke(190, 230, 255, this.alpha);
    p.strokeWeight(1.4);
    p.ellipse(this.x, this.y, this.radius * 2.4, this.radius);
  }
}

class Lotus {
  constructor(p, x, y, scale = 1) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.petalOffset = p.random(p.TWO_PI);
  }

  draw(time = 0) {
    const p = this.p;
    const wobble = p.sin(time * 0.001 + this.petalOffset) * 0.2;
    p.push();
    p.translate(this.x, this.y + wobble * 6 * this.scale);
    p.scale(this.scale);
    p.noStroke();
    const petals = 6;
    for (let i = 0; i < petals; i++) {
      const angle = (p.TWO_PI / petals) * i;
      const hue = p.map(i, 0, petals, 200, 340);
      p.fill(244, 205, 255, 160);
      p.push();
      p.rotate(angle);
      p.beginShape();
      p.vertex(0, 0);
      p.bezierVertex(16, -6, 24, -20, 0, -38);
      p.bezierVertex(-24, -20, -16, -6, 0, 0);
      p.endShape();
      p.pop();
    }

    p.fill(255, 242, 170, 220);
    p.ellipse(0, -6, 16, 16);
    p.pop();
  }
}

export function createLotusScene(p) {
  let ripples = [];
  let lotusFlowers = [];
  let speedMultiplier = 1;
  let currentTime = 0;

  function spawnRipple(x, y) {
    ripples.push(new Ripple(p, x, y));
  }

  function ensureLotus() {
    if (!lotusFlowers.length) {
      const count = Math.max(4, Math.floor(p.width / 320));
      for (let i = 0; i < count; i++) {
        const x = p.map(i, 0, count - 1, p.width * 0.2, p.width * 0.8);
        const y = p.random(p.height * 0.65, p.height * 0.78);
        const scale = p.random(0.8, 1.35);
        lotusFlowers.push(new Lotus(p, x, y, scale));
      }
    }
  }

  return {
    id: 'lotus',
    name: 'Étang de lotus',
    description: 'Ondulations calmes et fleurs flottantes',
    enter() {
      ripples = [];
      lotusFlowers = [];
      ensureLotus();
    },
    resize() {
      ripples = [];
      lotusFlowers = [];
      ensureLotus();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      lotusFlowers.forEach(flower => {
        spawnRipple(flower.x + p.random(-10, 10), flower.y + p.random(-4, 6));
      });
    },
    draw() {
      ensureLotus();
      currentTime += 16 * speedMultiplier;
      const horizon = p.height * 0.62;

      p.noStroke();
      const gradientSteps = 160;
      for (let i = 0; i < gradientSteps; i++) {
        const t = i / (gradientSteps - 1);
        const r = p.lerp(8, 20, t);
        const g = p.lerp(28, 74, t);
        const b = p.lerp(38, 122, t);
        p.fill(r, g, b);
        p.rect(0, t * horizon, p.width, horizon / gradientSteps + 1);
      }

      const waterSteps = 160;
      for (let i = 0; i < waterSteps; i++) {
        const t = i / (waterSteps - 1);
        const r = p.lerp(8, 18, t);
        const g = p.lerp(46, 120, t);
        const b = p.lerp(66, 150, t);
        const alpha = p.lerp(220, 160, t);
        p.fill(r, g, b, alpha);
        p.rect(0, horizon + t * (p.height - horizon), p.width, (p.height - horizon) / waterSteps + 1);
      }

      p.noStroke();
      p.fill(4, 40, 60, 160);
      for (let i = 0; i < 12; i++) {
        const x = (i / 11) * p.width;
        const width = p.random(60, 140);
        const height = p.random(6, 18);
        p.ellipse(x, horizon + p.random(-6, 6), width, height);
      }

      ripples = ripples.filter(ripple => {
        const alive = ripple.update(speedMultiplier);
        ripple.draw();
        return alive;
      });

      lotusFlowers.forEach(flower => {
        p.fill(8, 80, 70, 180);
        p.ellipse(flower.x, flower.y + 10, 80 * flower.scale, 24 * flower.scale);
        flower.draw(currentTime);
        if (p.random() < 0.005 * speedMultiplier) {
          spawnRipple(flower.x + p.random(-20, 20), flower.y + p.random(-8, 8));
        }
      });
    }
  };
}
