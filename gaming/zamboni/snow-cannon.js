const lerp = (a, b, t) => a + (b - a) * t;

function createParticle(origin) {
  return {
    x: origin.x,
    y: origin.y,
    vx: 2 + Math.random() * 3,
    vy: -4 - Math.random() * 3,
    life: 1,
    size: 3 + Math.random() * 4
  };
}

export function createSnowCannon(p) {
  let pressCount = 0;
  let mountainTarget = 0;
  let mountainHeight = 0;
  let snowBursts = [];
  let driftingSnow = [];
  let complete = false;
  let completionStart = null;

  const reset = () => {
    pressCount = 0;
    mountainTarget = 0;
    mountainHeight = 0;
    snowBursts = [];
    driftingSnow = Array.from({ length: 160 }, () => ({
      x: Math.random() * p.width,
      y: Math.random() * p.height,
      size: 1 + Math.random() * 3,
      speed: 0.5 + Math.random() * 1.2
    }));
    complete = false;
    completionStart = null;
  };

  const onPress = () => {
    if (complete) return;
    if (pressCount < 5) {
      pressCount += 1;
      mountainTarget = pressCount / 5;
      const origin = { x: p.width * 0.14, y: p.height * 0.78 };
      for (let i = 0; i < 60; i += 1) {
        snowBursts.push(createParticle(origin));
      }
      if (pressCount === 5) {
        completionStart = performance.now();
      }
    }
  };

  const drawSky = () => {
    for (let i = 0; i < 60; i += 1) {
      const t = i / 59;
      p.noStroke();
      p.fill(20 + t * 30, 40 + t * 60, 80 + t * 80, 255);
      p.rect(0, t * p.height, p.width, p.height / 60 + 1);
    }
  };

  const drawAurora = () => {
    p.noFill();
    for (let i = 0; i < 3; i += 1) {
      const offset = i * 60;
      p.stroke(120, 220, 255, 70 - i * 10);
      p.strokeWeight(40 - i * 8);
      p.beginShape();
      for (let x = 0; x <= p.width; x += 40) {
        const y = p.height * 0.2 + Math.sin((x + offset) * 0.01 + p.frameCount * 0.01) * 20 + i * 20;
        p.vertex(x, y);
      }
      p.endShape();
    }
  };

  const drawSnow = () => {
    driftingSnow.forEach(flake => {
      flake.y += flake.speed;
      flake.x += Math.sin(p.frameCount * 0.01 + flake.y * 0.02) * 0.3;
      if (flake.y > p.height) {
        flake.y = -10;
        flake.x = Math.random() * p.width;
      }
      p.noStroke();
      p.fill(255, 255, 255, 200);
      p.circle(flake.x, flake.y, flake.size);
    });
  };

  const drawMountain = () => {
    const baseY = p.height * 0.82;
    const maxHeight = p.height * 0.45;
    mountainHeight = lerp(mountainHeight, mountainTarget, 0.03);
    const currentHeight = maxHeight * mountainHeight;
    p.noStroke();
    p.fill(230, 238, 255);
    p.beginShape();
    p.vertex(0, baseY);
    for (let x = 0; x <= p.width; x += 30) {
      const noise = p.noise(x * 0.004, p.frameCount * 0.002);
      const peak = baseY - currentHeight - noise * 40;
      p.vertex(x, peak);
    }
    p.vertex(p.width, baseY);
    p.endShape(p.CLOSE);

    p.fill(255, 255, 255, 120);
    p.beginShape();
    p.vertex(0, baseY);
    for (let x = 0; x <= p.width; x += 30) {
      const noise = p.noise(x * 0.006 + 100, p.frameCount * 0.002 + 5);
      const peak = baseY - currentHeight * 0.6 - noise * 30;
      p.vertex(x, peak);
    }
    p.vertex(p.width, baseY);
    p.endShape(p.CLOSE);
  };

  const drawCannon = () => {
    const baseX = p.width * 0.08;
    const baseY = p.height * 0.82;
    p.push();
    p.translate(baseX, baseY);
    p.noStroke();
    p.fill(30, 40, 70);
    p.rect(-20, -10, 40, 20, 8);
    p.fill(60, 80, 140);
    p.rect(0, -28, 70, 20, 8);
    p.fill(200, 220, 255);
    p.circle(-16, 5, 18);
    p.circle(16, 5, 18);
    p.pop();
  };

  const drawBurst = () => {
    snowBursts.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.15;
      particle.life -= 0.02;
      p.noStroke();
      p.fill(255, 255, 255, particle.life * 255);
      p.circle(particle.x, particle.y, particle.size);
    });
    snowBursts = snowBursts.filter(particle => particle.life > 0);
  };

  const drawText = () => {
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont('Nunito');
    p.textSize(Math.min(p.width, p.height) * 0.033);
    p.fill(245, 248, 255, 220);
    p.text('Canon à neige', p.width * 0.5, p.height * 0.13);
  };

  const drawCompletionGlow = () => {
    if (!completionStart) return;
    const elapsed = performance.now() - completionStart;
    const glow = p.constrain(elapsed / 2000, 0, 1);
    p.noStroke();
    p.fill(255, 255, 255, 90 * glow);
    p.ellipse(p.width * 0.5, p.height * 0.5, p.width * 0.8, p.height * 0.6);
    if (elapsed > 2600) {
      complete = true;
    }
  };

  const draw = () => {
    drawSky();
    drawAurora();
    drawSnow();
    drawMountain();
    drawCannon();
    drawBurst();
    drawCompletionGlow();
    drawText();
  };

  const resize = () => {
    reset();
  };

  const enter = () => {
    reset();
  };

  const isComplete = () => complete;

  return {
    id: 'snow-cannon',
    enter,
    draw,
    onPress,
    resize,
    isComplete
  };
}
