const BLOOM_COLORS = [
  [255, 214, 236],
  [244, 183, 220],
  [186, 232, 211],
  [196, 222, 255]
];

class Petal {
  constructor(p, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset(forceY = false) {
    const p = this.p;
    this.x = p.random(-this.width * 0.1, this.width * 1.1);
    this.y = forceY ? p.random(-this.height, this.height) : p.random(-this.height, -20);
    this.speed = p.random(0.4, 1);
    this.size = p.random(10, 26);
    this.tilt = p.random(360);
    this.color = p.random(BLOOM_COLORS);
  }

  step(multiplier = 1) {
    const p = this.p;
    this.y += this.speed * 1.4 * multiplier;
    this.x += Math.sin((p.frameCount + this.tilt) * 0.01) * 0.8 * multiplier;
    if (this.y > this.height + 20) {
      this.reset();
    }
  }

  draw(glow = 0) {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(p.radians(this.tilt));
    p.noStroke();
    const [r, g, b] = this.color;
    p.fill(r, g, b, 200 + glow * 30);
    p.ellipse(0, 0, this.size, this.size * 0.6);
    p.pop();
  }
}

export function createSpringScene(p) {
  let petals = [];
  let speedMultiplier = 1;
  let glow = 0;

  function populate() {
    const count = Math.floor((p.width * p.height) / 12000);
    petals = Array.from({ length: count }, () => new Petal(p, p.width, p.height));
  }

  function resize() {
    populate();
  }

  populate();

  return {
    id: 'spring',
    name: 'Brise florale',
    description: 'Pétales pastel et lumière douce',
    enter() {
      glow = 1;
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      glow = 1;
    },
    draw() {
      p.background(16, 28, 42);
      const gradSteps = 12;
      for (let i = 0; i < gradSteps; i++) {
        const t = i / Math.max(1, gradSteps - 1);
        const alpha = p.map(i, 0, gradSteps - 1, 180, 30, true);
        p.noStroke();
        p.fill(p.lerp(58, 112, t), p.lerp(168, 224, t), p.lerp(172, 214, t), alpha);
        p.rect(0, (p.height / gradSteps) * i, p.width, p.height / gradSteps + 1);
      }

      glow = p.lerp(glow, 0, 0.02);
      petals.forEach(petal => {
        petal.step(speedMultiplier);
        petal.draw(glow);
      });
    }
  };
}
