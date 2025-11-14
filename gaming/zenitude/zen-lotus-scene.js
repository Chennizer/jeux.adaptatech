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
  let lilyPadShadows = [];
  let speedMultiplier = 1;
  let currentTime = 0;

  function spawnRipple(x, y) {
    ripples.push(new Ripple(p, x, y));
  }

  function rebuildLotus() {
    lotusFlowers = [];
    lilyPadShadows = [];
    const count = Math.max(5, Math.floor(p.width / 300));
    for (let i = 0; i < count; i++) {
      const x = p.map(i, 0, count - 1, p.width * 0.15, p.width * 0.85);
      const y = p.random(p.height * 0.45, p.height * 0.8);
      const scale = p.random(0.8, 1.3);
      lotusFlowers.push(new Lotus(p, x, y, scale));
    }
    const padCount = Math.max(8, Math.floor(p.width / 180));
    for (let i = 0; i < padCount; i++) {
      lilyPadShadows.push({
        x: p.random(p.width * 0.05, p.width * 0.95),
        y: p.random(p.height * 0.3, p.height * 0.9),
        w: p.random(80, 150),
        h: p.random(24, 44),
        rotation: p.random(-0.2, 0.2)
      });
    }
  }

  return {
    id: 'lotus',
    name: 'Étang de lotus',
    description: 'Ondulations calmes et fleurs flottantes',
    enter() {
      ripples = [];
      rebuildLotus();
    },
    resize() {
      ripples = [];
      rebuildLotus();
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
      currentTime += 16 * speedMultiplier;
      const waterSteps = 220;
      const heightStep = p.height / waterSteps;
      p.noStroke();
      for (let i = 0; i < waterSteps; i++) {
        const t = i / (waterSteps - 1);
        const r = p.lerp(10, 30, t);
        const g = p.lerp(48, 116, t);
        const b = p.lerp(70, 150, t);
        p.fill(r, g, b);
        p.rect(0, i * heightStep, p.width, heightStep + 1);
      }

      p.strokeWeight(1);
      p.stroke(180, 220, 240, 28);
      const waveBands = Math.max(2, Math.floor(p.height / 24));
      for (let i = 0; i < waveBands; i++) {
        const y = (i / (waveBands - 1)) * p.height;
        const noiseVal = p.noise(i * 0.08, currentTime * 0.0002);
        const offset = (noiseVal - 0.5) * 18;
        p.line(0, y + offset, p.width, y + offset);
      }
      p.noStroke();

      lilyPadShadows.forEach(pad => {
        p.push();
        p.translate(pad.x, pad.y);
        p.rotate(pad.rotation);
        p.fill(12, 60, 70, 120);
        p.ellipse(0, 0, pad.w, pad.h);
        p.pop();
      });

      ripples = ripples.filter(ripple => {
        const alive = ripple.update(speedMultiplier);
        ripple.draw();
        return alive;
      });

      lotusFlowers.forEach(flower => {
        p.fill(20, 96, 90, 180);
        p.ellipse(flower.x, flower.y + 10, 86 * flower.scale, 28 * flower.scale);
        flower.draw(currentTime);
        if (p.random() < 0.005 * speedMultiplier) {
          spawnRipple(flower.x + p.random(-20, 20), flower.y + p.random(-8, 8));
        }
      });
    }
  };
}
