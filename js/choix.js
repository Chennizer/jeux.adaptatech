document.addEventListener('DOMContentLoaded', () => {
  /* --- DOM ELEMENTS --- */
  // Options Modal (Step 1) elements
  const gameOptionsModal = document.getElementById('game-options');
  const tileCountInput = document.getElementById('tile-count');
  const chooseTilesButton = document.getElementById('choose-tiles-button');
  
  // Mode selection elements (using our styled buttons)
  const modeChoiceButton = document.getElementById('mode-choice-button');
  const modeScanButton = document.getElementById('mode-scan-button');
  const scanDelayContainer = document.getElementById('scan-delay-container');
  const scanDelayInput = document.getElementById('scan-delay');
  
  // New checkbox for enabling cycle sound effect
  const enableCycleSoundCheckbox = document.getElementById('enable-cycle-sound');
  
  // Tile Picker Modal (Step 2) elements
  const tilePickerModal = document.getElementById('tile-picker-modal');
  const tilePickerGrid = document.getElementById('tile-picker-grid');
  const tileCountDisplay = document.getElementById('tile-count-display');
  const startGameButton = document.getElementById('start-game-button');
  
  // Game Containers
  const tileContainer = document.getElementById('tile-container');
  const videoContainer = document.getElementById('video-container');
  const videoPlayer = document.getElementById('video-player');
  const videoSource = document.getElementById('video-source');
  
  /* --- GAME VARIABLES --- */
  // mediaChoices is assumed to be defined in choiceArray.js
  let currentSelectedIndex = 0;
  let videoPlaying = false; // Disable input while video plays
  // Array to hold the indices of the tiles selected by the user in the picker
  let selectedTileIndices = [];
  let desiredTileCount = 0; // The number of tiles the user wants to use
  
  // Mode variable: default to "choice"
  let mode = "choice";
  
  // Variable for auto-scan interval (if in scan mode)
  let autoScanInterval = null;
  
  // Variables for audio preview of the selected tile
  let currentPreview = null;
  let previewTimeout = null;
  let previewDelayTimeout = null;  // Delay before starting preview
  
  /* --- HELPER FUNCTIONS --- */
  
  // Stops any preview audio and clears the preview delay timeout.
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
  }
  
  // Function to play the cycle sound effect.
  function playCycleSound() {
    if (enableCycleSoundCheckbox.checked) {
      const cycleSound = new Audio("../../sounds/woosh.mp3");
      cycleSound.play().catch(err => console.error("Cycle sound error:", err));
    }
  }
  
  /* --- MODE BUTTON EVENT HANDLERS --- */
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
  
  /* --- FUNCTIONS --- */
  
  // Render the tile picker grid with all available tile options.
  function populateTilePickerGrid() {
    tilePickerGrid.innerHTML = "";
    mediaChoices.forEach((choice, index) => {
      const tileOption = document.createElement('div');
      tileOption.classList.add('tile');
      tileOption.setAttribute('data-index', index);
      tileOption.style.backgroundImage = `url(${choice.image})`;
  
      const caption = document.createElement('div');
      caption.classList.add('caption');
      caption.textContent = choice.name;
      tileOption.appendChild(caption);
  
      // Toggle selection on click.
      tileOption.addEventListener('click', () => {
        if (selectedTileIndices.includes(index)) {
          // Deselect tile.
          selectedTileIndices = selectedTileIndices.filter(i => i !== index);
          tileOption.classList.remove('selected');
        } else {
          // Only allow selection if we haven't reached the desired count.
          if (selectedTileIndices.length < desiredTileCount) {
            selectedTileIndices.push(index);
            tileOption.classList.add('selected');
          }
        }
        startGameButton.disabled = (selectedTileIndices.length !== desiredTileCount);
      });
  
      tilePickerGrid.appendChild(tileOption);
    });
  }
  
  // Render the main game tile grid using only the selected tile indices.
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
  
    // If mode is "scan", start the auto-scan interval.
    if (mode === "scan") {
      const delay = parseInt(scanDelayInput.value, 10) || 3;
      autoScanInterval = setInterval(() => {
        cycleToNextTile();
      }, delay * 1000);
    }
  }
  
  // Update the visual selection on the main game tile grid.
  function updateSelection() {
    const tiles = document.querySelectorAll('#tile-container .tile');
    tiles.forEach((tile, index) => {
      if (index === currentSelectedIndex) {
        tile.classList.add('selected');
      } else {
        tile.classList.remove('selected');
      }
    });
    if (!videoPlaying) {
      // Cancel any pending preview delay, then start a new delay.
      if (previewDelayTimeout) {
        clearTimeout(previewDelayTimeout);
        previewDelayTimeout = null;
      }
      previewDelayTimeout = setTimeout(() => {
        playPreviewForTile(currentSelectedIndex);
      }, 1200); // 
    }
  }
  
  // Cycle to the next tile, cancel any preview, update selection, and play the cycle sound.
  function cycleToNextTile() {
    // Stop any ongoing preview before cycling.
    stopPreview();
    const tiles = document.querySelectorAll('#tile-container .tile');
    const total = tiles.length;
    if (total === 0) return;
    currentSelectedIndex = (currentSelectedIndex + 1) % total;
    updateSelection();
    playCycleSound();
  }
  
  // Play a 10-second audio preview from the video file associated with the selected tile.
  function playPreviewForTile(index) {
    stopPreview(); // Ensure no other preview is running
    if (selectedTileIndices.length === 0) return;
    const mediaIndex = selectedTileIndices[index];
    const videoFile = mediaChoices[mediaIndex].video;
    if (videoFile) {
      currentPreview = new Audio(videoFile);
      currentPreview.play().catch(err => console.error("Audio preview error:", err));
      previewTimeout = setTimeout(() => {
        stopPreview();
      }, 10000); // 10-second preview duration
    }
  }
  
  // Keyboard navigation and selection for the main game grid.
  document.addEventListener('keydown', (e) => {
    if (videoPlaying) return;
  
    const tiles = document.querySelectorAll('#tile-container .tile');
    const total = tiles.length;
    if (total === 0) return;
  
    if (mode === "choice" && e.key === "Enter") {
      // In choice mode, pressing Enter should cycle to next tile and cancel the preview.
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
  
  // Plays the video in fullscreen and disables further input.
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
    videoPlayer.play();
  
    if (videoContainer.requestFullscreen) {
      videoContainer.requestFullscreen().catch(err => console.error(err));
    } else if (videoContainer.mozRequestFullScreen) {
      videoContainer.mozRequestFullScreen();
    } else if (videoContainer.webkitRequestFullscreen) {
      videoContainer.webkitRequestFullscreen();
    } else if (videoContainer.msRequestFullscreen) {
      videoContainer.msRequestFullscreen();
    }
  }
  
  // When the video ends, exit fullscreen and return to the main game grid.
  videoPlayer.addEventListener('ended', () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    videoContainer.style.display = 'none';
    tileContainer.style.display = 'flex';
    videoPlayer.currentTime = 0;
    videoPlaying = false;
    updateSelection();
  });
  
  /* --- EVENT HANDLERS --- */
  
  // When "Choose Tiles" is clicked in the first modal (Step 1),
  // read the desired tile count, update display, and show the Tile Picker Modal (Step 2).
  chooseTilesButton.addEventListener('click', () => {
    desiredTileCount = parseInt(tileCountInput.value, 10) || 0;
    tileCountDisplay.textContent = desiredTileCount;
    selectedTileIndices = [];
    populateTilePickerGrid();
    gameOptionsModal.style.display = 'none';
    tilePickerModal.style.display = 'flex';
  });
  
  // Enable the "Start Game" button in the tile picker only when the user has selected exactly the required number of tiles.
  startGameButton.addEventListener('click', () => {
    renderGameTiles();
    tilePickerModal.style.display = 'none';
    tileContainer.style.display = 'flex';
  });
  
  // (Optional: Additional code can be added here to toggle scan delay input when mode changes, etc.)
});
