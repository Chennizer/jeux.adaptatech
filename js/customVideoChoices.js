// Builds mediaChoices from local video files
const mediaChoices = [];

function emitMediaChoicesChanged() {
  try {
    window.dispatchEvent(new CustomEvent('mediaChoicesChanged', { detail: mediaChoices.slice() }));
  } catch (err) {
    console.error(err);
  }
}

// Persistent directory handle storage (mirrors switch/custom-videos-local)
const FS_DB_NAME = 'choice-video-handles';
const FS_STORE = 'handles';
const VIDEO_RX = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;
const FILES_KEY = 'video-files';

function notifyEyegazeGuard(options) {
  const tileContainer = document.getElementById('tile-container');
  if (!tileContainer) {
    return;
  }

  let isVisible = false;
  try {
    isVisible = window.getComputedStyle
      ? getComputedStyle(tileContainer).display !== 'none'
      : tileContainer.style.display !== 'none';
  } catch {
    isVisible = tileContainer.style.display !== 'none';
  }

  if (isVisible) {
    const guardOptions = options ?? { clearSelection: true };
    window.choiceEyegaze?.requirePointerMotionBeforeHover?.(guardOptions);
  }
}

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
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
  } catch {}
}

async function loadRepoHandle() {
  try {
    const db = await idbOpenFS();
    return new Promise((res) => {
      const tx = db.transaction(FS_STORE, 'readonly');
      const g = tx.objectStore(FS_STORE).get('video-repo');
      g.onsuccess = () => res(g.result || null);
      g.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}

async function clearRepoHandle() {
  try {
    const db = await idbOpenFS();
    await new Promise((res) => {
      const tx = db.transaction(FS_STORE, 'readwrite');
      tx.objectStore(FS_STORE).delete('video-repo');
      tx.oncomplete = res;
      tx.onerror = () => res();
    });
  } catch {}
}

async function saveFileHandles(handles) {
  try {
    const db = await idbOpenFS();
    await new Promise((res, rej) => {
      const tx = db.transaction(FS_STORE, 'readwrite');
      tx.objectStore(FS_STORE).put(handles, FILES_KEY);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
  } catch {}
}

async function loadFileHandles() {
  try {
    const db = await idbOpenFS();
    return new Promise((res) => {
      const tx = db.transaction(FS_STORE, 'readonly');
      const g = tx.objectStore(FS_STORE).get(FILES_KEY);
      g.onsuccess = () => res(g.result || []);
      g.onerror = () => res([]);
    });
  } catch {
    return [];
  }
}

async function clearFileHandles() {
  try {
    const db = await idbOpenFS();
    await new Promise((res) => {
      const tx = db.transaction(FS_STORE, 'readwrite');
      tx.objectStore(FS_STORE).delete(FILES_KEY);
      tx.oncomplete = res;
      tx.onerror = () => res();
    });
  } catch {}
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

function revokeAllVideos() {
  for (const item of mediaChoices) {
    try { URL.revokeObjectURL(item.video); } catch {}
  }
}

async function addFiles(files) {
  let addedAny = false;
  for (const raw of files) {
    const file = raw?.file instanceof File ? raw.file : raw;
    const fileHandle = raw?.handle ?? null;
    if (!file || !VIDEO_RX.test(file.name)) continue;
    const url = URL.createObjectURL(file);
    const thumb = await makeThumbnailFromVideo(file);
    const audio = document.createElement('audio');
    audio.src = url;
    audio.preload = 'auto';
    audio.load();
    const id = `${file.name}-${file.size}-${file.lastModified}`;
    mediaChoices.push({
      id,
      name: file.name,
      image: thumb,
      video: url,
      audioElement: audio,
      category: 'custom',
      fileHandle,
      file
    });
    addedAny = true;
    if (typeof populateTilePickerGrid === 'function') {
      populateTilePickerGrid();
    }
  }
  if (addedAny) {
    emitMediaChoicesChanged();
    notifyEyegazeGuard();
    window.choiceEyegaze?.ensureFullscreen?.();
  }
  return addedAny;
}

async function addFolderToChoices(dirHandle) {
  revokeAllVideos();
  mediaChoices.length = 0;
  let addedAny = false;
  for await (const entry of dirHandle.values()) {
    if (entry.kind !== 'file') continue;
    if (!VIDEO_RX.test(entry.name)) continue;
    const file = await entry.getFile();
    if (await addFiles([{ file, handle: entry }])) {
      addedAny = true;
    }
  }
  if (!addedAny) {
    window.choiceEyegaze?.ensureFullscreen?.();
  }
  return addedAny;
}

document.addEventListener('DOMContentLoaded', async () => {
  const addVideoButton = document.getElementById('add-video-file-button');
  const addVideoInput = document.getElementById('add-video-input');
  const pickFolderButton = document.getElementById('pick-video-folder-button');
  const clearButton = document.getElementById('clear-videos-button');

  if (navigator.storage?.persist) {
    try { await navigator.storage.persist(); } catch {}
  }

  let restoredFromFolder = false;
  if (pickFolderButton && window.showDirectoryPicker) {
    try {
      const saved = await loadRepoHandle();
      if (saved) {
        let perm = await saved.queryPermission?.({ mode: 'read' });
        if (perm !== 'granted') {
          perm = await saved.requestPermission?.({ mode: 'read' });
        }
        if (perm === 'granted') {
          await addFolderToChoices(saved);
          restoredFromFolder = true;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  let restoredFromFiles = false;
  if (!restoredFromFolder) {
    try {
      const savedFiles = await loadFileHandles();
      for (const handle of savedFiles) {
        let perm = await handle.queryPermission?.({ mode: 'read' });
        if (perm !== 'granted') {
          perm = await handle.requestPermission?.({ mode: 'read' });
        }
        if (perm === 'granted') {
          const file = await handle.getFile();
          await addFiles([{ file, handle }]);
          restoredFromFiles = true;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (!restoredFromFolder && !restoredFromFiles && typeof populateTilePickerGrid === 'function') {
    populateTilePickerGrid();
  }

  if (addVideoButton) {
    addVideoButton.addEventListener('click', async () => {
      if (window.showOpenFilePicker) {
        try {
          const handles = await window.showOpenFilePicker({
            multiple: true,
            types: [{ description: 'Videos', accept: { 'video/*': ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.m4v'] } }]
          });
          await clearRepoHandle();
          await clearFileHandles();
          await saveFileHandles(handles);
          let addedAny = false;
          for (const h of handles) {
            try {
              const f = await h.getFile();
              if (await addFiles([{ file: f, handle: h }])) {
                addedAny = true;
              }
            } catch (innerErr) {
              console.error(innerErr);
            }
          }
          if (!addedAny) {
            window.choiceEyegaze?.ensureFullscreen?.();
          }
        } catch (err) {
          console.error(err);
          window.choiceEyegaze?.ensureFullscreen?.();
        }
      } else if (addVideoInput) {
        addVideoInput.click();
      }
    });
  }

  if (addVideoInput) {
    addVideoInput.addEventListener('change', async () => {
      try {
        await clearRepoHandle();
        await clearFileHandles();
        const addedAny = await addFiles(Array.from(addVideoInput.files || []).map(file => ({ file })));
        if (!addedAny) {
          window.choiceEyegaze?.ensureFullscreen?.();
        }
      } catch (err) {
        console.error(err);
        window.choiceEyegaze?.ensureFullscreen?.();
      } finally {
        addVideoInput.value = '';
      }
    });
  }

  if (pickFolderButton && window.showDirectoryPicker) {
    pickFolderButton.addEventListener('click', async () => {
      try {
        const dirHandle = await window.showDirectoryPicker();
        await saveRepoHandle(dirHandle);
        await clearFileHandles();
        const addedAny = await addFolderToChoices(dirHandle);
        if (!addedAny) {
          window.choiceEyegaze?.ensureFullscreen?.();
        }
      } catch (err) {
        console.error(err);
        window.choiceEyegaze?.ensureFullscreen?.();
      }
    });
  } else if (pickFolderButton) {
    pickFolderButton.style.display = 'none';
  }

  if (clearButton) {
    clearButton.addEventListener('click', async () => {
      revokeAllVideos();
      mediaChoices.length = 0;
      await clearRepoHandle();
      await clearFileHandles();
      if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();
      emitMediaChoicesChanged();
      notifyEyegazeGuard({ clearSelection: true });
    });
  }
});
