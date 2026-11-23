// Primary studies reviewed 2026-11-17. None supplies the animation's colour values.
export const STUDIES = {
  polisenska: {
    citation: 'Polišenská et al. · 2018',
    title: 'Receptive Language Skills in Slovak-Speaking Children With Intellectual Disability: Understanding Words, Sentences, and Stories',
    url: 'https://doi.org/10.1044/2018_JSLHR-L-17-0029',
    ages: 'Enfants d’âge préscolaire et scolaire', sample: '14 enfants avec DI et 14 enfants témoins',
    measure: 'Compréhension de mots, de phrases et de récits',
    finding: 'Les niveaux de compréhension diffèrent selon la tâche : reconnaître des mots, comprendre des phrases et comprendre un récit ne sont pas équivalents.',
    limit: 'Petite étude en slovaque, sans cartographie cérébrale. Elle ne décrit pas tous les élèves avec DI et ne valide pas les couleurs des profils.'
  },
  natu: {
    citation: 'Natu et al. · 2021',
    title: 'Infants’ cortex undergoes microstructural growth coupled with myelination during development',
    url: 'https://doi.org/10.1038/s42003-021-02706-w',
    ages: 'Naissance–6 mois', sample: '13 nourrissons, suivi longitudinal',
    measure: 'IRM quantitative : T1/R1 et diffusion',
    finding: 'Les cortex visuel, auditif, moteur et somatosensoriel changent déjà pendant les premiers mois. Les aires visuelles ne suivent pas toutes le même rythme.',
    limit: 'Un état initial plus avancé ne signifie pas une croissance plus rapide. R1 et diffusion ne sont pas des pourcentages de maturité.'
  },
  deoni: {
    citation: 'Deoni et al. · 2015',
    title: 'Cortical maturation and myelination in healthy toddlers and young children',
    url: 'https://doi.org/10.1016/j.neuroimage.2015.04.058',
    ages: '1–6 ans', sample: '215 enfants, étude transversale',
    measure: 'T1 et fraction d’eau liée à la myéline',
    finding: 'Les cortex sensorimoteur et visuel présentent des caractéristiques de myélinisation précoces ; les régions frontales et temporales ont une évolution plus prolongée.',
    limit: 'Ces marqueurs indirects ne décrivent ni toutes les transformations du cortex, ni la date d’acquisition d’une compétence.'
  },
  wangThickness: {
    citation: 'Wang et al. · 2019',
    title: 'Developmental topography of cortical thickness during infancy',
    url: 'https://doi.org/10.1073/pnas.1821523116',
    ages: '1–24 mois', sample: '210 examens, 43 nourrissons suivis',
    measure: 'Épaisseur corticale en IRM',
    finding: 'L’épaisseur évolue selon des trajectoires régionales distinctes pendant les deux premières années, avec des augmentations puis des diminutions.',
    limit: 'Une progression de couleur continue ne peut pas représenter fidèlement cette mesure non monotone.'
  },
  perani: {
    citation: 'Perani et al. · 2011',
    title: 'Neural language networks at birth',
    url: 'https://doi.org/10.1073/pnas.1102991108',
    ages: 'Nouveau-nés d’environ 2 jours', sample: '15 nouveau-nés, IRM fonctionnelle',
    measure: 'Réponse à la parole et connectivité',
    finding: 'Des régions temporales et frontales répondent à la parole dès la naissance, dans un réseau dont les connexions continuent à se développer.',
    limit: 'Une réponse à la parole n’implique pas un langage adulte. Une zone rouge ne signifie pas une zone inactive.'
  },
  leroy: {
    citation: 'Leroy et al. · 2011',
    title: 'Early Maturation of the Linguistic Dorsal Pathway in Human Infants',
    url: 'https://doi.org/10.1523/JNEUROSCI.4141-10.2011',
    ages: '1–4 mois', sample: '14 nourrissons, étude transversale',
    measure: 'Signal T2 normalisé dans les régions périsylviennes',
    finding: 'Heschl et les berges du sillon central sont relativement avancés. Le sillon temporal supérieur ventral est moins avancé que certaines régions frontales inférieures.',
    limit: 'L’ordre « temporal puis frontal » ne vaut donc pas pour toutes les régions, tous les âges ou toutes les mesures.'
  },
  emerson: {
    citation: 'Emerson et al. · 2016',
    title: 'Longitudinal Study of the Emerging Functional Connectivity Asymmetry of Primary Language Regions during Infancy',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5083015/',
    ages: '1–24 mois', sample: '71 nourrissons recrutés pour un suivi',
    measure: 'Connectivité fonctionnelle au repos',
    finding: 'L’organisation et l’asymétrie des connexions des régions temporales supérieures et frontales inférieures se transforment pendant la petite enfance.',
    limit: 'La page ne simule pas cette latéralisation. Les deux hémisphères y suivent la même convention de couleur.'
  },
  gogtay: {
    citation: 'Gogtay et al. · 2004',
    title: 'Dynamic mapping of human cortical development during childhood through early adulthood',
    url: 'https://doi.org/10.1073/pnas.0402680101',
    ages: '4–21 ans', sample: '13 jeunes, suivi sur 8–10 ans',
    measure: 'Cartographie de la matière grise en IRM',
    finding: 'Les transformations corticales ont un calendrier régional : les aires primaires précèdent généralement certaines régions d’association.',
    limit: 'Cette carte célèbre représente la matière grise. Elle ne fournit ni une échelle universelle de maturité, ni des données sur la naissance.'
  },
  fair: {
    citation: 'Fair et al. · 2007',
    title: 'Development of distinct control networks through segregation and integration',
    url: 'https://doi.org/10.1073/pnas.0705843104',
    ages: '7–9, 10–15 et 21–31 ans', sample: '139 participants dans les comparaisons principales',
    measure: 'Connectivité fonctionnelle au repos',
    finding: 'Les réseaux frontopariétal et cingulo-operculaire de contrôle se réorganisent avec l’âge, en combinant intégration et différenciation des connexions.',
    limit: 'L’attention mobilise des réseaux distribués. Elle ne se lit pas dans la couleur d’une seule zone préfrontale.'
  },
  whitaker: {
    citation: 'Whitaker et al. · 2016',
    title: 'Adolescence is associated with genomically patterned consolidation of the hubs of the human brain connectome',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4987797/',
    ages: '14–24 ans', sample: '297 participants, étude transversale',
    measure: 'Épaisseur et transfert de magnétisation',
    finding: 'Des régions d’association présentent des changements marqués d’épaisseur et de marqueurs liés à la myéline pendant l’adolescence et le début de l’âge adulte.',
    limit: 'Ces observations de groupe ne prédisent pas les capacités d’un élève ni une date individuelle de fin du développement.'
  },
  grydeland: {
    citation: 'Grydeland et al. · 2019',
    title: 'Waves of Maturation and Senescence in Micro-structural MRI Markers of Human Cortical Myelination over the Lifespan',
    url: 'https://doi.org/10.1093/cercor/bhy330',
    ages: '8–85 ans', sample: '484 participants, étude transversale',
    measure: 'Rapport T1w/T2w, marqueur lié à la myéline',
    finding: 'Les calendriers diffèrent entre cortex primaire et cortex d’association. Les transformations se poursuivent au-delà de la fenêtre de 0–20 ans affichée ici.',
    limit: 'Un pic de vitesse de changement n’est pas une fin de maturation. Cette étude ne renseigne pas directement les moins de 8 ans.'
  },
  wangCerebellum: {
    citation: 'Wang et al. · 2023',
    title: 'Longitudinal development of the cerebellum in human infants during the first 800 days',
    url: 'https://doi.org/10.1016/j.celrep.2023.112281',
    ages: 'Les 800 premiers jours', sample: '511 examens structurels longitudinaux',
    measure: 'Volumes du cervelet et de 27 sous-régions',
    finding: 'Le cervelet connaît une croissance rapide et différenciée entre sous-régions pendant la petite enfance.',
    limit: 'Le volume ne mesure pas la maturité fonctionnelle. Le cervelet de cette page conserve un gabarit adulte et une couleur globale.'
  },
  cerebellum2025: {
    citation: 'Nature Communications · 2025',
    title: 'Functional development of the human cerebellum from birth to age five',
    url: 'https://doi.org/10.1038/s41467-025-61465-y',
    ages: 'Naissance–5 ans', sample: '1 017 examens, 275 participants',
    measure: 'Connectivité fonctionnelle cérébello-corticale',
    finding: 'Les interactions du cervelet avec les réseaux moteurs et cognitifs s’organisent et évoluent dès les premières années.',
    limit: 'Le cervelet ne devient pas entièrement mature tôt. Une couleur unique ne restitue pas ses différents réseaux.'
  }
};

