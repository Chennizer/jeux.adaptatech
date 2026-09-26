document.addEventListener('DOMContentLoaded', () => {
  const gameOptions = document.getElementById('game-options');
  const tilePickerModal = document.getElementById('tile-picker-modal');
  const tilePickerGrid = document.getElementById('tile-picker-grid');
  const tileCountInput = document.getElementById('tile-count');
  const tileCountValue = document.getElementById('tile-count-value');
  const tileCountDisplay = document.getElementById('tile-count-display');
  const categorySelect = document.getElementById('categorySelect');
  const startButton = document.getElementById('start-game-button');
  const game = document.getElementById('nomon-game');
  const grid = document.getElementById('video-grid');
  const status = document.getElementById('nomon-status');
  const videoContainer = document.getElementById('video-container');
  const videoPlayer = document.getElementById('video-player');
  const pressSound = new Audio('../../sounds/success3.mp3');
  pressSound.preload = 'auto';
  let selectedIndices = mediaChoices.slice(0, 12).map((_, index) => index);
  let activeIndices = [];
  let phaseOffsets = [];
  let selectionStage = 0;
  let revolutionMs = 8000;
  let startTime = performance.now();
  let videoOpen = false;

  function desiredCount() { return Number(tileCountInput.value); }

  function updatePickerState() {
    tileCountValue.textContent = desiredCount();
    tileCountDisplay.textContent = desiredCount();
    startButton.disabled = selectedIndices.length !== desiredCount();
  }

  function categoryMatches(choice) {
    const category = categorySelect.value;
    return category === 'all' || choice.category === category ||
      (Array.isArray(choice.category) && choice.category.includes(category));
  }

  function populatePicker() {
    tilePickerGrid.innerHTML = '';
    mediaChoices.forEach((choice, index) => {
      if (!categoryMatches(choice) && !selectedIndices.includes(index)) return;
      const tile = document.createElement('div');
      tile.className = `tile${selectedIndices.includes(index) ? ' selected' : ''}`;
      tile.style.backgroundImage = `url(${choice.image})`;
      tile.innerHTML = `<div class="caption">${choice.name}</div>`;
      tile.addEventListener('click', () => {
        if (selectedIndices.includes(index)) {
          selectedIndices = selectedIndices.filter(item => item !== index);
        } else if (selectedIndices.length < desiredCount()) {
          selectedIndices.push(index);
        }
        updatePickerState();
        populatePicker();
      });
      tilePickerGrid.appendChild(tile);
    });
  }

  tileCountInput.addEventListener('input', () => {
    selectedIndices = selectedIndices.slice(0, desiredCount());
    updatePickerState();
    populatePicker();
  });
  categorySelect.addEventListener('change', populatePicker);
  document.getElementById('choose-tiles-button').addEventListener('click', () => {
    gameOptions.style.display = 'none';
    tilePickerModal.style.display = 'flex';
    populatePicker();
  });

  function resetNomon() {
    selectionStage = 0;
    activeIndices = selectedIndices.map((_, index) => index);
    phaseOffsets = activeIndices.map((_, index) => index / activeIndices.length);
    startTime = performance.now();
    grid.querySelectorAll('.nomon-tile').forEach(tile => tile.classList.remove('shortlisted', 'eliminated', 'confirmed'));
    status.textContent = '1 / 2 — Appuyez lorsque les horloges souhaitées sont près de midi';
  }

  function renderGame() {
    grid.innerHTML = '';
    grid.className = `count-${selectedIndices.length}`;
    selectedIndices.forEach((mediaIndex, index) => {
      const choice = mediaChoices[mediaIndex];
      const tile = document.createElement('div');
      tile.className = 'nomon-tile';
      tile.dataset.index = index;
      tile.style.backgroundImage = `url(${choice.image})`;
      tile.innerHTML = `<div class="caption">${choice.name}</div><div class="nomon-clock"><div class="clock-hand"></div><div class="clock-pin"></div></div>`;
      grid.appendChild(tile);
    });
    resetNomon();
  }

  function phaseFor(index, now) {
    const activePosition = activeIndices.indexOf(index);
    if (activePosition < 0) return 0;
    return (((now - startTime) / revolutionMs) + phaseOffsets[activePosition]) % 1;
  }

  function distanceFromNoon(index, now) {
    const phase = phaseFor(index, now);
    return Math.min(phase, 1 - phase);
  }

  function animate(now) {
    grid.querySelectorAll('.nomon-tile').forEach((tile, index) => {
      if (!activeIndices.includes(index)) return;
      tile.querySelector('.clock-hand').style.transform = `rotate(${phaseFor(index, now) * 360}deg)`;
    });
    requestAnimationFrame(animate);
  }

  function shortlist(now) {
    const numberToKeep = Math.min(3, activeIndices.length);
    activeIndices = activeIndices
      .map(index => ({ index, distance: distanceFromNoon(index, now) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, numberToKeep)
      .map(item => item.index);
    grid.querySelectorAll('.nomon-tile').forEach((tile, index) => {
      tile.classList.toggle('shortlisted', activeIndices.includes(index));
      tile.classList.toggle('eliminated', !activeIndices.includes(index));
    });
    phaseOffsets = activeIndices.map((_, index) => index / activeIndices.length);
    startTime = now;
    selectionStage = 1;
    status.textContent = '2 / 2 — Appuyez de nouveau pour confirmer parmi les trois choix';
  }

  function confirm(now) {
    const chosenIndex = activeIndices.reduce((closest, index) =>
      distanceFromNoon(index, now) < distanceFromNoon(closest, now) ? index : closest,
    activeIndices[0]);
    grid.children[chosenIndex].classList.add('confirmed');
    playVideo(selectedIndices[chosenIndex]);
  }

  function playVideo(mediaIndex) {
    videoOpen = true;
    videoContainer.hidden = false;
    videoPlayer.src = mediaChoices[mediaIndex].video;
    videoPlayer.play().catch(() => { videoPlayer.controls = true; });
  }

  function closeVideo() {
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.load();
    videoPlayer.controls = false;
    videoContainer.hidden = true;
    videoOpen = false;
    resetNomon();
  }

  function switchPress(event) {
    if (event.repeat) return;
    if (videoOpen) return closeVideo();
    if (game.hidden) return;
    pressSound.currentTime = 0;
    pressSound.play().catch(() => {});
    const now = performance.now();
    if (selectionStage === 0) shortlist(now);
    else confirm(now);
  }

  startButton.addEventListener('click', () => {
    if (startButton.disabled) return;
    if (!document.fullscreenElement) {
      const requestFullscreen = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
      if (requestFullscreen) {
        try {
          const result = requestFullscreen.call(document.documentElement);
          if (result?.catch) result.catch(() => {});
        } catch {}
      }
    }
    revolutionMs = Number(document.getElementById('rotation-speed').value);
    tilePickerModal.style.display = 'none';
    game.hidden = false;
    renderGame();
  });
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    if (!game.hidden || videoOpen) {
      event.preventDefault();
      switchPress(event);
    }
  });
  document.getElementById('close-video').addEventListener('click', closeVideo);
  videoPlayer.addEventListener('ended', closeVideo);
  document.getElementById('langToggle')?.addEventListener('click', toggleLanguage);

  updatePickerState();
  requestAnimationFrame(animate);
});
