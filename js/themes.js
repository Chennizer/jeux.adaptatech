/* themes.js */
(function (global) {
  'use strict';

  const MEDIA_BASE = '../../';
  const IMAGE_BASE = `${MEDIA_BASE}images/`;
  const SOUND_BASE = `${MEDIA_BASE}sounds/`;
  const DEFAULT_THEME_ID = 'default';

  const DEFAULT_SOUNDS = {
    startSound: 'pagestart.mp3',
    reinforcerSound: 'victory.mp3',
    errorSound: 'error.mp3',
    finalRewardSound: 'success3.mp3'
  };

  function isExternalPath(path) {
    return /^(?:https?:)?\/\//i.test(path) || path.startsWith('data:');
  }

  function resolveAssetPath(base, path) {
    if (!path || typeof path !== 'string') {
      return path;
    }
    if (isExternalPath(path) || path.startsWith('../') || path.startsWith('./') || path.startsWith('../../')) {
      return path;
    }
    return `${base}${path}`;
  }

  function resolveAssetList(base, entries) {
    if (!Array.isArray(entries)) {
      return [];
    }
    return entries.map((entry) => resolveAssetPath(base, entry));
  }

  function combineArticleWord(label) {
    if (!label) {
      return null;
    }
    const article = (label.article || '').trim();
    const word = (label.word || '').trim();
    if (!article) {
      return word || null;
    }
    if (!word) {
      return null;
    }
    const needsSpace = !/[’']$/u.test(article);
    return needsSpace ? `${article} ${word}` : `${article}${word}`;
  }

  function buildWordsFromItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((item) => combineArticleWord(item && item.label && item.label.fr))
      .filter(Boolean);
  }

  function createGradientBackground(label, startColor, endColor) {
    const safeLabel = encodeURIComponent(label || '');
    const safeStart = encodeURIComponent(startColor || '#4c6ef5');
    const safeEnd = encodeURIComponent(endColor || '#7950f2');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>` +
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'>` +
      `<defs>` +
      `<linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>` +
      `<stop offset='0%' stop-color='${safeStart}'/>` +
      `<stop offset='100%' stop-color='${safeEnd}'/>` +
      `</linearGradient>` +
      `</defs>` +
      `<rect width='1200' height='800' fill='url(#g)'/>` +
      `<text x='50%' y='55%' fill='white' font-family='"Montserrat", "Arial", sans-serif' font-size='140' text-anchor='middle' opacity='0.8'>${safeLabel}</text>` +
      `</svg>`;
    return `data:image/svg+xml;utf8,${svg}`;
  }

  function toArray(value) {
    if (!value) {
      return [];
    }
    return Array.isArray(value) ? value.slice() : [value];
  }

  function createTheme(config) {
    const {
      id,
      displayName,
      description,
      backgrounds = [],
      tokens = [],
      words = [],
      reinforcerVideos = [],
      reinforcerImages = [],
      sounds = {},
      metadata = {}
    } = config || {};

    const theme = {
      id,
      displayName,
      description,
      images: resolveAssetList(IMAGE_BASE, toArray(backgrounds)),
      transparentPNGs: resolveAssetList(IMAGE_BASE, toArray(tokens)),
      words: toArray(words),
      reinforcerVideos: toArray(reinforcerVideos),
      reinforcerImages: resolveAssetList(IMAGE_BASE, toArray(reinforcerImages)),
      startSound: resolveAssetPath(SOUND_BASE, sounds.startSound || DEFAULT_SOUNDS.startSound),
      reinforcerSound: resolveAssetPath(SOUND_BASE, sounds.reinforcerSound || DEFAULT_SOUNDS.reinforcerSound),
      errorSound: resolveAssetPath(SOUND_BASE, sounds.errorSound || DEFAULT_SOUNDS.errorSound),
      finalRewardSound: resolveAssetPath(SOUND_BASE, sounds.finalRewardSound || DEFAULT_SOUNDS.finalRewardSound),
      metadata: Object.assign({ themeId: id }, metadata)
    };

    return theme;
  }

  function freezeTheme(theme) {
    if (!theme) {
      return theme;
    }
    const frozenTheme = Object.assign({}, theme);
    frozenTheme.images = Object.freeze(theme.images.slice());
    frozenTheme.transparentPNGs = Object.freeze(theme.transparentPNGs.slice());
    frozenTheme.words = Object.freeze(theme.words.slice());
    frozenTheme.reinforcerVideos = Object.freeze(theme.reinforcerVideos.slice());
    frozenTheme.reinforcerImages = Object.freeze(theme.reinforcerImages.slice());
    frozenTheme.metadata = Object.freeze(Object.assign({}, theme.metadata));
    return Object.freeze(frozenTheme);
  }

  const PICTO_CATEGORIES = {
    animaux: {
      label: { fr: 'Animaux', en: 'Animals' },
      items: [
        {
          file: 'bear.png',
          label: {
            fr: { article: 'l’', word: 'ours' },
            en: { article: 'the', word: 'bear' }
          }
        },
        {
          file: 'cat.png',
          label: {
            fr: { article: 'le', word: 'chat' },
            en: { article: 'the', word: 'cat' }
          }
        },
        {
          file: 'dog.png',
          label: {
            fr: { article: 'le', word: 'chien' },
            en: { article: 'the', word: 'dog' }
          }
        },
        {
          file: 'elephant.png',
          label: {
            fr: { article: 'l’', word: 'éléphant' },
            en: { article: 'the', word: 'elephant' }
          }
        },
        {
          file: 'giraffe.png',
          label: {
            fr: { article: 'la', word: 'girafe' },
            en: { article: 'the', word: 'giraffe' }
          }
        },
        {
          file: 'lion.png',
          label: {
            fr: { article: 'le', word: 'lion' },
            en: { article: 'the', word: 'lion' }
          }
        },
        {
          file: 'penguin.png',
          label: {
            fr: { article: 'le', word: 'pingouin' },
            en: { article: 'the', word: 'penguin' }
          }
        },
        {
          file: 'rabbit.png',
          label: {
            fr: { article: 'le', word: 'lapin' },
            en: { article: 'the', word: 'rabbit' }
          }
        },
        {
          file: 'tiger.png',
          label: {
            fr: { article: 'le', word: 'tigre' },
            en: { article: 'the', word: 'tiger' }
          }
        },
        {
          file: 'whale.png',
          label: {
            fr: { article: 'la', word: 'baleine' },
            en: { article: 'the', word: 'whale' }
          }
        }
      ]
    },
    fruits: {
      label: { fr: 'Fruits', en: 'Fruits' },
      items: [
        {
          file: 'apple.png',
          label: {
            fr: { article: 'la', word: 'pomme' },
            en: { article: 'the', word: 'apple' }
          }
        },
        {
          file: 'banana.png',
          label: {
            fr: { article: 'la', word: 'banane' },
            en: { article: 'the', word: 'banana' }
          }
        },
        {
          file: 'grapes.png',
          label: {
            fr: { article: 'le', word: 'raisin' },
            en: { article: 'the', word: 'grapes' }
          }
        },
        {
          file: 'kiwi.png',
          label: {
            fr: { article: 'le', word: 'kiwi' },
            en: { article: 'the', word: 'kiwi' }
          }
        },
        {
          file: 'lemon.png',
          label: {
            fr: { article: 'le', word: 'citron' },
            en: { article: 'the', word: 'lemon' }
          }
        },
        {
          file: 'mango.png',
          label: {
            fr: { article: 'la', word: 'mangue' },
            en: { article: 'the', word: 'mango' }
          }
        },
        {
          file: 'orange.png',
          label: {
            fr: { article: 'l’', word: 'orange' },
            en: { article: 'the', word: 'orange' }
          }
        },
        {
          file: 'pear.png',
          label: {
            fr: { article: 'la', word: 'poire' },
            en: { article: 'the', word: 'pear' }
          }
        },
        {
          file: 'pineapple.png',
          label: {
            fr: { article: 'l’', word: 'ananas' },
            en: { article: 'the', word: 'pineapple' }
          }
        },
        {
          file: 'strawberry.png',
          label: {
            fr: { article: 'la', word: 'fraise' },
            en: { article: 'the', word: 'strawberry' }
          }
        }
      ]
    },
    vaisselleCuisine: {
      label: { fr: 'Vaisselle et cuisine', en: 'Dishes and kitchen' },
      items: [
        {
          file: 'bowl.png',
          label: {
            fr: { article: 'le', word: 'bol' },
            en: { article: 'the', word: 'bowl' }
          }
        },
        {
          file: 'cup.png',
          label: {
            fr: { article: 'la', word: 'tasse' },
            en: { article: 'the', word: 'cup' }
          }
        },
        {
          file: 'fork.png',
          label: {
            fr: { article: 'la', word: 'fourchette' },
            en: { article: 'the', word: 'fork' }
          }
        },
        {
          file: 'knife.png',
          label: {
            fr: { article: 'le', word: 'couteau' },
            en: { article: 'the', word: 'knife' }
          }
        },
        {
          file: 'plate.png',
          label: {
            fr: { article: 'l’', word: 'assiette' },
            en: { article: 'the', word: 'plate' }
          }
        },
        {
          file: 'pot.png',
          label: {
            fr: { article: 'la', word: 'casserole' },
            en: { article: 'the', word: 'pot' }
          }
        },
        {
          file: 'refrigerator.png',
          label: {
            fr: { article: 'le', word: 'réfrigérateur' },
            en: { article: 'the', word: 'refrigerator' }
          }
        },
        {
          file: 'spoon.png',
          label: {
            fr: { article: 'la', word: 'cuillère' },
            en: { article: 'the', word: 'spoon' }
          }
        },
        {
          file: 'toaster.png',
          label: {
            fr: { article: 'le', word: 'grille-pain' },
            en: { article: 'the', word: 'toaster' }
          }
        },
        {
          file: 'woodenspoon.png',
          label: {
            fr: { article: 'la', word: 'cuillère de bois' },
            en: { article: 'the', word: 'wooden spoon' }
          }
        }
      ]
    },
    vetementsAccessoires: {
      label: { fr: 'Vêtements et accessoires', en: 'Clothes and accessories' },
      items: [
        {
          file: 'coat.png',
          label: {
            fr: { article: 'le', word: 'manteau' },
            en: { article: 'the', word: 'coat' }
          }
        },
        {
          file: 'hat.png',
          label: {
            fr: { article: 'le', word: 'chapeau' },
            en: { article: 'the', word: 'hat' }
          }
        },
        {
          file: 'mittens.png',
          label: {
            fr: { article: 'les', word: 'mitaines' },
            en: { article: 'the', word: 'mittens' }
          }
        },
        {
          file: 'pants.png',
          label: {
            fr: { article: 'le', word: 'pantalon' },
            en: { article: 'the', word: 'pants' }
          }
        },
        {
          file: 'shirt.png',
          label: {
            fr: { article: 'la', word: 'chemise' },
            en: { article: 'the', word: 'shirt' }
          }
        },
        {
          file: 'shoes.png',
          label: {
            fr: { article: 'les', word: 'chaussures' },
            en: { article: 'the', word: 'shoes' }
          }
        },
        {
          file: 'skirt.png',
          label: {
            fr: { article: 'la', word: 'jupe' },
            en: { article: 'the', word: 'skirt' }
          }
        },
        {
          file: 'sock.png',
          label: {
            fr: { article: 'la', word: 'chaussette' },
            en: { article: 'the', word: 'sock' }
          }
        },
        {
          file: 'greenshirt.png',
          label: {
            fr: { article: 'le', word: 'chandail vert' },
            en: { article: 'the', word: 'green shirt' }
          }
        }
      ]
    },
    jouetsFidgets: {
      label: { fr: 'Jouets et fidgets', en: 'Toys and fidgets' },
      items: [
        {
          file: 'lego.png',
          label: {
            fr: { article: 'le', word: 'bloc Lego' },
            en: { article: 'the', word: 'Lego block' }
          }
        },
        {
          file: 'letterpuzzle.png',
          label: {
            fr: { article: 'le', word: 'puzzle de lettres' },
            en: { article: 'the', word: 'letter puzzle' }
          }
        },
        {
          file: 'pinkfidget.png',
          label: {
            fr: { article: 'le', word: 'fidget rose' },
            en: { article: 'the', word: 'pink fidget' }
          }
        },
        {
          file: 'spinner.png',
          label: {
            fr: { article: 'la', word: 'toupie' },
            en: { article: 'the', word: 'spinner' }
          }
        },
        {
          file: 'tangle.png',
          label: {
            fr: { article: 'le', word: 'tangle' },
            en: { article: 'the', word: 'tangle' }
          }
        },
        {
          file: 'train.png',
          label: {
            fr: { article: 'le', word: 'train' },
            en: { article: 'the', word: 'train' }
          }
        }
      ]
    },
    hygieneSante: {
      label: { fr: 'Hygiène et santé', en: 'Hygiene and health' },
      items: [
        {
          file: 'soap.png',
          label: {
            fr: { article: 'le', word: 'savon' },
            en: { article: 'the', word: 'soap' }
          }
        },
        {
          file: 'toothpaste.png',
          label: {
            fr: { article: 'le', word: 'dentifrice' },
            en: { article: 'the', word: 'toothpaste' }
          }
        },
        {
          file: 'toilet.png',
          label: {
            fr: { article: 'la', word: 'toilette' },
            en: { article: 'the', word: 'toilet' }
          }
        },
        {
          file: 'sink.png',
          label: {
            fr: { article: 'le', word: 'lavabo' },
            en: { article: 'the', word: 'sink' }
          }
        },
        {
          file: 'gastrostomybag.png',
          label: {
            fr: { article: 'le', word: 'sac de gastrostomie' },
            en: { article: 'the', word: 'gastrostomy bag' }
          }
        }
      ]
    }
  };

  function createPictoTheme(config) {
    const category = PICTO_CATEGORIES[config.categoryId];
    if (!category) {
      return null;
    }
    const items = Array.isArray(config.items) && config.items.length > 0
      ? config.items
      : category.items;

    const themeDisplayName = config.displayName || category.label;

    const theme = createTheme({
      id: config.id,
      displayName: themeDisplayName,
      description: config.description || `Thème généré à partir des pictogrammes « ${category.label.fr} ».`,
      backgrounds: config.backgrounds,
      tokens: items.map((item) => `pictos/${item.file}`),
      words: buildWordsFromItems(items),
      reinforcerVideos: config.reinforcerVideos,
      reinforcerImages: config.reinforcerImages,
      sounds: config.sounds,
      metadata: Object.assign(
        {
          categoryId: config.categoryId,
          accentColor: config.accentColor || '#2563eb',
          source: 'pictos'
        },
        config.metadata || {}
      )
    });

    return theme;
  }

  const themes = {};

  const defaultTheme = createTheme({
    id: DEFAULT_THEME_ID,
    displayName: { fr: 'Thème général', en: 'General theme' },
    description: 'Ressources génériques utilisables pour toutes les activités sensorimotrices.',
    backgrounds: [
      'printempsfleurs.png',
      createGradientBackground('Apprendre', '#2563eb', '#38bdf8')
    ],
    tokens: PICTO_CATEGORIES.jouetsFidgets.items.map((item) => `pictos/${item.file}`),
    words: buildWordsFromItems(PICTO_CATEGORIES.jouetsFidgets.items),
    sounds: {
      startSound: 'pagestart.mp3',
      reinforcerSound: 'victory.mp3',
      errorSound: 'error.mp3',
      finalRewardSound: 'success4.mp3'
    },
    metadata: {
      accentColor: '#2563eb',
      categoryId: 'general'
    }
  });
  themes[DEFAULT_THEME_ID] = freezeTheme(defaultTheme);

  const manualThemes = [
    createTheme({
      id: 'PatPatrouille',
      displayName: { fr: 'Pat Patrouille', en: 'Paw Patrol' },
      description: 'Retrouver la Pat Patrouille dans une sélection d’images, de personnages et de vidéos.',
      backgrounds: ['patpatrouille1.jpg', 'patpatrouille2.jpg'],
      tokens: [
        'pawpatrolruben.png',
        'chase.png',
        'pawpatroleverest.png',
        'pawpatrolmarshall.png',
        'pawpatrolrocky.png',
        'pawpatrolstella.png',
        'pawpatrolzuma.png'
      ],
      words: ['Ruben', 'Chase', 'Everest', 'Marshall', 'Rocky', 'Stella', 'Zuma'],
      reinforcerVideos: [
        'https://bucket.adaptatech.org/patpatrouilleintro.mp4',
        'https://bucket.adaptatech.org/patpatrouillejungle.mp4',
        'https://bucket.adaptatech.org/patpatrouillepirate.mp4',
        'https://bucket.adaptatech.org/patpatrouillesauvetage.mp4'
      ],
      sounds: {
        startSound: 'pawpatrol1.mp3',
        reinforcerSound: 'victory.mp3'
      },
      metadata: {
        accentColor: '#1d4ed8',
        categoryId: 'serie',
        source: 'custom'
      }
    }),
    createTheme({
      id: 'moana',
      displayName: { fr: 'Vaiana', en: 'Moana' },
      description: 'Voyage sur l’océan avec Moana, Maui et leurs amis.',
      backgrounds: ['moana-background.jpg'],
      tokens: ['moana.png', 'maui.png', 'pua.png', 'heihei.png', 'palmier.png'],
      words: ['Moana', 'Maui', 'Pua', 'Hei Hei', 'Palmier'],
      reinforcerVideos: [
        'https://bucket.adaptatech.org/moana-finale.mp4',
        'https://bucket.adaptatech.org/moana-le-bleu-lumiere.mp4',
        'https://bucket.adaptatech.org/moana-logo-te-pate.mp4',
        'https://bucket.adaptatech.org/moana-pour-les-hommes.mp4'
      ],
      sounds: {
        startSound: 'moana.mp3',
        reinforcerSound: 'victory.mp3'
      },
      metadata: {
        accentColor: '#0ea5e9',
        categoryId: 'film',
        source: 'custom'
      }
    }),
    createTheme({
      id: 'Toupie_et_Binou',
      displayName: { fr: 'Toupie et Binou', en: 'Toopy & Binoo' },
      description: 'Les aventures imaginaires de Toupie et Binou.',
      backgrounds: ['toupiecamping.jpg', 'toupiechambre.jpeg', 'toupiecinema.jpeg'],
      tokens: [
        'toupieetbinou.png',
        'toupieetbinou2.png',
        'toupieetbinouart.png',
        'toupieetbinouavion.png',
        'binou.png',
        'toupieetbinouhalloween.png'
      ],
      words: ['Amitié', 'Courir', 'Peinture', 'Avion', 'Binou', 'Costume'],
      reinforcerVideos: [
        'https://bucket.adaptatech.org/toupieetbinou1.mp4',
        'https://bucket.adaptatech.org/toupieetbinou2.mp4',
        'https://bucket.adaptatech.org/toupieetbinou3.mp4',
        'https://bucket.adaptatech.org/toupieetbinou4.mp4',
        'https://bucket.adaptatech.org/toupieetbinou5.mp4'
      ],
      sounds: {
        startSound: 'toupieetbinoustart.mp3',
        reinforcerSound: 'victory.mp3'
      },
      metadata: {
        accentColor: '#d946ef',
        categoryId: 'serie',
        source: 'custom'
      }
    }),
    createTheme({
      id: 'Afrique',
      displayName: { fr: 'Animaux d’Afrique', en: 'African animals' },
      description: 'Un safari imaginaire pour découvrir les animaux africains.',
      backgrounds: ['africanbackground1.webp', 'africanbackground2.webp', 'africanbackground3.webp'],
      tokens: [
        'cartoonelephant.png',
        'cartoongiraffe.png',
        'cartoongorilla.png',
        'cartoonlion.png',
        'cartoonrhino.png',
        'cartoontiger.png'
      ],
      words: ['Éléphant', 'Girafe', 'Gorille', 'Lion', 'Rhinocéros', 'Tigre'],
      reinforcerVideos: [
        'https://bucket.adaptatech.org/afrique1.mp4',
        'https://bucket.adaptatech.org/afrique2.mp4',
        'https://bucket.adaptatech.org/afrique3.mp4',
        'https://bucket.adaptatech.org/afrique4.mp4',
        'https://bucket.adaptatech.org/afrique5.mp4'
      ],
      sounds: {
        startSound: 'africaflute.mp3',
        reinforcerSound: 'victory.mp3'
      },
      metadata: {
        accentColor: '#f97316',
        categoryId: 'animaux',
        source: 'custom'
      }
    })
  ];

  manualThemes.forEach((theme) => {
    themes[theme.id] = freezeTheme(theme);
  });

  const pictoThemeConfigs = [
    {
      id: 'animauxPicto',
      categoryId: 'animaux',
      displayName: { fr: 'Animaux (pictogrammes)', en: 'Animals (pictograms)' },
      backgrounds: ['africanbackground1.webp', 'africanbackground2.webp', 'africanbackground3.webp'],
      reinforcerVideos: ['https://bucket.adaptatech.org/afrique3.mp4'],
      sounds: { startSound: 'africaflute.mp3' },
      metadata: { accentColor: '#f2992e' }
    },
    {
      id: 'fruitsPicto',
      categoryId: 'fruits',
      displayName: { fr: 'Fruits colorés', en: 'Colourful fruits' },
      backgrounds: [
        'printempsfleurs.png',
        createGradientBackground('Fruits', '#f59e0b', '#ef4444')
      ],
      sounds: { startSound: 'harp.mp3', reinforcerSound: 'success3.mp3' },
      metadata: { accentColor: '#f97316' }
    },
    {
      id: 'cuisinePicto',
      categoryId: 'vaisselleCuisine',
      displayName: { fr: 'Dans la cuisine', en: 'In the kitchen' },
      backgrounds: [
        createGradientBackground('Cuisine', '#0ea5e9', '#0284c7'),
        'toupiechambre.jpeg'
      ],
      sounds: { startSound: 'pagestart.mp3', reinforcerSound: 'victory.mp3' },
      metadata: { accentColor: '#0ea5e9' }
    },
    {
      id: 'vetementsPicto',
      categoryId: 'vetementsAccessoires',
      displayName: { fr: 'S’habiller', en: 'Getting dressed' },
      backgrounds: [
        createGradientBackground('Vêtements', '#8b5cf6', '#ec4899'),
        'printempsfleurs.png'
      ],
      sounds: { startSound: 'titouni.mp3', reinforcerSound: 'victory.mp3' },
      metadata: { accentColor: '#8b5cf6' }
    },
    {
      id: 'jouetsPicto',
      categoryId: 'jouetsFidgets',
      displayName: { fr: 'Jeux et fidgets', en: 'Toys & fidgets' },
      backgrounds: [
        createGradientBackground('Jouer', '#f472b6', '#f97316'),
        'toupieetbinouart.png'
      ],
      sounds: { startSound: 'toupieetbinoustart.mp3', reinforcerSound: 'victory.mp3' },
      metadata: { accentColor: '#f472b6' }
    },
    {
      id: 'hygienePicto',
      categoryId: 'hygieneSante',
      displayName: { fr: 'Hygiène quotidienne', en: 'Daily hygiene' },
      backgrounds: [
        createGradientBackground('Hygiène', '#22d3ee', '#38bdf8')
      ],
      sounds: { startSound: 'winter.mp3', reinforcerSound: 'victory.mp3' },
      metadata: { accentColor: '#22d3ee' }
    }
  ];

  pictoThemeConfigs.forEach((config) => {
    const theme = createPictoTheme(config);
    if (theme) {
      themes[config.id] = freezeTheme(theme);
    }
  });

  global.themes = Object.freeze(Object.assign({}, themes));
})(window);
