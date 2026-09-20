(function () {
  'use strict';
  const urls = new Set();
  function release(url) { URL.revokeObjectURL(url); urls.delete(url); }
  function url(blob) { const value = URL.createObjectURL(blob); urls.add(value); return value; }
  window.VideoUtils = {
    url, release,
    enterFullscreen(element, isActive = () => true) {
      const request = element.requestFullscreen || element.webkitRequestFullscreen;
      if (!request || document.fullscreenElement || document.webkitFullscreenElement) return;
      try {
        Promise.resolve(request.call(element)).then(() => {
          if (!isActive()) this.exitFullscreen(element);
        }).catch(() => {});
      } catch (_) { /* Le lecteur reste à la taille de la fenêtre si le navigateur refuse. */ }
    },
    exitFullscreen(element) {
      if ((document.fullscreenElement || document.webkitFullscreenElement) !== element) return;
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      try { if (exit) Promise.resolve(exit.call(document)).catch(() => {}); } catch (_) {}
    },
    clear() { urls.forEach(value => URL.revokeObjectURL(value)); urls.clear(); },
    thumbnail(file) {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        const source = url(file);
        let done = false;
        const timer = setTimeout(() => finish(new Error('La vidéo ne peut pas être lue. Essayez un fichier MP4 compatible avec cet appareil.')), 20000);
        function finish(error, blob) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          video.onloadedmetadata = video.onloadeddata = video.onseeked = video.onerror = null;
          video.pause(); video.removeAttribute('src'); video.load(); release(source);
          error ? reject(error) : resolve(blob);
        }
        function capture() {
          if (!video.videoWidth) return;
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(960, video.videoWidth);
            canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth);
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => finish(blob ? null : new Error('Impossible de créer la vignette.'), blob), 'image/jpeg', 0.85);
          } catch (error) { finish(error); }
        }
        video.onloadedmetadata = () => {
          if (!Number.isFinite(video.duration) || video.duration <= 0) return finish(new Error('Durée de vidéo invalide.'));
          video.currentTime = Math.min(0.25, video.duration / 2);
        };
        video.onseeked = capture;
        video.onerror = () => finish(new Error('Format vidéo non pris en charge sur cet appareil. Essayez un MP4.'));
        video.src = source;
        video.load();
      });
    }
  };
})();
