export function createSnowCanon(p) {
  const snowParticles = [];
  const sparkleParticles = [];
  let pressCount = 0;
  let finishedAt = null;

  function cannonOrigin() {
    return {
      x: p.width * 0.14,
      y: p.height * 0.8
    };
  }

  function emitSnow() {
    const origin = cannonOrigin();
    for (let i = 0; i < 90; i += 1) {
      snowParticles.push({
        x: origin.x,
        y: origin.y,
        vx: p.random(1.5, 3.5),
        vy: p.random(-3, -1.2),
        size: p.random(3, 7),
        alpha: 255
      });
    }
  }

  function emitSparkles() {
    for (let i = 0; i < 140; i += 1) {
      sparkleParticles.push({
        x: p.random(p.width * 0.35, p.width * 0.75),
        y: p.random(p.height * 0.35, p.height * 0.7),
        vx: p.random(-0.5, 0.5),
        vy: p.random(-0.5, 0.5),
        size: p.random(4, 10),
        alpha: 255
      });
    }
  }

  function handleAction() {
    if (pressCount >= 5) return;
    pressCount += 1;
    emitSnow();
    if (pressCount === 5) {
      finishedAt = p.millis();
      emitSparkles();
    }
  }

  function update() {
    snowParticles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.06;
      particle.vx += 0.01;
      particle.alpha -= 2.6;
    });

    for (let i = snowParticles.length - 1; i >= 0; i -= 1) {
      if (snowParticles[i].alpha <= 0 || snowParticles[i].y > p.height + 20) {
        snowParticles.splice(i, 1);
      }
    }

    sparkleParticles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha -= 2;
    });

    for (let i = sparkleParticles.length - 1; i >= 0; i -= 1) {
      if (sparkleParticles[i].alpha <= 0) sparkleParticles.splice(i, 1);
    }
  }

  function drawBackground() {
    const skyTop = p.color(195, 230, 255);
    const skyBottom = p.color(135, 195, 250);
    for (let y = 0; y < p.height; y += 3) {
      const t = y / p.height;
      const c = p.lerpColor(skyTop, skyBottom, t);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }
    p.noStroke();
    p.fill(255, 255, 255, 180);
    for (let i = 0; i < 16; i += 1) {
      p.circle(p.random(p.width), p.random(p.height * 0.4), p.random(40, 120));
    }
  }

  function drawMountain() {
    const baseHeight = p.height * 0.25;
    const growth = p.map(pressCount, 0, 5, 0.2, 1);
    const peakHeight = baseHeight + p.height * 0.35 * growth;
    p.noStroke();
    p.fill(240, 248, 255);
    p.beginShape();
    p.vertex(0, p.height);
    p.vertex(p.width * 0.2, p.height - baseHeight * 0.5);
    p.vertex(p.width * 0.5, p.height - peakHeight);
    p.vertex(p.width * 0.85, p.height - baseHeight);
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);

    p.fill(220, 236, 248, 180);
    p.beginShape();
    p.vertex(p.width * 0.15, p.height - baseHeight * 0.35);
    p.vertex(p.width * 0.45, p.height - peakHeight * 0.75);
    p.vertex(p.width * 0.65, p.height - baseHeight * 0.7);
    p.endShape(p.CLOSE);
  }

  function drawCannon() {
    const origin = cannonOrigin();
    p.push();
    p.translate(origin.x, origin.y);
    p.rotate(-p.PI / 8);
    p.fill(50, 70, 100);
    p.rect(-30, -10, 80, 20, 12);
    p.fill(80, 120, 160);
    p.rect(-20, -30, 50, 30, 10);
    p.pop();

    p.fill(60, 80, 110);
    p.rect(origin.x - 35, origin.y + 5, 70, 28, 12);
    p.fill(40, 60, 90);
    p.rect(origin.x - 15, origin.y + 30, 30, 18, 8);
  }

  function drawSnow() {
    snowParticles.forEach(particle => {
      p.noStroke();
      p.fill(255, 255, 255, particle.alpha);
      p.circle(particle.x, particle.y, particle.size);
    });
  }

  function drawSparkles() {
    sparkleParticles.forEach(particle => {
      p.noStroke();
      p.fill(255, 255, 255, particle.alpha);
      p.circle(particle.x, particle.y, particle.size);
    });
  }

  function draw() {
    drawBackground();
    drawMountain();
    drawCannon();
    drawSnow();
    drawSparkles();
  }

  function isComplete() {
    return pressCount >= 5 && finishedAt && p.millis() - finishedAt > 3500;
  }

  return {
    title: "Canon à neige",
    handleAction,
    update,
    draw,
    isComplete
  };
}
