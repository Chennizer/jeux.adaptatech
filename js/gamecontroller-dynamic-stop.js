document.addEventListener('DOMContentLoaded', () => {
  const config = window.dynamicStopActionConfig || {};
  const pauseEvents = Array.isArray(config.pauseEvents) ? config.pauseEvents.slice().sort((a, b) => a.time - b.time) : [];
  const actionPrompts = config.actionPrompts || {};
  const pauseSoundSrc = config.pauseSoundSrc || '';

  const startButton = document.getElementById('control-panel-start-button');
  const downloadButton = document.getElementById('control-panel-download-button');
  const languageToggle = document.getElementById('language-toggle');
  const controlPanel = document.getElementById('control-panel');
  const loadingBarContainer = document.getElementById('control-panel-loading-bar-container');
  const loadingBar = document.getElementById('control-panel-loading-bar');
  const overlayScreen = document.getElementById('overlay-screen');
  const promptImage = document.getElementById('dynamic-prompt-image');
  const promptText = document.getElementById('dynamic-prompt-text');
  const videoContainer = document.getElementById('video-container');
  const mediaPlayer = document.getElementById('video-player');
  const videoSource = document.body.getAttribute('data-video-source') || '';
  const resultsScreen = document.getElementById('results-screen');
  const completedPrompts = document.getElementById('completed-prompts');
  const wrongPresses = document.getElementById('wrong-presses');
  const continueButton = document.getElementById('continue-button');

  let mediaReady = false;
  let currentEventIndex = 0;
  let pausedEvent = null;
  let allowResumeInput = false;
  let inputLocked = false;
  let sessionStarted = false;
  let wrongPressCount = 0;
  let completedCount = 0;
  let keyPressed = false;
  let pauseSound = null;

  if (mediaPlayer && videoSource) {
    mediaPlayer.src = videoSource;
  }

  if (downloadButton && videoSource) {
    downloadButton.href = videoSource;
  }

  const getCurrentLanguage = () => {
    const lang = document.documentElement.lang || localStorage.getItem('siteLanguage') || 'en';
    return ['en', 'fr', 'ja'].includes(lang) ? lang : 'en';
  };

  function setMediaReadyState(ready, progress, statusText) {
    mediaReady = !!ready;
    const normalized = Math.max(0, Math.min(100, Number(progress) || 0));

    if (loadingBar) {
      loadingBar.style.width = normalized + '%';
    }

    if (loadingBarContainer) {
      loadingBarContainer.dataset.status = statusText || (ready ? 'Game ready' : 'Loading game...');
      loadingBarContainer.classList.toggle('is-ready', ready);
    }

    if (startButton) {
      startButton.disabled = !ready;
      startButton.setAttribute('aria-disabled', ready ? 'false' : 'true');
    }
  }

  function refreshMediaLoadingState() {
    if (!mediaPlayer) {
      setMediaReadyState(true, 100, 'Game ready');
      return;
    }

    let progress = 12;
    const duration = mediaPlayer.duration;
    if (mediaPlayer.buffered && mediaPlayer.buffered.length > 0 && Number.isFinite(duration) && duration > 0) {
      const bufferedEnd = mediaPlayer.buffered.end(mediaPlayer.buffered.length - 1);
      progress = Math.max(progress, Math.min(100, (bufferedEnd / duration) * 100));
    } else if (mediaPlayer.readyState >= 3) {
      progress = 92;
    } else if (mediaPlayer.readyState >= 1) {
      progress = 28;
    }

    const ready = mediaPlayer.readyState >= 4 || progress >= 100;
    setMediaReadyState(ready, ready ? 100 : progress, ready ? 'Game ready' : 'Loading game...');
  }

  function initializeLoading() {
    if (!mediaPlayer) {
      setMediaReadyState(true, 100, 'Game ready');
      return;
    }

    setMediaReadyState(false, 8, 'Loading game...');
    ['loadstart', 'loadedmetadata', 'loadeddata', 'progress', 'canplay', 'canplaythrough'].forEach((evt) => {
      mediaPlayer.addEventListener(evt, refreshMediaLoadingState);
    });
    mediaPlayer.addEventListener('error', () => setMediaReadyState(true, 100, 'Game ready'));
    mediaPlayer.preload = 'auto';
    try {
      mediaPlayer.load();
    } catch (error) {
      setMediaReadyState(true, 100, 'Game ready');
    }
    refreshMediaLoadingState();
  }

  function playPauseSound() {
    if (!config.defaultPauseSound || !pauseSoundSrc) {
      return;
    }
    if (!pauseSound) {
      pauseSound = new Audio(pauseSoundSrc);
    }
    pauseSound.currentTime = 0;
    pauseSound.volume = 0.7;
    pauseSound.play().catch(() => {});
  }

  function getPromptForAction(action) {
    const prompt = actionPrompts[action] || {};
    const lang = getCurrentLanguage();
    const textMap = prompt.text || {};
    return {
      image: prompt.image || '',
      text: textMap[lang] || textMap.en || action
    };
  }

  function showPrompt(eventConfig) {
    if (!overlayScreen || !promptImage || !promptText) {
      return;
    }

    const prompt = getPromptForAction(eventConfig.action);
    promptImage.src = prompt.image;
    promptImage.alt = prompt.text;
    promptText.textContent = prompt.text;

    overlayScreen.classList.add('show');
    overlayScreen.classList.remove('hidden');
    allowResumeInput = true;
    inputLocked = false;
    pausedEvent = eventConfig;
    playPauseSound();
  }

  function refreshPromptLanguage() {
    if (!pausedEvent || !promptImage || !promptText) {
      return;
    }
    const prompt = getPromptForAction(pausedEvent.action);
    promptImage.alt = prompt.text;
    promptText.textContent = prompt.text;
  }

  function hidePrompt() {
    if (!overlayScreen) {
      return;
    }
    overlayScreen.classList.remove('show');
    overlayScreen.classList.add('hidden');
    allowResumeInput = false;
    pausedEvent = null;
  }

  function resumePlayback() {
    if (!mediaPlayer || !pausedEvent) {
      return;
    }
    completedCount += 1;
    hidePrompt();
    mediaPlayer.currentTime = pausedEvent.time;
    mediaPlayer.play().catch(() => {});
  }

  function updateResultsText() {
    const lang = getCurrentLanguage();
    if (completedPrompts) {
      const labels = {
        en: `Completed prompts: ${completedCount} / ${pauseEvents.length}`,
        fr: `Actions complétées : ${completedCount} / ${pauseEvents.length}`,
        ja: `完了したアクション：${completedCount} / ${pauseEvents.length}`
      };
      completedPrompts.textContent = labels[lang] || labels.en;
    }
    if (wrongPresses) {
      const labels = {
        en: `Presses outside pauses: ${wrongPressCount}`,
        fr: `Appuis hors pause : ${wrongPressCount}`,
        ja: `停止以外での入力：${wrongPressCount}`
      };
      wrongPresses.textContent = labels[lang] || labels.en;
    }
  }

  function finishSession() {
    sessionStarted = false;
    hidePrompt();
    if (videoContainer) {
      videoContainer.classList.add('hidden');
      videoContainer.style.display = 'none';
    }
    if (languageToggle) {
      languageToggle.style.display = '';
    }
    if (resultsScreen) {
      updateResultsText();
      resultsScreen.style.display = 'flex';
      resultsScreen.classList.add('show');
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function resetSession() {
    currentEventIndex = 0;
    pausedEvent = null;
    allowResumeInput = false;
    inputLocked = false;
    wrongPressCount = 0;
    completedCount = 0;
    sessionStarted = false;

    if (resultsScreen) {
      resultsScreen.classList.remove('show');
      resultsScreen.style.display = 'none';
    }

    if (mediaPlayer) {
      mediaPlayer.pause();
      mediaPlayer.currentTime = 0;
    }

    if (controlPanel) {
      controlPanel.style.display = '';
    }
    if (languageToggle) {
      languageToggle.style.display = '';
    }
    hidePrompt();
    updateResultsText();
  }

  function handleTimeUpdate() {
    if (!mediaPlayer || !sessionStarted || pausedEvent) {
      return;
    }

    const nextEvent = pauseEvents[currentEventIndex];
    if (!nextEvent) {
      return;
    }

    if (mediaPlayer.currentTime >= nextEvent.time) {
      mediaPlayer.pause();
      currentEventIndex += 1;
      showPrompt(nextEvent);
    }
  }

  function startGame() {
    if (!mediaReady) {
      alert('The game is still loading. Please wait a moment.');
      return;
    }
    if (!pauseEvents.length) {
      alert('No stop events are configured for this game.');
      return;
    }

    resetSession();
    sessionStarted = true;

    const elem = document.documentElement;
    const goFull = elem.requestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen;
    if (goFull) {
      try {
        goFull.call(elem);
      } catch (error) {}
    }

    if (controlPanel) {
      controlPanel.style.display = 'none';
    }
    if (languageToggle) {
      languageToggle.style.display = 'none';
    }
    if (videoContainer) {
      videoContainer.classList.remove('hidden');
      videoContainer.style.display = 'block';
    }

    try {
      const audioPrimer = new Audio();
      audioPrimer.muted = true;
      audioPrimer.play().then(() => audioPrimer.pause()).catch(() => {});
    } catch (error) {}

    mediaPlayer.currentTime = 0;
    mediaPlayer.play().catch(() => {});
  }

  function tryResumeFromInput(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    if (inputLocked) {
      return;
    }

    if (allowResumeInput && pausedEvent) {
      inputLocked = true;
      resumePlayback();
      return;
    }

    if (sessionStarted) {
      wrongPressCount += 1;
      updateResultsText();
    }
  }

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || keyPressed) {
      return;
    }
    keyPressed = true;
    tryResumeFromInput(event);
  }, true);

  document.addEventListener('keyup', (event) => {
    if (event.code === 'Space') {
      keyPressed = false;
    }
  }, true);

  document.addEventListener('click', (event) => {
    if (!sessionStarted) {
      return;
    }
    if (overlayScreen && overlayScreen.contains(event.target)) {
      tryResumeFromInput(event);
    }
  }, true);

  document.addEventListener('touchstart', (event) => {
    if (!sessionStarted) {
      return;
    }
    if (overlayScreen && overlayScreen.contains(event.target)) {
      tryResumeFromInput(event);
    }
  }, { passive: false, capture: true });

  if (startButton) {
    startButton.addEventListener('click', startGame);
  }

  if (continueButton) {
    continueButton.addEventListener('click', resetSession);
  }

  if (languageToggle) {
    languageToggle.addEventListener('pointerup', () => {
      refreshPromptLanguage();
      updateResultsText();
    });
  }

  if (mediaPlayer) {
    mediaPlayer.addEventListener('timeupdate', handleTimeUpdate);
    mediaPlayer.addEventListener('ended', finishSession);
  }

  initializeLoading();
  updateResultsText();
});
