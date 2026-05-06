document.addEventListener('DOMContentLoaded', () => {
  const sourceModal = document.getElementById('source-modal');
  const pickerModal = document.getElementById('picker-modal');
  const sourceButtons = Array.from(document.querySelectorAll('.source-pill'));
  const libraryControls = document.getElementById('library-controls');
  const localControls = document.getElementById('local-controls');
  const youtubeControls = document.getElementById('youtube-controls');
  const categorySelect = document.getElementById('categorySelect');
  const localVideoInput = document.getElementById('local-video-input');
  const youtubeUrlInput = document.getElementById('youtube-url-input');
  const youtubePlaylistInput = document.getElementById('youtube-playlist-input');
  const addYoutubeButton = document.getElementById('add-youtube-button');
  const importPlaylistButton = document.getElementById('import-playlist-button');
  const pickerStatus = document.getElementById('picker-status');
  const grid = document.getElementById('single-video-grid');
  const backButton = document.getElementById('back-to-source-button');
  const startButton = document.getElementById('start-look-video-button');
  const videoStage = document.getElementById('video-stage');
  const videoFrame = document.getElementById('look-video-frame');
  const video = document.getElementById('look-video');
  const youtubeDiv = document.getElementById('youtube-player');
  const lookZone = document.getElementById('look-zone');
  const lookStatus = document.getElementById('look-status');
  const gazePointer = document.getElementById('gazePointer');
  const languageToggle = document.getElementById('language-toggle');

  const LOOK_AWAY_GRACE_MS = 2000;
  const STORAGE_KEY = 'lookToPlayYoutubeChoices';
  const supportedSources = ['local', 'youtube', 'library'];

  let currentSource = null;
  let currentCategory = 'all';
  let selectedChoice = null;
  let localObjectUrl = null;
  let youtubeChoices = [];
  let youtubePlayer = null;
  let youtubeApiReady = Boolean(window.YT && window.YT.Player);
  let pendingYoutubeVideoId = null;
  let pauseTimer = null;
  let isLooking = false;
  let isPlaying = false;

  window.onYouTubeIframeAPIReady = () => {
    youtubeApiReady = true;
    if (pendingYoutubeVideoId) {
      loadYoutubeVideo(pendingYoutubeVideoId);
    }
  };

  function setStatus(message = '') {
    pickerStatus.textContent = message;
  }

  function setLookStatus(fr, en = fr, ja = en) {
    lookStatus.textContent = fr;
    lookStatus.dataset.fr = fr;
    lookStatus.dataset.en = en;
    lookStatus.dataset.ja = ja;
  }

  function ensureFullscreen() {
    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) {
      root.requestFullscreen().catch(() => {});
    }
  }

  function updatePointer(event) {
    if (!gazePointer) return;
    gazePointer.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  }

  function categoriesInclude(choice, category) {
    if (category === 'all') return true;
    const categories = Array.isArray(choice.category) ? choice.category : [choice.category];
    return categories.includes(category);
  }

  function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.|m\.)?((youtube\.com\/\S+)|(youtu\.be\/\S+))$/.test(url);
  }

  function getYouTubeId(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1).split(/[?&]/)[0];
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

  function saveYoutubeChoices() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(youtubeChoices.map(choice => choice.video)));
    } catch {}
  }

  async function loadYoutubeChoices() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      for (const url of saved) {
        const id = getYouTubeId(url);
        if (!id || youtubeChoices.some(choice => choice.video === url)) continue;
        youtubeChoices.push({
          name: await fetchVideoTitle(url),
          image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
          video: url,
          type: 'youtube',
        });
      }
    } catch {}
  }

  async function addYoutubeUrl(url) {
    const cleanUrl = url.trim();
    const id = getYouTubeId(cleanUrl);
    if (!id || !isYouTubeUrl(cleanUrl)) {
      setStatus('URL YouTube invalide / Invalid YouTube URL');
      return;
    }

    const canonicalUrl = `https://www.youtube.com/watch?v=${id}`;
    let choice = youtubeChoices.find(item => item.video === canonicalUrl);
    if (!choice) {
      choice = {
        name: await fetchVideoTitle(canonicalUrl),
        image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
        video: canonicalUrl,
        type: 'youtube',
      };
      youtubeChoices.push(choice);
      saveYoutubeChoices();
    }

    selectedChoice = choice;
    setStatus('Vidéo YouTube ajoutée. / YouTube video added.');
    renderGrid();
    updateStartButton();
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
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || `HTTP ${response.status}`);
      data.items?.forEach(item => {
        if (item?.contentDetails?.videoId) ids.push(item.contentDetails.videoId);
      });
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    return ids;
  }

  async function importPlaylist() {
    const playlistId = getPlaylistIdFromUrl(youtubePlaylistInput.value.trim());
    const apiKey = window.YT_API_KEY;
    if (!playlistId) {
      setStatus("URL de playlist invalide. / Invalid playlist URL.");
      return;
    }
    if (!apiKey) {
      setStatus('Clé API YouTube absente. / Missing YouTube API key.');
      return;
    }

    importPlaylistButton.disabled = true;
    setStatus('Importation de la playlist... / Importing playlist...');
    try {
      const ids = await fetchPlaylistVideoIds(apiKey, playlistId);
      for (const id of ids) {
        const url = `https://www.youtube.com/watch?v=${id}`;
        if (!youtubeChoices.some(choice => choice.video === url)) {
          youtubeChoices.push({
            name: await fetchVideoTitle(url),
            image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
            video: url,
            type: 'youtube',
          });
        }
      }
      saveYoutubeChoices();
      setStatus(`${ids.length} vidéos importées. / ${ids.length} videos imported.`);
      renderGrid();
    } catch (error) {
      setStatus(`Import échoué: ${error.message}`);
    } finally {
      importPlaylistButton.disabled = false;
    }
  }

  function choicesForCurrentSource() {
    if (currentSource === 'library') {
      return (Array.isArray(window.mediaChoices) ? window.mediaChoices : mediaChoices)
        .filter(choice => categoriesInclude(choice, currentCategory))
        .map(choice => ({ ...choice, type: 'file' }));
    }
    if (currentSource === 'youtube') return youtubeChoices;
    if (currentSource === 'local' && selectedChoice) return [selectedChoice];
    return [];
  }

  function renderGrid() {
    grid.innerHTML = '';
    const choices = choicesForCurrentSource();

    choices.forEach(choice => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tile';
      if (selectedChoice?.video === choice.video) tile.classList.add('selected');
      if (choice.image) tile.style.backgroundImage = `url(${choice.image})`;
      tile.innerHTML = `<span class="caption"></span>`;
      tile.querySelector('.caption').textContent = choice.name || 'Vidéo';
      tile.addEventListener('click', () => {
        selectedChoice = choice;
        renderGrid();
        updateStartButton();
      });
      grid.appendChild(tile);
    });

    if (!choices.length) {
      const empty = document.createElement('p');
      empty.className = 'status-note';
      empty.textContent = currentSource === 'local'
        ? 'Choisissez un fichier vidéo. / Choose a video file.'
        : 'Aucune vidéo à afficher. / No videos to show.';
      grid.appendChild(empty);
    }
  }

  function updateStartButton() {
    startButton.disabled = !selectedChoice?.video;
  }

  function resetPickerForSource(source) {
    currentSource = source;
    selectedChoice = null;
    currentCategory = 'all';
    if (categorySelect) categorySelect.value = 'all';
    setStatus('');

    libraryControls.style.display = source === 'library' ? 'flex' : 'none';
    localControls.style.display = source === 'local' ? 'flex' : 'none';
    youtubeControls.style.display = source === 'youtube' ? 'block' : 'none';

    sourceButtons.forEach(button => {
      button.classList.toggle('selected', button.dataset.source === source);
    });

    sourceModal.style.display = 'none';
    pickerModal.style.display = 'flex';
    renderGrid();
    updateStartButton();
  }

  function clearPauseTimer() {
    if (pauseTimer) {
      clearTimeout(pauseTimer);
      pauseTimer = null;
    }
  }

  function playSelectedMedia() {
    clearPauseTimer();
    if (!selectedChoice) return;
    setLookStatus('Lecture...', 'Playing...', '再生中...');
    if (selectedChoice.type === 'youtube') {
      try { youtubePlayer?.playVideo(); isPlaying = true; } catch {}
    } else {
      video.play().then(() => { isPlaying = true; }).catch(() => {
        setLookStatus('Cliquez ou regardez de nouveau pour jouer', 'Click or look again to play', 'クリックするか、もう一度見て再生します');
      });
    }
  }

  function pauseSelectedMedia() {
    clearPauseTimer();
    if (selectedChoice?.type === 'youtube') {
      try { youtubePlayer?.pauseVideo(); } catch {}
    } else {
      video.pause();
    }
    isPlaying = false;
    setLookStatus('Regardez la vidéo pour jouer', 'Look at the video to play', '動画を見ると再生します');
  }

  function scheduleGracePause() {
    clearPauseTimer();
    setLookStatus('Pause dans 2 secondes...', 'Pausing in 2 seconds...', '2秒後に一時停止...');
    pauseTimer = setTimeout(() => {
      if (!isLooking) pauseSelectedMedia();
    }, LOOK_AWAY_GRACE_MS);
  }

  function handleLookStart() {
    isLooking = true;
    playSelectedMedia();
  }

  function handleLookEnd() {
    isLooking = false;
    if (isPlaying) scheduleGracePause();
  }

  function resetPlayers() {
    clearPauseTimer();
    isLooking = false;
    isPlaying = false;
    try { youtubePlayer?.stopVideo(); } catch {}
    video.pause();
    video.removeAttribute('src');
    video.load();
    youtubeDiv.style.display = 'none';
    video.style.display = 'block';
  }

  function loadYoutubeVideo(videoId) {
    pendingYoutubeVideoId = videoId;
    if (!youtubeApiReady) return;
    pendingYoutubeVideoId = null;
    video.style.display = 'none';
    youtubeDiv.style.display = 'block';
    if (!youtubePlayer) {
      youtubePlayer = new YT.Player('youtube-player', {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => {
            if (isLooking) playSelectedMedia();
          },
          onStateChange: event => {
            if (event.data === YT.PlayerState.ENDED) {
              isPlaying = false;
              setLookStatus('Vidéo terminée', 'Video ended', '動画が終了しました');
            }
          },
        },
      });
    } else {
      youtubePlayer.loadVideoById(videoId);
      youtubePlayer.pauseVideo();
    }
  }

  function startExperience() {
    if (!selectedChoice?.video) return;
    pickerModal.style.display = 'none';
    sourceModal.style.display = 'none';
    if (languageToggle) languageToggle.style.display = 'none';
    resetPlayers();

    if (selectedChoice.type === 'youtube') {
      const videoId = getYouTubeId(selectedChoice.video);
      loadYoutubeVideo(videoId);
    } else {
      video.src = selectedChoice.video;
      video.load();
    }

    videoStage.style.display = 'flex';
    setLookStatus('Regardez la vidéo pour jouer', 'Look at the video to play', '動画を見ると再生します');
    ensureFullscreen();
  }

  function returnToPicker() {
    resetPlayers();
    videoStage.style.display = 'none';
    pickerModal.style.display = 'flex';
    if (languageToggle) languageToggle.style.display = '';
  }

  sourceButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const source = button.dataset.source;
      if (!supportedSources.includes(source)) return;
      if (source === 'youtube' && youtubeChoices.length === 0) {
        await loadYoutubeChoices();
      }
      resetPickerForSource(source);
    });
  });

  backButton.addEventListener('click', () => {
    pickerModal.style.display = 'none';
    sourceModal.style.display = 'flex';
  });

  categorySelect.addEventListener('change', event => {
    currentCategory = event.target.value;
    selectedChoice = null;
    renderGrid();
    updateStartButton();
  });

  localVideoInput.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
    localObjectUrl = URL.createObjectURL(file);
    selectedChoice = {
      name: file.name,
      image: '../../images/localvideosmultiplechoices.png',
      video: localObjectUrl,
      type: 'file',
    };
    setStatus('Vidéo locale prête. / Local video ready.');
    renderGrid();
    updateStartButton();
  });

  addYoutubeButton.addEventListener('click', () => addYoutubeUrl(youtubeUrlInput.value));
  youtubeUrlInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') addYoutubeUrl(youtubeUrlInput.value);
  });
  importPlaylistButton.addEventListener('click', importPlaylist);
  startButton.addEventListener('click', startExperience);

  lookZone.addEventListener('pointerenter', handleLookStart);
  lookZone.addEventListener('pointermove', event => {
    updatePointer(event);
    if (!isLooking) handleLookStart();
  });
  lookZone.addEventListener('pointerleave', handleLookEnd);
  videoFrame.addEventListener('click', () => {
    isLooking = true;
    playSelectedMedia();
  });

  document.addEventListener('pointermove', updatePointer);
  document.addEventListener('keydown', event => {
    if (videoStage.style.display === 'flex' && (event.key === 'Escape' || event.key === 'Backspace')) {
      event.preventDefault();
      returnToPicker();
    }
  });

  video.addEventListener('ended', () => {
    isPlaying = false;
    setLookStatus('Vidéo terminée', 'Video ended', '動画が終了しました');
  });

  window.addEventListener('beforeunload', () => {
    if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
  });
});
