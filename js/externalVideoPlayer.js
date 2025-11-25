(function() {
  const videoEl = document.getElementById('player-video');
  const readyButton = document.getElementById('ready-button');
  const readyOverlay = document.getElementById('ready-overlay');
  const waitingMessage = document.getElementById('waiting-message');
  const videoBridgeChannel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('eyegaze-video-bridge')
    : null;

  let hasUserReadied = false;
  let currentVideoUrl = null;
  let pendingVideo = null;

  function updateWaitingMessage(text) {
    if (waitingMessage) {
      waitingMessage.textContent = text;
    }
  }

  async function ensureFullscreen() {
    if (document.fullscreenElement) return;
    const el = document.documentElement;
    if (el.requestFullscreen) {
      try { await el.requestFullscreen(); } catch (err) { console.warn(err); }
    }
  }

  function markReady() {
    hasUserReadied = true;
    if (readyOverlay) {
      readyOverlay.style.display = 'none';
    }
    if (videoBridgeChannel) {
      videoBridgeChannel.postMessage({ type: 'player-ready' });
    }
    if (pendingVideo) {
      playIncomingVideo(pendingVideo.videoUrl, pendingVideo.startAt || 0);
      pendingVideo = null;
    }
  }

  function resetVideoView() {
    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
      videoEl.style.display = 'none';
    }
    currentVideoUrl = null;
    updateWaitingMessage("En attente d'une sélection...");
  }

  function playIncomingVideo(videoUrl, startAt = 0) {
    if (!videoEl || !videoUrl) return;
    currentVideoUrl = videoUrl;
    videoEl.style.display = 'block';
    videoEl.src = videoUrl;
    videoEl.load();
    videoEl.onloadedmetadata = () => {
      if (startAt) {
        try { videoEl.currentTime = startAt; } catch {}
      }
      const playPromise = videoEl.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
      updateWaitingMessage('Lecture en cours...');
    };
  }

  function stopIncomingVideo(notify = true) {
    if (!currentVideoUrl || !videoEl) {
      resetVideoView();
      return;
    }
    try { videoEl.pause(); } catch {}
    if (notify && videoBridgeChannel) {
      videoBridgeChannel.postMessage({
        type: 'video-stopped',
        videoUrl: currentVideoUrl,
        currentTime: videoEl.currentTime || 0
      });
    }
    resetVideoView();
  }

  if (videoEl) {
    videoEl.addEventListener('ended', () => {
      if (videoBridgeChannel) {
        videoBridgeChannel.postMessage({
          type: 'video-ended',
          videoUrl: currentVideoUrl,
          currentTime: videoEl.currentTime || 0
        });
      }
      resetVideoView();
    });
  }

  if (readyButton) {
    readyButton.addEventListener('click', async () => {
      await ensureFullscreen();
      markReady();
    });
  }

  if (videoBridgeChannel) {
    videoBridgeChannel.addEventListener('message', (event) => {
      const data = event.data || {};
      switch (data.type) {
        case 'play-video': {
          if (!hasUserReadied) {
            pendingVideo = { videoUrl: data.videoUrl, startAt: data.startAt || 0 };
            updateWaitingMessage('Appuyer sur "Prêt ?" pour commencer la lecture');
            return;
          }
          ensureFullscreen();
          playIncomingVideo(data.videoUrl, data.startAt || 0);
          break;
        }
        case 'stop-video': {
          if (!data.videoUrl || data.videoUrl === currentVideoUrl) {
            stopIncomingVideo(true);
          }
          break;
        }
        case 'request-media-list': {
          // This page does not own media; ignore.
          break;
        }
        default:
          break;
      }
    });

    videoBridgeChannel.postMessage({ type: 'request-media-list' });
  }

  updateWaitingMessage("En attente d'une sélection...");
})();
