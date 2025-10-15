(function (global) {
  'use strict';

const DEFAULT_VIDEO = '../videos/africa.mp4';
const DEFAULT_IMAGE = '../images/default_reinforcer.png';
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
  let socialEl;
  let socialMessageEl;
  let socialHintEl;
  let socialProgressFillEl;
  let socialRemainingEl;
  let buttonHandler = null;
  let videoEndedHandler = null;
  let imageTimer = null;
  let socialInterval = null;
  let completionResolver = null;
  let completed = false;

  const config = {
    reinforcerType: 'shortvideo',
    themeData: {},
    onAdvance: null,
    imageDisplayDurationMs: 10000,
    socialDurationMs: 30000,
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
      #reinforcerOverlay #socialReinforcer {
        position: absolute;
        inset: 0;
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 40px 20px;
        text-align: center;
        color: #0f172a;
        background: linear-gradient(135deg, #f8fdff 0%, #e0f2ff 55%, #ccfbf1 100%);
      }
      #reinforcerOverlay #socialReinforcer .social-content {
        max-width: 680px;
        width: min(90vw, 680px);
        display: flex;
        flex-direction: column;
        gap: 32px;
        background: rgba(255, 255, 255, 0.85);
        border-radius: 28px;
        padding: clamp(32px, 5vw, 48px);
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
        border: 2px solid rgba(20, 184, 166, 0.2);
      }
      #reinforcerOverlay #socialReinforcer .social-message {
        font-size: clamp(2rem, 5vw, 3.5rem);
        font-weight: 700;
        letter-spacing: 0.02em;
        color: #0f766e;
        text-shadow: 0 4px 16px rgba(45, 212, 191, 0.25);
      }
      #reinforcerOverlay #socialReinforcer .progress-visual {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      #reinforcerOverlay #socialReinforcer .progress-track {
        width: 100%;
        height: 18px;
        border-radius: 12px;
        background: rgba(14, 165, 233, 0.18);
        overflow: hidden;
        border: 2px solid rgba(14, 165, 233, 0.3);
        box-shadow: inset 0 0 12px rgba(14, 165, 233, 0.15);
      }
      #reinforcerOverlay #socialReinforcer .progress-fill {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #38bdf8, #14b8a6);
        transition: width 0.2s linear;
      }
      #reinforcerOverlay #socialReinforcer .progress-hint {
        font-size: clamp(1rem, 2.5vw, 1.4rem);
        font-weight: 600;
        color: #0369a1;
      }
      #reinforcerOverlay #socialReinforcer .progress-remaining {
        font-weight: 700;
        color: #0f172a;
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
    if (!socialEl) {
      socialEl = overlayEl.querySelector('#socialReinforcer');
      if (!socialEl) {
        socialEl = document.createElement('div');
        socialEl.id = 'socialReinforcer';
        socialEl.setAttribute('aria-live', 'polite');
        socialEl.innerHTML = `
          <div class="social-content">
            <p class="social-message">Bravo :) tu as fini un panier !</p>
            <div class="progress-visual">
              <div class="progress-track" role="presentation">
                <div class="progress-fill"></div>
              </div>
              <p class="progress-hint">Prochain jeu dans <span class="progress-remaining">30</span> secondes</p>
            </div>
          </div>
        `;
        overlayEl.appendChild(socialEl);
      }
      socialMessageEl = socialEl.querySelector('.social-message');
      socialHintEl = socialEl.querySelector('.progress-hint');
      socialProgressFillEl = socialEl.querySelector('.progress-fill');
      socialRemainingEl = socialEl.querySelector('.progress-remaining');
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

  function clearSocialTimer() {
    if (socialInterval) {
      clearInterval(socialInterval);
      socialInterval = null;
    }
  }

  function hideOverlay() {
    clearImageTimer();
    clearSocialTimer();
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
    if (socialEl) {
      socialEl.style.display = 'none';
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
    clearSocialTimer();
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
    clearSocialTimer();
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

  function showSocial(options) {
    clearImageTimer();
    clearSocialTimer();
    cleanupButtonListener();
    cleanupVideoListener();

    if (!overlayEl || !socialEl) {
      return Promise.resolve();
    }

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
      buttonEl.style.display = 'none';
    }

    const duration = options && Number.isFinite(options.socialDurationMs)
      ? options.socialDurationMs
      : Number.isFinite(config.socialDurationMs)
        ? config.socialDurationMs
        : 30000;
    const intervalDuration = options && Number.isFinite(options.socialUpdateIntervalMs)
      ? options.socialUpdateIntervalMs
      : 200;

    const message = options && options.socialMessage
      ? options.socialMessage
      : 'Bravo :) tu as fini un panier !';
    const hintPrefix = options && options.socialHintPrefix
      ? options.socialHintPrefix
      : 'Prochain jeu dans';
    const hintSuffix = options && options.socialHintSuffix
      ? options.socialHintSuffix
      : 'secondes';

    if (socialMessageEl) {
      socialMessageEl.textContent = message;
    }
    if (socialHintEl) {
      const remainingMarkup = `${Math.max(Math.ceil(duration / 1000), 0)}`;
      socialHintEl.innerHTML = `${hintPrefix} <span class="progress-remaining">${remainingMarkup}</span> ${hintSuffix}`;
      socialRemainingEl = socialHintEl.querySelector('.progress-remaining');
    }
    if (socialProgressFillEl) {
      socialProgressFillEl.style.width = '0%';
    }

    const background = options && options.socialBackground
      ? options.socialBackground
      : 'linear-gradient(135deg, #f8fdff 0%, #e0f2ff 55%, #ccfbf1 100%)';
    overlayEl.style.background = background;

    socialEl.style.display = 'flex';

    const startTime = Date.now();

    const promise = new Promise((resolve) => {
      completionResolver = resolve;
    });

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(duration - elapsed, 0);
      const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;

      if (socialProgressFillEl) {
        socialProgressFillEl.style.width = `${progress * 100}%`;
      }
      if (socialRemainingEl) {
        socialRemainingEl.textContent = `${Math.max(Math.ceil(remaining / 1000), 0)}`;
      }

      if (remaining <= 0) {
        clearSocialTimer();
        complete();
      }
    };

    updateProgress();
    socialInterval = window.setInterval(updateProgress, intervalDuration);

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
    if (type === 'social') {
      return showSocial(options);
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
    config.socialDurationMs = Number.isFinite(opts.socialDurationMs)
      ? opts.socialDurationMs
      : 30000;
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
