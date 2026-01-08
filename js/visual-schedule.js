(function() {
  const minSteps = 2;
  const maxSteps = 10;
  const gapBase = 0.05; // 5vh

  const optionsModal = document.getElementById('game-options');
  const pickerModal = document.getElementById('tile-picker-modal');

  const stepSlider = document.getElementById('step-count');
  const stepValue = document.getElementById('step-value');
  const orientationToggle = document.getElementById('orientation-toggle');
  const textToggle = document.getElementById('text-toggle');
  const numberToggle = document.getElementById('number-toggle');
  const backgroundSelect = document.getElementById('background-select');
  const completedStyleSelect = document.getElementById('completed-style');

  const openPickerBtn = document.getElementById('choose-tiles-button');
  const backToOptionsBtn = document.getElementById('back-to-options');
  const launchBuilderBtn = document.getElementById('launch-builder');
  const clearSelectionBtn = document.getElementById('clear-selection');

  const presetGrid = document.getElementById('preset-grid');
  const userGrid = document.getElementById('user-grid');
  const userUpload = document.getElementById('user-upload');
  const userUploadSingle = document.getElementById('user-upload-single');
  const selectionRow = document.getElementById('selection-row');

  const overlay = document.getElementById('active-overlay');
  const overlaySteps = document.getElementById('overlay-steps');

  let steps = [];
  let selectedImage = null;
  let selectedThumb = null;
  let dragPayload = null;
  let userImages = [];
  let isActiveMode = false;
  let activeStepIndex = null;
  let completedSteps = new Set();
  let resizeRaf = null;

  function clampStepCount(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return minSteps;
    return Math.min(maxSteps, Math.max(minSteps, parsed));
  }

  function setSelection(image, thumbEl) {
    selectedImage = image;
    if (selectedThumb) {
      selectedThumb.classList.remove('selected');
    }
    selectedThumb = thumbEl;
    if (selectedThumb) {
      selectedThumb.classList.add('selected');
    }
  }

  function renderThumb(container, image) {
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.draggable = true;
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.name;
    const label = document.createElement('span');
    label.className = 'thumb-label';
    label.textContent = image.name;
    thumb.appendChild(img);
    thumb.appendChild(label);
    thumb.addEventListener('click', () => setSelection(image, thumb));
    thumb.addEventListener('dragstart', () => {
      dragPayload = { image, from: 'thumb' };
      setSelection(image, thumb);
    });
    thumb.addEventListener('dragend', () => {
      dragPayload = null;
    });
    container.appendChild(thumb);
  }

  function loadPresetLibrary() {
    const data = Array.isArray(window.imageLibraryArray) ? window.imageLibraryArray : [];
    presetGrid.innerHTML = '';
    data.forEach((item, index) => {
      if (!item || !item.src) return;
      const src = new URL(item.src, window.location.href).href;
      const image = {
        name: item.name || item.theme || `Image ${index + 1}`,
        src,
        origin: 'Preset'
      };
      renderThumb(presetGrid, image);
    });
  }

  function addUserImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = {
          name: file.name,
          src: reader.result,
          origin: 'User'
        };
        userImages.push(image);
        resolve(image);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleUserUpload(event) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    const promises = files.map(addUserImage);
    await Promise.all(promises);
    renderUserImages();
  }

  async function handleUserUploadSingle(event) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    await Promise.all(files.map(addUserImage));
    renderUserImages();
    event.target.value = '';
  }

  function renderUserImages() {
    userGrid.innerHTML = '';
    userImages.forEach((image) => renderThumb(userGrid, image));
  }

  function setStepCount(value) {
    const validated = clampStepCount(value);
    if (validated !== Number.parseInt(stepSlider.value, 10)) {
      stepSlider.value = validated;
    }
    stepValue.textContent = String(validated);
    const nextSteps = Array.from({ length: validated }, (_, idx) => steps[idx] || { assignment: null });
    steps = nextSteps;
    completedSteps = new Set([...completedSteps].filter((idx) => idx < validated));
    if (activeStepIndex !== null && activeStepIndex >= validated) {
      activeStepIndex = null;
    }
    renderSelectionRow();
    updateLaunchState();
  }

  function renderSelectionRow() {
    selectionRow.innerHTML = '';
    steps.forEach((step, index) => {
      const slot = document.createElement('div');
      slot.className = 'selection-slot';
      slot.dataset.index = index;
      slot.draggable = !!step.assignment;

      const label = document.createElement('span');
      label.className = 'slot-label';
      label.textContent = `Step ${index + 1}`;
      slot.appendChild(label);

      if (step.assignment) {
        slot.classList.add('filled');
        const img = document.createElement('img');
        img.className = 'slot-image';
        img.src = step.assignment.src;
        img.alt = step.assignment.name;
        slot.appendChild(img);
      }

      slot.addEventListener('click', () => {
        if (!selectedImage) return;
        assignImageToStep(index, selectedImage, null);
      });

      slot.addEventListener('dragstart', () => {
        if (steps[index]?.assignment) {
          dragPayload = { image: steps[index].assignment, from: 'slot', index };
        }
      });
      slot.addEventListener('dragend', () => {
        dragPayload = null;
        slot.classList.remove('drag-target');
      });
      slot.addEventListener('dragover', (event) => {
        event.preventDefault();
        slot.classList.add('drag-target');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-target'));
      slot.addEventListener('drop', (event) => {
        event.preventDefault();
        slot.classList.remove('drag-target');
        const payloadImage = dragPayload?.image || selectedImage;
        if (!payloadImage) return;
        assignImageToStep(index, payloadImage, dragPayload?.index ?? null);
      });

      selectionRow.appendChild(slot);
    });
  }

  function assignImageToStep(index, image, fromIndex) {
    if (!image) return;
    const assignment = { ...image };
    if (typeof fromIndex === 'number' && fromIndex !== index) {
      steps[fromIndex] = { assignment: null };
    }
    steps[index] = { assignment };
    completedSteps.delete(index);
    if (activeStepIndex === index) {
      activeStepIndex = null;
    }
    renderSelectionRow();
    if (isActiveMode) {
      renderActiveSteps();
    }
    updateLaunchState();
  }

  function handleActiveStepClick(index) {
    if (!steps[index]?.assignment) return;

    if (completedSteps.has(index)) {
      completedSteps.delete(index);
      setActiveStep(index);
      return;
    }

    if (activeStepIndex === index) {
      markCompleted(index);
    } else {
      setActiveStep(index);
    }
  }

  function setActiveStep(index) {
    const previous = activeStepIndex;
    activeStepIndex = index;
    completedSteps.delete(index);
    updateStepStateClasses(null, index);
    if (previous !== null && previous !== index) {
      updateStepStateClasses(null, previous);
    }
    renderActiveSteps();
  }

  function markCompleted(index) {
    completedSteps.add(index);
    updateStepStateClasses(null, index);
    activeStepIndex = null;
    renderActiveSteps();
  }

  function clearAllSelections() {
    steps = steps.map(() => ({ assignment: null }));
    selectedImage = null;
    completedSteps.clear();
    activeStepIndex = null;
    setSelection(null, null);
    renderSelectionRow();
    updateLaunchState();
  }

  function updateStepStateClasses(card, index) {
    if (card) {
      card.classList.toggle('active-step', activeStepIndex === index);
      card.classList.toggle('completed-step', completedSteps.has(index));
    }
    const overlayCard = overlaySteps.querySelector(`[data-index="${index}"]`);
    if (overlayCard) {
      overlayCard.classList.toggle('active-step', activeStepIndex === index);
      overlayCard.classList.toggle('completed-step', completedSteps.has(index));
    }
  }

  function enterActiveMode() {
    if (!steps.some((step) => step.assignment)) return;
    isActiveMode = true;
    updateOverlayBackground();
    renderActiveSteps();
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    enterFullscreen();
  }

  function exitActiveMode() {
    isActiveMode = false;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    overlaySteps.style.removeProperty('--overlay-card-size');
    document.body.classList.remove('no-scroll');
    exitFullscreen();
  }

  function adjustOverlaySizing(orientationClass) {
    if (!isActiveMode) return;
    cancelAnimationFrame(resizeRaf);
    const gapValue = `${Math.max(window.innerHeight * gapBase, 24)}px`;
    overlaySteps.style.gap = gapValue;
    overlaySteps.style.padding = gapValue;
    resizeRaf = requestAnimationFrame(() => {
      const containerWidth = overlaySteps.clientWidth;
      const containerHeight = overlaySteps.clientHeight;
      if (!containerWidth || !containerHeight) return;
      const count = overlaySteps.children.length;
      if (!count) return;

      const gap = Number.parseFloat(gapValue);
      const mainLength = orientationClass === 'horizontal' ? containerWidth : containerHeight;
      const crossLength = orientationClass === 'horizontal' ? containerHeight : containerWidth;
      const availableMain = Math.max(120, mainLength - gap * (count + 1));
      const availableCross = Math.max(120, crossLength - gap * 2);
      const sizeFromMain = availableMain / count;
      const sizeFromCross = availableCross * 0.9;
      const cardSize = Math.max(120, Math.min(900, Math.min(sizeFromMain, sizeFromCross)));
      overlaySteps.style.setProperty('--overlay-card-size', `${cardSize}px`);
    });
  }

  function isBlackBackground() {
    return backgroundSelect?.value === '#000000';
  }

  function renderActiveSteps() {
    overlaySteps.innerHTML = '';
    const orientationClass = orientationToggle?.checked ? 'vertical' : 'horizontal';
    const showText = textToggle?.checked;
    const showNumbers = numberToggle?.checked;
    const completedStyle = completedStyleSelect?.value || 'greyed';
    overlaySteps.classList.remove('vertical', 'horizontal');
    overlaySteps.classList.add(orientationClass);
    overlaySteps.classList.toggle('single', steps.filter((step) => step.assignment).length <= 1);
    overlaySteps.classList.toggle('style-greyed', completedStyle === 'greyed');
    overlaySteps.classList.toggle('style-turn', completedStyle === 'turn');
    overlaySteps.classList.toggle('style-scribble', completedStyle === 'scribble');

    steps.forEach((step, index) => {
      if (!step.assignment) return;
      const card = document.createElement('div');
      card.className = 'overlay-card';
      card.dataset.index = index;

      const frame = document.createElement('div');
      frame.className = 'overlay-frame';
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'overlay-image';
      const img = document.createElement('img');
      img.src = step.assignment.src;
      img.alt = step.assignment.name;
      imageWrapper.appendChild(img);
      frame.appendChild(imageWrapper);
      card.appendChild(frame);

      if (showNumbers) {
        const numberTag = document.createElement('div');
        numberTag.className = 'overlay-number';
        numberTag.textContent = String(index + 1);
        numberTag.style.color = isBlackBackground() ? '#ffffff' : '#000000';
        card.appendChild(numberTag);
      }

      if (showText) {
        const caption = document.createElement('div');
        caption.className = 'overlay-caption';
        caption.textContent = getImageLabel(step.assignment.name);
        card.appendChild(caption);
      }
      card.addEventListener('click', () => handleActiveStepClick(index));
      overlaySteps.appendChild(card);
      updateStepStateClasses(card, index);
    });
    adjustOverlaySizing(orientationClass);
  }

  function getImageLabel(name) {
    if (typeof name !== 'string') return '';
    const lastDot = name.lastIndexOf('.');
    if (lastDot <= 0) return name;
    return name.slice(0, lastDot);
  }

  function updateLaunchState() {
    const filled = steps.filter((step) => step.assignment).length;
    const total = steps.length;
    const ready = filled === total && total >= minSteps;
    launchBuilderBtn.disabled = !ready;
    launchBuilderBtn.textContent = ready ? 'Launch' : `Launch (${filled}/${total})`;
  }

  function enterFullscreen() {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function exitFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function showPicker() {
    if (isActiveMode) exitActiveMode();
    optionsModal.classList.add('hidden');
    pickerModal.classList.remove('hidden');
    updateOverlayBackground();
    enterFullscreen();
  }

  function showOptions() {
    if (isActiveMode) exitActiveMode();
    pickerModal.classList.add('hidden');
    optionsModal.classList.remove('hidden');
    exitFullscreen();
  }

  function updateOverlayBackground() {
    if (!backgroundSelect) return;
    overlay.style.backgroundColor = backgroundSelect.value;
    overlay.style.setProperty('--overlay-bg', backgroundSelect.value);
  }

  function init() {
    loadPresetLibrary();
    setStepCount(stepSlider.value);
    stepSlider.addEventListener('input', (event) => setStepCount(event.target.value));
    orientationToggle.addEventListener('change', () => {
      if (isActiveMode) renderActiveSteps();
    });
    textToggle.addEventListener('change', () => {
      if (isActiveMode) renderActiveSteps();
    });
    numberToggle.addEventListener('change', () => {
      if (isActiveMode) renderActiveSteps();
    });
    backgroundSelect.addEventListener('change', () => {
      updateOverlayBackground();
      if (isActiveMode) renderActiveSteps();
    });
    completedStyleSelect.addEventListener('change', () => {
      if (isActiveMode) renderActiveSteps();
    });

    userUpload.addEventListener('change', handleUserUpload);
    userUploadSingle.addEventListener('change', handleUserUploadSingle);
    openPickerBtn.addEventListener('click', () => {
      showPicker();
    });
    backToOptionsBtn.addEventListener('click', showOptions);
    clearSelectionBtn.addEventListener('click', clearAllSelections);

    launchBuilderBtn.addEventListener('click', () => {
      if (launchBuilderBtn.disabled) return;
      pickerModal.classList.add('hidden');
      optionsModal.classList.add('hidden');
      enterActiveMode();
    });

    window.addEventListener('resize', () => {
      if (isActiveMode) {
        const orientationClass = orientationToggle?.checked ? 'vertical' : 'horizontal';
        adjustOverlaySizing(orientationClass);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (!isActiveMode) return;
      if (event.key === 'Escape') {
        exitActiveMode();
        showOptions();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
