function createConfettiPiece(p) {
  return {
    x: p.random(p.width),
    y: p.random(-p.height, p.height),
    size: p.random(6, 14),
    hue: p.random(0, 360),
    speed: p.random(1.2, 2.4),
    sway: p.random(0.004, 0.01),
    rotation: p.random(p.TWO_PI),
    rotationSpeed: p.random(-0.08, 0.08)
  };
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
  let t = 0;

  function initConfetti() {
    const count = Math.max(120, Math.floor(p.width * p.height * 0.00015));
    confetti = Array.from({ length: count }, () => createConfettiPiece(p));
  }

  function initSparks() {
    const count = Math.max(80, Math.floor(p.width * p.height * 0.00008));
    sparks = Array.from({ length: count }, () => createSpark(p));
  }

  return {
    id: 'confetti',
    enter() {
      p.colorMode(p.HSB, 360, 100, 100, 100);
      initConfetti();
      initSparks();
      t = 0;
    },
    resize() {
      initConfetti();
      initSparks();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      for (let i = 0; i < 40; i++) confetti.push(createConfettiPiece(p));
      if (confetti.length > 320) confetti.splice(0, confetti.length - 320);
    },
    draw() {
      t += 0.006 * speedMultiplier;
      const baseHue = (t * 360) % 360;
      p.background(baseHue, 35, 98, 100);

      confetti.forEach(piece => {
        piece.y += piece.speed * speedMultiplier;
        piece.x += p.sin(p.frameCount * piece.sway + piece.y * 0.02) * 1.6 * speedMultiplier;
        piece.rotation += piece.rotationSpeed * speedMultiplier;
        if (piece.y > p.height + piece.size) {
          Object.assign(piece, createConfettiPiece(p));
          piece.y = -piece.size;
        }
        p.push();
        p.translate(piece.x, piece.y);
        p.rotate(piece.rotation);
        p.noStroke();
        p.fill(piece.hue, 90, 100, 85);
        p.rect(0, 0, piece.size, piece.size * 0.6);
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
