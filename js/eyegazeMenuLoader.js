async function loadEyegazeMenu(options = {}) {
  const resp = await fetch('/game-menu.html');
  const html = await resp.text();
  const placeholder = document.getElementById('menu-placeholder');
  if (placeholder) {
    placeholder.innerHTML = html;
    if (options.title) {
      document.getElementById('options-main-title').textContent = options.title;
    }
    if (options.customOptions) {
      document.getElementById('custom-options').innerHTML = options.customOptions;
    }
    if (options.startButtonText) {
      const btn = document.getElementById('startButton');
      if (btn) btn.textContent = options.startButtonText;
    }
  }
}
