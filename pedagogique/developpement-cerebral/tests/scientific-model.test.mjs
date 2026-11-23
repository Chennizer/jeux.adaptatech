import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { regionName } from '../cortical-atlas.js';
import { buildSurfaceGraph } from '../cortical-network.js';
import { cerebellumColourStage } from '../cerebellum.js';
import { AGE_INSIGHTS, insightForAge } from '../age-insights.js';
import { buildMaturationCurves, colourAtAge, AGE_KNOTS, REGIONAL_CURVES, curveForLabel } from '../maturation.js';
import { BRAIN_PALETTE, setScaleColour } from '../colour-scale.js';
import { Color } from '../vendor/three.module.min.js';
import { buildProfileInfluences, profileColourStage, profileAdjustment, profileInfluenceResponse, cerebellarProfileAdjustment, PROFILE_DOMAINS } from '../development-profiles.js';

const atlasSource = JSON.parse(await readFile(new URL('../assets/atlas-source.json', import.meta.url), 'utf8'));

test('deficit-only profiles preserve the reference and stay bounded without changing age', () => {
  const neutral = Array(PROFILE_DOMAINS.length).fill(0);
  assert.equal(PROFILE_DOMAINS.length, 13);
  assert.equal(profileAdjustment(Array(13).fill(1), neutral), 0);
  assert.equal(cerebellarProfileAdjustment(neutral), 0);
  for (const base of [0,.1,.5,.9,1]) {
    assert.equal(profileColourStage(base, 0), base);
    let previous = base;
    for (const adjustment of [-.1,-.3,-.5,-.8,-1]) {
      const stage = profileColourStage(base, adjustment);
      assert(stage >= 0 && stage <= previous);
      previous = stage;
    }
    assert.equal(profileColourStage(base, 1), base, 'positive adjustments cannot advance the reference');
    assert.equal(profileColourStage(base, -1), 0, 'full-scale colour contrast reaches the red stop regardless of the reference colour');
  }
});

test('thirteen profile influences remain on their own disconnected hemisphere', () => {
  const graph = buildSurfaceGraph(new Float32Array([0,0,0, 3,0,0, 0,4,0, 0,0,1, 3,0,1, 0,4,1]), new Uint16Array([0,1,2, 3,4,5]));
  const influences = buildProfileInfluences(new Uint16Array([14,14,14,0,0,0]), graph);
  assert(influences[0] > .9);
  assert(influences.subarray(39).every(value => value === 0));
  assert(buildProfileInfluences(null, graph).every(value => value === 0));
});

