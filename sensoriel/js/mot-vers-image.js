(function () {
  'use strict';

  const PICTO_INDEX_URL = '../../images/pictos/index.json';
  const DEFAULT_ERROR_SOUND = '../../sounds/error.mp3';
  const DEFAULT_SUCCESS_SOUND = '../../sounds/victory.mp3';

  let readingSession = null;
  let themeData = {};
  let reinforcerController = null;
  let successAudio = null;
  let errorAudio = null;

  let currentWordEl = null;
  let roundCounterEl = null;
  let choicesGridEl = null;
  let statusMessageEl = null;
  let speakButtonEl = null;

  let roundPairs = [];
  let availablePairs = [];
  let totalRounds = 0;
  let currentRoundIndex = 0;
  let choiceCount = 3;
  let activePair = null;

  let speechVoice = null;

  document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
  });

  async function initializeGame() {
    readingSession = window.sessionHelpers && window.sessionHelpers.ensureCurrentGame
      ? window.sessionHelpers.ensureCurrentGame('mot-vers-image')
      : null;

    if (!readingSession) {
      return;
    }

    if (window.sessionHelpers && typeof window.sessionHelpers.updateActivityMarker === 'function') {
      window.sessionHelpers.updateActivityMarker(readingSession);
    }

    themeData = readingSession.themeData || {};
    captureDomElements();
    prepareAudioPlayers();
    setupSpeechSynthesis();

    if (window.sessionHelpers && typeof window.sessionHelpers.setupSharedReinforcer === 'function') {
      reinforcerController = window.sessionHelpers.setupSharedReinforcer(readingSession);
    }

    let pictoIndex = null;
    try {
      pictoIndex = await loadPictoIndex();
    } catch (error) {
      console.warn('Unable to load pictogram index, using theme-only assets.', error);
    }

    if (window.sessionHelpers && typeof window.sessionHelpers.showActivityOverlay === 'function') {
      window.sessionHelpers.showActivityOverlay(() => {
        revealGameContainer();
        startGame(pictoIndex);
      }, readingSession);
    } else {
      revealGameContainer();
      startGame(pictoIndex);
    }
  }

  function captureDomElements() {
    currentWordEl = document.getElementById('currentWord');
    roundCounterEl = document.getElementById('roundCounter');
    choicesGridEl = document.getElementById('choicesGrid');
    statusMessageEl = document.getElementById('readingStatus');
    speakButtonEl = document.getElementById('speakButton');

    if (speakButtonEl) {
      speakButtonEl.addEventListener('click', () => {
        if (activePair) {
          speakWord(activePair.word);
        }
      });
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

  async function loadPictoIndex() {
    const response = await fetch(PICTO_INDEX_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  function revealGameContainer() {
    const container = document.getElementById('gameContainer');
    if (container) {
      container.style.display = 'flex';
    }
  }

  function startGame(pictoIndex) {
    const options = window.sessionHelpers && typeof window.sessionHelpers.getCurrentGameOptions === 'function'
      ? window.sessionHelpers.getCurrentGameOptions(readingSession) || {}
      : {};

    totalRounds = clampNumber(parseInt(options.roundCount, 10), 1, 10, 4);
    choiceCount = clampNumber(parseInt(options.choiceCount, 10), 2, 4, 3);

    availablePairs = buildWordImagePairs(pictoIndex);
    if (availablePairs.length < 2) {
      setStatusMessage('Aucun mot illustré disponible pour ce thème.', 'error');
      disableSpeakButton();
      return;
    }

    choiceCount = Math.min(Math.max(choiceCount, 2), availablePairs.length);

    roundPairs = selectRoundPairs(availablePairs, totalRounds);
    totalRounds = roundPairs.length;
    currentRoundIndex = 0;

    if (totalRounds === 0) {
      setStatusMessage('Aucun mot illustré disponible pour cette activité.', 'error');
      disableSpeakButton();
      return;
    }

    presentRound(roundPairs[currentRoundIndex]);
  }

  function clampNumber(value, min, max, fallback) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(Math.max(value, min), max);
  }

  function buildWordImagePairs(pictoIndex) {
    const pairs = [];
    const themePairs = buildThemePairs();
    pairs.push(...themePairs);

    if (pairs.length < 8 && pictoIndex && pictoIndex.categories) {
      const fallback = buildPictoPairsFromIndex(pictoIndex, 12);
      pairs.push(...fallback);
    }

    const uniquePairs = deduplicatePairs(pairs);
    return shuffleArray(uniquePairs);
  }

  function buildThemePairs() {
    const pairs = [];
    const words = Array.isArray(themeData.words) ? themeData.words : [];
    const images = Array.isArray(themeData.transparentPNGs) ? themeData.transparentPNGs : [];
    const count = Math.min(words.length, images.length);
    for (let index = 0; index < count; index += 1) {
      const word = sanitizeWord(words[index]);
      const image = images[index];
      if (!word || !image) {
        continue;
      }
      pairs.push({
        word,
        image,
        alt: word,
        categoryId: 'theme'
      });
    }
    return pairs;
  }

  function buildPictoPairsFromIndex(pictoIndex, maxItems) {
    const basePath = typeof pictoIndex.base === 'string' ? pictoIndex.base : '../../images/pictos/';
    const pool = [];
    Object.keys(pictoIndex.categories || {}).forEach((categoryId) => {
      const category = pictoIndex.categories[categoryId];
      if (!category || !Array.isArray(category.items)) {
        return;
      }
      category.items.forEach((item) => {
        const label = item && item.label && item.label.fr;
        const file = item && item.file;
        if (!label || !file) {
          return;
        }
        const article = typeof label.article === 'string' ? `${label.article} `.trim() : '';
        const word = typeof label.word === 'string' ? label.word.trim() : '';
        const combined = sanitizeWord(`${article}${word}`);
        if (!combined) {
          return;
        }
        pool.push({
          word: combined,
          image: `${basePath}${file}`,
          alt: combined,
          categoryId: categoryId
        });
      });
    });
    const shuffled = shuffleArray(pool);
    return shuffled.slice(0, maxItems);
  }

  function deduplicatePairs(pairs) {
    const seen = new Set();
    const result = [];
    pairs.forEach((pair) => {
      const key = `${pair.word.toLowerCase()}|${pair.image}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(pair);
      }
    });
    return result;
  }

  function sanitizeWord(rawWord) {
    if (typeof rawWord !== 'string') {
      return '';
    }
    return rawWord.replace(/\s+/g, ' ').trim();
  }

  function shuffleArray(items) {
    const array = items.slice();
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function selectRoundPairs(pairs, desiredCount) {
    if (!Array.isArray(pairs) || pairs.length === 0) {
      return [];
    }
    const shuffled = pairs.slice();
    return shuffled.slice(0, Math.min(desiredCount, shuffled.length));
  }

  function presentRound(pair) {
    if (!pair) {
      return;
    }

    activePair = pair;
    updateRoundCounter();
    updateCurrentWord(pair.word);
    setStatusMessage('Choisis l’image qui correspond au mot.', '');
    renderChoices(pair);
    speakWord(pair.word, true);
  }

  function updateRoundCounter() {
    if (!roundCounterEl) {
      return;
    }
    const humanIndex = currentRoundIndex + 1;
    roundCounterEl.textContent = `Essai ${humanIndex} sur ${totalRounds}`;
  }

  function updateCurrentWord(word) {
    if (currentWordEl) {
      currentWordEl.textContent = word ? word.toUpperCase() : '';
    }
  }

  function renderChoices(targetPair) {
    if (!choicesGridEl) {
      return;
    }
    choicesGridEl.innerHTML = '';

    const distractors = pickDistractors(targetPair, choiceCount - 1);
    const options = shuffleArray([targetPair, ...distractors]);

    options.forEach((option) => {
      const button = document.createElement('button');
      button.className = 'choice-card';
      button.type = 'button';
      button.dataset.word = option.word;
      button.setAttribute('aria-label', option.word);

      const image = document.createElement('img');
      image.src = option.image;
      image.alt = option.alt || option.word;
      image.draggable = false;
      button.appendChild(image);

      const label = document.createElement('span');
      label.textContent = option.word;
      button.appendChild(label);

      button.addEventListener('click', () => handleChoiceSelection(button, option.word === targetPair.word));
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleChoiceSelection(button, option.word === targetPair.word);
        }
      });

      choicesGridEl.appendChild(button);
    });
  }

  function pickDistractors(targetPair, count) {
    if (count <= 0) {
      return [];
    }
    const pool = availablePairs.filter((pair) => pair.word !== targetPair.word);
    return sampleArray(pool, count);
  }

  function sampleArray(items, count) {
    const pool = items.slice();
    const result = [];
    const max = Math.min(count, pool.length);
    for (let index = 0; index < max; index += 1) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const [selected] = pool.splice(randomIndex, 1);
      result.push(selected);
    }
    return result;
  }

  function handleChoiceSelection(button, isCorrect) {
    if (!button || button.classList.contains('correct') || button.classList.contains('incorrect')) {
      return;
    }

    if (isCorrect) {
      markChoiceAsCorrect(button);
      advanceAfterDelay();
    } else {
      markChoiceAsIncorrect(button);
    }
  }

  function markChoiceAsCorrect(button) {
    Array.from(choicesGridEl.querySelectorAll('.choice-card')).forEach((card) => {
      card.disabled = true;
    });
    button.classList.add('correct');
    setStatusMessage('Bravo !', 'success');
    playSuccess();
  }

  function markChoiceAsIncorrect(button) {
    button.classList.add('incorrect');
    setStatusMessage('Essaie encore.', 'error');
    playError();
    setTimeout(() => {
      button.classList.remove('incorrect');
    }, 700);
  }

  function advanceAfterDelay() {
    setTimeout(() => {
      currentRoundIndex += 1;
      if (currentRoundIndex >= totalRounds) {
        finishActivity();
      } else {
        presentRound(roundPairs[currentRoundIndex]);
      }
    }, 900);
  }

  function finishActivity() {
    setStatusMessage('Super travail !', 'success');
    if (reinforcerController && typeof reinforcerController.show === 'function') {
      reinforcerController.show();
    } else if (window.sessionHelpers && typeof window.sessionHelpers.advanceToNextGame === 'function') {
      window.sessionHelpers.advanceToNextGame();
    }
  }

  function setStatusMessage(message, tone) {
    if (!statusMessageEl) {
      return;
    }
    statusMessageEl.textContent = message || '';
    statusMessageEl.classList.remove('success', 'error');
    if (tone === 'success') {
      statusMessageEl.classList.add('success');
    } else if (tone === 'error') {
      statusMessageEl.classList.add('error');
    }
  }

  function playSuccess() {
    if (successAudio) {
      successAudio.currentTime = 0;
      successAudio.play().catch((error) => console.warn('Success sound blocked:', error));
    }
  }

  function playError() {
    if (errorAudio) {
      errorAudio.currentTime = 0;
      errorAudio.play().catch((error) => console.warn('Error sound blocked:', error));
    }
  }

  function disableSpeakButton() {
    if (speakButtonEl) {
      speakButtonEl.disabled = true;
    }
  }

  function setupSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
      disableSpeakButton();
      return;
    }

    const populateVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) {
        return;
      }
      speechVoice = selectFrenchVoice(voices);
      if (!speechVoice) {
        speechVoice = voices[0];
      }
    };

    populateVoice();
    window.speechSynthesis.onvoiceschanged = populateVoice;
  }

  function selectFrenchVoice(voices) {
    return voices.find((voice) => /fr(-|_|$)/i.test(voice.lang)) || null;
  }

  function speakWord(word, auto = false) {
    if (!word || !('speechSynthesis' in window)) {
      if (!auto) {
        playSuccess();
      }
      return;
    }
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = speechVoice && speechVoice.lang ? speechVoice.lang : 'fr-FR';
    if (speechVoice) {
      utterance.voice = speechVoice;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
})();
