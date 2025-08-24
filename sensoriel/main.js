const maxGames = 10;
const gameSelectionsContainer = document.getElementById('gameSelections');
const addGameBtn = document.getElementById('addGameBtn');
const selectionForm = document.getElementById('selectionForm');
const errorMsg = document.getElementById('errorMsg');
const gameSelectionTemplate = document.getElementById('gameSelectionTemplate');

let gameCount = 0;

const gameOptionsConfig = {
  'puzzle': [
    {
      type: 'select',
      label: 'Taille du casse-tête:',
      name: 'puzzleDimension',
      options: [
        { value: '2x2', text: '2×2' },
        { value: '3x3', text: '3×3' },
        { value: '4x4', text: '4×4' }
      ]
    },
    {
      type: 'checkbox',
      label: 'Indicateur de contour:',
      name: 'puzzleEasy'
    }
  ],
  'completeword': [
    {
      type: 'checkbox',
      label: 'Modèle de lettres:',
      name: 'showModelLetters',
      defaultChecked: true
    },
    {
      type: 'number',
      label: 'Nombre de mots:',
      name: 'testtoupieWordCount',
      min: 1,
      max: 10,
      value: 1
    }
  ],
  'matchnumber': [
    {
      type: 'select',
      label: 'Wrong Answer Retry:',
      name: 'wrongAnswerRetry',
      options: [
        { value: 'true', text: 'Yes' },
        { value: 'false', text: 'No' }
      ]
    },
    {
      type: 'number',
      label: 'Activity Repetitions:',
      name: 'activityRepetitions',
      min: 1,
      max: 10,
      value: 1
    }
  ],
  'Cartes mémoire': [
    {
      type: 'number',
      label: 'Number of Pairs:',
      name: 'paires',
      min: 1,
      max: 10,
      value: 3
    }
  ],
  'Dénombrer': [
    {
      type: 'select',
      label: 'Difficulté:',
      name: 'difficulty',
      options: [
        { value: 'easy', text: '1 à 3' },
        { value: 'medium', text: '1 à 5' },
        { value: 'hard', text: '1 à 10' }
      ]
    },
    {
      type: 'number',
      label: 'Répétitions:',
      name: 'activityRepetitions',
      min: 1,
      max: 10,
      value: 1
    }
  ],
  'imagedecouverte': [
    {
      type: 'select',
      label: 'Difficulty:',
      name: 'difficulty',
      options: [
        { value: 'easy', text: 'Débutant' },
        { value: 'medium', text: 'Medium' },
        { value: 'hard', text: 'Difficile' }
      ]
    }
  ],
      'Suivre le chemin': [
        {
          type: 'select',
          label: 'Largeur du tracé:',
          name: 'largeurTrace',
          options: [
            { value: 'easy', text: 'Large' },
            { value: 'medium', text: 'Moyen' },
            { value: 'hard', text: 'Étroit' }
          ]
        },
        {
          type: 'checkbox',
          label: 'Mode difficile (retour au début en cas de déviation):',
          name: 'hardMode'
        },
        {
          type: 'number',
          label: 'Nombre de répétitions:',
          name: 'activityRepetitions',
          min: 1,
          max: 10,
          value: 1
        }
      ],
  'game7': [],
  'game8': [],
  'game9': [],
  'game10': []
};

function populateThemesDropdown() {
  const themesDropdown = document.getElementById('mediaOption');
  const allThemeNames = Object.keys(window.themes);
  allThemeNames.forEach(themeName => {
    if (themeName === "default") return;
    const option = document.createElement('option');
    option.value = themeName;
    option.textContent = themeName.charAt(0).toUpperCase() + themeName.slice(1);
    themesDropdown.appendChild(option);
  });
}

function createGameBlock() {
  const template = gameSelectionTemplate.content.cloneNode(true);
  const block = template.querySelector('.game-selection-block');
  block.querySelector('.game-number').textContent = gameCount;
  block.querySelector('.remove-game-btn').addEventListener('click', () => {
    removeGameSelectionAnimated(block);
  });
  block.querySelector('.game-select').addEventListener('change', (e) => {
    handleGameSelectionChange(e, block);
  });
  return block;
}

