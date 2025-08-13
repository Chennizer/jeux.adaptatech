// config.js
window.YT_API_KEY = "AIzaSyBj1QWd98L0ULAVmdvrnmCr1SbKFng-EpY";

const spacePromptImages = [
  { src: "../../images/redswitch.png", alt: { fr: "Switch Rouge", en: "Red Switch" } },
  { src: "../../images/blueswitch.png", alt: { fr: "Switch Bleue", en: "Blue Switch" } },
  { src: "../../images/yellowswitch.png", alt: { fr: "Big Mack", en: "Big Mack" } },
  { src: "../../images/greenswitch.png", alt: { fr: "Interact Switch", en: "Interact Switch" } },
  { src: "../../images/switch-rouge.png", alt: { fr: "Switch Rouge", en: "Red Switch" } },
  { src: "../../images/switch-bleue.png", alt: { fr: "Switch Bleue", en: "Blue Switch" } },
  { src: "../../images/big-mack.png", alt: { fr: "Big Mack", en: "Big Mack" } },
  { src: "../../images/interact-switch.png", alt: { fr: "Interact Switch", en: "Interact Switch" } },
  { src: "../../images/switch-adaptatech.png", alt: { fr: "Switch Adaptatech", en: "Adaptatech Switch" } },
  { src: "../../images/hand.png", alt: { fr: "Hand", en: "Hand" } },
  { src: "../../images/taylorswift.png", alt: { fr: "Taylor Swift", en: "Taylor Swift" } },
  { src: "../../images/peppa.png", alt: { fr: "Peppa", en: "Peppa" } },
  { src: "../../images/djembe.png", alt: { fr: "Djembe", en: "Djembe" } },
  { src: "../../images/moana.png", alt: { fr: "Moana", en: "Moana" } },
  { src: "../../images/beatles.png", alt: { fr: "Beatles", en: "Beatles" } },
  { src: "../../images/halloween-citrouille.png", alt: { fr: "Citrouille d'Halloween", en: "Halloween Pumpkin" } },
  { src: "../../images/simba.png", alt: { fr: "Simba", en: "Simba" } },
  { src: "../../images/wingsuit.png", alt: { fr: "Wingsuit", en: "Wingsuit" } },
  { src: "../../images/ski.png", alt: { fr: "Ski", en: "Ski" } },
  { src: "../../images/snowplow.png", alt: { fr: "Déneigeuse", en: "Snowplow" } },
  { src: "../../images/snowboard.png", alt: { fr: "Snowboard", en: "Snowboard" } },
  { src: "../../images/RC.png", alt: { fr: "Roller Coaster", en: "Roller Coaster" } },
  { src: "../../images/astronaut.png", alt: { fr: "Astronaute", en: "Astronaut" } }
];

// Space Prompt Sounds
const spacePromptSounds = [
  
  { value: "gong-sound", label: { fr: "Gong", en: "Gong" }, src: "../../sounds/gong.mp3" },
  { value: "piano-sound", label: { fr: "Piano", en: "Piano" }, src: "../../sounds/piano.mp3" },
  { value: "rooster-sound", label: { fr: "Coq", en: "Rooster" }, src: "../../sounds/rooster.mp3" },
  { value: "record-own", label: { fr: "Enregistrez le vôtre", en: "Record your own" } }
];

// Visual Effect Options
const visualOptions = [
  { value: "normal", label: { fr: "Filtre visuel", en: "Visual Filter" } },
  { value: "green-filter", label: { fr: "Saturation verte", en: "Green Saturation" } },
  { value: "red-filter", label: { fr: "Saturation rouge", en: "Red Saturation" } },
  { value: "blue-filter", label: { fr: "Saturation bleue", en: "Blue Saturation" } },
  { value: "high-contrast", label: { fr: "Contraste élevé", en: "High Contrast" } },
  { value: "grayscale", label: { fr: "Noir et blanc", en: "Grayscale" } },
  { value: "invert", label: { fr: "Couleurs inversées", en: "Inverted Colors" } },
  { value: "brightness", label: { fr: "Haute clarté", en: "High Brightness" } },
  { value: "saturation", label: { fr: "Haute saturation", en: "High Saturation" } }
];

// Miscellaneous Options
const miscOptions = [
  {
    id: "mouse-click-option",
    label: { fr: "Activation par écran tactile ou tablette", en: "Touchscreen/Tablet Activation" },
    defaultChecked: false
  },
  {
    id: "two-player-mode-option",
    label: { fr: "Mode à deux joueurs", en: "Two-Player Mode" },
    defaultChecked: false
  },
  {
    id: "enter-pause-option",
    label: { fr: "Pause avec la touche backspace", en: "Pause with Backspace" },
    defaultChecked: true
  },
  {
    id: "right-click-next-option",
    label: { fr: "Prochain vidéo avec clic droit de la souris", en: "Next video with right-click" },
    defaultChecked: true
  },
  {
    id: "timed-prompt-option",
    label: { fr: "Mode limite de temps", en: "Timed Mode" },
    defaultChecked: false
  },
  {
    id: "timed-prompt-seconds",
    label: { fr: "5", en: "5" }
  }
];
