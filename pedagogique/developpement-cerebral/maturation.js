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

export function buildMaturationWindows(positions, sulcalDepth) {
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
  }
  return windows;
}

export function maturityAtAge(age, start, end, earlyShare = 0, earlyYears = 1) {
  const t = Math.max(0, Math.min(1, (age - start) / (end - start)));
  const later = t * t * (3 - 2 * t);
  const infant = 1 - Math.exp(-Math.max(0, age) / earlyYears);
  return later * (1 - earlyShare) + infant * earlyShare;
}

export function ageParts(age) {
  const months = Math.max(0, Math.min(240, Math.round(age * 12)));
  if (months < 12) return { value: String(months), unit: 'mois' };
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const unit = years === 1 ? 'an' : 'ans';
  return { value: String(years), unit: remainder ? `${unit} ${remainder} mois` : unit };
}
