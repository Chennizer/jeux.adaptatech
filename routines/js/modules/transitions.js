import I18N from '../engine/i18n.js';
import Storage from '../engine/storage.js';
import UI from '../engine/ui.js';
import Input from '../engine/input.js';
import Media from '../engine/media.js';

function renderTransitions(preset) {
  const grid = document.getElementById('transitionGrid');
  grid.innerHTML = '';
  preset.transitions.forEach((t) => {
    const btn = document.createElement('button');
    btn.className = 'card';
    const img = document.createElement('img');
    img.src = t.pictoUrl;
    const label = document.createElement('div');
    label.textContent = t.labelKey ? I18N.t(t.labelKey) : (t.label?.[I18N.getLang()] || t.label?.en || '');
    btn.append(img, label);
    btn.addEventListener('click', () => showCue(t, preset));
    grid.appendChild(btn);
  });
  Input.bindAll(grid);
}

function showCue(transition, preset) {
  const existing = document.querySelector('.fullscreen-overlay');
  if (existing && transition.behavior === 'toggle') {
    existing.remove();
    return;
  }
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-overlay';
  const img = document.createElement('img');
  img.src = transition.pictoUrl;
  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = transition.labelKey ? I18N.t(transition.labelKey) : (transition.label?.[I18N.getLang()] || transition.label?.en || '');
  overlay.append(img, label);
  document.body.appendChild(overlay);
  if (preset.audio.enabled) Media.play(transition.audioUrl, preset.audio.volume);
  if (transition.behavior === 'momentary') {
    setTimeout(() => overlay.remove(), transition.durationMs || 3000);
  } else {
    overlay.addEventListener('click', () => overlay.remove());
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  I18N.init();
  const preset = await Storage.loadPreset();
  UI.setPreset(preset);
  Input.init(preset.inputDefaults);
  Media.attachInteractionListeners();

  UI.renderTopBar(document.getElementById('top'), { title: I18N.t('transitionsTitle') });
  UI.setKeyEscape(() => window.location.href = 'index.html');

  renderTransitions(preset);
});
