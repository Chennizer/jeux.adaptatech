document.addEventListener('DOMContentLoaded', () => {
  const choices = mediaChoices.slice(0, 12);
  const grid = document.getElementById('video-grid');
  const speedSelect = document.getElementById('rotation-speed');
  const pauseButton = document.getElementById('pause-clocks');
  const status = document.getElementById('status');
  const videoContainer = document.getElementById('video-container');
  const videoPlayer = document.getElementById('video-player');
  const closeVideoButton = document.getElementById('close-video');
  let revolutionMs = Number(speedSelect.value);
  let startTime = performance.now();
  let pausedAt = null;
  let candidateIndex = 0;
  let videoOpen = false;

  const tiles = choices.map((choice, index) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'video-choice';
    tile.dataset.index = index;
    tile.setAttribute('aria-label', `${choice.name}. Horloge ${index + 1} sur 12.`);
    tile.innerHTML = `
      <img src="${choice.image}" alt="" loading="eager">
      <span class="title">${choice.name}</span>
      <span class="nomon-clock" aria-hidden="true">
        <span class="clock-hand"></span><span class="clock-pin"></span>
      </span>`;
    tile.addEventListener('click', event => {
      // Pointer and direct-access users may still activate a tile normally.
      if (event.detail > 0) playChoice(index);
    });
    grid.appendChild(tile);
    return tile;
  });

  function circularDistance(value, target) {
    const difference = Math.abs(value - target);
    return Math.min(difference, 1 - difference);
  }

  function currentPhase(index, now) {
    const elapsed = (pausedAt ?? now) - startTime;
    return ((elapsed / revolutionMs) + (index / choices.length)) % 1;
  }

  function drawClocks(now) {
    let nearestDistance = Infinity;
    let nearestIndex = 0;
    tiles.forEach((tile, index) => {
      const phase = currentPhase(index, now);
      tile.querySelector('.clock-hand').style.transform = `rotate(${phase * 360}deg)`;
      const distance = circularDistance(phase, 0);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    if (nearestIndex !== candidateIndex) {
      tiles[candidateIndex]?.classList.remove('nomon-candidate');
      candidateIndex = nearestIndex;
      tiles[candidateIndex].classList.add('nomon-candidate');
    }
    requestAnimationFrame(drawClocks);
  }

  function playChoice(index) {
    const choice = choices[index];
    tiles[index].classList.add('nomon-selected');
    status.textContent = `Sélection : ${choice.name}`;
    window.setTimeout(() => tiles[index].classList.remove('nomon-selected'), 450);
    videoOpen = true;
    videoContainer.hidden = false;
    videoPlayer.src = choice.video;
    videoPlayer.play().catch(() => {
      status.textContent = 'La lecture automatique a été bloquée. Touchez la vidéo pour démarrer.';
      videoPlayer.controls = true;
    });
  }

  function closeVideo() {
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.load();
    videoPlayer.controls = false;
    videoContainer.hidden = true;
    videoOpen = false;
  }

  function activateSwitch(event) {
    if (event.repeat) return;
    if (videoOpen) {
      closeVideo();
      return;
    }
    playChoice(candidateIndex);
  }

  document.addEventListener('keydown', event => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      activateSwitch(event);
    }
  });
  closeVideoButton.addEventListener('click', closeVideo);
  videoPlayer.addEventListener('ended', closeVideo);

  speedSelect.addEventListener('change', () => {
    revolutionMs = Number(speedSelect.value);
    startTime = performance.now();
    pausedAt = null;
    pauseButton.textContent = 'Pause';
  });

  pauseButton.addEventListener('click', () => {
    if (pausedAt === null) {
      pausedAt = performance.now();
      pauseButton.textContent = 'Reprendre';
    } else {
      startTime += performance.now() - pausedAt;
      pausedAt = null;
      pauseButton.textContent = 'Pause';
    }
  });

  tiles[0].classList.add('nomon-candidate');
  requestAnimationFrame(drawClocks);
});
