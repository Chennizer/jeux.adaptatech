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

const PATCH_COUNT = 64;

// Repeatable variation: patches retain the same timing on every load and view.
function variation(index, salt) {
  const value = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function createPatches(positions) {
  // Sample the left cortical surface; mirror the field across hemispheres.
  // Farthest-point sampling spreads patches over the actual folded geometry.
  const count = positions.length / 6;
  const distances = new Float64Array(count).fill(Infinity);
  const patches = [];
  let next = 0;
  for (let patch = 0; patch < PATCH_COUNT; patch++) {
    const x = Math.abs(positions[next * 3]);
    const y = positions[next * 3 + 1];
    const z = positions[next * 3 + 2];
    const [baseStart, baseEnd] = maturationWindow(x, y, z);
    const shift = (variation(patch, 1) * 2 - 1) * 5.2;
    const start = Math.max(0, baseStart + shift * 0.35 + variation(patch, 2) * 2);
    const end = Math.max(start + 5.5, baseEnd * (0.82 + variation(patch, 3) * 0.4) + shift);
    // An immediate infant phase makes changes visible before the slower phase.
    // Timing and amplitude are illustrative, with stronger early sensory changes.
    const earlyPriority = Math.max(0, Math.min(1, (29 - baseEnd) / 17));
    const earlyShare = Math.max(0.12, Math.min(0.8, 0.12 + earlyPriority * 0.64 + (variation(patch, 4) - 0.5) * 0.2));
    const earlyYears = 0.3 + (1 - earlyPriority) * 1.9 + variation(patch, 5) * 0.35;
    patches.push({ x, y, z, start, end, earlyShare, earlyYears });
    let furthest = -1;
    for (let i = 0; i < count; i++) {
      const dx = Math.abs(positions[i * 3]) - x;
      const dy = positions[i * 3 + 1] - y;
      const dz = positions[i * 3 + 2] - z;
      distances[i] = Math.min(distances[i], dx * dx + dy * dy + dz * dz);
      if (distances[i] > furthest) {
        furthest = distances[i];
        next = i;
      }
    }
  }
  return patches;
}

// Destrieux anatomical labels locate early sensory/motor bands accurately.
// The timings below remain illustrative; labels do not supply maturity data.
const SENSORY_WINDOWS = new Map([
  [3, [0.70, 0.55, 17]], // paracentral (dorsal/medial sensorimotor)
  [28, [0.74, 0.50, 16]], // postcentral: primary somatosensory
  [29, [0.70, 0.55, 17]], // precentral: primary motor
  [45, [0.72, 0.52, 17]], // central sulcus
  [67, [0.68, 0.55, 18]], // postcentral sulcus
  [68, [0.66, 0.60, 18]], [69, [0.68, 0.57, 18]], // precentral sulci
  [11, [0.72, 0.50, 16]], [22, [0.69, 0.55, 17]], // visual: cuneus, lingual
  [42, [0.73, 0.50, 16]], [44, [0.75, 0.48, 16]], // occipital pole, calcarine
]);

// Anatomical proxies for a distributed, bilateral auditory/language network.
// These different colour windows are illustrative, not functional boundaries,
// fitted developmental estimates, or an assertion of inactivity in red regions.
const AUDITORY_LANGUAGE_WINDOWS = new Map([
  [33, [0, 18, 0.74, 0.48]], // Heschl / transverse temporal: primary auditory
  [34, [0, 22, 0.52, 0.85]], // superior temporal: auditory association
  [36, [0, 23, 0.48, 0.95]], // planum temporale
  [35, [0, 25, 0.36, 1.15]], // planum polare
  [38, [0, 26, 0.36, 1.25]], // middle temporal: broader language network
  [73, [0, 26, 0.38, 1.15]], // superior temporal sulcus
  [12, [0, 27, 0.28, 1.40]], // inferior frontal, opercular part
  [14, [0, 29, 0.24, 1.50]], // inferior frontal, triangular part
  [13, [0, 30, 0.22, 1.70]], // inferior frontal, orbital part
  [25, [0, 27, 0.31, 1.20]], // angular
  [26, [0, 26, 0.38, 1.00]], // supramarginal
]);

export function buildMaturationWindows(positions, sulcalDepth, corticalLabels = null) {
  const patches = createPatches(positions);
  // Per vertex: slower phase start/end, infant share, infant time constant.
  const windows = new Float32Array(positions.length / 3 * 4);
  for (let i = 0; i < positions.length / 3; i++) {
    const x = Math.abs(positions[i * 3]);
    const depth = sulcalDepth[i];
    // Small, fixed offsets soften patch contours along the cortical folds.
    const y = positions[i * 3 + 1] + depth * 2;
    const z = positions[i * 3 + 2] - depth * 2;
    let total = 0;
    let start = 0;
    let end = 0;
    let earlyShare = 0;
    let earlyYears = 0;
    for (const patch of patches) {
      const dx = x - patch.x;
      const dy = y - patch.y;
      const dz = z - patch.z;
      const distance = dx * dx + dy * dy + dz * dz + 45;
      // A local falloff keeps patches distinct while blending their edges.
      const weight = 1 / (distance * distance * distance);
      total += weight;
      start += weight * patch.start;
      end += weight * patch.end;
      earlyShare += weight * patch.earlyShare;
      earlyYears += weight * patch.earlyYears;
    }
    windows[i * 4] = start / total;
    windows[i * 4 + 1] = end / total;
    windows[i * 4 + 2] = earlyShare / total;
    windows[i * 4 + 3] = earlyYears / total;
    const label = corticalLabels?.[i] || 0;
    const sensory = SENSORY_WINDOWS.get(label ? (label - 1) % 74 + 1 : 0);
    if (sensory) {
      windows[i * 4] = 0;
      windows[i * 4 + 1] = Math.min(windows[i * 4 + 1], sensory[2]);
      windows[i * 4 + 2] = Math.max(windows[i * 4 + 2], sensory[0]);
      windows[i * 4 + 3] = Math.min(windows[i * 4 + 3], sensory[1]);
    }
    const auditoryLanguage = AUDITORY_LANGUAGE_WINDOWS.get(label ? (label - 1) % 74 + 1 : 0);
    if (auditoryLanguage) windows.set(auditoryLanguage, i * 4);
  }
  return windows;
}

export function maturityAtAge(age, start, end, earlyShare = 0, earlyYears = 1) {
  const t = Math.max(0, Math.min(1, (age - start) / (end - start)));
  // An initial regional contrast and an ongoing tail avoid implying that all
  // development starts at birth or stops at a nominal window end. These
  // constants are editorial choices, not estimates from the cited studies.
  const later = 0.9 * t * t * (3 - 2 * t) + 0.1 * (1 - Math.exp(-Math.max(0, age) / 25));
  const infant = 1 - Math.exp(-Math.max(0, age) / earlyYears);
  const birth = 0.22 * earlyShare;
  return birth + (1 - birth) * (later * (1 - earlyShare) + infant * earlyShare);
}

export function ageParts(age) {
  const months = Math.max(0, Math.min(240, Math.round(age * 12)));
  if (months < 12) return { value: String(months), unit: 'mois' };
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const unit = years === 1 ? 'an' : 'ans';
  return { value: String(years), unit: remainder ? `${unit} ${remainder} mois` : unit };
}
