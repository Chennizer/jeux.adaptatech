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
    id: 'beauty-and-beast',
    name: { fr: 'La belle et la bête', en: 'Beauty and the Beast' },
    shortName: { fr: 'Belle et la bête', en: 'Beauty & the Beast' },
    image: '../../images/belleetbete.jpg',
    href: '../switch/belleetbete/index.html',
    categories: ['musique']
  },
  {
    id: 'music-choices',
    name: { fr: 'Choix musicaux', en: 'Musical choices' },
    shortName: { fr: 'Musique', en: 'Music' },
    image: '../../images/choixeyegaze.png',
    href: '../choixeyegaze/index.html',
    categories: ['musique']
  },
  {
    id: 'fairies',
    name: { fr: 'Trouver la fée', en: 'Find the fairy' },
    shortName: { fr: 'Fée', en: 'fairy' },
    image: '../../images/findme.png',
    href: '../choixeyegaze/index.html',
    categories: ['inclusive']
  },
  {
    id: 'assiettes',
    name: { fr: 'Assiettes', en: 'Plates' },
    shortName: { fr: 'Assiettes', en: 'Plates' },
    image: '../../images/choixeyegaze/Assiettes.jpeg',
    href: '../choixeyegaze/index.html'
  },
  {
    id: 'baby-shark',
    name: { fr: 'Baby Shark', en: 'Baby Shark' },
    shortName: { fr: 'Baby Shark', en: 'Baby Shark' },
    image: '../../images/choixeyegaze/Baby Shark.png',
    href: '../choixeyegaze/index.html',
    categories: ['musique']
  },
  {
    id: 'ballon-soccer-musical',
    name: { fr: 'Ballon de soccer musical', en: 'Musical soccer ball' },
    shortName: { fr: 'Ballon musical', en: 'Musical ball' },
    image: '../../images/choixeyegaze/Ballon de soccer musical.jpeg',
    href: '../choixeyegaze/index.html',
    categories: ['musique']
  },
  {
    id: 'chien-musical',
    name: { fr: 'Chien musical', en: 'Musical dog' },
    shortName: { fr: 'Chien musical', en: 'Musical dog' },
    image: '../../images/choixeyegaze/Chien musical.jpeg',
    href: '../choixeyegaze/index.html',
    categories: ['musique']
  },
  {
    id: 'grenouille',
    name: { fr: 'Grenouille', en: 'Frog' },
    shortName: { fr: 'Grenouille', en: 'Frog' },
    image: '../../images/choixeyegaze/Grenouille.jpeg',
    href: '../choixeyegaze/index.html'
  },
  {
    id: 'reine-des-neiges',
    name: { fr: 'La reine des neiges', en: 'Frozen' },
    shortName: { fr: 'Reine des neiges', en: 'Frozen' },
    image: '../../images/choixeyegaze/La reine des neiges.png',
    href: '../choixeyegaze/index.html',
    categories: ['musique']
  },
  {
    id: 'minions',
    name: { fr: 'Les minions', en: 'The Minions' },
    shortName: { fr: 'Minions', en: 'Minions' },
    image: '../../images/choixeyegaze/Les minions.png',
    href: '../choixeyegaze/index.html',
    categories: ['musique']
  },
  {
    id: 'trolls',
    name: { fr: 'Les trolls', en: 'The Trolls' },
    shortName: { fr: 'Trolls', en: 'Trolls' },
    image: '../../images/choixeyegaze/Les trolls.png',
    href: '../choixeyegaze/index.html',
    categories: ['musique']
  },
  {
    id: 'livre-enchante',
    name: { fr: 'Livre enchanté', en: 'Enchanted book' },
    shortName: { fr: 'Livre enchanté', en: 'Enchanted book' },
    image: '../../images/choixeyegaze/Livre enchanté.jpeg',
    href: '../choixeyegaze/index.html'
  },
  {
    id: 'machine-a-cookies',
    name: { fr: 'Machine à cookies', en: 'Cookie machine' },
    shortName: { fr: 'Machine à cookies', en: 'Cookie machine' },
    image: '../../images/choixeyegaze/Machine à cookies.png',
    href: '../choixeyegaze/index.html'
  },
  {
    id: 'observe',
    name: { fr: 'Observe', en: 'Observe' },
    shortName: { fr: 'Observe', en: 'Observe' },
    image: '../../images/choixeyegaze/Observe.png',
    href: '../choixeyegaze/index.html'
  },
  {
    id: 'poursuis-moi',
    name: { fr: 'Poursuis-moi', en: 'Chase me' },
    shortName: { fr: 'Poursuis-moi', en: 'Chase me' },
    image: '../../images/choixeyegaze/Poursuis-moi.png',
    href: '../choixeyegaze/index.html'
  },
  {
    id: 'suis-ligne-droite',
    name: { fr: 'Suis la ligne droite', en: 'Follow the straight line' },
    shortName: { fr: 'Ligne droite', en: 'Straight line' },
    image: '../../images/choixeyegaze/Suis la ligne droite.png',
    href: '../choixeyegaze/index.html'
  },
  {
    id: 'texture-doree',
    name: { fr: 'Texture dorée', en: 'Golden texture' },
    shortName: { fr: 'Texture dorée', en: 'Golden texture' },
    image: '../../images/choixeyegaze/Texture dorée.jpeg',
    href: '../choixeyegaze/index.html'
  },
  {
    id: 'trouve-intrus',
    name: { fr: "Trouve l'intrus", en: 'Find the intruder' },
    shortName: { fr: "Trouve l'intrus", en: 'Find the intruder' },
    image: "../../images/choixeyegaze/Trouve l'intrus.png",
    href: '../choixeyegaze/index.html'
  },
  {
    id: 'trouve-moi',
    name: { fr: 'Trouve-moi', en: 'Find me' },
    shortName: { fr: 'Trouve-moi', en: 'Find me' },
    image: '../../images/choixeyegaze/Trouve-moi.png',
    href: '../choixeyegaze/index.html'
  },
  {
    id: 'choix-instruments-musique',
    name: { fr: 'Choix instruments musique', en: 'Music instruments choice' },
    shortName: { fr: 'Instruments', en: 'Instruments' },
    image: '../../images/choixeyegaze/choix instruments musique.png',
    href: '../choixeyegaze/index.html',
    categories: ['musique']
  },
  {
    id: 'encore',
    name: { fr: 'Encore', en: 'Encore' },
    shortName: { fr: 'Encore', en: 'Encore' },
    image: '../../images/choixeyegaze/encore.png',
    href: '../choixeyegaze/index.html'
  },
  {
    id: 'fini',
    name: { fr: 'Fini', en: 'Finished' },
    shortName: { fr: 'Fini', en: 'Finished' },
    image: '../../images/choixeyegaze/fini.png',
    href: '../choixeyegaze/index.html'
  }
];

if (typeof window !== 'undefined') {
  window.activityChoices = activityChoices;
  window.activityCategoryLabels = activityCategoryLabels;
}
