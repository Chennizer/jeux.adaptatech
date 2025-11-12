import { createRainScene } from './rain-scene.js';
import { createSnowScene } from './snow-scene.js';
import { createPetalScene } from './petal-scene.js';

const sceneNameEl = document.getElementById('scene-name');
const sceneDescEl = document.getElementById('scene-desc');
const statusEl = document.getElementById('status-hint');
const overlayEl = document.getElementById('overlay');
const startOverlayEl = document.getElementById('promptOverlay');
const startButtonEl = document.getElementById('startButton');

let scenes = [];
let activeIndex = 0;
let activeScene = null;
let lastSwitch = 0;
let started = false;

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
  updateOverlay();
}

function beginExperience() {
  if (started || !activeScene) return;
  started = true;
  activeScene.enter?.();
  updateOverlay();
  if (startOverlayEl) {
    startOverlayEl.style.display = 'none';
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
    activeScene.draw?.(p);
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
    scenes.forEach(scene => scene.resize?.());
  };

  p.keyPressed = () => {
    if (!started) return undefined;
    if (p.key === ' ' || p.keyCode === 32) {
      cycleScene(1);
      return false;
    }
    return undefined;
  };

  p.mousePressed = () => {
    if (!started) return;
    cycleScene(1);
  };
};

new p5(sketch);

overlayEl?.addEventListener('click', () => cycleScene(1));
overlayEl?.addEventListener('touchstart', evt => {
  if (!started) return;
  evt.preventDefault();
  cycleScene(1);
}, { passive: false });

window.addEventListener('keydown', evt => {
  if (!started && (evt.code === 'Enter' || evt.code === 'NumpadEnter')) {
    evt.preventDefault();
    requestFullscreen();
    beginExperience();
    return;
  }
  if (evt.code === 'Space') {
    evt.preventDefault();
  }
});

const startInteraction = () => {
  requestFullscreen();
  beginExperience();
};

startButtonEl?.addEventListener('click', startInteraction);
startButtonEl?.addEventListener('touchend', evt => {
  evt.preventDefault();
  startInteraction();
});
