import { createLanternScene } from './zen-lantern-scene.js';
import { createLotusScene } from './zen-lotus-scene.js';
import { createBambooScene } from './zen-bamboo-scene.js';
import { createCloudScene } from './zen-cloud-scene.js';
import { createShoreScene } from './zen-shore-scene.js';

const PLAYLIST_TRACKS = [
  '../../songs/sadness/v5sadviolinmusic1.mp3',
  '../../songs/sadness/v5sadviolinmusic2.mp3',
  '../../songs/sadness/v5sadviolinmusic3.mp3',
  '../../songs/sadness/v5sadviolinmusic4.mp3',
  '../../songs/sadness/v5sadviolinmusic5.mp3'
];

const SCENE_SOUNDTRACKS = {
  lantern: '../../sounds/sadness/softrain.mp3',
  lotus: '../../sounds/sadness/windandsnow.mp3',
  bamboo: '../../sounds/sadness/candle.mp3',
  clouds: '../../sounds/sadness/subtlewind.mp3',
  shore: '../../sounds/sadness/softrain.mp3'
};

const startOverlayEl = document.getElementById('promptOverlay');
const startButtonEl = document.getElementById('startButton');
const modeButtons = document.querySelectorAll('#modeSelect button');
const langToggleEl = document.getElementById('langToggle');

const MODE_DEFAULT = 'default';
const MODE_SLOW = 'slow';
const SLOW_SCENE_DURATION = 60_000;
const SLOW_BASE_SPEED = 0.28;
const SLOW_PEAK_SPEED = 1.35;
const SPEED_PHASES = {
  rampUp: 2_400,
  hold: 2_400,
  rampDown: 2_000
};

let scenes = [];
let activeIndex = 0;
let activeScene = null;
let lastSwitch = 0;
let started = false;
let mode = MODE_SLOW;
let selectedMode = MODE_SLOW;
let sceneStartedAt = 0;
let speedBurst = null;
let playlistStarted = false;
let playlistAudio = null;
let playlistIndex = 0;
let activeSceneAudio = null;
const sceneAudioCache = new Map();

const clamp01 = value => Math.min(1, Math.max(0, value));
const lerp = (a, b, t) => a + (b - a) * clamp01(t);

function createAudioElement(src, { volume = 1, loop = false } = {}) {
  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = volume;
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';
  audio.setAttribute('playsinline', 'playsinline');
  return audio;
}

function startPlaylistIfNeeded() {
  if (playlistStarted || !PLAYLIST_TRACKS.length) return;
  playlistStarted = true;

  const playTrack = index => {
    if (!PLAYLIST_TRACKS.length) return;
    playlistIndex = index % PLAYLIST_TRACKS.length;
    if (playlistAudio) {
      playlistAudio.pause();
    }
    const audio = createAudioElement(PLAYLIST_TRACKS[playlistIndex], { volume: 1 });
    audio.addEventListener('ended', () => {
      playTrack((playlistIndex + 1) % PLAYLIST_TRACKS.length);
    });
    playlistAudio = audio;
    audio.play().catch(() => {});
  };

  playTrack(playlistIndex);
}

function stopActiveSceneAudio() {
  if (activeSceneAudio) {
    activeSceneAudio.pause();
    activeSceneAudio.currentTime = 0;
    activeSceneAudio = null;
  }
}

function ensureSceneAudio(sceneId) {
  if (!sceneId || !(sceneId in SCENE_SOUNDTRACKS)) {
    return null;
  }
  if (!sceneAudioCache.has(sceneId)) {
    const audio = createAudioElement(SCENE_SOUNDTRACKS[sceneId], { volume: 0.35, loop: true });
    sceneAudioCache.set(sceneId, audio);
  }
  return sceneAudioCache.get(sceneId);
}

function playSceneSoundtrack(sceneId) {
  const audio = ensureSceneAudio(sceneId);
  if (!audio) {
    stopActiveSceneAudio();
    return;
  }
  if (activeSceneAudio === audio) {
    if (audio.paused) {
      audio.play().catch(() => {});
    }
    return;
  }
  stopActiveSceneAudio();
  activeSceneAudio = audio;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function handleSceneAudio(scene) {
  if (!started || !scene) return;
  playSceneSoundtrack(scene.id);
}

function cycleScene(step = 1) {
  if (!started || !scenes.length) return;
  const now = performance.now();
  if (now - lastSwitch < 300) return;
  lastSwitch = now;
  activeIndex = (activeIndex + step + scenes.length) % scenes.length;
  activeScene = scenes[activeIndex];
  activeScene.enter?.();
  handleSceneAudio(activeScene);
  sceneStartedAt = performance.now();
  speedBurst = null;
}

function beginExperience() {
  if (started || !activeScene) return;
  started = true;
  sceneStartedAt = performance.now();
  speedBurst = null;
  activeScene.enter?.();
  handleSceneAudio(activeScene);
  startPlaylistIfNeeded();
  if (startOverlayEl) {
    startOverlayEl.style.display = 'none';
  }
  if (langToggleEl) {
    langToggleEl.style.display = 'none';
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
  const value = selectedMode === MODE_SLOW ? MODE_SLOW : MODE_DEFAULT;
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
      createLanternScene(p),
      createLotusScene(p),
      createBambooScene(p),
      createCloudScene(p),
      createShoreScene(p)
    ];
    scenes.forEach(scene => scene.resize?.());
    activeIndex = 0;
    activeScene = scenes[activeIndex];
    p.frameRate(60);
  };

  p.draw = () => {
    if (!activeScene) return;
    if (!started) {
      p.background(4, 18, 24);
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
};

new p5(sketch);

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

const setModeSelection = (value, { refresh = true } = {}) => {
  selectedMode = value === MODE_SLOW ? MODE_SLOW : MODE_DEFAULT;
  modeButtons.forEach(button => {
    const isActive = button.dataset.mode === selectedMode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  if (refresh) {
    refreshMode();
  }
};

setModeSelection(selectedMode, { refresh: false });

modeButtons.forEach(button => {
  button.addEventListener('click', evt => {
    evt.preventDefault();
    setModeSelection(button.dataset.mode);
  });
});
