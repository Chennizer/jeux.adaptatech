(function (global) {
  'use strict';

  const DEFAULT_VIDEO = '../../videos/africa.mp4';
  const DEFAULT_IMAGE = '../../images/default_reinforcer.png';
  const DEFAULT_BUTTON_LABELS = {
    video: 'Voir la vidéo de renforcement',
    image: 'Continuer'
  };
  const STYLE_ID = 'reinforcer-overlay-styles';

  let overlayEl;
  let buttonEl;
  let videoEl;
  let sourceEl;
  let imageEl;
  let coverEl;
  let buttonHandler = null;
  let videoEndedHandler = null;
  let imageTimer = null;
  let completionResolver = null;
  let completed = false;

  const config = {
    reinforcerType: 'shortvideo',
    themeData: {},
    onAdvance: null,
    imageDisplayDurationMs: 10000,
    buttonLabels: DEFAULT_BUTTON_LABELS
  };

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = `
      #reinforcerOverlay {
        position: fixed;
        inset: 0;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        gap: 20px;
        background: rgba(0, 0, 0, 0.85);
        z-index: 9999;
      }
      #reinforcerOverlay.show {
        display: flex;
      }
      #reinforcerOverlay #reinforcerButton {
        margin-bottom: 20px;
        width: 40vw;
        height: 40vw;
        max-width: 400px;
        max-height: 400px;
        background: none;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        outline: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8em;
        line-height: 1;
        transition: transform 0.2s ease;
      }
      #reinforcerOverlay #reinforcerButton::before {
        content: '😀';
        display: block;
      }
      #reinforcerOverlay #reinforcerButton:hover {
        transform: scale(1.25);
      }
      #reinforcerOverlay #reinforcerButton:active {
        transform: scale(0.8);
      }
      #reinforcerOverlay #reinforcerButton[data-image-button="true"] {
        width: auto;
        height: auto;
        max-width: none;
        max-height: none;
        padding: 1rem 2.5rem;
        font-size: 2.5rem;
        border-radius: 999px;
        background: #ffffff;
        color: #222222;
        border: 3px solid #ffffff;
        box-shadow: 0 0 25px rgba(255, 255, 255, 0.35);
      }
      #reinforcerOverlay #reinforcerButton[data-image-button="true"]::before {
        content: '';
        display: none;
      }
      #reinforcerOverlay #reinforcerVideo,
      #reinforcerOverlay #reinforcerImage {
        display: none;
        width: 90%;
        max-width: 1100px;
        max-height: 80vh;
        background: #000;
        border: 3px solid #fff;
        border-radius: 10px;
        object-fit: contain;
      }
      #reinforcerOverlay #reinforcerVideo {
        outline: none;
      }
      #reinforcerOverlay #reinforcerVideo::-webkit-media-controls {
        display: none !important;
      }
      #reinforcerOverlay #videoOverlayCover {
        display: none;
        position: absolute;
        inset: 0;
        background: transparent;
        pointer-events: auto;
        z-index: 10;
      }
    `;
    document.head.appendChild(styleEl);
  }

  function ensureOverlayElements() {
    if (!overlayEl) {
      overlayEl = document.getElementById('reinforcerOverlay');
      if (!overlayEl) {
        overlayEl = document.createElement('div');
        overlayEl.id = 'reinforcerOverlay';
        overlayEl.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlayEl);
      }
    }
    if (!buttonEl) {
      buttonEl = overlayEl.querySelector('#reinforcerButton');
      if (!buttonEl) {
        buttonEl = document.createElement('button');
        buttonEl.id = 'reinforcerButton';
        buttonEl.type = 'button';
        buttonEl.setAttribute('aria-label', DEFAULT_BUTTON_LABELS.video);
        overlayEl.appendChild(buttonEl);
      }
    }
    if (!videoEl) {
      videoEl = overlayEl.querySelector('#reinforcerVideo');
      if (!videoEl) {
        videoEl = document.createElement('video');
        videoEl.id = 'reinforcerVideo';
        videoEl.setAttribute('playsinline', '');
        videoEl.setAttribute('webkit-playsinline', '');
        videoEl.setAttribute('disablepictureinpicture', '');
        videoEl.setAttribute('controlslist', 'nodownload noremoteplayback');
        videoEl.preload = 'auto';
        overlayEl.appendChild(videoEl);
      }
    }
    if (!sourceEl) {
      sourceEl = videoEl.querySelector('#reinforcerVideoSource');
      if (!sourceEl) {
        sourceEl = document.createElement('source');
        sourceEl.id = 'reinforcerVideoSource';
        sourceEl.type = 'video/mp4';
        videoEl.appendChild(sourceEl);
      }
    }
    if (!imageEl) {
      imageEl = overlayEl.querySelector('#reinforcerImage');
      if (!imageEl) {
        imageEl = document.createElement('img');
        imageEl.id = 'reinforcerImage';
        imageEl.alt = 'Renforcement visuel';
        overlayEl.appendChild(imageEl);
      }
    }
    if (!coverEl) {
      coverEl = overlayEl.querySelector('#videoOverlayCover');
      if (!coverEl) {
        coverEl = document.createElement('div');
        coverEl.id = 'videoOverlayCover';
        overlayEl.appendChild(coverEl);
      }
    }
    overlayEl.style.position = 'fixed';
  }

  function selectRandom(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }
    const index = Math.floor(Math.random() * items.length);
    return items[index];
  }

  function getVideoSrc() {
    const videos = config.themeData && Array.isArray(config.themeData.reinforcerVideos)
      ? config.themeData.reinforcerVideos
      : [];
    const selected = selectRandom(videos);
    return selected || DEFAULT_VIDEO;
  }

  function getImageSrc() {
    const images = config.themeData && Array.isArray(config.themeData.images)
      ? config.themeData.images
      : [];
    const selected = selectRandom(images);
    return selected || DEFAULT_IMAGE;
  }

  function cleanupButtonListener() {
    if (buttonEl && buttonHandler) {
      buttonEl.removeEventListener('click', buttonHandler);
    }
    buttonHandler = null;
  }

  function cleanupVideoListener() {
    if (videoEl && videoEndedHandler) {
      videoEl.removeEventListener('ended', videoEndedHandler);
    }
    videoEndedHandler = null;
  }

  function clearImageTimer() {
    if (imageTimer) {
      clearTimeout(imageTimer);
      imageTimer = null;
    }
  }

  function hideOverlay() {
    clearImageTimer();
    cleanupButtonListener();
    cleanupVideoListener();
    if (videoEl) {
      videoEl.pause();
      videoEl.currentTime = 0;
      videoEl.style.display = 'none';
    }
    if (imageEl) {
      imageEl.style.display = 'none';
    }
    if (coverEl) {
      coverEl.style.display = 'none';
    }
    if (buttonEl) {
      buttonEl.style.display = 'flex';
    }
    if (overlayEl) {
      overlayEl.style.display = 'none';
      overlayEl.classList.remove('show');
      overlayEl.style.background = 'rgba(0, 0, 0, 0.85)';
      overlayEl.setAttribute('aria-hidden', 'true');
    }
    completed = false;
  }

  function complete() {
    if (completed) {
      return;
    }
    completed = true;
    hideOverlay();
    if (typeof config.onAdvance === 'function') {
      config.onAdvance();
    }
    if (completionResolver) {
      completionResolver();
      completionResolver = null;
    }
  }

  function showVideo(options) {
    clearImageTimer();
    if (!buttonEl || !videoEl || !sourceEl || !coverEl) {
      return Promise.resolve();
    }

    const labels = Object.assign({}, DEFAULT_BUTTON_LABELS, config.buttonLabels, options && options.buttonLabels);
    const buttonLabel = options && options.buttonLabel ? options.buttonLabel : labels.video;
    buttonEl.textContent = '';
    buttonEl.removeAttribute('data-image-button');
    buttonEl.setAttribute('aria-label', buttonLabel);
    buttonEl.dataset.type = 'video';
    buttonEl.style.display = 'flex';

    const src = options && options.videoSrc ? options.videoSrc : getVideoSrc();
    if (sourceEl.getAttribute('src') !== src) {
      sourceEl.setAttribute('src', src);
      videoEl.load();
    }

    videoEl.style.display = 'none';
    imageEl.style.display = 'none';
    coverEl.style.display = 'none';

    cleanupButtonListener();
    cleanupVideoListener();

    const background = options && options.background ? options.background : 'rgba(0, 0, 0, 0.85)';
    overlayEl.style.background = background;

    const playBackground = options && options.playbackBackground ? options.playbackBackground : '#000';

    const promise = new Promise((resolve) => {
      completionResolver = resolve;
    });

    buttonHandler = function () {
      buttonEl.style.display = 'none';
      overlayEl.style.background = playBackground;
      coverEl.style.display = 'block';
      videoEl.style.display = 'block';
      videoEl.currentTime = 0;
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          console.error('Reinforcer video play failed:', error);
          buttonEl.style.display = 'flex';
          overlayEl.style.background = background;
          coverEl.style.display = 'none';
          videoEl.pause();
          videoEl.currentTime = 0;
          videoEl.style.display = 'none';
        });
      }
    };
    buttonEl.addEventListener('click', buttonHandler);

    videoEndedHandler = function () {
      complete();
    };
    videoEl.addEventListener('ended', videoEndedHandler, { once: true });

    return promise;
  }

  function showImage(options) {
    clearImageTimer();
    if (!buttonEl || !imageEl) {
      return Promise.resolve();
    }

    const labels = Object.assign({}, DEFAULT_BUTTON_LABELS, config.buttonLabels, options && options.buttonLabels);
    const buttonLabel = options && options.buttonLabel ? options.buttonLabel : labels.image;
    buttonEl.textContent = buttonLabel;
    buttonEl.dataset.type = 'image';
    buttonEl.setAttribute('data-image-button', 'true');
    buttonEl.setAttribute('aria-label', buttonLabel);
    buttonEl.style.display = 'flex';

    if (videoEl) {
      videoEl.pause();
      videoEl.currentTime = 0;
      videoEl.style.display = 'none';
    }
    if (coverEl) {
      coverEl.style.display = 'none';
    }

    const src = options && options.imageSrc ? options.imageSrc : getImageSrc();
    imageEl.src = src;
    imageEl.style.display = 'block';

    const background = options && options.background ? options.background : 'rgba(0, 0, 0, 0.85)';
    overlayEl.style.background = background;

    const promise = new Promise((resolve) => {
      completionResolver = resolve;
    });

    cleanupButtonListener();
    buttonHandler = function () {
      clearImageTimer();
      complete();
    };
    buttonEl.addEventListener('click', buttonHandler);

    const autoAdvance = options && Object.prototype.hasOwnProperty.call(options, 'autoAdvance')
      ? options.autoAdvance
      : true;
    const duration = options && Number.isFinite(options.imageDisplayDurationMs)
      ? options.imageDisplayDurationMs
      : config.imageDisplayDurationMs;
    if (autoAdvance && duration > 0) {
      imageTimer = window.setTimeout(() => {
        complete();
      }, duration);
    }

    return promise;
  }

  function show(options) {
    ensureOverlayElements();
    overlayEl.style.display = 'flex';
    overlayEl.classList.add('show');
    overlayEl.setAttribute('aria-hidden', 'false');
    completed = false;

    const type = options && options.reinforcerType ? options.reinforcerType : config.reinforcerType;
    if (type === 'image') {
      return showImage(options);
    }
    return showVideo(options);
  }

  function init(options) {
    const opts = options || {};
    config.reinforcerType = opts.reinforcerType || 'shortvideo';
    config.themeData = opts.themeData || {};
    config.onAdvance = typeof opts.onAdvance === 'function' ? opts.onAdvance : null;
    config.imageDisplayDurationMs = Number.isFinite(opts.imageDisplayDurationMs)
      ? opts.imageDisplayDurationMs
      : 10000;
    config.buttonLabels = Object.assign({}, DEFAULT_BUTTON_LABELS, opts.buttonLabels || {});

    injectStyles();
    ensureOverlayElements();
    hideOverlay();

    return {
      show,
      hide: hideOverlay,
      getElements: function () {
        ensureOverlayElements();
        return {
          overlay: overlayEl,
          button: buttonEl,
          video: videoEl,
          image: imageEl,
          cover: coverEl
        };
      }
    };
  }

  global.reinforcerOverlay = {
    init
  };
})(window);
