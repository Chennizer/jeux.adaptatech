const PETAL_COLORS = [
  [255, 220, 235],
  [238, 202, 222],
  [196, 236, 194],
  [180, 214, 255]
];

class Petal {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(initial = false) {
    const p = this.p;
    this.x = initial ? p.random(p.width) : p.random(p.width * -0.1, p.width * 1.1);
    this.y = initial ? p.random(p.height) : p.random(-40, -10);
    this.size = p.random(10, 22);
    this.speed = p.random(0.6, 1.4);
    this.sway = p.random(0.4, 1.1);
    this.angle = p.random(p.TWO_PI);
    this.rotSpeed = p.random(-0.01, 0.01);
    this.color = p.random(PETAL_COLORS);
    this.depth = p.random(0.5, 1.2);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.angle += this.rotSpeed * multiplier;
    this.y += this.speed * 1.6 * this.depth * multiplier;
    this.x += Math.sin(p.frameCount * 0.01 + this.y * 0.005) * this.sway * multiplier;
    if (this.y > p.height + 30) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], 210);
    p.ellipse(0, 0, this.size * 0.9, this.size * 0.6);
    p.ellipse(this.size * 0.2, -this.size * 0.15, this.size * 0.8, this.size * 0.5);
    p.pop();
  }
}

export function createSpringScene(p) {
  const petals = [];
  let gradientNeedsUpdate = true;
  let backgroundCache;
  let speedMultiplier = 1;

  function ensurePetals() {
    const target = Math.floor((p.width * p.height) * 0.00022);
    while (petals.length < target) petals.push(new Petal(p));
    if (petals.length > target) petals.length = target;
  }

  function drawGradient() {
    if (!gradientNeedsUpdate) {
      p.image(backgroundCache, 0, 0, p.width, p.height);
      return;
    }
    backgroundCache = p.createGraphics(p.width, p.height);
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const r = p.lerp(26, 135, t);
      const g = p.lerp(52, 198, t);
      const b = p.lerp(76, 224, t);
      backgroundCache.stroke(r, g, b);
      backgroundCache.line(0, y, p.width, y);
    }
    gradientNeedsUpdate = false;
    p.image(backgroundCache, 0, 0, p.width, p.height);
  }

  return {
    id: 'spring',
    name: 'Printemps',
    description: 'Pétales qui flottent doucement dans la brise',
    enter() {
      gradientNeedsUpdate = true;
      petals.forEach(petal => petal.reset(true));
    },
    resize() {
      gradientNeedsUpdate = true;
      ensurePetals();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      petals.forEach(petal => {
        petal.y -= 8;
      });
    },
    draw() {
      if (!backgroundCache || backgroundCache.width !== p.width || backgroundCache.height !== p.height) {
        gradientNeedsUpdate = true;
      }
      drawGradient();
      ensurePetals();
      petals.forEach(petal => petal.update(speedMultiplier));
      petals.forEach(petal => petal.draw());
      p.noStroke();
      p.fill(255, 255, 255, 90);
      p.rect(0, p.height * 0.8, p.width, p.height * 0.2);
    }
  };
}
