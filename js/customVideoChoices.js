// Builds mediaChoices from local video files
const mediaChoices = [];
const LOCAL_VIDEOS_STORAGE_KEY = 'choiceLocalVideos';

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

async function addFiles(files) {
  for (const file of files) {
    if (!/\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(file.name)) continue;
    const dataUrl = await readFileAsDataURL(file);
    const thumb = await makeThumbnailFromVideo(file);
    const audio = document.createElement('audio');
    audio.src = dataUrl;
    audio.preload = 'auto';
    audio.load();
    mediaChoices.push({
      name: file.name,
      image: thumb,
      video: dataUrl,
      audioElement: audio,
      category: 'custom'
    });
  }
  saveLocalVideos();
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

document.addEventListener('DOMContentLoaded', async () => {
  const addVideoButton = document.getElementById('add-video-file-button');
  const addVideoInput = document.getElementById('add-video-input');
  const pickFolderButton = document.getElementById('pick-video-folder-button');

  await loadLocalVideos();
  if (typeof populateTilePickerGrid === 'function') populateTilePickerGrid();

  if (addVideoButton && addVideoInput) {
    addVideoButton.addEventListener('click', () => addVideoInput.click());
    addVideoInput.addEventListener('change', async () => {
      await addFiles(addVideoInput.files);
      addVideoInput.value = '';
    });
  }

  if (pickFolderButton && window.showDirectoryPicker) {
    pickFolderButton.addEventListener('click', async () => {
      try {
        const dirHandle = await window.showDirectoryPicker();
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            await addFiles([file]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    });
  } else if (pickFolderButton) {
    pickFolderButton.style.display = 'none';
  }
});
