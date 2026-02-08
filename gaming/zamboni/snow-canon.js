function createSnowParticle(p, x, y, burst = false) {
  const angle = burst ? p.random(-p.PI / 5, -p.PI / 2) : p.random(p.TWO_PI);
  const speed = burst ? p.random(3, 6) : p.random(0.3, 1.2);
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: p.random(2, 6),
    life: burst ? p.random(70, 110) : p.random(160, 260),
    alpha: p.random(120, 210)
  };
}

export function createSnowCanon(p) {
  const falling = [];
  const bursts = [];
  const sparkles = [];
  let presses = 0;
  let mountainTarget = 0;
  let mountainProgress = 0;
  let complete = false;
  let completeStart = null;

  function spawnFalling() {
    for (let i = 0; i < 140; i += 1) {
      falling.push(createSnowParticle(p, p.random(p.width), p.random(-p.height, 0)));
    }
  }

  function drawSky() {
    p.noFill();
    for (let y = 0; y < p.height; y += 4) {
      const t = y / p.height;
      const top = p.color(18, 36, 63);
      const bottom = p.color(64, 112, 166);
      const gradient = p.lerpColor(top, bottom, t);
      p.stroke(gradient);
      p.line(0, y, p.width, y);
    }
    p.noStroke();
  }

  function updateSnow() {
    falling.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.y += 0.3;
      if (particle.y > p.height + 10) {
        particle.y = p.random(-200, -10);
        particle.x = p.random(p.width);
      }
    });

    bursts.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.05;
      particle.life -= 1;
    });

    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      if (bursts[i].life <= 0) bursts.splice(i, 1);
    }

    if (presses >= 5 && !completeStart) {
      completeStart = p.millis();
    }
    if (completeStart && p.millis() - completeStart > 4200) {
      complete = true;
    }
  }

  function drawSnow() {
    p.push();
    p.noStroke();
    falling.forEach(particle => {
      p.fill(255, 255, 255, particle.alpha);
      p.circle(particle.x, particle.y, particle.r);
    });
    bursts.forEach(particle => {
      const alpha = p.map(particle.life, 0, 110, 0, particle.alpha);
      p.fill(230, 245, 255, alpha);
      p.circle(particle.x, particle.y, particle.r);
    });
    p.pop();
  }

  function drawMountain() {
    const baseY = p.height * 0.78;
    const maxHeight = p.height * 0.38;
    const mountainHeight = p.lerp(0, maxHeight, mountainProgress);
    p.push();
    p.noStroke();
    p.fill(230, 240, 255, 220);
    p.beginShape();
    p.vertex(p.width * 0.1, baseY);
    p.vertex(p.width * 0.4, baseY - mountainHeight);
    p.vertex(p.width * 0.75, baseY);
    p.vertex(p.width * 0.98, baseY + 40);
    p.vertex(p.width * 0.02, baseY + 40);
    p.endShape(p.CLOSE);

    p.fill(255, 255, 255, 230);
    p.beginShape();
    p.vertex(p.width * 0.25, baseY - mountainHeight * 0.2);
    p.vertex(p.width * 0.4, baseY - mountainHeight * 0.85);
    p.vertex(p.width * 0.55, baseY - mountainHeight * 0.2);
    p.endShape(p.CLOSE);
    p.pop();
  }

  function drawCanon() {
    const baseX = p.width * 0.1;
    const baseY = p.height * 0.8;
    p.push();
    p.translate(baseX, baseY);
    p.noStroke();
    p.fill(30, 50, 80);
    p.rect(0, 0, 90, 50, 12);
    p.fill(50, 90, 130);
    p.rect(30, -30, 110, 30, 12);
    p.fill(80, 130, 170);
    p.rect(90, -60, 100, 26, 12);
    p.fill(180, 220, 255, 140);
    p.ellipse(140, -48, 120, 42);
    p.pop();
  }

  function drawSparkles() {
    if (presses < 5) return;
    if (sparkles.length < 50) {
      for (let i = 0; i < 40; i += 1) {
        sparkles.push({
          x: p.random(p.width * 0.2, p.width * 0.8),
          y: p.random(p.height * 0.4, p.height * 0.7),
          r: p.random(2, 6),
          alpha: p.random(80, 180),
          drift: p.random(-0.5, 0.5)
        });
      }
    }
    p.push();
    p.noStroke();
    sparkles.forEach(star => {
      star.alpha += star.drift;
      if (star.alpha < 60 || star.alpha > 200) star.drift *= -1;
      p.fill(255, 255, 255, star.alpha);
      p.circle(star.x, star.y, star.r);
    });
    p.pop();
  }

  function handlePress() {
    if (complete) return;
    if (presses < 5) {
      presses += 1;
      mountainTarget = presses / 5;
      const nozzleX = p.width * 0.22;
      const nozzleY = p.height * 0.68;
      for (let i = 0; i < 60; i += 1) {
        bursts.push(createSnowParticle(p, nozzleX, nozzleY, true));
      }
    }
  }

  spawnFalling();

  return {
    id: 'snow',
    enter() {
      presses = 0;
      mountainTarget = 0;
      mountainProgress = 0;
      complete = false;
      completeStart = null;
      bursts.length = 0;
      sparkles.length = 0;
    },
    update() {
      mountainProgress = p.lerp(mountainProgress, mountainTarget, 0.05);
      updateSnow();
    },
    draw() {
      drawSky();
      drawMountain();
      drawSnow();
      drawCanon();
      drawSparkles();
      p.push();
      p.fill(240, 248, 255, 220);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(Math.min(24, p.width * 0.028));
      p.text('Canon à neige — Appuie 5 fois', p.width / 2, p.height * 0.15);
      p.pop();
    },
    handlePress,
    isComplete() {
      return complete;
    },
    resize() {
      falling.length = 0;
      spawnFalling();
    }
  };
}
