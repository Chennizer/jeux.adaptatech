(() => {
  const STORAGE_SETTINGS = 'lectureOculaireSettings';
  const STORAGE_LOG = 'lectureOculaireLog';
  const DEFAULT_SETTINGS = { dwellTimeMs: 1200, choiceCount: 2, showPointer: true, autoNext: true };

  const $ = (id) => document.getElementById(id);
  const lessonGrid = $('lesson-grid');
  const lessonScreen = $('lesson-screen');
  const activityScreen = $('activity-screen');
  const activityHost = $('activity-host');
  const activityTitle = $('activity-title');
  const modelText = $('model-text');
  const feedback = $('feedback');
  const progressPill = $('progress-pill');
  const typePill = $('type-pill');
  const gazePointer = $('gazePointer');

  let settings = loadSettings();
  let log = loadLog();
  let currentLesson = null;
  let currentActivityIndex = 0;
  let currentEncoding = '';
  let repeatCountForActivity = 0;
  let dwellTimer = null;
  let dwellStartedAt = 0;
  let activeDwellElement = null;
  let dwellFrame = null;

  function loadSettings() {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_SETTINGS) || '{}') }; }
    catch { return { ...DEFAULT_SETTINGS }; }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  }

  function loadLog() {
    try { return JSON.parse(localStorage.getItem(STORAGE_LOG) || '[]'); }
    catch { return []; }
  }

  function saveLog() {
    localStorage.setItem(STORAGE_LOG, JSON.stringify(log));
  }

  function activityTypeLabel(type) {
    const labels = {
      'phonemic-awareness': 'J’entends',
      'grapheme-phoneme': 'Je vois',
      decoding: 'Je lis',
      encoding: 'Je construis',
      comprehension: 'Je comprends',
    };
    return labels[type] || 'Lecture';
  }

  function renderLessons() {
    lessonGrid.innerHTML = '';
    LECTURE_OCULAIRE_LESSONS.forEach((lesson) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lesson-card dwellable';
      button.innerHTML = `<strong>${lesson.title}</strong><span>${lesson.focus}</span>`;
      button.addEventListener('click', () => startLesson(lesson.id));
      lessonGrid.appendChild(button);
    });
    bindDwellTargets();
  }

  function startLesson(lessonId) {
    currentLesson = LECTURE_OCULAIRE_LESSONS.find((lesson) => lesson.id === lessonId);
    currentActivityIndex = 0;
    repeatCountForActivity = 0;
    lessonScreen.hidden = true;
    activityScreen.hidden = false;
    renderActivity();
  }

  function currentActivity() {
    return currentLesson?.activities[currentActivityIndex];
  }

  function renderActivity() {
    const activity = currentActivity();
    if (!activity) return showLessonScreen();

    currentEncoding = '';
    repeatCountForActivity = 0;
    feedback.className = 'feedback';
    feedback.textContent = '';
    progressPill.textContent = `Activité ${currentActivityIndex + 1}/${currentLesson.activities.length}`;
    typePill.textContent = activityTypeLabel(activity.type);
    activityTitle.textContent = activity.prompt;
    modelText.textContent = activity.model || '';

    if (activity.type === 'encoding') {
      renderEncodingActivity(activity);
    } else {
      renderChoiceActivity(activity);
    }
    bindDwellTargets();
  }

  function renderChoiceActivity(activity) {
    const choices = limitChoices(activity.choices || [], activity.answer);
    activityHost.innerHTML = `<div class="choice-grid">${choices.map((choice) => `
      <button class="gaze-choice dwellable" type="button" data-choice="${escapeAttr(choice)}"><span>${choice}</span></button>
    `).join('')}</div>`;
    activityHost.querySelectorAll('[data-choice]').forEach((button) => {
      button.addEventListener('click', () => selectChoice(button.dataset.choice, button));
    });
  }

  function renderEncodingActivity(activity) {
    const keys = currentLesson.keyboard || currentLesson.graphemes || [];
    activityHost.innerHTML = `
      <div id="encoding-display" class="encoding-display" aria-live="polite">—</div>
      <div class="encoding-keyboard">
        ${keys.map((key) => `<button class="keyboard-key dwellable" type="button" data-key="${escapeAttr(key)}"><span>${key}</span></button>`).join('')}
        <button class="keyboard-key dwellable" type="button" data-action="erase"><span>⌫</span></button>
        <button class="keyboard-key dwellable" type="button" data-action="validate"><span>✓</span></button>
      </div>`;
    activityHost.querySelectorAll('[data-key]').forEach((button) => {
      button.addEventListener('click', () => {
        currentEncoding += button.dataset.key;
        updateEncodingDisplay();
      });
    });
    activityHost.querySelector('[data-action="erase"]').addEventListener('click', () => {
      currentEncoding = currentEncoding.slice(0, -1);
      updateEncodingDisplay();
    });
    activityHost.querySelector('[data-action="validate"]').addEventListener('click', () => selectChoice(currentEncoding, null));
  }

  function updateEncodingDisplay() {
    $('encoding-display').textContent = currentEncoding || '—';
  }

  function limitChoices(choices, answer) {
    const unique = Array.from(new Set([answer, ...choices]));
    return unique.slice(0, Math.max(2, settings.choiceCount));
  }

  function selectChoice(value, button) {
    const activity = currentActivity();
    const correct = normalize(value) === normalize(activity.answer);
    if (button) button.classList.add(correct ? 'correct' : 'incorrect');
    feedback.className = `feedback ${correct ? 'good' : 'retry'}`;
    feedback.textContent = correct ? 'Bravo, c’est correct.' : 'À reprendre. On peut essayer encore.';
    logEvent({ kind: 'answer', selected: value, correct });
    updateSummary();
    if (correct && settings.autoNext) {
      setTimeout(nextActivity, 1200);
    }
  }

  function nextActivity() {
    currentActivityIndex += 1;
    if (currentActivityIndex >= currentLesson.activities.length) {
      feedback.className = 'feedback good';
      feedback.textContent = 'Séance terminée. Retour aux leçons.';
      setTimeout(showLessonScreen, 1400);
      return;
    }
    renderActivity();
  }

  function showLessonScreen() {
    activityScreen.hidden = true;
    lessonScreen.hidden = false;
    currentLesson = null;
    bindDwellTargets();
  }

  function logEvent(extra) {
    const activity = currentActivity();
    log.push({
      at: new Date().toISOString(),
      lessonId: currentLesson?.id || null,
      lessonTitle: currentLesson?.title || null,
      activityId: activity?.id || null,
      activityType: activity?.type || null,
      prompt: activity?.prompt || null,
      expected: activity?.answer || null,
      repeats: repeatCountForActivity,
      ...extra,
    });
    saveLog();
  }

  function updateSummary() {
    const answers = log.filter((entry) => entry.kind === 'answer');
    $('correct-count').textContent = answers.filter((entry) => entry.correct).length;
    $('error-count').textContent = answers.filter((entry) => !entry.correct).length;
    $('help-count').textContent = log.filter((entry) => entry.kind === 'help').length;
    $('repeat-count').textContent = log.filter((entry) => entry.kind === 'repeat').length;
  }

  function handleRegulation(action) {
    if (action === 'repeat') {
      repeatCountForActivity += 1;
      feedback.className = 'feedback help';
      feedback.textContent = currentActivity()?.prompt || 'On répète.';
      logEvent({ kind: 'repeat' });
    }
    if (action === 'help') {
      feedback.className = 'feedback help';
      feedback.textContent = currentActivity()?.model || 'L’adulte peut donner un indice.';
      logEvent({ kind: 'help' });
    }
    if (action === 'pause') {
      feedback.className = 'feedback help';
      feedback.textContent = 'Pause. On reprend quand l’élève est disponible.';
      logEvent({ kind: 'pause' });
    }
    if (action === 'unknown') {
      feedback.className = 'feedback retry';
      feedback.textContent = 'Réponse notée : je ne sais pas.';
      logEvent({ kind: 'unknown', correct: false });
    }
    if (action === 'again') renderActivity();
    updateSummary();
  }

  function bindDwellTargets() {
    document.querySelectorAll('.dwellable').forEach((element) => {
      if (element.dataset.dwellBound) return;
      element.dataset.dwellBound = 'true';
      const fill = document.createElement('span');
      fill.className = 'dwell-fill';
      element.prepend(fill);
      element.addEventListener('pointerenter', () => startDwell(element));
      element.addEventListener('pointerleave', cancelDwell);
      element.addEventListener('pointerdown', cancelDwell);
    });
  }

  function startDwell(element) {
    cancelDwell();
    activeDwellElement = element;
    dwellStartedAt = performance.now();
    dwellTimer = setTimeout(() => {
      const target = activeDwellElement;
      cancelDwell();
      target?.click();
    }, settings.dwellTimeMs);
    animateDwell();
  }

  function animateDwell() {
    if (!activeDwellElement) return;
    const fill = activeDwellElement.querySelector('.dwell-fill');
    const elapsed = performance.now() - dwellStartedAt;
    const pct = Math.min(100, (elapsed / settings.dwellTimeMs) * 100);
    if (fill) fill.style.width = `${pct}%`;
    dwellFrame = requestAnimationFrame(animateDwell);
  }

  function cancelDwell() {
    if (dwellTimer) clearTimeout(dwellTimer);
    if (dwellFrame) cancelAnimationFrame(dwellFrame);
    if (activeDwellElement) {
      const fill = activeDwellElement.querySelector('.dwell-fill');
      if (fill) fill.style.width = '0%';
    }
    dwellTimer = null;
    dwellFrame = null;
    activeDwellElement = null;
  }

  function syncSettingsUi() {
    $('dwell-time').value = settings.dwellTimeMs;
    $('dwell-time-value').textContent = settings.dwellTimeMs;
    $('choice-count').value = settings.choiceCount;
    $('show-pointer').checked = settings.showPointer;
    $('auto-next').checked = settings.autoNext;
    document.body.classList.toggle('show-gaze-pointer', settings.showPointer);
  }

  function bindSettings() {
    $('settings-toggle').addEventListener('click', () => { $('settings-panel').hidden = !$('settings-panel').hidden; });
    $('dwell-time').addEventListener('input', (event) => {
      settings.dwellTimeMs = Number(event.target.value);
      $('dwell-time-value').textContent = settings.dwellTimeMs;
      saveSettings();
    });
    $('choice-count').addEventListener('change', (event) => {
      settings.choiceCount = Number(event.target.value);
      saveSettings();
      if (currentLesson) renderActivity();
    });
    $('show-pointer').addEventListener('change', (event) => {
      settings.showPointer = event.target.checked;
      document.body.classList.toggle('show-gaze-pointer', settings.showPointer);
      saveSettings();
    });
    $('auto-next').addEventListener('change', (event) => {
      settings.autoNext = event.target.checked;
      saveSettings();
    });
    $('fullscreen-button').addEventListener('click', () => document.documentElement.requestFullscreen?.());
    $('clear-log-button').addEventListener('click', () => {
      log = [];
      saveLog();
      updateSummary();
    });
    $('export-json-button').addEventListener('click', exportJson);
    $('back-to-lessons').addEventListener('click', showLessonScreen);
    document.querySelectorAll('[data-action]').forEach((button) => {
      if (button.closest('.encoding-keyboard')) return;
      button.addEventListener('click', () => handleRegulation(button.dataset.action));
    });
    window.addEventListener('pointermove', (event) => {
      if (!settings.showPointer || !gazePointer) return;
      gazePointer.style.left = `${event.clientX}px`;
      gazePointer.style.top = `${event.clientY}px`;
    });
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

  function normalize(value) {
    return String(value || '').trim().toLocaleLowerCase('fr-CA');
  }

  function escapeAttr(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncSettingsUi();
    bindSettings();
    renderLessons();
    updateSummary();
  });
})();
