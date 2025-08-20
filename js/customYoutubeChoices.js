// Builds mediaChoices from YouTube URLs or playlists
const mediaChoices = [];
const YT_STORAGE_KEY = 'choiceYoutubeUrls';

function isYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.|m\.)?((youtube\.com\/\S+)|(youtu\.be\/\S+))$/.test(url);
}

function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1);
    }
    const id = u.searchParams.get('v');
    if (id) return id;
    const m = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function fetchVideoTitle(url) {
  try {
    const r = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (r.ok) {
      const d = await r.json();
      if (d && d.title) return d.title;
    }
  } catch {}
  return url;
}

function getPlaylistIdFromUrl(url) {
  try {
    const u = new URL(url);
    const list = u.searchParams.get('list');
    if (list) return list;
    const m = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
  } catch {}
  return null;
}

async function fetchPlaylistVideoIds(apiKey, playlistId) {
  const ids = [];
  let pageToken = '';
  while (true) {
    const q = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    q.searchParams.set('part', 'contentDetails');
    q.searchParams.set('maxResults', '50');
    q.searchParams.set('playlistId', playlistId);
    q.searchParams.set('key', apiKey);
    if (pageToken) q.searchParams.set('pageToken', pageToken);
    const resp = await fetch(q);
    const text = await resp.text();
    if (!resp.ok) {
      let msg = `HTTP ${resp.status}`;
      try {
        const j = JSON.parse(text);
        if (j.error?.message) msg += ` – ${j.error.message}`;
      } catch {}
      throw new Error(msg);
    }
    const data = JSON.parse(text);
    (data.items || []).forEach(it => {
      const vid = it?.contentDetails?.videoId;
      if (vid) ids.push(vid);
    });
    pageToken = data.nextPageToken || '';
    if (!pageToken) break;
  }
  return ids;
}

async function validateEmbeddableIds(apiKey, ids) {
  const ok = new Set();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const u = new URL('https://www.googleapis.com/youtube/v3/videos');
    u.searchParams.set('part', 'status');
    u.searchParams.set('id', chunk.join(','));
    u.searchParams.set('key', apiKey);
    const resp = await fetch(u);
    const data = await resp.json();
    (data.items || []).forEach(it => {
      if (it?.status?.embeddable && it?.status?.privacyStatus !== 'private') {
        ok.add(it.id);
      }
    });
  }
  return ok;
}

async function addVideoById(id) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  const title = await fetchVideoTitle(url);
  mediaChoices.push({
    name: title,
    image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
    video: url,
    category: 'custom'
  });
  saveYoutubeUrls();
}

function saveYoutubeUrls() {
  try {
    const urls = mediaChoices.map(m => m.video);
    localStorage.setItem(YT_STORAGE_KEY, JSON.stringify(urls));
  } catch {}
}

async function loadStoredYoutubeUrls() {
  const saved = localStorage.getItem(YT_STORAGE_KEY);
  if (!saved) return;
  try {
    const urls = JSON.parse(saved);
    for (const url of urls) {
      const id = getYouTubeId(url);
      if (id) await addVideoById(id);
    }
  } catch (e) {
    console.error('Failed to load stored YouTube URLs', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const addUrlBtn = document.getElementById('add-video-url-button');
  const addUrlInput = document.getElementById('add-video-url-input');
  const playlistBtn = document.getElementById('yt-playlist-import-button');
  const playlistInput = document.getElementById('yt-playlist-url-input');
  const clearButton = document.getElementById('clear-videos-button');

  await loadStoredYoutubeUrls();
  if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();

  if (addUrlBtn && addUrlInput) {
    addUrlBtn.addEventListener('click', async () => {
      const url = addUrlInput.value.trim();
      const id = getYouTubeId(url);
      if (!id) { console.error('URL YouTube invalide'); return; }
      await addVideoById(id);
      addUrlInput.value = '';
      if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();
    });
  }

  if (playlistBtn && playlistInput) {
    playlistBtn.addEventListener('click', async () => {
      const url = playlistInput.value.trim();
      const pid = getPlaylistIdFromUrl(url);
      const apiKey = window.YT_API_KEY;
      if (!url) { console.error('Veuillez entrer une URL de playlist.'); return; }
      if (!pid) { console.error("URL invalide: impossible d'extraire l'identifiant de playlist."); return; }
      if (!apiKey) { console.error('Clé API absente (window.YT_API_KEY).'); return; }
      playlistBtn.disabled = true;
      try {
        const ids = await fetchPlaylistVideoIds(apiKey, pid);
        const ok = await validateEmbeddableIds(apiKey, ids);
        for (const id of ok) {
          await addVideoById(id);
        }
        if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();
      } catch (err) {
        console.error(err);
        console.error('Import échoué: ' + (err?.message || 'erreur'));
      } finally {
        playlistBtn.disabled = false;
      }
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      mediaChoices.length = 0;
      try { localStorage.removeItem(YT_STORAGE_KEY); } catch {}
      if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();
    });
  }
});
