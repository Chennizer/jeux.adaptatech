export function createZamboniGame(p) {
  const lanes = 5;
  const laneStatus = Array.from({ length: lanes }, () => 0);
  let activeLane = -1;
  let zamboni = null;
  let finishedAt = null;
  const sparkles = [];

  function rinkBounds() {
    const paddingX = p.width * 0.12;
    const paddingY = p.height * 0.18;
    return {
      x: paddingX,
      y: paddingY,
      w: p.width - paddingX * 2,
      h: p.height - paddingY * 2
    };
  }

  function startLane(index) {
    const rink = rinkBounds();
    const laneHeight = rink.h / lanes;
    zamboni = {
      x: rink.x - 80,
      y: rink.y + laneHeight * index + laneHeight * 0.55,
      targetX: rink.x + rink.w + 80,
      speed: p.random(3.2, 4.2),
      lane: index,
      phase: 0
    };
  }

  function handleAction() {
    if (finishedAt) return;
    const nextLane = laneStatus.findIndex(status => status === 0);
    if (nextLane === -1 || zamboni) return;
    laneStatus[nextLane] = 0.2;
    activeLane = nextLane;
    startLane(nextLane);
  }

  function update() {
    if (zamboni) {
      zamboni.x += zamboni.speed;
      zamboni.phase += 0.04;
      const progress = p.map(zamboni.x, rinkBounds().x, rinkBounds().x + rinkBounds().w, 0.2, 1);
      laneStatus[zamboni.lane] = Math.min(1, progress);
      if (zamboni.x >= zamboni.targetX) {
        laneStatus[zamboni.lane] = 1;
        zamboni = null;
      }
    }

    if (!finishedAt && laneStatus.every(status => status >= 1)) {
      finishedAt = p.millis();
      for (let i = 0; i < 160; i += 1) {
        const rink = rinkBounds();
        sparkles.push({
          x: p.random(rink.x, rink.x + rink.w),
          y: p.random(rink.y, rink.y + rink.h),
          alpha: p.random(180, 255),
          size: p.random(3, 8),
          drift: p.random(-0.4, 0.4)
        });
      }
    }

    sparkles.forEach(particle => {
      particle.y += particle.drift;
      particle.alpha -= 1.8;
    });

    for (let i = sparkles.length - 1; i >= 0; i -= 1) {
      if (sparkles[i].alpha <= 0) sparkles.splice(i, 1);
    }
  }

  function drawRink() {
    const rink = rinkBounds();
    const corner = rink.h * 0.2;
    p.noStroke();
    p.fill(230, 246, 255);
    p.rect(rink.x, rink.y, rink.w, rink.h, corner);

    p.stroke(255, 255, 255, 180);
    p.strokeWeight(2);
    for (let i = 1; i < lanes; i += 1) {
      const y = rink.y + (rink.h / lanes) * i;
      p.line(rink.x + 20, y, rink.x + rink.w - 20, y);
    }
  }

  function drawPolish() {
    const rink = rinkBounds();
    const laneHeight = rink.h / lanes;
    laneStatus.forEach((status, index) => {
      if (status <= 0) return;
      const x = rink.x + rink.w * status;
      const y = rink.y + laneHeight * index;
      p.noStroke();
      p.fill(210, 240, 255, 160);
      p.rect(rink.x, y, x - rink.x, laneHeight, 20);
      p.fill(255, 255, 255, 120);
      p.rect(rink.x, y + laneHeight * 0.15, x - rink.x, laneHeight * 0.2, 20);
    });
  }

  function drawZamboni() {
    if (!zamboni) return;
    p.push();
    p.translate(zamboni.x, zamboni.y);
    p.noStroke();
    p.fill(235, 81, 96);
    p.rect(-50, -18, 90, 36, 12);
    p.fill(255, 220, 87);
    p.rect(-10, -28, 40, 20, 8);
    p.fill(70, 90, 120);
    p.rect(-45, -28, 30, 20, 6);
    p.fill(30, 40, 60);
    p.circle(-25, 18, 16);
    p.circle(25, 18, 16);
    p.fill(255, 255, 255, 180);
    p.rect(30, -6, 24, 12, 4);
    p.pop();
  }

  function drawBackground() {
    const skyTop = p.color(12, 31, 64);
    const skyBottom = p.color(6, 16, 36);
    for (let y = 0; y < p.height; y += 4) {
      const t = y / p.height;
      const c = p.lerpColor(skyTop, skyBottom, t);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }

    p.noStroke();
    p.fill(255, 255, 255, 40);
    p.ellipse(p.width * 0.2, p.height * 0.18, 140, 80);
    p.ellipse(p.width * 0.8, p.height * 0.2, 180, 90);
  }

  function drawSparkles() {
    sparkles.forEach(particle => {
      p.noStroke();
      p.fill(255, 255, 255, particle.alpha);
      p.circle(particle.x, particle.y, particle.size);
    });
  }

  function draw() {
    drawBackground();
    drawRink();
    drawPolish();
    drawZamboni();
    drawSparkles();
  }

  function isComplete() {
    return finishedAt && p.millis() - finishedAt > 3500;
  }

  return {
    title: 'Zamboni olympique',
    handleAction,
    update,
    draw,
    isComplete
  };
}
