// Cortical adjacency for local smoothing. Disconnected surfaces stay separate.
export function buildSurfaceGraph(positions, indices) {
  const count = positions.length / 3;
  const adjacent = Array.from({ length: count }, () => new Set());
  function connect(a, b) {
    adjacent[a].add(b);
    adjacent[b].add(a);
  }
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = indices.subarray(i, i + 3);
    connect(a, b); connect(b, c); connect(c, a);
  }
  const offsets = new Uint32Array(count + 1);
  for (let i = 0; i < count; i++) offsets[i + 1] = offsets[i] + adjacent[i].size;
  const neighbors = new Uint32Array(offsets[count]);
  for (let i = 0; i < count; i++) neighbors.set([...adjacent[i]], offsets[i]);
  return { offsets, neighbors };
}
