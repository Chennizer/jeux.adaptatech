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
  const choiceTypeColorsButton = document.getElementById('choice-type-colors');
  const choiceTypeWordsButton = document.getElementById('choice-type-words');
  const choiceTypeNumbersButton = document.getElementById('choice-type-numbers');
  const choiceTypePhotosButton = document.getElementById('choice-type-photos');
  const wordsOptions = document.getElementById('wordsOptions');
  const numbersOptions = document.getElementById('numbersOptions');
  const photosOptions = document.getElementById('photosOptions');
  const colorsOptions = document.getElementById('colorsOptions');
  const wordsContainer = document.getElementById('wordsContainer');
  const addWordButton = document.getElementById('addWordButton');
  const numberSlider = document.getElementById('numberSlider');
  const numberValue = document.getElementById('numberValue');
  const photoInput = document.getElementById('photoInput');
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
  let choiceType = 'colors';
  let desiredTileCount = 0;
  let selectedTileIndices = [];
  let currentSelectedIndex = 0;
  let autoScanInterval = null;
  let flashcardTimer = null;
  let photoChoices = [];

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

  function updateChoiceTypeSelection(activeButton) {
    [
      choiceTypeColorsButton,
      choiceTypeWordsButton,
      choiceTypeNumbersButton,
      choiceTypePhotosButton
    ].forEach(button => button.classList.toggle('selected', button === activeButton));
  }

  function updateChoiceTypeVisibility() {
    colorsOptions.style.display = choiceType === 'colors' ? 'block' : 'none';
    wordsOptions.style.display = choiceType === 'words' ? 'block' : 'none';
    numbersOptions.style.display = choiceType === 'numbers' ? 'block' : 'none';
    photosOptions.style.display = choiceType === 'photos' ? 'block' : 'none';
  }

  function resetSelections() {
    selectedTileIndices = [];
    currentSelectedIndex = 0;
    updateStartButtonState();
  }

  function setChoiceType(newType, activeButton) {
    choiceType = newType;
    updateChoiceTypeSelection(activeButton);
    updateChoiceTypeVisibility();
    resetSelections();
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

  choiceTypeColorsButton.addEventListener('click', () => {
    setChoiceType('colors', choiceTypeColorsButton);
  });

  choiceTypeWordsButton.addEventListener('click', () => {
    setChoiceType('words', choiceTypeWordsButton);
  });

  choiceTypeNumbersButton.addEventListener('click', () => {
    setChoiceType('numbers', choiceTypeNumbersButton);
  });

  choiceTypePhotosButton.addEventListener('click', () => {
    setChoiceType('photos', choiceTypePhotosButton);
  });

  function getWordsChoices() {
    const inputs = [...wordsContainer.querySelectorAll('.word-input')];
    return inputs
      .map(input => input.value.trim())
      .filter(Boolean)
      .slice(0, 6)
      .map(word => ({ label: word, type: 'text' }));
  }

  function getNumbersChoices() {
    const count = parseInt(numberSlider.value, 10) || 1;
    return Array.from({ length: count }, (_, idx) => ({
      label: String(idx + 1),
      type: 'text'
    }));
  }

  function getCurrentChoices() {
    if (choiceType === 'colors') return colorChoices.map(choice => ({ ...choice, type: 'color' }));
    if (choiceType === 'words') return getWordsChoices();
    if (choiceType === 'numbers') return getNumbersChoices();
    if (choiceType === 'photos') return photoChoices;
    return [];
  }

  function updateStartButtonState() {
    startGameButton.disabled = selectedTileIndices.length !== desiredTileCount;
  }

  function createChoiceTile(choice, idx, isSelected, onSelect) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.dataset.index = idx;

    if (choice.type === 'photo') {
      tile.style.backgroundImage = `url(${choice.image})`;
      tile.style.backgroundColor = '#000';
    } else if (choice.type === 'color') {
      tile.style.background = choice.color;
      tile.style.backgroundImage = 'none';
    } else {
      tile.style.background = '#1a1a1a';
      tile.style.backgroundImage = 'none';
    }

    if (isSelected) tile.classList.add('selected');

    const cap = document.createElement('div');
    cap.classList.add('caption');

    if (choice.type === 'color' && choice.name) {
      cap.classList.add('translate');
      if (choice.name.fr) cap.dataset.fr = choice.name.fr;
      if (choice.name.en) cap.dataset.en = choice.name.en;
      if (choice.name.ja) cap.dataset.ja = choice.name.ja;
      cap.textContent = choice.name.en || choice.name.fr || '';
    } else {
      cap.classList.add('no-translate');
      cap.textContent = choice.label || '';
    }

    tile.appendChild(cap);
    tile.addEventListener('click', onSelect);
    return tile;
  }

  function populateTilePickerGrid() {
    const choices = getCurrentChoices();
    selectedTileIndices = selectedTileIndices.filter(i => i < choices.length);
    updateStartButtonState();
    tilePickerGrid.innerHTML = '';
    const grid = document.createElement('div');

    choices.forEach((choice, idx) => {
      const isSel = selectedTileIndices.includes(idx);
      const tile = createChoiceTile(choice, idx, isSel, () => {
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
    const cols = Math.ceil(Math.sqrt(Math.max(choices.length, 1)));
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
    const choices = getCurrentChoices();
    tileContainer.innerHTML = '';
    const idx = selectedTileIndices[currentSelectedIndex];
    const choice = choices[idx];
    if (!choice) return;
    const tile = createChoiceTile(choice, idx, false, () => {});
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
    const choices = getCurrentChoices();

    if (mode === 'flashcard' || mode === 'flashcard-manual') {
      renderFlashcard();
      if (mode === 'flashcard') {
        startFlashcardTimer();
      }
      return;
    }

    const tiles = selectedTileIndices.map(i => choices[i]).filter(Boolean);
    tiles.forEach((choice, idx) => {
      const tile = createChoiceTile(choice, idx, false, () => {
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

  function wireWordInputs() {
    wordsContainer.addEventListener('input', () => {
      if (choiceType === 'words') {
        resetSelections();
      }
    });
  }

  function addWordInput() {
    const inputs = wordsContainer.querySelectorAll('.word-input');
    if (inputs.length >= 6) return;
    const nextIndex = inputs.length + 1;
    const input = document.createElement('input');
    input.classList.add('word-input');
    input.type = 'text';
    input.placeholder = `Word ${nextIndex}`;
    wordsContainer.appendChild(input);
  }

  function setupNumberSlider() {
    numberSlider.addEventListener('input', () => {
      numberValue.textContent = numberSlider.value;
      if (choiceType === 'numbers') {
        resetSelections();
      }
    });
  }

  function setupPhotoInput() {
    photoInput.addEventListener('change', () => {
      const files = Array.from(photoInput.files || []).slice(0, 6);
      if (!files.length) {
        photoChoices = [];
        if (choiceType === 'photos') {
          resetSelections();
        }
        return;
      }

      Promise.all(
        files.map(file => new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            label: file.name,
            image: reader.result,
            type: 'photo'
          });
          reader.readAsDataURL(file);
        }))
      ).then(results => {
        photoChoices = results;
        if (choiceType === 'photos') {
          resetSelections();
        }
      });
    });
  }

  addWordButton.addEventListener('click', () => {
    addWordInput();
  });

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

  updateChoiceTypeVisibility();
  wireWordInputs();
  setupNumberSlider();
  setupPhotoInput();
});
