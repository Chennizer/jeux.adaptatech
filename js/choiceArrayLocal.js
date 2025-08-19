let mediaChoices = [];

const VIDEO_RX = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;

async function makeThumbnailFromVideo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.addEventListener('loadeddata', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg'));
      } catch {
        resolve('');
      }
      URL.revokeObjectURL(url);
    }, { once: true });
    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve('');
    }, { once: true });
  });
}

async function importVideosFromFiles(fileList) {
  mediaChoices = [];
  for (const file of fileList) {
    if (!VIDEO_RX.test(file.name)) continue;
    const videoUrl = URL.createObjectURL(file);
    const imageUrl = await makeThumbnailFromVideo(file);
    mediaChoices.push({
      name: file.name,
      image: imageUrl,
      video: videoUrl,
      category: 'custom'
    });
  }
}

async function importVideosFromDirectory() {
  try {
    const dirHandle = await window.showDirectoryPicker();
    const files = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && VIDEO_RX.test(entry.name)) {
        files.push(await entry.getFile());
      }
    }
    await importVideosFromFiles(files);
  } catch (err) {
    console.error('Directory selection cancelled', err);
  }
}

window.importVideosFromDirectory = importVideosFromDirectory;
window.importVideosFromFiles = importVideosFromFiles;
