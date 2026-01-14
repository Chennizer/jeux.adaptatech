document.addEventListener('DOMContentLoaded', () => {
  const gameOptionsModal = document.getElementById('game-options');
  const tilePickerModal = document.getElementById('tile-picker-modal');
  const tilePickerGrid = document.getElementById('tile-picker-grid');
  const tileContainer = document.getElementById('tile-container');
  const chooseTilesButton = document.getElementById('choose-tiles-button');
  const startGameButton = document.getElementById('start-game-button');
  const tileCountInput = document.getElementById('tile-count');
  const tileCountValueSpan = document.getElementById('tile-count-value');
  const tileCountDisplay = document.getElementById('tile-count-display');
  const volumeInput = document.getElementById('music-volume');
  const volumeValue = document.getElementById('music-volume-value');
  const backgroundSelect = document.getElementById('background-color');
  const fixationTimeInput = document.getElementById('fixation-time');
  const fixationTimeValue = document.getElementById('fixation-time-value');
  const showGazePointer = document.getElementById('showGazePointer');
  const gazeSize = document.getElementById('gazeSize');
  const gazeSizeVal = document.getElementById('gazeSizeVal');
  const gazeOpacity = document.getElementById('gazeOpacity');
  const gazeOpacityVal = document.getElementById('gazeOpacityVal');
  const gazePointer = document.getElementById('gazePointer');

  const instruments = [
    { id: 'drum', label: 'Drum', image: '../../images/pictos/balloon.png', sound: '../../sounds/beatles.mp3' },
    { id: 'bell', label: 'Bell', image: '../../images/pictos/apple.png', sound: '../../sounds/beatles.mp3' },
    { id: 'piano', label: 'Piano', image: '../../images/pictos/avocado.png', sound: '../../sounds/beatles.mp3' },
    { id: 'guitar', label: 'Guitar', image: '../../images/pictos/banana.png', sound: '../../sounds/beatles.mp3' },
    { id: 'marimba', label: 'Marimba', image: '../../images/pictos/almond.png', sound: '../../sounds/beatles.mp3' },
    { id: 'synth', label: 'Synth', image: '../../images/pictos/assistivebike.png', sound: '../../sounds/beatles.mp3' },
    { id: 'flute', label: 'Flute', image: '../../images/pictos/assistiveswitches.png', sound: '../../sounds/beatles.mp3' },
    { id: 'bass', label: 'Bass', image: '../../images/pictos/angry.png', sound: '../../sounds/beatles.mp3' },
    { id: 'pad', label: 'Pad', image: '../../images/pictos/OSD.png', sound: '../../sounds/beatles.mp3' }
  ];

  let desiredTileCount = parseInt(tileCountInput.value, 10) || 3;
  let fixationDelay = parseInt(fixationTimeInput.value, 10) || 2000;
  let currentVolume = parseInt(volumeInput.value, 10) || 60;
  let selectedIds = [];
  let audioMap = new Map();

  function updateVolumeDisplay() {
    volumeValue.textContent = currentVolume;
  }

  function updateTileCountDisplay() {
    tileCountValueSpan.textContent = desiredTileCount;
    tileCountDisplay.textContent = desiredTileCount;
  }

  function updateFixationDisplay() {
    fixationTimeValue.textContent = fixationDelay;
    document.documentElement.style.setProperty('--hover-duration', `${fixationDelay}ms`);
  }

  function ensurePointerOverlay() {
    if (!gazePointer) return;
    const overlay = document.getElementById('gazePointerOverlay');
    if (overlay && gazePointer.parentElement !== overlay) {
      overlay.appendChild(gazePointer);
    }
  }

  function updatePointerStyle() {
    if (!gazePointer) return;
    const size = parseInt(gazeSize.value, 10) || 36;
    const opacity = parseInt(gazeOpacity.value, 10) || 100;
    gazeSizeVal.textContent = size;
    gazeOpacityVal.textContent = opacity;
    gazePointer.style.setProperty('--gp-size', `${size}px`);
    gazePointer.style.opacity = showGazePointer.checked ? opacity / 100 : 0;
    document.body.classList.toggle('hide-native-cursor', showGazePointer.checked);
  }

  function updateAudioVolume() {
    audioMap.forEach(audio => {
      audio.volume = currentVolume / 100;
    });
  }

  function updateBackground() {
    if (!backgroundSelect) return;
    document.body.style.backgroundColor = backgroundSelect.value;
  }

  function trimSelections() {
    if (selectedIds.length <= desiredTileCount) return;
    selectedIds = selectedIds.slice(0, desiredTileCount);
  }

  function renderPicker() {
    tilePickerGrid.innerHTML = '';
    instruments.forEach(instrument => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.backgroundImage = `url(${instrument.image})`;
      tile.dataset.id = instrument.id;

      const caption = document.createElement('span');
      caption.className = 'caption';
      caption.textContent = instrument.label;
      tile.appendChild(caption);

      if (selectedIds.includes(instrument.id)) {
        tile.classList.add('selected');
      }

      tile.addEventListener('click', () => {
        if (selectedIds.includes(instrument.id)) {
          selectedIds = selectedIds.filter(id => id !== instrument.id);
        } else if (selectedIds.length < desiredTileCount) {
          selectedIds.push(instrument.id);
        }
        renderPicker();
        updateStartState();
      });

      tilePickerGrid.appendChild(tile);
    });
  }

  function updateStartState() {
    const ready = selectedIds.length === desiredTileCount;
    startGameButton.disabled = !ready;
  }

  function requestFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }

  function toggleInstrument(tile, instrument) {
    const audio = audioMap.get(instrument.id);
    if (!audio) return;

    if (audio.paused) {
      audio.currentTime = 0;
      audio.play();
      tile.classList.add('playing');
    } else {
      audio.pause();
      audio.currentTime = 0;
      tile.classList.remove('playing');
    }
  }

  function buildGameTiles() {
    tileContainer.innerHTML = '';
    tileContainer.classList.add('music-grid');

    const selected = instruments.filter(instrument => selectedIds.includes(instrument.id));
    const columns = Math.min(3, Math.max(1, selected.length));
    tileContainer.style.setProperty('--music-columns', columns);

    selected.forEach(instrument => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.backgroundImage = `url(${instrument.image})`;

      const caption = document.createElement('span');
      caption.className = 'caption';
      caption.textContent = instrument.label;
      tile.appendChild(caption);

      const audio = new Audio(instrument.sound);
      audio.loop = true;
      audio.volume = currentVolume / 100;
      audioMap.set(instrument.id, audio);

      let hoverTimeout = null;

      tile.addEventListener('pointerenter', () => {
        if (gazePointer) gazePointer.classList.add('gp-dwell');
        hoverTimeout = window.setTimeout(() => {
          toggleInstrument(tile, instrument);
          if (gazePointer) gazePointer.classList.remove('gp-dwell');
        }, fixationDelay);
      });

      tile.addEventListener('pointerleave', () => {
        if (hoverTimeout) {
          window.clearTimeout(hoverTimeout);
        }
        if (gazePointer) gazePointer.classList.remove('gp-dwell');
      });

      tileContainer.appendChild(tile);
    });
  }

  chooseTilesButton.addEventListener('click', () => {
    desiredTileCount = parseInt(tileCountInput.value, 10) || 3;
    trimSelections();
    updateTileCountDisplay();
    renderPicker();
    updateStartState();
    gameOptionsModal.style.display = 'none';
    tilePickerModal.style.display = 'flex';
  });

  startGameButton.addEventListener('click', () => {
    tilePickerModal.style.display = 'none';
    tileContainer.style.display = 'grid';
    requestFullscreen();
    buildGameTiles();
  });

  tileCountInput.addEventListener('input', () => {
    desiredTileCount = parseInt(tileCountInput.value, 10) || 3;
    updateTileCountDisplay();
    trimSelections();
    renderPicker();
    updateStartState();
  });

  volumeInput.addEventListener('input', () => {
    currentVolume = parseInt(volumeInput.value, 10) || 0;
    updateVolumeDisplay();
    updateAudioVolume();
  });

  backgroundSelect?.addEventListener('change', updateBackground);

  fixationTimeInput.addEventListener('input', () => {
    fixationDelay = parseInt(fixationTimeInput.value, 10) || 2000;
    updateFixationDisplay();
  });

  showGazePointer.addEventListener('change', updatePointerStyle);
  gazeSize.addEventListener('input', updatePointerStyle);
  gazeOpacity.addEventListener('input', updatePointerStyle);

  document.addEventListener('pointermove', event => {
    if (!gazePointer || !showGazePointer.checked) return;
    gazePointer.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
  });

  ensurePointerOverlay();
  updateVolumeDisplay();
  updateTileCountDisplay();
  updateFixationDisplay();
  updatePointerStyle();
  updateBackground();
  renderPicker();
  updateStartState();
});
