// A surface graph for a schematic focal illustration. It is not a connectome
// or an electrophysiological/clinical seizure predictor.
export const UNREACHED = 1e6;

export function buildSurfaceGraph(positions, indices) {
  const count = positions.length / 3;
  const adjacent = Array.from({ length: count }, () => new Map());
  function connect(a, b) {
    if (adjacent[a].has(b)) return;
    const length = Math.hypot(positions[a * 3] - positions[b * 3], positions[a * 3 + 1] - positions[b * 3 + 1], positions[a * 3 + 2] - positions[b * 3 + 2]);
    adjacent[a].set(b, length);
    adjacent[b].set(a, length);
  }
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = indices.subarray(i, i + 3);
    connect(a, b); connect(b, c); connect(c, a);
  }
  const offsets = new Uint32Array(count + 1);
  for (let i = 0; i < count; i++) offsets[i + 1] = offsets[i] + adjacent[i].size;
  const neighbors = new Uint32Array(offsets[count]);
  const weights = new Float32Array(offsets[count]);
  for (let i = 0; i < count; i++) {
    let cursor = offsets[i];
    for (const [neighbor, weight] of adjacent[i]) {
      neighbors[cursor] = neighbor;
      weights[cursor++] = weight;
    }
  }
  return { offsets, neighbors, weights };
}

export function surfaceDistances(graph, source, limit = 70) {
  const count = graph.offsets.length - 1;
  if (!Number.isInteger(source) || source < 0 || source >= count) throw new Error('Invalid focal vertex');
  const distances = new Float32Array(count).fill(UNREACHED);
  const heap = [];
  function push(vertex, distance) {
    const entry = { vertex, distance };
    let i = heap.length;
    heap.push(entry);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent].distance <= distance) break;
      heap[i] = heap[parent]; i = parent;
    }
    heap[i] = entry;
  }
  function pop() {
    const first = heap[0];
    const last = heap.pop();
    if (heap.length) {
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let child = i * 2 + 1;
        if (child + 1 < heap.length && heap[child + 1].distance < heap[child].distance) child++;
        if (heap[child].distance >= last.distance) break;
        heap[i] = heap[child]; i = child;
      }
      heap[i] = last;
    }
    return first;
  }
  distances[source] = 0;
  push(source, 0);
  while (heap.length) {
    const { vertex, distance } = pop();
    if (distance !== distances[vertex]) continue;
    for (let edge = graph.offsets[vertex]; edge < graph.offsets[vertex + 1]; edge++) {
      const neighbor = graph.neighbors[edge];
      const candidate = Math.fround(distance + graph.weights[edge]);
      if (candidate < distances[neighbor] && candidate <= limit) {
        distances[neighbor] = candidate;
        push(neighbor, candidate);
      }
    }
  }
  return distances;
}
