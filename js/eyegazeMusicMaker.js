document.addEventListener('DOMContentLoaded', () => {
  const gameOptionsModal = document.getElementById('game-options');
  const chooseInstrumentsButton = document.getElementById('choose-instruments-button');
  const tilePickerModal = document.getElementById('tile-picker-modal');
  const tilePickerGrid = document.getElementById('tile-picker-grid');
  const startGameButton = document.getElementById('start-game-button');
  const instrumentStage = document.getElementById('instrument-stage');
  const instrumentGrid = document.getElementById('instrument-grid');

  const volumeSlider = document.getElementById('volume-slider');
  const volumeValue = document.getElementById('volume-value');
  const instrumentCountSlider = document.getElementById('instrument-count');
  const instrumentCountValue = document.getElementById('instrument-count-value');
  const instrumentCountDisplay = document.getElementById('instrument-count-display');

  const fixationTimeInput = document.getElementById('fixation-time');
  const fixationTimeValue = document.getElementById('fixation-time-value');

  const showGazePointer = document.getElementById('showGazePointer');
  const gazeSize = document.getElementById('gazeSize');
  const gazeSizeVal = document.getElementById('gazeSizeVal');
  const gazeOpacity = document.getElementById('gazeOpacity');
  const gazeOpacityVal = document.getElementById('gazeOpacityVal');
  const gpDetails = document.getElementById('gpDetails');
  const gazePointer = document.getElementById('gazePointer');

  const languageToggle = document.getElementById('language-toggle') || document.getElementById('langToggle');

  const instrumentChoices = [
    {
      id: 'guitar',
      name: { fr: 'Guitare', en: 'Guitar', ja: 'ギター' },
      image: '../../images/pictos/guitar.png',
      sound: '../../sounds/africaflute.mp3',
    },
    {
      id: 'drum',
      name: { fr: 'Batterie', en: 'Drums', ja: 'ドラム' },
      image: '../../images/pictos/music.png',
      sound: '../../sounds/beatles.mp3',
    },
    {
      id: 'piano',
      name: { fr: 'Piano', en: 'Piano', ja: 'ピアノ' },
      image: '../../images/pictos/apple.png',
      sound: '../../sounds/arthur.mp3',
    },
    {
      id: 'flute',
      name: { fr: 'Flûte', en: 'Flute', ja: 'フルート' },
      image: '../../images/pictos/balloon.png',
      sound: '../../sounds/belleetbete.mp3',
    },
    {
      id: 'bass',
      name: { fr: 'Basse', en: 'Bass', ja: 'ベース' },
      image: '../../images/pictos/banana.png',
      sound: '../../sounds/blade.mp3',
    },
    {
      id: 'synth',
      name: { fr: 'Synthé', en: 'Synth', ja: 'シンセ' },
      image: '../../images/pictos/avocado.png',
      sound: '../../sounds/ca.mp3',
    },
  ];

  const instrumentTiles = new Map();
  const selectedIds = new Set();
  const audioMap = new Map();

  let fixationDelay = 2000;
  let hoverTimeout = null;
  let hoveredTile = null;
  let hoveredId = null;
  let lastPointerPosition = null;

  function getCurrentLanguage() {
    const stored = localStorage.getItem('siteLanguage');
    return stored || document.documentElement.lang || 'en';
  }

  function getChoiceLabel(choice) {
    if (!choice || !choice.name) return '';
    const lang = getCurrentLanguage().startsWith('fr') ? 'fr' : getCurrentLanguage().startsWith('ja') ? 'ja' : 'en';
    return choice.name[lang] || choice.name.en || choice.name.fr || choice.name.ja || '';
  }

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

  function isPointerStageActive() {
    return isElementShown(tilePickerModal) || isElementShown(instrumentStage);
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
    const size = parseInt(gazeSize?.value, 10) || 36;
    const opacity = Math.max(0.2, Math.min(1, (parseInt(gazeOpacity?.value, 10) || 100) / 100));
    if (gazeSizeVal) gazeSizeVal.textContent = size;
    if (gazeOpacityVal) gazeOpacityVal.textContent = Math.round(opacity * 100);
    gazePointer.style.setProperty('--gp-size', `${size}px`);
    const pointerVisible = !!showGazePointer?.checked && isPointerStageActive();
    document.documentElement.classList.toggle('hide-native-cursor', pointerVisible);
    if (!pointerVisible) {
      setPointerDwell(false);
      if (gpDetails) gpDetails.open = false;
    }
    gazePointer.style.opacity = pointerVisible ? opacity : 0;
    if (pointerVisible && lastPointerPosition) {
      setPointerPos(lastPointerPosition.x, lastPointerPosition.y);
    }
  }

  function updateVolumeDisplay() {
    if (!volumeSlider || !volumeValue) return;
    volumeValue.textContent = volumeSlider.value;
    const volume = parseInt(volumeSlider.value, 10) / 100;
    audioMap.forEach((audio) => {
      audio.volume = volume;
    });
  }

  function updateInstrumentCountDisplay() {
    if (!instrumentCountSlider) return;
    const count = parseInt(instrumentCountSlider.value, 10) || 1;
    if (instrumentCountValue) instrumentCountValue.textContent = count;
    if (instrumentCountDisplay) instrumentCountDisplay.textContent = ` ${count} `;
    while (selectedIds.size > count) {
      const toRemove = selectedIds.values().next().value;
      if (toRemove) {
        selectedIds.delete(toRemove);
      } else {
        break;
      }
    }
    syncSelectionState();
  }

  function updateFixationTimeDisplay() {
    if (!fixationTimeInput || !fixationTimeValue) return;
    const dwellVal = parseInt(fixationTimeInput.value, 10) || 2000;
    fixationDelay = dwellVal;
    fixationTimeValue.textContent = dwellVal;
    if (typeof setEyegazeDwellTime === 'function') {
      setEyegazeDwellTime(dwellVal);
    }
  }

  function syncSelectionState() {
    instrumentTiles.forEach((tile, id) => {
      tile.classList.toggle('selected', selectedIds.has(id));
    });
    const desiredCount = parseInt(instrumentCountSlider.value, 10) || 1;
    if (startGameButton) {
      startGameButton.disabled = selectedIds.size !== desiredCount;
    }
  }

  function toggleSelection(choiceId) {
    const desiredCount = parseInt(instrumentCountSlider.value, 10) || 1;
    if (selectedIds.has(choiceId)) {
      selectedIds.delete(choiceId);
    } else if (selectedIds.size < desiredCount) {
      selectedIds.add(choiceId);
    }
    syncSelectionState();
  }

  function renderPickerGrid() {
    if (!tilePickerGrid) return;
    tilePickerGrid.innerHTML = '';
    instrumentTiles.clear();
    instrumentChoices.forEach((choice) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.backgroundImage = `url(${choice.image})`;
      const caption = document.createElement('span');
      caption.className = 'caption';
      caption.textContent = getChoiceLabel(choice);
      tile.appendChild(caption);
      tile.addEventListener('click', () => toggleSelection(choice.id));
      tilePickerGrid.appendChild(tile);
      instrumentTiles.set(choice.id, tile);
    });
    syncSelectionState();
  }

  function refreshInstrumentCaptions() {
    instrumentChoices.forEach((choice) => {
      const tile = instrumentTiles.get(choice.id);
      if (!tile) return;
      const caption = tile.querySelector('.caption');
      if (caption) caption.textContent = getChoiceLabel(choice);
    });
    document.querySelectorAll('.instrument-label').forEach((labelEl) => {
      const id = labelEl.getAttribute('data-id');
      const choice = instrumentChoices.find((item) => item.id === id);
      if (choice) {
        labelEl.textContent = getChoiceLabel(choice);
      }
    });
  }

  function stopHover(tile) {
    if (hoveredTile !== tile) return;
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
    hoveredTile.classList.remove('is-dwell');
    setPointerDwell(false);
    hoveredTile = null;
    hoveredId = null;
  }

  function startHover(tile, choiceId) {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    hoveredTile = tile;
    hoveredId = choiceId;
    hoveredTile.classList.add('is-dwell');
    setPointerDwell(true);
    hoverTimeout = window.setTimeout(() => {
      toggleInstrument(choiceId);
      if (hoveredTile) hoveredTile.classList.remove('is-dwell');
      setPointerDwell(false);
      hoveredTile = null;
      hoveredId = null;
      hoverTimeout = null;
    }, fixationDelay);
  }

  function toggleInstrument(choiceId) {
    const audio = audioMap.get(choiceId);
    const tile = instrumentGrid.querySelector(`[data-id="${choiceId}"]`);
    if (!audio || !tile) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      tile.classList.add('is-playing');
    } else {
      audio.pause();
      audio.currentTime = 0;
      tile.classList.remove('is-playing');
    }
  }

  function buildStage() {
    instrumentGrid.innerHTML = '';
    audioMap.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioMap.clear();

    const volume = parseInt(volumeSlider.value, 10) / 100;
    const selectedChoices = instrumentChoices.filter((choice) => selectedIds.has(choice.id));

    selectedChoices.forEach((choice) => {
      const tile = document.createElement('div');
      tile.className = 'instrument-tile';
      tile.dataset.id = choice.id;

      const img = document.createElement('img');
      img.src = choice.image;
      img.alt = getChoiceLabel(choice);

      const label = document.createElement('div');
      label.className = 'instrument-label';
      label.dataset.id = choice.id;
      label.textContent = getChoiceLabel(choice);

      tile.appendChild(img);
      tile.appendChild(label);

      tile.addEventListener('pointerenter', () => startHover(tile, choice.id));
      tile.addEventListener('pointerleave', () => stopHover(tile));
      tile.addEventListener('pointercancel', () => stopHover(tile));
      tile.addEventListener('click', () => toggleInstrument(choice.id));

      instrumentGrid.appendChild(tile);

      const audio = new Audio(choice.sound);
      audio.loop = true;
      audio.volume = volume;
      audioMap.set(choice.id, audio);
    });

    refreshInstrumentCaptions();
  }

  function enterFullscreen() {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  }

  function startGame() {
    if (gameOptionsModal) gameOptionsModal.style.display = 'none';
    if (tilePickerModal) tilePickerModal.style.display = 'none';
    if (instrumentStage) instrumentStage.style.display = 'flex';
    buildStage();
    enterFullscreen();
    refreshPointerStyles();
  }

  if (volumeSlider) {
    updateVolumeDisplay();
    volumeSlider.addEventListener('input', updateVolumeDisplay);
  }

  if (instrumentCountSlider) {
    instrumentCountSlider.max = String(Math.min(6, instrumentChoices.length));
    instrumentCountSlider.addEventListener('input', updateInstrumentCountDisplay);
    updateInstrumentCountDisplay();
  }

  if (fixationTimeInput) {
    const storedDwell = Number(window?.eyegazeSettings?.dwellTime);
    if (Number.isFinite(storedDwell)) {
      fixationTimeInput.value = String(storedDwell);
    }
    updateFixationTimeDisplay();
    fixationTimeInput.addEventListener('input', updateFixationTimeDisplay);
  }

  if (chooseInstrumentsButton) {
    chooseInstrumentsButton.addEventListener('click', () => {
      if (gameOptionsModal) gameOptionsModal.style.display = 'none';
      if (tilePickerModal) tilePickerModal.style.display = 'flex';
      renderPickerGrid();
      refreshPointerStyles();
    });
  }

  if (startGameButton) {
    startGameButton.addEventListener('click', startGame);
  }

  if (showGazePointer || gazeSize || gazeOpacity) {
    [showGazePointer, gazeSize, gazeOpacity].forEach((control) => {
      control?.addEventListener('input', refreshPointerStyles);
      control?.addEventListener('change', refreshPointerStyles);
    });
  }

  if (languageToggle) {
    languageToggle.addEventListener('pointerup', () => {
      window.setTimeout(() => {
        refreshInstrumentCaptions();
        updateInstrumentCountDisplay();
      }, 0);
    });
  }

  if (gazePointer) {
    ensurePointerOverlay();
  }

  document.addEventListener('pointermove', (event) => {
    lastPointerPosition = { x: event.clientX, y: event.clientY };
    if (gazePointer && isPointerStageActive()) {
      setPointerPos(event.clientX, event.clientY);
    }
  });

  window.addEventListener('resize', refreshPointerStyles);

  renderPickerGrid();
  refreshPointerStyles();
});
