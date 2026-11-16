// Regional model predictions in millimetres, not an index of maturity.
export async function loadCorticalData() {
  const [curveResponse, atlasResponse] = await Promise.all([
    fetch('./assets/cortical-thickness.json'),
    fetch('./assets/destrieux-labels.bin'),
  ]);
  if (!curveResponse.ok || !atlasResponse.ok) throw new Error('Scientific assets unavailable');
  const data = await curveResponse.json();
  const atlas = await atlasResponse.arrayBuffer();
  if (data.regions.length !== 148 || data.ages.length !== 31 || atlas.byteLength !== 20484 * 2) {
    throw new Error('Invalid scientific assets');
  }
  data.vertexLabels = new Uint16Array(atlas);
  return data;
}

export function sampleThickness(data, age, target = new Float32Array(148)) {
  if (!Number.isFinite(age) || age < data.minimumAge || age > data.maximumAge) return null;
  const offset = (age - data.minimumAge) * 2;
  const lower = Math.min(data.ages.length - 1, Math.floor(offset));
  const upper = Math.min(data.ages.length - 1, lower + 1);
  const fraction = offset - lower;
  for (let i = 0; i < data.regions.length; i++) {
    const { femaleMedian, maleMedian } = data.regions[i];
    const a = (femaleMedian[lower] + maleMedian[lower]) / 2;
    const b = (femaleMedian[upper] + maleMedian[upper]) / 2;
    target[i] = a + (b - a) * fraction;
  }
  return target;
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
