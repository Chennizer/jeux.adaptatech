
var AdaptatechHomeButton = window.AdaptatechHomeButton || (function() {
  function ensureFloatingButtonStyles() {
    if (document.getElementById('floating-button-style')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'floating-button-style';
    style.textContent = '
      .floating-button-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column-reverse;
        gap: 12px;
        align-items: flex-end;
        z-index: 1000;
      }

      .floating-button-container .floating-button {
        position: static;
        bottom: auto;
        right: auto;
      }

      .floating-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #623B5A;
        color: white;
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        font-size: 1.5em;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .floating-button:hover {
        background-color: #D36135;
      }
    ';

    document.head.appendChild(style);
  }

  function computeDefaultBackUrl() {
    try {
      return new URL('../index.html', window.location.href).href;
    } catch (err) {
      console.error('Unable to compute default back URL', err);
      return '../index.html';
    }
  }

  function setupFloatingButtons() {
    ensureFloatingButtonStyles();

    var container = document.querySelector('.floating-button-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'floating-button-container';
      document.body.appendChild(container);
    }

    var homeButton = document.getElementById('homeButton');
    if (!homeButton) {
      homeButton = document.createElement('button');
      homeButton.id = 'homeButton';
      homeButton.className = 'floating-button home-button';
      homeButton.type = 'button';
      homeButton.innerHTML = '🏠';
      homeButton.title = 'Retour au menu précédent / Back to previous menu';
      homeButton.setAttribute('aria-label', 'Retour au menu précédent / Back to previous menu');
      homeButton.addEventListener('click', function() {
        var fallback = document.body.getAttribute('data-back-url') || computeDefaultBackUrl();
        if (window.history.length > 1) {
          window.history.back();
        } else if (fallback) {
          window.location.href = fallback;
        }
      });
      container.appendChild(homeButton);
    }

    Array.prototype.slice.call(document.querySelectorAll('.floating-button'))
      .filter(function(btn) { return btn !== homeButton; })
      .forEach(function(btn) {
        if (btn.parentElement !== container) {
          container.appendChild(btn);
        }
      });
  }

  return {
    ensureFloatingButtonStyles: ensureFloatingButtonStyles,
    computeDefaultBackUrl: computeDefaultBackUrl,
    setupFloatingButtons: setupFloatingButtons
  };
})();

window.AdaptatechHomeButton = AdaptatechHomeButton;
var setupFloatingButtons = AdaptatechHomeButton.setupFloatingButtons;

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
  setupFloatingButtons();
}
// Toggle language between French and English.
function toggleLanguage() {
  var current = localStorage.getItem('siteLanguage') || 'en';
  var newLang = (current === 'fr') ? 'en' : 'fr';
  localStorage.setItem('siteLanguage', newLang);
  updateLanguage();
}
document.addEventListener('DOMContentLoaded', updateLanguage);
