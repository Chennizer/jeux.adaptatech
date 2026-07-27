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
    button.textContent = text.info;
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
      button.textContent = text.info;
    });
  }

  function enhance() {
    const category = document.body.dataset.catalogueCategory;
    const info = catalogue[category];
    if (!info) return;
    document.querySelectorAll('.tile-container > .tile').forEach(tile => {
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
