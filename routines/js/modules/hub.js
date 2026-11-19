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

  document.querySelector('h1').textContent = I18N.t('routineEngine');
  const calm = document.querySelector('#calm');
  calm.querySelector('p.title').textContent = I18N.t('calmBreak');
  calm.querySelector('p.message').textContent = I18N.t('calmMessage');

  const grid = document.querySelector('#hub-grid');
  const entries = [
    { label: I18N.t('hello'), action: () => location.href = './hello.html?mode=hello' },
    { label: I18N.t('attendance'), action: () => location.href = './hello.html?mode=attendance' },
    { label: I18N.t('nowNextTitle'), action: () => location.href = './schedule.html' },
    { label: I18N.t('transitionPanel'), action: () => location.href = './transitions.html' },
    { label: I18N.t('calmBreak'), action: () => document.querySelector('#calm').style.display = 'block' }
  ];

  entries.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'large-tile';
    btn.textContent = item.label;
    btn.setAttribute('aria-label', item.label);
    Input.setupButton(btn, item.action);
    grid.appendChild(btn);
  });

  const editBtn = document.querySelector('#edit-btn');
  editBtn.textContent = I18N.t('edit');
  editBtn.setAttribute('aria-label', I18N.t('edit'));
  Input.setupButton(editBtn, () => location.href = './edit.html');
})();
