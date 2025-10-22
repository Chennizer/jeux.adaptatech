const activityCategoryLabels = {
  sensoriel: { fr: 'Sensoriel', en: 'Sensory' },
  memoire: { fr: 'Mémoire', en: 'Memory' },
  lettres: { fr: 'Lettres', en: 'Letters' },
  nombres: { fr: 'Nombres', en: 'Numbers' },
  association: { fr: 'Association', en: 'Matching' },
  decouverte: { fr: 'Découverte', en: 'Discovery' },
  musique: { fr: 'Musique', en: 'Music' },
  art: { fr: 'Art', en: 'Art & Création' }
};

const activityChoices = [
  {
    id: 'sensory-scenes',
    name: { fr: '16 jeux sensoriels', en: '16 sensory games' },
    shortName: { fr: 'Sensoriel', en: 'Sensory' },
    image: '../../images/16sensoryscenes.png',
    href: '../sensory/index.html',
    categories: ['sensoriel']
  },
  {
    id: 'memory-cards',
    name: { fr: 'Cartes mémoire', en: 'Memory cards' },
    shortName: { fr: 'Cartes mémoire', en: 'Memory cards' },
    image: '../../images/memorycard.png',
    href: '../carte memoire/index.html',
    categories: ['memoire']
  },
  {
    id: 'letter-hunt',
    name: { fr: 'Trouver la lettre', en: 'Find the letter' },
    shortName: { fr: 'Lettre', en: 'Letter' },
    image: '../../images/letterhunt.png',
    href: '../letterhunt/index.html',
    categories: ['lettres']
  },
  {
    id: 'number-hunt',
    name: { fr: 'Trouver le nombre', en: 'Find the number' },
    shortName: { fr: 'Nombre', en: 'Number' },
    image: '../../images/numberhunt.png',
    href: '../numberhunt/index.html',
    categories: ['nombres']
  },
  {
    id: 'association',
    name: { fr: 'Pairage d’images', en: 'Image pairing' },
    shortName: { fr: 'Pairage', en: 'Matching' },
    image: '../../images/association.png',
    href: '../association/index.html',
    categories: ['association']
  },
  {
    id: 'discover-world',
    name: { fr: 'Découvrons le monde!', en: 'Discover the world!' },
    shortName: { fr: 'Découverte', en: 'Discovery' },
    image: '../../images/decouvrons-le-monde-card.jpg',
    href: '../decouvrons le monde/index.html',
    categories: ['decouverte']
  },
  {
    id: 'xylophone',
    name: { fr: 'Xylophone', en: 'Xylophone' },
    shortName: { fr: 'Xylophone', en: 'Xylophone' },
    image: '../../images/xylophone.png',
    href: '../xylophone/index.html',
    categories: ['musique']
  },
  {
    id: 'paint',
    name: { fr: 'Atelier de peinture', en: 'Abstract painting' },
    shortName: { fr: 'Peinture', en: 'Painting' },
    image: '../../images/ocularart.png',
    href: '../paint/index.html',
    categories: ['art']
  },
  {
    id: 'fingerpaint',
    name: { fr: 'Peinture explosive (commande oculaire)', en: 'Firework fingerpainting (eye gaze)' },
    shortName: { fr: 'Peinture explosive', en: 'Firework painting' },
    image: '../../images/fingerpaint.png',
    href: '../fingerpaint/index.html',
    categories: ['art']
  },
  {
    id: 'draw',
    name: { fr: 'Coloriage', en: 'Drawing' },
    shortName: { fr: 'Coloriage', en: 'Drawing' },
    image: '../../images/draw.png',
    href: '../draw/index.html',
    categories: ['art']
  },
  {
    id: 'local-video-choices',
    name: { fr: 'Choix vidéos locales', en: 'Local video choices' },
    shortName: { fr: 'Vidéos locales', en: 'Local videos' },
    image: '../../images/localvideosmultiplechoices.png',
    href: '../choixeyegaze-videos-local/index.html',
    categories: ['musique']
  },
  {
    id: 'youtube-choices',
    name: { fr: 'Choix vidéos YouTube', en: 'YouTube video choices' },
    shortName: { fr: 'YouTube', en: 'YouTube' },
    image: '../../images/eyegazeyoutube.png',
    href: '../choixeyegaze-youtube/index.html',
    categories: ['musique']
  },
  {
    id: 'music-choices',
    name: { fr: 'Choix musicaux', en: 'Musical choices' },
    shortName: { fr: 'Musique', en: 'Music' },
    image: '../../images/choixeyegaze.png',
    href: '../choixeyegaze/index.html',
    categories: ['musique']
  }
];

if (typeof window !== 'undefined') {
  window.activityChoices = activityChoices;
  window.activityCategoryLabels = activityCategoryLabels;
}
