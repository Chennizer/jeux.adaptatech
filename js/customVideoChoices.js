// Builds mediaChoices from local video files
const mediaChoices = [];

const LOCAL_VIDEOS_STORAGE_KEY = 'choiceLocalVideos';

// IndexedDB keys for persisted folder handles
const FS_DB_NAME = 'choice-video-handles';
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
    localStorage.setItem('hasChoiceVideoRepo', '1');
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
        if (h && (await h.queryPermission?.({ mode: 'read' })) === 'granted') res(h);
        else res(null);
      };
      g.onerror = () => res(null);
    });
  } catch { return null; }
}

async function deleteRepoHandle() {
  try {
    const db = await idbOpenFS();
    await new Promise((res, rej) => {
      const tx = db.transaction(FS_STORE, 'readwrite');
      tx.objectStore(FS_STORE).delete('video-repo');
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  } catch {}
  try { localStorage.removeItem('hasChoiceVideoRepo'); } catch {}
}

async function* iterVideos(dirHandle) {
  for await (const entry of dirHandle.values()) {
    if (entry.kind !== 'file') continue;
    if (!VIDEO_RX.test(entry.name)) continue;
    yield entry;
  }
}

// Generate a thumbnail for a given video File
async function makeThumbnailFromVideo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = url;

    const cleanup = () => { try { URL.revokeObjectURL(url); } catch {} };

    video.addEventListener('loadedmetadata', () => {
      try {
        const t = Math.min(10, Math.max(0, (video.duration || 0) - 0.1));
        video.currentTime = t;
      } catch {}
    }, { once: true });

    video.addEventListener('seeked', () => {
      try {
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 360;
        const cw = 640, ch = 360;
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext('2d');
        const scale = Math.min(cw / w, ch / h);
        const dw = w * scale, dh = h * scale;
        const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
        ctx.drawImage(video, dx, dy, dw, dh);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve('');
      }
      cleanup();
    }, { once: true });

    video.addEventListener('error', () => { cleanup(); resolve(''); }, { once: true });
    setTimeout(() => { cleanup(); resolve(''); }, 3000);
  });
}


function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function addFiles(files, save = true) {
  for (const file of files) {
    if (!VIDEO_RX.test(file.name)) continue;
    const videoUrl = save ? await readFileAsDataURL(file) : URL.createObjectURL(file);
    const thumb = await makeThumbnailFromVideo(file);
    const audio = document.createElement('audio');
    audio.src = videoUrl;
    audio.preload = 'auto';
    audio.load();
    mediaChoices.push({
      name: file.name,
      image: thumb,
      video: videoUrl,
      audioElement: audio,
      category: 'custom'
    });
  }
  if (save) saveLocalVideos();

  if (typeof populateTilePickerGrid === 'function') {
    populateTilePickerGrid();
  }
}


function saveLocalVideos() {
  try {
    const data = mediaChoices.map(({ name, image, video }) => ({ name, image, video }));
    localStorage.setItem(LOCAL_VIDEOS_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

async function loadLocalVideos() {
  const saved = localStorage.getItem(LOCAL_VIDEOS_STORAGE_KEY);
  if (!saved) return;
  try {
    const arr = JSON.parse(saved);
    for (const item of arr) {
      const audio = document.createElement('audio');
      audio.src = item.video;
      audio.preload = 'auto';
      audio.load();
      mediaChoices.push({
        name: item.name,
        image: item.image,
        video: item.video,
        audioElement: audio,
        category: 'custom'
      });
    }
  } catch (e) {
    console.error('Failed to load local videos', e);
  }
}

async function populateFromRepo(handle) {
  mediaChoices.length = 0;
  try { localStorage.removeItem(LOCAL_VIDEOS_STORAGE_KEY); } catch {}
  for await (const entry of iterVideos(handle)) {
    const file = await entry.getFile();
    await addFiles([file], false);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const addVideoButton = document.getElementById('add-video-file-button');
  const addVideoInput = document.getElementById('add-video-input');
  const pickFolderButton = document.getElementById('pick-video-folder-button');
  const clearButton = document.getElementById('clear-videos-button');

  // Try restoring from a previously chosen folder
  if ('showDirectoryPicker' in window) {
    try {
      if (navigator.storage?.persist) { try { await navigator.storage.persist(); } catch {} }
      const saved = await loadRepoHandle();
      if (saved) {
        const perm = await saved.requestPermission?.({ mode: 'read' });
        if (perm === 'granted') await populateFromRepo(saved);
      }
    } catch {}
  }

  // If no folder restored, fall back to localStorage
  if (mediaChoices.length === 0) {
    await loadLocalVideos();
  }

  if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();

  if (addVideoButton && addVideoInput) {
    addVideoButton.addEventListener('click', () => addVideoInput.click());
    addVideoInput.addEventListener('change', async () => {
      await addFiles(addVideoInput.files);
      addVideoInput.value = '';
    });
  }

  if (pickFolderButton && 'showDirectoryPicker' in window) {
    pickFolderButton.addEventListener('click', async () => {
      try {
        const dirHandle = await window.showDirectoryPicker();
        await saveRepoHandle(dirHandle);
        await populateFromRepo(dirHandle);
      } catch (err) {
        console.error(err);
      }
    });
  } else if (pickFolderButton) {
    pickFolderButton.style.display = 'none';
  }

  if (clearButton) {
    clearButton.addEventListener('click', async () => {
      mediaChoices.length = 0;
      try { localStorage.removeItem(LOCAL_VIDEOS_STORAGE_KEY); } catch {}
      await deleteRepoHandle();
      if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();
    });
  }

});