test('the thirteen domains retain distinct overlapping influences and increasing deficits cannot cancel each other', async () => {
  const bytes = await readFile(new URL('../assets/cortex.bin', import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const header = new DataView(buffer), count = header.getUint32(4, true);
  const positions = new Float32Array(buffer, 16, count * 3);
  const triangles = new Uint16Array(buffer, 16 + count * 16, header.getUint32(8, true));
  const atlas = await readFile(new URL('../assets/destrieux-labels.bin', import.meta.url));
  const labels = Uint16Array.from({ length: count }, (_, i) => atlas.readUInt16LE(i * 2));
  const influences = buildProfileInfluences(labels, buildSurfaceGraph(positions, triangles));
  assert.equal(influences.length, count * 13);
  const mean = (region, channel) => {
    let total = 0, n = 0;
    for (let i = 0; i < count; i++) if (labels[i] === region) { total += influences[i * 13 + channel]; n++; }
    return total / n;
  };
  assert(influences.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
  for (const offset of [0,74]) {
    assert(mean(offset+12,0) > .85);
    assert(mean(offset+38,1) > mean(offset+38,0) + .35);
    assert(mean(offset+29,2) > mean(offset+29,5) + .2);
    assert(mean(offset+69,5) > mean(offset+69,2) + .25);
    assert(mean(offset+25,3) > .8);
    assert(mean(offset+15,4) > .8);
    assert(mean(offset+6,6) > .8);
    assert(mean(offset+12,7) > .85 && mean(offset+12,8) < .1);
    assert(mean(offset+27,8) > .85 && mean(offset+27,7) < .1);
    assert(mean(offset+56,9) > .85 && mean(offset+56,7) < .1);
    // Input modalities have separate cores, and general sensory integration
    // is not a fourth copy of the primary sensory map.
    assert(mean(offset+44,10) > .85);
    assert(mean(offset+33,11) > .85);
    assert(mean(offset+28,12) > .85);
    for (const [label, channel] of [[44,10],[33,11],[28,12]]) {
      for (const other of [10,11,12].filter(k => k !== channel)) assert(mean(offset+label,other) < .05);
      assert(mean(offset+label,8) < .1);
    }
    assert(mean(offset+27,8) > mean(offset+27,12) + .4);
  }
  for (let i = 0; i < count; i += 97) {
    const weights = influences.subarray(i*13, i*13+13);
    const values = Array(13).fill(-.2);
    const initial = profileAdjustment(weights, values);
    assert(initial >= -1 && initial <= 0);
    for (let channel = 0; channel < 13; channel++) {
      const stronger = [...values]; stronger[channel] = -.8;
      assert(profileAdjustment(weights, stronger) <= initial, 'increasing one deficit cannot reduce the combined effect');
    }
  }
  const curves = buildMaturationCurves(positions, labels, buildSurfaceGraph(positions, triangles));
  for (let channel = 0; channel < 13; channel++) {
    const values = Array(13).fill(0); values[channel] = -1;
    for (const age of [16,20]) {
      let redCores = 0;
      for (let i = 0; i < count; i++) {
        if (influences[i*13+channel] < .9) continue;
        const base = colourAtAge(age, ...curves.subarray(i*8,i*8+8));
        const adjustment = profileAdjustment(influences.subarray(i*13,i*13+13),values);
        assert.equal(profileColourStage(base,adjustment),0);
        if(base>.6) redCores++;
      }
      assert(redCores>50, `${PROFILE_DOMAINS[channel].id}: advanced reference areas must reach red at ${age}`);
    }
  }
  assert.equal(profileInfluenceResponse(0),0);
  assert.equal(profileInfluenceResponse(.9),1);
  assert(profileInfluenceResponse(.3)>0 && profileInfluenceResponse(.3)<1);
  const motor = [0,0,-1,0,0,0,0,0,0,0], coordination = [0,0,0,0,0,-1,0,0,0,0];
  assert(cerebellarProfileAdjustment(motor) < 0);
  assert(cerebellarProfileAdjustment(coordination) < cerebellarProfileAdjustment(motor));
  assert.equal(cerebellarProfileAdjustment(coordination), -1, 'coordination can reach red in the cerebellum');
  assert(cerebellarProfileAdjustment([0,0,-1,0,0,-.5,0,0,0,0]) < cerebellarProfileAdjustment([0,0,0,0,0,-.5,0,0,0,0]));
  assert.equal(cerebellarProfileAdjustment([-1,-1,0,-1,-1,0,-1,-1,-1,-1,-1,-1,-1]), 0);
});

test('paired cerebellar surfaces preserve anatomy, labels and outward closed geometry', async () => {
  const bytes = await readFile(new URL('../assets/cerebellum.bin', import.meta.url));
  const source = JSON.parse(await readFile(new URL('../assets/cerebellum-source.json', import.meta.url), 'utf8'));
  assert.equal(source.commit, '20cc221d737a37a6ee3a9c007e91bd69541fefe9');
  assert.equal(bytes.readUInt32LE(0), 0x43424C31);
  assert.equal(bytes.readUInt32LE(12), 2);
  assert.equal(source.parts.length, 2);
  const count = bytes.readUInt32LE(4), indexCount = bytes.readUInt32LE(8);
  assert.equal(count, source.vertices);
  assert.equal(indexCount, source.triangles * 3);
  assert.equal(bytes.length, 16 + count * 12 + indexCount * 4);
  assert.deepEqual(source.parts.flatMap(p => p.labels).sort((a,b) => a-b), [7,8,46,47]);
  for (const part of source.parts) {
    const points = Array.from({ length: part.vertices }, (_, i) => [0,1,2].map(j => bytes.readFloatLE(16 + (part.vertexOffset + i) * 12 + j * 4)));
    for (let j = 0; j < 3; j++) {
      assert(points.every(p => Number.isFinite(p[j])));
      assert(Math.abs(Math.min(...points.map(p => p[j])) - part.boundsRAS[0][j]) < 1e-4);
      assert(Math.abs(Math.max(...points.map(p => p[j])) - part.boundsRAS[1][j]) < 1e-4);
    }
    // Native tkregister RAS must align the paired structures with the cortex.
    assert(points.every(([x,y,z]) => Math.abs(x) < 75 && y > -115 && y < 40 && z > -80 && z < 50));
    assert(points.every(([x]) => part.id.endsWith('left') ? x < 3 : x > -3));
    let volume = 0;
    const edges = new Map();
    for (let i = 0; i < part.triangles * 3; i += 3) {
      const triangle = [0,1,2].map(j => bytes.readUInt32LE(16 + count * 12 + (part.indexOffset + i + j) * 4));
      assert(triangle.every(v => v < part.vertices));
      const [a,b,c] = triangle.map(v => points[v]);
      volume += a[0]*(b[1]*c[2]-b[2]*c[1]) + a[1]*(b[2]*c[0]-b[0]*c[2]) + a[2]*(b[0]*c[1]-b[1]*c[0]);
      for (let j = 0; j < 3; j++) {
        const x = triangle[j], y = triangle[(j + 1) % 3], key = `${Math.min(x,y)}:${Math.max(x,y)}`;
        edges.set(key, (edges.get(key) || 0) + 1);
      }
    }
    assert([...edges.values()].every(n => n === 2), `${part.name} must be a closed manifold`);
    assert(volume / 6 > 50 && volume / 6 < 100000, `${part.name}: outward normals and physical scale`);
  }
});

test('cerebellar colour continues changing beyond its early phase', () => {
  assert(cerebellumColourStage(0) > 0 && cerebellumColourStage(0) < 0.5);
  assert(cerebellumColourStage(0.5) > cerebellumColourStage(0));
  assert(cerebellumColourStage(2) > cerebellumColourStage(0.5));
  assert(cerebellumColourStage(20) > cerebellumColourStage(5));
  assert(cerebellumColourStage(20) < 1);
});

test('all anatomical labels receive differentiated regional trajectories, including both hemispheres and infancy', async () => {
  for(let label=1;label<=74;label++) {
    assert(curveForLabel(label), `missing anatomical assignment ${label}`);
    assert.equal(curveForLabel(label),curveForLabel(label+74));
  }
  assert.equal(curveForLabel(0),null);
  assert.notEqual(curveForLabel(44),curveForLabel(11),'calcarine and neighbouring visual association have separate trajectories');
  assert.notEqual(curveForLabel(33),curveForLabel(34));
  assert.notEqual(curveForLabel(12),curveForLabel(73),'frontal and temporal language trajectories remain distinct');
  const bytes = await readFile(new URL('../assets/cortex.bin', import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const header = new DataView(buffer), count = header.getUint32(4,true);
  const positions = new Float32Array(buffer,16,count*3);
  const triangles=new Uint16Array(buffer,16+count*16,header.getUint32(8,true));
  const atlas=await readFile(new URL('../assets/destrieux-labels.bin',import.meta.url));
  const labels=Uint16Array.from({length:count},(_,i)=>atlas.readUInt16LE(i*2));
  const curves=buildMaturationCurves(positions,labels,buildSurfaceGraph(positions,triangles));
  const mean=(label,age)=>{
    let total=0,n=0;
    for(let i=0;i<count;i++) if(labels[i]===label){total+=colourAtAge(age,...curves.subarray(i*8,i*8+8));n++;}
    assert(n>0);return total/n;
  };
  for(const offset of [0,74]){
    for(const label of [3,28,29,33,34,12,14,44,11,5]){
      const values=[0,.5,1,2,5,10,15,20,21].map(age=>mean(offset+label,age));
      assert(values.every((v,i)=>v>0&&v<1&&(i===0||v>values[i-1])));
    }
    assert(mean(offset+28,.5)>mean(offset+5,.5)+.25);
    assert(mean(offset+33,1)>mean(offset+34,1)+.1);
    assert(mean(offset+44,5)>mean(offset+11,5)+.1);
    assert(mean(offset+12,.5)>mean(offset+73,.5),'the illustration allows early inferior-frontal progression alongside temporal development');
    assert(mean(offset+28,20)>mean(offset+5,20)+.1,'regional contrast remains at 20 rather than a uniform endpoint');
  }
  assert(buildMaturationCurves(positions,null).every(Number.isFinite));
  const graph=buildSurfaceGraph(new Float32Array([0,0,0,3,0,0,0,4,0,0,0,1,3,0,1,0,4,1]),new Uint16Array([0,1,2,3,4,5]));
  const toy=buildMaturationCurves(new Float32Array(18),new Uint16Array([28,28,28,5,5,5]),graph);
  assert.deepEqual([...toy.subarray(0,8)],[...toy.subarray(16,24)]);
  assert(toy[0]>toy[24],'surface smoothing cannot mix disconnected hemispheres');
});

test('regional interpolation is bounded, monthly continuous and retains growth after the last displayed age',()=>{
  for(const curve of Object.values(REGIONAL_CURVES)){
    AGE_KNOTS.forEach((age,k)=>assert(Math.abs(colourAtAge(age,...curve.values)-curve.values[k])<1e-8));
    let previous=colourAtAge(0,...curve.values);
    for(let month=1;month<=480;month++){
      const value=colourAtAge(month/12,...curve.values);
      assert(value>=previous&&value<1); assert(value-previous<.08);
      previous=value;
    }
    for(const age of AGE_KNOTS.slice(1)){
      const epsilon=.00001;
      const left=(colourAtAge(age,...curve.values)-colourAtAge(age-epsilon,...curve.values))/epsilon;
      const right=(colourAtAge(age+epsilon,...curve.values)-colourAtAge(age,...curve.values))/epsilon;
      assert(Math.abs(left-right)<.0001,`slope continuity at ${age}`);
    }
  }
});

test('display palette passes through green and reaches blue with clamped endpoints', () => {
  const palette = BRAIN_PALETTE.map(c => new Color(c));
  const colour = new Color();
  assert.equal(setScaleColour(colour, 0, palette).getHexString(), 'e84335');
  assert.equal(setScaleColour(colour, 0.5, palette).getHexString(), '58b56b');
  assert.equal(setScaleColour(colour, 1, palette).getHexString(), '4056ad');
  assert.equal(setScaleColour(colour, -1, palette).getHexString(), 'e84335');
  assert.equal(setScaleColour(colour, 2, palette).getHexString(), '4056ad');
});

test('compact stage themes cover every month within an explicit age range', () => {
  assert.equal(AGE_INSIGHTS[0].from, 0);
  assert.equal(AGE_INSIGHTS.at(-1).to, 241);
  for (let i = 1; i < AGE_INSIGHTS.length; i++) assert.equal(AGE_INSIGHTS[i].from, AGE_INSIGHTS[i-1].to);
  for (let month = 0; month <= 240; month++) {
    const insight = insightForAge(month / 12);
    assert(insight.from <= month && insight.to > month);
    assert(insight.title && insight.range);
    assert.equal(insight.themes.length, 3);
    assert(insight.themes.every(text => text.length > 2 && text.length < 22));
  }
  assert.equal(insightForAge(-1), AGE_INSIGHTS[0]);
  assert.equal(insightForAge(21), AGE_INSIGHTS.at(-1));
  assert.equal(insightForAge(0.5).title, 'Babiller et échanger');
  assert.equal(insightForAge(2).title, 'Relier les mots');
  assert.equal(insightForAge(20).title, 'Affiner ses stratégies');
});

test('atlas labels match the mesh and retain left/right anatomical identities', async () => {
  const bytes = await readFile(new URL('../assets/destrieux-labels.bin', import.meta.url));
  assert.equal(atlasSource.commit, '418ff157bd8036e01a5d823754bbd7cff5fdda1b');
  assert.equal(atlasSource.regions.length, 148);
  assert.equal(bytes.length, 20484 * 2);
  const labels = Array.from({ length: 20484 }, (_, i) => bytes.readUInt16LE(i * 2));
  assert(labels.slice(0, 10242).every(label => label >= 0 && label <= 74));
  assert(labels.slice(10242).every(label => label === 0 || label >= 75 && label <= 148));
  assert.equal(new Set(labels).size, 149);
  for (let label = 1; label <= 148; label++) {
    assert(!regionName(label).includes('undefined'));
    assert(regionName(label).endsWith(label <= 74 ? 'gauche' : 'droite'));
  }
  assert.equal(regionName(29), 'Gyrus précentral · gauche');
  assert.equal(regionName(103), 'Gyrus précentral · droite');
});
