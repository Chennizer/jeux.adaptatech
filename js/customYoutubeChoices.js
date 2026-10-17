// Builds mediaChoices from YouTube URLs or playlists
const mediaChoices = [];
const YT_STORAGE_KEY = 'choiceYoutubeUrls';
const YT_SHARE_PARAM = 'videos';
const YT_STATUS_TIMEOUT_MS = 5000;
let ytStatusTimer = null;

function isYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.|m\.)?((youtube\.com\/\S+)|(youtu\.be\/\S+))$/.test(url);
}

function normalizeYouTubeUrl(urlOrId) {
  const id = getYouTubeId(urlOrId);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

function getYouTubeId(urlOrId) {
  const value = String(urlOrId || '').trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
  try {
    const u = new URL(value);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }
    const id = u.searchParams.get('v');
    if (id) return id;
    const shorts = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shorts) return shorts[1];
    const embed = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    return embed ? embed[1] : null;
  } catch {
    const m = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }
}

function extractYouTubeIds(text) {
  const ids = [];
  const seen = new Set();
  const parts = String(text || '')
    .split(/[\s,]+/)
    .map(part => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const id = getYouTubeId(part);
    if (id && !seen.has(id)) {
      ids.push(id);
      seen.add(id);
    }
  }
  return ids;
}

function getStoredVideoIds() {
  const saved = localStorage.getItem(YT_STORAGE_KEY);
  if (!saved) return [];
  const urls = JSON.parse(saved);
  return Array.isArray(urls) ? urls.map(getYouTubeId).filter(Boolean) : [];
}

function getIdsFromShareUrl() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get(YT_SHARE_PARAM);
  if (!value) return [];
  return value.split(',').map(getYouTubeId).filter(Boolean);
}

function hasVideoId(id) {
  return mediaChoices.some(choice => getYouTubeId(choice.video) === id);
}

function setImportStatus(message, tone = 'info') {
  const status = document.getElementById('yt-import-status');
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
  if (ytStatusTimer) clearTimeout(ytStatusTimer);
  if (message) {
    ytStatusTimer = setTimeout(() => {
      status.textContent = '';
      status.dataset.tone = '';
    }, YT_STATUS_TIMEOUT_MS);
  }
}

function updateYoutubeLibraryCount() {
  const countEl = document.getElementById('yt-library-count');
  const shareButton = document.getElementById('share-youtube-setup-button');
  if (countEl) {
    const count = mediaChoices.length;
    countEl.textContent = count ? ` • ${count} vidéo${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''}` : ' • 0 vidéo enregistrée';
  }
  if (shareButton) shareButton.disabled = mediaChoices.length === 0;
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

async function fetchPlaylistVideoIds(apiKey, playlistId, onProgress) {
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
    if (typeof onProgress === 'function') onProgress(ids.length);
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

async function addVideoById(id, { silent = false } = {}) {
  if (!id || hasVideoId(id)) return false;
  const url = `https://www.youtube.com/watch?v=${id}`;
  const title = await fetchVideoTitle(url);
  mediaChoices.push({
    name: title,
    image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
    video: url,
    category: 'custom'
  });
  saveYoutubeUrls();
  updateYoutubeLibraryCount();
  if (!silent) setImportStatus(`Ajouté: ${title}`, 'success');
  return true;
}

async function addVideosByIds(ids, { silent = false } = {}) {
  let added = 0;
  let skipped = 0;
  for (const id of ids) {
    if (await addVideoById(id, { silent: true })) added++;
    else skipped++;
  }
  if (!silent) {
    const parts = [`${added} vidéo${added > 1 ? 's' : ''} ajoutée${added > 1 ? 's' : ''}`];
    if (skipped) parts.push(`${skipped} doublon${skipped > 1 ? 's' : ''} ignoré${skipped > 1 ? 's' : ''}`);
    setImportStatus(parts.join(' • '), added ? 'success' : 'warning');
  }
  updateYoutubeLibraryCount();
  return added;
}

function saveYoutubeUrls() {
  try {
    const urls = mediaChoices.map(m => normalizeYouTubeUrl(m.video)).filter(Boolean);
    localStorage.setItem(YT_STORAGE_KEY, JSON.stringify(urls));
  } catch {}
}

async function loadStoredYoutubeUrls() {
  let ids = [];
  try {
    ids = [...getStoredVideoIds(), ...getIdsFromShareUrl()];
  } catch (e) {
    console.error('Failed to load stored YouTube URLs', e);
  }
  await addVideosByIds(ids, { silent: true });
  if (getIdsFromShareUrl().length) {
    setImportStatus('Configuration chargée depuis le lien partagé.', 'success');
  }
}

function buildShareUrl() {
  const ids = mediaChoices.map(choice => getYouTubeId(choice.video)).filter(Boolean);
  const url = new URL(window.location.href);
  if (ids.length) url.searchParams.set(YT_SHARE_PARAM, ids.join(','));
  else url.searchParams.delete(YT_SHARE_PARAM);
  return url.toString();
}

async function copyShareUrl() {
  const shareUrl = buildShareUrl();
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareUrl);
  } else {
    const scratch = document.createElement('textarea');
    scratch.value = shareUrl;
    scratch.setAttribute('readonly', '');
    scratch.style.position = 'fixed';
    scratch.style.left = '-9999px';
    document.body.appendChild(scratch);
    scratch.select();
    document.execCommand('copy');
    document.body.removeChild(scratch);
  }
  setImportStatus('Lien copié. Vous pouvez le partager avec une famille, une classe ou un collègue.', 'success');
}

