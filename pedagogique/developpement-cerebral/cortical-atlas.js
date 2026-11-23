// Anatomical labels only. No thickness predictions or maturity measurements.
export async function loadCorticalAtlas() {
  const response = await fetch('./assets/destrieux-labels.bin');
  if (!response.ok) throw new Error('Cortical atlas unavailable');
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength !== 20484 * 2) throw new Error('Invalid cortical atlas');
  return new Uint16Array(buffer);
}

const REGION_NAMES = [
  'Zone non parcellisée',
  'Région frontomarginale', 'Région occipitale inférieure', 'Région paracentrale',
  'Région sous-centrale', 'Région frontopolaire transverse', 'Cortex cingulaire antérieur',
  'Cortex cingulaire moyen antérieur', 'Cortex cingulaire moyen postérieur',
  'Cortex cingulaire postérieur dorsal', 'Cortex cingulaire postérieur ventral', 'Cunéus',
  'Gyrus frontal inférieur, partie operculaire', 'Gyrus frontal inférieur, partie orbitaire',
  'Gyrus frontal inférieur, partie triangulaire', 'Gyrus frontal moyen', 'Gyrus frontal supérieur',
  'Région insulaire longue', 'Gyrus insulaire court', 'Gyrus occipital moyen', 'Gyrus occipital supérieur',
  'Gyrus fusiforme', 'Gyrus lingual', 'Gyrus parahippocampique', 'Gyrus orbitaire', 'Gyrus angulaire',
  'Gyrus supramarginal', 'Lobule pariétal supérieur', 'Gyrus postcentral', 'Gyrus précentral',
  'Précunéus', 'Gyrus droit', 'Gyrus sous-calleux', 'Gyrus temporal transverse',
  'Gyrus temporal supérieur', 'Plan polaire temporal', 'Plan temporal', 'Gyrus temporal inférieur',
  'Gyrus temporal moyen', 'Fissure latérale, branche horizontale', 'Fissure latérale, branche verticale',
  'Fissure latérale postérieure', 'Pôle occipital', 'Pôle temporal', 'Sillon calcarin', 'Sillon central',
  'Sillon cingulaire marginal', 'Sillon circulaire antérieur de l’insula', 'Sillon circulaire inférieur de l’insula',
  'Sillon circulaire supérieur de l’insula', 'Sillon collatéral transverse antérieur',
  'Sillon collatéral transverse postérieur', 'Sillon frontal inférieur', 'Sillon frontal moyen',
  'Sillon frontal supérieur', 'Sillon intermédiaire de Jensen', 'Sillon intrapariétal',
  'Sillon occipital moyen', 'Sillon occipital supérieur', 'Sillon occipital antérieur',
  'Sillon occipitotemporal latéral', 'Sillon occipitotemporal médial', 'Sillon orbitaire latéral',
  'Sillon orbitaire médial', 'Sillon orbitaire en H', 'Sillon pariéto-occipital', 'Sillon péricalleux',
  'Sillon postcentral', 'Sillon précentral inférieur', 'Sillon précentral supérieur', 'Sillon sous-orbitaire',
  'Sillon sous-pariétal', 'Sillon temporal inférieur', 'Sillon temporal supérieur', 'Sillon temporal transverse',
];

export function regionName(id) {
  if (!id) return REGION_NAMES[0];
  return `${REGION_NAMES[(id - 1) % 74 + 1]} · ${id <= 74 ? 'gauche' : 'droite'}`;
}
