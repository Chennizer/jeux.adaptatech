document.addEventListener('DOMContentLoaded', () => {
  const ACTION_EVENTS = [
    { time: 5.0, action: 'jump' },
    { time: 10.0, action: 'dodge' },
    { time: 15.0, action: 'crouch' },
    { time: 20.2, action: 'jump' },
    { time: 25.5, action: 'crouch' },
    { time: 30.4, action: 'kick' },
    { time: 36.3, action: 'jump' }
  ];

  const ACTION_COPY = {
    jump: {
      fr: 'Saute',
      en: 'Jump',
      ja: 'ジャンプ'
    },
    dodge: {
      fr: 'Esquive',
      en: 'Dodge',
      ja: 'よける'
    },
    crouch: {
      fr: 'Accroupis-toi',
      en: 'Crouch',
      ja: 'しゃがむ'
    },
    kick: {
      fr: 'Coup de pied',
      en: 'Kick',
      ja: 'キック'
    }
  };

  const ACTION_IMAGES = {
    jump: '../../images/gaminganimation/jump.png',
    dodge: '../../images/gaminganimation/dodge.png',
    crouch: '../../images/gaminganimation/crouch.png',
    kick: '../../images/gaminganimation/kick.png'
  };

  const body = document.body;
  const controlPanel = document.getElementById('control-panel');
  const startButton = document.getElementById('control-panel-start-button');
  const videoContainer = document.getElementById('video-container');
  const videoPlayer = document.getElementById('video-player');
  const overlayScreen = document.getElementById('overlay-screen');
  const actionPromptImage = document.getElementById('action-prompt-image');
  const actionPromptLabel = document.getElementById('action-prompt-label');
  const resultsScreen = document.getElementById('results-screen');
  const resultsSummary = document.getElementById('results-summary');
  const continueButton = document.getElementById('continue-button');
  const languageToggle = document.getElementById('language-toggle');
  const downloadVideoButton = document.getElementById('download-video-button');

  let currentEventIndex = 0;
  let awaitingResume = false;
  let activeActionKey = null;
  let mediaReady = false;
  let gameStarted = false;
  let pausedAtTime = 0;

  const videoSource = body.getAttribute('data-video-source') || '';
  if (downloadVideoButton && videoSource) {
    downloadVideoButton.href = videoSource;
  }
  if (videoPlayer && videoSource) {
    videoPlayer.src = videoSource;
    videoPlayer.load();
  }

  function getCurrentLanguage() {
    const lang = document.documentElement.lang || localStorage.getItem('siteLanguage') || 'en';
    if (lang === 'fr' || lang === 'ja' || lang === 'en') {
      return lang;
    }
    return 'en';
  }

  function getActionLabel(actionKey) {
    const copy = ACTION_COPY[actionKey] || ACTION_COPY.jump;
    const lang = getCurrentLanguage();
    return copy[lang] || copy.en;
  }

  function setStartReadyState(isReady) {
    mediaReady = isReady;
    if (!startButton) {
      return;
    }

    startButton.disabled = !isReady;
    startButton.setAttribute('aria-disabled', isReady ? 'false' : 'true');
    startButton.classList.toggle('is-disabled', !isReady);
  }

  function updateVisiblePromptLanguage() {
    if (awaitingResume && activeActionKey && actionPromptLabel && actionPromptImage) {
      const label = getActionLabel(activeActionKey);
      actionPromptLabel.textContent = label;
      actionPromptImage.alt = label;
    }

    updateResultsSummary();
  }

  function showActionPrompt(eventConfig) {
    if (!overlayScreen || !actionPromptImage || !actionPromptLabel) {
      return;
    }

    activeActionKey = eventConfig.action;
    awaitingResume = true;
    pausedAtTime = eventConfig.time;

    actionPromptImage.src = ACTION_IMAGES[eventConfig.action] || ACTION_IMAGES.jump;
    updateVisiblePromptLanguage();

    overlayScreen.classList.remove('hidden');
    overlayScreen.classList.add('show');
  }

  function hideActionPrompt() {
    awaitingResume = false;
    activeActionKey = null;

    if (!overlayScreen) {
      return;
    }

    overlayScreen.classList.remove('show');
    overlayScreen.classList.add('hidden');
  }

  function resumeGame() {
    if (!awaitingResume || !videoPlayer) {
      return;
    }

    hideActionPrompt();

    if (pausedAtTime) {
      videoPlayer.currentTime = pausedAtTime;
    }

    videoPlayer.play().catch(() => {});
  }

  function updateResultsSummary() {
    if (!resultsSummary) {
      return;
    }

    const lang = getCurrentLanguage();
    const completedCount = ACTION_EVENTS.length;
    const summaries = {
      fr: `Tu as complété ${completedCount} actions dynamiques.`,
      en: `You completed ${completedCount} dynamic action prompts.`,
      ja: `${completedCount}回のアクション指示を完了しました。`
    };

    resultsSummary.textContent = summaries[lang] || summaries.en;
  }

  function finishGame() {
    gameStarted = false;
    awaitingResume = false;
    activeActionKey = null;

    if (videoContainer) {
      videoContainer.classList.add('hidden');
      videoContainer.style.display = 'none';
    }

    hideActionPrompt();
    updateResultsSummary();

    if (resultsScreen) {
      resultsScreen.classList.remove('hidden');
      resultsScreen.classList.add('show');
      resultsScreen.style.display = 'flex';
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    if (languageToggle) {
      languageToggle.style.display = 'inline-flex';
    }
  }

  function resetGameState() {
    currentEventIndex = 0;
    awaitingResume = false;
    activeActionKey = null;
    pausedAtTime = 0;
    gameStarted = false;

    if (resultsScreen) {
      resultsScreen.classList.remove('show');
      resultsScreen.classList.add('hidden');
      resultsScreen.style.display = 'none';
    }

    hideActionPrompt();

    if (videoPlayer) {
      videoPlayer.pause();
      videoPlayer.currentTime = 0;
    }
  }

  function startGame() {
    if (!videoPlayer || !mediaReady) {
      return;
    }

    resetGameState();
    gameStarted = true;

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

    const requestFullscreen = document.documentElement.requestFullscreen
      || document.documentElement.webkitRequestFullscreen
      || document.documentElement.msRequestFullscreen;

    if (requestFullscreen) {
      try {
        requestFullscreen.call(document.documentElement);
      } catch (error) {
        // no-op
      }
    }

    videoPlayer.currentTime = 0;
    videoPlayer.play().catch(() => {});
  }

  function restartToMenu() {
    resetGameState();

    if (controlPanel) {
      controlPanel.style.display = 'flex';
    }

    if (languageToggle) {
      languageToggle.style.display = 'inline-flex';
    }
  }

  function handleTimeUpdate() {
    if (!videoPlayer || awaitingResume || !gameStarted) {
      return;
    }

    const nextEvent = ACTION_EVENTS[currentEventIndex];
    if (!nextEvent) {
      return;
    }

    if (videoPlayer.currentTime + 0.05 >= nextEvent.time) {
      videoPlayer.pause();
      showActionPrompt(nextEvent);
      currentEventIndex += 1;
    }
  }

  function handleActivate(event) {
    const isKeyboard = event.type === 'keydown';
    const acceptedKeyboard = isKeyboard && (event.code === 'Space' || event.code === 'Enter');
    const acceptedPointer = event.type === 'pointerup';

    if (!acceptedKeyboard && !acceptedPointer) {
      return;
    }

    if (acceptedKeyboard) {
      event.preventDefault();
    }

    if (awaitingResume) {
      resumeGame();
      return;
    }

    if (!gameStarted && acceptedKeyboard && event.code === 'Enter' && mediaReady) {
      startGame();
    }
  }

  if (startButton) {
    startButton.addEventListener('click', startGame);
  }

  if (continueButton) {
    continueButton.addEventListener('click', restartToMenu);
  }

  if (overlayScreen) {
    overlayScreen.addEventListener('pointerup', handleActivate);
  }

  document.addEventListener('keydown', handleActivate, true);
  videoPlayer?.addEventListener('timeupdate', handleTimeUpdate);
  videoPlayer?.addEventListener('ended', finishGame);
  videoPlayer?.addEventListener('canplay', () => setStartReadyState(true), { once: true });
  videoPlayer?.addEventListener('canplaythrough', () => setStartReadyState(true), { once: true });
  videoPlayer?.addEventListener('loadeddata', () => setStartReadyState(true), { once: true });
  videoPlayer?.addEventListener('error', () => setStartReadyState(true), { once: true });

  const languageObserver = new MutationObserver(updateVisiblePromptLanguage);
  languageObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });

  setStartReadyState(videoPlayer ? videoPlayer.readyState >= 2 : true);
  updateVisiblePromptLanguage();
});
