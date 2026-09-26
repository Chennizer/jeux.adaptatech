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
  const videoContainer = document.getElementById('video-container');
  const videoPlayer = document.getElementById('video-player');
  const youtubePlayer = document.getElementById('youtube-player');
  const sourceSelect = document.getElementById('video-source');
  const enableTimeLimit = document.getElementById('enable-time-limit');
  const timeLimitContainer = document.getElementById('time-limit-container');
  const timeLimitSeconds = document.getElementById('time-limit-seconds');
  const threeRoundsCheckbox = document.getElementById('three-rounds');
  const explanationModal = document.getElementById('explanation-modal');
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

  function closeExplanation() {
    explanationModal.hidden = true;
  }

  document.getElementById('open-explanation').addEventListener('click', () => {
    explanationModal.hidden = false;
    document.getElementById('close-explanation').focus();
  });
  document.getElementById('close-explanation').addEventListener('click', closeExplanation);
  explanationModal.addEventListener('click', event => {
    if (event.target === explanationModal) closeExplanation();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !explanationModal.hidden) closeExplanation();
  });

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

  // Match the local-video choice page: seek into the file and capture a
  // letterboxed JPEG frame instead of showing a generic placeholder.
  function makeThumbnailFromVideo(file) {
    return new Promise(resolve => {
      const temporaryUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      let settled = false;
      const finish = image => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(temporaryUrl);
        resolve(image);
      };
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = temporaryUrl;
      video.addEventListener('loadedmetadata', () => {
        try {
          video.currentTime = Math.min(10, Math.max(0, (video.duration || 0) - 0.1));
        } catch { finish(''); }
      }, { once: true });
      video.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const context = canvas.getContext('2d');
          const width = video.videoWidth || 640;
          const height = video.videoHeight || 360;
          const scale = Math.min(canvas.width / width, canvas.height / height);
          const drawWidth = width * scale;
          const drawHeight = height * scale;
          context.drawImage(video, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
          finish(canvas.toDataURL('image/jpeg', 0.85));
        } catch { finish(''); }
      }, { once: true });
      video.addEventListener('error', () => finish(''), { once: true });
      window.setTimeout(() => finish(''), 3000);
    });
  }

  // Match the YouTube choice page: ask noembed for the public video title and
  // fall back to the URL if metadata cannot be retrieved.
  async function fetchYoutubeTitle(url) {
    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const metadata = await response.json();
        if (metadata?.title) return metadata.title;
      }
    } catch {}
    return url;
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
  }

  function redistributeActiveClocks(now) {
    // Keep the phases maximally separated, but shuffle which tile receives
    // each phase so neighbouring tiles do not show neighbouring hand angles.
    const evenlySpacedPhases = activeIndices.map((_, index) => (index + 0.5) / activeIndices.length);
    const isCompleteGrid = activeIndices.every((tileIndex, index) => tileIndex === index);
    if (isCompleteGrid) {
      const split = Math.ceil(activeIndices.length / 2);
      const alternatingSlots = [];
      for (let index = 0; index < split; index += 1) {
        alternatingSlots.push(index);
        if (index + split < activeIndices.length) alternatingSlots.push(index + split);
      }
      if (Math.random() < 0.5) alternatingSlots.reverse();
      const randomRotation = Math.random();
      phaseOffsets = alternatingSlots.map(slot => ((slot + 0.5) / activeIndices.length + randomRotation) % 1);
    } else {
      let attempts = 0;
      do {
        phaseOffsets = [...evenlySpacedPhases];
        for (let index = phaseOffsets.length - 1; index > 0; index -= 1) {
          const randomIndex = Math.floor(Math.random() * (index + 1));
          [phaseOffsets[index], phaseOffsets[randomIndex]] = [phaseOffsets[randomIndex], phaseOffsets[index]];
        }
        attempts += 1;
      } while (attempts < 100 && activeIndices.some((tileIndex, position) => {
        const neighbourPosition = activeIndices.indexOf(tileIndex + 1);
        if (neighbourPosition < 0) return false;
        const difference = Math.abs(phaseOffsets[position] - phaseOffsets[neighbourPosition]);
        return Math.min(difference, 1 - difference) < 0.14;
      }));
    }
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
    document.getElementById('langToggle').style.display = 'none';
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
  document.getElementById('local-video-input').addEventListener('change', async event => {
    const files = Array.from(event.target.files);
    for (const file of files) {
      const thumbnail = await makeThumbnailFromVideo(file);
      localChoices.push({
        name: file.name,
        image: thumbnail || '../../images/custom-videos.svg',
        video: URL.createObjectURL(file),
        category: 'custom'
      });
      updateSource();
    }
    updateSource();
    event.target.value = '';
  });
  document.getElementById('add-youtube-video').addEventListener('click', async () => {
    const addButton = document.getElementById('add-youtube-video');
    const input = document.getElementById('youtube-url');
    const url = input.value.trim();
    const match = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{6,})/);
    if (!match) return;
    const id = match[1];
    addButton.disabled = true;
    const title = await fetchYoutubeTitle(url);
    youtubeChoices.push({ name: title, image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`, video: url, youtubeId: id, category: 'custom' });
    input.value = '';
    addButton.disabled = false;
    updateSource();
  });
  document.getElementById('langToggle')?.addEventListener('click', toggleLanguage);

  updateSource();
  requestAnimationFrame(animate);
});
