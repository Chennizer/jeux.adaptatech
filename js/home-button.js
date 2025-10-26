(function() {
  function determineHomeTarget() {
    const body = document.body;
    if (body && body.dataset && body.dataset.homeTarget) {
      return body.dataset.homeTarget;
    }
    const path = window.location.pathname || '';
    if (path.includes('/switch/')) {
      return '../index.html';
    }
    if (path.includes('/pov/')) {
      return '../index.html';
    }
    return null;
  }

  function getLabelForLanguage(lang) {
    return lang === 'fr' ? 'Retour au menu précédent' : 'Back to previous menu';
  }

  function updateButtonLabel(button) {
    const lang = localStorage.getItem('siteLanguage') || 'en';
    const label = getLabelForLanguage(lang);
    button.title = label;
    button.setAttribute('aria-label', label);
  }

  document.addEventListener('DOMContentLoaded', function() {
    const target = determineHomeTarget();
    if (!target) {
      return;
    }

    if (document.querySelector('.floating-button.home-button')) {
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'floating-button home-button';
    button.textContent = '🏠';

    updateButtonLabel(button);

    button.addEventListener('click', function() {
      window.location.href = target;
    });

    document.body.appendChild(button);

    const originalToggle = typeof window.toggleLanguage === 'function' ? window.toggleLanguage : null;
    window.toggleLanguage = function() {
      if (originalToggle) {
        originalToggle.apply(this, arguments);
      }
      updateButtonLabel(button);
    };

    window.addEventListener('storage', function(event) {
      if (event.key === 'siteLanguage') {
        updateButtonLabel(button);
      }
    });
  });
})();
