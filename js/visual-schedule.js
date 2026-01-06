(() => {
  const stepCountSelect = document.getElementById('stepCount');
  const stepsContainer = document.getElementById('steps');
  const selectedStepNote = document.getElementById('selectedStepNote');
  const activeModeToggle = document.getElementById('activeModeToggle');
  const userImagesInput = document.getElementById('userImagesInput');
  const userImagesContainer = document.getElementById('userImages');
  const libraryImagesContainer = document.getElementById('libraryImages');

  let steps = [];
  let selectedStepIndex = 0;
  let activeMode = false;
  let userImages = [];

  const states = {
    idle: 'idle',
    active: 'active',
    completed: 'completed',
  };

  const updateSelectedNote = () => {
    selectedStepNote.textContent = `Étape sélectionnée : ${selectedStepIndex + 1}`;
  };

  const setStepCount = (count) => {
    const numericCount = Math.min(10, Math.max(2, Number(count)));
    const nextSteps = Array.from({ length: numericCount }, (_, index) => steps[index] || {
      label: `Étape ${index + 1}`,
      imageSrc: '',
      state: states.idle,
    });

    steps = nextSteps;
    if (selectedStepIndex >= steps.length) {
      selectedStepIndex = steps.length - 1;
    }
    updateSelectedNote();
    renderSteps();
  };

  const clearActiveStates = () => {
    steps = steps.map((step) => ({ ...step, state: step.state === states.completed ? states.completed : states.idle }));
  };

  const setActiveStep = (index) => {
    if (!steps[index].imageSrc) return;
    if (steps[index].state === states.active) {
      steps[index].state = states.completed;
    } else {
      clearActiveStates();
      steps[index].state = steps[index].state === states.completed ? states.active : states.active;
    }
    renderSteps();
  };

  const selectStep = (index) => {
    selectedStepIndex = index;
    updateSelectedNote();
    renderSteps();
  };

  const assignImageToStep = (src, label) => {
    const step = steps[selectedStepIndex];
    steps[selectedStepIndex] = {
      ...step,
      label: label || step.label,
      imageSrc: src,
      state: states.idle,
    };

    if (selectedStepIndex < steps.length - 1) {
      selectedStepIndex += 1;
    }

    updateSelectedNote();
    renderSteps();
  };

  const renderSteps = () => {
    stepsContainer.innerHTML = '';
    steps.forEach((step, index) => {
      const card = document.createElement('article');
      card.className = 'step-card';
      if (index === selectedStepIndex && !activeMode) card.classList.add('selected');
      if (step.state === states.active) card.classList.add('active-state');
      if (step.state === states.completed) card.classList.add('completed');
      card.dataset.index = index;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Étape ${index + 1}${step.imageSrc ? `, ${step.label}` : ', aucune image'}`);

      const title = document.createElement('div');
      title.className = 'step-card__title';
      title.innerHTML = `<span>Étape ${index + 1}</span><span>${step.state === states.completed ? 'Fait' : 'En attente'}</span>`;

      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'step-card__image';
      if (step.imageSrc) {
        const img = document.createElement('img');
        img.src = step.imageSrc;
        img.alt = step.label;
        imageWrapper.innerHTML = '';
        imageWrapper.appendChild(img);
      } else {
        imageWrapper.textContent = 'Cliquez sur une image pour assigner cette étape';
      }

      const label = document.createElement('div');
      label.className = 'muted';
      label.textContent = step.label || `Étape ${index + 1}`;

      card.appendChild(title);
      card.appendChild(imageWrapper);
      card.appendChild(label);

      card.addEventListener('click', () => {
        if (activeMode) {
          setActiveStep(index);
        } else {
          selectStep(index);
        }
      });

      stepsContainer.appendChild(card);
    });
  };

  const renderImageTile = (container, image, label) => {
    const tile = document.createElement('button');
    tile.className = 'image-tile';
    tile.type = 'button';
    tile.addEventListener('click', () => assignImageToStep(image, label));

    const img = document.createElement('img');
    img.src = image;
    img.alt = label;

    const caption = document.createElement('div');
    caption.className = 'image-tile__caption';
    caption.textContent = label;

    tile.appendChild(img);
    tile.appendChild(caption);
    container.appendChild(tile);
  };

  const renderLibraryImages = () => {
    libraryImagesContainer.innerHTML = '';
    if (Array.isArray(window.imageLibraryArray)) {
      window.imageLibraryArray.slice(0, 24).forEach((item) => {
        renderImageTile(libraryImagesContainer, item.src, item.name);
      });
    } else {
      libraryImagesContainer.innerHTML = '<p class="muted">Aucune bibliothèque détectée.</p>';
    }
  };

  const renderUserImages = () => {
    if (!userImages.length) {
      userImagesContainer.innerHTML = '<p class="muted">Aucune image chargée pour le moment.</p>';
      return;
    }

    userImagesContainer.innerHTML = '';
    userImages.forEach((file) => {
      renderImageTile(userImagesContainer, file.src, file.name);
    });
  };

  activeModeToggle.addEventListener('click', () => {
    activeMode = !activeMode;
    activeModeToggle.setAttribute('aria-pressed', activeMode);
    activeModeToggle.textContent = activeMode ? 'Quitter le mode actif' : 'Passer en mode actif';
    if (!activeMode) {
      clearActiveStates();
      stepsContainer.classList.remove('active-mode');
      renderSteps();
    } else {
      stepsContainer.classList.add('active-mode');
    }
  });

  stepCountSelect.addEventListener('change', (event) => setStepCount(event.target.value));

  userImagesInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files || []);
    const images = files.filter((file) => file.type.startsWith('image/'));
    const readers = images.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ src: reader.result, name: file.name });
      reader.readAsDataURL(file);
    }));

    Promise.all(readers).then((results) => {
      userImages = results;
      renderUserImages();
    });
  });

  // Initialize
  setStepCount(stepCountSelect.value);
  renderLibraryImages();
  renderUserImages();
  updateSelectedNote();
})();
