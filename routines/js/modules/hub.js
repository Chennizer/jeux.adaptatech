import I18N from '../engine/i18n.js';
import Storage from '../engine/storage.js';
import UI from '../engine/ui.js';
import Input from '../engine/input.js';
import Media from '../engine/media.js';

document.addEventListener('DOMContentLoaded', async () => {
  I18N.init();
  const preset = await Storage.loadPreset();
  UI.setPreset(preset);
  Input.init(preset.inputDefaults);
  Media.attachInteractionListeners();

  UI.renderTopBar(document.getElementById('top'), { title: I18N.t('hub'), onBack: () => window.location.href = 'index.html' });
  UI.setKeyEscape(() => window.location.href = 'index.html');
  Input.bindAll();

  const helloBtn = document.getElementById('helloBtn');
  const transitionBtn = document.getElementById('transitionBtn');
  const scheduleBtn = document.getElementById('scheduleBtn');
  const calmBtn = document.getElementById('calmBtn');
  const editBtn = document.getElementById('editBtn');

  helloBtn.textContent = `${I18N.t('helloModule')} / ${I18N.t('attendanceModule')}`;
  transitionBtn.textContent = I18N.t('transitionsModule');
  scheduleBtn.textContent = I18N.t('schedule');
  calmBtn.textContent = I18N.t('calmBreak');
  editBtn.textContent = I18N.t('edit');

  helloBtn.addEventListener('click', () => window.location.href = 'hello.html');
  transitionBtn.addEventListener('click', () => window.location.href = 'transitions.html');
  scheduleBtn.addEventListener('click', () => window.location.href = 'schedule.html');
  editBtn.addEventListener('click', () => window.location.href = 'edit.html');
  calmBtn.addEventListener('click', () => UI.renderCalmOverlay(document.body));
});
