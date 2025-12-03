import { createSpringScene } from './spring-scene.js';
import { createSummerScene } from './summer-scene.js';
import { createAutumnScene } from './autumn-scene.js';
import { createWinterScene } from './winter-scene.js';

const SCENE_PLAYLISTS = {
  spring: [
    '../../songs/season/spring1.mp3',
    '../../songs/season/spring2.mp3'
  ],
  summer: [
    '../../songs/season/summer1.mp3',
    '../../songs/season/summer2.mp3'
  ],
  autumn: [
    '../../songs/season/autumn1.mp3',
    '../../songs/season/autumn2.mp3'
  ],
  winter: [
    '../../songs/season/winter1.mp3',
    '../../songs/season/winter2.mp3'
  ]
};

const SCENE_SOUNDTRACKS = {
  spring: '../../sounds/sadness/subtlewind.mp3',
  summer: '../../sounds/sun/sunnyday.mp3',
  autumn: '../../sounds/sadness/subtlewind.mp3',
  winter: '../../sounds/winterambiance.mp3'
};

const DEFAULT_SCENE_VOLUME = 0.4;
const SCENE_SOUNDTRACK_VOLUMES = {
  spring: 0.15,
  summer: 0.2,
  winter: 0.55
};

const startOverlayEl = document.getElementById('promptOverlay');
const startButtonEl = document.getElementById('startButton');
const modeButtons = document.querySelectorAll('#modeSelect button');
const langToggleEl = document.getElementById('langToggle');

const MODE_DEFAULT = 'default';
const MODE_SLOW = 'slow';
const SLOW_SCENE_DURATION = 60000;
const SLOW_BASE_SPEED = 0.21;
const SLOW_PEAK_SPEED = 1.495;
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
let mode = MODE_SLOW;
let selectedMode = MODE_SLOW;
let sceneStartedAt = 0;
let speedBurst = null;
let activeSceneAudio = null;
const sceneAudioCache = new Map();
const playlistStates = new Map();
let activePlaylistSceneId = null;

const clamp01 = value => Math.min(1, Math.max(0, value));
const lerp = (a, b, t) => a + (b - a) * clamp01(t);
const shuffleInPlace = array => {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

function createAudioElement(src, { volume = 1, loop = false } = {}) {
  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = volume;
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';
  audio.setAttribute('playsinline', 'playsinline');
  return audio;
}

function resetScenePlaylistOrder(state, previousTrackIndex = null) {
  state.order = state.tracks.map((_, index) => index);
  shuffleInPlace(state.order);
  if (previousTrackIndex !== null && state.order[0] === previousTrackIndex && state.order.length > 1) {
    [state.order[0], state.order[1]] = [state.order[1], state.order[0]];
  }
}

function getPlaylistState(sceneId) {
  if (!playlistStates.has(sceneId)) {
    const tracks = SCENE_PLAYLISTS[sceneId] ?? [];
    const state = {
      sceneId,
      tracks,
      order: [],
      index: 0,
      audio: null,
      started: false,
      lastTime: 0
    };
    resetScenePlaylistOrder(state);
    playlistStates.set(sceneId, state);
  }
  return playlistStates.get(sceneId);
}

function pauseActivePlaylist() {
  if (!activePlaylistSceneId) return;
  const state = playlistStates.get(activePlaylistSceneId);
  if (state?.audio) {
    state.lastTime = state.audio.currentTime;
    state.audio.pause();
  }
  activePlaylistSceneId = null;
}

function playScenePlaylist(sceneId) {
  if (!sceneId || !(sceneId in SCENE_PLAYLISTS)) {
    pauseActivePlaylist();
    return;
  }
  if (activePlaylistSceneId && activePlaylistSceneId !== sceneId) {
    pauseActivePlaylist();
  }
  const state = getPlaylistState(sceneId);
  activePlaylistSceneId = sceneId;
  if (!state.tracks.length) return;

  if (!state.order.length) {
    resetScenePlaylistOrder(state);
  }

  const orderIndex = state.index % state.order.length;
  const trackIndex = state.order[orderIndex];
  const trackSrc = state.tracks[trackIndex];
  const needsNewAudio = !state.audio || state.audio.dataset.trackIndex !== String(trackIndex);

  if (needsNewAudio) {
    const audio = createAudioElement(trackSrc, { volume: 1 });
    audio.dataset.trackIndex = String(trackIndex);
    audio.addEventListener('ended', () => {
      state.lastTime = 0;
      const prevTrackIndex = state.order[orderIndex];
      state.index = (state.index + 1) % state.order.length;
      if (state.index === 0) {
        resetScenePlaylistOrder(state, prevTrackIndex);
      }
      state.audio = null;
      if (activePlaylistSceneId === sceneId) {
        playScenePlaylist(sceneId);
      }
    });
    state.audio = audio;
  }

  const audio = state.audio;
  if (!audio) return;

  const seekTo = state.lastTime ?? 0;
  if (seekTo > 0) {
    const setTime = () => {
      const target = Math.min(seekTo, Number.isFinite(audio.duration) ? audio.duration - 0.05 : seekTo);
      audio.currentTime = target < 0 ? 0 : target;
      audio.removeEventListener('loadedmetadata', setTime);
    };
    if (audio.readyState >= 1) {
      setTime();
    } else {
      audio.addEventListener('loadedmetadata', setTime);
    }
  }

  audio.play().catch(() => {});
  state.started = true;
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
  pauseActivePlaylist();
  activeIndex = (activeIndex + step + scenes.length) % scenes.length;
  activeScene = scenes[activeIndex];
  activeScene.enter?.();
  handleSceneAudio(activeScene);
  playScenePlaylist(activeScene?.id);
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
  playScenePlaylist(activeScene?.id);
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
