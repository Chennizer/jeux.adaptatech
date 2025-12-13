const SKY_TOP = [18, 34, 60];
const SKY_BOTTOM = [8, 14, 28];
const BALLOON_COLORS = [
  [255, 176, 66],
  [255, 118, 176],
  [105, 220, 255],
  [156, 255, 194],
  [255, 241, 173]
];

class Balloon {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(fullRange = false) {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = fullRange ? p.random(-p.height, p.height) : p.random(p.height * 0.6, p.height + 60);
    this.r = p.random(18, 36);
    this.speed = p.random(0.4, 1.2);
    this.wobble = p.random(10, 28);
    this.color = p.random(BALLOON_COLORS);
    this.stringLength = p.random(26, 42);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    this.y -= this.speed * speedMultiplier;
    this.x += p.sin(p.frameCount * 0.01 + this.y * 0.01) * 0.35 * speedMultiplier;
    if (this.y + this.r < -40) {
      this.reset();
      this.y = p.height + this.r * 2;
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(...this.color, 235);
    p.ellipse(this.x, this.y, this.r * 1.1, this.r * 1.3);
    p.fill(255, 255, 255, 70);
    p.ellipse(this.x - this.r * 0.25, this.y - this.r * 0.25, this.r * 0.25, this.r * 0.35);

    const stringEndX = this.x - this.r * 0.1 + p.sin(p.frameCount * 0.03 + this.y * 0.02) * this.wobble * 0.05;
    const stringEndY = this.y + this.stringLength;
    p.stroke(240, 240, 240, 120);
    p.strokeWeight(1.3);
    p.noFill();
    p.beginShape();
    p.curveVertex(this.x, this.y + this.r * 0.6);
    p.curveVertex(this.x, this.y + this.r * 0.6);
    p.curveVertex((this.x + stringEndX) / 2 + 6, stringEndY - this.stringLength * 0.4);
    p.curveVertex(stringEndX, stringEndY);
    p.curveVertex(stringEndX, stringEndY);
    p.endShape();
  }
}

export function createBalloonScene(p) {
  const balloons = [];
  let speedMultiplier = 1;
  let glow = 0;

  function ensureBalloons() {
    const target = Math.floor(p.width * p.height * 0.00006) + 14;
    while (balloons.length < target) balloons.push(new Balloon(p));
    if (balloons.length > target) balloons.length = target;
  }

  function drawSky() {
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const r = p.lerp(SKY_TOP[0], SKY_BOTTOM[0], t);
      const g = p.lerp(SKY_TOP[1], SKY_BOTTOM[1], t);
      const b = p.lerp(SKY_TOP[2], SKY_BOTTOM[2], t);
      p.stroke(r, g, b);
      p.line(0, y, p.width, y);
    }
  }

  return {
    id: 'balloons',
    enter() {
      glow = 1.2;
      ensureBalloons();
    },
    resize() {
      ensureBalloons();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      glow = 1.4;
      balloons.forEach(balloon => {
        balloon.y -= 24;
      });
    },
    draw() {
      drawSky();
      if (!balloons.length) ensureBalloons();
      balloons.forEach(balloon => balloon.update(speedMultiplier));
      balloons.forEach(balloon => balloon.draw());

      if (glow > 0.02) {
        p.noStroke();
        p.fill(255, 210, 120, 60 * glow);
        p.ellipse(p.width * 0.7, p.height * 0.35, p.width * 0.6, p.width * 0.35);
        glow *= 0.96;
      }
    }
  };
}
