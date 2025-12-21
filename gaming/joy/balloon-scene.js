class Balloon {
  constructor(p, { x, y, color }) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.r = p.random(42, 72);
    this.assignColor(color);
    this.speed = p.random(0.35, 0.95);
    this.drift = p.random(-0.4, 0.4);
    this.wave = p.random(0.004, 0.01);
  }

  update(multiplier = 1) {
    const p = this.p;
    this.y -= this.speed * multiplier;
    this.x += p.sin(p.frameCount * this.wave) * 0.7 * multiplier + this.drift * multiplier;
    if (this.y < -this.r * 2) {
      this.reset(p.random(p.width), p.height + this.r * 2);
    }
  }

  reset(x, y) {
    const p = this.p;
    this.x = x;
    this.y = y;
    this.r = p.random(42, 78);
    this.assignColor();
    this.speed = p.random(0.35, 1.05);
    this.drift = p.random(-0.35, 0.35);
    this.wave = p.random(0.004, 0.01);
  }

  assignColor(color) {
    const chosen = color || this.colorPicker?.();
    if (chosen) {
      this.hue = chosen.hue;
      this.saturation = chosen.saturation;
      this.brightness = chosen.brightness;
    }
  }

  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(this.hue, this.saturation, this.brightness, 90);
    p.ellipse(this.x, this.y, this.r * 1.1, this.r * 1.35);
    p.fill(this.hue, this.saturation - 10, this.brightness + 5, 60);
    p.ellipse(this.x - this.r * 0.25, this.y - this.r * 0.3, this.r * 0.45, this.r * 0.45);
    p.stroke(this.hue, this.saturation, this.brightness - 10, 80);
    p.strokeWeight(2);
    p.noFill();
    p.bezier(
      this.x, this.y + this.r * 0.6,
      this.x + this.r * 0.2, this.y + this.r * 1.4,
      this.x - this.r * 0.3, this.y + this.r * 1.8,
      this.x + p.sin(p.frameCount * 0.015 + this.x * 0.01) * this.r * 0.25,
      this.y + this.r * 2.3
    );
  }
}

export function createBalloonScene(p) {
  let balloons = [];
  let confetti = [];
  let speedMultiplier = 1;
  let bgGradient = null;
  const basePalette = [0, 25, 50, 70, 120, 150, 190, 220, 260, 300, 330];
  let palettePool = [];

  function resetPalette() {
    palettePool = [];
  }

  function nextBalloonColor() {
    if (palettePool.length === 0) {
      palettePool = p.shuffle([...basePalette]);
    }
    const baseHue = palettePool.pop();
    return {
      hue: (baseHue + p.random(-6, 6) + 360) % 360,
      saturation: p.random(70, 95),
      brightness: p.random(82, 100)
    };
  }

  function updateGradient() {
    const ctx = p.drawingContext;
    const gradient = ctx.createLinearGradient(0, 0, 0, p.height);
    gradient.addColorStop(0, p.color(205, 60, 96, 100).toString());
    gradient.addColorStop(0.5, p.color(280, 25, 98, 100).toString());
    gradient.addColorStop(1, p.color(330, 30, 90, 100).toString());
    bgGradient = gradient;
  }

  function initBalloons() {
    const count = Math.max(16, Math.floor(p.width * p.height * 0.00003));
    balloons = Array.from({ length: count }, () =>
      new Balloon(p, { x: p.random(p.width), y: p.random(p.height), color: nextBalloonColor() })
    );
    balloons.forEach(balloon => {
      balloon.colorPicker = nextBalloonColor;
    });
  }

  function initConfetti() {
    const count = Math.max(60, Math.floor(p.width * p.height * 0.0001));
    confetti = Array.from({ length: count }, () => ({
      x: p.random(p.width),
      y: p.random(p.height),
      size: p.random(3, 7),
      hue: p.random(0, 360),
      speed: p.random(0.4, 1.1),
      sway: p.random(0.008, 0.014)
    }));
  }

  return {
    id: 'balloons',
    enter() {
      p.colorMode(p.HSB, 360, 100, 100, 100);
      resetPalette();
      initBalloons();
      initConfetti();
      updateGradient();
    },
    resize() {
      resetPalette();
      initBalloons();
      initConfetti();
      updateGradient();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      for (let i = 0; i < 8; i++) {
        const balloon = new Balloon(p, { x: p.random(p.width), y: p.height + p.random(40, 140), color: nextBalloonColor() });
        balloon.colorPicker = nextBalloonColor;
        balloons.unshift(balloon);
      }
      if (balloons.length > 160) balloons.length = 160;
    },
    draw() {
      if (!bgGradient) {
        updateGradient();
      }
      const ctx = p.drawingContext;
      ctx.save();
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, p.width, p.height);
      ctx.restore();

      confetti.forEach(piece => {
        piece.y += piece.speed * speedMultiplier;
        piece.x += p.sin(p.frameCount * piece.sway) * 0.8 * speedMultiplier;
        if (piece.y > p.height + piece.size) {
          piece.y = -piece.size;
          piece.x = p.random(p.width);
        }
        p.noStroke();
        p.fill(piece.hue, 85, 95, 90);
        p.rect(piece.x, piece.y, piece.size, piece.size * 1.4);
      });

      balloons.forEach(balloon => {
        balloon.update(speedMultiplier);
        balloon.draw();
      });
    }
  };
}
