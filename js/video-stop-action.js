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
      fr: 'Appuie sur la switch au bon moment, pas besoin de se dépêcher.',
      en: 'Press your switch at the right time, no need to rush.',
      ja: '正しいタイミングでスイッチを押してください。急ぐ必要はありません。'
    },
    hard: {
      fr: 'Tu as 10 secondes pour appuyer sur ta switch. Tu dois faire attention de ne pas appuyer plus de 5 fois au mauvais moment, sinon tu devras recommencer.',
      en: 'You have 10 seconds to press your switch. Be careful not to press at the wrong time more than 5 times, or you will have to restart.',
      ja: 'スイッチを押すまでに10秒あります。タイミング外の押下が5回を超えると、最初からやり直しになります。'
    },
    competitive: {
      fr: 'Mode maître : tu as 3 secondes pour appuyer sur ta switch. Si tu appuies au mauvais moment, tu devras recommencer.',
      en: 'Master mode: you have 3 seconds to press your switch. If you press at the wrong time, you will have to restart.',
      ja: 'スイッチを押すまでに3秒あります。タイミング外に押すと、やり直しになります。'
    }
  };

  const MODE_DESCRIPTION_COPY_EYEGAZE = {
    normal: {
      fr: "Grande tuile au centre de l’écran, prends ton temps.",
      en: 'Large tile in the middle of the screen, take your time.',
      ja: '画面中央の大きなタイルです。落ち着いて操作できます。'
    },
    hard: {
      fr: "Tuile moyenne dans l’un des quatre coins : tu as 10 secondes pour l’activer.",
      en: 'A medium tile in one of the four corners: you have 10 seconds to activate it.',
      ja: '4つの角のどこかに中サイズのタイルが表示されます。10秒以内に起動してください。'
    },
    competitive: {
      fr: "Petite tuile : tu as 3 secondes pour l’activer.",
      en: 'A small tile: you have 3 seconds to activate it.',
      ja: '小さなタイルです。3秒以内に起動してください。'
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
  const actionPromptTile = document.getElementById('action-prompt-tile');
  const actionPromptDwellFill = document.getElementById('action-prompt-dwell-fill');
  const gazePointer = document.getElementById('gazePointer');
  const actionPromptImage = document.getElementById('action-prompt-image');
  const actionPromptLabel = document.getElementById('action-prompt-label');
  const resultsScreen = document.getElementById('results-screen');
  const resultsScore = document.getElementById('results-score');
  const resultsAverageDelay = document.getElementById('results-average-delay');
  const resultsFalsePositives = document.getElementById('results-false-positives');
  const continueButton = document.getElementById('continue-button');
  const scoreRegisterPanel = document.getElementById('score-register-panel');
  const scoreRegisterQuestion = document.getElementById('score-register-question');
  const scorePlayerNameLabel = document.getElementById('score-player-name-label');
  const scorePlayerNameInput = document.getElementById('score-player-name');
  const scoreSubmitButton = document.getElementById('score-submit');
  const scoreRegisterStatus = document.getElementById('score-register-status');
  const leaderboardPanel = document.getElementById('leaderboard-panel');
  const leaderboardTitle = document.getElementById('leaderboard-title');
  const leaderboardList = document.getElementById('leaderboard-list');
  const languageToggle = document.getElementById('language-toggle');
  const modeButtons = Array.from(document.querySelectorAll('.stop-action-mode-btn[data-mode]'));
  const modeDescription = document.getElementById('stop-action-mode-description');

  const videoSource = document.body.getAttribute('data-video-source') || '';
  const actionEvents = parseActionEvents(document.body.getAttribute('data-action-events'));
  const promptSoundSrc = document.body.getAttribute('data-prompt-sound') || '../../sounds/pageturn.mp3';
  const successSoundSrc = document.body.getAttribute('data-success-sound') || '../../sounds/success3.mp3';
  const hardTimeLimitMs = Math.max(2000, Number(document.body.getAttribute('data-hard-time-limit')) * 1000 || 10000);
  const hardShrinkDurationMs = Math.max(1000, Number(document.body.getAttribute('data-hard-shrink-duration')) * 1000 || 5000);
  const hardTimeoutSoundSrc = document.body.getAttribute('data-hard-timeout-sound') || '../../sounds/arcade/arcadefail.mp3';
  const hardRestartSoundSrc = document.body.getAttribute('data-hard-restart-sound') || '../../sounds/pagestart.mp3';
  const menuMusicSrc = document.body.getAttribute('data-menu-music') || '';
  const waitMusicSrc = document.body.getAttribute('data-wait-music') || '';
  const waitMusicDelayMs = Math.max(0, Number(document.body.getAttribute('data-wait-music-delay-ms')) || 500);
  const failPromptImageSrc = '../../images/gaminganimation/neutral.png';
  let eyegazeModeEnabled = false;
  let eyegazeDwellMs = 1500;
  const eyegazeMotionIdleLimitMs = 1000;
  const eyegazeMinMotionPx = 1.5;
  const zoomTransitionMs = 180;
  const SCORE_MAX = 10000;
  const DELAY_WEIGHT = 9000;
  const FALSE_POSITIVE_WEIGHT = 1000;
  const DELAY_REFERENCE_MS = 3000;
  const scoreGame = document.body.getAttribute('data-score-game') || '';
  const scoreApiBase = (document.body.getAttribute('data-score-api-base') || '').trim();
  const scoreTopLimit = Math.max(1, Math.min(50, Number(document.body.getAttribute('data-score-top-limit')) || 5));
  const scoreFeatureEnabled = Boolean(scoreGame && scoreApiBase);

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
  let waitMusicFadeTimer = null;
  let menuMusicAutoplayAttempts = 0;
  let menuMusicAutoplayTimer = null;
  let menuMusicStarted = false;
  let scoreSubmissionState = 'idle';
  let switchIsDown = false;
  let promptRequiresFreshSwitchPress = false;
  let promptSawSwitchRelease = true;
  let eyegazeDwellTimer = null;
  let pointerInPromptTile = false;
  let lastPointerMoveAt = 0;
  let lastPointerX = null;
  let lastPointerY = null;
  let eyegazeDwellMotionPx = 0;

  const promptAudio = createUiAudio(promptSoundSrc);
  const successAudio = createUiAudio(successSoundSrc);
  const hardTimeoutAudio = createUiAudio(hardTimeoutSoundSrc);
  const hardRestartAudio = createUiAudio(hardRestartSoundSrc);
  const menuMusicAudio = createUiAudio(menuMusicSrc, { elementId: 'intro-jingle' });
  const waitMusicAudio = createUiAudio(waitMusicSrc);

  function syncInputModeFromBody(modeOverride) {
    const resolvedMode = (typeof modeOverride === 'string' ? modeOverride : document.body.getAttribute('data-input-mode') || 'switch').toLowerCase();
    eyegazeModeEnabled = resolvedMode === 'eyegaze';
    eyegazeDwellMs = Math.max(400, Number(document.body.getAttribute('data-eyegaze-dwell-ms')) || 1500);

    document.body.classList.toggle('video-stop-action-eyegaze', eyegazeModeEnabled);
    overlayScreen?.classList.toggle('eyegaze-mode', eyegazeModeEnabled);

    if (!eyegazeModeEnabled) {
      cancelEyegazeDwell();
      pointerInPromptTile = false;
      if (gazePointer) {
        gazePointer.style.opacity = '0';
      }
    }

    updateEyegazePointerState();
    setSelectedMode(document.body.dataset.selectedMode || 'normal');
  }

  syncInputModeFromBody();

  document.addEventListener('arcade-input-mode-change', (event) => {
    const mode = event?.detail?.mode;
    syncInputModeFromBody(mode);
    if (!gameStarted) {
      startMenuMusicWithFallback();
    }
  });

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

  function clearWaitMusicFadeTimer() {
    if (waitMusicFadeTimer) {
      clearInterval(waitMusicFadeTimer);
      waitMusicFadeTimer = null;
    }
  }

  function fadeOutWaitMusic(durationMs) {
    if (!waitMusicAudio) {
      return;
    }

    if (waitMusicAudio.paused) {
      return;
    }

    clearWaitMusicFadeTimer();

    const startVolume = Number.isFinite(waitMusicAudio.volume) ? waitMusicAudio.volume : 0.35;
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      waitMusicAudio.volume = 0;
      return;
    }

    const fadeStartAt = Date.now();
    waitMusicFadeTimer = setInterval(() => {
      const elapsed = Date.now() - fadeStartAt;
      const progress = Math.min(1, elapsed / durationMs);
      waitMusicAudio.volume = Math.max(0, startVolume * (1 - progress));

      if (progress >= 1) {
        clearWaitMusicFadeTimer();
      }
    }, 50);
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
    clearWaitMusicFadeTimer();
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
      const copySet = eyegazeModeEnabled ? MODE_DESCRIPTION_COPY_EYEGAZE : MODE_DESCRIPTION_COPY;
      const copy = copySet[selected] || copySet.normal;
      modeDescription.textContent = copy[lang] || copy.en;
    }
  }

  function getSelectedModeForScoreboard() {
    return document.body.dataset.selectedMode || 'normal';
  }

  function isHardModeSelected() {
    return document.body.dataset.selectedMode === 'hard';
  }

  function isCompetitiveModeSelected() {
    return document.body.dataset.selectedMode === 'competitive';
  }

  function clearHardModePromptTimer() {
    if (hardModePromptTimer) {
      clearTimeout(hardModePromptTimer);
      hardModePromptTimer = null;
    }

    actionPromptImage?.classList.remove('hard-mode-countdown');
    actionPromptLabel?.classList.remove('hard-mode-countdown');
    if (actionPromptImage) {
      actionPromptImage.style.animationDuration = '';
    }
    if (actionPromptLabel) {
      actionPromptLabel.style.animationDuration = '';
    }
  }

  function triggerFailedPromptRestart() {
    awaitingResume = eyegazeModeEnabled;
    currentPromptShownAtMs = null;
    hardModeNeedsRestart = true;
    clearHardModePromptTimer();
    stopWaitMusic();
    cancelEyegazeDwell();
    pointerInPromptTile = false;
    videoPlayer?.pause();

    if (actionPromptImage) {
      actionPromptImage.src = failPromptImageSrc;
      actionPromptImage.classList.remove('hidden');
      actionPromptImage.classList.remove('is-pulsing');
      actionPromptImage.style.animationDuration = '';
    }
    if (actionPromptLabel) {
      const playAgainCopy = {
        fr: 'Rejouer ?',
        en: 'Play again?',
        ja: 'もう一度プレイ？'
      };
      const lang = getCurrentLanguage();
      actionPromptLabel.textContent = playAgainCopy[lang] || playAgainCopy.en;
      actionPromptLabel.classList.remove('is-pulsing');
      actionPromptLabel.classList.remove('hard-mode-countdown');
      actionPromptLabel.style.animationDuration = '';
    }

    resetEyegazePromptLayout();
    overlayScreen?.classList.remove('hidden');
    overlayScreen?.classList.add('show');
    overlayScreen?.classList.toggle('eyegaze-mode', eyegazeModeEnabled);
    if (eyegazeModeEnabled && typeof lastPointerX === 'number' && typeof lastPointerY === 'number') {
      pointerInPromptTile = isPointInsidePromptTile(lastPointerX, lastPointerY);
    }
    playUiSound(hardTimeoutAudio);
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

  function updatePromptLanguage() {
    if (!actionPromptLabel || !actionPromptImage || !activeActionKey) {
      if (loadingBarContainer) {
        loadingBarContainer.dataset.status = getStatusLabel(currentStatusKey);
      }

      setSelectedMode(document.body.dataset.selectedMode || 'normal');
      updateResultsSummary();

      updateScorePanelCopy();
      if (scoreFeatureEnabled && leaderboardPanel && !leaderboardPanel.classList.contains('hidden')) {
        renderLeaderboard();
      }
      return;
    }

    if (loadingBarContainer) {
      loadingBarContainer.dataset.status = getStatusLabel(currentStatusKey);
    }

    const label = getActionLabel(activeActionKey);
    actionPromptLabel.textContent = label;
    actionPromptImage.alt = label;
    setSelectedMode(document.body.dataset.selectedMode || 'normal');
    updateResultsSummary();
    updateScorePanelCopy();

    if (scoreFeatureEnabled && leaderboardPanel && !leaderboardPanel.classList.contains('hidden')) {
      renderLeaderboard();
    }
  }

  function getScorePanelCopy() {
    const lang = getCurrentLanguage();
    const copy = {
      fr: {
        registerQuestion: 'Enregistre ton score dans le classement.',
        nameLabel: 'Votre nom',
        submit: 'Enregistrer',
        sending: 'Enregistrement du score...',
        submitSuccess: 'Score enregistré.',
        submitError: 'Impossible d\'enregistrer le score pour le moment.',
        emptyName: 'Veuillez entrer un nom.',
        leaderboardTitle: (mode) => `Top ${scoreTopLimit} (${mode})`,
        emptyLeaderboard: 'Aucun score pour le moment.',
        loadingLeaderboard: 'Chargement du classement...',
        leaderboardError: 'Impossible de charger le classement.',
        anonymous: 'Anonyme',
        modes: {
          normal: 'Normal',
          hard: 'Difficile',
          competitive: 'Maître'
        }
      },
      en: {
        registerQuestion: 'Save your score to the leaderboard.',
        nameLabel: 'Your name',
        submit: 'Submit score',
        sending: 'Submitting score...',
        submitSuccess: 'Score submitted.',
        submitError: 'Unable to submit score right now.',
        emptyName: 'Please enter a name.',
        leaderboardTitle: (mode) => `Top ${scoreTopLimit} (${mode})`,
        emptyLeaderboard: 'No scores yet.',
        loadingLeaderboard: 'Loading leaderboard...',
        leaderboardError: 'Unable to load leaderboard.',
        anonymous: 'Anonymous',
        modes: {
          normal: 'Normal',
          hard: 'Hard',
          competitive: 'Master'
        }
      },
      ja: {
        registerQuestion: 'スコアをランキングに登録します。',
        nameLabel: '名前',
        submit: 'スコア登録',
        sending: 'スコアを送信中...',
        submitSuccess: 'スコアを登録しました。',
        submitError: '現在スコアを登録できません。',
        emptyName: '名前を入力してください。',
        leaderboardTitle: (mode) => `トップ${scoreTopLimit}（${mode}）`,
        emptyLeaderboard: 'まだスコアがありません。',
        loadingLeaderboard: 'ランキングを読み込み中...',
        leaderboardError: 'ランキングを読み込めません。',
        anonymous: '匿名',
        modes: {
          normal: 'ノーマル',
          hard: 'ハード',
          competitive: 'マスター'
        }
      }
    };

    return copy[lang] || copy.en;
  }

  function getModeLabelForLeaderboard(mode, copy) {
    if (!copy || !copy.modes) {
      return mode;
    }

    return copy.modes[mode] || mode;
  }

  function getLeaderboardMedal(index) {
    if (index === 0) {
      return '🥇 ';
    }
    if (index === 1) {
      return '🥈 ';
    }
    if (index === 2) {
      return '🥉 ';
    }
    return '';
  }

  function getFinalScoreValue() {
    const count = actionEvents.length;
    const avgDelayMs = responseDelaysMs.length
      ? responseDelaysMs.reduce((total, value) => total + value, 0) / responseDelaysMs.length
      : 0;
    return computeFinalScore(avgDelayMs, falsePositiveCount, count);
  }

  function setScoreStatusMessage(message, isError) {
    if (!scoreRegisterStatus) {
      return;
    }

    scoreRegisterStatus.textContent = message || '';
    scoreRegisterStatus.classList.toggle('is-error', Boolean(isError));
  }

  function setScoreButtonsDisabled(disabled) {
    [scoreSubmitButton].forEach((button) => {
      if (button) {
        button.disabled = Boolean(disabled);
      }
    });
  }

  function setScoreInputsDisabled(disabled) {
    if (scorePlayerNameInput) {
      scorePlayerNameInput.disabled = Boolean(disabled);
    }
  }

  async function submitScore(game, playerName, score, mode) {
    const response = await fetch(scoreApiBase + '/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        game,
        playerName,
        score,
        mode
      })
    });

    if (!response.ok) {
      throw new Error('submit_failed');
    }

    return response.json();
  }

  async function getLeaderboard(game, mode, limit) {
    const params = new URLSearchParams({
      game,
      limit: String(limit)
    });

    if (mode) {
      params.set('mode', mode);
    }

    const response = await fetch(scoreApiBase + '/leaderboard?' + params.toString());
    if (!response.ok) {
      throw new Error('leaderboard_failed');
    }

    return response.json();
  }

  async function renderLeaderboard() {
    if (!scoreFeatureEnabled || !leaderboardPanel || !leaderboardList || !leaderboardTitle) {
      return;
    }

    const copy = getScorePanelCopy();
    const mode = getSelectedModeForScoreboard();
    leaderboardTitle.textContent = copy.leaderboardTitle(getModeLabelForLeaderboard(mode, copy));
    leaderboardPanel.classList.remove('hidden');
    leaderboardList.innerHTML = '';

    const loadingItem = document.createElement('li');
    loadingItem.textContent = copy.loadingLeaderboard;
    leaderboardList.appendChild(loadingItem);

    try {
      const data = await getLeaderboard(scoreGame, mode, scoreTopLimit);
      const rows = Array.isArray(data?.rows) ? data.rows : [];

      leaderboardList.innerHTML = '';
      if (rows.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = copy.emptyLeaderboard;
        leaderboardList.appendChild(emptyItem);
        return;
      }

      rows.slice(0, scoreTopLimit).forEach((row, index) => {
        const item = document.createElement('li');
        const name = typeof row?.player_name === 'string' && row.player_name.trim()
          ? row.player_name.trim()
          : copy.anonymous;
        const value = Number.isFinite(Number(row?.score)) ? Number(row.score) : 0;
        item.textContent = getLeaderboardMedal(index) + name + ' — ' + value;
        leaderboardList.appendChild(item);
      });
    } catch (error) {
      leaderboardList.innerHTML = '';
      const errorItem = document.createElement('li');
      errorItem.textContent = copy.leaderboardError;
      leaderboardList.appendChild(errorItem);
    }
  }

  function updateScorePanelCopy() {
    if (!scoreFeatureEnabled || !scoreRegisterPanel) {
      return;
    }

    const copy = getScorePanelCopy();

    if (scoreRegisterQuestion) {
      scoreRegisterQuestion.textContent = copy.registerQuestion;
    }
    if (scorePlayerNameLabel) {
      scorePlayerNameLabel.textContent = copy.nameLabel;
    }
    if (scoreSubmitButton) {
      scoreSubmitButton.textContent = copy.submit;
    }

    if (scoreSubmissionState === 'sending') {
      setScoreStatusMessage(copy.sending, false);
    }
  }

  function resetScorePanel() {
    if (!scoreFeatureEnabled || !scoreRegisterPanel) {
      return;
    }

    scoreSubmissionState = 'idle';
    scoreRegisterPanel.classList.remove('hidden');
    leaderboardPanel?.classList.add('hidden');
    leaderboardList && (leaderboardList.innerHTML = '');
    if (scorePlayerNameInput) {
      scorePlayerNameInput.value = '';
    }
    setScoreStatusMessage('', false);
    setScoreInputsDisabled(false);
    setScoreButtonsDisabled(false);
    updateScorePanelCopy();
  }

  async function handleScoreSubmission() {
    if (!scoreFeatureEnabled || scoreSubmissionState === 'sending' || scoreSubmissionState === 'submitted') {
      return;
    }

    const copy = getScorePanelCopy();
    const rawName = scorePlayerNameInput?.value || '';
    const playerName = rawName.trim();
    if (!playerName) {
      setScoreStatusMessage(copy.emptyName, true);
      scorePlayerNameInput?.focus();
      return;
    }

    scoreSubmissionState = 'sending';
    setScoreButtonsDisabled(true);
    setScoreStatusMessage(copy.sending, false);

    try {
      await submitScore(scoreGame, playerName.slice(0, 20), getFinalScoreValue(), getSelectedModeForScoreboard());
      scoreSubmissionState = 'submitted';
      setScoreStatusMessage(copy.submitSuccess, false);
      setScoreInputsDisabled(true);
      await renderLeaderboard();
    } catch (error) {
      scoreSubmissionState = 'idle';
      setScoreStatusMessage(copy.submitError, true);
    } finally {
      setScoreButtonsDisabled(scoreSubmissionState === 'submitted');
    }
  }

  function showActionPrompt(eventConfig) {
    if (!overlayScreen || !actionPromptImage || !actionPromptLabel) {
      return;
    }

    activeActionKey = eventConfig.action;
    awaitingResume = true;

    actionPromptImage.src = getActionImage(eventConfig.action);
    if (!eyegazeModeEnabled) {
      actionPromptImage.classList.add('is-pulsing');
      actionPromptLabel.classList.add('is-pulsing');
    } else {
      actionPromptImage.classList.remove('is-pulsing');
      actionPromptLabel.classList.remove('is-pulsing');
    }
    updatePromptLanguage();

    overlayScreen.classList.remove('hidden');
    overlayScreen.classList.add('show');
    overlayScreen.classList.toggle('eyegaze-mode', eyegazeModeEnabled);
    applyEyegazePromptLayout();
    if (eyegazeModeEnabled && typeof lastPointerX === 'number' && typeof lastPointerY === 'number') {
      pointerInPromptTile = isPointInsidePromptTile(lastPointerX, lastPointerY);
    }
    resetEyegazeDwellFill();
    currentPromptShownAtMs = Date.now();
    promptRequiresFreshSwitchPress = switchIsDown;
    promptSawSwitchRelease = !switchIsDown;
    hardModeNeedsRestart = false;
    clearHardModePromptTimer();
    stopWaitMusic();

    if (isHardModeSelected() || isCompetitiveModeSelected()) {
      if (eyegazeModeEnabled) {
        const totalTimeMs = isCompetitiveModeSelected() ? 5000 : hardTimeLimitMs;
        hardModePromptTimer = setTimeout(() => {
          if (!awaitingResume) {
            return;
          }
          triggerFailedPromptRestart();
        }, totalTimeMs);
      } else {
        const totalTimeMs = isCompetitiveModeSelected() ? 3000 : hardTimeLimitMs;
        const shrinkDurationMs = isCompetitiveModeSelected() ? 2000 : hardShrinkDurationMs;
        const shrinkStartDelayMs = Math.max(0, totalTimeMs - shrinkDurationMs);
        const shrinkTimer = setTimeout(() => {
          if (!awaitingResume) {
            return;
          }

          actionPromptImage.classList.remove('is-pulsing');
          actionPromptLabel.classList.remove('is-pulsing');
          if (actionPromptImage) {
            actionPromptImage.style.animationDuration = (shrinkDurationMs / 1000) + 's';
          }
          if (actionPromptLabel) {
            actionPromptLabel.style.animationDuration = (shrinkDurationMs / 1000) + 's';
          }
          fadeOutWaitMusic(shrinkDurationMs);
          actionPromptImage.classList.add('hard-mode-countdown');
          actionPromptLabel.classList.add('hard-mode-countdown');
        }, shrinkStartDelayMs);

        hardModePromptTimer = setTimeout(() => {
          if (!awaitingResume) {
            return;
          }
          clearTimeout(shrinkTimer);
          triggerFailedPromptRestart();
        }, totalTimeMs);
      }
    }

    playUiSound(promptAudio);
    startWaitMusicWithDelay();
  }

  function hideActionPrompt() {
    awaitingResume = false;
    activeActionKey = null;
    promptRequiresFreshSwitchPress = false;
    promptSawSwitchRelease = true;
    clearHardModePromptTimer();
    stopWaitMusic();
    cancelEyegazeDwell();
    pointerInPromptTile = false;

    if (actionPromptImage) {
      actionPromptImage.classList.remove('hidden');
      actionPromptImage.classList.remove('is-pulsing');
      actionPromptLabel?.classList.remove('is-pulsing');
      actionPromptImage.classList.remove('hard-mode-countdown');
      actionPromptLabel?.classList.remove('hard-mode-countdown');
    }
    resetEyegazePromptLayout();

    if (!overlayScreen) {
      return;
    }

    overlayScreen.classList.remove('show');
    overlayScreen.classList.add('hidden');
  }

  function resetEyegazeDwellFill() {
    if (!actionPromptDwellFill) {
      return;
    }
    actionPromptDwellFill.style.transition = 'none';
    actionPromptDwellFill.style.width = '0';
    actionPromptDwellFill.style.height = '0';
    actionPromptDwellFill.offsetHeight;
  }

  function hasRecentPointerMotion() {
    return (Date.now() - lastPointerMoveAt) <= eyegazeMotionIdleLimitMs;
  }

  function updateEyegazePointerState() {
    if (!eyegazeModeEnabled) {
      document.body.classList.remove('hide-native-cursor');
      if (gazePointer) {
        gazePointer.style.opacity = '0';
        gazePointer.style.display = 'none';
      }
      return;
    }

    const showPointer = Boolean(gazePointer && gameStarted && (!controlPanel || controlPanel.style.display === 'none'));
    document.body.classList.toggle('hide-native-cursor', showPointer);
    if (gazePointer) {
      gazePointer.style.display = 'block';
      gazePointer.style.opacity = showPointer ? '1' : '0';
    }
  }

  function applyEyegazePromptLayout() {
    if (!eyegazeModeEnabled || !actionPromptTile) {
      return;
    }

    actionPromptTile.classList.remove('eyegaze-hard-layout', 'eyegaze-competitive-layout');
    actionPromptTile.style.removeProperty('--eyegaze-tile-x');
    actionPromptTile.style.removeProperty('--eyegaze-tile-y');

    if (isHardModeSelected()) {
      const col = Math.floor(Math.random() * 2);
      const row = Math.floor(Math.random() * 2);
      const x = `${(col + 0.5) * 50}%`;
      const y = `${(row + 0.5) * 50}%`;
      actionPromptTile.classList.add('eyegaze-hard-layout');
      actionPromptTile.style.setProperty('--eyegaze-tile-x', x);
      actionPromptTile.style.setProperty('--eyegaze-tile-y', y);
      return;
    }

    if (isCompetitiveModeSelected()) {
      const col = Math.floor(Math.random() * 3);
      const row = Math.floor(Math.random() * 3);
      const x = `${(col + 0.5) * (100 / 3)}%`;
      const y = `${(row + 0.5) * (100 / 3)}%`;
      actionPromptTile.classList.add('eyegaze-competitive-layout');
      actionPromptTile.style.setProperty('--eyegaze-tile-x', x);
      actionPromptTile.style.setProperty('--eyegaze-tile-y', y);
    }
  }

  function resetEyegazePromptLayout() {
    if (!actionPromptTile) {
      return;
    }
    actionPromptTile.classList.remove('eyegaze-hard-layout', 'eyegaze-competitive-layout');
    actionPromptTile.style.removeProperty('--eyegaze-tile-x');
    actionPromptTile.style.removeProperty('--eyegaze-tile-y');
  }

  function isPointInsidePromptTile(x, y) {
    if (!actionPromptTile || typeof x !== 'number' || typeof y !== 'number') {
      return false;
    }
    const hitElement = document.elementFromPoint(x, y);
    return Boolean(hitElement && actionPromptTile.contains(hitElement));
  }

  function startEyegazeDwell() {
    if (!eyegazeModeEnabled || !awaitingResume) {
      return;
    }

    if (!hasRecentPointerMotion()) {
      cancelEyegazeDwell();
      return;
    }

    cancelEyegazeDwell();
    resetEyegazeDwellFill();
    eyegazeDwellMotionPx = 0;

    if (actionPromptDwellFill) {
      actionPromptDwellFill.style.transition = `width ${eyegazeDwellMs}ms linear, height ${eyegazeDwellMs}ms linear`;
      requestAnimationFrame(() => {
        actionPromptDwellFill.style.width = '100%';
        actionPromptDwellFill.style.height = '100%';
      });
    }

    eyegazeDwellTimer = setTimeout(() => {
      eyegazeDwellTimer = null;
      if (!hasRecentPointerMotion() || eyegazeDwellMotionPx < eyegazeMinMotionPx) {
        cancelEyegazeDwell();
        return;
      }
      if (hardModeNeedsRestart) {
        playUiSound(hardRestartAudio);
        startGame();
        return;
      }
      resumeGame();
    }, eyegazeDwellMs);
  }

  function cancelEyegazeDwell() {
    if (eyegazeDwellTimer) {
      clearTimeout(eyegazeDwellTimer);
      eyegazeDwellTimer = null;
    }
    resetEyegazeDwellFill();
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

    if (scoreFeatureEnabled) {
      resetScorePanel();
      renderLeaderboard();
      scorePlayerNameInput?.focus();
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    if (languageToggle) {
      languageToggle.style.display = 'inline-flex';
    }

    updateEyegazePointerState();
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
    scoreSubmissionState = 'idle';
    switchIsDown = false;
    promptRequiresFreshSwitchPress = false;
    promptSawSwitchRelease = true;

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

    updateEyegazePointerState();
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

    updateEyegazePointerState();
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
        showActionPrompt(nextEvent);
        isTransitioning = false;
      });
    }
  }

  function handleActivate(event) {
    const isKeyboard = event.type === 'keydown';
    const acceptedKeyboard = isKeyboard && (event.code === 'Space' || event.code === 'Enter');
    const isSpaceKeyboard = isKeyboard && event.code === 'Space';
    const acceptedPointer = event.type === 'pointerup';

    if (!acceptedKeyboard && !acceptedPointer) {
      return;
    }

    if (eyegazeModeEnabled && awaitingResume && (acceptedKeyboard || acceptedPointer)) {
      return;
    }

    if (acceptedKeyboard) {
      if (switchIsDown) {
        return;
      }
      event.preventDefault();
      switchIsDown = true;
    }

    if (awaitingResume) {
      if (!isSpaceKeyboard) {
        return;
      }

      if (promptRequiresFreshSwitchPress && !promptSawSwitchRelease) {
        return;
      }

      resumeGame();
      return;
    }

    if (hardModeNeedsRestart) {
      if (acceptedKeyboard && (event.code === 'Space' || event.code === 'Enter')) {
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

      if (isCompetitiveModeSelected()) {
        triggerFailedPromptRestart();
        return;
      }

      if (isHardModeSelected() && falsePositiveCount >= 5) {
        triggerFailedPromptRestart();
      }
      return;
    }

    if (!gameStarted && acceptedKeyboard && event.code === 'Enter' && mediaReady) {
      startGame();
    }
  }

  function handleSwitchRelease(event) {
    if (event.type !== 'keyup') {
      return;
    }

    if (event.code !== 'Space') {
      return;
    }

    switchIsDown = false;
    if (awaitingResume) {
      promptSawSwitchRelease = true;
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

  scoreSubmitButton?.addEventListener('click', handleScoreSubmission);
  scorePlayerNameInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleScoreSubmission();
    }
  });

  if (overlayScreen) {
    overlayScreen.addEventListener('pointerup', handleActivate);
  }

  if (actionPromptTile) {
    actionPromptTile.addEventListener('pointerenter', () => {
      if (!eyegazeModeEnabled) {
        return;
      }
      pointerInPromptTile = true;
      startEyegazeDwell();
    });
    actionPromptTile.addEventListener('pointerleave', () => {
      if (!eyegazeModeEnabled) {
        return;
      }
      pointerInPromptTile = false;
      cancelEyegazeDwell();
    });
    actionPromptTile.addEventListener('pointercancel', () => {
      if (!eyegazeModeEnabled) {
        return;
      }
      pointerInPromptTile = false;
      cancelEyegazeDwell();
    });
  }

  document.addEventListener('pointermove', (event) => {
      if (!eyegazeModeEnabled) {
        return;
      }
      const x = typeof event.clientX === 'number' ? event.clientX : 0;
      const y = typeof event.clientY === 'number' ? event.clientY : 0;
      pointerInPromptTile = isPointInsidePromptTile(x, y);

      if (typeof lastPointerX === 'number' && typeof lastPointerY === 'number') {
        const dx = x - lastPointerX;
        const dy = y - lastPointerY;
        const stepDistance = Math.hypot(dx, dy);
        if (eyegazeDwellTimer && stepDistance > 0) {
          eyegazeDwellMotionPx += stepDistance;
        }
      }

      lastPointerX = x;
      lastPointerY = y;
      lastPointerMoveAt = Date.now();

      if (gazePointer) {
        gazePointer.style.left = `${x}px`;
        gazePointer.style.top = `${y}px`;
      }

      if (pointerInPromptTile && awaitingResume && !eyegazeDwellTimer) {
        startEyegazeDwell();
      }
    });
  updateEyegazePointerState();

  document.addEventListener('keydown', handleActivate, true);
  document.addEventListener('keyup', handleSwitchRelease, true);
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
  updateScorePanelCopy();
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
