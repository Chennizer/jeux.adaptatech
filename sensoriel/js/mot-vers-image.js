(function () {
  'use strict';

const DEFAULT_ERROR_SOUND = '../sounds/error.mp3';
const DEFAULT_SUCCESS_SOUND = '../sounds/success3.mp3';

  let readingSession = null;
  let themeData = {};
  let reinforcerController = null;
  let successAudio = null;
  let errorAudio = null;

  let currentWordEl = null;
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

  function initializeGame() {
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

    if (window.sessionHelpers && typeof window.sessionHelpers.showActivityOverlay === 'function') {
      window.sessionHelpers.showActivityOverlay(() => {
        revealGameContainer();
        startGame();
      }, readingSession);
    } else {
      revealGameContainer();
      startGame();
    }
  }

  function captureDomElements() {
    currentWordEl = document.getElementById('currentWord');
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

  function revealGameContainer() {
    const container = document.getElementById('gameContainer');
    if (container) {
      container.style.display = 'flex';
    }
  }

  function startGame() {
    const options = window.sessionHelpers && typeof window.sessionHelpers.getCurrentGameOptions === 'function'
      ? window.sessionHelpers.getCurrentGameOptions(readingSession) || {}
      : {};

    totalRounds = clampNumber(parseInt(options.roundCount, 10), 1, 10, 4);
    choiceCount = clampNumber(parseInt(options.choiceCount, 10), 2, 4, 3);

    availablePairs = buildWordImagePairs();
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

  function buildWordImagePairs() {
    const themePairs = buildThemePairs();
    const uniquePairs = deduplicatePairs(themePairs);
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
    updateCurrentWord(pair.word);
    setStatusMessage('', '');
    renderChoices(pair);
    speakWord(pair.word, true);
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

      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'choice-card__image';

      const image = document.createElement('img');
      image.src = option.image;
      image.alt = option.alt || option.word;
      image.draggable = false;
      imageWrapper.appendChild(image);

      button.appendChild(imageWrapper);

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
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(word);
    const voiceLang = speechVoice && speechVoice.lang ? speechVoice.lang : 'fr-CA';
    utterance.lang = voiceLang;
    if (speechVoice) {
      utterance.voice = speechVoice;
    }
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    const speakQueuedUtterance = () => synth.speak(utterance);

    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    Promise.resolve().then(speakQueuedUtterance);
  }
})();
