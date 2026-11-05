(() => {
  'use strict';

  let renderCount = 0;
  const palettes = {
    city: [
      ['#7474de', '#ff96ac', '#ffd49d', '#aa75b9', '#745ba3'],
      ['#6c8edf', '#f1a2d2', '#ffdb9c', '#9a83c3', '#7963b2'],
      ['#9772d7', '#ff9d97', '#ffe09a', '#b380b6', '#7b65a7'],
      ['#5f9bc9', '#e3a8e1', '#ffc897', '#8e83bd', '#686aa6'],
      ['#967aca', '#ffb5c7', '#ffe7b1', '#b888ba', '#8666aa']
    ],
    forest: [
      ['#329ca1', '#a5dbc1', '#fff0a5', '#63b38e', '#268c76'],
      ['#4f9eaa', '#bae2b5', '#ffdf8e', '#79b58c', '#3d9774'],
      ['#4aa69c', '#9ddad3', '#fff1ae', '#68bd9e', '#278c80'],
      ['#6b9eaf', '#bfd8bf', '#ffe2a0', '#86b88a', '#4b9477'],
      ['#259ba6', '#96daca', '#f4e995', '#58b49d', '#2b967b']
    ],
    village: [
      ['#9397df', '#f5b7ce', '#ffe1ad', '#baaad5', '#8eb6a5'],
      ['#85b0dc', '#ffc0b7', '#ffdfa0', '#c0a9cf', '#9cbea0'],
      ['#ac94da', '#efb3d6', '#ffe3b5', '#b3aad7', '#8fb9b3'],
      ['#87afd3', '#f4c2df', '#ffe4b7', '#b2b2ce', '#9fc19c'],
      ['#a29bd9', '#ffb7bd', '#ffe6a5', '#c8a7cc', '#a1bb9c']
    ],
    farm: [
      ['#348ed6', '#80d4ec', '#d3f0d9', '#73bf8b', '#f3cb63'],
      ['#4599d5', '#a2deeb', '#e9f1c4', '#7fbe86', '#f1bf61'],
      ['#468fd5', '#8acfe9', '#d2eed4', '#6eb793', '#efcf70'],
      ['#288fc1', '#8bdce3', '#e3f1ca', '#73bda0', '#f4c15b'],
      ['#538ed0', '#9ad4f1', '#e7f2d9', '#8bc38c', '#e8c96d']
    ]
  };

  function render({ scene = 'city', variant = 0, parent, svg }) {
    if (!parent) return;
    parent.replaceChildren();
    const choice = ((Math.trunc(Number(variant) || 0) % 10) + 10) % 10;
    const prefix = `paint-background-${++renderCount}`;
    const add = (tag, attrs = {}, owner = parent) => {
      if (svg) return svg(tag, attrs, owner);
      const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      owner.appendChild(node);
      return node;
    };
    const defs = add('defs');
    const clip = add('clipPath', { id: `${prefix}-bounds` }, defs);
    add('rect', { width: 1200, height: 720 }, clip);
    const art = add('g', { 'clip-path': `url(#${prefix}-bounds)`, 'aria-hidden': 'true' });
    let seed = 719 + choice * 3749;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const gradient = (name, stops, attrs = {}, radial = false) => {
      const id = `${prefix}-${name}`;
      const node = add(radial ? 'radialGradient' : 'linearGradient', {
        id, ...(radial ? {} : { x1: 0, y1: 0, x2: 0, y2: 1 }), ...attrs
      }, defs);
      stops.forEach(([offset, color, opacity = 1]) => {
        add('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }, node);
      });
      return `url(#${id})`;
    };
    const path = (d, fill, attrs = {}) => add('path', { d, fill, ...attrs }, art);
    const ellipse = (cx, cy, rx, ry, fill, attrs = {}) => add('ellipse', { cx, cy, rx, ry, fill, ...attrs }, art);
    const circle = (cx, cy, r, fill, attrs = {}) => add('circle', { cx, cy, r, fill, ...attrs }, art);
    const sunX = [225, 935, 380, 810, 590, 990, 160, 730, 470, 880][choice];
    const sunY = 179 + (choice % 3) * 23;

    function cloud(x, y, scale = 1, opacity = 0.45) {
      path('M0 24C-2 8 17 0 30 9C36-14 72-14 82 9C104-1 126 10 124 27C144 26 154 42 145 51H-10C-23 43-15 25 0 24Z',
        '#fff8ed', { transform: `translate(${x} ${y}) scale(${scale})`, opacity });
    }

    function daySky(colors, warmSun = false) {
      const sky = gradient('sky', [[0, colors[0]], [0.55, colors[1]], [1, colors[2]]]);
      add('rect', { width: 1200, height: 720, fill: sky }, art);
      const light = gradient('sun-glow', [[0, '#fff5bb', 0.86], [0.35, '#ffe8ae', 0.35], [1, '#ffe5b5', 0]], {}, true);
      circle(sunX, sunY, 238, light);
      circle(sunX, sunY, warmSun ? 58 : 46, warmSun ? '#ffe9ae' : '#fff0ad', { opacity: 0.95 });
      circle(sunX, sunY, warmSun ? 70 : 58, 'none', { stroke: '#fff4ce', 'stroke-width': 1.5, opacity: 0.35 });
      for (let i = 0; i < 5; i++) {
        cloud(65 + i * 245 + random() * 40, 80 + random() * 180, 0.65 + random() * 0.7, 0.17 + random() * 0.2);
      }
    }

    if (scene === 'planets' || scene === 'space') {
      const space = [
        ['#171746', '#3f307b', '#ee6acb', '#55c9e8'],
        ['#111d4c', '#384087', '#a57cff', '#67e1dc'],
        ['#23144c', '#603783', '#ff8fb8', '#8eabff'],
        ['#102e4d', '#3a3f87', '#bf72e8', '#6fe0e1'],
        ['#251b58', '#473b91', '#f59bcb', '#85e0ec']
      ][choice % 5];
      add('rect', { width: 1200, height: 720, fill: gradient('space', [[0, space[0]], [0.6, space[1]], [1, '#342665']]) }, art);
      const pink = gradient('nebula-pink', [[0, space[2], 0.55], [0.4, space[2], 0.28], [1, space[2], 0]], {}, true);
      const blue = gradient('nebula-blue', [[0, space[3], 0.42], [0.5, space[3], 0.18], [1, space[3], 0]], {}, true);
      const focalX = 270 + (choice * 97) % 670;
      ellipse(focalX, 310, 570, 252, pink, { transform: `rotate(${-26 + choice * 4} ${focalX} 310)` });
      ellipse(1030 - choice * 65, 370, 460, 190, blue, { transform: 'rotate(-22 600 360)' });
      const ribbon = gradient('stardust', [[0, space[2], 0], [0.42, '#e3adf1', 0.18], [0.6, space[3], 0.24], [1, space[3], 0]], { x2: 1, y2: 0 });
      path(`M-60 ${560 - choice * 12}C250 140 650 540 1270 40L1280 210C750 650 300 310-60 690Z`, ribbon);
      for (let i = 0; i < 128; i++) {
        const x = 14 + random() * 1172;
        const y = 18 + random() * 655;
        const r = i % 9 === 0 ? 2.1 : 0.65 + random() * 1.1;
        circle(x, y, r, i % 4 === 0 ? '#9eeafa' : '#fff4e2', { opacity: 0.4 + random() * 0.55 });
        if (i % 18 === 0) {
          path(`M${x - 7} ${y}h14M${x} ${y - 7}v14`, 'none', { stroke: '#e2f7ff', 'stroke-width': 1, opacity: 0.72 });
        }
      }
      const moonX = choice % 2 ? 1060 : 145;
      const moonY = 155 + (choice % 3) * 33;
      circle(moonX, moonY, 117, gradient('moon-halo', [[0, space[3], 0.25], [1, space[3], 0]], {}, true));
      circle(moonX, moonY, 38, gradient('moon', [[0, '#ebf1ff'], [0.55, '#a7b5ec'], [1, '#7e72c2']], { x2: 1, y2: 1 }));
      circle(moonX - 9, moonY - 10, 7, '#b7b8e2', { opacity: 0.65 });
      circle(moonX + 12, moonY + 12, 10, '#8e8dc9', { opacity: 0.5 });
      ellipse(600, 548, 550, 118, 'none', { stroke: '#b9d7f9', 'stroke-width': 1.4, opacity: 0.17, transform: `rotate(${-7 + choice} 600 548)` });
      ellipse(600, 548, 460, 86, 'none', { stroke: '#efb9ef', 'stroke-width': 1, opacity: 0.18, transform: `rotate(${14 - choice} 600 548)` });
      path('M0 686Q300 642 600 686T1200 686V720H0Z', gradient('space-ground', [[0, '#b77cb6', 0.1], [1, '#8873c5', 0.45]]));
      return;
    }

    const colors = (palettes[scene] || palettes.city)[choice % 5];
    daySky(colors, scene === 'village' || scene === 'city');

    if (scene === 'forest') {
      const rays = add('g', { opacity: 0.11 }, art);
      for (let i = 0; i < 7; i++) {
        const bottomX = sunX - 580 + i * 195;
        add('path', { d: `M${sunX - 8} ${sunY}L${bottomX - 75} 720H${bottomX + 75}L${sunX + 8} ${sunY}Z`, fill: '#fff4b1' }, rays);
      }
      path('M0 480Q180 357 390 465T790 454T1200 440V720H0Z', colors[3], { opacity: 0.62 });
      path('M0 579Q250 435 494 554T946 527T1200 545V720H0Z', colors[4], { opacity: 0.66 });
      const woodland = add('g', { fill: colors[4], opacity: 0.28 }, art);
      for (let i = 0; i < 15; i++) {
        const x = 25 + i * 85;
        const top = 285 + random() * 135;
        add('path', { d: `M${x - 6} 587V${top + 70}h12v${587 - top - 70}Z`, fill: colors[4] }, woodland);
        add('ellipse', { cx: x, cy: top + 50, rx: 30 + random() * 20, ry: 63 + random() * 25 }, woodland);
      }
      path('M0 671Q270 590 580 650T1200 635V720H0Z', '#a8cb7e');
      path('M0 699Q310 639 620 687T1200 666V720H0Z', '#c6d983');
      for (let i = 0; i < 26; i++) {
        const x = 22 + random() * 1156;
        const y = 335 + random() * 338;
        circle(x, y, 2 + random() * 2.4, '#fff1a3', { opacity: 0.35 + random() * 0.45 });
      }
      // Soft canopy shapes frame the scene without covering the targets.
      path('M0 0H175Q169 43 128 43Q137 88 83 96Q77 135 29 122Q18 154 0 149Z', '#267e79', { opacity: 0.45 });
      path('M1200 0H1050Q1042 53 1088 64Q1080 108 1128 113Q1135 150 1174 135Q1185 162 1200 156Z', '#277f78', { opacity: 0.35 });
      return;
    }

    if (scene === 'village') {
      path('M0 449Q180 337 356 437T752 421T1200 435V720H0Z', colors[3], { opacity: 0.75 });
      path('M0 517Q239 414 452 509T842 501T1200 482V720H0Z', colors[4]);
      const homes = add('g', { opacity: 0.38 }, art);
      for (let i = 0; i < 9; i++) {
        const x = 40 + i * 142 + random() * 20;
        const y = 467 + Math.sin(i * 0.9 + choice) * 22;
        add('path', { d: `M${x} ${y}v42h49v-42Z`, fill: '#fbe0b9' }, homes);
        add('path', { d: `M${x - 6} ${y}l30-29 31 29Z`, fill: '#a4769e' }, homes);
        add('rect', { x: x + 18, y: y + 16, width: 12, height: 26, rx: 3, fill: '#b8a6c4' }, homes);
      }
      path('M0 629Q260 525 560 618T1200 593V720H0Z', '#aace9c');
      path('M0 696Q270 617 540 671T1200 656V720H0Z', '#c7dda2');
      path('M805 720Q738 657 764 600Q781 572 807 563Q754 620 934 720Z', '#f1d7ad', { opacity: 0.65 });
      for (let i = 0; i < 30; i++) {
        circle(12 + random() * 1176, 658 + random() * 55, 1.4 + random() * 2.2,
          ['#f8dd98', '#e99bb9', '#b58bb9'][i % 3], { opacity: 0.7 });
      }
      return;
    }

    if (scene === 'farm') {
      path('M0 443Q185 332 379 448T777 423T1200 411V720H0Z', colors[3], { opacity: 0.68 });
      path('M0 505Q242 411 445 504T898 472T1200 486V720H0Z', '#8fc778');
      path('M0 582Q260 507 538 573T1200 542V720H0Z', colors[4]);
      path('M0 657Q265 568 570 643T1200 610V720H0Z', '#e9b85f');
      path('M0 707Q320 626 615 690T1200 675V720H0Z', '#f3d77f');
      const furrows = add('g', { fill: 'none', stroke: '#c49c48', 'stroke-width': 2, opacity: 0.26 }, art);
      for (let i = 0; i < 8; i++) {
        add('path', { d: `M${-200 + i * 240} 720Q${250 + i * 110} 599 741 565` }, furrows);
      }
      const windX = choice % 2 ? 1040 : 145;
      const mill = add('g', { opacity: 0.35, fill: '#f6edd0', stroke: '#779a93', 'stroke-width': 3, 'stroke-linejoin': 'round' }, art);
      add('path', { d: `M${windX - 20} 478l11-80h18l11 80Z` }, mill);
      add('path', { d: `M${windX - 15} 401l15-20 15 20Z`, fill: '#9c9fa9' }, mill);
      add('path', { d: `M${windX} 410l-42-32m42 32 32-42m-32 42 42 32m-42-32-32 42`, fill: 'none', 'stroke-width': 6 }, mill);
      circle(windX, 410, 5, '#f8e4b9');
      return;
    }

    // The city's distant buildings stay soft so the colored foreground leads.
    path('M0 445Q240 381 490 445T950 425T1200 440V720H0Z', colors[3], { opacity: 0.55 });
    const skyline = add('g', { fill: colors[4], opacity: 0.31 }, art);
    for (let i = 0; i < 20; i++) {
      const x = i * 64 - 10;
      const top = 383 + random() * 120;
      const width = 42 + random() * 20;
      add('rect', { x, y: top, width, height: 650 - top, rx: i % 3 === 0 ? 10 : 2 }, skyline);
      if (i % 4 === 0) add('path', { d: `M${x + 9} ${top}v-17h${width - 18}v17Z` }, skyline);
      for (let row = 0; row < 3; row++) {
        add('path', { d: `M${x + 11} ${top + 22 + row * 28}h7m10 0h7`, stroke: '#ffe4bd', 'stroke-width': 7, opacity: 0.6 }, skyline);
      }
    }
    path('M0 649Q315 594 611 642T1200 620V720H0Z', '#c39cc5');
    path('M0 697Q280 647 598 685T1200 678V720H0Z', '#e3b4cd');
    path('M0 708Q370 682 1200 705', 'none', { stroke: '#ffdeb7', 'stroke-width': 3, opacity: 0.6 });
  }

  window.PaintBackgrounds = { render };
})();
