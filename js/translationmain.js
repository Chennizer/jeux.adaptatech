
// Update every element with data-fr attribute based on the stored language.
function updateLanguage() {
  var lang = localStorage.getItem('siteLanguage') || 'en';
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-fr]').forEach(function(el) {
    el.innerHTML = el.getAttribute('data-' + lang);
  });
  var toggleBtn = document.getElementById('language-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = (lang === 'fr') ? 'English' : 'Français';
  }
}
// Toggle language between French and English.
function toggleLanguage() {
  var current = localStorage.getItem('siteLanguage') || 'en';
  var newLang = (current === 'fr') ? 'en' : 'fr';
  localStorage.setItem('siteLanguage', newLang);
  updateLanguage();
}

if (typeof window.createHomeButton !== 'function') {
  window.createHomeButton = function createHomeButton() {
    const segments = window.location.pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return;
    }

    if (segments[segments.length - 1].includes('.')) {
      segments.pop();
    }

    if (segments.length === 0) {
      return;
    }

    if (document.querySelector('.floating-button.home-button')) {
      return;
    }

    const homeButton = document.createElement('a');
    homeButton.className = 'floating-button home-button';
    homeButton.href = '../index.html';
    homeButton.title = 'Retour / Back';
    homeButton.setAttribute('aria-label', 'Retour au menu précédent / Back to previous menu');
    homeButton.textContent = '🏠';

    document.body.appendChild(homeButton);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  updateLanguage();

  if (typeof window.createHomeButton === 'function') {
    window.createHomeButton();
  }
});
