(() => {
  const storageKey = 'wordchoices:settings';
  const messages = {
    fr: {
      defaults: ['Oui', 'Non'],
      choiceLabel: number => `Choix ${number}`,
      missing: 'Saisissez un mot ou une expression.',
      language: 'Changer de langue',
      voice: 'fr-CA'
    },
    en: {
      defaults: ['Yes', 'No'],
      choiceLabel: number => `Choice ${number}`,
      missing: 'Enter a word or phrase.',
      language: 'Change language',
      voice: 'en-CA'
    },
    ja: {
      defaults: ['はい', 'いいえ'],
      choiceLabel: number => `${number} 番目の選択肢`,
      missing: 'ことばや短い文を入力してください。',
      language: '言語を切り替える',
      voice: 'ja-JP'
    }
  };
  const getMessages = () => messages[document.documentElement.lang] || messages.fr;

  const setup = document.getElementById('game-options');
  const form = document.getElementById('control-panel-options');
  const languageToggle = document.getElementById('langToggle');
  const startButton = document.getElementById('startButton');
  const wordCount = document.getElementById('wordCount');
  const wordFields = document.getElementById('word-fields');
  const tileSize = document.getElementById('tileSize');
  const dwellTime = document.getElementById('dwellTimeSlider');
  const dwellTimeValue = document.getElementById('dwellTimeVal');
  const theme = document.getElementById('themeSelect');
  const readAloud = document.getElementById('ttsEnabled');
  const showPointer = document.getElementById('showGazePointer');
  const pointerSize = document.getElementById('gazeSize');
  const pointerOpacity = document.getElementById('gazeOpacity');
  const gazePointer = document.getElementById('gazePointer');
  const board = document.getElementById('word-board');
  const editBoard = document.getElementById('edit-board');
  const selection = document.getElementById('board-selection');
  const selectedWord = document.getElementById('selected-word');
  const grid = document.getElementById('word-grid');
  const gridFrame = grid.parentElement;
  const graphemeSegmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter() : null;

  function readSettings() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      return {};
    }
  }

  const saved = readSettings();
  const words = Array.isArray(saved.words) ? saved.words.slice(0, Number(wordCount.max)) : [];
  for (const [control, value] of [
    [wordCount, saved.count],
    [tileSize, saved.tileSize],
    [pointerSize, saved.pointerSize],
    [pointerOpacity, saved.pointerOpacity]
  ]) {
    if (Number.isFinite(value)) control.value = value;
  }
  theme.value = saved.theme === 'dark' ? 'dark' : 'light';
  showPointer.checked = saved.showPointer !== false;
  readAloud.disabled = !window.speechSynthesis || !window.SpeechSynthesisUtterance;
  readAloud.checked = !readAloud.disabled && saved.readAloud !== false;

  const fields = Array.from({ length: Number(wordCount.max) }, (_, index) => {
    const field = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');

    field.className = 'word-field';
    input.type = 'text';
    input.id = `choice-${index + 1}`;
    input.dir = 'auto';
    input.autocomplete = 'off';
    input.required = true;
    label.htmlFor = input.id;
    input.addEventListener('input', () => {
      words[index] = input.value;
      input.setCustomValidity('');
    });

    field.append(label, input);
    wordFields.append(field);
    return { field, label, input };
  });

  function updateFieldLanguage() {
    const { defaults, choiceLabel, language } = getMessages();
    languageToggle.setAttribute('aria-label', language);
    fields.forEach(({ label, input }, index) => {
      label.textContent = choiceLabel(index + 1);
      input.value = typeof words[index] === 'string' ? words[index] : (defaults[index] || '');
      input.setCustomValidity('');
    });
  }

  function updateWordCount() {
    document.getElementById('wordCountVal').textContent = wordCount.value;
    fields.forEach(({ field, input }, index) => {
      field.hidden = index >= wordCount.valueAsNumber;
      input.disabled = field.hidden;
    });
  }

  wordCount.addEventListener('input', updateWordCount);
  updateWordCount();
  for (const slider of [tileSize, pointerSize, pointerOpacity]) {
    const value = document.getElementById(`${slider.id}Val`);
    const update = () => { value.textContent = slider.value; };
    slider.addEventListener('input', update);
    update();
  }

  if (window.eyegazeSettings) {
    initEyegazeMenu();
  } else {
    dwellTime.addEventListener('input', () => { dwellTimeValue.textContent = dwellTime.value; });
  }
  dwellTimeValue.textContent = dwellTime.value;

  document.addEventListener('DOMContentLoaded', updateFieldLanguage);
  languageToggle.addEventListener('click', () => {
    toggleLanguage();
    updateFieldLanguage();
  });

  let selectedTile = null;
  let hoveredTile = null;
  let dwellTimer;

  function cancelDwell() {
    clearTimeout(dwellTimer);
    hoveredTile?.classList.remove('is-dwelling');
    gazePointer.classList.remove('gp-dwell');
  }

  function resetHover() {
    cancelDwell();
    hoveredTile = null;
    gazePointer.style.opacity = '0';
  }

  function selectTile(tile) {
    cancelDwell();
    selectedTile?.classList.remove('is-selected');
    selectedTile = tile;
    selectedTile.classList.add('is-selected');
    selectedWord.textContent = tile.textContent;
    selection.hidden = false;

    if (readAloud.checked) {
      const utterance = new SpeechSynthesisUtterance(tile.textContent);
      utterance.lang = getMessages().voice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  function handleTileMove(event) {
    const tile = event.currentTarget;
    if (event.pointerType === 'touch' || event.buttons || hoveredTile === tile) return;
    cancelDwell();
    hoveredTile = tile;
    tile.classList.add('is-dwelling');
    gazePointer.classList.add('gp-dwell');
    dwellTimer = setTimeout(() => selectTile(tile), dwellTime.valueAsNumber);
  }

  function renderTiles(labels) {
    grid.replaceChildren(...labels.map(text => {
      const tile = document.createElement('button');
      const label = document.createElement('bdi');
      tile.className = 'word-tile';
      tile.type = 'button';
      label.className = 'word-tile-label';
      label.textContent = text;
      tile.append(label);

      // Wait for movement so the pointer left over from Start cannot choose a tile.
      tile.addEventListener('pointermove', handleTileMove);
      tile.addEventListener('pointerdown', cancelDwell);
      tile.addEventListener('pointerleave', () => {
        if (hoveredTile !== tile) return;
        cancelDwell();
        hoveredTile = null;
      });
      tile.addEventListener('click', () => selectTile(tile));
      return tile;
    }));
  }

  function largestFittingFontSize(label, minSize, maxSize, space) {
    function fits(fontSize) {
      label.style.fontSize = `${fontSize}px`;
      return label.offsetWidth <= space.width && label.offsetHeight <= space.height;
    }

    if (fits(maxSize)) return maxSize;
    let lower = minSize;
    let upper = maxSize - 1;
    while (lower <= upper) {
      const fontSize = Math.floor((lower + upper) / 2);
      if (fits(fontSize)) {
        lower = fontSize + 1;
      } else {
        upper = fontSize - 1;
      }
    }
    return upper >= minSize ? upper : 0;
  }

  function sizeTiles() {
    if (board.hidden) return;
    const count = grid.childElementCount;
    const width = gridFrame.clientWidth;
    const height = gridFrame.clientHeight;
    const minTileSize = 44;
    const gap = Math.round(Math.max(12, Math.min(100, Math.min(width, height) * .1)));
    const columnsThatFit = Math.floor((width + gap) / (minTileSize + gap));
    const columns = Math.max(1, Math.min(Math.ceil(Math.sqrt(count)), columnsThatFit));
    const rows = Math.ceil(count / columns);
    const maxSize = Math.min(
      (width - (columns - 1) * gap) / columns,
      (height - (rows - 1) * gap) / rows
    );
    const size = Math.max(minTileSize, Math.floor(maxSize * tileSize.valueAsNumber / 100));
    grid.style.width = `${columns * size + (columns - 1) * gap}px`;
    grid.style.setProperty('--word-gap', `${gap}px`);
    grid.style.setProperty('--word-size', `${size}px`);

    const tile = grid.firstElementChild;
    const { paddingLeft, paddingRight, paddingTop, paddingBottom } = getComputedStyle(tile);
    const space = {
      width: Math.ceil(tile.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight)),
      height: Math.ceil(tile.clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom))
    };
    const minSingleLineFontSize = 10;
    const minWrappedFontSize = 8;
    const preferredFontSize = Math.max(12, Math.floor(size * .28));

    grid.querySelectorAll('.word-tile-label').forEach(label => {
      const text = label.textContent;
      const characters = graphemeSegmenter?.segment(text) ?? text.normalize();
      const minSingleLineSize = [...characters].length < 10
        ? minSingleLineFontSize
        : Math.max(minSingleLineFontSize, Math.ceil(preferredFontSize * .8));

      label.classList.add('is-single-line');
      let fontSize = largestFittingFontSize(label, minSingleLineSize, preferredFontSize, space);
      if (!fontSize) {
        label.classList.remove('is-single-line');
        fontSize = largestFittingFontSize(label, minWrappedFontSize, preferredFontSize, space) || minWrappedFontSize;
      }
      label.style.fontSize = `${fontSize}px`;
    });
  }

  function showSetup() {
    if (board.hidden) return;
    resetHover();
    window.speechSynthesis?.cancel();
    document.documentElement.classList.remove('hide-native-cursor');
    document.body.classList.remove('light', 'dark');
    board.hidden = true;
    setup.hidden = false;
    startButton.focus();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const inputs = fields.filter(({ input }) => !input.disabled).map(({ input }) => input);
    const blank = inputs.find(input => !input.value.trim());
    if (blank) {
      blank.setCustomValidity(getMessages().missing);
      blank.reportValidity();
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify({
        words,
        count: wordCount.valueAsNumber,
        tileSize: tileSize.valueAsNumber,
        theme: theme.value,
        readAloud: readAloud.checked,
        showPointer: showPointer.checked,
        pointerSize: pointerSize.valueAsNumber,
        pointerOpacity: pointerOpacity.valueAsNumber
      }));
    } catch {
      // The board also works when the browser cannot save settings.
    }

    const root = document.documentElement;
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      root.requestFullscreen().catch(() => {});
    }

    resetHover();
    renderTiles(inputs.map(input => input.value.trim()));
    selectedTile = null;
    selectedWord.textContent = '';
    selection.hidden = true;
    document.body.classList.add(theme.value);
    root.classList.toggle('hide-native-cursor', showPointer.checked);
    gazePointer.style.setProperty('--gp-size', `${pointerSize.value}px`);
    grid.style.setProperty('--hover-duration', `${dwellTime.value}ms`);
    setup.hidden = true;
    board.hidden = false;
    sizeTiles();
    board.focus({ preventScroll: true });
  });

  new ResizeObserver(sizeTiles).observe(gridFrame);
  board.addEventListener('pointermove', event => {
    if (!showPointer.checked || event.pointerType === 'touch') return;
    gazePointer.style.left = `${event.clientX}px`;
    gazePointer.style.top = `${event.clientY}px`;
    gazePointer.style.opacity = pointerOpacity.valueAsNumber / 100;
  });
  board.addEventListener('pointerleave', resetHover);
  board.addEventListener('pointercancel', resetHover);
  window.addEventListener('blur', resetHover);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetHover();
  });

  editBoard.addEventListener('click', showSetup);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.repeat) showSetup();
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) showSetup();
  });
})();
