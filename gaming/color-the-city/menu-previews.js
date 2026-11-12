(() => {
  'use strict';
  const SVG = 'http://www.w3.org/2000/svg';
  const INK = '#45404f';

  document.querySelectorAll('.scene-choice').forEach((choice, index) => {
    const scene = choice.querySelector('input[name="drawingScene"]')?.value;
    const artwork = window.PaintSceneArt?.[scene];
    if (scene !== 'city' && !artwork) return;
    choice.dataset.world = scene;

    // These independent pictures preview the colours the player will bring back.
    // The card's restoration state is styled separately from gameplay artwork.
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
    svg('rect', { x: 0, y: 260, width: 620, height: 440, fill: '#fbfcf8', class: 'preview-paper' }, preview);

    if (scene === 'city') {
      // The existing cover already contains the city and its paint zeppelin.
      svg('image', {
        href: '../../images/color-the-city.svg', x: 0, y: 260,
        width: 620, height: 440, preserveAspectRatio: 'xMidYMid meet'
      }, preview);
    } else {
      svg('path', {
        d: 'M0 647Q135 618 302 645T620 638V700H0Z',
        fill: ['planets', 'squadron', 'dungeon'].includes(scene) ? '#eeeaf6' : '#eaf0e3'
      }, preview);
      const inkPath = (d, parent, attrs = {}) => svg('path', {
        d, fill: 'none', stroke: INK, 'stroke-width': 3,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs
      }, parent);
      if (scene !== 'planets' && scene !== 'squadron') inkPath('M24 652Q300 648 600 651T1180 650', preview, { stroke: '#c4bdce', 'stroke-width': 2 });
      const parent = svg('g', {}, preview);
      const targets = artwork.render({ parent, svg, inkPath, groundY: 650, ink: INK });
      // The card frames two large motifs; omit the others so their edges cannot
      // appear as clipped fragments at the right of the thumbnail.
      targets.slice(2).forEach(target => target.group.remove());
      targets.forEach((target, targetIndex) => {
        const colour = artwork.palette[targetIndex % artwork.palette.length];
        target.floorEls.forEach(region => region.setAttribute('fill', colour));
        target.roof?.setAttribute('fill', colour);
        target.door?.setAttribute('fill', colour);
        target.accents?.forEach(accent => accent.el.setAttribute('fill', accent.colour));
      });
    }

    const oldIcon = choice.querySelector(':scope > svg');
    if (oldIcon) oldIcon.replaceWith(preview);
    else choice.querySelector('input').after(preview);
  });
})();
