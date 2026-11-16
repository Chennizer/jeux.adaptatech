export async function loadBrainstem() {
  const response = await fetch('./assets/brainstem.bin');
  if (!response.ok) throw new Error(`Brainstem HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < 16) throw new Error('Incomplete brainstem');
  const header = new DataView(buffer);
  const count = header.getUint32(4, true);
  const indexCount = header.getUint32(8, true);
  if (header.getUint32(0, true) !== 0x42535431 || buffer.byteLength !== 16 + count * 12 + indexCount * 2) throw new Error('Invalid brainstem');
  return { positions: new Float32Array(buffer, 16, count * 3), indices: new Uint16Array(buffer, 16 + count * 12, indexCount) };
}

// A qualitative early colour, not a percentage or an empirically fitted curve.
export function brainstemColourStage(age) {
  return 0.8 + 0.18 * (1 - Math.exp(-Math.max(0, age) / 1.3));
}

export function createBrainstem(THREE, data, corticalCenter) {
  const positions = new Float32Array(data.positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = data.positions[i + 1] - corticalCenter.x;
    positions[i + 1] = data.positions[i + 2] - corticalCenter.y;
    positions[i + 2] = data.positions[i] - corticalCenter.z;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const material = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'Tronc cérébral — segmentation fsaverage';
  const green = new THREE.Color('#39a76a');
  const yellowGreen = new THREE.Color('#a4bf51');
  const neutral = new THREE.Color('#a5aaa3');
  let lastAge = null;
  let lastScientific = null;
  return {
    mesh,
    update(age, scientific) {
      if (age === lastAge && scientific === lastScientific) return;
      lastAge = age; lastScientific = scientific;
      if (scientific) material.color.copy(neutral);
      else material.color.copy(yellowGreen).lerp(green, (brainstemColourStage(age) - 0.75) / 0.25);
    },
  };
}
