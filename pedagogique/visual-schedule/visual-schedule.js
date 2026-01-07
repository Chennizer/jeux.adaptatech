(() => {
  const stepCountInput = document.getElementById('step-count');
  const stepCountValue = document.getElementById('step-count-value');
  const keepOrderToggle = document.getElementById('keep-order');
  const orientationToggle = document.getElementById('orientation-toggle');
  const textToggle = document.getElementById('text-toggle');
  const summarySteps = document.getElementById('summary-steps');
  const summaryOrientation = document.getElementById('summary-orientation');
  const summaryText = document.getElementById('summary-text');

  const optionsModal = document.getElementById('control-panel');
  const openPickerBtn = document.getElementById('open-picker');
  const imagePicker = document.getElementById('image-picker');
  const backToOptionsBtn = document.getElementById('back-to-options');
  const launchBtn = document.getElementById('launch-active');

  const presetGrid = document.getElementById('preset-grid');
  const userGrid = document.getElementById('user-grid');
  const userUpload = document.getElementById('user-upload');
  const stepsContainer = document.getElementById('steps-container');

  const overlay = document.getElementById('active-overlay');
  const overlaySteps = document.getElementById('overlay-steps');
  const exitActiveBtn = document.getElementById('exit-active');

  const maxSteps = 10;
  const minSteps = 2;
  const gapBase = 0.05; // 5vh

  let steps = [];
  let selectedImage = null;
  let selectedThumb = null;
  let userImages = [];
  let dragPayload = null;
  let activeStepIndex = null;
  let completedSteps = new Set();
  let isActiveMode = false;
  let resizeRaf = null;

  function clampStepCount(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return minSteps;
    return Math.min(maxSteps, Math.max(minSteps, parsed));
  }

  function syncSummaries() {
    const count = clampStepCount(stepCountInput.value);
    stepCountValue.textContent = count;
    summarySteps.textContent = count;
    summaryOrientation.textContent = orientationToggle.checked ? 'Verticale' : 'Horizontale';
    summaryText.textContent = textToggle.checked ? 'Affiché' : 'Masqué';
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
      dragPayload = { type: 'image', image };
      setSelection(image, thumb);
    });
    thumb.addEventListener('dragend', () => { dragPayload = null; });
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

    steps = Array.from({ length: validated }, (_, idx) => steps[idx] || { assignment: null });
    completedSteps = new Set([...completedSteps].filter((idx) => idx < validated));
    if (activeStepIndex !== null && activeStepIndex >= validated) {
      activeStepIndex = null;
    }
    renderStepRail();
    updateLaunchState();
    syncSummaries();
  }

  function swapAssignments(a, b) {
    const temp = steps[a].assignment;
    steps[a].assignment = steps[b].assignment;
    steps[b].assignment = temp;
  }

  function handleDrop(index) {
    if (!dragPayload) return;
    if (dragPayload.type === 'image') {
      steps[index].assignment = dragPayload.image;
    } else if (dragPayload.type === 'step') {
      swapAssignments(index, dragPayload.index);
    }
    renderStepRail();
    updateLaunchState();
  }

  function renderStepRail() {
    stepsContainer.innerHTML = '';
    steps.forEach((step, idx) => {
      const card = document.createElement('div');
      card.className = 'step-card';
      card.dataset.index = idx;
      if (step.assignment) card.draggable = true;

      const header = document.createElement('div');
      header.className = 'step-header';
      const label = document.createElement('span');
      label.className = 'step-label';
      label.textContent = `Étape ${idx + 1}`;
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'secondary-button';
      clearBtn.textContent = 'Retirer';
      clearBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        steps[idx].assignment = null;
        renderStepRail();
        updateLaunchState();
      });
      header.appendChild(label);
      header.appendChild(clearBtn);

      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'step-image';
      if (step.assignment) {
        const img = document.createElement('img');
        img.src = step.assignment.src;
        img.alt = step.assignment.name;
        imageWrapper.appendChild(img);
      } else {
        imageWrapper.textContent = 'Déposez ou cliquez pour assigner';
      }

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = selectedImage ? `Sélection: ${selectedImage.name}` : 'Sélectionnez une image ci-dessus';

      card.appendChild(header);
      card.appendChild(imageWrapper);
      card.appendChild(meta);

      card.addEventListener('click', () => {
        if (selectedImage) {
          steps[idx].assignment = selectedImage;
          renderStepRail();
          updateLaunchState();
        }
      });

      card.addEventListener('dragstart', () => {
        if (steps[idx].assignment) {
          dragPayload = { type: 'step', index: idx };
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
        handleDrop(idx);
      });

      stepsContainer.appendChild(card);
    });
  }

  function updateLaunchState() {
    const allAssigned = steps.every((step) => step.assignment);
    launchBtn.disabled = !allAssigned;
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

  function showImagePicker() {
    optionsModal.classList.add('hidden');
    imagePicker.classList.remove('hidden');
  }

  function backToOptions() {
    imagePicker.classList.add('hidden');
    optionsModal.classList.remove('hidden');
  }

  function toggleBodyScroll(disabled) {
    if (disabled) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }

  function setOverlaySpacing() {
    const gapPx = Math.max(window.innerHeight * gapBase, 24);
    overlaySteps.style.setProperty('--overlay-gap', `${gapPx}px`);

    const count = steps.length || 1;
    if (overlaySteps.classList.contains('vertical')) {
      const available = window.innerHeight - gapPx * (count + 1);
      const cardHeight = Math.max(120, available / count);
      const cardWidth = Math.min(window.innerWidth - gapPx * 2, cardHeight * 1.05);
      overlaySteps.style.setProperty('--card-height', `${cardHeight}px`);
      overlaySteps.style.setProperty('--card-width', `${cardWidth}px`);
    } else {
      const available = window.innerWidth - gapPx * (count + 1);
      const cardWidth = Math.max(140, available / count);
      const cardHeight = Math.min(window.innerHeight - gapPx * 2, cardWidth * 0.95);
      overlaySteps.style.setProperty('--card-width', `${cardWidth}px`);
      overlaySteps.style.setProperty('--card-height', `${cardHeight}px`);
    }
  }

  function renderOverlay() {
    overlaySteps.innerHTML = '';
    overlaySteps.classList.toggle('vertical', orientationToggle.checked);
    overlaySteps.classList.toggle('horizontal', !orientationToggle.checked);

    steps.forEach((step, idx) => {
      const card = document.createElement('div');
      card.className = 'overlay-card';
      card.dataset.index = idx;

      const frame = document.createElement('div');
      frame.className = 'image-frame';
      const img = document.createElement('img');
      img.src = step.assignment?.src || '';
      img.alt = step.assignment?.name || '';
      frame.appendChild(img);
      card.appendChild(frame);

      if (textToggle.checked && step.assignment) {
        const caption = document.createElement('div');
        caption.className = 'caption';
        caption.textContent = step.assignment.name.replace(/\.[^.]+$/, '');
        card.appendChild(caption);
      }

      if (idx === activeStepIndex) {
        card.classList.add('active');
      }
      if (completedSteps.has(idx)) {
        card.classList.add('completed');
      }

      card.addEventListener('click', () => handleOverlayClick(idx));
      overlaySteps.appendChild(card);
    });

    setOverlaySpacing();
  }

  function handleOverlayClick(index) {
    if (activeStepIndex === index) {
      completedSteps.add(index);
      activeStepIndex = null;
    } else {
      activeStepIndex = index;
      completedSteps.delete(index);
    }
    renderOverlay();
  }

  function enterActiveMode() {
    if (!steps.every((s) => s.assignment)) return;
    isActiveMode = true;
    completedSteps = new Set();
    activeStepIndex = null;
    imagePicker.classList.add('hidden');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    toggleBodyScroll(true);
    enterFullscreen();
    renderOverlay();
  }

  function exitActiveMode() {
    isActiveMode = false;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    toggleBodyScroll(false);
    exitFullscreen();
  }

  function handleResize() {
    if (!isActiveMode) return;
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(setOverlaySpacing);
  }

  function goToPickerFromOptions() {
    buildSteps(stepCountInput.value);
    showImagePicker();
  }

  // Listeners
  stepCountInput.addEventListener('input', (event) => {
    buildSteps(event.target.value);
  });

  keepOrderToggle.addEventListener('change', () => {
    const newSteps = Array.from({ length: steps.length }, (_, idx) => steps[idx]);
    if (!keepOrderToggle.checked) {
      newSteps.sort((a, b) => (a.assignment && b.assignment ? 0 : a.assignment ? -1 : 1));
    }
    steps = newSteps;
    renderStepRail();
  });

  orientationToggle.addEventListener('change', () => {
    syncSummaries();
    if (isActiveMode) renderOverlay();
  });
  textToggle.addEventListener('change', () => {
    syncSummaries();
    if (isActiveMode) renderOverlay();
  });

  openPickerBtn.addEventListener('click', goToPickerFromOptions);
  backToOptionsBtn.addEventListener('click', backToOptions);
  userUpload.addEventListener('change', handleUserUpload);
  launchBtn.addEventListener('click', enterActiveMode);
  exitActiveBtn.addEventListener('click', exitActiveMode);
  window.addEventListener('resize', handleResize);

  // Init
  loadPresetLibrary();
  buildSteps(stepCountInput.value);
  syncSummaries();
  renderUserImages();
})();
