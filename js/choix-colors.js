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
  const enableCycleSoundCheckbox = document.getElementById('enable-cycle-sound');
  const tilePickerModal = document.getElementById('tile-picker-modal');
  const tilePickerGrid = document.getElementById('tile-picker-grid');
  const tilePickerPanel = tilePickerModal ? tilePickerModal.querySelector('#control-panel-options') : null;
  const tileCountDisplay = document.getElementById('tile-count-display');
  const startGameButton = document.getElementById('start-game-button');
  const tileContainer = document.getElementById('tile-container');
  const cycleSfx = new Audio("../../sounds/woosh.mp3");
  cycleSfx.preload = 'auto';
  cycleSfx.load();

  const colorChoices = [
    { name: { fr: 'Rouge', en: 'Red', ja: '赤' }, color: '#e53935' },
    { name: { fr: 'Vert', en: 'Green', ja: '緑' }, color: '#43a047' },
    { name: { fr: 'Bleu', en: 'Blue', ja: '青' }, color: '#1e88e5' },
    { name: { fr: 'Jaune', en: 'Yellow', ja: '黄' }, color: '#fdd835' },
    { name: { fr: 'Rose', en: 'Pink', ja: 'ピンク' }, color: '#ec407a' },
    { name: { fr: 'Violet', en: 'Purple', ja: '紫' }, color: '#8e24aa' },
    { name: { fr: 'Orange', en: 'Orange', ja: 'オレンジ' }, color: '#fb8c00' },
    { name: { fr: 'Marron', en: 'Brown', ja: '茶' }, color: '#6d4c41' },
    { name: { fr: 'Blanc', en: 'White', ja: '白' }, color: '#ffffff' },
    { name: { fr: 'Gris', en: 'Gray', ja: '灰' }, color: '#9e9e9e' },
    { name: { fr: 'Sarcelle', en: 'Teal', ja: '青緑' }, color: '#00897b' },
    { name: { fr: 'Or', en: 'Gold', ja: '金' }, color: '#f9a825' }
  ];

  let inputEnabled = false;
  let mode = 'choice';
  let desiredTileCount = 0;
  let selectedTileIndices = [];
  let currentSelectedIndex = 0;
  let autoScanInterval = null;
  let flashcardTimer = null;

  tileCountInput.addEventListener('input', () => {
    document.getElementById('tile-count-value').textContent = tileCountInput.value;
  });

  function resetTileCountToDefault() {
    tileCountInput.value = 3;
    document.getElementById('tile-count-value').textContent = 3;
    tileCountInput.disabled = false;
  }

  function showScanOptions(show) {
    scanDelayContainer.style.display = show ? 'block' : 'none';
  }

  function updateModeSelection(activeButton) {
    [
      modeChoiceButton,
      modeScanButton,
      modeThisOrThatButton,
      modeFlashcardButton,
      modeFlashcardManualButton
    ].forEach(button => button.classList.toggle('selected', button === activeButton));
  }

  modeChoiceButton.addEventListener('click', () => {
    mode = 'choice';
    updateModeSelection(modeChoiceButton);
    resetTileCountToDefault();
    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    showScanOptions(false);
    document.body.classList.remove('this-or-that-mode', 'flashcard-mode');
  });

  modeScanButton.addEventListener('click', () => {
    mode = 'scan';
    updateModeSelection(modeScanButton);
    resetTileCountToDefault();
    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    showScanOptions(true);
    document.body.classList.remove('this-or-that-mode', 'flashcard-mode');
  });

  modeThisOrThatButton.addEventListener('click', () => {
    mode = 'thisOrThat';
    updateModeSelection(modeThisOrThatButton);
    tileCountInput.value = 2;
    document.getElementById('tile-count-value').textContent = 2;
    tileCountInput.disabled = true;
    tileSliderContainer.style.visibility = 'hidden';
    showScanOptions(false);
    document.body.classList.add('this-or-that-mode');
    document.body.classList.remove('flashcard-mode');
  });

  modeFlashcardButton.addEventListener('click', () => {
    mode = 'flashcard';
    updateModeSelection(modeFlashcardButton);
    resetTileCountToDefault();
    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    showScanOptions(true);
    document.body.classList.add('flashcard-mode');
    document.body.classList.remove('this-or-that-mode');
  });

  modeFlashcardManualButton.addEventListener('click', () => {
    mode = 'flashcard-manual';
    updateModeSelection(modeFlashcardManualButton);
    resetTileCountToDefault();
    tileCountContainer.style.display = 'flex';
    tileSliderContainer.style.visibility = 'visible';
    showScanOptions(false);
    document.body.classList.add('flashcard-mode');
    document.body.classList.remove('this-or-that-mode');
  });

  function updateStartButtonState() {
    startGameButton.disabled = selectedTileIndices.length !== desiredTileCount;
  }

  function createColorTile(choice, idx, isSelected, onSelect) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.dataset.index = idx;
    tile.style.background = choice.color;
    tile.style.backgroundImage = 'none';
    if (isSelected) tile.classList.add('selected');
    const cap = document.createElement('div');
    cap.classList.add('caption', 'translate');
    if (choice.name.fr) cap.dataset.fr = choice.name.fr;
    if (choice.name.en) cap.dataset.en = choice.name.en;
    if (choice.name.ja) cap.dataset.ja = choice.name.ja;
    cap.textContent = choice.name.en || choice.name.fr || '';
    tile.appendChild(cap);
    tile.addEventListener('click', onSelect);
    return tile;
  }

  function populateTilePickerGrid() {
    selectedTileIndices = selectedTileIndices.filter(i => i < colorChoices.length);
    updateStartButtonState();
    tilePickerGrid.innerHTML = '';
    const grid = document.createElement('div');

    colorChoices.forEach((choice, idx) => {
      const isSel = selectedTileIndices.includes(idx);
      const tile = createColorTile(choice, idx, isSel, () => {
        if (isSel) {
          selectedTileIndices = selectedTileIndices.filter(i => i !== idx);
        } else if (selectedTileIndices.length < desiredTileCount) {
          selectedTileIndices.push(idx);
        }
        updateStartButtonState();
        populateTilePickerGrid();
      });
      grid.appendChild(tile);
    });

    const tileSize = 100;
    const gap = 10;
    const cols = Math.ceil(Math.sqrt(colorChoices.length));
    const width = cols * tileSize + (cols - 1) * gap;
    Object.assign(grid.style, {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
      gap: `${gap}px`,
      width: `${width}px`,
      margin: '10px auto'
    });

    tilePickerGrid.appendChild(grid);

    if (tilePickerPanel) {
      const panelWidth = Math.max(360, width + 40);
      tilePickerPanel.style.width = `${panelWidth}px`;
    }

    if (typeof updateLanguage === 'function') {
      updateLanguage();
    }
  }

  function clearFlashcardTimer() {
    if (flashcardTimer) {
      clearTimeout(flashcardTimer);
      flashcardTimer = null;
    }
  }

  function clearScanInterval() {
    if (autoScanInterval) {
      clearInterval(autoScanInterval);
      autoScanInterval = null;
    }
  }

  function playCycleSound() {
    if (!enableCycleSoundCheckbox.checked) return;
    try {
      cycleSfx.currentTime = 0;
      cycleSfx.play();
    } catch (e) {
      console.error(e);
    }
  }

  function renderFlashcard() {
    tileContainer.innerHTML = '';
    const idx = selectedTileIndices[currentSelectedIndex];
    const choice = colorChoices[idx];
    const tile = createColorTile(choice, idx, false, () => {});
    tileContainer.appendChild(tile);
    tileContainer.style.display = 'flex';
    if (typeof updateLanguage === 'function') {
      updateLanguage();
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
  }

  function updateSelection() {
    if (mode === 'thisOrThat' || mode === 'flashcard') return;
    const tiles = document.querySelectorAll('#tile-container .tile');
    tiles.forEach((tile, index) => {
      tile.classList.toggle('selected', index === currentSelectedIndex);
    });
  }

  function cycleToNextTile() {
    const tiles = document.querySelectorAll('#tile-container .tile');
    if (!tiles.length) return;
    currentSelectedIndex = (currentSelectedIndex + 1) % tiles.length;
    updateSelection();
    playCycleSound();
  }

  function renderGameTiles() {
    clearScanInterval();
    clearFlashcardTimer();
    tileContainer.innerHTML = '';

    if (mode === 'flashcard' || mode === 'flashcard-manual') {
      renderFlashcard();
      if (mode === 'flashcard') {
        startFlashcardTimer();
      }
      return;
    }

    const tiles = selectedTileIndices.map(i => colorChoices[i]);
    tiles.forEach((choice, idx) => {
      const tile = createColorTile(choice, idx, false, () => {
        currentSelectedIndex = idx;
        updateSelection();
      });
      if (mode === 'thisOrThat') {
        tile.classList.add(idx === 0 ? 'selected-left' : 'selected-right');
      }
      tileContainer.appendChild(tile);
    });

    if (selectedTileIndices.length === 4) tileContainer.classList.add('grid-2x2');
    else tileContainer.classList.remove('grid-2x2');

    if (selectedTileIndices.length === 2) tileContainer.classList.add('two-tiles');
    else tileContainer.classList.remove('two-tiles');

    tileContainer.style.display = 'flex';
    currentSelectedIndex = 0;
    if (mode !== 'thisOrThat') updateSelection();

    if (mode === 'scan') {
      const d = parseInt(scanDelayInput.value, 10) || 3;
      autoScanInterval = setInterval(cycleToNextTile, d * 1000);
    }

    if (typeof updateLanguage === 'function') {
      updateLanguage();
    }
  }

  chooseTilesButton.addEventListener('click', () => {
    desiredTileCount = (mode === 'thisOrThat')
      ? 2
      : (parseInt(tileCountInput.value, 10) || 0);
    tileCountDisplay.textContent = desiredTileCount;
    tilePickerModal.style.display = 'flex';
    populateTilePickerGrid();
  });

  startGameButton.addEventListener('click', () => {
    inputEnabled = true;
    tilePickerModal.style.display = 'none';
    gameOptionsModal.style.display = 'none';
    renderGameTiles();
  });

  document.addEventListener('keydown', e => {
    if (!inputEnabled) return;
    const tiles = document.querySelectorAll('#tile-container .tile');
    if (mode === 'flashcard-manual' && e.key === 'Enter') {
      e.preventDefault();
      playCycleSound();
      currentSelectedIndex = (currentSelectedIndex + 1) % selectedTileIndices.length;
      renderFlashcard();
      return;
    }

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
    }
  });
});
