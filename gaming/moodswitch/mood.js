import { createRainScene } from './rain-scene.js';
import { createSnowScene } from './snow-scene.js';
import { createPetalScene } from './petal-scene.js';

const sceneNameEl = document.getElementById('scene-name');
const sceneDescEl = document.getElementById('scene-desc');
const statusEl = document.getElementById('status-hint');
const overlayEl = document.getElementById('overlay');

let scenes = [];
let activeIndex = 0;
let activeScene = null;
let lastSwitch = 0;

function updateOverlay() {
  if (!activeScene) return;
  if (sceneNameEl) sceneNameEl.textContent = activeScene.name;
  if (sceneDescEl) sceneDescEl.textContent = activeScene.description;
  if (statusEl) {
    statusEl.textContent = `${activeIndex + 1} / ${scenes.length}`;
  }
}

function cycleScene(step = 1) {
  if (!scenes.length) return;
  const now = performance.now();
  if (now - lastSwitch < 300) return;
  lastSwitch = now;
  activeIndex = (activeIndex + step + scenes.length) % scenes.length;
  activeScene = scenes[activeIndex];
  activeScene.enter?.();
  updateOverlay();
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
    activeScene.enter?.();
    updateOverlay();
    p.frameRate(60);
  };

  p.draw = () => {
    if (!activeScene) return;
    activeScene.draw?.(p);
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
    scenes.forEach(scene => scene.resize?.());
  };

  p.keyPressed = () => {
    if (p.key === ' ' || p.keyCode === 32) {
      cycleScene(1);
      return false;
    }
    return undefined;
  };

  p.mousePressed = () => {
    cycleScene(1);
  };
};

new p5(sketch);

overlayEl?.addEventListener('click', () => cycleScene(1));
overlayEl?.addEventListener('touchstart', evt => {
  evt.preventDefault();
  cycleScene(1);
}, { passive: false });

window.addEventListener('keydown', evt => {
  if (evt.code === 'Space') {
    evt.preventDefault();
  }
});
