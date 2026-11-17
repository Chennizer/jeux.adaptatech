import { BRAIN_PALETTE, setScaleColour } from './colour-scale.js';
import { profileColourStage } from './development-profiles.js';

export async function loadCerebellum() {
  const [meshResponse, sourceResponse] = await Promise.all([
    fetch('./assets/cerebellum.bin'), fetch('./assets/cerebellum-source.json'),
  ]);
  if (!meshResponse.ok || !sourceResponse.ok) throw new Error('Cerebellum unavailable');
  const buffer = await meshResponse.arrayBuffer();
  const source = await sourceResponse.json();
  if (buffer.byteLength < 16) throw new Error('Incomplete cerebellum');
  const header = new DataView(buffer);
  const count = header.getUint32(4, true), indexCount = header.getUint32(8, true);
  if (header.getUint32(0, true) !== 0x43424C31 || count !== source.vertices || indexCount !== source.triangles * 3 || header.getUint32(12, true) !== source.parts.length || buffer.byteLength !== 16 + count * 12 + indexCount * 4) throw new Error('Invalid cerebellum');
  for (const part of source.parts) {
    if (!Number.isInteger(part.vertexOffset) || !Number.isInteger(part.indexOffset) || part.vertexOffset < 0 || part.indexOffset < 0 || part.vertices <= 0 || part.triangles <= 0 || part.vertexOffset + part.vertices > count || part.indexOffset + part.triangles * 3 > indexCount) throw new Error('Invalid cerebellum part');
  }
  return { positions: new Float32Array(buffer, 16, count * 3), indices: new Uint32Array(buffer, 16 + count * 12, indexCount), source };
}

// Qualitative animation parameters: existing early function, infant changes,
// then continued refinement. They are not fitted volumetric or functional data.
export function cerebellumColourStage(age) {
  const years = Math.max(0, age);
  return 0.34 + 0.36 * (1 - Math.exp(-years / 0.65)) + 0.26 * (1 - Math.exp(-years / 12));
}

export function createCerebellum(THREE, data, corticalCenter) {
  const group = new THREE.Group();
  const meshes = [];
  const box = new THREE.Box3();
  const palette = BRAIN_PALETTE.map(c => new THREE.Color(c));
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
  let lastAge, lastAdjustment;
  return {
    group, meshes, box,
    update(age, adjustment = 0) {
      if (age === lastAge && adjustment === lastAdjustment) return;
      lastAge = age; lastAdjustment = adjustment;
      for (const mesh of meshes) {
        setScaleColour(mesh.material.color, profileColourStage(cerebellumColourStage(age), adjustment), palette);
      }
    },
  };
}
