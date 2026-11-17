import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { regionName } from '../cortical-atlas.js';
import { buildSurfaceGraph, surfaceDistances, UNREACHED } from '../cortical-network.js';
import { cerebellumColourStage } from '../cerebellum.js';
import { AGE_INSIGHTS, insightForAge } from '../age-insights.js';
import { buildMaturationWindows, maturityAtAge } from '../maturation.js';
import { BRAIN_PALETTE, setScaleColour } from '../colour-scale.js';
import { Color } from '../vendor/three.module.min.js';
import { buildProfileInfluences, profileColourStage, DEVELOPMENT_PROFILES } from '../development-profiles.js';

const atlasSource = JSON.parse(await readFile(new URL('../assets/atlas-source.json', import.meta.url), 'utf8'));

test('profile variations stay bounded, preserve the zero setting and do not imply an age shift', () => {
  for (const profile of DEVELOPMENT_PROFILES.filter(item => item.values)) {
    assert.equal(profile.values.length, 3);
    assert(profile.values.every(value => [-1,0,1].includes(value)));
  }
  for (const age of [0,.5,2,8,20]) for (const base of [0,.1,.5,.9,1]) {
    assert.equal(profileColourStage(base, age, 0), base);
    const low = profileColourStage(base, age, -1), high = profileColourStage(base, age, 1);
    assert(low >= 0 && high <= 1 && low <= base && high >= base);
    if (age === 0) assert.equal(low, high);
  }
  assert(profileColourStage(.5, 8, 1) - profileColourStage(.5, 8, -1) > .5);
});

test('profile smoothing does not transfer a domain across disconnected hemispheres', () => {
  const graph = buildSurfaceGraph(new Float32Array([0,0,0, 3,0,0, 0,4,0, 0,0,1, 3,0,1, 0,4,1]), new Uint16Array([0,1,2, 3,4,5]));
  const influences = buildProfileInfluences(new Uint16Array([34,34,34,0,0,0]), graph);
  assert(influences[0] > .9);
  assert(influences.subarray(9).every(value => value === 0));
  assert(buildProfileInfluences(null, graph).every(value => value === 0));
});

