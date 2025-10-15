(function () {
  'use strict';

  const SIZE_CONFIG = Object.freeze({
    petit: { label: 'Petit', widthPercent: 55 },
    moyen: { label: 'Moyen', widthPercent: 78 },
    grand: { label: 'Grand', widthPercent: 100 }
  });

  const SIZE_KEYS = Object.keys(SIZE_CONFIG);
  const FALLBACK_COLORS = ['#f97316', '#0ea5e9', '#84cc16'];

  const DEFAULT_SUCCESS_SOUND = '../sounds/success3.mp3';
  const DEFAULT_ERROR_SOUND = '../sounds/error.mp3';

  let session = null;
  let themeData = {};
  let reinforcerController = null;
  let successAudio = null;
  let errorAudio = null;

  let containerEl = null;
  let promptEl = null;
  let boardEl = null;
  let feedbackEl = null;

  let currentTarget = null;
  let roundLocked = false;

  document.addEventListener('DOMContentLoaded', initializeGame);

  function initializeGame() {
    session = window.sessionHelpers && window.sessionHelpers.ensureCurrentGame
      ? window.sessionHelpers.ensureCurrentGame('taille')
      : null;

    if (!session) {
      return;
    }

    if (window.sessionHelpers && typeof window.sessionHelpers.updateActivityMarker === 'function') {
      window.sessionHelpers.updateActivityMarker(session);
    }

    themeData = session.themeData || {};

    containerEl = document.getElementById('gameContainer');
    promptEl = document.getElementById('sizePrompt');
    boardEl = document.getElementById('sizeBoard');
    feedbackEl = document.getElementById('feedbackMessage');

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
    currentTarget = sample(SIZE_KEYS);
    roundLocked = false;

    if (promptEl) {
      promptEl.textContent = SIZE_CONFIG[currentTarget].label.toUpperCase();
    }
    if (feedbackEl) {
      feedbackEl.textContent = '';
      feedbackEl.className = 'feedback-message';
    }

    const imageSrc = pickImage();

    if (boardEl) {
      boardEl.innerHTML = '';
      const shuffledSizes = shuffleArray(SIZE_KEYS.slice());
      shuffledSizes.forEach((sizeKey) => {
        const cardEl = createSizeCard(sizeKey, imageSrc);
        boardEl.appendChild(cardEl);
      });
    }
  }

  function pickImage() {
    const pool = Array.isArray(themeData.transparentPNGs)
      ? themeData.transparentPNGs.filter(Boolean)
      : [];

    if (pool.length > 0) {
      return sample(pool);
    }

    return buildFallbackImage();
  }

  function buildFallbackImage() {
    const color = FALLBACK_COLORS[Math.floor(Math.random() * FALLBACK_COLORS.length)];
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420">
  <defs>
    <radialGradient id="grad" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${color}" stop-opacity="0.65" />
    </radialGradient>
  </defs>
  <g>
    <circle cx="210" cy="210" r="170" fill="url(#grad)" />
    <text x="210" y="228" font-family="'Poppins', 'Arial', sans-serif" font-size="96" fill="#ffffff" text-anchor="middle" font-weight="700">★</text>
  </g>
</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function createSizeCard(sizeKey, imageSrc) {
    const config = SIZE_CONFIG[sizeKey];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'size-card';
    card.dataset.size = sizeKey;
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-pressed', 'false');
    card.setAttribute('aria-label', config.label);

    const figure = document.createElement('div');
    figure.className = 'size-card__figure';

    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = '';
    img.style.width = `${config.widthPercent}%`;
    img.style.height = 'auto';

    figure.appendChild(img);

    const label = document.createElement('span');
    label.className = 'size-card__label';
    label.textContent = config.label;

    card.appendChild(figure);
    card.appendChild(label);

    card.addEventListener('click', () => handleSelection(card));

    return card;
  }

  function handleSelection(cardEl) {
    if (roundLocked || !cardEl) {
      return;
    }

    const selectedSize = cardEl.dataset.size;
    const isCorrect = selectedSize === currentTarget;

    cardEl.classList.add('size-card--selected');

    if (isCorrect) {
      roundLocked = true;
      cardEl.classList.add('size-card--correct');
      cardEl.setAttribute('aria-pressed', 'true');
      playAudio(successAudio);
      setFeedback('Bravo !', 'success');
      setTimeout(triggerReinforcer, 900);
    } else {
      roundLocked = true;
      cardEl.classList.add('size-card--incorrect');
      playAudio(errorAudio);
      setFeedback('Essaie encore.', 'error');
      setTimeout(() => {
        cardEl.classList.remove('size-card--selected', 'size-card--incorrect');
        cardEl.setAttribute('aria-pressed', 'false');
        roundLocked = false;
      }, 600);
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

  function triggerReinforcer() {
    if (reinforcerController && typeof reinforcerController.show === 'function') {
      reinforcerController.show();
    } else if (window.sessionHelpers && typeof window.sessionHelpers.advanceToNextGame === 'function') {
      window.sessionHelpers.advanceToNextGame();
    }
  }

  function sample(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return null;
    }
    const index = Math.floor(Math.random() * array.length);
    return array[index];
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
})();
