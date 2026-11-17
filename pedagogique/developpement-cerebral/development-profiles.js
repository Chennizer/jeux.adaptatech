// Seven illustrative domains. Zero preserves the age-based reference exactly;
// negative values represent increasing difficulties, never a mental age.
export const PROFILE_DOMAINS = Object.freeze([
  { id: 'expressive', label: 'Communication expressive' },
  { id: 'receptive', label: 'Communication réceptive' },
  { id: 'motor', label: 'Motricité' },
  { id: 'instructions', label: 'Compréhension des consignes' },
  { id: 'memory', label: 'Mémoire des étapes' },
  { id: 'coordination', label: 'Coordination' },
  { id: 'regulation', label: 'Autorégulation' }
]);

export function profileLevel(value) {
  if (value >= 0) return 'Repère neurotypique';
  if (value > -.34) return 'Difficulté légère, illustrative';
  if (value > -.67) return 'Difficulté modérée, illustrative';
  return 'Difficulté marquée, illustrative';
}

// Overlapping anatomical proxies, not exclusive functional or diagnostic maps.
// Motor execution and coordination have separate cortical/cerebellar weights.
const EXPRESSIVE = new Map([[12,1],[13,.8],[14,1],[34,.35],[38,.45],[73,.4],[26,.5],[25,.35],[68,.35]]);
const RECEPTIVE = new Map([[33,.25],[34,.9],[35,.7],[36,.8],[37,.75],[38,1],[43,.65],[73,1],[25,.65],[26,.45],[14,.3]]);
const MOTOR = new Map([[3,.95],[29,1],[45,.7],[68,.55],[69,.55],[28,.35]]);
const INSTRUCTIONS = new Map([[12,.8],[13,.7],[14,1],[15,.45],[16,.3],[25,1],[26,.65],[30,.45],[34,.4],[35,.5],[36,.5],[38,.55],[43,.7],[73,.85],[6,.25],[9,.45],[10,.4],[53,.4]]);
const MEMORY = new Map([[15,1],[16,.8],[27,.9],[26,.7],[56,1],[53,.8],[54,.75],[12,.45],[14,.45],[7,.4],[8,.3],[25,.3],[30,.4]]);
const COORDINATION = new Map([[3,.8],[28,.65],[29,.65],[45,.45],[67,.55],[68,.95],[69,.95],[27,.6],[56,.5]]);
const REGULATION = new Map([[1,.7],[5,.7],[6,1],[7,.9],[8,.5],[15,.85],[16,.9],[18,.75],[24,.65],[31,.5],[53,.7],[54,.6],[62,.5],[64,.5]]);
const NETWORKS = [EXPRESSIVE, RECEPTIVE, MOTOR, INSTRUCTIONS, MEMORY, COORDINATION, REGULATION];

export function buildProfileInfluences(labels, graph) {
  const count = graph.offsets.length - 1;
  const channels = PROFILE_DOMAINS.length;
  let influences = new Float32Array(count * channels);
  if (!labels) return influences;
  for (let i = 0; i < count; i++) {
    const id = labels[i] ? (labels[i] - 1) % 74 + 1 : 0;
    NETWORKS.forEach((network, k) => { influences[i * channels + k] = network.get(id) || 0; });
  }
  for (let pass = 0; pass < 3; pass++) {
    const next = new Float32Array(influences.length);
    for (let i = 0; i < count; i++) {
      const degree = graph.offsets[i + 1] - graph.offsets[i];
      for (let k = 0; k < channels; k++) {
        let sum = 0;
        for (let j = graph.offsets[i]; j < graph.offsets[i + 1]; j++) sum += influences[graph.neighbors[j] * channels + k];
        next[i * channels + k] = degree ? influences[i * channels + k] * .65 + sum / degree * .35 : influences[i * channels + k];
      }
    }
    influences = next;
  }
  return influences;
}

const deficitValue = value => Math.max(-1, Math.min(0, Number.isFinite(value) ? value : 0));

// Bounded accumulation: increasing one difficulty cannot cancel another one.
// The shader uses this same product, with all-zero inputs giving exactly zero.
export function profileAdjustment(influences, values) {
  let remaining = 1;
  for (let k = 0; k < PROFILE_DOMAINS.length; k++) {
    remaining *= 1 + influences[k] * deficitValue(values[k]);
  }
  return remaining - 1;
}

export function cerebellarProfileAdjustment(values) {
  return (1 + .35 * deficitValue(values[2])) * (1 + .8 * deficitValue(values[5])) - 1;
}

export function profileColourStage(base, age, adjustment) {
  const strength = (1 - Math.exp(-Math.max(0, age) / 1.5)) * .34;
  const room = 1 - Math.abs(base - .5) * 1.2;
  return Math.max(0, Math.min(1, base + deficitValue(adjustment) * strength * room));
}
