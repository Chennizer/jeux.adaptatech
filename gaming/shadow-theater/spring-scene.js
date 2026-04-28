export function createSpringScene(p) {
  const petals = [];
  let lightPulse = 0;

  function resetPetals() {
    petals.length = 0;
    const count = Math.max(40, Math.floor((p.width + p.height) / 20));
    for (let i = 0; i < count; i += 1) {
      petals.push({
        x: p.random(-p.width * 0.1, p.width * 1.1),
        y: p.random(-p.height, p.height * 0.8),
        size: p.random(10, 26),
        speed: p.random(0.6, 1.6),
        drift: p.random(0.3, 1.1),
        rotation: p.random(p.TWO_PI),
        sway: p.random(0.4, 1.2)
      });
    }
  }

  function drawBackground() {
    const topColor = p.color(52, 92, 128);
    const bottomColor = p.color(16, 24, 34);
    for (let y = 0; y < p.height; y += 3) {
      const t = y / p.height;
      const c = p.lerpColor(topColor, bottomColor, t);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }
    // light cone
    p.noStroke();
    p.fill(180, 230, 255, 40 + 25 * Math.sin(lightPulse));
    p.rect(p.width / 2, p.height * 0.55, p.width * 0.9, p.height * 0.9, 80);
  }

  function drawSilhouette() {
    p.noStroke();
    p.fill(10, 14, 18, 200);
    p.rect(p.width / 2, p.height / 2, p.width * 0.96, p.height * 0.96, 20);

    p.fill(6, 7, 10, 240);
    const baseY = p.height * 0.75;
    p.rect(p.width / 2, baseY + 30, p.width * 0.98, p.height * 0.3, 0);

    // Branch silhouettes
    p.push();
    p.translate(p.width * 0.15, baseY - 60);
    p.stroke(12, 14, 18);
    p.strokeWeight(24);
    p.noFill();
    p.bezier(0, 0, p.width * 0.12, -120, p.width * 0.18, -160, p.width * 0.28, -200);
    p.bezier(0, 0, p.width * 0.08, -60, p.width * 0.13, -100, p.width * 0.2, -140);
    p.pop();
  }

  function drawPetals() {
    p.noStroke();
    petals.forEach(petal => {
      const sway = Math.sin(petal.y * 0.01 + lightPulse) * petal.sway * 8;
      const x = petal.x + sway;
      const y = petal.y;
      p.push();
      p.translate(x, y);
      p.rotate(petal.rotation + Math.sin(lightPulse * 0.5) * 0.08);
      p.fill(255, 200, 222, 160);
      p.ellipse(0, 0, petal.size * 0.9, petal.size * 0.6);
      p.fill(200, 150, 200, 180);
      p.ellipse(petal.size * 0.1, petal.size * 0.05, petal.size * 0.5, petal.size * 0.4);
      p.pop();

      petal.y += petal.speed;
      petal.x += petal.drift * 0.3;
      petal.rotation += 0.002 + petal.drift * 0.001;

      if (petal.y > p.height + 30) {
        petal.y = -20;
        petal.x = p.random(-p.width * 0.1, p.width * 1.1);
      }
    });
  }

  return {
    id: 'spring',
    enter() {
      resetPetals();
    },
    draw() {
      lightPulse += 0.01;
      drawBackground();
      drawSilhouette();
      drawPetals();
      p.noStroke();
      p.fill(220, 240, 255, 12);
      p.rect(p.width / 2, p.height / 2, p.width * 0.82, p.height * 0.82, 30);
    },
    resize() {
      resetPetals();
    }
  };
}
