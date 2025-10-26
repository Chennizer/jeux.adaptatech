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
  });
})();

