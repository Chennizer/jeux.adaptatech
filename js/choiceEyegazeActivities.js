(function() {
  function getLang() {
    return localStorage.getItem('siteLanguage') || document.documentElement.lang || 'fr';
  }

  function getChoiceLabel(choice) {
    if (!choice) return '';
    const lang = getLang().startsWith('fr') ? 'fr' : 'en';
    if (choice.name && typeof choice.name === 'object') {
      return choice.name[lang] || choice.name.fr || choice.name.en || '';
    }
    return choice.name || '';
  }

  function normalizeCategories(choice) {
    if (!choice || !choice.categories) return [];
    return Array.isArray(choice.categories) ? choice.categories : [choice.categories];
  }

  function applyLanguageToDynamicContent() {
    const lang = getLang().startsWith('fr') ? 'fr' : 'en';
    document.documentElement.lang = lang;
    document.querySelectorAll('.translate').forEach((el) => {
      const fr = el.getAttribute('data-fr');
      const en = el.getAttribute('data-en');
      if (lang === 'fr' && fr != null) {
        el.textContent = fr;
      } else if (lang === 'en' && en != null) {
        el.textContent = en;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!Array.isArray(window.activityChoices)) {
      console.error('activityChoices not found');
      return;
    }

    const gameOptionsModal  = document.getElementById('game-options');
    const tileCountInput    = document.getElementById('tile-count');
    const tileCountValue    = document.getElementById('tile-count-value');
    const chooseTilesButton = document.getElementById('choose-tiles-button');
    const enableCycleSound  = document.getElementById('enable-cycle-sound');

    const fixationTimeInput = document.getElementById('fixation-time');
    const fixationTimeValue = document.getElementById('fixation-time-value');
    const tileSizeInput     = document.getElementById('tile-size');
    const tileSizeValue     = document.getElementById('tile-size-value');

    const showGazePointer   = document.getElementById('showGazePointer');
    const gazeSize          = document.getElementById('gazeSize');
    const gazeSizeVal       = document.getElementById('gazeSizeVal');
    const gazeOpacity       = document.getElementById('gazeOpacity');
    const gazeOpacityVal    = document.getElementById('gazeOpacityVal');
    const gpDetails         = document.getElementById('gpDetails');
    const gazePointer       = document.getElementById('gazePointer');

    const tilePickerModal   = document.getElementById('tile-picker-modal');
    const tilePickerGrid    = document.getElementById('tile-picker-grid');
    const tileCountDisplay  = document.getElementById('tile-count-display');
    const startGameButton   = document.getElementById('start-game-button');

    const languageToggle = document.getElementById('language-toggle') || document.getElementById('langToggle');
    const categorySelect    = document.getElementById('categorySelect');

    const tileContainer     = document.getElementById('tile-container');

    if (tileCountInput) {
      const totalChoices = Array.isArray(window.activityChoices) ? window.activityChoices.length : 9;
      const maxChoices = Math.min(9, totalChoices);
      tileCountInput.max = String(maxChoices);
      if ((parseInt(tileCountInput.value, 10) || 1) > maxChoices) {
        tileCountInput.value = String(maxChoices);
      }
    }

    let selectedTileIndices = [];
    let desiredTileCount    = parseInt(tileCountInput?.value, 10) || 1;
    let currentCategory     = 'all';

    const storedDwell = Number(window?.eyegazeSettings?.dwellTime);
    let fixationDelay = Number.isFinite(storedDwell)
      ? storedDwell
      : parseInt(fixationTimeInput?.value, 10) || 2000;
    let tileSize = parseInt(tileSizeInput?.value, 10) || 42;
    document.documentElement.style.setProperty('--hover-duration', fixationDelay + 'ms');
    document.documentElement.style.setProperty('--tile-size', tileSize + 'vh');
    const initialGap = 4.5 * (42 / tileSize);
    document.documentElement.style.setProperty('--tile-gap', initialGap + 'vh');

    const tileChoiceMap = new WeakMap();
    const POINTER_MOVE_THRESHOLD = 10;
    let hoveredTile = null;
    let hoveredChoice = null;
    let hoverTimeoutId = null;
    let requirePointerMotion = false;
    let lastPointerPosition = null;
    let pointerMotionOrigin = null;
    let pendingGuardedHover = null;

    function ensurePointerOverlay() {
      if (!gazePointer) return null;
      let overlay = document.getElementById('gazePointerOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'gazePointerOverlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '2147483647';
        overlay.style.overflow = 'visible';
        document.body.appendChild(overlay);
      }
      if (gazePointer.parentElement !== overlay) {
        overlay.appendChild(gazePointer);
      }
      return overlay;
    }

    function isElementShown(el) {
      if (!el) return false;
      const inline = el.style && typeof el.style.display === 'string' ? el.style.display : '';
      if (inline) {
        return inline !== 'none';
      }
      if (window.getComputedStyle) {
        const computed = window.getComputedStyle(el);
        return computed ? computed.display !== 'none' : false;
      }
      return true;
    }

    function isPointerStageActive() {
      if (isElementShown(gameOptionsModal)) return false;
      if (isElementShown(tilePickerModal)) return false;
      return isElementShown(tileContainer);
    }

    function setPointerPos(x, y) {
      if (!gazePointer) return;
      gazePointer.style.left = `${x}px`;
      gazePointer.style.top = `${y}px`;
    }

    function setPointerDwell(active) {
      if (!gazePointer) return;
      gazePointer.classList.toggle('gp-dwell', !!active);
    }

    function pointerSizeFromControls() {
      return parseInt(gazeSize?.value, 10) || 36;
    }

    function pointerOpacityFromControls() {
      const raw = parseInt(gazeOpacity?.value, 10);
      return Math.max(0, Math.min(1, (isNaN(raw) ? 100 : raw) / 100));
    }

    function refreshPointerStyles() {
      if (!gazePointer) return;
      const size = pointerSizeFromControls();
      const opct = pointerOpacityFromControls();
      if (gazeSizeVal) gazeSizeVal.textContent = size;
      if (gazeOpacityVal) gazeOpacityVal.textContent = Math.round(opct * 100);
      gazePointer.style.setProperty('--gp-size', `${size}px`);
      const pointerEnabled = !!showGazePointer?.checked;
      const pointerVisible = pointerEnabled && isPointerStageActive();
      const hideNativeCursor = pointerVisible;
      document.documentElement.classList.toggle('hide-native-cursor', hideNativeCursor);
      if (!pointerVisible) {
        setPointerDwell(false);
        if (gpDetails) gpDetails.open = false;
      }
      gazePointer.style.opacity = pointerVisible ? opct : 0;
      if (pointerVisible && lastPointerPosition) {
        setPointerPos(lastPointerPosition.x, lastPointerPosition.y);
      }
    }

    function syncPointerSettingsToStore() {
      try {
        if (window.eyegazeSettings) {
          window.eyegazeSettings.showGazePointer  = !!showGazePointer?.checked;
          window.eyegazeSettings.gazePointerSize  = pointerSizeFromControls();
          window.eyegazeSettings.gazePointerAlpha = pointerOpacityFromControls();
        }
      } catch (e) {}
    }

    ensurePointerOverlay();

    function hideLanguageToggle() {
      if (languageToggle) {
        languageToggle.style.display = 'none';
      }
    }

    if (gazePointer) {
      const rawHandler = (event) => {
        lastPointerPosition = { x: event.clientX, y: event.clientY };
        setPointerPos(event.clientX, event.clientY);
      };

      if ('onpointerrawupdate' in window) {
        window.addEventListener('pointerrawupdate', rawHandler, { passive: true });
      }

      window.addEventListener('pointerleave', () => {
        gazePointer._savedOpacity = gazePointer.style.opacity;
        gazePointer.style.opacity = 0;
      });

      window.addEventListener('pointerenter', () => {
        refreshPointerStyles();
        if (lastPointerPosition) {
          setPointerPos(lastPointerPosition.x, lastPointerPosition.y);
        }
      });
    }

    function clearHoverState() {
      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId);
        hoverTimeoutId = null;
      }
      setPointerDwell(false);
      if (hoveredTile) {
        hoveredTile.classList.remove('selected');
        hoveredTile = null;
      }
      hoveredChoice = null;
      pendingGuardedHover = null;
    }

    function requirePointerMotionBeforeHover({ clearSelection = true } = {}) {
      if (clearSelection) {
        clearHoverState();
      }
      requirePointerMotion = true;
      pendingGuardedHover = null;
      if (tileContainer) {
        tileContainer.classList.add('pointer-motion-required');
      }
      pointerMotionOrigin = lastPointerPosition
        ? { x: lastPointerPosition.x, y: lastPointerPosition.y }
        : null;
    }

    function playCycleSound() {
      if (enableCycleSound && enableCycleSound.checked) {
        const cycleSound = new Audio('../../sounds/woosh.mp3');
        cycleSound.play().catch(() => {});
      }
    }

    let preferredVoice = null;

    function choosePreferredVoice() {
      const ss = window.speechSynthesis;
      if (!ss || !ss.getVoices) return;
      const voices = ss.getVoices() || [];
      if (!voices.length) return;

      const lang = getLang().startsWith('fr') ? 'fr' : 'en';
      const by = (fn) => voices.find(fn);
      if (lang === 'fr') {
        preferredVoice =
          by(v => /sylvie/i.test(v.name || '') && /^fr[-_]?CA/i.test(v.lang || '')) ||
          by(v => /^fr[-_]?CA/i.test(v.lang || '')) ||
          by(v => /^fr[-_]?FR/i.test(v.lang || '')) ||
          by(v => (v.lang || '').toLowerCase().startsWith('fr')) ||
          voices[0];
      } else {
        preferredVoice =
          by(v => /^en[-_]?CA/i.test(v.lang || '')) ||
          by(v => /^en[-_]?US/i.test(v.lang || '')) ||
          by(v => /^en[-_]?GB/i.test(v.lang || '')) ||
          by(v => (v.lang || '').toLowerCase().startsWith('en')) ||
          voices[0];
      }
    }

    function computeVolume() {
      const settings = window.eyegazeSettings || {};
      if (settings.sfxMuted) return 0;
      if (typeof settings.sfxVolume === 'number') {
        return Math.max(0, Math.min(1, settings.sfxVolume / 100));
      }
      return 1;
    }

    function makeUtterance(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = getLang().startsWith('fr') ? 'fr-CA' : 'en-CA';
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang || lang;
      } else {
        utterance.lang = lang;
      }
      utterance.rate = 1.0;
      utterance.volume = computeVolume();
      return utterance;
    }

    function speakChoice(choice) {
      if (!choice || !('speechSynthesis' in window)) return;
      const text = getChoiceLabel(choice);
      if (!text) return;
      try { window.speechSynthesis.cancel(); } catch (e) {}
      window.speechSynthesis.speak(makeUtterance(text));
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', choosePreferredVoice);
      choosePreferredVoice();
    }

    function scheduleHoverCountdown() {
      if (!hoveredTile || !hoveredChoice) {
        return;
      }
      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId);
        hoverTimeoutId = null;
        setPointerDwell(false);
      }
      hoverTimeoutId = setTimeout(() => {
        if (hoveredTile && hoveredChoice && tileContainer.contains(hoveredTile)) {
          speakChoice(hoveredChoice);
          setPointerDwell(false);
        }
        hoverTimeoutId = null;
      }, fixationDelay);
      setPointerDwell(true);
    }

    function handleTileEnter(tile, choice, options = {}) {
      const { playSound = true } = options;
      if (requirePointerMotion) {
        const tileChanged = hoveredTile !== tile;

        if (hoverTimeoutId) {
          clearTimeout(hoverTimeoutId);
          hoverTimeoutId = null;
          setPointerDwell(false);
        }

        if (hoveredTile) {
          hoveredTile.classList.remove('selected');
          hoveredTile = null;
        }

        hoveredChoice = null;
        tile.classList.remove('selected');
        pendingGuardedHover = { tile, choice, playSound: playSound && tileChanged };
        return;
      }

      pendingGuardedHover = null;

      const tileChanged = hoveredTile !== tile;

      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId);
        hoverTimeoutId = null;
        setPointerDwell(false);
      }

      if (tileChanged && hoveredTile) {
        hoveredTile.classList.remove('selected');
      }

      hoveredTile = tile;
      hoveredChoice = choice;
      tile.classList.add('selected');

      if (playSound && tileChanged) {
        playCycleSound();
      }

      scheduleHoverCountdown();
    }

    function handleTileLeave(tile) {
      if (pendingGuardedHover && pendingGuardedHover.tile === tile) {
        pendingGuardedHover = null;
      }
      if (hoveredTile === tile) {
        clearHoverState();
      } else {
        tile.classList.remove('selected');
      }
    }

    function createTile(choice) {
      const tile = document.createElement('div');
      tile.classList.add('tile');
      tile.style.backgroundImage = `url(${choice.image})`;
      const caption = document.createElement('div');
      caption.classList.add('caption', 'translate');
      const frLabel = choice.name && typeof choice.name === 'object' ? (choice.name.fr || choice.name.en || '') : (choice.name || '');
      const enLabel = choice.name && typeof choice.name === 'object' ? (choice.name.en || choice.name.fr || '') : (choice.name || '');
      caption.dataset.fr = frLabel;
      caption.dataset.en = enLabel;
      const lang = getLang().startsWith('fr') ? 'fr' : 'en';
      caption.textContent = caption.dataset[lang] || caption.dataset.fr || caption.dataset.en || '';
      tile.appendChild(caption);

      tileChoiceMap.set(tile, choice);

      tile.addEventListener('mouseenter', () => {
        handleTileEnter(tile, choice);
      });

      tile.addEventListener('mouseleave', () => {
        handleTileLeave(tile);
      });

      return tile;
    }

    function populateCategorySelect() {
      if (!categorySelect) return;
      const existing = new Set(['all']);
      const lang = getLang().startsWith('fr') ? 'fr' : 'en';
      window.activityChoices.forEach(choice => {
        normalizeCategories(choice).forEach(cat => existing.add(cat));
      });
      categorySelect.innerHTML = '';
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.classList.add('translate');
      allOption.dataset.fr = '-- Toutes --';
      allOption.dataset.en = '-- All --';
      allOption.textContent = lang === 'fr' ? allOption.dataset.fr : allOption.dataset.en;
      categorySelect.appendChild(allOption);

      existing.forEach(catId => {
        if (catId === 'all') return;
        const option = document.createElement('option');
        option.value = catId;
        const label = window.activityCategoryLabels?.[catId];
        const fr = label?.fr || catId;
        const en = label?.en || catId;
        option.classList.add('translate');
        option.dataset.fr = fr;
        option.dataset.en = en;
        option.textContent = lang === 'fr' ? fr : en;
        categorySelect.appendChild(option);
      });
    }

    function matchesCategory(choice) {
      if (currentCategory === 'all') return true;
      const cats = normalizeCategories(choice);
      return cats.includes(currentCategory);
    }

    function populateTilePickerGrid() {
      if (!tilePickerGrid) return;
      tilePickerGrid.innerHTML = '';
      window.activityChoices.forEach((choice, index) => {
        const inCategory = matchesCategory(choice);
        const isSelected = selectedTileIndices.includes(index);
        if (inCategory || isSelected) {
          const tileOption = document.createElement('div');
          tileOption.classList.add('tile');
          tileOption.setAttribute('data-index', index);
          tileOption.style.backgroundImage = `url(${choice.image})`;
          if (isSelected) {
            tileOption.classList.add('selected');
          }
          const caption = document.createElement('div');
          caption.classList.add('caption', 'translate');
          const lang = getLang().startsWith('fr') ? 'fr' : 'en';
          const frLabel = choice.shortName?.fr || choice.name?.fr || choice.name || '';
          const enLabel = choice.shortName?.en || choice.name?.en || choice.name || '';
          caption.dataset.fr = frLabel;
          caption.dataset.en = enLabel;
          caption.textContent = lang === 'fr' ? frLabel : enLabel;
          tileOption.appendChild(caption);
          tileOption.addEventListener('click', () => {
            if (isSelected) {
              selectedTileIndices = selectedTileIndices.filter(i => i !== index);
            } else if (selectedTileIndices.length < desiredTileCount) {
              selectedTileIndices.push(index);
            }
            updateStartButtonState();
            populateTilePickerGrid();
          });
          tilePickerGrid.appendChild(tileOption);
        }
      });
    }

    function updateStartButtonState() {
      if (!startGameButton) return;
      startGameButton.disabled = (selectedTileIndices.length !== desiredTileCount);
    }

    function renderGameTiles() {
      if (!tileContainer) return;
      tileContainer.innerHTML = '';
      const tilesToDisplay = selectedTileIndices.map(i => window.activityChoices[i]);

      const resetContainerLayout = () => {
        tileContainer.style.display = 'flex';
        tileContainer.style.flexDirection = 'column';
        tileContainer.style.justifyContent = 'center';
        tileContainer.style.alignItems = 'center';
        tileContainer.style.gap = 'var(--tile-gap-clamped, var(--tile-gap))';
        tileContainer.style.gridTemplateColumns = '';
        tileContainer.style.width = '';
        tileContainer.style.margin = '';
        tileContainer.style.padding = '';
        tileContainer.style.rowGap = '';
        tileContainer.style.removeProperty('--tile-rows');
        tileContainer.classList.remove('grid-layout');
      };

      const applyGridLayout = (columns, rows) => {
        const clampedColumns = Math.max(2, Math.min(3, columns || 3));
        const resolvedRows = Math.max(2, rows || Math.ceil((tilesToDisplay.length || 0) / clampedColumns));
        tileContainer.classList.add('grid-layout');
        tileContainer.style.display = 'grid';
        tileContainer.style.gridTemplateColumns = `repeat(${clampedColumns}, minmax(0, 1fr))`;
        tileContainer.style.gap = 'var(--tile-gap-clamped, var(--tile-gap))';
        tileContainer.style.rowGap = 'var(--tile-gap-clamped, var(--tile-gap))';
        tileContainer.style.justifyItems = 'center';
        tileContainer.style.alignItems = 'center';
        tileContainer.style.alignContent = 'center';
        tileContainer.style.justifyContent = 'center';
        tileContainer.style.width = 'min(1200px, 98vw)';
        tileContainer.style.margin = '0 auto';
        tileContainer.style.padding = 'calc(var(--tile-gap-clamped, 20px) * 0.75)';
        tileContainer.style.setProperty('--tile-columns', clampedColumns);
        tileContainer.style.setProperty('--tile-rows', resolvedRows);
      };

      resetContainerLayout();

      const isPair = tilesToDisplay.length === 2;
      tileContainer.classList.toggle('two-tiles', isPair);
      tileContainer.classList.toggle('grid-layout', !isPair && tilesToDisplay.length > 2);

      if (!tilesToDisplay.length) {
        requirePointerMotionBeforeHover();
        return;
      }

      if (isPair) {
        tilesToDisplay.forEach(choice => tileContainer.appendChild(createTile(choice)));
      } else if (tilesToDisplay.length <= 2) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'center';
        row.style.gap = 'var(--tile-gap-clamped, var(--tile-gap))';
        tilesToDisplay.forEach(choice => row.appendChild(createTile(choice)));
        tileContainer.appendChild(row);
      } else {
        const columns = tilesToDisplay.length > 6
          ? 3
          : Math.min(3, Math.ceil(tilesToDisplay.length / 2));
        const rows = Math.max(2, Math.ceil(tilesToDisplay.length / columns));
        applyGridLayout(columns, rows);
        tilesToDisplay.forEach(choice => tileContainer.appendChild(createTile(choice)));
      }
      requirePointerMotionBeforeHover();
      refreshPointerStyles();
    }

    document.addEventListener('pointermove', event => {
      const { clientX, clientY } = event;
      setPointerPos(clientX, clientY);
      const targetElement = event.target instanceof Element ? event.target : null;
      const previousPosition = lastPointerPosition;
      lastPointerPosition = { x: clientX, y: clientY };

      if (requirePointerMotion) {
        if (!pointerMotionOrigin) {
          if (previousPosition) {
            pointerMotionOrigin = { x: previousPosition.x, y: previousPosition.y };
          } else {
            pointerMotionOrigin = { x: clientX, y: clientY };
            return;
          }
        }

        const dx = clientX - pointerMotionOrigin.x;
        const dy = clientY - pointerMotionOrigin.y;

        if (Math.hypot(dx, dy) >= POINTER_MOVE_THRESHOLD) {
          requirePointerMotion = false;
          pointerMotionOrigin = null;
          if (tileContainer) {
            tileContainer.classList.remove('pointer-motion-required');
          }

          const pending = pendingGuardedHover;
          pendingGuardedHover = null;

          if (
            pending &&
            tileChoiceMap.has(pending.tile) &&
            tileContainer.contains(pending.tile) &&
            tileContainer.style.display !== 'none'
          ) {
            handleTileEnter(pending.tile, pending.choice, { playSound: pending.playSound });
          } else {
            const tile = targetElement ? targetElement.closest('.tile') : null;
            if (
              tile &&
              tileChoiceMap.has(tile) &&
              tileContainer.contains(tile) &&
              tileContainer.style.display !== 'none'
            ) {
              handleTileEnter(tile, tileChoiceMap.get(tile), { playSound: false });
            }
          }
        }
        return;
      }

      const tile = targetElement ? targetElement.closest('.tile') : null;
      if (
        tile &&
        tileChoiceMap.has(tile) &&
        tileContainer.contains(tile) &&
        tile !== hoveredTile
      ) {
        handleTileEnter(tile, tileChoiceMap.get(tile));
      }
    });

    if (tileCountInput && tileCountValue) {
      tileCountValue.textContent = tileCountInput.value;
      tileCountInput.addEventListener('input', () => {
        tileCountValue.textContent = tileCountInput.value;
      });
    }

    if (fixationTimeInput && fixationTimeValue) {
      fixationTimeInput.value = fixationDelay;
      fixationTimeValue.textContent = fixationDelay;

      const persistDwell = (val) => {
        if (typeof setEyegazeDwellTime === 'function') {
          setEyegazeDwellTime(val);
        } else if (window?.eyegazeSettings) {
          eyegazeSettings.dwellTime = val;
          try { localStorage.setItem('eyegazeDwellTime', val); } catch (e) {}
        }
      };

      fixationTimeInput.addEventListener('input', () => {
        const dwellVal = parseInt(fixationTimeInput.value, 10) || 2000;
        fixationDelay = dwellVal;
        fixationTimeValue.textContent = dwellVal;
        document.documentElement.style.setProperty('--hover-duration', dwellVal + 'ms');
        persistDwell(dwellVal);
      });
    }

    if (tileSizeInput && tileSizeValue) {
      tileSizeValue.textContent = tileSize;
      tileSizeInput.addEventListener('input', () => {
        tileSize = parseInt(tileSizeInput.value, 10);
        tileSizeValue.textContent = tileSize;
        document.documentElement.style.setProperty('--tile-size', tileSize + 'vh');
        const newGap = 4.5 * (42 / tileSize);
        document.documentElement.style.setProperty('--tile-gap', newGap + 'vh');
      });
    }

    (function initPointerControls() {
      if (!showGazePointer && !gazeSize && !gazeOpacity) {
        return;
      }

      try {
        const settings = window.eyegazeSettings;
        if (settings) {
          if (showGazePointer && typeof settings.showGazePointer === 'boolean') {
            showGazePointer.checked = settings.showGazePointer;
          }
          if (gazeSize && typeof settings.gazePointerSize === 'number') {
            const min = parseInt(gazeSize.min || '16', 10);
            const max = parseInt(gazeSize.max || '100', 10);
            const stored = Math.round(settings.gazePointerSize);
            if (!Number.isNaN(stored)) {
              const clamped = Math.max(min, Math.min(max, stored));
              gazeSize.value = clamped;
            }
          }
          if (gazeOpacity && typeof settings.gazePointerAlpha === 'number') {
            const min = parseInt(gazeOpacity.min || '0', 10);
            const max = parseInt(gazeOpacity.max || '100', 10);
            const stored = Math.round(Math.max(0, Math.min(1, settings.gazePointerAlpha)) * 100);
            const clamped = Math.max(min || 0, Math.min(max || 100, stored));
            gazeOpacity.value = clamped;
          }
        }
      } catch (e) {}

      refreshPointerStyles();
      syncPointerSettingsToStore();

      if (showGazePointer) {
        showGazePointer.addEventListener('change', () => {
          syncPointerSettingsToStore();
          refreshPointerStyles();
        });
      }

      [gazeSize, gazeOpacity].forEach((ctrl) => {
        if (!ctrl) return;
        ctrl.addEventListener('input', () => {
          syncPointerSettingsToStore();
          refreshPointerStyles();
        });
      });
    })();

    function ensureFullscreen() {
      if (!document.fullscreenElement) {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen || function() {};
        req.call(el);
      }
    }

    chooseTilesButton?.addEventListener('click', () => {
      const maxChoices = Math.min(9, window.activityChoices.length);
      desiredTileCount = Math.min(parseInt(tileCountInput.value, 10) || 1, maxChoices);
      if (tileCountInput.value !== String(desiredTileCount)) {
        tileCountInput.value = String(desiredTileCount);
      }
      tileCountValue.textContent = tileCountInput.value;
      tileCountDisplay.textContent = desiredTileCount;
      selectedTileIndices = [];
      updateStartButtonState();
      gameOptionsModal.style.display = 'none';
      tilePickerModal.style.display = 'flex';
      ensureFullscreen();
      currentCategory = 'all';
      if (categorySelect) {
        categorySelect.value = 'all';
      }
      populateCategorySelect();
      populateTilePickerGrid();
      refreshPointerStyles();
    });

    startGameButton?.addEventListener('click', () => {
      hideLanguageToggle();
      tilePickerModal.style.display = 'none';
      renderGameTiles();
    });

    categorySelect?.addEventListener('change', e => {
      currentCategory = e.target.value;
      populateTilePickerGrid();
    });

    populateCategorySelect();
    populateTilePickerGrid();
    applyLanguageToDynamicContent();

    window.addEventListener('siteLanguageChanged', () => {
      applyLanguageToDynamicContent();
      const previousCategory = currentCategory;
      populateCategorySelect();
      if (categorySelect) {
        const hasOption = Array.from(categorySelect.options || []).some(opt => opt.value === previousCategory);
        categorySelect.value = hasOption ? previousCategory : 'all';
        currentCategory = categorySelect.value;
      }
      populateTilePickerGrid();
      renderGameTiles();
      choosePreferredVoice();
      applyLanguageToDynamicContent();
    });
  });
})();
