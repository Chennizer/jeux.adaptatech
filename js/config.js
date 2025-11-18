// config.js
window.YT_API_KEY = "AIzaSyBj1QWd98L0ULAVmdvrnmCr1SbKFng-EpY";

const spacePromptImages = [
  { src: "../../images/redswitch.png", alt: { fr: "Switch Rouge", en: "Red Switch", ja: "赤いスイッチ" } },
  { src: "../../images/blueswitch.png", alt: { fr: "Switch Bleue", en: "Blue Switch", ja: "青いスイッチ" } },
  { src: "../../images/yellowswitch.png", alt: { fr: "Big Mack", en: "Big Mack", ja: "ビッグマック" } },
  { src: "../../images/greenswitch.png", alt: { fr: "Interact Switch", en: "Interact Switch", ja: "インタラクトスイッチ" } },
  { src: "../../images/switch-rouge.png", alt: { fr: "Switch Rouge", en: "Red Switch", ja: "赤いスイッチ" } },
  { src: "../../images/switch-bleue.png", alt: { fr: "Switch Bleue", en: "Blue Switch", ja: "青いスイッチ" } },
  { src: "../../images/big-mack.png", alt: { fr: "Big Mack", en: "Big Mack", ja: "ビッグマック" } },
  { src: "../../images/interact-switch.png", alt: { fr: "Interact Switch", en: "Interact Switch", ja: "インタラクトスイッチ" } },
  { src: "../../images/switch-adaptatech.png", alt: { fr: "Switch Adaptatech", en: "Adaptatech Switch", ja: "アダプタテックスイッチ" } },
  { src: "../../images/hand.png", alt: { fr: "Hand", en: "Hand", ja: "手" } },
  { src: "../../images/taylorswift.png", alt: { fr: "Taylor Swift", en: "Taylor Swift", ja: "テイラー・スウィフト" } },
  { src: "../../images/peppa.png", alt: { fr: "Peppa", en: "Peppa", ja: "ペッパピッグ" } },
  { src: "../../images/djembe.png", alt: { fr: "Djembe", en: "Djembe", ja: "ジャンベ" } },
  { src: "../../images/moana.png", alt: { fr: "Moana", en: "Moana", ja: "モアナ" } },
  { src: "../../images/beatles.png", alt: { fr: "Beatles", en: "Beatles", ja: "ビートルズ" } },
  { src: "../../images/halloween-citrouille.png", alt: { fr: "Citrouille d'Halloween", en: "Halloween Pumpkin", ja: "ハロウィンのかぼちゃ" } },
  { src: "../../images/simba.png", alt: { fr: "Simba", en: "Simba", ja: "シンバ" } },
  { src: "../../images/wingsuit.png", alt: { fr: "Wingsuit", en: "Wingsuit", ja: "ウイングスーツ" } },
  { src: "../../images/ski.png", alt: { fr: "Ski", en: "Ski", ja: "スキー" } },
  { src: "../../images/snowplow.png", alt: { fr: "Déneigeuse", en: "Snowplow", ja: "除雪車" } },
  { src: "../../images/snowboard.png", alt: { fr: "Snowboard", en: "Snowboard", ja: "スノーボード" } },
  { src: "../../images/RC.png", alt: { fr: "Roller Coaster", en: "Roller Coaster", ja: "ジェットコースター" } },
  { src: "../../images/astronaut.png", alt: { fr: "Astronaute", en: "Astronaut", ja: "宇宙飛行士" } }
];

// Space Prompt Sounds
const spacePromptSounds = [
  
  { value: "gong-sound", label: { fr: "Gong", en: "Gong", ja: "ゴング" }, src: "../../sounds/gong.mp3" },
  { value: "piano-sound", label: { fr: "Piano", en: "Piano", ja: "ピアノ" }, src: "../../sounds/piano.mp3" },
  { value: "rooster-sound", label: { fr: "Coq", en: "Rooster", ja: "ニワトリ" }, src: "../../sounds/rooster.mp3" },
  { value: "record-own", label: { fr: "Enregistrez le vôtre", en: "Record your own", ja: "自分で録音" } }
];

// Visual Effect Options
const visualOptions = [
  { value: "normal", label: { fr: "Filtre visuel", en: "Visual Filter", ja: "視覚フィルター" } },
  { value: "green-filter", label: { fr: "Saturation verte", en: "Green Saturation", ja: "緑を強調" } },
  { value: "red-filter", label: { fr: "Saturation rouge", en: "Red Saturation", ja: "赤を強調" } },
  { value: "blue-filter", label: { fr: "Saturation bleue", en: "Blue Saturation", ja: "青を強調" } },
  { value: "high-contrast", label: { fr: "Contraste élevé", en: "High Contrast", ja: "高コントラスト" } },
  { value: "grayscale", label: { fr: "Noir et blanc", en: "Grayscale", ja: "モノクロ" } },
  { value: "invert", label: { fr: "Couleurs inversées", en: "Inverted Colors", ja: "色を反転" } },
  { value: "brightness", label: { fr: "Haute clarté", en: "High Brightness", ja: "高輝度" } },
  { value: "saturation", label: { fr: "Haute saturation", en: "High Saturation", ja: "高彩度" } }
];

// Miscellaneous Options
const miscOptions = [
  {
    id: "mouse-click-option",
    label: { fr: "Activation par écran tactile ou tablette", en: "Touchscreen/Tablet Activation", ja: "タッチスクリーン/タブレット操作" },
    defaultChecked: false
  },
  {
    id: "two-player-mode-option",
    label: { fr: "Mode à deux joueurs", en: "Two-Player Mode", ja: "2人プレイモード" },
    defaultChecked: false
  },
  {
    id: "enter-pause-option",
    label: { fr: "Pause avec la touche backspace", en: "Pause with Backspace", ja: "バックスペースで一時停止" },
    defaultChecked: true
  },
  {
    id: "right-click-next-option",
    label: { fr: "Prochain vidéo avec clic droit de la souris", en: "Next video with right-click", ja: "右クリックで次の動画" },
    defaultChecked: true
  },
  {
    id: "timed-prompt-option",
    label: { fr: "Mode limite de temps", en: "Timed Mode", ja: "時間制限モード" },
    defaultChecked: false
  },
  {
    id: "timed-prompt-seconds",
    label: { fr: "5", en: "5", ja: "5" }
  }
];
