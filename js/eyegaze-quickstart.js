(function(){
  const QUICKSTART_ID = 'eyegazeQuickStart';
  const WRAPPER_ID = 'eyegazeQuickStartWrapper';
  const STYLE_ID = 'eyegazeQuickStartStyles';
  const DWELL_DEFAULT = 1500;

  let observer = null;

  function ensureStyles(){
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${WRAPPER_ID} {
        position: fixed;
        inset: auto 32px 32px auto;
        display: flex;
        justify-content: flex-end;
        pointer-events: none;
        z-index: 1200;
      }
      #${WRAPPER_ID}.hidden { display: none; }
      #${WRAPPER_ID} .eyegaze-quick-start {
        position: relative;
        pointer-events: auto;
        border-radius: 26px;
        border: 2px solid rgba(255,255,255,0.18);
        background: rgba(17,17,17,0.78);
        color: #fff;
        font-weight: 700;
        font-size: 1.05rem;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        overflow: hidden;
        box-shadow: 0 16px 40px rgba(0,0,0,0.35);
        backdrop-filter: blur(8px);
        width: min(150px, 32vw);
        aspect-ratio: 1 / 1;
        padding: 18px;
      }
      #${WRAPPER_ID} .eyegaze-quick-start:focus-visible {
        outline: 3px solid rgba(20,184,166,0.65);
        outline-offset: 3px;
      }
      #${WRAPPER_ID} .eyegaze-quick-start .eyegaze-quick-start-progress {
        position: absolute;
        inset: 10px;
        border-radius: 20px;
        background: radial-gradient(circle at center, rgba(255,64,64,0.7) 0%, rgba(255,32,32,0.7) 35%, rgba(255,32,32,0.45) 100%);
        pointer-events: none;
        transform: scale(0);
        transform-origin: center;
        opacity: 0.92;
        will-change: transform;
      }
      #${WRAPPER_ID} .eyegaze-quick-start .eyegaze-quick-start-text {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        text-align: center;
      }
      #${WRAPPER_ID} .eyegaze-quick-start .eyegaze-quick-start-label {
        font-size: 1.08rem;
        letter-spacing: .04em;
      }
      #${WRAPPER_ID} .eyegaze-quick-start .eyegaze-quick-start-hint {
        font-size: 0.82rem;
        font-weight: 500;
        opacity: 0.85;
      }
      @media (max-width: 600px) {
        #${WRAPPER_ID} {
          inset: auto 18px 18px auto;
        }
        #${WRAPPER_ID} .eyegaze-quick-start {
          padding: 16px;
          font-size: 1rem;
          width: min(132px, 42vw);
          border-radius: 22px;
        }
        #${WRAPPER_ID} .eyegaze-quick-start .eyegaze-quick-start-label {
          font-size: 1rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getDwellTime(){
    const fromSettings = Number(window?.eyegazeSettings?.dwellTime);
    if (Number.isFinite(fromSettings) && fromSettings > 0) return fromSettings;
    return DWELL_DEFAULT;
  }

  function createQuickStart(startButton){
    if (document.getElementById(WRAPPER_ID)) return;

    ensureStyles();

    const wrapper = document.createElement('div');
    wrapper.id = WRAPPER_ID;

    const quickStartBtn = document.createElement('button');
    quickStartBtn.type = 'button';
    quickStartBtn.id = QUICKSTART_ID;
    quickStartBtn.className = 'eyegaze-quick-start';
    const ariaLabels = {
      fr: 'Démarrage rapide (options par défaut)',
      en: 'Quick start (default settings)'
    };

    const textWrap = document.createElement('span');
    textWrap.className = 'eyegaze-quick-start-text';

    const label = document.createElement('span');
    label.className = 'eyegaze-quick-start-label translate';
    label.dataset.fr = 'Go';
    label.dataset.en = 'Quickstart';
    const hint = document.createElement('span');
    hint.className = 'eyegaze-quick-start-hint translate';
    hint.dataset.fr = 'Options par défaut · Survol 1,5 s';
    hint.dataset.en = 'Default settings · Hover 1.5 s';
    function applyInitialLanguage(){
      const lang = (document.documentElement.lang === 'en') ? 'en' : 'fr';
      label.textContent = label.dataset[lang] || label.dataset.fr;
      hint.textContent = hint.dataset[lang] || hint.dataset.fr;
    }
    applyInitialLanguage();

    const progress = document.createElement('span');
    progress.className = 'eyegaze-quick-start-progress';
    progress.setAttribute('aria-hidden', 'true');

    textWrap.append(label, hint);
    quickStartBtn.append(progress, textWrap);
    wrapper.appendChild(quickStartBtn);
    document.body.appendChild(wrapper);

    let activated = false;
    let awaitingTrusted = false;
    let fullscreenAttemptsScheduled = false;
    let fullscreenSucceeded = false;
    let dwellTimeout = null;
    let fallbackHideTimeout = null;
    let langObserver = null;

    function updateAriaLabel(){
      const lang = (document.documentElement.lang === 'en') ? 'en' : 'fr';
      quickStartBtn.setAttribute('aria-label', ariaLabels[lang] || ariaLabels.fr);
    }

    updateAriaLabel();
    if (typeof MutationObserver === 'function') {
      langObserver = new MutationObserver(updateAriaLabel);
      langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }

    function requestFullscreenOn(element){
      if (!element || document.fullscreenElement) {
        if (document.fullscreenElement) fullscreenSucceeded = true;
        return Promise.resolve(document.fullscreenElement ? true : false);
      }
      const request = element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen || element.msRequestFullscreen;
      if (typeof request === 'function') {
        try {
          const result = request.call(element);
          return Promise.resolve(result).then(() => {
            fullscreenSucceeded = true;
            return true;
          }).catch(() => false);
        } catch (err) {
          return Promise.resolve(false);
        }
      }
      return Promise.resolve(false);
    }

    function enterFullscreen(){
      const targets = [document.documentElement, document.body];
      return targets.reduce((chain, element) => {
        return chain.then((succeeded) => {
          if (succeeded || document.fullscreenElement) {
            if (document.fullscreenElement) fullscreenSucceeded = true;
            return true;
          }
          return requestFullscreenOn(element);
        });
      }, Promise.resolve(document.fullscreenElement ? true : false));
    }

    function attemptFullscreenFromEvent(event){
      if (fullscreenSucceeded || document.fullscreenElement) {
        fullscreenSucceeded = true;
        return;
      }
      if (!event || !event.isTrusted) return;
      enterFullscreen().catch(() => {});
    }

    function runNativeStart(){
      try {
        startButton.click();
      } catch (e) {
        startButton.dispatchEvent(new Event('click'));
      }
    }

    function ensureFullscreenAfterActivation(){
      if (fullscreenSucceeded) return;
      if (fullscreenAttemptsScheduled) return;
      fullscreenAttemptsScheduled = true;
      const delays = [0, 120, 360, 900];
      delays.forEach((delay) => {
        window.setTimeout(() => {
          enterFullscreen().catch(() => {});
        }, delay);
      });
    }

    function triggerStart(event){
      const isTrusted = !!(event && event.isTrusted);

      cancelDwell();

      if (!activated) {
        activated = true;
        runNativeStart();
        ensureFullscreenAfterActivation();
      }

      if (isTrusted) {
        awaitingTrusted = false;
        if (fallbackHideTimeout !== null) {
          clearTimeout(fallbackHideTimeout);
          fallbackHideTimeout = null;
        }
        ensureFullscreenAfterActivation();
        hideQuickStart();
        return;
      }

      if (!awaitingTrusted) {
        awaitingTrusted = true;
        enterFullscreen().catch(() => {});
        fallbackHideTimeout = window.setTimeout(() => {
          if (!awaitingTrusted) return;
          awaitingTrusted = false;
          enterFullscreen().catch(() => {});
          hideQuickStart();
        }, 1800);
      }
    }

    function startDwell(){
      if (activated) return;
      const dwellTime = getDwellTime();
      progress.style.transition = 'none';
      progress.style.transform = 'scale(0)';
      progress.offsetWidth; // force reflow
      progress.style.transition = `transform ${dwellTime}ms ease-in-out`;
      progress.style.transform = 'scale(1)';
      if (dwellTimeout !== null) {
        clearTimeout(dwellTimeout);
      }
      dwellTimeout = window.setTimeout(() => { triggerStart(null); }, dwellTime);
    }

    function cancelDwell(){
      if (dwellTimeout !== null) {
        clearTimeout(dwellTimeout);
        dwellTimeout = null;
      }
      progress.style.transition = 'transform 180ms ease-out';
      progress.style.transform = 'scale(0)';
    }

    function hideQuickStart(){
      if (fallbackHideTimeout !== null) {
        clearTimeout(fallbackHideTimeout);
        fallbackHideTimeout = null;
      }
      wrapper.classList.add('hidden');
      if (observer) observer.disconnect();
      if (langObserver) {
        langObserver.disconnect();
        langObserver = null;
      }
    }

    quickStartBtn.addEventListener('pointerenter', (event) => {
      attemptFullscreenFromEvent(event);
      startDwell();
    });
    quickStartBtn.addEventListener('pointerleave', cancelDwell);
    quickStartBtn.addEventListener('pointercancel', cancelDwell);
    quickStartBtn.addEventListener('pointerdown', (event) => {
      attemptFullscreenFromEvent(event);
      cancelDwell();
    });
    quickStartBtn.addEventListener('pointerup', (event) => {
      attemptFullscreenFromEvent(event);
      cancelDwell();
    });
    quickStartBtn.addEventListener('blur', cancelDwell);
    quickStartBtn.addEventListener('click', (event) => {
      attemptFullscreenFromEvent(event);
      triggerStart(event);
    });
    quickStartBtn.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        attemptFullscreenFromEvent(event);
        triggerStart(event);
      }
    });

    startButton.addEventListener('click', hideQuickStart, { once: true });
  }

  function scanForStartButton(){
    if (document.getElementById(WRAPPER_ID)) return;
    const startBtn = document.getElementById('startButton');
    if (startBtn) {
      createQuickStart(startBtn);
    }
  }

  function beginObserving(){
    if (typeof MutationObserver !== 'function') return;
    if (!document.body) return;
    observer = new MutationObserver(scanForStartButton);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scanForStartButton();
      beginObserving();
    });
  } else {
    scanForStartButton();
    beginObserving();
  }
})();
