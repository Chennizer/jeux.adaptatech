document.addEventListener('DOMContentLoaded', () => {
  /* --- DOM ELEMENTS --- */
  const gameOptionsModal          = document.getElementById('game-options');
  const tileCountInput            = document.getElementById('tile-count');
  const chooseTilesButton         = document.getElementById('choose-tiles-button');

  // Advanced Options (these elements may no longer exist in the new layout)
  const advancedOptionsButton     = document.getElementById('advanced-options-button');
  const advancedOptionsModal      = document.getElementById('advanced-options-modal');
  const closeAdvancedOptionsBtn   = document.getElementById('close-advanced-options');
  const enableCycleSoundCheckbox  = document.getElementById('enable-cycle-sound');

  const enableTimeLimitCheckbox   = document.getElementById('enable-time-limit');
  const timeLimitContainer        = document.getElementById('time-limit-container');
  const timeLimitInput            = document.getElementById('time-limit-seconds');

  const resumeVideoContainer      = document.getElementById('resume-video-container');
  const enableResumeVideoCheckbox = document.getElementById('enable-resume-video');

  // Fixation Time Option Elements (for hover delay)
  const fixationTimeInput         = document.getElementById('fixation-time');
  const fixationTimeValue         = document.getElementById('fixation-time-value');

  // Tile Size Option Elements (for final game tiles)
  const tileSizeInput             = document.getElementById('tile-size');
  const tileSizeValue             = document.getElementById('tile-size-value');

  // Tile Picker Modal
  const tilePickerModal   = document.getElementById('tile-picker-modal');
  const tilePickerGrid    = document.getElementById('tile-picker-grid');
  const tileCountDisplay  = document.getElementById('tile-count-display');
  const startGameButton   = document.getElementById('start-game-button');

  const categorySelect    = document.getElementById('categorySelect');

  // Main Game
  const tileContainer     = document.getElementById('tile-container');
  const videoContainer    = document.getElementById('video-container');
  const videoPlayer       = document.getElementById('video-player');
  const videoSource       = document.getElementById('video-source');

  /* --- GAME VARIABLES --- */
  let videoPlaying          = false;
  let selectedTileIndices   = [];
  let desiredTileCount      = 0;

  let currentPreview        = null;
  let previewTimeout        = null;
  let previewDelayTimeout   = null;

  let preventAutoPreview    = false;
  let inactivityTimer       = null;
  let videoTimeLimitTimeout = null;

  // For "resume video" logic
  let videoResumePositions  = {};

  let currentCategory       = 'all';

  // Global variable for fixation delay (in ms), default 2000ms
  let fixationDelay = 2000;
  // Global variable for tile size in vh; default 40
  let tileSize = 40;

  const tileChoiceMap = new WeakMap();
  const POINTER_MOVE_THRESHOLD = 10;
  let hoveredTile = null;
  let hoveredChoice = null;
  let hoverTimeoutId = null;
  let requirePointerMotion = false;
  let lastPointerPosition = null;
  let pointerMotionOrigin = null;
  let pendingGuardedHover = null;

  function clearHoverState() {
    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId);
      hoverTimeoutId = null;
    }
    if (hoveredTile) {
      hoveredTile.classList.remove('selected');
      hoveredTile = null;
    }
    hoveredChoice = null;
    pendingGuardedHover = null;
  }

  function requirePointerMotionBeforeHover({ clearSelection = true } = {}) {
    if (clearSelection) {
      clearHoverState();
    }
    requirePointerMotion = true;
    pendingGuardedHover = null;
    if (tileContainer) {
      tileContainer.classList.add('pointer-motion-required');
    }
    pointerMotionOrigin = lastPointerPosition
      ? { x: lastPointerPosition.x, y: lastPointerPosition.y }
      : null;
  }

  function scheduleHoverCountdown() {
    if (!hoveredTile || !hoveredChoice || videoPlaying) {
      return;
    }
    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId);
    }
    hoverTimeoutId = setTimeout(() => {
      if (!videoPlaying && hoveredTile && hoveredChoice) {
        stopPreview();
        playVideo(hoveredChoice.video);
      }
    }, fixationDelay);
  }

  function handleTileEnter(tile, choice, options = {}) {
    const { playSound = true } = options;
    if (videoPlaying) return;

    if (requirePointerMotion) {
      const tileChanged = hoveredTile !== tile;

      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId);
        hoverTimeoutId = null;
      }

      if (hoveredTile) {
        hoveredTile.classList.remove('selected');
        hoveredTile = null;
      }

      hoveredChoice = null;
      tile.classList.remove('selected');
      pendingGuardedHover = { tile, choice, playSound: playSound && tileChanged };
      return;
    }

    pendingGuardedHover = null;

    const tileChanged = hoveredTile !== tile;

    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId);
      hoverTimeoutId = null;
    }

    if (tileChanged && hoveredTile) {
      hoveredTile.classList.remove('selected');
    }

    hoveredTile = tile;
    hoveredChoice = choice;
    tile.classList.add('selected');

    if (playSound && tileChanged) {
      playCycleSound();
    }

    scheduleHoverCountdown();
  }

  function handleTileLeave(tile) {
    if (pendingGuardedHover && pendingGuardedHover.tile === tile) {
      pendingGuardedHover = null;
    }
    if (hoveredTile === tile) {
      clearHoverState();
    } else {
      tile.classList.remove('selected');
    }
  }

  /* ----------------------------------------------------------------
     (A) INACTIVITY TIMER LOGIC (optional)
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
        console.log('No user input for 30s...');
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
    if (enableCycleSoundCheckbox && enableCycleSoundCheckbox.checked) {
      const cycleSound = new Audio("../../sounds/woosh.mp3");
      cycleSound.play().catch(err => console.error("Cycle sound error:", err));
    }
  }

  // Preload videos
  function preloadVideos(videoUrls, loadingIndicator) {
    let loadedCount = 0;
    const totalCount = videoUrls.length;
    return Promise.all(
      videoUrls.map(url => {
        return new Promise(resolve => {
          const tempVideo = document.createElement('video');
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
      })
    );
  }

  /* ----------------------------------------------------------------
     ADVANCED OPTIONS
     ---------------------------------------------------------------- */
  if (advancedOptionsButton) {
    advancedOptionsButton.addEventListener('click', () => {
      if (advancedOptionsModal) {
        advancedOptionsModal.style.display = 'flex';
      }
    });
  }

  if (closeAdvancedOptionsBtn) {
    closeAdvancedOptionsBtn.addEventListener('click', () => {
      if (advancedOptionsModal) {
        advancedOptionsModal.style.display = 'none';
      }
    });
  }
 
  const timeLimitSlider = document.getElementById('time-limit-seconds');
  const timeLimitValueSpan = document.getElementById('time-limit-value');

  timeLimitSlider.addEventListener('input', function() {
    timeLimitValueSpan.textContent = this.value;
  });


  enableTimeLimitCheckbox.addEventListener('change', () => {
    if (enableTimeLimitCheckbox.checked) {
      timeLimitContainer.style.display = 'block';
      resumeVideoContainer.style.display = 'block';
    } else {
      timeLimitContainer.style.display = 'none';
      resumeVideoContainer.style.display = 'none';
    }
  });

  // Fixation Time Slider Setup (for hover delay)
  if (fixationTimeInput && fixationTimeValue) {
    fixationTimeInput.addEventListener('input', () => {
      fixationDelay = parseInt(fixationTimeInput.value, 10);
      fixationTimeValue.textContent = fixationDelay;
      document.documentElement.style.setProperty('--hover-duration', fixationDelay + 'ms');
    });
  }

  // Tile Size Slider Setup (for final game tiles) with dynamic gap adjustment.
  // Base: when tile size is 40vh, gap is 10vh.
  if (tileSizeInput && tileSizeValue) {
    tileSizeInput.addEventListener('input', () => {
      tileSize = parseInt(tileSizeInput.value, 10);
      tileSizeValue.textContent = tileSize;
      document.documentElement.style.setProperty('--tile-size', tileSize + 'vh');
      const newGap = 10 * (40 / tileSize);
      document.documentElement.style.setProperty('--tile-gap', newGap + 'vh');
    });
  }

  /* ----------------------------------------------------------------
     Helper: Create a tile element for a given choice.
     ---------------------------------------------------------------- */
  function createTile(choice) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.style.backgroundImage = `url(${choice.image})`;
    const caption = document.createElement('div');
    caption.classList.add('caption');
    caption.textContent = choice.name;
    tile.appendChild(caption);

    tileChoiceMap.set(tile, choice);

    tile.addEventListener('mouseenter', () => {
      handleTileEnter(tile, choice);
    });

    tile.addEventListener('mouseleave', () => {
      handleTileLeave(tile);
    });

    return tile;
  }

  /* ----------------------------------------------------------------
     (C) POPULATE TILE PICKER
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
          if (isSelected) {
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

  // Expose for external scripts (e.g. customVideoChoices.js)
  window.populateTilePickerGrid = populateTilePickerGrid;

  function updateStartButtonState() {
    startGameButton.disabled = (selectedTileIndices.length !== desiredTileCount);
  }

  /* ----------------------------------------------------------------
     (D) RENDER MAIN GAME (Optimally distribute into 2 rows)
     ---------------------------------------------------------------- */
  function renderGameTiles() {
    tileContainer.innerHTML = "";
    const tilesToDisplay = selectedTileIndices.map(i => mediaChoices[i]);

    // If only one tile, just create one row
    if (tilesToDisplay.length <= 1) {
      const row = document.createElement('div');
      row.style.display = "flex";
      row.style.justifyContent = "center";
      row.style.gap = "var(--tile-gap)";
      tilesToDisplay.forEach(choice => {
        row.appendChild(createTile(choice));
      });
      tileContainer.appendChild(row);
    } else {
      // Split tiles into two rows optimally
      const row1Count = Math.ceil(tilesToDisplay.length / 2);
      const row1 = document.createElement('div');
      const row2 = document.createElement('div');
      row1.style.display = "flex";
      row1.style.justifyContent = "center";
      row1.style.gap = "var(--tile-gap)";
      row2.style.display = "flex";
      row2.style.justifyContent = "center";
      row2.style.gap = "var(--tile-gap)";
      for (let i = 0; i < row1Count; i++) {
        row1.appendChild(createTile(tilesToDisplay[i]));
      }
      for (let i = row1Count; i < tilesToDisplay.length; i++) {
        row2.appendChild(createTile(tilesToDisplay[i]));
      }
      tileContainer.appendChild(row1);
      tileContainer.appendChild(row2);
      // Ensure tileContainer itself is centered vertically
      tileContainer.style.display = "flex";
      tileContainer.style.flexDirection = "column";
      tileContainer.style.justifyContent = "center";
      tileContainer.style.alignItems = "center";
    }
    tileContainer.style.display = "flex";
  }

  /* ----------------------------------------------------------------
     (E) BACKSPACE TO RESET TO CHOICES SCREEN
     ---------------------------------------------------------------- */
  function resetToChoicesScreen() {
    stopPreview();
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.warn(err));
    }
    if (videoTimeLimitTimeout) {
      clearTimeout(videoTimeLimitTimeout);
      videoTimeLimitTimeout = null;
    }
    videoPlaying = false;
    clearHoverState();
    requirePointerMotionBeforeHover({ clearSelection: false });
    preventAutoPreview = true;
    setTimeout(() => { preventAutoPreview = false; }, 1200);
    tileContainer.style.display = "flex";
    videoContainer.style.display = "none";
  }

  document.addEventListener('keydown', e => {
    resetInactivityTimer();
    if (videoPlaying && e.key === 'Backspace') {
      e.preventDefault();
      resetToChoicesScreen();
    }
  });

  /* ----------------------------------------------------------------
     (F) PLAY VIDEO (time limit, resume)
     ---------------------------------------------------------------- */
  function playVideo(videoUrl) {
    stopPreview();
    clearHoverState();
    videoPlaying = true;
    tileContainer.style.display = "none";
    tilePickerModal.style.display = "none";
    gameOptionsModal.style.display = "none";
    videoContainer.style.display = "flex";
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
      if (videoTimeLimitTimeout) { clearTimeout(videoTimeLimitTimeout); }
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
    resetToChoicesScreen();
  });

  document.addEventListener('pointermove', event => {
    const { clientX, clientY } = event;
    const targetElement = event.target instanceof Element ? event.target : null;
    const previousPosition = lastPointerPosition;
    lastPointerPosition = { x: clientX, y: clientY };

    if (requirePointerMotion) {
      if (!pointerMotionOrigin) {
        if (previousPosition) {
          pointerMotionOrigin = { x: previousPosition.x, y: previousPosition.y };
        } else {
          pointerMotionOrigin = { x: clientX, y: clientY };
          return;
        }
      }

      const dx = clientX - pointerMotionOrigin.x;
      const dy = clientY - pointerMotionOrigin.y;

      if (Math.hypot(dx, dy) >= POINTER_MOVE_THRESHOLD) {
        requirePointerMotion = false;
        pointerMotionOrigin = null;
        if (tileContainer) {
          tileContainer.classList.remove('pointer-motion-required');
        }

        const pending = pendingGuardedHover;
        pendingGuardedHover = null;

        if (
          pending &&
          tileChoiceMap.has(pending.tile) &&
          tileContainer.contains(pending.tile) &&
          tileContainer.style.display !== 'none'
        ) {
          handleTileEnter(pending.tile, pending.choice, { playSound: pending.playSound });
        } else {
          const tile = targetElement ? targetElement.closest('.tile') : null;
          if (
            tile &&
            tileChoiceMap.has(tile) &&
            tileContainer.contains(tile) &&
            tileContainer.style.display !== 'none'
          ) {
            handleTileEnter(tile, tileChoiceMap.get(tile), { playSound: false });
          }
        }
      }
      return;
    }

    if (!videoPlaying) {
      const tile = targetElement ? targetElement.closest('.tile') : null;
      if (
        tile &&
        tileChoiceMap.has(tile) &&
        tileContainer.contains(tile) &&
        tile !== hoveredTile
      ) {
        handleTileEnter(tile, tileChoiceMap.get(tile));
      }
    }
  });

  /* ----------------------------------------------------------------
     (G) EVENT HANDLERS: TILE PICKER & START GAME
     ---------------------------------------------------------------- */
  chooseTilesButton.addEventListener('click', () => {
    desiredTileCount = parseInt(tileCountInput.value, 10) || 1;
    tileCountDisplay.textContent = desiredTileCount;
    selectedTileIndices = [];
    updateStartButtonState();
    gameOptionsModal.style.display = "none";
    tilePickerModal.style.display = "flex";
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn("Fullscreen request failed:", err);
      });
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    }
    currentCategory = "all";
    if (categorySelect) {
      categorySelect.value = "all";
    }
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

    const videoUrls = selectedTileIndices.map(i => mediaChoices[i].video).filter(url => url);
    const totalCount = videoUrls.length;
    loadingIndicator.textContent = `Chargement... (0 / ${totalCount})`;

    preloadVideos(videoUrls, loadingIndicator).then(() => {
      console.log("Preloading complete for videos:", videoUrls);
      document.body.removeChild(loadingScreen);
      tilePickerModal.style.display = "none";
      renderGameTiles();
      startInactivityTimer();
    });
  });

  if (categorySelect) {
    categorySelect.addEventListener('change', e => {
      currentCategory = e.target.value;
      populateTilePickerGrid();
    });
  }

  window.choiceEyegaze = window.choiceEyegaze || {};
  window.choiceEyegaze.requirePointerMotionBeforeHover = (options) => {
    requirePointerMotionBeforeHover(options);
  };
  window.choiceEyegaze.isPointerMotionRequired = () => requirePointerMotion;

  // Populate grid if choices already exist (e.g., restored from IndexedDB)
  if (Array.isArray(mediaChoices) && mediaChoices.length > 0) {
    populateTilePickerGrid();
  }
});
