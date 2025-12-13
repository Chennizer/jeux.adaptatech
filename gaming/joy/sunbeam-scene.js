const SKY_COLORS = [
  [14, 24, 44],
  [22, 46, 78],
  [40, 90, 140],
  [92, 180, 255]
];

export function createSunbeamScene(p) {
  let speedMultiplier = 1;
  let pulseScale = 0;
  const rays = Array.from({ length: 36 }).map((_, i) => ({
    angle: (p.TWO_PI / 36) * i,
    length: 0
  }));

  function drawBackground() {
    for (let y = 0; y < p.height; y++) {
      const t = y / Math.max(1, p.height - 1);
      const idx = t * (SKY_COLORS.length - 1);
      const a = Math.floor(idx);
      const b = Math.min(SKY_COLORS.length - 1, a + 1);
      const innerT = idx - a;
      const start = SKY_COLORS[a];
      const end = SKY_COLORS[b];
      const r = p.lerp(start[0], end[0], innerT);
      const g = p.lerp(start[1], end[1], innerT);
      const bcol = p.lerp(start[2], end[2], innerT);
      p.stroke(r, g, bcol);
      p.line(0, y, p.width, y);
    }
  }

  function drawSun() {
    const cx = p.width * 0.5;
    const cy = p.height * 0.62;
    const baseRadius = Math.min(p.width, p.height) * 0.18;
    const pulse = 1 + pulseScale * 0.35;
    p.noStroke();
    p.fill(255, 220, 120, 210);
    p.ellipse(cx, cy, baseRadius * 2 * pulse, baseRadius * 2 * pulse);
    p.fill(255, 180, 80, 160);
    p.ellipse(cx, cy, baseRadius * 2.6 * pulse, baseRadius * 2.6 * pulse);
  }

  return {
    id: 'sunbeam',
    enter() {
      pulseScale = 0.8;
    },
    resize() {},
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      pulseScale = 1;
    },
    draw() {
      drawBackground();
      const cx = p.width * 0.5;
      const cy = p.height * 0.62;
      const maxR = Math.hypot(p.width, p.height);
      p.push();
      p.translate(cx, cy);
      rays.forEach(ray => {
        const dynamic = 0.8 + p.sin(p.frameCount * 0.01 * speedMultiplier + ray.angle * 3) * 0.2;
        const len = p.lerp(maxR * 0.2, maxR * 0.75, dynamic);
        ray.length = len;
        p.stroke(255, 223, 140, 80);
        p.strokeWeight(8);
        p.rotate(ray.angle);
        p.line(0, 0, len, 0);
        p.rotate(-ray.angle);
      });
      p.pop();

      drawSun();
      pulseScale = p.lerp(pulseScale, 0, 0.02 * speedMultiplier);
    }
  };
}
