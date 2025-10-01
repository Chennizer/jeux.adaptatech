(function (global) {
  'use strict';

  function redirectToMain() {
    window.location.href = 'main.html';
  }

  function getGameConfigById(gameId) {
    if (!gameId || !Array.isArray(global.gamesConfig)) {
      return null;
    }
    for (let index = 0; index < global.gamesConfig.length; index += 1) {
      const config = global.gamesConfig[index];
      if (config && config.id === gameId) {
        return config;
      }
    }
    return null;
  }

  function encodeGamePath(path) {
    if (!path) {
      return path;
    }
    try {
      return encodeURI(path);
    } catch (error) {
      console.warn('Unable to encode game file path:', path, error);
      return path;
    }
  }

  function getGameFileById(gameId) {
    const config = getGameConfigById(gameId);
    const rawPath = config && config.file ? config.file : `${gameId}.html`;
    return encodeGamePath(rawPath);
  }

  function getThemeData(selections) {
    if (!global.themes) {
      return {};
    }
    const mediaOption = selections && selections.mediaOption ? selections.mediaOption : 'default';
    if (global.themes[mediaOption]) {
      return global.themes[mediaOption];
    }
    return global.themes['default'] || {};
  }

  function loadSession() {
    let selections;
    try {
      const raw = localStorage.getItem('gameSelections');
      if (!raw) {
        redirectToMain();
        return null;
      }
      selections = JSON.parse(raw);
    } catch (error) {
      console.error('Unable to parse game selections:', error);
      redirectToMain();
      return null;
    }

    const indexRaw = localStorage.getItem('currentGameIndex');
    const currentGameIndex = parseInt(indexRaw, 10);

    if (!Array.isArray(selections.gameOrder) || !Array.isArray(selections.gameOptions) || Number.isNaN(currentGameIndex)) {
      console.warn('Game selections are incomplete.');
      redirectToMain();
      return null;
    }

    const themeData = getThemeData(selections);

    return { selections, currentGameIndex, themeData };
  }

  function ensureCurrentGame(gameId) {
    const session = loadSession();
    if (!session) {
      return null;
    }

    if (gameId) {
      const currentGameId = session.selections.gameOrder[session.currentGameIndex];
      if (currentGameId !== gameId) {
        window.location.href = getGameFileById(currentGameId);
        return null;
      }
    }

    return session;
  }

  function getCurrentGameOptions(session) {
    const activeSession = session || loadSession();
    if (!activeSession) {
      return {};
    }
    const { selections, currentGameIndex } = activeSession;
    if (!Array.isArray(selections.gameOptions)) {
      return {};
    }
    return selections.gameOptions[currentGameIndex] || {};
  }

  function showActivityOverlay(onStart, session) {
    const activeSession = session || loadSession();
    if (!activeSession) {
      return;
    }

    const overlay = document.getElementById('activityNumberOverlay');
    const startSoundSrc = activeSession.themeData && activeSession.themeData.startSound;
    const startSound = startSoundSrc ? new Audio(startSoundSrc) : null;

    const proceed = () => {
      if (overlay) {
        overlay.style.display = 'none';
      }
      if (startSound) {
        startSound.currentTime = 0;
        startSound.play().catch(err => console.warn('Sound play error:', err));
      }
      if (typeof onStart === 'function') {
        onStart(activeSession);
      }
    };

    if (!overlay) {
      proceed();
      return;
    }

    const numberTextEl = overlay.querySelector('.number-text');
    if (numberTextEl) {
      numberTextEl.textContent = String(activeSession.currentGameIndex + 1);
    }
    overlay.style.display = 'flex';

    const handler = (event) => {
      if (event.type === 'touchend') {
        event.preventDefault();
      }
      cleanup();
      proceed();
    };

    const cleanup = () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('touchend', handler);
    };

    document.addEventListener('click', handler, { once: true });
    document.addEventListener('touchend', handler, { once: true });
  }

  function advanceToNextGame() {
    const session = loadSession();
    if (!session) {
      return;
    }

    const nextIndex = session.currentGameIndex + 1;
    localStorage.setItem('currentGameIndex', nextIndex);

    if (nextIndex < session.selections.gameOrder.length) {
      const nextGameId = session.selections.gameOrder[nextIndex];
      window.location.href = getGameFileById(nextGameId);
    } else {
      window.location.href = 'completion.html';
    }
  }

  function setupReinforcerRedirect() {
    const button = document.getElementById('reinforcerButton');
    if (!button) {
      return;
    }
    button.addEventListener('click', () => {
      window.location.href = 'reinforcer.html';
    });
  }

  function setupSharedReinforcer(session, options) {
    if (!global.reinforcerOverlay || typeof global.reinforcerOverlay.init !== 'function') {
      console.warn('reinforcerOverlay module is not available.');
      return null;
    }

    const activeSession = session || loadSession();
    if (!activeSession) {
      return null;
    }

    const reinforcerType = activeSession.selections && activeSession.selections.reinforcerType
      ? activeSession.selections.reinforcerType
      : 'shortvideo';

    const config = Object.assign({
      reinforcerType,
      themeData: activeSession.themeData || {},
      onAdvance: advanceToNextGame,
      imageDisplayDurationMs: 10000
    }, options || {});

    return global.reinforcerOverlay.init(config);
  }

  global.sessionHelpers = {
    getGameFileById,
    loadSession,
    ensureCurrentGame,
    getCurrentGameOptions,
    showActivityOverlay,
    advanceToNextGame,
    setupReinforcerRedirect,
    setupSharedReinforcer
  };
})(window);
