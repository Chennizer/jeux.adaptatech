const Input = (() => {
  let mode = 'touch';
  let dwellMs = 1500;
  const dwellTimers = new Map();
  const progressOverlays = new Map();

  function setMode(newMode) {
    mode = newMode;
    localStorage.setItem('routine_input_mode', mode);
  }

  function setDwell(ms) {
    dwellMs = ms;
    localStorage.setItem('routine_dwell_ms', String(ms));
  }

  function getSettings() {
    return { mode, dwellMs };
  }

  function init(defaults = { mode: 'touch', dwellMs: 1500 }) {
    const savedMode = localStorage.getItem('routine_input_mode') || defaults.mode;
    const savedDwell = parseInt(localStorage.getItem('routine_dwell_ms'), 10);
    setMode(savedMode);
    setDwell(isNaN(savedDwell) ? defaults.dwellMs : savedDwell);
  }

  function addDwellProgress(el) {
    const overlay = document.createElement('div');
    overlay.className = 'dwell-overlay';
    const circle = document.createElement('div');
    circle.className = 'dwell-circle';
    overlay.appendChild(circle);
    el.appendChild(overlay);
    progressOverlays.set(el, { overlay, circle });
  }

  function startDwell(el) {
    if (mode !== 'dwell') return;
    if (!progressOverlays.has(el)) addDwellProgress(el);
    const { circle } = progressOverlays.get(el);
    circle.style.transition = 'none';
    circle.style.strokeDashoffset = '100';
    requestAnimationFrame(() => {
      circle.style.transition = `stroke-dashoffset ${dwellMs}ms linear`;
      circle.style.strokeDashoffset = '0';
    });
    const timer = setTimeout(() => {
      el.click();
      clearDwell(el);
    }, dwellMs);
    dwellTimers.set(el, timer);
  }

  function clearDwell(el) {
    const timer = dwellTimers.get(el);
    if (timer) clearTimeout(timer);
    dwellTimers.delete(el);
    if (progressOverlays.has(el)) {
      const { overlay } = progressOverlays.get(el);
      overlay.remove();
      progressOverlays.delete(el);
    }
  }

  function bindElement(el) {
    el.setAttribute('tabindex', '0');
    el.addEventListener('pointerenter', () => startDwell(el));
    el.addEventListener('pointerleave', () => clearDwell(el));
    el.addEventListener('keydown', (e) => {
      if (['Enter', ' '].includes(e.key)) {
        e.preventDefault();
        el.click();
      }
    });
  }

  function bindAll(root = document) {
    root.querySelectorAll('button').forEach(bindElement);
  }

  return { init, setMode, setDwell, getSettings, bindAll };
})();

export default Input;
