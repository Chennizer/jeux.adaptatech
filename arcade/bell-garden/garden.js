(() => {
  'use strict';

  const copy = {
    fr: {
      arcade: 'Arcade', eyebrow: 'Un petit monde musical', title: 'Jardin de clochettes',
      subtitle: 'Chaque fleur a une chanson. À vous de la découvrir.', settings: 'Options', yourGarden: 'Votre jardin',
      awakened: 'fleurs éveillées', gardenMessage: 'Un peu de curiosité, beaucoup de musique.',
      complete: 'Tout le jardin s’est éveillé ! Continuez à le faire chanter.', listen: 'Écouter', stop: 'Arrêter',
      footer: 'Explorez à votre rythme. Il n’y a pas de fausse note.', notesPlayed: 'notes jouées',
      welcome: 'Bienvenue au jardin', dialogTitle: 'Faites fleurir la musique.',
      dialogDescription: 'Six fleurs, six clochettes. Choisissez votre façon de jouer, puis explorez librement.',
      inputMode: 'Comment voulez-vous jouer ?', tapMode: 'Toucher / souris / clavier', gazeMode: 'Contrôle oculaire (fixation)',
      scanMode: 'Une switch (balayage automatique)', stepMode: 'Deux switches (avancer et jouer)',
      dwellTime: 'Temps de fixation', scanTime: 'Intervalle de balayage', volume: 'Volume des clochettes',
      gentleEffects: 'Réduire les animations', start: 'Entrer dans le jardin', resume: 'Retour au jardin', backToArcade: 'Retour à l’arcade',
      tapHint: 'Touchez une fleur pour la faire chanter. Au clavier : flèches puis Espace, ou touches 1 à 6.',
      gazeHint: 'Fixez une fleur jusqu’à ce que le cercle soit rempli. Regardez ailleurs pour rejouer la même fleur.',
      scanHint: 'Appuyez sur Espace (switch) pour jouer la fleur encadrée. Le cadre avance tout seul.',
      stepHint: 'Entrée (switch 1) : fleur suivante. Espace (switch 2) : jouer la fleur encadrée.',
      reset: 'Recommencer le jardin', mute: 'Couper le son', unmute: 'Activer le son', flowerGroup: 'Fleurs musicales',
      playNote: 'Jouer la clochette', soundUnavailable: 'Le son n’a pas pu démarrer. Touchez une fleur pour réessayer ; le jardin reste jouable sans son.',
      language: 'Changer la langue', notes: ['Do', 'Ré', 'Mi', 'Sol', 'La', 'Do aigu']
    },
    en: {
      arcade: 'Arcade', eyebrow: 'A little world of music', title: 'Bell Garden',
      subtitle: 'Every flower has a song. Find yours.', settings: 'Settings', yourGarden: 'Your garden',
      awakened: 'flowers awakened', gardenMessage: 'A little curiosity. A lot of music.',
      complete: 'Your whole garden is awake! Keep making it sing.', listen: 'Listen', stop: 'Stop',
      footer: 'Explore at your own pace. There are no wrong notes.', notesPlayed: 'notes played',
      welcome: 'Welcome to the garden', dialogTitle: 'Let your music bloom.',
      dialogDescription: 'Six flowers, six little bells. Choose how you’d like to play, then make yourself at home.',
      inputMode: 'How would you like to play?', tapMode: 'Touch / mouse / keyboard', gazeMode: 'Eye gaze (dwell)',
      scanMode: 'One switch (automatic scanning)', stepMode: 'Two switches (move and play)',
      dwellTime: 'Dwell time', scanTime: 'Scanning interval', volume: 'Bell volume',
      gentleEffects: 'Reduce animations', start: 'Enter the garden', resume: 'Back to the garden', backToArcade: 'Back to the arcade',
      tapHint: 'Touch a flower to make it sing. Keyboard: arrows then Space, or keys 1–6.',
      gazeHint: 'Look at a flower until its circle fills. Look away before playing the same flower again.',
      scanHint: 'Press Space (switch) to play the outlined flower. The outline moves automatically.',
      stepHint: 'Enter (switch 1): next flower. Space (switch 2): play the outlined flower.',
      reset: 'Start a fresh garden', mute: 'Mute sound', unmute: 'Enable sound', flowerGroup: 'Musical flowers',
      playNote: 'Play bell', soundUnavailable: 'Sound couldn’t start. Touch a flower to try again; you can still explore the garden without sound.',
      language: 'Change language', notes: ['C', 'D', 'E', 'G', 'A', 'High C']
    },
    ja: {
      arcade: 'アーケード', eyebrow: '小さな音楽の世界', title: 'ベルの庭',
      subtitle: 'どの花にも音があります。見つけてみましょう。', settings: '設定', yourGarden: 'あなたの庭',
      awakened: '目覚めた花', gardenMessage: '好奇心から、音楽が生まれます。',
      complete: 'すべての花が目覚めました！もっと音楽を楽しみましょう。', listen: '聴く', stop: '停止',
      footer: '自分のペースで楽しみましょう。間違った音はありません。', notesPlayed: '回の演奏',
      welcome: '庭へようこそ', dialogTitle: '音楽の花を咲かせよう。',
      dialogDescription: '6つの花と6つのベル。遊び方を選んで、自由に音を楽しみましょう。',
      inputMode: '遊び方を選んでください', tapMode: 'タッチ・マウス・キーボード', gazeMode: '視線入力（注視）',
      scanMode: '1スイッチ（自動スキャン）', stepMode: '2スイッチ（移動と演奏）',
      dwellTime: '注視時間', scanTime: 'スキャン間隔', volume: 'ベルの音量', gentleEffects: 'アニメーションを減らす',
      start: '庭に入る', resume: '庭に戻る', backToArcade: 'アーケードに戻る',
      tapHint: '花に触れて音を鳴らしましょう。キーボード：矢印キーで選び、スペースキーで演奏。1〜6キーでも演奏できます。',
      gazeHint: '円がいっぱいになるまで花を見つめましょう。同じ花を鳴らすには一度視線を外してください。',
      scanHint: 'スペースキー（スイッチ）で枠のある花を演奏します。枠は自動で移動します。',
      stepHint: 'Enter（スイッチ1）：次の花。スペース（スイッチ2）：枠のある花を演奏。',
      reset: '庭を最初から始める', mute: '消音', unmute: '音を有効にする', flowerGroup: '音楽の花',
      playNote: 'ベルを演奏', soundUnavailable: '音を開始できませんでした。花に触れて再試行してください。音なしでも庭を楽しめます。',
      language: '言語を変更', notes: ['ド', 'レ', 'ミ', 'ソ', 'ラ', '高いド']
    }
  };

  const $ = id => document.getElementById(id);
  const garden = $('garden');
  const dialog = $('settings-dialog');
  const modeInput = $('input-mode');
  const flowers = [];
  const dots = [];
  const frequencies = [261.63, 293.66, 329.63, 392, 440, 523.25];
  const palette = [
    ['#e8a1ad', '#bc6c86'], ['#edd080', '#c69c4f'], ['#a8afe0', '#7b82b6'],
    ['#87bfb1', '#4f9183'], ['#eab08e', '#c48166'], ['#c8a4cf', '#9e75a8']
  ];
  const animationTimers = new Map();
  const demoTimers = new Set();
  const voices = new Set();
  const discovered = new Set();
  let language = 'fr';
  let started = false;
  let mode = 'tap';
  let selected = 0;
  let noteCount = 0;
  let scanTimer = null;
  let dwellTimer = null;
  let dwellTarget = null;
  let dwellLocked = null;
  let playingDemo = false;
  let muted = false;
  let audio = null;
  let master = null;

  try {
    const storedLanguage = localStorage.getItem('siteLanguage');
    if (copy[storedLanguage]) language = storedLanguage;
    const saved = JSON.parse(localStorage.getItem('bellGardenSettings') || 'null');
    if (saved && typeof saved === 'object') {
      if (['tap', 'gaze', 'scan', 'step'].includes(saved.mode)) modeInput.value = saved.mode;
      for (const [id, min, max, key] of [['dwell-time', 300, 2500, 'dwell'], ['scan-time', 600, 4000, 'scan'], ['volume', 0, 100, 'volume']]) {
        if (Number.isFinite(saved[key])) $(id).value = Math.min(max, Math.max(min, saved[key]));
      }
      if (typeof saved.gentle === 'boolean') $('gentle-effects').checked = saved.gentle;
    }
  } catch (_) { /* The garden also works when browser storage is unavailable. */ }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) $('gentle-effects').checked = true;

  palette.forEach(([petal, rim], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'flower';
    button.dataset.index = index;
    button.style.setProperty('--petal', petal);
    button.style.setProperty('--rim', rim);
    button.style.setProperty('--lift', `${[2, -15, 5, -9, 0, -18][index]}px`);
    button.innerHTML = '<svg class="plant-art" aria-hidden="true"><use href="#bell-plant"/></svg>' +
      '<svg class="dwell-ring" viewBox="0 0 166 166" aria-hidden="true"><circle cx="83" cy="83" r="76" pathLength="1"/></svg>' +
      '<span class="sparkles" aria-hidden="true"></span><span class="note-label"><span class="note-name"></span><span class="note-number" aria-hidden="true">' + (index + 1) + '</span></span>';
    garden.append(button);
    flowers.push(button);
    const dot = document.createElement('span');
    dot.className = 'growth-dot';
    dot.style.setProperty('--petal', petal);
    $('growth-dots').append(dot);
    dots.push(dot);

    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      cancelDwell();
      dwellLocked = button;
      playFlower(index);
    });
    // Native keyboard activation, screen readers, and synthesized eye-tracker clicks.
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
      if (started && mode !== 'scan') selectFlower(index, mode === 'step');
    });
  });

  function text(key) { return copy[language][key]; }
  function canPlay() { return started && !dialog.open && !document.hidden; }

  function updateLanguage() {
    document.documentElement.lang = language;
    document.title = `${text('title')} · Adaptatech`;
    document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = text(element.dataset.i18n); });
    const next = { fr: 'en', en: 'ja', ja: 'fr' }[language];
    $('language-button').textContent = { fr: 'FR', en: 'EN', ja: '日本語' }[next];
    $('language-button').setAttribute('aria-label', `${text('language')} (${next})`);
    garden.setAttribute('aria-label', text('flowerGroup'));
    flowers.forEach((flower, index) => {
      flower.querySelector('.note-name').textContent = text('notes')[index];
      flower.setAttribute('aria-label', `${text('playNote')} ${text('notes')[index]}`);
    });
    $('reset-button').setAttribute('aria-label', text('reset'));
    $('reset-button').title = text('reset');
    $('start-label').textContent = text(started ? 'resume' : 'start');
    $('garden-message').textContent = text(discovered.size === flowers.length ? 'complete' : 'gardenMessage');
    $('audio-notice').textContent = text('soundUnavailable');
    updateModeFields();
    updateDemoButton();
    updateMuteButton();
  }

  function updateModeFields() {
    const nextMode = modeInput.value;
    $('dwell-field').hidden = nextMode !== 'gaze';
    $('scan-field').hidden = nextMode !== 'scan';
    $('mode-description').textContent = text(`${nextMode}Hint`);
    $('play-hint').textContent = text(`${mode}Hint`);
    $('dwell-value').textContent = `${$('dwell-time').value} ms`;
    $('scan-value').textContent = `${(Number($('scan-time').value) / 1000).toLocaleString(language, { maximumFractionDigits: 1 })} s`;
    $('volume-value').textContent = `${$('volume').value} %`;
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
    button.style.setProperty('--dwell-time', `${$('dwell-time').value}ms`);
    button.classList.add('is-dwelling');
    dwellTimer = setTimeout(() => {
      cancelDwell();
      dwellLocked = button;
      if (canPlay() && mode === 'gaze') playFlower(index);
    }, Number($('dwell-time').value));
  }

  function stopScanning() {
    clearInterval(scanTimer);
    scanTimer = null;
  }

  function startScanning() {
    stopScanning();
    if (!canPlay() || mode !== 'scan') return;
    selectFlower(selected);
    scanTimer = setInterval(() => {
      if (canPlay() && !playingDemo) selectFlower(selected + 1);
    }, Number($('scan-time').value));
  }

  function showAudioFailure(failed) {
    $('audio-notice').hidden = !failed;
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
    if (master) master.gain.setTargetAtTime(muted ? 0 : Number($('volume').value) / 100, audio.currentTime, .02);
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
    // Restart the animation when the same bell is played repeatedly.
    void flower.offsetWidth;
    flower.classList.add('is-playing');
    animationTimers.set(flower, setTimeout(() => {
      flower.classList.remove('is-playing');
      animationTimers.delete(flower);
    }, 900));
  }

  function playFlower(index, source = 'player') {
    if (!canPlay()) return;
    if (source === 'player' && playingDemo) stopDemo(true);
    ringBell(index);
    animateFlower(index);
    if (source !== 'player') return;
    if (mode !== 'scan') selectFlower(index, mode === 'step');
    $('note-count').textContent = ++noteCount;
    discovered.add(index);
    flowers[index].classList.add('is-discovered');
    dots[index].classList.add('is-grown');
    $('awakened-count').textContent = `${discovered.size} / ${flowers.length}`;
    if (discovered.size === flowers.length) {
      document.querySelector('.garden-scene').classList.add('garden-complete');
      if ($('garden-message').textContent !== text('complete')) $('garden-message').textContent = text('complete');
    }
  }

  function updateDemoButton() {
    $('demo-label').textContent = text(playingDemo ? 'stop' : 'listen');
    $('demo-icon').textContent = playingDemo ? '■' : '♫';
    $('demo-button').setAttribute('aria-pressed', String(playingDemo));
  }

  function stopDemo(quiet = false) {
    demoTimers.forEach(timer => clearTimeout(timer));
    demoTimers.clear();
    playingDemo = false;
    if (quiet) silence();
    updateDemoButton();
  }

  function startDemo() {
    if (!canPlay()) return;
    if (playingDemo) { stopDemo(true); return; }
    cancelDwell();
    ensureAudio();
    playingDemo = true;
    updateDemoButton();
    const melody = [0, 2, 3, 4, 3, 2, 1, 0];
    const schedule = (callback, delay) => {
      const timer = setTimeout(() => { demoTimers.delete(timer); callback(); }, delay);
      demoTimers.add(timer);
    };
    melody.forEach((index, step) => schedule(() => playFlower(index, 'demo'), step * 460));
    schedule(() => stopDemo(), (melody.length - 1) * 460 + 2200);
  }

  function updateMuteButton() {
    $('mute-button').setAttribute('aria-pressed', String(muted));
    $('mute-button').setAttribute('aria-label', text(muted ? 'unmute' : 'mute'));
    $('mute-button').title = text(muted ? 'unmute' : 'mute');
    $('sound-icon').setAttribute('href', muted ? '#icon-muted' : '#icon-sound');
  }

  function resetGarden() {
    stopDemo(true);
    cancelDwell();
    dwellLocked = null;
    animationTimers.forEach(timer => clearTimeout(timer));
    animationTimers.clear();
    discovered.clear();
    noteCount = 0;
    flowers.forEach(flower => flower.classList.remove('is-playing', 'is-discovered'));
    dots.forEach(dot => dot.classList.remove('is-grown'));
    document.querySelector('.garden-scene').classList.remove('garden-complete');
    $('note-count').textContent = '0';
    $('awakened-count').textContent = '0 / 6';
    $('garden-message').textContent = text('gardenMessage');
    selectFlower(0, mode === 'scan' || mode === 'step');
    startScanning();
    garden.focus({ preventScroll: true });
  }

  function saveSettings() {
    try {
      localStorage.setItem('bellGardenSettings', JSON.stringify({
        mode, dwell: Number($('dwell-time').value), scan: Number($('scan-time').value),
        volume: Number($('volume').value), gentle: $('gentle-effects').checked
      }));
    } catch (_) { /* Settings can still be used for this session. */ }
  }

  function startGarden() {
    ensureAudio(); // Called from a user gesture to unlock browser audio.
    mode = modeInput.value;
    started = true;
    dialog.close();
    document.body.classList.toggle('gentle', $('gentle-effects').checked);
    saveSettings();
    updateLanguage();
    selectFlower(selected, mode === 'scan' || mode === 'step');
    garden.focus({ preventScroll: true });
    startScanning();
  }

  $('start-button').addEventListener('click', startGarden);
  $('settings-button').addEventListener('click', () => {
    stopScanning();
    cancelDwell();
    dwellLocked = null;
    stopDemo(true);
    $('start-label').textContent = text(started ? 'resume' : 'start');
    dialog.showModal();
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); startGarden(); });
  modeInput.addEventListener('change', updateModeFields);
  ['dwell-time', 'scan-time', 'volume'].forEach(id => $(id).addEventListener('input', () => {
    updateModeFields();
    if (id === 'volume') {
      if (Number($('volume').value) > 0 && muted) { muted = false; updateMuteButton(); }
      updateVolume();
    }
  }));
  $('language-button').addEventListener('click', () => {
    language = { fr: 'en', en: 'ja', ja: 'fr' }[language];
    try { localStorage.setItem('siteLanguage', language); } catch (_) { /* Session language still changes. */ }
    updateLanguage();
  });
  $('mute-button').addEventListener('click', () => {
    muted = !muted;
    if (!muted && Number($('volume').value) === 0) { $('volume').value = '55'; updateModeFields(); saveSettings(); }
    if (!muted) ensureAudio();
    updateVolume();
    updateMuteButton();
    if (mode === 'scan' || mode === 'step') garden.focus({ preventScroll: true });
  });
  $('demo-button').addEventListener('click', () => {
    startDemo();
    if (mode === 'scan' || mode === 'step') garden.focus({ preventScroll: true });
  });
  $('reset-button').addEventListener('click', resetGarden);

  document.addEventListener('keydown', event => {
    if (!canPlay() || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (event.target.closest('input, select, textarea, a, button:not(.flower), [contenteditable]')) return;
    const code = event.code;
    if (['Space', 'Enter', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(code) || /^[1-6]$/.test(event.key)) {
      if (code === 'Enter' && mode !== 'step') return; // Preserve native flower button activation.
      event.preventDefault();
      if (event.repeat) return; // Holding a switch must not generate a stream of notes.
      if (code === 'Space') playFlower(selected);
      else if (code === 'Enter') selectFlower(selected + 1);
      else if (code.startsWith('Arrow')) {
        selectFlower(selected + (code === 'ArrowRight' || code === 'ArrowDown' ? 1 : -1));
        if (mode === 'tap' || mode === 'gaze') flowers[selected].focus({ preventScroll: true });
      }
      else playFlower(Number(event.key) - 1);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopScanning(); cancelDwell(); dwellLocked = null; stopDemo(true); }
    else startScanning();
  });
  window.addEventListener('blur', () => { cancelDwell(); dwellLocked = null; });
  window.addEventListener('pagehide', () => { stopScanning(); cancelDwell(); stopDemo(true); });

  updateLanguage();
  document.body.classList.toggle('gentle', $('gentle-effects').checked);
  dialog.showModal();
})();
