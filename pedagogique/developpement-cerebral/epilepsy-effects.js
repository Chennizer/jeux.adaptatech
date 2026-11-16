// Add effect definitions here; the selector is generated from this registry.
// A new rendering family also needs its corresponding shader branch.
export const EPILEPSY_EFFECTS = Object.freeze([
  { id: 'spread', label: 'Crise focale avec diffusion', description: 'La zone violette s’étend puis reste visible. Relancez pour revoir sa propagation.', shader: 0, animation: 'spread', usesIllustration: false, radius: 96, color: '#9560c7' },
  { id: 'local', label: 'Activité électrique localisée', description: 'Une zone rose reste localisée, avec des anneaux et une pulsation lente.', shader: 1, animation: 'pulse', usesIllustration: false, radius: 34, color: '#c24491' },
  { id: 'development', label: 'Développement local (hypothèse)', description: 'La zone ambrée et hachurée montre un décalage choisi, sans prédiction médicale.', shader: 2, animation: 'none', usesIllustration: true, radius: 58, color: '#b97522' },
]);

export function epilepsyEffect(id) {
  return EPILEPSY_EFFECTS.find(effect => effect.id === id) || EPILEPSY_EFFECTS[0];
}
