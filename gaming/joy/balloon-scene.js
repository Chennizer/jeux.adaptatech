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
  let speedMultiplier = 1;
  let bgGradient = null;
  const basePalette = [0, 25, 50, 70, 120, 150, 190, 220, 260, 300, 330];
  let palettePool = [];
  let pulseGlow = 0;
  let popBursts = [];

  function createPopBurst(x, y, color) {
    const pieces = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = p.random(p.TWO_PI);
      const speed = p.random(2, 6);
      pieces.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: p.random(3, 8),
        hue: (color.hue + p.random(-10, 10) + 360) % 360,
        sat: color.saturation,
        bri: color.brightness,
        life: p.random(28, 48)
      });
    }
    popBursts.push(pieces);
  }

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

  return {
    id: 'balloons',
    enter() {
      p.colorMode(p.HSB, 360, 100, 100, 100);
      resetPalette();
      initBalloons();
      updateGradient();
    },
    resize() {
      resetPalette();
      initBalloons();
      updateGradient();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      if (!balloons.length) return;
      const popped = balloons.shift();
      createPopBurst(popped.x, popped.y, { hue: popped.hue, saturation: popped.saturation, brightness: popped.brightness });
      pulseGlow = 0.8;
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

      balloons.forEach(balloon => {
        balloon.update(speedMultiplier);
        const glow = 1 + pulseGlow * 0.4;
        p.push();
        p.translate(balloon.x, balloon.y);
        p.scale(glow);
        p.translate(-balloon.x, -balloon.y);
        balloon.draw();
        p.pop();
      });

      // pop bursts
      for (let i = popBursts.length - 1; i >= 0; i--) {
        const burst = popBursts[i];
        for (let j = burst.length - 1; j >= 0; j--) {
          const piece = burst[j];
          piece.x += piece.vx * speedMultiplier;
          piece.y += piece.vy * speedMultiplier;
          piece.vx *= 0.96;
          piece.vy *= 0.96;
          piece.life -= speedMultiplier;
          p.noStroke();
          p.fill(piece.hue, piece.sat, piece.bri, p.map(piece.life, 0, 48, 0, 90));
          p.circle(piece.x, piece.y, piece.size);
          if (piece.life <= 0) burst.splice(j, 1);
        }
        if (!burst.length) popBursts.splice(i, 1);
      }

      pulseGlow = Math.max(0, pulseGlow - 0.08);
    }
  };
}
