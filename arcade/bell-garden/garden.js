(() => {
  'use strict';

  const copy = {
    fr: {
      title: 'Jardin de clochettes', instructions: 'Faites chanter les fleurs au toucher, au regard ou avec une switch.',
      inputMode: 'Type de contrôle', tapMode: 'Tactile', gazeMode: 'Regard', switchMode: 'Switch', switchType: 'Mode switch',
      scanMode: 'Une switch : balayage', stepMode: 'Deux switches : avancer / jouer',
      dwellTime: 'Temps de fixation', scanTime: 'Intervalle de balayage', background: 'Fond',
      skyTheme: 'Jardin', darkTheme: 'Noir', lightTheme: 'Blanc', options: 'Options', volume: 'Volume des fleurs',
      music: 'Musique', musicVolume: 'Volume de la musique', musicUnavailable: 'La musique n’a pas pu démarrer. Réessayez en appuyant sur Commencer.',
      mute: 'Couper les notes des fleurs', gentleEffects: 'Réduire les animations', fullscreen: 'Plein écran',
      start: 'Commencer', resume: 'Reprendre', backToArcade: 'Retour à l’arcade',
      tapHint: 'Touchez une fleur. Clavier : flèches puis Espace, ou touches 1 à 6.',
      gazeHint: 'Fixez une fleur pour la faire chanter. Regardez ailleurs pour la rejouer.',
      scanHint: 'Espace : jouer la fleur illuminée. La sélection avance automatiquement.',
      stepHint: 'Entrée : fleur suivante. Espace : jouer la fleur illuminée.',
      flowerGroup: 'Fleurs musicales', playNote: 'Jouer la note', language: 'Changer la langue',
      soundUnavailable: 'Le son n’a pas pu démarrer. Appuyez sur Commencer pour réessayer.',
      notes: ['Do', 'Ré', 'Mi', 'Sol', 'La', 'Do aigu']
    },
    en: {
      title: 'Bell Garden', instructions: 'Make the flowers sing with touch, eye gaze or a switch.',
      inputMode: 'Input type', tapMode: 'Touch', gazeMode: 'Eyegaze', switchMode: 'Switch', switchType: 'Switch mode',
      scanMode: 'One switch: scanning', stepMode: 'Two switches: move / play',
      dwellTime: 'Dwell time', scanTime: 'Scanning interval', background: 'Background',
      skyTheme: 'Garden', darkTheme: 'Black', lightTheme: 'White', options: 'Options', volume: 'Flower volume',
      music: 'Music', musicVolume: 'Music volume', musicUnavailable: 'Music couldn’t start. Press Start to try again.',
      mute: 'Mute flower notes', gentleEffects: 'Reduce animations', fullscreen: 'Fullscreen',
      start: 'Start', resume: 'Resume', backToArcade: 'Back to the arcade',
      tapHint: 'Touch a flower. Keyboard: arrows then Space, or keys 1–6.',
      gazeHint: 'Look at a flower to make it sing. Look away before playing it again.',
      scanHint: 'Space: play the glowing flower. The glow moves automatically.',
      stepHint: 'Enter: next flower. Space: play the glowing flower.',
      flowerGroup: 'Musical flowers', playNote: 'Play flower note', language: 'Change language',
      soundUnavailable: 'Sound couldn’t start. Press Start to try again.',
      notes: ['C', 'D', 'E', 'G', 'A', 'High C']
    },
    ja: {
      title: 'ベルの庭', instructions: 'タッチ、視線、スイッチで花の音を楽しみましょう。',
      inputMode: '入力タイプ', tapMode: 'タッチ', gazeMode: '視線', switchMode: 'スイッチ', switchType: 'スイッチモード',
      scanMode: '1スイッチ：スキャン', stepMode: '2スイッチ：移動・演奏',
      dwellTime: '注視時間', scanTime: 'スキャン間隔', background: '背景',
      skyTheme: '庭', darkTheme: '黒', lightTheme: '白', options: '設定', volume: '花の音量',
      music: '音楽', musicVolume: '音楽の音量', musicUnavailable: '音楽を開始できませんでした。「開始」を押して再試行してください。',
      mute: '花の音を消す', gentleEffects: 'アニメーションを減らす', fullscreen: '全画面',
      start: '開始', resume: '再開', backToArcade: 'アーケードに戻る',
      tapHint: '花に触れてください。矢印キーで選び、スペースキーで演奏。1〜6キーでも演奏できます。',
      gazeHint: '花を見つめて音を鳴らしましょう。同じ花を鳴らすには一度視線を外してください。',
      scanHint: 'スペースキーで光っている花を演奏します。光は自動で次の花へ移動します。',
      stepHint: 'Enter：次の花。スペース：光っている花を演奏。',
      flowerGroup: '音楽の花', playNote: '花の音を演奏', language: '言語を変更',
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
  const instrument = window.BellGardenInstrument;
  const art = window.BellGardenArt;
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
  let musicFailed = false;
  let windowActive = true;

  try {
    const storedLanguage = localStorage.getItem('siteLanguage');
    if (copy[storedLanguage]) language = storedLanguage;
    const saved = JSON.parse(localStorage.getItem('bellGardenSettings') || 'null');
    if (saved && typeof saved === 'object') {
      if (['tap', 'gaze', 'scan', 'step'].includes(saved.mode)) pendingMode = saved.mode;
      for (const [id, min, max, key] of [['dwell-time', 300, 2500, 'dwell'], ['scan-time', 600, 4000, 'scan'], ['volume', 0, 100, 'volume'], ['music-volume', 0, 100, 'musicVolume']]) {
        if (Number.isFinite(saved[key])) $(id).value = Math.min(max, Math.max(min, saved[key]));
      }
      // Lower the previous default once, while retaining custom volume choices.
      if (saved.musicMixVersion !== 2 && saved.musicVolume === 20) $('music-volume').value = '10';
      if (['sky', 'dark', 'light'].includes(saved.theme)) $('theme').value = saved.theme;
      for (const [id, key] of [['gentle-effects', 'gentle'], ['mute-toggle', 'muted'], ['fullscreen-toggle', 'fullscreen'], ['music-enabled', 'music']]) {
        if (typeof saved[key] === 'boolean') $(id).checked = saved[key];
      }
      if (saved.muted && typeof saved.music !== 'boolean') $('music-enabled').checked = false;
    }
  } catch (_) { /* The game also works when browser storage is unavailable. */ }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) $('gentle-effects').checked = true;
  $('switch-mode').value = pendingMode === 'step' ? 'step' : 'scan';

  const music = window.BellGardenMusic.create($('garden-music'), {
    canPlay,
    enabled: () => $('music-enabled').checked,
    volume: () => Number($('music-volume').value) / 100,
    onFailure: showMusicFailure
  });

  art.kinds.forEach((kind, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'flower';
    button.dataset.index = index;
    button.dataset.flower = kind.name;
    button.style.setProperty('--plant-size', kind.size);
    button.style.setProperty('--crown-factor', kind.crown);
    button.style.setProperty('--height-cap', kind.cap);
    button.style.setProperty('--note-duration', instrument.durationMs + 'ms');
    button.style.setProperty('--sway-duration', [8.2, 9.1, 7.8, 8.8, 9.6, 8.5][index] + 's');
    button.style.setProperty('--sway-delay', [-3.2, -6.1, -1.8, -4.7, -2.4, -5.5][index] + 's');
    button.style.setProperty('--sway-angle', [1.2, 1.5, .9, 1.4, 1.6, 1.3][index] + 'deg');
    button.innerHTML = art.flower(index);
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
  function canPlay() { return started && !menuOpen && !document.hidden && windowActive; }

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
    if (musicFailed) $('music-status').textContent = text('musicUnavailable');
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
    $('music-volume-value').textContent = $('music-volume').value + ' %';
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

  function showMusicFailure(failed) {
    $('music-notice').hidden = !failed;
    if (failed !== musicFailed) $('music-status').textContent = failed ? text('musicUnavailable') : '';
    musicFailed = failed;
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

  function playPlantNote(index) {
    if (!ensureAudio()) return;
    // Bound overlapping voices, including rapid switch presses and multi-touch.
    if (voices.size >= 12) voices.values().next().value.stop();
    const nodes = [];
    let remaining = instrument.partials.length;
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
    instrument.partials.forEach(({ ratio, level, attack, decay }) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = instrument.frequencies[index] * ratio;
      gain.gain.setValueAtTime(0, audio.currentTime);
      gain.gain.linearRampToValueAtTime(level, audio.currentTime + attack);
      gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + decay);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        if (--remaining === 0) voices.delete(voice);
      };
      nodes.push([oscillator, gain]);
      oscillator.start();
      oscillator.stop(audio.currentTime + decay + .05);
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
    }, instrument.durationMs + 50));
  }

  function playFlower(index) {
    if (!canPlay()) return;
    playPlantNote(index);
    if (!$('mute-toggle').checked) music.duck(instrument.durationMs);
    animateFlower(index);
    if (mode !== 'scan') selectFlower(index, mode === 'step');
  }

  function pauseGarden() {
    document.body.classList.add('garden-paused');
    music.pause();
    stopScanning();
    cancelDwell();
    dwellLocked = null;
    silence();
    animationTimers.forEach(timer => clearTimeout(timer));
    animationTimers.clear();
    flowers.forEach(flower => flower.classList.remove('is-playing'));
  }

  function resumeGarden() {
    if (!canPlay()) return;
    document.body.classList.remove('garden-paused');
    startScanning();
    music.resume();
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
        theme: $('theme').value, muted: $('mute-toggle').checked, fullscreen: $('fullscreen-toggle').checked,
        music: $('music-enabled').checked, musicVolume: Number($('music-volume').value), musicMixVersion: 2
      }));
    } catch (_) { /* Session settings still work without storage. */ }
  }

  function startGarden() {
    ensureAudio();
    windowActive = true;
    mode = pendingMode;
    started = true;
    menuOpen = false;
    panel.hidden = true;
    screen.hidden = false;
    $('language-toggle').hidden = true;
    document.body.classList.add('garden-running');
    document.body.classList.remove('garden-paused');
    document.body.classList.toggle('gentle', $('gentle-effects').checked);
    document.body.dataset.theme = $('theme').value;
    updateVolume();
    saveSettings();
    updateLanguage();
    selectFlower(selected, mode === 'scan' || mode === 'step');
    garden.focus({ preventScroll: true });
    startScanning();
    music.start();
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
  ['dwell-time', 'scan-time', 'volume', 'music-volume'].forEach(id => $(id).addEventListener('input', () => {
    updateModeFields();
    if (id === 'volume') updateVolume();
    if (id === 'music-volume') music.update();
  }));
  $('mute-toggle').addEventListener('change', updateVolume);
  $('music-enabled').addEventListener('change', () => music.update());
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
    else resumeGarden();
  });
  window.addEventListener('blur', () => { windowActive = false; pauseGarden(); });
  window.addEventListener('focus', () => { windowActive = true; resumeGarden(); });
  window.addEventListener('pagehide', pauseGarden);

  updateLanguage();
})();
