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

  // Pointer controls
  const showGazePointer           = document.getElementById('showGazePointer');
  const gazeSize                  = document.getElementById('gazeSize');
  const gazeSizeValueSpan         = document.getElementById('gazeSizeVal');
  const gazeOpacity               = document.getElementById('gazeOpacity');
  const gazeOpacityValueSpan      = document.getElementById('gazeOpacityVal');
  const gpDetails                 = document.getElementById('gpDetails');
  const gazePointer               = document.getElementById('gazePointer');

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

  function ensurePointerOverlay() {
    if (!gazePointer) return null;
    let overlay = document.getElementById('gazePointerOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'gazePointerOverlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '2147483647';
      overlay.style.overflow = 'visible';
      document.body.appendChild(overlay);
    }
    if (gazePointer.parentElement !== overlay) {
      overlay.appendChild(gazePointer);
    }
    return overlay;
  }

  ensurePointerOverlay();

  function isElementShown(el) {
    if (!el) return false;
    const inline = el.style && typeof el.style.display === 'string' ? el.style.display : '';
    if (inline) {
      return inline !== 'none';
    }
    if (window.getComputedStyle) {
      const computed = window.getComputedStyle(el);
      return computed ? computed.display !== 'none' : false;
    }
    return true;
  }

  function pointerSizeFromControls() {
    return parseInt(gazeSize?.value, 10) || 36;
  }

  function pointerOpacityFromControls() {
    const raw = parseInt(gazeOpacity?.value, 10);
    return Math.max(0, Math.min(1, (isNaN(raw) ? 100 : raw) / 100));
  }

  function isPointerStageActive() {
    if (videoPlaying) return false;
    if (isElementShown(gameOptionsModal)) return false;
    if (isElementShown(tilePickerModal)) return false;
    return isElementShown(tileContainer);
  }

  function setPointerPos(x, y) {
    if (!gazePointer) return;
    gazePointer.style.left = `${x}px`;
    gazePointer.style.top = `${y}px`;
  }

  function setPointerDwell(active) {
    if (!gazePointer) return;
    gazePointer.classList.toggle('gp-dwell', !!active);
  }

  function refreshPointerStyles() {
    if (!gazePointer) return;
    const size = pointerSizeFromControls();
    const opct = pointerOpacityFromControls();
    if (gazeSizeValueSpan) gazeSizeValueSpan.textContent = size;
    if (gazeOpacityValueSpan) gazeOpacityValueSpan.textContent = Math.round(opct * 100);
    gazePointer.style.setProperty('--gp-size', `${size}px`);
    const pointerEnabled = !!showGazePointer?.checked;
    const pointerVisible = pointerEnabled && isPointerStageActive();
    const hideNativeCursor = pointerVisible || videoPlaying;
    document.documentElement.classList.toggle('hide-native-cursor', hideNativeCursor);
    if (!pointerVisible) {
      setPointerDwell(false);
      if (gpDetails) gpDetails.open = false;
    }
    gazePointer.style.opacity = pointerVisible ? opct : 0;
    if (pointerVisible && lastPointerPosition) {
      setPointerPos(lastPointerPosition.x, lastPointerPosition.y);
    }
  }

  function syncPointerSettingsToStore() {
    try {
      if (window.eyegazeSettings) {
        eyegazeSettings.showGazePointer  = !!showGazePointer?.checked;
        eyegazeSettings.gazePointerSize  = pointerSizeFromControls();
        eyegazeSettings.gazePointerAlpha = pointerOpacityFromControls();
      }
    } catch (e) {}
  }

  if (gazePointer) {
    const rawHandler = (event) => {
      lastPointerPosition = { x: event.clientX, y: event.clientY };
      setPointerPos(event.clientX, event.clientY);
    };

    if ('onpointerrawupdate' in window) {
      window.addEventListener('pointerrawupdate', rawHandler, { passive: true });
    }

    window.addEventListener('pointerleave', () => {
      gazePointer._savedOpacity = gazePointer.style.opacity;
      gazePointer.style.opacity = 0;
    });

    window.addEventListener('pointerenter', () => {
      refreshPointerStyles();
      if (lastPointerPosition) {
        setPointerPos(lastPointerPosition.x, lastPointerPosition.y);
      }
    });
  }

  function clearHoverState() {
    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId);
      hoverTimeoutId = null;
    }
    setPointerDwell(false);
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
      setPointerDwell(false);
    }
    hoverTimeoutId = setTimeout(() => {
      if (!videoPlaying && hoveredTile && hoveredChoice) {
        stopPreview();
        playVideo(hoveredChoice.video);
      }
    }, fixationDelay);
    setPointerDwell(true);
  }

  function handleTileEnter(tile, choice, options = {}) {
    const { playSound = true } = options;
    if (videoPlaying) return;

    if (requirePointerMotion) {
      const tileChanged = hoveredTile !== tile;

      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId);
        hoverTimeoutId = null;
        setPointerDwell(false);
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
      setPointerDwell(false);
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
    setPointerDwell(false);
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

  function ensureFullscreen() {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
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

  (function initPointerControls() {
    if (!showGazePointer && !gazeSize && !gazeOpacity) {
      return;
    }

    try {
      const settings = window.eyegazeSettings;
      if (settings) {
        if (showGazePointer && typeof settings.showGazePointer === 'boolean') {
          showGazePointer.checked = settings.showGazePointer;
        }
        if (gazeSize && typeof settings.gazePointerSize === 'number') {
          const min = parseInt(gazeSize.min || '16', 10);
          const max = parseInt(gazeSize.max || '100', 10);
          const stored = Math.round(settings.gazePointerSize);
          if (!Number.isNaN(stored)) {
            const clamped = Math.max(min, Math.min(max, stored));
            gazeSize.value = clamped;
          }
        }
        if (gazeOpacity && typeof settings.gazePointerAlpha === 'number') {
          const min = parseInt(gazeOpacity.min || '0', 10);
          const max = parseInt(gazeOpacity.max || '100', 10);
          const stored = Math.round(Math.max(0, Math.min(1, settings.gazePointerAlpha)) * 100);
          const clamped = Math.max(min || 0, Math.min(max || 100, stored));
          gazeOpacity.value = clamped;
        }
      }
    } catch (e) {}

    refreshPointerStyles();
    syncPointerSettingsToStore();

    if (showGazePointer) {
      showGazePointer.addEventListener('change', () => {
        syncPointerSettingsToStore();
        refreshPointerStyles();
      });
    }

    [gazeSize, gazeOpacity].forEach((ctrl) => {
      if (!ctrl) return;
      ctrl.addEventListener('input', () => {
        syncPointerSettingsToStore();
        refreshPointerStyles();
      });
    });
  })();

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
    requirePointerMotionBeforeHover();
  }

  /* ----------------------------------------------------------------
     (E) BACKSPACE TO RESET TO CHOICES SCREEN
     ---------------------------------------------------------------- */
  function resetToChoicesScreen() {
    stopPreview();
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
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
    ensureFullscreen();
    refreshPointerStyles();
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
    refreshPointerStyles();
    videoPlayer.removeAttribute('controls');
    videoPlayer.load();
    videoPlayer.onloadedmetadata = () => {
      if (enableResumeVideoCheckbox.checked && videoResumePositions[videoUrl]) {
        videoPlayer.currentTime = videoResumePositions[videoUrl];
      }
      videoPlayer.play();
    };
    ensureFullscreen();
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
    setPointerPos(clientX, clientY);
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
    ensureFullscreen();
    currentCategory = "all";
    if (categorySelect) {
      categorySelect.value = "all";
    }
    populateTilePickerGrid();
    refreshPointerStyles();
  });

  startGameButton.addEventListener('click', () => {
    ensureFullscreen();
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
      refreshPointerStyles();
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
  window.choiceEyegaze.ensureFullscreen = ensureFullscreen;

  // Populate grid if choices already exist (e.g., restored from IndexedDB)
  if (Array.isArray(mediaChoices) && mediaChoices.length > 0) {
    populateTilePickerGrid();
  }
});
