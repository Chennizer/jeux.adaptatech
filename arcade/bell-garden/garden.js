(() => {
  'use strict';

  const copy = {
    fr: {
      title: 'Jardin de clochettes', instructions: 'Faites chanter les fleurs au toucher, au regard ou avec une switch.',
      inputMode: 'Type de contrôle', tapMode: 'Tactile', gazeMode: 'Regard', switchMode: 'Switch', switchType: 'Mode switch',
      scanMode: 'Une switch : balayage', stepMode: 'Deux switches : avancer / jouer',
      dwellTime: 'Temps de fixation', scanTime: 'Intervalle de balayage', background: 'Fond',
      skyTheme: 'Jardin', darkTheme: 'Noir', lightTheme: 'Blanc', options: 'Options', volume: 'Volume',
      mute: 'Désactiver les sons', gentleEffects: 'Réduire les animations', fullscreen: 'Plein écran',
      start: 'Commencer', resume: 'Reprendre', backToArcade: 'Retour à l’arcade',
      tapHint: 'Touchez une fleur. Clavier : flèches puis Espace, ou touches 1 à 6.',
      gazeHint: 'Fixez une fleur pour la faire chanter. Regardez ailleurs pour la rejouer.',
      scanHint: 'Espace : jouer la fleur encadrée. Le cadre avance automatiquement.',
      stepHint: 'Entrée : fleur suivante. Espace : jouer la fleur encadrée.',
      flowerGroup: 'Fleurs musicales', playNote: 'Jouer la clochette', language: 'Changer la langue',
      soundUnavailable: 'Le son n’a pas pu démarrer. Appuyez sur Commencer pour réessayer.',
      notes: ['Do', 'Ré', 'Mi', 'Sol', 'La', 'Do aigu']
    },
    en: {
      title: 'Bell Garden', instructions: 'Make the flowers sing with touch, eye gaze or a switch.',
      inputMode: 'Input type', tapMode: 'Touch', gazeMode: 'Eyegaze', switchMode: 'Switch', switchType: 'Switch mode',
      scanMode: 'One switch: scanning', stepMode: 'Two switches: move / play',
      dwellTime: 'Dwell time', scanTime: 'Scanning interval', background: 'Background',
      skyTheme: 'Garden', darkTheme: 'Black', lightTheme: 'White', options: 'Options', volume: 'Volume',
      mute: 'Disable sounds', gentleEffects: 'Reduce animations', fullscreen: 'Fullscreen',
      start: 'Start', resume: 'Resume', backToArcade: 'Back to the arcade',
      tapHint: 'Touch a flower. Keyboard: arrows then Space, or keys 1–6.',
      gazeHint: 'Look at a flower to make it sing. Look away before playing it again.',
      scanHint: 'Space: play the outlined flower. The outline advances automatically.',
      stepHint: 'Enter: next flower. Space: play the outlined flower.',
      flowerGroup: 'Musical flowers', playNote: 'Play bell', language: 'Change language',
      soundUnavailable: 'Sound couldn’t start. Press Start to try again.',
      notes: ['C', 'D', 'E', 'G', 'A', 'High C']
    },
    ja: {
      title: 'ベルの庭', instructions: 'タッチ、視線、スイッチで花の音を楽しみましょう。',
      inputMode: '入力タイプ', tapMode: 'タッチ', gazeMode: '視線', switchMode: 'スイッチ', switchType: 'スイッチモード',
      scanMode: '1スイッチ：スキャン', stepMode: '2スイッチ：移動・演奏',
      dwellTime: '注視時間', scanTime: 'スキャン間隔', background: '背景',
      skyTheme: '庭', darkTheme: '黒', lightTheme: '白', options: '設定', volume: '音量',
      mute: '音を無効にする', gentleEffects: 'アニメーションを減らす', fullscreen: '全画面',
      start: '開始', resume: '再開', backToArcade: 'アーケードに戻る',
      tapHint: '花に触れてください。矢印キーで選び、スペースキーで演奏。1〜6キーでも演奏できます。',
      gazeHint: '花を見つめて音を鳴らしましょう。同じ花を鳴らすには一度視線を外してください。',
      scanHint: 'スペースキーで枠のある花を演奏します。枠は自動で移動します。',
      stepHint: 'Enter：次の花。スペース：枠のある花を演奏。',
      flowerGroup: '音楽の花', playNote: 'ベルを演奏', language: '言語を変更',
      soundUnavailable: '音を開始できませんでした。「開始」を押して再試行してください。',
      notes: ['ド', 'レ', 'ミ', 'ソ', 'ラ', '高いド']
    }
  };

  const $ = id => document.getElementById(id);
  const garden = $('garden');
  const panel = $('control-panel');
  const screen = $('game-screen');
  const modeButtons = ['mode-tap', 'mode-gaze', 'mode-switch'].map($);
  const flowers = [];
  const frequencies = [261.63, 293.66, 329.63, 392, 440, 523.25];
  const palette = [
    ['#ff4f6d', '#ba204a'], ['#ffca25', '#dd8e00'], ['#9860ff', '#642dc1'],
    ['#12cbb5', '#008e7f'], ['#ff852b', '#cd4b0d'], ['#eb4bca', '#aa208e']
  ];
  const animationTimers = new Map();
  const voices = new Set();
  let language = 'fr';
  let started = false;
  let menuOpen = true;
  let mode = 'tap';
  let pendingMode = 'tap';
  let selected = 0;
  let scanTimer = null;
  let dwellTimer = null;
  let dwellTarget = null;
  let dwellLocked = null;
  let audio = null;
  let master = null;
  let audioFailed = false;

  try {
    const storedLanguage = localStorage.getItem('siteLanguage');
    if (copy[storedLanguage]) language = storedLanguage;
    const saved = JSON.parse(localStorage.getItem('bellGardenSettings') || 'null');
    if (saved && typeof saved === 'object') {
      if (['tap', 'gaze', 'scan', 'step'].includes(saved.mode)) pendingMode = saved.mode;
      for (const [id, min, max, key] of [['dwell-time', 300, 2500, 'dwell'], ['scan-time', 600, 4000, 'scan'], ['volume', 0, 100, 'volume']]) {
        if (Number.isFinite(saved[key])) $(id).value = Math.min(max, Math.max(min, saved[key]));
      }
      if (['sky', 'dark', 'light'].includes(saved.theme)) $('theme').value = saved.theme;
      for (const [id, key] of [['gentle-effects', 'gentle'], ['mute-toggle', 'muted'], ['fullscreen-toggle', 'fullscreen']]) {
        if (typeof saved[key] === 'boolean') $(id).checked = saved[key];
      }
    }
  } catch (_) { /* The game also works when browser storage is unavailable. */ }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) $('gentle-effects').checked = true;
  $('switch-mode').value = pendingMode === 'step' ? 'step' : 'scan';

  const plantMarkup = '<span class="plant" aria-hidden="true">' +
    '<svg class="plant-art" viewBox="0 0 240 400" preserveAspectRatio="none" aria-hidden="true">' +
    '<path class="plant-stem" d="M119 391C114 333 129 287 120 229V152"/>' +
    '<path class="plant-leaf" d="M121 325C70 325 35 300 26 263C77 260 109 287 121 325Z"/>' +
    '<path class="plant-leaf plant-leaf-light" d="M122 284C166 283 205 250 211 217C161 215 129 245 122 284Z"/>' +
    '<path d="M106 39C96 21 111 9 120 4C135 17 140 28 132 41" fill="#239c3c"/>' +
    '<path class="bell-petal" d="M52 112C55 83 50 27 119 25C185 23 183 83 189 112C191 127 205 139 222 150C198 181 43 181 18 150C38 136 49 125 52 112Z"/>' +
    '<path d="M86 48C65 67 79 111 57 133" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="10" stroke-linecap="round"/>' +
    '<ellipse class="bell-rim" cx="120" cy="152" rx="101" ry="19"/>' +
    '<path d="M120 155V189" stroke="#815015" stroke-width="6" stroke-linecap="round"/>' +
    '<circle cx="120" cy="195" r="17" fill="#ffe04b" stroke="#c58b00" stroke-width="3"/>' +
    '</svg></span><span class="dwell-fill" aria-hidden="true"></span>';

  palette.forEach(([petal, rim], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'flower';
    button.dataset.index = index;
    button.style.setProperty('--petal', petal);
    button.style.setProperty('--rim', rim);
    button.style.setProperty('--plant-height', [72, 86, 77, 95, 82, 91][index] + '%');
    button.innerHTML = plantMarkup;
    garden.append(button);
    flowers.push(button);
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      cancelDwell();
      dwellLocked = button;
      playFlower(index);
    });
    button.addEventListener('click', event => { if (event.detail === 0) playFlower(index); });
    button.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') beginDwell(button, index);
    });
    button.addEventListener('pointerleave', () => {
      if (dwellTarget === button) cancelDwell();
      if (dwellLocked === button) dwellLocked = null;
    });
    button.addEventListener('pointercancel', () => { cancelDwell(); dwellLocked = null; });
    button.addEventListener('focus', () => {
      if (canPlay() && mode !== 'scan') selectFlower(index, mode === 'step');
    });
  });

  function text(key) { return copy[language][key]; }
  function canPlay() { return started && !menuOpen && !document.hidden; }

  function updateLanguage() {
    document.documentElement.lang = language;
    document.title = text('title') + ' · Adaptatech';
    document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = text(element.dataset.i18n); });
    const next = { fr: 'en', en: 'ja', ja: 'fr' }[language];
    $('language-toggle').textContent = { fr: 'FR', en: 'EN', ja: '日本語' }[next];
    $('language-toggle').setAttribute('aria-label', text('language') + ' (' + next + ')');
    garden.setAttribute('aria-label', text('flowerGroup'));
    flowers.forEach((flower, index) => flower.setAttribute('aria-label', text('playNote') + ' ' + text('notes')[index]));
    $('settings-button').setAttribute('aria-label', text('options'));
    $('control-panel-start-button').textContent = text(started ? 'resume' : 'start');
    $('play-hint').textContent = text(mode + 'Hint');
    if (audioFailed) $('audio-status').textContent = text('soundUnavailable');
    updateModeFields();
  }

  function updateModeFields() {
    const switchMode = pendingMode === 'scan' || pendingMode === 'step';
    modeButtons.forEach(button => {
      const active = button.dataset.inputMode === (switchMode ? 'switch' : pendingMode);
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('switch-field').hidden = !switchMode;
    $('dwell-field').hidden = pendingMode !== 'gaze';
    $('scan-field').hidden = pendingMode !== 'scan';
    $('mode-description').textContent = text(pendingMode + 'Hint');
    $('dwell-value').textContent = $('dwell-time').value + ' ms';
    $('scan-value').textContent = (Number($('scan-time').value) / 1000).toLocaleString(language, { maximumFractionDigits: 1 }) + ' s';
    $('volume-value').textContent = $('volume').value + ' %';
  }

  function selectFlower(index, visible = true) {
    selected = (index + flowers.length) % flowers.length;
    flowers.forEach((flower, i) => flower.classList.toggle('is-selected', visible && i === selected));
  }

  function cancelDwell() {
    clearTimeout(dwellTimer);
    dwellTimer = null;
    dwellTarget?.classList.remove('is-dwelling');
    dwellTarget = null;
  }

  function beginDwell(button, index) {
    cancelDwell();
    if (!canPlay() || mode !== 'gaze' || dwellLocked === button) return;
    dwellTarget = button;
    button.style.setProperty('--dwell-time', $('dwell-time').value + 'ms');
    button.classList.add('is-dwelling');
    dwellTimer = setTimeout(() => {
      cancelDwell();
      dwellLocked = button;
      if (canPlay() && mode === 'gaze') playFlower(index);
    }, Number($('dwell-time').value));
  }

  function stopScanning() { clearInterval(scanTimer); scanTimer = null; }
  function startScanning() {
    stopScanning();
    if (!canPlay() || mode !== 'scan') return;
    selectFlower(selected);
    scanTimer = setInterval(() => { if (canPlay()) selectFlower(selected + 1); }, Number($('scan-time').value));
  }

  function showAudioFailure(failed) {
    $('audio-notice').hidden = !failed;
    if (failed !== audioFailed) $('audio-status').textContent = failed ? text('soundUnavailable') : '';
    audioFailed = failed;
  }

  function ensureAudio() {
    try {
      if (!audio) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error('Audio unavailable');
        audio = new AudioContext();
        master = audio.createGain();
        const compressor = audio.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.ratio.value = 8;
        master.connect(compressor);
        compressor.connect(audio.destination);
        updateVolume();
      }
      if (audio.state === 'suspended') {
        audio.resume().then(() => showAudioFailure(false)).catch(() => showAudioFailure(true));
      } else showAudioFailure(false);
      return true;
    } catch (_) {
      showAudioFailure(true);
      return false;
    }
  }

  function updateVolume() {
    if (master) master.gain.setTargetAtTime($('mute-toggle').checked ? 0 : Number($('volume').value) / 100, audio.currentTime, .02);
  }

  function silence() {
    voices.forEach(voice => voice.stop());
  }

  function ringBell(index) {
    if (!ensureAudio()) return;
    // Bound overlapping voices, including rapid switch presses and multi-touch.
    if (voices.size >= 12) voices.values().next().value.stop();
    const nodes = [];
    let remaining = 4;
    let stopped = false;
    const voice = {
      stop() {
        if (stopped) return;
        stopped = true;
        nodes.forEach(([oscillator, gain]) => {
          gain.gain.cancelScheduledValues(audio.currentTime);
          gain.gain.setTargetAtTime(.0001, audio.currentTime, .008);
          oscillator.stop(audio.currentTime + .04);
        });
        voices.delete(voice);
      }
    };
    voices.add(voice);
    [[1, .27, 2.2], [2.756, .09, 1.45], [5.404, .035, .8], [8.933, .012, .45]].forEach(([ratio, level, duration]) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequencies[index] * ratio;
      gain.gain.setValueAtTime(0, audio.currentTime);
      gain.gain.linearRampToValueAtTime(level, audio.currentTime + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        if (--remaining === 0) voices.delete(voice);
      };
      nodes.push([oscillator, gain]);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration + .05);
    });
  }


  function animateFlower(index) {
    const flower = flowers[index];
    clearTimeout(animationTimers.get(flower));
    flower.classList.remove('is-playing');
    void flower.offsetWidth;
    flower.classList.add('is-playing');
    animationTimers.set(flower, setTimeout(() => {
      flower.classList.remove('is-playing');
      animationTimers.delete(flower);
    }, 700));
  }

  function playFlower(index) {
    if (!canPlay()) return;
    ringBell(index);
    animateFlower(index);
    if (mode !== 'scan') selectFlower(index, mode === 'step');
  }

  function pauseGarden() {
    stopScanning();
    cancelDwell();
    dwellLocked = null;
    silence();
    animationTimers.forEach(timer => clearTimeout(timer));
    animationTimers.clear();
    flowers.forEach(flower => flower.classList.remove('is-playing'));
  }

  function openMenu() {
    pauseGarden();
    menuOpen = true;
    screen.hidden = true;
    panel.hidden = false;
    $('language-toggle').hidden = false;
    document.body.classList.remove('garden-running');
    updateLanguage();
    $('control-panel-start-button').focus({ preventScroll: true });
  }

  function saveSettings() {
    try {
      localStorage.setItem('bellGardenSettings', JSON.stringify({
        mode, dwell: Number($('dwell-time').value), scan: Number($('scan-time').value),
        volume: Number($('volume').value), gentle: $('gentle-effects').checked,
        theme: $('theme').value, muted: $('mute-toggle').checked, fullscreen: $('fullscreen-toggle').checked
      }));
    } catch (_) { /* Session settings still work without storage. */ }
  }

  function startGarden() {
    ensureAudio();
    mode = pendingMode;
    started = true;
    menuOpen = false;
    panel.hidden = true;
    screen.hidden = false;
    $('language-toggle').hidden = true;
    document.body.classList.add('garden-running');
    document.body.classList.toggle('gentle', $('gentle-effects').checked);
    document.body.dataset.theme = $('theme').value;
    updateVolume();
    saveSettings();
    updateLanguage();
    selectFlower(selected, mode === 'scan' || mode === 'step');
    garden.focus({ preventScroll: true });
    startScanning();
    if ($('fullscreen-toggle').checked && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()?.catch(() => {});
    } else if (!$('fullscreen-toggle').checked && document.fullscreenElement) {
      document.exitFullscreen?.()?.catch(() => {});
    }
  }

  modeButtons.forEach(button => button.addEventListener('click', () => {
    pendingMode = button.dataset.inputMode === 'switch' ? $('switch-mode').value : button.dataset.inputMode;
    updateModeFields();
  }));
  $('switch-mode').addEventListener('change', () => {
    if (pendingMode === 'scan' || pendingMode === 'step') pendingMode = $('switch-mode').value;
    updateModeFields();
  });
  $('control-panel-start-button').addEventListener('click', startGarden);
  $('settings-button').addEventListener('click', openMenu);
  ['dwell-time', 'scan-time', 'volume'].forEach(id => $(id).addEventListener('input', () => {
    updateModeFields();
    if (id === 'volume') updateVolume();
  }));
  $('mute-toggle').addEventListener('change', updateVolume);
  $('language-toggle').addEventListener('click', () => {
    language = { fr: 'en', en: 'ja', ja: 'fr' }[language];
    try { localStorage.setItem('siteLanguage', language); } catch (_) { /* Session language still changes. */ }
    updateLanguage();
  });

  document.addEventListener('keydown', event => {
    if (!canPlay() || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (event.code === 'Escape') { event.preventDefault(); openMenu(); return; }
    if (event.target.closest('input, select, textarea, a, button:not(.flower), [contenteditable]')) return;
    const code = event.code;
    if (['Space', 'Enter', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(code) || /^[1-6]$/.test(event.key)) {
      if (code === 'Enter' && mode !== 'step') return;
      event.preventDefault();
      if (event.repeat) return;
      if (code === 'Space') playFlower(selected);
      else if (code === 'Enter') selectFlower(selected + 1);
      else if (code.startsWith('Arrow')) {
        selectFlower(selected + (code === 'ArrowRight' || code === 'ArrowDown' ? 1 : -1));
        if (mode === 'tap' || mode === 'gaze') flowers[selected].focus({ preventScroll: true });
      } else playFlower(Number(event.key) - 1);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGarden();
    else startScanning();
  });
  window.addEventListener('blur', pauseGarden);
  window.addEventListener('focus', startScanning);
  window.addEventListener('pagehide', pauseGarden);

  updateLanguage();
})();
