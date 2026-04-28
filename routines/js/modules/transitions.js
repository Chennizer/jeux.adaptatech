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

  document.querySelector('h1').textContent = I18N.t('transitionsTitle');

  const grid = document.querySelector('#transition-grid');
  const overlay = document.querySelector('#overlay');
  const overlayTitle = overlay.querySelector('.title');
  const overlayImg = overlay.querySelector('img');

  const showCue = (item) => {
    overlayTitle.textContent = item.labelKey ? I18N.t(item.labelKey) : (item.label?.[I18N.current()] || item.label?.en || '');
    overlayImg.src = item.pictoUrl;
    overlay.style.display = 'flex';
    Media.playAudio(item.audioUrl);
    if (item.behavior === 'momentary') {
      setTimeout(() => overlay.style.display = 'none', item.durationMs || 4000);
    } else {
      if (overlay.dataset.active === item.id) {
        overlay.style.display = 'none';
        overlay.dataset.active = '';
      } else {
        overlay.dataset.active = item.id;
      }
    }
  };

  preset.transitions.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'card';
    btn.setAttribute('aria-label', item.labelKey ? I18N.t(item.labelKey) : item.label?.[I18N.current()] || '');
    const img = document.createElement('img');
    img.src = item.pictoUrl;
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = item.labelKey ? I18N.t(item.labelKey) : (item.label?.[I18N.current()] || item.label?.en || '');
    btn.append(img, name);
    Input.setupButton(btn, () => showCue(item));
    grid.appendChild(btn);
  });
})();
