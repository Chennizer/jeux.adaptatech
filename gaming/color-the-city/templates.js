(() => {
  'use strict';
  const levels = [null, { objects: 2, hits: 1 }, { objects: 3, hits: 1 }, { objects: 3, hits: 2 }, { objects: 4, hits: 2 }, { objects: 4, hits: 3 }];
  const compositions = [
    { order: [0,1,2,3], sizes: [1,.94,1.02,.97], shifts: [-8,5,-3,7], mirrors: 0 },
    { order: [1,2,3,0], sizes: [.94,1.04,.96,1], shifts: [12,-7,8,-11], mirrors: 5 },
    { order: [2,3,0,1], sizes: [1.03,.91,1.04,.95], shifts: [-12,10,-6,5], mirrors: 10 },
    { order: [3,0,1,2], sizes: [.92,1.03,.97,1.04], shifts: [7,-10,9,-8], mirrors: 3 },
    { order: [0,2,1,3], sizes: [1.04,.95,.9,1.03], shifts: [-5,12,-10,4], mirrors: 12 },
    { order: [1,3,0,2], sizes: [.9,1.02,1.04,.94], shifts: [11,-8,4,-12], mirrors: 6 },
    { order: [2,0,3,1], sizes: [.98,1.04,.92,1.02], shifts: [-10,4,12,-5], mirrors: 9 },
    { order: [3,1,2,0], sizes: [1.04,.96,1.01,.91], shifts: [5,-12,8,-3], mirrors: 15 },
    { order: [0,3,2,1], sizes: [.95,1.03,.94,1.04], shifts: [-7,11,-12,6], mirrors: 2 },
    { order: [3,2,1,0], sizes: [1.02,.9,1.04,.96], shifts: [10,-5,3,-10], mirrors: 4 }
  ];
  const sceneOffsets = { city: 0, forest: 1, village: 2, farm: 3, planets: 0, kingdom: 1, squadron: 2, dungeon: 3 };
  const bags = new Map();
  function get(scene, id) {
    const base = compositions[id];
    return { id, scene, order: base.order.map(i => (i + (sceneOffsets[scene] || 0)) % 4), sizes: [...base.sizes], shifts: [...base.shifts], mirrors: base.mirrors };
  }
  function next(scene) {
    let bag = bags.get(scene);
    if (!bag) { bag = { remaining: [], last: -1 }; bags.set(scene, bag); }
    if (!bag.remaining.length) {
      bag.remaining = Array.from({ length: compositions.length }, (_, i) => i);
      for (let i = bag.remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag.remaining[i], bag.remaining[j]] = [bag.remaining[j], bag.remaining[i]];
      }
      if (bag.remaining[0] === bag.last) [bag.remaining[0], bag.remaining[1]] = [bag.remaining[1], bag.remaining[0]];
    }
    bag.last = bag.remaining.shift();
    return get(scene, bag.last);
  }
  function place(source, { scene, difficulty, template, parent, svg, surfaceY }) {
    const level = levels[difficulty], count = level.objects;
    const centers = count === 2 ? [330,870] : count === 3 ? [215,600,985] : [170,456,742,1028];
    const baseScale = count === 2 ? 1.15 : count === 3 ? 1.08 : .97;
    const selected = template.order.slice(0, count).map((index, slot) => ({
      target: source[index], sourceIndex: index, slot,
      scale: Math.min(1.18, Math.max(.84, baseScale * template.sizes[slot]))
    }));
    let baseline = 650;
    selected.forEach(({target, scale}) => {
      let top = Infinity;
      for (let i = 0; i <= 32; i++) top = Math.min(top, surfaceY(target, target.x + target.width * i / 32));
      baseline = Math.max(baseline, 318 + (650 - top) * scale);
    });
    baseline = Math.min(708, baseline);
    source.forEach(target => target.group.remove());
    const targets = selected.map(({target: b, sourceIndex, slot, scale}) => {
      const mirrored = Boolean(template.mirrors & (1 << slot));
      const sx = scale * (mirrored ? -1 : 1), sy = scale;
      const center = centers[slot] + template.shifts[slot];
      const tx = center - (b.x + b.width / 2) * sx;
      let ty = baseline - 650 * sy;
      if (scene === 'planets' || scene === 'squadron') ty += [0,-15,12,-5][(slot + template.id) % 4];
      const topSurface = Math.min(...Array.from({length:33}, (_,i)=>surfaceY(b, b.x + b.width*i/32))) * sy + ty;
      if (topSurface < 318) ty += 318 - topSurface;
      const edgeA = b.x * sx + tx, edgeB = (b.x + b.width) * sx + tx;
      b.layout = { sx, sy, tx, ty };
      b.hitX = Math.min(edgeA, edgeB); b.hitWidth = Math.abs(edgeB - edgeA);
      b.requiredHits = level.hits; b.hits = 0; b.painted = 0;
      const wrapper = svg('g', { class: 'placed-object', 'data-object': slot, 'data-motif': sourceIndex,
        'data-hit-x': b.hitX, 'data-hit-width': b.hitWidth, 'data-required-hits': level.hits,
        transform: `translate(${tx} ${ty}) scale(${sx} ${sy})` }, parent);
      wrapper.appendChild(b.group); b.placement = wrapper;
      b.group.dataset.hits = '0'; b.group.dataset.parts = '0';
      return b;
    });
    return { targets, baseline };
  }
  window.PaintTemplates = { count: compositions.length, levels, get, next, place };
})();
