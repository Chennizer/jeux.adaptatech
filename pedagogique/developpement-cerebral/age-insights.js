// Broad educational themes, not individual milestones or fitted brain curves.
// Ranges are editorial groupings, never biological switches at a fixed date.
export const AGE_INSIGHTS = Object.freeze([
  { from: 0, to: 3, range: '0–3 mois', title: 'Premiers échanges', themes: ['Voix', 'Regard', 'Mouvement'], regions: [{ area: 'Occipital et temporal', text: 'la vision et l’audition évoluent tôt.' }, { area: 'Sensorimoteur', text: 'les mouvements s’organisent.' }] },
  { from: 3, to: 6, range: '3–6 mois', title: 'Explorer les sens', themes: ['Sons', 'Gestes', 'Coordination'], regions: [{ area: 'Sensorimoteur', text: 'la coordination œil-main se précise.' }, { area: 'Cervelet', text: 'les gestes gagnent en ajustement.' }] },
  { from: 6, to: 12, range: '6–12 mois', title: 'Babiller et échanger', themes: ['Babillage', 'Imitation', 'Échanges'], regions: [{ area: 'Temporal et frontal', text: 'les échanges vocaux se diversifient.' }, { area: 'Pariétal et cervelet', text: 'les gestes se coordonnent.' }] },
  { from: 12, to: 24, range: '1–2 ans', title: 'Les premiers mots', themes: ['Compréhension', 'Gestes', 'Vocabulaire'], regions: [{ area: 'Temporal', text: 'les mots prennent davantage de sens.' }, { area: 'Frontal et pariétal', text: 'les gestes s’organisent en actions.' }] },
  { from: 24, to: 36, range: '2–3 ans', title: 'Relier les mots', themes: ['Vocabulaire', 'Petites phrases', 'Jeu'], regions: [{ area: 'Temporal et frontal', text: 'les mots se combinent en phrases.' }, { area: 'Frontopariétal', text: 'les petites suites d’actions se structurent.' }] },
  { from: 36, to: 60, range: '3–5 ans', title: 'Imaginer et raconter', themes: ['Récits', 'Imagination', 'Coordination'], regions: [{ area: 'Temporal et frontal', text: 'les récits deviennent plus élaborés.' }, { area: 'Cervelet et pariétal', text: 'la précision des gestes s’affine.' }] },
  { from: 60, to: 96, range: '5–8 ans', title: 'Entrer dans les apprentissages', themes: ['Langage écrit', 'Attention', 'Pratique'], regions: [{ area: 'Occipital et temporal', text: 'l’écrit associe vision et langage.' }, { area: 'Frontopariétal', text: 'l’attention et la mémoire de travail s’affinent.' }] },
  { from: 96, to: 144, range: '8–12 ans', title: 'Organiser ses idées', themes: ['Raisonnement', 'Mémoire', 'Organisation'], regions: [{ area: 'Pariétal', text: 'intègre espace, quantités et gestes.' }, { area: 'Frontal', text: 'l’organisation et la mémoire de travail s’affinent.' }] },
  { from: 144, to: 192, range: '12–16 ans', title: 'Nuancer sa pensée', themes: ['Abstraction', 'Relations', 'Régulation'], regions: [{ area: 'Préfrontal', text: 'la planification et l’inhibition se raffinent.' }, { area: 'Cingulaire et insula', text: 'participent à la régulation des réponses.' }] },
  { from: 192, to: 241, range: '16–20 ans', title: 'Affiner ses stratégies', themes: ['Expression', 'Planification', 'Autonomie'], regions: [{ area: 'Préfrontal', text: 'planification et inhibition s’affinent.' }, { area: 'Réseaux d’association', text: 'le développement continue après 20 ans.' }] },
]);

export function insightForAge(age) {
  const months = Math.max(0, Math.min(240, Math.round(age * 12)));
  return AGE_INSIGHTS.find(item => months >= item.from && months < item.to);
}
