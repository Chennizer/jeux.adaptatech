import { renderTopbar } from '../engine/ui.js';
import { loadPreset } from '../engine/storage.js';
import { t, getLang } from '../engine/i18n.js';
import { applyLangToAria, makeActivatable } from '../engine/input.js';

window.addEventListener('DOMContentLoaded', async () => {
  await renderTopbar();
  const lang = getLang();
  await loadPreset();
  document.getElementById('title').textContent = 'Routine Engine';
  const tiles = [
    { href: './hello.html', key: 'hello', icon: '👋' },
    { href: './hello.html?mode=attendance', key: 'attendance', icon: '✅' },
    { href: './schedule.html', key: 'schedule', icon: '🗓️' },
    { href: './transitions.html', key: 'transitions', icon: '🔄' },
    { href: '#calm', key: 'calm', icon: '🌙', action: () => window.showCalm() },
    { href: './edit.html', key: 'edit', icon: '✏️' }
  ];
  const tilesEl = document.getElementById('tiles');
  tilesEl.innerHTML = tiles.map((item, idx) => {
    return `<button class="tile" data-activatable="true" data-i18n="${item.key}" data-idx="${idx}" aria-label="${t(item.key, lang)}"><div style="font-size:3rem">${item.icon}</div><div>${t(item.key, lang)}</div></button>`;
  }).join('');
  document.querySelectorAll('.tile').forEach((btn, idx) => {
    const item = tiles[idx];
    makeActivatable(btn, async () => {
      if (item.action) { item.action(); return; }
      window.location.href = item.href;
    });
  });
  applyLangToAria();
});
