export function createShoreScene(p) {
  let time = 0;
  let speedMultiplier = 1;

  function drawBands(yStart, yEnd, palette) {
    const bandHeight = (yEnd - yStart) / palette.length;
    palette.forEach((color, index) => {
      p.noStroke();
      p.fill(color.r, color.g, color.b);
      p.rect(0, yStart + index * bandHeight, p.width, bandHeight + 1);
    });
  }

  return {
    id: 'shore',
    name: 'Rivage paisible',
    description: 'Vagues douces sur le sable',
    enter() {
      time = 0;
    },
    resize() {
      // No dynamic elements to rebuild on resize
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {},
    draw() {
      time += 16 * speedMultiplier;

      const skyHeight = p.height * 0.45;
      const waterTop = skyHeight;
      const waterBottom = p.height * 0.92;

      drawBands(0, skyHeight, [
        { r: 46, g: 79, b: 112 },
        { r: 58, g: 102, b: 145 },
        { r: 84, g: 132, b: 175 },
        { r: 120, g: 164, b: 204 },
        { r: 178, g: 206, b: 232 }
      ]);

      const waterPalette = [
        { r: 28, g: 121, b: 165 },
        { r: 44, g: 145, b: 182 },
        { r: 64, g: 168, b: 198 },
        { r: 88, g: 188, b: 207 },
        { r: 120, g: 207, b: 215 }
      ];

      const shorelineBase = p.height * 0.62;
      const shorelineAmplitude = 26;
      const shorelineFrequency = (p.TWO_PI / p.width) * 1.1;
      const verticalSwell = p.sin(time * 0.00075) * 22;

      const segments = 160;
      const baseShoreline = [];
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        const sine = p.sin(x * shorelineFrequency);
        baseShoreline[i] = shorelineBase + sine * shorelineAmplitude;
      }

      const shorelineY = baseShoreline.map((y) => y + verticalSwell);

      const maxShoreline = Math.max(...shorelineY);
      const waterDepth = Math.max(1, maxShoreline - waterTop);
      const waterBandHeight = waterDepth / waterPalette.length;

      for (let band = waterPalette.length - 1; band >= 0; band--) {
        const color = waterPalette[band];
        const topOffset = waterBandHeight * band;
        const bottomOffset = waterBandHeight * (band + 1);

        p.noStroke();
        p.fill(color.r, color.g, color.b);
        p.beginShape();
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * p.width;
          const lowerY = Math.max(waterTop, shorelineY[i] - topOffset);
          p.vertex(x, lowerY);
        }
        for (let i = segments; i >= 0; i--) {
          const x = (i / segments) * p.width;
          const upperY = Math.max(waterTop, shorelineY[i] - bottomOffset) - 1;
          p.vertex(x, upperY);
        }
        p.endShape(p.CLOSE);
      }

      p.noStroke();
      p.fill(224, 199, 160);
      p.beginShape();
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        p.vertex(x, shorelineY[i]);
      }
      p.vertex(p.width, p.height);
      p.vertex(0, p.height);
      p.endShape(p.CLOSE);

      p.noStroke();
      p.fill(170, 218, 230, 165);
      p.beginShape();
      p.vertex(0, waterTop);
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        p.vertex(x, shorelineY[i]);
      }
      p.vertex(p.width, shorelineY[segments]);
      p.vertex(p.width, waterTop);
      p.endShape(p.CLOSE);

      p.stroke(255, 245, 225, 200);
      p.strokeWeight(1.4);
      p.noFill();
      p.beginShape();
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        p.vertex(x, shorelineY[i] - 1.5);
      }
      p.endShape();

      const reflectionX = p.width * 0.6 + p.sin(time * 0.00025) * 60;
      const reflectionY = waterTop + (waterBottom - waterTop) * 0.35 + p.sin(time * 0.0003) * 10;
      p.noStroke();
      p.fill(255, 236, 210, 170);
      p.ellipse(reflectionX, reflectionY, p.width * 0.18, p.height * 0.04);
    }
  };
}
