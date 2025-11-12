const STAR_DENSITY = 0.00025;

function lerpColor(p, c1, c2, t) {
  return p.lerpColor(c1, c2, p.constrain(t, 0, 1));
}

export function createCandleScene(p) {
  let stars = [];
  let embers = [];
  let glow = 0;
  let t = 0;
  let metrics = null;
  let speedMultiplier = 1;

  function initStars() {
    const count = Math.max(80, Math.floor(p.width * p.height * STAR_DENSITY));
    stars = [];
    for (let i = 0; i < count; i += 1) {
      stars.push({
        x: p.random(p.width),
        y: p.random(p.height),
        r: p.random(0.6, 1.8),
        base: p.random(60, 140),
        tw: p.random(0.2, 0.6),
        spd: p.random(0.15, 0.5),
        phase: p.random(p.TWO_PI)
      });
    }
  }

  function computeMetrics() {
    const cx = p.width / 2;
    const w = Math.min(170, p.width * 0.12);
    const h = Math.min(420, p.height * 0.58);
    const baseY = p.height;
    const cy = baseY;
    const r = 20;
    const topY = cy - h;
    const wickHeight = h * 0.12;
    const wickBaseY = topY + 14;
    const wickTopY = wickBaseY - wickHeight;
    const flameY = wickTopY - h * 0.04;

    return { cx, cy, w, h, r, topY, wickBaseY, wickTopY, flameY, baseY };
  }

  function drawNightSky() {
    p.push();
    p.noStroke();
    p.rectMode(p.CORNER);
    for (let y = 0; y < p.height; y += 4) {
      const tRow = y / p.height;
      const c1 = p.color(3, 3, 6);
      const c2 = p.color(10, 8, 14);
      const c = lerpColor(p, c1, c2, tRow);
      p.fill(c);
      p.rect(0, y, p.width, 4);
    }
    p.pop();

    const rm = speedMultiplier < 0.35;
    p.noStroke();
    for (const s of stars) {
      const twinkleBase = rm ? 0 : s.tw * 50 * (0.5 + 0.5 * Math.sin((t * s.spd) + s.phase));
      const a = p.constrain(s.base + twinkleBase, 40, 200);
      p.fill(255, 255, 255, a);
      p.ellipse(s.x, s.y, s.r, s.r);
    }
  }

  function drawGround(m) {
    const { cx, baseY, w } = m;
    p.push();
    p.noStroke();
    p.rectMode(p.CORNER);
    for (let i = 0; i < 10; i += 1) {
      const alpha = p.map(i, 0, 9, 35, 0);
      p.fill(40, 30, 40, alpha);
      const y = baseY - 10 + i;
      if (y < p.height) {
        p.rect(0, y, p.width, 1);
      }
    }
    p.fill(30, 20, 30, 120);
    p.ellipse(cx, baseY - 4, w * 1.8, w * 0.5);
    p.fill(30, 20, 30, 70);
    p.ellipse(cx, baseY - 4, w * 2.2, w * 0.7);
    p.pop();
  }

  function drawCandleBody(m) {
    const { cx, cy, w, h, r } = m;
    p.push();
    p.translate(cx, cy);
    p.noStroke();
    p.rectMode(p.CORNER);
    p.fill(248, 248, 246);
    p.rect(-w / 2, -h, w, h, r);

    p.fill(255, 255, 255, 24);
    p.rect(-w * 0.5, -h, w * 0.55, h, r);
    p.fill(0, 0, 0, 18);
    p.rect(-w * 0.05, -h, w * 0.55, h, r);

    p.fill(252, 252, 250, 230);
    p.ellipse(0, -h, w * 0.98, 24);

    const waxTop = -h + 10;
    const waxBot = -h + h * 0.62;
    const waxR = r * 1.1;

    p.fill(255, 230, 210, 60);
    p.ellipse(0, waxTop + 20, w * 0.95, 16);

    p.fill(255, 248, 244, 210);
    p.rect(-w / 2, waxTop + (waxBot - waxTop) * 0.15, w, (waxBot - waxTop), waxR);

    p.pop();
  }

  function drawWick(m) {
    const { cx, wickBaseY, wickTopY } = m;
    p.push();
    p.noStroke();
    p.fill(120);
    p.rectMode(p.CORNERS);
    p.rect(cx - 2, wickTopY, cx + 2, wickBaseY, 2);
    p.pop();
  }

  function flameShape(size) {
    const h = size;
    const w = size * 0.55;
    p.beginShape();
    p.vertex(0, h * 0.05);
    p.bezierVertex(-w * 0.5, 0, -w * 0.6, -h * 0.35, 0, -h * 0.95);
    p.bezierVertex(w * 0.6, -h * 0.35, w * 0.5, 0, 0, h * 0.05);
    p.endShape(p.CLOSE);
  }

  function drawFlame(x, y, s, tilt) {
    p.push();
    p.translate(x, y);
    p.rotate(tilt);

    p.noStroke();
    p.fill(255, 120, 40, 150);
    flameShape(s * 0.95);
    p.fill(255, 180, 70, 200);
    flameShape(s * 0.7);
    p.fill(255, 245, 200, 240);
    p.translate(0, s * 0.05);
    flameShape(s * 0.44);

    p.pop();
  }

  function drawAura(x, y, s) {
    p.push();
    p.translate(x, y);
    const base = s * 1.9;
    const rings = 5;
    for (let i = 0; i < rings; i += 1) {
      const alpha = p.map(i, 0, rings - 1, 70, 6) * (1 + glow * 0.6);
      p.noStroke();
      p.fill(255, 180, 80, alpha);
      const scale = 1 + ((i + 1) / rings) * 0.9;
      p.ellipse(0, 0, base * scale, base * (0.6 + ((i + 1) / rings) * 0.6));
    }
    p.pop();
  }

  function drawWaxDrips(m) {
    const { cx, topY, h } = m;
    p.push();
    p.translate(cx, topY + h * 0.54);
    p.noStroke();
    p.fill(255, 255, 255, 26);
    const count = 4;
    for (let i = 0; i < count; i += 1) {
      const x = Math.sin((t * 0.4 + i) * 1.7) * 40 + (i - 1.5) * 12;
      const height = 10 + 12 * (0.5 + 0.5 * Math.sin(t * 0.7 + i));
      p.rect(x, -20, 6, height, 3);
    }
    p.pop();
  }

  function spawnEmbers(amount = 12) {
    if (!metrics) return;
    const x = metrics.cx;
    const y = metrics.flameY;
    for (let i = 0; i < amount; i += 1) {
      embers.push({
        x: x + p.random(-6, 6),
        y: y + p.random(-6, 6),
        vx: p.random(-0.25, 0.25),
        vy: p.random(-1.4, -0.8),
        r: p.random(2, 5),
        a: 255
      });
    }
  }

  function updateEmbers() {
    const rm = speedMultiplier < 0.35;
    for (let i = embers.length - 1; i >= 0; i -= 1) {
      const e = embers[i];
      e.x += (e.vx + (rm ? 0 : 0.15 * Math.sin((e.y + t) * 0.05))) * speedMultiplier;
      e.y += e.vy * speedMultiplier;
      e.vy -= (rm ? 0.002 : 0.004) * speedMultiplier;
      e.a -= (rm ? 1.5 : 2.2) * speedMultiplier;
      if (e.a <= 0) {
        embers.splice(i, 1);
        continue;
      }
      p.noStroke();
      p.fill(255, 180, 60, e.a * 0.25);
      p.ellipse(e.x, e.y, e.r * 4, e.r * 4);
      p.fill(255, 200, 120, e.a);
      p.ellipse(e.x, e.y, e.r, e.r);
    }
  }

  return {
    name: 'Veilleuse mémoire',
    description: 'Ciel nocturne, flamme vacillante et braises qui voyagent',
    enter() {
      glow = 0;
      t = 0;
      embers = [];
      metrics = computeMetrics();
      initStars();
      spawnEmbers(16);
    },
    resize() {
      metrics = computeMetrics();
      initStars();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      glow = Math.min(1, glow + 0.45);
      spawnEmbers(12);
    },
    draw() {
      if (!metrics) metrics = computeMetrics();
      t += 0.01 * speedMultiplier;
      metrics = computeMetrics();

      drawNightSky();
      drawGround(metrics);
      drawCandleBody(metrics);
      drawWick(metrics);

      const rm = speedMultiplier < 0.35;
      const flicker = rm ? 0.05 : 0.15;
      const noiseF = p.map(p.noise(t * 2), 0, 1, -flicker, flicker);
      const size = p.lerp(p.height * 0.12, p.height * 0.16, p.constrain(glow, 0, 1)) * (1 + noiseF);
      const tilt = (rm ? 0.02 : 0.06) * Math.sin(t * 2.0);

      drawFlame(metrics.cx, metrics.flameY, size, tilt);

      const auraCenterY = metrics.flameY - size * 0.35;
      drawAura(metrics.cx, auraCenterY, size);

      if (!rm) {
        drawWaxDrips(metrics);
      }

      updateEmbers();
      glow = Math.max(0, glow - (rm ? 0.01 : 0.02) * speedMultiplier);
    }
  };
}
