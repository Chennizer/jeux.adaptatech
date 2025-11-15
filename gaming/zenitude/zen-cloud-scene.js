class Cloud {
  constructor(p, width, height) {
    this.p = p;
    this.boundsWidth = width;
    this.boundsHeight = height;
    this.reset(true);
  }

  reset(initial = false) {
    const p = this.p;
    this.scale = p.random(0.4, 1.1);
    this.x = initial ? p.random(0, this.boundsWidth) : -120 * this.scale;
    this.y = p.random(this.boundsHeight * 0.08, this.boundsHeight * 0.45);
    this.speed = p.random(0.12, 0.32);
    this.puffOffsets = Array.from({ length: 6 }, () => ({
      x: p.random(-50, 50),
      y: p.random(-20, 16),
      r: p.random(30, 70)
    }));
    this.alpha = p.random(120, 190);
  }

  update(speedMultiplier = 1) {
    this.x += this.speed * speedMultiplier;
    if (this.x - 200 * this.scale > this.boundsWidth) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    for (const puff of this.puffOffsets) {
      const wobble = p.sin((p.frameCount + puff.x) * 0.01) * 6;
      const wobbleY = p.cos((p.frameCount + puff.y) * 0.008) * 4;
      p.fill(240, 255, 255, this.alpha);
      p.ellipse(this.x + puff.x * this.scale + wobble, this.y + puff.y * this.scale + wobbleY, puff.r * this.scale * 2.4, puff.r * this.scale * 1.4);
    }
  }
}

export function createCloudScene(p) {
  let clouds = [];
  let speedMultiplier = 1;
  let sunPulse = 0;

  function ensureClouds() {
    const desired = Math.max(6, Math.floor(p.width / 160));
    while (clouds.length < desired) {
      const cloud = new Cloud(p, p.width, p.height);
      cloud.reset(true);
      clouds.push(cloud);
    }
    if (clouds.length > desired) {
      clouds.length = desired;
    }
  }

  return {
    id: 'clouds',
    name: 'Ciel pastel',
    description: 'Nuages lents et lumière douce',
    enter() {
      sunPulse = 0;
      clouds.forEach(cloud => cloud.reset(true));
    },
    resize() {
      clouds = clouds.map(() => new Cloud(p, p.width, p.height));
      ensureClouds();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      sunPulse = 1;
    },
    draw() {
      ensureClouds();
      const gradientSteps = 200;
      for (let i = 0; i < gradientSteps; i++) {
        const t = i / (gradientSteps - 1);
        const r = p.lerp(12, 220, t * 0.6);
        const g = p.lerp(28, 210, t * 0.6);
        const b = p.lerp(60, 255, t * 0.6 + 0.2);
        p.noStroke();
        p.fill(r, g, b);
        p.rect(0, t * p.height, p.width, p.height / gradientSteps + 1);
      }

      const sunX = p.width * 0.72;
      const sunY = p.height * 0.6;
      const baseRadius = Math.min(p.width, p.height) * 0.22;
      const intensity = p.lerp(0.3, 0.7, sunPulse);
      p.noStroke();
      for (let i = 4; i >= 0; i--) {
        const t = i / 4;
        const radius = baseRadius * p.lerp(1.2, 0.4, t + intensity * 0.2);
        p.fill(255, 220, 180, 80 * Math.pow(1 - t, 1.6));
        p.ellipse(sunX, sunY, radius * 2, radius * 2);
      }

      clouds.forEach(cloud => {
        cloud.boundsWidth = p.width;
        cloud.boundsHeight = p.height;
        cloud.update(speedMultiplier);
        cloud.draw();
      });

      sunPulse = p.max(0, sunPulse - 0.01 * speedMultiplier);

      p.noStroke();
      p.fill(0, 0, 0, 40);
      p.rect(0, p.height * 0.95, p.width, p.height * 0.1);
    }
  };
}
