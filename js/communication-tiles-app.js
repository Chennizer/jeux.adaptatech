(function initCommunicationTiles(global) {
  const data = global.CommunicationTilesData;

  function createAudioFeedbackController() {
    const synth = global.speechSynthesis;
    return {
      speak(text, enabled) {
        if (!enabled || !text) return;
        if (synth && typeof SpeechSynthesisUtterance !== 'undefined') {
          synth.cancel();
          synth.speak(new SpeechSynthesisUtterance(text));
        }
      },
      playAudio(url, enabled) {
        if (!enabled || !url) return;
        const audio = new Audio(url);
        audio.play().catch(() => {});
      }
    };
  }

  function mount(options) {
    const {
      mode,
      rootSelector = '#communication-app'
    } = options;

    const root = document.querySelector(rootSelector);
    if (!root || !data) return;

    const state = {
      mode,
      vocabSet: 'basic',
      feedbackMode: 'tts',
      confirmMode: mode === 'eyegaze' ? 'dwell' : 'click',
      dwellMs: Number(global.eyegazeSettings?.dwellTime) || 1200,
      starter: 'I want',
      sentenceItems: [],
      pendingChoiceId: null,
      dwellTimerById: new Map()
    };

    const feedback = createAudioFeedbackController();

    function getChoices() {
      return data.vocabSets[state.vocabSet] || [];
    }

    function selectTile(id) {
      const choice = getChoices().find(item => item.id === id);
      if (!choice) return;

      state.sentenceItems.push(choice.sentence);
      if (state.feedbackMode === 'tts') {
        feedback.speak(choice.label, true);
      } else if (state.feedbackMode === 'audio') {
        feedback.playAudio(choice.audio, true);
      }

      renderSentence();
    }

    function renderSentence() {
      const stripText = root.querySelector('[data-role="sentence-text"]');
      if (!stripText) return;
      const payload = state.sentenceItems.join(' + ');
      stripText.textContent = payload ? `${state.starter} + ${payload}` : `${state.starter} + ...`;
    }

    function clearDwell(id) {
      const timer = state.dwellTimerById.get(id);
      if (timer) {
        clearTimeout(timer);
        state.dwellTimerById.delete(id);
      }
    }

    function bindTile(tile, id) {
      const activate = () => {
        if (state.confirmMode === 'click') {
          if (state.pendingChoiceId === id) {
            selectTile(id);
            state.pendingChoiceId = null;
          } else {
            state.pendingChoiceId = id;
          }
          renderTiles();
          return;
        }
        selectTile(id);
      };

      if (state.confirmMode === 'dwell') {
        const start = () => {
          clearDwell(id);
          tile.classList.add('dwell-active');
          state.dwellTimerById.set(id, setTimeout(() => {
            tile.classList.remove('dwell-active');
            state.dwellTimerById.delete(id);
            selectTile(id);
          }, state.dwellMs));
        };
        const stop = () => {
          tile.classList.remove('dwell-active');
          clearDwell(id);
        };

        tile.addEventListener('mouseenter', start);
        tile.addEventListener('mouseleave', stop);
        tile.addEventListener('focus', start);
        tile.addEventListener('blur', stop);
        if (mode === 'tactile') {
          tile.addEventListener('pointerdown', start);
          tile.addEventListener('pointerup', stop);
          tile.addEventListener('pointercancel', stop);
        }
      } else {
        tile.addEventListener('click', activate);
      }
    }

    function renderTiles() {
      const grid = root.querySelector('[data-role="grid"]');
      if (!grid) return;

      state.dwellTimerById.forEach(timer => clearTimeout(timer));
      state.dwellTimerById.clear();

      const items = getChoices();
      grid.innerHTML = '';
      items.forEach(item => {
        const tile = document.createElement('button');
        tile.className = 'com-tile';
        tile.type = 'button';
        tile.dataset.id = item.id;
        if (state.pendingChoiceId === item.id) {
          tile.classList.add('pending');
        }
        tile.innerHTML = `<span class="symbol">${item.symbol}</span><span class="label">${item.label}</span>`;
        bindTile(tile, item.id);
        grid.appendChild(tile);
      });
    }

    function wireControls() {
      const vocab = root.querySelector('[data-role="vocab"]');
      const feedbackMode = root.querySelector('[data-role="feedback"]');
      const confirmMode = root.querySelector('[data-role="confirm"]');
      const dwell = root.querySelector('[data-role="dwell"]');
      const dwellValue = root.querySelector('[data-role="dwell-value"]');
      const starter = root.querySelector('[data-role="starter"]');
      const clearButton = root.querySelector('[data-role="clear-sentence"]');
      const undoButton = root.querySelector('[data-role="undo-sentence"]');

      if (vocab) {
        vocab.value = state.vocabSet;
        vocab.addEventListener('change', () => {
          state.vocabSet = vocab.value;
          state.pendingChoiceId = null;
          renderTiles();
        });
      }

      if (feedbackMode) {
        feedbackMode.value = state.feedbackMode;
        feedbackMode.addEventListener('change', () => {
          state.feedbackMode = feedbackMode.value;
        });
      }

      if (confirmMode) {
        confirmMode.value = state.confirmMode;
        confirmMode.addEventListener('change', () => {
          state.confirmMode = confirmMode.value;
          state.pendingChoiceId = null;
          renderTiles();
        });
      }

      if (dwell && dwellValue) {
        dwell.value = String(state.dwellMs);
        dwellValue.textContent = `${state.dwellMs} ms`;
        dwell.addEventListener('input', () => {
          state.dwellMs = Number(dwell.value) || 1200;
          dwellValue.textContent = `${state.dwellMs} ms`;
        });
      }

      if (starter) {
        data.starterOptions.forEach(option => {
          const opt = document.createElement('option');
          opt.value = option.label;
          opt.textContent = option.label;
          starter.appendChild(opt);
        });
        starter.value = state.starter;
        starter.addEventListener('change', () => {
          state.starter = starter.value;
          renderSentence();
        });
      }

      if (clearButton) {
        clearButton.addEventListener('click', () => {
          state.sentenceItems = [];
          renderSentence();
        });
      }

      if (undoButton) {
        undoButton.addEventListener('click', () => {
          state.sentenceItems.pop();
          renderSentence();
        });
      }
    }

    wireControls();
    renderTiles();
    renderSentence();
  }

  global.CommunicationTilesApp = { mount };
})(window);
