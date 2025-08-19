// Builds mediaChoices from YouTube URLs or playlists
const mediaChoices = [];

function isYouTubeUrl(url) {
  return /youtu(?:\.be|be\.com)/.test(url);
}
function getYouTubeId(url) {
  const match = url.match(/(?:v=|\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
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
async function fetchVideoTitle(id) {
  try {
    const resp = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.title) return data.title;
    }
  } catch {}
  return `Video ${id}`;
}
async function addYoutubeVideo(id) {
  const title = await fetchVideoTitle(id);
  mediaChoices.push({
    name: title,
    image: `https://img.youtube.com/vi/${id}/0.jpg`,
    video: `https://www.youtube.com/watch?v=${id}`,
    category: 'custom'
  });
  if (typeof populateTilePickerGrid === 'function') {
    populateTilePickerGrid();
  }
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
    const resp = await fetch(q.toString());
    const text = await resp.text();
    if (!resp.ok) {
      let msg = `HTTP ${resp.status}`;
      try { const j = JSON.parse(text); if (j.error?.message) msg += ` – ${j.error.message}`; } catch {}
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
    const r = await fetch(u.toString());
    const t = await r.text();
    if (!r.ok) continue;
    try {
      const j = JSON.parse(t);
      (j.items || []).forEach(item => {
        const s = item.status || {};
        const emb = s.embeddable === true;
        const pubOrUnlisted = (s.privacyStatus === 'public' || s.privacyStatus === 'unlisted');
        if (emb && pubOrUnlisted) ok.add(item.id);
      });
    } catch {}
  }
  return Array.from(ok);
}

async function addYoutubeUrl(url) {
  const id = getYouTubeId(url);
  if (!id) return;
  await addYoutubeVideo(id);
}

document.addEventListener('DOMContentLoaded', () => {
  const addUrlInput = document.getElementById('add-video-url-input');
  const addUrlButton = document.getElementById('add-video-url-button');
  const playlistInput = document.getElementById('yt-playlist-url-input');
  const playlistButton = document.getElementById('yt-playlist-import-button');
  const playlistStatus = document.getElementById('yt-playlist-status');

  if (addUrlButton && addUrlInput) {
    addUrlButton.addEventListener('click', async () => {
      const url = addUrlInput.value.trim();
      if (!url) return;
      await addYoutubeUrl(url);
      addUrlInput.value = '';
    });
  }

  if (playlistButton && playlistInput) {
    playlistButton.addEventListener('click', async () => {
      const url = playlistInput.value.trim();
      const apiKey = window.YT_API_KEY;
      playlistStatus.textContent = '';
      if (!url) { playlistStatus.textContent = 'Veuillez entrer une URL de playlist.'; return; }
      const pid = getPlaylistIdFromUrl(url);
      if (!pid) { playlistStatus.textContent = "URL invalide: impossible d'extraire l'identifiant de playlist."; return; }
      if (!apiKey) { playlistStatus.textContent = 'Clé API absente (window.YT_API_KEY).'; return; }
      playlistButton.disabled = true;
      playlistStatus.textContent = 'Import en cours…';
      try {
        const ids = await fetchPlaylistVideoIds(apiKey, pid);
        const ok = await validateEmbeddableIds(apiKey, ids);
        for (const id of ok) {
          await addYoutubeVideo(id);
        }
        playlistStatus.textContent = `Import terminé: ${ok.length} ajouté(s).`;
      } catch (err) {
        console.error(err);
        playlistStatus.textContent = 'Import échoué.';
      } finally {
        playlistButton.disabled = false;
      }
    });
  }
});
