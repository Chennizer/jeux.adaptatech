const EYEGazeLangs = ['fr', 'en', 'ja'];
let eyegazeMenuLang = localStorage.getItem('eyegazeMenuLang') || 'fr';

function applyEyegazeTranslations(lang, scope = document) {
  const targetLang = EYEGazeLangs.includes(lang) ? lang : 'fr';
  document.documentElement.lang = targetLang;
  scope.querySelectorAll('.translate').forEach(el => {
    const text = el.dataset[targetLang];
    if (text !== undefined) {
      el.textContent = text;
    }
    const placeholder = el.dataset[`${targetLang}Placeholder`];
    if (placeholder !== undefined) {
      el.setAttribute('placeholder', placeholder);
    }
    const title = el.dataset[`${targetLang}Title`];
    if (title !== undefined) {
      el.setAttribute('title', title);
    }
    const aria = el.dataset[`${targetLang}AriaLabel`];
    if (aria !== undefined) {
      el.setAttribute('aria-label', aria);
    }
  });

  const toggle = document.getElementById('langToggle');
  if (toggle) {
    const next = EYEGazeLangs[(EYEGazeLangs.indexOf(targetLang) + 1) % EYEGazeLangs.length];
    toggle.textContent = targetLang.toUpperCase();
    toggle.setAttribute('title', `Change language (${next.toUpperCase()})`);
  }
}

function attachEyegazeLangToggle() {
  if (document.getElementById('langToggle')) return;
  const btn = document.createElement('button');
  btn.id = 'langToggle';
  btn.style.position = 'fixed';
  btn.style.top = '10px';
  btn.style.right = '10px';
  btn.style.zIndex = '100000';
  btn.style.padding = '6px 10px';
  btn.style.borderRadius = '10px';
  btn.style.border = '2px solid #009688';
  btn.style.background = '#fff';
  btn.style.color = '#009688';
  btn.style.fontWeight = '700';
  btn.style.cursor = 'pointer';
  btn.style.userSelect = 'none';
  btn.addEventListener('click', () => {
    const idx = EYEGazeLangs.indexOf(eyegazeMenuLang);
    eyegazeMenuLang = EYEGazeLangs[(idx + 1) % EYEGazeLangs.length];
    localStorage.setItem('eyegazeMenuLang', eyegazeMenuLang);
    applyEyegazeTranslations(eyegazeMenuLang);
  });
  document.body.appendChild(btn);
}

async function loadEyegazeMenu(options = {}) {
  const resp = await fetch('../../game-menu.html');
  const html = await resp.text();
  const placeholder = document.getElementById('menu-placeholder');
  if (placeholder) {
    placeholder.innerHTML = html;
    const titleEl = document.getElementById('options-main-title');
    if (options.titleTranslations) {
      titleEl.classList.add('translate');
      Object.entries(options.titleTranslations).forEach(([key, val]) => titleEl.dataset[key] = val);
      titleEl.textContent = options.titleTranslations[eyegazeMenuLang] || options.titleTranslations.fr || '';
    } else if (options.title) {
      titleEl.textContent = options.title;
    }
    if (options.customOptions) {
      document.getElementById('custom-options').innerHTML = options.customOptions;
    }
    if (options.startButtonTranslations) {
      const btn = document.getElementById('startButton');
      btn.classList.add('translate');
      Object.entries(options.startButtonTranslations).forEach(([key, val]) => btn.dataset[key] = val);
    } else if (options.startButtonText) {
      const btn = document.getElementById('startButton');
      if (btn) btn.textContent = options.startButtonText;
    }
    attachEyegazeLangToggle();
    applyEyegazeTranslations(eyegazeMenuLang, placeholder);
  }
}

window.applyEyegazeTranslations = applyEyegazeTranslations;
