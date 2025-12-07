export function createShoreScene(p) {
  let time = 0;
  let speedMultiplier = 1;
  let clouds = [];
  let foamBursts = [];
  let wavePulse = 0;
  let cloudSpeedBoost = 0;
  let isContemplative = true;
  let lastMode = 'slow';
  let waveTravel = 0;
  let cloudPulseHold = 0;

  function buildClouds() {
    clouds = [];
    const count = Math.max(5, Math.floor(p.width / 240));
    for (let i = 0; i < count; i++) {
      clouds.push({
        x: p.random(p.width),
        y: p.random(p.height * 0.05, p.height * 0.22),
        w: p.random(p.width * 0.14, p.width * 0.28),
        h: p.random(40, 82),
        speed: p.random(0.18, 0.32),
        alpha: p.random(120, 190),
        offset: p.random(1000)
      });
    }
  }

  function spawnFoamBursts() {
    const crest = p.height * 0.62 + Math.sin(time * 0.00075) * 22;
    const count = 14;
    for (let i = 0; i < count; i++) {
      foamBursts.push({
        x: p.random(p.width),
        y: crest + p.random(-8, 8),
        vx: p.random(-0.4, 0.4),
        vy: p.random(-0.6, -0.1),
        life: p.random(55, 90),
        size: p.random(4, 9)
      });
    }
  }

  return {
    id: 'shore',
    name: 'Rivage paisible',
    description: 'Vagues douces sur le sable',
    enter() {
      time = 0;
      wavePulse = 0;
      foamBursts = [];
      waveTravel = 0;
      cloudPulseHold = 0;
      buildClouds();
    },
    resize() {
      buildClouds();
    },
    setSpeedMultiplier(multiplier = 1) {
      speedMultiplier = multiplier;
    },
    pulse() {
      if (!isContemplative) return;
      wavePulse = 1;
      cloudSpeedBoost = 1.8;
      cloudPulseHold = 1;
      spawnFoamBursts();
    },
    draw() {
      const pulseActive = isContemplative && wavePulse > 0.01;
      const motionThrottle = pulseActive ? 0.35 : 1;
      time += 16 * speedMultiplier * motionThrottle;

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

      clouds.forEach(cloud => {
        const gustFactor = isContemplative ? 2.4 : 1.6;
        const pulseBoost = pulseActive ? Math.max(cloudPulseHold, wavePulse * 0.9) : 0;
        const gust = cloud.speed * (1 + (cloudSpeedBoost + pulseBoost) * gustFactor);
        cloud.x += gust * speedMultiplier;
        if (cloud.x - cloud.w * 0.6 > p.width) {
          cloud.x = -cloud.w;
          cloud.y = p.random(p.height * 0.05, p.height * 0.22);
        }
        const wobble = Math.sin(time * 0.0003 + cloud.offset) * 6;
        p.noStroke();
        p.fill(240, 248, 255, cloud.alpha);
        p.ellipse(cloud.x, cloud.y + wobble, cloud.w, cloud.h);
        p.ellipse(cloud.x - cloud.w * 0.24, cloud.y + wobble + 6, cloud.w * 0.6, cloud.h * 0.7);
        p.ellipse(cloud.x + cloud.w * 0.22, cloud.y + wobble + 4, cloud.w * 0.5, cloud.h * 0.72);
      });

      const shorelineBase = p.height * 0.62;
      const waveEnergy = 1 + wavePulse * 0.8;
      const shorelineAmplitude = 26 * waveEnergy;
      const shorelineFrequency = (p.TWO_PI / p.width) * 1.1 * waveEnergy;
      const travelPhase = isContemplative ? waveTravel : 0;
      const verticalSwell = p.sin(time * 0.00075 * waveEnergy * motionThrottle) * 22 * waveEnergy;

      const segments = 160;
      const baseShoreline = [];
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * p.width;
        const sine = p.sin(x * shorelineFrequency - travelPhase);
        const jitter = p.sin(time * 0.0014 * motionThrottle + i * 0.08) * 3.2 * waveEnergy;
        const noise = (p.noise(time * 0.0002, i * 0.05) - 0.5) * 18 * waveEnergy;
        baseShoreline[i] = shorelineBase + sine * shorelineAmplitude + jitter + noise;
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

      foamBursts = foamBursts.filter(foam => {
        foam.x += foam.vx * speedMultiplier;
        foam.y += foam.vy * speedMultiplier;
        foam.vy *= 0.99;
        foam.life -= 1.2 * speedMultiplier;
        if (foam.life <= 0) return false;
        const alpha = p.map(foam.life, 0, 90, 0, 150, true);
        p.noStroke();
        p.fill(255, 255, 245, alpha);
        p.ellipse(foam.x, foam.y, foam.size * 1.3, foam.size * 0.9);
        return foam.x >= -10 && foam.x <= p.width + 10;
      });

      for (let i = 0; i < 12; i++) {
        const t = (i + (time * 0.001 % 1)) / 12;
        const x = p.width * t;
        const y = p.lerp(waterTop, maxShoreline, t) - 6;
        p.stroke(255, 255, 255, 40);
        p.strokeWeight(1);
        p.line(x - 24, y + p.sin(time * 0.002 + i) * 3, x + 24, y + p.sin(time * 0.002 + i + 1) * 3);
      }

      if (wavePulse > 0.01) {
        wavePulse *= 0.965;
        waveTravel += 0.045 * speedMultiplier;
      } else if (isContemplative) {
        waveTravel += 0.0025 * speedMultiplier;
      }

      if (waveTravel > p.TWO_PI * 8) {
        waveTravel -= p.TWO_PI * 8;
      }

      if (cloudSpeedBoost > 0.01) {
        cloudSpeedBoost *= isContemplative ? 0.985 : 0.97;
      }

      if (cloudPulseHold > 0.01) {
        cloudPulseHold *= 0.965;
      }

    },
    setMode(modeValue = 'slow') {
      if (modeValue === lastMode) return;
      lastMode = modeValue;
      isContemplative = modeValue === 'slow';
      cloudSpeedBoost = 0;
      waveTravel = 0;
      cloudPulseHold = 0;
      buildClouds();
    }
  };
}
