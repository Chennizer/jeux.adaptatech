document.addEventListener('DOMContentLoaded', () => {
  // ----- Scoring constants -----
  const MAX_AVG_PAUSE_TIME = 60;
  const WEIGHT_RPA = 300;
  const WEIGHT_APT = 500;
  const WEIGHT_NSP = 10;
  const NSP_CAP = 50;
  const TIME_THRESHOLD = 30;
  // ----- State -----
  let preventInput = false;
  let spaceBarAttemptCount = 0;
  let pauseDurations = [];
  let pauseStartTime = null;
  let sessionStartTime = null;
  let sessionCompleted = false;

  // ----- DOM / Config -----
  const mediaType = document.body.getAttribute('data-media-type');
  const videoSource = document.body.getAttribute('data-video-source');

  const toNums = (s) =>
    s ? s.split(',').map(function (v) { return parseFloat(v); }).filter(Number.isFinite) : [];

  let timestampsEasy = toNums(
    document.body.getAttribute('data-timestamps-easy')
  );
  let timestampsMedium = toNums(
    document.body.getAttribute('data-timestamps-medium') ||
      document.body.getAttribute('data-timestamps-easy')
  );
  let timestampsHard = toNums(
    document.body.getAttribute('data-timestamps-hard')
  );

  const promptText =
    document.body.getAttribute('data-prompt-text') ||
    'Press the space bar to continue!';
  const pauseSoundSrc = document.body.getAttribute('data-pause-sound');

  const startButton = document.getElementById('control-panel-start-button');
  const overlayScreen = document.getElementById('overlay-screen');
  const playModeSelect = document.getElementById('control-panel-play-mode');
  const soundOptionsSelect = document.getElementById('sound-options-select');
  const soundVolumeSlider = document.getElementById('sound-volume-slider');
  const levelSelect = document.getElementById('level-select');
  const selectedDifficultyLabel = document.getElementById(
    'selected-difficulty-label'
  );
  const selectedSoundLabel = document.getElementById('selected-sound-label');
  const videoContainer = document.getElementById('video-container');
  const resultsScreen = document.getElementById('results-screen');
  const continueButton = document.getElementById('continue-button');
  const finalScoreElem = document.getElementById('final-score');
  const spaceBarAttemptsResult = document.getElementById(
    'space-bar-attempts-result'
  );
  const timeRatioElem = document.getElementById('time-ratio');
  const pdfPauseDurations = document.getElementById('pdf-pause-durations');
  const pdfAveragePause = document.getElementById('pdf-average-pause');
  const pdfStdDev = document.getElementById('pdf-std-dev');
  const pdfMedianPause = document.getElementById('pdf-median-pause');
  const pdfTimeRatio = document.getElementById('pdf-time-ratio');
  const pdfCauseEffectScore = document.getElementById('pdf-cause-effect-score');
  const pdfFinalScore = document.getElementById('pdf-final-score');
  const pdfSpaceBarAttempts = document.getElementById('pdf-space-bar-attempts');
  const pdfSessionDuration = document.getElementById('pdf-session-duration');
  const pdfLevel = document.getElementById('pdf-level');
  const pdfDifficulty = document.getElementById('pdf-difficulty');
  const pdfDate = document.getElementById('pdf-date');
  const pdfTime = document.getElementById('pdf-time');
  const pdfChosenImage = document.getElementById('pdf-chosen-image');
  const pdfChosenSound = document.getElementById('pdf-chosen-sound');
  const pdfStudentName = document.getElementById('pdf-student-name');
  const pdfSwitchType = document.getElementById('pdf-switch-type');
  const pdfSwitchPosition = document.getElementById('pdf-switch-position');
  const pdfStudentNameInput = document.getElementById('pdf-student-name-input');
  const pdfSwitchTypeInput = document.getElementById('pdf-switch-type-input');
  const pdfSwitchPositionInput = document.getElementById('pdf-switch-position-input');
  const downloadPdfButton = document.getElementById('download-pdf-button');
  const pdfInfoModal = document.getElementById('pdf-info-modal');
  const closePdfInfoModal = document.getElementById('close-pdf-info-modal');
  const pdfInfoOkButton = document.getElementById('pdf-info-ok-button');

  let mediaPlayer = null;
  if (mediaType === 'video') {
    mediaPlayer = document.getElementById('video-player');
    if (mediaPlayer && videoSource) mediaPlayer.src = videoSource;
  }

  // ----- Recording modal -----
  const recordModal = document.getElementById('record-modal');
  const recordButton = document.getElementById('record-button');
  const stopRecordingButton = document.getElementById('stop-recording-button');
  const okRecordingButton = document.getElementById('ok-recording-button');
  const closeRecordModal = document.getElementById('close-record-modal');
  const recordStatus = document.getElementById('record-status');

  // ----- Prompt / sound selection -----
  // NOTE: we'll set actual default in populateSoundOptions (prefer piano)
  let selectedSound = 'none';
  let currentSound = null;
  let recordedAudio = null;
  let mediaRecorder;
  let audioChunks = [];
  let soundVolume = soundVolumeSlider
    ? Math.min(
        Math.max(((Number(soundVolumeSlider.value) || 50) / 100), 0.01),
        1
      )
    : 1;

  const selectSpacePromptButton = document.getElementById(
    'select-space-prompt-button'
  );
  const spacePromptModal = document.getElementById('space-prompt-selection-modal');
  const closeSpacePromptModal = document.getElementById('close-space-prompt-modal');
  const spacePromptImagesContainer = document.getElementById('space-prompt-selection');
  const spacePromptOkButton = document.getElementById('apply-space-prompt');
  const textPromptInput = document.getElementById('text-prompt-input');

  // Provided by config.js (optional):
  // const spacePromptImages = [{src, alt:{en,fr}}...]
  // const spacePromptSounds = [{value, label:{en,fr}, src?}...]
  // const miscOptions       = [{id,label:{en,fr},defaultChecked}...]

  // IMPORTANT: undefined (so the default becomes first image; NOT "none")
  let selectedSpacePromptImage; // undefined on purpose
  let customTextPrompt = null;
  let selectedDifficulty = 'easy';
  let timestamps = [];
  let currentTimestampIndex = 0;
  let pausedAtTime = 0;
  let controlsEnabled = false;
  let pauseSoundInterval = null;
  let fadeOutTimeout = null;
  let hideTimeout = null;

  // ---- read config.js no matter how it was declared (const vs window.*) ----
  const getSpacePromptImages = () => {
    try { if (typeof spacePromptImages !== 'undefined') return spacePromptImages; } catch(e){}
    if (Array.isArray(window.spacePromptImages)) return window.spacePromptImages;
    return [];
  };
  const getSpacePromptSounds = () => {
    try { if (typeof spacePromptSounds !== 'undefined') return spacePromptSounds; } catch(e){}
    if (Array.isArray(window.spacePromptSounds)) return window.spacePromptSounds;
    return [];
  };
  const getMiscOptions = () => {
    try { if (typeof miscOptions !== 'undefined') return miscOptions; } catch(e){}
    if (Array.isArray(window.miscOptions)) return window.miscOptions;
    return [];
  };

  // Inject a text node inside the overlay for text prompts (if not present)
  let spacePromptText = document.getElementById('space-prompt-text');
  if (!spacePromptText && overlayScreen) {
    spacePromptText = document.createElement('div');
    spacePromptText.id = 'space-prompt-text';
    spacePromptText.className = 'space-prompt-text hidden';
    Object.assign(spacePromptText.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) scale(0.1)',
      color: '#fff',
      fontWeight: '900',
      textAlign: 'center',
      lineHeight: '1.1',
      textShadow: '0 2px 10px rgba(0,0,0,0.7)',
      opacity: '1',
      fontSize: 'min(12vw, 96px)',
      padding: '0.25em 0.4em',
      whiteSpace: 'pre-wrap'
    });
    overlayScreen.appendChild(spacePromptText);
  }

  // -------------------------
  // Helpers / UI binding
  // -------------------------
  function populateSpacePromptImages() {
    if (!spacePromptImagesContainer) return;
    spacePromptImagesContainer.innerHTML = '';
    const imgs = getSpacePromptImages();

    const lang = document.documentElement.lang || 'en';
    const noneText = lang === 'fr' ? '— Aucune image —' : '— No image —';

    // Determine initial selection (restore previous default = first image)
    if (typeof selectedSpacePromptImage === 'undefined') {
      selectedSpacePromptImage = (Array.isArray(imgs) && imgs.length) ? imgs[0].src : null;
    }

    // "no image" card
    const noneCard = document.createElement('div');
    noneCard.className = 'image-card';
    noneCard.dataset.src = ''; // indicates none
    noneCard.innerHTML = '<div style="width:140px;height:100px;display:flex;align-items:center;justify-content:center;border:2px dashed #888;border-radius:8px;font-weight:700;color:#666;background:rgba(255,255,255,0.85);">' + noneText + '</div>';
    if (selectedSpacePromptImage === null) noneCard.classList.add('selected');
    noneCard.addEventListener('click', function () {
      var cards = spacePromptImagesContainer.querySelectorAll('.image-card');
      for (var i = 0; i < cards.length; i++) cards[i].classList.remove('selected');
      noneCard.classList.add('selected');
      selectedSpacePromptImage = null; // choose "none"
      // keep customTextPrompt as-is (so user can do text-only)
    });
    spacePromptImagesContainer.appendChild(noneCard);

    // Real images
    if (Array.isArray(imgs) && imgs.length) {
      imgs.forEach(function (image) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.src = image.src;
        const alt = (image.alt && (image.alt[lang] || image.alt.en)) || '';
        card.innerHTML = '<img src="' + image.src + '" alt="' + alt.replace(/"/g, '&quot;') + '">';
        if (selectedSpacePromptImage === image.src) card.classList.add('selected');
        card.addEventListener('click', function () {
          var cards = spacePromptImagesContainer.querySelectorAll('.image-card');
          for (var i = 0; i < cards.length; i++) cards[i].classList.remove('selected');
          card.classList.add('selected');
          selectedSpacePromptImage = card.dataset.src;
        });
        spacePromptImagesContainer.appendChild(card);
      });
    }
  }

  // --- Image modal open/close helpers ---
  function openSpacePromptPicker() {
    populateSpacePromptImages();
    if (!spacePromptModal) return;
    spacePromptModal.classList.remove('hidden');
    spacePromptModal.style.display = 'block';
  }
  function closeSpacePromptPicker() {
    if (!spacePromptModal) return;
    spacePromptModal.classList.add('hidden');
    spacePromptModal.style.display = 'none';
  }

  function getSelectedOptionLabel(selectEl) {
    if (!selectEl) return '';
    const opt = selectEl.options[selectEl.selectedIndex];
    return opt ? opt.textContent.trim() : '';
  }

  function updateSummaryTexts() {
    if (selectedDifficultyLabel)
      selectedDifficultyLabel.textContent = getSelectedOptionLabel(playModeSelect);
    if (selectedSoundLabel)
      selectedSoundLabel.textContent = getSelectedOptionLabel(soundOptionsSelect);
  }

  function populateSoundOptions() {
    if (!soundOptionsSelect) return;

    // We want to restore default to 'piano-sound' when available
    const prev = soundOptionsSelect.value || selectedSound || 'piano-sound';
    soundOptionsSelect.innerHTML = '';

    const lang = document.documentElement.lang || 'en';
    const noneLabel = lang === 'fr' ? '— Aucun son —' : '— No sound —';

    // explicit none option (kept, but not selected by default)
    const noneOpt = document.createElement('option');
    noneOpt.value = 'none';
    noneOpt.textContent = noneLabel;
    soundOptionsSelect.appendChild(noneOpt);

    const sounds = getSpacePromptSounds();
    sounds.forEach(function (opt) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent =
        typeof opt.label === 'object'
          ? (opt.label[lang] || opt.label.en || '')
          : opt.label;
      soundOptionsSelect.appendChild(o);
    });

    // Prefer piano-sound if present; else prefer first real sound; else none
    var hasPrev = false;
    for (var i = 0; i < soundOptionsSelect.options.length; i++) {
      if (soundOptionsSelect.options[i].value === prev) { hasPrev = true; break; }
    }

    var hasPiano = false;
    for (var j = 0; j < soundOptionsSelect.options.length; j++) {
      if (soundOptionsSelect.options[j].value === 'piano-sound') { hasPiano = true; break; }
    }

    if (hasPrev && prev !== 'none') {
      soundOptionsSelect.value = prev;
      selectedSound = prev;
    } else if (hasPiano) {
      soundOptionsSelect.value = 'piano-sound';
      selectedSound = 'piano-sound';
    } else {
      // pick first real (non-none) if exists
      var picked = false;
      for (var k = 0; k < soundOptionsSelect.options.length; k++) {
        var v = soundOptionsSelect.options[k].value;
        if (v && v !== 'none') {
          soundOptionsSelect.value = v;
          selectedSound = v;
          picked = true;
          break;
        }
      }
      if (!picked) {
        soundOptionsSelect.value = 'none';
        selectedSound = 'none';
      }
    }

    updateSummaryTexts();
  }

  function loadConfig() {
    populateSoundOptions();
    selectedDifficulty = (playModeSelect && playModeSelect.value) || 'easy';
    switch (selectedDifficulty) {
      case 'easy':
        timestamps = timestampsEasy;
        break;
      case 'medium':
        timestamps = timestampsMedium;
        break;
      case 'hard':
        timestamps = timestampsHard;
        break;
      default:
        timestamps = [];
    }
    updateSummaryTexts();
  }

  if (playModeSelect) {
    playModeSelect.addEventListener('change', () => {
      selectedDifficulty = playModeSelect.value;
      switch (selectedDifficulty) {
        case 'easy':
          timestamps = timestampsEasy;
          break;
        case 'medium':
          timestamps = timestampsMedium;
          break;
        case 'hard':
          timestamps = timestampsHard;
          break;
        default:
          timestamps = [];
      }
      updateSummaryTexts();
    });
  }

  if (soundOptionsSelect) {
    soundOptionsSelect.addEventListener('change', () => {
      selectedSound = soundOptionsSelect.value;
      if (selectedSound === 'record-own') openRecordModal();
      updateSummaryTexts();
    });
  }

  if (soundVolumeSlider) {
    soundVolumeSlider.addEventListener('input', () => {
      const v = Number(soundVolumeSlider.value);
      soundVolume = Math.min(Math.max((isNaN(v) ? 50 : v) / 100, 0.01), 1);
      if (currentSound) currentSound.volume = soundVolume;
    });
  }

  function openRecordModal() {
    if (recordModal) recordModal.style.display = 'block';
  }

  if (closeRecordModal) {
    closeRecordModal.addEventListener('click', () => {
      recordModal.style.display = 'none';
    });
  }

  if (recordButton) {
    recordButton.addEventListener('click', () => {
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return;
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.start();
          audioChunks = [];
          mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
          mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/mp3' });
            recordedAudio = URL.createObjectURL(blob);
            if (recordStatus) recordStatus.textContent = 'Enregistrement complété!';
            if (okRecordingButton) okRecordingButton.style.display = 'block';
          };
          if (recordStatus) recordStatus.textContent = 'Enregistrement...';
          if (stopRecordingButton) stopRecordingButton.style.display = 'block';
          recordButton.style.display = 'none';
          setTimeout(stopRecording, 5000);
        })
        .catch(function () {
          if (recordStatus) recordStatus.textContent = "Erreur d'accès au microphone";
        });
    });
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      if (stopRecordingButton) stopRecordingButton.style.display = 'none';
      if (recordButton) recordButton.style.display = 'block';
    }
  }

  if (stopRecordingButton) {
    stopRecordingButton.addEventListener('click', stopRecording);
  }

  if (okRecordingButton) {
    okRecordingButton.addEventListener('click', () => {
      stopRecording();
      if (recordModal) recordModal.style.display = 'none';
      okRecordingButton.style.display = 'none';
      if (stopRecordingButton) stopRecordingButton.style.display = 'none';
      if (recordButton) recordButton.style.display = 'block';
      if (recordedAudio) {
        currentSound = new Audio(recordedAudio);
        try { currentSound.play().catch(function(){}); } catch (e) {}
      }
    });
  }

  function playPauseSound() {
    if (!selectedSound || selectedSound === 'none') return;
    if (currentSound) {
      currentSound.pause();
      currentSound.currentTime = 0;
    }
    if (selectedSound === 'record-own' && recordedAudio) {
      currentSound = new Audio(recordedAudio);
    } else if (selectedSound === 'pause-sound' && pauseSoundSrc) {
      currentSound = new Audio(pauseSoundSrc);
    } else {
      const sounds = getSpacePromptSounds();
      let opt = null;
      for (var i = 0; i < sounds.length; i++) {
        if (sounds[i].value === selectedSound) { opt = sounds[i]; break; }
      }
      if (opt && opt.src) currentSound = new Audio(opt.src);
    }
    if (currentSound) {
      currentSound.volume = soundVolume;
      try { currentSound.play().catch(function(){}); } catch (e) {}
    }
  }

  // -------------------------
  // Start
  // -------------------------
  if (startButton) {
    startButton.addEventListener('click', () => {
      if (!selectedDifficulty) {
        alert('Please select a game mode to start.');
        return;
      }
      if (levelSelect && !levelSelect.value) {
        alert('Please select a level to start.');
        return;
      }
      if (timestamps.length === 0) {
        alert('No timestamps defined for this level and game mode.');
        return;
      }

      // prime audio on user gesture (autoplay guard)
      try {
        const a = new Audio();
        a.muted = true;
        a.play().then(function(){ a.pause(); }).catch(function(){});
      } catch (e) {}

      loadConfig();
      sessionStartTime = Date.now();

      const elem = document.documentElement;
      const goFull =
        elem.requestFullscreen ||
        elem.mozRequestFullScreen ||
        elem.webkitRequestFullscreen ||
        elem.msRequestFullscreen;
      if (goFull) {
        try {
          goFull.call(elem);
        } catch (e) {}
      }

      const cp = document.getElementById('control-panel');
      if (cp) cp.style.display = 'none';

      currentTimestampIndex = 0;
      if (mediaPlayer) {
        mediaPlayer.currentTime = 0;
        if (videoContainer) {
          videoContainer.classList.remove('hidden');
          videoContainer.style.display = 'block';
        }
        mediaPlayer.addEventListener('timeupdate', handleTimeUpdate);
        mediaPlayer.addEventListener('ended', handleMediaEnd);
        try { mediaPlayer.play().catch(function(){}); } catch (e) {}
      }

      preventInput = true;
      if (overlayScreen) overlayScreen.classList.remove('show');
    });
  }

  // -------------------------
  // Pause overlays / timestamps
  // -------------------------
  function handleTimeUpdate() {
    if (!mediaPlayer) return;
    const t = mediaPlayer.currentTime;
    if (currentTimestampIndex < timestamps.length && t >= timestamps[currentTimestampIndex]) {
      mediaPlayer.pause();
      pausedAtTime = t;
      showOverlayScreen();
      currentTimestampIndex++;
    }
  }

  function animateShow(el) {
    el.classList.remove('hidden');
    el.style.transform = 'translate(-50%, -50%) scale(0.1)';
    el.style.opacity = '1';
    void el.offsetWidth;
    el.style.transform = 'translate(-50%, -50%) scale(1)';
  }
  function scheduleFadeAndHide(el) {
    fadeOutTimeout = setTimeout(function () {
      el.style.opacity = '0';
    }, 5000);
    hideTimeout = setTimeout(function () {
      el.classList.add('hidden');
      el.style.transform = 'translate(-50%, -50%) scale(0.1)';
      el.style.opacity = '1';
    }, 5500);
  }

  function showOverlayScreen() {
    if (!overlayScreen) return;

    overlayScreen.classList.add('show');
    controlsEnabled = true;
    preventInput = false;
    pauseStartTime = Date.now();

    const spacePromptImage = document.getElementById('space-prompt-image');

    if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
    if (hideTimeout) clearTimeout(hideTimeout);

    // TEXT if provided, else IMAGE (and allow "no image")
    if (customTextPrompt && spacePromptText) {
      if (spacePromptImage) {
        spacePromptImage.classList.add('hidden');
        spacePromptImage.style.opacity = '1';
        spacePromptImage.style.transform = 'translate(-50%, -50%) scale(0.1)';
      }
      spacePromptText.textContent = customTextPrompt;
      animateShow(spacePromptText);
      scheduleFadeAndHide(spacePromptText);
    } else if (spacePromptImage && selectedSpacePromptImage) {
      if (spacePromptText) {
        spacePromptText.classList.add('hidden');
        spacePromptText.style.opacity = '1';
        spacePromptText.style.transform = 'translate(-50%, -50%) scale(0.1)';
      }
      spacePromptImage.src = selectedSpacePromptImage;
      animateShow(spacePromptImage);
      scheduleFadeAndHide(spacePromptImage);
    }

    playPauseSound();
    pauseSoundInterval = setInterval(function () {
      if (customTextPrompt && spacePromptText) {
        spacePromptText.textContent = customTextPrompt;
        animateShow(spacePromptText);
        if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
        if (hideTimeout) clearTimeout(hideTimeout);
        scheduleFadeAndHide(spacePromptText);
      } else if (spacePromptImage && selectedSpacePromptImage) {
        spacePromptImage.src = selectedSpacePromptImage;
        animateShow(spacePromptImage);
        if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
        if (hideTimeout) clearTimeout(hideTimeout);
        scheduleFadeAndHide(spacePromptImage);
      }
      playPauseSound();
    }, 20000);
  }

  function hideOverlayScreen() {
    if (!overlayScreen) return;

    overlayScreen.classList.remove('show');
    controlsEnabled = false;

    if (fadeOutTimeout) {
      clearTimeout(fadeOutTimeout);
      fadeOutTimeout = null;
    }
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    if (pauseSoundInterval) {
      clearInterval(pauseSoundInterval);
      pauseSoundInterval = null;
    }

    const spacePromptImage = document.getElementById('space-prompt-image');
    if (spacePromptImage) {
      spacePromptImage.classList.add('hidden');
      spacePromptImage.style.transform = 'translate(-50%, -50%) scale(0.1)';
      spacePromptImage.style.opacity = '1';
    }
    if (spacePromptText) {
      spacePromptText.classList.add('hidden');
      spacePromptText.style.transform = 'translate(-50%, -50%) scale(0.1)';
      spacePromptText.style.opacity = '1';
    }

    if (pauseStartTime) {
      const dur = Date.now() - pauseStartTime;
      pauseDurations.push(dur);
      pauseStartTime = null;
    }

    preventInput = true;
    startMediaPlayback();
  }

  function startMediaPlayback() {
    if (!mediaPlayer) return;
    mediaPlayer.removeAttribute('controls');
    try { mediaPlayer.play().catch(function(){}); } catch (e) {}
    if (mediaType === 'video' && videoContainer) {
      videoContainer.style.display = 'block';
    }
  }

  function handleMediaEnd() {
    const vc = document.getElementById('video-container');
    if (vc) vc.style.display = 'none';

    sessionCompleted = true;

    const totalPauseTimeMs = pauseDurations.reduce((a, b) => a + b, 0);
    const totalPauseTime = totalPauseTimeMs / 1000;
    const sessionEndTime = Date.now();
    const totalSessionTimeMs = sessionStartTime ? sessionEndTime - sessionStartTime : 0;
    const totalSessionTime = totalSessionTimeMs / 1000;
    const totalActiveTime = Math.max(totalSessionTime - totalPauseTime, 0);

    if (spaceBarAttemptsResult) {
      spaceBarAttemptsResult.textContent =
        "Fréquence d'appuis au mauvais moment: " + spaceBarAttemptCount;
    }

    if (timeRatioElem) {
      if (totalSessionTime > 0) {
        const pausePercentage = (totalPauseTime / totalSessionTime) * 100;
        timeRatioElem.textContent = `Temps de pause: ${pausePercentage.toFixed(2)}%`;
      } else {
        timeRatioElem.textContent = 'Impossible de calculer le pourcentage.';
      }
    }

    const { average, stdDev } = computeStatistics(pauseDurations);
    if (pdfAveragePause) pdfAveragePause.textContent = average.toFixed(2);
    if (pdfStdDev) pdfStdDev.textContent = stdDev.toFixed(2);

    const median = computeMedian(pauseDurations);
    const pauseTrend = computePauseTrend(pauseDurations);
    if (pdfMedianPause) pdfMedianPause.textContent = median.toFixed(2);
    const pdfPauseTrend = document.getElementById('pdf-pause-trend');
    if (pdfPauseTrend) pdfPauseTrend.textContent = pauseTrend;

    if (pdfSessionDuration)
      pdfSessionDuration.textContent = totalSessionTime.toFixed(2);
    if (pdfPauseDurations) {
      pdfPauseDurations.textContent = pauseDurations.length
        ? pauseDurations.map((d) => (d / 1000).toFixed(2)).join(', ')
        : 'Aucune pause enregistrée.';
    }

    if (pdfSpaceBarAttempts)
      pdfSpaceBarAttempts.textContent = spaceBarAttemptCount;

    if (totalSessionTime > 0 && pdfTimeRatio) {
      const pausePercentage = (totalPauseTime / totalSessionTime) * 100;
      pdfTimeRatio.textContent = ` ${pausePercentage.toFixed(2)}%`;
    }

    const finalScore = calculateFinalScore(
      totalPauseTime,
      totalActiveTime,
      pauseDurations.length,
      spaceBarAttemptCount
    );

    if (finalScoreElem) {
      finalScoreElem.textContent = `Score: ${finalScore.toFixed(2)} / 1000`;
    }
    if (pdfFinalScore) pdfFinalScore.textContent = `${finalScore.toFixed(2)} / 1000`;

    const sessionLengthMin = totalSessionTime / 60;
    const tieredWrongCount = adjustedWrongCountTiered(
      spaceBarAttemptCount,
      sessionLengthMin
    );
    const totalPresses = pauseDurations.length + spaceBarAttemptCount;
    const wrongPressRatio = totalPresses > 0 ? tieredWrongCount / totalPresses : 0;
    let ratioPart = median / TIME_THRESHOLD;
    if (ratioPart > 1) ratioPart = 1;
    let baseCauseEffectScore =
      0.5 * (1 - ratioPart) + 0.5 * (1 - wrongPressRatio);
    const baseAllowed = totalSessionTime / 10;
    const maxAllowed = totalSessionTime / 3;
    let overPressPenalty = 0;
    if (spaceBarAttemptCount > baseAllowed) {
      overPressPenalty =
        (spaceBarAttemptCount - baseAllowed) / (maxAllowed - baseAllowed);
    }
    const penaltyWeight = 0.3;
    let finalCauseEffectScore =
      baseCauseEffectScore - penaltyWeight * overPressPenalty;
    if (finalCauseEffectScore < 0) finalCauseEffectScore = 0;
    if (finalCauseEffectScore > 1) finalCauseEffectScore = 1;
    if (pdfCauseEffectScore)
      pdfCauseEffectScore.textContent = `${(finalCauseEffectScore * 100).toFixed(
        2
      )}%`;

    const currentDate = new Date();
    if (pdfDate) pdfDate.textContent = currentDate.toLocaleDateString();
    if (pdfTime) pdfTime.textContent = currentDate.toLocaleTimeString();
    if (pdfLevel && levelSelect && levelSelect.selectedIndex >= 0) {
      pdfLevel.textContent = levelSelect.options[
        levelSelect.selectedIndex
      ].textContent.trim();
    }
    if (pdfDifficulty) {
      pdfDifficulty.textContent =
        selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
    }

    let chosenImageObj = null;
    const imgs = getSpacePromptImages();
    for (let i = 0; i < imgs.length; i++) {
      if (imgs[i].src === selectedSpacePromptImage) {
        chosenImageObj = imgs[i];
        break;
      }
    }
    if (pdfChosenImage && chosenImageObj) {
      pdfChosenImage.src = chosenImageObj.src;
    }

    const sounds = getSpacePromptSounds();
    let chosenSoundObj = null;
    for (let j = 0; j < sounds.length; j++) {
      if (sounds[j].value === selectedSound) {
        chosenSoundObj = sounds[j];
        break;
      }
    }
    if (pdfChosenSound) {
      if (chosenSoundObj && chosenSoundObj.label) {
        const lbl =
          typeof chosenSoundObj.label === 'object'
            ? chosenSoundObj.label.en || ''
            : chosenSoundObj.label;
        pdfChosenSound.textContent = lbl;
      } else {
        pdfChosenSound.textContent = 'Aucun son choisi.';
      }
    }

    if (resultsScreen) {
      resultsScreen.style.display = 'flex';
      resultsScreen.classList.add('show');
    }

    if (document.fullscreenElement) {
      try { document.exitFullscreen().catch(function(){}); } catch (e) {}
    }

    const cp = document.getElementById('control-panel');
    if (cp) cp.style.display = '';
  }

  // -------------------------
  // Keyboard / pointer guards
  // -------------------------
  let isSpaceKeyPressed = false;

  function handleSpacebarPress(event) {
    if (event.code !== 'Space' || isSpaceKeyPressed) return;
    isSpaceKeyPressed = true;

    if (preventInput) {
      spaceBarAttemptCount++;
      const attemptDisplay = document.getElementById('space-bar-attempts');
      if (attemptDisplay) {
        attemptDisplay.textContent = 'Space Bar Attempts: ' + spaceBarAttemptCount;
        attemptDisplay.style.display = 'block';
      }
      return;
    }
    if (controlsEnabled) {
      event.preventDefault();
      hideOverlayScreen();
      if (pausedAtTime > 0 && mediaPlayer) {
        mediaPlayer.currentTime = pausedAtTime;
        try { mediaPlayer.play().catch(function(){}); } catch (e) {}
        pausedAtTime = 0;
      }
    }
  }

  function handleSpacebarRelease(event) {
    if (event.code === 'Space') isSpaceKeyPressed = false;
  }

  document.addEventListener('keydown', handleSpacebarPress, true);
  document.addEventListener('keyup', handleSpacebarRelease, true);

  document.addEventListener(
    'keydown',
    function (e) {
      if (preventInput && e.code !== 'Space' && e.code !== 'F5') {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    false
  );

  ['mousedown', 'mousemove', 'touchstart', 'touchmove'].forEach(function (evt) {
    document.addEventListener(
      evt,
      function (e) {
        if (preventInput) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      false
    );
  });

  // -------------------------
  // Misc options
  // -------------------------
  const miscOptionsModal = document.getElementById('misc-options-modal');
  const closeMiscOptionsModal = document.getElementById('close-misc-options-modal');
  const miscOptionsOkButton = document.getElementById('misc-options-ok-button');
  const miscOptionsButton = document.getElementById('misc-options-button');
  const miscOptionsContainer = document.getElementById('misc-options-container');
  const miscOptionsState = {};

  function populateMiscOptions() {
    const opts = getMiscOptions();
    if (!miscOptionsContainer || !opts.length) return;

    miscOptionsContainer.innerHTML = '';
    const lang = document.documentElement.lang || 'en';

    opts.forEach(function (opt) {
      const wrap = document.createElement('div');
      wrap.classList.add('misc-option-wrapper');

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = opt.id;
      cb.checked = !!opt.defaultChecked;
      miscOptionsState[opt.id] = !!opt.defaultChecked;

      const label = document.createElement('label');
      label.htmlFor = opt.id;
      label.textContent =
        typeof opt.label === 'object'
          ? (opt.label[lang] || opt.label.en || '')
          : opt.label;
      label.style.color = 'black';

      wrap.appendChild(cb);
      wrap.appendChild(label);
      miscOptionsContainer.appendChild(wrap);

      cb.addEventListener('change', function () {
        miscOptionsState[opt.id] = cb.checked;
      });
    });
  }

  function loadMiscOptions() {
    populateMiscOptions();
  }

  if (
    miscOptionsModal &&
    closeMiscOptionsModal &&
    miscOptionsOkButton &&
    miscOptionsButton &&
    miscOptionsContainer
  ) {
    miscOptionsButton.addEventListener('click', () => {
      miscOptionsModal.style.display = 'block';
    });
    closeMiscOptionsModal.addEventListener('click', () => {
      miscOptionsModal.style.display = 'none';
    });
    miscOptionsOkButton.addEventListener('click', () => {
      miscOptionsModal.style.display = 'none';
      if (miscOptionsState['mouse-click-option']) {
        document.addEventListener('click', handleSpacebarPressEquivalent);
      } else {
        document.removeEventListener('click', handleSpacebarPressEquivalent);
      }
      if (miscOptionsState['right-click-next-option']) {
        document.addEventListener('contextmenu', handleRightClickNextVideo);
      } else {
        document.removeEventListener('contextmenu', handleRightClickNextVideo);
      }
    });
  }

  function handleRightClickNextVideo(e) {
    e.preventDefault();
    if (mediaPlayer) {
      mediaPlayer.currentTime = 0;
      try { mediaPlayer.play().catch(function(){}); } catch (err) {}
    }
  }

  function handleSpacebarPressEquivalent() {
    handleSpacebarPress({ code: 'Space', preventDefault: function () {} });
  }

  function handleEnterPause(e) {
    if (miscOptionsState['enter-pause-option'] && e.code === 'Enter') {
      e.preventDefault();
      pauseActivityAndShowPrompt();
    }
  }

  document.addEventListener('keydown', handleEnterPause);

  function pauseActivityAndShowPrompt() {
    if (mediaPlayer && !mediaPlayer.paused) {
      pausedAtTime = mediaPlayer.currentTime;
      mediaPlayer.pause();
    }
    showOverlayScreen();
  }

  // -------------------------
  // Space prompt picker wiring
  // -------------------------
  if (selectSpacePromptButton) {
    selectSpacePromptButton.addEventListener('click', openSpacePromptPicker);
  }
  if (closeSpacePromptModal) {
    closeSpacePromptModal.addEventListener('click', closeSpacePromptPicker);
  }
  if (spacePromptOkButton) {
    spacePromptOkButton.addEventListener('click', () => {
      customTextPrompt = (textPromptInput && textPromptInput.value ? textPromptInput.value : '').trim() || null;
      closeSpacePromptPicker();
    });
  }

  // -------------------------
  // Level selector (single listener)
  // -------------------------
  if (levelSelect) {
    levelSelect.addEventListener('change', () => {
      const opt = levelSelect.options[levelSelect.selectedIndex];
      if (!opt) return;

      const newSrc = opt.getAttribute('data-video-source') || videoSource || '';
      if (mediaPlayer) {
        mediaPlayer.src = newSrc;
        mediaPlayer.load();
      }

      timestampsEasy = toNums(opt.getAttribute('data-timestamps-easy'));
      timestampsMedium = toNums(
        opt.getAttribute('data-timestamps-medium') ||
          opt.getAttribute('data-timestamps-easy')
      );
      timestampsHard = toNums(opt.getAttribute('data-timestamps-hard'));

      switch (selectedDifficulty) {
        case 'easy':
          timestamps = timestampsEasy;
          break;
        case 'medium':
          timestamps = timestampsMedium;
          break;
        case 'hard':
          timestamps = timestampsHard;
          break;
        default:
          timestamps = [];
      }

      currentTimestampIndex = 0;
      pausedAtTime = 0;

      if (videoContainer) {
        videoContainer.classList.add('hidden');
        videoContainer.style.display = 'none';
      }
      if (startButton) startButton.classList.remove('hidden');
    });
  } else {
    if (startButton) startButton.classList.remove('hidden');
  }

  // -------------------------
  // Statistics helpers
  // -------------------------
  function computeStatistics(durations) {
    if (!durations.length) return { average: 0, stdDev: 0 };
    const pausesInSeconds = durations.map((d) => d / 1000);
    const N = pausesInSeconds.length;
    const sum = pausesInSeconds.reduce((a, b) => a + b, 0);
    const average = sum / N;
    let stdDev = 0;
    if (N > 1) {
      const variance =
        pausesInSeconds.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) /
        (N - 1);
      stdDev = Math.sqrt(variance);
    }
    return { average, stdDev };
  }

  function computeMedian(durations) {
    if (!durations.length) return 0;
    const sorted = durations
      .slice()
      .sort((a, b) => a - b)
      .map((d) => d / 1000);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  function computePauseTrend(durations) {
    if (durations.length < 2) return 'Insufficient data';
    let increasing = 0;
    let decreasing = 0;
    for (let i = 1; i < durations.length; i++) {
      if (durations[i] > durations[i - 1]) increasing++;
      else if (durations[i] < durations[i - 1]) decreasing++;
    }
    if (increasing > decreasing) return 'Croissant';
    if (decreasing > increasing) return 'Décroissant';
    return 'Stable';
  }

  function adjustedWrongCountTiered(x, sessionLengthMin) {
    const TIER_SIZE = 2 * sessionLengthMin;
    const tier1Max = TIER_SIZE;
    const tier2Max = 2 * TIER_SIZE;
    const tier3Max = 3 * TIER_SIZE;

    let adjusted = 0;
    let remaining = x;

    const tier1Presses = Math.min(remaining, tier1Max);
    adjusted += tier1Presses * 0;
    remaining -= tier1Presses;

    const tier2Presses = Math.min(remaining, tier2Max - tier1Max);
    adjusted += tier2Presses * 0.34;
    remaining -= tier2Presses;

    const tier3Presses = Math.min(remaining, tier3Max - tier2Max);
    adjusted += tier3Presses * 0.67;
    remaining -= tier3Presses;

    adjusted += remaining;

    return adjusted;
  }

  function calculateRPA(totalPauseTime, totalActiveTime) {
    if (totalActiveTime === 0) return 0;
    return totalPauseTime / totalActiveTime;
  }

  function calculateAveragePauseTime(totalPauseTime, numberOfPauses) {
    if (numberOfPauses === 0) return 0;
    return totalPauseTime / numberOfPauses;
  }

  function calculateNormalizedAPT(apt) {
    const normalizedAPT = (apt / MAX_AVG_PAUSE_TIME) * 100;
    return Math.min(normalizedAPT, 100);
  }

  function calculateNSPPenalty(nsp) {
    const cappedNSP = Math.min(nsp, NSP_CAP);
    return cappedNSP * WEIGHT_NSP;
  }

  function calculateFinalScore(totalPauseTime, totalActiveTime, numberOfPauses, nsp) {
    const rpa = calculateRPA(totalPauseTime, totalActiveTime);
    const apt = calculateAveragePauseTime(totalPauseTime, numberOfPauses);
    const normalizedAPT = calculateNormalizedAPT(apt);
    const aptPenalty = (normalizedAPT / 100) * WEIGHT_APT;
    const rpaPenalty = rpa * WEIGHT_RPA;
    const nspPenalty = calculateNSPPenalty(nsp);
    const finalScore = 1000 - rpaPenalty - aptPenalty - nspPenalty;
    return Math.max(finalScore, 0);
  }

  // -------------------------
  // Results actions
  // -------------------------
  if (continueButton) {
    continueButton.addEventListener('click', () => {
      location.reload();
    });
  }

  // -------------------------
  // PDF generation logic
  // -------------------------
  if (downloadPdfButton && pdfInfoOkButton && pdfInfoModal) {
    downloadPdfButton.addEventListener('click', () => {
      preventInput = false;
      pdfInfoModal.style.display = 'block';
    });

    if (closePdfInfoModal) {
      closePdfInfoModal.addEventListener('click', () => {
        pdfInfoModal.style.display = 'none';
      });
    }

    pdfInfoOkButton.addEventListener('click', async () => {
      if (pdfStudentName)
        pdfStudentName.textContent =
          (pdfStudentNameInput && pdfStudentNameInput.value.trim()) || 'Not Provided';
      if (pdfSwitchType)
        pdfSwitchType.textContent =
          (pdfSwitchTypeInput && pdfSwitchTypeInput.value.trim()) || 'Not Provided';
      if (pdfSwitchPosition)
        pdfSwitchPosition.textContent =
          (pdfSwitchPositionInput && pdfSwitchPositionInput.value.trim()) || 'Not Provided';

      pdfInfoModal.style.display = 'none';

      const pdfSectionPage1 = document.getElementById('pdf-summary-page1');
      const pdfSectionPage2 = document.getElementById('pdf-summary-page2');
      if (!pdfSectionPage1 || !pdfSectionPage2 || !window.jspdf || !window.html2canvas) {
        return;
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'pt', 'a4');

      const canvas1 = await html2canvas(pdfSectionPage1, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });
      const imgData1 = canvas1.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 80;
      const aspectRatio = canvas1.width / canvas1.height;
      const imgHeight = imgWidth / aspectRatio;
      pdf.addImage(imgData1, 'PNG', 40, 40, imgWidth, imgHeight);

      pdf.addPage();

      const canvas2 = await html2canvas(pdfSectionPage2, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });
      const imgData2 = canvas2.toDataURL('image/png');
      const pageWidth2 = pdf.internal.pageSize.getWidth();
      const imgWidth2 = pageWidth2 - 80;
      const aspectRatio2 = canvas2.width / canvas2.height;
      const imgHeight2 = imgWidth2 / aspectRatio2;
      pdf.addImage(imgData2, 'PNG', 40, 40, imgWidth2, imgHeight2);

      pdf.save('Rapport_Switch.pdf');
    });
  }

  // -------------------------
  // Boot
  // -------------------------
  populateSpacePromptImages();
  loadMiscOptions();
  loadConfig();
  if (levelSelect && levelSelect.value) {
    levelSelect.dispatchEvent(new Event('change'));
  }
});
