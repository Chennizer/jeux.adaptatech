(function () {
  'use strict';

  const FAVORITES_KEY = 'adaptatechFavoriteGames';
  const languages = ['fr', 'en', 'ja'];
  const copy = {
    fr: { results: n => `${n} activité${n > 1 ? 's' : ''} trouvée${n > 1 ? 's' : ''}`, favorites: 'Favoris', favoritesCount: n => `${n} activité${n > 1 ? 's' : ''} favorite${n > 1 ? 's' : ''}`, senict: levels => `SENICT : niveau${levels.length > 1 ? 'x' : ''} ${levels.join(', ')}`, empty: 'Aucune activité ne correspond à ces filtres.', noFavorites: "Vous n’avez pas encore ajouté d’activité favorite.", add: 'Ajouter aux activités favorites', remove: 'Retirer des activités favorites', loadError: 'Le catalogue ne peut pas être chargé pour le moment.' },
    en: { results: n => `${n} matching ${n === 1 ? 'activity' : 'activities'}`, favorites: 'Favorites', favoritesCount: n => `${n} favorite ${n === 1 ? 'activity' : 'activities'}`, senict: levels => `SENICT: level${levels.length > 1 ? 's' : ''} ${levels.join(', ')}`, empty: 'No activities match these filters.', noFavorites: 'You have not added any favorite activities yet.', add: 'Add to favorite activities', remove: 'Remove from favorite activities', loadError: 'The catalogue cannot be loaded right now.' },
    ja: { results: n => `該当するアクティビティ：${n}件`, favorites: 'お気に入り', favoritesCount: n => `お気に入り：${n}件`, senict: levels => `SENICT：レベル ${levels.join('、')}`, empty: '条件に合うアクティビティはありません。', noFavorites: 'お気に入りのアクティビティはまだありません。', add: 'お気に入りに追加', remove: 'お気に入りから削除', loadError: '現在カタログを読み込めません。' }
  };

  const root = document.getElementById('activityFinder');
  if (!root) return;

  const form = root.querySelector('form');
  const panel = root;
  const results = root.querySelector('.activity-finder__results');
  const grid = root.querySelector('.activity-finder__grid');
  const summary = root.querySelector('.activity-finder__summary');
  const details = root.querySelector('.activity-finder__details');
  const openButton = root.querySelector('.activity-finder__open');
  const favoritesButton = root.querySelector('.activity-finder__favorites');
  let games = [];
  let mode = 'filters';

  function language() {
    const lang = document.documentElement.lang || localStorage.getItem('siteLanguage') || 'fr';
    return languages.includes(lang) ? lang : 'fr';
  }

  function readFavorites() {
    try {
      const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      return new Set(Array.isArray(value) ? value.filter(id => typeof id === 'string') : []);
    } catch (_) { return new Set(); }
  }

  function writeFavorites(favorites) {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites))); } catch (_) { /* Storage can be unavailable in privacy mode. */ }
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

  function updateFavoritesButton() {
    const count = readFavorites().size;
    favoritesButton.textContent = `☆ ${copy[language()].favorites}`;
    favoritesButton.setAttribute('aria-label', `${copy[language()].favorites}, ${copy[language()].favoritesCount(count)}`);
  }

  function makeCard(game, favorites) {
    const article = document.createElement('article');
    article.className = 'activity-card';
    const link = document.createElement('a');
    link.className = 'activity-card__link';
    link.href = game.url;
    const image = document.createElement('img');
    image.className = 'activity-card__image';
    image.src = game.image;
    image.alt = '';
    image.loading = 'lazy';
    const title = document.createElement('span');
    title.className = 'activity-card__title';
    title.textContent = titleFor(game);
    link.append(image, title);
    if (Array.isArray(game.senictLevels) && game.senictLevels.length) {
      const senict = document.createElement('span');
      senict.className = 'activity-card__senict';
      senict.textContent = copy[language()].senict(game.senictLevels);
      link.append(senict);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'activity-card__favorite';
    const selected = favorites.has(game.id);
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${selected ? copy[language()].remove : copy[language()].add} : ${titleFor(game)}`);
    button.replaceChildren(starIcon(selected));
    button.addEventListener('click', () => {
      const current = readFavorites();
      current.has(game.id) ? current.delete(game.id) : current.add(game.id);
      writeFavorites(current);
      updateFavoritesButton();
      render(mode === 'favorites' ? games.filter(item => current.has(item.id)) : filteredGames(), mode === 'favorites');
    });
    article.append(link, button);
    return article;
  }

  function filteredGames() {
    const access = form.elements.access.value;
    const objective = form.elements.objective.value;
    const senict = Number(form.elements.senict.value);
    return games.filter(game => game.popular &&
      (!access || game.access.includes(access)) &&
      (!objective || game.objectives.includes(objective)) &&
      (!senict || (Array.isArray(game.senictLevels) && game.senictLevels.includes(senict)))
    );
  }

  function setExpanded(expanded) {
    details.hidden = !expanded;
    panel.classList.toggle('is-expanded', expanded);
    openButton.setAttribute('aria-expanded', String(expanded));
    favoritesButton.setAttribute('aria-expanded', String(expanded));
  }

  function render(items, favoritesOnly) {
    const favorites = readFavorites();
    grid.replaceChildren();
    summary.textContent = favoritesOnly ? copy[language()].favoritesCount(items.length) : copy[language()].results(items.length);
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'activity-finder__empty';
      empty.textContent = favoritesOnly ? copy[language()].noFavorites : copy[language()].empty;
      grid.append(empty);
    } else {
      items.forEach(game => grid.append(makeCard(game, favorites)));
    }
    results.hidden = false;
  }

  function updatePopularResults() {
    mode = 'filters';
    panel.classList.remove('is-favorites');
    render(filteredGames(), false);
  }

  form.addEventListener('change', updatePopularResults);

  openButton.addEventListener('click', () => {
    const shouldCollapse = !details.hidden && mode === 'filters';
    if (shouldCollapse) {
      setExpanded(false);
      return;
    }
    form.hidden = false;
    setExpanded(true);
    updatePopularResults();
  });

  favoritesButton.addEventListener('click', () => {
    form.hidden = true;
    setExpanded(true);
    mode = 'favorites';
    panel.classList.add('is-favorites');
    const favorites = readFavorites();
    render(games.filter(game => favorites.has(game.id)), true);
    results.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });

  new MutationObserver(() => {
    updateFavoritesButton();
    if (!results.hidden) render(mode === 'favorites' ? games.filter(game => readFavorites().has(game.id)) : filteredGames(), mode === 'favorites');
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  fetch('/data/games.json')
    .then(response => {
      if (!response.ok) throw new Error(`Catalogue request failed: ${response.status}`);
      return response.json();
    })
    .then(catalogue => {
      games = Array.isArray(catalogue.games) ? catalogue.games : [];
      const catalogueIds = new Set(games.map(game => game.id));
      const availableFavorites = new Set(Array.from(readFavorites()).filter(id => catalogueIds.has(id)));
      writeFavorites(availableFavorites);
      openButton.disabled = false;
      favoritesButton.disabled = false;
      updateFavoritesButton();
    })
    .catch(() => {
      summary.textContent = copy[language()].loadError;
      results.hidden = false;
      openButton.disabled = true;
      favoritesButton.disabled = true;
    });

  updateFavoritesButton();
})();
