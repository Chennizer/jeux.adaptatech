// Broad educational examples, not individual milestones or fitted brain curves.
// Ranges are editorial groupings; crossing a boundary is not a biological switch.
export const AGE_INSIGHTS = Object.freeze([
  { from: 0, to: 3, range: '0–3 mois', title: 'Écouter et entrer en relation', items: [
    ['Audition et échanges', 'Les sons et les voix suscitent déjà des réactions. Les échanges vocaux commencent.'],
    ['Sens et mouvement', 'Le regard, le toucher et les mouvements participent aux premières découvertes.'],
  ] },
  { from: 3, to: 6, range: '3–6 mois', title: 'Explorer les sons et les gestes', items: [
    ['Audition et voix', 'Les jeux vocaux se diversifient et les sons de l’entourage attirent l’attention.'],
    ['Coordination', 'Regarder, tendre la main et explorer les objets se coordonnent progressivement.'],
  ] },
  { from: 6, to: 12, range: '6–12 mois', title: 'Babiller et échanger', items: [
    ['Audition et langage', 'Le babillage s’enrichit ; des mots familiers prennent progressivement du sens.'],
    ['Communication', 'Les gestes, l’imitation et les échanges de regards soutiennent les interactions.'],
  ] },
  { from: 12, to: 24, range: '1–2 ans', title: 'Donner du sens aux mots', items: [
    ['Compréhension', 'Les mots familiers et les petites consignes sont de mieux en mieux compris.'],
    ['Expression', 'Les gestes et les premiers mots permettent de partager davantage d’envies et d’idées.'],
  ] },
  { from: 24, to: 36, range: '2–3 ans', title: 'Assembler les mots et les idées', items: [
    ['Langage', 'Le vocabulaire s’élargit et les combinaisons de mots deviennent plus riches.'],
    ['Action et mémoire', 'Les jeux, l’imitation et les petites séquences d’actions gagnent en complexité.'],
  ] },
  { from: 36, to: 60, range: '3–5 ans', title: 'Raconter, imaginer et jouer', items: [
    ['Langage', 'Les phrases, les conversations et les récits se développent avec les expériences.'],
    ['Attention et gestes', 'Les jeux à règles simples, la coordination et l’attente se travaillent peu à peu.'],
  ] },
  { from: 60, to: 96, range: '5–8 ans', title: 'Relier les sons aux apprentissages', items: [
    ['Langage et apprentissages', 'Les liens entre sons, mots et écrit se construisent avec l’enseignement et la pratique.'],
    ['Attention et coordination', 'Suivre plusieurs étapes et automatiser des gestes devient progressivement plus facile.'],
  ] },
  { from: 96, to: 144, range: '8–12 ans', title: 'Organiser ses idées', items: [
    ['Langage et raisonnement', 'Le vocabulaire, les explications et la compréhension des textes s’enrichissent.'],
    ['Mémoire et organisation', 'Les stratégies pour retenir, planifier et vérifier son travail se développent.'],
  ] },
  { from: 144, to: 192, range: '12–16 ans', title: 'Nuancer sa pensée', items: [
    ['Langage et idées', 'Argumenter, comprendre les sous-entendus et envisager des idées abstraites s’affinent.'],
    ['Régulation et relations', 'Adapter ses réactions et ses décisions aux émotions et au contexte reste en développement.'],
  ] },
  { from: 192, to: 241, range: '16–20 ans', title: 'Affiner ses stratégies', items: [
    ['Expression et réflexion', 'Les façons de débattre, de communiquer avec nuance et de résoudre des problèmes se précisent.'],
    ['Planification et autonomie', 'Les projets à long terme et les stratégies personnelles se consolident ; le développement continue à l’âge adulte.'],
  ] },
]);

export function insightForAge(age) {
  const months = Math.max(0, Math.min(240, Math.round(age * 12)));
  return AGE_INSIGHTS.find(item => months >= item.from && months < item.to);
}
