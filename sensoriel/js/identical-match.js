(function () {
  'use strict';

  const DEFAULT_SUCCESS_SOUND = '../sounds/success3.mp3';
  const DEFAULT_ERROR_SOUND = '../sounds/error.mp3';
  const FALLBACK_COLORS = ['#f97316', '#0ea5e9', '#a855f7', '#22c55e', '#facc15', '#fb7185'];

  let session = null;
  let themeData = {};
  let reinforcerController = null;
  let successAudio = null;
  let errorAudio = null;

  let containerEl = null;
  let targetFrameEl = null;
  let choicesGridEl = null;
  let feedbackEl = null;

  let roundLocked = false;

  document.addEventListener('DOMContentLoaded', initializeGame);

  function initializeGame() {
    session = window.sessionHelpers && window.sessionHelpers.ensureCurrentGame
      ? window.sessionHelpers.ensureCurrentGame('identical-match')
      : null;

    if (!session) {
      return;
    }

    if (window.sessionHelpers && typeof window.sessionHelpers.updateActivityMarker === 'function') {
      window.sessionHelpers.updateActivityMarker(session);
    }

    themeData = session.themeData || {};

    containerEl = document.getElementById('gameContainer');
    targetFrameEl = document.getElementById('targetFrame');
    choicesGridEl = document.getElementById('choicesGrid');
    feedbackEl = document.getElementById('matchFeedback');

    prepareAudioPlayers();

    if (window.sessionHelpers && typeof window.sessionHelpers.setupSharedReinforcer === 'function') {
      reinforcerController = window.sessionHelpers.setupSharedReinforcer(session);
    }

    const startRound = () => {
      revealGame();
      buildRound();
    };

    if (window.sessionHelpers && typeof window.sessionHelpers.showActivityOverlay === 'function') {
      window.sessionHelpers.showActivityOverlay(startRound, session);
    } else {
      startRound();
    }
  }

  function prepareAudioPlayers() {
    const successSrc = themeData.reinforcerSound || DEFAULT_SUCCESS_SOUND;
    const errorSrc = themeData.errorSound || DEFAULT_ERROR_SOUND;
    successAudio = createAudio(successSrc);
    errorAudio = createAudio(errorSrc);
  }

  function createAudio(src) {
    if (!src) {
      return null;
    }
    const audio = new Audio(src);
    audio.preload = 'auto';
    return audio;
  }

  function revealGame() {
    if (containerEl) {
      containerEl.style.display = 'flex';
    }
  }

  function buildRound() {
    if (!targetFrameEl || !choicesGridEl) {
      return;
    }

    const options = window.sessionHelpers && typeof window.sessionHelpers.getCurrentGameOptions === 'function'
      ? window.sessionHelpers.getCurrentGameOptions(session)
      : {};

    const desiredChoices = clampNumber(parseInt(options.matchChoiceCount, 10), 2, 6, 3);
    const pool = Array.isArray(themeData.transparentPNGs)
      ? Array.from(new Set(themeData.transparentPNGs.filter(Boolean)))
      : [];

    const correctSrc = pool.length > 0 ? sample(pool) : buildFallbackImage(0);
    const distractorCount = Math.max(desiredChoices - 1, 1);
    const distractors = buildDistractors(pool, correctSrc, distractorCount);

    const cards = [{ id: `correct-${Date.now()}`, src: correctSrc, correct: true }]
      .concat(distractors.map((src, index) => ({ id: `distractor-${index}`, src, correct: false })));

    const shuffledCards = shuffleArray(cards);

    targetFrameEl.innerHTML = '';
    const targetImg = document.createElement('img');
    targetImg.src = correctSrc;
    targetImg.alt = "Image modèle";
    targetFrameEl.appendChild(targetImg);

    choicesGridEl.innerHTML = '';
    shuffledCards.forEach((card, index) => {
      const button = createChoiceCard(card, index);
      choicesGridEl.appendChild(button);
    });

    setFeedback('Trouve l’image identique au modèle.', '');
    roundLocked = false;
  }

  function buildDistractors(pool, correctSrc, desiredCount) {
    const available = pool.filter((src) => src !== correctSrc);
    const distractors = [];
    const used = new Set();

    while (distractors.length < desiredCount && available.length > 0) {
      const index = Math.floor(Math.random() * available.length);
      const candidate = available.splice(index, 1)[0];
      if (used.has(candidate)) {
        continue;
      }
      used.add(candidate);
      distractors.push(candidate);
    }

    let fallbackIndex = 1;
    while (distractors.length < desiredCount) {
      distractors.push(buildFallbackImage(fallbackIndex));
      fallbackIndex += 1;
    }

    return distractors;
  }

  function createChoiceCard(card, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-card';
    button.dataset.cardId = card.id;
    button.dataset.correct = card.correct ? 'true' : 'false';
    button.setAttribute('aria-label', `Choix ${index + 1}`);

    const img = document.createElement('img');
    img.src = card.src;
    img.alt = '';

    button.appendChild(img);
    button.addEventListener('click', () => handleChoiceSelection(button));
    return button;
  }

  function handleChoiceSelection(button) {
    if (!button || roundLocked) {
      return;
    }

    const isCorrect = button.dataset.correct === 'true';

    button.classList.add('choice-card--focused');

    if (isCorrect) {
      roundLocked = true;
      button.classList.add('choice-card--correct');
      playAudio(successAudio);
      setFeedback('Bravo ! C’est la bonne image.', 'success');
      setTimeout(triggerReinforcer, 900);
    } else {
      button.classList.add('choice-card--incorrect');
      playAudio(errorAudio);
      setFeedback('Ce n’est pas la bonne image, essaye encore.', 'error');
      setTimeout(() => {
        button.classList.remove('choice-card--focused', 'choice-card--incorrect');
      }, 600);
    }
  }

  function triggerReinforcer() {
    if (reinforcerController && typeof reinforcerController.show === 'function') {
      reinforcerController.show();
    } else if (window.sessionHelpers && typeof window.sessionHelpers.advanceToNextGame === 'function') {
      window.sessionHelpers.advanceToNextGame();
    }
  }

  function setFeedback(message, status) {
    if (!feedbackEl) {
      return;
    }
    feedbackEl.textContent = message || '';
    feedbackEl.className = 'feedback-message';
    if (status) {
      feedbackEl.classList.add(status);
    }
  }

  function playAudio(audio) {
    if (!audio) {
      return;
    }
    try {
      audio.currentTime = 0;
      void audio.play();
    } catch (error) {
      console.warn('Audio playback issue:', error);
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function sample(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return null;
    }
    const index = Math.floor(Math.random() * array.length);
    return array[index];
  }

  function clampNumber(value, min, max, fallback) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(Math.max(value, min), max);
  }

  function buildFallbackImage(index) {
    const color = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
    const label = index + 1;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420">
  <defs>
    <radialGradient id="gradient-${label}" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.92" />
      <stop offset="100%" stop-color="${color}" stop-opacity="0.68" />
    </radialGradient>
  </defs>
  <g>
    <circle cx="210" cy="210" r="180" fill="url(#gradient-${label})" />
    <text x="210" y="236" font-family="'Poppins', 'Arial', sans-serif" font-size="132" font-weight="700" text-anchor="middle" fill="#ffffff">${label}</text>
  </g>
</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
})();
