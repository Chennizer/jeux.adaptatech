import { createRainScene } from './rain-scene.js';
import { createSnowScene } from './snow-scene.js';
import { createPetalScene } from './petal-scene.js';

const sceneNameEl = document.getElementById('scene-name');
const sceneDescEl = document.getElementById('scene-desc');
const statusEl = document.getElementById('status-hint');
const overlayEl = document.getElementById('overlay');
const startOverlayEl = document.getElementById('promptOverlay');
const startButtonEl = document.getElementById('startButton');
const modeInputs = document.querySelectorAll('input[name="mode"]');

const MODE_DEFAULT = 'default';
const MODE_SLOW = 'slow';
const SLOW_SCENE_DURATION = 60_000;
const SLOW_BASE_SPEED = 0.3;
const SLOW_PEAK_SPEED = 1.15;
const SPEED_PHASES = {
  rampUp: 2_000,
  hold: 2_000,
  rampDown: 2_000
};

let scenes = [];
let activeIndex = 0;
let activeScene = null;
let lastSwitch = 0;
let started = false;
let mode = MODE_DEFAULT;
let sceneStartedAt = 0;
let speedBurst = null;

const clamp01 = value => Math.min(1, Math.max(0, value));
const lerp = (a, b, t) => a + (b - a) * clamp01(t);

function updateOverlay() {
  if (!activeScene) return;
  if (sceneNameEl) sceneNameEl.textContent = activeScene.name;
  if (sceneDescEl) sceneDescEl.textContent = activeScene.description;
  if (statusEl) {
    statusEl.textContent = `${activeIndex + 1} / ${scenes.length}`;
  }
}

function cycleScene(step = 1) {
  if (!started || !scenes.length) return;
  const now = performance.now();
  if (now - lastSwitch < 300) return;
  lastSwitch = now;
  activeIndex = (activeIndex + step + scenes.length) % scenes.length;
  activeScene = scenes[activeIndex];
  activeScene.enter?.();
  sceneStartedAt = performance.now();
  speedBurst = null;
  updateOverlay();
}

function beginExperience() {
  if (started || !activeScene) return;
  started = true;
  sceneStartedAt = performance.now();
  speedBurst = null;
  activeScene.enter?.();
  updateOverlay();
  if (startOverlayEl) {
    startOverlayEl.style.display = 'none';
  }
  if (overlayEl) {
    overlayEl.style.display = 'none';
  }
}

function requestFullscreen() {
  const root = document.documentElement;
  const req = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
  if (!req) return;
  try {
    const result = req.call(root);
    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  } catch (err) {
    // Ignore fullscreen request failures.
  }
}

function getCurrentSpeedMultiplier() {
  if (mode !== MODE_SLOW) return 1;
  const base = SLOW_BASE_SPEED;
  if (!speedBurst) return base;
  const now = performance.now();
  const elapsed = now - speedBurst.start;
  if (elapsed < SPEED_PHASES.rampUp) {
    const t = elapsed / SPEED_PHASES.rampUp;
    return lerp(base, SLOW_PEAK_SPEED, t);
  }
  if (elapsed < SPEED_PHASES.rampUp + SPEED_PHASES.hold) {
    return SLOW_PEAK_SPEED;
  }
  if (elapsed < SPEED_PHASES.rampUp + SPEED_PHASES.hold + SPEED_PHASES.rampDown) {
    const t = (elapsed - SPEED_PHASES.rampUp - SPEED_PHASES.hold) / SPEED_PHASES.rampDown;
    return lerp(SLOW_PEAK_SPEED, base, t);
  }
  speedBurst = null;
  return base;
}

function triggerSpeedBurst() {
  if (mode !== MODE_SLOW) {
    cycleScene(1);
    return;
  }
  speedBurst = { start: performance.now() };
  activeScene?.pulse?.();
}

function refreshMode() {
  const selected = document.querySelector('input[name="mode"]:checked');
  const value = selected?.value === MODE_SLOW ? MODE_SLOW : MODE_DEFAULT;
  if (value !== mode) {
    mode = value;
    sceneStartedAt = performance.now();
    speedBurst = null;
  } else {
    mode = value;
  }
}

const sketch = p => {
  p.setup = () => {
    const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
    canvas.id('mood-canvas');
    scenes = [
      createRainScene(p),
      createSnowScene(p),
      createPetalScene(p)
    ];
    scenes.forEach(scene => scene.resize?.());
    activeIndex = 0;
    activeScene = scenes[activeIndex];
    updateOverlay();
    p.frameRate(60);
  };

  p.draw = () => {
    if (!activeScene) return;
    if (!started) {
      p.background(8, 12, 24);
      return;
    }
    const multiplier = getCurrentSpeedMultiplier();
    activeScene.setSpeedMultiplier?.(multiplier);
    activeScene.draw?.(p);
    if (mode === MODE_SLOW) {
      if (performance.now() - sceneStartedAt >= SLOW_SCENE_DURATION) {
        cycleScene(1);
      }
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
    scenes.forEach(scene => scene.resize?.());
  };

  p.keyPressed = () => {
    if (!started) return undefined;
    if (p.key === ' ' || p.keyCode === 32) {
      triggerSpeedBurst();
      return false;
    }
    return undefined;
  };

  p.mousePressed = () => {
    if (!started) return;
    triggerSpeedBurst();
  };
};

new p5(sketch);

overlayEl?.addEventListener('click', () => triggerSpeedBurst());
overlayEl?.addEventListener('touchstart', evt => {
  if (!started) return;
  evt.preventDefault();
  triggerSpeedBurst();
}, { passive: false });

window.addEventListener('keydown', evt => {
  if (!started && (evt.code === 'Enter' || evt.code === 'NumpadEnter')) {
    evt.preventDefault();
    refreshMode();
    requestFullscreen();
    beginExperience();
    return;
  }
  if (evt.code === 'Space') {
    evt.preventDefault();
  }
});

const startInteraction = () => {
  refreshMode();
  requestFullscreen();
  beginExperience();
};

startButtonEl?.addEventListener('click', startInteraction);
startButtonEl?.addEventListener('touchend', evt => {
  evt.preventDefault();
  startInteraction();
});

modeInputs.forEach(input => {
  input.addEventListener('change', () => {
    if (input.checked) {
      refreshMode();
    }
  });
});
