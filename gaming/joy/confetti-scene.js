const GRADIENT_TOP = [24, 34, 67];
const GRADIENT_BOTTOM = [10, 14, 28];
const COLORS = [
  [255, 204, 77],
  [255, 122, 209],
  [93, 228, 255],
  [140, 255, 175],
  [255, 255, 255]
];

class ConfettiPiece {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(fullRange = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = fullRange ? p.random(-p.height, p.height) : p.random(-p.height * 0.4, 0);
    this.size = p.random(6, 18);
    this.speed = p.random(1.2, 2.4);
    this.spin = p.random(-0.05, 0.05);
    this.angle = p.random(p.TWO_PI);
    this.color = p.random(COLORS);
    this.wobble = p.random(10, 28);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    this.y += this.speed * speedMultiplier;
    this.x += p.sin(p.frameCount * 0.02 + this.y * 0.02) * 0.6 * speedMultiplier;
    this.angle += this.spin * speedMultiplier;
    if (this.y - this.size > p.height) {
      this.reset();
      this.y = -this.size;
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x + p.sin(this.angle) * this.wobble * 0.1, this.y);
    p.rotate(this.angle * 0.6);
    p.noStroke();
    p.fill(...this.color, 210);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.size * 0.6, this.size, 4);
    p.pop();
  }
}

export function createConfettiScene(p) {
  const pieces = [];
  let speedMultiplier = 1;
  let shimmer = 0;

  function ensurePieces() {
    const target = Math.floor(p.width * p.height * 0.00035) + 70;
    while (pieces.length < target) pieces.push(new ConfettiPiece(p));
    if (pieces.length > target) pieces.length = target;
  }

  function drawBackground() {
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const r = p.lerp(GRADIENT_TOP[0], GRADIENT_BOTTOM[0], t);
      const g = p.lerp(GRADIENT_TOP[1], GRADIENT_BOTTOM[1], t);
      const b = p.lerp(GRADIENT_TOP[2], GRADIENT_BOTTOM[2], t);
      p.stroke(r, g, b);
      p.line(0, y, p.width, y);
    }
  }

  return {
    id: 'confetti',
    enter() {
      shimmer = 1;
      ensurePieces();
    },
    resize() {
      ensurePieces();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      shimmer = 1.5;
      for (let i = 0; i < 24; i++) {
        pieces.push(new ConfettiPiece(p));
      }
    },
    draw() {
      drawBackground();
      if (pieces.length === 0) ensurePieces();
      pieces.forEach(piece => piece.update(speedMultiplier));
      pieces.forEach(piece => piece.draw());

      if (shimmer > 0.01) {
        p.noStroke();
        p.fill(255, 255, 255, 50 * shimmer);
        const radius = Math.max(p.width, p.height) * 0.65;
        p.ellipse(p.width * 0.5, p.height * 0.2, radius, radius * 0.7);
        shimmer *= 0.95;
      }
    }
  };
}
