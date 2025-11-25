(function() {
  const CHANNEL_NAME = 'eyegaze-local-video';
  const videoElement = document.getElementById('player-video');
  const sourceElement = document.getElementById('player-video-source');
  const statusElement = document.getElementById('player-status');

  let activeObjectUrl = '';
  let timeLimitTimeout = null;
  let currentChoiceKey = '';

  function updateStatus(message) {
    if (!statusElement) return;
    statusElement.textContent = message;
  }

  function revokeActiveUrl() {
    if (activeObjectUrl && activeObjectUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(activeObjectUrl); } catch (err) { console.error(err); }
    }
    activeObjectUrl = '';
  }

  async function toPlayableUrl(message) {
    if (message.fileHandle) {
      const file = await message.fileHandle.getFile();
      return URL.createObjectURL(file);
    }
    if (message.file instanceof File) {
      return URL.createObjectURL(message.file);
    }
    if (typeof message.videoUrl === 'string') {
      return message.videoUrl;
    }
    return '';
  }

  async function requestFullscreen() {
    const target = document.documentElement;
    if (!target.requestFullscreen) return;
    try {
      await target.requestFullscreen();
    } catch (err) {
      console.error(err);
    }
  }

  function clearTimers() {
    if (timeLimitTimeout) {
      clearTimeout(timeLimitTimeout);
      timeLimitTimeout = null;
    }
  }

  function notifyComplete(channel, reason, resumeTime) {
    if (!channel) return;
    channel.postMessage({
      type: 'playback-complete',
      reason,
      resumeTime,
      choiceKey: currentChoiceKey
    });
  }

  async function handlePlayMessage(channel, message) {
    clearTimers();
    revokeActiveUrl();
    currentChoiceKey = message.choiceKey || '';
    updateStatus('Préparation de la vidéo…');

    const playableUrl = await toPlayableUrl(message);
    if (!playableUrl) {
      updateStatus('Impossible de lire la vidéo sélectionnée.');
      notifyComplete(channel, 'error', 0);
      return;
    }

    activeObjectUrl = playableUrl;
    sourceElement.src = playableUrl;
    videoElement.load();

    videoElement.onloadedmetadata = () => {
      try {
        if (typeof message.resumeTime === 'number' && message.resumeTime > 0) {
          videoElement.currentTime = message.resumeTime;
        }
      } catch (err) {
        console.error(err);
      }
      videoElement.play().catch(err => console.error(err));
      requestFullscreen();

      if (message.timeLimit) {
        timeLimitTimeout = setTimeout(() => {
          const resumeTime = videoElement.currentTime;
          videoElement.pause();
          notifyComplete(channel, 'timeout', resumeTime);
        }, message.timeLimit * 1000);
      }
    };

    videoElement.onended = () => {
      clearTimers();
      notifyComplete(channel, 'ended', 0);
    };

    videoElement.onerror = () => {
      clearTimers();
      updateStatus('Une erreur est survenue pendant la lecture.');
      notifyComplete(channel, 'error', 0);
    };
  }

  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;
  if (!channel) {
    updateStatus('BroadcastChannel non disponible.');
    return;
  }

  channel.addEventListener('message', async (event) => {
    const data = event.data || {};
    if (data.type === 'play-video') {
      await handlePlayMessage(channel, data);
    } else if (data.type === 'library-summary' && data.choices?.length) {
      updateStatus(`${data.choices.length} vidéo(s) disponibles.`);
    }
  });

  window.addEventListener('beforeunload', revokeActiveUrl);

  channel.postMessage({ type: 'player-ready' });
  updateStatus('En attente du choix vidéo…');
})();
