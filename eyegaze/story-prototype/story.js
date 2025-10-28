const storyRoot = document.querySelector('[data-story-root]');

if (storyRoot) {
  const appState = {
    language: 'fr',
    stepIndex: -1,
    steps: [
      {
        type: 'story',
        visual: 'placeholder-dawn',
        title: {
          fr: 'Un matin dans la clairière',
          en: 'A morning in the clearing',
        },
        body: {
          fr: "L'histoire commence alors que le soleil se lève. La forêt s'éveille et invite le héros à explorer.",
          en: 'Our story begins as the sun rises. The forest awakens and invites the hero to explore.',
        },
      },
      {
        type: 'game',
        visual: 'placeholder-forest',
        gameId: 'cherry',
        title: {
          fr: 'Mini-jeu 1 · Cherry Blossom',
          en: 'Mini-game 1 · Cherry Blossom',
        },
        body: {
          fr: 'Faites apparaître les fleurs en fixant les branches dans le mini-jeu Cherry Blossom.',
          en: 'Bring blossoms to life by focusing on the branches in the Cherry Blossom game.',
        },
      },
      {
        type: 'story',
        visual: 'placeholder-forest',
        title: {
          fr: 'Respirer avec la rivière',
          en: 'Breathing with the river',
        },
        body: {
          fr: "Le héros suit le cours d'eau scintillant. L'air frais annonce un moment de calme.",
          en: 'The hero follows the shimmering river. The fresh air hints at a moment of calm.',
        },
      },
      {
        type: 'game',
        visual: 'placeholder-night',
        gameId: 'meditation',
        title: {
          fr: 'Mini-jeu 2 · Méditation',
          en: 'Mini-game 2 · Meditation',
        },
        body: {
          fr: 'Prenez une pause et synchronisez votre respiration dans le mini-jeu de méditation.',
          en: 'Take a pause and sync your breathing inside the meditation mini-game.',
        },
      },
      {
        type: 'story',
        visual: 'placeholder-lantern',
        title: {
          fr: 'La lumière guide le chemin',
          en: 'Light guides the path',
        },
        body: {
          fr: "Une douce lanterne apparaît. Elle révèle un passage secret vers la clairière suivante.",
          en: 'A soft lantern appears, revealing a secret passage toward the next clearing.',
        },
      },
      {
        type: 'game',
        visual: 'placeholder-lantern',
        gameId: 'lamp',
        title: {
          fr: 'Mini-jeu 3 · Lampe magique',
          en: 'Mini-game 3 · Magic Lamp',
        },
        body: {
          fr: 'Éclairez la nuit dans le mini-jeu de la lampe en gardant le regard sur la lumière.',
          en: 'Brighten the night in the lamp mini-game by keeping your gaze on the light.',
        },
      },
      {
        type: 'story',
        visual: 'placeholder-night',
        title: {
          fr: 'Retour au calme',
          en: 'Back to calm',
        },
        body: {
          fr: "La forêt s'apaise et le héros se repose. Demain apportera de nouvelles aventures.",
          en: 'The forest settles and the hero rests. Tomorrow will bring fresh adventures.',
        },
      },
    ],
  };

  const selectors = {
    overlay: document.getElementById('storyPrototypeOverlay'),
    menuScreen: storyRoot.querySelector('#menuScreen'),
    storyScreen: storyRoot.querySelector('#storyScreen'),
    gameScreen: storyRoot.querySelector('#gameScreen'),
    summaryScreen: storyRoot.querySelector('#summaryScreen'),
    sceneVisual: storyRoot.querySelector('#sceneVisual'),
    sceneTitle: storyRoot.querySelector('#sceneTitle'),
    sceneBody: storyRoot.querySelector('#sceneBody'),
    storyAdvance: storyRoot.querySelector('#storyAdvance'),
    gameTitle: storyRoot.querySelector('#gameTitle'),
    gameSummary: storyRoot.querySelector('#gameSummary'),
    gameHost: storyRoot.querySelector('#gameHost'),
    gameAdvance: storyRoot.querySelector('#gameAdvance'),
    restartStory: storyRoot.querySelector('#restartStory'),
    menuStart: storyRoot.querySelector('#menuStart'),
    stepLabel: storyRoot.querySelector('#stepLabel'),
    progressFill: storyRoot.querySelector('#progressFill'),
    languageToggle: storyRoot.querySelector('#languageToggle'),
    summaryTitle: storyRoot.querySelector('#summaryTitle'),
    summaryBody: storyRoot.querySelector('#summaryBody'),
    menuTitle: storyRoot.querySelector('#menuTitle'),
    menuDescription: storyRoot.querySelector('#menuDescription'),
    storyClose: storyRoot.querySelector('#storyClose'),
  };

  const dwellHandlers = new WeakMap();
  const gameContainers = new Map();

  selectors.gameHost?.querySelectorAll('.mini-game').forEach((el) => {
    const key = el.dataset.gameId;
    if (key) {
      gameContainers.set(key, el);
      el.setAttribute('aria-hidden', 'true');
    }
  });

  const launchers = document.querySelectorAll('[data-story-launch]');
  const dismissControls = document.querySelectorAll('[data-story-dismiss]');

  function getText(value) {
    if (typeof value === 'string') return value;
    if (!value) return '';
    return value[appState.language] ?? value.fr ?? value.en ?? '';
  }

  function applyLanguage(root = storyRoot) {
    if (!root) return;
    root.querySelectorAll('[data-fr]').forEach((el) => {
      if (el.id === 'languageToggle') return;
      const text = el.dataset[appState.language];
      if (text === undefined) return;
      if (el.classList.contains('dwell-cta')) {
        const labelEl = el.querySelector('.cta-label');
        if (labelEl) labelEl.textContent = text;
      } else {
        el.textContent = text;
      }
    });
  }

  function setScreen(activeScreen) {
    [selectors.menuScreen, selectors.storyScreen, selectors.gameScreen, selectors.summaryScreen].forEach((screen) => {
      if (!screen) return;
      screen.classList.toggle('active', screen === activeScreen);
    });
  }

  function updateProgress() {
    const total = appState.steps.length;
    if (appState.stepIndex < 0) {
      if (selectors.stepLabel) selectors.stepLabel.textContent = '';
      if (selectors.progressFill) {
        selectors.progressFill.style.width = '0%';
        selectors.progressFill.parentElement?.setAttribute('aria-valuenow', '0');
      }
      return;
    }

    const index = appState.stepIndex + 1;
    const percent = total > 0 ? Math.round((index / total) * 100) : 0;
    if (selectors.stepLabel) {
      const label = {
        fr: `Étape ${index} sur ${total}`,
        en: `Step ${index} of ${total}`,
      };
      selectors.stepLabel.textContent = getText(label);
    }
    if (selectors.progressFill) {
      selectors.progressFill.style.width = `${percent}%`;
      selectors.progressFill.parentElement?.setAttribute('aria-valuenow', String(percent));
    }
  }

  function cleanupDwell(el) {
    const entry = dwellHandlers.get(el);
    if (!entry) return;
    entry.cleanup();
    dwellHandlers.delete(el);
  }

  function setupDwell(el, callback, duration = 1600) {
    if (!el) return;
    cleanupDwell(el);
    el.setAttribute('role', el.getAttribute('role') || 'button');
    el.setAttribute('tabindex', el.getAttribute('tabindex') || '0');
    const progressEl = el.querySelector('.dwell-progress');
    let frameId = 0;
    let active = false;
    let startTime = 0;

    function resetVisual() {
      if (progressEl) progressEl.style.setProperty('--dwell-progress', '0%');
      el.classList.remove('dwell-active');
    }

    function cancel() {
      active = false;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      resetVisual();
    }

    function finish() {
      cancel();
      callback();
    }

    function tick(now) {
      if (!active) return;
      const elapsed = now - startTime;
      const ratio = Math.min(1, elapsed / duration);
      if (progressEl) {
        const percent = `${Math.floor(ratio * 100)}%`;
        progressEl.style.setProperty('--dwell-progress', percent);
      }
      if (ratio >= 1) {
        finish();
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    function start() {
      if (active) return;
      active = true;
      startTime = performance.now();
      el.classList.add('dwell-active');
      frameId = requestAnimationFrame(tick);
    }

    const onEnter = () => start();
    const onLeave = () => cancel();
    const onPointerDown = (event) => {
      event.preventDefault();
      finish();
    };
    const onKey = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        finish();
      }
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointercancel', onLeave);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('keydown', onKey);

    const cleanup = () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointercancel', onLeave);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('keydown', onKey);
      cancel();
    };

    dwellHandlers.set(el, { cleanup });
  }

  function hideAllGames() {
    gameContainers.forEach((el) => {
      el.classList.remove('active');
      el.setAttribute('aria-hidden', 'true');
    });
  }

  function showStory(step) {
    setScreen(selectors.storyScreen);
    updateProgress();
    if (selectors.sceneVisual) {
      selectors.sceneVisual.className = `scene-visual ${step.visual ?? ''}`;
    }
    if (selectors.sceneTitle) {
      selectors.sceneTitle.textContent = getText(step.title);
    }
    if (selectors.sceneBody) {
      selectors.sceneBody.textContent = getText(step.body);
    }
    if (selectors.storyAdvance) {
      setupDwell(selectors.storyAdvance, goToNextStep);
      const text = selectors.storyAdvance.dataset[appState.language];
      if (text) {
        const labelEl = selectors.storyAdvance.querySelector('.cta-label');
        if (labelEl) labelEl.textContent = text;
      }
    }
  }

  function showGame(step) {
    setScreen(selectors.gameScreen);
    updateProgress();
    if (selectors.gameTitle) selectors.gameTitle.textContent = getText(step.title);
    if (selectors.gameSummary) selectors.gameSummary.textContent = getText(step.body);
    hideAllGames();
    const container = step.gameId ? gameContainers.get(step.gameId) : undefined;
    if (container) {
      container.classList.add('active');
      container.setAttribute('aria-hidden', 'false');
    }
    if (selectors.gameAdvance) {
      setupDwell(selectors.gameAdvance, () => {
        goToNextStep();
      });
      const text = selectors.gameAdvance.dataset[appState.language];
      if (text) {
        const labelEl = selectors.gameAdvance.querySelector('.cta-label');
        if (labelEl) labelEl.textContent = text;
      }
    }
  }

  function showSummary() {
    setScreen(selectors.summaryScreen);
    if (selectors.stepLabel) selectors.stepLabel.textContent = '';
    if (selectors.progressFill) {
      selectors.progressFill.style.width = '100%';
      selectors.progressFill.parentElement?.setAttribute('aria-valuenow', '100');
    }
    if (selectors.restartStory) {
      setupDwell(selectors.restartStory, () => {
        appState.stepIndex = -1;
        hideAllGames();
        setScreen(selectors.menuScreen);
        updateMenuTexts();
        updateLanguageToggle();
        updateProgress();
      });
      const text = selectors.restartStory.dataset[appState.language];
      if (text) {
        const labelEl = selectors.restartStory.querySelector('.cta-label');
        if (labelEl) labelEl.textContent = text;
      }
    }
  }

  function goToNextStep() {
    const nextIndex = appState.stepIndex + 1;
    if (nextIndex >= appState.steps.length) {
      appState.stepIndex = appState.steps.length;
      showSummary();
      return;
    }
    appState.stepIndex = nextIndex;
    const step = appState.steps[appState.stepIndex];
    if (step.type === 'game') {
      showGame(step);
    } else {
      showStory(step);
    }
  }

  function updateLanguageToggle() {
    if (!selectors.languageToggle) return;
    selectors.languageToggle.textContent = appState.language === 'fr' ? 'EN' : 'FR';
    const label = selectors.languageToggle.dataset[appState.language];
    if (label) selectors.languageToggle.setAttribute('aria-label', label);
    document.documentElement.setAttribute('data-current-lang', appState.language);
  }

  function updateMenuTexts() {
    applyLanguage();
    if (selectors.storyAdvance) {
      const text = selectors.storyAdvance.dataset[appState.language];
      if (text) {
        const labelEl = selectors.storyAdvance.querySelector('.cta-label');
        if (labelEl) labelEl.textContent = text;
      }
    }
    if (selectors.gameAdvance) {
      const text = selectors.gameAdvance.dataset[appState.language];
      if (text) {
        const labelEl = selectors.gameAdvance.querySelector('.cta-label');
        if (labelEl) labelEl.textContent = text;
      }
    }
    if (selectors.restartStory) {
      const text = selectors.restartStory.dataset[appState.language];
      if (text) {
        const labelEl = selectors.restartStory.querySelector('.cta-label');
        if (labelEl) labelEl.textContent = text;
      }
    }
  }

  function startStory() {
    appState.stepIndex = -1;
    goToNextStep();
  }

  function openOverlay() {
    if (!selectors.overlay) return;
    selectors.overlay.classList.add('active');
    selectors.overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('story-overlay-open');
    appState.stepIndex = -1;
    hideAllGames();
    setScreen(selectors.menuScreen);
    updateMenuTexts();
    updateLanguageToggle();
    updateProgress();
    requestAnimationFrame(() => {
      selectors.menuStart?.focus({ preventScroll: true });
    });
  }

  function closeOverlay() {
    if (!selectors.overlay) return;
    selectors.overlay.classList.remove('active');
    selectors.overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('story-overlay-open');
    appState.stepIndex = -1;
    hideAllGames();
    setScreen(selectors.menuScreen);
    updateMenuTexts();
    updateLanguageToggle();
    updateProgress();
  }

  function handleLanguageToggle() {
    appState.language = appState.language === 'fr' ? 'en' : 'fr';
    localStorage.setItem('siteLanguage', appState.language);
    updateMenuTexts();
    updateLanguageToggle();
    if (appState.stepIndex >= 0 && appState.stepIndex < appState.steps.length) {
      const currentStep = appState.steps[appState.stepIndex];
      if (currentStep.type === 'game') {
        showGame(currentStep);
      } else {
        showStory(currentStep);
      }
    } else if (appState.stepIndex >= appState.steps.length) {
      showSummary();
    } else {
      setScreen(selectors.menuScreen);
      updateProgress();
    }
  }

  function init() {
    const siteLang = localStorage.getItem('siteLanguage');
    if (siteLang === 'en' || siteLang === 'fr') {
      appState.language = siteLang;
    }

    updateMenuTexts();
    updateLanguageToggle();
    updateProgress();
    setScreen(selectors.menuScreen);

    if (selectors.menuStart) {
      setupDwell(selectors.menuStart, startStory);
      const text = selectors.menuStart.dataset[appState.language];
      if (text) {
        const labelEl = selectors.menuStart.querySelector('.cta-label');
        if (labelEl) labelEl.textContent = text;
      }
    }

    if (selectors.languageToggle) {
      selectors.languageToggle.addEventListener('click', handleLanguageToggle);
    }

    launchers.forEach((launcher) => {
      launcher.addEventListener('click', (event) => {
        event.preventDefault();
        openOverlay();
      });
    });

    dismissControls.forEach((control) => {
      control.addEventListener('click', (event) => {
        event.preventDefault();
        closeOverlay();
      });
    });

    selectors.storyClose?.addEventListener('click', (event) => {
      event.preventDefault();
      closeOverlay();
    });

    selectors.overlay?.querySelector('.story-overlay-backdrop')?.addEventListener('click', closeOverlay);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && selectors.overlay?.classList.contains('active')) {
        closeOverlay();
      }
    });
  }

  init();
}
