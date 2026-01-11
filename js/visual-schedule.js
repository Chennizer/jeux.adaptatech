(function() {
  const minSteps = 2;
  const maxSteps = 10;
  const gapBase = 0.05; // 5vh
  const storageKey = 'visualScheduleState';
  const supportedLanguages = ['en', 'fr', 'ja'];
  const languageText = {
    en: { step: 'Step', launch: 'Launch', launchCount: 'Launch ({filled}/{total})' },
    fr: { step: 'Étape', launch: 'Lancer', launchCount: 'Lancer ({filled}/{total})' },
    ja: { step: 'ステップ', launch: '開始', launchCount: '開始 ({filled}/{total})' }
  };

  const optionsModal = document.getElementById('game-options');
  const pickerModal = document.getElementById('tile-picker-modal');

  const stepSlider = document.getElementById('step-count');
  const stepValue = document.getElementById('step-value');
  const orientationToggle = document.getElementById('orientation-toggle');
  const textToggle = document.getElementById('text-toggle');
  const numberToggle = document.getElementById('number-toggle');
  const captionSizeSlider = document.getElementById('caption-size');
  const captionSizeValue = document.getElementById('caption-size-value');
  const orderToggle = document.getElementById('order-toggle');
  const backgroundSelect = document.getElementById('background-select');
  const completedStyleSelect = document.getElementById('completed-style');
  const ttsToggle = document.getElementById('tts-toggle');

  const openPickerBtn = document.getElementById('choose-tiles-button');
  const backToOptionsBtn = document.getElementById('back-to-options');
  const launchBuilderBtn = document.getElementById('launch-builder');
  const clearSelectionBtn = document.getElementById('clear-selection');

  const presetGrid = document.getElementById('preset-grid');
  const presetCategorySelect = document.getElementById('preset-category');
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
  let isRestoring = false;
  let langToggle = null;
  let pictosManifest = null;
  let pictosCategories = [];
  const defaultPresetCategoryKey = 'mobilierClasse';
  let currentPresetCategory = defaultPresetCategoryKey;
  let presetObserver = null;

  function clampStepCount(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return minSteps;
    return Math.min(maxSteps, Math.max(minSteps, parsed));
  }

  function getCurrentLanguage() {
    const stored = localStorage.getItem('siteLanguage') || document.documentElement.lang || 'en';
    return supportedLanguages.includes(stored) ? stored : 'en';
  }

  function getTranslatedText(key) {
    const lang = getCurrentLanguage();
    return languageText[lang]?.[key] || languageText.en[key] || '';
  }

  function speakLabel(label) {
    if (!label || !('speechSynthesis' in window)) return;
    const lang = getCurrentLanguage();
    const utterance = new SpeechSynthesisUtterance(label);
    if (lang === 'fr') {
      utterance.lang = 'fr-CA';
    } else if (lang === 'ja') {
      utterance.lang = 'ja-JP';
    } else {
      utterance.lang = 'en-US';
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
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

  function getCategoryLabel(label, key) {
    const lang = getCurrentLanguage();
    const fallback = typeof label === 'string' ? label : null;
    if (!label || typeof label !== 'object') {
      return fallback || (key ? key.replaceAll('_', ' ') : '');
    }
    return label[lang] || label.en || label.fr || fallback || (key ? key.replaceAll('_', ' ') : '');
  }

  function normalizeItemLabels(label) {
    if (!label) return {};
    if (typeof label === 'string') {
      return { fr: label, en: label, ja: label };
    }
    if (typeof label === 'object') {
      const result = {};
      ['fr', 'en', 'ja'].forEach((lang) => {
        const entry = label[lang];
        if (!entry) return;
        if (typeof entry === 'string') {
          result[lang] = entry;
        } else if (typeof entry === 'object' && entry.word) {
          result[lang] = entry.word;
        }
      });
      return result;
    }
    return {};
  }

  function getImageLabel(name) {
    if (typeof name !== 'string') return '';
    const lastDot = name.lastIndexOf('.');
    if (lastDot <= 0) return name;
    return name.slice(0, lastDot);
  }

  function getImageDisplayName(image) {
    if (!image) return '';
    if (typeof image === 'string') return getImageLabel(image);
    const lang = getCurrentLanguage();
    const label = image.labels?.[lang] || image.labels?.en || image.labels?.fr || image.labels?.ja;
    if (label) return label;
    return getImageLabel(image.name || '');
  }

  function renderThumb(container, image, options = {}) {
    const { lazyLoad = false, observer = null } = options;
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.draggable = true;
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    if (lazyLoad && observer) {
      img.dataset.src = image.src;
    } else {
      img.src = image.src;
    }
    img.alt = getImageDisplayName(image);
    img.style.opacity = '0';
    img.addEventListener('load', () => {
      img.style.opacity = '1';
    });
    const label = document.createElement('span');
    label.className = 'thumb-label';
    label.textContent = getImageDisplayName(image);
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
    if (lazyLoad && observer) {
      observer.observe(img);
    }
  }

  function createPresetObserver() {
    if (!('IntersectionObserver' in window)) return null;
    return new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target;
          if (target.dataset?.src) {
            target.src = target.dataset.src;
            target.removeAttribute('data-src');
          }
          observer.unobserve(target);
        });
      },
      { root: presetGrid, rootMargin: '200px 0px', threshold: 0.01 }
    );
  }

  function populatePresetCategories() {
    if (!presetCategorySelect) return;
    presetCategorySelect.innerHTML = '';
    const lang = getCurrentLanguage();
    const allLabel = lang === 'fr' ? 'Toutes' : lang === 'ja' ? 'すべて' : 'All';
    const allOption = new Option(allLabel, '', false, false);
    allOption.setAttribute('data-fr', 'Toutes');
    allOption.setAttribute('data-en', 'All');
    allOption.setAttribute('data-ja', 'すべて');
    presetCategorySelect.add(allOption);
    pictosCategories.forEach((category) => {
      const label = getCategoryLabel(category.labels || category.label, category.key);
      const option = new Option(label, category.key, false, false);
      if (category.labels?.fr) option.setAttribute('data-fr', category.labels.fr);
      if (category.labels?.en) option.setAttribute('data-en', category.labels.en);
      if (category.labels?.ja) option.setAttribute('data-ja', category.labels.ja);
      presetCategorySelect.add(option);
    });
    if (
      !currentPresetCategory ||
      !pictosCategories.some((category) => category.key === currentPresetCategory)
    ) {
      currentPresetCategory = pictosCategories.some(
        (category) => category.key === defaultPresetCategoryKey
      )
        ? defaultPresetCategoryKey
        : '';
    }
    presetCategorySelect.value = currentPresetCategory || '';
  }

  function getPresetItems() {
    if (!pictosManifest) return [];
    if (!currentPresetCategory) {
      const allItems = [];
      pictosCategories.forEach((category) => {
        category.items.forEach((item) => allItems.push(item));
      });
      return allItems;
    }
    const category = pictosCategories.find((entry) => entry.key === currentPresetCategory);
    return category ? category.items : [];
  }

  function renderPresetItems() {
    presetGrid.innerHTML = '';
    if (presetObserver) {
      presetObserver.disconnect();
    }
    presetObserver = createPresetObserver();
    const items = getPresetItems();
    items.forEach((item, index) => {
      if (!item?.file) return;
      const src = `${pictosManifest.base}${item.file}`;
      const labels = normalizeItemLabels(item.name || item.label);
      const image = {
        name: labels.en || labels.fr || item.file || `Image ${index + 1}`,
        labels,
        src,
        origin: 'Preset'
      };
      renderThumb(presetGrid, image, { lazyLoad: true, observer: presetObserver });
    });
    if (!presetObserver) {
      presetGrid.querySelectorAll('img[data-src]').forEach((img) => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  async function loadPresetLibrary() {
    if (!presetGrid) return;
    try {
      if (!pictosManifest) {
        const response = await fetch('../../images/pictos/index.json', { cache: 'force-cache' });
        if (!response.ok) {
          throw new Error(`Unable to load pictos (${response.status})`);
        }
        const data = await response.json();
        const rawBase = typeof data.base === 'string' ? data.base : '../../images/pictos/';
        let base = new URL(rawBase, response.url).href;
        if (!base.endsWith('/')) {
          base += '/';
        }
        pictosManifest = { base };
        if (data.categories && typeof data.categories === 'object') {
          pictosCategories = Object.entries(data.categories)
            .map(([key, value]) => {
              const items = Array.isArray(value)
                ? value
                : Array.isArray(value?.items)
                  ? value.items
                  : [];
              return {
                key,
                label: value?.label,
                labels: value?.label,
                items
              };
            })
            .filter((category) => category.items.length > 0);
        }
        if (
          !currentPresetCategory ||
          !pictosCategories.some((category) => category.key === currentPresetCategory)
        ) {
          currentPresetCategory = pictosCategories.some(
            (category) => category.key === defaultPresetCategoryKey
          )
            ? defaultPresetCategoryKey
            : '';
        }
      }
      populatePresetCategories();
      renderPresetItems();
    } catch (error) {
      console.warn('Unable to load pictogram presets', error);
      presetGrid.innerHTML = '';
    }
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
        saveState();
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
    saveState();
  }

  async function handleUserUploadSingle(event) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    await Promise.all(files.map(addUserImage));
    renderUserImages();
    event.target.value = '';
    saveState();
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
    saveState();
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
      label.textContent = `${getTranslatedText('step')} ${index + 1}`;
      slot.appendChild(label);

      if (step.assignment) {
        slot.classList.add('filled');
        const img = document.createElement('img');
        img.className = 'slot-image';
        img.src = step.assignment.src;
        img.alt = getImageDisplayName(step.assignment);
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
    saveState();
  }

  function handleActiveStepClick(index) {
    if (!steps[index]?.assignment) return;
    if (orderToggle?.checked) {
      const nextIndex = steps.findIndex(
        (step, stepIndex) => step.assignment && !completedSteps.has(stepIndex)
      );
      if (nextIndex !== -1 && index !== nextIndex) {
        return;
      }
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
    updateStepStateClasses(null, index);
    if (previous !== null && previous !== index) {
      updateStepStateClasses(null, previous);
    }
    renderActiveSteps();
    if (
      isActiveMode &&
      ttsToggle?.checked &&
      previous !== index &&
      steps[index]?.assignment
    ) {
      speakLabel(getImageDisplayName(steps[index].assignment));
    }
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
    saveState();
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
    if (langToggle) {
      langToggle.style.display = 'none';
    }
    enterFullscreen();
  }

  function exitActiveMode() {
    isActiveMode = false;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    overlaySteps.style.removeProperty('--overlay-card-size');
    document.body.classList.remove('no-scroll');
    if (langToggle) {
      langToggle.style.display = 'inline-flex';
    }
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
    if (captionSizeSlider) {
      const scale = Number.parseFloat(captionSizeSlider.value) || 1;
      overlaySteps.style.setProperty('--overlay-caption-size', `${1.1 * scale}rem`);
    }
    overlaySteps.classList.remove('vertical', 'horizontal');
    overlaySteps.classList.add(orientationClass);
    overlaySteps.classList.toggle('single', steps.filter((step) => step.assignment).length <= 1);
    overlaySteps.classList.toggle('style-greyed', completedStyle === 'greyed');
    overlaySteps.classList.toggle('style-turn', completedStyle === 'turn');
    overlaySteps.classList.toggle('style-scribble', completedStyle === 'scribble');
    overlaySteps.classList.toggle('has-active-step', activeStepIndex !== null);

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
      img.alt = getImageDisplayName(step.assignment);
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
        caption.textContent = getImageDisplayName(step.assignment);
        card.appendChild(caption);
      }
      card.addEventListener('click', () => handleActiveStepClick(index));
      overlaySteps.appendChild(card);
      updateStepStateClasses(card, index);
    });
    adjustOverlaySizing(orientationClass);
  }

  function updateLaunchState() {
    const filled = steps.filter((step) => step.assignment).length;
    const total = steps.length;
    const ready = filled === total && total >= minSteps;
    const launchText = getTranslatedText('launch');
    const launchCountTemplate = getTranslatedText('launchCount');
    launchBuilderBtn.disabled = !ready;
    launchBuilderBtn.textContent = ready
      ? launchText
      : launchCountTemplate.replace('{filled}', String(filled)).replace('{total}', String(total));
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

  function saveState() {
    if (isRestoring) return;
    const state = {
      stepCount: steps.length,
      steps: steps.map((step) => (step.assignment ? { ...step.assignment } : null)),
      settings: {
        orientation: !!orientationToggle?.checked,
        showText: !!textToggle?.checked,
        showNumbers: !!numberToggle?.checked,
        enforceOrder: orderToggle ? !!orderToggle.checked : true,
        captionScale: captionSizeSlider ? Number.parseFloat(captionSizeSlider.value) || 1 : 1,
        background: backgroundSelect?.value || '#000000',
        completedStyle: completedStyleSelect?.value || 'greyed',
        tts: !!ttsToggle?.checked
      },
      userImages: userImages.map((image) => ({ ...image }))
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Unable to save visual schedule state', error);
    }
  }

  function loadState() {
    let state;
    try {
      state = JSON.parse(localStorage.getItem(storageKey));
    } catch (error) {
      return false;
    }
    if (!state) return false;

    isRestoring = true;
    if (typeof state.stepCount === 'number') {
      stepSlider.value = clampStepCount(state.stepCount);
    }
    if (state.settings) {
      orientationToggle.checked = !!state.settings.orientation;
      textToggle.checked = !!state.settings.showText;
      numberToggle.checked = !!state.settings.showNumbers;
      if (orderToggle) {
        orderToggle.checked = state.settings.enforceOrder !== false;
      }
      if (captionSizeSlider) {
        const scale = Number.parseFloat(state.settings.captionScale) || 1;
        captionSizeSlider.value = String(scale);
        if (captionSizeValue) {
          captionSizeValue.textContent = `${scale.toFixed(1)}×`;
        }
      }
      ttsToggle.checked = !!state.settings.tts;
      if (state.settings.background) {
        backgroundSelect.value = state.settings.background;
      }
      if (state.settings.completedStyle) {
        completedStyleSelect.value = state.settings.completedStyle;
      }
    }

    if (Array.isArray(state.userImages)) {
      userImages = state.userImages.map((image) => ({
        name: image.name || 'Image',
        src: image.src,
        origin: image.origin || 'User'
      }));
      renderUserImages();
    }

    setStepCount(stepSlider.value);

    if (Array.isArray(state.steps)) {
      steps = steps.map((step, index) => {
        const assignment = state.steps[index];
        return {
          assignment: assignment ? { ...assignment } : null
        };
      });
    }

    renderSelectionRow();
    updateLaunchState();
    updateOverlayBackground();
    isRestoring = false;
    return true;
  }

  function init() {
    loadPresetLibrary();
    if (!loadState()) {
      setStepCount(stepSlider.value);
    }
    stepSlider.addEventListener('input', (event) => setStepCount(event.target.value));
    orientationToggle.addEventListener('change', () => {
      if (isActiveMode) renderActiveSteps();
      saveState();
    });
    textToggle.addEventListener('change', () => {
      if (isActiveMode) renderActiveSteps();
      saveState();
    });
    numberToggle.addEventListener('change', () => {
      if (isActiveMode) renderActiveSteps();
      saveState();
    });
    if (captionSizeSlider) {
      captionSizeSlider.addEventListener('input', () => {
        const scale = Number.parseFloat(captionSizeSlider.value) || 1;
        if (captionSizeValue) {
          captionSizeValue.textContent = `${scale.toFixed(1)}×`;
        }
        if (isActiveMode) renderActiveSteps();
        saveState();
      });
      if (captionSizeValue) {
        const scale = Number.parseFloat(captionSizeSlider.value) || 1;
        captionSizeValue.textContent = `${scale.toFixed(1)}×`;
      }
    }
    if (orderToggle) {
      orderToggle.addEventListener('change', () => {
        saveState();
      });
    }
    ttsToggle.addEventListener('change', () => {
      saveState();
    });
    backgroundSelect.addEventListener('change', () => {
      updateOverlayBackground();
      if (isActiveMode) renderActiveSteps();
      saveState();
    });
    completedStyleSelect.addEventListener('change', () => {
      if (isActiveMode) renderActiveSteps();
      saveState();
    });
    if (presetCategorySelect) {
      presetCategorySelect.addEventListener('change', () => {
        currentPresetCategory = presetCategorySelect.value;
        renderPresetItems();
      });
    }

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

    langToggle = document.getElementById('langToggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        requestAnimationFrame(() => {
          populatePresetCategories();
          renderPresetItems();
          renderSelectionRow();
          updateLaunchState();
          if (isActiveMode) renderActiveSteps();
        });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
