import { LANGS, t, getLang, setLang } from './i18n.js';
import { getInputState, setMode, setDwell } from './input.js';
import { loadPreset, savePreset } from './storage.js';

export async function renderTopbar(options = {}) {
  const preset = await loadPreset();
  const lang = getLang() || preset.languageDefault;
  setLang(lang);
  document.documentElement.lang = lang;
  setHighContrast(preset.ui?.highContrast);
  const { mode, dwellMs } = getInputState();
  const topbar = document.createElement('div');
  topbar.className = 'topbar';
  topbar.innerHTML = `
    <div class="group">
      <label>${t('language', lang)}</label>
      <select id="lang-select">${LANGS.map(l => `<option value="${l}" ${l === lang ? 'selected' : ''}>${l.toUpperCase()}</option>`).join('')}</select>
    </div>
    <div class="group">
      <label>${t('inputMode', lang)}</label>
      <select id="input-mode">
        <option value="touch" ${mode === 'touch' ? 'selected' : ''}>${t('touchMode', lang)}</option>
        <option value="dwell" ${mode === 'dwell' ? 'selected' : ''}>${t('dwellMode', lang)}</option>
      </select>
      <label for="dwell-slider">${t('dwellMs', lang)}</label>
      <input type="range" id="dwell-slider" min="500" max="3000" step="100" value="${dwellMs}" ${mode === 'dwell' ? '' : 'disabled'}>
      <span id="dwell-value">${dwellMs}ms</span>
    </div>
    <div class="group">
      <label>${t('volume', lang)}</label>
      <input type="range" id="volume-slider" min="0" max="1" step="0.05" value="${preset.audio.volume}">
      <button id="mute-btn" data-i18n="mute">${t('mute', lang)}</button>
    </div>
    <button id="back-btn" data-i18n="back">${t('back', lang)}</button>
  `;
  document.body.prepend(topbar);

  document.getElementById('lang-select').addEventListener('change', (e) => { setLang(e.target.value); location.reload(); });
  document.getElementById('input-mode').addEventListener('change', (e) => {
    setMode(e.target.value);
    location.reload();
  });
  document.getElementById('dwell-slider').addEventListener('input', (e) => {
    const val = Number(e.target.value); setDwell(val); document.getElementById('dwell-value').textContent = `${val}ms`; });
  document.getElementById('mute-btn').addEventListener('click', () => {
    preset.audio.enabled = !preset.audio.enabled;
    savePreset(preset);
  });
  document.getElementById('volume-slider').addEventListener('input', (e) => {
    preset.audio.volume = Number(e.target.value); savePreset(preset);
  });
  document.getElementById('back-btn').addEventListener('click', () => {
    if (options.confirmOnBack && !confirm(t('confirmExit', lang))) return;
    window.location.href = './index.html';
  });

}

export function setHighContrast(enabled) {
  document.body.classList.toggle('high-contrast', enabled);
}

export function localizedLabel(item, lang = getLang()) {
  if (item.labelKey) return t(item.labelKey, lang);
  return item.label?.[lang] || item.label?.en || '';
}

