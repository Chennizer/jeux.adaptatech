import { renderTopbar, localizedLabel } from '../engine/ui.js';
import { loadPreset } from '../engine/storage.js';
import { t, getLang } from '../engine/i18n.js';
import { makeActivatable } from '../engine/input.js';
import { playAudio } from '../engine/media.js';

window.addEventListener('DOMContentLoaded', async () => {
  await renderTopbar();
  const lang = getLang();
  const preset = await loadPreset();
  const grid = document.getElementById('transition-grid');
  preset.transitions.forEach(tr => {
    const btn = document.createElement('button');
    btn.className = 'tile';
    btn.dataset.activatable = 'true';
    btn.innerHTML = `<img src="${tr.pictoUrl}" alt=""><div>${localizedLabel(tr, lang)}</div>`;
    makeActivatable(btn, () => handleTransition(tr, lang, preset.audio.volume));
    grid.appendChild(btn);
  });
});

let activeToggle = null;
function handleTransition(tr, lang, volume) {
  const overlay = document.getElementById('overlay');
  const label = localizedLabel(tr, lang);
  overlay.querySelector('img').src = tr.pictoUrl;
  overlay.querySelector('.big-label').textContent = label;
  playAudio(tr.audioUrl, volume);
  if (tr.behavior === 'toggle') {
    if (activeToggle === tr.id) {
      overlay.classList.remove('active');
      activeToggle = null;
      return;
    }
    activeToggle = tr.id;
    overlay.classList.add('active');
  } else {
    overlay.classList.add('active');
    setTimeout(() => overlay.classList.remove('active'), tr.durationMs || 3000);
  }
}
