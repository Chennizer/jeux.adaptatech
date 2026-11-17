// Qualitative regional trajectories, not a measured percentage of maturity.
// Anchors distinguish prenatal state, infancy, childhood and adolescence.
// Anatomical assignment replaces the previous 64 artificial spatial patches.
export const AGE_KNOTS = Object.freeze([0, .5, 1, 2, 5, 10, 15, 20]);
export const REGIONAL_CURVES = Object.freeze({
  somatosensory: { label: 'Somatosensoriel primaire', refs: ['natu','deoni'], values: [.22,.49,.62,.72,.81,.88,.92,.95] },
  motor: { label: 'Moteur primaire', refs: ['natu','deoni'], values: [.20,.44,.57,.68,.78,.86,.91,.94] },
  visual: { label: 'Vision primaire — repères calcarins', refs: ['natu','deoni'], values: [.21,.47,.61,.72,.82,.89,.93,.96] },
  auditory: { label: 'Audition primaire — Heschl', refs: ['natu','leroy'], values: [.23,.50,.63,.73,.82,.88,.92,.95] },
  visualAssociation: { label: 'Association visuelle occipitale', refs: ['natu','gogtay'], values: [.11,.25,.36,.48,.64,.79,.87,.93] },
  visualTemporal: { label: 'Association visuelle temporale', refs: ['natu','gogtay'], values: [.07,.14,.21,.30,.46,.65,.79,.88] },
  premotor: { label: 'Prémoteur et intégration sensorimotrice', refs: ['deoni','gogtay'], values: [.14,.30,.42,.53,.68,.81,.89,.94] },
  auditoryAssociation: { label: 'Association auditive temporale', refs: ['leroy','emerson'], values: [.14,.26,.34,.43,.57,.73,.85,.92] },
  temporal: { label: 'Association temporale et sémantique', refs: ['leroy','emerson'], values: [.08,.13,.18,.25,.39,.57,.73,.86] },
  temporalSulcus: { label: 'Sillon temporal supérieur', refs: ['leroy','emerson'], values: [.07,.12,.17,.23,.37,.55,.71,.85] },
  frontalOpercular: { label: 'Frontal inférieur operculaire', refs: ['leroy','perani'], values: [.13,.23,.29,.35,.46,.63,.78,.89] },
  frontalLanguage: { label: 'Frontal inférieur associatif', refs: ['leroy','emerson','whitaker'], values: [.10,.16,.21,.28,.39,.56,.73,.86] },
  parietal: { label: 'Association pariétale', refs: ['gogtay','fair'], values: [.10,.17,.23,.31,.46,.65,.80,.90] },
  frontoparietal: { label: 'Régions frontopariétales de contrôle', refs: ['fair','whitaker'], values: [.06,.11,.16,.23,.35,.52,.69,.84] },
  prefrontal: { label: 'Préfrontal associatif', refs: ['gogtay','whitaker','grydeland'], values: [.04,.08,.12,.18,.28,.43,.60,.78] },
  orbitofrontal: { label: 'Orbitofrontal', refs: ['gogtay','whitaker'], values: [.07,.12,.18,.25,.37,.54,.70,.84] },
  cingulate: { label: 'Cingulaire et réseaux médians', refs: ['fair','grydeland'], values: [.12,.21,.29,.38,.52,.68,.80,.90] },
  insula: { label: 'Insula et régions périsylviennes', refs: ['gogtay','grydeland'], values: [.12,.25,.35,.46,.62,.77,.86,.93] },
  medialTemporal: { label: 'Temporal médian', refs: ['gogtay','grydeland'], values: [.10,.18,.26,.36,.51,.68,.81,.91] }
});

// Destrieux labels describe gyri/sulci, not exact functional boundaries.
// Every one of the 74 labels has an explicit assignment, bilaterally.
const GROUPS = {
  somatosensory: [28,67], motor: [3,29,45], visual: [44], auditory: [33,74],
  visualAssociation: [2,11,19,20,22,42,57,58,59,61,65],
  visualTemporal: [21,51,60], premotor: [4,68,69],
  auditoryAssociation: [34,35,36,41], temporal: [37,38,43,72], temporalSulcus: [73],
  frontalOpercular: [12,40], frontalLanguage: [13,14,39,52],
  parietal: [25,26,27,55,71], frontoparietal: [15,16,30,53,54,56],
  prefrontal: [1,5], orbitofrontal: [24,31,62,63,64,70],
  cingulate: [6,7,8,9,10,32,46,66], insula: [17,18,47,48,49], medialTemporal: [23,50]
};
const LABEL_CURVES = new Map(Object.entries(GROUPS).flatMap(([key, labels]) => labels.map(label => [label,key])));
export function curveForLabel(label) {
  return REGIONAL_CURVES[LABEL_CURVES.get(label ? (label - 1) % 74 + 1 : 0)] || null;
}

