window.eyegazeSettings = {
  dwellTime: parseInt(localStorage.getItem('eyegazeDwellTime')) || 1500,
  sfxMuted: false,
  sfxVolume: 50,
  hideOverlay: function() {
    const overlay = document.getElementById('game-options');
    if (overlay) overlay.style.display = 'none';
  }
};

function getCurrentSiteLanguage(){
  const htmlLang = document.documentElement.lang;
  if (htmlLang === 'en' || htmlLang === 'fr') return htmlLang;
  try {
    const stored = localStorage.getItem('siteLanguage');
    if (stored === 'en' || stored === 'fr') return stored;
  } catch (e) {}
  return 'fr';
}

function initEyegazeMenu() {
  const dwellSlider = document.getElementById('dwellTimeSlider');
  const dwellVal = document.getElementById('dwellTimeVal');
  const muteSFX = document.getElementById('muteSFX');
  const sfxSlider = document.getElementById('sfxVol');
  const sfxVal = document.getElementById('sfxVolVal');

  if (dwellSlider && dwellVal) {
    const initial = eyegazeSettings.dwellTime;
    dwellSlider.value = initial;
    dwellVal.textContent = initial;
    dwellSlider.addEventListener('input', e => {
      const val = parseInt(e.target.value);
      eyegazeSettings.dwellTime = val;
      dwellVal.textContent = val;
      localStorage.setItem('eyegazeDwellTime', val);
    });
  }

  if (muteSFX) {
    muteSFX.addEventListener('change', e => {
      eyegazeSettings.sfxMuted = e.target.checked;
    });
  }

  if (sfxSlider && sfxVal) {
    sfxSlider.value = eyegazeSettings.sfxVolume;
    sfxVal.textContent = sfxSlider.value;
    sfxSlider.addEventListener('input', e => {
      const val = parseInt(e.target.value);
      eyegazeSettings.sfxVolume = val;
      sfxVal.textContent = val;
    });
  }
}

function initQuickStartButton(){
  if (document.body?.dataset?.disableQuickStart === 'true') return;
  const startButton = document.getElementById('startButton');
  if (!startButton) return;
  if (document.getElementById('quickStartButton')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'quick-start-wrapper';
  wrapper.setAttribute('role', 'presentation');

  const quickBtn = document.createElement('button');
  quickBtn.type = 'button';
  quickBtn.id = 'quickStartButton';
  quickBtn.className = 'button quick-start-button translate';
  quickBtn.setAttribute('data-fr', 'Démarrage rapide');
  quickBtn.setAttribute('data-en', 'Quick start');
  quickBtn.setAttribute('aria-live', 'polite');

  const initialLang = getCurrentSiteLanguage();
  const initialLabel = quickBtn.getAttribute(`data-${initialLang}`) ||
                       quickBtn.getAttribute('data-fr') ||
                       quickBtn.getAttribute('data-en') || '';
  quickBtn.textContent = initialLabel;
  quickBtn.setAttribute('aria-label', initialLabel);

  wrapper.appendChild(quickBtn);
  document.body.appendChild(wrapper);

  const hideQuickStart = () => {
    wrapper.classList.add('quick-start-hidden');
    cancelDwell();
  };

  startButton.addEventListener('click', hideQuickStart);

  let dwellTimer = null;
  let overlay = null;

  const getDwellTime = () => {
    try {
      const ms = window.eyegazeSettings?.dwellTime;
      if (Number.isFinite(ms) && ms > 0) return Math.floor(ms);
    } catch (e) {}
    return 1500;
  };

  const cancelDwell = () => {
    if (dwellTimer) {
      clearTimeout(dwellTimer);
      dwellTimer = null;
    }
    if (overlay && overlay.parentElement) {
      overlay.parentElement.removeChild(overlay);
    }
    overlay = null;
    quickBtn.classList.remove('quick-start-arming');
  };

  const triggerStart = () => {
    cancelDwell();
    if (!document.body.contains(startButton)) return;
    startButton.click();
  };

  const beginDwell = () => {
    cancelDwell();
    quickBtn.classList.add('quick-start-arming');
    overlay = document.createElement('div');
    overlay.className = 'dwell-fill quick-start-fill';
    overlay.setAttribute('aria-hidden', 'true');
    quickBtn.appendChild(overlay);
    const dwell = getDwellTime();
    requestAnimationFrame(() => {
      if (!overlay) return;
      overlay.style.transition = `width ${dwell}ms linear, height ${dwell}ms linear`;
      overlay.style.width = '100%';
      overlay.style.height = '100%';
    });
    dwellTimer = setTimeout(triggerStart, dwell);
  };

  const handlePointerDown = () => {
    cancelDwell();
  };

  quickBtn.addEventListener('pointerenter', beginDwell);
  quickBtn.addEventListener('pointerleave', cancelDwell);
  quickBtn.addEventListener('pointercancel', cancelDwell);
  quickBtn.addEventListener('pointerdown', handlePointerDown);
  quickBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    triggerStart();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelDwell();
  });

  const labelObserver = new MutationObserver(() => {
    const labelText = quickBtn.textContent.trim();
    if (labelText) {
      quickBtn.setAttribute('aria-label', labelText);
    }
  });
  labelObserver.observe(quickBtn, { childList: true, characterData: true, subtree: true });

  const mutationObserver = new MutationObserver(() => {
    if (document.body.contains(startButton)) return;
    cancelDwell();
    if (wrapper.parentElement) wrapper.parentElement.removeChild(wrapper);
    labelObserver.disconnect();
    mutationObserver.disconnect();
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

function scheduleQuickStartInit(){
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuickStartButton, { once: true });
  } else {
    initQuickStartButton();
  }
}

scheduleQuickStartInit();

window.initQuickStartButton = initQuickStartButton;
