import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sampleThickness, regionName } from '../cortical-data.js';
import { buildSurfaceGraph, surfaceDistances, UNREACHED } from '../cortical-network.js';
import { brainstemColourStage } from '../brainstem.js';

const dataset = JSON.parse(await readFile(new URL('../assets/cortical-thickness.json', import.meta.url), 'utf8'));

test('brainstem is a closed outward-oriented surface in cortical RAS coordinates', async () => {
  const bytes = await readFile(new URL('../assets/brainstem.bin', import.meta.url));
  const source = JSON.parse(await readFile(new URL('../assets/brainstem-source.json', import.meta.url), 'utf8'));
  assert.equal(source.commit, '20cc221d737a37a6ee3a9c007e91bd69541fefe9');
  assert.equal(source.label, 16);
  assert.equal(bytes.readUInt32LE(0), 0x42535431);
  const count = bytes.readUInt32LE(4), indexCount = bytes.readUInt32LE(8);
  assert.equal(count, source.vertices);
  assert.equal(indexCount, source.triangles * 3);
  assert.equal(bytes.length, 16 + count * 12 + indexCount * 2);
  const points = Array.from({ length: count }, (_, i) => [0,1,2].map(j => bytes.readFloatLE(16 + i * 12 + j * 4)));
  for (let j = 0; j < 3; j++) {
    assert(points.every(p => Number.isFinite(p[j])));
    assert(Math.abs(Math.min(...points.map(p => p[j])) - source.boundsRAS[0][j]) < 1e-4);
    assert(Math.abs(Math.max(...points.map(p => p[j])) - source.boundsRAS[1][j]) < 1e-4);
  }
  // A scanner-affine mix-up would shift this structure away from the cortex.
  assert(source.boundsRAS[0][2] < -65 && source.boundsRAS[1][2] < 5);
  assert(source.boundsRAS[0][0] > -20 && source.boundsRAS[1][0] < 20);
  let volume = 0;
  const edges = new Map();
  for (let i = 0; i < indexCount; i += 3) {
    const triangle = [0,1,2].map(j => bytes.readUInt16LE(16 + count * 12 + (i + j) * 2));
    assert(triangle.every(v => v < count));
    const [a,b,c] = triangle.map(v => points[v]);
    volume += a[0]*(b[1]*c[2]-b[2]*c[1]) + a[1]*(b[2]*c[0]-b[0]*c[2]) + a[2]*(b[0]*c[1]-b[1]*c[0]);
    for (let j = 0; j < 3; j++) {
      const x = triangle[j], y = triangle[(j + 1) % 3];
      const key = `${Math.min(x,y)}:${Math.max(x,y)}`;
      edges.set(key, (edges.get(key) || 0) + 1);
    }
  }
  assert([...edges.values()].every(n => n === 2), 'surface must have no boundary or non-manifold edges');
  assert(volume / 6 > 20000 && volume / 6 < 35000, 'normals must point outward and retain physical scale');
});

test('qualitative brainstem colour starts early and continues changing after birth', () => {
  assert(brainstemColourStage(0) > 0.75);
  assert(brainstemColourStage(0.5) > brainstemColourStage(0));
  assert(brainstemColourStage(2) > brainstemColourStage(0.5));
  assert(brainstemColourStage(20) < 1);
});

test('published regional estimates are used only inside the supported age range', () => {
  assert.equal(dataset.source.commit, '418ff157bd8036e01a5d823754bbd7cff5fdda1b');
  assert.equal(dataset.regions.length, 148);
  assert.equal(sampleThickness(dataset, 0.5), null);
  assert.equal(sampleThickness(dataset, 4.99), null);
  assert.equal(sampleThickness(dataset, 20.01), null);
  assert(Math.abs(sampleThickness(dataset, 5)[0] - 2.772572) < 1e-6);
  assert(Math.abs(sampleThickness(dataset, 20)[0] - 2.466887) < 1e-6);
  const a = sampleThickness(dataset, 5);
  const b = sampleThickness(dataset, 5.5);
  const between = sampleThickness(dataset, 5.25);
  for (let i = 0; i < 148; i++) assert(Math.abs(between[i] - (a[i] + b[i]) / 2) < 1e-6);
});

test('atlas labels match the mesh and retain left/right anatomical identities', async () => {
  const bytes = await readFile(new URL('../assets/destrieux-labels.bin', import.meta.url));
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
