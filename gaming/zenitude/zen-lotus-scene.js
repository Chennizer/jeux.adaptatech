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
    p.strokeWeight(1.2);
    p.ellipse(this.x, this.y, this.radius * 2.3, this.radius * 0.9);
  }
}

class Lotus {
  constructor(p, x, y, scale = 1) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.petalOffset = p.random(p.TWO_PI);
    this.alpha = p.random();
    this.targetAlpha = this.alpha > 0.6 ? 1 : 0;
    this.nextChange = 0;
  }

  update(now, speedMultiplier = 1) {
    if (now > this.nextChange) {
      this.targetAlpha = this.targetAlpha > 0.5 ? 0 : 1;
      this.nextChange = now + this.p.random(4200, 9600);
    }
    const lerpRate = 0.015 * speedMultiplier + 0.006;
    this.alpha = this.p.lerp(this.alpha, this.targetAlpha, lerpRate);
  }

  draw(time = 0) {
    const p = this.p;
    const wobble = p.sin(time * 0.001 + this.petalOffset) * 0.2;
    const fade = p.constrain(this.alpha, 0, 1);
    p.push();
    p.translate(this.x, this.y + wobble * 6 * this.scale);
    p.scale(this.scale);
    p.noStroke();
    const petals = 6;
    for (let i = 0; i < petals; i++) {
      const angle = (p.TWO_PI / petals) * i;
      p.fill(244, 205, 255, 90 * fade + 10);
      p.push();
      p.rotate(angle);
      p.beginShape();
      p.vertex(0, 0);
      p.bezierVertex(16, -6, 24, -20, 0, -38);
      p.bezierVertex(-24, -20, -16, -6, 0, 0);
      p.endShape();
      p.pop();
    }

    p.fill(255, 242, 170, 140 * fade);
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
    const count = Math.max(10, Math.floor(p.width / 140));
    for (let i = 0; i < count; i++) {
      const x = p.random(p.width * 0.08, p.width * 0.92);
      const y = p.random(p.height * 0.35, p.height * 0.88);
      const scale = p.random(0.75, 1.35);
      lotusFlowers.push(new Lotus(p, x, y, scale));
    }
    const padCount = Math.max(12, Math.floor(p.width / 140));
    for (let i = 0; i < padCount; i++) {
      lilyPadShadows.push({
        x: p.random(p.width * 0.05, p.width * 0.95),
        y: p.random(p.height * 0.3, p.height * 0.9),
        w: p.random(90, 150),
        h: p.random(28, 48),
        rotation: p.random(-0.2, 0.2),
        tint: p.random(80, 140)
      });
    }
  }

  function drawWater(time) {
    const noiseTime = time * 0.00012 * speedMultiplier;
    const yStep = 6;
    const xStep = 14;
    for (let y = 0; y < p.height; y += yStep) {
      for (let x = 0; x < p.width; x += xStep) {
        const t = y / p.height;
        const baseR = p.lerp(18, 36, t);
        const baseG = p.lerp(70, 130, t);
        const baseB = p.lerp(96, 170, t);
        const n = p.noise(x * 0.003, y * 0.0025, noiseTime);
        const wave = p.sin(y * 0.04 + time * 0.002 + n * 2) * 0.08;
        const light = p.map(n, 0, 1, -12, 18) + wave * 22;
        p.noStroke();
        p.fill(baseR + light, baseG + light, baseB + light, 240);
        p.rect(x, y, xStep + 2, yStep + 2);
      }
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
        flower.targetAlpha = 1;
      });
    },
    draw() {
      currentTime += 16 * speedMultiplier;
      drawWater(currentTime);

      lilyPadShadows.forEach(pad => {
        p.push();
        p.translate(pad.x, pad.y);
        p.rotate(pad.rotation);
        p.fill(12, 60, 70, pad.tint);
        p.ellipse(0, 0, pad.w, pad.h);
        p.pop();
      });

      ripples = ripples.filter(ripple => {
        const alive = ripple.update(speedMultiplier);
        ripple.draw();
        return alive;
      });

      lotusFlowers.forEach(flower => {
        flower.update(currentTime, speedMultiplier);
        const fade = p.constrain(flower.alpha, 0, 1);
        p.fill(18, 84, 88, 140 * fade);
        p.ellipse(flower.x, flower.y + 10, 90 * flower.scale, 32 * flower.scale);
        flower.draw(currentTime);
        if (p.random() < 0.008 * speedMultiplier) {
          spawnRipple(flower.x + p.random(-20, 20), flower.y + p.random(-8, 8));
        }
      });
    }
  };
}