export const EVIDENCE_GROUPS = [
  { id: 'capacities', label: 'Capacités & consignes', title: 'Comprendre des mots et comprendre toute l’attente', description: 'Le sens des mots, les relations dans une phrase, les implicites du contexte et le maintien des étapes sont des exigences distinctes. Le profil pédagogique les sépare sans en faire des zones exclusives.', studies: ['polisenska','fair','emerson'] },
  { id: 'sensorimotor', label: 'Sens & mouvement', title: 'Des régions précoces, encore en transformation', description: 'Les cortex somatosensoriel et moteur, autour du sillon central, ont des caractéristiques précoces. Les régions dorsales d’association ont d’autres trajectoires.', studies: ['natu', 'deoni', 'gogtay'] },
  { id: 'vision', label: 'Vision', title: 'Plusieurs calendriers au sein du cortex visuel', description: 'V1, près du sillon calcarin, se distingue des aires visuelles d’association. Être relativement avancé à la naissance ne signifie pas avoir terminé son développement.', studies: ['natu', 'deoni'] },
  { id: 'language', label: 'Audition & langage', title: 'Un réseau actif très tôt, qui se réorganise', description: 'Heschl, les régions temporales et les régions frontales inférieures ne forment pas une simple chaîne de zones qui s’allument l’une après l’autre.', studies: ['perani', 'leroy', 'emerson'] },
  { id: 'control', label: 'Attention & contrôle', title: 'Des réseaux qui continuent à se coordonner', description: 'Le contrôle de l’attention implique notamment des régions frontales, pariétales et cingulaires. Leur évolution se poursuit pendant l’enfance et l’adolescence.', studies: ['fair', 'whitaker', 'grydeland'] },
  { id: 'cerebellum', label: 'Cervelet', title: 'Des fonctions précoces, un raffinement prolongé', description: 'La croissance anatomique et l’organisation des connexions du cervelet sont deux aspects distincts. Ses contributions dépassent la seule motricité.', studies: ['wangCerebellum', 'cerebellum2025'] },
  { id: 'measures', label: 'Mesures & limites', title: 'Il n’existe pas une seule horloge cérébrale', description: 'Épaisseur, matière grise, myéline et connectivité peuvent évoluer différemment. Aucune de ces études ne valide les valeurs de couleur de cette animation.', studies: ['wangThickness', 'gogtay', 'grydeland'] }
];

