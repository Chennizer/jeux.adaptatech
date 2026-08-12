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

  const catalogue = {
    gaming: {
      summary: { fr: 'Une activité à explorer avec une switch.', en: 'An activity to explore with a switch.', ja: 'スイッチで楽しむアクティビティです。' },
      accessMethods: { fr: ['Switch'], en: ['Switch'], ja: ['スイッチ'] },
      switchDemand: { fr: 'Une activation intentionnelle', en: 'One intentional activation', ja: '意図した1回の操作' },
      gazeDemand: null,
      touchDemand: null,
      setup: null
    },
    switch: {
      summary: { fr: 'Une activité à déclencher et à explorer avec un interrupteur.', en: 'An activity to start and explore with a switch.', ja: 'スイッチで始めて楽しめるアクティビティです。' },
      accessMethods: { fr: ['Switch'], en: ['Switch'], ja: ['スイッチ'] },
      switchDemand: { fr: 'Une activation intentionnelle', en: 'One intentional activation', ja: '意図した1回の操作' },
      gazeDemand: null,
      touchDemand: null,
      setup: { fr: 'Vérifiez que le switch est connecté et reconnu avant de commencer.', en: 'Check that the switch is connected and detected before starting.', ja: '始める前にスイッチが接続・認識されていることを確認してください。' },
      sessionLength: { fr: 'Courte activité', en: 'Short activity', ja: '短いアクティビティ' }
    },
    pov: {
      summary: { fr: 'Une expérience immersive à la première personne, à déclencher au bon moment.', en: 'An immersive first-person experience to trigger at the right moment.', ja: '適切なタイミングで操作する一人称視点の没入型体験です。' },
      accessMethods: { fr: ['Switch'], en: ['Switch'], ja: ['スイッチ'] },
      switchDemand: { fr: 'Activations répétées ou synchronisées', en: 'Repeated or timed activations', ja: '繰り返しまたはタイミングを合わせた操作' },
      gazeDemand: null,
      touchDemand: null,
      setup: { fr: 'Le son peut aider à anticiper le bon moment pour activer le switch.', en: 'Sound can help anticipate the right moment to activate the switch.', ja: '音を手がかりに、スイッチを操作するタイミングをつかめます。' }
    },
    arcade: {
      summary: { fr: 'Un défi arcade court pour pratiquer le timing et le contrôle.', en: 'A short arcade challenge for practising timing and control.', ja: 'タイミングと操作を練習する短いアーケードチャレンジです。' },
      accessMethods: { fr: ['Switch', 'Contrôle oculaire'], en: ['Switch', 'Eye-gaze'], ja: ['スイッチ', '視線入力'] },
      switchDemand: { fr: 'Activations répétées ou synchronisées', en: 'Repeated or timed activations', ja: '繰り返しまたはタイミングを合わせた操作' },
      gazeDemand: { fr: 'Cibles mobiles ou synchronisées', en: 'Moving or timed targets', ja: '動く、またはタイミングを合わせたターゲット' },
      touchDemand: null,
      setup: { fr: 'Pour le contrôle oculaire, faites l’étalonnage avant de jouer.', en: 'For eye-gaze access, calibrate before playing.', ja: '視線入力では、遊ぶ前にキャリブレーションを行ってください。' },
      sessionLength: { fr: 'Courte partie', en: 'Short round', ja: '短いラウンド' }
    },
    gaze: {
      summary: { fr: 'Une activité conçue pour explorer et choisir avec le regard.', en: 'An activity designed to explore and choose with eye gaze.', ja: '視線で探索し、選ぶために設計されたアクティビティです。' },
      accessMethods: { fr: ['Contrôle oculaire'], en: ['Eye-gaze'], ja: ['視線入力'] },
      switchDemand: null,
      gazeDemand: { fr: 'Choix entre plusieurs cibles', en: 'Choosing between several targets', ja: '複数のターゲットから選択' },
      touchDemand: null,
      setup: { fr: 'Faites l’étalonnage du regard et vérifiez la position de l’écran.', en: 'Calibrate eye gaze and check the screen position.', ja: '視線入力を調整し、画面の位置を確認してください。' }
    },
    touch: {
      summary: { fr: 'Une activité tactile à découvrir directement sur l’écran.', en: 'A touch activity to explore directly on the screen.', ja: '画面を直接操作して楽しむタッチアクティビティです。' },
      accessMethods: { fr: ['Écran tactile'], en: ['Touchscreen'], ja: ['タッチスクリーン'] },
      switchDemand: null,
      gazeDemand: null,
      touchDemand: { fr: 'Toucher libre', en: 'Free touch', ja: '自由にタッチ' },
      setup: null,
      sessionLength: { fr: 'À votre rythme', en: 'At your own pace', ja: '自分のペースで' }
    },
    educational: {
      summary: { fr: 'Un outil pédagogique pour apprendre, organiser ou faire un choix.', en: 'An educational tool for learning, organising, or making a choice.', ja: '学習、整理、選択のための教育ツールです。' },
      accessMethods: { fr: ['Souris ou tactile'], en: ['Mouse or touch'], ja: ['マウスまたはタッチ'] },
      switchDemand: null,
      gazeDemand: null,
      touchDemand: { fr: 'Un choix', en: 'One choice', ja: '1つ選ぶ' },
      setup: null
    }
  };

  // Gaming descriptions follow what each activity actually does. The stages
  // provide a compact seven-step reading inspired by Jiao's Switch Heroes.
  const jiaoStages = {
    1: { fr: 'Jiao · Stade 1 · Découverte sensorielle', en: 'Jiao · Stage 1 · Sensory discovery', ja: 'Jiao・ステージ1・感覚的な発見' },
    2: { fr: 'Jiao · Stade 2 · Cause à effet', en: 'Jiao · Stage 2 · Cause and effect', ja: 'Jiao・ステージ2・原因と結果' },
    3: { fr: 'Jiao · Stade 3 · Activation intentionnelle', en: 'Jiao · Stage 3 · Intentional activation', ja: 'Jiao・ステージ3・意図的な操作' },
    4: { fr: 'Jiao · Stade 4 · Maintenir l’activation', en: 'Jiao · Stage 4 · Sustained activation', ja: 'Jiao・ステージ4・押し続ける' },
    5: { fr: 'Jiao · Stade 5 · Activations répétées', en: 'Jiao · Stage 5 · Repeated activations', ja: 'Jiao・ステージ5・繰り返し操作' },
    6: { fr: 'Jiao · Stade 6 · Synchroniser l’activation', en: 'Jiao · Stage 6 · Timed activation', ja: 'Jiao・ステージ6・タイミング操作' },
    7: { fr: 'Jiao · Stade 7 · Choisir avec des switchs', en: 'Jiao · Stage 7 · Choosing with switches', ja: 'Jiao・ステージ7・スイッチで選択' }
  };

  const gamingActivities = {};
  function gamingActivity(hrefs, stage, demand, fr, en, ja) {
    hrefs.split('|').forEach(href => {
      gamingActivities[href.toLowerCase()] = {
        summary: { fr, en, ja },
        accessMethods: catalogue.gaming.accessMethods,
        switchDemand: { fr: demand.fr, en: demand.en, ja: demand.ja },
        gazeDemand: null,
        touchDemand: null,
        setup: null,
        sessionLength: null,
        jiaoStage: jiaoStages[stage]
      };
    });
  }

  const any = { fr: 'Toute activation', en: 'Any activation', ja: 'どのような操作でも' };
  const intentional = { fr: 'Une activation intentionnelle', en: 'One intentional activation', ja: '意図した1回の操作' };
  const repeated = { fr: 'Activations répétées ou synchronisées', en: 'Repeated or timed activations', ja: '繰り返しまたはタイミングを合わせた操作' };
  const choices = { fr: 'Choisir entre des options', en: 'Choosing between options', ja: '選択肢から選ぶ' };

  gamingActivity('easter/index.html', 2, any, 'Faire éclore des œufs-surprises.', 'Hatch surprise eggs.', 'サプライズ卵をかえします。');
  gamingActivity('plant/index.html', 5, repeated, 'Appuyer plusieurs fois pour faire pousser les fleurs.', 'Press repeatedly to grow the flowers.', '繰り返し押して花を育てます。');
  gamingActivity('sadness/index.html', 2, any, 'Faire apparaître une scène de pluie apaisante.', 'Reveal a calming rainy scene.', '穏やかな雨の情景を表示します。');
  gamingActivity('zenitude/index.html', 2, any, 'Transformer une scène calme par une activation.', 'Transform a calm scene with one activation.', '1回の操作で静かな景色を変えます。');
  gamingActivity('joy/index.html', 2, any, 'Déclencher une animation joyeuse et colorée.', 'Trigger a joyful, colourful animation.', '楽しく色鮮やかな動きを起こします。');
  gamingActivity('seasons/index.html', 3, intentional, 'Changer le décor au fil des saisons.', 'Change the scene through the seasons.', '季節に合わせて景色を変えます。');
  gamingActivity('bees/index.html', 6, repeated, 'Aider les abeilles à rejoindre les fleurs.', 'Help the bees reach the flowers.', 'ミツバチを花へ導きます。');
  gamingActivity('dk2/index.html|mario/index.html', 6, repeated, 'Activer le personnage au bon moment dans la vidéo.', 'Activate the character at the right moment in the video.', '映像の適切なタイミングでキャラクターを動かします。');
  gamingActivity('kpop/index.html', 3, intentional, 'Ouvrir une fenêtre musicale animée.', 'Open an animated musical window.', '音楽のアニメーション窓を開きます。');
  gamingActivity('bubbles/index.html', 2, any, 'Faire apparaître des bulles avec du son.', 'Create bubbles with sound.', '音の鳴る泡を作ります。');
  gamingActivity('window/index.html', 5, repeated, 'Appuyer plusieurs fois pour ouvrir la fenêtre.', 'Press repeatedly to open the window.', '繰り返し押して窓を開きます。');
  gamingActivity('shapes/index.html', 2, any, 'Faire défiler des formes, des couleurs et des sons.', 'Cycle through shapes, colours, and sounds.', '形・色・音を切り替えます。');
  gamingActivity('vortex/index.html', 4, intentional, 'Maintenir la switch pour voyager dans le vortex.', 'Hold the switch to travel through the vortex.', 'スイッチを押し続けて渦の中を進みます。');
  gamingActivity('coloredtrace/index.html', 4, intentional, 'Maintenir la switch pour tracer une ligne colorée.', 'Hold the switch to draw a colourful trail.', 'スイッチを押し続けて色の軌跡を描きます。');
  gamingActivity('weatherauto/index.html', 3, intentional, 'Déclencher une nouvelle météo et son ambiance.', 'Trigger new weather and its atmosphere.', '新しい天気と雰囲気を起動します。');
  gamingActivity('snow/index.html', 2, any, 'Remplir l’écran de neige et de musique.', 'Fill the screen with snow and music.', '雪と音楽で画面を満たします。');
  gamingActivity('sun/index.html', 2, any, 'Faire rayonner le soleil en musique.', 'Make the sun shine with music.', '音楽とともに太陽を輝かせます。');
  gamingActivity('storm/index.html', 2, any, 'Déclencher la pluie, les éclairs et le tonnerre.', 'Trigger rain, lightning, and thunder.', '雨・稲妻・雷を起こします。');
  gamingActivity('fireflies/index.html', 5, repeated, 'Illuminer progressivement la nuit de lucioles.', 'Gradually light the night with fireflies.', 'ホタルで少しずつ夜を照らします。');
  gamingActivity('xylophone/index.html', 3, intentional, 'Jouer une nouvelle note à chaque activation.', 'Play a new note with each activation.', '操作するたびに新しい音を鳴らします。');
  gamingActivity('ftl/index.html', 7, choices, 'Piloter un vaisseau avec deux actions distinctes.', 'Pilot a ship with two distinct actions.', '2つの異なる操作で宇宙船を操縦します。');
  gamingActivity('colorcycle/index.html', 2, any, 'Faire défiler un cycle de couleurs.', 'Cycle through changing colours.', '色を順番に変えます。');
  gamingActivity('../pedagogique/choix/index.html', 7, choices, 'Parcourir puis sélectionner une option.', 'Browse and then select an option.', '選択肢を移動して決定します。');
  gamingActivity('saintpatrick/index.html', 6, repeated, 'Attraper les symboles au moment opportun.', 'Catch the symbols at the right moment.', '適切なタイミングでシンボルを集めます。');
  gamingActivity('zamboni/index.html', 6, repeated, 'Préparer la glace au bon moment.', 'Prepare the ice at the right moment.', 'タイミングよく氷を整備します。');

  const labels = {
    fr: { info: 'Infos', access: 'Accès', demand: 'Interaction', setup: 'À préparer', session: 'Durée' },
    en: { info: 'Info', access: 'Access', demand: 'Interaction', setup: 'Setup', session: 'Length' },
    ja: { info: '情報', access: 'アクセス', demand: '操作', setup: '準備', session: '時間' }
  };

  function language() {
    const value = localStorage.getItem('siteLanguage') || document.documentElement.lang || 'fr';
    return labels[value] ? value : 'fr';
  }

  function localized(value, lang) { return value && (value[lang] || value.fr || value.en); }

  function panelMarkup(info, lang) {
    const text = labels[lang];
    if (info.jiaoStage) {
      return `<p class="catalogue-summary">${localized(info.summary, lang)}</p>
        <p class="catalogue-jiao-stage">${localized(info.jiaoStage, lang)}</p>`;
    }
    const demands = [info.switchDemand, info.gazeDemand, info.touchDemand]
      .filter(Boolean).map(item => localized(item, lang));
    return `<p class="catalogue-summary">${localized(info.summary, lang)}</p>
      <div class="catalogue-badges"><span class="catalogue-label">${text.access}</span>${localized(info.accessMethods, lang).map(method => `<span class="catalogue-badge">${method}</span>`).join('')}</div>
      ${demands.length ? `<div class="catalogue-demand"><span class="catalogue-label">${text.demand}</span><span class="catalogue-badge catalogue-demand-badge">${demands.join(' · ')}</span></div>` : ''}
      ${info.sessionLength ? `<p class="catalogue-session"><strong>${text.session}:</strong> ${localized(info.sessionLength, lang)}</p>` : ''}
      ${info.setup ? `<p class="catalogue-setup"><strong>${text.setup}:</strong> ${localized(info.setup, lang)}</p>` : ''}`;
  }

  function renderCard(tile, info) {
    const lang = language();
    const text = labels[lang];
    const id = `catalogue-info-${Math.random().toString(36).slice(2, 9)}`;
    const panel = document.createElement('section');
    panel.className = 'catalogue-info-panel';
    panel.id = id;
    panel.setAttribute('aria-label', text.info);
    panel.innerHTML = panelMarkup(info, lang);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'catalogue-info-button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', id);
    button.setAttribute('aria-label', text.info);
    button.title = text.info;
    button.textContent = 'i';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const open = tile.classList.toggle('catalogue-info-open');
      button.setAttribute('aria-expanded', String(open));
    });
    tile.classList.add('catalogue-info-enhanced');
    tile.append(button, panel);
  }

  function refreshLocalizedCards() {
    const lang = language();
    const text = labels[lang];
    document.querySelectorAll('.catalogue-info-enhanced').forEach(tile => {
      const info = tile._catalogueInfo;
      const panel = tile.querySelector('.catalogue-info-panel');
      const button = tile.querySelector('.catalogue-info-button');
      if (!info || !panel || !button) return;
      panel.setAttribute('aria-label', text.info);
      panel.innerHTML = panelMarkup(info, lang);
      button.setAttribute('aria-label', text.info);
      button.title = text.info;
    });
  }

  function enhance() {
    const category = document.body.dataset.catalogueCategory;
    const categoryInfo = catalogue[category];
    if (!categoryInfo) return;
    document.querySelectorAll('.tile-container > .tile').forEach(tile => {
      const link = tile.querySelector('a');
      const href = link && link.getAttribute('href');
      const info = category === 'gaming' && href ? gamingActivities[href.toLowerCase()] : categoryInfo;
      if (!info) return;
      tile._catalogueInfo = info;
      renderCard(tile, info);
    });
    new MutationObserver(refreshLocalizedCards).observe(document.documentElement, {
      attributes: true, attributeFilter: ['lang']
    });
  }

  window.gameCatalog = { categories: catalogue, interactionScale };
  document.addEventListener('DOMContentLoaded', enhance);
}());
