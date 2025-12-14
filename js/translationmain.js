
const SUPPORTED_LANGUAGES = ['en', 'ja', 'fr'];
const LANGUAGE_LABELS = { en: 'EN', fr: 'FR', ja: '日本語' };

function getStoredLanguage() {
  const stored = localStorage.getItem('siteLanguage') || document.documentElement.lang || 'en';
  return SUPPORTED_LANGUAGES.includes(stored) ? stored : 'en';
}

function nextLanguage(lang) {
  const currentIndex = SUPPORTED_LANGUAGES.indexOf(lang);
  return SUPPORTED_LANGUAGES[(currentIndex + 1) % SUPPORTED_LANGUAGES.length];
}

function getElementContent(el, lang) {
  const languageOrder = [lang, ...SUPPORTED_LANGUAGES.filter(code => code !== lang)];
  for (const code of languageOrder) {
    const text = el.getAttribute('data-' + code);
    if (text != null) {
      return text;
    }
  }
  return null;
}

// Update every element with data-fr/data-en/data-ja attribute based on the stored language.
function updateLanguage() {
  const lang = getStoredLanguage();
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-fr], [data-en], [data-ja]').forEach(function(el) {
    const content = getElementContent(el, lang);
    if (content != null) {
      el.innerHTML = content;
    }
  });

  document.querySelectorAll('#language-toggle, #langToggle').forEach(function(toggleBtn) {
    const label = LANGUAGE_LABELS[nextLanguage(lang)] || nextLanguage(lang).toUpperCase();
    toggleBtn.textContent = label;
    toggleBtn.classList.toggle('lang-ja-label', label === LANGUAGE_LABELS.ja);
  });
}

/* ---------------------------------------------------------
 * Switch info helpers (gaming pages)
 * --------------------------------------------------------- */
const SWITCH_INFO_TEMPLATES = {
  causeEffect: {
    skill: {
      fr: 'Appui intentionnel pour un effet immédiat',
      en: 'Intentional press for immediate cause-and-effect',
      ja: '意図的に押してすぐに効果を起こす'
    },
    roadmap: '8–10',
    senict: 'niveau 1-2',
    heroes: 'Exploring Egbert'
  },
  repeatedGoal: {
    skill: {
      fr: 'Appuyer à plusieurs reprises pour atteindre un objectif',
      en: 'Press repeatedly to reach a goal',
      ja: '目標のために繰り返し押す'
    },
    roadmap: '17–18',
    senict: 'niveau 4',
    heroes: 'Journeying Jiao'
  },
  twoSwitch: {
    skill: {
      fr: 'Utiliser deux switchs pour contrôler ou différencier des actions',
      en: 'Use two switches to control or differentiate actions',
      ja: '2つのスイッチで操作や違いを出す'
    },
    roadmap: '19–20',
    senict: 'niveau 6',
    heroes: 'Growing Gareth & Budding Brayton'
  },
  complex: {
    skill: {
      fr: 'Utiliser les switchs pour une séquence complexe ou un jeu avancé',
      en: 'Use switches for complex sequences or advanced play',
      ja: '高度な操作や連続動作にスイッチを使う'
    },
    roadmap: '21+',
    senict: 'niveau 7+',
    heroes: 'Succeeding Saffi'
  }
};

const SWITCH_INFO_BY_SLUG = {
  bees:       { template: 'twoSwitch' },
  bubbles:    { template: 'twoSwitch' },
  cloud:      { template: 'repeatedGoal' },
  cloudauto:  { template: 'repeatedGoal' },
  colorcycle: { template: 'causeEffect' },
  coloredtrace: { template: 'causeEffect' },
  dk2:        { template: 'complex' },
  easter:     { template: 'causeEffect' },
  fireflies:  { template: 'repeatedGoal' },
  ftl:        { template: 'complex' },
  imagereveal:{ template: 'repeatedGoal' },
  kpop:       { template: 'complex' },
  londonrain: { template: 'repeatedGoal' },
  mario:      { template: 'complex' },
  plant:      { template: 'repeatedGoal' },
  promenade:  { template: 'causeEffect' },
  qwen3maxtest: { template: 'causeEffect' },
  rainbow:    { template: 'causeEffect' },
  rocket:     { template: 'repeatedGoal' },
  samurai-rpg:{ template: 'complex' },
  seasons:    { template: 'repeatedGoal' },
  sadness:    { template: 'causeEffect' },
  shapes:     { template: 'causeEffect' },
  snow:       { template: 'repeatedGoal' },
  snowauto:   { template: 'repeatedGoal' },
  storybook:  { template: 'causeEffect' },
  storm:      { template: 'repeatedGoal' },
  stormauto:  { template: 'repeatedGoal' },
  sun:        { template: 'repeatedGoal' },
  sunauto:    { template: 'repeatedGoal' },
  vortex:     { template: 'causeEffect' },
  weatherauto:{ template: 'causeEffect' },
  window:     { template: 'causeEffect' },
  xylophone:  { template: 'repeatedGoal' },
  zenitude:   { template: 'causeEffect' }
};

