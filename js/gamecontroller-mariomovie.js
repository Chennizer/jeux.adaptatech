document.addEventListener('DOMContentLoaded', () => {
  const MAX_AVG_PAUSE_TIME = 60;
  const WEIGHT_RPA = 300;
  const WEIGHT_APT = 500;
  const WEIGHT_NSP = 10;
  const NSP_CAP = 50;
  const TIME_THRESHOLD = 30;

  const startButton = document.getElementById('control-panel-start-button');
  const continueButton = document.getElementById('continue-button');
  const controlPanel = document.getElementById('control-panel');
  const languageToggle = document.getElementById('language-toggle');
  const overlayScreen = document.getElementById('overlay-screen');
  const overlayImage = document.getElementById('space-prompt-image');
  const overlayText = document.getElementById('space-prompt-text');
  const videoContainer = document.getElementById('video-container');
  const mediaPlayer = document.getElementById('video-player');
  const resultsScreen = document.getElementById('results-screen');
  const finalScoreElem = document.getElementById('final-score');
  const spaceBarAttemptsResult = document.getElementById('space-bar-attempts-result');
  const timeRatioElem = document.getElementById('time-ratio');

  const pauseEvents = Array.isArray(window.mariomoviePauseEvents)
    ? window.mariomoviePauseEvents.map((event) => ({ ...event }))
    : [];

  let preventInput = false;
  let controlsEnabled = false;
  let isActionKeyPressed = false;
  let sessionCompleted = false;
  let sessionStartTime = null;
  let pauseStartTime = null;
  let pausedAtTime = 0;
  let currentEventIndex = 0;
  let wrongAttemptCount = 0;
  let pauseDurations = [];

  function getCurrentLanguage() {
    return document.documentElement.lang || localStorage.getItem('siteLanguage') || 'en';
  }

  function getEventLabel(event) {
    const lang = getCurrentLanguage();
    if (!event || !event.text) return '';
    return event.text[lang] || event.text.en || event.text.fr || '';
  }

  function resetSessionState() {
    preventInput = true;
    controlsEnabled = false;
    isActionKeyPressed = false;
    sessionCompleted = false;
    sessionStartTime = null;
    pauseStartTime = null;
    pausedAtTime = 0;
    currentEventIndex = 0;
    wrongAttemptCount = 0;
    pauseDurations = [];
    if (mediaPlayer) {
      mediaPlayer.currentTime = 0;
      mediaPlayer.pause();
    }
    hideOverlay();
    if (resultsScreen) {
      resultsScreen.classList.remove('show');
      resultsScreen.style.display = 'none';
    }
  }

  function showOverlay(event) {
    if (!overlayScreen || !overlayImage || !overlayText || !event) return;
    overlayImage.src = event.image;
    overlayImage.alt = getEventLabel(event);
    overlayImage.classList.remove('hidden');
    overlayText.textContent = getEventLabel(event);
    overlayText.classList.remove('hidden');
    overlayScreen.classList.add('show');
    controlsEnabled = true;
    preventInput = false;
    pauseStartTime = Date.now();
  }

  function hideOverlay() {
    if (!overlayScreen || !overlayImage || !overlayText) return;
    overlayScreen.classList.remove('show');
    overlayImage.classList.add('hidden');
    overlayText.classList.add('hidden');
    controlsEnabled = false;
    preventInput = true;
  }

  function startPlayback() {
    if (!mediaPlayer) return;
    try {
      mediaPlayer.play().catch(() => {});
    } catch (error) {
      // ignore autoplay/fullscreen issues in browsers that block them
    }
  }

  function resumeAfterPause() {
    if (!controlsEnabled || !mediaPlayer) return;
    if (pauseStartTime) {
      pauseDurations.push(Date.now() - pauseStartTime);
      pauseStartTime = null;
    }
    hideOverlay();
    mediaPlayer.currentTime = pausedAtTime;
    pausedAtTime = 0;
    startPlayback();
  }

  function getSessionDurationMs() {
    if (!sessionStartTime || !mediaPlayer) return 0;
    const currentTimeMs = sessionCompleted ? mediaPlayer.duration * 1000 : mediaPlayer.currentTime * 1000;
    return Math.max(currentTimeMs, 0);
  }

  function computeStatistics(durations) {
    if (!durations.length) {
      return { average: 0, stdDev: 0, median: 0 };
    }
    const values = durations.map((duration) => duration / 1000);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + ((value - average) ** 2), 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
    return { average, stdDev: Math.sqrt(variance), median };
  }

  function calculateCauseEffectScore(avgPauseSeconds, attempts, successfulPauses) {
    const rpaScore = Math.max(0, 1 - Math.min(avgPauseSeconds, MAX_AVG_PAUSE_TIME) / MAX_AVG_PAUSE_TIME) * WEIGHT_RPA;
    const aptScore = Math.max(0, 1 - Math.min(attempts, TIME_THRESHOLD) / TIME_THRESHOLD) * WEIGHT_APT;
    const nspScore = Math.min(successfulPauses, NSP_CAP) * WEIGHT_NSP;
    return Math.round(rpaScore + aptScore + nspScore);
  }

  function showResults() {
    sessionCompleted = true;
    const totalPauseTimeMs = pauseDurations.reduce((sum, value) => sum + value, 0);
    const totalSessionTimeMs = getSessionDurationMs();
    const stats = computeStatistics(pauseDurations);
    const finalScore = calculateCauseEffectScore(stats.average, wrongAttemptCount, pauseDurations.length);
    const pausePercentage = totalSessionTimeMs > 0 ? (totalPauseTimeMs / totalSessionTimeMs) * 100 : 0;

    if (videoContainer) {
      videoContainer.classList.add('hidden');
      videoContainer.style.display = 'none';
    }
    if (resultsScreen) {
      resultsScreen.classList.add('show');
      resultsScreen.style.display = 'flex';
    }
    if (finalScoreElem) {
      finalScoreElem.textContent = `Score: ${finalScore}`;
    }
    if (spaceBarAttemptsResult) {
      const lang = getCurrentLanguage();
      const labels = {
        fr: `Appuis hors pause : ${wrongAttemptCount}`,
        en: `Mistimed presses: ${wrongAttemptCount}`,
        ja: `タイミング外の入力: ${wrongAttemptCount}`
      };
      spaceBarAttemptsResult.textContent = labels[lang] || labels.en;
    }
    if (timeRatioElem) {
      const lang = getCurrentLanguage();
      const percent = `${pausePercentage.toFixed(2)}%`;
      const labels = {
        fr: `Temps de pause: ${percent}`,
        en: `Pause time: ${percent}`,
        ja: `停止時間: ${percent}`
      };
      timeRatioElem.textContent = labels[lang] || labels.en;
    }
  }

  function handleTimeUpdate() {
    if (!mediaPlayer || currentEventIndex >= pauseEvents.length || controlsEnabled) return;
    const nextEvent = pauseEvents[currentEventIndex];
    if (mediaPlayer.currentTime >= nextEvent.time) {
      mediaPlayer.pause();
      pausedAtTime = nextEvent.time;
      showOverlay(nextEvent);
      currentEventIndex += 1;
    }
  }

  function beginGame() {
    if (!mediaPlayer || !pauseEvents.length) return;
    resetSessionState();
    const fullscreenTarget = document.documentElement;
    const requestFullscreen = fullscreenTarget.requestFullscreen
      || fullscreenTarget.webkitRequestFullscreen
      || fullscreenTarget.msRequestFullscreen;

    if (requestFullscreen) {
      try {
        requestFullscreen.call(fullscreenTarget);
      } catch (error) {
        // ignore fullscreen failures
      }
    }

    if (controlPanel) controlPanel.style.display = 'none';
    if (languageToggle) languageToggle.style.display = 'none';
    if (videoContainer) {
      videoContainer.classList.remove('hidden');
      videoContainer.style.display = 'block';
    }
    sessionStartTime = Date.now();
    startPlayback();
  }

  function handleActionInput(event) {
    if (event.type === 'keydown') {
      if (!['Space', 'Enter'].includes(event.code) || isActionKeyPressed) return;
      isActionKeyPressed = true;
    }

    if (preventInput) {
      wrongAttemptCount += 1;
      return;
    }

    event.preventDefault();
    resumeAfterPause();
  }

  function releaseActionKey(event) {
    if (['Space', 'Enter'].includes(event.code)) {
      isActionKeyPressed = false;
    }
  }

  if (startButton) {
    startButton.addEventListener('click', beginGame);
  }

  if (continueButton) {
    continueButton.addEventListener('click', () => {
      if (resultsScreen) {
      resultsScreen.classList.remove('show');
      resultsScreen.style.display = 'none';
    }
      if (controlPanel) controlPanel.style.display = 'flex';
      if (languageToggle) languageToggle.style.display = 'block';
      resetSessionState();
    });
  }

  if (mediaPlayer) {
    mediaPlayer.addEventListener('timeupdate', handleTimeUpdate);
    mediaPlayer.addEventListener('ended', showResults);
  }

  document.addEventListener('keydown', handleActionInput, true);
  document.addEventListener('keyup', releaseActionKey, true);

  if (overlayScreen) {
    overlayScreen.addEventListener('click', handleActionInput);
    overlayScreen.addEventListener('touchstart', handleActionInput, { passive: false });
  }
});
