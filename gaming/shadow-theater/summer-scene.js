export function createSummerScene(p) {
  const shimmerBands = [];
  const motes = [];
  let time = 0;

  function reset() {
    shimmerBands.length = 0;
    const bandCount = 14;
    for (let i = 0; i < bandCount; i += 1) {
      shimmerBands.push({
        y: p.map(i, 0, bandCount - 1, p.height * 0.15, p.height * 0.85),
        amp: p.random(10, 40),
        speed: p.random(0.001, 0.003),
        phase: p.random(p.TWO_PI),
        thickness: p.random(8, 18)
      });
    }

    motes.length = 0;
    const moteCount = Math.max(40, Math.floor(p.width / 20));
    for (let i = 0; i < moteCount; i += 1) {
      motes.push({
        x: p.random(p.width),
        y: p.random(p.height),
        drift: p.random(0.2, 0.8),
        speed: p.random(0.4, 1.2),
        size: p.random(3, 7),
        glow: p.random(120, 200)
      });
    }
  }

  function drawBackdrop() {
    const centerX = p.width / 2;
    const centerY = p.height * 0.55;
    const sunRadius = Math.min(p.width, p.height) * 0.5;

    for (let r = sunRadius; r > 0; r -= 3) {
      const t = r / sunRadius;
      const c = p.lerpColor(p.color(255, 190, 120), p.color(80, 40, 24), 1 - t);
      p.noStroke();
      p.fill(c);
      p.ellipse(centerX, centerY, r * 2.4, r * 2);
    }

    p.noStroke();
    p.fill(10, 10, 12, 200);
    p.rect(p.width / 2, p.height / 2, p.width, p.height, 40);
  }

  function drawHeatRipple() {
    p.noFill();
    shimmerBands.forEach((band, idx) => {
      p.stroke(255, 200, 120, 120 - idx * 5);
      p.strokeWeight(band.thickness);
      p.beginShape();
      for (let x = -band.thickness * 2; x <= p.width + band.thickness * 2; x += 24) {
        const wobble = Math.sin((x * 0.004) + band.phase + time * band.speed) * band.amp;
        p.vertex(x, band.y + wobble);
      }
      p.endShape();
    });
  }

  function drawMotes() {
    motes.forEach(mote => {
      p.noStroke();
      p.fill(255, 225, 140, mote.glow);
      p.circle(mote.x, mote.y, mote.size * 2);
      mote.y -= mote.drift;
      mote.x += Math.sin(time * 0.002 + mote.y * 0.01) * 0.3;
      if (mote.y < -10) {
        mote.y = p.height + 10;
      }
    });
  }

  return {
    id: 'summer',
    enter() {
      reset();
    },
    draw() {
      time += 1;
      drawBackdrop();
      drawHeatRipple();
      drawMotes();
      p.noStroke();
      p.fill(255, 210, 140, 18);
      p.rect(p.width / 2, p.height / 2, p.width * 0.88, p.height * 0.88, 28);
    },
    resize() {
      reset();
    }
  };
}
