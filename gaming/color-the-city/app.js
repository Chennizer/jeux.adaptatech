(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SVG = 'http://www.w3.org/2000/svg';
  const INK = '#45404f';
  const WORLD = { width: 1200, groundY: 650, airshipY: 112, outletY: 282, fallSpeed: 390, halfShipWidth: 235 };
  const text = {
    en: {
      games: 'Switch games', language: 'Language', title: 'Colour the city.',
      pause: 'Pause', resume: 'Continue', settings: 'Settings',
      soundLabel: 'Little sounds', soundOff: 'Off', soundOn: 'On',
      space: 'SPACE', orSwitch: 'switch · click · touch',
      settingsHint: 'Your drawing can wait.', speed: 'Zeppelin speed',
      slow: 'Gentle', normal: 'Easygoing', fast: 'Brisk',
      guide: 'Aiming guide', guideHint: 'A little line shows where the paint will fall.',
      assist: 'A helping hand', assistHint: 'Drops near a house gently find their way to it.',
      done: 'Done', start: 'Let’s paint', drop: 'Drop some colour', replay: 'Another drawing',
      readyTitle: 'A blank page. A little magic.', readyCopy: 'Press Space, Enter, or your switch to begin.',
      pausedTitle: 'A little daydream.', pausedCopy: 'Press again when you’re ready.',
      completeTitle: 'Oh, what a lovely place.', completeCopy: 'All yours. Press again for a fresh drawing.',
      initial: 'Press to drop a little colour onto a house.', falling: 'Here comes a splash…',
      hit: 'A little more lovely.', miss: 'A splash on the page! The zeppelin will come around again.',
      already: 'This house is already full of colour.', win: 'All {total} floors painted. Your drawing is complete!',
      paused: 'Paused. Press again to continue.', sceneTitle: 'Colour the City drawing board',
      sceneDescription: 'A giant rainbow zeppelin floats over four big white outline houses. Press to drop paint and colour one floor.',
      paintedLabel: 'Painted floors'
    },
    fr: {
      games: 'Jeux pour switch', language: 'Langue', title: 'Colore la ville.',
      pause: 'Pause', resume: 'Continuer', settings: 'Réglages',
      soundLabel: 'Petits sons', soundOff: 'Désactivés', soundOn: 'Activés',
      space: 'ESPACE', orSwitch: 'switch · clic · toucher',
      settingsHint: 'Le dessin t’attend.', speed: 'Vitesse du zeppelin',
      slow: 'Douce', normal: 'Tranquille', fast: 'Rapide',
      guide: 'Guide de visée', guideHint: 'Une petite ligne montre où la peinture tombera.',
      assist: 'Coup de pouce', assistHint: 'Les gouttes proches d’une maison la rejoignent.',
      done: 'Terminé', start: 'C’est parti !', drop: 'Une goutte de couleur', replay: 'Un autre dessin',
      readyTitle: 'Une page blanche. Un peu de magie.', readyCopy: 'Appuie sur Espace, Entrée ou ta switch pour commencer.',
      pausedTitle: 'Une petite rêverie.', pausedCopy: 'Appuie à nouveau quand tu veux.',
      completeTitle: 'Comme c’est joli !', completeCopy: 'C’est ta création. Appuie pour un nouveau dessin.',
      initial: 'Appuie pour laisser tomber de la couleur sur une maison.', falling: 'Une touche de couleur arrive…',
      hit: 'Encore un peu plus joli.', miss: 'Une tache sur la page ! Le zeppelin va revenir.',
      already: 'Cette maison est déjà pleine de couleurs.', win: 'Les {total} étages sont peints. Ton dessin est terminé !',
      paused: 'En pause. Appuie pour continuer.', sceneTitle: 'Tableau de dessin Colore la ville',
      sceneDescription: 'Un grand zeppelin arc-en-ciel flotte au-dessus de quatre grandes maisons blanches dessinées au trait. Appuie pour peindre un étage.',
      paintedLabel: 'Étages peints'
    },
    ja: {
      games: 'スイッチゲーム', language: '言語', title: '街を彩ろう。',
      pause: '一時停止', resume: '続ける', settings: '設定',
      soundLabel: '小さな音', soundOff: 'オフ', soundOn: 'オン',
      space: 'スペース', orSwitch: 'スイッチ・クリック・タッチ',
      settingsHint: '絵は待っているよ。', speed: '飛行船の速さ',
      slow: 'ゆっくり', normal: 'ふつう', fast: 'はやい',
      guide: 'ねらいのガイド', guideHint: '絵の具が落ちる場所を線で示します。',
      assist: 'おたすけ', assistHint: '家の近くに落ちた絵の具が家に届きます。',
      done: '完了', start: 'はじめよう', drop: '色を落とす', replay: '新しい絵を描く',
      readyTitle: '白いページに、小さな魔法。', readyCopy: 'スペース、エンター、スイッチで開始。',
      pausedTitle: 'ちょっとひとやすみ。', pausedCopy: '準備ができたら、もう一度押そう。',
      completeTitle: 'すてきな街ができたね。', completeCopy: 'あなたの作品だよ。もう一度押すと新しい絵に。',
      initial: '押すと、家に絵の具が落ちるよ。', falling: '絵の具が落ちてくるよ…',
      hit: 'もっとすてきになったね。', miss: 'ページに色がついたね！飛行船はまた戻ってくるよ。',
      already: 'この家はもう色いっぱい。', win: '{total}階すべて塗れたね。絵の完成！',
      paused: '一時停止中。もう一度押すと続けられます。', sceneTitle: '街を彩ろう お絵描きボード',
      sceneDescription: '大きな虹色の飛行船が、線で描かれた4軒の白い家の上を飛びます。押すと一階ずつ色がつきます。',
      paintedLabel: '塗った階'
    }
  };
  const palettes = [
    ['#ffb39e', '#ffe18a', '#bba9ee', '#95d4c3'],
    ['#b7d9ee', '#ffc6d8', '#c8dca2', '#f6c193']
  ];
  const buildings = [
    { x: 56, width: 228, floorHeight: 64, roofKind: 'gable', roofHeight: 42 },
    { x: 342, width: 228, floorHeight: 80, roofKind: 'dome', roofHeight: 58 },
    { x: 628, width: 228, floorHeight: 86, roofKind: 'gable', roofHeight: 74 },
    { x: 914, width: 228, floorHeight: 72, roofKind: 'gable', roofHeight: 38 }
  ].map(b => ({ ...b, floors: 3, top: WORLD.groundY - 3 * b.floorHeight, painted: 0, floorEls: [], roof: null, door: null }));
  const totalFloors = buildings.reduce((total, b) => total + b.floors, 0);
  const initialAirshipX = Math.max(WORLD.halfShipWidth + 4, buildings[0].x + buildings[0].width / 2);
  let lang = 'fr';
  try { const saved = localStorage.getItem('siteLanguage'); if (text[saved]) lang = saved; } catch (_) { /* Storage is optional. */ }
  let phase = 'ready';
  let airshipX = initialAirshipX;
  let lastTime = null;
  let soundEnabled = false;
  let audio;
  let feedbackKey = 'initial';
  let totalPainted = 0;
  let drops = [];
  let effects = [];
  let pageSplashes = [];
  let paletteIndex = 0;
  const heldKeys = new Set();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function svg(tag, attrs = {}, parent) {
    const node = document.createElementNS(SVG, tag);
    Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, value));
    if (parent) parent.appendChild(node);
    return node;
  }
  function inkPath(d, parent, attrs = {}) {
    return svg('path', { d, fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs }, parent);
  }
  function roofY(b, x) {
    const radius = b.width / 2 + 12;
    const position = Math.max(-1, Math.min(1, (x - b.x - b.width / 2) / radius));
    return b.top + 3 - b.roofHeight * (b.roofKind === 'dome' ? Math.sqrt(1 - position * position) : 1 - Math.abs(position));
  }
  function buildCity() {
    $('buildings').replaceChildren();
    $('streetDetails').replaceChildren();
    inkPath('M24 652Q191 648 320 651T650 650T960 652T1180 650', $('streetDetails'), { stroke: '#aaa2b4', 'stroke-width': 2 });
    buildings.forEach((b, i) => {
      const g = svg('g', { 'data-building': i }, $('buildings'));
      b.painted = 0;
      b.floorEls = [];
      for (let floor = 0; floor < b.floors; floor++) {
        const y = WORLD.groundY - (floor + 1) * b.floorHeight;
        b.floorEls.push(svg('rect', { x: b.x + 1, y: y + 1, width: b.width - 2, height: b.floorHeight, fill: '#fff', class: 'floor' }, g));
        if (floor > 0) inkPath(`M${b.x} ${y + b.floorHeight}Q${b.x + 90} ${y + b.floorHeight - 2} ${b.x + b.width} ${y + b.floorHeight}`, g, { 'stroke-width': 2.5 });
        for (let column = 0; column < (floor === 0 ? 1 : 2); column++) {
          const x = b.x + 46 + column * 91;
          const windowY = y + (b.floorHeight - 37) / 2;
          if (i === 2) {
            svg('circle', { cx: x + 20, cy: windowY + 19, r: 19, fill: '#fff', stroke: INK, 'stroke-width': 2.5 }, g);
            inkPath(`M${x + 20} ${windowY + 1}v36M${x + 2} ${windowY + 19}h36`, g, { 'stroke-width': 2 });
          } else {
            svg('rect', { x, y: windowY, width: 40, height: 37, rx: i === 1 ? 17 : 6, fill: '#fff', stroke: INK, 'stroke-width': 2.5 }, g);
            inkPath(`M${x + 20} ${windowY + 1}v35M${x + 1} ${windowY + 19}h38`, g, { 'stroke-width': 2 });
          }
        }
      }
      inkPath(`M${b.x + 1} ${b.top + 2}Q${b.x - 2} ${b.top + 120} ${b.x + 1} 650H${b.x + b.width - 1}Q${b.x + b.width + 2} ${b.top + 95} ${b.x + b.width - 1} ${b.top + 2}`, g);
      const left = b.x - 12, right = b.x + b.width + 12, base = b.top + 3;
      const roofPath = b.roofKind === 'dome'
        ? `M${left} ${base}A${b.width / 2 + 12} ${b.roofHeight} 0 0 1 ${right} ${base}Z`
        : `M${left} ${base}L${b.x + b.width / 2} ${base - b.roofHeight}L${right} ${base}Z`;
      b.roof = inkPath(roofPath, g, { fill: '#fff', class: 'roof-colour' });
      const doorX = b.x + b.width - 79;
      b.door = inkPath(`M${doorX} 650v-39a22 22 0 0 1 44 0v39Z`, g, { fill: '#fff', class: 'door' });
      svg('circle', { cx: doorX + 34, cy: 630, r: 2.5, fill: INK }, g);
      if (i === 0) {
        // A scalloped, uncoloured shop awning.
        inkPath(`M${b.x + 16} 574h196l-9 17q-14 14-27 0q-14 14-28 0q-14 14-28 0q-14 14-28 0q-14 14-28 0q-14 14-28 0q-14 14-27 0Z`, g, { fill: '#fff', 'stroke-width': 2.5 });
      }
      if (i === 1) {
        const cx = b.x + b.width / 2, peak = base - b.roofHeight;
        inkPath(`M${cx} ${peak}v-28m0 0q-26-18-32-3q8 20 32 3m0 0q14-24 29-15q-1 20-29 15`, g, { fill: '#fff', 'stroke-width': 2.5 });
      }
      if (i === 2) {
        const cx = b.x + b.width / 2, sy = base - b.roofHeight - 28;
        inkPath(`M${cx} ${sy + 18}v10`, g, { 'stroke-width': 2.5 });
        inkPath(`M${cx} ${sy - 17}l5 11 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1Z`, g, { fill: '#fff', 'stroke-width': 2.5 });
      }
      if (i === 3) {
        // A little loop of chimney smoke, drawn rather than animated.
        inkPath(`M${b.x + 163} ${b.top - 20}v-31h23v43m-9-58q-18-16-5-28q17-15 27 1q10 17-9 21`, g, { fill: '#fff', 'stroke-width': 2.5 });
      }
    });
    $('progressDots').replaceChildren();
    for (let i = 0; i < totalFloors; i++) {
      const dot = document.createElement('i');
      dot.style.setProperty('--dot-colour', palettes[paletteIndex][Math.floor(i / 3)]);
      $('progressDots').appendChild(dot);
    }
    $('progress').max = totalFloors;
  }
  function announce(key) {
    feedbackKey = key;
    $('feedback').textContent = text[lang][key].replace('{total}', totalFloors);
  }
  function setPhase(next) { phase = next; $('playSurface').dataset.state = phase; updateUI(); }
  function updateUI() {
    const t = text[lang];
    $('actionLabel').textContent = t[phase === 'ready' ? 'start' : phase === 'paused' ? 'resume' : phase === 'complete' ? 'replay' : 'drop'];
    $('pause').disabled = phase === 'ready' || phase === 'complete';
    $('pause').textContent = t[phase === 'paused' ? 'resume' : 'pause'];
    $('sound').textContent = t[soundEnabled ? 'soundOn' : 'soundOff'];
    $('sound').setAttribute('aria-pressed', String(soundEnabled));
    $('sceneMessage').hidden = phase === 'playing';
    $('sceneMessage').dataset.side = airshipX > WORLD.width / 2 ? 'left' : 'right';
    if (phase !== 'playing') {
      const prefix = phase === 'complete' ? 'complete' : phase === 'paused' ? 'paused' : 'ready';
      $('messageTitle').textContent = t[prefix + 'Title'];
      $('messageCopy').textContent = t[prefix + 'Copy'];
    }
    $('progressText').textContent = `${totalPainted} / ${totalFloors}`;
    $('progress').value = totalPainted;
    [...$('progressDots').children].forEach((dot, index) => dot.classList.toggle('filled', index % 3 < buildings[Math.floor(index / 3)].painted));
  }
  function translate() {
    document.documentElement.lang = lang;
    document.title = text[lang].title + ' · Adaptatech';
    $('language').value = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = text[lang][el.dataset.i18n]; });
    $('scene-title').textContent = text[lang].sceneTitle;
    $('scene-description').textContent = text[lang].sceneDescription;
    $('progress').setAttribute('aria-label', text[lang].paintedLabel);
    announce(feedbackKey); updateUI();
  }
  function tone(success = false) {
    if (!soundEnabled) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const now = audio.currentTime;
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(success ? 523.25 : 349.23, now);
      oscillator.frequency.exponentialRampToValueAtTime(success ? 783.99 : 440, now + .13);
      gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.07, now + .015); gain.gain.exponentialRampToValueAtTime(.0001, now + .3);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + .32);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch (_) { /* Visual play remains available when audio is unavailable. */ }
  }
  function targetAt(x) {
    const margin = $('assist').checked ? 14 : 0;
    return buildings.find(b => x >= b.x - margin && x <= b.x + b.width + margin);
  }
  function drawAirship() {
    $('airship').setAttribute('transform', `translate(${airshipX} ${WORLD.airshipY})`);
    const target = targetAt(airshipX);
    const bottom = target ? roofY(target, airshipX) : WORLD.groundY;
    $('aimGuide').setAttribute('x1', airshipX); $('aimGuide').setAttribute('x2', airshipX); $('aimGuide').setAttribute('y2', bottom);
    $('aimMark').setAttribute('cx', airshipX); $('aimMark').setAttribute('cy', bottom);
    $('aimGuide').style.display = $('guide').checked ? '' : 'none';
    $('aimMark').style.display = $('guide').checked ? '' : 'none';
    $('paintBucket').setAttribute('fill', target ? palettes[paletteIndex][buildings.indexOf(target)] : '#ffe18a');
  }
  function splash(x, y, colour) {
    const g = svg('g', {}, $('effects'));
    svg('ellipse', { cx: x, cy: y, rx: 32, ry: 9, fill: colour }, g);
    if (!reducedMotion.matches) {
      for (let i = 0; i < 5; i++) svg('circle', { cx: x + (i - 2) * 14, cy: y - 11 - Math.sin(i) * 16, r: 5, fill: colour }, g);
    }
    effects.push({ el: g, life: .7 });
  }
  function land(drop) {
    const b = drop.target;
    if (b && b.painted < b.floors) {
      const floor = b.floors - b.painted - 1;
      const colour = palettes[paletteIndex][buildings.indexOf(b)];
      b.floorEls[floor].setAttribute('fill', colour);
      b.floorEls[floor].classList.add('painted');
      b.roof.setAttribute('fill', colour);
      b.painted++; totalPainted++;
      if (b.painted === b.floors) b.door.setAttribute('fill', colour);
      splash(drop.x, drop.landingY, colour);
      tone(true); announce('hit'); updateUI();
      if (totalPainted === totalFloors) { setPhase('complete'); announce('win'); }
    } else {
      const colour = drop.colour;
      splash(drop.x, drop.landingY, colour);
      if (!b) {
        const el = svg('ellipse', { cx: drop.x, cy: WORLD.groundY + 15, rx: 21, ry: 6, fill: colour }, $('streetDetails'));
        pageSplashes.push(el);
        if (pageSplashes.length > 20) pageSplashes.shift().remove();
      }
      announce(b ? 'already' : 'miss');
    }
  }
  function startCity() {
    totalPainted = 0;
    drops.forEach(d => d.el.remove()); drops = [];
    effects.forEach(e => e.el.remove()); effects = []; pageSplashes = [];
    buildCity(); airshipX = initialAirshipX;
    drawAirship(); setPhase('playing'); announce('initial');
  }
  function activate() {
    if ($('settings').open || document.hidden) return;
    if (phase === 'ready') { startCity(); return; }
    if (phase === 'complete') { paletteIndex = (paletteIndex + 1) % palettes.length; startCity(); return; }
    if (phase === 'paused') { setPhase('playing'); announce('initial'); return; }
    const target = targetAt(airshipX);
    const landingY = target ? roofY(target, airshipX) : WORLD.groundY + 15;
    const colour = target ? palettes[paletteIndex][buildings.indexOf(target)] : '#ffe18a';
    const el = svg('path', { d: 'M0-18C-5-9-14-1-14 7A14 14 0 0 0 14 7C14-1 5-9 0-18Z', fill: colour, stroke: INK, 'stroke-width': 2.5 }, $('drops'));
    el.setAttribute('transform', `translate(${airshipX} ${WORLD.outletY})`);
    drops.push({ x: airshipX, y: WORLD.outletY, target, landingY, colour, el });
    tone(); announce('falling');
  }
  function pause() {
    if (phase === 'playing') { setPhase('paused'); announce('paused'); }
  }
  function frame(time) {
    const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, .05);
    lastTime = time;
    if (phase === 'playing') {
      airshipX += Number($('speed').value) * dt;
      if (airshipX > WORLD.width + WORLD.halfShipWidth) airshipX = -WORLD.halfShipWidth;
      drawAirship();
      const active = drops; drops = [];
      active.forEach(drop => {
        if (phase !== 'playing') { drop.el.remove(); return; }
        drop.y += WORLD.fallSpeed * dt;
        if (drop.y >= drop.landingY) { drop.el.remove(); land(drop); }
        else { drop.el.setAttribute('transform', `translate(${drop.x} ${drop.y})`); drops.push(drop); }
      });
      if (phase === 'complete') { drops.forEach(drop => drop.el.remove()); drops = []; }
    }
    if (phase !== 'paused') effects = effects.filter(effect => {
      effect.life -= dt; effect.el.setAttribute('opacity', Math.max(0, effect.life / .7));
      if (effect.life <= 0) { effect.el.remove(); return false; } return true;
    });
    requestAnimationFrame(frame);
  }
  document.addEventListener('keydown', event => {
    if (!['Space', 'Enter', 'NumpadEnter'].includes(event.code)) return;
    const control = event.target.closest('button,a,input,select,textarea,[contenteditable="true"]');
    if ($('settings').open || (control && control !== $('mainAction'))) return;
    event.preventDefault();
    if (event.repeat || heldKeys.has(event.code)) return;
    heldKeys.add(event.code); activate();
  });
  document.addEventListener('keyup', event => heldKeys.delete(event.code));
  [$('playSurface'), $('mainAction')].forEach(el => {
    el.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      event.preventDefault(); activate(); $('mainAction').focus({ preventScroll: true });
    });
  });
  // Assistive software may dispatch a click without a preceding pointer event.
  $('mainAction').addEventListener('click', event => { if (event.detail === 0) activate(); });
  $('pause').addEventListener('click', () => {
    if (phase === 'playing') pause(); else if (phase === 'paused') activate();
    $('mainAction').focus({ preventScroll: true });
  });
  $('sound').addEventListener('click', () => {
    soundEnabled = !soundEnabled; updateUI(); tone();
    // Sound is inside the settings dialog; keep keyboard focus inside it.
  });
  $('settingsButton').addEventListener('click', () => { pause(); $('settings').showModal(); });
  $('closeSettings').addEventListener('click', () => { $('settings').close(); $('mainAction').focus({ preventScroll: true }); });
  $('settings').addEventListener('close', () => { $('mainAction').focus({ preventScroll: true }); });
  $('guide').addEventListener('change', drawAirship);
  $('assist').addEventListener('change', drawAirship);
  $('language').addEventListener('change', event => {
    lang = event.target.value;
    try { localStorage.setItem('siteLanguage', lang); } catch (_) { /* Storage is optional. */ }
    translate(); $('mainAction').focus({ preventScroll: true });
  });
  window.addEventListener('blur', () => { heldKeys.clear(); pause(); });
  document.addEventListener('visibilitychange', () => { heldKeys.clear(); lastTime = null; if (document.hidden) pause(); });
  buildCity(); translate(); drawAirship(); requestAnimationFrame(frame);
})();
