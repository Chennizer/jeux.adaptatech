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
  const youtubeDiv        = document.getElementById('youtube-player');
  let youtubePlayer       = null;
  let currentVideoUrl     = null;

  const sharedSettings = (window.eyegazeSettings = window.eyegazeSettings || {});

  const showGazePointer   = document.getElementById('showGazePointer');
  const gpDetails         = document.getElementById('gpDetails');
  const gazeSizeInput     = document.getElementById('gazeSize');
  const gazeSizeValue     = document.getElementById('gazeSizeVal');
  const gazeOpacityInput  = document.getElementById('gazeOpacity');
  const gazeOpacityValue  = document.getElementById('gazeOpacityVal');
  const gazePointer       = document.getElementById('gazePointer');

  if (typeof sharedSettings.showGazePointer === 'boolean' && showGazePointer) {
    showGazePointer.checked = sharedSettings.showGazePointer;
  }
  if (typeof sharedSettings.gazePointerSize === 'number' && gazeSizeInput) {
    gazeSizeInput.value = String(Math.round(sharedSettings.gazePointerSize));
  }
  if (typeof sharedSettings.gazePointerAlpha === 'number' && gazeOpacityInput) {
    gazeOpacityInput.value = String(Math.round(sharedSettings.gazePointerAlpha * 100));
  }

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

  function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.|m\.)?((youtube\.com\/)|(youtu\.be\/))/.test(url);
  }

  function getYouTubeId(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return u.pathname.slice(1);
      }
      const id = u.searchParams.get('v');
      if (id) return id;
      const m = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  }

  // Global variable for fixation delay (in ms), default 2000ms
  let fixationDelay = 2000;
  // Global variable for tile size in vh; default 40
  let tileSize = 40;

  if (typeof sharedSettings.dwellTime === 'number') {
    fixationDelay = sharedSettings.dwellTime;
    if (fixationTimeInput) fixationTimeInput.value = String(sharedSettings.dwellTime);
    if (fixationTimeValue) fixationTimeValue.textContent = sharedSettings.dwellTime;
    document.documentElement.style.setProperty('--hover-duration', fixationDelay + 'ms');
  }

  const tileChoiceMap = new WeakMap();
  const POINTER_MOVE_THRESHOLD = 10;
  let hoveredTile = null;
  let hoveredChoice = null;
  let hoverTimeoutId = null;
  let requirePointerMotion = false;
  let lastPointerPosition = null;
  let pointerMotionOrigin = null;
  let pendingGuardedHover = null;

  function recordPointerPosition(x, y) {
    lastPointerPosition = { x, y };
    if (gazePointer) {
      gazePointer.style.left = x + 'px';
      gazePointer.style.top  = y + 'px';
    }
  }

  function isInteractiveScreenActive() {
    if (!showGazePointer) return false;
    const tilePickerVisible = tilePickerModal && tilePickerModal.style.display !== 'none';
    const tileContainerVisible = tileContainer && tileContainer.style.display !== 'none' && tileContainer.style.display !== '';
    if (videoPlaying) return false;
    return !!(tilePickerVisible || tileContainerVisible);
  }

  function updateGazeStyles() {
    if (!gazePointer) return;
    const size = parseInt(gazeSizeInput?.value, 10) || 36;
    const opct = Math.max(0, Math.min(1, (parseInt(gazeOpacityInput?.value, 10) || 100) / 100));
    if (gazeSizeValue) gazeSizeValue.textContent = size;
    if (gazeOpacityValue) gazeOpacityValue.textContent = Math.round(opct * 100);
    gazePointer.style.setProperty('--gp-size', size + 'px');
    const shouldShow = !!showGazePointer?.checked && isInteractiveScreenActive();
    gazePointer.style.opacity = shouldShow ? opct : 0;
  }

  function applyPointerToggle() {
    const enable = !!showGazePointer?.checked && isInteractiveScreenActive();
    document.documentElement.classList.toggle('hide-native-cursor', enable);
    if (gpDetails && !enable) gpDetails.open = false;
    updateGazeStyles();
    if (enable && lastPointerPosition) {
      recordPointerPosition(lastPointerPosition.x, lastPointerPosition.y);
    }
  }

  function syncEyegazeSettingsFromUI() {
    try {
      sharedSettings.showGazePointer = !!showGazePointer?.checked;
      sharedSettings.gazePointerSize = parseInt(gazeSizeInput?.value || '36', 10) || 36;
      sharedSettings.gazePointerAlpha = Math.max(0, Math.min(1, (parseInt(gazeOpacityInput?.value || '100', 10) || 100) / 100));
      if (fixationTimeInput) {
        sharedSettings.dwellTime = parseInt(fixationTimeInput.value, 10) || fixationDelay;
      }
    } catch (err) {}
  }

  if ('onpointerrawupdate' in window) {
    window.addEventListener('pointerrawupdate', event => {
      recordPointerPosition(event.clientX, event.clientY);
    }, { passive: true });
  }

  window.addEventListener('pointerleave', () => {
    if (gazePointer) {
      gazePointer._savedOpacity = gazePointer.style.opacity;
      gazePointer.style.opacity = 0;
    }
  });

  window.addEventListener('pointerenter', () => {
    updateGazeStyles();
    if (lastPointerPosition) {
      recordPointerPosition(lastPointerPosition.x, lastPointerPosition.y);
    }
  });

  [showGazePointer, gazeSizeInput, gazeOpacityInput].forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => {
      applyPointerToggle();
      syncEyegazeSettingsFromUI();
    });
  });

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
    if (gazePointer) {
      gazePointer.classList.remove('gp-dwell');
    }
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
      if (gazePointer) {
        gazePointer.classList.remove('gp-dwell');
      }
      return;
    }
    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId);
    }
    if (gazePointer) {
      gazePointer.classList.add('gp-dwell');
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
      if (currentPreview === 'youtube') {
        try { youtubePlayer.stopVideo(); } catch {}
        if (!videoPlaying && youtubeDiv) {
          videoContainer.style.display = 'none';
          youtubeDiv.style.display = 'none';
        }
      } else {
        currentPreview.pause();
        currentPreview.currentTime = 0;
      }
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
      syncEyegazeSettingsFromUI();
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
    tile.style.backgroundSize = 'contain';
    tile.style.backgroundPosition = 'center';
    tile.style.backgroundRepeat = 'no-repeat';
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
        tileOption.style.backgroundSize = 'contain';
        tileOption.style.backgroundPosition = 'center';
        tileOption.style.backgroundRepeat = 'no-repeat';
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

  // Expose for customYoutubeChoices.js callbacks
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
    if (currentVideoUrl && isYouTubeUrl(currentVideoUrl)) {
      try { youtubePlayer.stopVideo(); } catch {}
    }
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
    if (youtubeDiv) youtubeDiv.style.display = 'none';
    applyPointerToggle();
    currentVideoUrl = null;
    ensureFullscreen();
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
    currentVideoUrl = videoUrl;
    tileContainer.style.display = "none";
    tilePickerModal.style.display = "none";
    gameOptionsModal.style.display = "none";
    videoContainer.style.display = "flex";
    applyPointerToggle();
    if (isYouTubeUrl(videoUrl)) {
      videoPlayer.style.display = 'none';
      if (youtubeDiv) youtubeDiv.style.display = 'block';
      const id = getYouTubeId(videoUrl);
      const startSeconds = (enableResumeVideoCheckbox.checked && videoResumePositions[videoUrl])
        ? videoResumePositions[videoUrl]
        : 0;
      const onStateChange = (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          delete videoResumePositions[videoUrl];
          resetToChoicesScreen();
        }
      };
      if (!youtubePlayer) {
        youtubePlayer = new YT.Player('youtube-player', {
          host: 'https://www.youtube-nocookie.com',
          videoId: id,
          playerVars: { rel: 0, modestbranding: 1, controls: 0, start: startSeconds },
          events: {
            onReady: () => {
              try { youtubePlayer.playVideo(); } catch {}
            },
            onStateChange
          }
        });
      } else {
        youtubePlayer.loadVideoById({ videoId: id, startSeconds });
        try { youtubePlayer.addEventListener('onStateChange', onStateChange); } catch {}
        try { youtubePlayer.playVideo(); } catch {}
      }
    } else {
      if (youtubeDiv) youtubeDiv.style.display = 'none';
      videoPlayer.style.display = 'block';
      videoSource.src = videoUrl;
      videoPlayer.removeAttribute('controls');
      videoPlayer.load();
      videoPlayer.onloadedmetadata = () => {
        if (enableResumeVideoCheckbox.checked && videoResumePositions[videoUrl]) {
          videoPlayer.currentTime = videoResumePositions[videoUrl];
        }
        videoPlayer.play();
      };
    }
    ensureFullscreen();
    if (enableTimeLimitCheckbox.checked) {
      const limitSeconds = parseInt(timeLimitInput.value, 10) || 60;
      if (videoTimeLimitTimeout) { clearTimeout(videoTimeLimitTimeout); }
      videoTimeLimitTimeout = setTimeout(() => {
        if (videoPlaying) {
          if (enableResumeVideoCheckbox.checked) {
            if (isYouTubeUrl(videoUrl) && youtubePlayer && youtubePlayer.getCurrentTime) {
              videoResumePositions[videoUrl] = youtubePlayer.getCurrentTime();
            } else {
              videoResumePositions[videoUrl] = videoPlayer.currentTime;
            }
          } else {
            delete videoResumePositions[videoUrl];
          }
          if (isYouTubeUrl(videoUrl) && youtubePlayer) {
            youtubePlayer.pauseVideo();
          } else {
            videoPlayer.pause();
          }
          resetToChoicesScreen();
        }
      }, limitSeconds * 1000);
    }
  }

  videoPlayer.addEventListener('ended', () => {
    delete videoResumePositions[currentVideoUrl || videoSource.src];
    resetToChoicesScreen();
  });

  document.addEventListener('pointermove', event => {
    const { clientX, clientY } = event;
    const targetElement = event.target instanceof Element ? event.target : null;
    const previousPosition = lastPointerPosition
      ? { x: lastPointerPosition.x, y: lastPointerPosition.y }
      : null;
    recordPointerPosition(clientX, clientY);

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
    applyPointerToggle();
    ensureFullscreen();
    currentCategory = "all";
    categorySelect.value = "all";
    populateTilePickerGrid();
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
      startInactivityTimer();
      applyPointerToggle();
    });
  });

  categorySelect.addEventListener('change', e => {
    currentCategory = e.target.value;
    populateTilePickerGrid();
  });

  window.choiceEyegaze = window.choiceEyegaze || {};
  window.choiceEyegaze.requirePointerMotionBeforeHover = (options) => {
    requirePointerMotionBeforeHover(options);
  };
  window.choiceEyegaze.isPointerMotionRequired = () => requirePointerMotion;

  syncEyegazeSettingsFromUI();
  applyPointerToggle();

  // Initial population in case stored videos were loaded before this script
  populateTilePickerGrid();
});
