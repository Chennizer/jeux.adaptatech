import { createSpringShadow } from './spring-shadow.js';
import { createSummerShadow } from './summer-shadow.js';
import { createAutumnShadow } from './autumn-shadow.js';
import { createWinterShadow } from './winter-shadow.js';

const overlayEl = document.getElementById('promptOverlay');
let started = false;
let scenes = [];
let activeScene = null;
let activeIndex = 0;

function requestFullscreen() {
  const root = document.documentElement;
  const request = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
  if (!request) return;
  try {
    const result = request.call(root);
    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  } catch (err) {
    // ignore
  }
}

function cycleScene(step = 1) {
  if (!scenes.length) return;
  activeIndex = (activeIndex + step + scenes.length) % scenes.length;
  activeScene = scenes[activeIndex];
  activeScene.enter?.();
}

function beginExperience() {
  if (started) return;
  started = true;
  overlayEl?.classList.add('hidden');
  requestFullscreen();
  activeScene?.enter?.();
}

const sketch = p => {
  p.setup = () => {
    const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
    canvas.id('shadow-canvas');
    scenes = [
      createSpringShadow(p),
      createSummerShadow(p),
      createAutumnShadow(p),
      createWinterShadow(p)
    ];
    scenes.forEach(scene => scene.resize?.());
    activeIndex = 0;
    activeScene = scenes[activeIndex];
    p.frameRate(60);
  };

  p.draw = () => {
    if (!activeScene) return;
    if (!started) {
      activeScene.drawIdle?.(p) ?? p.background(6, 8, 15);
      return;
    }
    activeScene.draw?.(p);
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
    scenes.forEach(scene => scene.resize?.());
  };

  p.keyPressed = () => {
    if (p.key === ' ' || p.keyCode === 32) {
      if (!started) {
        beginExperience();
      } else {
        cycleScene(1);
      }
      return false;
    }
    return undefined;
  };
};

new p5(sketch);

window.addEventListener('keydown', evt => {
  if (evt.code === 'Space') {
    evt.preventDefault();
    if (!started) {
      beginExperience();
    } else {
      cycleScene(1);
    }
  }
});
