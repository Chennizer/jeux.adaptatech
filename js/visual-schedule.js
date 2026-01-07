(function() {
  const minSteps = 2;
  const maxSteps = 10;
  const gapBase = 0.05; // 5vh

  const optionsModal = document.getElementById('game-options');
  const pickerModal = document.getElementById('tile-picker-modal');
  const builderScreen = document.getElementById('builder-screen');

  const stepSlider = document.getElementById('step-count');
  const stepValue = document.getElementById('step-value');
  const orientationToggle = document.getElementById('orientation-toggle');
  const textToggle = document.getElementById('text-toggle');
  const liveOrientationToggle = document.getElementById('live-orientation-toggle');
  const liveTextToggle = document.getElementById('live-text-toggle');

  const openPickerBtn = document.getElementById('open-picker');
  const backToOptionsBtn = document.getElementById('back-to-options');
  const launchBuilderBtn = document.getElementById('launch-builder');
  const clearSelectionBtn = document.getElementById('clear-selection');
  const editSelectionBtn = document.getElementById('edit-selection');

  const presetGrid = document.getElementById('preset-grid');
  const userGrid = document.getElementById('user-grid');
  const userUpload = document.getElementById('user-upload');
  const selectionRow = document.getElementById('selection-row');

  const stepsContainer = document.getElementById('steps-container');
  const selectionStatus = document.getElementById('selection-status');
  const activeStatus = document.getElementById('active-status');
  const toggleActiveBtn = document.getElementById('toggle-active-mode');
  const resetProgressBtn = document.getElementById('reset-progress');

  const overlay = document.getElementById('active-overlay');
  const overlaySteps = document.getElementById('overlay-steps');
  const exitActiveBtn = document.getElementById('exit-active');

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

  function syncLiveToggles() {
    liveOrientationToggle.checked = orientationToggle.checked;
    liveTextToggle.checked = textToggle.checked;
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
    selectionStatus.textContent = image ? `Selected: ${image.name}` : '';
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
    renderStepsContainer();
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
        if (!selectedImage) {
          selectionStatus.textContent = 'Select or drag an image first';
          return;
        }
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

  function renderStepsContainer() {
    stepsContainer.innerHTML = '';
    steps.forEach((step, index) => {
      const card = document.createElement('div');
      card.className = 'step-card';
      card.dataset.index = index;
      card.draggable = !!step.assignment;

      const header = document.createElement('div');
      header.className = 'step-header';
      const label = document.createElement('span');
      label.className = 'step-label';
      label.textContent = `Step ${index + 1}`;
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'button ghost';
      clearBtn.textContent = 'Clear';
      clearBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        clearStep(index);
      });
      header.appendChild(label);
      header.appendChild(clearBtn);

      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'step-image';
      imageWrapper.textContent = '';

      if (step.assignment) {
        applyAssignment(card, step.assignment);
        card.draggable = true;
      }

      card.appendChild(header);
      card.appendChild(imageWrapper);

      card.addEventListener('click', () => handleStepClick(index));
      card.addEventListener('dragstart', () => {
        if (steps[index]?.assignment) {
          dragPayload = { image: steps[index].assignment, from: 'card', index };
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
        const payloadImage = dragPayload?.image || selectedImage;
        if (!payloadImage) return;
        assignImageToStep(index, payloadImage, dragPayload?.index ?? null);
      });

      updateStepStateClasses(card, index);
      stepsContainer.appendChild(card);
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
    renderStepsContainer();
    if (isActiveMode) {
      renderActiveSteps();
    }
    updateLaunchState();
  }

  function applyAssignment(card, assignment) {
    card.classList.add('assigned');
    const wrapper = card.querySelector('.step-image');
    if (wrapper) {
      wrapper.innerHTML = '';
      const img = document.createElement('img');
      img.src = assignment.src;
      img.alt = assignment.name;
      wrapper.appendChild(img);
    }
  }

  function handleStepClick(index) {
    if (isActiveMode) {
      handleActiveStepClick(index);
      return;
    }

    if (!selectedImage) {
      selectionStatus.textContent = 'Select or drag an image first';
      return;
    }
    assignImageToStep(index, selectedImage, null);
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
    updateStepStateClasses(stepsContainer.querySelector(`[data-index="${index}"]`), index);
    if (previous !== null && previous !== index) {
      updateStepStateClasses(stepsContainer.querySelector(`[data-index="${previous}"]`), previous);
    }
    activeStatus.textContent = `Active Mode: step ${index + 1} is live. Click it again to complete.`;
    renderActiveSteps();
  }

  function markCompleted(index) {
    completedSteps.add(index);
    updateStepStateClasses(stepsContainer.querySelector(`[data-index="${index}"]`), index);
    activeStepIndex = null;
    activeStatus.textContent = `Step ${index + 1} marked complete.`;
    renderActiveSteps();
  }

  function clearStep(index) {
    steps[index] = { assignment: null };
    completedSteps.delete(index);
    if (activeStepIndex === index) {
      activeStepIndex = null;
    }
    renderSelectionRow();
    renderStepsContainer();
    if (isActiveMode) {
      renderActiveSteps();
    }
    updateLaunchState();
  }

  function clearAllSelections() {
    steps = steps.map(() => ({ assignment: null }));
    selectedImage = null;
    completedSteps.clear();
    activeStepIndex = null;
    setSelection(null, null);
    renderSelectionRow();
    renderStepsContainer();
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

  function toggleActiveMode() {
    isActiveMode = !isActiveMode;
    if (!isActiveMode) {
      activeStatus.textContent = 'Active Mode is off. Assign images before starting.';
      toggleActiveBtn.textContent = 'Enter Active Mode';
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      overlaySteps.style.removeProperty('--overlay-card-size');
      document.body.classList.remove('no-scroll');
      exitFullscreen();
      return;
    }

    if (!steps.some((step) => step.assignment)) {
      isActiveMode = false;
      return;
    }

    toggleActiveBtn.textContent = 'Exit Active Mode';
    activeStatus.textContent = 'Active Mode: click any assigned step to make it live.';
    renderActiveSteps();
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    enterFullscreen();
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
    activeStatus.textContent = isActiveMode ? 'Active Mode: progress reset.' : 'Active Mode is off. Progress reset.';
  }

  function renderActiveSteps() {
    overlaySteps.innerHTML = '';
    const orientationClass = liveOrientationToggle?.checked ? 'vertical' : 'horizontal';
    const showText = liveTextToggle?.checked;
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
    if (isActiveMode) toggleActiveMode();
    optionsModal.classList.add('hidden');
    builderScreen.classList.add('hidden');
    pickerModal.classList.remove('hidden');
  }

  function showOptions() {
    if (isActiveMode) toggleActiveMode();
    pickerModal.classList.add('hidden');
    builderScreen.classList.add('hidden');
    optionsModal.classList.remove('hidden');
  }

  function showBuilder() {
    pickerModal.classList.add('hidden');
    optionsModal.classList.add('hidden');
    builderScreen.classList.remove('hidden');
  }

  function init() {
    loadPresetLibrary();
    setStepCount(stepSlider.value);
    syncLiveToggles();

    stepSlider.addEventListener('input', (event) => setStepCount(event.target.value));
    orientationToggle.addEventListener('change', () => {
      syncLiveToggles();
      if (isActiveMode) renderActiveSteps();
    });
    textToggle.addEventListener('change', () => {
      syncLiveToggles();
      if (isActiveMode) renderActiveSteps();
    });
    liveOrientationToggle.addEventListener('change', () => {
      orientationToggle.checked = liveOrientationToggle.checked;
      if (isActiveMode) renderActiveSteps();
    });
    liveTextToggle.addEventListener('change', () => {
      textToggle.checked = liveTextToggle.checked;
      if (isActiveMode) renderActiveSteps();
    });

    userUpload.addEventListener('change', handleUserUpload);
    openPickerBtn.addEventListener('click', () => {
      syncLiveToggles();
      showPicker();
    });
    backToOptionsBtn.addEventListener('click', showOptions);
    clearSelectionBtn.addEventListener('click', clearAllSelections);
    editSelectionBtn.addEventListener('click', () => {
      showPicker();
    });

    launchBuilderBtn.addEventListener('click', () => {
      if (launchBuilderBtn.disabled) return;
      showBuilder();
      isActiveMode = false;
      activeStatus.textContent = 'Assign steps and start Active Mode.';
      toggleActiveBtn.textContent = 'Enter Active Mode';
      document.body.classList.remove('no-scroll');
      exitFullscreen();
    });

    toggleActiveBtn.addEventListener('click', toggleActiveMode);
    resetProgressBtn.addEventListener('click', resetProgress);
    exitActiveBtn.addEventListener('click', toggleActiveMode);

    window.addEventListener('resize', () => {
      if (isActiveMode) {
        const orientationClass = liveOrientationToggle?.checked ? 'vertical' : 'horizontal';
        adjustOverlaySizing(orientationClass);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
