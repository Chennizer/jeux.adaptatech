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
  const youtubePlayer = document.getElementById('youtube-player');
  const sourceSelect = document.getElementById('video-source');
  const enableTimeLimit = document.getElementById('enable-time-limit');
  const timeLimitContainer = document.getElementById('time-limit-container');
  const timeLimitSeconds = document.getElementById('time-limit-seconds');
  const threeRoundsCheckbox = document.getElementById('three-rounds');
  const pressSound = new Audio('../../sounds/success3.mp3');
  pressSound.preload = 'auto';
  let selectedIndices = mediaChoices.slice(0, 12).map((_, index) => index);
  const localChoices = [];
  const youtubeChoices = [];
  let currentChoices = mediaChoices;
  let activeIndices = [];
  let phaseOffsets = [];
  let selectionStage = 0;
  let revolutionMs = 8000;
  let startTime = performance.now();
  let videoOpen = false;
  let videoTimeLimitTimeout = null;

  function desiredCount() { return Number(tileCountInput.value); }
  function totalRounds() { return threeRoundsCheckbox.checked ? 3 : 2; }

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
    currentChoices.forEach((choice, index) => {
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
  enableTimeLimit.addEventListener('change', () => {
    timeLimitContainer.hidden = !enableTimeLimit.checked;
  });

  function updateSource() {
    const source = sourceSelect.value;
    currentChoices = source === 'local' ? localChoices : source === 'youtube' ? youtubeChoices : mediaChoices;
    selectedIndices = currentChoices.slice(0, desiredCount()).map((_, index) => index);
    categorySelect.value = 'all';
    categorySelect.disabled = source !== 'catalogue';
    document.getElementById('local-import-controls').hidden = source !== 'local';
    const youtubeControls = document.getElementById('youtube-import-controls');
    youtubeControls.hidden = source !== 'youtube';
    youtubeControls.style.display = source === 'youtube' ? 'flex' : 'none';
    updatePickerState();
    populatePicker();
  }
  sourceSelect.addEventListener('change', updateSource);
  document.getElementById('choose-tiles-button').addEventListener('click', () => {
    gameOptions.style.display = 'none';
    tilePickerModal.style.display = 'flex';
    populatePicker();
  });

  function resetNomon() {
    selectionStage = 0;
    activeIndices = selectedIndices.map((_, index) => index);
    startTime = performance.now();
    redistributeActiveClocks(startTime);
    grid.querySelectorAll('.nomon-tile').forEach(tile => tile.classList.remove('shortlisted', 'eliminated', 'confirmed'));
    status.textContent = `1 / ${totalRounds()} — Appuyez lorsque les horloges souhaitées sont près de midi`;
  }

  function redistributeActiveClocks(now) {
    // Put every remaining hand in a new, evenly spaced position. The half-slot
    // offset prevents one clock from starting directly on the fixed noon arm.
    phaseOffsets = activeIndices.map((_, index) => (index + 0.5) / activeIndices.length);
    startTime = now;
    activeIndices.forEach((tileIndex, activePosition) => {
      const hand = grid.children[tileIndex]?.querySelector('.clock-hand');
      if (hand) hand.style.transform = `rotate(${phaseOffsets[activePosition] * 360}deg)`;
    });
  }

  function renderGame() {
    grid.innerHTML = '';
    grid.className = `count-${selectedIndices.length}`;
    selectedIndices.forEach((mediaIndex, index) => {
      const choice = currentChoices[mediaIndex];
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
    const numberToKeep = totalRounds() === 2
      ? Math.min(3, Math.ceil(activeIndices.length / 2))
      : Math.ceil(activeIndices.length / 2);
    activeIndices = activeIndices
      .map(index => ({ index, distance: distanceFromNoon(index, now) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, numberToKeep)
      .map(item => item.index);
    grid.querySelectorAll('.nomon-tile').forEach((tile, index) => {
      tile.classList.toggle('shortlisted', activeIndices.includes(index));
      tile.classList.toggle('eliminated', !activeIndices.includes(index));
    });
    redistributeActiveClocks(now);
    selectionStage += 1;
    const nextAction = selectionStage === totalRounds() - 1 ? 'confirmer le choix' : 'réduire encore les choix';
    status.textContent = `${selectionStage + 1} / ${totalRounds()} — Appuyez pour ${nextAction}`;
  }

  function confirm(now) {
    const chosenIndex = activeIndices.reduce((closest, index) =>
      distanceFromNoon(index, now) < distanceFromNoon(closest, now) ? index : closest,
    activeIndices[0]);
    grid.children[chosenIndex].classList.add('confirmed');
    playVideo(selectedIndices[chosenIndex]);
  }

  function playVideo(mediaIndex) {
    const choice = currentChoices[mediaIndex];
    videoOpen = true;
    videoContainer.hidden = false;
    if (choice.youtubeId) {
      videoPlayer.hidden = true;
      youtubePlayer.hidden = false;
      youtubePlayer.src = `https://www.youtube-nocookie.com/embed/${choice.youtubeId}?autoplay=1&rel=0`;
    } else {
      youtubePlayer.hidden = true;
      videoPlayer.hidden = false;
      videoPlayer.src = choice.video;
      videoPlayer.play().catch(() => { videoPlayer.controls = true; });
    }
    if (enableTimeLimit.checked) {
      const seconds = Math.max(1, Number(timeLimitSeconds.value) || 30);
      videoTimeLimitTimeout = window.setTimeout(closeVideo, seconds * 1000);
    }
  }

  function closeVideo() {
    if (videoTimeLimitTimeout) window.clearTimeout(videoTimeLimitTimeout);
    videoTimeLimitTimeout = null;
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.load();
    videoPlayer.controls = false;
    youtubePlayer.src = '';
    youtubePlayer.hidden = true;
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
    if (selectionStage < totalRounds() - 1) shortlist(now);
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
  document.getElementById('add-local-videos').addEventListener('click', () => document.getElementById('local-video-input').click());
  document.getElementById('local-video-input').addEventListener('change', event => {
    Array.from(event.target.files).forEach(file => {
      localChoices.push({ name: file.name, image: '../../images/custom-videos.svg', video: URL.createObjectURL(file), category: 'custom' });
    });
    updateSource();
    event.target.value = '';
  });
  document.getElementById('add-youtube-video').addEventListener('click', () => {
    const input = document.getElementById('youtube-url');
    const match = input.value.trim().match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{6,})/);
    if (!match) return;
    const id = match[1];
    youtubeChoices.push({ name: `YouTube — ${id}`, image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`, video: input.value.trim(), youtubeId: id, category: 'custom' });
    input.value = '';
    updateSource();
  });
  document.getElementById('langToggle')?.addEventListener('click', toggleLanguage);

  updateSource();
  requestAnimationFrame(animate);
});
