class Snowflake {
  constructor(p, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
    this.reset(true);
  }

  reset(forceY = false) {
    const p = this.p;
    this.x = p.random(-this.width * 0.1, this.width * 1.1);
    this.y = forceY ? p.random(-this.height, this.height) : p.random(-this.height, -20);
    this.speed = p.random(0.5, 1.3);
    this.drift = p.random(-0.4, 0.4);
    this.size = p.random(2, 6);
    this.twist = p.random(0, Math.PI * 2);
  }

  step(multiplier = 1) {
    const p = this.p;
    this.y += this.speed * multiplier;
    this.x += Math.sin(p.frameCount * 0.01 + this.twist) * this.drift * 40 * multiplier;
    if (this.y > this.height + 10) {
      this.reset();
    }
  }

  draw(glow = 0) {
    const p = this.p;
    p.noStroke();
    p.fill(230, 244, 255, 150 + glow * 40);
    p.circle(this.x, this.y, this.size);
  }
}

export function createWinterScene(p) {
  let snowflakes = [];
  let speedMultiplier = 1;
  let glow = 0;

  function populate() {
    const count = Math.floor((p.width * p.height) / 9000);
    snowflakes = Array.from({ length: count }, () => new Snowflake(p, p.width, p.height));
  }

  function resize() {
    populate();
  }

  populate();

  return {
    id: 'winter',
    name: 'Silence neigeux',
    description: 'Voile d\'hiver bleu nuit',
    enter() {
      glow = 1;
    },
    resize,
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      glow = 1.3;
    },
    draw() {
      const skyTop = p.color(6, 14, 26);
      const skyBottom = p.color(22, 40, 70);
      for (let y = 0; y <= p.height; y++) {
        const t = y / Math.max(1, p.height);
        const c = p.lerpColor(skyTop, skyBottom, t);
        p.stroke(c);
        p.line(0, y, p.width, y);
      }

      const halo = 80 + glow * 40;
      p.noStroke();
      p.fill(130, 190, 255, halo);
      p.ellipse(p.width * 0.28, p.height * 0.18, p.height * 0.4, p.height * 0.3);

      glow = p.lerp(glow, 0, 0.018);
      snowflakes.forEach(flake => {
        flake.step(speedMultiplier);
        flake.draw(glow);
      });
    }
  };
}
