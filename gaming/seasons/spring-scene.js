class Petal {
  constructor(p, palette) {
    this.p = p;
    this.palette = palette;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(-p.width * 0.1, p.width * 1.1);
    this.y = p.random(-p.height, -20);
    this.size = p.random(10, 26);
    this.speed = p.random(0.4, 1.1);
    this.swing = p.random(0.4, 1.2);
    this.angle = p.random(p.TWO_PI);
    this.color = p.color(this.palette[p.floor(p.random(this.palette.length))]);
  }

  update(multiplier) {
    const p = this.p;
    this.angle += 0.01 * multiplier;
    this.x += Math.cos(this.angle) * this.swing * multiplier;
    this.y += this.speed * 1.5 * multiplier;
    if (this.y > p.height + this.size) {
      this.reset();
      this.y = -this.size;
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle * 0.6);
    p.noStroke();
    p.fill(this.color);
    p.ellipse(0, 0, this.size * 0.8, this.size * 1.2);
    p.ellipse(this.size * 0.3, -this.size * 0.3, this.size * 0.5, this.size);
    p.pop();
  }
}

class Flower {
  constructor(p, palette, groundFn) {
    this.p = p;
    this.palette = palette;
    this.groundFn = groundFn;
    this.reset();
  }

  reset() {
    const p = this.p;
    this.x = p.random(p.width * 0.05, p.width * 0.95);
    this.stemHeight = p.random(p.height * 0.13, p.height * 0.22);
    this.headSize = p.random(16, 28);
    this.progress = 0;
    this.bloom = 0;
    this.fade = 1;
    this.growSpeed = p.random(0.18, 0.25);
    this.bloomSpeed = p.random(0.32, 0.52);
    this.fadeSpeed = p.random(0.25, 0.35);
    this.holdTime = p.random(5, 9);
    this.swaySeed = p.random(p.TWO_PI);
    this.petalColor = p.color(this.palette[p.floor(p.random(this.palette.length))]);
  }

  encourage() {
    this.progress = Math.min(1, this.progress + 0.2);
    this.bloom = Math.min(1, this.bloom + 0.25);
    this.holdTime = Math.max(this.holdTime, 2.2);
  }

  drawStem(baseX, baseY, tipX, tipY) {
    const p = this.p;
    p.stroke(60, 130, 80, 190 * this.fade);
    p.strokeWeight(4);
    p.line(baseX, baseY, tipX, tipY);

    if (this.progress > 0.3) {
      const leafSize = 14 * Math.min(1, this.progress);
      const leafOffset = (baseY - tipY) * 0.4;
      p.fill(90, 170, 110, 180 * this.fade);
      p.noStroke();
      p.push();
      p.translate(baseX, baseY - leafOffset);
      p.rotate(-0.6);
      p.ellipse(0, 0, leafSize * 0.7, leafSize);
      p.rotate(1.2);
      p.ellipse(0, 0, leafSize * 0.7, leafSize);
      p.pop();
    }
  }

  drawHead(tipX, tipY, sway) {
    const p = this.p;
    const bloom = Math.min(1, Math.max(0, this.bloom));
    const easedBloom = bloom * bloom;
    const size = this.headSize * easedBloom;
    if (size <= 0.5) return;

    p.noStroke();
    p.push();
    p.translate(tipX, tipY);
    p.rotate(sway * 0.03);
    for (let i = 0; i < 6; i += 1) {
      const angle = (p.TWO_PI / 6) * i;
      p.push();
      p.rotate(angle);
      p.fill(p.red(this.petalColor), p.green(this.petalColor), p.blue(this.petalColor), 150 * this.fade);
      p.ellipse(size, 0, size * 1.2, size * 0.9);
      p.pop();
    }
    p.fill(250, 230, 120, 220 * this.fade);
    p.ellipse(0, 0, size * 0.8);
    p.pop();
  }

