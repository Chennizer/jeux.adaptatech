class Ripple {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.alpha = 160;
  }

  update(speed = 1) {
    this.radius += 0.65 * speed;
    this.alpha *= 0.985;
    return this.alpha > 6;
  }

  draw() {
    const p = this.p;
    p.noFill();
    p.stroke(190, 230, 255, this.alpha);
    p.strokeWeight(1.4);
    p.ellipse(this.x, this.y, this.radius * 2.4, this.radius);
  }
}

class Lotus {
  constructor(p, x, y, scale = 1) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.petalOffset = p.random(p.TWO_PI);
    this.alpha = p.random();
    this.targetAlpha = p.random() > 0.5 ? 1 : 0;
    this.cycleOffset = p.random(1000);
  }

  update(time = 0, speed = 1) {
    const p = this.p;
    const cycle = p.noise(this.cycleOffset, time * 0.00005 * speed);
    this.targetAlpha = cycle > 0.52 ? 1 : 0;
    const lerpRate = 0.01 * speed;
    this.alpha = p.lerp(this.alpha, this.targetAlpha, lerpRate);
  }

  draw(time = 0, alpha = 1) {
    const p = this.p;
    const wobble = p.sin(time * 0.001 + this.petalOffset) * 0.2;
    p.push();
    p.translate(this.x, this.y + wobble * 6 * this.scale);
    p.scale(this.scale);
    p.noStroke();
    const petals = 6;
    for (let i = 0; i < petals; i++) {
      const angle = (p.TWO_PI / petals) * i;
      const hue = p.map(i, 0, petals, 200, 340);
      p.fill(244, 205, 255, 160 * alpha);
      p.push();
      p.rotate(angle);
      p.beginShape();
      p.vertex(0, 0);
      p.bezierVertex(16, -6, 24, -20, 0, -38);
      p.bezierVertex(-24, -20, -16, -6, 0, 0);
      p.endShape();
      p.pop();
    }

    p.fill(255, 242, 170, 220 * alpha);
    p.ellipse(0, -6, 16, 16);
    p.pop();
  }
}

