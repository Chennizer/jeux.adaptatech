// translationonly.js
(() => {
  const SUPPORTED_LANGUAGES = ['fr', 'en', 'ja'];
  const STORAGE_KEY = 'siteLanguage';

  const LANGUAGE_LABELS = {
    fr: 'FR',
    en: 'EN',
    ja: 'JA',
  };

  function getStoredLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED_LANGUAGES.includes(saved)) {
        return saved;
      }
    } catch (e) {}

    const docLang = (document.documentElement.lang || '').toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(docLang)) {
      return docLang;
    }
    return 'fr';
  }

  function nextLanguage(currentLang = getStoredLanguage()) {
    const idx = SUPPORTED_LANGUAGES.indexOf(currentLang);
    return SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length];
  }

  function translateElement(el, lang) {
    const fallbackOrder = [lang, ...SUPPORTED_LANGUAGES.filter((code) => code !== lang)];

    for (const code of fallbackOrder) {
      const text = el.getAttribute(`data-${code}`);
      if (text != null) {
        el.innerHTML = text;
        break;
      }
    }

    if (el.hasAttribute('data-fr-placeholder') || el.hasAttribute('data-en-placeholder') || el.hasAttribute('data-ja-placeholder')) {
      for (const code of fallbackOrder) {
        const placeholder = el.getAttribute(`data-${code}-placeholder`);
        if (placeholder != null) {
          el.setAttribute('placeholder', placeholder);
          break;
        }
      }
    }
  }

  function syncToggleButton(lang) {
    const btn = document.getElementById('langToggle') || document.getElementById('language-toggle') || document.getElementById('lang-toggle');
    if (!btn) return;
    btn.textContent = LANGUAGE_LABELS[lang] || lang.toUpperCase();
    const next = nextLanguage(lang);
    btn.setAttribute('aria-label', `Switch language (${LANGUAGE_LABELS[next] || next.toUpperCase()})`);
    btn.title = 'Basculer la langue / Toggle language / 言語切替';
  }

  function updateLanguage() {
    const lang = getStoredLanguage();
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-fr], [data-en], [data-ja]').forEach((el) => {
      translateElement(el, lang);
    });

    syncToggleButton(lang);
    return lang;
  }

  function ensureLanguageToggle() {
    const existing = document.getElementById('langToggle') || document.getElementById('language-toggle') || document.getElementById('lang-toggle');
    if (existing) return existing;

    const btn = document.createElement('button');
    btn.id = 'langToggle';
    btn.type = 'button';
    btn.style.position = 'fixed';
    btn.style.top = '10px';
    btn.style.right = '10px';
    btn.style.zIndex = '99999';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.minWidth = '48px';
    btn.style.padding = '6px 10px';
    btn.style.borderRadius = '10px';
    btn.style.border = '2px solid #009688';
    btn.style.background = '#ffffff';
    btn.style.color = '#009688';
    btn.style.fontWeight = '700';
    btn.style.cursor = 'pointer';

    btn.addEventListener('click', () => {
      const next = nextLanguage();
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {}
      updateLanguage();
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: next } }));
    });

    document.body.appendChild(btn);
    return btn;
  }

  window.LANGUAGE_LABELS = LANGUAGE_LABELS;
  window.getStoredLanguage = getStoredLanguage;
  window.nextLanguage = nextLanguage;
  window.updateLanguage = updateLanguage;

  document.addEventListener('DOMContentLoaded', () => {
    ensureLanguageToggle();
    updateLanguage();
  });
})();
