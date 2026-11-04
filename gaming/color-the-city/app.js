(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SVG = 'http://www.w3.org/2000/svg';
  const INK = '#45404f';
  const WORLD = { width: 1200, groundY: 650, airshipY: 112, outletY: 282, fallSpeed: 390, halfShipWidth: 235 };
  const text = {
    en: {
      games: 'Switch games', language: 'Language', title: 'A world of colour.',
      pause: 'Pause', resume: 'Continue', settings: 'Settings',
      soundLabel: 'Little sounds', soundOff: 'Off', soundOn: 'On',
      space: 'SPACE', orSwitch: 'switch · click · touch',
      settingsHint: 'Your drawing can wait.', speed: 'Zeppelin speed',
      slow: 'Gentle', normal: 'Easygoing', fast: 'Brisk',
      guide: 'Aiming guide', guideHint: 'A little line shows where the paint will fall.',
      assist: 'A helping hand', assistHint: 'Drops near the drawing gently find their way to it.',
      done: 'Done', start: 'Let’s paint', drop: 'Drop some colour', replay: 'Another drawing',
      readyTitle: 'A blank page. A little magic.', readyCopy: 'One press. A splash of colour. A little magic.',
      menuHint: 'Space or Enter · switch · click · touch. Escape returns to this menu.',
      pausedTitle: 'A little daydream.', pausedCopy: 'Press again when you’re ready.',
      completeTitle: 'Oh, what a lovely place.', completeCopy: 'All yours. Press again for a fresh drawing.',
      initial: 'Press to drop a little colour onto the drawing.', falling: 'Here comes a splash…',
      hit: 'A little more lovely.', miss: 'A splash on the page! The zeppelin will come around again.',
      already: 'This part of the drawing is already full of colour.', win: 'All {total} parts painted. Your drawing is complete!',
      paused: 'Paused. Press again to continue.', sceneTitle: 'Colouring board',
      sceneDescription: 'A giant rainbow zeppelin flies back and forth over a white drawing. Press to drop paint and colour one part.',
      paintedLabel: 'Painted parts', chooseScene: 'Choose your drawing', sceneCity: 'City', sceneForest: 'Forest', sceneVillage: 'Village', sceneFarm: 'Farm'
    },
    fr: {
      games: 'Jeux pour switch', language: 'Langue', title: 'Un monde de couleurs.',
      pause: 'Pause', resume: 'Continuer', settings: 'Réglages',
      soundLabel: 'Petits sons', soundOff: 'Désactivés', soundOn: 'Activés',
      space: 'ESPACE', orSwitch: 'switch · clic · toucher',
      settingsHint: 'Le dessin t’attend.', speed: 'Vitesse du zeppelin',
      slow: 'Douce', normal: 'Tranquille', fast: 'Rapide',
      guide: 'Guide de visée', guideHint: 'Une petite ligne montre où la peinture tombera.',
      assist: 'Coup de pouce', assistHint: 'Les gouttes proches du dessin le rejoignent.',
      done: 'Terminé', start: 'C’est parti !', drop: 'Une goutte de couleur', replay: 'Un autre dessin',
      readyTitle: 'Une page blanche. Un peu de magie.', readyCopy: 'Une pression. Une touche de couleur. Un peu de magie.',
      menuHint: 'Espace ou Entrée · switch · clic · toucher. Échap pour revenir au menu.',
      pausedTitle: 'Une petite rêverie.', pausedCopy: 'Appuie à nouveau quand tu veux.',
      completeTitle: 'Comme c’est joli !', completeCopy: 'C’est ta création. Appuie pour un nouveau dessin.',
      initial: 'Appuie pour laisser tomber de la couleur sur le dessin.', falling: 'Une touche de couleur arrive…',
      hit: 'Encore un peu plus joli.', miss: 'Une tache sur la page ! Le zeppelin va revenir.',
      already: 'Cette partie du dessin est déjà pleine de couleurs.', win: 'Les {total} parties sont coloriées. Ton dessin est terminé !',
      paused: 'En pause. Appuie pour continuer.', sceneTitle: 'Tableau de coloriage',
      sceneDescription: 'Un grand zeppelin arc-en-ciel fait des allers-retours au-dessus d’un dessin blanc. Appuie pour colorier une partie.',
      paintedLabel: 'Parties coloriées', chooseScene: 'Choisis ton dessin', sceneCity: 'Ville', sceneForest: 'Forêt', sceneVillage: 'Village', sceneFarm: 'Ferme'
    },
    ja: {
      games: 'スイッチゲーム', language: '言語', title: '世界を彩ろう。',
      pause: '一時停止', resume: '続ける', settings: '設定',
      soundLabel: '小さな音', soundOff: 'オフ', soundOn: 'オン',
      space: 'スペース', orSwitch: 'スイッチ・クリック・タッチ',
      settingsHint: '絵は待っているよ。', speed: '飛行船の速さ',
      slow: 'ゆっくり', normal: 'ふつう', fast: 'はやい',
      guide: 'ねらいのガイド', guideHint: '絵の具が落ちる場所を線で示します。',
      assist: 'おたすけ', assistHint: '近くに落ちた絵の具が絵に届きます。',
      done: '完了', start: 'はじめよう', drop: '色を落とす', replay: '新しい絵を描く',
      readyTitle: '白いページに、小さな魔法。', readyCopy: 'ひと押しで、色と小さな魔法。',
      menuHint: 'スペース・エンター・スイッチ・クリック・タッチ。Escでメニューに戻ります。',
      pausedTitle: 'ちょっとひとやすみ。', pausedCopy: '準備ができたら、もう一度押そう。',
      completeTitle: 'すてきな絵ができたね。', completeCopy: 'あなたの作品だよ。もう一度押すと新しい絵に。',
      initial: '押すと、絵に色がつくよ。', falling: '絵の具が落ちてくるよ…',
      hit: 'もっとすてきになったね。', miss: 'ページに色がついたね！飛行船はまた戻ってくるよ。',
      already: 'ここはもう色いっぱい。', win: '{total}か所すべて塗れたね。絵の完成！',
      paused: '一時停止中。もう一度押すと続けられます。', sceneTitle: 'お絵描きボード',
      sceneDescription: '大きな虹色の飛行船が白い絵の上を行ったり来たりします。押すとひとつずつ色がつきます。',
      paintedLabel: '塗った部分', chooseScene: '絵を選ぼう', sceneCity: '街', sceneForest: '森', sceneVillage: '村', sceneFarm: '農場'
    }
  };
  const palettes = [
    ['#ffb39e', '#ffe18a', '#bba9ee', '#95d4c3'],
    ['#b7d9ee', '#ffc6d8', '#c8dca2', '#f6c193']
  ];
  const cityBuildings = [
    { x: 56, width: 228, floorHeight: 64, roofKind: 'gable', roofHeight: 42 },
    { x: 342, width: 228, floorHeight: 80, roofKind: 'dome', roofHeight: 58 },
    { x: 628, width: 228, floorHeight: 86, roofKind: 'gable', roofHeight: 74 },
    { x: 914, width: 228, floorHeight: 72, roofKind: 'gable', roofHeight: 38 }
  ].map(b => ({ ...b, floors: 3, top: WORLD.groundY - 3 * b.floorHeight, painted: 0, floorEls: [], roof: null, door: null }));
  const sceneLabels = { city: 'sceneCity', forest: 'sceneForest', village: 'sceneVillage', farm: 'sceneFarm' };
  let selectedScene = 'city';
  try { const saved = localStorage.getItem('colourCityScene'); if (sceneLabels[saved]) selectedScene = saved; } catch (_) { /* Scene storage is optional. */ }
  let activeScene = selectedScene;
  let buildings = cityBuildings;
  let totalFloors = 12;
  const initialAirshipX = Math.max(WORLD.halfShipWidth + 4, buildings[0].x + buildings[0].width / 2);
  let lang = 'fr';
  try { const saved = localStorage.getItem('siteLanguage'); if (text[saved]) lang = saved; } catch (_) { /* Storage is optional. */ }
  let phase = 'ready';
  let menuOpen = true;
  let fullscreenPending = false;
  let fullscreenExitPending = false;
  let fullscreenAttempt = 0;
  let flightTime = 0;
  let bucketPulse = 0;
  let winWait = 0;
  let nextClipId = 0;
  let airshipX = initialAirshipX;
  let direction = 1;
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
    if (b.surfaceAt) return b.surfaceAt(x);
    const radius = b.width / 2 + 12;
    const position = Math.max(-1, Math.min(1, (x - b.x - b.width / 2) / radius));
    return b.top + 3 - b.roofHeight * (b.roofKind === 'dome' ? Math.sqrt(1 - position * position) : 1 - Math.abs(position));
  }
  function buildCity() {
    $('buildings').replaceChildren();
    $('streetDetails').replaceChildren();
    inkPath('M24 652Q191 648 320 651T650 650T960 652T1180 650', $('streetDetails'), { stroke: '#aaa2b4', 'stroke-width': 2 });
    buildings.forEach((b, i) => {
      const group = svg('g', { 'data-building': i }, $('buildings'));
      const paintLayer = svg('g', { class: 'house-paint' }, group);
      const g = svg('g', { class: 'house-outlines' }, group);
      b.painted = 0;
      b.floorEls = [];
      b.group = group;
      b.outlines = g;
      b.bounce = 0;
      for (let floor = 0; floor < b.floors; floor++) {
        const y = WORLD.groundY - (floor + 1) * b.floorHeight;
        b.floorEls.push(svg('rect', { x: b.x + 1, y: y + 1, width: b.width - 2, height: b.floorHeight, fill: '#fff', class: 'floor' }, paintLayer));
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
      b.roof = svg('path', { d: roofPath, fill: '#fff', class: 'roof-colour' }, paintLayer);
      inkPath(roofPath, g);
      const doorX = b.x + b.width - 79;
      const doorPath = `M${doorX} 650v-39a22 22 0 0 1 44 0v39Z`;
      b.door = svg('path', { d: doorPath, fill: '#fff', class: 'door' }, paintLayer);
      inkPath(doorPath, g);
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
    $('progress').max = totalFloors;
  }
  function buildScene() {
    if (activeScene === 'city') {
      buildings = cityBuildings;
      buildCity();
    } else {
      $('buildings').replaceChildren(); $('streetDetails').replaceChildren();
      inkPath('M24 652Q191 648 320 651T650 650T960 652T1180 650', $('streetDetails'), { stroke: '#aaa2b4', 'stroke-width': 2 });
      buildings = window.PaintSceneArt[activeScene].render({ parent: $('buildings'), svg, inkPath, groundY: WORLD.groundY, ink: INK });
    }
    $('buildings').dataset.scene = activeScene;
    totalFloors = buildings.reduce((total, b) => total + b.floors, 0);
    $('progress').max = totalFloors;
  }
  function currentPalette() {
    if (activeScene === 'city') return palettes[paletteIndex % palettes.length];
    const colours = window.PaintSceneArt[activeScene].palette;
    return colours.map((_, index) => colours[(index + paletteIndex) % colours.length]);
  }
  function updateSceneDescription() {
    $('scene-title').textContent = `${text[lang][sceneLabels[activeScene]]} · ${text[lang].sceneTitle}`;
    $('scene-description').textContent = text[lang].sceneDescription;
  }
  function announce(key) {
    feedbackKey = key;
    $('feedback').textContent = text[lang][key].replace('{total}', totalFloors);
  }
  function setPhase(next) { phase = next; $('playSurface').dataset.state = phase; updateUI(); }
  function updateUI() {
    const t = text[lang];
    $('actionLabel').textContent = t[selectedScene !== activeScene ? 'start' : phase === 'paused' ? 'resume' : phase === 'complete' ? 'replay' : 'start'];
    $('menu').hidden = !menuOpen;
    $('game').hidden = menuOpen;
    $('menu').inert = !menuOpen;
    document.body.classList.toggle('playing', !menuOpen);
    $('progress').value = totalPainted;
  }
  function translate() {
    document.documentElement.lang = lang;
    document.title = text[lang].title + ' · Adaptatech';
    $('language').value = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = text[lang][el.dataset.i18n]; });
    updateSceneDescription();
    $('playSurface').setAttribute('aria-label', text[lang].drop);
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
  function bob() { return reducedMotion.matches ? 0 : Math.sin(flightTime * 1.8) * 4; }
  function drawAirship() {
    $('airship').setAttribute('transform', `translate(${airshipX} ${WORLD.airshipY + bob()}) scale(${direction} 1)`);
    const target = targetAt(airshipX);
    const bottom = target ? roofY(target, airshipX) : WORLD.groundY;
    $('aimGuide').setAttribute('x1', airshipX); $('aimGuide').setAttribute('x2', airshipX);
    $('aimGuide').setAttribute('y1', WORLD.outletY + bob()); $('aimGuide').setAttribute('y2', bottom);
    $('aimMark').setAttribute('cx', airshipX); $('aimMark').setAttribute('cy', bottom);
    $('aimGuide').style.display = $('guide').checked ? '' : 'none';
    $('aimMark').style.display = $('guide').checked ? '' : 'none';
    const bucket = $('paintBucket');
    bucket.setAttribute('fill', target ? currentPalette()[buildings.indexOf(target)] : '#ffe18a');
    const pulse = reducedMotion.matches ? 0 : Math.sin((1 - bucketPulse / .28) * Math.PI) * Math.min(1, bucketPulse * 30);
    bucket.setAttribute('transform', `translate(0 140) scale(${1 + pulse * .22} ${1 - pulse * .16}) translate(0 -140)`);
  }
  function addEffect(duration, update, cleanup = () => {}) {
    const effect = { age: 0, duration, update, cleanup };
    effects.push(effect); update(0, 0);
  }
  function clearEffects() {
    effects.forEach(effect => effect.cleanup()); effects = [];
    $('effects').replaceChildren(); $('paintDefs').replaceChildren();
  }
  function animateColour(el, colour, x, y, duration = .9) {
    if (!el) return;
    // Reserve the final colour immediately; only its reveal is animated.
    if (el.getAttribute('fill') === colour) return;
    el.setAttribute('fill', colour);
    if (reducedMotion.matches) return;
    const id = `paint-reveal-${++nextClipId}`;
    const clip = svg('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, $('paintDefs'));
    const blobs = [-22, 0, 24].map((offset, index) => svg('ellipse', { cx: x + offset, cy: y + index * 8, rx: 0, ry: 0 }, clip));
    el.setAttribute('clip-path', `url(#${id})`);
    addEffect(duration, t => {
      blobs.forEach((blob, i) => {
        const progress = Math.max(0, Math.min(1, t * 1.22 - i * .09));
        const radius = progress * progress * (3 - 2 * progress) * 370;
        blob.setAttribute('rx', radius); blob.setAttribute('ry', radius * .72);
      });
    }, () => { el.removeAttribute('clip-path'); clip.remove(); });
  }
  function splash(x, y, colour, large = false) {
    const g = svg('g', {}, $('effects'));
    const shape = svg('path', { d: 'M-8-8C-32-30-46-15-29-3C-68 1-50 21-22 12C-15 39 5 31 9 15C32 34 50 12 28 3C60-11 36-29 16-10C18-38-4-37-8-8Z', fill: colour }, g);
    if (reducedMotion.matches) {
      addEffect(.32, () => shape.setAttribute('transform', `translate(${x} ${y}) scale(.8 .45)`), () => g.remove());
      return;
    }
    const ring = svg('ellipse', { cx: x, cy: y + 3, rx: 1, ry: 1, fill: 'none', stroke: colour, 'stroke-width': 4 }, g);
    const particles = Array.from({ length: large ? 14 : 10 }, (_, i) => {
      const angle = Math.PI + (i + .5) / (large ? 14 : 10) * Math.PI;
      const speed = 95 + (i % 4) * 34;
      return { el: svg('ellipse', { rx: 4 + i % 3, ry: 7 + i % 3, fill: colour }, g), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 30 };
    });
    addEffect(.9, (t, age) => {
      const pop = t < .2 ? .2 + t * 6.5 : 1.5 - (t - .2) * .35;
      shape.setAttribute('transform', `translate(${x} ${y}) scale(${pop} ${pop * .4})`);
      shape.setAttribute('opacity', Math.min(1, (1 - t) * 3));
      ring.setAttribute('rx', 12 + t * 85); ring.setAttribute('ry', 3 + t * 18); ring.setAttribute('opacity', (1 - t) * .65);
      particles.forEach(p => {
        p.el.setAttribute('transform', `translate(${x + p.vx * age} ${y + p.vy * age + 230 * age * age}) rotate(${p.vx * age})`);
        p.el.setAttribute('opacity', Math.min(1, (1 - t) * 2.3));
      });
    }, () => g.remove());
  }
  function paintRun(b, floor, x, colour) {
    if (reducedMotion.matches || b.surfaceAt) return;
    const y = b.origins?.[floor]?.y ?? WORLD.groundY - (floor + 1) * b.floorHeight + 6;
    const startY = roofY(b, x);
    // The coloured streak travels behind the line drawing and its windows.
    const streak = svg('path', { d: `M${x} ${startY}Q${x - 12} ${(startY + y) / 2} ${x} ${y}`, fill: 'none', stroke: colour, 'stroke-width': 13, 'stroke-linecap': 'round', opacity: .8 });
    b.group.insertBefore(streak, b.outlines);
    const length = streak.getTotalLength();
    streak.setAttribute('stroke-dasharray', length); streak.setAttribute('stroke-dashoffset', length);
    addEffect(.65, t => {
      streak.setAttribute('stroke-dashoffset', length * (1 - Math.min(1, t * 1.8)));
      streak.setAttribute('opacity', .8 * (1 - Math.max(0, t - .6) / .4));
    }, () => streak.remove());
  }
  function celebrateHouse(b, colour, finale = false) {
    if (reducedMotion.matches) return;
    const g = svg('g', {}, $('effects'));
    const cx = b.x + b.width / 2, cy = b.top - b.roofHeight - 14;
    const stars = Array.from({ length: finale ? 11 : 7 }, (_, i) => {
      const angle = Math.PI + (i + .5) / (finale ? 11 : 7) * Math.PI;
      return { el: svg('path', { d: 'M0-10 3-3 10 0 3 3 0 10-3 3-10 0-3-3Z', fill: i % 2 ? colour : '#ffe18a' }, g), vx: Math.cos(angle) * (75 + i % 3 * 26), vy: Math.sin(angle) * 105 - 20 };
    });
    addEffect(1.6, (t, age) => stars.forEach((star, i) => {
      const scale = Math.sin(Math.PI * t) * (i % 2 ? .8 : 1.2);
      star.el.setAttribute('transform', `translate(${cx + star.vx * age} ${cy + star.vy * age + 35 * age * age}) rotate(${age * 85}) scale(${scale})`);
      star.el.setAttribute('opacity', Math.min(1, (1 - t) * 3));
    }), () => g.remove());
  }
  function land(drop) {
    const b = drop.target;
    if (b && b.painted < b.floors) {
      const floor = b.floors - b.painted - 1;
      const colour = currentPalette()[buildings.indexOf(b)];
      const origin = b.origins?.[floor];
      const y = origin?.y ?? WORLD.groundY - (floor + 1) * b.floorHeight + 8;
      const originX = origin?.x ?? Math.max(b.x + 12, Math.min(b.x + b.width - 12, drop.x));
      animateColour(b.floorEls[floor], colour, originX, y);
      b.floorEls[floor].classList.add('painted');
      animateColour(b.roof, colour, drop.x, drop.landingY, .65);
      paintRun(b, floor, originX, colour);
      b.painted++; totalPainted++;
      b.bounce = reducedMotion.matches ? 0 : .45;
      if (b.painted === b.floors) {
        animateColour(b.door, colour, b.x + b.width - 57, WORLD.groundY - 40, .7);
        celebrateHouse(b, colour);
      }
      splash(drop.x, drop.landingY, colour, b.painted === b.floors);
      tone(true); announce('hit'); updateUI();
      if (totalPainted === totalFloors) {
        setPhase('complete'); announce('win'); winWait = reducedMotion.matches ? .35 : 1.6;
        buildings.forEach((house, i) => celebrateHouse(house, currentPalette()[i], true));
      }
    } else {
      splash(drop.x, drop.landingY, drop.colour);
      if (!b) {
        const el = svg('ellipse', { cx: drop.x, cy: WORLD.groundY + 15, rx: 28, ry: 8, fill: drop.colour }, $('streetDetails'));
        pageSplashes.push(el); if (pageSplashes.length > 20) pageSplashes.shift().remove();
      }
      announce(b ? 'already' : 'miss');
    }
  }
  function startScene() {
    totalPainted = 0; winWait = 0; flightTime = 0; bucketPulse = 0;
    drops.forEach(d => d.el.remove()); drops = []; clearEffects(); pageSplashes = [];
    buildScene(); airshipX = initialAirshipX; direction = 1;
    updateSceneDescription();
    drawAirship(); setPhase('playing'); announce('initial');
  }
  function requestGameFullscreen() {
    if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    const attempt = ++fullscreenAttempt;
    fullscreenPending = true;
    // Called directly in the user's Start/Continue gesture, before any await.
    try {
      Promise.resolve(document.documentElement.requestFullscreen()).then(() => {
        if (attempt !== fullscreenAttempt) {
          if (menuOpen && document.fullscreenElement) document.exitFullscreen().catch(() => {});
          return;
        }
        fullscreenPending = false;
        if (menuOpen) {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          return;
        }
        $('playSurface').focus({ preventScroll: true });
      }).catch(() => {
        if (attempt !== fullscreenAttempt) return;
        fullscreenPending = false;
        // Full-viewport play also works where native fullscreen is unavailable.
        if (!menuOpen) $('playSurface').focus({ preventScroll: true });
      });
    } catch (_) { fullscreenPending = false; }
  }
  function enterGame() {
    requestGameFullscreen();
    menuOpen = false; $('options').open = false;
    if (selectedScene !== activeScene || phase === 'ready' || phase === 'complete') {
      if (selectedScene !== activeScene) { activeScene = selectedScene; paletteIndex = 0; }
      else if (phase === 'complete') paletteIndex = (paletteIndex + 1) % (activeScene === 'city' ? palettes.length : window.PaintSceneArt[activeScene].palette.length);
      startScene();
    } else { setPhase('playing'); announce('initial'); }
    updateUI(); lastTime = null; $('playSurface').focus({ preventScroll: true });
  }
  function returnToMenu() {
    if (menuOpen) return;
    if (phase === 'playing') setPhase('paused');
    menuOpen = true; fullscreenAttempt++; fullscreenPending = false;
    updateUI(); $('mainAction').focus({ preventScroll: true });
    if (document.fullscreenElement) {
      fullscreenExitPending = true;
      document.exitFullscreen().catch(() => {}).finally(() => { fullscreenExitPending = false; });
    }
  }
  function activate() {
    if (document.hidden) return;
    if (menuOpen) { enterGame(); return; }
    if (phase === 'complete') {
      if (winWait > 0) return;
      paletteIndex = (paletteIndex + 1) % (activeScene === 'city' ? palettes.length : window.PaintSceneArt[activeScene].palette.length); startScene(); return;
    }
    if (phase !== 'playing') return;
    const target = targetAt(airshipX);
    const landingY = target ? roofY(target, airshipX) : WORLD.groundY + 15;
    const colour = target ? currentPalette()[buildings.indexOf(target)] : '#ffe18a';
    const g = svg('g', { class: 'paint-drop' }, $('drops'));
    const trails = reducedMotion.matches ? [] : [0, 1, 2].map(i => svg('circle', { r: 5 - i, fill: colour, opacity: .6 - i * .13 }, g));
    const shape = svg('path', { d: 'M0-20C-6-10-17 0-17 10A17 17 0 0 0 17 10C17 0 6-10 0-20Z', fill: colour, stroke: INK, 'stroke-width': 2.2 }, g);
    const shine = svg('path', { d: 'M-9 7q-2 8 5 11', fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .85 }, g);
    if (!reducedMotion.matches) {
      shape.setAttribute('transform', 'scale(.1)'); shine.setAttribute('transform', 'scale(.1)');
      trails.forEach(trail => trail.setAttribute('opacity', 0));
    }
    const outletY = WORLD.outletY + bob();
    g.setAttribute('transform', `translate(${airshipX} ${outletY})`);
    drops.push({ x: airshipX, y: outletY, originY: outletY, age: 0, velocity: 90, target, landingY, colour, el: g, shape, shine, trails });
    bucketPulse = .28; tone(); announce('falling');
  }
  function frame(time) {
    const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, .05);
    lastTime = time;
    if (!menuOpen && phase === 'playing') {
      flightTime += dt; bucketPulse = Math.max(0, bucketPulse - dt);
      airshipX += direction * Number($('speed').value) * dt;
      const rightEdge = WORLD.width + WORLD.halfShipWidth;
      const leftEdge = -WORLD.halfShipWidth;
      if (direction > 0 && airshipX > rightEdge) {
        airshipX = rightEdge - (airshipX - rightEdge); direction = -1;
      } else if (direction < 0 && airshipX < leftEdge) {
        airshipX = leftEdge + (leftEdge - airshipX); direction = 1;
      }
      drawAirship();
      const active = drops; drops = [];
      active.forEach(drop => {
        if (phase !== 'playing') { drop.el.remove(); return; }
        drop.age += dt; drop.velocity = Math.min(660, drop.velocity + 900 * dt); drop.y += drop.velocity * dt;
        const birth = Math.min(1, drop.age / .09);
        const stretch = 1 + Math.min(.5, drop.velocity / 1200);
        const bulbBottom = reducedMotion.matches ? 27 : 27 * birth * stretch;
        if (drop.y + bulbBottom >= drop.landingY) { drop.el.remove(); land(drop); }
        else {
          drop.el.setAttribute('transform', `translate(${drop.x} ${drop.y})`);
          if (!reducedMotion.matches) {
            drop.shape.setAttribute('transform', `scale(${birth * .94} ${birth * stretch})`);
            drop.shine.setAttribute('transform', `scale(${birth * .94} ${birth * stretch})`);
            drop.trails.forEach((trail, i) => {
              const distance = 27 + i * 16;
              trail.setAttribute('cy', -Math.min(drop.y - drop.originY, distance));
              trail.setAttribute('cx', Math.sin(drop.age * 9 + i) * 3);
              trail.setAttribute('opacity', drop.y - drop.originY > distance ? .6 - i * .13 : 0);
            });
          }
          drops.push(drop);
        }
      });
      if (phase === 'complete') { drops.forEach(drop => drop.el.remove()); drops = []; }
    }
    // Win reveals finish even after the last logical floor has been painted.
    if (!menuOpen && (phase === 'playing' || phase === 'complete')) {
      winWait = Math.max(0, winWait - dt);
      buildings.forEach(b => {
        b.bounce = Math.max(0, b.bounce - dt);
        const rise = b.bounce > 0 ? Math.sin((1 - b.bounce / .45) * Math.PI) * 5 : 0;
        b.group.setAttribute('transform', `translate(0 ${-rise})`);
      });
      effects = effects.filter(effect => {
        effect.age += dt; effect.update(Math.min(1, effect.age / effect.duration), effect.age);
        if (effect.age >= effect.duration) { effect.cleanup(); return false; } return true;
      });
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menuOpen) { event.preventDefault(); returnToMenu(); return; }
    if (!['Space', 'Enter', 'NumpadEnter'].includes(event.code)) return;
    const control = event.target.closest('button,a,input,select,textarea,summary,[contenteditable="true"]');
    if (menuOpen && control && control !== $('mainAction')) return;
    event.preventDefault();
    if (event.repeat || heldKeys.has(event.code)) return;
    heldKeys.add(event.code); activate();
  });
  document.addEventListener('keyup', event => heldKeys.delete(event.code));
  $('playSurface').addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault(); activate(); $('playSurface').focus({ preventScroll: true });
  });
  $('playSurface').addEventListener('click', event => { if (event.detail === 0) activate(); });
  $('mainAction').addEventListener('click', activate);
  $('sound').addEventListener('change', () => { soundEnabled = $('sound').checked; tone(); });
  $('guide').addEventListener('change', drawAirship);
  $('assist').addEventListener('change', drawAirship);
  $('language').addEventListener('change', event => {
    lang = event.target.value;
    try { localStorage.setItem('siteLanguage', lang); } catch (_) { /* Storage is optional. */ }
    translate(); $('mainAction').focus({ preventScroll: true });
  });
  document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement);
    if (!active && !menuOpen && !fullscreenExitPending) returnToMenu();
  });
  window.addEventListener('blur', () => {
    heldKeys.clear(); if (!fullscreenPending) returnToMenu();
  });
  document.addEventListener('visibilitychange', () => {
    heldKeys.clear(); lastTime = null; if (document.hidden) returnToMenu();
  });
  document.querySelectorAll('input[name="drawingScene"]').forEach(input => {
    input.checked = input.value === selectedScene;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      selectedScene = input.value;
      try { localStorage.setItem('colourCityScene', selectedScene); } catch (_) { /* Scene storage is optional. */ }
      updateUI();
    });
  });
  buildScene(); translate(); drawAirship(); requestAnimationFrame(frame);
})();
