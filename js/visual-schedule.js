(function() {
  const stepCountInput = document.getElementById('step-count');
  const applyStepsBtn = document.getElementById('apply-steps');
  const presetGrid = document.getElementById('preset-grid');
  const userGrid = document.getElementById('user-grid');
  const userUpload = document.getElementById('user-upload');
  const stepsContainer = document.getElementById('steps-container');
  const selectionStatus = document.getElementById('selection-status');
  const activeStatus = document.getElementById('active-status');
  const toggleActiveBtn = document.getElementById('toggle-active-mode');
  const resetProgressBtn = document.getElementById('reset-progress');

  const maxSteps = 10;
  const minSteps = 2;
  let steps = [];
  let selectedImage = null;
  let selectedThumb = null;
  let isActiveMode = false;
  let activeStepIndex = null;
  let completedSteps = new Set();
  let userImages = [];

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
    selectionStatus.textContent = image ? `Selected: ${image.name} (${image.origin})` : 'No image selected';
  }

  function renderThumb(container, image) {
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.name;
    const label = document.createElement('span');
    label.className = 'thumb-label';
    label.textContent = image.name;
    thumb.appendChild(img);
    thumb.appendChild(label);
    thumb.addEventListener('click', () => setSelection(image, thumb));
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
    imageWrapper.textContent = 'No image assigned';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = 'Click a library image, then click here to assign';

    card.appendChild(header);
    card.appendChild(imageWrapper);
    card.appendChild(meta);

    card.addEventListener('click', () => handleStepClick(index));

    if (assignment) {
      applyAssignment(card, assignment);
    }

    updateStepStateClasses(card, index);
    return card;
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
      selectionStatus.textContent = 'Select an image first';
      return;
    }

    const assignment = { ...selectedImage };
    steps[index] = { assignment };
    completedSteps.delete(index);
    if (activeStepIndex === index) {
      activeStepIndex = null;
    }
    const card = stepsContainer.querySelector(`[data-index="${index}"]`);
    if (card) {
      applyAssignment(card, assignment);
      updateStepStateClasses(card, index);
    }
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
    if (activeStepIndex !== null) {
      const prevCard = stepsContainer.querySelector(`[data-index="${activeStepIndex}"]`);
      if (prevCard) {
        prevCard.classList.remove('active-step');
      }
    }
    activeStepIndex = index;
    completedSteps.delete(index);
    const card = stepsContainer.querySelector(`[data-index="${index}"]`);
    if (card) {
      card.classList.add('active-step');
      card.classList.remove('completed-step');
    }
    activeStatus.textContent = `Active Mode: step ${index + 1} is live. Click it again to complete.`;
  }

  function markCompleted(index) {
    completedSteps.add(index);
    const card = stepsContainer.querySelector(`[data-index="${index}"]`);
    if (card) {
      card.classList.remove('active-step');
      card.classList.add('completed-step');
    }
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
    wrapper.innerHTML = 'No image assigned';
    const meta = card.querySelector('.meta');
    meta.textContent = 'Click a library image, then click here to assign';
  }

  function updateStepStateClasses(card, index) {
    card.classList.toggle('active-step', activeStepIndex === index);
    card.classList.toggle('completed-step', completedSteps.has(index));
  }

  function toggleActiveMode() {
    isActiveMode = !isActiveMode;
    if (!isActiveMode) {
      activeStatus.textContent = 'Active Mode is off. Assign images before starting.';
      toggleActiveBtn.textContent = 'Enter Active Mode';
      return;
    }

    toggleActiveBtn.textContent = 'Exit Active Mode';
    activeStatus.textContent = 'Active Mode: click any assigned step to make it live.';
  }

  function resetProgress() {
    completedSteps.clear();
    activeStepIndex = null;
    stepsContainer.querySelectorAll('.step-card').forEach((card) => {
      card.classList.remove('active-step', 'completed-step');
    });
    activeStatus.textContent = isActiveMode ? 'Active Mode: progress reset.' : 'Active Mode is off. Progress reset.';
  }

  function init() {
    loadPresetLibrary();
    buildSteps(stepCountInput.value);

    applyStepsBtn.addEventListener('click', () => buildSteps(stepCountInput.value));
    stepCountInput.addEventListener('change', () => buildSteps(stepCountInput.value));
    userUpload.addEventListener('change', handleUserUpload);
    toggleActiveBtn.addEventListener('click', toggleActiveMode);
    resetProgressBtn.addEventListener('click', resetProgress);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