document.addEventListener('DOMContentLoaded', async () => {
  const addUrlBtn = document.getElementById('add-video-url-button');
  const addUrlInput = document.getElementById('add-video-url-input');
  const playlistBtn = document.getElementById('yt-playlist-import-button');
  const playlistInput = document.getElementById('yt-playlist-url-input');
  const clearButton = document.getElementById('clear-videos-button');
  const shareButton = document.getElementById('share-youtube-setup-button');

  await loadStoredYoutubeUrls();
  updateYoutubeLibraryCount();
  if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();

  if (addUrlBtn && addUrlInput) {
    const addFromInput = async () => {
      const ids = extractYouTubeIds(addUrlInput.value);
      if (!ids.length) {
        setImportStatus('Collez au moins une URL YouTube valide.', 'warning');
        return;
      }
      addUrlBtn.disabled = true;
      try {
        await addVideosByIds(ids);
        addUrlInput.value = '';
        if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();
      } finally {
        addUrlBtn.disabled = false;
      }
    };
    addUrlBtn.addEventListener('click', addFromInput);
    addUrlInput.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        addFromInput();
      }
    });
  }

  if (playlistBtn && playlistInput) {
    playlistBtn.addEventListener('click', async () => {
      const url = playlistInput.value.trim();
      const pid = getPlaylistIdFromUrl(url);
      const apiKey = window.YT_API_KEY;
      if (!url) { setImportStatus('Veuillez entrer une URL de playlist.', 'warning'); return; }
      if (!pid) { setImportStatus("URL invalide: impossible d'extraire l'identifiant de playlist.", 'warning'); return; }
      if (!apiKey) { setImportStatus('Clé API absente (window.YT_API_KEY).', 'warning'); return; }
      playlistBtn.disabled = true;
      setImportStatus('Import de la playlist en cours...', 'info');
      try {
        const ids = await fetchPlaylistVideoIds(apiKey, pid, count => {
          setImportStatus(`Lecture de la playlist... ${count} vidéo${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''}`, 'info');
        });
        const ok = await validateEmbeddableIds(apiKey, ids);
        await addVideosByIds([...ok]);
        playlistInput.value = '';
        if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();
      } catch (err) {
        console.error(err);
        setImportStatus('Import échoué: ' + (err?.message || 'erreur'), 'warning');
      } finally {
        playlistBtn.disabled = false;
      }
    });
  }

  if (shareButton) {
    shareButton.addEventListener('click', () => {
      copyShareUrl().catch(err => {
        console.error(err);
        setImportStatus('Impossible de copier le lien automatiquement.', 'warning');
      });
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      mediaChoices.length = 0;
      try { localStorage.removeItem(YT_STORAGE_KEY); } catch {}
      updateYoutubeLibraryCount();
      setImportStatus('Bibliothèque YouTube effacée.', 'success');
      if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();
    });
  }
});
