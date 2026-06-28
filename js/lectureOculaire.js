(() => {
  const STORAGE_SETTINGS = 'lectureOculaireSettings';
  const STORAGE_LOG = 'lectureOculaireLog';
  const DEFAULT_SETTINGS = { dwellTimeMs: 1500, choiceCount: 2, showPointer: true, autoNext: true, showPrompt: true, ttsEnabled: true };
  const EDGE_PAD = 22;
  const GAP_MIN = 14;
  const GAP_MAX = 42;
  const MIN_TILE = 120;

  const $ = (id) => document.getElementById(id);
  const gameOptions = $('game-options');
  const gameContainer = document.querySelector('.game-container');
  const topStrip = $('topStrip');
  const prompt = $('prompt');
  const promptText = $('promptText');
  const targetText = document.querySelector('#prompt .target-letter');
  const grid = $('choiceGrid');
  const dwellSlider = $('dwellTimeSlider');
  const dwellTimeVal = $('dwellTimeVal');
  const lessonSelect = $('lessonSelect');
  const choiceCount = $('choiceCount');
  const autoNext = $('autoNext');
  const showPrompt = $('showPrompt');
  const showGazePointer = $('showGazePointer');
  const ttsEnabled = $('ttsEnabled');
  const gazePointer = $('gazePointer');

  let settings = loadSettings();
  let log = loadLog();
  let currentLesson = null;
  let currentActivityIndex = 0;
  let currentEncoding = '';
  let hoverTimeout = null;
  let activeHoverTile = null;
  let currentOverlay = null;
  let isReady = false;
  let repeats = 0;

  function loadSettings() {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_SETTINGS) || '{}') }; }
    catch (e) { return { ...DEFAULT_SETTINGS }; }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  }

  function loadLog() {
    try { return JSON.parse(localStorage.getItem(STORAGE_LOG) || '[]'); }
    catch (e) { return []; }
  }

  function saveLog() {
    localStorage.setItem(STORAGE_LOG, JSON.stringify(log));
  }

  function initEyegaze() {
    if (typeof initEyegazeMenu === 'function') initEyegazeMenu();
    if (typeof setEyegazeDwellTime === 'function') {
      settings.dwellTimeMs = setEyegazeDwellTime(settings.dwellTimeMs);
    } else if (window.eyegazeSettings) {
      window.eyegazeSettings.dwellTime = settings.dwellTimeMs;
    }
  }

  function syncSettingsUi() {
    dwellSlider.value = settings.dwellTimeMs;
    dwellTimeVal.textContent = settings.dwellTimeMs;
    choiceCount.value = String(settings.choiceCount);
    autoNext.checked = settings.autoNext;
    showPrompt.checked = settings.showPrompt;
    showGazePointer.checked = settings.showPointer;
    ttsEnabled.checked = settings.ttsEnabled;
    applyPointerToggle();
  }

  function populateLessons() {
    lessonSelect.innerHTML = LECTURE_OCULAIRE_LESSONS.map((lesson) => (
      `<option value="${escapeAttr(lesson.id)}">${lesson.title}</option>`
    )).join('');
  }

  function startGame() {
    currentLesson = LECTURE_OCULAIRE_LESSONS.find((lesson) => lesson.id === lessonSelect.value) || LECTURE_OCULAIRE_LESSONS[0];
    currentActivityIndex = 0;
    repeats = 0;
    gameOptions.style.display = 'none';
    gameContainer.style.display = 'flex';
    topStrip.style.display = settings.showPrompt ? 'block' : 'none';
    prompt.style.display = settings.showPrompt ? 'block' : 'none';
    grid.style.display = 'grid';
    applyPointerToggle();
    try { if (window.eyegazeSettings?.hideOverlay) window.eyegazeSettings.hideOverlay(); } catch (e) {}
    renderActivity();
  }

  function isGameRunning() {
    return gameContainer.style.display === 'flex';
  }

  function currentActivity() {
    return currentLesson?.activities[currentActivityIndex];
  }

  function renderActivity() {
    stopHover();
    isReady = false;
    currentEncoding = '';
    repeats = 0;
    const activity = currentActivity();
    if (!activity) return finishSession();

    promptText.textContent = promptLabel(activity);
    targetText.textContent = activity.promptTarget || activity.answer;
    grid.innerHTML = '';

    if (activity.type === 'encoding') renderEncoding(activity);
    else renderChoices(activity);

    adjustGridSizes();
    speakActivity(activity);
    setTimeout(() => { isReady = true; grid.classList.add('ready-pop'); }, 350);
    setTimeout(() => grid.classList.remove('ready-pop'), 620);
  }

  function promptLabel(activity) {
    if (activity.type === 'encoding') return activity.prompt;
    return activity.prompt.replace(activity.answer, '').trim() || activity.prompt;
  }

  function renderChoices(activity) {
    const choices = limitChoices(activity.choices || [], activity.answer);
    choices.forEach((choice) => addTile(choice, () => handleAnswer(choice)));
  }

  function renderEncoding(activity) {
    const display = document.createElement('div');
    display.id = 'encodingDisplay';
    display.textContent = '—';
    grid.appendChild(display);

    const keys = currentLesson.keyboard || currentLesson.graphemes || [];
    keys.forEach((key) => addTile(key, () => {
      currentEncoding += key;
      display.textContent = currentEncoding || '—';
    }));
    addTile('⌫', () => {
      currentEncoding = currentEncoding.slice(0, -1);
      display.textContent = currentEncoding || '—';
    });
    addTile('✓', () => handleAnswer(currentEncoding));
  }

  function addTile(label, onSelect) {
    const tile = document.createElement('div');
    tile.className = 'letter-cell';
    tile.innerHTML = `<span class="cell-char">${label}</span>`;
    tile.tabIndex = 0;
    tile.addEventListener('click', onSelect);
    tile.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect();
      }
    });
    tile.addEventListener('pointerenter', () => { if (isReady) startHover(tile); });
    tile.addEventListener('pointerleave', () => stopHover());
    grid.appendChild(tile);
  }

  function startHover(tile) {
    if (activeHoverTile === tile && currentOverlay) return;
    const hoverTime = window.eyegazeSettings?.dwellTime || settings.dwellTimeMs;
    stopHover();
    activeHoverTile = tile;
    currentOverlay = document.createElement('div');
    currentOverlay.className = 'dwell-fill';
    tile.appendChild(currentOverlay);

    requestAnimationFrame(() => {
      currentOverlay.style.transition = `width ${hoverTime}ms linear, height ${hoverTime}ms linear`;
      currentOverlay.style.width = '0';
      currentOverlay.style.height = '0';
      requestAnimationFrame(() => {
        if (!currentOverlay) return;
        currentOverlay.style.width = '100%';
        currentOverlay.style.height = '100%';
      });
    });

    if (gazePointer) gazePointer.classList.add('gp-dwell');
    hoverTimeout = setTimeout(() => {
      tile.click();
      stopHover();
    }, hoverTime);
  }

  function stopHover() {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
    if (currentOverlay?.parentElement) currentOverlay.parentElement.removeChild(currentOverlay);
    currentOverlay = null;
    activeHoverTile = null;
    if (gazePointer) gazePointer.classList.remove('gp-dwell');
  }

  function handleAnswer(value) {
    const activity = currentActivity();
    const correct = normalize(value) === normalize(activity.answer);
    const selectedTile = activeHoverTile;
    logEvent({ kind: 'answer', selected: value, correct });

    if (!correct) {
      if (selectedTile) {
        selectedTile.classList.add('wrong-flash');
        setTimeout(() => selectedTile.classList.remove('wrong-flash'), 350);
      }
      return;
    }

    isReady = false;
    if (selectedTile) selectedTile.classList.add('correct');
    setTimeout(() => {
      if (settings.autoNext) nextActivity();
    }, 650);
  }

  function nextActivity() {
    currentActivityIndex += 1;
    if (currentActivityIndex >= currentLesson.activities.length) finishSession();
    else renderActivity();
  }

  function finishSession() {
    stopSpeech();
    currentActivityIndex = 0;
    gameContainer.style.display = 'none';
    gameOptions.style.display = 'flex';
    applyPointerToggle();
  }

  function limitChoices(choices, answer) {
    const all = Array.from(new Set([answer, ...choices]));
    return all.slice(0, Math.max(2, settings.choiceCount));
  }

  function adjustGridSizes() {
    const cells = Array.from(grid.querySelectorAll('.letter-cell'));
    if (!cells.length) return;
    const count = cells.length;
    const columns = count <= 2 ? count : Math.min(3, Math.ceil(Math.sqrt(count)));
    const rows = Math.ceil(count / columns) + (grid.querySelector('#encodingDisplay') ? 1 : 0);
    const outer = grid.parentElement;
    const contentW = Math.max(0, grid.clientWidth - 2 * EDGE_PAD);
    const contentH = Math.max(0, (outer?.clientHeight || grid.clientHeight) - 2 * EDGE_PAD);
    const gap = Math.max(GAP_MIN, Math.min(GAP_MAX, Math.round(Math.min(contentW, contentH) * 0.025)));
    const maxByW = (contentW - (columns - 1) * gap) / columns;
    const maxByH = (contentH - (rows - 1) * gap) / rows;
    const size = Math.max(MIN_TILE, Math.floor(Math.min(maxByW, maxByH)));

    grid.style.padding = `${EDGE_PAD}px`;
    grid.style.gap = `${gap}px`;
    grid.style.gridTemplateColumns = `repeat(${columns}, ${size}px)`;
    grid.style.gridAutoRows = `${size}px`;
    cells.forEach((cell) => { cell.style.fontSize = `${Math.max(36, Math.floor(size * 0.42))}px`; });
  }

  function speakActivity(activity) {
    if (!settings.ttsEnabled || !('speechSynthesis' in window)) return;
    const parts = [activity.prompt];
    if (activity.model) parts.push(activity.model);
    speak(parts.join('. '));
  }

  function speak(text) {
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-CA';
    utterance.rate = 0.88;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeech() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function logEvent(extra) {
    const activity = currentActivity();
    log.push({
      at: new Date().toISOString(),
      lessonId: currentLesson?.id || null,
      activityId: activity?.id || null,
      activityType: activity?.type || null,
      prompt: activity?.prompt || null,
      expected: activity?.answer || null,
      repeats,
      ...extra,
    });
    saveLog();
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lecture-oculaire-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function applyPointerToggle() {
    if (!gazePointer) return;
    const active = settings.showPointer && isGameRunning();
    gazePointer.style.opacity = active ? '1' : '0';
    document.body.classList.toggle('hide-native-cursor', active);
  }

  function bindControls() {
    dwellSlider.addEventListener('input', () => {
      const val = typeof setEyegazeDwellTime === 'function'
        ? setEyegazeDwellTime(dwellSlider.value)
        : parseInt(dwellSlider.value, 10) || 1500;
      settings.dwellTimeMs = val;
      if (window.eyegazeSettings) window.eyegazeSettings.dwellTime = val;
      dwellTimeVal.textContent = val;
      saveSettings();
    });
    choiceCount.addEventListener('change', () => { settings.choiceCount = parseInt(choiceCount.value, 10) || 2; saveSettings(); });
    autoNext.addEventListener('change', () => { settings.autoNext = autoNext.checked; saveSettings(); });
    showPrompt.addEventListener('change', () => { settings.showPrompt = showPrompt.checked; saveSettings(); });
    showGazePointer.addEventListener('change', () => { settings.showPointer = showGazePointer.checked; applyPointerToggle(); saveSettings(); });
    ttsEnabled.addEventListener('change', () => { settings.ttsEnabled = ttsEnabled.checked; saveSettings(); });
    $('startButton').addEventListener('click', startGame);
    $('exportJson').addEventListener('click', exportJson);
    window.addEventListener('resize', adjustGridSizes);
    window.addEventListener('pointermove', (event) => {
      if (!settings.showPointer || !isGameRunning() || !gazePointer) return;
      gazePointer.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
    });
  }

  function normalize(value) {
    return String(value || '').trim().toLocaleLowerCase('fr-CA');
  }

  function escapeAttr(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initEyegaze();
    populateLessons();
    syncSettingsUi();
    bindControls();
  });
})();
