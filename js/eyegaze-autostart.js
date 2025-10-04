(function(){
  const DWELL_MS = 1500;
  const AUTO_ID = 'eyegazeAutoStartButton';

  function buildLabel(base, suffix){
    if (!base) return suffix;
    const trimmed = base.trim();
    if (!trimmed) return suffix;
    if (trimmed.toLowerCase().includes(suffix.toLowerCase())) return trimmed;
    return `${trimmed} ${suffix}`.trim();
  }

  function currentLang(){
    const langAttr = document.documentElement.getAttribute('lang');
    return (langAttr && langAttr.toLowerCase() === 'en') ? 'en' : 'fr';
  }

  function updateLabelSpan(span, btn){
    if (!span || !btn) return;
    const lang = currentLang();
    const attr = btn.getAttribute(`data-${lang}`);
    if (attr) span.textContent = attr;
  }

  function isVisible(el){
    if (!el) return false;
    if (el.offsetParent === null) return false;
    const styles = window.getComputedStyle(el);
    return styles.visibility !== 'hidden' && styles.display !== 'none';
  }

  function setupAutoStart(startBtn){
    if (!startBtn || startBtn.dataset.autoStartReady) return;
    startBtn.dataset.autoStartReady = 'true';

    let autoBtn = document.getElementById(AUTO_ID);
    if (!autoBtn){
      autoBtn = document.createElement('button');
      autoBtn.id = AUTO_ID;
      autoBtn.type = 'button';
      autoBtn.className = 'button eyegaze-autostart translate';
      autoBtn.innerHTML = '<span class="eyegaze-autostart-label"></span>';
      document.body.appendChild(autoBtn);
    }

    const labelSpan = autoBtn.querySelector('.eyegaze-autostart-label');
    const fallbackText = (startBtn.textContent || '').trim();
    const baseFr = startBtn.getAttribute('data-fr') || fallbackText || 'Commencer';
    const baseEn = startBtn.getAttribute('data-en') || (fallbackText && fallbackText !== baseFr ? fallbackText : 'Start');
    const labelFr = buildLabel(baseFr, '(auto)');
    const labelEn = buildLabel(baseEn, '(auto)');

    autoBtn.setAttribute('data-fr', labelFr);
    autoBtn.setAttribute('data-en', labelEn);
    labelSpan.textContent = currentLang() === 'en' ? labelEn : labelFr;

    const langObserver = new MutationObserver(() => {
      updateLabelSpan(labelSpan, autoBtn);
    });
    langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    let dwellTimer = null;
    let dwellOverlay = null;

    function clearDwell(){
      if (dwellTimer){
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
      if (dwellOverlay){
        dwellOverlay.remove();
        dwellOverlay = null;
      }
    }

    function startDwell(){
      if (startBtn.disabled){
        autoBtn.classList.add('autostart-disabled');
        return;
      }
      autoBtn.classList.remove('autostart-disabled');
      clearDwell();

      dwellOverlay = document.createElement('div');
      dwellOverlay.className = 'autostart-dwell';
      autoBtn.appendChild(dwellOverlay);

      requestAnimationFrame(() => {
        if (!dwellOverlay) return;
        dwellOverlay.style.transition = `width ${DWELL_MS}ms linear, height ${DWELL_MS}ms linear`;
        dwellOverlay.style.width = '0';
        dwellOverlay.style.height = '0';
        requestAnimationFrame(() => {
          if (!dwellOverlay) return;
          dwellOverlay.style.width = '100%';
          dwellOverlay.style.height = '100%';
        });
      });

      dwellTimer = setTimeout(() => {
        clearDwell();
        if (!startBtn.disabled){
          startBtn.click();
        }
      }, DWELL_MS);
    }

    function cancelDwell(){
      clearDwell();
    }

    autoBtn.addEventListener('pointerenter', startDwell);
    autoBtn.addEventListener('pointerleave', cancelDwell);
    autoBtn.addEventListener('pointercancel', cancelDwell);
    autoBtn.addEventListener('pointerdown', cancelDwell);
    autoBtn.addEventListener('click', (evt) => {
      evt.preventDefault();
      cancelDwell();
      if (!startBtn.disabled){
        startBtn.click();
      }
    });

    const updateVisibility = () => {
      const visible = isVisible(startBtn);
      autoBtn.style.display = visible ? 'inline-flex' : 'none';
      autoBtn.classList.toggle('autostart-disabled', !!startBtn.disabled);
      if (!visible){
        cancelDwell();
      }
    };

    updateVisibility();

    const observerTargets = [startBtn, startBtn.closest('#game-options')];
    const visibilityObserver = new MutationObserver(updateVisibility);
    observerTargets.forEach(target => {
      if (target){
        visibilityObserver.observe(target, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
      }
    });
    visibilityObserver.observe(startBtn, { attributes: true, attributeFilter: ['disabled'] });
    window.addEventListener('resize', updateVisibility);
    document.addEventListener('fullscreenchange', updateVisibility);
    document.addEventListener('webkitfullscreenchange', updateVisibility);
    document.addEventListener('msfullscreenchange', updateVisibility);

    startBtn.addEventListener('click', () => {
      cancelDwell();
      setTimeout(updateVisibility, 50);
    });
  }

  function trySetup(){
    const btn = document.getElementById('startButton');
    if (btn){
      setupAutoStart(btn);
      return true;
    }
    return false;
  }

  if (!trySetup()){
    const observer = new MutationObserver(() => {
      if (trySetup()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('DOMContentLoaded', () => {
      if (trySetup()) observer.disconnect();
    });
  }
})();
