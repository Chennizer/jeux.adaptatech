import I18N from './i18n.js';
import Input from './input.js';
import Media from './media.js';
import Storage from './storage.js';

const UI = (() => {
  const renderTopbar = (options = {}) => {
    const bar = document.createElement('div');
    bar.className = 'topbar';
    const langSelect = document.createElement('select');
    ['fr','en','ja'].forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang; opt.textContent = lang.toUpperCase();
      if (I18N.current() === lang) opt.selected = true;
      langSelect.appendChild(opt);
    });
    langSelect.addEventListener('change', () => { I18N.setLanguage(langSelect.value); location.reload(); });
    langSelect.setAttribute('aria-label', I18N.t('language'));

    const inputSelect = document.createElement('select');
    inputSelect.innerHTML = `<option value="touch">${I18N.t('touch')}</option><option value="dwell">${I18N.t('dwell')}</option>`;
    inputSelect.value = Input.getMode();
    inputSelect.addEventListener('change', () => { Input.setMode(inputSelect.value); location.reload(); });
    inputSelect.setAttribute('aria-label', I18N.t('input'));

    const dwellWrap = document.createElement('div');
    dwellWrap.style.display = inputSelect.value === 'dwell' ? 'block' : 'none';
    const dwellLabel = document.createElement('label');
    dwellLabel.textContent = `${I18N.t('dwellTime')}: `;
    const dwellRange = document.createElement('input');
    dwellRange.type = 'range'; dwellRange.min = 500; dwellRange.max = 3000; dwellRange.step = 100; dwellRange.value = Input.getDwell();
    dwellRange.addEventListener('input', () => { Input.setDwell(Number(dwellRange.value)); document.documentElement.style.setProperty('--dwell', `${dwellRange.value}ms`); });
    dwellWrap.append(dwellLabel, dwellRange);

    inputSelect.addEventListener('change', () => {
      dwellWrap.style.display = inputSelect.value === 'dwell' ? 'block' : 'none';
    });

    const audioToggle = document.createElement('button');
    const syncAudio = () => { audioToggle.textContent = Media.audioEnabled ? `${I18N.t('volume')} ${(Media.volume*100).toFixed(0)}%` : I18N.t('mute'); };
    audioToggle.addEventListener('click', () => {
      Media.setAudio(!Media.audioEnabled, Media.volume);
      syncAudio();
    });
    syncAudio();
    audioToggle.setAttribute('aria-label', I18N.t('volume'));

    const volumeRange = document.createElement('input');
    volumeRange.type = 'range'; volumeRange.min = 0; volumeRange.max = 1; volumeRange.step = 0.05; volumeRange.value = Media.volume;
    volumeRange.addEventListener('input', () => { Media.setAudio(Media.audioEnabled, Number(volumeRange.value)); syncAudio(); });

    const backBtn = document.createElement('button');
    backBtn.textContent = I18N.t('back');
    backBtn.onclick = () => {
      if (options.confirmExit && !options.confirmExit()) return;
      window.location.href = './index.html';
    };
    backBtn.setAttribute('aria-label', I18N.t('back'));

    const controlsLeft = document.createElement('div');
    controlsLeft.className = 'controls';
    controlsLeft.append(backBtn);

    const controlsRight = document.createElement('div');
    controlsRight.className = 'controls';
    controlsRight.append(langSelect, inputSelect, dwellWrap, audioToggle, volumeRange);

    bar.append(controlsLeft, controlsRight);
    document.body.prepend(bar);
  };

  const applyTheme = preset => {
    if (preset?.ui?.highContrast) document.body.classList.add('high-contrast');
  };

  return { renderTopbar, applyTheme };
})();

export default UI;
