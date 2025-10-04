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
        inset: auto 0 32px 0;
        display: flex;
        justify-content: center;
        pointer-events: none;
        z-index: 1200;
      }
      #${WRAPPER_ID}.hidden { display: none; }
      #${WRAPPER_ID} .eyegaze-quick-start {
        position: relative;
        pointer-events: auto;
        padding: 18px 28px;
        border-radius: 16px;
        border: 2px solid rgba(255,255,255,0.18);
        background: rgba(17,17,17,0.75);
        color: #fff;
        font-weight: 700;
        font-size: 1.05rem;
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        overflow: hidden;
        box-shadow: 0 16px 40px rgba(0,0,0,0.35);
        backdrop-filter: blur(6px);
        min-width: min(320px, 70vw);
      }
      #${WRAPPER_ID} .eyegaze-quick-start:focus-visible {
        outline: 3px solid rgba(20,184,166,0.65);
        outline-offset: 3px;
      }
      #${WRAPPER_ID} .eyegaze-quick-start .eyegaze-quick-start-progress {
        position: absolute;
        inset: 6px;
        border-radius: 12px;
        background: rgba(255,64,64,0.55);
        width: 0%;
        height: 0%;
        pointer-events: none;
        transform-origin: center;
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
        font-size: 1.05rem;
        letter-spacing: .02em;
      }
      #${WRAPPER_ID} .eyegaze-quick-start .eyegaze-quick-start-hint {
        font-size: 0.85rem;
        font-weight: 500;
        opacity: 0.85;
      }
      @media (max-width: 600px) {
        #${WRAPPER_ID} {
          inset: auto 0 18px 0;
        }
        #${WRAPPER_ID} .eyegaze-quick-start {
          padding: 16px 22px;
          font-size: 1rem;
          min-width: min(280px, 90vw);
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
    label.dataset.fr = 'Démarrage rapide';
    label.dataset.en = 'Quick start';
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

    let dwellTimeout = null;
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

    function triggerStart(){
      cancelDwell();
      try { startButton.click(); } catch (e) { startButton.dispatchEvent(new Event('click')); }
      hideQuickStart();
    }

    function startDwell(){
      cancelDwell();
      const dwellTime = getDwellTime();
      progress.style.transition = 'none';
      progress.style.width = '0%';
      progress.style.height = '0%';
      progress.offsetWidth; // force reflow
      progress.style.transition = `width ${dwellTime}ms linear, height ${dwellTime}ms linear`;
      progress.style.width = '100%';
      progress.style.height = '100%';
      dwellTimeout = window.setTimeout(triggerStart, dwellTime);
    }

    function cancelDwell(){
      if (dwellTimeout !== null) {
        clearTimeout(dwellTimeout);
        dwellTimeout = null;
      }
      progress.style.transition = 'width 150ms ease-out, height 150ms ease-out';
      progress.style.width = '0%';
      progress.style.height = '0%';
    }

    function hideQuickStart(){
      wrapper.classList.add('hidden');
      if (observer) observer.disconnect();
      if (langObserver) {
        langObserver.disconnect();
        langObserver = null;
      }
    }

    quickStartBtn.addEventListener('pointerenter', startDwell);
    quickStartBtn.addEventListener('pointerleave', cancelDwell);
    quickStartBtn.addEventListener('pointercancel', cancelDwell);
    quickStartBtn.addEventListener('pointerup', cancelDwell);
    quickStartBtn.addEventListener('blur', cancelDwell);
    quickStartBtn.addEventListener('click', triggerStart);

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
