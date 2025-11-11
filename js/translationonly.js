// translateStatic.js
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

document.addEventListener('DOMContentLoaded', () => {
  const userLang = localStorage.getItem('siteLanguage') || 'en';
  // For each element that has data-fr (or data-en),
  // set its .innerHTML to the correct language attribute.
  document.querySelectorAll('[data-fr]').forEach(el => {
    const text = el.getAttribute(`data-${userLang}`);
    if (text != null) {
      el.innerHTML = text;
    }
  });

  if (typeof window.createHomeButton === 'function') {
    window.createHomeButton();
  }
});
