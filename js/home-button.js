(function () {
  function getCurrentLanguage() {
    return localStorage.getItem('siteLanguage') || 'en';
  }

  function updateAccessibleLabels(link, lang) {
    if (!link) return;
    if (lang === 'fr') {
      link.setAttribute('title', 'Retour au menu précédent');
      link.setAttribute('aria-label', 'Retour au menu précédent');
    } else {
      link.setAttribute('title', 'Back to previous menu');
      link.setAttribute('aria-label', 'Back to previous menu');
    }
  }

  function computeHomeHref() {
    if (document.body && document.body.dataset && document.body.dataset.home) {
      return document.body.dataset.home;
    }

    var pathname = window.location.pathname || '';
    if (!pathname) {
      return null;
    }

    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }

    var segments = pathname.split('/').filter(function (segment) {
      return segment.length > 0;
    });

    if (segments.length === 0) {
      return null;
    }

    var lastSegment = segments[segments.length - 1];
    var isIndexFile = /index\.(html?|php)$/i.test(lastSegment);

    if (isIndexFile) {
      if (segments.length === 1) {
        return null;
      }
      return '../index.html';
    }

    return 'index.html';
  }

  function createHomeButton() {
    if (!document.body || document.getElementById('homeButton')) {
      return;
    }

    var homeHref = computeHomeHref();
    if (!homeHref) {
      return;
    }

    var link = document.createElement('a');
    link.id = 'homeButton';
    link.className = 'floating-button home-button';
    link.href = homeHref;
    link.textContent = '🏠';

    updateAccessibleLabels(link, getCurrentLanguage());

    document.body.appendChild(link);

    document.addEventListener('siteLanguageChange', function (event) {
      var lang = event && event.detail && event.detail.language ? event.detail.language : getCurrentLanguage();
      updateAccessibleLabels(link, lang);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createHomeButton);
  } else {
    createHomeButton();
  }
})();
