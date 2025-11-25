(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('player-status');
    const videoEl = document.getElementById('remote-video');
    const channel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('eyegaze-local-video')
      : null;

    if (!channel || !videoEl) {
      if (statusEl) {
        statusEl.textContent = 'BroadcastChannel non disponible sur ce navigateur.';
      }
      return;
    }

    let timeLimitTimer = null;
    let currentSrc = null;

    const setStatus = (text) => {
      if (statusEl) {
        statusEl.textContent = text;
      }
    };

    const clearTimer = () => {
      if (timeLimitTimer) {
        clearTimeout(timeLimitTimer);
        timeLimitTimer = null;
      }
    };

    const resetVideo = () => {
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
      currentSrc = null;
    };

    const reportStop = (reason) => {
      const position = videoEl.currentTime || 0;
      channel.postMessage({ type: 'video-stopped', src: currentSrc, position, reason });
      clearTimer();
      resetVideo();
      setStatus('Lecture interrompue. En attente d\'un nouveau choix.');
    };

    const requestFullscreen = () => {
      if (!document.fullscreenElement && videoEl.requestFullscreen) {
        videoEl.requestFullscreen().catch(() => {});
      }
    };

    const startPlayback = (resumePosition = 0, timeLimitSeconds = null) => {
      if (resumePosition) {
        try { videoEl.currentTime = resumePosition; } catch {}
      }

      const playPromise = videoEl.play();
      if (playPromise?.catch) {
        playPromise.catch(err => console.error('Erreur de lecture vidéo', err));
      }

      requestFullscreen();

      if (typeof timeLimitSeconds === 'number' && timeLimitSeconds > 0) {
        clearTimer();
        timeLimitTimer = setTimeout(() => reportStop('time-limit'), timeLimitSeconds * 1000);
      }
    };

    channel.addEventListener('message', event => {
      const data = event.data || {};
      if (data.type === 'play-video' && data.src) {
        clearTimer();
        currentSrc = data.src;
        videoEl.src = data.src;
        setStatus('Lecture en cours...');
        if (videoEl.readyState >= 1) {
          startPlayback(data.resumePosition, data.timeLimitSeconds);
        } else {
          videoEl.onloadedmetadata = () => startPlayback(data.resumePosition, data.timeLimitSeconds);
        }
      } else if (data.type === 'stop-video') {
        reportStop('stopped');
      } else if (data.type === 'controller-ready') {
        channel.postMessage({ type: 'player-ready' });
      }
    });

    videoEl.addEventListener('ended', () => {
      clearTimer();
      channel.postMessage({ type: 'video-ended', src: currentSrc });
      resetVideo();
      setStatus('Vidéo terminée. En attente du prochain choix.');
    });

    window.addEventListener('beforeunload', () => {
      channel.postMessage({ type: 'player-unloaded' });
    });

    setStatus('En attente d\'un choix de vidéo...');
    channel.postMessage({ type: 'player-ready' });
  });
})();
