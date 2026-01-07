(function() {
  const minSteps = 2;
  const maxSteps = 10;
  const gapBase = 0.05; // 5vh

  const optionsModal = document.getElementById('options-modal');
  const pickerModal = document.getElementById('picker-modal');
  const overlay = document.getElementById('active-overlay');

  const stepCountInput = document.getElementById('step-count');
  const stepCountValue = document.getElementById('step-count-value');
  const textToggle = document.getElementById('text-toggle');
  const orientationToggle = document.getElementById('orientation-toggle');
  const fullscreenToggle = document.getElementById('fullscreen-toggle');

  const openPickerBtn = document.getElementById('open-picker');
  const backToOptionsBtn = document.getElementById('back-to-options');
  const launchBtn = document.getElementById('launch-schedule');
  const restartPickerBtn = document.getElementById('restart-picker');
  const exitActiveBtn = document.getElementById('exit-active');

  const presetGrid = document.getElementById('preset-grid');
  const userGrid = document.getElementById('user-grid');
  const userUpload = document.getElementById('user-upload');
  const stepsContainer = document.getElementById('steps-container');
  const selectionStatus = document.getElementById('selection-status');
  const overlaySteps = document.getElementById('overlay-steps');
  const resetProgressBtn = document.getElementById('reset-progress');
  const clearStepsBtn = document.getElementById('clear-steps');

  let steps = [];
  let selectedImage = null;
  let selectedThumb = null;
  let isActiveMode = false;
  let activeStepIndex = null;
  let completedSteps = new Set();
  let userImages = [];
  let dragPayload = null;
  let resizeRaf = null;

  function clampStepCount(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return minSteps;
    return Math.min(maxSteps, Math.max(minSteps, parsed));
  }

  function setSelection(image, thumbEl) {
    selectedImage = image;
    if (selectedThumb) selectedThumb.classList.remove('selected');
    selectedThumb = thumbEl;
    if (selectedThumb) selectedThumb.classList.add('selected');
    selectionStatus.textContent = image ? `Sélectionné : ${image.name}` : 'Glissez une image sur chaque étape ou cliquez pour assigner';
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
      dragPayload = image;
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
        origin: 'Preset',
      };
      renderThumb(presetGrid, image);
    });
  }

  function addUserImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = { name: file.name, src: reader.result, origin: 'User' };
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

  function renderUserImages() {
    userGrid.innerHTML = '';
    userImages.forEach((image) => renderThumb(userGrid, image));
  }

  function buildSteps(count) {
    const validated = clampStepCount(count);
    if (validated !== Number.parseInt(stepCountInput.value, 10)) {
      stepCountInput.value = validated;
    }
    stepCountValue.textContent = validated;

    const nextSteps = Array.from({ length: validated }, (_, idx) => steps[idx] || { assignment: null });
    steps = nextSteps;

    completedSteps = new Set([...completedSteps].filter((idx) => idx < validated));
    if (activeStepIndex !== null && activeStepIndex >= validated) {
      activeStepIndex = null;
    }

    stepsContainer.innerHTML = '';
    steps.forEach((step, idx) => {
      const card = createStepCard(idx, step.assignment);
      stepsContainer.appendChild(card);
    });
    updateLaunchState();
  }

  function createStepCard(index, assignment) {
    const card = document.createElement('div');
    card.className = 'step-card';
    card.dataset.index = index;
    card.draggable = !!assignment;

    const header = document.createElement('div');
    header.className = 'step-header';
    const label = document.createElement('span');
    label.className = 'step-label';
    label.textContent = `Étape ${index + 1}`;
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'button secondary';
    clearBtn.textContent = 'Retirer';
    clearBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      clearStep(index);
    });
    header.appendChild(label);
    header.appendChild(clearBtn);

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'step-image';
    imageWrapper.textContent = 'Déposez ou cliquez pour assigner';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = 'Glisser depuis une source ou utiliser la sélection active';

    card.appendChild(header);
    card.appendChild(imageWrapper);
    card.appendChild(meta);

    card.addEventListener('click', () => handleStepClick(index));
    card.addEventListener('dragstart', () => {
      if (steps[index]?.assignment) {
        dragPayload = steps[index].assignment;
      }
    });
    card.addEventListener('dragend', () => {
      dragPayload = null;
      card.classList.remove('drag-target');
    });
    card.addEventListener('dragover', (event) => {
      event.preventDefault();
      card.classList.add('drag-target');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-target'));
    card.addEventListener('drop', (event) => {
      event.preventDefault();
      card.classList.remove('drag-target');
      if (dragPayload) {
        assignImageToStep(index, dragPayload);
      }
    });

    if (assignment) {
      applyAssignment(card, assignment);
    }

    updateStepStateClasses(card, index);
    return card;
  }

  function assignImageToStep(index, image) {
    const assignment = { ...image };
    steps[index] = { assignment };
    completedSteps.delete(index);
    if (activeStepIndex === index) {
      activeStepIndex = null;
    }
    const card = stepsContainer.querySelector(`[data-index="${index}"]`);
    if (card) {
      applyAssignment(card, assignment);
      card.draggable = true;
      updateStepStateClasses(card, index);
    }
    if (isActiveMode) {
      renderActiveSteps();
    }
    updateLaunchState();
  }

  function applyAssignment(card, assignment) {
    card.classList.add('assigned');
    const wrapper = card.querySelector('.step-image');
    wrapper.innerHTML = '';
    const img = document.createElement('img');
    img.src = assignment.src;
    img.alt = assignment.name;
    wrapper.appendChild(img);
    const meta = card.querySelector('.meta');
    meta.textContent = `Source : ${assignment.origin}`;
  }

  function handleStepClick(index) {
    if (!selectedImage) {
      selectionStatus.textContent = 'Sélectionnez ou glissez une image d’abord';
      return;
    }
    assignImageToStep(index, selectedImage);
  }

  function handleActiveStepClick(index) {
    const card = stepsContainer.querySelector(`[data-index="${index}"]`);
    if (!card || !steps[index].assignment) return;

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
    updateStepStateClasses(stepsContainer.querySelector(`[data-index="${index}"]`), index);
    if (previous !== null && previous !== index) {
      updateStepStateClasses(stepsContainer.querySelector(`[data-index="${previous}"]`), previous);
    }
  }

  function markCompleted(index) {
    completedSteps.add(index);
    updateStepStateClasses(stepsContainer.querySelector(`[data-index="${index}"]`), index);
    activeStepIndex = null;
  }

  function clearStep(index) {
    steps[index] = { assignment: null };
    completedSteps.delete(index);
    if (activeStepIndex === index) {
      activeStepIndex = null;
    }
    const card = stepsContainer.querySelector(`[data-index="${index}"]`);
    if (!card) return;
    card.classList.remove('assigned', 'active-step', 'completed-step');
    const wrapper = card.querySelector('.step-image');
    wrapper.innerHTML = 'Déposez ou cliquez pour assigner';
    const meta = card.querySelector('.meta');
    meta.textContent = 'Glisser depuis une source ou utiliser la sélection active';
    card.draggable = false;
    if (isActiveMode) {
      renderActiveSteps();
    }
    updateLaunchState();
  }

  function clearAllSteps() {
    steps.forEach((_, index) => clearStep(index));
    setSelection(null, null);
    completedSteps.clear();
    activeStepIndex = null;
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

  function updateLaunchState() {
    const ready = steps.length >= minSteps && steps.every((step) => !!step.assignment);
    launchBtn.disabled = !ready;
    return ready;
  }

  function enterFullscreen() {
    if (!fullscreenToggle.checked) return;
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function exitFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function showOptions() {
    optionsModal.classList.add('visible');
    optionsModal.classList.remove('hidden');
    pickerModal.classList.add('hidden');
    pickerModal.classList.remove('visible');
    overlay.classList.add('hidden');
    document.body.classList.remove('no-scroll');
    isActiveMode = false;
    exitFullscreen();
  }

  function showPicker() {
    pickerModal.classList.add('visible');
    pickerModal.classList.remove('hidden');
    optionsModal.classList.add('hidden');
    optionsModal.classList.remove('visible');
  }

  function openActiveMode() {
    if (!updateLaunchState()) {
      selectionStatus.textContent = 'Ajoutez une image à chaque étape avant de lancer.';
      return;
    }
    isActiveMode = true;
    pickerModal.classList.add('hidden');
    pickerModal.classList.remove('visible');
    optionsModal.classList.add('hidden');
    optionsModal.classList.remove('visible');
    renderActiveSteps();
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    enterFullscreen();
  }

  function closeActiveMode(returnToPicker = true) {
    isActiveMode = false;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    overlaySteps.style.removeProperty('--overlay-card-size');
    document.body.classList.remove('no-scroll');
    exitFullscreen();
    if (returnToPicker) {
      showPicker();
    }
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

  function resetProgress() {
    completedSteps.clear();
    activeStepIndex = null;
    stepsContainer.querySelectorAll('.step-card').forEach((card) => {
      card.classList.remove('active-step', 'completed-step');
    });
    overlaySteps.querySelectorAll('.overlay-card').forEach((card) => {
      card.classList.remove('active-step', 'completed-step');
    });
  }

  function renderActiveSteps() {
    overlaySteps.innerHTML = '';
    const orientationClass = orientationToggle?.checked ? 'vertical' : 'horizontal';
    const showText = textToggle?.checked;
    overlaySteps.classList.remove('vertical', 'horizontal');
    overlaySteps.classList.add(orientationClass);

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

  function bindEvents() {
    stepCountInput.addEventListener('input', (event) => buildSteps(event.target.value));
    userUpload.addEventListener('change', handleUserUpload);
    openPickerBtn.addEventListener('click', () => {
      buildSteps(stepCountInput.value);
      showPicker();
    });
    backToOptionsBtn.addEventListener('click', showOptions);
    launchBtn.addEventListener('click', openActiveMode);
    restartPickerBtn.addEventListener('click', () => closeActiveMode(true));
    exitActiveBtn.addEventListener('click', () => closeActiveMode(true));
    resetProgressBtn.addEventListener('click', resetProgress);
    clearStepsBtn.addEventListener('click', clearAllSteps);

    orientationToggle.addEventListener('change', () => {
      if (isActiveMode) renderActiveSteps();
    });
    textToggle.addEventListener('change', () => {
      if (isActiveMode) renderActiveSteps();
    });

    window.addEventListener('resize', () => {
      if (isActiveMode) {
        const orientationClass = orientationToggle?.checked ? 'vertical' : 'horizontal';
        adjustOverlaySizing(orientationClass);
      }
    });
  }

  function init() {
    loadPresetLibrary();
    buildSteps(stepCountInput.value);
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
