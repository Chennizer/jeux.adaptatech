document.addEventListener('DOMContentLoaded', () => {
  const gameOptionsModal = document.getElementById('game-options');
  const tileCountInput = document.getElementById('tile-count');
  const tileSliderContainer = document.getElementById('tile-slider-container'); // Container for the tile slider only
  const tileCountContainer = document.getElementById('game-options-controls');
  const chooseTilesButton = document.getElementById('choose-tiles-button');
  const modeChoiceButton = document.getElementById('mode-choice-button');
  const modeScanButton = document.getElementById('mode-scan-button');
  const modeThisOrThatButton = document.getElementById('mode-thisOrThat-button');
  const modeFlashcardButton = document.getElementById('mode-flashcard-button');
  const modeFlashcardManualButton = document.getElementById('mode-flashcard-manual-button');
  const scanDelayContainer = document.getElementById('scan-delay-container');
  const scanDelayInput = document.getElementById('scan-delay');
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

  // Variables to hold game state
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

  // Inactivity timer functions
  function clearInactivityTimer() {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  }
  function startInactivityTimer() {
    clearInactivityTimer();
    inactivityTimer = setTimeout(() => {
      if (!videoPlaying && !preventAutoPreview) {
        playPreviewForTile(currentSelectedIndex);
      }
    }, 30000);
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
      const cycleSound = new Audio("../../sounds/woosh.mp3");
      cycleSound.play().catch(err => console.error("Cycle sound error:", err));
    }
  }

  function preloadVideos(videoUrls, loadingIndicator) {
    let loadedCount = 0;
    const totalCount = videoUrls.length;
    return Promise.all(videoUrls.map(url => {
      return new Promise((resolve) => {
        const tempVid = document.createElement('video');
        tempVid.preload = 'auto';
        tempVid.src = url;
        tempVid.addEventListener('canplaythrough', () => {
          loadedCount++;
          loadingIndicator.textContent = `Chargement... (${loadedCount}/${totalCount})`;
          resolve(url);
        });
        tempVid.addEventListener('error', () => {
          loadedCount++;
          loadingIndicator.textContent = `Chargement... (${loadedCount}/${totalCount})`;
          console.error("Error preloading video:", url);
          resolve(url);
        });
      });
    }));
  }

  function pauseGameActivity() {
    stopPreview();
    if (autoScanInterval) {
      clearInterval(autoScanInterval);
      autoScanInterval = null;
      scanningActive = true;
    } else {
      scanningActive = false;
    }
    if (flashcardTimer) {
      clearTimeout(flashcardTimer);
      flashcardTimer = null;
      flashcardActive = true;
    } else {
      flashcardActive = false;
    }
    videoPlaying = true;
  }

  function resumeGameActivity() {
    videoPlaying = false;
    if (scanningActive && mode === "scan") {
      scanningActive = false;
      const delay = parseInt(scanDelayInput.value, 10) || 3;
      autoScanInterval = setInterval(() => {
        cycleToNextTile();
      }, delay * 1000);
    }
    if (flashcardActive && mode === "flashcard") {
      flashcardActive = false;
      startFlashcardTimer();
    }
    resetInactivityTimer();
  }

  // Helper function to reset tile count back to default (3)
  function resetTileCountToDefault() {
    tileCountInput.value = 3;
    document.getElementById('tile-count-value').textContent = 3;
    tileCountInput.disabled = false;
  }

  // Mode selection events
  modeChoiceButton.addEventListener('click', () => {
    mode = "choice";
    modeChoiceButton.classList.add('selected');
    modeScanButton.classList.remove('selected');
    modeThisOrThatButton.classList.remove('selected');
    modeFlashcardButton.classList.remove('selected');
    modeFlashcardManualButton.classList.remove('selected');

    // Restore tile count to default
    resetTileCountToDefault();

    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    scanDelayContainer.style.display = 'none';
    document.body.classList.remove('this-or-that-mode', 'flashcard-mode');
  });

  modeScanButton.addEventListener('click', () => {
    mode = "scan";
    modeScanButton.classList.add('selected');
    modeChoiceButton.classList.remove('selected');
    modeThisOrThatButton.classList.remove('selected');
    modeFlashcardButton.classList.remove('selected');
    modeFlashcardManualButton.classList.remove('selected');

    // Restore tile count to default
    resetTileCountToDefault();

    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    scanDelayContainer.style.display = 'block';
    document.body.classList.remove('this-or-that-mode', 'flashcard-mode');
  });

  modeThisOrThatButton.addEventListener('click', () => {
    mode = "thisOrThat";
    modeThisOrThatButton.classList.add('selected');
    modeChoiceButton.classList.remove('selected');
    modeScanButton.classList.remove('selected');
    modeFlashcardButton.classList.remove('selected');
    modeFlashcardManualButton.classList.remove('selected');

    // Force tile count to 2 and disable the slider
    tileCountInput.value = 2;
    document.getElementById('tile-count-value').textContent = 2;
    tileCountInput.disabled = true;
    // Hide only the slider part but reserve the column space
    tileSliderContainer.style.visibility = 'hidden';
    scanDelayContainer.style.display = 'none';
    document.body.classList.add('this-or-that-mode');
    document.body.classList.remove('flashcard-mode');
  });

  modeFlashcardButton.addEventListener('click', () => {
    mode = "flashcard";
    modeFlashcardButton.classList.add('selected');
    modeChoiceButton.classList.remove('selected');
    modeScanButton.classList.remove('selected');
    modeThisOrThatButton.classList.remove('selected');
    modeFlashcardManualButton.classList.remove('selected');

    // Restore tile count to default
    resetTileCountToDefault();

    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    scanDelayContainer.style.display = 'block';
    document.body.classList.add('flashcard-mode');
    document.body.classList.remove('this-or-that-mode');
  });

  modeFlashcardManualButton.addEventListener('click', () => {
    mode = "flashcard-manual";
    modeFlashcardManualButton.classList.add('selected');
    modeFlashcardButton.classList.remove('selected');
    modeChoiceButton.classList.remove('selected');
    modeScanButton.classList.remove('selected');
    modeThisOrThatButton.classList.remove('selected');

    // Restore tile count to default
    resetTileCountToDefault();

    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    scanDelayContainer.style.display = 'none';
    document.body.classList.add('flashcard-mode');
    document.body.classList.remove('this-or-that-mode');
  });

  // Advanced Options: Show/hide time limit and resume video options
  enableTimeLimitCheckbox.addEventListener('change', () => {
    if (enableTimeLimitCheckbox.checked) {
      timeLimitContainer.style.display = 'block';
      resumeVideoContainer.style.display = 'block';
    } else {
      timeLimitContainer.style.display = 'none';
      resumeVideoContainer.style.display = 'none';
    }
  });

  // Populate tile picker grid
  function populateTilePickerGrid() {
    tilePickerGrid.innerHTML = "";
    const inCategoryContainer = document.createElement('div');
    inCategoryContainer.style.display = 'flex';
    inCategoryContainer.style.flexWrap = 'wrap';
    inCategoryContainer.style.gap = '10px';
    const selectedOutContainer = document.createElement('div');
    selectedOutContainer.style.display = 'flex';
    selectedOutContainer.style.flexWrap = 'wrap';
    selectedOutContainer.style.gap = '10px';
    mediaChoices.forEach((choice, idx) => {
      let inCategory = false;
      if (currentCategory === 'all') {
        inCategory = true;
      } else if (typeof choice.category === 'string') {
        inCategory = (choice.category === currentCategory);
      } else if (Array.isArray(choice.category)) {
        inCategory = choice.category.includes(currentCategory);
      }
      const isSelected = selectedTileIndices.includes(idx);
      if (inCategory || isSelected) {
        const tileOption = document.createElement('div');
        tileOption.classList.add('tile');
        tileOption.setAttribute('data-index', idx);
        tileOption.style.backgroundImage = `url(${choice.image})`;
        if (isSelected) tileOption.classList.add('selected');
        const caption = document.createElement('div');
        caption.classList.add('caption');
        caption.textContent = choice.name;
        tileOption.appendChild(caption);
        tileOption.addEventListener('click', () => {
          resetInactivityTimer();
          if (selectedTileIndices.includes(idx)) {
            selectedTileIndices = selectedTileIndices.filter(i => i !== idx);
          } else if (selectedTileIndices.length < desiredTileCount) {
            selectedTileIndices.push(idx);
          }
          updateStartButtonState();
          populateTilePickerGrid();
        });
        if (inCategory) inCategoryContainer.appendChild(tileOption);
        else if (isSelected) selectedOutContainer.appendChild(tileOption);
      }
    });
    tilePickerGrid.appendChild(inCategoryContainer);
    if (selectedOutContainer.childNodes.length > 0) {
      const separator = document.createElement('div');
      separator.style.width = '100%';
      separator.style.height = '2px';
      separator.style.backgroundColor = '#ccc';
      separator.style.margin = '10px 0';
      tilePickerGrid.appendChild(separator);
      tilePickerGrid.appendChild(selectedOutContainer);
    }
  }

  function updateStartButtonState() {
    startGameButton.disabled = (selectedTileIndices.length !== desiredTileCount);
  }

  // Render flashcard mode
  function renderFlashcard() {
    tileContainer.innerHTML = "";
    const mediaIndex = selectedTileIndices[currentSelectedIndex];
    const choice = mediaChoices[mediaIndex];
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.style.backgroundImage = `url(${choice.image})`;
    const caption = document.createElement('div');
    caption.classList.add('caption');
    caption.textContent = choice.name;
    tile.appendChild(caption);
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
    const delay = parseInt(scanDelayInput.value, 10) || 10;
    flashcardTimer = setTimeout(() => {
      currentSelectedIndex = (currentSelectedIndex + 1) % selectedTileIndices.length;
      renderFlashcard();
      startFlashcardTimer();
    }, delay * 1000);
    flashcardActive = true;
  }

  // Render game tiles for non-flashcard modes
  function renderGameTiles() {
    if (mode === "flashcard") {
      renderFlashcard();
      startFlashcardTimer();
    } else if (mode === "flashcard-manual") {
      renderFlashcard();
    } else {
      tileContainer.innerHTML = "";
      const tilesToDisplay = selectedTileIndices.map(i => mediaChoices[i]);
      tilesToDisplay.forEach((choice, idx) => {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.setAttribute('data-index', idx);
        tile.style.backgroundImage = `url(${choice.image})`;
        const caption = document.createElement('div');
        caption.classList.add('caption');
        caption.textContent = choice.name;
        tile.appendChild(caption);
        if (mode === "thisOrThat") {
          if (idx === 0) tile.classList.add('selected-left');
          else if (idx === 1) tile.classList.add('selected-right');
        }
        tileContainer.appendChild(tile);
      });
      tileContainer.style.display = 'flex';
      currentSelectedIndex = 0;
      if (mode !== "thisOrThat") updateSelection();
      if (mode === "scan") {
        scanningActive = true;
        const delay = parseInt(scanDelayInput.value, 10) || 3;
        autoScanInterval = setInterval(() => {
          cycleToNextTile();
        }, delay * 1000);
      }
    }
  }

  function updateSelection() {
    if (mode === "thisOrThat" || mode === "flashcard") return;
    const tiles = document.querySelectorAll('#tile-container .tile');
    tiles.forEach((tile, idx) => {
      if (idx === currentSelectedIndex) tile.classList.add('selected');
      else tile.classList.remove('selected');
    });
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
    if (mode === "thisOrThat") return;
    stopPreview();
    if (!selectedTileIndices.length) return;
    const mediaIndex = selectedTileIndices[idx];
    const videoFile = mediaChoices[mediaIndex].video;
    if (videoFile) {
      currentPreview = new Audio(videoFile);
      currentPreview.play().catch(err => console.error("Preview error:", err));
      previewTimeout = setTimeout(stopPreview, 10000);
    }
  }

  function resetToChoicesScreen() {
    stopPreview();
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.warn(err));
    }
    if (autoScanInterval) {
      clearInterval(autoScanInterval);
      autoScanInterval = null;
    }
    scanningActive = false;
    clearFlashcardTimer();
    flashcardActive = false;
    if (videoTimeLimitTimeout) {
      clearTimeout(videoTimeLimitTimeout);
      videoTimeLimitTimeout = null;
    }
    videoPlaying = false;
    preventAutoPreview = true;
    setTimeout(() => {
      preventAutoPreview = false;
      updateSelection();
    }, 1200);
    tileContainer.style.display = 'flex';
    videoContainer.style.display = 'none';
    if (mode === "scan") {
      const delay = parseInt(scanDelayInput.value, 10) || 3;
      autoScanInterval = setInterval(() => {
        cycleToNextTile();
      }, delay * 1000);
      scanningActive = true;
    }
  }

  // Keyboard navigation and controls
  document.addEventListener('keydown', (e) => {
    resetInactivityTimer();
    if (videoPlaying && e.key === 'Backspace') {
      e.preventDefault();
      resetToChoicesScreen();
      return;
    }
    if (videoPlaying) return;
    if ((mode === "flashcard" || mode === "flashcard-manual") && e.key === " ") {
      e.preventDefault();
      if (mode === "flashcard") {
        clearFlashcardTimer();
        flashcardActive = false;
      }
      const mediaIndex = selectedTileIndices[currentSelectedIndex];
      playVideo(mediaChoices[mediaIndex].video);
      return;
    }
    if (mode === "flashcard-manual" && e.key === "Enter") {
      e.preventDefault();
      currentSelectedIndex = (currentSelectedIndex + 1) % selectedTileIndices.length;
      renderFlashcard();
      return;
    }
    if (mode === "thisOrThat" && selectedTileIndices.length === 2) {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        const mediaIndex = selectedTileIndices[0];
        playVideo(mediaChoices[mediaIndex].video);
        return;
      } else if (e.key === "Enter") {
        e.preventDefault();
        const mediaIndex = selectedTileIndices[1];
        playVideo(mediaChoices[mediaIndex].video);
        return;
      }
    }
    const tiles = document.querySelectorAll('#tile-container .tile');
    if (!tiles.length) return;
    const total = tiles.length;
    if (mode === "choice" && e.key === "Enter") {
      cycleToNextTile();
    } else if (e.key === "ArrowRight") {
      currentSelectedIndex = (currentSelectedIndex + 1) % total;
      updateSelection();
    } else if (e.key === "ArrowLeft") {
      currentSelectedIndex = (currentSelectedIndex - 1 + total) % total;
      updateSelection();
    } else if (e.key === "ArrowUp") {
      const cols = Math.floor(Math.sqrt(total)) || 1;
      currentSelectedIndex = (currentSelectedIndex - cols + total) % total;
      updateSelection();
    } else if (e.key === "ArrowDown") {
      const cols = Math.floor(Math.sqrt(total)) || 1;
      currentSelectedIndex = (currentSelectedIndex + cols) % total;
      updateSelection();
    } else if (e.key === " " && mode !== "flashcard") {
      e.preventDefault();
      const mediaIndex = selectedTileIndices[currentSelectedIndex];
      playVideo(mediaChoices[mediaIndex].video);
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
      videoContainer.requestFullscreen().catch(err => console.error(err));
    } else if (videoContainer.webkitRequestFullscreen) {
      videoContainer.webkitRequestFullscreen();
    }
    if (enableTimeLimitCheckbox.checked) {
      const limitSeconds = parseInt(timeLimitInput.value, 10) || 60;
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
      }, limitSeconds * 1000);
    }
  }

  videoPlayer.addEventListener('ended', () => {
    delete videoResumePositions[videoSource.src];
    videoPlaying = false;
    videoContainer.style.display = 'none';
    if (mode === "flashcard") {
      currentSelectedIndex = (currentSelectedIndex + 1) % selectedTileIndices.length;
      renderFlashcard();
      startFlashcardTimer();
    }
    resumeGameActivity();
    tileContainer.style.display = 'flex';
  });

  chooseTilesButton.addEventListener('click', () => {
    if (mode === "thisOrThat") {
      desiredTileCount = 2;
    } else {
      desiredTileCount = parseInt(tileCountInput.value, 10) || 0;
    }
    tileCountDisplay.textContent = desiredTileCount;
    selectedTileIndices = [];
    updateStartButtonState();
    gameOptionsModal.style.display = 'none';
    tilePickerModal.style.display = 'flex';
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    }
    currentCategory = "all";
    categorySelect.value = "all";
    populateTilePickerGrid();
  });

  startGameButton.addEventListener('click', () => {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100vw';
    loadingScreen.style.height = '100vh';
    loadingScreen.style.backgroundColor = 'rgba(0,0,0,0.8)';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.flexDirection = 'column';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.color = 'white';
    loadingScreen.style.fontSize = '24px';
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    const videoUrls = selectedTileIndices.map(i => mediaChoices[i].video).filter(url => url);
    const totalCount = videoUrls.length;
    loadingIndicator.textContent = `Chargement... (0 / ${totalCount})`;
    loadingScreen.appendChild(loadingIndicator);
    document.body.appendChild(loadingScreen);
    setTimeout(() => {
      preloadVideos(videoUrls, loadingIndicator).then(() => {
        document.body.removeChild(loadingScreen);
        if (mode === "flashcard") {
          renderFlashcard();
          startFlashcardTimer();
        } else if (mode === "flashcard-manual") {
          renderFlashcard();
        } else {
          renderGameTiles();
        }
        tilePickerModal.style.display = 'none';
        tileContainer.style.display = 'flex';
        startInactivityTimer();
      });
    }, 0);
  });

  categorySelect.addEventListener('change', (e) => {
    currentCategory = e.target.value;
    populateTilePickerGrid();
  });
});
