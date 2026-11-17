// Educational contrasts, never a diagnostic brain map or a mental age.
export const PROFILE_DOMAINS = Object.freeze([
  { id: 'words', label: 'Sens des mots', short: 'Mots', description: 'Reconnaître les mots et accéder à leur sens.' },
  { id: 'context', label: 'Consigne & contexte', short: 'Contexte', description: 'Relier la phrase à la situation et comprendre ce qui est attendu, y compris les implicites.' },
  { id: 'memory', label: 'Mémoire des étapes', short: 'Mémoire', description: 'Garder les informations disponibles pendant l’action.' },
  { id: 'attention', label: 'Attention & organisation', short: 'Attention', description: 'Sélectionner les informations utiles et organiser la réponse.' },
  { id: 'coordination', label: 'Coordination', short: 'Coordination', description: 'Coordonner les gestes nécessaires à l’activité.' }
]);
export const DEVELOPMENT_PROFILES = Object.freeze([
  { id: 'reference', label: 'Repère illustratif', title: '', values: [0,0,0,0,0] },
  { id: 'words_expectations', label: 'Mots compris · attente à préciser', title: 'Comprendre les mots', values: [1,-1,0,0,0] },
  { id: 'words_memory', label: 'Mots compris · étapes à soutenir', title: 'Garder le fil des étapes', values: [1,0,-1,0,0] },
  { id: 'attention_language', label: 'Attention en appui · mots à expliquer', title: 'Un autre point d’appui', values: [-1,0,0,1,0] },
  { id: 'coordination_language', label: 'Gestes en appui · consigne à expliciter', title: 'S’appuyer sur les gestes', values: [-1,-1,0,0,1] },
  { id: 'custom', label: 'Personnaliser', title: 'Des capacités contrastées', values: null }
]);
export function profileLevel(value) {
  return value<0?'À soutenir':value>0?'En appui':'Intermédiaire';
}
// Overlapping anatomical proxies for distributed networks. Neither vocabulary
// nor understanding an expectation can be located in one exclusive area.
const WORDS = new Map([[33,.15],[34,.8],[35,.8],[36,.75],[37,.7],[38,1],[43,.8],[73,.8],[12,.25],[13,.4],[14,.4],[21,.4],[25,.65],[26,.25]]);
const CONTEXT = new Map([[12,.8],[13,.7],[14,1],[15,.45],[16,.3],[25,1],[26,.65],[30,.45],[34,.4],[35,.5],[36,.5],[38,.55],[43,.7],[73,.85],[6,.25],[9,.45],[10,.4],[53,.4]]);
const MEMORY = new Map([[15,1],[16,.8],[27,.9],[26,.7],[56,1],[53,.8],[54,.75],[12,.45],[14,.45],[7,.4],[8,.3],[25,.3],[30,.4]]);
const ATTENTION = new Map([[6,.8],[7,.8],[8,.65],[15,.85],[16,.9],[27,.95],[30,.6],[25,.25],[26,.3],[53,.7],[54,.6],[56,.9],[69,.25],[18,.4]]);
const COORDINATION = new Map([[3,.9],[28,.55],[29,1],[45,.65],[67,.5],[68,.8],[69,.8]]);
const NETWORKS=[WORDS,CONTEXT,MEMORY,ATTENTION,COORDINATION];
export function buildProfileInfluences(labels, graph) {
  const count=graph.offsets.length-1,channels=PROFILE_DOMAINS.length;
  let influences=new Float32Array(count*channels);
  if(!labels)return influences;
  for(let i=0;i<count;i++){
    const id=labels[i]?(labels[i]-1)%74+1:0;
    NETWORKS.forEach((network,k)=>{influences[i*channels+k]=network.get(id)||0;});
  }
  for(let pass=0;pass<3;pass++){
    const next=new Float32Array(influences.length);
    for(let i=0;i<count;i++){
      const degree=graph.offsets[i+1]-graph.offsets[i];
      for(let k=0;k<channels;k++){
        let sum=0;for(let j=graph.offsets[i];j<graph.offsets[i+1];j++)sum+=influences[graph.neighbors[j]*channels+k];
        next[i*channels+k]=degree?influences[i*channels+k]*.65+sum/degree*.35:influences[i*channels+k];
      }
    }
    influences=next;
  }
  return influences;
}
// Inactive domains do not dilute the chosen contrast. Opposing influences
// blend in shared networks instead of assigning an exclusive function.
export function profileAdjustment(influences,values) {
  let change=0,weight=0;
  for(let k=0;k<PROFILE_DOMAINS.length;k++){
    change+=influences[k]*values[k];weight+=influences[k]*Math.abs(values[k]);
  }
  return change/Math.max(1,weight);
}
export function profileColourStage(base,age,adjustment) {
  const strength=(1-Math.exp(-Math.max(0,age)/1.5))*.34;
  const room=1-Math.abs(base-.5)*1.2;
  return Math.max(0,Math.min(1,base+adjustment*strength*room));
}