export function createLotusScene(p) {
  let ripples = [];
  let lotusFlowers = [];
  let bloomLotus = [];
  let lilyPadShadows = [];
  let speedMultiplier = 1;
  let currentTime = 0;
  const maxLotusCount = 26;
  const bloomDuration = 5000;
  const bloomFadeIn = 800;
  const bloomFadeOut = 1500;
  let bloomActive = false;
  let bloomCooldownUntil = 0;

  function spawnRipple(x, y) {
    ripples.push(new Ripple(p, x, y));
  }

  function spawnLotus(x, y, scale, options = {}) {
    const { bloom = false, duration = bloomDuration, fadeIn = bloomFadeIn, fadeOut = bloomFadeOut } = options;
    const flower = new Lotus(
      p,
      x ?? p.random(p.width * 0.08, p.width * 0.92),
      y ?? p.random(p.height * 0.35, p.height * 0.85),
      scale ?? p.random(0.7, 1.4)
    );
    flower.alpha = bloom ? 0 : 1;
    if (bloom) {
      flower.isBloom = true;
      flower.bloomDuration = duration;
      flower.fadeIn = fadeIn;
      flower.fadeOut = fadeOut;
      flower.elapsed = 0;
      bloomLotus.push(flower);
    } else {
      lotusFlowers.push(flower);
      if (lotusFlowers.length > maxLotusCount) {
        lotusFlowers.shift();
      }
    }
    return flower;
  }

  function rebuildLotus() {
    lotusFlowers = [];
    bloomLotus = [];
    bloomActive = false;
    lilyPadShadows = [];
    const padCount = Math.max(14, Math.floor(p.width / 140));
    for (let i = 0; i < padCount; i++) {
      lilyPadShadows.push({
        x: p.random(p.width * 0.04, p.width * 0.96),
        y: p.random(p.height * 0.28, p.height * 0.92),
        w: p.random(70, 150),
        h: p.random(26, 50),
        rotation: p.random(-0.2, 0.2)
      });
    }
  }

  return {
    id: 'lotus',
    name: 'Étang de lotus',
    description: 'Ondulations calmes et fleurs flottantes',
    enter() {
      ripples = [];
      bloomLotus = [];
      bloomActive = false;
      bloomCooldownUntil = 0;
      rebuildLotus();
    },
    resize() {
      ripples = [];
      bloomLotus = [];
      bloomActive = false;
      bloomCooldownUntil = 0;
      rebuildLotus();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      const now = p.millis();
      if (bloomActive || now < bloomCooldownUntil) return;
      bloomActive = true;
      bloomCooldownUntil = now + bloomDuration;
      const clusterCenterX = p.random(p.width * 0.2, p.width * 0.8);
      const clusterCenterY = p.random(p.height * 0.4, p.height * 0.8);
      const clusterCount = Math.floor(p.random(5, 8));
      for (let i = 0; i < clusterCount; i++) {
        const offsetX = p.random(-80, 80);
        const offsetY = p.random(-24, 24);
        const newLotus = spawnLotus(clusterCenterX + offsetX, clusterCenterY + offsetY, p.random(0.85, 1.5), {
          bloom: true
        });
        spawnRipple(newLotus.x + p.random(-10, 10), newLotus.y + p.random(-6, 8));
      }
    },
    draw() {
      const delta = p.deltaTime || 16;
      currentTime += delta * speedMultiplier;
      const waterSteps = 200;
      const heightStep = p.height / waterSteps;
      p.noStroke();
      for (let i = 0; i < waterSteps; i++) {
        const t = i / (waterSteps - 1);
        const r = p.lerp(14, 34, t);
        const g = p.lerp(78, 136, t);
        const b = p.lerp(104, 176, t);
        p.fill(r, g, b);
        p.rect(0, i * heightStep, p.width, heightStep + 1);
      }

      const patchRows = Math.max(6, Math.floor(p.height / 60));
      for (let r = 0; r < patchRows; r++) {
        const y = (r / patchRows) * p.height;
        const t = y / p.height;
        const base = {
          r: p.lerp(20, 40, t),
          g: p.lerp(92, 150, t),
          b: p.lerp(120, 186, t)
        };
        const bandAlpha = p.lerp(26, 14, t);
        for (let x = 0; x <= p.width; x += 42) {
          const noiseVal = p.noise(x * 0.004, r * 0.2, currentTime * 0.0001);
          const size = p.lerp(80, 140, noiseVal);
          const jitterY = p.lerp(-12, 12, p.noise(x * 0.006, currentTime * 0.0002));
          p.fill(base.r, base.g, base.b, bandAlpha);
          p.ellipse(x, y + jitterY, size, size * 0.35);
        }
      }

      lilyPadShadows.forEach(pad => {
        p.push();
        p.translate(pad.x, pad.y);
        p.rotate(pad.rotation);
        const t = pad.y / p.height;
        const baseR = p.lerp(12, 22, t);
        const baseG = p.lerp(80, 110, t);
        const baseB = p.lerp(90, 130, t);
        p.fill(baseR, baseG, baseB, 120);
        p.ellipse(0, 0, pad.w, pad.h);
        p.pop();
      });

      ripples = ripples.filter(ripple => {
        const alive = ripple.update(speedMultiplier);
        ripple.draw();
        return alive;
      });

      bloomLotus = bloomLotus.filter(flower => {
        flower.elapsed += delta;
        const elapsed = flower.elapsed;
        const duration = flower.bloomDuration;
        const fadeIn = flower.fadeIn;
        const fadeOut = flower.fadeOut;

        if (elapsed < fadeIn) {
          flower.alpha = p.map(elapsed, 0, fadeIn, 0, 1, true);
        } else if (elapsed > duration - fadeOut) {
          flower.alpha = p.map(elapsed, duration - fadeOut, duration, 1, 0, true);
        } else {
          flower.alpha = 1;
        }

        const padAlpha = 70 + flower.alpha * 90;
        const padT = flower.y / p.height;
        const padR = p.lerp(30, 50, padT);
        const padG = p.lerp(120, 150, padT);
        const padB = p.lerp(120, 170, padT);
        p.fill(padR, padG, padB, padAlpha);
        p.ellipse(flower.x, flower.y + 12, 92 * flower.scale, 32 * flower.scale);

        flower.draw(currentTime, flower.alpha);

        return elapsed < duration;
      });

      lotusFlowers.forEach(flower => {
        flower.update(currentTime, speedMultiplier);
        if (flower.alpha < 0.02) {
          return;
        }
        const padAlpha = 70 + flower.alpha * 90;
        const padT = flower.y / p.height;
        const padR = p.lerp(30, 50, padT);
        const padG = p.lerp(120, 150, padT);
        const padB = p.lerp(120, 170, padT);
        p.fill(padR, padG, padB, padAlpha);
        p.ellipse(flower.x, flower.y + 12, 92 * flower.scale, 32 * flower.scale);

        flower.draw(currentTime, flower.alpha);

        if (p.random() < 0.008 * speedMultiplier * flower.alpha) {
          spawnRipple(flower.x + p.random(-18, 18), flower.y + p.random(-6, 8));
        }
      });

      if (bloomActive && bloomLotus.length === 0) {
        bloomActive = false;
      }
    }
  };
}
