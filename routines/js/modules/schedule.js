import I18N from '../engine/i18n.js';
import Storage from '../engine/storage.js';
import UI from '../engine/ui.js';
import Input from '../engine/input.js';
import Media from '../engine/media.js';

let pointerAdvance = false;

function renderPanels(nowItem, nextItem) {
  const nowPanel = document.getElementById('nowPanel');
  const nextPanel = document.getElementById('nextPanel');
  nowPanel.querySelector('.panel-title').textContent = I18N.t('now');
  nextPanel.querySelector('.panel-title').textContent = I18N.t('next');

  const render = (panel, item) => {
    panel.querySelector('.panel-label').textContent = item ? (item.label?.[I18N.getLang()] || item.label?.en || '') : '';
    panel.querySelector('img').src = item?.pictoUrl || 'images/placeholder.png';
  };
  render(nowPanel, nowItem);
  render(nextPanel, nextItem);
}

function runSchedule(preset) {
  let index = 0;
  renderPanels(preset.schedule[0], preset.schedule[1]);

  function advance() {
    index += 1;
    if (index >= preset.schedule.length) {
      showDone();
      return;
    }
    const nowItem = preset.schedule[index];
    const nextItem = preset.schedule[index + 1];
    renderPanels(nowItem, nextItem);
    if (preset.audio.enabled) Media.play(nowItem.audioUrl, preset.audio.volume);
  }

  const advanceBtn = document.getElementById('advanceBtn');
  advanceBtn.textContent = I18N.t('advance');
  advanceBtn.onclick = advance;
  if (pointerAdvance) {
    document.body.addEventListener('click', advance);
  }
}

function showDone() {
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-overlay';
  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = I18N.t('allDone');
  overlay.appendChild(label);
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.remove();
    window.location.href = 'index.html';
  }, 5000);
}

document.addEventListener('DOMContentLoaded', async () => {
  I18N.init();
  const preset = await Storage.loadPreset();
  UI.setPreset(preset);
  Input.init(preset.inputDefaults);
  Media.attachInteractionListeners();

  UI.renderTopBar(document.getElementById('top'), { title: I18N.t('schedule') });
  UI.setKeyEscape(() => window.location.href = 'index.html');
  pointerAdvance = preset.pointerAdvance || false;

  runSchedule(preset);
});
