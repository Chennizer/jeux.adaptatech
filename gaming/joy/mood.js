import { createSunriseScene } from './sunrise-scene.js';
import { createBalloonScene } from './balloon-scene.js';
import { createConfettiScene } from './confetti-scene.js';
import { createRainbowScene } from './rainbow-scene.js';

const PLAYLIST_TRACKS = [
  '../../songs/funkysong1.mp3',
  '../../songs/funkysong2.mp3',
  '../../songs/funkysong3.mp3',
  '../../songs/funkysong4.mp3'
];

const SCENE_SOUNDTRACKS = {
  sunrise: '../../sounds/wingsuit.mp3',
  balloons: '../../sounds/bubbles/bubble1.mp3',
  confetti: '../../sounds/success4.mp3',
  rainbow: '../../sounds/victory.mp3'
};

const DEFAULT_SCENE_VOLUME = 0.32;
const SCENE_SOUNDTRACK_VOLUMES = {
  confetti: 0.25,
  rainbow: 0.4
};

const startOverlayEl = document.getElementById('promptOverlay');
const startButtonEl = document.getElementById('startButton');
const modeButtons = document.querySelectorAll('#modeSelect button');
const langToggleEl = document.getElementById('langToggle');

const MODE_DEFAULT = 'default';
const MODE_SLOW = 'slow';
const SLOW_SCENE_DURATION = 58_000;
const SLOW_BASE_SPEED = 0.32;
const SLOW_PEAK_SPEED = 1.6;
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
let playlistOrder = [];
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
  playlistOrder = PLAYLIST_TRACKS.map((_, index) => index);
  shuffleInPlace(playlistOrder);
  if (previousTrackIndex !== null && playlistOrder[0] === previousTrackIndex && playlistOrder.length > 1) {
    [playlistOrder[0], playlistOrder[1]] = [playlistOrder[1], playlistOrder[0]];
  }
}

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

  resetPlaylistOrder();

  const playTrack = index => {
    if (!PLAYLIST_TRACKS.length) return;
    if (!playlistOrder.length) {
      resetPlaylistOrder();
    }
    playlistIndex = index % playlistOrder.length;
    const trackIndex = playlistOrder[playlistIndex];
    if (playlistAudio) {
      playlistAudio.pause();
    }
    const audio = createAudioElement(PLAYLIST_TRACKS[trackIndex], { volume: 1 });
    audio.addEventListener('ended', () => {
      const isLoopRestart = playlistIndex + 1 >= playlistOrder.length;
      if (isLoopRestart) {
        resetPlaylistOrder(trackIndex);
      }
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
    // Ignore fullscreen request failures.
  }
}

function setMode(newMode) {
  mode = newMode;
  modeButtons.forEach(btn => {
    const isActive = btn.dataset.mode === newMode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function toggleLangAttribute(lang) {
  document.documentElement.lang = lang;
}

function documentLangFallback() {
  const htmlLang = (document.documentElement.lang || '').toLowerCase();
  return ['en', 'ja', 'fr'].includes(htmlLang) ? htmlLang : 'en';
}

function getText(el, lang) {
  const SUPPORTED_LANGS = ['en', 'ja', 'fr'];
  for (const code of [lang, ...SUPPORTED_LANGS.filter(c => c !== lang)]) {
    const val = el.getAttribute(`data-${code}`);
    if (val != null) return val;
  }
  return el.textContent;
}

function setLanguage(lang) {
  const SUPPORTED_LANGS = ['en', 'ja', 'fr'];
  const langToSet = SUPPORTED_LANGS.includes(lang) ? lang : documentLangFallback();
  toggleLangAttribute(langToSet);

  document.querySelectorAll('.translate').forEach(el => {
    const val = getText(el, langToSet);
    if (val != null) el.innerHTML = val;
  });

  const btn = document.getElementById('language-toggle') || document.getElementById('langToggle');
  if (btn) {
    const label = btn.getAttribute(`data-${langToSet === 'fr' ? 'en' : 'fr'}`) || (langToSet === 'fr' ? 'English' : 'Français');
    btn.textContent = label;
  }
}

function toggleLanguage() {
  const current = document.documentElement.lang || documentLangFallback();
  const order = ['fr', 'en', 'ja'];
  const next = order[(order.indexOf(current) + 1) % order.length];
  localStorage.setItem('siteLanguage', next);
  setLanguage(next);
}

function initLanguage() {
  const saved = localStorage.getItem('siteLanguage');
  const lang = saved || documentLangFallback();
  setLanguage(lang);
}

function setupScene(p) {
  scenes = [
    createSunriseScene(p),
    createBalloonScene(p),
    createConfettiScene(p),
    createRainbowScene(p)
  ];
  activeIndex = 0;
  activeScene = scenes[0];
  sceneStartedAt = performance.now();
}

function attachControls(p) {
  const handlePulse = () => {
    if (!started) {
      beginExperience();
      return;
    }
    if (mode === MODE_DEFAULT) {
      cycleScene(1);
    } else {
      speedBurst = {
        start: performance.now(),
        duration: SPEED_PHASES.rampUp + SPEED_PHASES.hold + SPEED_PHASES.rampDown
      };
      activeScene?.pulse?.();
    }
  };

  p.mousePressed = handlePulse;
  p.touchStarted = handlePulse;

  window.addEventListener('keydown', event => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      handlePulse();
    }
    if (event.code === 'ArrowRight') {
      cycleScene(1);
    }
    if (event.code === 'ArrowLeft') {
      cycleScene(-1);
    }
  });
}

function updateSceneSpeed() {
  let speedMultiplier = 1;
  if (mode === MODE_SLOW && speedBurst) {
    const now = performance.now();
    const elapsed = now - speedBurst.start;
    const total = SPEED_PHASES.rampUp + SPEED_PHASES.hold + SPEED_PHASES.rampDown;
    if (elapsed >= total) {
      speedBurst = null;
    } else {
      const t = elapsed / total;
      if (elapsed < SPEED_PHASES.rampUp) {
        speedMultiplier = lerp(SLOW_BASE_SPEED, SLOW_PEAK_SPEED, elapsed / SPEED_PHASES.rampUp);
      } else if (elapsed < SPEED_PHASES.rampUp + SPEED_PHASES.hold) {
        speedMultiplier = SLOW_PEAK_SPEED;
      } else {
        const fadeT = (elapsed - SPEED_PHASES.rampUp - SPEED_PHASES.hold) / SPEED_PHASES.rampDown;
        speedMultiplier = lerp(SLOW_PEAK_SPEED, SLOW_BASE_SPEED, fadeT);
      }
    }
  } else if (mode === MODE_SLOW) {
    speedMultiplier = SLOW_BASE_SPEED;
  }

  activeScene?.setSpeedMultiplier?.(speedMultiplier);
}

function maybeAdvanceSceneSlowMode() {
  if (mode !== MODE_SLOW || !started) return;
  const elapsed = performance.now() - sceneStartedAt;
  if (elapsed >= SLOW_SCENE_DURATION) {
    cycleScene(1);
  }
}

function startSketch() {
  const sketch = p => {
    p.setup = () => {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.id('mood-canvas');
      canvas.style('z-index', '0');
      setupScene(p);
      attachControls(p);
      setMode(selectedMode);
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      activeScene?.resize?.();
    };

    p.draw = () => {
      if (!activeScene) return;
      maybeAdvanceSceneSlowMode();
      updateSceneSpeed();
      activeScene.draw();
    };
  };

  new p5(sketch);
}

startButtonEl?.addEventListener('click', () => {
  selectedMode = mode;
  beginExperience();
  requestFullscreen();
});

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const newMode = btn.dataset.mode === MODE_DEFAULT ? MODE_DEFAULT : MODE_SLOW;
    selectedMode = newMode;
    setMode(newMode);
  });
});

langToggleEl?.addEventListener('click', () => {
  toggleLanguage();
});

initLanguage();
startSketch();
