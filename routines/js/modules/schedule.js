import { renderTopbar, localizedLabel } from '../engine/ui.js';
import { loadPreset } from '../engine/storage.js';
import { t, getLang } from '../engine/i18n.js';
import { makeActivatable } from '../engine/input.js';
import { playAudio } from '../engine/media.js';

let position = 0;

window.addEventListener('DOMContentLoaded', async () => {
  await renderTopbar();
  const lang = getLang();
  const preset = await loadPreset();
  document.getElementById('advance').textContent = t('advance', lang);
  renderPanels(preset, lang);
  makeActivatable(document.getElementById('advance'), () => advance(preset, lang));
});

function renderPanels(preset, lang) {
  const now = preset.schedule[position];
  const next = preset.schedule[position + 1];
  renderPanel(document.getElementById('panel-now'), now, t('now', lang), lang);
  renderPanel(document.getElementById('panel-next'), next, t('next', lang), lang);
}

function renderPanel(panelEl, item, title, lang) {
  if (!item) { panelEl.innerHTML = `<div class="section-title">${title}</div><div>${t('allDone', lang)}</div>`; return; }
  panelEl.innerHTML = `<div class="section-title">${title}</div><img src="${item.pictoUrl}" alt=""><div class="big-label">${localizedLabel(item, lang)}</div>`;
}

function advance(preset, lang) {
  playAudio(preset.schedule[position]?.audioUrl, preset.audio.volume);
  position++;
  if (position >= preset.schedule.length) {
    const overlay = document.getElementById('done');
    overlay.querySelector('.big-label').textContent = t('allDone', lang);
    overlay.classList.add('active');
    setTimeout(() => { overlay.classList.remove('active'); window.location.href = './index.html'; }, 5000);
    return;
  }
  renderPanels(preset, lang);
}
