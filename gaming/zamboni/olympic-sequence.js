(() => {
  const canvas = document.getElementById('rink');
  const ctx = canvas.getContext('2d');
  const menuOverlay = document.getElementById('menuOverlay');
  const startButton = document.getElementById('startSequence');

  const olympicColors = ['#0081c8', '#fcb131', '#000000', '#00a651', '#ee334e'];

  const state = {
    started: false,
    currentPart: 0,
    transitionStart: null,
    animationFrame: null,
    zamboniInstance: null,
  };

  const opening = {
    pressCount: 0,
    fireworks: [],
    stars: [],
    ringPositions: [],
  };

  const snow = {
    pressCount: 0,
    particles: [],
    flakes: [],
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
    buildRingPositions();
  }

  function buildStars() {
    const count = Math.floor(Math.max(60, window.innerWidth / 12));
    opening.stars = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 1.8,
      alpha: 0.4 + Math.random() * 0.6,
    }));
  }

  function buildRingPositions() {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.45;
    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.08;
    const gap = radius * 1.65;
    const offset = radius * 0.75;

    opening.ringPositions = [
      { x: cx - gap, y: cy, color: olympicColors[0] },
      { x: cx, y: cy, color: olympicColors[1] },
      { x: cx + gap, y: cy, color: olympicColors[2] },
      { x: cx - gap / 2, y: cy + offset, color: olympicColors[3] },
      { x: cx + gap / 2, y: cy + offset, color: olympicColors[4] },
    ];
  }

  function spawnFirework(x, y, color) {
    const particleCount = 36;
    for (let i = 0; i < particleCount; i += 1) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 1.8 + Math.random() * 1.8;
      opening.fireworks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
      });
    }
  }

  function spawnSnowBurst() {
    const baseX = window.innerWidth * 0.12;
    const baseY = window.innerHeight * 0.82;
    const particleCount = 50;
    for (let i = 0; i < particleCount; i += 1) {
      snow.particles.push({
        x: baseX,
        y: baseY,
        vx: 1.5 + Math.random() * 2.2,
        vy: -3.8 - Math.random() * 2,
        life: 1,
      });
    }
  }

  function handlePress() {
    if (!state.started || state.transitionStart) return;
    if (state.currentPart === 0) {
      if (opening.pressCount >= 5) return;
      const ring = opening.ringPositions[opening.pressCount];
      spawnFirework(ring.x, ring.y, ring.color);
      opening.pressCount += 1;
      if (opening.pressCount === 5) {
        state.transitionStart = performance.now();
        for (let i = 0; i < 5; i += 1) {
          const target = opening.ringPositions[i];
          spawnFirework(target.x, target.y, target.color);
        }
      }
      return;
    }

    if (state.currentPart === 1) {
      if (snow.pressCount >= 5) return;
      snow.pressCount += 1;
      spawnSnowBurst();
      if (snow.pressCount === 5) {
        state.transitionStart = performance.now();
      }
    }
  }

  function drawOpening() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0b1b30');
    gradient.addColorStop(1, '#06101f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    opening.stars.forEach((star) => {
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
      ctx.fill();
    });

    opening.fireworks = opening.fireworks.filter((particle) => particle.life > 0);
    opening.fireworks.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.02;
      particle.life -= 0.015;
      ctx.fillStyle = `rgba(255,255,255,${particle.life})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${particle.life})`;
    });

    opening.ringPositions.forEach((ring, index) => {
      if (index >= opening.pressCount) return;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = Math.max(6, Math.min(w, h) * 0.006);
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, Math.min(w, h) * 0.08, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `600 ${Math.min(w, h) * 0.035}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Cérémonie d\'ouverture', w / 2, h * 0.18);

    if (opening.pressCount < 5) {
      ctx.font = `500 ${Math.min(w, h) * 0.024}px "Segoe UI", sans-serif`;
      ctx.fillText('Appuie 5 fois pour former les anneaux olympiques', w / 2, h * 0.23);
    } else {
      ctx.font = `600 ${Math.min(w, h) * 0.026}px "Segoe UI", sans-serif`;
      ctx.fillText('Les anneaux sont réunis !', w / 2, h * 0.23);
    }
  }

  function drawSnow() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#7fb3ff');
    gradient.addColorStop(1, '#d6f0ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#f6fbff';
    ctx.fillRect(0, h * 0.7, w, h * 0.3);

    const cannonX = w * 0.08;
    const cannonY = h * 0.78;
    const cannonW = w * 0.1;
    const cannonH = h * 0.08;

    ctx.fillStyle = '#37474f';
    ctx.fillRect(cannonX, cannonY, cannonW, cannonH);
    ctx.fillStyle = '#263238';
    ctx.fillRect(cannonX + cannonW * 0.55, cannonY - cannonH * 0.5, cannonW * 0.4, cannonH * 0.8);

    const hillHeight = (h * 0.18) + snow.pressCount * (h * 0.05);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.7);
    ctx.quadraticCurveTo(w * 0.45, h * 0.7 - hillHeight, w * 0.75, h * 0.7);
    ctx.lineTo(w * 0.75, h);
    ctx.lineTo(w * 0.15, h);
    ctx.closePath();
    ctx.fill();

    snow.particles = snow.particles.filter((particle) => particle.life > 0);
    snow.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.08;
      particle.life -= 0.02;
      ctx.fillStyle = `rgba(255,255,255,${particle.life})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.font = `600 ${Math.min(w, h) * 0.035}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Canon à neige', w / 2, h * 0.16);

    if (snow.pressCount < 5) {
      ctx.font = `500 ${Math.min(w, h) * 0.024}px "Segoe UI", sans-serif`;
      ctx.fillText('Appuie 5 fois pour construire la montagne', w / 2, h * 0.21);
    } else {
      ctx.font = `600 ${Math.min(w, h) * 0.026}px "Segoe UI", sans-serif`;
      ctx.fillText('Montagne complète !', w / 2, h * 0.21);
    }
  }

  function transitionIfReady() {
    if (!state.transitionStart) return;
    const elapsed = performance.now() - state.transitionStart;
    if (elapsed < 2200) return;

    if (state.currentPart === 0) {
      state.currentPart = 1;
      state.transitionStart = null;
      return;
    }

    if (state.currentPart === 1) {
      state.currentPart = 2;
      state.transitionStart = null;
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
      if (typeof window.startZamboniGame === 'function') {
        state.zamboniInstance = window.startZamboniGame(canvas);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (state.currentPart === 0) {
      drawOpening();
    } else if (state.currentPart === 1) {
      drawSnow();
    }

    transitionIfReady();
    if (state.currentPart < 2) {
      state.animationFrame = requestAnimationFrame(draw);
    }
  }

  function startSequence() {
    if (state.started) return;
    state.started = true;
    menuOverlay.style.display = 'none';
    resize();
    draw();
  }

  function onKeyDown(event) {
    if (event.code !== 'Space') return;
    event.preventDefault();
    handlePress();
  }

  startButton.addEventListener('click', startSequence);
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown, { passive: false });
  canvas.addEventListener('pointerdown', handlePress);

  resize();
})();
