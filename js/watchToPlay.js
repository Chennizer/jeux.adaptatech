(function () {
  'use strict';

  const PAUSE_GRACE_MS = 2000;
  const YOUTUBE_STORAGE_KEY = 'watchToPlayYoutubeUrls';

  const sourceModal = document.getElementById('source-modal');
  const pickerModal = document.getElementById('video-picker-modal');
  const pickerTitle = document.getElementById('picker-title');
  const pickerDescription = document.getElementById('picker-description');
  const libraryControls = document.getElementById('library-controls');
  const localControls = document.getElementById('local-controls');
  const youtubeControls = document.getElementById('youtube-controls');
  const categorySelect = document.getElementById('categorySelect');
  const libraryGrid = document.getElementById('library-grid');
  const youtubeGrid = document.getElementById('youtube-grid');
  const youtubeStatus = document.getElementById('youtube-status');
  const startButton = document.getElementById('start-watch-button');
  const backButton = document.getElementById('back-to-sources-button');
  const localButton = document.getElementById('choose-local-video-button');
  const localInput = document.getElementById('local-video-input');
  const localPreview = document.getElementById('local-selection-preview');
  const youtubeUrlInput = document.getElementById('youtube-url-input');
  const addYoutubeButton = document.getElementById('add-youtube-button');
  const youtubePlaylistInput = document.getElementById('youtube-playlist-input');
  const importPlaylistButton = document.getElementById('import-playlist-button');
  const watchStage = document.getElementById('watch-stage');
  const watchFrame = document.getElementById('watch-frame');
  const watchVideo = document.getElementById('watch-video');
  const youtubePlayerElement = document.getElementById('youtube-player');
  const watchHint = document.getElementById('watch-hint');
  const exitButton = document.getElementById('exit-watch-button');
  const gazePointer = document.getElementById('gazePointer');

  let currentSource = '';
  let selectedVideo = null;
  let localObjectUrl = '';
  let youtubeChoices = [];
  let youtubePlayer = null;
  let youtubeApiReady = false;
  let pendingYoutubeVideoId = '';
  let pauseTimer = 0;
  let isLooking = false;

  const sourceCopy = {
    local: {
      title: 'Vidéo locale',
      description: 'Importez une vidéo de votre appareil, puis appuyez sur Commencer.'
    },
    youtube: {
      title: 'Vidéo YouTube',
      description: 'Ajoutez une URL YouTube ou importez une playlist, choisissez une vidéo, puis appuyez sur Commencer.'
    },
    library: {
      title: 'Bibliothèque de vidéos',
      description: 'Choisissez une vidéo de la bibliothèque Adaptatech, puis appuyez sur Commencer.'
    }
  };

  function setStatus(message) {
    if (youtubeStatus) youtubeStatus.textContent = message || '';
  }

  function getCategories(choice) {
    if (!choice || !choice.category) return [];
    return Array.isArray(choice.category) ? choice.category : [choice.category];
  }

  function setSelected(video) {
    selectedVideo = video;
    startButton.disabled = !selectedVideo;
    renderSelectedStates();
  }

  function showPicker(source) {
    currentSource = source;
    selectedVideo = null;
    startButton.disabled = true;
    sourceModal.style.display = 'none';
    pickerModal.style.display = 'flex';

    libraryControls.hidden = source !== 'library';
    localControls.hidden = source !== 'local';
    youtubeControls.hidden = source !== 'youtube';

    pickerTitle.textContent = sourceCopy[source]?.title || 'Choisir une vidéo';
    pickerDescription.textContent = sourceCopy[source]?.description || '';

    if (source === 'library') {
      populateCategories();
      renderLibraryGrid();
    }
    if (source === 'youtube') {
      loadStoredYoutubeUrls();
      renderYoutubeGrid();
    }
  }

  function showSources() {
    pickerModal.style.display = 'none';
    sourceModal.style.display = 'flex';
    currentSource = '';
    selectedVideo = null;
    startButton.disabled = true;
  }

  function populateCategories() {
    if (!categorySelect || categorySelect.dataset.ready === 'true') return;
    const categories = new Set();
    (window.mediaChoices || mediaChoices || []).forEach(choice => {
      getCategories(choice).forEach(category => categories.add(category));
    });
    Array.from(categories).sort().forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      categorySelect.appendChild(option);
    });
    categorySelect.dataset.ready = 'true';
  }

  function createChoiceCard(choice, index, source) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'video-choice-card';
    button.dataset.index = String(index);
    button.dataset.source = source;

    const thumb = document.createElement('div');
    thumb.className = 'video-choice-thumb';
    thumb.style.backgroundImage = `url("${choice.image || '../../images/custom-videos.svg'}")`;

    const title = document.createElement('div');
    title.className = 'video-choice-title';
    title.textContent = choice.name || 'Vidéo';

    button.appendChild(thumb);
    button.appendChild(title);
    button.addEventListener('pointerup', () => setSelected({ ...choice, source }));
    return button;
  }

  function renderLibraryGrid() {
    const choices = window.mediaChoices || mediaChoices || [];
    const category = categorySelect.value || 'all';
    libraryGrid.innerHTML = '';
    choices.forEach((choice, index) => {
      const inCategory = category === 'all' || getCategories(choice).includes(category);
      if (inCategory) libraryGrid.appendChild(createChoiceCard(choice, index, 'library'));
    });
    renderSelectedStates();
  }

  function renderYoutubeGrid() {
    youtubeGrid.innerHTML = '';
    youtubeChoices.forEach((choice, index) => {
      youtubeGrid.appendChild(createChoiceCard(choice, index, 'youtube'));
    });
    renderSelectedStates();
  }

  function renderSelectedStates() {
    document.querySelectorAll('.video-choice-card').forEach(card => {
      const index = Number(card.dataset.index);
      const source = card.dataset.source;
      let candidate = null;
      if (source === 'library') candidate = (window.mediaChoices || mediaChoices || [])[index];
      if (source === 'youtube') candidate = youtubeChoices[index];
      card.classList.toggle('selected', Boolean(selectedVideo && candidate && selectedVideo.video === candidate.video));
    });
  }

  function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.|m\.)?((youtube\.com\/\S+)|(youtu\.be\/\S+))$/.test(url.trim());
  }

  function getYouTubeId(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1).split('/')[0];
      const id = parsed.searchParams.get('v');
      if (id) return id;
      const embedMatch = parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      return embedMatch ? embedMatch[1] : '';
    } catch {
      return '';
    }
  }

  function getPlaylistIdFromUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get('list') || '';
    } catch {
      const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      return match ? match[1] : '';
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

  function saveYoutubeUrls() {
    try {
      localStorage.setItem(YOUTUBE_STORAGE_KEY, JSON.stringify(youtubeChoices.map(choice => choice.video)));
    } catch {}
  }

  async function addYoutubeById(id) {
    if (!id) throw new Error('URL YouTube invalide.');
    const url = `https://www.youtube.com/watch?v=${id}`;
    if (youtubeChoices.some(choice => choice.video === url)) {
      setStatus('Cette vidéo est déjà dans la liste.');
      return;
    }
    const title = await fetchVideoTitle(url);
    youtubeChoices.push({
      name: title,
      image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      video: url,
      youtubeId: id,
      source: 'youtube'
    });
    saveYoutubeUrls();
    renderYoutubeGrid();
    setStatus('Vidéo ajoutée.');
  }

  async function loadStoredYoutubeUrls() {
    if (youtubeChoices.length > 0) return;
    try {
      const saved = JSON.parse(localStorage.getItem(YOUTUBE_STORAGE_KEY) || '[]');
      for (const url of saved) {
        const id = getYouTubeId(url);
        if (id) await addYoutubeById(id);
      }
      setStatus('');
    } catch {}
  }

  async function fetchPlaylistVideoIds(playlistId) {
    if (!window.YT_API_KEY) throw new Error('Clé API YouTube manquante.');
    const ids = [];
    let pageToken = '';
    do {
      const query = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      query.searchParams.set('part', 'contentDetails');
      query.searchParams.set('maxResults', '50');
      query.searchParams.set('playlistId', playlistId);
      query.searchParams.set('key', window.YT_API_KEY);
      if (pageToken) query.searchParams.set('pageToken', pageToken);
      const response = await fetch(query);
      const text = await response.text();
      if (!response.ok) throw new Error(`Import impossible (${response.status}) ${text}`);
      const data = JSON.parse(text);
      (data.items || []).forEach(item => {
        if (item?.contentDetails?.videoId) ids.push(item.contentDetails.videoId);
      });
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    return ids;
  }

  function clearPauseTimer() {
    if (pauseTimer) {
      clearTimeout(pauseTimer);
      pauseTimer = 0;
    }
  }

  function showPlayingHint(hidden) {
    watchHint.classList.toggle('is-hidden', hidden);
  }

  function playCurrentVideo() {
    clearPauseTimer();
    showPlayingHint(true);
    if (selectedVideo?.source === 'youtube') {
      youtubePlayer?.playVideo?.();
    } else {
      watchVideo.play().catch(() => showPlayingHint(false));
    }
  }

  function pauseCurrentVideo() {
    showPlayingHint(false);
    if (selectedVideo?.source === 'youtube') {
      youtubePlayer?.pauseVideo?.();
    } else {
      watchVideo.pause();
    }
  }

  function schedulePause() {
    clearPauseTimer();
    pauseTimer = window.setTimeout(() => {
      if (!isLooking) pauseCurrentVideo();
    }, PAUSE_GRACE_MS);
  }

  function setLooking(nextLooking) {
    if (isLooking === nextLooking) return;
    isLooking = nextLooking;
    if (isLooking) playCurrentVideo();
    else schedulePause();
  }

  function updateGazePointer(event) {
    if (!gazePointer) return;
    gazePointer.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  }

  function handlePointerMove(event) {
    updateGazePointer(event);
    if (watchStage.style.display !== 'none') {
      const rect = watchFrame.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      setLooking(inside);
    }
  }

  function prepareLocalVideo() {
    youtubePlayerElement.style.display = 'none';
    watchVideo.style.display = 'block';
    watchVideo.src = selectedVideo.video;
    watchVideo.load();
  }

  function prepareYoutubeVideo() {
    watchVideo.pause();
    watchVideo.removeAttribute('src');
    watchVideo.load();
    watchVideo.style.display = 'none';
    youtubePlayerElement.style.display = 'block';
    const id = selectedVideo.youtubeId || getYouTubeId(selectedVideo.video);
    pendingYoutubeVideoId = id;
    if (youtubePlayer && id) {
      youtubePlayer.cueVideoById(id);
    } else if (youtubeApiReady && id) {
      createYoutubePlayer(id);
    }
  }

  function createYoutubePlayer(videoId) {
    youtubePlayer = new YT.Player('youtube-player', {
      width: '100%',
      height: '100%',
      videoId,
      playerVars: {
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        controls: 0,
        disablekb: 1
      },
      events: {
        onReady: () => {
          if (pendingYoutubeVideoId) youtubePlayer.cueVideoById(pendingYoutubeVideoId);
        }
      }
    });
  }

  function requestFullscreen() {
    const element = document.documentElement;
    if (!document.fullscreenElement && element.requestFullscreen) {
      element.requestFullscreen().catch(() => {});
    }
  }

  function startExperience() {
    if (!selectedVideo) return;
    pickerModal.style.display = 'none';
    sourceModal.style.display = 'none';
    watchStage.style.display = 'block';
    isLooking = false;
    clearPauseTimer();
    showPlayingHint(false);
    if (selectedVideo.source === 'youtube') prepareYoutubeVideo();
    else prepareLocalVideo();
    requestFullscreen();
  }

  function exitExperience() {
    clearPauseTimer();
    pauseCurrentVideo();
    watchStage.style.display = 'none';
    pickerModal.style.display = 'flex';
    isLooking = false;
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  window.onYouTubeIframeAPIReady = function () {
    youtubeApiReady = true;
    if (pendingYoutubeVideoId) createYoutubePlayer(pendingYoutubeVideoId);
  };

  document.querySelectorAll('.source-pill').forEach(button => {
    button.addEventListener('pointerup', () => showPicker(button.dataset.source));
  });

  backButton.addEventListener('pointerup', showSources);
  categorySelect.addEventListener('change', renderLibraryGrid);
  localButton.addEventListener('pointerup', () => localInput.click());
  localInput.addEventListener('change', () => {
    const file = localInput.files?.[0];
    if (!file) return;
    if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
    localObjectUrl = URL.createObjectURL(file);
    localPreview.textContent = file.name;
    setSelected({
      name: file.name,
      video: localObjectUrl,
      source: 'local'
    });
  });

  addYoutubeButton.addEventListener('pointerup', async () => {
    const url = youtubeUrlInput.value.trim();
    if (!isYouTubeUrl(url)) {
      setStatus('Entrez une URL YouTube valide.');
      return;
    }
    setStatus('Ajout en cours...');
    try {
      await addYoutubeById(getYouTubeId(url));
      youtubeUrlInput.value = '';
    } catch (error) {
      setStatus(error.message || 'Impossible d’ajouter cette vidéo.');
    }
  });

  importPlaylistButton.addEventListener('pointerup', async () => {
    const playlistId = getPlaylistIdFromUrl(youtubePlaylistInput.value.trim());
    if (!playlistId) {
      setStatus('Entrez une URL de playlist valide.');
      return;
    }
    setStatus('Importation de la playlist...');
    try {
      const ids = await fetchPlaylistVideoIds(playlistId);
      for (const id of ids) await addYoutubeById(id);
      youtubePlaylistInput.value = '';
      setStatus(`${ids.length} vidéo(s) importée(s).`);
    } catch (error) {
      setStatus(error.message || 'Impossible d’importer la playlist.');
    }
  });

  startButton.addEventListener('pointerup', startExperience);
  exitButton.addEventListener('pointerup', exitExperience);
  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerleave', () => {
    if (watchStage.style.display !== 'none') setLooking(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && watchStage.style.display !== 'none') exitExperience();
  });
}());
