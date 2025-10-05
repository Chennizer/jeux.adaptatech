/* Enhanced theme registry for sensory games */
(function registerSensoryThemes(global) {
  'use strict';

  if (!global) {
    return;
  }

  const MEDIA_BASE = '../../';
  const IMAGE_BASE = `${MEDIA_BASE}images/`;
  const SOUND_BASE = `${MEDIA_BASE}sounds/`;
  const VIDEO_BUCKET = 'https://bucket.adaptatech.org/';
  const PICTO_INDEX_PATH = `${IMAGE_BASE}pictos/index.json`;

  const DEFAULT_COLORS = { primary: '#175676', accent: '#FFC857' };
  const DEFAULT_BACKGROUNDS = [
    `${IMAGE_BASE}bgforest.png`,
    `${IMAGE_BASE}africanbackground2.webp`,
    `${IMAGE_BASE}africanbackground3.webp`
  ];
  const DEFAULT_REINFORCER_SOUND = `${SOUND_BASE}victory.mp3`;
  const DEFAULT_ERROR_SOUND = `${SOUND_BASE}error.mp3`;
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
      startSound,
      reinforcerSound,
      errorSound,
      finalRewardSound
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

    if (startSound) {
      theme.startSound = startSound;
    }
    theme.reinforcerSound = reinforcerSound || DEFAULT_REINFORCER_SOUND;
    theme.errorSound = errorSound || DEFAULT_ERROR_SOUND;
    if (finalRewardSound) {
      theme.finalRewardSound = finalRewardSound;
    }

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

  const PICTO_CATEGORY_MAPPINGS = {
    animaux: {
      displayName: 'Animaux (Pictogrammes)',
      images: [
        `${IMAGE_BASE}africanbackground1.webp`,
        `${IMAGE_BASE}africanbackground3.webp`
      ],
      colors: { primary: '#D97706', accent: '#F97316' },
      startSound: `${SOUND_BASE}africaflute.mp3`,
      reinforcerSound: `${SOUND_BASE}africa-sound.wav`,
      reinforcerVideos: [
        `${VIDEO_BUCKET}afrique1.mp4`,
        `${VIDEO_BUCKET}afrique2.mp4`,
        `${VIDEO_BUCKET}afrique3.mp4`
      ]
    },
    aliments: {
      displayName: 'Aliments (Pictogrammes)',
      images: [`${IMAGE_BASE}basket.webp`, `${IMAGE_BASE}association.png`],
      colors: { primary: '#B45309', accent: '#F97316' },
      startSound: `${SOUND_BASE}cartoon/cartoonappear1.mp3`,
      reinforcerSound: `${SOUND_BASE}cartoon/cartoonappear3.mp3`,
      reinforcerVideos: [
        `${VIDEO_BUCKET}toupieetbinou2.mp4`,
        `${VIDEO_BUCKET}toupieetbinou3.mp4`
      ]
    },
    fruits: {
      displayName: 'Fruits (Pictogrammes)',
      images: [`${IMAGE_BASE}basket.webp`, `${IMAGE_BASE}bgforest.png`],
      colors: { primary: '#DB2777', accent: '#FBBF24' },
      startSound: `${SOUND_BASE}cartoon/cartoonappear2.mp3`,
      reinforcerVideos: [
        `${VIDEO_BUCKET}moana-le-bleu-lumiere.mp4`,
        `${VIDEO_BUCKET}moana-logo-te-pate.mp4`
      ]
    },
    legumes: {
      displayName: 'Légumes (Pictogrammes)',
      images: [`${IMAGE_BASE}basket.webp`, `${IMAGE_BASE}association.png`],
      colors: { primary: '#15803D', accent: '#86EFAC' },
      startSound: `${SOUND_BASE}cartoon/cartoonappear3.mp3`,
      reinforcerVideos: [
        `${VIDEO_BUCKET}toupieetbinou4.mp4`,
        `${VIDEO_BUCKET}toupieetbinou5.mp4`
      ]
    },
    jouetsFidgets: {
      displayName: 'Jouets et Fidgets',
      images: [`${IMAGE_BASE}toupiechambre.jpeg`, `${IMAGE_BASE}toupiecinema.jpeg`],
      colors: { primary: '#7C3AED', accent: '#F472B6' },
      startSound: `${SOUND_BASE}cartoon/cartoonappear4.mp3`,
      reinforcerVideos: [
        `${VIDEO_BUCKET}patpatrouillejungle.mp4`,
        `${VIDEO_BUCKET}patpatrouillesauvetage.mp4`
      ]
    },
    hygieneSante: {
      displayName: 'Hygiène et santé',
      images: DEFAULT_BACKGROUNDS,
      colors: { primary: '#0F766E', accent: '#5EEAD4' },
      startSound: `${SOUND_BASE}cartoon/cartoonappear5.mp3`,
      reinforcerVideos: [
        `${VIDEO_BUCKET}patpatrouillepirate.mp4`,
        `${VIDEO_BUCKET}moana-pour-les-hommes.mp4`
      ]
    }
  };

  function buildLabel(item) {
    if (!item || !item.label) {
      return null;
    }
    const frenchLabel = item.label.fr || {};
    const rawWord = typeof frenchLabel.word === 'string' ? frenchLabel.word.trim() : '';
    if (!rawWord) {
      return null;
    }
    const normalized = rawWord.replace(/\s+/g, ' ');
    const [firstChar, ...rest] = normalized;
    if (!firstChar) {
      return null;
    }
    const capitalizedFirst = firstChar.toLocaleUpperCase('fr-FR');
    return `${capitalizedFirst}${rest.join('')}`;
  }

  const MIN_PICTO_ITEMS_FOR_THEME = 8;

  function generatePictoThemes(indexJson) {
    if (!indexJson || !indexJson.categories) {
      return {};
    }

    const basePath = typeof indexJson.base === 'string' ? indexJson.base : `${IMAGE_BASE}pictos/`;
    const preparedCategories = [];

    Object.entries(indexJson.categories).forEach(([categoryId, categoryData]) => {
      if (!categoryData || !Array.isArray(categoryData.items)) {
        return;
      }

      const validItems = categoryData.items.filter(item => item && typeof item.file === 'string');
      if (validItems.length === 0) {
        return;
      }

      preparedCategories.push({
        id: categoryId,
        data: categoryData,
        items: validItems,
        itemCount: validItems.length
      });
    });

    if (preparedCategories.length === 0) {
      return {};
    }

    const richCategories = preparedCategories.filter(category => category.itemCount >= MIN_PICTO_ITEMS_FOR_THEME);
    const categoriesToUse = (richCategories.length > 0 ? richCategories : preparedCategories)
      .slice()
      .sort((a, b) => b.itemCount - a.itemCount);

    const generated = {};

    categoriesToUse.forEach((category) => {
      const { id: categoryId, data: categoryData, items } = category;
      const mapping = PICTO_CATEGORY_MAPPINGS[categoryId] || {};
      const themeId = `picto_${categoryId}`;
      const words = sanitizeWords(items.map(buildLabel).filter(Boolean));
      const transparentPNGs = items.map(item => `${basePath}${item.file}`);

      generated[themeId] = createTheme({
        id: themeId,
        displayName:
          mapping.displayName ||
          (categoryData.label && categoryData.label.fr) ||
          `Pictogrammes ${categoryId}`,
        categoryId,
        colors: mapping.colors,
        images: Array.isArray(mapping.images) && mapping.images.length > 0
          ? mapping.images
          : DEFAULT_BACKGROUNDS,
        transparentPNGs,
        words,
        reinforcerVideos: Array.isArray(mapping.reinforcerVideos) && mapping.reinforcerVideos.length > 0
          ? mapping.reinforcerVideos
          : undefined,
        reinforcerImages: Array.isArray(mapping.reinforcerImages) && mapping.reinforcerImages.length > 0
          ? mapping.reinforcerImages
          : undefined,
        startSound: mapping.startSound,
        reinforcerSound: mapping.reinforcerSound,
        errorSound: mapping.errorSound,
        finalRewardSound: mapping.finalRewardSound
      });
    });

    return generated;
  }

  function extendWithPictoThemes() {
    if (typeof fetch !== 'function') {
      return;
    }

    fetch(PICTO_INDEX_PATH)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(indexJson => {
        const generatedThemes = generatePictoThemes(indexJson);
        Object.assign(global.themes, generatedThemes);
        if (typeof document !== 'undefined' && document) {
          const eventDetail = { generated: Object.keys(generatedThemes) };
          document.dispatchEvent(new CustomEvent('themes:pictoThemesLoaded', { detail: eventDetail }));
        }
      })
      .catch(error => {
        console.warn('Unable to extend sensory themes with pictogram categories:', error);
      });
  }

  extendWithPictoThemes();
})(typeof window !== 'undefined' ? window : undefined);

