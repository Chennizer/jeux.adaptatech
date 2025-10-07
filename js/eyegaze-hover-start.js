(function () {
  const SELECTOR = '[data-eyegaze-hover-start]';
  const DEFAULT_DWELL = 1500;

  function resolveTarget(button) {
    const attr = button.getAttribute('data-eyegaze-start-target');
    if (!attr) return null;
    if (attr.startsWith('#') || attr.startsWith('.')) {
      try {
        return document.querySelector(attr);
      } catch (e) {
        return null;
      }
    }
    return document.getElementById(attr);
  }

  function createOverlay(button, dwellMs) {
    const overlay = document.createElement('span');
    overlay.className = 'eyegaze-dwell-fill';
    overlay.style.setProperty('--eyegaze-hover-duration', `${dwellMs}ms`);
    if (button.firstChild) {
      button.insertBefore(overlay, button.firstChild);
    } else {
      button.appendChild(overlay);
    }
    return overlay;
  }

  function attach(button) {
    if (button.dataset.eyegazeHoverInit === 'true') return;
    button.dataset.eyegazeHoverInit = 'true';

    const dwellMs = (() => {
      const attr = button.getAttribute('data-eyegaze-hover-ms');
      const parsed = parseInt(attr || '', 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DWELL;
    })();

    const target = resolveTarget(button);
    if (!target) {
      console.warn('[eyegaze-hover-start] Target element not found for button', button);
    }

    let timer = null;
    let overlay = null;

    function clearTimer() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function removeOverlay(styleClass) {
      if (!overlay) return;
      if (styleClass) overlay.classList.add(styleClass);
      const current = overlay;
      overlay = null;
      setTimeout(() => current.remove(), styleClass ? 200 : 0);
    }

    function cancelDwell() {
      clearTimer();
      removeOverlay('cancel');
      button.removeAttribute('data-eyegaze-dwell');
    }

    function triggerStart() {
      clearTimer();
      if (overlay) {
        overlay.classList.add('complete');
        setTimeout(() => removeOverlay(), 220);
      }
      button.removeAttribute('data-eyegaze-dwell');

      if (target && typeof target.click === 'function') {
        target.click();
      } else {
        const customEvent = button.getAttribute('data-eyegaze-start-event');
        if (customEvent) {
          button.dispatchEvent(new CustomEvent(customEvent, { bubbles: true }));
        }
      }

      if (button.isConnected) {
        button.classList.add('eyegaze-hover-start-hidden');
        setTimeout(() => {
          if (button.isConnected) {
            button.remove();
          }
        }, 250);
      }
    }

    function startDwell() {
      if (button.disabled || button.getAttribute('aria-disabled') === 'true') return;
      cancelDwell();
      overlay = createOverlay(button, dwellMs);
      button.setAttribute('data-eyegaze-dwell', 'true');
      timer = window.setTimeout(triggerStart, dwellMs);
    }

    const cancelEvents = ['pointerleave', 'pointercancel', 'pointerdown', 'pointerup', 'mouseleave', 'blur'];
    button.addEventListener('pointerenter', startDwell);
    cancelEvents.forEach(evt => button.addEventListener(evt, cancelDwell));

    if (target) {
      target.addEventListener('click', () => {
        cancelDwell();
        if (button.isConnected) {
          button.classList.add('eyegaze-hover-start-hidden');
          setTimeout(() => {
            if (button.isConnected) button.remove();
          }, 250);
        }
      }, { once: true });
    }
  }

  function initAll(root = document) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll(SELECTOR).forEach(attach);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll(document));
  } else {
    initAll(document);
  }

  if ('MutationObserver' in window) {
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) {
            attach(node);
          }
          initAll(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
