// Illustrative spatial kernels in native fsaverage RAS millimetres.
// These are NOT an anatomical parcellation or fitted developmental data.
// Each kernel supplies a start/end age and an ellipsoidal spatial influence.
export const REGIONS = [
  { center: [0, -88, 12], spread: [65, 27, 43], start: -1, end: 12 }, // visual
  { center: [0, -22, 65], spread: [67, 23, 27], start: -1, end: 15 }, // sensorimotor
  { center: [0, -61, 49], spread: [66, 30, 31], start: 0, end: 20 }, // parietal association
  { center: [0, -25, -23], spread: [70, 42, 25], start: 0, end: 24 }, // temporal association
  { center: [0, 12, 55], spread: [60, 25, 28], start: 1, end: 23 }, // frontal association
  { center: [0, 53, 20], spread: [57, 27, 42], start: 2, end: 29 }, // prefrontal
  { center: [0, 30, -20], spread: [54, 29, 24], start: 1, end: 27 }, // ventral frontal
];

export function maturationWindow(x, y, z) {
  let total = 0;
  let start = 0;
  let end = 0;
  for (const region of REGIONS) {
    const dx = (x - region.center[0]) / region.spread[0];
    const dy = (y - region.center[1]) / region.spread[1];
    const dz = (z - region.center[2]) / region.spread[2];
    const weight = Math.exp(-1.5 * (dx * dx + dy * dy + dz * dz));
    total += weight;
    start += weight * region.start;
    end += weight * region.end;
  }
  return [start / total, end / total];
}

export function maturityAtAge(age, start, end) {
  const t = Math.max(0, Math.min(1, (age - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function formatAge(age) {
  return new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 1 }).format(age);
}
