import Storage from '../engine/storage.js';
import I18N from '../engine/i18n.js';
import UI from '../engine/ui.js';
import Media from '../engine/media.js';
import Input from '../engine/input.js';

(async () => {
  const preset = await Storage.loadPreset();
  if (!localStorage.getItem('routine_language')) I18N.setLanguage(preset.languageDefault || 'en');
  document.documentElement.lang = I18N.current();
  Media.init();
  UI.applyTheme(preset);
  UI.renderTopbar();

  document.querySelector('h1').textContent = I18N.t('nowNextTitle');
  document.querySelector('#advance').textContent = I18N.t('advanceAction');
  document.querySelector('#done').textContent = I18N.t('allDone');

  let pointer = 0;
  const nowPanel = document.querySelector('#now');
  const nextPanel = document.querySelector('#next');
  const advanceBtn = document.querySelector('#advance');
  const doneScreen = document.querySelector('#done');

  const renderCard = (panel, item, labelKey) => {
    panel.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = I18N.t(labelKey);
    const body = document.createElement('div');
    if (item) {
      const img = document.createElement('img');
      img.src = item.pictoUrl;
      const label = document.createElement('div');
      label.className = 'name';
      label.textContent = item.label?.[I18N.current()] || item.label?.en || '';
      body.append(img, label);
    } else {
      body.textContent = '—';
    }
    panel.append(title, body);
  };

  const step = () => {
    const nowItem = preset.schedule[pointer];
    const nextItem = preset.schedule[pointer + 1];
    renderCard(nowPanel, nowItem, 'nowLabel');
    renderCard(nextPanel, nextItem, 'nextLabel');
    if (!nowItem && !nextItem) {
      doneScreen.style.display = 'grid';
      setTimeout(() => location.href = './index.html', 5000);
    }
  };

  const advance = () => {
    pointer += 1;
    step();
  };

  Input.setupButton(advanceBtn, advance);
  step();
})();
