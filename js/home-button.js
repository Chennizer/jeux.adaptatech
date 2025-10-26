(function() {
  if (window.AdaptatechHomeButton &&
      typeof window.AdaptatechHomeButton.setupFloatingButtons === 'function') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', window.AdaptatechHomeButton.setupFloatingButtons);
    } else {
      window.AdaptatechHomeButton.setupFloatingButtons();
    }
    return;
  }

  function ensureFloatingButtonStyles() {
    if (document.getElementById('floating-button-style')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'floating-button-style';
    style.textContent = `
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
    `;

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

    let container = document.querySelector('.floating-button-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'floating-button-container';
      document.body.appendChild(container);
    }

    let homeButton = document.getElementById('homeButton');
    if (!homeButton) {
      homeButton = document.createElement('button');
      homeButton.id = 'homeButton';
      homeButton.className = 'floating-button home-button';
      homeButton.type = 'button';
      homeButton.innerHTML = '🏠';
      homeButton.title = 'Retour au menu précédent / Back to previous menu';
      homeButton.setAttribute('aria-label', 'Retour au menu précédent / Back to previous menu');
      homeButton.addEventListener('click', () => {
        const fallback = document.body.getAttribute('data-back-url') || computeDefaultBackUrl();
        if (window.history.length > 1) {
          window.history.back();
        } else if (fallback) {
          window.location.href = fallback;
        }
      });
      container.appendChild(homeButton);
    }

    const floatingButtons = Array.from(document.querySelectorAll('.floating-button'))
      .filter(btn => btn !== homeButton);

    floatingButtons.forEach(btn => {
      if (btn.parentElement !== container) {
        container.appendChild(btn);
      }
    });
  }

  window.AdaptatechHomeButton = {
    ensureFloatingButtonStyles,
    computeDefaultBackUrl,
    setupFloatingButtons,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFloatingButtons);
  } else {
    setupFloatingButtons();
  }
})();
