(function() {
  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.home-button')) {
      return;
    }

    var body = document.body;
    var backLink = body.dataset.backLink || '../index.html';
    var backLabel = body.dataset.backLabel || 'Retour au menu précédent / Back to previous menu';
    var backTitle = body.dataset.backTitle || backLabel;

    var button = document.createElement('a');
    button.href = backLink;
    button.classList.add('floating-button', 'home-button');
    button.setAttribute('aria-label', backLabel);
    button.title = backTitle;
    button.textContent = '🏠';

    body.appendChild(button);

    var controlPanel = document.getElementById('control-panel');
    var startButton = document.getElementById('control-panel-start-button');

    function hideHomeButton() {
      button.style.display = 'none';
    }

    function showHomeButton() {
      button.style.display = '';
    }

    if (controlPanel) {
      var updateFromControlPanel = function () {
        var isHidden = window.getComputedStyle(controlPanel).display === 'none';
        if (isHidden) {
          hideHomeButton();
        } else {
          showHomeButton();
        }
      };

      updateFromControlPanel();

      if (window.MutationObserver) {
        var observer = new MutationObserver(function () {
          updateFromControlPanel();
        });

        observer.observe(controlPanel, { attributes: true, attributeFilter: ['style', 'class'] });
      }
    }

    if (startButton) {
      startButton.addEventListener('click', hideHomeButton);
    }
  });
})();

