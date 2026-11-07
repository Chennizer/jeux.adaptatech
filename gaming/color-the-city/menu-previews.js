(() => {
  'use strict';
  const SVG = 'http://www.w3.org/2000/svg';
  const INK = '#45404f';

  document.querySelectorAll('.scene-choice').forEach((choice, index) => {
    const scene = choice.querySelector('input[name="drawingScene"]')?.value;
    const artwork = window.PaintSceneArt?.[scene];
    if (scene !== 'city' && !artwork) return;

    // Each thumbnail owns its artwork; gameplay creates separate targets later.
    const prefix = `menu-preview-${index}-`;
    const svg = (tag, attrs = {}, parent) => {
      const node = document.createElementNS(SVG, tag);
      Object.entries(attrs).forEach(([name, value]) => {
        if (name === 'data-building') name = 'data-preview-object';
        if (name === 'id') value = prefix + value;
        if (typeof value === 'string') value = value.replace(/url\(#([^)]*)\)/g, `url(#${prefix}$1)`);
        node.setAttribute(name, value);
      });
      if (parent) parent.appendChild(node);
      return node;
    };
    const preview = svg('svg', {
      class: 'scene-preview', viewBox: '0 260 620 440',
      'aria-hidden': 'true', focusable: 'false'
    });
    svg('rect', { x: 0, y: 260, width: 620, height: 440, fill: '#fff' }, preview);

    if (scene === 'city') {
      // The existing cover already contains the city and its paint zeppelin.
      svg('image', {
        href: '../../images/color-the-city.svg', x: 0, y: 260,
        width: 620, height: 440, preserveAspectRatio: 'xMidYMid meet'
      }, preview);
    } else {
      const inkPath = (d, parent, attrs = {}) => svg('path', {
        d, fill: 'none', stroke: INK, 'stroke-width': 3,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs
      }, parent);
      if (scene !== 'planets') inkPath('M24 652Q300 648 600 651T1180 650', preview, { stroke: '#c4bdce', 'stroke-width': 2 });
      const parent = svg('g', {}, preview);
      const targets = artwork.render({ parent, svg, inkPath, groundY: 650, ink: INK });
      targets.forEach((target, targetIndex) => {
        const colour = artwork.palette[targetIndex % artwork.palette.length];
        target.floorEls.forEach(region => region.setAttribute('fill', colour));
        target.roof?.setAttribute('fill', colour);
        target.door?.setAttribute('fill', colour);
      });
    }

    const oldIcon = choice.querySelector(':scope > svg');
    if (oldIcon) oldIcon.replaceWith(preview);
    else choice.querySelector('input').after(preview);
  });
})();
