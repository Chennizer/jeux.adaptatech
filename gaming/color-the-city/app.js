(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SVG = 'http://www.w3.org/2000/svg';
  const INK = '#45404f';
  const WORLD = { width: 1200, groundY: 650, airshipY: 96, outletY: 282, halfShipWidth: 235 };
  const PAINT = { release: .24, fallMin: 1.25, fallExtra: .75, fill: 4.2, glitterTail: .45, bucketPulse: .48 };
  const COLOUR_CYCLE_SECONDS = 12;
  const text = {
    en: {
      games: 'Switch games', language: 'Language', title: 'Colorful', scenes: 'Scenes',
      pause: 'Pause', resume: 'Continue', settings: 'Settings', close: 'Close', gameSettings: 'Game', audioSettings: 'Audio', autoModeShort: 'Automatic', manualModeShort: 'Manual',
      soundLabel: 'Paint sounds', musicLabel: 'Music', musicVolume: 'Music volume', effectsVolume: 'Sound volume', soundOff: 'Off', soundOn: 'On',
      space: 'SPACE', orSwitch: 'switch · click · touch',
      settingsHint: 'Your drawing can wait.', speed: 'Speed',
      slow: 'Gentle', normal: 'Easygoing', fast: 'Brisk',
      guide: 'Aiming guide', guideHint: 'A little line shows where the paint will fall.',
      assist: 'A helping hand', assistHint: 'Drops near the drawing gently find their way to it.',
      done: 'Done', start: 'Start', drop: 'Drop some colour', replay: 'Another drawing',
      readyTitle: 'A blank page. A little magic.', readyCopy: 'One press. A splash of colour. A little magic.',
      menuHint: 'Space or Enter · switch · click · touch. Escape returns to this menu.',
      pausedTitle: 'A little daydream.', pausedCopy: 'Press again when you’re ready.',
      completeTitle: 'Oh, what a lovely place.', completeCopy: 'All yours. Press again for a fresh drawing.',
      initial: 'Press to drop a little colour onto the drawing.', falling: 'Here comes a splash…',
      hit: 'A little more lovely.', miss: 'A splash on the page! The zeppelin will come around again.',
      already: 'This part of the drawing is already full of colour.', win: 'Your drawing is complete! A new picture will appear after the celebration.',
      paused: 'Paused. Press again to continue.', sceneTitle: 'Colouring board',
      sceneDescription: 'A giant rainbow zeppelin flies back and forth over a white drawing. Press to drop paint and add colour to an object.',
      paintedLabel: 'Successful paint hits', chooseScene: 'Choose your drawing', sceneCity: 'City', sceneForest: 'Forest', sceneVillage: 'Village', sceneFarm: 'Farm', scenePlanets: 'Planets', chooseMode: 'Choose your mode', autoMode: 'One switch', autoModeHelp: 'Colours change every 12 seconds. Space or Enter drops paint.', manualMode: 'Choose the colour', manualModeHelp: 'Space drops paint. Enter selects the next colour.', activeColour: 'Active colour', manualHint: 'Space / switch / tap: paint. Enter: next colour. Escape: menu.', difficulty: 'Difficulty', difficultyDetails: ['2 objects · 1 hit each', '3 objects · 1 hit each', '3 objects · 2 hits each', '4 objects · 2 hits each', '4 objects · 3 hits each']
    },
    fr: {
      games: 'Jeux pour switch', language: 'Langue', title: 'Coloré', scenes: 'Scènes',
      pause: 'Pause', resume: 'Continuer', settings: 'Réglages', close: 'Fermer', gameSettings: 'Jeu', audioSettings: 'Audio', autoModeShort: 'Auto', manualModeShort: 'Manuel',
      soundLabel: 'Sons de peinture', musicLabel: 'Musique', musicVolume: 'Volume de la musique', effectsVolume: 'Volume des sons', soundOff: 'Désactivés', soundOn: 'Activés',
      space: 'ESPACE', orSwitch: 'switch · clic · toucher',
      settingsHint: 'Le dessin t’attend.', speed: 'Vitesse',
      slow: 'Douce', normal: 'Tranquille', fast: 'Rapide',
      guide: 'Guide de visée', guideHint: 'Une petite ligne montre où la peinture tombera.',
      assist: 'Coup de pouce', assistHint: 'Les gouttes proches du dessin le rejoignent.',
      done: 'Terminé', start: 'Commencer', drop: 'Une goutte de couleur', replay: 'Un autre dessin',
      readyTitle: 'Une page blanche. Un peu de magie.', readyCopy: 'Une pression. Une touche de couleur. Un peu de magie.',
      menuHint: 'Espace ou Entrée · switch · clic · toucher. Échap pour revenir au menu.',
      pausedTitle: 'Une petite rêverie.', pausedCopy: 'Appuie à nouveau quand tu veux.',
      completeTitle: 'Comme c’est joli !', completeCopy: 'C’est ta création. Appuie pour un nouveau dessin.',
      initial: 'Appuie pour laisser tomber de la couleur sur le dessin.', falling: 'Une touche de couleur arrive…',
      hit: 'Encore un peu plus joli.', miss: 'Une tache sur la page ! Le zeppelin va revenir.',
      already: 'Cette partie du dessin est déjà pleine de couleurs.', win: 'Ton dessin est terminé ! Un nouveau dessin arrive après la célébration.',
      paused: 'En pause. Appuie pour continuer.', sceneTitle: 'Tableau de coloriage',
      sceneDescription: 'Un grand zeppelin arc-en-ciel fait des allers-retours au-dessus d’un dessin blanc. Appuie pour ajouter de la couleur à un objet.',
      paintedLabel: 'Touches de peinture réussies', chooseScene: 'Choisis ton dessin', sceneCity: 'Ville', sceneForest: 'Forêt', sceneVillage: 'Village', sceneFarm: 'Ferme', scenePlanets: 'Planètes', chooseMode: 'Choisis ton mode', autoMode: 'Une switch', autoModeHelp: 'Les couleurs changent toutes les 12 secondes. Espace ou Entrée pour peindre.', manualMode: 'Choisir la couleur', manualModeHelp: 'Espace pour peindre. Entrée pour changer de couleur.', activeColour: 'Couleur active', manualHint: 'Espace / switch / toucher : peindre. Entrée : couleur suivante. Échap : menu.', difficulty: 'Difficulté', difficultyDetails: ['2 objets · 1 touche chacun', '3 objets · 1 touche chacun', '3 objets · 2 touches chacun', '4 objets · 2 touches chacun', '4 objets · 3 touches chacun']
    },
    ja: {
      games: 'スイッチゲーム', language: '言語', title: 'カラフル', scenes: 'シーン',
      pause: '一時停止', resume: '続ける', settings: '設定', close: '閉じる', gameSettings: 'ゲーム', audioSettings: '音声', autoModeShort: '自動', manualModeShort: '手動',
      soundLabel: '絵の具の音', musicLabel: '音楽', musicVolume: '音楽の音量', effectsVolume: '効果音の音量', soundOff: 'オフ', soundOn: 'オン',
      space: 'スペース', orSwitch: 'スイッチ・クリック・タッチ',
      settingsHint: '絵は待っているよ。', speed: '速さ',
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
      already: 'ここはもう色いっぱい。', win: '絵の完成！お祝いのあとに、新しい絵が出てくるよ。',
      paused: '一時停止中。もう一度押すと続けられます。', sceneTitle: 'お絵描きボード',
      sceneDescription: '大きな虹色の飛行船が白い絵の上を行ったり来たりします。押すとひとつずつ色がつきます。',
      paintedLabel: '絵の具が当たった回数', chooseScene: '絵を選ぼう', sceneCity: '街', sceneForest: '森', sceneVillage: '村', sceneFarm: '農場', scenePlanets: '惑星', chooseMode: 'モードを選ぼう', autoMode: 'ひとつのスイッチ', autoModeHelp: '色は12秒ごとに変わります。スペースかエンターで絵の具を落とします。', manualMode: '色を選ぶ', manualModeHelp: 'スペースで絵の具を落とし、エンターで次の色を選びます。', activeColour: '選択中の色', manualHint: 'スペース・スイッチ・タッチ：絵の具。エンター：次の色。Esc：メニュー。', difficulty: '難しさ', difficultyDetails: ['2つの物・それぞれ1回', '3つの物・それぞれ1回', '3つの物・それぞれ2回', '4つの物・それぞれ2回', '4つの物・それぞれ3回']
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
  const sceneLabels = { city: 'sceneCity', forest: 'sceneForest', village: 'sceneVillage', farm: 'sceneFarm', planets: 'scenePlanets' };
  let selectedScene = 'city';
  try { const saved = localStorage.getItem('colourCityScene'); if (Object.hasOwn(sceneLabels, saved)) selectedScene = saved; } catch (_) { /* Scene storage is optional. */ }
  let activeScene = selectedScene;
  let selectedDifficulty = 5;
  try { const value = Number(localStorage.getItem('colorfulDifficulty')); if (Number.isInteger(value) && value >= 1 && value <= 5) selectedDifficulty = value; } catch (_) {}
  let activeDifficulty = selectedDifficulty;
  let activeTemplate = window.PaintTemplates.get(activeScene, 0);
  let completionAge = 0;
  let selectedColourMode = 'auto';
  try { const mode = localStorage.getItem('colourCityMode'); if (mode === 'manual') selectedColourMode = mode; } catch (_) {}
  let activeColourMode = selectedColourMode;
  let paintColourIndex = 0;
  let colourElapsed = 0;
  let buildings = cityBuildings;
  let requiredHits = 12;
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
  let feedbackKey = 'initial';
  let completedHits = 0;
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
  function modelRoofY(b, x) {
    if (b.surfaceAt) return b.surfaceAt(x);
    const radius = b.width / 2 + 12;
    const position = Math.max(-1, Math.min(1, (x - b.x - b.width / 2) / radius));
    return b.top + 3 - b.roofHeight * (b.roofKind === 'dome' ? Math.sqrt(1 - position * position) : 1 - Math.abs(position));
  }
  function roofY(b, x) {
    if (!b.layout) return modelRoofY(b, x);
    const { sx, sy, tx, ty } = b.layout;
    return modelRoofY(b, (x - tx) / sx) * sy + ty;
  }
  function modelPoint(b, x, y) {
    return b.layout ? { x: (x - b.layout.tx) / b.layout.sx, y: (y - b.layout.ty) / b.layout.sy } : { x, y };
  }
  function worldPoint(b, x, y) {
    return b.layout ? { x: x * b.layout.sx + b.layout.tx, y: y * b.layout.sy + b.layout.ty } : { x, y };
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
    $('progress').max = requiredHits;
  }
  function buildScene() {
    if (activeScene === 'city') {
      buildings = cityBuildings;
      buildCity();
    } else {
      $('buildings').replaceChildren(); $('streetDetails').replaceChildren();
      if (activeScene !== 'planets') inkPath('M24 652Q191 648 320 651T650 650T960 652T1180 650', $('streetDetails'), { stroke: '#aaa2b4', 'stroke-width': 2 });
      buildings = window.PaintSceneArt[activeScene].render({ parent: $('buildings'), svg, inkPath, groundY: WORLD.groundY, ink: INK });
    }
    const placed = window.PaintTemplates.place(buildings, {
      scene: activeScene, difficulty: activeDifficulty, template: activeTemplate,
      parent: $('buildings'), svg, surfaceY: modelRoofY
    });
    buildings = placed.targets;
    $('streetDetails').replaceChildren();
    if (activeScene !== 'planets') inkPath(`M24 ${placed.baseline + 2}Q300 ${placed.baseline - 2} 600 ${placed.baseline + 1}T1180 ${placed.baseline}`, $('streetDetails'), { stroke: '#aaa2b4', 'stroke-width': 2 });
    $('buildings').dataset.scene = activeScene;
    $('buildings').dataset.template = `${activeScene}-${String(activeTemplate.id + 1).padStart(2, '0')}`;
    $('buildings').dataset.difficulty = activeDifficulty;
    requiredHits = buildings.reduce((total, b) => total + b.requiredHits, 0);
    $('progress').max = requiredHits;
  }
  function currentPalette() {
    if (activeScene === 'city') return palettes[paletteIndex % palettes.length];
    const colours = window.PaintSceneArt[activeScene].palette;
    return colours.map((_, index) => colours[(index + paletteIndex) % colours.length]);
  }
  function activePaintColour() { return currentPalette()[paintColourIndex % currentPalette().length]; }
  function updateColourIndicator() {
    const colour = activePaintColour();
    ['paintBucket', 'paintGondola', 'activePaint'].forEach(id => $(id).setAttribute('fill', colour));
    $('airship').dataset.colour = colour;
    const label = `${text[lang].activeColour}: ${paintColourIndex + 1} / ${currentPalette().length}`;
    $('paint-colour-title').textContent = label;
    $('playSurface').setAttribute('aria-label', `${text[lang].drop}. ${label}`);
    updateMenuColour();
  }
  function updateMenuColour() {
    let palette, index = 0;
    if (selectedScene !== activeScene) {
      palette = selectedScene === 'city' ? palettes[0] : window.PaintSceneArt[selectedScene].palette;
    } else if (phase === 'complete') {
      const colours = activeScene === 'city' ? palettes : window.PaintSceneArt[activeScene].palette;
      const next = (paletteIndex + 1) % colours.length;
      palette = activeScene === 'city' ? palettes[next] : colours.map((_, i) => colours[(i + next) % colours.length]);
    } else {
      palette = currentPalette(); index = paintColourIndex % palette.length;
    }
    $('menuColourSwatch').style.backgroundColor = palette[index];
    $('menuColourName').textContent = `${index + 1} / ${palette.length}`;
  }
  function nextPaintColour() {
    paintColourIndex = (paintColourIndex + 1) % currentPalette().length;
    colourElapsed = 0;
    updateColourIndicator();
    $('feedback').textContent = `${text[lang].activeColour}: ${paintColourIndex + 1} / ${currentPalette().length}`;
  }
  function updateSceneDescription() {
    $('scene-title').textContent = `${text[lang][sceneLabels[activeScene]]} · ${text[lang].sceneTitle}`;
    $('scene-description').textContent = text[lang].sceneDescription;
  }
  function announce(key) {
    feedbackKey = key;
    $('feedback').textContent = text[lang][key].replace('{total}', requiredHits);
  }
  function setPhase(next) { phase = next; $('playSurface').dataset.state = phase; updateUI(); }
  function updateUI() {
    const t = text[lang];
    $('actionLabel').textContent = t[selectedScene !== activeScene || selectedDifficulty !== activeDifficulty ? 'start' : phase === 'paused' ? 'resume' : phase === 'complete' ? 'replay' : 'start'];
    $('menu').hidden = !menuOpen;
    $('game').hidden = menuOpen;
    $('menu').inert = !menuOpen;
    document.body.classList.toggle('playing', !menuOpen);
    $('progress').value = completedHits;
    document.querySelector('.menu-hint').textContent = text[lang][selectedColourMode === 'manual' ? 'manualHint' : 'menuHint'];
    updateMenuColour();
    $('difficulty').value = selectedDifficulty;
    const detail = text[lang].difficultyDetails[selectedDifficulty - 1];
    $('difficultyDescription').textContent = `${selectedDifficulty} — ${detail}`;
    $('difficultyValue').textContent = `${selectedDifficulty} / 5`;
    $('difficulty').setAttribute('aria-valuetext', detail);
  }
  function selectSettingsTab(selected, focus = false) {
    document.querySelectorAll('.settings-tabs [role="tab"]').forEach(tab => {
      const active = tab.id === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      $(tab.getAttribute('aria-controls')).hidden = !active;
      if (active && focus) tab.focus({ preventScroll: true });
    });
  }
  function translate() {
    document.documentElement.lang = lang;
    document.title = text[lang].title + ' · Adaptatech';
    $('language').value = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = text[lang][el.dataset.i18n]; });
    updateSceneDescription();
    updateColourIndicator();
    $('progress').setAttribute('aria-label', text[lang].paintedLabel);
    announce(feedbackKey); updateUI();
  }
  function configureAudio() {
    window.PaintAudio.configure({
      music: $('musicEnabled').checked, effects: $('sound').checked,
      musicVolume: Number($('musicVolume').value) / 100,
      effectsVolume: Number($('effectsVolume').value) / 100
    });
    try {
      localStorage.setItem('colourCityAudio', JSON.stringify({
        music: $('musicEnabled').checked, effects: $('sound').checked,
        musicVolume: Number($('musicVolume').value), effectsVolume: Number($('effectsVolume').value)
      }));
    } catch (_) { /* Audio preferences are optional. */ }
  }
  function targetAt(x) {
    const margin = $('assist').checked ? 14 : 0;
    return buildings.find(b => x >= b.hitX - margin && x <= b.hitX + b.hitWidth + margin);
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
    const pulse = reducedMotion.matches ? 0 : Math.sin((1 - bucketPulse / PAINT.bucketPulse) * Math.PI) * Math.min(1, bucketPulse * 30);
    bucket.setAttribute('transform', `translate(0 145) scale(${1 + pulse * .22} ${1 - pulse * .16}) translate(0 -145)`);
  }
  function addEffect(duration, update, cleanup = () => {}) {
    const effect = { age: 0, duration, update, cleanup };
    effects.push(effect); update(0, 0);
  }
  function clearEffects() {
    effects.forEach(effect => effect.cleanup()); effects = [];
    $('effects').replaceChildren(); $('paintDefs').replaceChildren();
  }
  function animateColour(el, colour, x, y, duration = PAINT.fill) {
    if (!el || el.getAttribute('fill') === colour) return;
    // Reserve the final colour immediately; the slow reveal is purely visual.
    el.setAttribute('fill', colour);
    if (reducedMotion.matches) return;
    const box = el.getBBox();
    const originX = Math.max(box.x, Math.min(box.x + box.width, x));
    const originY = Math.max(box.y, Math.min(box.y + box.height, y));
    const reach = Math.max(...[box.x, box.x + box.width].flatMap(px =>
      [box.y, box.y + box.height].map(py => Math.hypot(px - originX, (py - originY) / .72)))) + 36;
    const id = `paint-reveal-${++nextClipId}`;
    const revealClip = svg('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, $('paintDefs'));
    const blobs = [-22, 0, 24].map((offset, index) => svg('ellipse', { cx: originX + offset, cy: originY + index * 8, rx: 0, ry: 0 }, revealClip));
    el.setAttribute('clip-path', `url(#${id})`);

    // Both clips are needed: sparkle only on the actual, already-coloured shape.
    const shapeClip = svg('clipPath', { id: `${id}-shape`, clipPathUnits: 'userSpaceOnUse' }, $('paintDefs'));
    const silhouette = el.cloneNode(false);
    ['id', 'class', 'clip-path', 'stroke'].forEach(name => silhouette.removeAttribute(name));
    shapeClip.appendChild(silhouette);
    const shimmer = svg('g', { class: 'paint-shimmer', 'clip-path': `url(#${id}-shape)`, 'pointer-events': 'none' });
    const revealed = svg('g', { 'clip-path': `url(#${id})` }, shimmer);
    el.parentNode.insertBefore(shimmer, el.nextSibling);
    const sheen = svg('ellipse', { cx: 0, cy: 0, rx: Math.max(12, box.width * .13), ry: Math.max(25, box.height * 1.2), fill: '#fffdf5', opacity: 0 }, revealed);
    const points = [[.18,.24],[.68,.23],[.42,.64],[.83,.67],[.25,.79],[.58,.44]];
    const glints = points.map(([px, py], i) => ({
      el: svg('path', { d: 'M0-6Q1-1 6 0Q1 1 0 6Q-1 1-6 0Q-1-1 0-6Z', fill: i % 2 ? '#fffdf4' : '#fff2c5', stroke: '#d9b96e', 'stroke-width': .55, opacity: 0 }, revealed),
      x: box.x + box.width * px, y: box.y + box.height * py,
      delay: duration * (.12 + i * .125),
      life: Math.min(.85 + i % 2 * .2, duration * (1 - .12 - i * .125) + PAINT.glitterTail)
    }));
    addEffect(duration + PAINT.glitterTail, (_t, age) => {
      const t = Math.min(1, age / duration);
      blobs.forEach((blob, i) => {
        const progress = Math.max(0, Math.min(1, (t - i * .05) / (1 - i * .05)));
        const radius = progress * progress * (3 - 2 * progress) * reach;
        blob.setAttribute('rx', radius); blob.setAttribute('ry', radius * .72);
      });
      const sweep = Math.max(0, Math.min(1, (t - .12) / .88));
      sheen.setAttribute('transform', `translate(${box.x - box.width * .2 + sweep * box.width * 1.4} ${box.y + box.height / 2}) rotate(-18)`);
      sheen.setAttribute('opacity', Math.sin(Math.PI * sweep) * .14);
      glints.forEach((glint, i) => {
        const local = Math.max(0, Math.min(1, (age - glint.delay) / glint.life));
        const glow = Math.pow(Math.sin(Math.PI * local), 2);
        glint.el.setAttribute('transform', `translate(${glint.x} ${glint.y - local * 3}) rotate(${i % 2 ? 15 : -10}) scale(${.35 + glow * .65})`);
        glint.el.setAttribute('opacity', glow * .8);
      });
    }, () => {
      el.removeAttribute('clip-path'); revealClip.remove(); shapeClip.remove(); shimmer.remove();
    });
  }
  function splash(x, y, colour, large = false) {
    const g = svg('g', {}, $('effects'));
    const shape = svg('path', { d: 'M-8-8C-32-30-46-15-29-3C-68 1-50 21-22 12C-15 39 5 31 9 15C32 34 50 12 28 3C60-11 36-29 16-10C18-38-4-37-8-8Z', fill: colour }, g);
    if (reducedMotion.matches) {
      addEffect(.32, () => shape.setAttribute('transform', `translate(${x} ${y}) scale(.8 .45)`), () => g.remove());
      return;
    }
    const ring = svg('ellipse', { cx: x, cy: y + 3, rx: 1, ry: 1, fill: 'none', stroke: colour, 'stroke-width': 4 }, g);
    const particles = Array.from({ length: large ? 10 : 7 }, (_, i) => {
      const angle = Math.PI + (i + .5) / (large ? 10 : 7) * Math.PI;
      const speed = 60 + (i % 4) * 26;
      return { el: svg('ellipse', { rx: 4 + i % 3, ry: 7 + i % 3, fill: colour }, g), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 30 };
    });
    addEffect(1.15, (t, age) => {
      const pop = t < .2 ? .2 + t * 6.5 : 1.5 - (t - .2) * .35;
      shape.setAttribute('transform', `translate(${x} ${y}) scale(${pop} ${pop * .4})`);
      shape.setAttribute('opacity', Math.min(1, (1 - t) * 3));
      ring.setAttribute('rx', 12 + t * 85); ring.setAttribute('ry', 3 + t * 18); ring.setAttribute('opacity', (1 - t) * .65);
      particles.forEach(p => {
        p.el.setAttribute('transform', `translate(${x + p.vx * age} ${y + p.vy * age + 125 * age * age}) rotate(${p.vx * age})`);
        p.el.setAttribute('opacity', Math.min(1, (1 - t) * 2.3));
      });
    }, () => g.remove());
  }
  function paintRun(b, floor, x, colour) {
    if (reducedMotion.matches || b.surfaceAt) return;
    const y = b.origins?.[floor]?.y ?? WORLD.groundY - (floor + 1) * b.floorHeight + 6;
    const startY = modelRoofY(b, x);
    // The coloured streak travels behind the line drawing and its windows.
    const streak = svg('path', { d: `M${x} ${startY}Q${x - 12} ${(startY + y) / 2} ${x} ${y}`, fill: 'none', stroke: colour, 'stroke-width': 13, 'stroke-linecap': 'round', opacity: .8 });
    b.group.insertBefore(streak, b.outlines);
    const length = streak.getTotalLength();
    streak.setAttribute('stroke-dasharray', length); streak.setAttribute('stroke-dashoffset', length);
    addEffect(1.65, t => {
      streak.setAttribute('stroke-dashoffset', length * (1 - Math.min(1, t * 1.8)));
      streak.setAttribute('opacity', .8 * (1 - Math.max(0, t - .6) / .4));
    }, () => streak.remove());
  }
  function celebrateHouse(b, colour, finale = false) {
    if (reducedMotion.matches) return;
    const g = svg('g', {}, $('effects'));
    const point = worldPoint(b, b.x + b.width / 2, b.top - b.roofHeight - 14);
    const cx = point.x, cy = point.y;
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
  function completionTiming() {
    return reducedMotion.matches
      ? { delay: .35, fade: .4, hold: 4.5, out: .4 }
      : { delay: PAINT.fill + PAINT.glitterTail, fade: 1.8, hold: 4.5, out: .9 };
  }
  function setBackgroundOpacity(value) {
    $('completionSky').style.opacity = value;
    $('drawingPaper').setAttribute('opacity', 1 - value);
  }
  function finishDrawing() {
    setPhase('complete'); announce('win'); window.PaintAudio.effect('complete');
    completionAge = 0;
    const timing = completionTiming();
    winWait = timing.delay + timing.fade + 2;
    window.PaintBackgrounds.render({ scene: activeScene, variant: activeTemplate.id, parent: $('completionArt'), svg });
    setBackgroundOpacity(0);
    buildings.forEach(house => celebrateHouse(house, house.lastPaint || activePaintColour(), true));
  }
  function land(drop) {
    const b = drop.target;
    if (b && b.hits < b.requiredHits) {
      const colour = drop.colour;
      const contact = modelPoint(b, drop.x, drop.landingY);
      const nextPartCount = Math.ceil((b.hits + 1) * b.floorEls.length / b.requiredHits);
      for (let part = b.painted; part < nextPartCount; part++) {
        const floor = b.floorEls.length - part - 1;
        const origin = b.origins?.[floor];
        const y = origin?.y ?? WORLD.groundY - (floor + 1) * b.floorHeight + 8;
        const originX = origin?.x ?? Math.max(b.x + 12, Math.min(b.x + b.width - 12, contact.x));
        animateColour(b.floorEls[floor], colour, originX, y);
        b.floorEls[floor].classList.add('painted');
        paintRun(b, floor, originX, colour);
      }
      if (b.hits === 0) animateColour(b.roof, colour, contact.x, contact.y, PAINT.fill * .75);
      b.painted = nextPartCount; b.hits++; completedHits++; b.lastPaint = colour;
      b.group.dataset.hits = b.hits; b.group.dataset.parts = b.painted;
      b.placement.dataset.hits = b.hits;
      b.bounce = reducedMotion.matches ? 0 : .45;
      if (b.hits === b.requiredHits) {
        animateColour(b.door, colour, b.x + b.width - 57, WORLD.groundY - 40, PAINT.fill * .8);
        celebrateHouse(b, colour);
        b.placement.classList.add('object-complete');
      }
      splash(drop.x, drop.landingY, colour, b.hits === b.requiredHits);
      window.PaintAudio.effect('impact'); window.PaintAudio.effect('fill'); announce('hit'); updateUI();
      if (completedHits === requiredHits) finishDrawing();
    } else {
      splash(drop.x, drop.landingY, drop.colour);
      if (!b) {
        const el = svg('ellipse', { cx: drop.x, cy: WORLD.groundY + 15, rx: 28, ry: 8, fill: drop.colour }, $('streetDetails'));
        pageSplashes.push(el); if (pageSplashes.length > 20) pageSplashes.shift().remove();
      }
      window.PaintAudio.effect('impact'); announce(b ? 'already' : 'miss');
    }
  }
  function nextDrawing() {
    paletteIndex = (paletteIndex + 1) % (activeScene === 'city' ? palettes.length : window.PaintSceneArt[activeScene].palette.length);
    startScene();
  }
  function startScene() {
    window.PaintAudio.reset(activeScene);
    completedHits = 0; winWait = 0; completionAge = 0; flightTime = 0; bucketPulse = 0;
    drops.forEach(d => d.el.remove()); drops = []; clearEffects(); pageSplashes = [];
    setBackgroundOpacity(0); $('completionArt').replaceChildren();
    activeTemplate = window.PaintTemplates.next(activeScene);
    buildScene();
    airshipX = Math.max(WORLD.halfShipWidth + 4, buildings[0].hitX + buildings[0].hitWidth / 2); direction = 1;
    paintColourIndex = 0; colourElapsed = 0; activeColourMode = selectedColourMode;
    buildings.forEach(target => { target.lastPaint = null; });
    updateColourIndicator(); updateSceneDescription(); drawAirship(); setPhase('playing'); announce('initial');
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
    window.PaintAudio.start(selectedScene);
    requestGameFullscreen();
    if ($('options').open) $('options').close();
    menuOpen = false;
    if (selectedScene !== activeScene || selectedDifficulty !== activeDifficulty || phase === 'ready' || phase === 'complete') {
      if (selectedScene !== activeScene) { activeScene = selectedScene; paletteIndex = 0; }
      else if (phase === 'complete') paletteIndex = (paletteIndex + 1) % (activeScene === 'city' ? palettes.length : window.PaintSceneArt[activeScene].palette.length);
      activeDifficulty = selectedDifficulty;
      startScene();
    } else {
      if (activeColourMode !== selectedColourMode) { activeColourMode = selectedColourMode; colourElapsed = 0; }
      setPhase('playing'); announce('initial');
    }
    updateUI(); lastTime = null; $('playSurface').focus({ preventScroll: true });
  }
  function returnToMenu() {
    if (menuOpen) return;
    window.PaintAudio.pause();
    if (phase === 'playing') setPhase('paused');
    menuOpen = true; fullscreenAttempt++; fullscreenPending = false;
    updateUI(); $('mainAction').focus({ preventScroll: true });
    if (document.fullscreenElement) {
      fullscreenExitPending = true;
      document.exitFullscreen().catch(() => {}).finally(() => { fullscreenExitPending = false; });
    }
  }
  function activate() {
    if (document.hidden || $('options').open) return;
    if (menuOpen) { enterGame(); return; }
    if (phase === 'complete') {
      if (winWait > 0) return;
      nextDrawing(); return;
    }
    if (phase !== 'playing') return;
    const target = targetAt(airshipX);
    const landingY = target ? roofY(target, airshipX) : WORLD.groundY + 15;
    const colour = activePaintColour();
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
    drops.push({ x: airshipX, y: outletY, originY: outletY, age: 0, fallDuration: PAINT.fallMin + PAINT.fallExtra * Math.min(1, Math.max(0, landingY - outletY - 31) / 450), target, landingY, colour, el: g, shape, shine, trails });
    bucketPulse = PAINT.bucketPulse; window.PaintAudio.effect('release'); announce('falling');
  }
  function frame(time) {
    const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, .05);
    lastTime = time;
    if (!menuOpen && phase === 'playing') {
      flightTime += dt; bucketPulse = Math.max(0, bucketPulse - dt);
      if (activeColourMode === 'auto') {
        colourElapsed += dt;
        if (colourElapsed >= COLOUR_CYCLE_SECONDS) {
          const remainder = colourElapsed - COLOUR_CYCLE_SECONDS;
          nextPaintColour(); colourElapsed = remainder;
        }
      }
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
        drop.age += dt;
        const progress = Math.max(0, Math.min(1, (drop.age - PAINT.release) / drop.fallDuration));
        const birth = Math.min(1, drop.age / PAINT.release);
        const stretch = reducedMotion.matches ? 1 : 1 + progress * .14;
        const bulbBottom = 27 * stretch;
        const distance = Math.max(0, drop.landingY - bulbBottom - drop.originY);
        drop.y = drop.originY + distance * Math.pow(progress, 1.35);
        if (progress >= 1) { drop.el.remove(); land(drop); }
        else {
          drop.el.setAttribute('transform', `translate(${drop.x} ${drop.y})`);
          if (!reducedMotion.matches) {
            drop.shape.setAttribute('transform', `scale(${birth * .94} ${birth * stretch})`);
            drop.shine.setAttribute('transform', `scale(${birth * .94} ${birth * stretch})`);
            drop.trails.forEach((trail, i) => {
              const distance = 27 + i * 16;
              trail.setAttribute('cy', -Math.min(drop.y - drop.originY, distance));
              trail.setAttribute('cx', Math.sin(drop.age * 4 + i) * 1.5);
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
    if (!menuOpen && phase === 'complete') {
      completionAge += dt;
      const { delay, fade, hold, out } = completionTiming();
      let opacity = 0;
      if (completionAge >= delay + fade + hold) opacity = Math.max(0, 1 - (completionAge - delay - fade - hold) / out);
      else if (completionAge >= delay) opacity = Math.min(1, (completionAge - delay) / fade);
      setBackgroundOpacity(opacity * opacity * (3 - 2 * opacity));
      if (completionAge >= delay + fade + hold + out) nextDrawing();
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('keydown', event => {
    // Native dialog controls keep their keyboard behavior and cannot start play.
    if ($('options').open) return;
    if (event.key === 'Escape' && !menuOpen) { event.preventDefault(); returnToMenu(); return; }
    if (!['Space', 'Enter', 'NumpadEnter'].includes(event.code)) return;
    const control = event.target.closest('button,a,input,select,textarea,summary,[contenteditable="true"]');
    if (menuOpen && control && control !== $('mainAction')) return;
    event.preventDefault();
    if (event.repeat || heldKeys.has(event.code)) return;
    heldKeys.add(event.code);
    if (!menuOpen && activeColourMode === 'manual' && ['Enter', 'NumpadEnter'].includes(event.code)) {
      if (phase === 'playing') nextPaintColour();
      return;
    }
    activate();
  });
  document.addEventListener('keyup', event => heldKeys.delete(event.code));
  $('playSurface').addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault(); activate(); $('playSurface').focus({ preventScroll: true });
  });
  $('playSurface').addEventListener('click', event => { if (event.detail === 0) activate(); });
  $('mainAction').addEventListener('click', activate);
  $('settingsButton').addEventListener('click', () => {
    if (!menuOpen || $('options').open) return;
    heldKeys.clear();
    selectSettingsTab('gameTab');
    $('options').showModal();
    $('closeSettings').focus({ preventScroll: true });
  });
  $('closeSettings').addEventListener('click', () => $('options').close());
  $('options').addEventListener('close', () => {
    heldKeys.clear();
    if (menuOpen) $('settingsButton').focus({ preventScroll: true });
  });
  $('options').addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...$('options').querySelectorAll('button,input,select,[tabindex]')]
      .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus({ preventScroll: true });
    }
  });
  let backdropPress = false;
  function outsideSettings(event) {
    const box = $('options').getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  }
  $('options').addEventListener('pointerdown', event => {
    backdropPress = event.target === $('options') && outsideSettings(event);
  });
  $('options').addEventListener('click', event => {
    if (backdropPress && event.target === $('options') && outsideSettings(event)) $('options').close();
    backdropPress = false;
  });
  document.querySelectorAll('.settings-tabs [role="tab"]').forEach(tab => {
    tab.addEventListener('click', () => selectSettingsTab(tab.id));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 'gameTab' : event.key === 'End' ? 'audioTab' : tab.id === 'gameTab' ? 'audioTab' : 'gameTab';
      selectSettingsTab(next, true);
    });
  });
  try {
    const saved = JSON.parse(localStorage.getItem('colourCityAudio') || 'null');
    if (saved) {
      if (typeof saved.music === 'boolean') $('musicEnabled').checked = saved.music;
      if (typeof saved.effects === 'boolean') $('sound').checked = saved.effects;
      if (Number.isFinite(saved.musicVolume)) $('musicVolume').value = Math.max(0, Math.min(100, saved.musicVolume));
      if (Number.isFinite(saved.effectsVolume)) $('effectsVolume').value = Math.max(0, Math.min(100, saved.effectsVolume));
    }
  } catch (_) { /* Audio preferences are optional. */ }
  ['musicEnabled', 'sound', 'musicVolume', 'effectsVolume'].forEach(id => $(id).addEventListener('input', configureAudio));
  configureAudio();
  $('guide').addEventListener('change', drawAirship);
  $('assist').addEventListener('change', drawAirship);
  $('language').addEventListener('change', event => {
    lang = event.target.value;
    try { localStorage.setItem('siteLanguage', lang); } catch (_) { /* Storage is optional. */ }
    translate();
    if (!$('options').open) $('mainAction').focus({ preventScroll: true });
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
  document.querySelectorAll('input[name="colourMode"]').forEach(input => {
    input.checked = input.value === selectedColourMode;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      selectedColourMode = input.value;
      try { localStorage.setItem('colourCityMode', selectedColourMode); } catch (_) {}
      updateUI();
    });
  });
  $('difficulty').addEventListener('input', event => {
    selectedDifficulty = Number(event.target.value);
    try { localStorage.setItem('colorfulDifficulty', selectedDifficulty); } catch (_) {}
    updateUI();
  });
  buildScene(); translate(); updateColourIndicator(); drawAirship(); requestAnimationFrame(frame);
})();