export function mountResearch(dialog) {
  dialog.querySelector('#study-count').textContent = String(Object.keys(STUDIES).length);
  const select = dialog.querySelector('#evidence-region');
  const title = dialog.querySelector('#evidence-title');
  const description = dialog.querySelector('#evidence-description');
  const list = dialog.querySelector('#study-list');
  for (const group of EVIDENCE_GROUPS) {
    const option = document.createElement('option');
    option.value = group.id; option.textContent = group.label; select.append(option);
  }
  function render() {
    const group = EVIDENCE_GROUPS.find(g => g.id === select.value) || EVIDENCE_GROUPS[0];
    title.textContent = group.title; description.textContent = group.description;
    list.replaceChildren(...group.studies.map(id => {
      const study = STUDIES[id];
      const card = document.createElement('article'); card.className = 'study-card';
      const link = document.createElement('a'); link.href = study.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = study.citation; link.title = study.title;
      link.setAttribute('aria-label', `${study.citation} : ${study.title} (nouvel onglet)`);
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true'); icon.classList.add('source-icon');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M8 5H5v14h14v-3M13 4h7v7M20 4l-9 9');
      icon.append(path); link.append(icon);
      const heading = document.createElement('h4'); heading.append(link); card.append(heading);
      for (const [className, content] of [
        ['study-meta', `${study.ages} · ${study.sample}`], ['study-measure', study.measure],
        ['study-finding', study.finding], ['study-limit', study.limit]
      ]) { const p = document.createElement('p'); p.className = className; p.textContent = content; card.append(p); }
      return card;
    }));
  }
  select.addEventListener('change', render); render();
  const tabs = [...dialog.querySelectorAll('[role="tab"]')];
  const scroll = dialog.querySelector('.about-body');
  function activate(tab, focus = false) {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1;
      dialog.querySelector(`#${item.getAttribute('aria-controls')}`).hidden = !active;
    }
    scroll.scrollTop = 0;
    if (focus) tab.focus();
  }
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); activate(tabs[next], true);
    });
  }
}