// Atlas-unavailable fallback: a coarse continuous field, without fake patches.
const FALLBACK = [
  ['visual',[0,-88,12],[65,27,43]], ['motor',[0,-22,65],[67,23,27]],
  ['parietal',[0,-61,49],[66,30,31]], ['temporal',[0,-25,-23],[70,42,25]],
  ['frontoparietal',[0,12,55],[60,25,28]], ['prefrontal',[0,53,20],[57,27,42]],
  ['orbitofrontal',[0,30,-20],[54,29,24]]
];
function fallbackCurve(x,y,z) {
  const result = Array(8).fill(0); let total = 0;
  for (const [key, center, spread] of FALLBACK) {
    const d = [x,y,z].reduce((sum,v,j) => sum + ((v-center[j])/spread[j])**2,0);
    const weight = Math.exp(-1.5*d); total += weight;
    REGIONAL_CURVES[key].values.forEach((value,j) => { result[j] += value*weight; });
  }
  return result.map(value => value/total);
}
export function buildMaturationCurves(positions, labels, graph = null) {
  const count = positions.length/3;
  let curves = new Float32Array(count*8);
  for (let i=0;i<count;i++) {
    const curve = curveForLabel(labels?.[i]);
    curves.set(curve?.values || fallbackCurve(Math.abs(positions[i*3]),positions[i*3+1],positions[i*3+2]),i*8);
  }
  // Only the immediate surface neighbours soften anatomical boundaries.
  // Distinct regions keep their own trajectories; disjoint hemispheres never mix.
  if (graph) for (let pass=0;pass<2;pass++) {
    const next = new Float32Array(curves.length);
    for (let i=0;i<count;i++) {
      const degree=graph.offsets[i+1]-graph.offsets[i];
      for (let k=0;k<8;k++) {
        let sum=0;
        for (let j=graph.offsets[i];j<graph.offsets[i+1];j++) sum+=curves[graph.neighbors[j]*8+k];
        next[i*8+k]=degree ? curves[i*8+k]*.82+sum/degree*.18 : curves[i*8+k];
      }
    }
    curves=next;
  }
  return curves;
}

// Monotone cubic Hermite interpolation in log(1+age). Unlike independent
// smoothsteps it keeps a nonzero slope at the age anchors. GLSL below matches.
const TIMES=AGE_KNOTS.map(age=>Math.log1p(age));
function slope(values,k) {
  if(k===0)return (values[1]-values[0])/(TIMES[1]-TIMES[0]);
  if(k===7)return (values[7]-values[6])/(TIMES[7]-TIMES[6]);
  const h0=TIMES[k]-TIMES[k-1],h1=TIMES[k+1]-TIMES[k];
  const d0=(values[k]-values[k-1])/h0,d1=(values[k+1]-values[k])/h1;
  if(d0<=0||d1<=0)return 0;
  return 3*(h0+h1)/((2*h1+h0)/d0+(h1+2*h0)/d1);
}
export function colourAtAge(age, ...values) {
  if(values.length!==8)throw new Error('Eight regional colour anchors required');
  const x=Math.log1p(Math.max(0,age));
  if(age>=20) {
    const remaining=1-values[7];
    return remaining<=0?1:values[7]+remaining*(1-Math.exp(-(x-TIMES[7])*slope(values,7)/remaining));
  }
  let k=0;while(k<6&&x>TIMES[k+1])k++;
  const h=TIMES[k+1]-TIMES[k],t=(x-TIMES[k])/h,t2=t*t,t3=t2*t;
  return (2*t3-3*t2+1)*values[k]+(t3-2*t2+t)*h*slope(values,k)+(-2*t3+3*t2)*values[k+1]+(t3-t2)*h*slope(values,k+1);
}
export const COLOUR_CURVE_GLSL = `
float colourTime(int k) {
  ${TIMES.map((value,i)=>`if(k==${i})return ${value.toFixed(10)};`).join('\n  ')}
  return ${TIMES[7].toFixed(10)};
}
float colourAnchor(int k, vec4 early, vec4 late) {
  if(k<4)return early[k];
  return late[k-4];
}
float colourSlope(int k, vec4 early, vec4 late) {
  if(k==0)return (early.y-early.x)/(colourTime(1)-colourTime(0));
  if(k==7)return (late.w-late.z)/(colourTime(7)-colourTime(6));
  float h0=colourTime(k)-colourTime(k-1),h1=colourTime(k+1)-colourTime(k);
  float d0=(colourAnchor(k,early,late)-colourAnchor(k-1,early,late))/h0;
  float d1=(colourAnchor(k+1,early,late)-colourAnchor(k,early,late))/h1;
  if(d0<=0.0||d1<=0.0)return 0.0;
  return 3.0*(h0+h1)/((2.0*h1+h0)/d0+(h1+2.0*h0)/d1);
}
float regionalColour(float age, vec4 early, vec4 late) {
  float x=log(1.0+max(0.0,age));
  if(age>=20.0){
    float remaining=1.0-late.w;
    return late.w+remaining*(1.0-exp(-(x-colourTime(7))*colourSlope(7,early,late)/max(0.00001,remaining)));
  }
  int k=0;
  for(int j=1;j<7;j++){if(x>colourTime(j))k=j;}
  float h=colourTime(k+1)-colourTime(k),t=(x-colourTime(k))/h,t2=t*t,t3=t2*t;
  return (2.0*t3-3.0*t2+1.0)*colourAnchor(k,early,late)+(t3-2.0*t2+t)*h*colourSlope(k,early,late)
    +(-2.0*t3+3.0*t2)*colourAnchor(k+1,early,late)+(t3-t2)*h*colourSlope(k+1,early,late);
}`;

export function ageParts(age) {
  const months = Math.max(0, Math.min(240, Math.round(age * 12)));
  if (months < 12) return { value: String(months), unit: 'mois' };
  const years = Math.floor(months / 12),remainder = months % 12;
  const unit = years === 1 ? 'an' : 'ans';
  return { value: String(years), unit: remainder ? `${unit} ${remainder} mois` : unit };
}
