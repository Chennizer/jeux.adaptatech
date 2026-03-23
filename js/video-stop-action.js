document.addEventListener('DOMContentLoaded', () => {
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
    },
    punch: {
      fr: 'Coup de poing',
      en: 'Punch',
      ja: 'パンチ'
    },
    block: {
      fr: 'Bloque',
      en: 'Block',
      ja: 'ガード'
    },
    climb: {
      fr: 'Grimpe',
      en: 'Climb',
      ja: 'のぼる'
    },
    run: {
      fr: 'Cours',
      en: 'Run',
      ja: 'はしる'
    },
    land: {
      fr: 'Atterris',
      en: 'Land',
      ja: 'ちゃくち'
    },
    neutral: {
      fr: 'Position neutre',
      en: 'Neutral pose',
      ja: 'ニュートラル'
    }
  };

  const ACTION_IMAGES = {
    jump: '../../images/gaminganimation/jump.png',
    dodge: '../../images/gaminganimation/dodge.png',
    crouch: '../../images/gaminganimation/crouch.png',
    kick: '../../images/gaminganimation/kick.png',
    punch: '../../images/gaminganimation/punch.png',
    block: '../../images/gaminganimation/block.png',
    climb: '../../images/gaminganimation/climb.png',
    run: '../../images/gaminganimation/run.png',
    land: '../../images/gaminganimation/land.png',
    neutral: '../../images/gaminganimation/neutral.png'
  };

  const STATUS_COPY = {
    loading: {
      fr: 'Chargement du jeu...',
      en: 'Loading game...',
      ja: 'ゲームを読み込み中...'
    },
    ready: {
      fr: 'Jeu prêt',
      en: 'Game ready',
      ja: 'ゲームの準備完了'
    },
    unavailable: {
      fr: 'Vidéo indisponible',
      en: 'Video unavailable',
      ja: '動画を読み込めません'
    }
  };

  const controlPanel = document.getElementById('control-panel');
  const startButton = document.getElementById('control-panel-start-button');
  const loadingBarContainer = document.getElementById('control-panel-loading-bar-container');
  const loadingBar = document.getElementById('control-panel-loading-bar');
  const videoContainer = document.getElementById('video-container');
  const videoPlayer = document.getElementById('video-player');
  const overlayScreen = document.getElementById('overlay-screen');
  const actionPromptImage = document.getElementById('action-prompt-image');
  const actionPromptLabel = document.getElementById('action-prompt-label');
  const resultsScreen = document.getElementById('results-screen');
  const resultsSummary = document.getElementById('results-summary');
  const continueButton = document.getElementById('continue-button');
  const languageToggle = document.getElementById('language-toggle');

  const videoSource = document.body.getAttribute('data-video-source') || '';
  const actionEvents = parseActionEvents(document.body.getAttribute('data-action-events'));
  const promptSoundSrc = document.body.getAttribute('data-prompt-sound') || '../../sounds/pageturn.mp3';
  const successSoundSrc = document.body.getAttribute('data-success-sound') || '../../sounds/success3.mp3';
  const zoomTransitionMs = 180;

  let currentEventIndex = 0;
  let awaitingResume = false;
  let activeActionKey = null;
  let mediaReady = false;
  let mediaProgress = 0;
  let gameStarted = false;
  let currentStatusKey = 'loading';
  let isTransitioning = false;

  const promptAudio = createUiAudio(promptSoundSrc);
  const successAudio = createUiAudio(successSoundSrc);

  if (videoPlayer && videoSource) {
    videoPlayer.src = videoSource;
    videoPlayer.load();
  }

  function createUiAudio(source) {
    if (!source) {
      return null;
    }

    const audio = new Audio(source);
    audio.preload = 'auto';
    return audio;
  }

  function playUiSound(audio) {
    if (!audio) {
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (error) {
      // no-op
    }
  }

  function primeUiAudio() {
    [promptAudio, successAudio].forEach((audio) => {
      if (!audio) {
        return;
      }

      try {
        audio.volume = 0;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1;
          }).catch(() => {
            audio.volume = 1;
          });
        } else {
          audio.volume = 1;
        }
      } catch (error) {
        audio.volume = 1;
      }
    });
  }

  function parseActionEvents(rawValue) {
    if (!rawValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawValue);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((item) => ({
          time: Number(item.time),
          action: typeof item.action === 'string' ? item.action : ''
        }))
        .filter((item) => Number.isFinite(item.time) && item.action)
        .sort((left, right) => left.time - right.time);
    } catch (error) {
      return [];
    }
  }

  function getCurrentLanguage() {
    const lang = document.documentElement.lang || localStorage.getItem('siteLanguage') || 'en';
    return ['fr', 'en', 'ja'].includes(lang) ? lang : 'en';
  }

  function getActionLabel(actionKey) {
    const actionCopy = ACTION_COPY[actionKey] || ACTION_COPY.neutral;
    const lang = getCurrentLanguage();
    return actionCopy[lang] || actionCopy.en;
  }

  function getActionImage(actionKey) {
    return ACTION_IMAGES[actionKey] || ACTION_IMAGES.neutral;
  }

  function getStatusLabel(statusKey) {
    const lang = getCurrentLanguage();
    const statusCopy = STATUS_COPY[statusKey] || STATUS_COPY.loading;
    return statusCopy[lang] || statusCopy.en;
  }

  function setMediaReadyState(isReady, progress, statusKey) {
    mediaReady = Boolean(isReady);
    mediaProgress = Math.max(0, Math.min(100, Number(progress) || 0));
    currentStatusKey = statusKey || currentStatusKey || 'loading';

    if (loadingBar) {
      loadingBar.style.width = mediaProgress + '%';
    }

    if (loadingBarContainer) {
      loadingBarContainer.dataset.status = getStatusLabel(currentStatusKey);
      loadingBarContainer.classList.toggle('is-ready', mediaReady);
    }

    if (startButton) {
      startButton.disabled = !mediaReady;
      startButton.setAttribute('aria-disabled', mediaReady ? 'false' : 'true');
      startButton.classList.toggle('is-disabled', !mediaReady);
    }
  }

  function refreshMediaLoadingState() {
    if (!videoPlayer) {
      return;
    }

    let progress = mediaProgress;
    const duration = videoPlayer.duration;
    const hasBuffered = videoPlayer.buffered && videoPlayer.buffered.length > 0;

    if (hasBuffered && Number.isFinite(duration) && duration > 0) {
      const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
      progress = Math.max(progress, Math.min(100, (bufferedEnd / duration) * 100));
    } else if (videoPlayer.readyState >= 3) {
      progress = Math.max(progress, 85);
    } else if (videoPlayer.readyState >= 1) {
      progress = Math.max(progress, 20);
    }

    const ready = videoPlayer.readyState >= 4 || progress >= 100;
    setMediaReadyState(ready, ready ? 100 : progress, ready ? 'ready' : 'loading');
  }

  function playZoomTransition(zoomIn) {
    if (!videoPlayer) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) {
          return;
        }

        settled = true;
        videoPlayer.removeEventListener('transitionend', handleTransitionEnd);
        clearTimeout(timeoutId);
        resolve();
      };

      const handleTransitionEnd = (event) => {
        if (event.target === videoPlayer && event.propertyName === 'transform') {
          finish();
        }
      };

      const timeoutId = window.setTimeout(finish, zoomTransitionMs + 60);
      videoPlayer.addEventListener('transitionend', handleTransitionEnd);
      videoPlayer.classList.toggle('is-paused-zoom', zoomIn);
    });
  }

  function updatePromptLanguage() {
    if (!actionPromptLabel || !actionPromptImage || !activeActionKey) {
      if (loadingBarContainer) {
        loadingBarContainer.dataset.status = getStatusLabel(currentStatusKey);
      }
      updateResultsSummary();
      return;
    }

    if (loadingBarContainer) {
      loadingBarContainer.dataset.status = getStatusLabel(currentStatusKey);
    }

    const label = getActionLabel(activeActionKey);
    actionPromptLabel.textContent = label;
    actionPromptImage.alt = label;
    updateResultsSummary();
  }

  function showActionPrompt(eventConfig) {
    if (!overlayScreen || !actionPromptImage || !actionPromptLabel) {
      return;
    }

    activeActionKey = eventConfig.action;
    awaitingResume = true;

    actionPromptImage.src = getActionImage(eventConfig.action);
    updatePromptLanguage();

    overlayScreen.classList.remove('hidden');
    overlayScreen.classList.add('show');
    playUiSound(promptAudio);
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

  function updateResultsSummary() {
    if (!resultsSummary) {
      return;
    }

    const count = actionEvents.length;
    const lang = getCurrentLanguage();
    const copy = {
      fr: `Tu as complété ${count} actions dynamiques.`,
      en: `You completed ${count} dynamic action prompts.`,
      ja: `${count}回のアクション指示を完了しました。`
    };

    resultsSummary.textContent = copy[lang] || copy.en;
  }

  async function resumeGame() {
    if (!videoPlayer || !awaitingResume || isTransitioning) {
      return;
    }

    hideActionPrompt();
    playUiSound(successAudio);
    isTransitioning = true;
    await playZoomTransition(false);
    isTransitioning = false;
    videoPlayer.play().catch(() => {});
  }

  function finishGame() {
    gameStarted = false;
    hideActionPrompt();
    updateResultsSummary();
    videoPlayer?.classList.remove('is-paused-zoom');

    if (videoContainer) {
      videoContainer.classList.add('hidden');
      videoContainer.style.display = 'none';
    }

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
    gameStarted = false;

    hideActionPrompt();
    isTransitioning = false;
    videoPlayer?.classList.remove('is-paused-zoom');

    if (resultsScreen) {
      resultsScreen.classList.remove('show');
      resultsScreen.classList.add('hidden');
      resultsScreen.style.display = 'none';
    }

    if (videoPlayer) {
      videoPlayer.pause();
      videoPlayer.currentTime = 0;
    }
  }

  function startGame() {
    if (!videoPlayer || !mediaReady || actionEvents.length === 0) {
      return;
    }

    resetGameState();
    gameStarted = true;
    primeUiAudio();

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
    if (!videoPlayer || !gameStarted || awaitingResume || isTransitioning) {
      return;
    }

    const nextEvent = actionEvents[currentEventIndex];
    if (!nextEvent) {
      return;
    }

    if (videoPlayer.currentTime + 0.05 >= nextEvent.time) {
      videoPlayer.pause();
      currentEventIndex += 1;
      isTransitioning = true;
      playZoomTransition(true).then(() => {
        showActionPrompt(nextEvent);
        isTransitioning = false;
      });
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

    if (isTransitioning) {
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
  videoPlayer?.addEventListener('play', () => {
    if (!awaitingResume && !isTransitioning) {
      videoPlayer.classList.remove('is-paused-zoom');
    }
  });
  videoPlayer?.addEventListener('loadstart', refreshMediaLoadingState);
  videoPlayer?.addEventListener('loadedmetadata', refreshMediaLoadingState);
  videoPlayer?.addEventListener('loadeddata', refreshMediaLoadingState);
  videoPlayer?.addEventListener('progress', refreshMediaLoadingState);
  videoPlayer?.addEventListener('canplay', refreshMediaLoadingState);
  videoPlayer?.addEventListener('canplaythrough', refreshMediaLoadingState);
  videoPlayer?.addEventListener('error', () => setMediaReadyState(false, mediaProgress, 'unavailable'));

  const languageObserver = new MutationObserver(updatePromptLanguage);
  languageObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });

  setMediaReadyState(false, 8, 'loading');
  refreshMediaLoadingState();
  updateResultsSummary();
});