// Standard function to add a basket container (non-animated, for initial load)
function addGameSelection() {
  if (gameCount >= maxGames) return;
  gameCount++;
  const block = createGameBlock();
  gameSelectionsContainer.appendChild(block);
  updateGameNumbers();
}

// Animated add: similar to the standard add, with an extra sliding-in basket PNG.
function addGameSelectionAnimated() {
  if (gameCount >= maxGames) return;
  gameCount++;
  const block = createGameBlock();
  block.style.opacity = "0";
  gameSelectionsContainer.appendChild(block);

  requestAnimationFrame(() => {
    const blockRect = block.getBoundingClientRect();
    const containerRect = gameSelectionsContainer.getBoundingClientRect();
    const destX = blockRect.left - containerRect.left + 20 + 10;
    const destY = blockRect.top - containerRect.top;
    const startOffset = 200;
    const offset = (gameCount % 2 === 1) ? -startOffset : startOffset;
    const animatedBasket = document.createElement('img');
    animatedBasket.src = "../../images/plasticbasket.png";
    animatedBasket.alt = "Basket animation";
    animatedBasket.style.width = "200px";
    animatedBasket.style.position = "absolute";
    animatedBasket.style.left = (destX + offset) + "px";
    animatedBasket.style.top = destY + "px";
    gameSelectionsContainer.appendChild(animatedBasket);
    animatedBasket.animate([
      { transform: `translateX(0px)`, opacity: 1 },
      { transform: `translateX(${ -offset }px)`, opacity: 1 },
      { transform: `translateX(${ -offset }px)`, opacity: 0 }
    ], {
      duration: 1000,
      fill: 'forwards',
      easing: 'linear'
    });
    setTimeout(() => {
      animatedBasket.remove();
      block.style.opacity = "1";
      updateGameNumbers();
    }, 1000);
  });
}

// New removal function: do the reverse of the add animation.
function removeGameSelectionAnimated(block) {
  // Get the block's current position relative to the container.
  const containerRect = gameSelectionsContainer.getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();
  const destX = blockRect.left - containerRect.left;
  const destY = blockRect.top - containerRect.top;
  
  // Create an animated basket image element at the block's position.
  const animatedBasket = document.createElement('img');
  animatedBasket.src = "../../images/plasticbasket.png";
  animatedBasket.alt = "Basket animation";
  animatedBasket.style.width = "200px";
  animatedBasket.style.position = "absolute";
  animatedBasket.style.left = destX + "px";
  animatedBasket.style.top = destY + "px";
  
  gameSelectionsContainer.appendChild(animatedBasket);
  
  // Animate the basket image to slide out in the reverse direction.
  const startOffset = 200;
  const offset = (gameCount % 2 === 1) ? -startOffset : startOffset;
  
  animatedBasket.animate([
    { transform: `translateX(0px)`, opacity: 1 },
    { transform: `translateX(${ offset }px)`, opacity: 1 },
    { transform: `translateX(${ offset }px)`, opacity: 0 }
  ], {
    duration: 1000,
    fill: 'forwards',
    easing: 'linear'
  });
  
  setTimeout(() => {
    animatedBasket.remove();
  }, 1000);
  
  // Immediately remove the basket block.
  block.remove();
  gameCount--;
  updateGameNumbers();
}

function updateGameNumbers() {
  const blocks = gameSelectionsContainer.querySelectorAll('.game-selection-block');
  blocks.forEach((block, index) => {
    block.querySelector('.game-number').textContent = index + 1;
  });
}

