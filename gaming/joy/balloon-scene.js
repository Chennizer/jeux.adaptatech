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
  let releaseQueue = [];
  let baseSpeed = null;
  let calmMode = false;
  const RELEASE_PULSE_TIME = 480;

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
    const count = calmMode ? Math.floor(p.random(2, 4)) : Math.max(16, Math.floor(p.width * p.height * 0.00003));
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
      const previousCalm = calmMode;
      if (baseSpeed === null) baseSpeed = multiplier;
      calmMode = baseSpeed < 0.9;
      if (calmMode !== previousCalm) {
        resetPalette();
        initBalloons();
        releaseQueue = [];
      }
      speedMultiplier = multiplier;
    },
    pulse() {
      if (calmMode) {
        const batch = Math.floor(p.random(6, 8));
        releaseQueue.push(
          ...Array.from({ length: batch }, (_, i) => ({
            delay: i * 10,
            balloon: new Balloon(p, {
              x: p.random(p.width),
              y: p.height + p.random(30, 120),
              color: nextBalloonColor()
            })
          }))
        );
        releaseQueue.forEach(entry => {
          entry.balloon.colorPicker = nextBalloonColor;
          entry.balloon.spawnPulse = RELEASE_PULSE_TIME;
        });
        pulseGlow = 0.5;
      } else {
        balloons.forEach(b => {
          b.spawnPulse = RELEASE_PULSE_TIME;
        });
        for (let i = 0; i < 8; i++) {
          const balloon = new Balloon(p, { x: p.random(p.width), y: p.height + p.random(40, 140), color: nextBalloonColor() });
          balloon.colorPicker = nextBalloonColor;
          balloon.spawnPulse = RELEASE_PULSE_TIME;
          balloons.unshift(balloon);
        }
        if (balloons.length > 160) balloons.length = 160;
        pulseGlow = 0.8;
      }
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

      for (let i = releaseQueue.length - 1; i >= 0; i--) {
        const entry = releaseQueue[i];
        entry.delay -= speedMultiplier;
        if (entry.delay <= 0) {
          entry.balloon.colorPicker = nextBalloonColor;
          entry.balloon.spawnPulse = RELEASE_PULSE_TIME;
          balloons.unshift(entry.balloon);
          releaseQueue.splice(i, 1);
        }
      }

      balloons.forEach(balloon => {
        balloon.update(speedMultiplier);
        if (balloon.spawnPulse === undefined) balloon.spawnPulse = 0;
        const pulsePhase = Math.max(0, balloon.spawnPulse);
        const progress = pulsePhase > 0 ? (RELEASE_PULSE_TIME - pulsePhase) / RELEASE_PULSE_TIME : 1;
        const swell = pulsePhase > 0 ? 1 + 0.35 * Math.sin(progress * p.PI) * p.lerp(1, 0.5, progress) : 1;
        const glow = (calmMode ? swell : 1) + pulseGlow * 0.4;
        p.push();
        p.translate(balloon.x, balloon.y);
        p.scale(glow);
        p.translate(-balloon.x, -balloon.y);
        balloon.draw();
        p.pop();
        balloon.spawnPulse = Math.max(0, pulsePhase - speedMultiplier * 0.8);
      });

      pulseGlow = Math.max(0, pulseGlow - 0.08);
    }
  };
}
