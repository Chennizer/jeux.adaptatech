import { createOpeningCeremony } from './opening-ceremony.js';
import { createSnowCanon } from './snow-canon.js';
import { createZamboniGame } from './zamboni-game.js';

const startOverlayEl = document.getElementById('promptOverlay');
const startButtonEl = document.getElementById('startButton');

const scenes = [createOpeningCeremony, createSnowCanon, createZamboniGame];

let sketch = null;
let activeSceneIndex = 0;
let activeScene = null;
let transitioning = false;
let transitionStart = 0;
let lastFrame = 0;

function createScene(p, index) {
  const factory = scenes[index];
  if (!factory) return null;
  return factory(p);
}

function beginExperience() {
  if (sketch) return;
  if (startOverlayEl) {
    startOverlayEl.style.display = 'none';
  }
  sketch = new p5(p => {
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight).id('mood-canvas');
      p.colorMode(p.RGB, 255, 255, 255, 255);
      p.noiseDetail(3, 0.6);
      activeSceneIndex = 0;
      activeScene = createScene(p, activeSceneIndex);
      activeScene?.enter?.();
      lastFrame = p.millis();
    };

    p.draw = () => {
      if (!activeScene) return;
      const now = p.millis();
      const delta = Math.min(64, now - lastFrame);
      lastFrame = now;
      activeScene.update?.(delta);
      activeScene.draw?.();
      drawSceneBadge(p, activeSceneIndex);
      if (!transitioning && activeScene.isComplete?.()) {
        transitioning = true;
        transitionStart = now;
      }
      if (transitioning && now - transitionStart > 1600) {
        nextScene(p);
      }
    };

    p.keyPressed = () => {
      if (!activeScene) return;
      if (p.key === ' ' || p.key === 'Spacebar') {
        activeScene.handlePress?.();
      }
    };

    p.mousePressed = () => {
      activeScene?.handlePress?.();
    };

    p.touchStarted = () => {
      activeScene?.handlePress?.();
      return false;
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      activeScene?.resize?.();
    };
  });
}

function nextScene(p) {
  transitioning = false;
  transitionStart = 0;
  activeSceneIndex += 1;
  if (activeSceneIndex >= scenes.length) {
    activeSceneIndex = scenes.length - 1;
    activeScene?.complete?.();
    return;
  }
  activeScene = createScene(p, activeSceneIndex);
  activeScene?.enter?.();
  lastFrame = p.millis();
}

function drawSceneBadge(p, index) {
  const label = `Étape ${index + 1} / ${scenes.length}`;
  p.push();
  p.noStroke();
  p.fill(8, 14, 24, 160);
  p.rect(16, 16, 150, 36, 18);
  p.fill(244, 244, 255, 230);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(label, 30, 34);
  p.pop();
}

if (startButtonEl) {
  startButtonEl.addEventListener('click', beginExperience);
}

window.addEventListener('keydown', event => {
  if (event.code === 'Space' && !sketch) {
    beginExperience();
  }
});
