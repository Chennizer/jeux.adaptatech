import { BRAIN_PALETTE, setScaleColour } from './colour-scale.js';

export async function loadDeepStructures() {
  const [meshResponse, sourceResponse] = await Promise.all([
    fetch('./assets/deep-structures.bin'), fetch('./assets/deep-structures-source.json'),
  ]);
  if (!meshResponse.ok || !sourceResponse.ok) throw new Error('Internal anatomy unavailable');
  const buffer = await meshResponse.arrayBuffer();
  const source = await sourceResponse.json();
  if (buffer.byteLength < 16) throw new Error('Incomplete internal anatomy');
  const header = new DataView(buffer);
  const count = header.getUint32(4, true), indexCount = header.getUint32(8, true);
  if (header.getUint32(0, true) !== 0x44535431 || count !== source.vertices || indexCount !== source.triangles * 3 || header.getUint32(12, true) !== source.parts.length || buffer.byteLength !== 16 + count * 12 + indexCount * 4) throw new Error('Invalid internal anatomy');
  for (const part of source.parts) {
    if (!Number.isInteger(part.vertexOffset) || !Number.isInteger(part.indexOffset) || part.vertexOffset < 0 || part.indexOffset < 0 || part.vertices <= 0 || part.triangles <= 0 || part.vertexOffset + part.vertices > count || part.indexOffset + part.triangles * 3 > indexCount) throw new Error('Invalid internal anatomy part');
  }
  return { positions: new Float32Array(buffer, 16, count * 3), indices: new Uint32Array(buffer, 16 + count * 12, indexCount), source };
}

// Qualitative animation parameters: existing early function, infant changes,
// then continued refinement. They are not fitted volumetric or functional data.
const WINDOWS = {
  cerebellum: [0.34, 0.36, 0.65, 0.26, 12],
  thalamus: [0.30, 0.38, 0.75, 0.28, 13],
  caudate: [0.23, 0.35, 0.95, 0.38, 15],
  putamen: [0.26, 0.36, 0.85, 0.34, 14],
  pallidum: [0.28, 0.36, 0.8, 0.32, 14],
  hippocampus: [0.14, 0.34, 1.4, 0.48, 18],
  amygdala: [0.20, 0.34, 1.15, 0.42, 18],
  accumbens: [0.19, 0.31, 1.4, 0.46, 17],
};

export function structureColourStage(kind, age) {
  const [base, early, earlyYears, late, lateYears] = WINDOWS[kind];
  const years = Math.max(0, age);
  return base + early * (1 - Math.exp(-years / earlyYears)) + late * (1 - Math.exp(-years / lateYears));
}

export function createDeepStructures(THREE, data, corticalCenter) {
  const group = new THREE.Group();
  const meshes = [];
  const box = new THREE.Box3();
  const palette = BRAIN_PALETTE.map(c => new THREE.Color(c));
  const neutral = new THREE.Color('#a5aaa3');
  for (const part of data.source.parts) {
    const native = data.positions.subarray(part.vertexOffset * 3, (part.vertexOffset + part.vertices) * 3);
    const positions = new Float32Array(native.length);
    for (let i = 0; i < native.length; i += 3) {
      positions.set([native[i + 1] - corticalCenter.x, native[i + 2] - corticalCenter.y, native[i] - corticalCenter.z], i);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(data.indices.subarray(part.indexOffset, part.indexOffset + part.triangles * 3), 1));
    geometry.computeVertexNormals(); geometry.computeBoundingBox();
    const material = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = part.name; mesh.userData.kind = part.kind;
    meshes.push(mesh); group.add(mesh); box.union(geometry.boundingBox);
  }
  let lastAge, lastScientific;
  return {
    group, meshes, box,
    update(age, scientific) {
      if (age === lastAge && scientific === lastScientific) return;
      lastAge = age; lastScientific = scientific;
      for (const mesh of meshes) {
        if (scientific) mesh.material.color.copy(neutral);
        else setScaleColour(mesh.material.color, structureColourStage(mesh.userData.kind, age), palette);
      }
    },
  };
}