const EXAMPLES={
  context: {
    instruction: 'Prépare-toi pour sortir.',
    resource: 'Elle comprend « sortir » : aller à l’extérieur.',
    difficulty: 'Ce qu’il faut ranger, prendre et faire maintenant reste implicite.',
    support: 'Range ton cahier. Prends ton manteau. Viens près de la porte.',
    supportLabel: 'Rendre l’attente explicite',
    explanation: 'Connaître les mots ne suffit pas toujours à déduire toute l’attente. La rendre concrète peut aider, sans changer les capacités de l’élève.'
  },
  memory: {
    instruction: 'Prends ton cahier, range ta trousse puis viens près de la porte.',
    resource: 'Elle connaît les mots et peut comprendre chaque action.',
    difficulty: 'Garder toutes les étapes disponibles pendant l’action peut demander du soutien.',
    support: 'Prends ton cahier.',
    supportLabel: 'Donner une étape à la fois',
    explanation: 'Les autres étapes viennent ensuite, avec un repère visuel si utile. Comprendre une action et conserver une suite d’actions sont deux exigences différentes.'
  },
  words: {
    instruction: 'Entoure les figures identiques.',
    resource: 'L’élève peut s’engager dans l’activité et utiliser une démonstration.',
    difficulty: 'Le sens du mot « identiques » peut avoir besoin d’un exemple.',
    support: 'Cherche une forme exactement pareille à celle-ci.',
    supportLabel: 'Expliquer avec un exemple',
    explanation: 'Montrer une paire de formes et reformuler peut soutenir l’accès au sens. Une difficulté avec un mot ne résume pas toutes les capacités.'
  },
  attention: {
    instruction: 'Range ton cahier, puis prends ton manteau.',
    resource: 'Le sens des mots et des actions peut être accessible.',
    difficulty: 'Sélectionner les informations utiles et organiser la réponse peut demander du soutien.',
    support: 'Regarde le repère : cahier, puis manteau.',
    supportLabel: 'Ajouter un repère visuel',
    explanation: 'Un repère et un environnement moins distrayant peuvent aider à organiser l’action. Ne pas réaliser la consigne ne prouve pas que les mots ne sont pas compris.'
  },
  general: {
    instruction: 'Prépare-toi pour sortir.',
    resource: 'Les mots, le contexte, la mémoire et l’organisation apportent chacun une contribution.',
    difficulty: 'Une même réponse observable peut avoir plusieurs explications.',
    support: 'Range ton cahier. Prends ton manteau. Viens près de la porte.',
    supportLabel: 'Rendre la consigne concrète',
    explanation: 'Observer ce qui aide l’élève permet de préciser ses besoins. Ces exemples fictifs ne prédisent pas la réponse d’une personne.'
  }
};
export function classroomExample(values) {
  const [words,context,memory,attention]=values;
  const key=context<0&&words>=0?'context':memory<0?'memory':words<0?'words':attention<0?'attention':'general';
  return {key,...EXAMPLES[key]};
}