  update(multiplier) {
    const p = this.p;
    const dt = Math.min(32, p.deltaTime || 16) / 1000;
    if (this.progress < 1) {
      this.progress = Math.min(1, this.progress + this.growSpeed * dt * multiplier);
    } else if (this.bloom < 1) {
      this.bloom = Math.min(1, this.bloom + this.bloomSpeed * dt * multiplier);
    } else {
      this.holdTime -= dt * multiplier;
      if (this.holdTime <= 0) {
        this.fade = Math.max(0, this.fade - this.fadeSpeed * dt * multiplier);
        if (this.fade <= 0.01) {
          this.reset();
        }
      }
    }
  }

  draw() {
    const p = this.p;
    const groundY = this.groundFn(this.x);
    const growth = this.progress * this.progress;
    const stem = this.stemHeight * growth;
    const sway = Math.sin(p.frameCount * 0.01 + this.swaySeed) * p.map(this.bloom, 0, 1, 2, 6);
    const tipX = this.x + sway;
    const tipY = groundY - stem;

    this.drawStem(this.x, groundY, tipX, tipY);
    this.drawHead(tipX, tipY, sway);
  }
}

export function createSpringScene(p) {
  const petals = [];
  const flowers = [];
  let palette = [];
  let speedMultiplier = 1;
  let bloom = 0;
  let targetFlowerCount = 0;
  let nextSpawnAt = 0;

  const groundY = x => {
    const hillHeight = p.height * 0.22;
    const baseY = p.height * 0.78;
    const offset = p.noise(x * 0.003, 0) * hillHeight * 0.45;
    return baseY - offset;
  };

  function resize() {
    petals.length = 0;
    const count = Math.floor(Math.max(60, (p.width * p.height) / 12000));
    palette = [
      [255, 219, 240],
      [250, 187, 215],
      [204, 238, 210],
      [189, 221, 255]
    ];
    for (let i = 0; i < count; i += 1) {
      petals.push(new Petal(p, palette));
    }

    flowers.length = 0;
    targetFlowerCount = Math.floor(Math.max(18, p.width / 70));
    const initial = Math.min(2, targetFlowerCount);
    for (let i = 0; i < initial; i += 1) {
      flowers.push(new Flower(p, palette, groundY));
    }
    nextSpawnAt = p.millis() + 400;
  }

  return {
    id: 'spring',
    name: 'Printemps',
    description: 'Brise douce et pétales flottants',
    resize,
    enter() {
      bloom = 1;
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      bloom = 1.4;
      flowers.forEach(flower => flower.encourage());
    },
    draw() {
      const top = p.color(212, 238, 255);
      const bottom = p.color(174, 214, 191);
      for (let y = 0; y < p.height; y += 2) {
        const mix = p.map(y, 0, p.height, 0, 1, true);
        const col = p.lerpColor(top, bottom, mix);
        p.stroke(col);
        p.line(0, y, p.width, y);
      }

      const glow = Math.max(0, bloom - 0.02);
      bloom = p.lerp(bloom, 0, 0.01 * speedMultiplier);
      if (glow > 0.01) {
        p.noStroke();
        p.fill(255, 255, 240, 80 * glow);
        p.rect(0, 0, p.width, p.height);
      }

      p.noStroke();
      const hillHeight = p.height * 0.22;
      for (let i = 0; i < 2; i += 1) {
        const baseY = p.height * 0.78 + i * 14;
        p.fill(90, 190, 130, 160 - i * 30);
        p.beginShape();
        p.vertex(-20, p.height);
        for (let x = -20; x <= p.width + 20; x += 16) {
          const offset = p.noise((x + i * 1000) * 0.003, i * 2) * hillHeight * 0.45;
          p.vertex(x, baseY - offset);
        }
        p.vertex(p.width + 20, p.height);
        p.endShape(p.CLOSE);
      }

      const now = p.millis();
      if (flowers.length < targetFlowerCount && now >= nextSpawnAt) {
        const remaining = targetFlowerCount - flowers.length;
        const spawnCount = Math.min(remaining, p.random([1, 2]));
        for (let i = 0; i < spawnCount; i += 1) {
          flowers.push(new Flower(p, palette, groundY));
        }
        nextSpawnAt = now + p.random(1600, 3200);
      }

      flowers.forEach(flower => {
        flower.update(speedMultiplier);
        flower.draw();
      });

      petals.forEach(petal => {
        petal.update(speedMultiplier);
        petal.draw();
      });
    }
  };
}
