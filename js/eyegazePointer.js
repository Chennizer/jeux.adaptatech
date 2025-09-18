(function(){
  const pointerEl = document.getElementById('gazePointer');
  if (!pointerEl) {
    window.gazePointerCtrl = null;
    return;
  }

  const showInput    = document.getElementById('showGazePointer');
  const sizeInput    = document.getElementById('gazeSize');
  const opacityInput = document.getElementById('gazeOpacity');
  const sizeValue    = document.getElementById('gazeSizeVal');
  const opacityValue = document.getElementById('gazeOpacityVal');
  const gpDetails    = document.getElementById('gpDetails');

  const lastPointer = { x: null, y: null };
  const state = { isActive: () => true };

  const settings = window.eyegazeSettings = window.eyegazeSettings || {};
  if (typeof settings.showGazePointer !== 'boolean') settings.showGazePointer = true;
  if (!Number.isFinite(settings.gazePointerSize)) settings.gazePointerSize = 36;
  if (!Number.isFinite(settings.gazePointerAlpha)) settings.gazePointerAlpha = 0.6;

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function setPointerPos(x, y){
    pointerEl.style.left = x + 'px';
    pointerEl.style.top  = y + 'px';
  }

  const rawHandler = (e) => {
    lastPointer.x = e.clientX;
    lastPointer.y = e.clientY;
    setPointerPos(e.clientX, e.clientY);
  };

  if ('onpointerrawupdate' in window) {
    window.addEventListener('pointerrawupdate', rawHandler, { passive: true });
  }
  window.addEventListener('pointermove', rawHandler, { passive: true });

  window.addEventListener('pointerleave', () => {
    pointerEl._savedOpacity = pointerEl.style.opacity;
    pointerEl.style.opacity = 0;
  });

  window.addEventListener('pointerenter', () => {
    applyPointerToggle();
    if (lastPointer.x != null && lastPointer.y != null) {
      setPointerPos(lastPointer.x, lastPointer.y);
    }
  });

  function syncSettingsFromInputs(){
    if (showInput) settings.showGazePointer = !!showInput.checked;
    if (sizeInput) {
      const size = parseInt(sizeInput.value, 10);
      settings.gazePointerSize = Number.isFinite(size) ? clamp(size, 12, 160) : 36;
    }
    if (opacityInput) {
      const raw = parseInt(opacityInput.value, 10);
      const pct = Number.isFinite(raw) ? clamp(raw, 0, 100) : 60;
      settings.gazePointerAlpha = pct / 100;
    }
  }

  function syncInputsFromSettings(){
    if (showInput) showInput.checked = !!settings.showGazePointer;
    if (sizeInput) sizeInput.value = settings.gazePointerSize;
    if (opacityInput) opacityInput.value = Math.round(settings.gazePointerAlpha * 100);
    updatePointerReadouts();
  }

  function updatePointerReadouts(){
    if (sizeValue) sizeValue.textContent = Math.round(settings.gazePointerSize);
    if (opacityValue) opacityValue.textContent = Math.round(settings.gazePointerAlpha * 100);
  }

  function updatePointerStyles(){
    const size = Number.isFinite(settings.gazePointerSize) ? settings.gazePointerSize : 36;
    const opacity = Number.isFinite(settings.gazePointerAlpha) ? clamp(settings.gazePointerAlpha, 0, 1) : 0.6;

    pointerEl.style.setProperty('--gp-size', size + 'px');
    pointerEl.style.opacity = (showInput?.checked && state.isActive()) ? opacity : 0;
    updatePointerReadouts();
  }

  function applyPointerToggle(){
    const enable = !!showInput?.checked && state.isActive();
    document.documentElement.classList.toggle('hide-native-cursor', enable);
    if (!enable && gpDetails) gpDetails.open = false;
    updatePointerStyles();
    if (enable && lastPointer.x != null && lastPointer.y != null) {
      setPointerPos(lastPointer.x, lastPointer.y);
    }
  }

  [showInput, sizeInput, opacityInput].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        syncSettingsFromInputs();
        applyPointerToggle();
      });
    }
  });

  syncInputsFromSettings();
  applyPointerToggle();

  window.gazePointerCtrl = {
    setActiveCheck(fn){
      state.isActive = typeof fn === 'function' ? fn : () => true;
      applyPointerToggle();
    },
    applyToggle: applyPointerToggle,
    updateStyles: updatePointerStyles,
    refreshFromSettings(){
      syncInputsFromSettings();
      applyPointerToggle();
    },
    setDwell(isDwelling){
      pointerEl.classList.toggle('gp-dwell', !!isDwelling);
    }
  };
})();
