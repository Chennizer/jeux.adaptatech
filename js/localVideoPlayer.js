(function() {
  const CHANNEL_NAME = 'eyegaze-local-video';
  const videoElement = document.getElementById('player-video');
  const sourceElement = document.getElementById('player-video-source');
  const statusElement = document.getElementById('player-status');
  const startButton = document.getElementById('player-start');
  const containerElement = document.getElementById('player-container');
  const youtubeContainer = document.getElementById('player-youtube');

  let activeObjectUrl = '';
  let timeLimitTimeout = null;
  let currentChoiceKey = '';
  let youtubePlayer = null;
  let youtubeApiReady = null;

  function updateStatus(message) {
    if (!statusElement) return;
    statusElement.textContent = message;
  }

  function toggleStartButton(visible) {
    if (!startButton) return;
    startButton.style.display = visible ? 'block' : 'none';
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

  function isYouTubeUrl(url = '') {
    return /^(https?:\/\/)?(www\.|m\.)?((youtube\.com\/)|(youtu\.be\/))/i.test(url);
  }

  function getYouTubeId(url = '') {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return u.pathname.slice(1);
      }
      const id = u.searchParams.get('v');
      if (id) return id;
      const match = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : '';
    } catch (err) {
      console.error(err);
      return '';
    }
  }

  function loadYouTubeApi() {
    if (youtubeApiReady) return youtubeApiReady;
    youtubeApiReady = new Promise(resolve => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      window.onYouTubeIframeAPIReady = () => resolve();
      document.head.appendChild(tag);
    });
    return youtubeApiReady;
  }

  async function requestFullscreen() {
    const target = document.documentElement;
    if (!target.requestFullscreen) return;
    try {
      await target.requestFullscreen();
      toggleStartButton(false);
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

  function setReadyView(message = 'Ready') {
    clearTimers();
    if (videoElement) {
      videoElement.pause();
      videoElement.removeAttribute('src');
      sourceElement.removeAttribute('src');
      videoElement.load();
      videoElement.style.display = 'none';
    }
    if (youtubePlayer && typeof youtubePlayer.stopVideo === 'function') {
      try { youtubePlayer.stopVideo(); } catch (err) { console.error(err); }
    }
    if (youtubeContainer) {
      youtubeContainer.style.display = 'none';
    }
    revokeActiveUrl();
    currentChoiceKey = '';
    updateStatus(message);
    if (containerElement) {
      containerElement.style.background = '#000';
    }
    toggleStartButton(!document.fullscreenElement);
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

  async function playHtml5Video(channel, message, playableUrl) {
    clearTimers();
    revokeActiveUrl();
    toggleStartButton(false);
    currentChoiceKey = message.choiceKey || '';
    activeObjectUrl = playableUrl;
    sourceElement.src = playableUrl;
    if (youtubeContainer) youtubeContainer.style.display = 'none';
    videoElement.style.display = 'block';
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
          setReadyView();
        }, message.timeLimit * 1000);
      }
    };

    videoElement.onended = () => {
      clearTimers();
      notifyComplete(channel, 'ended', 0);
      setReadyView();
    };

    videoElement.onerror = () => {
      clearTimers();
      updateStatus('Une erreur est survenue pendant la lecture.');
      notifyComplete(channel, 'error', 0);
      setReadyView();
    };
  }

  async function playYouTubeVideo(channel, message) {
    clearTimers();
    revokeActiveUrl();
    toggleStartButton(false);
    currentChoiceKey = message.choiceKey || '';
    const videoUrl = message.videoUrl || '';
    const videoId = getYouTubeId(videoUrl);
    if (!youtubeContainer || !videoId) {
      updateStatus('Impossible de lire la vidéo sélectionnée.');
      notifyComplete(channel, 'error', 0);
      return;
    }

    if (videoElement) {
      videoElement.pause();
      videoElement.style.display = 'none';
    }
    youtubeContainer.style.display = 'block';

    await loadYouTubeApi();

    const startSeconds = typeof message.resumeTime === 'number' ? Math.max(0, message.resumeTime) : 0;

    const onStateChange = (event) => {
      if (event.data === YT.PlayerState.ENDED) {
        clearTimers();
        notifyComplete(channel, 'ended', 0);
        setReadyView();
      }
    };

    const onError = () => {
      clearTimers();
      updateStatus('Une erreur est survenue pendant la lecture.');
      notifyComplete(channel, 'error', 0);
      setReadyView();
    };

    if (!youtubePlayer) {
      youtubePlayer = new YT.Player(youtubeContainer, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, controls: 0, autoplay: 1, start: startSeconds },
        events: {
          onReady: () => {
            try { youtubePlayer.playVideo(); } catch (err) { console.error(err); }
          },
          onStateChange,
          onError
        }
      });
    } else {
      try { youtubePlayer.addEventListener('onStateChange', onStateChange); } catch {}
      try { youtubePlayer.addEventListener('onError', onError); } catch {}
      youtubePlayer.loadVideoById({ videoId, startSeconds });
    }

    if (message.timeLimit) {
      timeLimitTimeout = setTimeout(() => {
        let resumeTime = 0;
        try { resumeTime = typeof youtubePlayer?.getCurrentTime === 'function' ? youtubePlayer.getCurrentTime() : 0; } catch {}
        try { youtubePlayer.pauseVideo(); } catch {}
        notifyComplete(channel, 'timeout', resumeTime);
        setReadyView();
      }, message.timeLimit * 1000);
    }
  }

  async function handlePlayMessage(channel, message) {
    updateStatus('Préparation de la vidéo…');

    if (isYouTubeUrl(message.videoUrl)) {
      await playYouTubeVideo(channel, message);
      return;
    }

    const playableUrl = await toPlayableUrl(message);
    if (!playableUrl) {
      updateStatus('Impossible de lire la vidéo sélectionnée.');
      notifyComplete(channel, 'error', 0);
      return;
    }

    await playHtml5Video(channel, message, playableUrl);
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

  if (startButton) {
    startButton.addEventListener('click', () => {
      requestFullscreen();
      updateStatus('Ready');
    });
  }

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      toggleStartButton(false);
    } else {
      toggleStartButton(true);
    }
  });

  window.addEventListener('beforeunload', revokeActiveUrl);

  channel.postMessage({ type: 'player-ready' });
  setReadyView();
})();
