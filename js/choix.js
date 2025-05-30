document.addEventListener('DOMContentLoaded', () => {
  const gameOptionsModal = document.getElementById('game-options');
  const tileCountInput = document.getElementById('tile-count');
  const tileSliderContainer = document.getElementById('tile-slider-container');
  const tileCountContainer = document.getElementById('game-options-controls');
  const chooseTilesButton = document.getElementById('choose-tiles-button');
  const modeChoiceButton = document.getElementById('mode-choice-button');
  const modeScanButton = document.getElementById('mode-scan-button');
  const modeThisOrThatButton = document.getElementById('mode-thisOrThat-button');
  const modeFlashcardButton = document.getElementById('mode-flashcard-button');
  const modeFlashcardManualButton = document.getElementById('mode-flashcard-manual-button');
  const scanDelayContainer = document.getElementById('scan-delay-container');
  const scanDelayInput = document.getElementById('scan-delay');
  const previewEqualsScanCheckbox = document.getElementById('preview-equals-scan');
  const previewEqualsScanContainer = previewEqualsScanCheckbox.parentElement.parentElement;
  const enableCycleSoundCheckbox = document.getElementById('enable-cycle-sound');
  const enableTimeLimitCheckbox = document.getElementById('enable-time-limit');
  const timeLimitContainer = document.getElementById('time-limit-container');
  const timeLimitInput = document.getElementById('time-limit-seconds');
  const resumeVideoContainer = document.getElementById('resume-video-container');
  const enableResumeVideoCheckbox = document.getElementById('enable-resume-video');
  const tilePickerModal = document.getElementById('tile-picker-modal');
  const tilePickerGrid = document.getElementById('tile-picker-grid');
  const tileCountDisplay = document.getElementById('tile-count-display');
  const startGameButton = document.getElementById('start-game-button');
  const categorySelect = document.getElementById('categorySelect');
  const tileContainer = document.getElementById('tile-container');
  const videoContainer = document.getElementById('video-container');
  const videoPlayer = document.getElementById('video-player');
  const videoSource = document.getElementById('video-source');

  // Hide the preview-equals-scan option until relevant
  previewEqualsScanContainer.style.display = 'none';

  let inputEnabled = false;

  // Game state
  let mode = "choice";
  let desiredTileCount = 0;
  let selectedTileIndices = [];
  let currentSelectedIndex = 0;
  let videoPlaying = false;
  let autoScanInterval = null;
  let scanningActive = false;
  let flashcardTimer = null;
  let flashcardActive = false;
  let currentPreview = null;
  let previewTimeout = null;
  let previewDelayTimeout = null;
  let preventAutoPreview = false;
  let inactivityTimer = null;
  let videoTimeLimitTimeout = null;
  let videoResumePositions = {};
  let currentCategory = "all";

  // Inactivity timer helpers
  function clearInactivityTimer() {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  }
  function startInactivityTimer() {
    clearInactivityTimer();
    // default 30s, or (scanTime - 500ms) if checkbox checked
    let inactivityMs = 30000;
    if (previewEqualsScanCheckbox.checked) {
      const scanMs = (parseInt(scanDelayInput.value, 10) || 3) * 1000;
      inactivityMs = Math.max(scanMs - 500, 0);
    }
    inactivityTimer = setTimeout(() => {
      if (!videoPlaying && !preventAutoPreview) {
        playPreviewForTile(currentSelectedIndex);
      }
    }, inactivityMs);
  }
  function resetInactivityTimer() {
    if (!videoPlaying) startInactivityTimer();
  }

  tileCountInput.addEventListener('input', () => {
    document.getElementById('tile-count-value').textContent = tileCountInput.value;
  });

  function stopPreview() {
    if (currentPreview) {
      currentPreview.pause();
      currentPreview.currentTime = 0;
      currentPreview = null;
    }
    if (previewTimeout) {
      clearTimeout(previewTimeout);
      previewTimeout = null;
    }
    if (previewDelayTimeout) {
      clearTimeout(previewDelayTimeout);
      previewDelayTimeout = null;
    }
    startInactivityTimer();
  }

  function playCycleSound() {
    if (enableCycleSoundCheckbox.checked) {
      new Audio("../../sounds/woosh.mp3").play().catch(console.error);
    }
  }

  function preloadVideos(videoUrls, loadingIndicator) {
    let loaded = 0;
    return Promise.all(videoUrls.map(url => new Promise(resolve => {
      const vid = document.createElement('video');
      vid.preload = 'auto';
      vid.src = url;
      vid.addEventListener('canplaythrough', () => {
        loaded++;
        loadingIndicator.textContent = `Chargement... (${loaded}/${videoUrls.length})`;
        resolve();
      });
      vid.addEventListener('error', () => {
        loaded++;
        loadingIndicator.textContent = `Chargement... (${loaded}/${videoUrls.length})`;
        console.error("Error preloading", url);
        resolve();
      });
    })));
  }

  function pauseGameActivity() {
    stopPreview();
    if (autoScanInterval) {
      clearInterval(autoScanInterval);
      autoScanInterval = null;
      scanningActive = true;
    } else scanningActive = false;
    if (flashcardTimer) {
      clearTimeout(flashcardTimer);
      flashcardTimer = null;
      flashcardActive = true;
    } else flashcardActive = false;
    videoPlaying = true;
  }

  function resumeGameActivity() {
    videoPlaying = false;
    if (scanningActive && mode === "scan") {
      scanningActive = false;
      const d = parseInt(scanDelayInput.value, 10) || 3;
      autoScanInterval = setInterval(cycleToNextTile, d * 1000);
    }
    if (flashcardActive && mode === "flashcard") {
      flashcardActive = false;
      startFlashcardTimer();
    }
    resetInactivityTimer();
  }

  function resetTileCountToDefault() {
    tileCountInput.value = 3;
    document.getElementById('tile-count-value').textContent = 3;
    tileCountInput.disabled = false;
  }

  function showScanOptions(show) {
    scanDelayContainer.style.display = show ? 'block' : 'none';
    previewEqualsScanContainer.style.display = show ? 'block' : 'none';
  }

  // Mode buttons
  modeChoiceButton.addEventListener('click', () => {
    mode = "choice";
    modeChoiceButton.classList.add('selected');
    [modeScanButton, modeThisOrThatButton, modeFlashcardButton, modeFlashcardManualButton]
      .forEach(b => b.classList.remove('selected'));
    resetTileCountToDefault();
    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    showScanOptions(false);
    document.body.classList.remove('this-or-that-mode', 'flashcard-mode');
  });

  modeScanButton.addEventListener('click', () => {
    mode = "scan";
    modeScanButton.classList.add('selected');
    [modeChoiceButton, modeThisOrThatButton, modeFlashcardButton, modeFlashcardManualButton]
      .forEach(b => b.classList.remove('selected'));
    resetTileCountToDefault();
    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    showScanOptions(true);
    document.body.classList.remove('this-or-that-mode', 'flashcard-mode');
  });

  modeThisOrThatButton.addEventListener('click', () => {
    mode = "thisOrThat";
    modeThisOrThatButton.classList.add('selected');
    [modeChoiceButton, modeScanButton, modeFlashcardButton, modeFlashcardManualButton]
      .forEach(b => b.classList.remove('selected'));
    tileCountInput.value = 2;
    document.getElementById('tile-count-value').textContent = 2;
    tileCountInput.disabled = true;
    tileSliderContainer.style.visibility = 'hidden';
    showScanOptions(false);
    document.body.classList.add('this-or-that-mode');
    document.body.classList.remove('flashcard-mode');
  });

  modeFlashcardButton.addEventListener('click', () => {
    mode = "flashcard";
    modeFlashcardButton.classList.add('selected');
    [modeChoiceButton, modeScanButton, modeThisOrThatButton, modeFlashcardManualButton]
      .forEach(b => b.classList.remove('selected'));
    resetTileCountToDefault();
    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    showScanOptions(true);
    document.body.classList.add('flashcard-mode');
    document.body.classList.remove('this-or-that-mode');
  });

  modeFlashcardManualButton.addEventListener('click', () => {
    mode = "flashcard-manual";
    modeFlashcardManualButton.classList.add('selected');
    [modeChoiceButton, modeScanButton, modeThisOrThatButton, modeFlashcardButton]
      .forEach(b => b.classList.remove('selected'));
    resetTileCountToDefault();
    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    showScanOptions(false);
    document.body.classList.add('flashcard-mode');
    document.body.classList.remove('this-or-that-mode');
  });

  // Time-limit toggle
  enableTimeLimitCheckbox.addEventListener('change', () => {
    const show = enableTimeLimitCheckbox.checked;
    timeLimitContainer.style.display = show ? 'block' : 'none';
    resumeVideoContainer.style.display = show ? 'block' : 'none';
  });

  // Tile picker
  function populateTilePickerGrid() {
    tilePickerGrid.innerHTML = '';
    const inCat = document.createElement('div');
    inCat.style.display = 'flex';
    inCat.style.flexWrap = 'wrap';
    inCat.style.gap = '10px';
    const outCat = document.createElement('div');
    outCat.style.display = 'flex';
    outCat.style.flexWrap = 'wrap';
    outCat.style.gap = '10px';

    mediaChoices.forEach((choice, idx) => {
      const matches = currentCategory === 'all' ||
        (typeof choice.category === 'string' && choice.category === currentCategory) ||
        (Array.isArray(choice.category) && choice.category.includes(currentCategory));
      const isSel = selectedTileIndices.includes(idx);
      if (matches || isSel) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.dataset.index = idx;
        tile.style.backgroundImage = `url(${choice.image})`;
        if (isSel) tile.classList.add('selected');
        const cap = document.createElement('div');
        cap.classList.add('caption');
        cap.textContent = choice.name;
        tile.appendChild(cap);
        tile.addEventListener('click', () => {
          resetInactivityTimer();
          if (isSel) {
            selectedTileIndices = selectedTileIndices.filter(i => i !== idx);
          } else if (selectedTileIndices.length < desiredTileCount) {
            selectedTileIndices.push(idx);
          }
          updateStartButtonState();
          populateTilePickerGrid();
        });
        if (matches) inCat.appendChild(tile);
        else outCat.appendChild(tile);
      }
    });

    tilePickerGrid.appendChild(inCat);
    if (outCat.childNodes.length) {
      const sep = document.createElement('div');
      sep.style.width = '100%';
      sep.style.height = '2px';
      sep.style.backgroundColor = '#ccc';
      sep.style.margin = '10px 0';
      tilePickerGrid.appendChild(sep);
      tilePickerGrid.appendChild(outCat);
    }
  }

  function updateStartButtonState() {
    startGameButton.disabled = selectedTileIndices.length !== desiredTileCount;
  }

  // Render flashcard
  function renderFlashcard() {
    tileContainer.innerHTML = '';
    const idx = selectedTileIndices[currentSelectedIndex];
    const choice = mediaChoices[idx];
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.style.backgroundImage = `url(${choice.image})`;
    const cap = document.createElement('div');
    cap.classList.add('caption');
    cap.textContent = choice.name;
    tile.appendChild(cap);
    tileContainer.appendChild(tile);
    tileContainer.style.display = 'flex';
    playPreviewForTile(currentSelectedIndex);
  }

  function clearFlashcardTimer() {
    if (flashcardTimer) {
      clearTimeout(flashcardTimer);
      flashcardTimer = null;
    }
  }

  function startFlashcardTimer() {
    clearFlashcardTimer();
    const d = parseInt(scanDelayInput.value, 10) || 10;
    flashcardTimer = setTimeout(() => {
      playCycleSound();
      currentSelectedIndex = (currentSelectedIndex + 1) % selectedTileIndices.length;
      renderFlashcard();
      startFlashcardTimer();
    }, d * 1000);
    flashcardActive = true;
  }

  // Render non-flashcard modes
  function renderGameTiles() {
    if (mode === 'flashcard') {
      renderFlashcard();
      startFlashcardTimer();
    } else if (mode === 'flashcard-manual') {
      renderFlashcard();
    } else {
      tileContainer.innerHTML = '';
      const tiles = selectedTileIndices.map(i => mediaChoices[i]);
      tiles.forEach((choice, idx) => {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.dataset.index = idx;
        tile.style.backgroundImage = `url(${choice.image})`;
        const cap = document.createElement('div');
        cap.classList.add('caption');
        cap.textContent = choice.name;
        tile.appendChild(cap);
        if (mode === 'thisOrThat') {
          tile.classList.add(idx === 0 ? 'selected-left' : 'selected-right');
        }
        tileContainer.appendChild(tile);
      });
      if (selectedTileIndices.length === 4) tileContainer.classList.add('grid-2x2');
      else tileContainer.classList.remove('grid-2x2');
      tileContainer.style.display = 'flex';
      currentSelectedIndex = 0;
      if (mode !== 'thisOrThat') updateSelection();
      if (mode === 'scan') {
        scanningActive = true;
        const d = parseInt(scanDelayInput.value, 10) || 3;
        autoScanInterval = setInterval(cycleToNextTile, d * 1000);
      }
    }
  }

  function updateSelection() {
    if (mode === 'thisOrThat' || mode === 'flashcard') return;
    const tiles = document.querySelectorAll('#tile-container .tile');
    tiles.forEach((t, i) => t.classList.toggle('selected', i === currentSelectedIndex));
    if (!videoPlaying && !preventAutoPreview) {
      if (previewDelayTimeout) clearTimeout(previewDelayTimeout);
      previewDelayTimeout = setTimeout(() => {
        playPreviewForTile(currentSelectedIndex);
      }, 1200);
    }
  }

  function cycleToNextTile() {
    stopPreview();
    const tiles = document.querySelectorAll('#tile-container .tile');
    if (!tiles.length) return;
    currentSelectedIndex = (currentSelectedIndex + 1) % tiles.length;
    updateSelection();
    playCycleSound();
  }

  function playPreviewForTile(idx) {
    if (mode === 'thisOrThat') return;
    stopPreview();
    if (!selectedTileIndices.length) return;
    const mediaIdx = selectedTileIndices[idx];
    const videoFile = mediaChoices[mediaIdx].video;
    if (videoFile) {
      currentPreview = new Audio(videoFile);
      currentPreview.play().catch(console.error);
      // default 10s, or (scanTime - 500ms) if checked
      let ms = 10000;
      if (previewEqualsScanCheckbox.checked) {
        const scanMs = (parseInt(scanDelayInput.value, 10) || 3) * 1000;
        ms = Math.max(scanMs - 500, 0);
      }
      previewTimeout = setTimeout(stopPreview, ms);
    }
  }

  function resetToChoicesScreen() {
    stopPreview();
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    if (autoScanInterval) clearInterval(autoScanInterval);
    scanningActive = false;
    clearFlashcardTimer();
    flashcardActive = false;
    if (videoTimeLimitTimeout) clearTimeout(videoTimeLimitTimeout);
    videoPlaying = false;
    preventAutoPreview = true;
    setTimeout(() => {
      preventAutoPreview = false;
      updateSelection();
    }, 1200);
    tileContainer.style.display = 'flex';
    videoContainer.style.display = 'none';
    if (mode === 'scan') {
      const d = parseInt(scanDelayInput.value, 10) || 3;
      autoScanInterval = setInterval(cycleToNextTile, d * 1000);
      scanningActive = true;
    }
  }

  document.addEventListener('keydown', e => {
    if (!inputEnabled) return;
    resetInactivityTimer();
    if (videoPlaying && e.key === 'Backspace') {
      e.preventDefault();
      resetToChoicesScreen();
      return;
    }
    if (videoPlaying) return;
    if ((mode === 'flashcard' || mode === 'flashcard-manual') && e.key === ' ') {
      e.preventDefault();
      if (mode === 'flashcard') {
        clearFlashcardTimer();
        flashcardActive = false;
      }
      playVideo(mediaChoices[selectedTileIndices[currentSelectedIndex]].video);
      return;
    }
    if (mode === 'flashcard-manual' && e.key === 'Enter') {
      e.preventDefault();
      playCycleSound();
      currentSelectedIndex = (currentSelectedIndex + 1) % selectedTileIndices.length;
      renderFlashcard();
      return;
    }
    if (mode === 'thisOrThat' && selectedTileIndices.length === 2) {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        playVideo(mediaChoices[selectedTileIndices[0]].video);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        playVideo(mediaChoices[selectedTileIndices[1]].video);
        return;
      }
    }
    const tiles = document.querySelectorAll('#tile-container .tile');
    if (!tiles.length) return;
    const total = tiles.length;
    if (mode === 'choice' && e.key === 'Enter') {
      cycleToNextTile();
    } else if (e.key === 'ArrowRight') {
      currentSelectedIndex = (currentSelectedIndex + 1) % total;
      updateSelection();
    } else if (e.key === 'ArrowLeft') {
      currentSelectedIndex = (currentSelectedIndex - 1 + total) % total;
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      const cols = Math.floor(Math.sqrt(total)) || 1;
      currentSelectedIndex = (currentSelectedIndex - cols + total) % total;
      updateSelection();
    } else if (e.key === 'ArrowDown') {
      const cols = Math.floor(Math.sqrt(total)) || 1;
      currentSelectedIndex = (currentSelectedIndex + cols) % total;
      updateSelection();
    } else if (e.key === ' ' && mode !== 'flashcard') {
      e.preventDefault();
      playVideo(mediaChoices[selectedTileIndices[currentSelectedIndex]].video);
    }
  });

  function playVideo(videoUrl) {
    pauseGameActivity();
    tileContainer.style.display = 'none';
    tilePickerModal.style.display = 'none';
    gameOptionsModal.style.display = 'none';
    videoContainer.style.display = 'flex';
    videoSource.src = videoUrl;
    videoPlayer.removeAttribute('controls');
    videoPlayer.load();
    videoPlayer.onloadedmetadata = () => {
      if (enableResumeVideoCheckbox.checked && videoResumePositions[videoUrl]) {
        videoPlayer.currentTime = videoResumePositions[videoUrl];
      }
      videoPlayer.play();
    };
    if (videoContainer.requestFullscreen) {
      videoContainer.requestFullscreen().catch(() => {});
    } else if (videoContainer.webkitRequestFullscreen) {
      videoContainer.webkitRequestFullscreen();
    }
    if (enableTimeLimitCheckbox.checked) {
      const limit = parseInt(timeLimitInput.value, 10) || 60;
      if (videoTimeLimitTimeout) clearTimeout(videoTimeLimitTimeout);
      videoTimeLimitTimeout = setTimeout(() => {
        if (videoPlaying) {
          if (enableResumeVideoCheckbox.checked) {
            videoResumePositions[videoUrl] = videoPlayer.currentTime;
          } else {
            delete videoResumePositions[videoUrl];
          }
          videoPlayer.pause();
          resetToChoicesScreen();
        }
      }, limit * 1000);
    }
  }

  videoPlayer.addEventListener('ended', () => {
    delete videoResumePositions[videoSource.src];
    videoPlaying = false;
    videoContainer.style.display = 'none';
    if (mode === 'flashcard') {
      currentSelectedIndex = (currentSelectedIndex + 1) % selectedTileIndices.length;
      renderFlashcard();
      startFlashcardTimer();
    }
    resumeGameActivity();
    tileContainer.style.display = 'flex';
  });

  chooseTilesButton.addEventListener('click', () => {
    desiredTileCount = (mode === 'thisOrThat') ? 2 : (parseInt(tileCountInput.value, 10) || 0);
    tileCountDisplay.textContent = desiredTileCount;
    selectedTileIndices = [];
    updateStartButtonState();
    gameOptionsModal.style.display = 'none';
    tilePickerModal.style.display = 'flex';
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    }
    currentCategory = 'all';
    categorySelect.value = 'all';
    populateTilePickerGrid();
  });

  startGameButton.addEventListener('click', () => {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    Object.assign(loadingScreen.style, {
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      color: 'white', fontSize: '24px', zIndex: '9999'

    });
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    const urls = selectedTileIndices.map(i => mediaChoices[i].video).filter(u => u);
    loadingIndicator.textContent = `Chargement... (0 / ${urls.length})`;
    loadingScreen.appendChild(loadingIndicator);
    document.body.appendChild(loadingScreen);

    void loadingScreen.offsetWidth;
    requestAnimationFrame(() => {
      setTimeout(() => {
        preloadVideos(urls, loadingIndicator).then(() => {
          document.body.removeChild(loadingScreen);
          if (mode === 'flashcard') {
            renderFlashcard(); startFlashcardTimer();
          } else if (mode === 'flashcard-manual') {
            renderFlashcard();
          } else {
            renderGameTiles();
          }
          tilePickerModal.style.display = 'none';
          tileContainer.style.display = 'flex';
          startInactivityTimer();
          setTimeout(() => { inputEnabled = true; }, 2000);
        });
      }, 100);
    });
  });

  categorySelect.addEventListener('change', e => {
    currentCategory = e.target.value;
    populateTilePickerGrid();
  });

  // Disable keyboard input until game starts
  inputEnabled = false;
});
