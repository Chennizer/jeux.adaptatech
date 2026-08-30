(function () {
  'use strict';

  const STORAGE_KEY = 'adaptatechFavoriteGames';
  const messages = {
    fr: { add: 'Ajouter aux activités favorites', remove: 'Retirer des activités favorites' },
    en: { add: 'Add to favorite activities', remove: 'Remove from favorite activities' },
    ja: { add: 'お気に入りに追加', remove: 'お気に入りから削除' }
  };
  let catalogue = [];

  function language() {
    const lang = document.documentElement.lang || localStorage.getItem('siteLanguage') || 'fr';
    return messages[lang] ? lang : 'fr';
  }

  function normalizedPath(value) {
    const url = new URL(value, window.location.href);
    return decodeURIComponent(url.pathname).replace(/index\.html$/, '').replace(/\/$/, '').toLowerCase();
  }

  function readFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return new Set(Array.isArray(stored) ? stored.filter(id => typeof id === 'string') : []);
    } catch (_) { return new Set(); }
  }

  function writeFavorites(favorites) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites))); } catch (_) { /* Storage may be unavailable. */ }
  }

  function titleFor(game) {
    return game.title[language()] || game.title.fr || game.title.en || game.id;
  }

  function starIcon(selected) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.setAttribute('class', 'favorite-star-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    path.setAttribute('d', 'M12 2.8 14.8 8.5 21.1 9.4 16.5 13.8 17.6 20.1 12 17.1 6.4 20.1 7.5 13.8 2.9 9.4 9.2 8.5Z');
    path.setAttribute('fill', selected ? 'currentColor' : 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-linejoin', 'round');
    svg.append(path);
    return svg;
  }

  function updateButton(button, game, selected) {
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${messages[language()][selected ? 'remove' : 'add']} : ${titleFor(game)}`);
    button.replaceChildren(starIcon(selected));
  }

  function addButtons() {
    const gamesByPath = new Map(catalogue.map(game => [normalizedPath(game.url), game]));
    const favorites = readFavorites();
    document.querySelectorAll('.tile').forEach(tile => {
      if (tile.querySelector('.catalogue-favorite')) return;
      const link = tile.querySelector('a[href]');
      if (!link) return;
      const game = gamesByPath.get(normalizedPath(link.href));
      if (!game) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'catalogue-favorite';
      updateButton(button, game, favorites.has(game.id));
      button.addEventListener('click', () => {
        const current = readFavorites();
        current.has(game.id) ? current.delete(game.id) : current.add(game.id);
        writeFavorites(current);
        updateButton(button, game, current.has(game.id));
      });
      tile.append(button);
    });
  }

  fetch('/data/games.json')
    .then(response => {
      if (!response.ok) throw new Error(`Catalogue request failed: ${response.status}`);
      return response.json();
    })
    .then(data => { catalogue = Array.isArray(data.games) ? data.games : []; addButtons(); })
    .catch(() => { /* Existing activity links remain fully usable if the catalogue is unavailable. */ });

  new MutationObserver(() => {
    document.querySelectorAll('.catalogue-favorite').forEach(button => {
      const link = button.closest('.tile').querySelector('a[href]');
      const game = catalogue.find(item => normalizedPath(item.url) === normalizedPath(link.href));
      if (game) updateButton(button, game, readFavorites().has(game.id));
    });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
