
var SUPPORTED_LANGUAGES = ['en', 'fr', 'ja'];

function normalizeLanguage(lang) {
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
}

function getLanguageLabel(lang) {
  if (lang === 'fr') return 'Français';
  if (lang === 'en') return 'English';
  if (lang === 'ja') return '日本語';
  return (lang || '').toUpperCase();
}

function getNextLanguage(current) {
  var lang = normalizeLanguage(current || 'en');
  var idx = SUPPORTED_LANGUAGES.indexOf(lang);
  return SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length];
}

function getStoredLanguage() {
  return normalizeLanguage(localStorage.getItem('siteLanguage') || document.documentElement.lang || 'en');
}

function resolveText(el, lang) {
  var preferred = [lang, 'en', 'fr'];
  for (var i = 0; i < preferred.length; i++) {
    var value = el.getAttribute('data-' + preferred[i]);
    if (value != null) return value;
  }
  return el.getAttribute('data-fr') || el.getAttribute('data-en') || el.textContent;
}

function updateLanguage() {
  var lang = getStoredLanguage();
  document.documentElement.lang = lang;
  localStorage.setItem('siteLanguage', lang);

  document.querySelectorAll('[data-fr]').forEach(function(el) {
    var text = resolveText(el, lang);
    if (text != null) {
      el.innerHTML = text;
    }
  });

  var nextLang = getNextLanguage(lang);
  var nextLabel = getLanguageLabel(nextLang);
  var toggleBtn = document.getElementById('language-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = nextLabel;
  }
  var langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.textContent = nextLabel;
  }
}

function toggleLanguage() {
  var current = getStoredLanguage();
  var newLang = getNextLanguage(current);
  localStorage.setItem('siteLanguage', newLang);
  updateLanguage();
}

document.addEventListener('DOMContentLoaded', function() {
  updateLanguage();

  var langToggle = document.getElementById('langToggle');
  if (langToggle && !langToggle.dataset.langHandlerAttached) {
    langToggle.addEventListener('click', function() {
      toggleLanguage();
    });
    langToggle.dataset.langHandlerAttached = 'true';
  }
});
