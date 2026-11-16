// Add effect definitions here; the selector is generated from this registry.
// A new rendering family also needs its corresponding shader branch.
export const EPILEPSY_EFFECTS = Object.freeze([
  { id: 'spread', label: 'Crise focale avec diffusion', description: 'Cliquez sur une zone : la diffusion suit la surface du même hémisphère.', shader: 0, animation: 'spread', usesIllustration: false },
  { id: 'local', label: 'Activité électrique localisée', description: 'Cliquez sur une zone : un foyer local pulse doucement.', shader: 1, animation: 'pulse', usesIllustration: false },
  { id: 'development', label: 'Développement local (hypothèse)', description: 'Décalage choisi pour l’illustration, sans prédiction de l’effet de l’épilepsie.', shader: 2, animation: 'none', usesIllustration: true },
]);

export function epilepsyEffect(id) {
  return EPILEPSY_EFFECTS.find(effect => effect.id === id) || EPILEPSY_EFFECTS[0];
}