function normalizeSlugFromPath() {
  const parts = window.location.pathname.toLowerCase().split('/');
  const gamingIdx = parts.indexOf('gaming');
  if (gamingIdx === -1 || gamingIdx + 1 >= parts.length) return null;
  return parts[gamingIdx + 1];
}

function ensureSwitchInfo() {
  if (document.getElementById('infoButton') || document.getElementById('infoModal')) return;

  const slug = normalizeSlugFromPath();
  if (!slug || !SWITCH_INFO_BY_SLUG[slug]) return;

  const templateKey = SWITCH_INFO_BY_SLUG[slug].template;
  const template = SWITCH_INFO_TEMPLATES[templateKey];
  if (!template) return;

  if (!document.getElementById('switch-info-style')) {
    const style = document.createElement('style');
    style.id = 'switch-info-style';
    style.textContent = `#infoButton{position:fixed;top:10px;left:10px;background:transparent;border:none;font-size:24px;color:teal;cursor:pointer;z-index:1200;}#infoModal{display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:360px;background:#fff;border:2px solid teal;color:#222;padding:18px;border-radius:10px;z-index:1300;box-shadow:0 4px 8px rgba(0,0,0,0.1);text-align:center;}#infoModal p{margin:16px 0;font-size:16px;line-height:1.55;}#closeModal{padding:8px 16px;font-size:15px;background:teal;border:none;border-radius:6px;color:#fff;cursor:pointer;}#closeModal:hover{background:#006666;}`;
    document.head.appendChild(style);
  }

  const infoButton = document.createElement('button');
  infoButton.id = 'infoButton';
  infoButton.classList.add('translate');
  infoButton.setAttribute('title', 'More info');
  infoButton.setAttribute('data-fr', 'ⓘ');
  infoButton.setAttribute('data-en', 'ⓘ');
  infoButton.setAttribute('data-ja', 'ⓘ');
  infoButton.textContent = 'ⓘ';

  const infoModal = document.createElement('div');
  infoModal.id = 'infoModal';

  const infoParagraph = document.createElement('p');
  infoParagraph.classList.add('translate');

  const closeBtn = document.createElement('button');
  closeBtn.id = 'closeModal';
  closeBtn.classList.add('translate');
  closeBtn.setAttribute('data-fr', 'Fermer');
  closeBtn.setAttribute('data-en', 'Close');
  closeBtn.setAttribute('data-ja', '閉じる');
  closeBtn.textContent = 'Fermer';

  ['fr', 'en', 'ja'].forEach(lang => {
    const skillText = template.skill[lang];
    const labelSkill = lang === 'fr' ? 'Compétence : ' : lang === 'ja' ? 'スキル：' : 'Skill: ';
    const labelSenict = lang === 'fr' ? 'SENICT switch skills ' : lang === 'ja' ? 'SENICTスイッチスキル ' : 'SENICT switch skills ';
    const labelRoadmap = lang === 'fr' ? 'Switch Progression Roadmap ' : lang === 'ja' ? 'Switch Progression Roadmap ' : 'Switch Progression Roadmap ';
    const labelStage = lang === 'fr' ? 'Étape Switch Heroes du jeu : ' : lang === 'ja' ? '本ゲームのSwitch Heroes段階：' : "Game's Switch Heroes stage: ";
    const text = `${labelSkill}${skillText}<br>${labelSenict}${template.senict}<br>${labelRoadmap}${template.roadmap}<br>${labelStage}${template.heroes}`;
    infoParagraph.setAttribute('data-' + lang, text);
  });

  infoModal.appendChild(infoParagraph);
  infoModal.appendChild(closeBtn);

  document.body.appendChild(infoButton);
  document.body.appendChild(infoModal);

  infoButton.addEventListener('click', () => { infoModal.style.display = 'block'; });
  closeBtn.addEventListener('click', () => { infoModal.style.display = 'none'; });
}

// Cycle language between English, French, and Japanese.
function toggleLanguage() {
  const current = getStoredLanguage();
  const newLang = nextLanguage(current);
  localStorage.setItem('siteLanguage', newLang);
  updateLanguage();
}

document.addEventListener('DOMContentLoaded', () => {
  ensureSwitchInfo();
  updateLanguage();
});
