class Lantern {
  constructor(p) {
    this.p = p;
    this.reset(true);
  }

  reset(randomY = false) {
    const p = this.p;
    this.baseX = p.random(p.width);
    this.x = this.baseX;
    this.y = randomY ? p.random(p.height) : p.height + p.random(60, 220);
    this.scale = p.random(0.6, 1.4);
    this.floatSpeed = p.random(0.08, 0.18);
    this.swayAmplitude = p.random(10, 32);
    this.swaySpeed = p.random(0.0012, 0.0024);
    this.phase = p.random(p.TAU);
    this.glow = p.random(120, 200);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    this.phase += this.swaySpeed * speedMultiplier * 60;
    this.y -= this.floatSpeed * speedMultiplier * 12;
    if (this.y < -160 * this.scale) {
      this.reset();
    }
    this.x = this.baseX + p.sin(this.phase) * this.swayAmplitude;
  }

  draw(bloom = 0) {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.scale(this.scale);
    const glow = this.glow + bloom * 80;
    p.noStroke();
    p.fill(255, 210, 120, glow * 0.6);
    p.ellipse(0, -10, 80, 110);
    p.fill(255, 238, 190, glow);
    p.rectMode(p.CENTER);
    p.rect(0, 0, 64, 88, 28);
    p.fill(255, 198, 120, glow * 0.7);
    p.rect(0, -44, 38, 8, 4);
    p.rect(0, 44, 38, 8, 4);
    p.fill(36, 26, 16, 120);
    p.rect(0, -52, 48, 6, 3);
    p.rect(0, 52, 48, 6, 3);
    p.pop();
  }
}

class Sparkle {
  constructor(p) {
    this.p = p;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width);
    this.y = p.random(p.height);
    this.radius = p.random(1, 3.5);
    this.alpha = p.random(60, 130);
    this.speed = p.random(0.15, 0.35);
  }

  update(speedMultiplier = 1) {
    const p = this.p;
    this.y -= this.speed * speedMultiplier * 25;
    if (this.y < -10) {
      this.y = p.height + 10;
    }
    this.alpha = 60 + p.sin((p.frameCount + this.y) * 0.01) * 30;
  }

  draw(bloom = 0) {
    const p = this.p;
    p.noStroke();
    p.fill(255, 230, 190, this.alpha + bloom * 40);
    p.ellipse(this.x, this.y, this.radius * 2);
  }
}

export function createLanternScene(p) {
  const lanterns = [];
  const sparkles = [];
  let speedMultiplier = 1;
  let bloom = 0;

  function ensureElements() {
    const targetLanterns = Math.floor(p.width / 140) + 6;
    while (lanterns.length < targetLanterns) {
      const lantern = new Lantern(p);
      lantern.reset(true);
      lanterns.push(lantern);
    }
    lanterns.length = targetLanterns;

    const targetSparkles = Math.floor(p.width * p.height / 22000) + 40;
    while (sparkles.length < targetSparkles) {
      sparkles.push(new Sparkle(p));
    }
    sparkles.length = targetSparkles;
  }

  function drawGradient() {
    const top = [12, 24, 53];
    const bottom = [38, 18, 25];
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const r = p.lerp(top[0], bottom[0], t);
      const g = p.lerp(top[1], bottom[1], t);
      const b = p.lerp(top[2], bottom[2], t);
      p.stroke(r, g, b);
      p.line(0, y, p.width, y);
    }
  }

  return {
    id: 'lanterns',
    name: 'Lanternes célestes',
    description: 'Lampions flottants dans le ciel indigo',
    enter() {
      bloom = 1;
    },
    resize() {
      ensureElements();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      bloom = 1;
    },
    draw() {
      if (!lanterns.length || !sparkles.length) {
        ensureElements();
      }

      drawGradient();

      p.noStroke();
      p.fill(12, 12, 28, 160);
      p.rect(0, p.height * 0.78, p.width, p.height * 0.22);

      sparkles.forEach(sparkle => {
        sparkle.update(speedMultiplier);
        sparkle.draw(bloom);
      });

      lanterns.forEach(lantern => {
        lantern.update(speedMultiplier);
        lantern.draw(bloom);
      });

      if (bloom > 0.01) {
        p.noStroke();
        p.fill(255, 200, 120, bloom * 50);
        p.rect(0, 0, p.width, p.height);
        bloom = Math.max(0, bloom - 0.01 * speedMultiplier);
      }

      // distant mountains silhouettes
      p.noStroke();
      p.fill(8, 16, 36, 200);
      p.beginShape();
      p.vertex(0, p.height * 0.75);
      for (let x = 0; x <= p.width; x += 60) {
        const y = p.height * 0.72 + p.sin((x * 0.01) + p.frameCount * 0.002) * 12;
        p.vertex(x, y);
      }
      p.vertex(p.width, p.height * 0.75);
      p.vertex(p.width, p.height);
      p.vertex(0, p.height);
      p.endShape(p.CLOSE);
    }
  };
}
