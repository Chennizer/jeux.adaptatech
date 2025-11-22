import { createSpringScene } from './season-spring-scene.js';
import { createSummerScene } from './season-summer-scene.js';
import { createAutumnScene } from './season-autumn-scene.js';
import { createWinterScene } from './season-winter-scene.js';

const PLAYLIST_TRACKS = [
  '../../songs/spring/spring2.mp3',
  '../../songs/funkysong2.mp3',
  '../../songs/soie.mp3',
  '../../songs/winter/wintersong3.mp3'
];

const SCENE_SOUNDTRACKS = {
  spring: '../../sounds/cloudswind.mp3',
  summer: '../../sounds/harp.mp3',
  autumn: '../../sounds/rain1.mp3',
  winter: '../../sounds/winterambiance.mp3'
};

const DEFAULT_SCENE_VOLUME = 0.35;
const SCENE_SOUNDTRACK_VOLUMES = {
  summer: 0.25,
  autumn: 0.2,
  winter: 0.45
};

const startOverlayEl = document.getElementById('promptOverlay');
const startButtonEl = document.getElementById('startButton');
const modeButtons = document.querySelectorAll('#modeSelect button');
const langToggleEl = document.getElementById('langToggle');

const MODE_DEFAULT = 'default';
const MODE_SLOW = 'slow';
const SLOW_SCENE_DURATION = 55_000;
const SLOW_BASE_SPEED = 0.32;
const SLOW_PEAK_SPEED = 1.25;
const SPEED_PHASES = {
  rampUp: 1_800,
  hold: 2_200,
  rampDown: 1_600
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
const shuffleInPlace = array => {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

function resetPlaylistOrder(previousTrackIndex = null) {
  const order = PLAYLIST_TRACKS.map((_, index) => index);
  shuffleInPlace(order);
  if (previousTrackIndex !== null && order[0] === previousTrackIndex && order.length > 1) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
}

let playlistOrder = resetPlaylistOrder();

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
    if (!playlistOrder.length) {
      playlistOrder = resetPlaylistOrder();
    }
    playlistIndex = index % playlistOrder.length;
    const trackIndex = playlistOrder[playlistIndex];
    if (playlistAudio) {
      playlistAudio.pause();
    }
    const audio = createAudioElement(PLAYLIST_TRACKS[trackIndex], { volume: 1 });
    audio.addEventListener('ended', () => {
      const isLoopRestart = playlistIndex + 1 >= playlistOrder.length;
      const nextOrder = isLoopRestart ? resetPlaylistOrder(trackIndex) : playlistOrder;
      playlistOrder = nextOrder;
      playTrack((playlistIndex + 1) % playlistOrder.length);
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
    const volume = SCENE_SOUNDTRACK_VOLUMES[sceneId] ?? DEFAULT_SCENE_VOLUME;
    const audio = createAudioElement(SCENE_SOUNDTRACKS[sceneId], { volume, loop: true });
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
    // ignore
  }
}

function setModeSelection(value, { refresh = true } = {}) {
  selectedMode = value === MODE_SLOW ? MODE_SLOW : MODE_DEFAULT;
  modeButtons.forEach(button => {
    const isActive = button.dataset.mode === selectedMode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  if (refresh) {
    refreshMode();
  }
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

function triggerSpeedBurst() {
  const now = performance.now();
  speedBurst = {
    startedAt: now,
    duration: SPEED_PHASES.rampUp + SPEED_PHASES.hold + SPEED_PHASES.rampDown
  };
  activeScene?.pulse?.();
}

function getCurrentSpeedMultiplier() {
  if (!started) return 1;
  if (mode !== MODE_SLOW || !speedBurst) return 1;
  const now = performance.now();
  const elapsed = now - speedBurst.startedAt;
  const { rampUp, hold, rampDown } = SPEED_PHASES;
  if (elapsed >= rampUp + hold + rampDown) {
    speedBurst = null;
    return 1;
  }
  if (elapsed < rampUp) {
    const t = elapsed / rampUp;
    return lerp(1, SLOW_PEAK_SPEED, t);
  }
  if (elapsed < rampUp + hold) {
    return SLOW_PEAK_SPEED;
  }
  const t = (elapsed - rampUp - hold) / rampDown;
  return lerp(SLOW_PEAK_SPEED, SLOW_BASE_SPEED, t);
}

const sketch = p => {
  p.setup = () => {
    const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
    canvas.id('mood-canvas');
    scenes = [
      createSpringScene(p),
      createSummerScene(p),
      createAutumnScene(p),
      createWinterScene(p)
    ];
    scenes.forEach(scene => scene.resize?.());
    activeIndex = 0;
    activeScene = scenes[activeIndex];
    p.frameRate(60);
  };

  p.draw = () => {
    if (!activeScene) return;
    if (!started) {
      p.background(4, 10, 16);
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

setModeSelection(selectedMode, { refresh: false });

modeButtons.forEach(button => {
  button.addEventListener('click', evt => {
    evt.preventDefault();
    setModeSelection(button.dataset.mode);
  });
});
