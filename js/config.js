// Space Prompt Images
const spacePromptImages = [
    { src: "../../images/switch-rouge.png", alt: "Switch Rouge" },
    { src: "../../images/switch-bleue.png", alt: "Switch Bleue" },
    { src: "../../images/big-mack.png", alt: "Big Mack" },
    { src: "../../images/interact-switch.png", alt: "Interact Switch" },
    { src: "../../images/switch-adaptatech.png", alt: "Switch Adaptatech" },
    { src: "../../images/hand.png", alt: "Hand" },
    { src: "../../images/peppa.png", alt: "Peppa" },
    { src: "../../images/djembe.png", alt: "Djembe" },
    { src: "../../images/moana.png", alt: "Moana" },
    { src: "../../images/beatles.png", alt: "Beatles" },
    { src: "../../images/halloween-citrouille.png", alt: "Beatles" },
    { src: "../../images/simba.png", alt: "Simba" },
    { src: "../../images/wingsuit.png", alt: "Wingsuit" },
    { src: "../../images/ski.png", alt: "Ski" },
    { src: "../../images/snowplow.png", alt: "Déneigeuse" },
    { src: "../../images/snowboard.png", alt: "Snowboard" },
    { src: "../../images/astronaut.png", alt: "Astronaute" }
];

// Space Prompt Sounds
const spacePromptSounds = [
    { value: "none", label: "Son indicateur" },  // Default no sound option
    { value: "gong-sound", label: "Gong", src: "../../sounds/gong.mp3" },
    { value: "piano-sound", label: "Piano", src: "../../sounds/piano.mp3" },
    { value: "rooster-sound", label: "Coq", src: "../../sounds/rooster.mp3" },
    { value: "record-own", label: "Enregistrez le vôtre" }
];

// Visual Effect Options
const visualOptions = [
    { value: "normal", label: "Filtre visuel" },
    { value: "green-filter", label: "Saturation verte" },
    { value: "red-filter", label: "Saturation rouge" },
    { value: "blue-filter", label: "Saturation bleue" },
    { value: "high-contrast", label: "Contraste élevé" },
    { value: "grayscale", label: "Noir et blanc" },
    { value: "invert", label: "Couleurs inversées" },
    { value: "brightness", label: "Haute clarté" },
    { value: "saturation", label: "Haute saturation" }
];
const miscOptions = [
    { id: "mouse-click-option", label: "Activation par écran tactile ou tablette", defaultChecked: false },
    { id: "enter-pause-option", label: "Pause avec la touche entrée (deuxième prise de switch)", defaultChecked: true },
    { id: "right-click-next-option", label: "Avancer avec le clic droit de la souris", defaultChecked: false }
];

