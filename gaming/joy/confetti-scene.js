function createConfettiPiece(p) {
  return {
    x: p.random(p.width),
    y: p.random(p.height),
    size: p.random(7, 18),
    hue: p.random(0, 360),
    shape: p.random(['rect', 'circle', 'triangle', 'streamer', 'star']),
    vx: 0,
    vy: 0,
    rotation: p.random(p.TWO_PI),
    rotationSpeed: p.random(-0.12, 0.12),
    popTimer: p.random(10, 90)
  };
}

function popPiece(p, piece, opts = {}) {
  const { originX, originY, burst = false } = opts;
  const angle = p.random(p.TWO_PI);
  const baseMin = burst ? 3.2 : 2.2;
  const baseMax = burst ? 6.4 : 4.6;
  const speed = p.random(baseMin, baseMax);
  piece.x = originX !== undefined ? originX : p.random(p.width);
  piece.y = originY !== undefined ? originY : p.random(p.height);
  piece.vx = Math.cos(angle) * speed;
  piece.vy = Math.sin(angle) * speed;
  piece.rotationSpeed = p.random(-0.15, 0.15);
  piece.popTimer = p.random(burst ? 55 : 40, burst ? 130 : 100);
  piece.hue = (piece.hue + p.random(-40, 40) + 360) % 360;
}

function createSpark(p) {
  return {
    x: p.random(p.width),
    y: p.random(p.height * 0.4),
    vx: p.random(-1, 1),
    vy: p.random(-0.6, 0.4),
    life: p.random(30, 60),
    hue: p.random(0, 360)
  };
}

export function createConfettiScene(p) {
  let confetti = [];
  let sparks = [];
  let speedMultiplier = 1;
  let baseSpeed = null;
  let t = 0;
  let burstTimer = 0;

  function initConfetti() {
    const count = Math.max(120, Math.floor(p.width * p.height * 0.00015));
    confetti = Array.from({ length: count }, () => {
      const piece = createConfettiPiece(p);
      popPiece(p, piece);
      return piece;
    });
  }

  function initSparks() {
    const count = Math.max(80, Math.floor(p.width * p.height * 0.00008));
    sparks = Array.from({ length: count }, () => createSpark(p));
  }

  function triggerBurst() {
    const cx = p.random(p.width * 0.15, p.width * 0.85);
    const cy = p.random(p.height * 0.15, p.height * 0.85);
    const count = Math.floor(p.random(18, 42));
    for (let i = 0; i < count; i++) {
      const piece = confetti.length < 360 ? createConfettiPiece(p) : confetti[i % confetti.length];
      popPiece(p, piece, { originX: cx + p.random(-15, 15), originY: cy + p.random(-15, 15), burst: true });
      if (confetti.length < 360) confetti.push(piece);
    }
    burstTimer = p.random(45, 120);
  }

  return {
    id: 'confetti',
    enter() {
      p.colorMode(p.HSB, 360, 100, 100, 100);
      initConfetti();
      initSparks();
      t = 0;
      burstTimer = p.random(30, 90);
    },
    resize() {
      initConfetti();
      initSparks();
    },
    setSpeedMultiplier(multiplier = 1) {
      if (!baseSpeed) baseSpeed = multiplier;
      if (baseSpeed === undefined || baseSpeed === null) baseSpeed = multiplier;
      speedMultiplier = multiplier;
    },
    pulse() {
      const slowMode = baseSpeed < 0.9;
      const extra = slowMode ? 120 : 30;
      const burstRepeats = slowMode ? 2 : 1;
      for (let i = 0; i < 20 + extra; i++) {
        const piece = createConfettiPiece(p);
        popPiece(p, piece);
        confetti.push(piece);
      }
      if (confetti.length > 360) confetti.splice(0, confetti.length - 360);
      for (let r = 0; r < burstRepeats; r++) triggerBurst();
      burstTimer = Math.max(burstTimer, 20);
    },
    draw() {
      t += 0.006 * speedMultiplier;
      const baseHue = (t * 360) % 360;
      p.background(baseHue, 35, 98, 100);

      burstTimer -= speedMultiplier;
      if (burstTimer <= 0) {
        triggerBurst();
      }

      confetti.forEach(piece => {
        piece.popTimer -= speedMultiplier;
        piece.vx += p.noise(piece.x * 0.005, piece.y * 0.005, t * 30) * 0.2 - 0.1;
        piece.vy += p.noise(piece.y * 0.005, piece.x * 0.005, (t + 100) * 30) * 0.2 - 0.1;
        piece.vx *= 0.96;
        piece.vy *= 0.96;
        piece.x += piece.vx * speedMultiplier;
        piece.y += piece.vy * speedMultiplier;
        piece.rotation += piece.rotationSpeed * speedMultiplier;

        if (piece.x < -20 || piece.x > p.width + 20 || piece.y < -20 || piece.y > p.height + 20 || piece.popTimer <= 0) {
          popPiece(p, piece);
        }

        p.push();
        p.translate(piece.x, piece.y);
        p.rotate(piece.rotation);
        p.noStroke();
        p.fill(piece.hue, 90, 100, 85);
        switch (piece.shape) {
          case 'circle':
            p.circle(0, 0, piece.size);
            break;
          case 'triangle':
            p.triangle(
              -piece.size * 0.6, piece.size * 0.5,
              piece.size * 0.6, piece.size * 0.5,
              0, -piece.size * 0.7
            );
            break;
          case 'streamer':
            p.rect(-piece.size * 0.3, -piece.size * 1.2, piece.size * 0.6, piece.size * 2, 4);
            break;
          case 'star': {
            const spikes = 5;
            const outer = piece.size * 0.6;
            const inner = piece.size * 0.28;
            p.beginShape();
            for (let i = 0; i < spikes * 2; i++) {
              const r = i % 2 === 0 ? outer : inner;
              const a = i * p.PI / spikes;
              p.vertex(Math.cos(a) * r, Math.sin(a) * r);
            }
            p.endShape(p.CLOSE);
            break;
          }
          default:
            p.rect(0, 0, piece.size, piece.size * 0.6);
        }
        p.pop();
      });

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * speedMultiplier;
        s.y += s.vy * speedMultiplier;
        s.life -= speedMultiplier;
        p.noStroke();
        p.fill(s.hue, 95, 100, p.map(s.life, 0, 60, 0, 100));
        p.circle(s.x, s.y, p.map(s.life, 0, 60, 1, 6));
        if (s.life <= 0) {
          sparks[i] = createSpark(p);
        }
      }
    }
  };
}
