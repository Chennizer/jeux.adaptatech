// Broad educational themes, not individual milestones or fitted brain curves.
// Ranges are editorial groupings, never biological switches at a fixed date.
export const AGE_INSIGHTS = Object.freeze([
  { from: 0, to: 3, range: '0–3 mois', title: 'Premiers échanges', themes: ['Voix', 'Regard', 'Mouvement'] },
  { from: 3, to: 6, range: '3–6 mois', title: 'Explorer les sens', themes: ['Sons', 'Gestes', 'Coordination'] },
  { from: 6, to: 12, range: '6–12 mois', title: 'Babiller et échanger', themes: ['Babillage', 'Imitation', 'Échanges'] },
  { from: 12, to: 24, range: '1–2 ans', title: 'Les premiers mots', themes: ['Compréhension', 'Gestes', 'Vocabulaire'] },
  { from: 24, to: 36, range: '2–3 ans', title: 'Relier les mots', themes: ['Vocabulaire', 'Petites phrases', 'Jeu'] },
  { from: 36, to: 60, range: '3–5 ans', title: 'Imaginer et raconter', themes: ['Récits', 'Imagination', 'Coordination'] },
  { from: 60, to: 96, range: '5–8 ans', title: 'Entrer dans les apprentissages', themes: ['Langage écrit', 'Attention', 'Pratique'] },
  { from: 96, to: 144, range: '8–12 ans', title: 'Organiser ses idées', themes: ['Raisonnement', 'Mémoire', 'Organisation'] },
  { from: 144, to: 192, range: '12–16 ans', title: 'Nuancer sa pensée', themes: ['Abstraction', 'Relations', 'Régulation'] },
  { from: 192, to: 241, range: '16–20 ans', title: 'Affiner ses stratégies', themes: ['Expression', 'Planification', 'Autonomie'] },
]);

export function insightForAge(age) {
  const months = Math.max(0, Math.min(240, Math.round(age * 12)));
  return AGE_INSIGHTS.find(item => months >= item.from && months < item.to);
}
