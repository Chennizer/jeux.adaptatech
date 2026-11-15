(() => {
  'use strict';
  const HOME = 600, DWELL = 1.5;
  const COVERAGE_STEPS = 256, RADIAL_BINS = 512;
  const maskCanvas = document.createElement('canvas');
  let objects = [], pointer = null, focus = null, elapsed = 0, leg = null;
  let waiting = false, finished = false, serial = 0;
  function measureCoverage(regions, box) {
    const limit = Math.hypot(box.width, box.height) / 2;
    const fallback = { radius: limit, scales: null };
    if (!limit || typeof Path2D !== 'function') return fallback;
    // Rasterize the static silhouette once per object, never during a dwell.
    // Its radial area distribution makes equal time reveal equal painted area.
    const scale = 192 / Math.max(box.width, box.height);
    maskCanvas.width = Math.max(1, Math.ceil(box.width * scale));
    maskCanvas.height = Math.max(1, Math.ceil(box.height * scale));
    const context = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!context) return fallback;
    context.setTransform(scale, 0, 0, scale, -box.x * scale, -box.y * scale);
    context.fillStyle = '#fff';
    for (const region of regions) {
      const path = new Path2D(), value = name => Number(region.getAttribute(name)) || 0;
      switch (region.localName) {
        case 'path': path.addPath(new Path2D(region.getAttribute('d') || '')); break;
        case 'rect': path.rect(value('x'), value('y'), value('width'), value('height')); break;
        case 'circle': path.arc(value('cx'), value('cy'), value('r'), 0, Math.PI * 2); break;
        case 'ellipse': path.ellipse(value('cx'), value('cy'), value('rx'), value('ry'), 0, 0, Math.PI * 2); break;
        default: return fallback;
      }
      context.save();
      const transforms = region.transform.baseVal;
      for (let i = 0; i < transforms.numberOfItems; i++) {
        const m = transforms.getItem(i).matrix;
        context.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      }
      context.fill(path, region.getAttribute('fill-rule') === 'evenodd' ? 'evenodd' : 'nonzero');
      context.restore();
    }
    const pixels = context.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
    const bins = new Float64Array(RADIAL_BINS);
    let total = 0, farthest = 0;
    for (let y = 0; y < maskCanvas.height; y++) for (let x = 0; x < maskCanvas.width; x++) {
      const weight = pixels[(y * maskCanvas.width + x) * 4 + 3];
      if (!weight) continue;
      const distance = Math.hypot((x + .5) / scale - box.width / 2, (y + .5) / scale - box.height / 2);
      bins[Math.min(RADIAL_BINS - 1, Math.floor(distance / limit * RADIAL_BINS))] += weight;
      farthest = Math.max(farthest, distance); total += weight;
    }
    if (!total) return fallback;
    const radius = Math.min(limit, farthest + Math.SQRT2 / scale);
    const scales = new Float32Array(COVERAGE_STEPS + 1);
    let bin = 0, covered = 0;
    for (let step = 1; step < COVERAGE_STEPS; step++) {
      const wanted = total * step / COVERAGE_STEPS;
      while (bin < RADIAL_BINS - 1 && covered + bins[bin] < wanted) covered += bins[bin++];
      const fraction = (wanted - covered) / (bins[bin] || 1);
      scales[step] = Math.min(1, (bin + fraction) / RADIAL_BINS * limit / radius);
    }
    scales[COVERAGE_STEPS] = 1;
    return { radius, scales };
  }
  function fillProgress(object, progress) {
    const { x, y, width, height } = object.box, cx = x + width / 2, cy = y + height / 2;
    let scale = progress;
    if (object.coverage.scales) {
      const position = progress * COVERAGE_STEPS, index = Math.floor(position);
      const a = object.coverage.scales[index], b = object.coverage.scales[Math.min(index + 1, COVERAGE_STEPS)];
      scale = a + (b - a) * (position - index);
    }
    object.fill.setAttribute('transform', `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`);
  }
  function cancelDwell() {
    if (focus) { fillProgress(focus, 0); focus.root.dataset.dwell = '0'; }
    focus = null; elapsed = 0;
  }
  function suspend() { cancelDwell(); pointer = null; }
  function clear() {
    suspend(); objects.forEach(o => { o.root.remove(); o.defs.remove(); });
    objects = []; leg = null; waiting = finished = false;
  }
  function reset({ targets, svg, worldPoint }) {
    clear();
    objects = targets.map(target => {
      const regions = [...target.floorEls, target.roof, target.door, ...(target.accents || []).map(a => a.el)].filter(Boolean);
      // Use static artwork, excluding any in-progress shimmer or bounce.
      const boxes = [target.outlines, ...regions].map(region => region.getBBox());
      const left = Math.min(...boxes.map(b => b.x)), top = Math.min(...boxes.map(b => b.y));
      const box = { x: left, y: top, width: Math.max(...boxes.map(b => b.x + b.width)) - left,
        height: Math.max(...boxes.map(b => b.y + b.height)) - top };
      const coverage = measureCoverage(regions, box);
      const id = `gaze-silhouette-${++serial}`;
      const defs = svg('defs', {}, target.group);
      const clip = svg('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, defs);
      regions.forEach(region => {
          const shape = region.cloneNode(false);
          ['id', 'class', 'clip-path', 'stroke', 'opacity'].forEach(name => shape.removeAttribute(name));
          shape.setAttribute('fill', '#fff'); clip.appendChild(shape);
        });
      const root = svg('g', { class: 'gaze-dwell', 'clip-path': `url(#${id})`,
        'pointer-events': 'none', 'aria-hidden': 'true', 'data-dwell': 0 }, target.group);
      const fill = svg('circle', { cx: box.x + box.width / 2, cy: box.y + box.height / 2,
        r: coverage.radius, transform: 'scale(0)', fill: 'rgba(255, 0, 0, 0.52)' }, root);
      const a = worldPoint(target, box.x, box.y), b = worldPoint(target, box.x + box.width, box.y + box.height);
      return { target, root, defs, fill, box, coverage, left: Math.min(a.x, b.x), right: Math.max(a.x, b.x),
        top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y) };
    });
  }
  function move(event, scene) {
    if (event.isPrimary === false) return;
    const matrix = scene.getScreenCTM();
    if (!matrix) { suspend(); return; }
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    pointer = { x: point.x, y: point.y };
    // Cancel immediately on leaving an object, even between animation frames.
    if (focus && candidate() !== focus) cancelDwell();
  }
  function candidate() {
    if (!pointer) return null;
    return objects.find(o => o.target.hits < o.target.requiredHits && pointer.x >= o.left &&
      pointer.x <= o.right && pointer.y >= o.top && pointer.y <= o.bottom) || null;
  }
  function travel(from, to, speed, target = null) {
    return { from, to, age: 0, duration: Math.max(.45, Math.min(2.5, Math.abs(to - from) / (speed * 2.5))), target };
  }
  function frame(dt, { speed, pending }) {
    if (leg) {
      leg.age += dt;
      const p = Math.min(1, leg.age / leg.duration), ease = p * p * p * (p * (p * 6 - 15) + 10);
      const result = { x: leg.from + (leg.to - leg.from) * ease,
        direction: leg.to >= leg.from ? 1 : -1 };
      if (p === 1) {
        if (leg.target) {
          result.dropTarget = leg.target;
          fillProgress(leg.highlight, 0);
          leg.highlight.root.dataset.dwell = '0';
          leg = travel(leg.to, HOME, speed);
        } else { leg = null; waiting = true; result.direction = 1; }
      }
      return result;
    }
    if (waiting) { if (pending) return { x: HOME, direction: 1 }; waiting = false; }
    if (finished || pending) return { x: HOME, direction: 1 };
    const next = candidate();
    if (next !== focus) { cancelDwell(); focus = next; }
    if (focus) {
      elapsed += dt;
      const p = Math.min(1, elapsed / DWELL);
      fillProgress(focus, p);
      focus.root.dataset.dwell = p.toFixed(3);
      if (p === 1) {
        const selected = focus, target = selected.target;
        focus = null; elapsed = 0;
        leg = travel(HOME, target.hitX + target.hitWidth / 2, speed, target);
        leg.highlight = selected;
      }
    }
    return { x: HOME, direction: 1 };
  }
  function finish() { suspend(); finished = true; }
  window.PaintGaze = { reset, clear, move, suspend, finish, frame,
    get state() { return leg ? (leg.target ? 'outbound' : 'returning') : waiting ? 'settling' : 'idle'; } };
})();
