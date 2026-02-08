import { createOpeningCeremony } from './opening-ceremony.js';
import { createSnowCanon } from './snow-canon.js';
import { createZamboniGame } from './zamboni-game.js';

const overlayEl = document.getElementById('promptOverlay');
const startButtonEl = document.getElementById('startButton');
const hudEl = document.getElementById('hud');
const stageIndexEl = document.getElementById('stageIndex');
const stageTitleEl = document.getElementById('stageTitle');

const stages = [];
let activeStageIndex = 0;
let activeStage = null;
let lastFrameTime = 0;
let isRunning = false;

const actionsQueue = [];

function setStage(index) {
  activeStageIndex = index;
  activeStage = stages[index];
  if (stageIndexEl) stageIndexEl.textContent = String(index + 1);
  if (stageTitleEl) stageTitleEl.textContent = activeStage.title;
}

function scheduleAction() {
  actionsQueue.push(true);
}

function handleAction() {
  if (!isRunning || !activeStage) return;
  activeStage.handleAction();
}

function nextStage() {
  if (activeStageIndex + 1 >= stages.length) {
    isRunning = false;
    if (hudEl) hudEl.style.display = 'none';
    return;
  }
  setStage(activeStageIndex + 1);
}

const sketch = p => {
  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.id('olympic-canvas');
    p.frameRate(60);
    stages.push(createOpeningCeremony(p));
    stages.push(createSnowCanon(p));
    stages.push(createZamboniGame(p));
    setStage(0);
  };

  p.draw = () => {
    if (!isRunning || !activeStage) {
      p.background(4, 8, 26);
      return;
    }
    const now = p.millis();
    const delta = now - lastFrameTime;
    lastFrameTime = now;

    activeStage.update(delta);
    activeStage.draw();

    while (actionsQueue.length) {
      actionsQueue.pop();
      handleAction();
    }

    if (activeStage.isComplete()) {
      nextStage();
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

new p5(sketch);

startButtonEl?.addEventListener('click', () => {
  overlayEl?.classList.add('hidden');
  if (overlayEl) overlayEl.style.display = 'none';
  if (hudEl) hudEl.style.display = 'block';
  isRunning = true;
  lastFrameTime = performance.now();
});

window.addEventListener('keydown', event => {
  if (event.code === 'Space') {
    event.preventDefault();
    scheduleAction();
  }
});

window.addEventListener('pointerdown', () => {
  scheduleAction();
});
