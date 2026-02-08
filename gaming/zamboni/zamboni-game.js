class Confetti {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(-p.height, 0);
    this.speed = p.random(1, 4);
    this.size = p.random(4, 10);
    this.hue = p.random(0, 360);
    this.spin = p.random(-0.1, 0.1);
    this.angle = p.random(p.TWO_PI);
  }

  update() {
    this.y += this.speed;
    this.x += Math.sin(this.angle) * 0.8;
    this.angle += this.spin;
    if (this.y > this.p.height + 20) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.fill(this.hue, 80, 100, 80);
    p.rect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
    p.pop();
  }
}

export class ZamboniGame {
  constructor(p) {
    this.p = p;
    this.grid = { cols: 18, rows: 5 };
    this.cells = [];
    this.cleaned = 0;
    this.zamboni = { row: 0, col: 0, dir: 1 };
    this.isAnimating = false;
    this.progress = 0;
    this.startTime = 0;
    this.completeTime = null;
    this.confetti = [];
  }

  setup() {
    this.reset();
  }

  start() {
    this.reset();
  }

  reset() {
    this.cells = Array.from({ length: this.grid.cols * this.grid.rows }, () => 0);
    this.cleaned = 0;
    this.zamboni = { row: 0, col: 0, dir: 1 };
    this.isAnimating = false;
    this.progress = 0;
    this.startTime = 0;
    this.completeTime = null;
    this.confetti = Array.from({ length: 80 }, () => new Confetti(this.p));
  }

  resize() {}

  index(col, row) {
    return row * this.grid.cols + col;
  }

  handlePress() {
    if (this.isComplete()) return;
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.progress = 0;
    this.startTime = this.p.millis();
  }

  update() {
    if (this.isAnimating) {
      const duration = 2200;
      const elapsed = this.p.millis() - this.startTime;
      this.progress = Math.min(1, elapsed / duration);

      const startCol = this.zamboni.dir === 1 ? 0 : this.grid.cols - 1;
      const endCol = this.zamboni.dir === 1 ? this.grid.cols - 1 : 0;
      const current = this.p.lerp(startCol, endCol, this.progress);
      this.zamboni.col = current;

      this.cleanSegment(this.zamboni.row, startCol, current);

      if (this.progress >= 1) {
        this.isAnimating = false;
        this.zamboni.dir *= -1;
        this.zamboni.row = (this.zamboni.row + 1) % this.grid.rows;

        if (this.cleaned >= this.grid.cols * this.grid.rows) {
          this.completeTime = this.p.millis();
        }
      }
    }

    if (this.completeTime) {
      this.confetti.forEach(piece => piece.update());
    }
  }

  cleanSegment(row, startCol, endCol) {
    const minCol = Math.floor(Math.min(startCol, endCol));
    const maxCol = Math.floor(Math.max(startCol, endCol));
    for (let col = minCol; col <= maxCol; col += 1) {
      const idx = this.index(col, row);
      if (this.cells[idx] === 0) {
        this.cells[idx] = 1;
        this.cleaned += 1;
      }
    }
  }

  drawBackground() {
    const p = this.p;
    const gradientSteps = 16;
    for (let i = 0; i < gradientSteps; i += 1) {
      const t = i / (gradientSteps - 1);
      const hue = p.lerp(210, 235, t);
      const sat = p.lerp(50, 70, t);
      const bri = p.lerp(12, 25, t);
      p.fill(hue, sat, bri, 100);
      p.rect(0, p.height * t, p.width, p.height / gradientSteps + 2);
    }
  }

  drawRink() {
    const p = this.p;
    const rinkW = p.width * 0.75;
    const rinkH = p.height * 0.55;
    const rinkX = (p.width - rinkW) / 2;
    const rinkY = (p.height - rinkH) / 2;
    const cellW = rinkW / this.grid.cols;
    const cellH = rinkH / this.grid.rows;

    p.fill(210, 10, 90, 100);
    p.rect(rinkX - 20, rinkY - 20, rinkW + 40, rinkH + 40, 40);

    p.fill(200, 8, 98, 100);
    p.rect(rinkX, rinkY, rinkW, rinkH, 24);

    for (let row = 0; row < this.grid.rows; row += 1) {
      for (let col = 0; col < this.grid.cols; col += 1) {
        const idx = this.index(col, row);
        if (this.cells[idx] === 0) {
          p.fill(200, 12, 92, 90);
        } else {
          p.fill(200, 6, 100, 100);
        }
        p.rect(rinkX + col * cellW, rinkY + row * cellH, cellW, cellH);
      }
    }

    p.stroke(0, 70, 80, 60);
    p.strokeWeight(4);
    p.line(rinkX + rinkW * 0.5, rinkY, rinkX + rinkW * 0.5, rinkY + rinkH);
    p.noStroke();

    p.fill(0, 70, 90, 70);
    p.circle(rinkX + rinkW * 0.5, rinkY + rinkH * 0.5, rinkH * 0.2);

    return { rinkX, rinkY, rinkW, rinkH, cellW, cellH };
  }

  drawZamboni(bounds) {
    const p = this.p;
    const { rinkX, rinkY, cellW, cellH } = bounds;
    const x = rinkX + this.zamboni.col * cellW + cellW * 0.1;
    const y = rinkY + this.zamboni.row * cellH + cellH * 0.2;
    const w = cellW * 1.6;
    const h = cellH * 0.6;

    p.push();
    p.translate(x + w / 2, y + h / 2);
    p.scale(this.zamboni.dir, 1);
    p.fill(45, 90, 100, 100);
    p.rect(-w / 2, -h / 2, w, h, 6);
    p.fill(20, 10, 20, 100);
    p.rect(-w / 2 + 8, -h / 2 + 6, w * 0.4, h * 0.4, 4);
    p.fill(200, 10, 30, 100);
    p.rect(w * 0.1, h * 0.05, w * 0.4, h * 0.2, 4);
    p.pop();
  }

  drawSpotlights() {
    const p = this.p;
    for (let i = 0; i < 6; i += 1) {
      const x = p.map(i, 0, 5, p.width * 0.1, p.width * 0.9);
      p.fill(200, 30, 100, 10);
      p.triangle(x - 120, 0, x + 120, 0, x, p.height * 0.6);
    }
  }

  drawConfetti() {
    if (!this.completeTime) return;
    this.confetti.forEach(piece => piece.draw());
  }

  draw() {
    const p = this.p;
    this.drawBackground();
    this.drawSpotlights();
    const bounds = this.drawRink();
    this.drawZamboni(bounds);
    this.drawConfetti();

    p.fill(0, 0, 100, 70);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(Math.min(p.width, p.height) * 0.03);
    p.text('Nettoie toute la glace en 5 passages', p.width / 2, p.height * 0.1);
  }

  isComplete() {
    return this.completeTime && this.p.millis() - this.completeTime > 4000;
  }
}
