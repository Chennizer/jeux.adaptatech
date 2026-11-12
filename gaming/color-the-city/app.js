(() => {
  'use strict';
  const elements = new Map();
  const $ = id => {
    if (!elements.has(id)) elements.set(id, document.getElementById(id));
    return elements.get(id);
  };
  const SVG = 'http://www.w3.org/2000/svg';
  const INK = '#45404f';
  const WORLD = { width: 1200, groundY: 650, airshipY: 96, outletY: 282, halfShipWidth: 235 };
  const PAINT = { release: .24, fallMin: 1.25, fallExtra: .75, fill: 4.2, glitterTail: .45, bucketPulse: .48 };
  const COLOUR_CYCLE_SECONDS = 12;
  const GAZE_COLOURS = ['#000000', '#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#9B59B6', '#FF9F1C'];
  const FLIGHT = { speed: 1.3, turnOverhang: 60, turnEase: 100 };
  const text = {
    en: {
      games: 'Arcade games', language: 'Language', title: 'Recolor', scenes: 'Worlds', story: 'The colours have disappeared. Bring the worlds back to life.', worldRestored: 'Colours restored', worldMissing: 'Waiting for colour',
      pause: 'Pause', resume: 'Continue', settings: 'Settings', close: 'Close', gameSettings: 'Game', audioSettings: 'Audio', autoModeShort: 'Automatic', manualModeShort: 'Manual',
      soundLabel: 'Paint sounds', musicLabel: 'Music', musicVolume: 'Music volume', effectsVolume: 'Sound volume', soundOff: 'Off', soundOn: 'On',
      space: 'SPACE', orSwitch: 'switch · click · touch',
      colourPalette: 'Colour palette', paletteColourNames: ['Black', 'Red', 'Yellow', 'Green', 'Blue', 'Purple', 'Orange'], inputMode: 'Input type', switchInput: 'Switch', gazeInput: 'Eyegaze', gazeHint: 'Look at an object until the red overlay fills. The zeppelin will paint it and return.', gazeInitial: 'Look at an object to bring its colours back.', settingsHint: 'Your drawing can wait.', speed: 'Speed',
      slow: 'Gentle', normal: 'Easygoing', fast: 'Brisk',
      guide: 'Aiming guide', guideHint: 'A little line shows where the paint will fall.',
      assist: 'A helping hand', assistHint: 'Drops near the drawing gently find their way to it.',
      done: 'Done', start: 'Start', drop: 'Drop some colour', replay: 'Another picture',
      readyTitle: 'A blank page. A little magic.', readyCopy: 'One press. A splash of colour. A little magic.',
      menuHint: 'Space or Enter · switch · click · touch. Escape returns to this menu.',
      pausedTitle: 'A little daydream.', pausedCopy: 'Press again when you’re ready.',
      completeTitle: 'Oh, what a lovely place.', completeCopy: 'All yours. Press again for a fresh drawing.',
      initial: 'The colours have disappeared. Press to bring colour back to this world.', falling: 'Here comes a splash…',
      hit: 'Colour is returning to this world.', miss: 'A splash on the page! The zeppelin will come around again.',
      already: 'This part of the drawing is already full of colour.', win: 'This picture has its colours back! Another picture in this world comes next.',
      paused: 'Paused. Press again to continue.', sceneTitle: 'Colouring board',
      sceneDescription: 'A sad world has lost its colours. A rainbow zeppelin flies overhead. Press to return colour and life to the landscape.',
      paintedLabel: 'Successful paint hits', chooseScene: 'Choose a world', sceneCity: 'City', sceneForest: 'Forest', sceneVillage: 'Village', sceneFarm: 'Farm', scenePlanets: 'Planets', sceneKingdom: 'Pixel Kingdom', sceneSquadron: 'Star Squadron', sceneDungeon: 'Crystal Dungeon', chooseMode: 'Choose your mode', autoMode: 'One switch', autoModeHelp: 'Colours change every 12 seconds. Space or Enter drops paint.', manualMode: 'Choose the colour', manualModeHelp: 'Space drops paint. Enter selects the next colour.', activeColour: 'Active colour', manualHint: 'Space / switch / tap: paint. Enter: next colour. Escape: menu.', difficulty: 'Difficulty', difficultyDetails: ['2 objects · 1 hit each', '3 objects · 1 hit each', '3 objects · 2 hits each', '4 objects · 2 hits each', '4 objects · 3 hits each']
    },
    fr: {
      games: 'Jeux arcade', language: 'Langue', title: 'Recolor', scenes: 'Mondes', story: 'Les couleurs ont disparu. Redonne vie aux mondes.', worldRestored: 'Couleurs retrouvées', worldMissing: 'En attente de couleurs',
      pause: 'Pause', resume: 'Continuer', settings: 'Réglages', close: 'Fermer', gameSettings: 'Jeu', audioSettings: 'Audio', autoModeShort: 'Auto', manualModeShort: 'Manuel',
      soundLabel: 'Sons de peinture', musicLabel: 'Musique', musicVolume: 'Volume de la musique', effectsVolume: 'Volume des sons', soundOff: 'Désactivés', soundOn: 'Activés',
      space: 'ESPACE', orSwitch: 'switch · clic · toucher',
      colourPalette: 'Palette de couleurs', paletteColourNames: ['Noir', 'Rouge', 'Jaune', 'Vert', 'Bleu', 'Violet', 'Orange'], inputMode: 'Contrôle', switchInput: 'Switch', gazeInput: 'Regard', gazeHint: 'Regarde un objet jusqu’à ce que le rouge le remplisse. Le zeppelin ira le peindre et reviendra.', gazeInitial: 'Regarde un objet pour lui redonner ses couleurs.', settingsHint: 'Le dessin t’attend.', speed: 'Vitesse',
      slow: 'Douce', normal: 'Tranquille', fast: 'Rapide',
      guide: 'Guide de visée', guideHint: 'Une petite ligne montre où la peinture tombera.',
      assist: 'Coup de pouce', assistHint: 'Les gouttes proches du dessin le rejoignent.',
      done: 'Terminé', start: 'Commencer', drop: 'Une goutte de couleur', replay: 'Un autre paysage',
      readyTitle: 'Une page blanche. Un peu de magie.', readyCopy: 'Une pression. Une touche de couleur. Un peu de magie.',
      menuHint: 'Espace ou Entrée · switch · clic · toucher. Échap pour revenir au menu.',
      pausedTitle: 'Une petite rêverie.', pausedCopy: 'Appuie à nouveau quand tu veux.',
      completeTitle: 'Comme c’est joli !', completeCopy: 'C’est ta création. Appuie pour un nouveau dessin.',
      initial: 'Les couleurs ont disparu. Appuie pour redonner de la couleur à ce monde.', falling: 'Une touche de couleur arrive…',
      hit: 'Les couleurs reviennent dans ce monde.', miss: 'Une tache sur la page ! Le zeppelin va revenir.',
      already: 'Cette partie du dessin est déjà pleine de couleurs.', win: 'Ce paysage a retrouvé ses couleurs ! Un autre paysage de ce monde arrive ensuite.',
      paused: 'En pause. Appuie pour continuer.', sceneTitle: 'Tableau de coloriage',
      sceneDescription: 'Un monde triste a perdu ses couleurs. Un zeppelin arc-en-ciel le survole. Appuie pour rendre ses couleurs et sa joie au paysage.',
      paintedLabel: 'Touches de peinture réussies', chooseScene: 'Choisis un monde', sceneCity: 'Ville', sceneForest: 'Forêt', sceneVillage: 'Village', sceneFarm: 'Ferme', scenePlanets: 'Planètes', sceneKingdom: 'Royaume pixel', sceneSquadron: 'Escadron stellaire', sceneDungeon: 'Donjon de cristal', chooseMode: 'Choisis ton mode', autoMode: 'Une switch', autoModeHelp: 'Les couleurs changent toutes les 12 secondes. Espace ou Entrée pour peindre.', manualMode: 'Choisir la couleur', manualModeHelp: 'Espace pour peindre. Entrée pour changer de couleur.', activeColour: 'Couleur active', manualHint: 'Espace / switch / toucher : peindre. Entrée : couleur suivante. Échap : menu.', difficulty: 'Difficulté', difficultyDetails: ['2 objets · 1 touche chacun', '3 objets · 1 touche chacun', '3 objets · 2 touches chacun', '4 objets · 2 touches chacun', '4 objets · 3 touches chacun']
    },
    ja: {
      games: 'アーケードゲーム', language: '言語', title: 'リカラー', scenes: '世界', story: '色が消えてしまった世界に、彩りを取り戻そう。', worldRestored: '色を取り戻した世界', worldMissing: '色を待つ世界',
      pause: '一時停止', resume: '続ける', settings: '設定', close: '閉じる', gameSettings: 'ゲーム', audioSettings: '音声', autoModeShort: '自動', manualModeShort: '手動',
      soundLabel: '絵の具の音', musicLabel: '音楽', musicVolume: '音楽の音量', effectsVolume: '効果音の音量', soundOff: 'オフ', soundOn: 'オン',
      space: 'スペース', orSwitch: 'スイッチ・クリック・タッチ',
      colourPalette: 'カラーパレット', paletteColourNames: ['黒', '赤', '黄', '緑', '青', '紫', 'オレンジ'], inputMode: '入力方法', switchInput: 'スイッチ', gazeInput: '視線', gazeHint: '赤い色がいっぱいになるまで物を見つめると、飛行船が色を落として戻ります。', gazeInitial: '物を見つめて色を取り戻そう。', settingsHint: '絵は待っているよ。', speed: '速さ',
      slow: 'ゆっくり', normal: 'ふつう', fast: 'はやい',
      guide: 'ねらいのガイド', guideHint: '絵の具が落ちる場所を線で示します。',
      assist: 'おたすけ', assistHint: '近くに落ちた絵の具が絵に届きます。',
      done: '完了', start: 'はじめよう', drop: '色を落とす', replay: '次の景色',
      readyTitle: '白いページに、小さな魔法。', readyCopy: 'ひと押しで、色と小さな魔法。',
      menuHint: 'スペース・エンター・スイッチ・クリック・タッチ。Escでメニューに戻ります。',
      pausedTitle: 'ちょっとひとやすみ。', pausedCopy: '準備ができたら、もう一度押そう。',
      completeTitle: 'すてきな絵ができたね。', completeCopy: 'あなたの作品だよ。もう一度押すと新しい絵に。',
      initial: '色が消えた世界。押すと、少しずつ色が戻るよ。', falling: '絵の具が落ちてくるよ…',
      hit: '世界に色が戻ってきたね。', miss: 'ページに色がついたね！飛行船はまた戻ってくるよ。',
      already: 'ここはもう色いっぱい。', win: '景色に色が戻ったよ！次も同じ世界の新しい景色が出てくるよ。',
      paused: '一時停止中。もう一度押すと続けられます。', sceneTitle: 'お絵描きボード',
      sceneDescription: '色をなくして寂しくなった世界。虹色の飛行船から絵の具を落として、色と笑顔を取り戻そう。',
      paintedLabel: '絵の具が当たった回数', chooseScene: '世界を選ぼう', sceneCity: '街', sceneForest: '森', sceneVillage: '村', sceneFarm: '農場', scenePlanets: '惑星', sceneKingdom: 'ピクセル王国', sceneSquadron: 'スター飛行隊', sceneDungeon: 'クリスタル洞窟', chooseMode: 'モードを選ぼう', autoMode: 'ひとつのスイッチ', autoModeHelp: '色は12秒ごとに変わります。スペースかエンターで絵の具を落とします。', manualMode: '色を選ぶ', manualModeHelp: 'スペースで絵の具を落とし、エンターで次の色を選びます。', activeColour: '選択中の色', manualHint: 'スペース・スイッチ・タッチ：絵の具。エンター：次の色。Esc：メニュー。', difficulty: '難しさ', difficultyDetails: ['2つの物・それぞれ1回', '3つの物・それぞれ1回', '3つの物・それぞれ2回', '4つの物・それぞれ2回', '4つの物・それぞれ3回']
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
  const sceneLabels = { city: 'sceneCity', forest: 'sceneForest', village: 'sceneVillage', farm: 'sceneFarm', planets: 'scenePlanets', kingdom: 'sceneKingdom', squadron: 'sceneSquadron', dungeon: 'sceneDungeon' };
  const sceneKeys = Object.keys(sceneLabels);
  const restoredWorlds = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem('recolorRestoredWorlds') || '[]');
    if (Array.isArray(saved)) saved.filter(scene => sceneKeys.includes(scene)).forEach(scene => restoredWorlds.add(scene));
  } catch (_) { /* The journey also works without storage. */ }
  let selectedScene = 'city';
  try { const saved = localStorage.getItem('colourCityScene'); if (Object.hasOwn(sceneLabels, saved)) selectedScene = saved; } catch (_) { /* Scene storage is optional. */ }
  let activeScene = selectedScene;
  let selectedDifficulty = 5;
  try { const value = Number(localStorage.getItem('colorfulDifficulty')); if (Number.isInteger(value) && value >= 1 && value <= 5) selectedDifficulty = value; } catch (_) {}
  let activeDifficulty = selectedDifficulty;
  let activeTemplate = window.PaintTemplates.get(activeScene, 0);
  let completionAge = 0;
  let completionChimed = false;
  let selectedColourMode = 'auto';
  try { const mode = localStorage.getItem('colourCityMode'); if (mode === 'manual') selectedColourMode = mode; } catch (_) {}
  let activeColourMode = selectedColourMode;
  let selectedInputMode = 'switch';
  try { if (localStorage.getItem('recolorInputMode') === 'eyegaze') selectedInputMode = 'eyegaze'; } catch (_) {}
  let activeInputMode = selectedInputMode;
  let selectedPaletteEnabled = true, savedPaletteIndex = 1;
  try {
    const palettePreference = localStorage.getItem('recolorPaletteEnabled');
    if (palettePreference !== null) selectedPaletteEnabled = palettePreference === 'true';
    const stored = Number(localStorage.getItem('recolorPaletteColour'));
    if (localStorage.getItem('recolorPaletteColour') !== null && Number.isInteger(stored) && stored >= 0 && stored < GAZE_COLOURS.length) savedPaletteIndex = stored;
  } catch (_) {}
  let activePaletteEnabled = selectedPaletteEnabled;
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
  let guideVisible = null, bucketWasPulsing = false;
  let paintBounds = new WeakMap();
  let lastTime = null;
  let feedbackKey = 'initial';
  let completedHits = 0;
  let drops = [];
  let effects = [];
  let pageSplashes = [];
  let paletteIndex = 0;
  const heldKeys = new Set();
  let gazePoint = null;
  function updateGazePointer() {
    const visible = !menuOpen && activeInputMode === 'eyegaze' && gazePoint !== null && !document.hidden;
    const pointer = $('gazePointer');
    pointer.hidden = !visible; pointer.style.opacity = visible ? '1' : '0';
    if (visible) pointer.style.transform = `translate3d(${gazePoint.x}px, ${gazePoint.y}px, 0) translate(-50%, -50%)`;
  }
  function clearGazePointer() {
    gazePoint = null; updateGazePointer();
    window.PaintGaze.suspend(); window.PaintColourPalette.suspend();
  }
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
      b.accents = [];
      const detail = (d, colour, x, y, attrs = {}) => {
        const el = svg('path', { d, fill: '#fff', class: 'accent-colour' }, paintLayer);
        b.accents.push({ el, colour, x, y });
        inkPath(d, g, { 'stroke-width': 2.2, ...attrs });
      };
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
        // A broad shop canopy with four clear scallops, filled with its picture.
        detail(`M${b.x + 15} 571h198l-9 25q-22 19-45 0q-24 19-47 0q-23 19-47 0q-22 19-43 0Z`,
          '#efb1a4', b.x + 114, 582);
        inkPath(`M${b.x + 20} 578h188M${b.x + 66} 579v17m47-17v17m47-17v17`, g, { 'stroke-width': 2 });
      }
      if (i === 1) {
        const cx = b.x + b.width / 2, peak = base - b.roofHeight;
        inkPath(`M${cx} ${peak}v-28`, g, { 'stroke-width': 2.5 });
        detail(`M${cx} ${peak - 28}q-25-21-34-5q9 21 34 5m0 0q14-26 31-16q-1 22-31 16Z`, '#a6cda4', cx, peak - 38);
        inkPath(`M${b.x + 31} 548h164v18q-82 9-164 0Zm10 0v-13m30 13v-13m31 13v-13m31 13v-13m31 13v-13m30 13v-13`, g, { 'stroke-width': 2 });
      }
      if (i === 2) {
        const cx = b.x + b.width / 2, sy = base - b.roofHeight - 28;
        inkPath(`M${cx} ${sy + 18}v10`, g, { 'stroke-width': 2.5 });
        detail(`M${cx} ${sy - 17}l5 11 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1Z`, '#ffe29b', cx, sy);
        inkPath(`M${b.x + 27} 569q87-14 174 0M${b.x + 27} 574q87-14 174 0`, g, { 'stroke-width': 2 });
      }
      if (i === 3) {
        b.chimney = { x: b.x + 175, y: b.top - 55 };
        detail(`M${b.x + 162} ${b.top - 8}v-42h27v43Z`, '#d6a995', b.x + 175, b.top - 30);
        detail(`M${b.x + 156} ${b.top - 57}h39v10h-39Z`, '#e7bdac', b.x + 175, b.top - 52);
        inkPath(`M${b.x + 164} ${b.top - 30}h22m-11-17v17m-11 13h22`, g, { 'stroke-width': 1.8 });
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
      if (activeScene !== 'planets' && activeScene !== 'squadron') inkPath('M24 652Q191 648 320 651T650 650T960 652T1180 650', $('streetDetails'), { stroke: '#aaa2b4', 'stroke-width': 2 });
      buildings = window.PaintSceneArt[activeScene].render({ parent: $('buildings'), svg, inkPath, groundY: WORLD.groundY, ink: INK });
    }
    const placed = window.PaintTemplates.place(buildings, {
      scene: activeScene, difficulty: activeDifficulty, template: activeTemplate,
      parent: $('buildings'), svg, surfaceY: modelRoofY
    });
    buildings = placed.targets;
    $('streetDetails').replaceChildren();
    if (activeScene !== 'planets' && activeScene !== 'squadron') inkPath(`M24 ${placed.baseline + 2}Q300 ${placed.baseline - 2} 600 ${placed.baseline + 1}T1180 ${placed.baseline}`, $('streetDetails'), { stroke: '#aaa2b4', 'stroke-width': 2 });
    $('buildings').dataset.scene = activeScene;
    $('buildings').dataset.template = `${activeScene}-${String(activeTemplate.id + 1).padStart(2, '0')}`;
    $('buildings').dataset.difficulty = activeDifficulty;
    requiredHits = buildings.reduce((total, b) => total + b.requiredHits, 0);
    $('progress').max = requiredHits;
    // Warm this cache after the board is visible. Hidden SVGs report empty
    // bounds in Chromium, which would hide the paint until its clip is removed.
    paintBounds = new WeakMap();
    window.PaintAtmosphere.reset({ scene: activeScene, variant: activeTemplate.id, parent: $('worldAtmosphere'), svg, reducedMotion: reducedMotion.matches });
    window.PaintRestoration.reset({ scene: activeScene, variant: activeTemplate.id, parent: $('worldLife'), svg, reducedMotion: reducedMotion.matches });
    $('game').dataset.worldProgress = '0';
  }
  function measurePaintBounds() {
    buildings.forEach(target => {
      [ ...target.floorEls, target.roof, target.door, ...(target.accents || []).map(a => a.el) ]
        .filter(Boolean).forEach(region => paintBounds.set(region, region.getBBox()));
    });
  }
  function usesGazePalette() { return activeInputMode === 'eyegaze' && activePaletteEnabled; }
  function colourMode() { return activeInputMode === 'eyegaze' ? (usesGazePalette() ? 'palette' : 'auto') : selectedColourMode; }
  function currentPalette() {
    if (usesGazePalette()) return GAZE_COLOURS;
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
    $('playSurface').setAttribute('aria-label', `${text[lang][activeInputMode === 'eyegaze' ? 'gazeHint' : 'drop']}. ${label}`);
    window.PaintColourPalette.select(paintColourIndex);
    updateMenuColour();
  }
  function updateMenuColour() {
    let palette, index = 0;
    if (usesGazePalette()) {
      palette = GAZE_COLOURS; index = paintColourIndex;
    } else if (selectedScene !== activeScene) {
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
    $('scene-description').textContent = text[lang][activeInputMode === 'eyegaze' ? 'gazeHint' : 'sceneDescription'];
  }
  function announce(key) {
    feedbackKey = key;
    $('feedback').textContent = text[lang][activeInputMode === 'eyegaze' && key === 'initial' ? 'gazeInitial' : key].replace('{total}', requiredHits);
  }
  function setPhase(next) { phase = next; $('playSurface').dataset.state = phase; updateUI(); }
  function updateUI() {
    const t = text[lang];
    $('paletteSetting').hidden = selectedInputMode !== 'eyegaze';
    const showPalette = !menuOpen && usesGazePalette();
    window.PaintColourPalette.show(showPalette);
    $('game').classList.toggle('has-colour-palette', showPalette);
    document.querySelector('.colour-mode-choices').hidden = selectedInputMode === 'eyegaze';
    $('game').dataset.inputMode = activeInputMode;
    updateGazePointer();
    $('actionLabel').textContent = t[selectedScene !== activeScene || selectedDifficulty !== activeDifficulty ? 'start' : phase === 'paused' ? 'resume' : phase === 'complete' ? 'replay' : 'start'];
    $('menu').hidden = !menuOpen;
    $('game').hidden = menuOpen;
    $('menu').inert = !menuOpen;
    document.body.classList.toggle('playing', !menuOpen);
    $('progress').value = completedHits;
    document.querySelector('.menu-hint').textContent = selectedInputMode === 'eyegaze' ? t.gazeHint : text[lang][selectedColourMode === 'manual' ? 'manualHint' : 'menuHint'];
    updateMenuColour();
    $('difficulty').value = selectedDifficulty;
    const detail = text[lang].difficultyDetails[selectedDifficulty - 1];
    $('difficultyDescription').textContent = `${selectedDifficulty} — ${detail}`;
    $('difficultyValue').textContent = `${selectedDifficulty} / 5`;
    $('difficulty').setAttribute('aria-valuetext', detail);
    document.querySelectorAll('input[name="drawingScene"]').forEach(input => {
      input.closest('.scene-choice').dataset.restored = String(restoredWorlds.has(input.value));
      input.setAttribute('aria-description', t[restoredWorlds.has(input.value) ? 'worldRestored' : 'worldMissing']);
    });
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
    window.PaintColourPalette.labels(text[lang].colourPalette, text[lang].paletteColourNames);
    const next = { en: 'ja', ja: 'fr', fr: 'en' }[lang];
    const label = { en: 'EN', ja: '日本語', fr: 'FR' }[next];
    $('language-toggle').textContent = label;
    $('language-toggle').classList.toggle('lang-ja-label', next === 'ja');
    $('language-toggle').setAttribute('aria-label', `${text[lang].language}: ${label}`);
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
  function flightSpeed() { return Number($('speed').value) * FLIGHT.speed; }
  function advanceFlight(dt) {
    const left = -FLIGHT.turnOverhang, right = WORLD.width + FLIGHT.turnOverhang;
    const distance = Math.min(right - airshipX, airshipX - left);
    const t = Math.max(0, Math.min(1, distance / FLIGHT.turnEase));
    const ease = .35 + .65 * t * t * (3 - 2 * t);
    airshipX += direction * flightSpeed() * ease * dt;
    if (direction > 0 && airshipX >= right) {
      airshipX = right - (airshipX - right); direction = -1;
    } else if (direction < 0 && airshipX <= left) {
      airshipX = left + (left - airshipX); direction = 1;
    }
  }
  function drawAirship() {
    const rise = bob(), showGuide = $('guide').checked;
    $('airship').setAttribute('transform', `translate(${airshipX} ${WORLD.airshipY + rise}) scale(${direction} 1)`);
    if (guideVisible !== showGuide) {
      guideVisible = showGuide;
      $('aimGuide').style.display = showGuide ? '' : 'none';
      $('aimMark').style.display = showGuide ? '' : 'none';
    }
    if (showGuide) {
      const target = targetAt(airshipX);
      const bottom = target ? roofY(target, airshipX) : WORLD.groundY;
      $('aimGuide').setAttribute('x1', airshipX); $('aimGuide').setAttribute('x2', airshipX);
      $('aimGuide').setAttribute('y1', WORLD.outletY + rise); $('aimGuide').setAttribute('y2', bottom);
      $('aimMark').setAttribute('cx', airshipX); $('aimMark').setAttribute('cy', bottom);
    }
    const bucket = $('paintBucket');
    const pulse = reducedMotion.matches ? 0 : Math.sin((1 - bucketPulse / PAINT.bucketPulse) * Math.PI) * Math.min(1, bucketPulse * 30);
    if (bucketPulse > 0 || bucketWasPulsing) {
      bucket.setAttribute('transform', `translate(0 145) scale(${1 + pulse * .22} ${1 - pulse * .16}) translate(0 -145)`);
      bucketWasPulsing = bucketPulse > 0;
    }
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
    let box = paintBounds.get(el);
    if (!box || box.width <= 0 || box.height <= 0) {
      box = el.getBBox(); paintBounds.set(el, box);
    }
    const originX = Math.max(box.x, Math.min(box.x + box.width, x));
    const originY = Math.max(box.y, Math.min(box.y + box.height, y));
    const reach = Math.max(...[box.x, box.x + box.width].flatMap(px =>
      [box.y, box.y + box.height].map(py => Math.hypot(px - originX, (py - originY) / .72)))) + 36;
    const id = `paint-reveal-${++nextClipId}`;
    const revealClip = svg('clipPath', { id, clipPathUnits: 'userSpaceOnUse', transform: `translate(${originX} ${originY}) scale(0)` }, $('paintDefs'));
    // Basic shapes are direct clipPath children for consistent SVG clipping.
    [-.08, 0, .09].forEach((offset, index) => svg('ellipse', { cx: offset, cy: index === 1 ? 0 : index * .025, rx: 1, ry: .72 }, revealClip));
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
    const points = [[.18,.24],[.68,.23],[.42,.64],[.83,.67]];
    const glints = points.map(([px, py], i) => ({
      el: svg('path', { d: 'M0-6Q1-1 6 0Q1 1 0 6Q-1 1-6 0Q-1-1 0-6Z', fill: i % 2 ? '#fffdf4' : '#fff2c5', stroke: '#d9b96e', 'stroke-width': .55, opacity: 0 }, revealed),
      x: box.x + box.width * px, y: box.y + box.height * py,
      delay: duration * (.18 + i * .18), life: .85 + i % 2 * .2, visible: false
    }));
    let spreadDone = false, sheenVisible = false;
    addEffect(duration + PAINT.glitterTail, (_t, age) => {
      const t = Math.min(1, age / duration);
      if (!spreadDone) {
        const radius = t * t * (3 - 2 * t) * reach;
        revealClip.setAttribute('transform', `translate(${originX} ${originY}) scale(${radius})`);
        spreadDone = t === 1;
      }
      const sweep = Math.max(0, Math.min(1, (t - .12) / .88));
      const showSheen = sweep > 0 && sweep < 1;
      if (showSheen) {
        sheen.setAttribute('transform', `translate(${box.x - box.width * .2 + sweep * box.width * 1.4} ${box.y + box.height / 2}) rotate(-18)`);
        sheen.setAttribute('opacity', Math.sin(Math.PI * sweep) * .14);
      } else if (sheenVisible) sheen.setAttribute('opacity', 0);
      sheenVisible = showSheen;
      glints.forEach((glint, i) => {
        const local = Math.max(0, Math.min(1, (age - glint.delay) / glint.life));
        const visible = local > 0 && local < 1;
        if (!visible) {
          if (glint.visible) glint.el.setAttribute('opacity', 0);
          glint.visible = false; return;
        }
        const glow = Math.pow(Math.sin(Math.PI * local), 2);
        glint.el.setAttribute('transform', `translate(${glint.x} ${glint.y - local * 3}) rotate(${i % 2 ? 15 : -10}) scale(${.35 + glow * .65})`);
        glint.el.setAttribute('opacity', glow * .8);
        glint.visible = true;
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
      ? { delay: .35, fade: .4, hold: 6.5, out: .4 }
      : { delay: PAINT.fill + PAINT.glitterTail, fade: 1.8, hold: 6.5, out: .9 };
  }
  function setBackgroundOpacity(value) {
    $('completionSky').style.opacity = value;
    $('drawingPaper').setAttribute('opacity', 1 - value);
    window.PaintAtmosphere.setCelebration(value);
  }
  function finishDrawing() {
    window.PaintGaze.finish();
    restoredWorlds.add(activeScene);
    try { localStorage.setItem('recolorRestoredWorlds', JSON.stringify([...restoredWorlds])); } catch (_) {}
    setPhase('complete'); announce('win');
    completionAge = 0; completionChimed = false;
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
      const worldProgress = completedHits / requiredHits;
      $('game').dataset.worldProgress = worldProgress;
      window.PaintAtmosphere.setProgress(worldProgress);
      b.bounce = reducedMotion.matches ? 0 : .45;
      if (b.hits === b.requiredHits) {
        animateColour(b.door, colour, b.x + b.width - 57, WORLD.groundY - 40, PAINT.fill * .8);
        b.accents?.forEach(accent => animateColour(accent.el, accent.colour, accent.x, accent.y));
        celebrateHouse(b, colour);
        b.placement.classList.add('object-complete');
        window.PaintRestoration.restore({ target: b, colour, worldPoint });
      }
      splash(drop.x, drop.landingY, colour, b.hits === b.requiredHits);
      window.PaintAudio.effect('impact'); window.PaintAudio.effect('fill'); announce('hit');
      $('progress').value = completedHits;
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
    window.PaintGaze.clear();
    window.PaintAudio.reset(activeScene);
    completedHits = 0; winWait = 0; completionAge = 0; completionChimed = false; flightTime = 0; bucketPulse = 0;
    drops.forEach(d => d.el.remove()); drops = []; clearEffects(); pageSplashes = [];
    setBackgroundOpacity(0); $('completionArt').replaceChildren();
    activeTemplate = window.PaintTemplates.next(activeScene);
    buildScene();
    airshipX = activeInputMode === 'eyegaze' ? 600 : Math.max(WORLD.halfShipWidth + 4, buildings[0].hitX + buildings[0].hitWidth / 2); direction = 1;
    paintColourIndex = usesGazePalette() ? savedPaletteIndex : 0; colourElapsed = 0; activeColourMode = colourMode();
    buildings.forEach(target => { target.lastPaint = null; });
    updateColourIndicator(); updateSceneDescription(); drawAirship(); setPhase('playing');
    measurePaintBounds();
    if (activeInputMode === 'eyegaze') window.PaintGaze.reset({ targets: buildings, svg, worldPoint });
    announce('initial');
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
    const replaySameSetting = phase === 'complete' && selectedScene === activeScene && selectedDifficulty === activeDifficulty;
    window.PaintAudio.start(selectedScene);
    requestGameFullscreen();
    if ($('options').open) $('options').close();
    menuOpen = false;
    const inputChanged = activeInputMode !== selectedInputMode;
    const paletteChanged = activePaletteEnabled !== selectedPaletteEnabled;
    activeInputMode = selectedInputMode; activePaletteEnabled = selectedPaletteEnabled;
    if (replaySameSetting) {
      nextDrawing();
    } else if (selectedScene !== activeScene || selectedDifficulty !== activeDifficulty || phase === 'ready' || phase === 'complete') {
      if (selectedScene !== activeScene) { activeScene = selectedScene; paletteIndex = 0; }
      else if (phase === 'complete') paletteIndex = (paletteIndex + 1) % (activeScene === 'city' ? palettes.length : window.PaintSceneArt[activeScene].palette.length);
      activeDifficulty = selectedDifficulty;
      startScene();
    } else {
      const nextColourMode = colourMode();
      if (activeColourMode !== nextColourMode) { activeColourMode = nextColourMode; colourElapsed = 0; }
      if (inputChanged || paletteChanged) {
        paintColourIndex = usesGazePalette() ? savedPaletteIndex : paintColourIndex % currentPalette().length;
        if (inputChanged) {
          window.PaintGaze.clear();
          if (activeInputMode === 'eyegaze') { airshipX = 600; direction = 1; }
        }
        updateColourIndicator(); updateSceneDescription(); drawAirship();
      }
      setPhase('playing');
      if (inputChanged && activeInputMode === 'eyegaze') window.PaintGaze.reset({ targets: buildings, svg, worldPoint });
      announce('initial');
    }
    updateUI(); lastTime = null; $('playSurface').focus({ preventScroll: true });
  }
  function returnToMenu() {
    if (menuOpen) return;
    window.PaintGaze.suspend(); window.PaintColourPalette.suspend();
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
    if (phase !== 'playing' || activeInputMode === 'eyegaze') return;
    releasePaint(targetAt(airshipX));
  }
  function releasePaint(target) {
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
      if (activeInputMode === 'eyegaze') {
        const pose = window.PaintGaze.frame(dt, { speed: flightSpeed(), pending: drops.length > 0 });
        airshipX = pose.x; direction = pose.direction;
        if (pose.dropTarget) releasePaint(pose.dropTarget);
      } else advanceFlight(dt);
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
        if (b.bounce <= 0) return;
        b.bounce = Math.max(0, b.bounce - dt);
        const rise = b.bounce > 0 ? Math.sin((1 - b.bounce / .45) * Math.PI) * 5 : 0;
        if (b.bounce > 0) b.group.setAttribute('transform', `translate(0 ${-rise})`);
        else b.group.removeAttribute('transform');
      });
      effects = effects.filter(effect => {
        effect.age += dt; effect.update(Math.min(1, effect.age / effect.duration), effect.age);
        if (effect.age >= effect.duration) { effect.cleanup(); return false; } return true;
      });
      window.PaintAtmosphere.frame(dt);
      window.PaintRestoration.frame(dt);
      window.PaintColourPalette.frame(dt);
    }
    if (!menuOpen && phase === 'complete') {
      // Let the zeppelin finish its pass, leaving the restored panorama clear.
      flightTime += dt;
      if (activeInputMode === 'eyegaze') {
        const pose = window.PaintGaze.frame(dt, { speed: flightSpeed(), pending: false });
        airshipX = pose.x; direction = pose.direction;
      } else {
        const exitX = direction > 0 ? WORLD.width + WORLD.halfShipWidth : -WORLD.halfShipWidth;
        const nextX = airshipX + direction * flightSpeed() * dt;
        airshipX = direction > 0 ? Math.min(exitX, nextX) : Math.max(exitX, nextX);
      }
      drawAirship();
      completionAge += dt;
      const { delay, fade, hold, out } = completionTiming();
      if (!completionChimed && completionAge >= delay) {
        completionChimed = true;
        window.PaintAudio.effect('complete');
      }
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
    if (!menuOpen && event.target.closest('#colourPalette')) return;
    if (menuOpen && control && control !== $('mainAction')) return;
    event.preventDefault();
    if (event.repeat || heldKeys.has(event.code)) return;
    heldKeys.add(event.code);
    if (!menuOpen && activeInputMode === 'eyegaze') return;
    if (!menuOpen && activeColourMode === 'manual' && ['Enter', 'NumpadEnter'].includes(event.code)) {
      if (phase === 'playing') nextPaintColour();
      return;
    }
    activate();
  });
  document.addEventListener('keyup', event => heldKeys.delete(event.code));
  $('playSurface').addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    if (activeInputMode === 'eyegaze') window.PaintGaze.move(event, $('scene'));
    else activate();
    $('playSurface').focus({ preventScroll: true });
  });
  $('playSurface').addEventListener('click', event => { if (event.detail === 0) activate(); });
  $('playSurface').addEventListener('pointermove', event => {
    if (!menuOpen && phase === 'playing' && activeInputMode === 'eyegaze') window.PaintGaze.move(event, $('scene'));
  });
  ['pointerleave', 'pointercancel'].forEach(name => $('playSurface').addEventListener(name, () => window.PaintGaze.suspend()));
  window.addEventListener('resize', clearGazePointer);
  document.addEventListener('pointermove', event => {
    if (event.isPrimary === false || event.pointerType === 'touch') return;
    gazePoint = { x: event.clientX, y: event.clientY }; updateGazePointer();
  });
  document.documentElement.addEventListener('pointerleave', clearGazePointer);
  document.addEventListener('pointercancel', clearGazePointer);
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
  $('paletteEnabled').checked = selectedPaletteEnabled;
  $('paletteEnabled').addEventListener('change', () => {
    selectedPaletteEnabled = $('paletteEnabled').checked;
    try { localStorage.setItem('recolorPaletteEnabled', String(selectedPaletteEnabled)); } catch (_) {}
  });
  $('guide').addEventListener('change', drawAirship);
  $('assist').addEventListener('change', drawAirship);
  $('language-toggle').addEventListener('click', () => {
    lang = { en: 'ja', ja: 'fr', fr: 'en' }[lang];
    try { localStorage.setItem('siteLanguage', lang); } catch (_) { /* Storage is optional. */ }
    translate();
  });
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
  document.querySelectorAll('input[name="inputMode"]').forEach(input => {
    input.checked = input.value === selectedInputMode;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      selectedInputMode = input.value;
      try { localStorage.setItem('recolorInputMode', selectedInputMode); } catch (_) {}
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
  window.PaintColourPalette.mount({ parent: $('colourPalette'), colours: GAZE_COLOURS,
    onInteraction: () => window.PaintGaze.suspend(),
    onPick: index => {
      paintColourIndex = savedPaletteIndex = index; colourElapsed = 0;
      try { localStorage.setItem('recolorPaletteColour', String(index)); } catch (_) {}
      updateColourIndicator();
    }
  });
  buildScene(); translate(); updateColourIndicator(); drawAirship(); requestAnimationFrame(frame);
})();
