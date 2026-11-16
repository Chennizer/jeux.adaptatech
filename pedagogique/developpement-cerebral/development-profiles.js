// Educational scenarios, never diagnostic profiles, IQ or measured capacities.
export const PROFILE_DOMAINS = Object.freeze([
  { id: 'language', label: 'Langage' },
  { id: 'attention', label: 'Attention / concentration' },
  { id: 'coordination', label: 'Coordination' },
]);

export const DEVELOPMENT_PROFILES = Object.freeze([
  { id: 'reference', label: 'Repère illustratif', title: '', values: [0, 0, 0] },
  { id: 'language_attention', label: 'Langage + / Attention −', title: 'Langage en appui', values: [1, -1, 0] },
  { id: 'attention_language', label: 'Attention + / Langage −', title: 'Attention en appui', values: [-1, 1, 0] },
  { id: 'coordination_language', label: 'Coordination + / Langage −', title: 'Coordination en appui', values: [-1, 0, 1] },
  { id: 'custom', label: 'Personnaliser', title: 'Un profil singulier', values: null },
]);

export function profileLevel(value) {
  return value < 0 ? 'À soutenir' : value > 0 ? 'En appui' : 'Intermédiaire';
}

// Coarse Destrieux-based spatial influences, not functional parcellations.
// Language, attention and coordination use overlapping distributed networks.
const LANGUAGE = new Map([[33,.3],[34,1],[35,.7],[36,1],[38,.9],[73,.9],[12,.9],[14,1],[13,.7],[25,.7],[26,.7],[21,.3]]);
const ATTENTION = new Map([[6,.8],[7,.8],[8,.65],[15,1],[16,.9],[27,.95],[30,.6],[25,.35],[26,.35],[53,.7],[54,.6],[56,.9],[69,.25]]);
const COORDINATION = new Map([[3,.9],[28,.55],[29,1],[45,.65],[67,.5],[68,.8],[69,.8]]);

export function buildProfileInfluences(labels, graph) {
  const count = graph.offsets.length - 1;
  let influences = new Float32Array(count * 3);
  if (!labels) return influences;
  for (let i = 0; i < count; i++) {
    const id = labels[i] ? (labels[i] - 1) % 74 + 1 : 0;
    influences.set([LANGUAGE.get(id) || 0, ATTENTION.get(id) || 0, COORDINATION.get(id) || 0], i * 3);
  }
  // Mild smoothing follows cortical edges and cannot cross hemispheres.
  for (let pass = 0; pass < 3; pass++) {
    const next = new Float32Array(influences.length);
    for (let i = 0; i < count; i++) {
      const degree = graph.offsets[i + 1] - graph.offsets[i];
      for (let channel = 0; channel < 3; channel++) {
        let sum = 0;
        for (let j = graph.offsets[i]; j < graph.offsets[i + 1]; j++) sum += influences[graph.neighbors[j] * 3 + channel];
        next[i * 3 + channel] = degree ? influences[i * 3 + channel] * .65 + sum / degree * .35 : influences[i * 3 + channel];
      }
    }
    influences = next;
  }
  // Shared influences blend rather than assigning one exclusive function.
  for (let i = 0; i < count; i++) {
    const total = Math.max(1, influences[i * 3] + influences[i * 3 + 1] + influences[i * 3 + 2]);
    for (let channel = 0; channel < 3; channel++) influences[i * 3 + channel] /= total;
  }
  return influences;
}

export function profileColourStage(base, age, adjustment) {
  const strength = (1 - Math.exp(-Math.max(0, age) / 1.5)) * .3;
  const room = 1 - Math.abs(base - .5) * 1.2;
  return Math.max(0, Math.min(1, base + adjustment * strength * room));
}
