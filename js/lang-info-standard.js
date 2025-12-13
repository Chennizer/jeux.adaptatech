(function(){
  const STYLE_ID = 'lang-info-standard-style';
  const STYLE_RULES = `
    #langToggle {
      position: fixed;
      top: 14px;
      right: 44px;
      z-index: 11000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      border: 2px solid #04c8bb;
      background: #0b0f12;
      color: #04c8bb;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      box-shadow: 0 0 0 0 rgba(4, 200, 187, 0);
      transition: box-shadow 0.2s ease, transform 0.05s ease, background 0.2s ease;
      user-select: none;
    }
    #langToggle:hover { box-shadow: 0 0 0 3px rgba(4, 200, 187, 0.2); }
    #langToggle:active { transform: translateY(1px); }
    #infoButton {
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 12000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 2px solid #009688;
      background: #fff;
      color: #009688;
      font-weight: 700;
      cursor: pointer;
      user-select: none;
    }
    body.dark #infoButton { background: #111; color: #00b3a4; border-color: #00b3a4; }
  `;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLE_RULES;
    document.head.appendChild(style);
  }

  const SUPPORTED_LANGS = ['en', 'ja', 'fr'];
  const LS_KEY = 'siteLanguage';

  function detectLanguages() {
    const seen = new Set();
    document.querySelectorAll('[data-fr], [data-en], [data-ja]').forEach(el => {
      SUPPORTED_LANGS.forEach(code => {
        if (el.hasAttribute(`data-${code}`)) seen.add(code);
      });
    });
    return seen.size ? Array.from(seen) : SUPPORTED_LANGS;
  }

  function documentLangFallback(langs) {
    const htmlLang = (document.documentElement.lang || '').toLowerCase();
    return langs.includes(htmlLang) ? htmlLang : langs[0] || 'en';
  }

  function getText(el, lang, langs) {
    for (const code of [lang, ...langs.filter(c => c !== lang)]) {
      const val = el.getAttribute(`data-${code}`);
      if (val != null) return val;
    }
    return null;
  }

  function applyTranslations(lang, langs) {
    const safe = langs.includes(lang) ? lang : langs[0] || 'en';
    document.querySelectorAll('[data-fr], [data-en], [data-ja]').forEach(el => {
      const value = getText(el, safe, langs);
      if (value == null) return;
      if (['P','BUTTON','DIV','H1','H2','H3','SPAN'].includes(el.tagName)) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    document.documentElement.lang = safe;

    const titleEl = document.querySelector('title');
    if (titleEl) {
      const nextTitle = getText(titleEl, safe, langs);
      if (nextTitle) {
        titleEl.textContent = nextTitle;
        document.title = nextTitle;
      }
    }

    const toggle = document.getElementById('langToggle');
    if (toggle) {
      const idx = langs.indexOf(safe);
      const next = langs[(idx + 1) % langs.length];
      toggle.textContent = (next || '').toUpperCase();
      toggle.title = toggle.title || 'Change language';
    }
  }

  function setLang(lang, langs) {
    try { localStorage.setItem(LS_KEY, lang); } catch (e) {}
    applyTranslations(lang, langs);
  }

  function getInitialLang(langs) {
    let initial = documentLangFallback(langs);
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored && langs.includes(stored)) initial = stored;
    } catch (e) {}
    return initial;
  }

  function applyLangButtonStyle(btn) {
    btn.style.position = 'fixed';
    btn.style.top = '14px';
    btn.style.right = '44px';
    btn.style.zIndex = '11000';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.padding = '0.35rem 0.85rem';
    btn.style.borderRadius = '999px';
    btn.style.border = '2px solid #04c8bb';
    btn.style.background = '#0b0f12';
    btn.style.color = '#04c8bb';
    btn.style.fontWeight = '700';
    btn.style.letterSpacing = '0.02em';
    btn.style.cursor = 'pointer';
    btn.style.userSelect = 'none';
  }

  function ensureLangToggle(langs) {
    const existing = document.getElementById('langToggle') || document.getElementById('language-toggle');
    const btn = existing || document.createElement('button');
    btn.id = 'langToggle';
    btn.textContent = (langs[1] || langs[0] || 'EN').toUpperCase();
    btn.setAttribute('aria-label', 'Toggle language');
    applyLangButtonStyle(btn);
    if (!existing) {
      btn.title = 'Basculer la langue / Toggle language';
      document.body.appendChild(btn);
    }
    btn.addEventListener('click', () => {
      const current = (typeof localStorage !== 'undefined' && localStorage.getItem(LS_KEY)) || document.documentElement.lang || langs[0] || 'en';
      const idx = langs.indexOf(current.toLowerCase());
      const next = langs[(idx + 1) % langs.length];
      setLang(next, langs);
    });
    return btn;
  }

  function applyInfoButtonStyle(btn) {
    btn.style.position = 'fixed';
    btn.style.top = '10px';
    btn.style.left = '10px';
    btn.style.right = '';
    btn.style.zIndex = '12000';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.width = '40px';
    btn.style.height = '40px';
    btn.style.borderRadius = '10px';
    btn.style.border = '2px solid #009688';
    btn.style.background = '#fff';
    btn.style.color = '#009688';
    btn.style.fontWeight = '700';
    btn.style.cursor = 'pointer';
    btn.style.userSelect = 'none';
  }

  function ensureInfoButton() {
    const existing = document.getElementById('infoButton');
    const btn = existing || document.createElement('button');
    btn.id = 'infoButton';
    if (!existing) {
      btn.textContent = 'ⓘ';
      btn.classList.add('translate');
      btn.setAttribute('data-fr', 'ⓘ');
      btn.setAttribute('data-en', 'ⓘ');
      btn.title = "Plus d'infos";
      document.body.appendChild(btn);
    }
    applyInfoButtonStyle(btn);
    return btn;
  }

  function wireInfoModal(infoBtn) {
    const modal = document.getElementById('infoModal');
    const close = document.getElementById('closeModal');
    if (infoBtn && modal) {
      infoBtn.addEventListener('click', () => {
        modal.style.display = 'block';
      });
    }
    if (close && modal) {
      close.addEventListener('click', () => { modal.style.display = 'none'; });
    }
  }

  function hideMenusOnStart(infoBtn, langBtn) {
    const startBtn = document.getElementById('startButton');
    if (!startBtn) return;
    startBtn.addEventListener('click', () => {
      if (infoBtn) infoBtn.style.display = 'none';
      if (langBtn) langBtn.style.display = 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureStyle();
    const langs = detectLanguages();
    const langBtn = ensureLangToggle(langs);
    const infoBtn = ensureInfoButton();
    wireInfoModal(infoBtn);
    hideMenusOnStart(infoBtn, langBtn);
    setLang(getInitialLang(langs), langs);
  });
})();
