/* Shared, localized accessibility information for catalogue cards. */
(function () {
  'use strict';

  const interactionScale = {
    switch: {
      fr: ['Toute activation', 'Une activation intentionnelle', 'Choisir entre des options', 'Activations répétées ou synchronisées'],
      en: ['Any activation', 'One intentional activation', 'Choosing between options', 'Repeated or timed activations'],
      ja: ['どのような操作でも', '意図した1回の操作', '選択肢から選ぶ', '繰り返しまたはタイミングを合わせた操作']
    },
    gaze: {
      fr: ['Grandes cibles fixes', 'Une cible à la fois', 'Choix entre plusieurs cibles', 'Cibles mobiles ou synchronisées'],
      en: ['Large fixed targets', 'One target at a time', 'Choosing between several targets', 'Moving or timed targets'],
      ja: ['大きな固定ターゲット', '一度に1つのターゲット', '複数のターゲットから選択', '動く、またはタイミングを合わせたターゲット']
    },
    touch: {
      fr: ['Toucher libre', 'Un choix', 'Plusieurs choix', 'Glisser-déposer ou précision'],
      en: ['Free touch', 'One choice', 'Several choices', 'Drag-and-drop or precision'],
      ja: ['自由にタッチ', '1つ選ぶ', '複数から選ぶ', 'ドラッグ＆ドロップまたは正確な操作']
    }
  };

  const categories = {
    gaming: { accessMethods: { fr: ['Switch'], en: ['Switch'], ja: ['スイッチ'] }, switchDemand: 1, gazeDemand: null, setup: { fr: 'Switch connecté', en: 'Switch connected', ja: 'スイッチ接続' }, sessionLength: null },
    switch: { accessMethods: { fr: ['Switch'], en: ['Switch'], ja: ['スイッチ'] }, switchDemand: 1, gazeDemand: null, setup: { fr: 'Switch connecté', en: 'Switch connected', ja: 'スイッチ接続' }, sessionLength: null },
    pov: { accessMethods: { fr: ['Switch'], en: ['Switch'], ja: ['スイッチ'] }, switchDemand: 1, gazeDemand: null, setup: { fr: 'Son recommandé', en: 'Sound recommended', ja: '音声推奨' }, sessionLength: null },
    arcade: { accessMethods: { fr: ['Switch', 'Contrôle oculaire'], en: ['Switch', 'Eye-gaze'], ja: ['スイッチ', '視線入力'] }, switchDemand: 3, gazeDemand: 3, setup: { fr: 'Étalonnage du regard', en: 'Eye-gaze calibration', ja: '視線調整' }, sessionLength: null },
    gaze: { accessMethods: { fr: ['Contrôle oculaire'], en: ['Eye-gaze'], ja: ['視線入力'] }, switchDemand: null, gazeDemand: 2, setup: { fr: 'Étalonnage du regard', en: 'Eye-gaze calibration', ja: '視線調整' }, sessionLength: null },
    touch: { accessMethods: { fr: ['Écran tactile'], en: ['Touchscreen'], ja: ['タッチスクリーン'] }, switchDemand: null, gazeDemand: null, touchDemand: 0, setup: null, sessionLength: null },
    educational: { accessMethods: { fr: ['Souris ou tactile'], en: ['Mouse or touch'], ja: ['マウスまたはタッチ'] }, switchDemand: null, gazeDemand: null, touchDemand: 1, setup: null, sessionLength: null }
  };

  const profiles = {
    eggs: ['Faire éclore des œufs-surprises.', 'Hatch surprise eggs.', 'サプライズ卵をかえします。'],
    flowers: ['Faire pousser des fleurs colorées.', 'Grow colourful flowers.', '色とりどりの花を育てます。'],
    rainyMood: ['Créer une ambiance de pluie apaisante.', 'Create a calming rainy scene.', '穏やかな雨の情景を作ります。'],
    calmMood: ['Explorer une ambiance calme et naturelle.', 'Explore a calm natural scene.', '静かな自然の情景を楽しみます。'],
    joyMood: ['Déclencher une explosion de joie colorée.', 'Trigger a burst of colourful joy.', 'カラフルな喜びを広げます。'],
    seasons: ['Transformer le décor au fil des saisons.', 'Transform the scene through the seasons.', '季節ごとに景色を変えます。'],
    bees: ['Aider les abeilles à visiter les fleurs.', 'Help bees visit the flowers.', 'ミツバチを花へ導きます。'],
    platform: ['Faire avancer le personnage dans la vidéo.', 'Move the character through the video.', '映像の中のキャラクターを進めます。'],
    musicWindow: ['Ouvrir une fenêtre musicale animée.', 'Open an animated musical window.', '音楽の窓を開きます。'],
    bubbles: ['Faire apparaître des bulles sonores.', 'Create musical bubbles.', '音の鳴る泡を作ります。'],
    window: ['Révéler une scène derrière la fenêtre.', 'Reveal a scene behind the window.', '窓の向こうの景色を見ます。'],
    shapes: ['Faire défiler formes, couleurs et sons.', 'Cycle through shapes, colours, and sounds.', '形・色・音を切り替えます。'],
    vortex: ['Voyager dans un vortex lumineux.', 'Travel through a glowing vortex.', '光る渦の中を旅します。'],
    trace: ['Dessiner une traînée de couleurs.', 'Draw a trail of colour.', '色の軌跡を描きます。'],
    weather: ['Changer la météo et son ambiance.', 'Change the weather and its atmosphere.', '天気と雰囲気を変えます。'],
    snow: ['Déclencher une tempête de neige.', 'Trigger a snowstorm.', '吹雪を起こします。'],
    sun: ['Faire rayonner le soleil.', 'Make the sun shine.', '太陽を輝かせます。'],
    storm: ['Créer éclairs, pluie et tonnerre.', 'Create lightning, rain, and thunder.', '稲妻・雨・雷を起こします。'],
    fireflies: ['Illuminer la nuit de lucioles.', 'Light the night with fireflies.', 'ホタルで夜を照らします。'],
    xylophone: ['Jouer une note de xylophone.', 'Play a xylophone note.', '木琴の音を鳴らします。'],
    space: ['Propulser un vaisseau dans l’espace.', 'Launch a ship through space.', '宇宙船を進めます。'],
    colours: ['Faire défiler un cycle de couleurs.', 'Cycle through changing colours.', '色を順番に変えます。'],
    choices: ['Choisir parmi plusieurs activités.', 'Choose from several activities.', '複数のアクティビティから選びます。'],
    shamrock: ['Attraper les symboles de la Saint-Patrick.', 'Catch St Patrick’s Day symbols.', '聖パトリック祭の絵を集めます。'],
    zamboni: ['Préparer la glace au bon moment.', 'Prepare the ice at the right moment.', 'タイミングよく氷を整備します。'],
    chooseVideo: ['Choisir puis lancer une vidéo.', 'Choose and start a video.', '動画を選んで再生します。'],
    musicVideo: ['Lancer et arrêter des vidéoclips.', 'Start and stop music videos.', 'ミュージックビデオを再生・停止します。'],
    immersive: ['Contrôler une vidéo immersive en mouvement.', 'Control an immersive moving video.', '動きのある没入映像を操作します。'],
    timingVideo: ['Relancer la scène au bon moment.', 'Restart the scene at the right moment.', 'タイミングよく場面を再開します。'],
    spaceArcade: ['Viser les fruits qui traversent l’écran.', 'Target fruit moving across the screen.', '画面を動く果物を狙います。'],
    story: ['Explorer une histoire interactive illustrée.', 'Explore an illustrated interactive story.', 'イラスト付きの物語を楽しみます。'],
    gazeVideo: ['Regarder une cible pour lancer la vidéo.', 'Look at a target to start the video.', 'ターゲットを見て動画を再生します。'],
    sensory: ['Faire réagir couleurs, formes et sons.', 'Make colours, shapes, and sounds react.', '色・形・音を反応させます。'],
    fluids: ['Déplacer des fluides colorés.', 'Move colourful flowing fluids.', '色鮮やかな流体を動かします。'],
    memory: ['Retourner des cartes et retrouver les paires.', 'Turn cards and find matching pairs.', 'カードをめくってペアを探します。'],
    letter: ['Repérer la lettre demandée.', 'Find the requested letter.', '指定された文字を探します。'],
    number: ['Repérer le nombre demandé.', 'Find the requested number.', '指定された数字を探します。'],
    matching: ['Associer les images correspondantes.', 'Match corresponding pictures.', '対応する絵を組み合わせます。'],
    world: ['Choisir une région à découvrir.', 'Choose a region to discover.', '地域を選んで学びます。'],
    painting: ['Créer une peinture avec le regard.', 'Create a painting with eye gaze.', '視線で絵を描きます。'],
    drawing: ['Tracer librement avec le regard.', 'Draw freely with eye gaze.', '視線で自由に線を描きます。'],
    flappy: ['Guider l’oiseau entre les obstacles.', 'Guide the bird between obstacles.', '障害物の間で鳥を導きます。'],
    stars: ['Toucher et déplacer des étoiles.', 'Touch and move stars.', '星に触れて動かします。'],
    reaction: ['Toucher rapidement la lumière apparue.', 'Quickly touch the light that appears.', '現れた光を素早くタッチします。'],
    touchWindow: ['Ouvrir la fenêtre du bout du doigt.', 'Open the window with a touch.', '指で窓を開きます。'],
    touchChoices: ['Toucher une option pour la choisir.', 'Touch an option to choose it.', '選択肢をタッチして選びます。'],
    touchPaint: ['Peindre librement avec les doigts.', 'Paint freely with your fingers.', '指で自由に描きます。'],
    snowflakes: ['Toucher et faire danser les flocons.', 'Touch and move the snowflakes.', '雪の結晶に触れて動かします。'],
    schedule: ['Construire une séquence visuelle.', 'Build a visual sequence.', '視覚的な手順を作ります。'],
    recipes: ['Suivre des recettes illustrées étape par étape.', 'Follow illustrated recipes step by step.', '絵付きレシピを順番に進めます。'],
    reader: ['Créer et parcourir un livre illustré.', 'Create and read an illustrated book.', '絵本を作って読みます。'],
    cvi: ['Composer des supports visuels personnalisés.', 'Create customised visual materials.', '視覚教材を作成します。'],
    pictograms: ['Créer une planche de pictogrammes.', 'Create a pictogram board.', 'ピクトグラム表を作ります。'],
    timer: ['Visualiser le temps qui reste.', 'See how much time remains.', '残り時間を見える化します。'],
    payment: ['S’exercer à choisir la monnaie exacte.', 'Practise choosing the correct money.', '正しいお金を選ぶ練習をします。'],
    stimulation: ['Déclencher une stimulation visuelle.', 'Trigger a visual stimulation.', '視覚刺激を起こします。'],
    customTrace: ['Créer puis suivre un tracé visuel.', 'Create and follow a visual path.', '視覚的な軌跡を作って追います。'],
    fieldMap: ['Cartographier les zones du champ visuel.', 'Map areas of the visual field.', '視野の領域を記録します。'],
    dice: ['Lancer un choix aléatoire illustré.', 'Make a random illustrated choice.', '絵付きの選択肢をランダムに出します。']
  };

  const activityProfiles = {};
  const accessNames = {
    switch: { fr: 'Switch', en: 'Switch', ja: 'スイッチ' },
    gaze: { fr: 'Contrôle oculaire', en: 'Eye-gaze', ja: '視線入力' },
    touch: { fr: 'Écran tactile', en: 'Touchscreen', ja: 'タッチスクリーン' }
  };
  function assign(category, profile, hrefs, demand) {
    const method = category === 'gaze' ? 'gaze' : category === 'touch' || category === 'educational' ? 'touch' : 'switch';
    const demands = typeof demand === 'object' ? demand : { [method]: demand };
    const methods = Object.keys(demands);
    const accessMethods = {};
    ['fr', 'en', 'ja'].forEach(lang => {
      accessMethods[lang] = methods.map(name => accessNames[name][lang]);
    });
    hrefs.split('|').forEach(href => {
      activityProfiles[`${category}:${href.toLowerCase()}`] = {
        summary: profiles[profile],
        accessMethods,
        switchDemand: demands.switch == null ? null : demands.switch,
        gazeDemand: demands.gaze == null ? null : demands.gaze,
        touchDemand: demands.touch == null ? null : demands.touch,
        setup: categories[category].setup,
        sessionLength: categories[category].sessionLength
      };
    });
  }

  assign('gaming', 'eggs', 'easter/index.html', 0); assign('gaming', 'flowers', 'plant/index.html', 0);
  assign('gaming', 'rainyMood', 'sadness/index.html', 0); assign('gaming', 'calmMood', 'zenitude/index.html', 0);
  assign('gaming', 'joyMood', 'joy/index.html', 0); assign('gaming', 'seasons', 'seasons/index.html', 0);
  assign('gaming', 'bees', 'bees/index.html', 3); assign('gaming', 'platform', 'dk2/index.html|mario/index.html', 3);
  assign('gaming', 'musicWindow', 'kpop/index.html', 1); assign('gaming', 'bubbles', 'bubbles/index.html', 0);
  assign('gaming', 'window', 'window/index.html', 0); assign('gaming', 'shapes', 'shapes/index.html', 0);
  assign('gaming', 'vortex', 'vortex/index.html', 0); assign('gaming', 'trace', 'coloredtrace/index.html', 0);
  assign('gaming', 'weather', 'weatherauto/index.html', 0); assign('gaming', 'snow', 'snow/index.html', 0);
  assign('gaming', 'sun', 'sun/index.html', 0); assign('gaming', 'storm', 'storm/index.html', 0);
  assign('gaming', 'fireflies', 'fireflies/index.html', 0); assign('gaming', 'xylophone', 'xylophone/index.html', 0);
  assign('gaming', 'space', 'ftl/index.html', 3); assign('gaming', 'colours', 'colorcycle/index.html', 0);
  assign('gaming', 'choices', '../pedagogique/choix/index.html', 2); assign('gaming', 'shamrock', 'saintpatrick/index.html', 3);
  assign('gaming', 'zamboni', 'zamboni/index.html', 3);
  assign('switch', 'chooseVideo', 'custom-youtube/index.html|custom-videos-local/index.html', 2);
  assign('switch', 'musicVideo', 'kpop/index.html|disneylive/index.html|taylor swift/index.html|noel/index.html|hiver/index.html|encanto/index.html|arthur/index.html|kids united/index.html|shakira/index.html|moana/index.html|passe-partout/index.html|explorons le monde/index.html|peppa (espagnol)/index.html|comptines africaines/index.html|roi lion/index.html|beatles/index.html|halloween/index.html|belleetbete/index.html|la reine des neiges/index.html|titounis/index.html|tfo-routine/index.html|tfo-saisons/index.html', 1);
  assign('pov', 'immersive', 'train alpes/index.html|dance/index.html|diving/index.html|disneyrc/index.html|cw/index.html|ski alpin/index.html|snowboard/index.html|snowplow/index.html|spacewalk/index.html|wingsuit/index.html|parkour/index.html|winter olympic/index.html', 1);
  assign('arcade', 'timingVideo', 'mariomovie/index.html', { switch: 3, gaze: 1 }); assign('arcade', 'spaceArcade', 'space-invaders-fruits/index.html', { switch: 3, gaze: 3 });
  assign('gaze', 'story', 'samuraistory/index.html|storybook/index.html', 1); assign('gaze', 'gazeVideo', 'regarder-video/index.html', 1);
  assign('gaze', 'sensory', 'sensory/index.html', 0); assign('gaze', 'fluids', 'webglfluids/index.html', 0);
  assign('gaze', 'memory', 'carte memoire/index.html', 2); assign('gaze', 'fireflies', 'firefly/index.html', 1);
  assign('gaze', 'letter', 'letterhunt/index.html', 2); assign('gaze', 'number', 'numberhunt/index.html', 2);
  assign('gaze', 'matching', 'association/index.html', 2); assign('gaze', 'world', 'decouvrons le monde/index.html', 2);
  assign('gaze', 'xylophone', 'xylophone/index.html', 2); assign('gaze', 'painting', 'paint/index.html|fingerpaint/index.html', 0);
  assign('gaze', 'drawing', 'draw/index.html', 0); assign('gaze', 'chooseVideo', 'choixeyegaze-videos-local/index.html|choixeyegaze-youtube/index.html|choixeyegaze/index.html', 2);
  assign('gaze', 'flappy', 'flappyeyegaze/index.html', 3);
  assign('touch', 'stars', 'étoiles/index.html', 3); assign('touch', 'reaction', 'lightreaction/index.html', 1);
  assign('touch', 'touchWindow', 'window/index.html', 1); assign('touch', 'touchChoices', 'choix/index.html|choix-youtube/index.html|choix-local/index.html', 2);
  assign('touch', 'xylophone', 'xylophone/index.html', 2); assign('touch', 'touchPaint', 'fingerpaint/index.html', 3); assign('touch', 'snowflakes', 'hiver/index.html', 0);
  assign('educational', 'schedule', 'visual-schedule/index.html', 3); assign('educational', 'recipes', 'recettes-adaptees/index.html', 1);
  assign('educational', 'reader', '../gaming/storybook/index.html', { switch: 1 }); assign('educational', 'chooseVideo', 'choix-videos-local/index.html|choix-videos-youtube/index.html|choix/index.html', { switch: 2 });
  assign('educational', 'cvi', 'cvigenerator/index.html', 2); assign('educational', 'pictograms', 'pictogenerator/index.html', 2);
  assign('educational', 'timer', 'timetimer/index.html', 3); assign('educational', 'payment', 'paiementprudent/index.html', 2);
  assign('educational', 'stimulation', 'stimulation visuelle/index.html', 0); assign('educational', 'customTrace', 'stimulation visuelle trace/index.html', 3);
  assign('educational', 'fieldMap', 'cvi-field-mapper/index.html', 3); assign('educational', 'dice', 'dice/index.html', { switch: 1 });

  const labels = { fr: { info: 'Infos', switch: 'Switch', gaze: 'Regard', touch: 'Tactile' }, en: { info: 'Info', switch: 'Switch', gaze: 'Eye gaze', touch: 'Touch' }, ja: { info: '情報', switch: 'スイッチ', gaze: '視線', touch: 'タッチ' } };
  const languages = ['fr', 'en', 'ja'];
  function language() { const value = localStorage.getItem('siteLanguage') || document.documentElement.lang || 'fr'; return languages.includes(value) ? value : 'fr'; }
  function localized(values, lang) { return Array.isArray(values) ? values[languages.indexOf(lang)] : values[lang]; }
  function demandBadges(detail, lang) {
    const values = { switch: detail.switchDemand, gaze: detail.gazeDemand, touch: detail.touchDemand };
    return Object.entries(values).filter(([, level]) => level != null).map(([method, level]) => `<span class="catalogue-badge catalogue-demand-badge"><strong>${labels[lang][method]}</strong> · ${interactionScale[method][lang][level]}</span>`).join('');
  }
  function panelMarkup(detail, lang) { return `<p class="catalogue-summary">${localized(detail.summary, lang)}</p><div class="catalogue-demand">${demandBadges(detail, lang)}</div>`; }

  function renderCard(tile, category, detail) {
    const lang = language(); const id = `catalogue-info-${Math.random().toString(36).slice(2, 9)}`;
    const panel = document.createElement('section'); panel.className = 'catalogue-info-panel'; panel.id = id; panel.setAttribute('aria-label', labels[lang].info); panel.innerHTML = panelMarkup(detail, lang);
    const button = document.createElement('button'); button.type = 'button'; button.className = 'catalogue-info-button'; button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', id); button.setAttribute('aria-label', labels[lang].info); button.title = labels[lang].info; button.textContent = 'i';
    button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); const open = tile.classList.toggle('catalogue-info-open'); button.setAttribute('aria-expanded', String(open)); });
    tile._catalogueDetail = { category, detail }; tile.classList.add('catalogue-info-enhanced'); tile.append(button, panel);
  }
  function refreshLocalizedCards() {
    const lang = language(); document.querySelectorAll('.catalogue-info-enhanced').forEach(tile => { const stored = tile._catalogueDetail; const panel = tile.querySelector('.catalogue-info-panel'); const button = tile.querySelector('.catalogue-info-button'); if (!stored || !panel || !button) return; panel.setAttribute('aria-label', labels[lang].info); panel.innerHTML = panelMarkup(stored.detail, lang); button.setAttribute('aria-label', labels[lang].info); button.title = labels[lang].info; });
  }
  function enhance() {
    const category = document.body.dataset.catalogueCategory; if (!categories[category]) return;
    document.querySelectorAll('.tile-container > .tile').forEach(tile => {
      // The game link is already the tile's first child. Avoid :scope here because
      // several older browsers used with assistive devices reject that selector.
      const link = Array.prototype.find.call(tile.children, child => child.tagName === 'A');
      if (!link) return;
      const href = link.getAttribute('href');
      const detail = href && activityProfiles[`${category}:${href.toLowerCase()}`];
      if (detail) renderCard(tile, category, detail);
    });
    new MutationObserver(refreshLocalizedCards).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  window.gameCatalog = { categories, interactionScale, activities: activityProfiles };
  document.addEventListener('DOMContentLoaded', enhance);
}());
