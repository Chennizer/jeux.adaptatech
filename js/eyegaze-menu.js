window.eyegazeSettings = {
  dwellTime: 1500,
  sfxMuted: false,
  sfxVolume: 50,
  hideOverlay: function() {
    const overlay = document.getElementById('promptOverlay');
    if (overlay) overlay.style.display = 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const infoBtn = document.getElementById('infoButton');
  const infoModal = document.getElementById('infoModal');
  const closeModal = document.getElementById('closeModal');
  const dwellSlider = document.getElementById('dwellTimeSlider');
  const dwellVal = document.getElementById('dwellTimeVal');

  const stored = localStorage.getItem('eyegazeDwellTime');
  if (dwellSlider && dwellVal) {
    const initial = stored ? parseInt(stored) : parseInt(dwellSlider.value);
    dwellSlider.value = initial;
    dwellVal.textContent = initial;
    eyegazeSettings.dwellTime = initial;
    dwellSlider.addEventListener('input', e => {
      const val = parseInt(e.target.value);
      eyegazeSettings.dwellTime = val;
      dwellVal.textContent = val;
      localStorage.setItem('eyegazeDwellTime', val);
    });
  }

  if (infoBtn && infoModal && closeModal) {
    infoBtn.addEventListener('click', () => {
      infoModal.style.display = 'block';
    });
    closeModal.addEventListener('click', () => {
      infoModal.style.display = 'none';
    });
  }
});
