export function createOpeningCeremony(p) {
  const ringColors = [
    p.color(0, 133, 199),
    p.color(0, 0, 0),
    p.color(221, 0, 49),
    p.color(244, 195, 0),
    p.color(0, 159, 61)
  ];

  const rings = [];
  const fireworks = [];
  const confetti = [];
  let pressCount = 0;
  let finalBurstAt = null;

  function ringPositions() {
    const w = p.width;
    const h = p.height;
    const ringSize = Math.min(w, h) * 0.16;
    const gap = ringSize * 0.9;
    const centerX = w * 0.5;
    const centerY = h * 0.45;
    return [
      { x: centerX - gap, y: centerY },
      { x: centerX, y: centerY },
      { x: centerX + gap, y: centerY },
      { x: centerX - gap * 0.5, y: centerY + ringSize * 0.55 },
      { x: centerX + gap * 0.5, y: centerY + ringSize * 0.55 }
    ].map(pos => ({ ...pos, size: ringSize }));
  }

  function launchFirework() {
    const baseX = p.random(p.width * 0.2, p.width * 0.8);
    const baseY = p.random(p.height * 0.15, p.height * 0.45);
    const burstColor = ringColors[pressCount % ringColors.length];
    for (let i = 0; i < 120; i += 1) {
      const angle = p.random(p.TWO_PI);
      const speed = p.random(1.5, 4.5);
      fireworks.push({
        x: baseX,
        y: baseY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 255,
        size: p.random(2, 5),
        color: burstColor
      });
    }
  }

  function launchFinale() {
    finalBurstAt = p.millis();
    for (let i = 0; i < 260; i += 1) {
      const angle = p.random(p.TWO_PI);
      const speed = p.random(2.5, 6);
      confetti.push({
        x: p.width / 2,
        y: p.height * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        rot: p.random(p.TWO_PI),
        vr: p.random(-0.2, 0.2),
        alpha: 255,
        size: p.random(6, 14),
        color: ringColors[i % ringColors.length]
      });
    }
  }

  function addRing() {
    const positions = ringPositions();
    const index = rings.length;
    if (index >= positions.length) return;
    rings.push({
      ...positions[index],
      progress: 0
    });
  }

  function handleAction() {
    if (pressCount >= 5) return;
    pressCount += 1;
    launchFirework();
    addRing();
    if (pressCount === 5) {
      launchFinale();
    }
  }

  function update(delta) {
    rings.forEach(ring => {
      ring.progress = Math.min(1, ring.progress + delta * 0.0008);
    });

    fireworks.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.02;
      particle.alpha -= 3;
    });

    for (let i = fireworks.length - 1; i >= 0; i -= 1) {
      if (fireworks[i].alpha <= 0) fireworks.splice(i, 1);
    }

    confetti.forEach(piece => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += 0.03;
      piece.rot += piece.vr;
      piece.alpha -= 1.2;
    });

    for (let i = confetti.length - 1; i >= 0; i -= 1) {
      if (confetti[i].alpha <= 0) confetti.splice(i, 1);
    }
  }

  function drawRings() {
    const positions = ringPositions();
    rings.forEach((ring, index) => {
      const pos = positions[index];
      p.push();
      p.translate(pos.x, pos.y);
      p.noFill();
      p.strokeWeight(pos.size * 0.12);
      p.stroke(ringColors[index]);
      p.strokeCap(p.ROUND);
      const endAngle = p.TWO_PI * ring.progress;
      p.arc(0, 0, pos.size, pos.size, -p.HALF_PI, -p.HALF_PI + endAngle);
      p.pop();
    });
  }

  function drawFireworks() {
    fireworks.forEach(particle => {
      p.noStroke();
      p.fill(particle.color.levels[0], particle.color.levels[1], particle.color.levels[2], particle.alpha);
      p.circle(particle.x, particle.y, particle.size);
    });
  }

  function drawConfetti() {
    confetti.forEach(piece => {
      p.push();
      p.translate(piece.x, piece.y);
      p.rotate(piece.rot);
      p.noStroke();
      p.fill(piece.color.levels[0], piece.color.levels[1], piece.color.levels[2], piece.alpha);
      p.rectMode(p.CENTER);
      p.rect(0, 0, piece.size, piece.size * 0.4, 2);
      p.pop();
    });
  }

  function drawBackground() {
    const top = p.color(9, 18, 58);
    const bottom = p.color(4, 8, 26);
    for (let y = 0; y < p.height; y += 4) {
      const t = y / p.height;
      const c = p.lerpColor(top, bottom, t);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }
    for (let i = 0; i < 60; i += 1) {
      p.noStroke();
      p.fill(255, 255, 255, p.random(50, 120));
      p.circle(p.random(p.width), p.random(p.height * 0.6), p.random(1, 3));
    }
  }

  function draw() {
    drawBackground();
    drawRings();
    drawFireworks();
    drawConfetti();

    if (finalBurstAt) {
      const elapsed = p.millis() - finalBurstAt;
      const glow = p.map(Math.sin(elapsed * 0.002), -1, 1, 80, 160);
      p.noFill();
      p.stroke(255, 214, 140, glow);
      p.strokeWeight(6);
      p.circle(p.width / 2, p.height * 0.45, Math.min(p.width, p.height) * 0.6);
    }
  }

  function isComplete() {
    return pressCount >= 5 && finalBurstAt && p.millis() - finalBurstAt > 4000;
  }

  return {
    title: "Cérémonie d'ouverture",
    handleAction,
    update,
    draw,
    isComplete
  };
}
