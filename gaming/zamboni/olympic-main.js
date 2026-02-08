import { OpeningCeremony } from './opening-ceremony.js';
import { SnowCanon } from './snow-canon.js';
import { ZamboniGame } from './zamboni-game.js';

const menuOverlay = document.getElementById('menuOverlay');
const startButton = document.getElementById('startButton');

let started = false;
let p5Instance = null;

function startExperience() {
  if (started) return;
  started = true;
  menuOverlay.style.display = 'none';

  p5Instance = new p5((p) => {
    const scenes = [
      new OpeningCeremony(p),
      new SnowCanon(p),
      new ZamboniGame(p),
    ];

    let activeIndex = 0;
    let transitionStart = null;

    function currentScene() {
      return scenes[activeIndex];
    }

    function goToNextScene() {
      if (activeIndex < scenes.length - 1) {
        activeIndex += 1;
        scenes[activeIndex].start();
        transitionStart = null;
      }
    }

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.colorMode(p.HSB, 360, 100, 100, 100);
      p.noStroke();
      scenes.forEach(scene => scene.setup());
      scenes[0].start();
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      scenes.forEach(scene => scene.resize());
    };

    p.draw = () => {
      const scene = currentScene();
      scene.update();
      scene.draw();

      if (scene.isComplete()) {
        if (!transitionStart) {
          transitionStart = p.millis();
        }
        const elapsed = p.millis() - transitionStart;
        if (elapsed > 2000) {
          goToNextScene();
        }
      }
    };

    function handlePress() {
      if (!started) return;
      const scene = currentScene();
      scene.handlePress();
    }

    p.keyPressed = () => {
      if (p.key === ' ') {
        p.key = '';
        handlePress();
      }
    };

    p.mousePressed = () => handlePress();
    p.touchStarted = () => handlePress();
  }, 'game-canvas');
}

startButton?.addEventListener('click', startExperience);
window.addEventListener('keydown', (event) => {
  if (!started && event.code === 'Space') {
    event.preventDefault();
    startExperience();
  }
});
