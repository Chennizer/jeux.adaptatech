import I18N, { I18N_STRINGS } from './i18n.js';
import Input from './input.js';
import Storage from './storage.js';

const UI = (() => {
  let preset = null;
  let onChangeHandlers = [];

  function setPreset(p) {
    preset = p;
  }

  function onChange(cb) {
    onChangeHandlers.push(cb);
  }

  function emitChange() {
    onChangeHandlers.forEach((cb) => cb(preset));
  }

  function updateLangButtons(container) {
    container.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === I18N.getLang());
    });
  }

  function renderTopBar(container, options = {}) {
    container.innerHTML = '';
    const bar = document.createElement('div');
    bar.className = 'top-bar';

    const leftGroup = document.createElement('div');
    leftGroup.className = 'top-group';

    const backBtn = document.createElement('button');
    backBtn.className = 'top-btn';
    backBtn.textContent = '⬅ ' + I18N.t('back');
    backBtn.ariaLabel = I18N.t('back');
    backBtn.addEventListener('click', () => {
      if (options.onBack) options.onBack();
      else window.location.href = 'index.html';
    });
    leftGroup.appendChild(backBtn);

    const title = document.createElement('div');
    title.className = 'top-title';
    title.textContent = options.title || '';
    leftGroup.appendChild(title);

    const langGroup = document.createElement('div');
    langGroup.className = 'top-group';
    ['fr', 'en', 'ja'].forEach((lang) => {
      const btn = document.createElement('button');
      btn.className = 'top-btn';
      btn.dataset.lang = lang;
      btn.textContent = lang.toUpperCase();
      btn.ariaLabel = I18N_STRINGS[lang].languageName;
      btn.addEventListener('click', () => {
        I18N.setLang(lang);
        if (preset) {
          preset.languageDefault = lang;
          Storage.savePreset(preset);
        }
        updateLangButtons(langGroup);
        emitChange();
      });
      langGroup.appendChild(btn);
    });

    const inputGroup = document.createElement('div');
    inputGroup.className = 'top-group';
    const touchBtn = document.createElement('button');
    touchBtn.className = 'top-btn';
    touchBtn.textContent = I18N.t('touch');
    touchBtn.addEventListener('click', () => {
      Input.setMode('touch');
      if (preset) {
        preset.inputDefaults.mode = 'touch';
        Storage.savePreset(preset);
      }
      updateInputButtons(inputGroup);
    });
    const dwellBtn = document.createElement('button');
    dwellBtn.className = 'top-btn';
    dwellBtn.textContent = I18N.t('dwell');
    dwellBtn.addEventListener('click', () => {
      Input.setMode('dwell');
      if (preset) {
        preset.inputDefaults.mode = 'dwell';
        Storage.savePreset(preset);
      }
      updateInputButtons(inputGroup);
    });
    inputGroup.append(touchBtn, dwellBtn);

    const dwellLabel = document.createElement('label');
    dwellLabel.className = 'top-label';
    dwellLabel.textContent = `${I18N.t('dwellTime')}: `;
    const dwellSlider = document.createElement('input');
    dwellSlider.type = 'range';
    dwellSlider.min = 500;
    dwellSlider.max = 3000;
    dwellSlider.step = 100;
    dwellSlider.value = Input.getSettings().dwellMs;
    dwellSlider.addEventListener('input', () => {
      const val = parseInt(dwellSlider.value, 10);
      Input.setDwell(val);
      if (preset) {
        preset.inputDefaults.dwellMs = val;
        Storage.savePreset(preset);
      }
      dwellValue.textContent = `${val}${I18N.t('dwellMs')}`;
    });
    const dwellValue = document.createElement('span');
    dwellValue.textContent = `${Input.getSettings().dwellMs}${I18N.t('dwellMs')}`;
    dwellLabel.append(dwellSlider, dwellValue);

    const volumeLabel = document.createElement('label');
    volumeLabel.className = 'top-label';
    volumeLabel.textContent = `${I18N.t('volume')}: `;
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = 0.1;
    volumeSlider.value = preset?.audio?.volume ?? 0.8;
    volumeSlider.addEventListener('input', () => {
      if (preset) {
        preset.audio.volume = parseFloat(volumeSlider.value);
        Storage.savePreset(preset);
      }
    });
    const muteBtn = document.createElement('button');
    muteBtn.className = 'top-btn';
    muteBtn.textContent = I18N.t('mute');
    muteBtn.addEventListener('click', () => {
      if (preset) {
        preset.audio.enabled = !preset.audio.enabled;
        Storage.savePreset(preset);
        muteBtn.classList.toggle('active', !preset.audio.enabled);
      }
    });
    volumeLabel.append(volumeSlider);

    bar.append(leftGroup, langGroup, inputGroup, dwellLabel, volumeLabel, muteBtn);
    container.appendChild(bar);

    updateLangButtons(langGroup);
    updateInputButtons(inputGroup);
  }

  function updateInputButtons(group) {
    const mode = Input.getSettings().mode;
    group.querySelectorAll('.top-btn').forEach((btn) => {
      const isDwell = btn.textContent === I18N.t('dwell');
      const isTouch = btn.textContent === I18N.t('touch');
      btn.classList.toggle('active', (isDwell && mode === 'dwell') || (isTouch && mode === 'touch'));
    });
  }

  function setKeyEscape(handler) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') handler();
    });
  }

  function renderCalmOverlay(container) {
    const overlay = document.createElement('div');
    overlay.className = 'calm-overlay';
    overlay.textContent = '🌙';
    overlay.addEventListener('click', () => overlay.remove());
    container.appendChild(overlay);
  }

  return { renderTopBar, setPreset, onChange, setKeyEscape, renderCalmOverlay };
})();

export default UI;
