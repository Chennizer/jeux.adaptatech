(() => {
  'use strict';
  const positions = [56, 342, 628, 914];
  function createTarget(ctx, index, top) {
    const group = ctx.svg('g', { 'data-building': index }, ctx.parent);
    const paint = ctx.svg('g', { class: 'scene-paint' }, group);
    const outlines = ctx.svg('g', { class: 'scene-outlines' }, group);
    return { x: positions[index], width: 228, floors: 3, painted: 0, top, floorHeight: 80,
      roofHeight: 0, floorEls: [], origins: [], accents: [], group, paint, outlines, bounce: 0,
      roof: null, door: null, chimney: null, surfaceAt: () => top };
  }
  function addRegion(ctx, target, d, origin, outline = true) {
    target.floorEls.push(ctx.svg('path', { d, fill: '#fff', class: 'floor' }, target.paint));
    target.origins.push(origin);
    if (outline) ctx.inkPath(d, target.outlines, { fill: 'none', 'stroke-width': 3 });
  }
  function draw(ctx, target, d, attrs = {}) {
    return ctx.inkPath(d, target.outlines, attrs);
  }
  function addAccent(ctx, target, d, colour, origin, attrs = {}) {
    const el = ctx.svg('path', { d, fill: '#fff', class: 'accent-colour' }, target.paint);
    target.accents.push({ el, colour, x: origin.x, y: origin.y });
    draw(ctx, target, d, { fill: 'none', ...attrs });
    return el;
  }
  function circle(ctx, target, cx, cy, r, attrs = {}) {
    return ctx.svg('circle', { cx, cy, r, fill: '#fff', stroke: ctx.ink, 'stroke-width': 2.5, ...attrs }, target.outlines);
  }
  function ellipsePath(cx, cy, rx, ry) {
    return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}Z`;
  }
  function flowerOutline(cx, cy) {
    const count = 12, rx = 105, ry = 86, half = Math.PI / count;
    const point = (a, size) => [cx + Math.cos(a) * rx * size, cy + Math.sin(a) * ry * size];
    const first = point(-Math.PI / 2 - half, .66);
    let d = `M${first[0]} ${first[1]}`;
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / count;
      const p = point(a - half * .68, 1.14), q = point(a + half * .68, 1.14), end = point(a + half, .66);
      d += `C${p[0]} ${p[1]} ${q[0]} ${q[1]} ${end[0]} ${end[1]}`;
    }
    return d + 'Z';
  }
  function ellipseTop(x, cx, cy, rx, ry) {
    const u = (x - cx) / rx;
    return Math.abs(u) <= 1 ? cy - ry * Math.sqrt(1 - u * u) : Infinity;
  }
  function trunk(ctx, target, width = 32, top = 545) {
    const cx = target.x + 114;
    addAccent(ctx, target, `M${cx - width / 2} ${top}Q${cx - width * .38} ${top + 52} ${cx - width * .48} 627L${cx - width * .82} 650H${cx + width * .82}L${cx + width * .48} 627Q${cx + width * .38} ${top + 52} ${cx + width / 2} ${top}Z`,
      '#cfa47d', { x: cx, y: top + 12 }, { stroke: 'none' });
    draw(ctx, target, `M${cx - width / 2} ${top}Q${cx - width * .38} ${top + 52} ${cx - width * .48} 627L${cx - width * .82} 650H${cx + width * .82}L${cx + width * .48} 627Q${cx + width * .38} ${top + 52} ${cx + width / 2} ${top}`);
    draw(ctx, target, `M${cx - 5} 642Q${cx + 3} 617 ${cx} 593M${cx} 609l-9-10m9 24 9-11`, { 'stroke-width': 2 });
  }
  function drawWindow(ctx, target, x, y, round = false) {
    if (round) {
      circle(ctx, target, x + 20, y + 20, 20);
    } else {
      ctx.svg('rect', { x, y, width: 40, height: 40, rx: 6, fill: '#fff', stroke: ctx.ink, 'stroke-width': 2.5 }, target.outlines);
    }
    draw(ctx, target, `M${x + 20} ${y + 1}v38m-19-19h38`, { 'stroke-width': 2 });
  }
  function door(ctx, target, x, y = 588, width = 44) {
    draw(ctx, target, `M${x} 650v${y + width / 2 - 650}a${width / 2} ${width / 2} 0 0 1 ${width} 0V650Z`, { fill: '#fff' });
    circle(ctx, target, x + width - 10, 630, 2, { fill: ctx.ink });
  }
  // Forest paths use absolute local coordinates, so each silhouette can be
  // shared by its paint regions and the paint-drop collision surface.
  function localPath(x, d) {
    return d.replace(/([MLCQ])([^MLCQZ]*)/g, (_, command, values) =>
      command + values.trim().split(/[ ,]+/).map((n, i) => Number(n) + (i % 2 ? 0 : x)).join(' '));
  }
  function silhouetteSurface(x, d) {
    const points = [];
    let current = [0, 0], first = current;
    for (const match of d.matchAll(/([MLCQZ])([^MLCQZ]*)/g)) {
      const command = match[1], values = match[2].trim().split(/[ ,]+/).filter(Boolean).map(Number);
      if (command === 'M') {
        current = values; first = current; if (points.length) points.push(null); points.push(current);
      } else if (command === 'L' || command === 'Z') {
        current = command === 'Z' ? first : values; points.push(current);
      } else {
        const start = current, cubic = command === 'C';
        for (let step = 1; step <= 32; step++) {
          const t = step / 32, u = 1 - t;
          points.push([0, 1].map(axis => cubic
            ? u * u * u * start[axis] + 3 * u * u * t * values[axis] + 3 * u * t * t * values[axis + 2] + t * t * t * values[axis + 4]
            : u * u * start[axis] + 2 * u * t * values[axis] + t * t * values[axis + 2]));
        }
        current = values.slice(-2);
      }
    }
    // Index the original flattened edges by x. Each query visits only the
    // few edges in its half-pixel column, preserving overhang discontinuities
    // exactly rather than interpolating between two unrelated branches.
    const step = .5, columns = Array.from({ length: 457 }, () => []);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      if (!a || !b) continue;
      const dx = b[0] - a[0];
      const first = Math.max(0, Math.floor((Math.min(a[0], b[0]) - .001) / step));
      const last = Math.min(456, Math.floor((Math.max(a[0], b[0]) + .001) / step));
      for (let column = first; column <= last; column++) columns[column].push({ a, b, dx });
    }
    return point => {
      const px = Math.max(0, Math.min(228, point - x));
      let top = Infinity;
      for (const { a, b, dx } of columns[Math.floor(px / step)]) {
        if (Math.abs(dx) < .0001) {
          if (Math.abs(px - a[0]) < .001) top = Math.min(top, a[1], b[1]);
        } else if (px >= Math.min(a[0], b[0]) && px <= Math.max(a[0], b[0])) {
          top = Math.min(top, a[1] + (px - a[0]) * (b[1] - a[1]) / dx);
        }
      }
      return top;
    };
  }

  function canopy(ctx, target, regions, outline, seams) {
    for (const [d, y] of regions) addRegion(ctx, target, localPath(target.x, d), { x: target.x + 114, y }, false);
    draw(ctx, target, localPath(target.x, outline));
    draw(ctx, target, localPath(target.x, seams), { 'stroke-width': 2.5 });
    target.surfaceAt = silhouetteSurface(target.x, outline);
  }
  function renderForest(ctx) {
    const targets = [];
    // A soft storybook fir: scalloped boughs form one connected silhouette.
    {
      const t = createTarget(ctx, 0, 320), x = t.x;
      trunk(ctx, t, 34, 551);
      canopy(ctx, t, [
        ['M31 470 Q45 477 62 474 C45 507 22 534 0 552 Q18 569 44 565 C64 579 86 584 114 578 C142 584 164 579 184 565 Q210 569 228 552 C206 534 183 507 166 474 Q183 477 197 470 Q114 505 31 470Z', 540],
        ['M68 401 Q80 406 92 404 C76 431 56 454 31 470 Q114 505 197 470 C172 454 152 431 136 404 Q148 406 160 401 Q114 424 68 401Z', 448],
        ['M114 320 C106 353 91 379 68 401 Q114 424 160 401 C137 379 122 353 114 320Z', 370]
      ], 'M114 320 C106 353 91 379 68 401 Q80 406 92 404 C76 431 56 454 31 470 Q45 477 62 474 C45 507 22 534 0 552 Q18 569 44 565 C64 579 86 584 114 578 C142 584 164 579 184 565 Q210 569 228 552 C206 534 183 507 166 474 Q183 477 197 470 C172 454 152 431 136 404 Q148 406 160 401 C137 379 122 353 114 320Z',
      'M68 401 Q114 424 160 401 M31 470 Q114 505 197 470');
      draw(ctx, t, localPath(x, 'M114 559 Q111 537 114 516 M114 539 Q98 533 91 521 M114 540 Q131 532 138 520 M105 378 Q114 388 122 378 M53 536 Q64 548 76 536 M151 539 Q165 551 177 539 M81 451 Q88 459 95 451 M135 452 Q142 460 149 452'), { 'stroke-width': 2 });
      targets.push(t);
    }
    // An old oak, with broad cloud-shaped shoulders and a branching trunk.
    {
      const t = createTarget(ctx, 1, 340), x = t.x;
      trunk(ctx, t, 36, 522);
      canopy(ctx, t, [
        ['M24 515 C77 503 141 529 194 509 C188 538 162 550 141 541 C118 560 94 561 72 542 C48 549 25 536 24 515Z', 540],
        ['M26 424 C86 407 160 434 215 414 C228 427 228 450 228 470 C228 493 214 512 194 509 C141 529 77 503 24 515 C8 510 0 491 0 469 C0 444 8 429 26 424Z', 469],
        ['M26 424 C17 400 32 374 57 374 C62 346 93 336 115 351 C137 329 168 344 175 368 C204 366 223 388 215 414 C160 434 86 407 26 424Z', 383]
      ], 'M0 469 C0 444 8 429 26 424 C17 400 32 374 57 374 C62 346 93 336 115 351 C137 329 168 344 175 368 C204 366 223 388 215 414 C228 427 228 450 228 470 C228 493 214 512 194 509 C188 538 162 550 141 541 C118 560 94 561 72 542 C48 549 25 536 24 515 C8 510 0 491 0 469Z',
      'M26 424 C86 407 160 434 215 414 M24 515 C77 503 141 529 194 509');
      draw(ctx, t, localPath(x, 'M114 554 Q110 514 114 477 M114 515 Q88 490 73 476 M114 500 Q138 481 154 461 M61 454 Q44 435 39 455 Q47 474 61 454 M43 454L56 454 M165 389 Q175 368 188 385 Q183 404 165 389 M170 389L184 383 M86 387 Q72 369 65 388 Q74 403 86 387 M70 386L81 389'), { 'stroke-width': 2.3 });
      targets.push(t);
    }
    // A single rounded apple canopy, with a few generous fruit stencils.
    {
      const t = createTarget(ctx, 2, 340), x = t.x;
      trunk(ctx, t, 32, 519);
      canopy(ctx, t, [
        ['M24 509 C78 502 136 525 193 493 C192 516 173 535 150 531 C133 554 102 553 85 533 C61 542 29 531 24 509Z', 532],
        ['M37 419 C88 402 160 435 218 417 C228 428 228 446 228 460 C228 483 214 496 193 493 C136 525 78 502 24 509 C9 507 0 484 0 458 C0 433 17 416 37 419Z', 463],
        ['M37 419 C29 393 43 369 65 374 C72 345 99 336 119 353 C145 333 177 348 181 373 C207 369 228 391 218 417 C160 435 88 402 37 419Z', 382]
      ], 'M0 458 C0 433 17 416 37 419 C29 393 43 369 65 374 C72 345 99 336 119 353 C145 333 177 348 181 373 C207 369 228 391 218 417 C228 428 228 446 228 460 C228 483 214 496 193 493 C192 516 173 535 150 531 C133 554 102 553 85 533 C61 542 29 531 24 509 C9 507 0 484 0 458Z',
      'M37 419 C88 402 160 435 218 417 M24 509 C78 502 136 525 193 493');
      draw(ctx, t, localPath(x, 'M114 555 Q110 525 114 495 M113 521 Q98 511 88 498 M114 510 Q130 501 139 486 M91 445Q102 434 111 444Q104 454 91 445 M118 398Q128 384 139 395Q133 407 118 398'), { 'stroke-width': 2.3 });
      for (const [ax, ay] of [[73, 390], [169, 390], [47, 469], [161, 469]]) {
        addAccent(ctx, t, localPath(x, `M${ax} ${ay - 12} C${ax - 23} ${ay - 25} ${ax - 23} ${ay + 17} ${ax} ${ay + 19} C${ax + 23} ${ay + 17} ${ax + 23} ${ay - 25} ${ax} ${ay - 12}Z`),
          ax > 100 ? '#f3c77f' : '#ef9a91', { x: x + ax, y: ay }, { 'stroke-width': 2.2 });
        draw(ctx, t, localPath(x, `M${ax} ${ay - 12} Q${ax - 2} ${ay - 23} ${ax + 4} ${ay - 27} M${ax + 3} ${ay - 19} Q${ax + 12} ${ay - 33} ${ax + 20} ${ay - 23} Q${ax + 13} ${ay - 14} ${ax + 3} ${ay - 19}`), { 'stroke-width': 1.8 });
      }
      targets.push(t);
    }
    // A weeping willow: long hanging leaves follow a roomy umbrella canopy.
    {
      const t = createTarget(ctx, 3, 340), x = t.x;
      trunk(ctx, t, 30, 553);
      canopy(ctx, t, [
        ['M4 494 C74 508 159 518 224 494 C227 514 228 535 228 552 Q216 539 204 558 Q193 548 181 568 Q169 558 157 576 Q144 565 131 582 Q121 574 114 586 Q106 575 97 582 Q85 565 71 576 Q59 557 47 568 Q36 548 24 558 Q12 540 0 552 C0 526 2 510 4 494Z', 548],
        ['M19 430 C76 416 157 451 209 430 C220 466 224 481 224 494 C159 518 74 508 4 494 C7 473 11 468 19 430Z', 472],
        ['M19 430 C34 401 67 364 114 340 C161 355 195 395 209 430 C157 451 76 416 19 430Z', 396]
      ], 'M0 552 C0 526 2 510 4 494 C7 473 11 468 19 430 C34 401 67 364 114 340 C161 355 195 395 209 430 C220 466 224 481 224 494 C227 514 228 535 228 552 Q216 539 204 558 Q193 548 181 568 Q169 558 157 576 Q144 565 131 582 Q121 574 114 586 Q106 575 97 582 Q85 565 71 576 Q59 557 47 568 Q36 548 24 558 Q12 540 0 552Z',
      'M19 430 C76 416 157 451 209 430 M4 494 C74 508 159 518 224 494');
      draw(ctx, t, localPath(x, 'M29 453 Q18 493 25 535 M48 442 Q36 487 46 548 M73 451 Q61 502 70 553 M98 453 Q87 506 95 558 M129 459 Q141 510 133 560 M155 457 Q169 503 159 553 M181 452 Q195 492 184 546 M202 452 Q215 490 207 532 M114 599 Q111 578 114 559 M114 582 Q105 576 101 565 M114 579 Q123 571 128 560'), { 'stroke-width': 2, opacity: .85 });
      targets.push(t);
    }
    return targets;
  }
  function renderVillage(ctx) {
    const targets = [];
    {
      const t = createTarget(ctx, 0, 352), x = t.x;
      addRegion(ctx, t, `M${x} 548h228v102H${x}Z`, { x: x + 114, y: 565 });
      addRegion(ctx, t, `M${x} 446h228v102H${x}Z`, { x: x + 114, y: 470 });
      addRegion(ctx, t, `M${x} 446  ${x + 114} 366 ${x + 228} 446Z`, { x: x + 114, y: 405 });
      t.surfaceAt = point => point >= x + 168 && point <= x + 194 ? 352 : 366 + Math.min(114, Math.abs(point - x - 114)) * 80 / 114;
      drawWindow(ctx, t, x + 35, 477); drawWindow(ctx, t, x + 153, 477);
      drawWindow(ctx, t, x + 37, 583, true); door(ctx, t, x + 145);
      circle(ctx, t, x + 114, 417, 16);
      addAccent(ctx, t, `M${x + 168} 402v-50h26v69Z`, '#d8b5a0', { x: x + 181, y: 368 }, { 'stroke-width': 2.5 });
      draw(ctx, t, `M${x + 13} 449H${x + 215}M${x + 65} 419l17-12m65 0 17 12M${x + 27} 523h55m65 0h55M${x + 13} 639h111`, { 'stroke-width': 2 });
      t.chimney = { x: x + 181, y: 352 };
      targets.push(t);
    }
    {
      const t = createTarget(ctx, 1, 360), x = t.x, cx = x + 114;
      addRegion(ctx, t, `M${x + 24} 548h180l24 102H${x}Z`, { x: cx, y: 580 });
      addRegion(ctx, t, `M${x + 48} 446h132l24 102H${x + 24}Z`, { x: cx, y: 480 });
      addRegion(ctx, t, `M${x + 28} 446 ${cx} 360 ${x + 200} 446Z`, { x: cx, y: 410 });
      t.surfaceAt = point => {
        const dx = Math.min(114, Math.abs(point - cx));
        const body = dx <= 66 ? 446 : 446 + (dx - 66) * 204 / 48;
        return Math.min(body, dx <= 86 ? 360 + dx : Infinity);
      };
      door(ctx, t, x + 128); drawWindow(ctx, t, x + 45, 573);
      circle(ctx, t, cx, 471, 13);
      // The sails stay still, so only the zeppelin competes for visual attention.
      const sails = `M${cx - 7} 461l-62-46 17-18 53 57Z M${cx + 10} 464l46-62 18 17-57 53Z M${cx + 7} 481l62 46-17 18-53-57Z M${cx - 10} 478l-46 62-18-17 57-53Z`;
      addAccent(ctx, t, sails, '#f3dec2', { x: cx, y: 471 }, { 'stroke-width': 2.5 });
      draw(ctx, t, `M${x + 33} 613h42M${x + 182} 614h25`, { 'stroke-width': 2 });
      circle(ctx, t, cx, 471, 10);
      targets.push(t);
    }
    {
      const t = createTarget(ctx, 2, 366), x = t.x;
      addRegion(ctx, t, `M${x} 560h228v90H${x}Z`, { x: x + 114, y: 582 });
      addRegion(ctx, t, `M${x} 475h228v85H${x}Z`, { x: x + 114, y: 493 });
      addRegion(ctx, t, `M${x} 390h28v-24h36v24h32v-24h36v24h32v-24h36v24h28v85H${x}Z`, { x: x + 114, y: 413 });
      t.surfaceAt = point => {
        const p = Math.max(0, Math.min(228, point - x));
        return (p >= 28 && p <= 64 || p >= 96 && p <= 132 || p >= 164 && p <= 200) ? 366 : 390;
      };
      circle(ctx, t, x + 114, 427, 27);
      draw(ctx, t, `M${x + 114} 404v5m0 36v5M${x + 91} 427h5m36 0h5M${x + 114} 410v18l13 8`, { 'stroke-width': 2.5 });
      draw(ctx, t, `M${x + 14} 465h200M${x + 14} 644h115M${x + 17} 550h29m-12-13v13m153 0h26m-13-13v13`, { 'stroke-width': 2 });
      drawWindow(ctx, t, x + 42, 497, true); drawWindow(ctx, t, x + 147, 497, true);
      drawWindow(ctx, t, x + 41, 586); door(ctx, t, x + 146);
      targets.push(t);
    }
    {
      const t = createTarget(ctx, 3, 350), x = t.x;
      addRegion(ctx, t, `M${x} 550h228v100H${x}Z`, { x: x + 114, y: 574 });
      addRegion(ctx, t, `M${x} 430h228v120H${x}Z`, { x: x + 114, y: 458 });
      addRegion(ctx, t, `M${x} 430a114 80 0 0 1 228 0Z`, { x: x + 114, y: 385 });
      t.surfaceAt = point => ellipseTop(Math.max(x, Math.min(x + 228, point)), x + 114, 430, 114, 80);
      // A large bread motif makes this a bakery without any written labels.
      addAccent(ctx, t, `M${x + 65} 482c-4-36 95-36 99 0v22H${x + 65}Z`, '#edc58b', { x: x + 114, y: 482 }, { 'stroke-width': 2.5 });
      draw(ctx, t, `M${x + 84} 466l10 18m13-24 10 22m12-19 11 18`, { 'stroke-width': 2.5 });
      addAccent(ctx, t, `M${x + 10} 532h208l-8 24q-18 14-35 0q-18 14-35 0q-18 14-35 0q-18 14-35 0q-18 14-35 0q-18 14-17 0Z`, '#f5d6c7', { x: x + 114, y: 548 }, { 'stroke-width': 2.5 });
      draw(ctx, t, `M${x + 45} 533v22m35-22v22m35-22v22m35-22v22m35-22v22M${x + 14} 639h100`, { 'stroke-width': 2 });
      drawWindow(ctx, t, x + 37, 588); door(ctx, t, x + 145);
      targets.push(t);
    }
    return targets;
  }

function renderFarm(ctx) {
  const targets = [];
  // A generous, three-part storybook barn.
  {
    const t = createTarget(ctx, 0, 367), x = t.x, w = t.width;
    addRegion(ctx, t, `M${x} 555H${x + w}V650H${x}Z`, { x: x + 114, y: 565 });
    addRegion(ctx, t, `M${x} 460H${x + w}V555H${x}Z`, { x: x + 114, y: 474 });
    addRegion(ctx, t, `M${x} 460L${x + 40} 392L${x + 114} 367L${x + 188} 392L${x + w} 460Z`, { x: x + 114, y: 413 });
    t.surfaceAt = px => { const dx = Math.min(114, Math.abs(px - x - 114)); return dx <= 74 ? 367 + dx * 25 / 74 : 392 + (dx - 74) * 68 / 40; };
    draw(ctx, t, `M${x} 460L${x + 40} 392L${x + 114} 367L${x + 188} 392L${x + w} 460M${x + 7} 465V644M${x + 221} 465V644`, { 'stroke-width': 4 });
    draw(ctx, t, `M${x + 51} 650V562H${x + 177}V650M${x + 114} 562V650M${x + 55} 568L${x + 173} 646M${x + 173} 568L${x + 55} 646`, { 'stroke-width': 3 });
    circle(ctx, t, x + 114, 432, 18);
    draw(ctx, t, `M${x + 114} 415V449M${x + 97} 432H${x + 131}`, { 'stroke-width': 2 });
    for (const wx of [x + 35, x + 153]) {
      draw(ctx, t, `M${wx} 490h40v35h-40Z`, { fill: '#fff', 'stroke-width': 2.5 });
      draw(ctx, t, `M${wx + 20} 491v33M${wx + 1} 507h38`, { 'stroke-width': 2 });
    }
    for (const sx of [x + 23, x + 44, x + 184, x + 205]) draw(ctx, t, `M${sx} 540v106`, { 'stroke-width': 1.5, opacity: .65 });
    targets.push(t);
  }
  // A tall domed grain silo with oversized horizontal bands and a ladder.
  {
    const t = createTarget(ctx, 1, 355), x = t.x, cx = x + 114;
    addRegion(ctx, t, `M${x} 545H${x + 228}V650H${x}Z`, { x: cx, y: 558 });
    addRegion(ctx, t, `M${x} 440H${x + 228}V545H${x}Z`, { x: cx, y: 456 });
    addRegion(ctx, t, `M${x} 440A114 85 0 0 1 ${x + 228} 440Z`, { x: cx, y: 385 });
    t.surfaceAt = px => 440 - 85 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(-1, Math.min(1, (px - cx) / 114)), 2)));
    draw(ctx, t, `M${x + 1} 440V650H${x + 227}V440M${x} 453Q${cx} 465 ${x + 228} 453M${x} 532Q${cx} 544 ${x + 228} 532M${x} 558Q${cx} 570 ${x + 228} 558M${x} 637Q${cx} 649 ${x + 228} 637`, { 'stroke-width': 2.5 });
    draw(ctx, t, `M${x + 181} 451V640M${x + 205} 451V640`, { 'stroke-width': 2.5 });
    for (let yy = 463; yy < 640; yy += 22) draw(ctx, t, `M${x + 181} ${yy}h24`, { 'stroke-width': 2 });
    draw(ctx, t, `M${x + 53} 650v-47a30 30 0 0 1 60 0v47`, { 'stroke-width': 3 });
    addAccent(ctx, t, `M${x + 78} 477q-24-23-26-4q2 18 26 20q24-2 26-20q-2-19-26 4Z M${x + 78} 500q-24-23-26-4q2 18 26 20q24-2 26-20q-2-19-26 4Z`, '#e6cb83', { x: x + 78, y: 497 }, { 'stroke-width': 2 });
    draw(ctx, t, `M${x + 78} 462v64`, { 'stroke-width': 2.5 });
    targets.push(t);
  }
  // A friendly, broad tractor: body, cabin and roof are separate paint areas.
  {
    const t = createTarget(ctx, 2, 389), x = t.x;
    addRegion(ctx, t, `M${x + 7} 514H${x + 130}V480H${x + 216}Q${x + 228} 480 ${x + 228} 493V581H${x + 7}Z`, { x: x + 175, y: 505 });
    addRegion(ctx, t, `M${x + 24} 450H${x + 132}V518H${x + 24}Z`, { x: x + 77, y: 463 });
    addRegion(ctx, t, `M${x + 18} 414L${x + 43} 389H${x + 132}V450H${x + 24}Z`, { x: x + 78, y: 409 });
    t.surfaceAt = px => {
      const u = px - x;
      if (u < 18) return 514;
      if (u < 43) return 414 - (u - 18);
      if (u <= 132) return 389;
      if (u >= 185 && u <= 201) return 443;
      return 480;
    };
    draw(ctx, t, `M${x + 13} 416L${x + 41} 386H${x + 138}`, { 'stroke-width': 3 });
    addAccent(ctx, t, `M${x + 185} 480V443H${x + 201}V480Z`, '#a6acbd', { x: x + 193, y: 459 }, { 'stroke-width': 3 });
    addAccent(ctx, t, `M${x + 39} 420h69v53H${x + 39}Z`, '#c5e7ed', { x: x + 73, y: 447 }, { 'stroke-width': 2.5 });
    draw(ctx, t, `M${x + 75} 421v51M${x + 109} 476l17 18M${x + 105} 472l8 8M${x + 143} 514h66M${x + 149} 526h53M${x + 149} 538h53`, { 'stroke-width': 2.5 });
    addAccent(ctx, t, ellipsePath(x + 59, 592, 58, 58) + ellipsePath(x + 186, 613, 37, 37), '#a4a9b8', { x: x + 112, y: 605 }, { 'stroke-width': 4 });
    addAccent(ctx, t, ellipsePath(x + 59, 592, 29, 29) + ellipsePath(x + 186, 613, 15, 15), '#efd296', { x: x + 112, y: 605 }, { 'stroke-width': 2.5 });
    let tread = '';
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const ax = x + 59 + Math.cos(angle) * 38, ay = 592 + Math.sin(angle) * 38;
      const bx = x + 59 + Math.cos(angle) * 51, by = 592 + Math.sin(angle) * 51;
      tread += `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`;
    }
    draw(ctx, t, tread, { 'stroke-width': 3 });
    draw(ctx, t, `M${x + 130} 580h22M${x + 10} 535Q${x + 63} 498 ${x + 114} 538`, { 'stroke-width': 3 });
    targets.push(t);
  }
  // One enormous sunflower in a planter, with big leaves and a white centre.
  {
    const t = createTarget(ctx, 3, 344), x = t.x, cx = x + 114, cy = 430;
    addRegion(ctx, t, `M${x} 590H${x + 228}L${x + 209} 650H${x + 19}Z`, { x: cx, y: 603 });
    addRegion(ctx, t, `M${cx - 8} 480H${cx + 8}V590H${cx - 8}ZM${cx} 548Q${x + 34} 486 ${x + 13} 517Q${x + 37} 569 ${cx} 565ZM${cx} 555Q${x + 196} 487 ${x + 216} 520Q${x + 191} 573 ${cx} 570Z`, { x: cx, y: 530 });
    const petals = flowerOutline(cx, cy);
    addRegion(ctx, t, petals, { x: cx, y: 382 });
    const plantSilhouette = petals + `M${cx - 8} 480L${cx + 8} 480L${cx + 8} 590L${cx - 8} 590Z M${cx} 548Q${x + 34} 486 ${x + 13} 517Q${x + 37} 569 ${cx} 565Z M${cx} 555Q${x + 196} 487 ${x + 216} 520Q${x + 191} 573 ${cx} 570Z`;
    const plantSurface = silhouetteSurface(0, plantSilhouette.replace(/([MLCQ])([^MLCQZ]*)/g, (_, command, values) => command + values.trim().split(/[ ,]+/).map((n, i) => Number(n) - (i % 2 ? 0 : x)).join(' ')));
    t.surfaceAt = px => Math.min(590, plantSurface(px - x));
    addAccent(ctx, t, ellipsePath(cx, cy, 36, 36), '#d8ad75', { x: cx, y: cy }, { 'stroke-width': 3 });
    addAccent(ctx, t, `M${cx} 548Q${x + 34} 486 ${x + 13} 517Q${x + 37} 569 ${cx} 565Z M${cx} 555Q${x + 196} 487 ${x + 216} 520Q${x + 191} 573 ${cx} 570Z`, '#a8d3a5', { x: cx, y: 551 }, { 'stroke-width': 2.5 });
    for (const [dx, dy] of [[-12, -9], [12, -9], [0, 10], [-18, 12], [18, 12]]) circle(ctx, t, cx + dx, cy + dy, 2.5, { fill: ctx.ink, stroke: 'none' });
    draw(ctx, t, `M${x + 7} 605H${x + 221}M${cx - 4} 552L${x + 33} 526M${cx + 4} 558L${x + 195} 530`, { 'stroke-width': 2 });
    targets.push(t);
  }
  return targets;
}

  function planetBody(ctx, target, cy, radius, ripple = 9) {
    const cx = target.x + 114, upper = cy - radius / 3, lower = cy + radius / 3;
    const dx = Math.sqrt(radius * radius - radius * radius / 9), left = cx - dx, right = cx + dx;
    const upperSeam = `C${cx - radius / 3} ${upper - ripple} ${cx + radius / 3} ${upper + ripple} ${right} ${upper}`;
    const lowerSeam = `C${cx - radius / 3} ${lower + ripple} ${cx + radius / 3} ${lower - ripple} ${right} ${lower}`;
    addRegion(ctx, target, `M${left} ${lower}${lowerSeam}A${radius} ${radius} 0 0 1 ${left} ${lower}Z`, { x: cx, y: cy + radius * .65 }, false);
    addRegion(ctx, target, `M${left} ${upper}${upperSeam}A${radius} ${radius} 0 0 1 ${right} ${lower}C${cx + radius / 3} ${lower - ripple} ${cx - radius / 3} ${lower + ripple} ${left} ${lower}A${radius} ${radius} 0 0 1 ${left} ${upper}Z`, { x: cx, y: cy }, false);
    addRegion(ctx, target, `M${left} ${upper}A${radius} ${radius} 0 0 1 ${right} ${upper}C${cx + radius / 3} ${upper + ripple} ${cx - radius / 3} ${upper - ripple} ${left} ${upper}Z`, { x: cx, y: cy - radius * .65 }, false);
    circle(ctx, target, cx, cy, radius, { fill: 'none', 'stroke-width': 3 });
    draw(ctx, target, `M${left} ${upper}${upperSeam}M${left} ${lower}${lowerSeam}`, { 'stroke-width': 2.3 });
    target.surfaceAt = point => ellipseTop(Math.max(cx - radius, Math.min(cx + radius, point)), cx, cy, radius, radius);
  }
  function star(ctx, target, cx, cy, radius, rotation = -Math.PI / 2) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = rotation + i * Math.PI / 5, r = i % 2 ? radius * .45 : radius;
      d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`;
    }
    addAccent(ctx, target, d + 'Z', '#fff0bf', { x: cx, y: cy }, { 'stroke-width': 2.2 });
  }
  function renderPlanets(ctx) {
    const targets = [];
    // Saturn's wide paper ribbon curls around a smaller, three-part globe.
    {
      const t = createTarget(ctx, 0, 385), x = t.x, cx = x + 114, cy = 470;
      planetBody(ctx, t, cy, 85, 7);
      draw(ctx, t, `M${x} ${cy}C${x} ${cy - 24} ${x + 24} ${cy - 33} ${x + 36} ${cy - 34}M${x + 192} ${cy - 34}C${x + 214} ${cy - 30} ${x + 228} ${cy - 17} ${x + 228} ${cy}`, { 'stroke-width': 2.8 });
      addAccent(ctx, t, `M${x} ${cy}A114 36 0 0 0 ${x + 228} ${cy}L${x + 210} ${cy}A96 19 0 0 1 ${x + 18} ${cy}Z`, '#e6d5b2', { x: cx, y: cy + 19 }, { 'stroke-width': 2.8 });
      draw(ctx, t, `M${x + 20} ${cy + 15}C${x + 65} ${cy + 35} ${x + 166} ${cy + 35} ${x + 210} ${cy + 15}`, { 'stroke-width': 1.5 });
      circle(ctx, t, cx - 22, cy - 53, 9, { 'stroke-width': 1.8 });
      t.surfaceAt = point => Math.min(ellipseTop(point, cx, cy, 85, 85), ellipseTop(point, cx, cy, 114, 36));
      targets.push(t);
    }
    // A cratered moon with soft, oversized bowls and a little crescent shine.
    {
      const t = createTarget(ctx, 1, 362), x = t.x, cx = x + 114, cy = 472;
      planetBody(ctx, t, cy, 110, 6);
      const craters = [[-45, -57, 23, 18], [42, -53, 16, 13], [-61, 20, 19, 15], [35, 19, 29, 23], [-9, 76, 14, 10]];
      addAccent(ctx, t, craters.map(([dx, dy, rx, ry]) => ellipsePath(cx + dx, cy + dy, rx, ry)).join(' '), '#b9b6d8', { x: cx, y: cy }, { 'stroke-width': 2.3 });
      for (const [dx, dy, rx, ry] of craters) {
        draw(ctx, t, `M${cx + dx - rx * .58} ${cy + dy + 2}Q${cx + dx} ${cy + dy + ry * .85} ${cx + dx + rx * .58} ${cy + dy + 2}`, { 'stroke-width': 1.6 });
      }
      draw(ctx, t, `M${x + 34} 403Q${x + 19} 421 ${x + 16} 441M${x + 26} 452L${x + 25} 458`, { 'stroke-width': 2 });
      targets.push(t);
    }
    // Broad, flowing cloud belts and one great oval storm make a gas giant.
    {
      const t = createTarget(ctx, 2, 365), x = t.x, cx = x + 114, cy = 475;
      planetBody(ctx, t, cy, 110, 23);
      draw(ctx, t, `M${x + 42} 392C${x + 80} 384 ${x + 139} 409 ${x + 181} 390M${x + 18} 422C${x + 65} 404 ${x + 160} 447 ${x + 213} 423M${x + 5} 470C${x + 71} 449 ${x + 135} 491 ${x + 223} 473M${x + 24} 538C${x + 83} 563 ${x + 149} 523 ${x + 206} 539M${x + 57} 568C${x + 92} 580 ${x + 138} 558 ${x + 170} 569`, { 'stroke-width': 2 });
      addAccent(ctx, t, ellipsePath(cx + 26, cy + 17, 31, 17), '#efc5ac', { x: cx + 26, y: cy + 17 }, { 'stroke-width': 2.4 });
      draw(ctx, t, `M${cx + 6} ${cy + 20}Q${cx + 27} ${cy + 34} ${cx + 47} ${cy + 17}`, { 'stroke-width': 1.7 });
      targets.push(t);
    }
    // A make-believe star garden: a globe of big, white paper-cut stars.
    {
      const t = createTarget(ctx, 3, 365), x = t.x, cx = x + 114, cy = 473;
      planetBody(ctx, t, cy, 108, 14);
      star(ctx, t, cx - 42, cy - 53, 24, -1.35);
      star(ctx, t, cx + 45, cy - 34, 17, -1.8);
      star(ctx, t, cx - 35, cy + 30, 16, -1.4);
      star(ctx, t, cx + 32, cy + 58, 23, -1.8);
      for (const [dx, dy, r] of [[12, -77, 4], [-77, -1, 4], [74, 14, 5], [-2, 5, 4], [-8, 83, 3]]) circle(ctx, t, cx + dx, cy + dy, r, { 'stroke-width': 1.8 });
      draw(ctx, t, `M${x + 24} 425Q${x + 17} 439 ${x + 15} 452M${x + 193} 535L${x + 187} 543`, { 'stroke-width': 2 });
      targets.push(t);
    }
    return targets;
  }

  function safeRender(render, ctx) {
    return render(ctx).map(target => {
      const surface = target.surfaceAt;
      // Assistance may land just outside the drawn band's edge.
      target.surfaceAt = x => {
        const clamped = Math.max(target.x, Math.min(target.x + target.width, x));
        const y = surface(clamped);
        return Number.isFinite(y) ? y : target.top;
      };
      return target;
    });
  }
  window.PaintSceneArt = {
    forest: { palette: ['#a9d6b0', '#c6dda1', '#f2c58c', '#a5d8c7'], render: ctx => safeRender(renderForest, ctx) },
    village: { palette: ['#ffd19f', '#c8bae8', '#a5cfe3', '#f4b6bf'], render: ctx => safeRender(renderVillage, ctx) },
    farm: { palette: ['#f5aaa0', '#c5b6e3', '#a9d1e5', '#f6d575'], render: ctx => safeRender(renderFarm, ctx) },
    planets: { palette: ['#c7b8ed', '#addde4', '#f1c2aa', '#ddbadf'], render: ctx => safeRender(renderPlanets, ctx) }
  };
})();
