const BASE_COLORS = [
  [255, 196, 102],
  [255, 140, 200],
  [120, 230, 255],
  [180, 255, 200],
  [255, 255, 255]
];

class Ribbon {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(fullRange = false) {
    const p = this.p;
    this.y = fullRange ? p.random(-p.height, p.height) : p.random(-p.height * 0.3, p.height * 0.7);
    this.x = p.random(-p.width * 0.2, p.width * 1.2);
    this.speed = p.random(0.8, 2.6);
    this.noiseOffset = p.random(1000);
    this.width = p.random(6, 16);
    this.color = p.random(BASE_COLORS);
    this.points = Array.from({ length: 18 }).map(() => ({ x: this.x, y: this.y }));
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    const drift = (p.noise(this.noiseOffset + p.frameCount * 0.01) - 0.5) * 14;
    this.x += this.speed * speedMultiplier;
    this.y += drift * 0.08 * speedMultiplier;
    this.points.unshift({ x: this.x, y: this.y });
    if (this.points.length > 18) this.points.pop();
    if (this.x - this.width > p.width * 1.2) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    p.noFill();
    p.stroke(...this.color, 160);
    p.strokeWeight(this.width);
    p.beginShape();
    this.points.forEach(pt => p.curveVertex(pt.x, pt.y));
    p.endShape();

    p.stroke(...this.color, 220);
    p.strokeWeight(this.width * 0.4);
    p.beginShape();
    this.points.forEach(pt => p.curveVertex(pt.x, pt.y));
    p.endShape();
  }
}

export function createStreamerScene(p) {
  const ribbons = [];
  let speedMultiplier = 1;
  let sparkles = [];

  function ensureRibbons() {
    const target = Math.floor(p.height * 0.04) + 6;
    while (ribbons.length < target) ribbons.push(new Ribbon(p));
    if (ribbons.length > target) ribbons.length = target;
  }

  function drawBackground() {
    p.background(14, 10, 28, 60);
  }

  return {
    id: 'streamers',
    enter() {
      sparkles = [];
      ensureRibbons();
    },
    resize() {
      ensureRibbons();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      for (let i = 0; i < 30; i++) {
        sparkles.push({
          x: p.random(p.width),
          y: p.random(p.height),
          r: p.random(3, 10),
          life: p.random(30, 70),
          color: p.random(BASE_COLORS)
        });
      }
    },
    draw() {
      drawBackground();
      if (!ribbons.length) ensureRibbons();
      ribbons.forEach(ribbon => ribbon.update(speedMultiplier));
      ribbons.forEach(ribbon => ribbon.draw());

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        p.noStroke();
        p.fill(...s.color, 200 * (s.life / 70));
        p.ellipse(s.x, s.y, s.r * 2);
        s.y -= 0.6 * speedMultiplier;
        s.life -= 1 * speedMultiplier;
        if (s.life <= 0) {
          sparkles.splice(i, 1);
        }
      }
    }
  };
}
