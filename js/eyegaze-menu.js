window.eyegazeSettings = {
  dwellTime: parseInt(localStorage.getItem('eyegazeDwellTime')) || 1500,
  sfxMuted: false,
  sfxVolume: 50,
  hideOverlay: function() {
    const overlay = document.getElementById('promptOverlay');
    if (overlay) overlay.style.display = 'none';
    const icon = document.getElementById('settings-icon');
    if (icon) icon.style.display = 'flex';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const infoBtn = document.getElementById('infoButton');
  const infoModal = document.getElementById('infoModal');
  const closeModal = document.getElementById('closeModal');
  const settingsIcon = document.getElementById('settings-icon');
  const menu = document.getElementById('menu');
  const dwellSlider = document.getElementById('dwellTimeSlider');
  const dwellVal = document.getElementById('dwellTimeVal');
  const muteSFX = document.getElementById('muteSFX');
  const sfxSlider = document.getElementById('sfxVol');
  const sfxVal = document.getElementById('sfxVolVal');

  if (infoBtn && infoModal && closeModal) {
    infoBtn.addEventListener('click', () => {
      infoModal.style.display = 'block';
    });
    closeModal.addEventListener('click', () => {
      infoModal.style.display = 'none';
    });
  }

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