test('language and attention profiles affect distributed and overlapping anatomical influences', async () => {
  const bytes = await readFile(new URL('../assets/cortex.bin', import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const header = new DataView(buffer), count = header.getUint32(4, true);
  const positions = new Float32Array(buffer, 16, count * 3);
  const triangles = new Uint16Array(buffer, 16 + count * 16, header.getUint32(8, true));
  const atlas = await readFile(new URL('../assets/destrieux-labels.bin', import.meta.url));
  const labels = Uint16Array.from({ length: count }, (_, i) => atlas.readUInt16LE(i * 2));
  const influences = buildProfileInfluences(labels, buildSurfaceGraph(positions, triangles));
  const mean = (region, channel) => {
    let total = 0, n = 0;
    for (let i = 0; i < count; i++) if (labels[i] === region) { total += influences[i * 3 + channel]; n++; }
    return total / n;
  };
  for (let i = 0; i < count; i++) {
    const weights = influences.subarray(i * 3, i * 3 + 3);
    assert(weights.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
    assert(weights.reduce((sum, value) => sum + value, 0) <= 1.00001);
  }
  for (const offset of [0,74]) {
    assert(mean(offset + 34, 0) > .75 && mean(offset + 34, 1) < .1);
    assert(mean(offset + 15, 1) > .75 && mean(offset + 15, 0) < .1);
    assert(mean(offset + 25, 0) > .3 && mean(offset + 25, 1) > .15);
    assert(mean(offset + 29, 2) > .75);
    assert(mean(offset + 42, 0) + mean(offset + 42, 1) + mean(offset + 42, 2) < .05);
  }
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

test('dorsal sensory bands and distinct auditory/language trajectories use both anatomical hemispheres', async () => {
  const bytes = await readFile(new URL('../assets/cortex.bin', import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const count = new DataView(buffer).getUint32(4, true);
  const positions = new Float32Array(buffer, 16, count * 3);
  const sulcal = new Float32Array(buffer, 16 + count * 12, count);
  const atlas = await readFile(new URL('../assets/destrieux-labels.bin', import.meta.url));
  const labels = Uint16Array.from({ length: count }, (_, i) => atlas.readUInt16LE(i * 2));
  const windows = buildMaturationWindows(positions, sulcal, labels);
  const mean = (id, age) => {
    let total = 0, n = 0;
    for (let i = 0; i < count; i++) if (labels[i] === id) {
      total += maturityAtAge(age, ...windows.subarray(i * 4, i * 4 + 4)); n++;
    }
    assert(n > 0); return total / n;
  };
  for (const offset of [0,74]) for (const region of [3,28,29,45,67,69]) {
    const at6m = mean(offset + region, 0.5), at1y = mean(offset + region, 1), at2y = mean(offset + region, 2);
    assert(at6m > mean(offset + 5, 0.5) + 0.2);
    assert(at1y > at6m + 0.08 && at2y > at1y + 0.04);
  }
  for (const offset of [0,74]) {
    assert(mean(offset + 33, 0.5) > mean(offset + 34, 0.5) + 0.1, 'primary audition progresses ahead of auditory association');
    assert(Math.abs(mean(offset + 34, 0.5) - mean(offset + 12, 0.5)) > 0.1, 'illustrative temporal and frontal trajectories remain distinct, without claiming a measured order');
    assert(mean(offset + 33, 2) > mean(offset + 14, 2) + 0.4);
    for (const region of [33,34,36,35,38,73,12,14,13,25,26]) {
      assert(mean(offset + region, 1) > mean(offset + region, 0.5));
      assert(mean(offset + region, 20) > mean(offset + region, 8) + 0.05, 'continued refinement, including language regions');
    }
  }
  const fallback = buildMaturationWindows(positions, sulcal);
  assert(fallback.every(Number.isFinite));
  // The animation should neither erase prenatal regional differences nor
  // suggest that reaching a window's nominal end completes development.
  for (const offset of [0,74]) {
    assert(mean(offset + 28, 0) > mean(offset + 14, 0));
    for (const region of [28,29,33,34,14,42]) {
      let previous = mean(offset + region, 0);
      assert(previous > 0 && previous < 1);
      for (let month = 1; month <= 240; month++) {
        const current = mean(offset + region, month / 12);
        assert(current >= previous && current < 1);
        previous = current;
      }
      assert(mean(offset + region, 21) > mean(offset + region, 20), 'colour keeps changing after the displayed age range');
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

test('a focal surface illustration cannot jump to a disconnected hemisphere', () => {
  const positions = new Float32Array([0,0,0, 3,0,0, 0,4,0, 0,0,1, 3,0,1, 0,4,1]);
  const triangles = new Uint16Array([0,1,2, 3,4,5]);
  const graph = buildSurfaceGraph(positions, triangles);
  const distances = surfaceDistances(graph, 0);
  assert.deepEqual(Array.from(distances), [0,3,4,UNREACHED,UNREACHED,UNREACHED]);
  const limited = surfaceDistances(graph, 0, 3.5);
  assert.equal(limited[2], UNREACHED);
});

test('native cortical propagation follows surface edges and remains focal', async () => {
  const bytes = await readFile(new URL('../assets/cortex.bin', import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const header = new DataView(buffer);
  const count = header.getUint32(4, true);
  const indices = new Uint16Array(buffer, 16 + count * 16, header.getUint32(8, true));
  const positions = new Float32Array(buffer, 16, count * 3);
  const graph = buildSurfaceGraph(positions, indices);
  for (const source of [1000, 12000]) {
    const distances = surfaceDistances(graph, source);
    assert.equal(distances[source], 0);
    let reached = 0;
    for (let i = 0; i < count; i++) {
      if ((i < 10242) !== (source < 10242)) assert.equal(distances[i], UNREACHED);
      if (distances[i] === UNREACHED) continue;
      reached++;
      const euclidean = Math.hypot(...[0,1,2].map(j => positions[i * 3 + j] - positions[source * 3 + j]));
      assert(distances[i] + 0.001 >= euclidean);
      assert(distances[i] <= 70);
    }
    assert(reached > 10 && reached < 10242);
  }
});
