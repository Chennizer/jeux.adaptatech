function initEyegazeMenu(options = {}) {
  const overlay = document.getElementById('promptOverlay');
  const startButton = document.getElementById('startButton');
  const infoBtn = document.getElementById('infoButton');
  const infoModal = document.getElementById('infoModal');
  const closeModal = document.getElementById('closeModal');
  const settingsIcon = document.getElementById('settings-icon');
  const menu = document.getElementById('menu');
  let menuTimer = null;

  if (startButton) {
    startButton.addEventListener('click', () => {
      if (overlay) overlay.style.display = 'none';
      if (settingsIcon) settingsIcon.style.display = 'flex';
      if (typeof options.onStart === 'function') {
        options.onStart();
      }
    });
  }

  if (settingsIcon && menu) {
    settingsIcon.addEventListener('pointerup', () => {
      if (menu.classList.contains('show')) {
        hideMenu();
      } else {
        menu.classList.add('show');
        startMenuTimer();
      }
    });

    document.addEventListener('click', e => {
      if (!menu.contains(e.target) && !settingsIcon.contains(e.target)) {
        hideMenu();
      }
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

  function startMenuTimer() {
    clearMenuTimer();
    menuTimer = setTimeout(hideMenu, 8000);
  }

  function clearMenuTimer() {
    if (menuTimer !== null) {
      clearTimeout(menuTimer);
      menuTimer = null;
    }
  }

  function hideMenu() {
    if (menu) {
      menu.classList.remove('show');
    }
    clearMenuTimer();
  }
}
