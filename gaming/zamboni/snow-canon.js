class SnowParticle {
  constructor(p, x, y) {
    this.p = p;
    this.pos = p.createVector(x, y);
    this.vel = p.createVector(p.random(2, 6), p.random(-8, -3));
    this.acc = p.createVector(0, 0.15);
    this.size = p.random(3, 7);
    this.life = 120;
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.life -= 1;
  }

  draw() {
    const alpha = this.p.map(this.life, 0, 120, 0, 80);
    this.p.fill(200, 10, 100, alpha);
    this.p.circle(this.pos.x, this.pos.y, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}

export class SnowCanon {
  constructor(p) {
    this.p = p;
    this.pressCount = 0;
    this.maxPress = 5;
    this.snowBurst = [];
    this.floaters = [];
    this.completeTime = null;
  }

  setup() {
    this.reset();
  }

  start() {
    this.reset();
  }

  reset() {
    this.pressCount = 0;
    this.snowBurst = [];
    this.floaters = Array.from({ length: 120 }, () => ({
      x: this.p.random(),
      y: this.p.random(),
      speed: this.p.random(0.2, 0.8),
      size: this.p.random(2, 5),
      drift: this.p.random(-0.4, 0.4),
    }));
    this.completeTime = null;
  }

  resize() {}

  handlePress() {
    if (this.isComplete()) return;
    if (this.pressCount >= this.maxPress) return;
    this.pressCount += 1;
    this.launchSnow();
    if (this.pressCount >= this.maxPress) {
      this.completeTime = this.p.millis();
    }
  }

  launchSnow() {
    const p = this.p;
    const cannonPos = this.getCannonPos();
    for (let i = 0; i < 70; i += 1) {
      this.snowBurst.push(new SnowParticle(p, cannonPos.x + 30, cannonPos.y - 30));
    }
  }

  getCannonPos() {
    const p = this.p;
    return {
      x: p.width * 0.12,
      y: p.height * 0.8,
    };
  }

  update() {
    this.snowBurst.forEach(particle => particle.update());
    this.snowBurst = this.snowBurst.filter(particle => !particle.isDead());

    this.floaters.forEach(flake => {
      flake.y += flake.speed * 0.004;
      flake.x += flake.drift * 0.002;
      if (flake.y > 1.1) flake.y = -0.1;
      if (flake.x > 1.1) flake.x = -0.1;
      if (flake.x < -0.1) flake.x = 1.1;
    });
  }

  drawSky() {
    const p = this.p;
    const gradientSteps = 12;
    for (let i = 0; i < gradientSteps; i += 1) {
      const t = i / (gradientSteps - 1);
      const hue = p.lerp(210, 190, t);
      const sat = p.lerp(40, 20, t);
      const bri = p.lerp(20, 90, t);
      p.fill(hue, sat, bri, 100);
      p.rect(0, p.height * t, p.width, p.height / gradientSteps + 2);
    }
  }

  drawAurora() {
    const p = this.p;
    const bands = 4;
    for (let i = 0; i < bands; i += 1) {
      const baseY = p.height * (0.2 + i * 0.08);
      p.beginShape();
      p.noFill();
      p.stroke(160 + i * 10, 40, 90, 30);
      p.strokeWeight(18);
      for (let x = 0; x <= p.width; x += 60) {
        const y = baseY + Math.sin((x * 0.004) + p.frameCount * 0.01 + i) * 30;
        p.vertex(x, y);
      }
      p.endShape();
    }
    p.noStroke();
  }

  drawMountain() {
    const p = this.p;
    const baseY = p.height * 0.78;
    const heightStep = p.height * 0.05;
    const height = heightStep * this.pressCount;
    const peakY = baseY - height;

    p.fill(200, 15, 95, 100);
    p.triangle(0, baseY, p.width * 0.7, peakY, p.width, baseY);

    p.fill(200, 10, 100, 80);
    p.triangle(p.width * 0.2, baseY, p.width * 0.7, peakY - p.height * 0.05, p.width, baseY);
  }

  drawCannon() {
    const p = this.p;
    const pos = this.getCannonPos();
    p.fill(210, 20, 40, 100);
    p.rect(pos.x - 30, pos.y - 10, 70, 24, 8);
    p.fill(220, 10, 80, 100);
    p.rect(pos.x - 10, pos.y - 40, 60, 20, 6);
    p.push();
    p.translate(pos.x + 40, pos.y - 30);
    p.rotate(-0.5);
    p.rect(0, 0, 50, 16, 6);
    p.pop();

    p.fill(210, 30, 30, 100);
    p.circle(pos.x - 10, pos.y + 10, 26);
    p.circle(pos.x + 30, pos.y + 10, 26);
  }

  drawSnow() {
    const p = this.p;
    this.floaters.forEach(flake => {
      p.fill(0, 0, 100, 70);
      p.circle(flake.x * p.width, flake.y * p.height, flake.size);
    });
    this.snowBurst.forEach(particle => particle.draw());
  }

  drawFinale() {
    if (!this.completeTime) return;
    const p = this.p;
    const t = (p.millis() - this.completeTime) / 1000;
    const glow = 0.5 + Math.sin(t * 2) * 0.3;
    p.fill(200, 10, 100, 10 + glow * 30);
    p.circle(p.width * 0.7, p.height * 0.35, p.width * 0.6 * glow);
  }

  draw() {
    const p = this.p;
    this.drawSky();
    this.drawAurora();
    this.drawMountain();
    this.drawSnow();
    this.drawCannon();
    this.drawFinale();

    p.fill(210, 30, 100, 70);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(Math.min(p.width, p.height) * 0.03);
    p.text('Active le canon 5 fois pour créer la montagne', p.width / 2, p.height * 0.12);
  }

  isComplete() {
    return this.completeTime && this.p.millis() - this.completeTime > 3000;
  }
}
