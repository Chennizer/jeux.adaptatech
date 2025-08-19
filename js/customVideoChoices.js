// Builds mediaChoices from local video files
const mediaChoices = [];

// Generate a thumbnail for a given video File
async function makeThumbnailFromVideo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.src = url;

    const clean = () => { URL.revokeObjectURL(url); };

    video.addEventListener('loadedmetadata', () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 360;
        const cw = 640, ch = 360;
        canvas.width = cw; canvas.height = ch;
        const scale = Math.min(cw / w, ch / h);
        const dw = w * scale, dh = h * scale;
        const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
        video.currentTime = Math.min(10, Math.max(0, video.duration - 0.1));
        video.addEventListener('seeked', () => {
          ctx.drawImage(video, dx, dy, dw, dh);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
          clean();
        }, { once: true });
      } catch {
        resolve('');
        clean();
      }
    }, { once: true });

    video.addEventListener('error', () => { resolve(''); clean(); }, { once: true });
  });
}

async function addFiles(files) {
  for (const file of files) {
    if (!/\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(file.name)) continue;
    const src = URL.createObjectURL(file);
    const thumb = await makeThumbnailFromVideo(file);
    mediaChoices.push({
      name: file.name,
      image: thumb,
      video: src,
      category: 'custom'
    });
  }
  if (typeof populateTilePickerGrid === 'function') {
    populateTilePickerGrid();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const addVideoButton = document.getElementById('add-video-file-button');
  const addVideoInput = document.getElementById('add-video-input');
  const pickFolderButton = document.getElementById('pick-video-folder-button');

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
