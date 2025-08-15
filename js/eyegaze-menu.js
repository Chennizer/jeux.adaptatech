window.eyegazeSettings = {
  dwellTime: parseInt(localStorage.getItem('eyegazeDwellTime')) || 1500,
  sfxMuted: false,
  sfxVolume: 50,
  hideOverlay: function() {
    const overlay = document.getElementById('game-options');
    if (overlay) overlay.style.display = 'none';
    const icon = document.getElementById('settings-icon');
    if (icon) icon.style.display = 'flex';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const settingsIcon = document.getElementById('settings-icon');
  const menu = document.getElementById('menu');
  const dwellSlider = document.getElementById('fixation-time');
  const dwellVal = document.getElementById('fixation-time-value');
  const muteSFX = document.getElementById('muteSFX');
  const sfxSlider = document.getElementById('sfxVol');
  const sfxVal = document.getElementById('sfxVolVal');

  if (settingsIcon && menu) {
    settingsIcon.addEventListener('click', () => {
      menu.classList.toggle('show');
    });
  }

  if (dwellSlider && dwellVal) {
    const initial = eyegazeSettings.dwellTime;
    dwellSlider.value = initial;
    dwellVal.textContent = initial;
    dwellSlider.addEventListener('input', e => {
      const val = parseInt(e.target.value);
      eyegazeSettings.dwellTime = val;
      dwellVal.textContent = val;
      localStorage.setItem('eyegazeDwellTime', val);
    });
  }

  if (muteSFX) {
    muteSFX.addEventListener('change', e => {
      eyegazeSettings.sfxMuted = e.target.checked;
    });
  }

  if (sfxSlider && sfxVal) {
    sfxSlider.addEventListener('input', e => {
      eyegazeSettings.sfxVolume = parseInt(e.target.value);
      sfxVal.textContent = e.target.value;
    });
  }
});
