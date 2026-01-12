const Input = (() => {
  let mode = localStorage.getItem('routine_input_mode') || 'touch';
  let dwellMs = Number(localStorage.getItem('routine_dwell_ms')) || 1500;

  const setMode = m => { mode = m; localStorage.setItem('routine_input_mode', m); };
  const setDwell = ms => { dwellMs = ms; localStorage.setItem('routine_dwell_ms', ms); };
  const getMode = () => mode;
  const getDwell = () => dwellMs;

  const setupButton = (button, handler) => {
    button.addEventListener('click', handler);
    button.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler(e);
      } else if (e.key === 'Escape') {
        window.location.href = './index.html';
      }
    });

    if (mode === 'dwell') {
      let timer;
      const indicator = document.createElement('div');
      indicator.className = 'dwell-indicator';
      indicator.innerHTML = '<div class="ring"></div>';
      indicator.style.setProperty('--dwell', `${dwellMs}ms`);
      indicator.style.display = 'none';
      button.style.position = 'relative';
      button.appendChild(indicator);

      const start = () => {
        indicator.style.display = 'grid';
        requestAnimationFrame(() => indicator.classList.add('dwell-active'));
        timer = setTimeout(() => {
          indicator.classList.remove('dwell-active');
          indicator.style.display = 'none';
          handler();
        }, dwellMs);
      };
      const cancel = () => {
        indicator.classList.remove('dwell-active');
        indicator.style.display = 'none';
        clearTimeout(timer);
      };
      button.addEventListener('pointerenter', start);
      button.addEventListener('pointerleave', cancel);
    }
  };

  const wireAll = selector => {
    document.querySelectorAll(selector).forEach(btn => {
      const h = () => btn.dispatchEvent(new Event('activated'));
      setupButton(btn, h);
    });
  };

  return { setMode, setDwell, getMode, getDwell, setupButton, wireAll };
})();

export default Input;
