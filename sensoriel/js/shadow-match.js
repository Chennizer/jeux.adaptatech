(function () {
  'use strict';

  const DEFAULT_SUCCESS_SOUND = '../sounds/success3.mp3';
  const DEFAULT_ERROR_SOUND = '../sounds/error.mp3';
  const FALLBACK_COLORS = ['#0ea5e9', '#f97316', '#a855f7', '#22c55e', '#facc15'];

  let session = null;
  let themeData = {};
  let reinforcerController = null;
  let successAudio = null;
  let errorAudio = null;

  let boardEl = null;
  let trayEl = null;
  let statusEl = null;
  let containerEl = null;

  let selectedPieceEl = null;
  let placementsRemaining = 0;

  document.addEventListener('DOMContentLoaded', initializeGame);

  function initializeGame() {
    session = window.sessionHelpers && window.sessionHelpers.ensureCurrentGame
      ? window.sessionHelpers.ensureCurrentGame('shadow-match')
      : null;

    if (!session) {
      return;
    }

    if (window.sessionHelpers && typeof window.sessionHelpers.updateActivityMarker === 'function') {
      window.sessionHelpers.updateActivityMarker(session);
    }

    themeData = session.themeData || {};

    boardEl = document.getElementById('shadowBoard');
    trayEl = document.getElementById('pieceTray');
    statusEl = document.getElementById('shadowStatus');
    containerEl = document.getElementById('gameContainer');

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
    clearBoard();

    const options = window.sessionHelpers && typeof window.sessionHelpers.getCurrentGameOptions === 'function'
      ? window.sessionHelpers.getCurrentGameOptions(session)
      : {};

    const desiredCount = clampNumber(parseInt(options.shadowItemCount, 10), 2, 6, 4);
    const items = buildItemPool(desiredCount);

    if (items.length === 0) {
      setStatus('Aucune image disponible pour cette activité.', 'error');
      return;
    }

    placementsRemaining = items.length;
    selectedPieceEl = null;

    const shuffledSlots = shuffleArray(items.slice());
    shuffledSlots.forEach((item, index) => {
      const slot = createShadowSlot(item, index);
      boardEl.appendChild(slot);
    });

    const shuffledPieces = shuffleArray(items.slice());
    shuffledPieces.forEach((item, index) => {
      const piece = createPieceCard(item, index);
      trayEl.appendChild(piece);
    });

    setStatus('Sélectionne une image, puis touche l’ombre correspondante.', '');
  }

  function clearBoard() {
    placementsRemaining = 0;
    selectedPieceEl = null;
    if (boardEl) {
      boardEl.innerHTML = '';
    }
    if (trayEl) {
      trayEl.innerHTML = '';
    }
  }

  function buildItemPool(desiredCount) {
    const pool = Array.isArray(themeData.transparentPNGs)
      ? Array.from(new Set(themeData.transparentPNGs.filter(Boolean)))
      : [];

    const items = [];
    const used = new Set();

    while (items.length < desiredCount && pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      const src = pool.splice(index, 1)[0];
      if (used.has(src)) {
        continue;
      }
      used.add(src);
      items.push({ id: `asset-${items.length}`, src });
    }

    while (items.length < desiredCount) {
      const placeholder = buildFallbackImage(items.length);
      items.push({ id: `fallback-${items.length}`, src: placeholder });
    }

    return items;
  }

  function buildFallbackImage(index) {
    const color = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
    const label = index + 1;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420">
  <defs>
    <linearGradient id="grad-${label}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${color}" stop-opacity="0.65" />
    </linearGradient>
  </defs>
  <g>
    <rect x="36" y="36" width="348" height="348" rx="68" fill="url(#grad-${label})" />
    <text x="210" y="238" font-family="'Poppins', 'Arial', sans-serif" font-size="140" fill="#ffffff" text-anchor="middle" font-weight="700">${label}</text>
  </g>
</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function createShadowSlot(item, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shadow-slot';
    button.dataset.itemId = item.id;
    button.setAttribute('aria-label', `Ombre à compléter ${index + 1}`);
    button.style.setProperty('--shadow-image', `url("${item.src}")`);
    button.addEventListener('click', () => handleSlotClick(button));
    return button;
  }

  function createPieceCard(item, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'piece-card';
    button.dataset.itemId = item.id;
    button.setAttribute('aria-label', `Image ${index + 1}`);

    const img = document.createElement('img');
    img.src = item.src;
    img.alt = '';

    button.appendChild(img);
    button.addEventListener('click', () => handlePieceClick(button));
    return button;
  }

  function handlePieceClick(piece) {
    if (!piece || piece.classList.contains('piece-card--placed')) {
      return;
    }

    if (selectedPieceEl === piece) {
      piece.classList.remove('piece-card--selected');
      selectedPieceEl = null;
      setStatus('Sélection désactivée.', '');
      return;
    }

    if (selectedPieceEl) {
      selectedPieceEl.classList.remove('piece-card--selected');
    }

    selectedPieceEl = piece;
    piece.classList.add('piece-card--selected');
    setStatus('Choisis l’ombre correspondante.', '');
  }

  function handleSlotClick(slot) {
    if (!slot || slot.dataset.filled === 'true') {
      return;
    }

    if (!selectedPieceEl) {
      slot.classList.add('shadow-slot--target');
      setTimeout(() => slot.classList.remove('shadow-slot--target'), 450);
      setStatus('Sélectionne d’abord une image dans le bas.', 'error');
      playAudio(errorAudio);
      return;
    }

    const isMatch = selectedPieceEl.dataset.itemId === slot.dataset.itemId;

    if (isMatch) {
      placePieceInSlot(selectedPieceEl, slot);
      playAudio(successAudio);
      placementsRemaining -= 1;
      if (placementsRemaining <= 0) {
        setStatus('Toutes les ombres sont complétées, bravo !', 'success');
        setTimeout(triggerReinforcer, 900);
      } else {
        setStatus('Super ! Continue avec les autres ombres.', 'success');
      }
    } else {
      slot.classList.add('shadow-slot--incorrect');
      playAudio(errorAudio);
      setStatus('Ce n’est pas la bonne ombre. Essaie une autre zone.', 'error');
      setTimeout(() => slot.classList.remove('shadow-slot--incorrect'), 550);
    }
  }

  function placePieceInSlot(piece, slot) {
    piece.classList.remove('piece-card--selected');
    piece.classList.add('piece-card--placed');
    piece.setAttribute('aria-hidden', 'true');

    const img = document.createElement('img');
    img.src = piece.querySelector('img').src;
    img.alt = '';
    img.className = 'placed-piece';

    slot.dataset.filled = 'true';
    slot.classList.add('shadow-slot--correct');
    slot.appendChild(img);

    selectedPieceEl = null;
  }

  function triggerReinforcer() {
    if (reinforcerController && typeof reinforcerController.show === 'function') {
      reinforcerController.show();
    } else if (window.sessionHelpers && typeof window.sessionHelpers.advanceToNextGame === 'function') {
      window.sessionHelpers.advanceToNextGame();
    }
  }

  function setStatus(message, status) {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message || '';
    statusEl.className = 'status-message';
    if (status) {
      statusEl.classList.add(status);
    }
  }

  function clampNumber(value, min, max, fallback) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(Math.max(value, min), max);
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
})();
