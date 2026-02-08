const RING_COLORS = [
  ['#1d5dbf', '#6eb6ff'],
  ['#f6c028', '#ffe49f'],
  ['#1a1918', '#9b9b9b'],
  ['#38b269', '#9ff0c2'],
  ['#d2343f', '#ff9aa2']
];

const lerp = (a, b, t) => a + (b - a) * t;

function createFirework(origin, palette) {
  const particles = [];
  const count = 90 + Math.floor(Math.random() * 40);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.8 + Math.random() * 4.2;
    particles.push({
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: 2 + Math.random() * 3,
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }
  return { particles };
}

export function createOpeningCeremony(p) {
  let ringProgress = [];
  let ringTargets = [];
  let ringSparkles = [];
  let fireworks = [];
  let pressCount = 0;
  let complete = false;
  let finalBurstStart = null;
  let backgroundStars = [];

  const reset = () => {
    ringProgress = new Array(5).fill(0);
    ringTargets = new Array(5).fill(0);
    ringSparkles = [];
    fireworks = [];
    pressCount = 0;
    complete = false;
    finalBurstStart = null;
    backgroundStars = Array.from({ length: 120 }, () => ({
      x: Math.random() * p.width,
      y: Math.random() * p.height * 0.6,
      r: 0.6 + Math.random() * 1.6,
      tw: Math.random() * Math.PI * 2
    }));
  };

  const ringPositions = () => {
    const spacing = p.width * 0.12;
    const ringRadius = Math.min(p.width, p.height) * 0.08;
    const centerX = p.width * 0.5;
    const topY = p.height * 0.38;
    return [
      { x: centerX - spacing * 1.5, y: topY },
      { x: centerX - spacing * 0.5, y: topY },
      { x: centerX + spacing * 0.5, y: topY },
      { x: centerX - spacing, y: topY + ringRadius * 0.7 },
      { x: centerX, y: topY + ringRadius * 0.7 }
    ];
  };

  const emitRingSparkles = (ringIndex, pos, radius) => {
    const sparkleCount = 20 + Math.floor(Math.random() * 20);
    const palette = RING_COLORS[ringIndex];
    for (let i = 0; i < sparkleCount; i += 1) {
      ringSparkles.push({
        x: pos.x + (Math.random() - 0.5) * radius * 1.4,
        y: pos.y + (Math.random() - 0.5) * radius * 1.4,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        life: 1,
        color: palette[Math.floor(Math.random() * palette.length)]
      });
    }
  };

  const triggerFirework = () => {
    const palette = ['#ffd56a', '#ff7bac', '#8be7ff', '#a4ffb2', '#ffffff'];
    const origin = {
      x: p.width * (0.2 + Math.random() * 0.6),
      y: p.height * (0.12 + Math.random() * 0.35)
    };
    fireworks.push(createFirework(origin, palette));
  };

  const onPress = () => {
    if (complete) return;
    if (pressCount < 5) {
      ringTargets[pressCount] = 1;
      const positions = ringPositions();
      emitRingSparkles(pressCount, positions[pressCount], Math.min(p.width, p.height) * 0.08);
      triggerFirework();
      pressCount += 1;
      if (pressCount === 5) {
        finalBurstStart = performance.now();
      }
    }
  };

  const drawStadium = () => {
    p.noStroke();
    const baseY = p.height * 0.78;
    const stadiumHeight = p.height * 0.16;
    const gradientSteps = 10;
    for (let i = 0; i < gradientSteps; i += 1) {
      const t = i / (gradientSteps - 1);
      p.fill(8 + t * 40, 12 + t * 50, 24 + t * 60, 210);
      p.rect(0, baseY + t * stadiumHeight, p.width, stadiumHeight / gradientSteps + 1);
    }
    p.fill(255, 255, 255, 40);
    p.arc(p.width * 0.5, baseY, p.width * 1.2, stadiumHeight * 1.6, Math.PI, 0);
  };

  const drawRings = () => {
    const positions = ringPositions();
    const radius = Math.min(p.width, p.height) * 0.08;
    p.strokeWeight(radius * 0.16);
    positions.forEach((pos, i) => {
      if (ringProgress[i] <= 0) return;
      const palette = RING_COLORS[i];
      p.stroke(palette[0]);
      p.noFill();
      const arcSpan = Math.PI * 2 * ringProgress[i];
      p.arc(pos.x, pos.y, radius * 2, radius * 2, -Math.PI / 2, -Math.PI / 2 + arcSpan);
      p.stroke(palette[1]);
      p.strokeWeight(radius * 0.06);
      p.arc(pos.x, pos.y, radius * 2.2, radius * 2.2, -Math.PI / 2, -Math.PI / 2 + arcSpan);
      p.strokeWeight(radius * 0.16);
    });
  };

  const drawFireworks = () => {
    fireworks.forEach(firework => {
      firework.particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.02;
        particle.life -= 0.012;
        p.noStroke();
        const alpha = p.constrain(particle.life, 0, 1) * 255;
        const fireColor = p.color(particle.color);
        fireColor.setAlpha(alpha);
        p.fill(fireColor);
        p.circle(particle.x, particle.y, particle.size);
      });
      firework.particles = firework.particles.filter(particle => particle.life > 0);
    });
    fireworks = fireworks.filter(firework => firework.particles.length > 0);
  };

  const drawSparkles = () => {
    ringSparkles.forEach(spark => {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.life -= 0.02;
      p.noStroke();
      const alpha = p.constrain(spark.life, 0, 1) * 200;
      const sparkColor = p.color(spark.color);
      sparkColor.setAlpha(alpha);
      p.fill(sparkColor);
      p.circle(spark.x, spark.y, 3 + (1 - spark.life) * 4);
    });
    ringSparkles = ringSparkles.filter(spark => spark.life > 0);
  };

  const drawStars = () => {
    p.noStroke();
    backgroundStars.forEach(star => {
      star.tw += 0.02;
      const twinkle = 0.4 + Math.sin(star.tw) * 0.6;
      p.fill(255, 255, 255, 180 * twinkle);
      p.circle(star.x, star.y, star.r + twinkle);
    });
  };

  const drawFinalGlow = () => {
    if (!finalBurstStart) return;
    const elapsed = performance.now() - finalBurstStart;
    if (elapsed < 1800 && Math.random() < 0.15) {
      triggerFirework();
    }
    const glow = p.constrain(elapsed / 2200, 0, 1);
    p.noStroke();
    p.fill(255, 255, 255, 80 * glow);
    p.ellipse(p.width * 0.5, p.height * 0.42, p.width * (0.6 + glow * 0.4), p.height * 0.35);
    if (elapsed > 3200) {
      complete = true;
    }
  };

  const drawText = () => {
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont('Nunito');
    p.textSize(Math.min(p.width, p.height) * 0.035);
    p.fill(255, 255, 255, 200);
    p.text('Cérémonie d\'ouverture', p.width * 0.5, p.height * 0.16);
  };

  const draw = () => {
    p.background(6, 10, 30);
    for (let i = 0; i < 40; i += 1) {
      const t = i / 39;
      p.noStroke();
      p.fill(8 + t * 18, 15 + t * 30, 40 + t * 55, 80);
      p.rect(0, p.height * 0.2 + t * p.height * 0.7, p.width, p.height * 0.02 + 1);
    }
    drawStars();
    drawStadium();
    ringProgress = ringProgress.map((value, index) => {
      const target = ringTargets[index];
      if (value >= target) return value;
      return lerp(value, target, 0.08);
    });
    drawRings();
    drawSparkles();
    drawFireworks();
    drawFinalGlow();
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
    id: 'opening',
    enter,
    draw,
    onPress,
    resize,
    isComplete
  };
}
