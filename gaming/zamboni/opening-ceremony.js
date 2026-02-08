const RING_COLORS = [
  [208, 80, 90],
  [50, 90, 95],
  [0, 0, 98],
  [120, 70, 80],
  [350, 80, 90],
];

class FireworkParticle {
  constructor(p, x, y, hue) {
    this.p = p;
    this.pos = p.createVector(x, y);
    const angle = p.random(p.TWO_PI);
    const speed = p.random(2, 6);
    this.vel = p5.Vector.fromAngle(angle).mult(speed);
    this.life = p.random(40, 80);
    this.hue = hue;
    this.size = p.random(3, 6);
  }

  update() {
    this.pos.add(this.vel);
    this.vel.mult(0.97);
    this.life -= 1.2;
  }

  draw() {
    const alpha = this.p.map(this.life, 0, 80, 0, 100);
    this.p.fill(this.hue, 80, 100, alpha);
    this.p.circle(this.pos.x, this.pos.y, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}

export class OpeningCeremony {
  constructor(p) {
    this.p = p;
    this.rings = [];
    this.fireworks = [];
    this.pressCount = 0;
    this.completeTime = null;
  }

  setup() {
    this.reset();
  }

  start() {
    this.reset();
  }

  reset() {
    this.rings = RING_COLORS.map((color, index) => ({
      color,
      progress: 0,
      revealed: index === 2,
      glow: 0,
    }));
    this.pressCount = 0;
    this.fireworks = [];
    this.completeTime = null;
  }

  resize() {}

  handlePress() {
    if (this.isComplete()) return;
    if (this.pressCount >= 5) return;
    this.revealRing(this.pressCount);
    this.launchFirework();
    this.pressCount += 1;

    if (this.pressCount >= 5) {
      this.completeTime = this.p.millis();
    }
  }

  revealRing(index) {
    const ring = this.rings[index];
    if (ring) {
      ring.revealed = true;
      ring.glow = 1;
    }
  }

  launchFirework() {
    const p = this.p;
    const center = this.getRingPositions()[this.pressCount % 5];
    const burstX = center.x + p.random(-30, 30);
    const burstY = center.y + p.random(-20, 20);
    const hue = RING_COLORS[this.pressCount % 5][0];
    for (let i = 0; i < 80; i += 1) {
      this.fireworks.push(new FireworkParticle(p, burstX, burstY, hue));
    }
  }

  getRingPositions() {
    const p = this.p;
    const centerX = p.width * 0.5;
    const centerY = p.height * 0.48;
    const spacing = Math.min(p.width, p.height) * 0.14;
    const offsetY = spacing * 0.55;
    return [
      { x: centerX - spacing * 1.1, y: centerY - offsetY },
      { x: centerX, y: centerY - offsetY },
      { x: centerX + spacing * 1.1, y: centerY - offsetY },
      { x: centerX - spacing * 0.55, y: centerY + offsetY },
      { x: centerX + spacing * 0.55, y: centerY + offsetY },
    ];
  }

  update() {
    this.fireworks.forEach(particle => particle.update());
    this.fireworks = this.fireworks.filter(particle => !particle.isDead());

    this.rings.forEach(ring => {
      if (ring.revealed && ring.progress < 1) {
        ring.progress = Math.min(1, ring.progress + 0.03);
      }
      ring.glow *= 0.95;
    });
  }

  drawSky() {
    const p = this.p;
    const gradientSteps = 12;
    for (let i = 0; i < gradientSteps; i += 1) {
      const t = i / (gradientSteps - 1);
      const hue = p.lerp(220, 260, t);
      const sat = p.lerp(60, 90, t);
      const bri = p.lerp(15, 5, t);
      p.fill(hue, sat, bri, 100);
      p.rect(0, p.height * t, p.width, p.height / gradientSteps + 2);
    }
  }

  drawStadium() {
    const p = this.p;
    const floorY = p.height * 0.78;
    p.fill(220, 60, 20, 100);
    p.rect(0, floorY, p.width, p.height - floorY);

    for (let i = 0; i < 4; i += 1) {
      const glow = 30 + i * 10;
      p.fill(200, 60, glow, 20);
      p.rect(0, floorY - i * 10, p.width, 14);
    }

    const spotlightCount = 6;
    for (let i = 0; i < spotlightCount; i += 1) {
      const x = p.map(i, 0, spotlightCount - 1, p.width * 0.1, p.width * 0.9);
      const y = floorY - 40;
      p.fill(50, 10, 100, 80);
      p.triangle(x - 120, y, x + 120, y, x, y - 260);
    }
  }

  drawRings() {
    const p = this.p;
    const positions = this.getRingPositions();
    const radius = Math.min(p.width, p.height) * 0.13;
    positions.forEach((pos, index) => {
      const ring = this.rings[index];
      const [h, s, b] = ring.color;
      if (!ring.revealed) {
        p.stroke(210, 15, 35, 40);
        p.noFill();
        p.strokeWeight(radius * 0.12);
        p.circle(pos.x, pos.y, radius * 2);
        return;
      }

      p.strokeWeight(radius * 0.12);
      p.noFill();
      p.stroke(h, s, b, 90);
      p.arc(pos.x, pos.y, radius * 2, radius * 2, -p.HALF_PI, p.TWO_PI * ring.progress - p.HALF_PI);

      if (ring.glow > 0.01) {
        p.stroke(h, s, 100, ring.glow * 60);
        p.strokeWeight(radius * 0.2);
        p.circle(pos.x, pos.y, radius * 2.1);
      }
    });
  }

  drawFireworks() {
    this.fireworks.forEach(particle => particle.draw());
  }

  drawFinale() {
    if (!this.completeTime) return;
    const p = this.p;
    const t = (p.millis() - this.completeTime) / 1000;
    const pulse = 0.5 + Math.sin(t * 2) * 0.2;
    const centerX = p.width / 2;
    const centerY = p.height * 0.48;
    p.noStroke();
    p.fill(50, 90, 100, 20 + pulse * 20);
    p.circle(centerX, centerY, Math.min(p.width, p.height) * (0.6 + pulse * 0.1));

    for (let i = 0; i < 100; i += 1) {
      const angle = (i / 100) * p.TWO_PI + t * 0.4;
      const radius = Math.min(p.width, p.height) * (0.35 + 0.03 * Math.sin(t + i));
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      p.fill((i * 20) % 360, 80, 100, 60);
      p.circle(x, y, 4 + 3 * pulse);
    }
  }

  draw() {
    const p = this.p;
    this.drawSky();
    this.drawStadium();
    this.drawRings();
    this.drawFireworks();
    this.drawFinale();

    p.fill(0, 0, 100, 70);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(Math.min(p.width, p.height) * 0.03);
    p.text('Appuie 5 fois pour illuminer les anneaux', p.width / 2, p.height * 0.1);
  }

  isComplete() {
    return this.completeTime && this.p.millis() - this.completeTime > 3500;
  }
}
