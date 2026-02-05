
let youtubePlayer = null;
let youtubeStateChangeHandler = null;
let youtubeApiReady = false;
let pendingYouTubeId = null;

// global-safe delegate set inside DOMContentLoaded
window.__handleMediaEnd = null;

const YT_PLAYER_VARS = {
  controls: 0,
  disablekb: 1,
  fs: 0,
  modestbranding: 1,
  rel: 0,
  playsinline: 1,
  enablejsapi: 1
};

function onYouTubePlayerReady() {
  const iframe = youtubePlayer.getIframe();
  if (iframe) iframe.style.pointerEvents = 'none';
  youtubePlayer.playVideo();
}
function isYouTubeUrl(url) {
  return /youtu(?:\.be|be\.com)/.test(url);
}
function getYouTubeId(url) {
  const match = url.match(/(?:v=|\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

// ---------- NEW: YouTube thumbnail helpers (no-API fallback) ----------
function getYouTubeThumbCandidates(id) {
  return [
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/default.jpg`,
  ];
}
function setYouTubeThumbWithFallback(imgEl, videoId) {
  const candidates = getYouTubeThumbCandidates(videoId);
  let i = 0;
  function tryNext() {
    if (i >= candidates.length) return;
    const url = candidates[i++];
    const testImg = new Image();
    testImg.onload = () => { imgEl.src = url; };
    testImg.onerror = tryNext;
    testImg.src = url;
  }
  tryNext();
}

// ---------------------------------------------------------

function extractFileNameFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    let name = pathname.substring(pathname.lastIndexOf('/') + 1);
    if (name.includes('?')) name = name.split('?')[0];
    return decodeURIComponent(name) || url;
  } catch {
    return url;
  }
}

async function fetchVideoTitle(url) {
  if (isYouTubeUrl(url)) {
    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.title) return data.title;
      }
    } catch {}
  }
  return extractFileNameFromUrl(url);
}

function onYouTubePlayerStateChange(event) {
  if (youtubeStateChangeHandler) youtubeStateChangeHandler(event);
}

/* ===== RUNTIME AUTO-SKIP (safety net) ===== */
function onYouTubePlayerError(e) {
  console.warn('YT error', e?.data);
  if (typeof window.__handleMediaEnd === 'function') {
    try { window.__handleMediaEnd(); } catch {}
  }
}

function createYouTubePlayer(id) {
  youtubePlayer = new YT.Player('youtube-player', {
    host: 'https://www.youtube-nocookie.com',
    videoId: id || undefined,
    playerVars: YT_PLAYER_VARS,
    events: {
      onReady: onYouTubePlayerReady,
      onStateChange: onYouTubePlayerStateChange,
      onError: onYouTubePlayerError,
    },
  });
  const container = document.getElementById('youtube-player');
  if (container) container.style.pointerEvents = 'none';
}

function onYouTubeIframeAPIReady() {
  youtubeApiReady = true;
  if (!youtubePlayer && pendingYouTubeId) {
    createYouTubePlayer(pendingYouTubeId);
    pendingYouTubeId = null;
  }
}

/* ----------------------- thumbnails + folder picker helpers ----------------------- */

async function makeThumbnailFromVideo(srcOrFile) {
  return new Promise(async (resolve) => {
    const url = typeof srcOrFile === 'string' ? srcOrFile : URL.createObjectURL(srcOrFile);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = url;

    const cleanup = () => {
      if (typeof srcOrFile !== 'string') { try { URL.revokeObjectURL(url); } catch {} }
    };

    video.addEventListener('loadedmetadata', () => {
      try {
        const t = Math.min(10, Math.max(0, (video.duration || 0) - 0.1));
        video.currentTime = t;
      } catch {}
    }, { once: true });

    video.addEventListener('seeked', () => {
      try {
        const w = video.videoWidth || 640, h = video.videoHeight || 360;
        const cw = 640, ch = 360;
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext('2d');
        const scale = Math.min(cw / w, ch / h);
        const dw = w * scale, dh = h * scale;
        const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
        ctx.drawImage(video, dx, dy, dw, dh);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch { resolve(''); }
      cleanup();
    }, { once: true });

    video.addEventListener('error', () => { cleanup(); resolve(''); }, { once: true });
  });
}

/* File System Access + IndexedDB persistence for the selected folder */
const FS_DB_NAME = 'custom-video-handles';
const FS_STORE = 'handles';
const VIDEO_RX = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;
function idbOpenFS() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(FS_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(FS_STORE);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function saveRepoHandle(handle) {
  try {
    const db = await idbOpenFS();
    await new Promise((res, rej) => {
      const tx = db.transaction(FS_STORE, 'readwrite');
      tx.objectStore(FS_STORE).put(handle, 'video-repo');
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
    localStorage.setItem('hasVideoRepo','1');
  } catch {}
}
async function loadRepoHandle() {
  try {
    const db = await idbOpenFS();
    return new Promise((res) => {
      const tx = db.transaction(FS_STORE, 'readonly');
      const g = tx.objectStore(FS_STORE).get('video-repo');
      g.onsuccess = async () => {
        const h = g.result || null;
        if (h && (await h.queryPermission?.({mode:'read'})) === 'granted') res(h);
        else res(null);
      };
      g.onerror = () => res(null);
    });
  } catch { return null; }
}
async function* iterVideos(dirHandle) {
  for await (const entry of dirHandle.values()) {
    if (entry.kind !== 'file') continue;
    if (!VIDEO_RX.test(entry.name)) continue;
    yield entry;
  }
}

/* helper: create index badge */
function createIndexBadge() {
  const b = document.createElement('span');
  b.className = 'video-index';
  b.style.position = 'absolute';
  b.style.top = '6px';
  b.style.left = '6px';
  b.style.minWidth = '22px';
  b.style.height = '22px';
  b.style.padding = '0 6px';
  b.style.borderRadius = '999px';
  b.style.background = 'rgba(0,0,0,.7)';
  b.style.color = '#fff';
  b.style.fontSize = '12px';
  b.style.fontWeight = '700';
  b.style.lineHeight = '22px';
  b.style.textAlign = 'center';
  b.style.pointerEvents = 'none';
  b.textContent = '';
  return b;
}

/* Build a video-card DOM node (thumb + caption) for local files, then init it */
async function buildVideoCardElement({ src, name, key }) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.dataset.src = src;
  if (key) card.dataset.key = key;           // stable key for local items

  const badge = createIndexBadge();

  const img = document.createElement('img');
  img.className = 'thumb';
  img.alt = name;
  img.src = '';

  const cap = document.createElement('div');
  cap.className = 'video-name video-filename';
  cap.textContent = name;
  cap.title = name;

  card.append(badge, img, cap);

  try {
    const thumb = await makeThumbnailFromVideo(src);
    if (thumb) img.src = thumb;
  } catch {}
  return card;
}

/* ----------------------- YouTube helpers (import + validation) ----------------------- */
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
  let pageToken = "";
  while (true) {
    const q = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    q.searchParams.set("part", "contentDetails");
    q.searchParams.set("maxResults", "50");
    q.searchParams.set("playlistId", playlistId);
    q.searchParams.set("key", apiKey);
    if (pageToken) q.searchParams.set("pageToken", pageToken);

    const resp = await fetch(q.toString());
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
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }
  return ids;
}

/* Validate embeddability for a set of IDs AND fetch title + best thumbnail (snippet) */
async function validateEmbeddableIds(apiKey, ids) {
  const embeddable = new Set();
  const blocked = new Map();       // id -> reason
  const thumbs = new Map();        // id -> bestThumbUrl
  const titles = new Map();        // id -> title

  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const u = new URL("https://www.googleapis.com/youtube/v3/videos");
    u.searchParams.set("part", "status,snippet");
    u.searchParams.set("id", chunk.join(","));
    u.searchParams.set("key", apiKey);

    const r = await fetch(u.toString());
    const t = await r.text();
    if (!r.ok) {
      let msg = `HTTP ${r.status}`;
      try { const j = JSON.parse(t); if (j.error?.message) msg += ` – ${j.error.message}`; } catch {}
      throw new Error(msg);
    }
    const j = JSON.parse(t);
    (j.items || []).forEach(item => {
      const s = item.status || {};
      const emb = s.embeddable === true;
      const pubOrUnlisted = (s.privacyStatus === 'public' || s.privacyStatus === 'unlisted');
      if (emb && pubOrUnlisted) {
        embeddable.add(item.id);
        const sn = item.snippet || {};
        titles.set(item.id, sn.title || '');
        const th = sn.thumbnails || {};
        const best = th.maxres?.url || th.standard?.url || th.high?.url || th.medium?.url || th.default?.url || '';
        if (best) thumbs.set(item.id, best);
      } else {
        let reason = !pubOrUnlisted ? 'private' : 'embedding disabled';
        blocked.set(item.id, reason);
      }
    });
  }
  return { ok: Array.from(embeddable), blocked, thumbs, titles };
}

/* Validate a single YouTube URL before adding */
async function validateSingleYouTubeUrl(url, apiKey) {
  const id = getYouTubeId(url);
  if (!id || !apiKey) return { ok: true, reason: '' }; // fail-open if no key
  const u = new URL("https://www.googleapis.com/youtube/v3/videos");
  u.searchParams.set("part", "status");
  u.searchParams.set("id", id);
  u.searchParams.set("key", apiKey);
  const r = await fetch(u.toString());
  const t = await r.text();
  if (!r.ok) return { ok: true, reason: '' }; // fail-open on quota/etc.
  try {
    const j = JSON.parse(t);
    const it = (j.items || [])[0];
    if (!it) return { ok: true, reason: '' };
    const s = it.status || {};
    const emb = s.embeddable === true;
    const pubOrUnlisted = (s.privacyStatus === 'public' || s.privacyStatus === 'unlisted');
    if (emb && pubOrUnlisted) return { ok: true, reason: '' };
    return { ok: false, reason: !pubOrUnlisted ? 'private' : 'embedding disabled' };
  } catch { return { ok: true, reason: '' }; }
}

/* ----------------------- MAIN APP ----------------------- */

// Guard to let typing in inputs/textareas/contentEditable bypass global hotkeys
function isTypingTarget(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return !el.readOnly && !el.disabled;
  return false;
}

document.addEventListener('DOMContentLoaded', async () => {
  // ---- DOM refs (unique) ----
  const mediaType = document.body.getAttribute('data-media-type');
  const startButton = document.getElementById('control-panel-start-button');
  const blackBackground = document.getElementById('black-background');
  const playModeSelect = document.getElementById('control-panel-play-mode');
  const intervalTimeInput = document.getElementById('interval-time');
  const intervalLabel = document.getElementById('interval-label');
  const selectVideosButton = document.getElementById('select-videos-button');
  const videoSelectionModal = document.getElementById('video-selection-modal');
  const closeModal = document.getElementById('close-modal');
  const okButton = document.getElementById('ok-button');
  const videoSelectionDiv = document.getElementById('video-selection');

  // Default to interval mode with a 30-second interval
  playModeSelect.value = 'interval';
  intervalLabel.style.display = 'inline-block';
  intervalTimeInput.style.display = 'inline-block';
  intervalTimeInput.value = 30;
  const localVideoList = document.getElementById('local-video-list');
  const urlVideoList = document.getElementById('url-video-list');
  const addVideoFileButton = document.getElementById('add-video-file-button');
  const addVideoInput = document.getElementById('add-video-input');
  const addVideoUrlInput = document.getElementById('add-video-url-input');
  const addVideoUrlButton = document.getElementById('add-video-url-button');

  // Playlist UI
  const ytPlaylistInput = document.getElementById('yt-playlist-url-input');
  const ytPlaylistBtn = document.getElementById('yt-playlist-import-button');
  const ytPlaylistStatus = document.getElementById('yt-playlist-status');
  const clearAllButton = document.getElementById('clear-all-button');
  const categoriesToggle = document.getElementById('categories-toggle');
  const categorySelect = document.getElementById('category-select') || document.getElementById('categorySelect');
  const addCategoryButton = document.getElementById('add-category-button') || document.getElementById('addCategoryButton');
  const addCategoryModal = document.getElementById('add-category-modal') || document.getElementById('addCategoryModal');
  const closeAddCategoryModal = document.getElementById('close-add-category-modal') || document.getElementById('closeAddCategoryModal');
  const addCategoryNameInput = document.getElementById('add-category-name-input') || document.getElementById('addCategoryNameInput');
  const addCategorySaveButton = document.getElementById('add-category-save') || document.getElementById('addCategorySave');
  const addCategoryCancelButton = document.getElementById('add-category-cancel') || document.getElementById('addCategoryCancel');
  // Folder picker
  const pickFolderButton = document.getElementById('pick-video-folder-button');
  if (pickFolderButton && !('showDirectoryPicker' in window)) {
    pickFolderButton.style.display = 'none';
  }

  // Players / visuals
  const introJingle = document.getElementById('intro-jingle');
  const visualOptionsSelect = document.getElementById('special-options-select');
  const videoContainer = document.getElementById('video-container');
  const youtubeDiv = document.getElementById('youtube-player');

  const spacePrompt = document.getElementById('space-prompt');
  const textPrompt = document.getElementById('text-prompt');
  const selectSpacePromptButton = document.getElementById('select-space-prompt-button');
  const spacePromptSelectionModal = document.getElementById('space-prompt-selection-modal');
  const closeSpacePromptModal = document.getElementById('close-space-prompt-modal');
  const applySpacePromptButton = document.getElementById('apply-space-prompt');
  const textPromptInput = document.getElementById('text-prompt-input');
  const imageCardsContainer1 = document.getElementById('space-prompt-selection');

  const spacePrompt2 = document.getElementById('space-prompt-2');
  const textPrompt2 = document.getElementById('text-prompt-2');
  const selectSpacePromptButton2 = document.getElementById('select-space-prompt-button-2');
  const spacePromptSelectionModal2 = document.getElementById('space-prompt-selection-modal-2');
  const closeSpacePromptModal2 = document.getElementById('close-space-prompt-modal-2');
  const applySpacePromptButton2 = document.getElementById('apply-space-prompt-2');
  const textPromptInput2 = document.getElementById('text-prompt-input-2');
  const imageCardsContainer2 = document.getElementById('space-prompt-selection-2');

  const soundOptionsSelect = document.getElementById('sound-options-select');
  const soundOptionsSelect2 = document.getElementById('sound-options-select-2');

  const recordModal = document.getElementById('record-modal');
  const recordButton = document.getElementById('record-button');
  const stopRecordingButton = document.getElementById('stop-recording-button');
  const okRecordingButton = document.getElementById('ok-recording-button');
  const closeRecordModal = document.getElementById('close-record-modal');
  const recordStatus = document.getElementById('record-status');

  const miscOptionsContainer = document.getElementById('misc-options-container');
  const miscOptionsModal = document.getElementById('misc-options-modal');
  const closeMiscOptionsModal = document.getElementById('close-misc-options-modal');
  const miscOptionsOkButton = document.getElementById('misc-options-ok-button');
  const miscOptionsButton = document.getElementById('misc-options-button');
  const player2PromptContainer = document.getElementById('player2-prompt-container');

  // ---- runtime state (unique) ----
  let preventInput = false;
  let mediaPlayer = null;
  if (mediaType === 'video') {
    mediaPlayer = document.getElementById('video-player');
    if (mediaPlayer) mediaPlayer.crossOrigin = 'anonymous';
  }

  let selectedSpacePromptSrc = '';
  let useTextPrompt = false;
  let selectedSpacePromptSrc2 = '';
  let useTextPrompt2 = false;

  if (youtubeDiv) {
    youtubeStateChangeHandler = (event) => {
      if (event.data === YT.PlayerState.ENDED) {
        handleMediaEnd();
      }
    };
    if (window.YT && typeof YT.Player !== 'undefined') {
      youtubeApiReady = true;
    }
  }

  let selectedSound = 'none';
  let selectedSound2 = 'none';
  let currentSound = null;
  let recordedAudio = null;
  let mediaRecorder;
  let audioChunks = [];

  const miscOptionsState = {};
  let selectedMedia = [];
  let controlsEnabled = false;
  let playedMedia = [];
  let currentMediaIndex = 0;
  let mode = 'interval';
  let intervalID = null;
  let intervalTime = 30;
  let pausedAtTime = 0;
  let currentPlayer = 1;
  let player1Name = '';
  let player2Name = '';
  let lastSelectionSignature = '';
  let shuffleEnabled = false; // optional toggle if you add it to miscOptions
  const YT_STORAGE_KEY = 'customYoutubeUrls';
  const YT_CATEGORY_STORAGE_KEY = 'customYoutubeCategories';

  const DEFAULT_CATEGORY_NAME = 'All videos';
  const CATEGORY_ENABLED_CLASS = 'categories-enabled';

  // ---------- Local order persistence (PER-SET) ----------
  const LOCAL_ORDERS_KEY = 'customLocalVideoOrders'; // map: signature -> [ordered keys]

  function getLocalOrderMap() {
    try { return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '{}'); }
    catch { return {}; }
  }
  function setLocalOrderMap(map) {
    try { localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(map)); } catch {}
  }

  // --- NEW: persist locally-hidden videos (by stable key) ---
  const LOCAL_HIDDEN_KEY = 'customLocalHidden'; // JSON array of keys

  function getHiddenSet() {
    try { return new Set(JSON.parse(localStorage.getItem(LOCAL_HIDDEN_KEY) || '[]')); }
    catch { return new Set(); }
  }
  function setHiddenSet(set) {
    try { localStorage.setItem(LOCAL_HIDDEN_KEY, JSON.stringify([...set])); } catch {}
  }
  function addHiddenKey(k) {
    if (!k) return;
    const s = getHiddenSet();
    s.add(k);
    setHiddenSet(s);
  }
  function clearHidden() {
    try { localStorage.removeItem(LOCAL_HIDDEN_KEY); } catch {}
  }

  function getCategoryState() {
    try {
      const state = JSON.parse(localStorage.getItem(YT_CATEGORY_STORAGE_KEY) || 'null');
      if (!state || !Array.isArray(state.categories)) return state;
      const hasAllVideos = state.categories.find(cat => cat.name === DEFAULT_CATEGORY_NAME);
      const legacy = state.categories.find(cat => cat.name === 'Général');
      if (!hasAllVideos && legacy) {
        legacy.name = DEFAULT_CATEGORY_NAME;
      }
      if (!hasAllVideos && !legacy && state.categories.length) {
        state.categories.unshift({ id: 'all-videos', name: DEFAULT_CATEGORY_NAME, urls: [] });
        state.activeId = state.activeId || 'all-videos';
      }
      return state;
    } catch {
      return null;
    }
  }
  function setCategoryState(state) {
    try { localStorage.setItem(YT_CATEGORY_STORAGE_KEY, JSON.stringify(state)); } catch {}
  }
  function isCategoriesEnabled(state = getCategoryState()) {
    return !!(state && state.enabled);
  }
  function ensureCategoryStateFromUrls(urls) {
    const id = 'all-videos';
    return {
      enabled: true,
      activeId: id,
      categories: [{ id, name: DEFAULT_CATEGORY_NAME, urls: urls || [] }]
    };
  }
  function uniquePreserveOrder(list) {
    const seen = new Set();
    const result = [];
    (list || []).forEach((item) => {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    });
    return result;
  }

  // stable key for local files (works across reloads for folder picker / file input)
  function makeLocalKey(name, size, lastModified) {
    return `${name}::${size ?? '0'}::${lastModified ?? '0'}`;
  }

  // Current local keys present in DOM (order-agnostic)
  function currentLocalKeys() {
    if (!localVideoList) return [];
    return Array.from(localVideoList.querySelectorAll('.video-card'))
      .map(c => c.dataset.key || c.dataset.src);
  }

  // Signature of the set = sorted unique keys joined; ensures we only apply order to the same set
  function currentSetSignature() {
    const keys = currentLocalKeys();
    if (!keys.length) return '';
    const uniq = Array.from(new Set(keys)).sort();
    return uniq.join('||');
  }

  function getLocalOrderFromDOM() {
    if (!localVideoList) return [];
    return Array.from(localVideoList.querySelectorAll('.video-card'))
      .map(c => c.dataset.key || c.dataset.src);
  }

  // --- NEW: forget saved folder handle helper (used by Clear All) ---
  async function deleteRepoHandle() {
    try {
      const db = await idbOpenFS();
      await new Promise((res, rej) => {
        const tx = db.transaction(FS_STORE, 'readwrite');
        tx.objectStore(FS_STORE).delete('video-repo');
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
    } catch {}
    try { localStorage.removeItem('hasVideoRepo'); } catch {}
  }

  function saveLocalOrderForCurrentSet() {
    if (!localVideoList) return;
    const sig = currentSetSignature();
    if (!sig) return;
    const map = getLocalOrderMap();
    map[sig] = getLocalOrderFromDOM();
    setLocalOrderMap(map);
  }

  // --- UPDATED: clear all is now async and clears folder handle + hidden set ---
  async function handleClearAll() {
    if (!confirm('Tout effacer ? Cela supprime toutes les cartes et les URLs sauvegardées.')) return;

    // Remove cards from both lists (if present)
    if (urlVideoList) urlVideoList.innerHTML = '';
    if (localVideoList) localVideoList.innerHTML = '';

    // Clear persisted data
    try { localStorage.removeItem(YT_STORAGE_KEY); } catch {}
    try { localStorage.removeItem(YT_CATEGORY_STORAGE_KEY); } catch {}
    try { localStorage.removeItem(LOCAL_ORDERS_KEY); } catch {}
    clearHidden();              // NEW: forget hidden exclusions
    await deleteRepoHandle();   // NEW: forget saved folder handle

    // Reset selection / numbering / UI
    selectedMedia = [];
    playedMedia = [];
    currentMediaIndex = 0;
    lastSelectionSignature = '';

    updateSelectedMedia();
    renumberCards();

    if (startButton) startButton.style.display = 'none';
    if (ytPlaylistStatus) ytPlaylistStatus.textContent = '';
    if (categoriesToggle) categoriesToggle.checked = false;
    setCategoryControlsVisible(false);

    document.dispatchEvent(new CustomEvent('video-list-cleared'));
  }

  if (clearAllButton) clearAllButton.addEventListener('click', () => handleClearAll());

  if (categoriesToggle) {
    let lastToggleValue = categoriesToggle.checked;
    const onCategoriesToggle = async () => {
      const nextValue = !!categoriesToggle.checked;
      if (nextValue === lastToggleValue) return;
      lastToggleValue = nextValue;
      if (nextValue) {
        await enableCategoriesFromCurrentList();
      } else {
        await disableCategoriesToFlatList();
      }
      updateSelectedMedia();
    };
    categoriesToggle.addEventListener('change', onCategoriesToggle);
    // Some browsers/webviews can miss `change` for checkbox controls in modals.
    categoriesToggle.addEventListener('input', onCategoriesToggle);
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', async () => {
      await loadCategoryById(categorySelect.value);
      updateSelectedMedia();
    });
  }

  if (addCategoryButton) {
    addCategoryButton.addEventListener('click', () => addNewCategory());
  }
  if (closeAddCategoryModal) {
    closeAddCategoryModal.addEventListener('click', () => closeAddCategoryModalDialog());
  }
  if (addCategoryCancelButton) {
    addCategoryCancelButton.addEventListener('click', () => closeAddCategoryModalDialog());
  }
  if (addCategorySaveButton) {
    addCategorySaveButton.addEventListener('click', () => saveCategoryFromModal());
  }
  if (addCategoryNameInput) {
    addCategoryNameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveCategoryFromModal();
      }
    });
  }
  if (addCategoryModal) {
    addCategoryModal.addEventListener('click', (event) => {
      if (event.target === addCategoryModal) closeAddCategoryModalDialog();
    });
  }

  function loadLocalOrderForCurrentSet() {
    if (!localVideoList) return;
    const sig = currentSetSignature();
    if (!sig) return;
    const map = getLocalOrderMap();
    const saved = map[sig];
    if (!Array.isArray(saved) || !saved.length) return;

    // Map current cards by key (fallback to src)
    const currentCards = new Map(
      Array.from(localVideoList.querySelectorAll('.video-card'))
        .map(card => [(card.dataset.key || card.dataset.src), card])
    );

    const frag = document.createDocumentFragment();
    saved.forEach(k => {
      const card = currentCards.get(k);
      if (card) {
        frag.appendChild(card);
        currentCards.delete(k);
      }
    });
    // Append any leftovers (new items not in saved list) in their current order
    currentCards.forEach(card => frag.appendChild(card));

    localVideoList.innerHTML = '';
    localVideoList.appendChild(frag);
    renumberCards();
  }

  const isCustomPage = !!(addVideoInput || addVideoUrlInput);
  let manualOrder = false;

  function isCurrentlyPlaying() {
    const ytPlaying = (typeof YT !== 'undefined' && youtubePlayer && youtubePlayer.getPlayerState && youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING);
    const html5Playing = (mediaPlayer && !mediaPlayer.paused && !mediaPlayer.ended);
    return ytPlaying || html5Playing;
  }
  function resetPlaybackOrder() {
    playedMedia = [];
    currentMediaIndex = 0;
  }
  function selectionSignature(arr) {
    return (arr || []).join('|');
  }

  // Player name overlay
  const playerNameOverlay = document.createElement('div');
  playerNameOverlay.id = 'player-name-overlay';
  playerNameOverlay.style.position = 'absolute';
  playerNameOverlay.style.top = '12%';
  playerNameOverlay.style.left = '50%';
  playerNameOverlay.style.transform = 'translateX(-50%)';
  playerNameOverlay.style.fontSize = '40px';
  playerNameOverlay.style.color = 'white';
  playerNameOverlay.style.textAlign = 'center';
  playerNameOverlay.style.display = 'none';
  playerNameOverlay.style.zIndex = '3002';
  document.body.appendChild(playerNameOverlay);

  const playerNamesModal = document.getElementById('player-names-modal');
  const closePlayerNamesModal = document.getElementById('close-player-names-modal');
  const playerNamesOkButton = document.getElementById('player-names-ok-button');
  const playerNamesCancelButton = document.getElementById('player-names-cancel-button');
  const player1NameInput = document.getElementById('player1-name-input');
  const player2NameInput = document.getElementById('player2-name-input');

  let timedCycleTimeout = null;
  let promptCurrentlyVisible = true;

  function isTwoPlayerMode() {
    return !!miscOptionsState['two-player-mode-option'];
  }

  // numbering helper
  function renumberCards() {
    const containers = [localVideoList, urlVideoList].filter(Boolean);
    containers.forEach(container => {
      let order = 1;
      const cards = Array.from(container.querySelectorAll('.video-card'));
      cards.forEach(card => {
        let b = card.querySelector('.video-index');
        if (!b) {
          b = createIndexBadge();
          card.insertBefore(b, card.firstChild);
        }

        if (card.classList.contains('selected')) {
          b.textContent = String(order++);
          b.style.visibility = '';
        } else {
          b.textContent = '';
          b.style.visibility = 'hidden';
        }
      });
    });
  }

  // Reorder helpers — UP / DOWN buttons
  function moveCardUp(card) {
    const parent = card.parentElement;
    if (!parent) return;
    const prev = card.previousElementSibling;
    if (prev && prev.classList.contains('video-card')) {
      parent.insertBefore(card, prev);
      manualOrder = true;
      renumberCards();
      updateSelectedMedia();
      if (parent === urlVideoList) saveYoutubeUrls();
      if (parent === localVideoList) saveLocalOrderForCurrentSet();
    }
  }
  function moveCardDown(card) {
    const parent = card.parentElement;
    if (!parent) return;
    const next = card.nextElementSibling;
    if (next && next.classList.contains('video-card')) {
      parent.insertBefore(next, card); // swap positions
      manualOrder = true;
      renumberCards();
      updateSelectedMedia();
      if (parent === urlVideoList) saveYoutubeUrls();
      if (parent === localVideoList) saveLocalOrderForCurrentSet();
    }
  }
  function ensureOrderButtons(card) {
    if (card.querySelector('.order-controls')) return;

    const wrap = document.createElement('div');
    wrap.className = 'order-controls';
    Object.assign(wrap.style, {
      position: 'absolute',
      right: '6px',
      top: '50px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      background: 'rgba(255,255,255,.9)',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '2px',
      zIndex: '2'
    });

    function mkBtn(label, title) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.title = title;
      Object.assign(btn.style, {
        cursor: 'pointer',
        fontSize: '14px',
        lineHeight: '16px',
        padding: '2px 6px',
        border: '0',
        background: 'transparent',
        borderRadius: '6px'
      });
      btn.addEventListener('click', (e) => e.stopPropagation());
      return btn;
    }

    const up = mkBtn('▲', 'Move up');
    const down = mkBtn('▼', 'Move down');

    up.addEventListener('click', () => moveCardUp(card));
    down.addEventListener('click', () => moveCardDown(card));

    wrap.append(up, down);
    card.appendChild(wrap);
  }

  function initCard(card) {
    card.classList.add('selected');
    card.classList.remove('deselected');

    if (!card.querySelector('.video-index')) {
      card.insertBefore(createIndexBadge(), card.firstChild);
    }

    ensureOrderButtons(card);
    applyCategoryButtons(card);

    if (isCustomPage && !card.querySelector('.remove-btn')) {
      const rm = document.createElement('span');
      rm.textContent = '×';
      rm.className = 'remove-btn';
      rm.style.position = 'absolute';
      rm.style.bottom = '6px';
      rm.style.right = '6px';
      rm.style.cursor = 'pointer';
      rm.style.background = 'rgba(255,255,255,.9)';
      rm.style.border = '1px solid #ddd';
      rm.style.borderRadius = '8px';
      rm.style.padding = '2px 8px';
      rm.title = 'Remove';
      rm.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = card.parentElement;

        // NEW: if this is a local item, remember it as hidden so it won't repopulate after refresh
        if (parent === localVideoList) {
          const k = card.dataset.key || null;
          if (k) addHiddenKey(k);
        }

        card.remove();
        updateSelectedMedia();
        renumberCards();
        if (parent === urlVideoList) saveYoutubeUrls();
        if (parent === localVideoList) saveLocalOrderForCurrentSet();
      });
      card.appendChild(rm);
    }
  }

  // ===== SAVE/RESTORE URL LISTS (YouTube / external URLs) =====
  function getActiveCategory(state) {
    if (!state || !Array.isArray(state.categories)) return null;
    return state.categories.find(cat => cat.id === state.activeId) || state.categories[0] || null;
  }

  function syncCategoriesFromDom() {
    if (!urlVideoList) return;
    const state = getCategoryState();
    if (!isCategoriesEnabled(state)) return;
    const active = getActiveCategory(state);
    if (!active) return;
    active.urls = Array.from(urlVideoList.querySelectorAll('.video-card'))
      .map(card => card.dataset.src);
    setCategoryState(state);
  }

  function applyCategoryButtons(card) {
    if (!card) return;
    const existing = card.querySelector('.category-chip-group');
    if (existing) existing.remove();
    const state = getCategoryState();
    if (!isCategoriesEnabled(state)) return;
    if (!state || !Array.isArray(state.categories)) return;
    const group = document.createElement('div');
    group.className = 'category-chip-group';
    const activeId = state.activeId;
    const src = card.dataset.src;
    const allVideos = getAllVideosCategory(state);
    const categories = state.categories.filter(cat => cat !== allVideos);
    const ordered = [...categories];
    if (allVideos) {
      ordered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }
    ordered.forEach((cat, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `category-chip color-${(idx % 6) + 1}`;
      chip.textContent = cat.name;
      const isMember = !!(src && Array.isArray(cat.urls) && cat.urls.includes(src));
      chip.classList.toggle('active', isMember);
      if (cat.id === activeId) {
        chip.setAttribute('aria-current', 'true');
      }
      chip.addEventListener('click', (event) => {
        event.stopPropagation();
        const nextState = getCategoryState();
        if (!nextState) return;
        const target = nextState.categories.find(c => c.id === cat.id);
        if (!target) return;
        const src = card.dataset.src;
        if (!src) return;
        if (!Array.isArray(target.urls)) target.urls = [];
        const index = target.urls.indexOf(src);
        if (index >= 0) {
          target.urls.splice(index, 1);
        } else {
          target.urls.push(src);
        }
        setCategoryState(nextState);
        applyCategoryButtons(card);
      });
      group.appendChild(chip);
    });
    card.appendChild(group);
  }

  function updateCategoryButtonsForList() {
    if (!urlVideoList) return;
    Array.from(urlVideoList.querySelectorAll('.video-card')).forEach(card => {
      applyCategoryButtons(card);
    });
  }

  function getAllVideosCategory(state) {
    if (!state || !Array.isArray(state.categories)) return null;
    return state.categories.find(cat => cat.name === DEFAULT_CATEGORY_NAME)
      || state.categories.find(cat => cat.id === 'all-videos')
      || null;
  }

  function assignUrlToCategories(url) {
    const state = getCategoryState();
    if (!isCategoriesEnabled(state)) return;
    const nextState = state || { enabled: true, activeId: 'all-videos', categories: [] };
    let allVideos = getAllVideosCategory(nextState);
    if (!allVideos) {
      allVideos = { id: 'all-videos', name: DEFAULT_CATEGORY_NAME, urls: [] };
      nextState.categories.unshift(allVideos);
    }
    if (!Array.isArray(allVideos.urls)) allVideos.urls = [];
    if (!allVideos.urls.includes(url)) {
      allVideos.urls.push(url);
    }
    setCategoryState(nextState);
  }

  function saveYoutubeUrls() {
    if (!urlVideoList) return;
    if (isCategoriesEnabled()) {
      syncCategoriesFromDom();
      return;
    }
    const urls = Array.from(urlVideoList.querySelectorAll('.video-card')).map(c => c.dataset.src);
    localStorage.setItem(YT_STORAGE_KEY, JSON.stringify(urls));
  }

  function setCategoryControlsVisible(visible) {
    const display = visible ? 'inline-flex' : 'none';
    if (categorySelect) {
      categorySelect.style.display = visible ? 'inline-block' : 'none';
    }
    if (addCategoryButton) {
      addCategoryButton.style.display = display;
    }
    if (videoSelectionModal) {
      videoSelectionModal.classList.toggle(CATEGORY_ENABLED_CLASS, visible);
    }
    updateCategoryButtonsForList();
  }

  function renderCategorySelect(state) {
    if (!categorySelect) return;
    categorySelect.innerHTML = '';
    if (!state || !Array.isArray(state.categories) || !state.categories.length) return;
    state.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      if (cat.id === state.activeId) opt.selected = true;
      categorySelect.appendChild(opt);
    });
  }

  // ---------- UPDATED: loadStoredYoutubeUrls uses addYoutubeUrlCard (thumbnails + title) ----------
  async function loadUrlsIntoList(urls) {
    if (!urlVideoList) return [];
    const apiKey = window.YT_API_KEY;

    // Batch-collect ids in order and validate once
    const ytEntries = urls.map(u => ({ url: u, id: isYouTubeUrl(u) ? getYouTubeId(u) : null }));

    let okSet = null;
    const idList = ytEntries.map(e => e.id).filter(Boolean);
    if (apiKey && idList.length) {
      try {
        const { ok } = await validateEmbeddableIds(apiKey, idList);
        okSet = new Set(ok);
      } catch {
        okSet = null; // fail-open
      }
    }

    const keptUrls = [];
    for (const { url, id } of ytEntries) {
      const isYT = !!id;
      if (!isYT) {
        // Non-YouTube URL: simple card + title async
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.src = url;
        card.appendChild(createIndexBadge());
        const cap = document.createElement('div');
        cap.className = 'video-name video-filename';
        cap.textContent = extractFileNameFromUrl(url);
        cap.title = cap.textContent;
        urlVideoList.appendChild(card);
        initCard(card);
        fetchVideoTitle(url).then(title => { cap.textContent = title; cap.title = title; });
        keptUrls.push(url);
        continue;
      }

      const playable = !apiKey || !id || okSet === null || okSet.has(id);
      if (playable) {
        await addYoutubeUrlCard(url, { skipCategoryAssign: true }); // will fetch title (noembed) + thumbnail (ytimg fallback)
        keptUrls.push(url);
      }
    }

    renumberCards();
    return keptUrls;
  }

  async function loadStoredYoutubeUrls() {
    if (!urlVideoList) return;
    const state = getCategoryState();
    if (isCategoriesEnabled(state)) {
      const active = getActiveCategory(state);
      const urls = active && Array.isArray(active.urls) ? active.urls : [];
      const keptUrls = await loadUrlsIntoList(urls);
      if (active) {
        active.urls = keptUrls;
        setCategoryState(state);
      }
      return;
    }

    const saved = localStorage.getItem(YT_STORAGE_KEY);
    if (!saved) return;

    try {
      const urls = JSON.parse(saved);
      const keptUrls = await loadUrlsIntoList(urls);
      localStorage.setItem(YT_STORAGE_KEY, JSON.stringify(keptUrls));
    } catch (e) {
      console.error('Failed to parse saved YouTube URLs', e);
    }
  }

  // ---------- UPDATED: generalized addYoutubeUrlCard with optional {thumbUrl, title} ----------
  async function addYoutubeUrlCard(url, opts = {}) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.src = url;

    const badge = createIndexBadge();
    const img = document.createElement('img');
    img.className = 'thumb';
    img.alt = 'thumbnail';
    img.style.width = '100%';
    img.style.display = 'block';

    const cap = document.createElement('div');
    cap.className = 'video-name video-filename';
    const initialTitle = opts.title || extractFileNameFromUrl(url);
    cap.textContent = initialTitle;
    cap.title = initialTitle;

    card.append(badge, img, cap);
    (urlVideoList || videoSelectionDiv).appendChild(card);
    initCard(card);
    if (!opts.skipCategoryAssign) {
      assignUrlToCategories(url);
      applyCategoryButtons(card);
    }

    // Title via noembed (non-blocking) if not provided
    if (!opts.title) {
      fetchVideoTitle(url).then(title => {
        cap.textContent = title;
        cap.title = title;
      }).catch(()=>{});
    }

    // Thumbnail
    const id = getYouTubeId(url);
    if (id) {
      if (opts.thumbUrl) {
        img.src = opts.thumbUrl; // already validated by API
      } else {
        setYouTubeThumbWithFallback(img, id); // fallback without API
      }
    } else {
      // Non-YouTube URL: no thumbnail here
      img.remove();
    }
  }

  function getCurrentUrlListFromDom() {
    if (!urlVideoList) return [];
    return Array.from(urlVideoList.querySelectorAll('.video-card')).map(card => card.dataset.src);
  }

  async function loadCategoryById(categoryId) {
    if (!urlVideoList) return;
    const state = getCategoryState();
    if (!state || !Array.isArray(state.categories)) return;
    syncCategoriesFromDom();
    const target = state.categories.find(cat => cat.id === categoryId) || state.categories[0];
    if (!target) return;
    state.activeId = target.id;
    setCategoryState(state);
    renderCategorySelect(state);
    urlVideoList.innerHTML = '';
    await loadUrlsIntoList(target.urls || []);
    updateCategoryButtonsForList();
    saveYoutubeUrls();
  }

  async function enableCategoriesFromCurrentList() {
    const existingState = getCategoryState();
    if (isCategoriesEnabled(existingState)) {
      setCategoryControlsVisible(true);
      if (categoriesToggle) categoriesToggle.checked = true;
      if (existingState) {
        renderCategorySelect(existingState);
        await loadCategoryById(existingState.activeId);
      }
      updateCategoryButtonsForList();
      return;
    }
    const urlsFromDom = getCurrentUrlListFromDom();
    const urlsFromStorage = (() => {
      try { return JSON.parse(localStorage.getItem(YT_STORAGE_KEY) || '[]'); } catch { return []; }
    })();
    const urls = urlsFromDom.length ? urlsFromDom : urlsFromStorage;
    if (existingState && Array.isArray(existingState.categories) && existingState.categories.length) {
      const nextState = { ...existingState, enabled: true };
      let allVideos = getAllVideosCategory(nextState);
      if (!allVideos) {
        allVideos = { id: 'all-videos', name: DEFAULT_CATEGORY_NAME, urls: [] };
        nextState.categories.unshift(allVideos);
      }
      allVideos.urls = Array.isArray(urls) ? urls : [];
      nextState.activeId = nextState.activeId || allVideos.id;
      setCategoryState(nextState);
      setCategoryControlsVisible(true);
      if (categoriesToggle) categoriesToggle.checked = true;
      renderCategorySelect(nextState);
      await loadCategoryById(nextState.activeId);
      updateCategoryButtonsForList();
      return;
    }
    const state = ensureCategoryStateFromUrls(urls);
    setCategoryState(state);
    setCategoryControlsVisible(true);
    if (categoriesToggle) categoriesToggle.checked = true;
    renderCategorySelect(state);
    await loadCategoryById(state.activeId);
    updateCategoryButtonsForList();
  }

  async function disableCategoriesToFlatList() {
    const state = getCategoryState();
    if (!state) return;
    syncCategoriesFromDom();
    const allCategory = getAllVideosCategory(state);
    const flatUrls = uniquePreserveOrder(
      Array.isArray(allCategory?.urls) ? allCategory.urls : []
    );
    localStorage.setItem(YT_STORAGE_KEY, JSON.stringify(flatUrls));
    setCategoryState({ ...state, enabled: false });
    setCategoryControlsVisible(false);
    if (categoriesToggle) categoriesToggle.checked = false;
    if (urlVideoList) {
      urlVideoList.innerHTML = '';
      await loadUrlsIntoList(flatUrls);
      updateCategoryButtonsForList();
      saveYoutubeUrls();
    }
  }

  function openAddCategoryModal() {
    if (!addCategoryModal || !addCategoryNameInput) return;
    addCategoryModal.style.display = 'block';
    addCategoryNameInput.value = '';
    addCategoryNameInput.focus();
  }

  function closeAddCategoryModalDialog() {
    if (!addCategoryModal) return;
    addCategoryModal.style.display = 'none';
  }

  function saveCategoryFromModal() {
    if (!addCategoryNameInput) return;
    const name = addCategoryNameInput.value.trim();
    if (!name) return;
    const state = getCategoryState();
    if (!state) return;
    const id = `cat-${Date.now()}`;
    state.categories.push({ id, name, urls: [] });
    setCategoryState(state);
    renderCategorySelect(state);
    updateCategoryButtonsForList();
    closeAddCategoryModalDialog();
  }

  function addNewCategory() {
    openAddCategoryModal();
  }

  function initCategoryControls() {
    const state = getCategoryState();
    const enabled = isCategoriesEnabled(state);
    if (categoriesToggle) categoriesToggle.checked = enabled;
    setCategoryControlsVisible(enabled);
    if (enabled && state) {
      renderCategorySelect(state);
    }
    updateCategoryButtonsForList();
  }

  // Load saved URLs (with validation)
  initCategoryControls();
  await loadStoredYoutubeUrls();

  // Initialize any pre-existing cards (if present in DOM at load)
  let videoCardsArray = Array.from(document.querySelectorAll('.video-card'));
  videoCardsArray.forEach(initCard);
  renumberCards();

  // Apply saved local order on startup (after cards exist)
  loadLocalOrderForCurrentSet();

  // initial selection
  selectedMedia = Array.from(document.querySelectorAll('.video-card')).map(card => card.dataset.src);
  if (videoCardsArray.length === 0 && (addVideoInput || addVideoUrlInput)) {
    videoSelectionModal.style.display = 'block';
  }

  // preload
  function preloadMedia(list, onComplete) {
    let loaded = 0;
    const total = list.length;
    const loadingContainer = document.getElementById('control-panel-loading-bar-container');
    const loadingBar = loadingContainer ? loadingContainer.querySelector('#control-panel-loading-bar') : null;

    if (total === 0) {
      onComplete();
      return;
    }
    list.forEach(src => {
      const bump = () => {
        loaded++;
        if (loadingBar) {
          const percent = (loaded / total) * 100;
          if (loadingBar) loadingBar.style.width = `${percent}%`;
        }
        if (loaded === total) onComplete();
      };

      if (isYouTubeUrl(src)) {
        bump();
        return;
      }
      const mediaEl = document.createElement('video');
      mediaEl.crossOrigin = 'anonymous';
      mediaEl.src = src;
      mediaEl.preload = 'auto';
      mediaEl.style.display = 'none';
      document.body.appendChild(mediaEl);
      mediaEl.addEventListener('canplaythrough', () => {
        bump();
        mediaEl.remove();
      }, { once: true });
      mediaEl.addEventListener('error', () => {
        bump();
        mediaEl.remove();
      }, { once: true });
    });
  }

  function playIntroJingle() {
    introJingle.play().catch(() => {});
  }

  // UI events
  selectVideosButton.addEventListener('click', () => {
    videoSelectionModal.style.display = 'block';
  });
  closeModal.addEventListener('click', () => {
    videoSelectionModal.style.display = 'none';
  });
  okButton.addEventListener('click', () => {
    updateSelectedMedia();
    videoSelectionModal.style.display = 'none';
  });

  // Local file uploads with thumbnails
  if (addVideoFileButton && addVideoInput && localVideoList) {
    addVideoFileButton.addEventListener('click', () => addVideoInput.click());
    addVideoInput.addEventListener('change', async () => {
      const files = Array.from(addVideoInput.files);
      for (const file of files) {
        const src = URL.createObjectURL(file); // transient across reloads; key keeps order stable within session
        const key = makeLocalKey(file.name, file.size, file.lastModified);
        const card = await buildVideoCardElement({ src, name: file.name, key });
        localVideoList.appendChild(card);
        initCard(card);
      }
      addVideoInput.value = '';
      updateSelectedMedia();
      renumberCards();
      saveLocalOrderForCurrentSet(); // persist order after adding
    });
  }

  // Add single URL (with validation)
  if (addVideoUrlButton && addVideoUrlInput) {
    addVideoUrlButton.addEventListener('click', async () => {
      const url = addVideoUrlInput.value.trim();
      if (!url) return;

      if (isYouTubeUrl(url) && window.YT_API_KEY) {
        try {
          const { ok, reason } = await validateSingleYouTubeUrl(url, window.YT_API_KEY);
          if (!ok) {
            alert(`Cette vidéo ne peut pas être intégrée (${reason}).`);
            addVideoUrlInput.value = '';
            return; // DO NOT add card
          }
        } catch {}
      }

      await addYoutubeUrlCard(url);
      addVideoUrlInput.value = '';
      renumberCards();
      updateSelectedMedia();
      if (urlVideoList) saveYoutubeUrls();
    });
  }

  // YouTube playlist import (validate & add) — UPDATED to include snippet (thumbs + titles)
  if (ytPlaylistBtn && ytPlaylistInput) {
    ytPlaylistBtn.addEventListener('click', async () => {
      const url = ytPlaylistInput.value.trim();
      const apiKey = window.YT_API_KEY;
      ytPlaylistStatus.textContent = '';

      if (!url) { ytPlaylistStatus.textContent = "Veuillez entrer une URL de playlist."; return; }
      const pid = getPlaylistIdFromUrl(url);
      if (!pid) { ytPlaylistStatus.textContent = "URL invalide: impossible d'extraire l'identifiant de playlist."; return; }
      if (!apiKey) { ytPlaylistStatus.textContent = "Clé API absente (window.YT_API_KEY)."; return; }

      ytPlaylistBtn.disabled = true;
      ytPlaylistStatus.textContent = "Import en cours…";
      try {
        const ids = await fetchPlaylistVideoIds(apiKey, pid);
        if (!ids.length) {
          ytPlaylistStatus.textContent = "Aucune vidéo trouvée dans cette playlist.";
        } else {
          const { ok, blocked, thumbs, titles } = await validateEmbeddableIds(apiKey, ids);
          let added = 0, refused = 0;
          for (const id of ok) {
            const urlItem = `https://www.youtube.com/watch?v=${id}`;
            await addYoutubeUrlCard(urlItem, {
              thumbUrl: thumbs.get(id) || null,
              title: titles.get(id) || null
            });
            added++;
          }
          refused = blocked.size;
          renumberCards();
          updateSelectedMedia();
          if (urlVideoList) saveYoutubeUrls();
          ytPlaylistStatus.textContent = `Import terminé: ${added} ajouté(s)${refused ? `, ${refused} ignoré(s)` : ''}.`;
        }
      } catch (err) {
        console.error(err);
        ytPlaylistStatus.textContent = "Import échoué: " + (err?.message || "erreur inconnue");
      } finally {
        ytPlaylistBtn.disabled = false;
      }
    });
  }

  // Selection click toggles active state
  if (videoSelectionDiv) {
    videoSelectionDiv.addEventListener('click', (e) => {
      if (e.target.closest('.order-controls') || e.target.classList.contains('remove-btn')) return;
      const card = e.target.closest('.video-card');
      if (!card) return;

      const willSelect = !card.classList.contains('selected');
      card.classList.toggle('selected', willSelect);
      card.classList.toggle('deselected', !willSelect);

      updateSelectedMedia();
    });
  }

  // updateSelectedMedia: reset ordering when list/order changes
  function updateSelectedMedia() {
    videoCardsArray = Array.from(document.querySelectorAll('.video-card'));
    selectedMedia = videoCardsArray
      .filter(c => c.classList.contains('selected'))
      .map(c => c.dataset.src);

    videoCardsArray.forEach(card => {
      const isSelected = card.classList.contains('selected');
      card.classList.toggle('deselected', !isSelected);
    });

    renumberCards();

    startButton.style.display = selectedMedia.length ? 'block' : 'none';
    if (urlVideoList) saveYoutubeUrls();
    if (localVideoList) saveLocalOrderForCurrentSet();

    const sig = selectionSignature(selectedMedia);
    if (sig !== lastSelectionSignature) {
      lastSelectionSignature = sig;
      if (!isCurrentlyPlaying()) {
        resetPlaybackOrder();
      } else {
        if (currentMediaIndex >= selectedMedia.length) {
          currentMediaIndex = selectedMedia.length ? selectedMedia.length - 1 : 0;
        }
        playedMedia = playedMedia.filter(i => i < selectedMedia.length);
      }
    }
  }

  // sequential by default; optional shuffle via shuffleEnabled
  function getNextMediaIndex() {
    if (!selectedMedia.length) return 0;
    if (playedMedia.length >= selectedMedia.length) {
      playedMedia = [];
    }
    if (shuffleEnabled) {
      let next;
      do {
        next = Math.floor(Math.random() * selectedMedia.length);
      } while (playedMedia.includes(next) && playedMedia.length < selectedMedia.length);
      playedMedia.push(next);
      return next;
    } else {
      const next = playedMedia.length; // 0,1,2,...
      playedMedia.push(next);
      return next;
    }
  }

  // preload and show UI
  preloadMedia(selectedMedia, () => {
    const loadingContainer = document.getElementById('control-panel-loading-bar-container');
    if (loadingContainer) loadingContainer.style.display = 'none';
    if (selectedMedia.length) startButton.style.display = 'block';
    playIntroJingle();
    if (videoCardsArray.length === 0 && (addVideoInput || addVideoUrlInput)) {
      videoSelectionModal.style.display = 'block';
    }
  });

  function showPlayerNamesModal() {
    [player1NameInput, player2NameInput].forEach(input => {
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace') e.stopPropagation();
        });
      }
    });
    player1NameInput.value = '';
    player2NameInput.value = '';
    playerNamesModal.style.display = 'block';
  }

  function closePlayerNamesModalFn() {
    playerNamesModal.style.display = 'none';
    player1Name = '';
    player2Name = '';
    showPromptForCurrentPlayer();
  }

  closePlayerNamesModal.addEventListener('click', closePlayerNamesModalFn);
  playerNamesCancelButton.addEventListener('click', closePlayerNamesModalFn);

  playerNamesOkButton.addEventListener('click', () => {
    player1Name = player1NameInput.value.trim();
    player2Name = player2NameInput.value.trim();
    playerNamesModal.style.display = 'none';
    showPromptForCurrentPlayer();
  });

  startButton.addEventListener('click', () => {
    if (!selectedMedia.length) {
      alert('Veuillez sélectionner au moins un média pour démarrer le jeu.');
      return;
    }
    introJingle.pause();
    introJingle.currentTime = 0;
    if (playModeSelect.value === 'interval') {
      intervalTime = parseInt(intervalTimeInput.value, 10);
      if (isNaN(intervalTime) || intervalTime <= 0) {
        alert('Veuillez entrer un temps d\'intervalle valide en secondes.');
        return;
      }
    }
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
    document.getElementById('control-panel').style.display = 'none';
    playedMedia = [];
    currentMediaIndex = getNextMediaIndex();
    preventInputTemporarily();
    currentPlayer = 1;
    if (isTwoPlayerMode()) {
      showPlayerNamesModal();
    } else {
      showPromptForCurrentPlayer();
    }
  });

  playModeSelect.addEventListener('change', () => {
    mode = playModeSelect.value;
    if (mode === 'interval') {
      intervalLabel.style.display = 'inline-block';
      intervalTimeInput.style.display = 'inline-block';
    } else {
      intervalLabel.style.display = 'none';
      intervalTimeInput.style.display = 'none';
    }
  });

  function preventInputTemporarily() {
    preventInput = true;
    setTimeout(() => { preventInput = false; }, 500);
  }

  function clearTimedCycle() {
    if (timedCycleTimeout) {
      clearTimeout(timedCycleTimeout);
      timedCycleTimeout = null;
    }
    promptCurrentlyVisible = true;
  }

  function startTimedPromptCycle(visibleSecs) {
    setPromptVisibility(true);
    timedCycleTimeout = setTimeout(() => {
      setPromptVisibility(false);
      timedCycleTimeout = setTimeout(() => {
        if (controlsEnabled) startTimedPromptCycle(visibleSecs);
      }, 5000);
    }, visibleSecs * 1000);
  }

  function setPromptVisibility(show) {
    promptCurrentlyVisible = show;
    if (!controlsEnabled) return;
    if (show) playSoundPromptForPlayer(currentPlayer);
    if (currentPlayer === 1) {
      if (isTwoPlayerMode() && player1Name) playerNameOverlay.style.display = show ? 'block' : 'none';
      if (useTextPrompt && selectedSpacePromptSrc) {
        textPrompt.style.display = show ? 'block' : 'none';
      } else if (selectedSpacePromptSrc) {
        spacePrompt.style.display = show ? 'block' : 'none';
      }
    } else {
      if (isTwoPlayerMode() && player2Name) playerNameOverlay.style.display = show ? 'block' : 'none';
      if (useTextPrompt2 && selectedSpacePromptSrc2) {
        textPrompt2.style.display = show ? 'block' : 'none';
      } else if (selectedSpacePromptSrc2) {
        spacePrompt2.style.display = show ? 'block' : 'none';
      }
    }
  }

  function showPromptForCurrentPlayer() {
    clearTimedCycle();
    blackBackground.style.display = 'block';
    controlsEnabled = true;
    spacePrompt.style.display = 'none';
    textPrompt.style.display = 'none';
    spacePrompt2.style.display = 'none';
    textPrompt2.style.display = 'none';
    playerNameOverlay.style.display = 'none';
    if (currentPlayer === 1) {
      if (isTwoPlayerMode() && player1Name) playerNameOverlay.textContent = player1Name;
      if (useTextPrompt && selectedSpacePromptSrc) {
        textPrompt.textContent = selectedSpacePromptSrc;
      } else if (selectedSpacePromptSrc) {
        spacePrompt.src = selectedSpacePromptSrc;
      }
    } else {
      if (isTwoPlayerMode() && player2Name) playerNameOverlay.textContent = player2Name;
      if (useTextPrompt2 && selectedSpacePromptSrc2) {
        textPrompt2.textContent = selectedSpacePromptSrc2;
      } else if (selectedSpacePromptSrc2) {
        spacePrompt2.src = selectedSpacePromptSrc2;
      }
    }
    const timedOn = !!miscOptionsState['timed-prompt-option'];
    if (!timedOn) { setPromptVisibility(true); return; }
    let visibleSecs = parseInt(miscOptionsState['timed-prompt-seconds'] || '5', 10);
    if (isNaN(visibleSecs) || visibleSecs < 1) visibleSecs = 5;
    startTimedPromptCycle(visibleSecs);
  }

  function hideAllPrompts() {
    clearTimedCycle();
    promptCurrentlyVisible = false;
    blackBackground.style.display = 'none';
    spacePrompt.style.display = 'none';
    textPrompt.style.display = 'none';
    spacePrompt2.style.display = 'none';
    textPrompt2.style.display = 'none';
    playerNameOverlay.style.display = 'none';
    controlsEnabled = false;
  }

  // SPACE (P1) + Backspace handler call — guard typing targets
  document.addEventListener('keydown', e => {
    if (isTypingTarget(e.target)) return;
    if (preventInput) return;
    if (currentPlayer === 1 && controlsEnabled && promptCurrentlyVisible && e.code === 'Space') {
      e.preventDefault();
      proceedAfterPrompt();
    }
    handleEnterPause(e);
  });

  // ENTER (P2) — guard typing targets
  document.addEventListener('keydown', e => {
    if (isTypingTarget(e.target)) return;
    if (preventInput) return;
    if (!isTwoPlayerMode()) return;
    if (currentPlayer === 2 && controlsEnabled && promptCurrentlyVisible && e.code === 'Enter') {
      e.preventDefault();
      proceedAfterPrompt();
    }
  });

  function proceedAfterPrompt() {
    hideAllPrompts();
    if (pausedAtTime > 0) {
      const currentSrc = selectedMedia[currentMediaIndex];
      if (isYouTubeUrl(currentSrc) && youtubePlayer) {
        youtubePlayer.seekTo(pausedAtTime, true);
        youtubePlayer.playVideo();
        onYouTubePlayerReady();
        if (youtubeDiv) youtubeDiv.style.display = 'block';
        if (mediaPlayer) mediaPlayer.style.display = 'none';
      } else if (mediaPlayer) {
        mediaPlayer.currentTime = pausedAtTime;
        mediaPlayer.play();
        mediaPlayer.style.display = 'block';
        if (youtubeDiv) youtubeDiv.style.display = 'none';
      }
      pausedAtTime = 0;
    } else {
      startMediaPlayback();
    }
    if (mode === 'interval') {
      setPauseInterval();
    }
  }

  function startMediaPlayback() {
    const src = selectedMedia[currentMediaIndex];
    if (!src) return;

    if (isYouTubeUrl(src)) {
      if (youtubeDiv) youtubeDiv.style.display = 'block';
      if (mediaPlayer) mediaPlayer.style.display = 'none';
      const id = getYouTubeId(src);
      if (youtubeApiReady) {
        if (!youtubePlayer) {
          createYouTubePlayer(id);
        } else if (id) {
          youtubePlayer.loadVideoById(id);
          youtubePlayer.playVideo();
          onYouTubePlayerReady();
        }
      } else {
        pendingYouTubeId = id;
      }
    } else if (mediaPlayer) {
      if (youtubeDiv) youtubeDiv.style.display = 'none';
      mediaPlayer.style.display = 'block';
      mediaPlayer.removeAttribute('controls');
      mediaPlayer.src = src;
      mediaPlayer.load();
      mediaPlayer.play().catch(() => {});
    }
    if (mediaType === 'video') {
      if (videoContainer) videoContainer.style.display = 'block';
    }
    if (mode === 'interval') {
      setPauseInterval();
    }
  }

  function setPauseInterval() {
    if (intervalID) clearInterval(intervalID);
    intervalID = setInterval(() => {
      const currentSrc = selectedMedia[currentMediaIndex];
      if (isYouTubeUrl(currentSrc)) {
        if (youtubePlayer && youtubePlayer.getPlayerState && youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
          pausedAtTime = youtubePlayer.getCurrentTime();
          youtubePlayer.pauseVideo();
          switchPlayer();
          showPromptForCurrentPlayer();
          clearInterval(intervalID);
        }
      } else if (mediaPlayer && !mediaPlayer.paused) {
        pausedAtTime = mediaPlayer.currentTime;
        mediaPlayer.pause();
        switchPlayer();
        showPromptForCurrentPlayer();
        clearInterval(intervalID);
      }
    }, intervalTime * 1000);
  }

  if (mediaPlayer) {
    mediaPlayer.addEventListener('ended', handleMediaEnd);
  }

  function handleMediaEnd() {
    if (youtubeDiv) youtubeDiv.style.display = 'none';
    if (mediaPlayer) mediaPlayer.style.display = 'none';
    if (mode === 'pressBetween') {
      if (playedMedia.length < selectedMedia.length) {
        currentMediaIndex = getNextMediaIndex();
        switchPlayer();
        showPromptForCurrentPlayer();
      } else {
        playedMedia = [];
        currentMediaIndex = getNextMediaIndex();
        switchPlayer();
        showPromptForCurrentPlayer();
      }
    } else if (mode === 'onePress' || mode === 'interval') {
      if (playedMedia.length < selectedMedia.length) {
        currentMediaIndex = getNextMediaIndex();
        startMediaPlayback();
      } else {
        playedMedia = [];
        currentMediaIndex = getNextMediaIndex();
        switchPlayer();
        showPromptForCurrentPlayer();
      }
    }
  }

  // expose handler for the global YT error delegate
  window.__handleMediaEnd = handleMediaEnd;

  function switchPlayer() {
    if (!isTwoPlayerMode()) {
      currentPlayer = 1;
    } else {
      currentPlayer = currentPlayer === 1 ? 2 : 1;
    }
  }

  function playSoundPromptForPlayer(num) {
    const s = num === 1 ? selectedSound : selectedSound2;
    if (!s || s === 'none') return;
    if (currentSound) {
      currentSound.pause();
      currentSound.currentTime = 0;
    }
    if (s === 'record-own' && recordedAudio) {
      currentSound = new Audio(recordedAudio);
    } else {
      const found = spacePromptSounds.find(opt => opt.value === s);
      if (found && found.src) currentSound = new Audio(found.src);
    }
    if (currentSound) currentSound.play().catch(() => {});
  }

  // Record modal
  closeRecordModal.addEventListener('click', () => {
    recordModal.style.display = 'none';
  });

  recordButton.addEventListener('click', () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.start();
          audioChunks = [];
          mediaRecorder.ondataavailable = e => { audioChunks.push(e.data); };
          mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/mp3' });
            recordedAudio = URL.createObjectURL(blob);
            recordStatus.textContent = 'Enregistrement complété!';
            okRecordingButton.style.display = 'block';
          };
          recordStatus.textContent = 'Enregistrement...';
          stopRecordingButton.style.display = 'block';
          recordButton.style.display = 'none';
          setTimeout(() => { stopRecording(); }, 5000);
        })
        .catch(() => {
          recordStatus.textContent = 'Error accessing microphone';
        });
    }
  });

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      stopRecordingButton.style.display = 'none';
      recordButton.style.display = 'block';
    }
  }
  stopRecordingButton.addEventListener('click', () => stopRecording());
  okRecordingButton.addEventListener('click', () => {
    stopRecording();
    recordModal.style.display = 'none';
    okRecordingButton.style.display = 'none';
    stopRecordingButton.style.display = 'none';
    recordButton.style.display = 'block';
    if (recordedAudio) new Audio(recordedAudio).play();
  });

  // Space prompt pickers
  selectSpacePromptButton.addEventListener('click', () => {
    spacePromptSelectionModal.style.display = 'block';
  });
  closeSpacePromptModal.addEventListener('click', () => {
    spacePromptSelectionModal.style.display = 'none';
  });
  applySpacePromptButton.addEventListener('click', () => {
    spacePromptSelectionModal.style.display = 'none';
    if (useTextPrompt && selectedSpacePromptSrc) textPrompt.textContent = selectedSpacePromptSrc;
  });

  selectSpacePromptButton2.addEventListener('click', () => {
    spacePromptSelectionModal2.style.display = 'block';
  });
  closeSpacePromptModal2.addEventListener('click', () => {
    spacePromptSelectionModal2.style.display = 'none';
  });
  applySpacePromptButton2.addEventListener('click', () => {
    spacePromptSelectionModal2.style.display = 'none';
    if (useTextPrompt2 && selectedSpacePromptSrc2) textPrompt2.textContent = selectedSpacePromptSrc2;
  });

  // Sounds dropdowns
  function hidePlaceholderOnFocus(selectElement) {
    selectElement.addEventListener('focus', function() {
      const firstOption = this.options[0];
      if (firstOption.disabled && firstOption.selected) {
        firstOption.style.display = 'none';
      }
    });
  }
  function showPlaceholderOnBlur(selectElement) {
    selectElement.addEventListener('blur', function() {
      const firstOption = this.options[0];
      if (firstOption.disabled && this.selectedIndex === 0) {
        firstOption.style.display = 'block';
      }
    });
  }
  if (soundOptionsSelect) {
    hidePlaceholderOnFocus(soundOptionsSelect);
    showPlaceholderOnBlur(soundOptionsSelect);
    soundOptionsSelect.addEventListener('change', () => {
      if (soundOptionsSelect.value === 'record-own') {
        recordModal.style.display = 'block';
      } else {
        selectedSound = soundOptionsSelect.value;
      }
    });
  }
  if (soundOptionsSelect2) {
    hidePlaceholderOnFocus(soundOptionsSelect2);
    showPlaceholderOnBlur(soundOptionsSelect2);
    soundOptionsSelect2.addEventListener('change', () => {
      if (soundOptionsSelect2.value === 'record-own') {
        recordModal.style.display = 'block';
      } else {
        selectedSound2 = soundOptionsSelect2.value;
      }
    });
  }

  // Visual options
  if (visualOptionsSelect) {
    visualOptionsSelect.addEventListener('change', () => {
      if (!mediaPlayer) return;
      mediaPlayer.className = '';
      mediaPlayer.style.filter = '';
      switch (visualOptionsSelect.value) {
        case 'green-filter': mediaPlayer.classList.add('green-filter'); break;
        case 'red-filter': mediaPlayer.classList.add('red-filter'); break;
        case 'blue-filter': mediaPlayer.classList.add('blue-filter'); break;
        case 'high-contrast': mediaPlayer.style.filter = 'contrast(200%)'; break; // fixed
        case 'grayscale': mediaPlayer.style.filter = 'grayscale(100%)'; break;
        case 'invert': mediaPlayer.style.filter = 'invert(100%)'; break;
        case 'brightness': mediaPlayer.style.filter = 'brightness(1.5)'; break;
        case 'saturation': mediaPlayer.style.filter = 'saturate(200%)'; break;
        default: break;
      }
    });
  }

  // Misc options
  function handleSpacebarPressEquivalent() {
    if (currentPlayer === 1 && controlsEnabled && promptCurrentlyVisible) proceedAfterPrompt();
  }
  function handleRightClickNextVideo(e) {
    e.preventDefault();
    currentMediaIndex = getNextMediaIndex();
    startMediaPlayback();
  }
  function handleEnterPause(e) {
    if (isTypingTarget(e.target)) return; // <-- guard inputs
    if (miscOptionsState['enter-pause-option'] && e.code === 'Backspace') {
      e.preventDefault();
      pauseActivityAndShowPrompt();
    }
  }
  function pauseActivityAndShowPrompt() {
    const currentSrc = selectedMedia[currentMediaIndex];
    if (isYouTubeUrl(currentSrc)) {
      if (youtubePlayer && youtubePlayer.getPlayerState && youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
        pausedAtTime = youtubePlayer.getCurrentTime();
        youtubePlayer.pauseVideo();
      }
    } else if (mediaPlayer && !mediaPlayer.paused) {
      pausedAtTime = mediaPlayer.currentTime;
      mediaPlayer.pause();
    }
    switchPlayer();
    showPromptForCurrentPlayer();
  }
  function applyMiscOptions() {
    if (miscOptionsState['right-click-next-option']) {
      document.addEventListener('contextmenu', handleRightClickNextVideo);
    } else {
      document.removeEventListener('contextmenu', handleRightClickNextVideo);
    }
    if (miscOptionsState['mouse-click-option']) {
      document.addEventListener('click', handleSpacebarPressEquivalent);
    } else {
      document.removeEventListener('click', handleSpacebarPressEquivalent);
    }
  }

  // Populate config-driven UI
  function loadConfig() {
    const userLang = localStorage.getItem('siteLanguage') || 'en';
    // images for both players
    spacePromptImages.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'image-card';
      card.dataset.src = p.src;
      const altText = (typeof p.alt === 'object') ? p.alt[userLang] : p.alt;
      card.innerHTML = `<img src="${p.src}" alt="${altText}">`;
      imageCardsContainer1.appendChild(card);
      card.addEventListener('click', () => {
        textPromptInput.value = '';
        useTextPrompt = false;
        Array.from(imageCardsContainer1.querySelectorAll('.image-card')).forEach(a => a.classList.remove('selected'));
        card.classList.add('selected');
        selectedSpacePromptSrc = card.dataset.src;
      });
    });
    spacePromptImages.forEach((p) => {
      const card2 = document.createElement('div');
      card2.className = 'image-card';
      card2.dataset.src = p.src;
      const altText = (typeof p.alt === 'object') ? p.alt[userLang] : p.alt;
      card2.innerHTML = `<img src="${p.src}" alt="${altText}">`;
      imageCardsContainer2.appendChild(card2);
      card2.addEventListener('click', () => {
        textPromptInput2.value = '';
        useTextPrompt2 = false;
        Array.from(imageCardsContainer2.querySelectorAll('.image-card')).forEach(a => a.classList.remove('selected'));
        card2.classList.add('selected');
        selectedSpacePromptSrc2 = card2.dataset.src;
      });
    });
    const firstList = Array.from(imageCardsContainer1.querySelectorAll('.image-card'));
    if (firstList.length > 0) {
      firstList[0].classList.add('selected');
      selectedSpacePromptSrc = firstList[0].dataset.src;
    }
    const secondList = Array.from(imageCardsContainer2.querySelectorAll('.image-card'));
    if (secondList.length > 1) {
      secondList[1].classList.add('selected');
      selectedSpacePromptSrc2 = secondList[1].dataset.src;
    } else if (secondList.length > 0) {
      secondList[0].classList.add('selected');
      selectedSpacePromptSrc2 = secondList[0].dataset.src;
    }
    textPromptInput.addEventListener('input', () => {
      Array.from(imageCardsContainer1.querySelectorAll('.image-card')).forEach(a => a.classList.remove('selected'));
      selectedSpacePromptSrc = textPromptInput.value;
      useTextPrompt = true;
    });
    textPromptInput2.addEventListener('input', () => {
      Array.from(imageCardsContainer2.querySelectorAll('.image-card')).forEach(a => a.classList.remove('selected'));
      selectedSpacePromptSrc2 = textPromptInput2.value;
      useTextPrompt2 = true;
    });
    spacePromptSounds.forEach(o => {
      const opt1 = document.createElement('option');
      opt1.value = o.value;
      opt1.textContent = (typeof o.label === 'object') ? o.label[userLang] : o.label;
      soundOptionsSelect.appendChild(opt1);
      const opt2 = document.createElement('option');
      opt2.value = o.value;
      opt2.textContent = (typeof o.label === 'object') ? o.label[userLang] : o.label;
      soundOptionsSelect2.appendChild(opt2);
    });
    visualOptions.forEach(e => {
      const effOpt = document.createElement('option');
      effOpt.value = e.value;
      effOpt.textContent = (typeof e.label === 'object') ? e.label[userLang] : e.label;
      visualOptionsSelect.appendChild(effOpt);
    });
    miscOptions.forEach(o => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('misc-option-wrapper');
      if (o.id === 'timed-prompt-option') {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = o.id;
        cb.checked = o.defaultChecked;
        miscOptionsState[o.id] = cb.checked;
        const label = document.createElement('label');
        label.htmlFor = o.id;
        label.textContent = (typeof o.label === 'object') ? o.label[userLang] : o.label;
        label.style.color = 'black';
        wrapper.appendChild(cb);
        wrapper.appendChild(label);
        miscOptionsContainer.appendChild(wrapper);
        cb.addEventListener('change', () => {
          miscOptionsState[o.id] = cb.checked;
          const numericDiv = document.getElementById('timed-seconds-wrapper');
          if (numericDiv) {
            numericDiv.style.display = cb.checked ? 'block' : 'none';
          }
        });
      } else if (o.id === 'timed-prompt-seconds') {
        wrapper.id = 'timed-seconds-wrapper';
        wrapper.style.display = 'none';
        const numericLabelText = { fr: "Temps pour appuyer sur la switch (s)", en: "Time to press the switch (s)" };
        const userLang2 = localStorage.getItem('siteLanguage') || 'en';
        const numericLabel = document.createElement('label');
        numericLabel.textContent = numericLabelText[userLang2];
        numericLabel.style.color = 'black';
        const numberInput = document.createElement('input');
        numberInput.type = 'number';
        numberInput.min = '1';
        let fallback = (typeof o.label === 'object') ? o.label[userLang2] : o.label;
        if (!fallback) fallback = '5';
        numberInput.value = fallback;
        numberInput.style.width = '60px';
        numberInput.style.marginLeft = '8px';
        miscOptionsState[o.id] = numberInput.value;
        numberInput.addEventListener('change', () => {
          miscOptionsState[o.id] = numberInput.value;
        });
        wrapper.appendChild(numericLabel);
        wrapper.appendChild(numberInput);
        miscOptionsContainer.appendChild(wrapper);
      } else {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = o.id;
        cb.checked = o.defaultChecked;
        miscOptionsState[o.id] = o.defaultChecked;
        const label = document.createElement('label');
        label.htmlFor = o.id;
        label.textContent = (typeof o.label === 'object') ? o.label[userLang] : o.label;
        label.style.color = 'black';
        wrapper.appendChild(cb);
        wrapper.appendChild(label);
        miscOptionsContainer.appendChild(wrapper);
        cb.addEventListener('change', () => {
          miscOptionsState[o.id] = cb.checked;
        });
      }
    });
  }

  loadConfig();
  applyMiscOptions();

  /* Folder picker integration */
  let repoHandle = null;

  // NEW: fully deterministic population using saved order pre-sort + hidden filter
  async function populateFromRepo(handle) {
    // 1) collect entries and file metadata
    const items = [];
    for await (const entry of iterVideos(handle)) {
      const file = await entry.getFile();
      const key = makeLocalKey(entry.name, file.size, file.lastModified);
      items.push({ entry, file, key, name: entry.name });
    }

    // NEW: drop items the user has hidden previously
    const hidden = getHiddenSet();
    const visibleItems = items.filter(it => !hidden.has(it.key));

    if (!visibleItems.length) {
      (localVideoList || videoSelectionDiv).innerHTML = '';
      updateSelectedMedia();
      renumberCards();
      return;
    }

    // 2) compute set signature BEFORE rendering (on visible set)
    const sig = visibleItems.map(i => i.key).sort().join('||');
    const map = getLocalOrderMap();
    const saved = Array.isArray(map[sig]) ? map[sig] : null;

    // 3) build a rank map from saved order (if any)
    const rank = new Map();
    if (saved) saved.forEach((k, i) => rank.set(k, i));

    // 4) sort items: saved order first, then newcomers alphabetically by name
    visibleItems.sort((a, b) => {
      const ra = rank.has(a.key), rb = rank.has(b.key);
      if (ra && rb) return rank.get(a.key) - rank.get(b.key);
      if (ra && !rb) return -1;
      if (!ra && rb) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    // 5) render cards in final order (no flicker reordering after)
    const container = localVideoList || videoSelectionDiv;
    const frag = document.createDocumentFragment();
    for (const it of visibleItems) {
      const src = URL.createObjectURL(it.file);
      const card = await buildVideoCardElement({ src, name: it.name, key: it.key });
      initCard(card);
      frag.appendChild(card);
    }
    container.innerHTML = '';
    container.appendChild(frag);

    // 6) finalize selection + numbering
    updateSelectedMedia();
    renumberCards();

    // 7) persist current order (so newcomers get appended consistently next time)
    const keysInDom = Array.from(container.querySelectorAll('.video-card')).map(c => c.dataset.key || c.dataset.src);
    map[sig] = keysInDom;
    setLocalOrderMap(map);
  }

  async function chooseFolder() {
    try {
      const handle = await window.showDirectoryPicker();
      repoHandle = handle;
      await saveRepoHandle(handle);
      await populateFromRepo(repoHandle);
    } catch {}
  }

  if (pickFolderButton && 'showDirectoryPicker' in window) {
    pickFolderButton.addEventListener('click', chooseFolder);
    (async () => {
      try {
        if (navigator.storage?.persist) { try { await navigator.storage.persist(); } catch {} }
        const saved = await loadRepoHandle();
        if (saved) {
          const perm = await saved.requestPermission?.({mode:'read'});
          if (perm === 'granted') {
            repoHandle = saved;
            await populateFromRepo(repoHandle);
          }
        }
      } catch {}
    })();
  }

  // Misc dialog open/close
  miscOptionsButton.addEventListener('click', () => {
    miscOptionsModal.style.display = 'block';
  });
  closeMiscOptionsModal.addEventListener('click', () => {
    miscOptionsModal.style.display = 'none';
  });
  miscOptionsOkButton.addEventListener('click', () => {
    miscOptionsModal.style.display = 'none';
    if (miscOptionsState['mouse-click-option']) {
      document.addEventListener('click', handleSpacebarPressEquivalent);
    } else {
      document.removeEventListener('click', handleSpacebarPressEquivalent);
    }
    if (miscOptionsState['right-click-next-option']) {
      document.addEventListener('contextmenu', handleRightClickNextVideo);
    } else {
      document.removeEventListener('contextmenu', handleRightClickNextVideo);
    }
    if ('shuffle-option' in miscOptionsState) {
      shuffleEnabled = !!miscOptionsState['shuffle-option'];
    }
    const player2SoundContainer = document.getElementById('player2-sound-container');
    if (miscOptionsState['two-player-mode-option']) {
      if (player2PromptContainer) player2PromptContainer.style.display = 'block';
      if (player2SoundContainer) player2SoundContainer.style.display = 'block';
    } else {
      if (player2PromptContainer) player2PromptContainer.style.display = 'none';
      if (player2SoundContainer) player2SoundContainer.style.display = 'none';
    }
  });

});