function handleGameSelectionChange(event, block) {
  const selectedGame = event.target.value;
  const optionsContainer = block.querySelector('.game-specific-options');
  optionsContainer.innerHTML = '';

  if (selectedGame && gameOptionsConfig[selectedGame]) {
    gameOptionsConfig[selectedGame].forEach(option => {
      if (option.type === 'checkbox') {
        const container = document.createElement('div');
        container.className = 'checkbox-container';
        const label = document.createElement('label');
        label.textContent = option.label;
        label.setAttribute('for', option.name);
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = option.name;
        input.name = option.name;
        if (option.defaultChecked) { input.checked = true; }
        container.appendChild(label);
        container.appendChild(input);
        optionsContainer.appendChild(container);
      } else {
        const label = document.createElement('label');
        label.textContent = option.label;
        label.setAttribute('for', option.name);
        optionsContainer.appendChild(label);
        let input;
        if (option.type === 'select') {
          input = document.createElement('select');
          input.id = option.name;
          input.name = option.name;
          input.required = true;
          option.options.forEach(opt => {
            const optionElem = document.createElement('option');
            optionElem.value = opt.value;
            optionElem.textContent = opt.text;
            input.appendChild(optionElem);
          });
        } else if (option.type === 'text') {
          input = document.createElement('input');
          input.type = 'text';
          input.id = option.name;
          input.name = option.name;
          input.required = true;
        } else if (option.type === 'number') {
          input = document.createElement('input');
          input.type = 'number';
          input.id = option.name;
          input.name = option.name;
          input.min = option.min || 0;
          input.max = option.max || 1000;
          if (option.value !== undefined) {
            input.value = option.value;
          }
          input.required = true;
        }
        optionsContainer.appendChild(input);
      }
    });
    optionsContainer.style.display = 'block';
  } else {
    optionsContainer.style.display = 'none';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  populateThemesDropdown();
  // Add 2 baskets on load (using standard add)
  addGameSelection();
  addGameSelection();
});

addGameBtn.addEventListener('click', addGameSelectionAnimated);

selectionForm.addEventListener('submit', function(e) {
  e.preventDefault();
  errorMsg.textContent = '';

  const gameBlocks = gameSelectionsContainer.querySelectorAll('.game-selection-block');
  const selectedGames = [];
  const gameDetails = [];

  for (const block of gameBlocks) {
    const gameSelect = block.querySelector('.game-select');
    const selectedGame = gameSelect.value;
    if (selectedGame === '') continue;

    if (selectedGames.includes(selectedGame)) {
      errorMsg.textContent = "Each game must be unique. Please adjust your selections.";
      return;
    }
    selectedGames.push(selectedGame);

    const optionsContainer = block.querySelector('.game-specific-options');
    const inputs = optionsContainer.querySelectorAll('input, select');
    const options = {};
    inputs.forEach(input => {
      if (input.type === "checkbox") {
        options[input.name] = input.checked ? "true" : "false";
      } else if (input.type === "number") {
        options[input.name] = input.valueAsNumber;
      } else {
        options[input.name] = input.value;
      }
    });
    gameDetails.push({
      gameIdentifier: selectedGame,
      options: options
    });
  }

  if (gameDetails.length < 1) {
    errorMsg.textContent = "Please select at least one game.";
    return;
  }

  gameDetails.forEach(game => {
    if (game.gameIdentifier === "Dénombrer" && game.options) {
      if (game.options.difficulty) {
        localStorage.setItem("difficulty", game.options.difficulty);
      }
      if (game.options.activityRepetitions) {
        localStorage.setItem("activityRepetitions", game.options.activityRepetitions);
      }
    }
  });

  const mediaOption = document.getElementById('mediaOption').value;
  if (!mediaOption) {
    errorMsg.textContent = "Please select a media theme.";
    return;
  }

  // Retrieve the user-chosen reinforcer type
  const reinforcerTypeSelect = document.getElementById('reinforcerType');
  const reinforcerType = reinforcerTypeSelect ? reinforcerTypeSelect.value : "shortvideo";

  const selectionsObj = {
    gameOrder: gameDetails.map(game => game.gameIdentifier),
    gameOptions: gameDetails.map(game => game.options),
    mediaOption: mediaOption,
    // Save the chosen reinforcer type
    reinforcerType: reinforcerType
  };

  localStorage.setItem('gameSelections', JSON.stringify(selectionsObj));
  localStorage.setItem('currentGameIndex', 0);

  const firstGame = selectionsObj.gameOrder[0];
  const navigateToFirstGame = () => {
    window.location.href = `${firstGame}.html`;
  };

  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(navigateToFirstGame).catch(() => {
      navigateToFirstGame();
    });
  } else {
    navigateToFirstGame();
  }
});
