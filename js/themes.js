/* Enhanced theme registry for sensory games */
(function registerSensoryThemes(global) {
  'use strict';

  if (!global) {
    return;
  }

  const MEDIA_BASE = '../';
  const IMAGE_BASE = `${MEDIA_BASE}images/`;
  const SOUND_BASE = `${MEDIA_BASE}sounds/`;
  const VIDEO_BUCKET = 'https://bucket.adaptatech.org/';

  const DEFAULT_COLORS = { primary: '#175676', accent: '#FFC857' };
  const DEFAULT_BACKGROUNDS = [
    `${IMAGE_BASE}bgforest.png`,
    `${IMAGE_BASE}africanbackground2.webp`,
    `${IMAGE_BASE}africanbackground3.webp`
  ];
  // Sensorial games now share a unified audio palette (start, success, error, final)
  // regardless of the selected visual theme to provide a consistent experience.
  const SHARED_SOUNDS = Object.freeze({
    start: `${SOUND_BASE}startactivity.mp3`,
    success: `${SOUND_BASE}success3.mp3`,
    error: `${SOUND_BASE}error.mp3`,
    final: `${SOUND_BASE}victory.mp3`
  });
  const DEFAULT_REINFORCER_VIDEOS = [
    `${VIDEO_BUCKET}afrique1.mp4`,
    `${VIDEO_BUCKET}patpatrouilleintro.mp4`,
    `${VIDEO_BUCKET}moana-finale.mp4`,
    `${VIDEO_BUCKET}toupieetbinou1.mp4`
  ];

  function mergeColors(customColors) {
    return Object.assign({}, DEFAULT_COLORS, customColors || {});
  }

  function sanitizeWords(words) {
    if (!Array.isArray(words)) {
      return [];
    }
    return words
      .map(word => (typeof word === 'string' ? word.trim() : ''))
      .filter(Boolean);
  }

  function createTheme(config) {
    const {
      id,
      displayName,
      categoryId = 'custom',
      colors,
      images = [],
      transparentPNGs = [],
      words = [],
      reinforcerVideos = [],
      reinforcerImages = [],
      startSound: _ignoredStartSound,
      reinforcerSound: _ignoredReinforcerSound,
      errorSound: _ignoredErrorSound,
      finalRewardSound: _ignoredFinalRewardSound
    } = config || {};

    const theme = {
      id,
      displayName: displayName || id,
      metadata: {
        categoryId,
        colors: mergeColors(colors)
      },
      images: Array.isArray(images) ? images.slice() : [],
      transparentPNGs: Array.isArray(transparentPNGs) ? transparentPNGs.slice() : [],
      words: sanitizeWords(words),
      reinforcerVideos: Array.isArray(reinforcerVideos) && reinforcerVideos.length > 0
        ? reinforcerVideos.slice()
        : DEFAULT_REINFORCER_VIDEOS.slice(),
      reinforcerImages: Array.isArray(reinforcerImages) ? reinforcerImages.slice() : []
    };

    theme.startSound = SHARED_SOUNDS.start;
    theme.reinforcerSound = SHARED_SOUNDS.success;
    theme.errorSound = SHARED_SOUNDS.error;
    theme.finalRewardSound = SHARED_SOUNDS.final;

    return theme;
  }

  const baseThemes = {
    default: createTheme({
      id: 'default',
      displayName: 'Thème général',
      categoryId: 'generic',
      images: DEFAULT_BACKGROUNDS,
      transparentPNGs: [
        `${IMAGE_BASE}cartoonelephant.png`,
        `${IMAGE_BASE}cartoongiraffe.png`,
        `${IMAGE_BASE}cartoongorilla.png`
      ],
      words: ['Éléphant', 'Girafe', 'Gorille'],
      reinforcerVideos: [
        `${VIDEO_BUCKET}afrique1.mp4`,
        `${VIDEO_BUCKET}afrique2.mp4`
      ],
      startSound: `${SOUND_BASE}firework.mp3`
    }),
    patPatrouille: createTheme({
      id: 'patPatrouille',
      displayName: 'Pat Patrouille',
      categoryId: 'licence',
      colors: { primary: '#1F4AA5', accent: '#F8C300' },
      images: [
        `${IMAGE_BASE}patpatrouille1.jpg`,
        `${IMAGE_BASE}patpatrouille2.jpg`
      ],
      transparentPNGs: [
        `${IMAGE_BASE}pawpatrolruben.png`,
        `${IMAGE_BASE}chase.png`,
        `${IMAGE_BASE}pawpatroleverest.png`,
        `${IMAGE_BASE}pawpatrolmarshall.png`,
        `${IMAGE_BASE}pawpatrolrocky.png`,
        `${IMAGE_BASE}pawpatrolstella.png`,
        `${IMAGE_BASE}pawpatrolzuma.png`
      ],
      words: ['Ruben', 'Chase', 'Everest', 'Marshall', 'Rocky', 'Stella', 'Zuma'],
      reinforcerVideos: [
        `${VIDEO_BUCKET}patpatrouilleintro.mp4`,
        `${VIDEO_BUCKET}patpatrouillejungle.mp4`,
        `${VIDEO_BUCKET}patpatrouillepirate.mp4`,
        `${VIDEO_BUCKET}patpatrouillesauvetage.mp4`
      ],
      startSound: `${SOUND_BASE}pawpatrol1.mp3`
    }),
    moana: createTheme({
      id: 'moana',
      displayName: 'Vaiana',
      categoryId: 'licence',
      colors: { primary: '#0077B6', accent: '#FFB703' },
      images: [`${IMAGE_BASE}moana-background.jpg`],
      transparentPNGs: [
        `${IMAGE_BASE}moana.png`,
        `${IMAGE_BASE}maui.png`,
        `${IMAGE_BASE}pua.png`,
        `${IMAGE_BASE}palmier.png`
      ],
      words: ['Vaiana', 'Maui', 'Pua', 'Te Fiti'],
      reinforcerVideos: [
        `${VIDEO_BUCKET}moana-finale.mp4`,
        `${VIDEO_BUCKET}moana-le-bleu-lumiere.mp4`,
        `${VIDEO_BUCKET}moana-logo-te-pate.mp4`,
        `${VIDEO_BUCKET}moana-pour-les-hommes.mp4`
      ],
      startSound: `${SOUND_BASE}moana.mp3`
    }),
    toupieEtBinou: createTheme({
      id: 'toupieEtBinou',
      displayName: 'Toupie et Binou',
      categoryId: 'licence',
      colors: { primary: '#F97316', accent: '#FDE68A' },
      images: [
        `${IMAGE_BASE}toupiecamping.jpg`,
        `${IMAGE_BASE}toupiechambre.jpeg`,
        `${IMAGE_BASE}toupiecinema.jpeg`
      ],
      transparentPNGs: [
        `${IMAGE_BASE}toupieetbinou.png`,
        `${IMAGE_BASE}toupieetbinou2.png`,
        `${IMAGE_BASE}toupieetbinouart.png`,
        `${IMAGE_BASE}toupieetbinouavion.png`,
        `${IMAGE_BASE}binou.png`,
        `${IMAGE_BASE}toupieetbinouhalloween.png`
      ],
      words: ['Amitié', 'Courir', 'Peinture', 'Avion', 'Binou', 'Costume'],
      reinforcerVideos: [
        `${VIDEO_BUCKET}toupieetbinou1.mp4`,
        `${VIDEO_BUCKET}toupieetbinou2.mp4`,
        `${VIDEO_BUCKET}toupieetbinou3.mp4`,
        `${VIDEO_BUCKET}toupieetbinou4.mp4`,
        `${VIDEO_BUCKET}toupieetbinou5.mp4`
      ],
      startSound: `${SOUND_BASE}toupieetbinoustart.mp3`
    }),
    afrique: createTheme({
      id: 'afrique',
      displayName: 'Animaux d’Afrique',
      categoryId: 'animaux',
      colors: { primary: '#9A3412', accent: '#F59E0B' },
      images: [
        `${IMAGE_BASE}africanbackground1.webp`,
        `${IMAGE_BASE}africanbackground2.webp`,
        `${IMAGE_BASE}africanbackground3.webp`
      ],
      transparentPNGs: [
        `${IMAGE_BASE}cartoonelephant.png`,
        `${IMAGE_BASE}cartoongiraffe.png`,
        `${IMAGE_BASE}cartoongorilla.png`,
        `${IMAGE_BASE}cartoonlion.png`,
        `${IMAGE_BASE}cartoonrhino.png`,
        `${IMAGE_BASE}cartoontiger.png`
      ],
      words: ['Éléphant', 'Girafe', 'Gorille', 'Lion', 'Rhinocéros', 'Tigre'],
      reinforcerVideos: [
        `${VIDEO_BUCKET}afrique1.mp4`,
        `${VIDEO_BUCKET}afrique2.mp4`,
        `${VIDEO_BUCKET}afrique3.mp4`,
        `${VIDEO_BUCKET}afrique4.mp4`,
        `${VIDEO_BUCKET}afrique5.mp4`
      ],
      startSound: `${SOUND_BASE}africaflute.mp3`
    }),
    picto_animaux: createTheme({
      id: 'picto_animaux',
      displayName: 'Animaux (Pictogrammes)',
      categoryId: 'animaux',
      colors: { primary: '#D97706', accent: '#F97316' },
      images: [
        `${IMAGE_BASE}africanbackground1.webp`,
        `${IMAGE_BASE}africanbackground2.webp`,
        `${IMAGE_BASE}africanbackground3.webp`
      ],
      transparentPNGs: [
        `${IMAGE_BASE}pictos/bear.png`,
        `${IMAGE_BASE}pictos/beaver.png`,
        `${IMAGE_BASE}pictos/cat.png`,
        `${IMAGE_BASE}pictos/cow.png`,
        `${IMAGE_BASE}pictos/Hcow.png`,
        `${IMAGE_BASE}pictos/deer.png`,
        `${IMAGE_BASE}pictos/dog.png`,
        `${IMAGE_BASE}pictos/dolphin.png`,
        `${IMAGE_BASE}pictos/duck.png`,
        `${IMAGE_BASE}pictos/eagle.png`,
        `${IMAGE_BASE}pictos/elephant.png`,
        `${IMAGE_BASE}pictos/fish.png`,
        `${IMAGE_BASE}pictos/fox.png`,
        `${IMAGE_BASE}pictos/giraffe.png`,
        `${IMAGE_BASE}pictos/horse.png`,
        `${IMAGE_BASE}pictos/lion.png`,
        `${IMAGE_BASE}pictos/malemoose.png`,
        `${IMAGE_BASE}pictos/moose.png`,
        `${IMAGE_BASE}pictos/owl.png`,
        `${IMAGE_BASE}pictos/penguin.png`,
        `${IMAGE_BASE}pictos/pig.png`,
        `${IMAGE_BASE}pictos/rabbit.png`,
        `${IMAGE_BASE}pictos/racoon.png`,
        `${IMAGE_BASE}pictos/rooster.png`,
        `${IMAGE_BASE}pictos/shark.png`,
        `${IMAGE_BASE}pictos/sheep.png`,
        `${IMAGE_BASE}pictos/skunk.png`,
        `${IMAGE_BASE}pictos/snake.png`,
        `${IMAGE_BASE}pictos/squirrel.png`,
        `${IMAGE_BASE}pictos/tiger.png`,
        `${IMAGE_BASE}pictos/whale.png`
      ],
      words: [
        'Ours',
        'Castor',
        'Chat',
        'Vache',
        'Vache Holstein',
        'Cerf',
        'Chien',
        'Dauphin',
        'Canard',
        'Aigle',
        'Éléphant',
        'Poisson',
        'Renard',
        'Girafe',
        'Cheval',
        'Lion',
        'Orignal mâle',
        'Orignal',
        'Chouette',
        'Pingouin',
        'Cochon',
        'Lapin',
        'Raton laveur',
        'Coq',
        'Requin',
        'Mouton',
        'Moufette',
        'Serpent',
        'Écureuil',
        'Tigre',
        'Baleine'
      ],
      reinforcerVideos: [
        `${VIDEO_BUCKET}afrique1.mp4`,
        `${VIDEO_BUCKET}afrique2.mp4`,
        `${VIDEO_BUCKET}afrique3.mp4`
      ],
      startSound: `${SOUND_BASE}africaflute.mp3`,
      reinforcerSound: `${SOUND_BASE}africa-sound.wav`
    }),
    picto_aliments: createTheme({
      id: 'picto_aliments',
      displayName: 'Aliments (Pictogrammes)',
      categoryId: 'aliments',
      colors: { primary: '#B45309', accent: '#F97316' },
      images: [
        `${IMAGE_BASE}basket.webp`,
        `${IMAGE_BASE}association.png`,
        `${IMAGE_BASE}bgforest.png`
      ],
      transparentPNGs: [
        `${IMAGE_BASE}pictos/almond.png`,
        `${IMAGE_BASE}pictos/bread.png`,
        `${IMAGE_BASE}pictos/lentils.png`,
        `${IMAGE_BASE}pictos/oats.png`,
        `${IMAGE_BASE}pictos/peanut.png`,
        `${IMAGE_BASE}pictos/rice.png`,
        `${IMAGE_BASE}pictos/walnut.png`,
        `${IMAGE_BASE}pictos/apple.png`,
        `${IMAGE_BASE}pictos/avocado.png`,
        `${IMAGE_BASE}pictos/banana.png`,
        `${IMAGE_BASE}pictos/blueberry.png`,
        `${IMAGE_BASE}pictos/coconut.png`,
        `${IMAGE_BASE}pictos/grapes.png`,
        `${IMAGE_BASE}pictos/kiwi.png`,
        `${IMAGE_BASE}pictos/lemon.png`,
        `${IMAGE_BASE}pictos/lime.png`,
        `${IMAGE_BASE}pictos/mango.png`,
        `${IMAGE_BASE}pictos/olive.png`,
        `${IMAGE_BASE}pictos/orange.png`,
        `${IMAGE_BASE}pictos/pear.png`,
        `${IMAGE_BASE}pictos/pineapple.png`,
        `${IMAGE_BASE}pictos/raspberry.png`,
        `${IMAGE_BASE}pictos/strawberry.png`,
        `${IMAGE_BASE}pictos/watermelon.png`,
        `${IMAGE_BASE}pictos/beans.png`,
        `${IMAGE_BASE}pictos/bellpepper.png`,
        `${IMAGE_BASE}pictos/broccoli.png`,
        `${IMAGE_BASE}pictos/cabbage.png`,
        `${IMAGE_BASE}pictos/carrot.png`,
        `${IMAGE_BASE}pictos/cauliflower.png`,
        `${IMAGE_BASE}pictos/chickpeas.png`,
        `${IMAGE_BASE}pictos/chilipepper.png`,
        `${IMAGE_BASE}pictos/corn.png`,
        `${IMAGE_BASE}pictos/cucumber.png`,
        `${IMAGE_BASE}pictos/eggplant.png`,
        `${IMAGE_BASE}pictos/garlic.png`,
        `${IMAGE_BASE}pictos/lettuce.png`,
        `${IMAGE_BASE}pictos/mushroom.png`,
        `${IMAGE_BASE}pictos/onion.png`,
        `${IMAGE_BASE}pictos/pepper.png`,
        `${IMAGE_BASE}pictos/potato.png`,
        `${IMAGE_BASE}pictos/radish.png`,
        `${IMAGE_BASE}pictos/seaweed.png`,
        `${IMAGE_BASE}pictos/spinach.png`,
        `${IMAGE_BASE}pictos/sweetpotato.png`,
        `${IMAGE_BASE}pictos/tomato.png`,
        `${IMAGE_BASE}pictos/zuchini.png`
      ],
      words: [
        'Amande',
        'Pain',
        'Lentilles',
        'Avoine',
        'Arachide',
        'Riz',
        'Noix',
        'Pomme',
        'Avocat',
        'Banane',
        'Bleuet',
        'Noix de coco',
        'Raisin',
        'Kiwi',
        'Citron',
        'Lime',
        'Mangue',
        'Olive',
        'Orange',
        'Poire',
        'Ananas',
        'Framboise',
        'Fraise',
        'Pastèque',
        'Haricots',
        'Poivron',
        'Brocoli',
        'Chou',
        'Carotte',
        'Chou-fleur',
        'Pois chiches',
        'Piment',
        'Maïs',
        'Concombre',
        'Aubergine',
        'Ail',
        'Laitue',
        'Champignon',
        'Oignon',
        'Poivre',
        'Pomme de terre',
        'Radis',
        'Algues',
        'Épinards',
        'Patate douce',
        'Tomate',
        'Courgette'
      ],
      reinforcerVideos: [
        `${VIDEO_BUCKET}toupieetbinou2.mp4`,
        `${VIDEO_BUCKET}toupieetbinou3.mp4`,
        `${VIDEO_BUCKET}toupieetbinou4.mp4`
      ],
      startSound: `${SOUND_BASE}cartoon/cartoonappear2.mp3`,
      reinforcerSound: `${SOUND_BASE}cartoon/cartoonappear3.mp3`
    }),
    picto_transports: createTheme({
      id: 'picto_transports',
      displayName: 'Transports (Pictogrammes)',
      categoryId: 'transports',
      colors: { primary: '#1F4AA5', accent: '#F97316' },
      images: [
        `${IMAGE_BASE}patpatrouille1.jpg`,
        `${IMAGE_BASE}patpatrouille2.jpg`
      ],
      transparentPNGs: [
        `${IMAGE_BASE}pictos/bicycle.png`,
        `${IMAGE_BASE}pictos/boat.png`,
        `${IMAGE_BASE}pictos/bus.png`,
        `${IMAGE_BASE}pictos/car.png`,
        `${IMAGE_BASE}pictos/caravan.png`,
        `${IMAGE_BASE}pictos/firetruck.png`,
        `${IMAGE_BASE}pictos/helicopter.png`,
        `${IMAGE_BASE}pictos/monstertruck.png`,
        `${IMAGE_BASE}pictos/moto.png`,
        `${IMAGE_BASE}pictos/policecar.png`,
        `${IMAGE_BASE}pictos/rocket.png`,
        `${IMAGE_BASE}pictos/schoolbus.png`,
        `${IMAGE_BASE}pictos/sportscar.png`,
        `${IMAGE_BASE}pictos/submarine.png`,
        `${IMAGE_BASE}pictos/truck.png`
      ],
      words: [
        'Vélo',
        'Bateau',
        'Autobus',
        'Voiture',
        'Caravane',
        'Camion de pompiers',
        'Hélicoptère',
        'Monster truck',
        'Moto',
        'Voiture de police',
        'Fusée',
        'Autobus scolaire',
        'Voiture de sport',
        'Sous-marin',
        'Camion'
      ],
      reinforcerVideos: [
        `${VIDEO_BUCKET}patpatrouillejungle.mp4`,
        `${VIDEO_BUCKET}patpatrouillesauvetage.mp4`
      ],
      startSound: `${SOUND_BASE}cartoon/cartoonappear4.mp3`
    }),
    picto_vehiculesConstruction: createTheme({
      id: 'picto_vehiculesConstruction',
      displayName: 'Véhicules de construction (Pictogrammes)',
      categoryId: 'vehiculesConstruction',
      colors: { primary: '#92400E', accent: '#FBBF24' },
      images: [
        `${IMAGE_BASE}toupiecamping.jpg`,
        `${IMAGE_BASE}toupiecinema.jpeg`
      ],
      transparentPNGs: [
        `${IMAGE_BASE}pictos/bulldozer.png`,
        `${IMAGE_BASE}pictos/cementtruck.png`,
        `${IMAGE_BASE}pictos/compactor.png`,
        `${IMAGE_BASE}pictos/crane truck.png`,
        `${IMAGE_BASE}pictos/crane.png`,
        `${IMAGE_BASE}pictos/dumptruck.png`,
        `${IMAGE_BASE}pictos/excavator.png`,
        `${IMAGE_BASE}pictos/forklift.png`,
        `${IMAGE_BASE}pictos/loader.png`,
        `${IMAGE_BASE}pictos/roadroller.png`,
        `${IMAGE_BASE}pictos/tractor.png`
      ],
      words: [
        'Bulldozer',
        'Camion bétonnière',
        'Compacteur',
        'Camion-grue',
        'Grue',
        'Camion-benne',
        'Excavatrice',
        'Chariot élévateur',
        'Chargeuse',
        'Rouleau compresseur',
        'Tracteur'
      ],
      reinforcerVideos: [
        `${VIDEO_BUCKET}patpatrouillepirate.mp4`,
        `${VIDEO_BUCKET}patpatrouillejungle.mp4`
      ],
      startSound: `${SOUND_BASE}cartoon/cartoonappear5.mp3`
    })
  };

  const themeAliases = {
    PatPatrouille: 'patPatrouille',
    Toupie_et_Binou: 'toupieEtBinou',
    Afrique: 'afrique'
  };

  Object.entries(themeAliases).forEach(([alias, canonical]) => {
    if (baseThemes[canonical]) {
      Object.defineProperty(baseThemes, alias, {
        get() {
          return baseThemes[canonical];
        },
        enumerable: false
      });
    }
  });

  global.themes = baseThemes;

})(typeof window !== 'undefined' ? window : undefined);

