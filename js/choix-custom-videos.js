// choix-custom-videos.js
// Build mediaChoices dynamically from local video files selected by the user.

// Global array consumed by choix.js
const mediaChoices = [];

document.addEventListener('DOMContentLoaded', () => {
  const importBtn = document.getElementById('import-videos-button');
  const folderInput = document.getElementById('video-folder-input');

  if (importBtn && folderInput) {
    importBtn.addEventListener('click', () => folderInput.click());

    folderInput.addEventListener('change', async () => {
      // Clear existing choices
      mediaChoices.length = 0;
      const files = Array.from(folderInput.files || []);
      for (const file of files) {
        const videoUrl = URL.createObjectURL(file);
        const thumb = await makeThumbnailFromVideo(file);
        mediaChoices.push({
          name: file.name,
          image: thumb,
          video: videoUrl,
          category: 'custom'
        });
      }
    });
  }
});

// Thumbnail helper extracted from switch-two-player-custom.js
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
      if (typeof srcOrFile !== 'string') {
        try { URL.revokeObjectURL(url); } catch {}
      }
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
