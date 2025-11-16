export function createShoreScene(p) {
  let time = 0;
  let speedMultiplier = 1;

  const skyBands = [
    { color: [245, 252, 255], height: 0.16 },
    { color: [218, 232, 246], height: 0.16 },
    { color: [191, 214, 240], height: 0.16 },
    { color: [165, 199, 232], height: 0.17 }
  ];

  const waterBands = [
    { color: [64, 154, 198, 240], height: 0.16 },
    { color: [54, 141, 186, 232], height: 0.16 },
    { color: [46, 126, 170, 220], height: 0.16 },
    { color: [37, 109, 150, 210], height: 0.16 }
  ];

  const sandBandColors = [
    [232, 214, 177],
    [220, 198, 160],
    [210, 184, 145]
  ];

  return {
    id: 'shore',
    name: 'Rivage paisible',
    description: 'Vagues douces sur le sable',
    enter() {
      time = 0;
    },
    resize() {
      // No dynamic assets to rebuild on resize.
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
    },
    draw() {
      time += 12 * speedMultiplier;

      const horizon = p.height * 0.42;
      const shoreBase = p.height * 0.62;
      const shorelineAmplitude = p.height * 0.04;
      const shorelineFrequency = 0.009;

      p.noStroke();

      // Sky gradient bands
      let yCursor = 0;
      for (const band of skyBands) {
        const bandHeight = p.height * band.height;
        p.fill(...band.color);
        p.rect(0, yCursor, p.width, bandHeight + 1);
        yCursor += bandHeight;
      }

      // Water gradient bands
      yCursor = horizon;
      for (const band of waterBands) {
        const bandHeight = p.height * band.height;
        p.fill(...band.color);
        p.rect(0, yCursor, p.width, bandHeight + 1);
        yCursor += bandHeight;
      }

      const segments = 140;
      const shoreline = [];
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        const phaseDrift = p.sin(time * 0.00018) * shorelineAmplitude * 0.25;
        const y = shoreBase + p.sin(x * shorelineFrequency + time * 0.0007) * shorelineAmplitude + phaseDrift;
        shoreline.push({ x, y });
      }

      // Water body to shoreline
      p.fill(46, 126, 170, 180);
      p.beginShape();
      p.vertex(0, horizon);
      for (const point of shoreline) {
        p.vertex(point.x, point.y);
      }
      p.vertex(p.width, shoreline[shoreline.length - 1].y + 120);
      p.vertex(0, shoreline[0].y + 120);
      p.endShape(p.CLOSE);

      // Sand area beneath shoreline
      p.fill(226, 205, 170);
      p.beginShape();
      for (const point of shoreline) {
        p.vertex(point.x, point.y + 1);
      }
      p.vertex(p.width, p.height);
      p.vertex(0, p.height);
      p.endShape(p.CLOSE);

      // Broad sand bands for depth without per-pixel noise
      const sandTop = Math.min(...shoreline.map(s => s.y));
      const sandHeight = p.height - sandTop;
      const bandHeight = sandHeight / sandBandColors.length;
      for (let i = 0; i < sandBandColors.length; i++) {
        const y = sandTop + i * bandHeight;
        p.fill(...sandBandColors[i], 70);
        p.rect(0, y, p.width, bandHeight + 2);
      }

      // Highlight line along shoreline
      p.stroke(255, 245, 230, 180);
      p.strokeWeight(2);
      p.noFill();
      p.beginShape();
      for (const point of shoreline) {
        p.vertex(point.x, point.y - 1.5);
      }
      p.endShape();

      // Gentle reflection ellipse drifting across the water
      const reflectionX = p.width * 0.62 + p.sin(time * 0.00022) * 40;
      const reflectionY = horizon + p.height * 0.16 + p.sin(time * 0.00014) * 6;
      p.noStroke();
      p.fill(255, 236, 200, 140);
      p.ellipse(reflectionX, reflectionY, p.width * 0.18, p.height * 0.06);
    }
  };
}
