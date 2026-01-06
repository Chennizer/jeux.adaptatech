(function() {
  const stepCountInput = document.getElementById('step-count');
  const applyStepsBtn = document.getElementById('apply-steps');
  const presetGrid = document.getElementById('preset-grid');
  const userGrid = document.getElementById('user-grid');
  const userUpload = document.getElementById('user-upload');
  const uploadBox = document.querySelector('.upload-box');
  const stepsContainer = document.getElementById('steps-container');
  const selectionStatus = document.getElementById('selection-status');
  const activeStatus = document.getElementById('active-status');
  const toggleActiveBtn = document.getElementById('toggle-active-mode');
  const resetProgressBtn = document.getElementById('reset-progress');
  const orientationToggle = document.getElementById('orientation-toggle');
  const textToggle = document.getElementById('text-toggle');
  const overlay = document.getElementById('active-overlay');
  const overlaySteps = document.getElementById('overlay-steps');
  const exitActiveBtn = document.getElementById('exit-active');
  const gapBase = 0.05; // 5vh

  const maxSteps = 10;
  const minSteps = 2;
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
    if (selectedThumb) {
      selectedThumb.classList.remove('selected');
    }
    selectedThumb = thumbEl;
    if (selectedThumb) {
      selectedThumb.classList.add('selected');
    }
    selectionStatus.textContent = image ? `Selected: ${image.name}` : 'Pick an image to assign';
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

  async function handleUserDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadBox.classList.remove('dragover');
    const dropped = Array.from(event.dataTransfer?.files || []).filter((file) => file.type.startsWith('image/'));
    if (!dropped.length) return;
    const promises = dropped.map(addUserImage);
    await Promise.all(promises);
    renderUserImages();
    userUpload.value = '';
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
    const nextSteps = Array.from({ length: validated }, (_, idx) => steps[idx] || { assignment: null });
    steps = nextSteps;

    // sanitize state
    completedSteps = new Set([...completedSteps].filter((idx) => idx < validated));
    if (activeStepIndex !== null && activeStepIndex >= validated) {
      activeStepIndex = null;
    }

    stepsContainer.innerHTML = '';
    steps.forEach((step, idx) => {
      const card = createStepCard(idx, step.assignment);
      stepsContainer.appendChild(card);
    });
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
    label.textContent = `Step ${index + 1}`;
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'secondary';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      clearStep(index);
    });
    header.appendChild(label);
    header.appendChild(clearBtn);

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'step-image';
    imageWrapper.textContent = 'Drop or click to assign';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = 'Drag from a source or tap to use the selection';

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
    meta.textContent = `From: ${assignment.origin}`;
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

    assignImageToStep(index, selectedImage);
  }

  function handleActiveStepClick(index) {
    const card = stepsContainer.querySelector(`[data-index="${index}"]`);
    if (!card || !steps[index].assignment) {
      return;
    }

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
  }

  function markCompleted(index) {
    completedSteps.add(index);
    updateStepStateClasses(stepsContainer.querySelector(`[data-index="${index}"]`), index);
    activeStepIndex = null;
    activeStatus.textContent = `Step ${index + 1} marked complete.`;
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
    wrapper.innerHTML = 'Drop or click to assign';
    const meta = card.querySelector('.meta');
    meta.textContent = 'Drag from a source or tap to use the selection';
    card.draggable = false;
    if (isActiveMode) {
      renderActiveSteps();
    }
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
      exitFullscreen();
      return;
    }

    toggleActiveBtn.textContent = 'Exit Active Mode';
    activeStatus.textContent = 'Active Mode: click any assigned step to make it live.';
    renderActiveSteps();
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    enterFullscreen();
  }

  function adjustOverlaySizing(orientationClass) {
    const showText = textToggle?.checked;
    if (!isActiveMode) return;
    cancelAnimationFrame(resizeRaf);
    const gapValue = `${Math.max(window.innerHeight * gapBase, 24)}px`;
    overlaySteps.style.gap = gapValue;
    resizeRaf = requestAnimationFrame(() => {
      const rect = overlaySteps.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const count = overlaySteps.children.length;
      if (!count) return;

      const gap = Number.parseFloat(gapValue);
      const captionAllowance = showText
        ? Math.max(
          orientationClass === 'horizontal' ? Math.min(window.innerHeight * 0.15, 220) : Math.min(rect.width * 0.18, 260),
          70
        )
        : 0;

      const availableWidth = Math.max(120, rect.width - gap * Math.max(0, count - 1) - (orientationClass === 'vertical' ? captionAllowance : 0));
      const availableHeight = Math.max(120, rect.height - gap * Math.max(0, count - 1) - (orientationClass === 'horizontal' ? captionAllowance : 0));
      const horizontalSize = Math.min(availableHeight * 0.9, availableWidth / count);
      const verticalSize = Math.min(availableWidth * 0.9, availableHeight / count);
      const cardSize = Math.max(120, Math.min(900, orientationClass === 'horizontal' ? horizontalSize : verticalSize));
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
    const orientationClass = orientationToggle?.checked ? 'vertical' : 'horizontal';
    const showText = textToggle?.checked;
    overlaySteps.classList.remove('vertical', 'horizontal');
    overlaySteps.classList.add(orientationClass);

    steps.forEach((step, index) => {
      if (!step.assignment) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'overlay-item';
      wrapper.classList.add(orientationClass === 'horizontal' ? 'item-horizontal' : 'item-vertical');

      const card = document.createElement('div');
      card.className = 'overlay-card';
      card.dataset.index = index;
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'overlay-image';
      const img = document.createElement('img');
      img.src = step.assignment.src;
      img.alt = step.assignment.name;
      imageWrapper.appendChild(img);
      card.appendChild(imageWrapper);

      wrapper.appendChild(card);

      if (showText) {
        const caption = document.createElement('div');
        caption.className = 'overlay-caption';
        caption.textContent = getImageLabel(step.assignment.name);
        wrapper.appendChild(caption);
      }
      card.addEventListener('click', () => handleActiveStepClick(index));
      overlaySteps.appendChild(wrapper);
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

  function init() {
    loadPresetLibrary();
    buildSteps(stepCountInput.value);

    applyStepsBtn.addEventListener('click', () => buildSteps(stepCountInput.value));
    stepCountInput.addEventListener('change', () => buildSteps(stepCountInput.value));
    userUpload.addEventListener('change', handleUserUpload);
    if (uploadBox) {
      uploadBox.addEventListener('dragover', (event) => {
        event.preventDefault();
        uploadBox.classList.add('dragover');
      });
      uploadBox.addEventListener('dragleave', () => uploadBox.classList.remove('dragover'));
      uploadBox.addEventListener('drop', handleUserDrop);
    }
    toggleActiveBtn.addEventListener('click', toggleActiveMode);
    resetProgressBtn.addEventListener('click', resetProgress);
    orientationToggle.addEventListener('change', () => {
      if (isActiveMode) {
        renderActiveSteps();
      }
    });
    textToggle.addEventListener('change', () => {
      if (isActiveMode) {
        renderActiveSteps();
      }
    });
    exitActiveBtn.addEventListener('click', toggleActiveMode);
    window.addEventListener('resize', () => {
      if (isActiveMode) {
        const orientationClass = orientationToggle?.checked ? 'vertical' : 'horizontal';
        adjustOverlaySizing(orientationClass);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
