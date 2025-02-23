document.addEventListener('DOMContentLoaded', () => {
  /* --- DOM ELEMENTS --- */
  // (1) Game Options Modal (Step 1)
  const gameOptionsModal    = document.getElementById('game-options');
  const tileCountInput      = document.getElementById('tile-count');
  const chooseTilesButton   = document.getElementById('choose-tiles-button');

  // Mode selection
  const modeChoiceButton    = document.getElementById('mode-choice-button');
  const modeScanButton      = document.getElementById('mode-scan-button');
  const scanDelayContainer  = document.getElementById('scan-delay-container');
  const scanDelayInput      = document.getElementById('scan-delay');

  // (NEW) Advanced Options
  const advancedOptionsButton    = document.getElementById('advanced-options-button');
  const advancedOptionsModal     = document.getElementById('advanced-options-modal');
  const closeAdvancedOptionsBtn  = document.getElementById('close-advanced-options');

  // (In advanced modal) "Son de transition"
  const enableCycleSoundCheckbox = document.getElementById('enable-cycle-sound');

  // (NEW) Time Limit Elements in Advanced Options
  const enableTimeLimitCheckbox  = document.getElementById('enable-time-limit');
  const timeLimitContainer       = document.getElementById('time-limit-container');
  const timeLimitInput           = document.getElementById('time-limit-seconds');

  // (NEW) Resume Video Option (container and checkbox)
  const resumeVideoContainer     = document.getElementById('resume-video-container');
  const enableResumeVideoCheckbox = document.getElementById('enable-resume-video');

  // (2) Tile Picker Modal (Step 2)
  const tilePickerModal     = document.getElementById('tile-picker-modal');
  const tilePickerGrid      = document.getElementById('tile-picker-grid');
  const tileCountDisplay    = document.getElementById('tile-count-display');
  const startGameButton     = document.getElementById('start-game-button');

  // (NEW) category dropdown for filtering
  const categorySelect      = document.getElementById('categorySelect');

  // (3) Main Game (Choices Screen)
  const tileContainer       = document.getElementById('tile-container');
  const videoContainer      = document.getElementById('video-container');
  const videoPlayer         = document.getElementById('video-player');
  const videoSource         = document.getElementById('video-source');

  /* --- GAME VARIABLES --- */
  // Assumes mediaChoices is defined in choiceArray.js
  let currentSelectedIndex  = 0;
  let videoPlaying          = false;
  let selectedTileIndices   = [];  // which tiles the user has chosen
  let desiredTileCount      = 0;   // how many tiles user must select
  let mode                  = "choice";  // "choice" or "scan"
  let autoScanInterval      = null;      // for scanning
  let currentPreview        = null;      // audio preview
  let previewTimeout        = null;      // stops preview after 10s
  let previewDelayTimeout   = null;      // small delay before starting preview

  // category for the tile picker single-grid
  let currentCategory       = "all";
  
  // NEW: Flag to prevent auto-preview when returning from video
  let preventAutoPreview    = false;

  // NEW: Inactivity timer to replay preview after 30s
  let inactivityTimer       = null;

  // NEW: Timeout to enforce video time limit
  let videoTimeLimitTimeout = null;

  // NEW: Object to store resume positions for videos (keyed by video URL)
  let videoResumePositions = {};

  /* ----------------------------------------------------------------
     (A) INACTIVITY TIMER LOGIC
     ---------------------------------------------------------------- */
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
        console.log('No user input for 30s — replaying preview...');
        playPreviewForTile(currentSelectedIndex);
      }
    }, 30000);
  }

  function resetInactivityTimer() {
    if (!videoPlaying) {
      startInactivityTimer();
    }
  }

  /* ----------------------------------------------------------------
     (B) HELPER FUNCTIONS
     ---------------------------------------------------------------- */
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

  // NEW: Preload videos for the selected tiles.
  // Accepts an array of video URLs and a loading indicator element to update progress.
  function preloadVideos(videoUrls, loadingIndicator) {
    let loadedCount = 0;
    const totalCount = videoUrls.length;
    return Promise.all(videoUrls.map(url => {
      return new Promise((resolve) => {
        let tempVideo = document.createElement('video');
        tempVideo.preload = 'auto';
        tempVideo.src = url;
        tempVideo.addEventListener('canplaythrough', () => {
          loadedCount++;
          loadingIndicator.textContent = `Chargement... (${loadedCount} / ${totalCount})`;
          console.log("Preloaded video:", url);
          resolve(url);
        });
        tempVideo.addEventListener('error', () => {
          loadedCount++;
          loadingIndicator.textContent = `Chargement... (${loadedCount} / ${totalCount})`;
          console.error("Error preloading video:", url);
          resolve(url);
        });
      });
    }));
  }

  /* ----------------------------------------------------------------
     (C) MODE BUTTON EVENT HANDLERS
     ---------------------------------------------------------------- */
  modeChoiceButton.addEventListener('click', () => {
    mode = "choice";
    modeChoiceButton.classList.add('selected');
    modeScanButton.classList.remove('selected');
    scanDelayContainer.style.display = 'none';
  });

  modeScanButton.addEventListener('click', () => {
    mode = "scan";
    modeScanButton.classList.add('selected');
    modeChoiceButton.classList.remove('selected');
    scanDelayContainer.style.display = 'block';
  });

  /* ----------------------------------------------------------------
     ADVANCED OPTIONS MODAL: Show/Hide & Time Limit / Resume Toggle
     ---------------------------------------------------------------- */
  advancedOptionsButton.addEventListener('click', () => {
    advancedOptionsModal.style.display = 'flex';
  });

  closeAdvancedOptionsBtn.addEventListener('click', () => {
    advancedOptionsModal.style.display = 'none';
  });

  // Toggle time limit input display when checkbox is changed
  enableTimeLimitCheckbox.addEventListener('change', () => {
    if (enableTimeLimitCheckbox.checked) {
      timeLimitContainer.style.display = 'block';
      // Also show the resume option container when time limit is enabled
      resumeVideoContainer.style.display = 'block';
    } else {
      timeLimitContainer.style.display = 'none';
      resumeVideoContainer.style.display = 'none';
    }
  });

  /* ----------------------------------------------------------------
     (D) POPULATE TILE PICKER (Single-Grid with Category + Selection)
     ---------------------------------------------------------------- */
  function populateTilePickerGrid() {
    tilePickerGrid.innerHTML = "";
    mediaChoices.forEach((choice, index) => {
      const inCategory = (currentCategory === 'all' || choice.category === currentCategory);
      const isSelected = selectedTileIndices.includes(index);
      if (inCategory || isSelected) {
        const tileOption = document.createElement('div');
        tileOption.classList.add('tile');
        tileOption.setAttribute('data-index', index);
        tileOption.style.backgroundImage = `url(${choice.image})`;

        if (isSelected) {
          tileOption.classList.add('selected');
        }

        const caption = document.createElement('div');
        caption.classList.add('caption');
        caption.textContent = choice.name;
        tileOption.appendChild(caption);

        tileOption.addEventListener('click', () => {
          resetInactivityTimer();
          if (selectedTileIndices.includes(index)) {
            selectedTileIndices = selectedTileIndices.filter(i => i !== index);
          } else if (selectedTileIndices.length < desiredTileCount) {
            selectedTileIndices.push(index);
          }
          updateStartButtonState();
          populateTilePickerGrid();
        });

        tilePickerGrid.appendChild(tileOption);
      }
    });
  }

  function updateStartButtonState() {
    startGameButton.disabled = (selectedTileIndices.length !== desiredTileCount);
  }

  /* ----------------------------------------------------------------
     (E) RENDER MAIN GAME (Choices Screen)
     ---------------------------------------------------------------- */
  function renderGameTiles() {
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

      tileContainer.appendChild(tile);
    });

    currentSelectedIndex = 0;
    updateSelection();

    if (mode === "scan") {
      const delay = parseInt(scanDelayInput.value, 10) || 3;
      autoScanInterval = setInterval(() => {
        cycleToNextTile();
      }, delay * 1000);
    }
  }

  function updateSelection() {
    const tiles = document.querySelectorAll('#tile-container .tile');
    tiles.forEach((tile, index) => {
      if (index === currentSelectedIndex) {
        tile.classList.add('selected');
      } else {
        tile.classList.remove('selected');
      }
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

  function playPreviewForTile(index) {
    stopPreview();
    if (!selectedTileIndices.length) return;
    const mediaIndex = selectedTileIndices[index];
    const videoFile = mediaChoices[mediaIndex].video;
    if (videoFile) {
      currentPreview = new Audio(videoFile);
      currentPreview.play().catch(err => console.error("Audio preview error:", err));
      previewTimeout = setTimeout(stopPreview, 10000);
    }
  }

  /* ----------------------------------------------------------------
     (F) BACKSPACE TO RESET TO CHOICES SCREEN
     ---------------------------------------------------------------- */
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
  }

  document.addEventListener('keydown', (e) => {
    resetInactivityTimer();
    if (videoPlaying && e.key === 'Backspace') {
      e.preventDefault();
      resetToChoicesScreen();
      return;
    }
    if (videoPlaying) return;
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
      const columns = Math.floor(Math.sqrt(total)) || 1;
      currentSelectedIndex = (currentSelectedIndex - columns + total) % total;
      updateSelection();
    } else if (e.key === "ArrowDown") {
      const columns = Math.floor(Math.sqrt(total)) || 1;
      currentSelectedIndex = (currentSelectedIndex + columns) % total;
      updateSelection();
    } else if (e.key === " ") {
      e.preventDefault();
      const mediaIndex = selectedTileIndices[currentSelectedIndex];
      playVideo(mediaChoices[mediaIndex].video);
    }
  });

  /* ----------------------------------------------------------------
     (G) PLAY VIDEO (with resume support, time limit enforcement,
         and preloading for selected tiles)
     ---------------------------------------------------------------- */
  function playVideo(videoUrl) {
    stopPreview();
    if (autoScanInterval) {
      clearInterval(autoScanInterval);
      autoScanInterval = null;
    }
    videoPlaying = true;

    tileContainer.style.display = 'none';
    tilePickerModal.style.display = 'none';
    gameOptionsModal.style.display = 'none';
    videoContainer.style.display = 'flex';

    videoSource.src = videoUrl;
    videoPlayer.removeAttribute('controls');
    videoPlayer.load();
    videoPlayer.onloadedmetadata = () => {
      // If resume is enabled and a resume position exists, continue from that time.
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
      if (videoTimeLimitTimeout) {
        clearTimeout(videoTimeLimitTimeout);
      }
      videoTimeLimitTimeout = setTimeout(() => {
        if (videoPlaying) {
          // If resume option is enabled, store the current playback position.
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
    resetToChoicesScreen();
  });

  /* ----------------------------------------------------------------
     (H) EVENT HANDLERS
     ---------------------------------------------------------------- */
  // Step 1: "Choose Tiles" => show tile-picker (and request fullscreen)
  chooseTilesButton.addEventListener('click', () => {
    desiredTileCount = parseInt(tileCountInput.value, 10) || 0;
    tileCountDisplay.textContent = desiredTileCount;
    selectedTileIndices = [];
    updateStartButtonState();
    gameOptionsModal.style.display = 'none';
    tilePickerModal.style.display = 'flex';
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn("Fullscreen request failed:", err);
      });
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    }
    currentCategory = "all";
    categorySelect.value = "all";
    populateTilePickerGrid();
  });

  // Step 2: "Commencer" => preload selected videos then go to main game (choices screen)
  startGameButton.addEventListener('click', () => {
    // Create and show a simple loading screen with progress indicator
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100vw';
    loadingScreen.style.height = '100vh';
    loadingScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.flexDirection = 'column';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.color = 'white';
    loadingScreen.style.fontSize = '24px';

    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.textContent = 'Chargement... (0 / 0)';
    loadingScreen.appendChild(loadingIndicator);
    document.body.appendChild(loadingScreen);

    // Get video URLs from selected tiles
    const videoUrls = selectedTileIndices
      .map(i => mediaChoices[i].video)
      .filter(url => url);
    const totalCount = videoUrls.length;
    loadingIndicator.textContent = `Chargement... (0 / ${totalCount})`;

    // Preload the videos and update progress via the loadingIndicator.
    preloadVideos(videoUrls, loadingIndicator).then(() => {
      console.log("Preloading complete for videos:", videoUrls);
      // Once preloading is complete, remove the loading screen and start the game.
      document.body.removeChild(loadingScreen);
      renderGameTiles();
      tilePickerModal.style.display = 'none';
      tileContainer.style.display = 'flex';
      startInactivityTimer();
    });
  });

  categorySelect.addEventListener('change', (e) => {
    currentCategory = e.target.value;
    populateTilePickerGrid();
  });
});
