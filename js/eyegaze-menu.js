window.eyegazeSettings = {
  dwellTime: parseInt(localStorage.getItem('eyegazeDwellTime')) || 1500,
  sfxMuted: false,
  sfxVolume: 50,
  hideOverlay: function() {
    const overlay = document.getElementById('game-options');
    if (overlay) overlay.style.display = 'none';
  }
};
function initEyegazeMenu() {
  const dwellSlider = document.getElementById('dwellTimeSlider');
  const dwellVal = document.getElementById('dwellTimeVal');
  const muteSFX = document.getElementById('muteSFX');
  const sfxSlider = document.getElementById('sfxVol');
  const sfxVal = document.getElementById('sfxVolVal');

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
    sfxSlider.value = eyegazeSettings.sfxVolume;
    sfxVal.textContent = sfxSlider.value;
    sfxSlider.addEventListener('input', e => {
      const val = parseInt(e.target.value);
      eyegazeSettings.sfxVolume = val;
      sfxVal.textContent = val;
    });
  }
}
