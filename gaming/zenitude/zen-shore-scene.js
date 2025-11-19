export function createShoreScene(p) {
  let time = 0;
  let speedMultiplier = 1;

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

      const ctx = p.drawingContext;

      const skyGradient = ctx.createLinearGradient(0, 0, 0, skyHeight);
      skyGradient.addColorStop(0, 'rgba(34, 62, 110, 1)');
      skyGradient.addColorStop(0.35, 'rgba(82, 116, 168, 1)');
      skyGradient.addColorStop(0.7, 'rgba(146, 176, 204, 1)');
      skyGradient.addColorStop(1, 'rgba(212, 214, 214, 1)');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, p.width, skyHeight);

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

      const deepWaterColor = { r: 18, g: 102, b: 146 };
      const midWaterColor = { r: 44, g: 146, b: 176 };
      const lagoonColor = { r: 66, g: 188, b: 184 };
      const shoreWaterColor = { r: 140, g: 216, b: 214 };
      const waterGradient = ctx.createLinearGradient(0, waterTop, 0, maxShoreline);
      waterGradient.addColorStop(
        0,
        `rgba(${deepWaterColor.r}, ${deepWaterColor.g}, ${deepWaterColor.b}, 1)`
      );
      waterGradient.addColorStop(
        0.42,
        `rgba(${midWaterColor.r}, ${midWaterColor.g}, ${midWaterColor.b}, 1)`
      );
      waterGradient.addColorStop(
        0.7,
        `rgba(${lagoonColor.r}, ${lagoonColor.g}, ${lagoonColor.b}, 1)`
      );
      waterGradient.addColorStop(
        1,
        `rgba(${shoreWaterColor.r}, ${shoreWaterColor.g}, ${shoreWaterColor.b}, 1)`
      );

      ctx.fillStyle = waterGradient;
      ctx.beginPath();
      ctx.moveTo(0, waterTop);
      ctx.lineTo(p.width, waterTop);
      for (let i = segments; i >= 0; i--) {
        const x = (i / segments) * p.width;
        const y = Math.max(waterTop, shorelineY[i]);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

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

    }
  };
}
