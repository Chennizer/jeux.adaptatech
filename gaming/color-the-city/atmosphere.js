(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const themes = {
    city: ['#ffe0d5', '#d2c5e5', '#ffd79c'],
    forest: ['#fff0bb', '#b6d8bd', '#c5e1a5'],
    village: ['#ffe6d0', '#c6dcb9', '#f4cfaa'],
    farm: ['#fff0bd', '#b8dba6', '#f4dc91'],
    planets: ['#e3d7f7', '#cfc2e9', '#bce4ee']
  };
  let serial = 0, root, faded, hope, clouds, lamp, stars;
  let progress = 0, target = 0, celebration = 0, age = 0, reduced = false, offset = 0;
  const unit = value => Math.max(0, Math.min(1, Number(value) || 0));
  function clear() {
    root?.remove();
    root = faded = hope = clouds = lamp = stars = null;
    progress = target = celebration = age = 0;
  }
  function draw() {
    if (!root) return;
    const p = progress * progress * (3 - 2 * progress);
    root.setAttribute('opacity', 1 - celebration);
    root.dataset.progress = progress.toFixed(3);
    faded.setAttribute('opacity', 1 - p * .84);
    hope.setAttribute('opacity', p);
    if (clouds) {
      clouds.setAttribute('opacity', .78 - p * .6);
      clouds.setAttribute('transform', `translate(${reduced ? 0 : Math.sin(age * .12 + offset) * 3} 0)`);
    }
    if (lamp) lamp.setAttribute('transform', `translate(0 ${-p * 13 + (reduced ? 0 : Math.sin(age * .3) * p * 1.5)})`);
    if (stars) stars.setAttribute('opacity', reduced ? .68 : .64 + Math.sin(age * .55) * .04);
  }
  function reset({ scene = 'city', variant = 0, parent, svg, reducedMotion = false } = {}) {
    clear();
    if (!parent) return;
    if (!Object.hasOwn(themes, scene)) scene = 'city';
    reduced = reducedMotion && typeof reducedMotion === 'object' ? Boolean(reducedMotion.matches) : Boolean(reducedMotion);
    const choice = ((Math.trunc(Number(variant) || 0) % 10) + 10) % 10;
    const palette = themes[scene], prefix = `recolor-atmosphere-${++serial}`;
    offset = choice * .7;
    const add = (tag, attrs = {}, owner = root) => {
      if (svg) return svg(tag, attrs, owner);
      const node = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, value));
      owner.appendChild(node);
      return node;
    };
    root = add('g', { class: 'world-atmosphere', 'data-scene': scene, 'aria-hidden': 'true', 'pointer-events': 'none' }, parent);
    const defs = add('defs');
    const glow = add('radialGradient', { id: `${prefix}-glow` }, defs);
    add('stop', { offset: 0, 'stop-color': palette[0], 'stop-opacity': .55 }, glow);
    add('stop', { offset: 1, 'stop-color': palette[0], 'stop-opacity': 0 }, glow);
    faded = add('g', { class: 'atmosphere-faded' });
    hope = add('g', { class: 'atmosphere-hope', opacity: 0 });
    const x = [1010, 175, 960, 210, 1040, 145, 985, 220, 1000, 185][choice];
    const y = 190 + choice % 3 * 13;
    function face(owner, happy, color) {
      const g = add('g', { fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: .7 }, owner);
      add('path', { d: `M${x - 13} ${y - 3}h1M${x + 12} ${y - 3}h1` }, g);
      add('path', { d: happy ? `M${x - 9} ${y + 9}q9 10 18 0` : `M${x - 8} ${y + 13}q8-7 16 0` }, g);
    }
    function cloud(cx, cy, scale) {
      add('path', { d: 'M-57 17C-72 8-66-12-47-13C-48-39-11-47 4-25C22-44 54-29 51-7C73-9 81 15 63 25H-48Q-57 25-57 17Z', transform: `translate(${cx} ${cy}) scale(${scale})`, fill: '#e5e5e9', stroke: '#d9d9e0', 'stroke-width': 1.3 }, clouds);
    }
    if (scene === 'planets') {
      add('circle', { cx: x, cy: y, r: 42, fill: '#f1f0f3', stroke: '#dedce3', 'stroke-width': 1.5 }, faded);
      add('circle', { cx: x - 15, cy: y - 12, r: 8, fill: '#e5e3e9' }, faded);
      add('circle', { cx: x + 19, cy: y + 15, r: 6, fill: '#e5e3e9' }, faded);
      face(faded, false, '#b0abb9');
      add('ellipse', { cx: 600, cy: 617, rx: 540, ry: 42, fill: '#eeedf2', opacity: .25 }, faded);
      add('ellipse', { cx: x, cy: y, rx: 188, ry: 161, fill: `url(#${prefix}-glow)` }, hope);
      lamp = add('g', {}, hope);
      add('circle', { cx: x, cy: y, r: 43, fill: '#ddd1f0', stroke: '#c9b8e2', 'stroke-width': 1.5 }, lamp);
      add('circle', { cx: x - 15, cy: y - 12, r: 8, fill: '#cdbbe5' }, lamp);
      add('circle', { cx: x + 19, cy: y + 15, r: 6, fill: '#cdbbe5' }, lamp);
      face(lamp, true, '#9f85bf');
      stars = add('g', {}, hope);
      for (let i = 0; i < 15; i++) {
        const sx = 65 + (i * 193 + choice * 37) % 1080, sy = 55 + (i * 83 + choice * 19) % 520;
        add('path', { d: `M${sx - 3} ${sy}h6M${sx} ${sy - 3}v6`, stroke: '#cecad8', 'stroke-width': 1.2, opacity: .5 }, faded);
        add('path', { d: `M${sx - 4} ${sy}h8M${sx} ${sy - 4}v8`, stroke: i % 2 ? '#c5b3ea' : '#aed9e8', 'stroke-width': 1.5, 'stroke-linecap': 'round' }, stars);
      }
    } else {
      // A white page with a little grey weather, rather than an opaque sky.
      const ground = 662 + choice % 3 * 4;
      const hill = `M0 ${ground}Q225 ${ground - 35} 450 ${ground - 9}T870 ${ground - 18}T1200 ${ground - 8}V720H0Z`;
      add('path', { d: hill, fill: '#eeeeef', opacity: .63 }, faded);
      add('path', { d: 'M0 703Q360 674 640 699T1200 688V720H0Z', fill: '#f3f2f4', opacity: .8 }, faded);
      add('circle', { cx: x, cy: y, r: 40, fill: '#f0eff1', stroke: '#dedde2', 'stroke-width': 1.5 }, faded);
      face(faded, false, '#b1adb8');
      add('ellipse', { cx: x, cy: y, rx: 190, ry: 170, fill: `url(#${prefix}-glow)` }, hope);
      add('path', { d: hill, fill: palette[1], opacity: .45 }, hope);
      add('path', { d: 'M0 706Q320 675 620 700T1200 687V720H0Z', fill: palette[2], opacity: .3 }, hope);
      lamp = add('g', {}, hope);
      add('circle', { cx: x, cy: y, r: 42, fill: '#ffe7a9', stroke: '#f4dc9f', 'stroke-width': 1.5 }, lamp);
      face(lamp, true, '#d4b875');
      clouds = add('g', { class: 'atmosphere-clouds' });
      cloud(x - 5, y + 20, 1.15);
      cloud(choice % 2 ? 830 : 320, 236 + choice % 2 * 13, .87);
      cloud(choice % 2 ? 470 : 710, 76 + choice % 3 * 14, .7);
    }
    draw();
  }
  function setProgress(value) {
    target = unit(value);
    if (reduced) { progress = target; draw(); }
  }
  function setCelebration(value) { celebration = unit(value); draw(); }
  function frame(dt) {
    if (!root) return;
    const step = Math.max(0, Math.min(1, Number(dt) || 0));
    age += step;
    if (!reduced) progress += (target - progress) * (1 - Math.exp(-step / 1.7));
    if (Math.abs(target - progress) < .0001) progress = target;
    draw();
  }
  window.PaintAtmosphere = { reset, setProgress, setCelebration, frame, clear };
})();
