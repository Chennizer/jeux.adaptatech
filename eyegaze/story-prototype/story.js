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
      title: {
        fr: 'Mini-jeu 1 · Cherry Blossom',
        en: 'Mini-game 1 · Cherry Blossom',
      },
      body: {
        fr: 'Faites apparaître les fleurs en fixant les branches dans le mini-jeu Cherry Blossom.',
        en: 'Bring blossoms to life by focusing on the branches in the Cherry Blossom game.',
      },
      url: '../cherryblossom/index.html',
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
      title: {
        fr: 'Mini-jeu 2 · Méditation',
        en: 'Mini-game 2 · Meditation',
      },
      body: {
        fr: 'Prenez une pause et synchronisez votre respiration dans le mini-jeu de méditation.',
        en: 'Take a pause and sync your breathing inside the meditation mini-game.',
      },
      url: '../meditation/index.html',
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
      title: {
        fr: 'Mini-jeu 3 · Lampe magique',
        en: 'Mini-game 3 · Magic Lamp',
      },
      body: {
        fr: 'Éclairez la nuit dans le mini-jeu de la lampe en gardant le regard sur la lumière.',
        en: 'Brighten the night in the lamp mini-game by keeping your gaze on the light.',
      },
      url: '../lamp/index.html',
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
  menuScreen: document.getElementById('menuScreen'),
  storyScreen: document.getElementById('storyScreen'),
  gameScreen: document.getElementById('gameScreen'),
  summaryScreen: document.getElementById('summaryScreen'),
  sceneVisual: document.getElementById('sceneVisual'),
  sceneTitle: document.getElementById('sceneTitle'),
  sceneBody: document.getElementById('sceneBody'),
  storyAdvance: document.getElementById('storyAdvance'),
  gameTitle: document.getElementById('gameTitle'),
  gameSummary: document.getElementById('gameSummary'),
  gameFrame: document.getElementById('gameFrame'),
  gameExternal: document.getElementById('gameExternal'),
  gameAdvance: document.getElementById('gameAdvance'),
  restartStory: document.getElementById('restartStory'),
  menuStart: document.getElementById('menuStart'),
  stepLabel: document.getElementById('stepLabel'),
  progressFill: document.getElementById('progressFill'),
  languageToggle: document.getElementById('languageToggle'),
  summaryTitle: document.getElementById('summaryTitle'),
  summaryBody: document.getElementById('summaryBody'),
  menuTitle: document.getElementById('menuTitle'),
  menuDescription: document.getElementById('menuDescription'),
};

const dwellHandlers = new WeakMap();

function getText(value) {
  if (typeof value === 'string') return value;
  if (!value) return '';
  return value[appState.language] ?? value.fr ?? value.en ?? '';
}

function setScreen(activeScreen) {
  [selectors.menuScreen, selectors.storyScreen, selectors.gameScreen, selectors.summaryScreen].forEach((screen) => {
    if (!screen) return;
    screen.classList.toggle('active', screen === activeScreen);
  });
}

function updateProgress() {
  const total = appState.steps.length;
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

function resetFrame() {
  if (selectors.gameFrame) {
    selectors.gameFrame.src = '';
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
    const label = {
      fr: 'Regardez ici pour continuer',
      en: 'Look here to continue',
    };
    selectors.storyAdvance.querySelector('.cta-label').textContent = getText(label);
    setupDwell(selectors.storyAdvance, goToNextStep);
  }
}

function showGame(step) {
  setScreen(selectors.gameScreen);
  updateProgress();
  if (selectors.gameTitle) selectors.gameTitle.textContent = getText(step.title);
  if (selectors.gameSummary) selectors.gameSummary.textContent = getText(step.body);
  if (selectors.gameFrame) selectors.gameFrame.src = step.url;
  if (selectors.gameExternal) {
    selectors.gameExternal.href = step.url;
    const label = {
      fr: 'Ouvrir le mini-jeu dans un nouvel onglet',
      en: 'Open the mini-game in a new tab',
    };
    selectors.gameExternal.textContent = getText(label);
  }
  if (selectors.gameAdvance) {
    const label = {
      fr: "Retour à l'histoire",
      en: 'Back to the story',
    };
    selectors.gameAdvance.querySelector('.cta-label').textContent = getText(label);
    setupDwell(selectors.gameAdvance, () => {
      resetFrame();
      goToNextStep();
    });
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
    const label = {
      fr: 'Revenir au menu',
      en: 'Back to the menu',
    };
    selectors.restartStory.querySelector('.cta-label').textContent = getText(label);
    setupDwell(selectors.restartStory, () => {
      resetFrame();
      appState.stepIndex = -1;
      setScreen(selectors.menuScreen);
      updateMenuTexts();
      updateLanguageToggle();
    });
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
  const label = appState.language === 'fr'
    ? 'Basculer en anglais'
    : 'Switch to French';
  selectors.languageToggle.setAttribute('aria-label', label);
  document.documentElement.setAttribute('data-current-lang', appState.language);
}

function updateMenuTexts() {
  if (selectors.menuTitle) selectors.menuTitle.textContent = selectors.menuTitle.dataset[appState.language] ?? selectors.menuTitle.textContent;
  if (selectors.menuDescription) selectors.menuDescription.textContent = selectors.menuDescription.dataset[appState.language] ?? selectors.menuDescription.textContent;
  selectors.menuScreen?.querySelectorAll('[data-fr]').forEach((el) => {
    const text = el.dataset[appState.language];
    if (text) {
      el.textContent = text;
    }
  });
  selectors.summaryScreen?.querySelectorAll('[data-fr]').forEach((el) => {
    const text = el.dataset[appState.language];
    if (text) {
      el.textContent = text;
    }
  });
  selectors.menuScreen?.querySelectorAll('.dwell-cta .cta-label').forEach((labelEl) => {
    const parent = labelEl.closest('.dwell-cta');
    if (!parent) return;
    const text = parent.dataset[appState.language];
    if (text) labelEl.textContent = text;
  });
}

function startStory() {
  appState.stepIndex = -1;
  goToNextStep();
}

function init() {
  updateMenuTexts();
  updateLanguageToggle();
  if (selectors.menuStart) {
    selectors.menuStart.querySelector('.cta-label').textContent = selectors.menuStart.dataset[appState.language] ?? '';
    setupDwell(selectors.menuStart, startStory);
  }
  if (selectors.languageToggle) {
    selectors.languageToggle.addEventListener('click', () => {
      appState.language = appState.language === 'fr' ? 'en' : 'fr';
      updateMenuTexts();
      updateLanguageToggle();
      if (appState.stepIndex >= 0 && appState.stepIndex < appState.steps.length) {
        const currentStep = appState.steps[appState.stepIndex];
        if (currentStep.type === 'game') {
          showGame(currentStep);
        } else if (currentStep.type === 'story') {
          showStory(currentStep);
        }
      } else if (appState.stepIndex >= appState.steps.length) {
        showSummary();
      } else {
        setScreen(selectors.menuScreen);
      }
    });
  }
}

init();
