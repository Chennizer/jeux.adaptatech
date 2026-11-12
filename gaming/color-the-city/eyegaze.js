(() => {
  'use strict';
  const HOME = 600, DWELL = 1.5;
  let objects = [], pointer = null, focus = null, elapsed = 0, leg = null;
  let waiting = false, finished = false, serial = 0;
  function fillProgress(object, progress) {
    const { x, y, width, height } = object.box, cx = x + width / 2, cy = y + height / 2;
    object.fill.setAttribute('transform', `translate(${cx} ${cy}) scale(${progress}) translate(${-cx} ${-cy})`);
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
      const fill = svg('rect', { x: box.x, y: box.y, width: box.width,
        height: box.height, transform: 'scale(0)', fill: 'rgba(255, 0, 0, 0.52)' }, root);
      const a = worldPoint(target, box.x, box.y), b = worldPoint(target, box.x + box.width, box.y + box.height);
      return { target, root, defs, fill, box, left: Math.min(a.x, b.x), right: Math.max(a.x, b.x),
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
      fillProgress(focus, p * p * (3 - 2 * p));
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
