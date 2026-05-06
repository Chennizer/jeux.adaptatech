document.addEventListener('DOMContentLoaded', () => {
  const gameOptionsModal = document.getElementById('game-options');
  const tilePickerModal = document.getElementById('tile-picker-modal');
  const sourceButtons = Array.from(document.querySelectorAll('#mode-segmented-control .mode-btn'));
  const chooseSourceButton = document.getElementById('choose-source-button');
  const sourceSummary = document.getElementById('source-summary');
  const libraryControls = document.getElementById('library-controls');
  const localImportControls = document.getElementById('local-import-controls');
  const youtubeImportControls = document.getElementById('yt-import-controls');
  const categorySelect = document.getElementById('categorySelect');
  const addVideoButton = document.getElementById('add-video-file-button');
  const addVideoInput = document.getElementById('add-video-input');
  const addYoutubeButton = document.getElementById('add-video-url-button');
  const addYoutubeInput = document.getElementById('add-video-url-input');
  const playlistButton = document.getElementById('yt-playlist-import-button');
  const playlistInput = document.getElementById('yt-playlist-url-input');
  const clearButton = document.getElementById('clear-videos-button');
  const backButton = document.getElementById('back-to-source-button');
  const tilePickerGrid = document.getElementById('tile-picker-grid');
  const startGameButton = document.getElementById('start-game-button');
  const videoContainer = document.getElementById('video-container');
  const videoPlayer = document.getElementById('video-player');
  const videoSource = document.getElementById('video-source');
  const youtubeDiv = document.getElementById('youtube-player');
  const lookZone = document.getElementById('look-zone');
  const lookStatus = document.getElementById('look-status');
  const gazePointer = document.getElementById('gazePointer');
  const languageToggle = document.getElementById('language-toggle');

  const LOOK_AWAY_GRACE_MS = 2000;
  const ZERO_MOVEMENT_PAUSE_MS = 3000;
  const YOUTUBE_STORAGE_KEY = 'lookToPlayYoutubeUrls';
  const VIDEO_RX = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;
  const sourceLabels = {
    local: { fr: 'Source: Local', en: 'Source: Local', ja: 'ソース：ローカル' },
    youtube: { fr: 'Source: YouTube', en: 'Source: YouTube', ja: 'ソース：YouTube' },
    library: { fr: 'Source: Bibliothèque', en: 'Source: Library', ja: 'ソース：ライブラリ' },
  };

  let currentSource = 'library';
  let currentCategory = 'all';
  let selectedChoice = null;
  let localChoices = [];
  let youtubeChoices = [];
  let youtubePlayer = null;
  let youtubeApiReady = Boolean(window.YT && window.YT.Player);
  let pendingYoutubeVideoId = null;
  let pauseTimer = null;
  let noMovementTimer = null;
  let lastMovementPosition = null;
  let isLooking = false;
  let isPlaying = false;

  window.onYouTubeIframeAPIReady = () => {
    youtubeApiReady = true;
    if (pendingYoutubeVideoId) {
      loadYoutubeVideo(pendingYoutubeVideoId);
    }
  };

  function getLanguage() {
    const stored = localStorage.getItem('siteLanguage');
    return ['fr', 'en', 'ja'].includes(stored) ? stored : 'fr';
  }

  function setTranslatedText(element, strings) {
    if (!element || !strings) return;
    element.textContent = strings[getLanguage()] || strings.fr || strings.en || '';
    Object.entries(strings).forEach(([lang, value]) => {
      element.dataset[lang] = value;
    });
  }

  function setLookStatus(strings) {
    setTranslatedText(lookStatus, strings);
  }

  function ensureFullscreen() {
    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) {
      root.requestFullscreen().catch(() => {});
    }
  }

  function ensurePointerOverlay() {
    if (!gazePointer) return;
    let overlay = document.getElementById('gazePointerOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'gazePointerOverlay';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(overlay);
    }
    if (gazePointer.parentElement !== overlay) {
      overlay.appendChild(gazePointer);
    }
  }

  function setPointerPos(x, y) {
    if (!gazePointer) return;
    gazePointer.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }

  function isVideoVisible() {
    return videoContainer.style.display === 'flex';
  }

  function clearNoMovementTimer() {
    if (noMovementTimer) {
      clearTimeout(noMovementTimer);
      noMovementTimer = null;
    }
  }

  function scheduleNoMovementPause() {
    clearNoMovementTimer();
    if (!isVideoVisible()) return;
    noMovementTimer = setTimeout(() => {
      isLooking = false;
      pauseCurrentVideo();
    }, ZERO_MOVEMENT_PAUSE_MS);
  }

  function trackPointerMovement(event) {
    const currentPosition = { x: event.clientX, y: event.clientY };
    setPointerPos(currentPosition.x, currentPosition.y);

    const moved = !lastMovementPosition ||
      currentPosition.x !== lastMovementPosition.x ||
      currentPosition.y !== lastMovementPosition.y;

    if (moved) {
      lastMovementPosition = currentPosition;
      scheduleNoMovementPause();
    }

    return moved;
  }

  function setSource(source) {
    currentSource = source;
    selectedChoice = null;
    currentCategory = 'all';
    if (categorySelect) categorySelect.value = 'all';

    sourceButtons.forEach(button => {
      button.classList.toggle('selected', button.dataset.source === source);
    });

    setTranslatedText(sourceSummary, sourceLabels[source]);
    updateStartButtonState();
  }

  function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.|m\.)?((youtube\.com\/\S+)|(youtu\.be\/\S+))$/.test(url);
  }

  function getYouTubeId(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) {
        return parsed.pathname.slice(1).split(/[?&]/)[0];
      }
      const id = parsed.searchParams.get('v');
      if (id) return id;
      const shorts = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shorts) return shorts[1];
      const embed = parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      return embed ? embed[1] : null;
    } catch {
      return null;
    }
  }

  function getPlaylistIdFromUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get('list');
    } catch {
      const match = String(url).match(/[?&]list=([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
  }

  async function fetchVideoTitle(url) {
    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        if (data?.title) return data.title;
      }
    } catch {}
    return url;
  }

  function categoriesInclude(choice, category) {
    if (category === 'all') return true;
    const categories = Array.isArray(choice.category) ? choice.category : [choice.category];
    return categories.includes(category);
  }

  function choicesForCurrentSource() {
    if (currentSource === 'library') {
      return mediaChoices
        .filter(choice => categoriesInclude(choice, currentCategory))
        .map(choice => ({ ...choice, sourceType: 'native' }));
    }
    if (currentSource === 'local') return localChoices;
    if (currentSource === 'youtube') return youtubeChoices;
    return [];
  }

  function updateStartButtonState() {
    startGameButton.disabled = !selectedChoice?.video;
  }

  function populateTilePickerGrid() {
    tilePickerGrid.innerHTML = '';
    const choices = choicesForCurrentSource();

    choices.forEach((choice, index) => {
      const tileOption = document.createElement('div');
      tileOption.classList.add('tile');
      tileOption.setAttribute('data-index', index);
      tileOption.style.backgroundImage = choice.image ? `url(${choice.image})` : 'none';
      if (selectedChoice?.video === choice.video) {
        tileOption.classList.add('selected');
      }

      const caption = document.createElement('div');
      caption.classList.add('caption');
      caption.textContent = choice.name || 'Vidéo';
      tileOption.appendChild(caption);

      tileOption.addEventListener('click', () => {
        selectedChoice = choice;
        updateStartButtonState();
        populateTilePickerGrid();
      });

      tilePickerGrid.appendChild(tileOption);
    });
  }

  window.populateTilePickerGrid = populateTilePickerGrid;

  function showPicker() {
    selectedChoice = null;
    gameOptionsModal.style.display = 'none';
    tilePickerModal.style.display = 'flex';
    libraryControls.style.display = currentSource === 'library' ? 'flex' : 'none';
    localImportControls.style.display = currentSource === 'local' ? 'block' : 'none';
    youtubeImportControls.style.display = currentSource === 'youtube' ? 'block' : 'none';
    clearButton.style.display = currentSource === 'youtube' ? '' : 'none';
    populateTilePickerGrid();
    updateStartButtonState();
    ensureFullscreen();
  }

  function showSourceOptions() {
    tilePickerModal.style.display = 'none';
    gameOptionsModal.style.display = 'flex';
  }

  function saveYoutubeUrls() {
    try {
      localStorage.setItem(YOUTUBE_STORAGE_KEY, JSON.stringify(youtubeChoices.map(choice => choice.video)));
    } catch {}
  }

  async function loadYoutubeUrls() {
    try {
      const urls = JSON.parse(localStorage.getItem(YOUTUBE_STORAGE_KEY) || '[]');
      for (const url of urls) {
        const id = getYouTubeId(url);
        if (!id || youtubeChoices.some(choice => choice.video === url)) continue;
        youtubeChoices.push({
          name: await fetchVideoTitle(url),
          image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
          video: url,
          sourceType: 'youtube',
        });
      }
    } catch {}
  }

  async function addYoutubeByUrl(url) {
    const id = getYouTubeId(url.trim());
    if (!id || !isYouTubeUrl(url.trim())) return;

    const canonicalUrl = `https://www.youtube.com/watch?v=${id}`;
    if (!youtubeChoices.some(choice => choice.video === canonicalUrl)) {
      youtubeChoices.push({
        name: await fetchVideoTitle(canonicalUrl),
        image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
        video: canonicalUrl,
        sourceType: 'youtube',
      });
      saveYoutubeUrls();
    }

    selectedChoice = youtubeChoices.find(choice => choice.video === canonicalUrl) || null;
    populateTilePickerGrid();
    updateStartButtonState();
  }

  async function fetchPlaylistVideoIds(apiKey, playlistId) {
    const ids = [];
    let pageToken = '';
    do {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.searchParams.set('part', 'contentDetails');
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('playlistId', playlistId);
      url.searchParams.set('key', apiKey);
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const response = await fetch(url);
      const text = await response.text();
      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
          const data = JSON.parse(text);
          if (data.error?.message) message += ` – ${data.error.message}`;
        } catch {}
        throw new Error(message);
      }
      const data = JSON.parse(text);
      (data.items || []).forEach(item => {
        if (item?.contentDetails?.videoId) ids.push(item.contentDetails.videoId);
      });
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    return ids;
  }

  async function importPlaylist() {
    const playlistId = getPlaylistIdFromUrl(playlistInput.value.trim());
    const apiKey = window.YT_API_KEY;
    if (!playlistId || !apiKey) return;

    playlistButton.disabled = true;
    try {
      const ids = await fetchPlaylistVideoIds(apiKey, playlistId);
      for (const id of ids) {
        await addYoutubeByUrl(`https://www.youtube.com/watch?v=${id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      playlistButton.disabled = false;
      populateTilePickerGrid();
    }
  }

  async function makeThumbnailFromVideo(file) {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = url;

      const cleanup = () => { try { URL.revokeObjectURL(url); } catch {} };

      video.addEventListener('loadedmetadata', () => {
        try {
          video.currentTime = Math.min(10, Math.max(0, (video.duration || 0) - 0.1));
        } catch {}
      }, { once: true });

      video.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const context = canvas.getContext('2d');
          const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
          const width = video.videoWidth * scale;
          const height = video.videoHeight * scale;
          context.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve('../../images/localvideosmultiplechoices.png');
        }
        cleanup();
      }, { once: true });

      video.addEventListener('error', () => {
        cleanup();
        resolve('../../images/localvideosmultiplechoices.png');
      }, { once: true });

      setTimeout(() => {
        cleanup();
        resolve('../../images/localvideosmultiplechoices.png');
      }, 3000);
    });
  }

  function revokeLocalChoices() {
    localChoices.forEach(choice => {
      try { URL.revokeObjectURL(choice.video); } catch {}
    });
  }

  async function addLocalFiles(files) {
    revokeLocalChoices();
    localChoices = [];
    for (const file of files) {
      if (!VIDEO_RX.test(file.name)) continue;
      localChoices.push({
        name: file.name,
        image: await makeThumbnailFromVideo(file),
        video: URL.createObjectURL(file),
        sourceType: 'native',
      });
    }
    selectedChoice = localChoices[0] || null;
    populateTilePickerGrid();
    updateStartButtonState();
  }

  function clearPauseTimer() {
    if (pauseTimer) {
      clearTimeout(pauseTimer);
      pauseTimer = null;
    }
  }

  function playCurrentVideo() {
    clearPauseTimer();
    scheduleNoMovementPause();
    if (!selectedChoice) return;
    setLookStatus({ fr: 'Lecture...', en: 'Playing...', ja: '再生中...' });

    if (selectedChoice.sourceType === 'youtube') {
      try {
        youtubePlayer?.playVideo();
        isPlaying = true;
      } catch {}
    } else {
      videoPlayer.play().then(() => {
        isPlaying = true;
      }).catch(err => {
        console.error(err);
      });
    }
  }

  function pauseCurrentVideo() {
    clearPauseTimer();
    clearNoMovementTimer();
    if (selectedChoice?.sourceType === 'youtube') {
      try { youtubePlayer?.pauseVideo(); } catch {}
    } else {
      videoPlayer.pause();
    }
    isPlaying = false;
    setLookStatus({ fr: 'Regardez la vidéo pour jouer', en: 'Look at the video to play', ja: '動画を見ると再生します' });
  }

  function schedulePauseAfterGrace() {
    clearPauseTimer();
    clearNoMovementTimer();
    setLookStatus({ fr: 'Pause dans 2 secondes...', en: 'Pausing in 2 seconds...', ja: '2秒後に一時停止...' });
    pauseTimer = setTimeout(() => {
      if (!isLooking) pauseCurrentVideo();
    }, LOOK_AWAY_GRACE_MS);
  }

  function handleLookStart() {
    isLooking = true;
    playCurrentVideo();
  }

  function handleLookEnd() {
    isLooking = false;
    if (isPlaying) schedulePauseAfterGrace();
  }

  function resetPlayback() {
    clearPauseTimer();
    clearNoMovementTimer();
    lastMovementPosition = null;
    isLooking = false;
    isPlaying = false;
    try { youtubePlayer?.stopVideo(); } catch {}
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
  }

  function loadYoutubeVideo(videoId) {
    pendingYoutubeVideoId = videoId;
    if (!youtubeApiReady) return;

    pendingYoutubeVideoId = null;
    videoPlayer.style.display = 'none';
    youtubeDiv.style.display = 'block';

    if (!youtubePlayer) {
      youtubePlayer = new YT.Player('youtube-player', {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => {
            try { youtubePlayer.pauseVideo(); } catch {}
            if (isLooking) playCurrentVideo();
          },
          onStateChange: event => {
            if (event.data === YT.PlayerState.ENDED) {
              isPlaying = false;
              setLookStatus({ fr: 'Vidéo terminée', en: 'Video ended', ja: '動画が終了しました' });
            }
          },
        },
      });
    } else {
      youtubePlayer.loadVideoById(videoId);
      try { youtubePlayer.pauseVideo(); } catch {}
    }
  }

  function startLookToPlay() {
    if (!selectedChoice?.video) return;

    resetPlayback();
    tilePickerModal.style.display = 'none';
    gameOptionsModal.style.display = 'none';
    videoContainer.style.display = 'flex';
    if (languageToggle) languageToggle.style.display = 'none';
    document.body.classList.add('look-video-active');
    gazePointer?.classList.add('look-visible', 'gp-dwell');

    if (selectedChoice.sourceType === 'youtube') {
      videoSource.removeAttribute('src');
      videoPlayer.removeAttribute('src');
      loadYoutubeVideo(getYouTubeId(selectedChoice.video));
    } else {
      youtubeDiv.style.display = 'none';
      videoPlayer.style.display = 'block';
      videoSource.src = selectedChoice.video;
      videoPlayer.load();
    }

    setLookStatus({ fr: 'Regardez la vidéo pour jouer', en: 'Look at the video to play', ja: '動画を見ると再生します' });
    ensureFullscreen();
  }

  function returnToPicker() {
    resetPlayback();
    videoContainer.style.display = 'none';
    tilePickerModal.style.display = 'flex';
    if (languageToggle) languageToggle.style.display = '';
    document.body.classList.remove('look-video-active');
    gazePointer?.classList.remove('look-visible', 'gp-dwell');
  }

  sourceButtons.forEach(button => {
    button.addEventListener('click', () => setSource(button.dataset.source));
  });

  chooseSourceButton.addEventListener('click', showPicker);
  backButton.addEventListener('click', showSourceOptions);
  startGameButton.addEventListener('click', startLookToPlay);

  categorySelect.addEventListener('change', event => {
    currentCategory = event.target.value;
    selectedChoice = null;
    populateTilePickerGrid();
    updateStartButtonState();
  });

  addVideoButton.addEventListener('click', () => addVideoInput.click());
  addVideoInput.addEventListener('change', async () => {
    await addLocalFiles(addVideoInput.files || []);
    addVideoInput.value = '';
  });

  addYoutubeButton.addEventListener('click', () => addYoutubeByUrl(addYoutubeInput.value));
  addYoutubeInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') addYoutubeByUrl(addYoutubeInput.value);
  });
  playlistButton.addEventListener('click', importPlaylist);
  clearButton.addEventListener('click', () => {
    youtubeChoices = [];
    selectedChoice = null;
    try { localStorage.removeItem(YOUTUBE_STORAGE_KEY); } catch {}
    populateTilePickerGrid();
    updateStartButtonState();
  });

  lookZone.addEventListener('pointerenter', handleLookStart);
  lookZone.addEventListener('pointermove', event => {
    trackPointerMovement(event);
    if (!isLooking) handleLookStart();
  });
  lookZone.addEventListener('pointerleave', handleLookEnd);

  document.addEventListener('pointermove', event => {
    trackPointerMovement(event);
  });

  document.addEventListener('keydown', event => {
    if (videoContainer.style.display === 'flex' && (event.key === 'Escape' || event.key === 'Backspace')) {
      event.preventDefault();
      returnToPicker();
    }
  });

  videoPlayer.addEventListener('ended', () => {
    isPlaying = false;
    setLookStatus({ fr: 'Vidéo terminée', en: 'Video ended', ja: '動画が終了しました' });
  });

  window.addEventListener('beforeunload', () => {
    clearNoMovementTimer();
    revokeLocalChoices();
  });

  ensurePointerOverlay();
  setSource('library');
  loadYoutubeUrls();
});
