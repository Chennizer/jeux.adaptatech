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

  const MODE_DESCRIPTION_COPY = {
    normal: {
      fr: 'Profite du jeu et prends ton temps.',
      en: 'Enjoy the game and take your time.',
      ja: 'ゲームを楽しみながら、ゆっくり進めてください。'
    },
    hard: {
      fr: 'Mode difficile : texte explicatif à venir.',
      en: 'Hard mode: description coming soon.',
      ja: 'ハードモード：説明は近日追加予定です。'
    },
    competitive: {
      fr: 'Mode compétitif : texte explicatif à venir.',
      en: 'Competitive mode: description coming soon.',
      ja: '対戦モード：説明は近日追加予定です。'
    }
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
  const resultsScore = document.getElementById('results-score');
  const resultsAverageDelay = document.getElementById('results-average-delay');
  const resultsFalsePositives = document.getElementById('results-false-positives');
  const continueButton = document.getElementById('continue-button');
  const languageToggle = document.getElementById('language-toggle');
  const modeButtons = Array.from(document.querySelectorAll('.stop-action-mode-btn'));
  const modeDescription = document.getElementById('stop-action-mode-description');

  const videoSource = document.body.getAttribute('data-video-source') || '';
  const actionEvents = parseActionEvents(document.body.getAttribute('data-action-events'));
  const promptSoundSrc = document.body.getAttribute('data-prompt-sound') || '../../sounds/pageturn.mp3';
  const successSoundSrc = document.body.getAttribute('data-success-sound') || '../../sounds/success3.mp3';
  const hardTimeLimitMs = Math.max(2000, Number(document.body.getAttribute('data-hard-time-limit')) * 1000 || 10000);
  const hardShrinkDurationMs = Math.max(1000, Number(document.body.getAttribute('data-hard-shrink-duration')) * 1000 || 5000);
  const hardTimeoutSoundSrc = document.body.getAttribute('data-hard-timeout-sound') || '../../sounds/error.mp3';
  const hardRestartSoundSrc = document.body.getAttribute('data-hard-restart-sound') || '../../sounds/pagestart.mp3';
  const menuMusicSrc = document.body.getAttribute('data-menu-music') || '';
  const waitMusicSrc = document.body.getAttribute('data-wait-music') || '';
  const waitMusicDelayMs = Math.max(0, Number(document.body.getAttribute('data-wait-music-delay-ms')) || 500);
  const zoomTransitionMs = 180;
  const SCORE_MAX = 10000;
  const DELAY_WEIGHT = 9000;
  const FALSE_POSITIVE_WEIGHT = 1000;
  const DELAY_REFERENCE_MS = 3000;

  let currentEventIndex = 0;
  let awaitingResume = false;
  let activeActionKey = null;
  let mediaReady = false;
  let mediaProgress = 0;
  let gameStarted = false;
  let currentStatusKey = 'loading';
  let isTransitioning = false;
  let currentPromptShownAtMs = null;
  let responseDelaysMs = [];
  let falsePositiveCount = 0;
  let videoLoadProgress = 0;
  let videoLoadReady = false;
  let imageLoadProgress = 0;
  let imageLoadReady = false;
  let hardModePromptTimer = null;
  let hardModeNeedsRestart = false;
  let waitMusicStartTimer = null;
  let menuMusicAutoplayAttempts = 0;
  let menuMusicAutoplayTimer = null;
  let menuMusicStarted = false;

  const promptAudio = createUiAudio(promptSoundSrc);
  const successAudio = createUiAudio(successSoundSrc);
  const hardTimeoutAudio = createUiAudio(hardTimeoutSoundSrc);
  const hardRestartAudio = createUiAudio(hardRestartSoundSrc);
  const menuMusicAudio = createUiAudio(menuMusicSrc, { elementId: 'intro-jingle' });
  const waitMusicAudio = createUiAudio(waitMusicSrc);

  if (videoPlayer && videoSource) {
    videoPlayer.src = videoSource;
    videoPlayer.load();
  }

  function createUiAudio(source, options) {
    const config = options || {};
    const elementId = typeof config.elementId === 'string' ? config.elementId : '';

    if (elementId) {
      const elementAudio = document.getElementById(elementId);
      if (elementAudio && typeof elementAudio.play === 'function') {
        if (source && elementAudio.getAttribute('src') !== source) {
          elementAudio.setAttribute('src', source);
        }
        elementAudio.preload = 'auto';
        try {
          elementAudio.load();
        } catch (error) {
          // no-op
        }
        return elementAudio;
      }
    }

    if (!source) {
      return null;
    }

    const audio = new Audio(source);
    audio.preload = 'auto';
    try {
      audio.load();
    } catch (error) {
      // no-op
    }
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

  function playLoopAudio(audio, volume) {
    if (!audio) {
      return;
    }

    try {
      audio.loop = true;
      audio.volume = volume;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
          if (audio === menuMusicAudio) {
            menuMusicStarted = true;
            clearMenuMusicAutoplayTimer();
          }
        }).catch(() => {});
      }
    } catch (error) {
      // no-op
    }
  }

  function stopLoopAudio(audio) {
    if (!audio) {
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (error) {
      // no-op
    }
  }

  function clearWaitMusicStartTimer() {
    if (waitMusicStartTimer) {
      clearTimeout(waitMusicStartTimer);
      waitMusicStartTimer = null;
    }
  }

  function startWaitMusicWithDelay() {
    clearWaitMusicStartTimer();
    waitMusicStartTimer = setTimeout(() => {
      playLoopAudio(waitMusicAudio, 0.35);
      waitMusicStartTimer = null;
    }, waitMusicDelayMs);
  }

  function stopWaitMusic() {
    clearWaitMusicStartTimer();
    stopLoopAudio(waitMusicAudio);
  }

  function startMenuMusic() {
    if (controlPanel && controlPanel.style.display === 'none') {
      return;
    }

    playLoopAudio(menuMusicAudio, 0.3);
  }

  function clearMenuMusicAutoplayTimer() {
    if (!menuMusicAutoplayTimer) {
      return;
    }

    clearInterval(menuMusicAutoplayTimer);
    menuMusicAutoplayTimer = null;
  }

  function autoStartMenuMusicAfterLoad() {
    if (!menuMusicAudio) {
      return;
    }

    if (menuMusicStarted || !menuMusicAudio.paused) {
      menuMusicStarted = true;
      clearMenuMusicAutoplayTimer();
      return;
    }

    if (menuMusicAutoplayAttempts >= 30) {
      clearMenuMusicAutoplayTimer();
      return;
    }

    menuMusicAutoplayAttempts += 1;
    startMenuMusic();
  }

  function scheduleMenuMusicAutoplay() {
    if (!menuMusicAudio || menuMusicAutoplayTimer || menuMusicStarted) {
      return;
    }

    menuMusicAutoplayAttempts = 0;
    autoStartMenuMusicAfterLoad();
    menuMusicAutoplayTimer = window.setInterval(autoStartMenuMusicAfterLoad, 1200);
  }

  function stopMenuMusic() {
    stopLoopAudio(menuMusicAudio);
    menuMusicStarted = false;
  }

  function setSelectedMode(mode) {
    document.body.dataset.selectedMode = mode || 'normal';

    modeButtons.forEach((button) => {
      const isSelected = button.dataset.mode === document.body.dataset.selectedMode;
      button.classList.toggle('selected', isSelected);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });

    if (modeDescription) {
      const selected = document.body.dataset.selectedMode;
      const lang = getCurrentLanguage();
      const copy = MODE_DESCRIPTION_COPY[selected] || MODE_DESCRIPTION_COPY.normal;
      modeDescription.textContent = copy[lang] || copy.en;
    }
  }

  function isHardModeSelected() {
    return document.body.dataset.selectedMode === 'hard';
  }

  function clearHardModePromptTimer() {
    if (hardModePromptTimer) {
      clearTimeout(hardModePromptTimer);
      hardModePromptTimer = null;
    }

    actionPromptImage?.classList.remove('hard-mode-countdown');
    actionPromptLabel?.classList.remove('hard-mode-countdown');
  }

  function getTryAgainText() {
    const lang = getCurrentLanguage();
    const copy = {
      fr: 'Réessaie (appuie sur Espace)',
      en: 'Try again (press Space)',
      ja: 'もう一度（スペースキーを押す）'
    };
    return copy[lang] || copy.en;
  }

  function primeUiAudio() {
    [promptAudio, successAudio, hardTimeoutAudio, hardRestartAudio, menuMusicAudio, waitMusicAudio].forEach((audio) => {
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

  function getActionImageSourcesForPreload() {
    const sources = actionEvents
      .map((eventConfig) => getActionImage(eventConfig.action))
      .filter(Boolean);

    return Array.from(new Set(sources));
  }

  function updateCombinedLoadingState() {
    const combinedProgress = Math.round((videoLoadProgress * 0.7) + (imageLoadProgress * 0.3));
    const ready = videoLoadReady && imageLoadReady;
    setMediaReadyState(ready, ready ? 100 : combinedProgress, ready ? 'ready' : 'loading');
  }

  function preloadActionImages() {
    const imageSources = getActionImageSourcesForPreload();
    const total = imageSources.length;

    if (total === 0) {
      imageLoadProgress = 100;
      imageLoadReady = true;
      updateCombinedLoadingState();
      return;
    }

    let completed = 0;
    const markComplete = () => {
      completed += 1;
      imageLoadProgress = Math.round((completed / total) * 100);
      if (completed >= total) {
        imageLoadReady = true;
      }
      updateCombinedLoadingState();
    };

    imageSources.forEach((src) => {
      const img = new Image();
      img.onload = markComplete;
      img.onerror = markComplete;
      img.src = src;
    });
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

    if (mediaReady) {
      scheduleMenuMusicAutoplay();
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

    videoLoadProgress = Math.max(0, Math.min(100, progress));
    videoLoadReady = videoPlayer.readyState >= 4 || videoLoadProgress >= 100;
    if (videoLoadReady) {
      videoLoadProgress = 100;
    }

    updateCombinedLoadingState();
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

  function playFreezeEncounterAnimation() {
    if (!videoContainer) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) {
          return;
        }

        settled = true;
        videoContainer.removeEventListener('animationend', handleAnimationEnd);
        clearTimeout(timeoutId);
        resolve();
      };

      const handleAnimationEnd = (event) => {
        if (event.target === videoContainer && event.animationName === 'freezeEncounter') {
          finish();
        }
      };

      const timeoutId = window.setTimeout(finish, 1100);
      videoContainer.addEventListener('animationend', handleAnimationEnd);
      videoContainer.classList.remove('is-freeze-encounter');
      void videoContainer.offsetWidth;
      videoContainer.classList.add('is-freeze-encounter');
    });
  }

  function clearFreezeEncounterAnimation() {
    videoContainer?.classList.remove('is-freeze-encounter');
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
    actionPromptImage.classList.add('is-pulsing');
    actionPromptLabel.classList.add('is-pulsing');
    updatePromptLanguage();

    overlayScreen.classList.remove('hidden');
    overlayScreen.classList.add('show');
    currentPromptShownAtMs = Date.now();
    hardModeNeedsRestart = false;
    clearHardModePromptTimer();
    stopWaitMusic();

    if (isHardModeSelected()) {
      const shrinkStartDelayMs = Math.max(0, hardTimeLimitMs - hardShrinkDurationMs);
      const shrinkTimer = setTimeout(() => {
        if (!awaitingResume) {
          return;
        }

        actionPromptImage.classList.remove('is-pulsing');
        actionPromptLabel.classList.remove('is-pulsing');
        actionPromptImage.classList.add('hard-mode-countdown');
        actionPromptLabel.classList.add('hard-mode-countdown');
      }, shrinkStartDelayMs);

      hardModePromptTimer = setTimeout(() => {
        if (!awaitingResume) {
          return;
        }

        awaitingResume = false;
        currentPromptShownAtMs = null;
        hardModeNeedsRestart = true;
        clearTimeout(shrinkTimer);
        clearHardModePromptTimer();
        stopWaitMusic();
        actionPromptImage.classList.add('hidden');
        actionPromptLabel.textContent = getTryAgainText();
        actionPromptLabel.classList.remove('hard-mode-countdown');
        playUiSound(hardTimeoutAudio);
      }, hardTimeLimitMs);
    }

    playUiSound(promptAudio);
    startWaitMusicWithDelay();
  }

  function hideActionPrompt() {
    awaitingResume = false;
    activeActionKey = null;
    clearHardModePromptTimer();
    stopWaitMusic();

    if (actionPromptImage) {
      actionPromptImage.classList.remove('hidden');
      actionPromptImage.classList.remove('is-pulsing');
      actionPromptLabel?.classList.remove('is-pulsing');
    }

    if (!overlayScreen) {
      return;
    }

    overlayScreen.classList.remove('show');
    overlayScreen.classList.add('hidden');
  }

  function computeFinalScore(avgDelayMs, falsePositives, totalPrompts) {
    const normalizedDelay = Math.min(Math.max(avgDelayMs / DELAY_REFERENCE_MS, 0), 1);
    const delayScore = DELAY_WEIGHT * (1 - normalizedDelay);

    const denominator = Math.max(totalPrompts, 1);
    const falsePositiveRatio = Math.min(Math.max(falsePositives / denominator, 0), 1);
    const falsePositiveScore = FALSE_POSITIVE_WEIGHT * (1 - falsePositiveRatio);

    const total = delayScore + falsePositiveScore;
    return Math.max(0, Math.min(SCORE_MAX, Math.round(total)));
  }

  function formatDelayMs(ms) {
    return (ms / 1000).toFixed(2) + 's';
  }

  function updateResultsSummary() {
    const count = actionEvents.length;
    const lang = getCurrentLanguage();
    const avgDelayMs = responseDelaysMs.length
      ? responseDelaysMs.reduce((total, value) => total + value, 0) / responseDelaysMs.length
      : 0;
    const finalScore = computeFinalScore(avgDelayMs, falsePositiveCount, count);

    const copy = {
      fr: {
        scoreLabel: 'Score',
        scoreValue: `${finalScore}`,
        delay: `Délai moyen: ${formatDelayMs(avgDelayMs)}`,
        falsePositives: `Faux positifs: ${falsePositiveCount}`
      },
      en: {
        scoreLabel: 'Score',
        scoreValue: `${finalScore}`,
        delay: `Average delay: ${formatDelayMs(avgDelayMs)}`,
        falsePositives: `False positives: ${falsePositiveCount}`
      },
      ja: {
        scoreLabel: 'スコア',
        scoreValue: `${finalScore}`,
        delay: `平均遅延: ${formatDelayMs(avgDelayMs)}`,
        falsePositives: `誤反応: ${falsePositiveCount}`
      }
    };

    const localized = copy[lang] || copy.en;
    if (resultsScore) {
      resultsScore.innerHTML = `<span class="stop-action-score-label">${localized.scoreLabel}</span><span class="stop-action-score-value">${localized.scoreValue}</span>`;
    }
    if (resultsAverageDelay) resultsAverageDelay.textContent = localized.delay;
    if (resultsFalsePositives) resultsFalsePositives.textContent = localized.falsePositives;
  }

  async function resumeGame() {
    if (!videoPlayer || !awaitingResume || isTransitioning) {
      return;
    }

    if (currentPromptShownAtMs) {
      responseDelaysMs.push(Date.now() - currentPromptShownAtMs);
      currentPromptShownAtMs = null;
    }

    hideActionPrompt();
    playUiSound(successAudio);
    isTransitioning = true;
    await playZoomTransition(false);
    clearFreezeEncounterAnimation();
    isTransitioning = false;
    videoPlayer.play().catch(() => {});
  }

  function finishGame() {
    gameStarted = false;
    hideActionPrompt();
    updateResultsSummary();
    videoPlayer?.classList.remove('is-paused-zoom');
    clearFreezeEncounterAnimation();

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

    startMenuMusic();
  }

  function resetGameState() {
    currentEventIndex = 0;
    awaitingResume = false;
    activeActionKey = null;
    gameStarted = false;
    currentPromptShownAtMs = null;
    responseDelaysMs = [];
    falsePositiveCount = 0;
    hardModeNeedsRestart = false;

    hideActionPrompt();
    isTransitioning = false;
    videoPlayer?.classList.remove('is-paused-zoom');
    clearFreezeEncounterAnimation();

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
    stopMenuMusic();
    clearMenuMusicAutoplayTimer();

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

    startMenuMusic();
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
        playFreezeEncounterAnimation().then(() => {
          showActionPrompt(nextEvent);
          isTransitioning = false;
        });
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

    if (hardModeNeedsRestart) {
      if (acceptedKeyboard && event.code === 'Space') {
        playUiSound(hardRestartAudio);
        startGame();
      }
      return;
    }

    if (isTransitioning) {
      return;
    }

    if (gameStarted) {
      falsePositiveCount += 1;
      updateResultsSummary();
      return;
    }

    if (!gameStarted && acceptedKeyboard && event.code === 'Enter' && mediaReady) {
      startGame();
    }
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setSelectedMode(button.dataset.mode));
  });

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
      clearFreezeEncounterAnimation();
    }
  });
  videoPlayer?.addEventListener('loadstart', refreshMediaLoadingState);
  videoPlayer?.addEventListener('loadedmetadata', refreshMediaLoadingState);
  videoPlayer?.addEventListener('loadeddata', refreshMediaLoadingState);
  videoPlayer?.addEventListener('progress', refreshMediaLoadingState);
  videoPlayer?.addEventListener('canplay', refreshMediaLoadingState);
  videoPlayer?.addEventListener('canplaythrough', refreshMediaLoadingState);
  videoPlayer?.addEventListener('error', () => {
    videoLoadReady = false;
    updateCombinedLoadingState();
    setMediaReadyState(false, Math.round((videoLoadProgress * 0.7) + (imageLoadProgress * 0.3)), 'unavailable');
  });

  const languageObserver = new MutationObserver(updatePromptLanguage);
  languageObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });

  setSelectedMode(document.body.dataset.selectedMode || 'normal');
  setMediaReadyState(false, 8, 'loading');
  preloadActionImages();
  refreshMediaLoadingState();
  updateResultsSummary();
  startMenuMusic();
  scheduleMenuMusicAutoplay();

  const unlockMenuMusic = () => {
    startMenuMusic();
    document.removeEventListener('pointerdown', unlockMenuMusic, true);
    document.removeEventListener('keydown', unlockMenuMusic, true);
  };

  document.addEventListener('pointerdown', unlockMenuMusic, true);
  document.addEventListener('keydown', unlockMenuMusic, true);
});
