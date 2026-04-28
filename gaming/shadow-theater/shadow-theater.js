import { createSpringScene } from './spring-scene.js';
import { createSummerScene } from './summer-scene.js';
import { createAutumnScene } from './autumn-scene.js';
import { createWinterScene } from './winter-scene.js';

const overlayEl = document.getElementById('promptOverlay');
const cornerNoteEl = document.querySelector('.corner-note');

const SCENE_BUILDERS = [
  createSpringScene,
  createSummerScene,
  createAutumnScene,
  createWinterScene
];

let scenes = [];
let activeIndex = 0;
let activeScene = null;
let started = false;
let lastSwitch = 0;

function requestFullscreen() {
  const root = document.documentElement;
  const req = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
  if (!req) return;
  try {
    const result = req.call(root);
    if (result?.catch) {
      result.catch(() => {});
    }
  } catch (err) {
    // ignore
  }
}

function hideOverlay() {
  if (overlayEl) {
    overlayEl.style.display = 'none';
  }
  if (cornerNoteEl) {
    cornerNoteEl.style.display = 'none';
  }
}

function beginExperience() {
  if (started) return;
  started = true;
  activeScene?.enter?.();
  hideOverlay();
  requestFullscreen();
}

function cycleScene() {
  if (!started || !scenes.length) return;
  const now = performance.now();
  if (now - lastSwitch < 250) return;
  lastSwitch = now;
  activeIndex = (activeIndex + 1) % scenes.length;
  activeScene = scenes[activeIndex];
  activeScene.enter?.();
}

const sketch = p => {
  p.setup = () => {
    const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
    canvas.id('theater-canvas');
    scenes = SCENE_BUILDERS.map(builder => builder(p));
    scenes.forEach(scene => scene.resize?.());
    activeScene = scenes[activeIndex];
    p.frameRate(60);
  };

  p.draw = () => {
    if (!activeScene) return;
    p.background(6, 7, 10);
    activeScene.draw?.(p);

    // vignette
    const gradientSteps = 6;
    for (let i = 0; i < gradientSteps; i += 1) {
      const alpha = 80 / (i + 6);
      p.noFill();
      p.stroke(0, 0, 0, alpha);
      p.strokeWeight(40 + i * 18);
      p.rect(p.width / 2, p.height / 2, p.width + i * 30, p.height + i * 24, 18);
    }
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
        cycleScene();
      }
      return false;
    }
    if (p.keyCode === p.ESCAPE) {
      try {
        document.exitFullscreen?.();
      } catch (err) {}
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
      cycleScene();
    }
  }
});
