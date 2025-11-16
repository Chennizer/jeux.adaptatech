
const SUPPORTED_LANGUAGES = ['en', 'ja', 'fr'];
const LANGUAGE_LABELS = { en: 'EN', fr: 'FR', ja: '日本語' };

function getStoredLanguage() {
  const stored = localStorage.getItem('siteLanguage') || document.documentElement.lang || 'en';
  return SUPPORTED_LANGUAGES.includes(stored) ? stored : 'en';
}

function nextLanguage(lang) {
  const currentIndex = SUPPORTED_LANGUAGES.indexOf(lang);
  return SUPPORTED_LANGUAGES[(currentIndex + 1) % SUPPORTED_LANGUAGES.length];
}

function getElementContent(el, lang) {
  const languageOrder = [lang, ...SUPPORTED_LANGUAGES.filter(code => code !== lang)];
  for (const code of languageOrder) {
    const text = el.getAttribute('data-' + code);
    if (text != null) {
      return text;
    }
  }
  return null;
}

// Update every element with data-fr/data-en/data-ja attribute based on the stored language.
function updateLanguage() {
  const lang = getStoredLanguage();
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-fr], [data-en], [data-ja]').forEach(function(el) {
    const content = getElementContent(el, lang);
    if (content != null) {
      el.innerHTML = content;
    }
  });

  document.querySelectorAll('#language-toggle, #langToggle').forEach(function(toggleBtn) {
    const label = LANGUAGE_LABELS[nextLanguage(lang)] || nextLanguage(lang).toUpperCase();
    toggleBtn.textContent = label;
    toggleBtn.classList.toggle('lang-ja-label', label === LANGUAGE_LABELS.ja);
  });
}

// Cycle language between English, French, and Japanese.
function toggleLanguage() {
  const current = getStoredLanguage();
  const newLang = nextLanguage(current);
  localStorage.setItem('siteLanguage', newLang);
  updateLanguage();
}

document.addEventListener('DOMContentLoaded', updateLanguage);
