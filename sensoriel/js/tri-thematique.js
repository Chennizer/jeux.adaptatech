(function () {
  'use strict';

const PICTO_INDEX_URL = '../images/pictos/index.json';
const DEFAULT_ERROR_SOUND = '../sounds/error.mp3';
const DEFAULT_SUCCESS_SOUND = '../sounds/success3.mp3';

  let triSession = null;
  let themeData = {};
  let reinforcerController = null;
  let statusMessageEl = null;
  let itemsContainerEl = null;
  let categoriesContainerEl = null;
  let successAudio = null;
  let errorAudio = null;
  let remainingItems = 0;
  let selectedCardEl = null;

  const cardsById = new Map();

  document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
  });

  async function initializeGame() {
    triSession = window.sessionHelpers && window.sessionHelpers.ensureCurrentGame
      ? window.sessionHelpers.ensureCurrentGame('tri-thematique')
      : null;

    if (!triSession) {
      return;
    }

    if (window.sessionHelpers && typeof window.sessionHelpers.updateActivityMarker === 'function') {
      window.sessionHelpers.updateActivityMarker(triSession);
    }

    themeData = triSession.themeData || {};
    statusMessageEl = document.getElementById('statusMessage');
    itemsContainerEl = document.getElementById('itemsContainer');
    categoriesContainerEl = document.getElementById('categoriesContainer');

    prepareAudioPlayers();

    if (window.sessionHelpers && typeof window.sessionHelpers.setupSharedReinforcer === 'function') {
      reinforcerController = window.sessionHelpers.setupSharedReinforcer(triSession);
    }

    let pictoIndex;
    try {
      pictoIndex = await loadPictoIndex();
    } catch (error) {
      console.error('Unable to load pictogram index:', error);
      revealGameContainer();
      setStatusMessage('Impossible de charger les pictogrammes. Retour au menu.', 'error');
      return;
    }

    if (!pictoIndex || !pictoIndex.categories) {
      revealGameContainer();
      setStatusMessage('Aucune catégorie de pictogrammes disponible.', 'error');
      return;
    }

    if (window.sessionHelpers && typeof window.sessionHelpers.showActivityOverlay === 'function') {
      window.sessionHelpers.showActivityOverlay(() => {
        revealGameContainer();
        setupRound(pictoIndex);
      }, triSession);
    } else {
      revealGameContainer();
      setupRound(pictoIndex);
    }
  }

  function prepareAudioPlayers() {
    const successSrc = themeData.reinforcerSound || DEFAULT_SUCCESS_SOUND;
    const errorSrc = themeData.errorSound || DEFAULT_ERROR_SOUND;
    successAudio = createAudioElement(successSrc);
    errorAudio = createAudioElement(errorSrc);
  }

  function createAudioElement(src) {
    if (!src) {
      return null;
    }
    const audio = new Audio(src);
    audio.preload = 'auto';
    return audio;
  }

  async function loadPictoIndex() {
    const response = await fetch(PICTO_INDEX_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  function revealGameContainer() {
    const container = document.getElementById('gameContainer');
    if (container) {
      container.style.display = 'flex';
    }
  }

  function setupRound(pictoIndex) {
    resetBoard();

    const options = window.sessionHelpers && typeof window.sessionHelpers.getCurrentGameOptions === 'function'
      ? window.sessionHelpers.getCurrentGameOptions(triSession) || {}
      : {};

    const desiredCategoryCount = clampNumber(parseInt(options.categoryCount, 10), 2, 4, 3);
    const desiredItemCount = clampNumber(parseInt(options.itemCount, 10), 3, 12, 6);

    const availableCategories = buildCategoryPool(pictoIndex);
    if (availableCategories.length === 0) {
      setStatusMessage('Aucune catégorie exploitable trouvée.', 'error');
      return;
    }

    const categoryCount = Math.min(desiredCategoryCount, availableCategories.length);
    const selectedCategories = sampleArray(availableCategories, categoryCount);
    renderCategories(selectedCategories);

    const cards = buildCardsForCategories(selectedCategories, desiredItemCount);
    remainingItems = cards.length;
    renderCards(cards);

    if (remainingItems === 0) {
      setStatusMessage('Aucune carte à classer pour cette configuration.', 'error');
    } else {
      setStatusMessage('Sélectionne une carte et place-la dans la bonne catégorie.', '');
    }
  }

  function resetBoard() {
    cardsById.clear();
    selectedCardEl = null;
    remainingItems = 0;
    if (itemsContainerEl) {
      itemsContainerEl.innerHTML = '';
    }
    if (categoriesContainerEl) {
      categoriesContainerEl.innerHTML = '';
    }
  }

  function clampNumber(value, min, max, fallback) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(Math.max(value, min), max);
  }

  const MIN_ITEMS_FOR_RELEVANT_CATEGORY = 8;

  function buildCategoryPool(pictoIndex) {
    const basePath = typeof pictoIndex.base === 'string' ? pictoIndex.base : '../images/pictos/';
    const pool = [];
    const rawCategories = pictoIndex.categories || {};

    Object.keys(rawCategories).forEach((categoryId) => {
      const categoryData = rawCategories[categoryId];
      if (!categoryData || !Array.isArray(categoryData.items) || categoryData.items.length === 0) {
        return;
      }
      const readableLabel = getCategoryLabel(categoryId, categoryData);
      const entries = categoryData.items
        .map((item) => buildPictoEntry(basePath, categoryId, item))
        .filter(Boolean);
      if (entries.length > 0) {
        pool.push({
          id: categoryId,
          label: readableLabel,
          items: entries,
          itemCount: entries.length
        });
      }
    });

    const relevantCategories = selectRelevantCategories(pool);
    return relevantCategories.length > 0 ? relevantCategories : pool;
  }

  function selectRelevantCategories(categories) {
    if (!Array.isArray(categories)) {
      return [];
    }

    const filtered = categories.filter((category) => {
      return Array.isArray(category.items) && category.items.length >= MIN_ITEMS_FOR_RELEVANT_CATEGORY;
    });

    if (filtered.length === 0) {
      return [];
    }

    return filtered.sort((a, b) => {
      const countA = Array.isArray(a.items) ? a.items.length : 0;
      const countB = Array.isArray(b.items) ? b.items.length : 0;
      return countB - countA;
    });
  }

  function getCategoryLabel(categoryId, categoryData) {
    if (categoryData && categoryData.label) {
      if (typeof categoryData.label.fr === 'string') {
        return categoryData.label.fr;
      }
      if (typeof categoryData.label === 'string') {
        return categoryData.label;
      }
    }
    return categoryId;
  }

  function buildPictoEntry(basePath, categoryId, item) {
    if (!item || !item.file) {
      return null;
    }
    const filePath = `${basePath}${item.file}`;
    const frenchLabel = item.label && item.label.fr;
    let altText = categoryId;
    let displayText = '';

    if (frenchLabel) {
      const article = typeof frenchLabel.article === 'string' ? frenchLabel.article.trim() : '';
      const word = typeof frenchLabel.word === 'string' ? frenchLabel.word.trim() : '';
      displayText = [article, word].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      altText = displayText || altText;
    }

    if (!displayText && item.label && typeof item.label === 'string') {
      displayText = item.label;
      altText = item.label;
    }

    if (!displayText) {
      const fileName = item.file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      displayText = fileName;
      altText = fileName;
    }

    return {
      src: filePath,
      label: capitalizeFirst(displayText),
      alt: capitalizeFirst(altText),
      categoryId
    };
  }

  function capitalizeFirst(text) {
    if (typeof text !== 'string' || text.length === 0) {
      return '';
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function sampleArray(items, count) {
    const pool = items.slice();
    const result = [];
    const maxCount = Math.min(count, pool.length);
    for (let index = 0; index < maxCount; index += 1) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const [selected] = pool.splice(randomIndex, 1);
      result.push(selected);
    }
    return result;
  }

  function buildCardsForCategories(categories, desiredItemCount) {
    const cards = [];
    if (!Array.isArray(categories) || categories.length === 0) {
      return cards;
    }

    const itemsPerCategory = Math.max(1, Math.floor(desiredItemCount / categories.length));
    let remaining = desiredItemCount;

    categories.forEach((category, index) => {
      if (!Array.isArray(category.items) || category.items.length === 0 || remaining <= 0) {
        return;
      }
      const minRemainingCategories = categories.length - index - 1;
      const maxForCategory = Math.min(category.items.length, remaining - minRemainingCategories);
      const targetCount = Math.min(itemsPerCategory, maxForCategory);
      const selectedItems = sampleArray(category.items, targetCount);
      selectedItems.forEach((item) => {
        cards.push({
          id: generateCardId(cards.length, category.id, item.label),
          categoryId: category.id,
          label: item.label,
          alt: item.alt,
          src: item.src
        });
      });
      remaining -= selectedItems.length;
    });

    if (remaining > 0) {
      const usedSources = new Set(cards.map((card) => card.src));
      const fallbackPool = categories
        .flatMap((category) => category.items)
        .filter((item) => !usedSources.has(item.src));
      const extras = sampleArray(fallbackPool, remaining);
      extras.forEach((item) => {
        cards.push({
          id: generateCardId(cards.length, item.categoryId, item.label),
          categoryId: item.categoryId,
          label: item.label,
          alt: item.alt,
          src: item.src
        });
      });
    }

    return shuffleArray(cards);
  }

  function generateCardId(index, categoryId, label) {
    const base = `${categoryId}-${label}`.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    return `${base}-${index}-${Math.floor(Math.random() * 10000)}`;
  }

  function shuffleArray(items) {
    const array = items.slice();
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function renderCategories(categories) {
    if (!categoriesContainerEl) {
      return;
    }
    categories.forEach((category) => {
      const categoryEl = document.createElement('article');
      categoryEl.className = 'category';
      categoryEl.setAttribute('data-category', category.id);

      const titleEl = document.createElement('h2');
      titleEl.className = 'category-title';
      titleEl.textContent = category.label;
      categoryEl.appendChild(titleEl);

      const dropZone = document.createElement('div');
      dropZone.className = 'category-drop-zone';
      dropZone.setAttribute('role', 'group');
      dropZone.setAttribute('aria-label', `Zone pour ${category.label}`);
      dropZone.dataset.category = category.id;

      dropZone.addEventListener('dragover', handleDragOver);
      dropZone.addEventListener('dragenter', handleDragEnter);
      dropZone.addEventListener('dragleave', handleDragLeave);
      dropZone.addEventListener('drop', handleDrop);
      dropZone.addEventListener('click', () => handleCategorySelection(dropZone));
      dropZone.addEventListener('touchend', (event) => {
        event.preventDefault();
        handleCategorySelection(dropZone);
      });

      categoryEl.appendChild(dropZone);
      categoriesContainerEl.appendChild(categoryEl);
    });
  }

  function renderCards(cards) {
    if (!itemsContainerEl) {
      return;
    }

    cards.forEach((card) => {
      const cardButton = document.createElement('button');
      cardButton.className = 'picto-card';
      cardButton.type = 'button';
      cardButton.dataset.category = card.categoryId;
      cardButton.dataset.cardId = card.id;
      cardButton.setAttribute('aria-label', `${card.label} (catégorie ${card.categoryId})`);
      cardButton.draggable = true;

      cardButton.addEventListener('dragstart', handleDragStart);
      cardButton.addEventListener('dragend', handleDragEnd);
      cardButton.addEventListener('click', () => toggleSelectedCard(cardButton));
      cardButton.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleSelectedCard(cardButton);
        }
      });

      const imageEl = document.createElement('img');
      imageEl.src = card.src;
      imageEl.alt = card.alt || card.label;
      imageEl.draggable = false;
      cardButton.appendChild(imageEl);

      const labelEl = document.createElement('span');
      labelEl.className = 'picto-label';
      labelEl.textContent = card.label;
      cardButton.appendChild(labelEl);

      itemsContainerEl.appendChild(cardButton);
      cardsById.set(card.id, cardButton);
    });
  }

  function handleDragStart(event) {
    const cardEl = event.currentTarget;
    if (!cardEl || cardEl.dataset.placed === 'true') {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', cardEl.dataset.cardId);
    selectCard(cardEl);
  }

  function handleDragEnd(event) {
    const cardEl = event.currentTarget;
    if (cardEl && cardEl.classList.contains('selected')) {
      cardEl.classList.remove('selected');
    }
    selectedCardEl = null;
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(event) {
    const dropZone = event.currentTarget;
    if (dropZone && dropZone.parentElement) {
      dropZone.parentElement.classList.add('drag-target');
    }
  }

  function handleDragLeave(event) {
    const dropZone = event.currentTarget;
    if (dropZone && dropZone.parentElement) {
      dropZone.parentElement.classList.remove('drag-target');
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    const dropZone = event.currentTarget;
    const cardId = event.dataTransfer.getData('text/plain');
    const cardEl = cardsById.get(cardId);
    if (dropZone && cardEl) {
      assignCardToCategory(cardEl, dropZone);
    }
    if (dropZone && dropZone.parentElement) {
      dropZone.parentElement.classList.remove('drag-target');
    }
  }

  function handleCategorySelection(dropZone) {
    if (!selectedCardEl) {
      setStatusMessage('Sélectionne d’abord une carte à placer.', 'error');
      playError();
      return;
    }
    assignCardToCategory(selectedCardEl, dropZone);
  }

  function toggleSelectedCard(cardEl) {
    if (!cardEl || cardEl.dataset.placed === 'true') {
      return;
    }
    if (selectedCardEl === cardEl) {
      cardEl.classList.remove('selected');
      selectedCardEl = null;
      return;
    }
    selectCard(cardEl);
  }

  function selectCard(cardEl) {
    if (!cardEl || cardEl.dataset.placed === 'true') {
      return;
    }
    if (selectedCardEl && selectedCardEl !== cardEl) {
      selectedCardEl.classList.remove('selected');
    }
    selectedCardEl = cardEl;
    selectedCardEl.classList.add('selected');
  }

  function assignCardToCategory(cardEl, dropZone) {
    if (!cardEl || !dropZone || cardEl.dataset.placed === 'true') {
      return;
    }

    const expectedCategory = cardEl.dataset.category;
    const targetCategory = dropZone.dataset.category;
    const isCorrect = expectedCategory === targetCategory;

    if (isCorrect) {
      handleCorrectPlacement(cardEl, dropZone);
    } else {
      handleIncorrectPlacement(cardEl);
    }
  }

  function handleCorrectPlacement(cardEl, dropZone) {
    cardEl.dataset.placed = 'true';
    cardEl.draggable = false;
    cardEl.classList.remove('selected');
    cardEl.classList.add('correct');
    cardEl.setAttribute('aria-disabled', 'true');
    dropZone.appendChild(cardEl);
    selectedCardEl = null;

    remainingItems = Math.max(remainingItems - 1, 0);
    setStatusMessage('Bravo ! Continue.', 'success');
    playSuccess();

    if (remainingItems === 0) {
      celebrateAndAdvance();
    }
  }

  function handleIncorrectPlacement(cardEl) {
    cardEl.classList.add('incorrect');
    setStatusMessage('Essaie encore.', 'error');
    playError();
    setTimeout(() => {
      cardEl.classList.remove('incorrect');
      cardEl.classList.remove('selected');
      selectedCardEl = null;
    }, 800);
  }

  function setStatusMessage(message, tone) {
    if (!statusMessageEl) {
      return;
    }
    statusMessageEl.textContent = message || '';
    statusMessageEl.classList.remove('success', 'error');
    if (tone === 'success') {
      statusMessageEl.classList.add('success');
    } else if (tone === 'error') {
      statusMessageEl.classList.add('error');
    }
  }

  function playSuccess() {
    if (successAudio) {
      successAudio.currentTime = 0;
      successAudio.play().catch((error) => console.warn('Success sound blocked:', error));
    }
  }

  function playError() {
    if (errorAudio) {
      errorAudio.currentTime = 0;
      errorAudio.play().catch((error) => console.warn('Error sound blocked:', error));
    }
  }

  function celebrateAndAdvance() {
    setStatusMessage('Excellent travail !', 'success');
    setTimeout(() => {
      if (reinforcerController && typeof reinforcerController.show === 'function') {
        reinforcerController.show();
      } else if (window.sessionHelpers && typeof window.sessionHelpers.advanceToNextGame === 'function') {
        window.sessionHelpers.advanceToNextGame();
      }
    }, 700);
  }
})();
