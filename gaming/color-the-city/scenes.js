(() => {
  'use strict';
  const positions = [56, 342, 628, 914];
  function createTarget(ctx, index, top) {
    const group = ctx.svg('g', { 'data-building': index }, ctx.parent);
    const paint = ctx.svg('g', { class: 'scene-paint' }, group);
    const outlines = ctx.svg('g', { class: 'scene-outlines' }, group);
    return { x: positions[index], width: 228, floors: 3, painted: 0, top, floorHeight: 80,
      roofHeight: 0, floorEls: [], origins: [], group, paint, outlines, bounce: 0,
      roof: null, door: null, surfaceAt: () => top };
  }
  function addRegion(ctx, target, d, origin) {
    target.floorEls.push(ctx.svg('path', { d, fill: '#fff', class: 'floor' }, target.paint));
    target.origins.push(origin);
    ctx.inkPath(d, target.outlines, { fill: 'none', 'stroke-width': 3 });
  }
  function draw(ctx, target, d, attrs = {}) {
    return ctx.inkPath(d, target.outlines, attrs);
  }
  function circle(ctx, target, cx, cy, r, attrs = {}) {
    return ctx.svg('circle', { cx, cy, r, fill: '#fff', stroke: ctx.ink, 'stroke-width': 2.5, ...attrs }, target.outlines);
  }
  function ellipseTop(x, cx, cy, rx, ry) {
    const u = (x - cx) / rx;
    return Math.abs(u) <= 1 ? cy - ry * Math.sqrt(1 - u * u) : Infinity;
  }
  function trunk(ctx, target, width = 32, top = 545) {
    const cx = target.x + 114;
    draw(ctx, target, `M${cx - width / 2} ${top}v${650 - top}h${width}V${top}`, { fill: '#fff' });
    draw(ctx, target, `M${cx} 641v-50m0 18-10-12m10 25 9-9`, { 'stroke-width': 2 });
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
  function renderForest(ctx) {
    const targets = [];
    // A layered pine: three broad branches become three generous paint areas.
    {
      const t = createTarget(ctx, 0, 324), x = t.x, cx = x + 114;
      trunk(ctx, t, 34, 555);
      addRegion(ctx, t, `M${cx} 440  ${x + 228} 590H${x}Z`, { x: cx, y: 506 });
      addRegion(ctx, t, `M${cx} 390 ${x + 199} 515H${x + 29}Z`, { x: cx, y: 446 });
      addRegion(ctx, t, `M${cx} 324 ${x + 170} 432H${x + 58}Z`, { x: cx, y: 364 });
      t.surfaceAt = point => {
        const dx = Math.abs(point - cx);
        return Math.min(dx <= 56 ? 324 + dx * 108 / 56 : Infinity,
          dx <= 85 ? 390 + dx * 125 / 85 : Infinity, 440 + Math.min(114, dx) * 150 / 114);
      };
      draw(ctx, t, `M${cx} 459l-12 20m12-20 12 20M${cx - 43} 543l-11 16m83-16 11 16`, { 'stroke-width': 2 });
      targets.push(t);
    }
    // A broad round tree, split into three curved colouring-book bands.
    {
      const t = createTarget(ctx, 1, 336), x = t.x, cx = x + 114, cy = 450, r = 114;
      const dx = Math.sqrt(r * r - 38 * 38), left = cx - dx, right = cx + dx;
      trunk(ctx, t, 36, 535);
      addRegion(ctx, t, `M${left} 488A114 114 0 0 0 ${right} 488Z`, { x: cx, y: 514 });
      addRegion(ctx, t, `M${left} 412H${right}A114 114 0 0 1 ${right} 488H${left}A114 114 0 0 1 ${left} 412Z`, { x: cx, y: 450 });
      addRegion(ctx, t, `M${left} 412A114 114 0 0 1 ${right} 412Z`, { x: cx, y: 373 });
      t.surfaceAt = point => ellipseTop(Math.max(x, Math.min(x + 228, point)), cx, cy, r, r);
      draw(ctx, t, `M${cx} 552v-72m0 23-33-23m33 23 34-23M${cx - 70} 438q-13-13-19 0q4 15 19 0m133 24q-12-13-18 0q4 15 18 0`, { 'stroke-width': 2.5 });
      targets.push(t);
    }
    // An orchard tree: three cloud-like clusters and large unpainted apples.
    {
      const t = createTarget(ctx, 2, 361), x = t.x, cx = x + 114;
      trunk(ctx, t, 32, 540);
      addRegion(ctx, t, `M${cx - 88} 494a88 88 0 1 0 176 0a88 88 0 1 0-176 0Z`, { x: cx, y: 502 });
      addRegion(ctx, t, `M${x} 425a64 64 0 1 0 128 0a64 64 0 1 0-128 0Z`, { x: x + 64, y: 425 });
      addRegion(ctx, t, `M${x + 100} 425a64 64 0 1 0 128 0a64 64 0 1 0-128 0Z`, { x: x + 164, y: 425 });
      t.surfaceAt = point => Math.min(ellipseTop(point, cx, 494, 88, 88), ellipseTop(point, x + 64, 425, 64, 64), ellipseTop(point, x + 164, 425, 64, 64));
      [[45,420],[166,405],[115,513],[167,519]].forEach(([ax,ay]) => {
        circle(ctx, t, x + ax, ay, 13);
        draw(ctx, t, `M${x + ax} ${ay - 13}q-2-8 5-12m-4 5q12-10 17-1q-8 8-17 1`, { 'stroke-width': 2 });
      });
      targets.push(t);
    }
    // A tall, gently stacked canopy gives the last tree a different silhouette.
    {
      const t = createTarget(ctx, 3, 320), x = t.x, cx = x + 114;
      trunk(ctx, t, 30, 570);
      addRegion(ctx, t, `M${x} 548a114 62 0 1 0 228 0a114 62 0 1 0-228 0Z`, { x: cx, y: 552 });
      addRegion(ctx, t, `M${x + 15} 472a99 76 0 1 0 198 0a99 76 0 1 0-198 0Z`, { x: cx, y: 471 });
      addRegion(ctx, t, `M${x + 40} 400a74 80 0 1 0 148 0a74 80 0 1 0-148 0Z`, { x: cx, y: 395 });
      t.surfaceAt = point => Math.min(ellipseTop(point, cx, 548, 114, 62), ellipseTop(point, cx, 472, 99, 76), ellipseTop(point, cx, 400, 74, 80));
      draw(ctx, t, `M${cx} 590v-90m0 44-27-20m27 20 29-20M${cx - 15} 364q-14-14-20 1q5 15 20-1m37 72q13-15 21-2q-4 16-21 2`, { 'stroke-width': 2.5 });
      targets.push(t);
    }
    return targets;
  }
  function renderVillage(ctx) {
    const targets = [];
    {
      const t = createTarget(ctx, 0, 366), x = t.x;
      addRegion(ctx, t, `M${x} 548h228v102H${x}Z`, { x: x + 114, y: 565 });
      addRegion(ctx, t, `M${x} 446h228v102H${x}Z`, { x: x + 114, y: 470 });
      addRegion(ctx, t, `M${x} 446  ${x + 114} 366 ${x + 228} 446Z`, { x: x + 114, y: 405 });
      t.surfaceAt = point => 366 + Math.min(114, Math.abs(point - x - 114)) * 80 / 114;
      drawWindow(ctx, t, x + 35, 477); drawWindow(ctx, t, x + 153, 477);
      drawWindow(ctx, t, x + 37, 583, true); door(ctx, t, x + 145);
      circle(ctx, t, x + 114, 417, 16);
      draw(ctx, t, `M${x + 168} 402v-50h26v69M${x + 176} 339q-13-19 4-24q16-5 20 10`, { fill: '#fff', 'stroke-width': 2.5 });
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
      draw(ctx, t, `M${cx - 10} 464l-57-48 13-15 54 51m9 12 48-57 15 13-51 54m-10 9 57 48-13 15-54-51m-9-12-48 57-15-13 51-54Z`, { fill: '#fff', 'stroke-width': 2.5 });
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
      draw(ctx, t, `M${x + 114} 410v18l13 8`, { 'stroke-width': 2.5 });
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
      draw(ctx, t, `M${x + 65} 482c-4-36 95-36 99 0v22H${x + 65}Zm19-17 11 19m11-24 11 22m12-19 11 18`, { fill: '#fff', 'stroke-width': 2.5 });
      draw(ctx, t, `M${x + 10} 532h208l-8 24q-18 14-35 0q-18 14-35 0q-18 14-35 0q-18 14-35 0q-18 14-35 0q-18 14-17 0Z`, { fill: '#fff', 'stroke-width': 2.5 });
      drawWindow(ctx, t, x + 37, 588); door(ctx, t, x + 145);
      targets.push(t);
    }
    return targets;
  }

function renderFarm(ctx) {
  const targets = [];
  // A generous, three-part storybook barn.
  {
    const t = createTarget(ctx, 0, 385), x = t.x, w = t.width;
    addRegion(ctx, t, `M${x} 555H${x + w}V650H${x}Z`, { x: x + 114, y: 565 });
    addRegion(ctx, t, `M${x} 460H${x + w}V555H${x}Z`, { x: x + 114, y: 474 });
    addRegion(ctx, t, `M${x} 460L${x + 114} 385L${x + w} 460Z`, { x: x + 114, y: 416 });
    t.surfaceAt = px => 385 + 75 * Math.min(1, Math.abs(px - x - 114) / 114);
    draw(ctx, t, `M${x - 1} 460L${x + 114} 385L${x + w + 1} 460M${x + 7} 465V644M${x + 221} 465V644`, { 'stroke-width': 4 });
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
    draw(ctx, t, `M${x + 1} 440V650H${x + 227}V440M${x} 453H${x + 228}M${x} 532H${x + 228}M${x} 558H${x + 228}M${x} 637H${x + 228}`, { 'stroke-width': 2.5 });
    draw(ctx, t, `M${x + 181} 451V640M${x + 205} 451V640`, { 'stroke-width': 2.5 });
    for (let yy = 463; yy < 640; yy += 22) draw(ctx, t, `M${x + 181} ${yy}h24`, { 'stroke-width': 2 });
    draw(ctx, t, `M${x + 53} 650v-47a30 30 0 0 1 60 0v47`, { 'stroke-width': 3 });
    circle(ctx, t, x + 78, 490, 21);
    draw(ctx, t, `M${x + 78} 470v40M${x + 58} 490h40`, { 'stroke-width': 2 });
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
    draw(ctx, t, `M${x + 185} 480V443H${x + 201}V480Z`, { fill: '#fff', 'stroke-width': 3 });
    draw(ctx, t, `M${x + 39} 420h69v53H${x + 39}Z`, { fill: '#fff', 'stroke-width': 2.5 });
    draw(ctx, t, `M${x + 75} 421v51M${x + 109} 476l17 18M${x + 105} 472l8 8M${x + 143} 514h66M${x + 149} 526h53M${x + 149} 538h53`, { 'stroke-width': 2.5 });
    circle(ctx, t, x + 59, 592, 58, { 'stroke-width': 4 });
    circle(ctx, t, x + 59, 592, 29, { 'stroke-width': 3 });
    circle(ctx, t, x + 186, 613, 37, { 'stroke-width': 4 });
    circle(ctx, t, x + 186, 613, 15, { 'stroke-width': 2.5 });
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const ax = x + 59 + Math.cos(angle) * 38, ay = 592 + Math.sin(angle) * 38;
      const bx = x + 59 + Math.cos(angle) * 51, by = 592 + Math.sin(angle) * 51;
      draw(ctx, t, `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`, { 'stroke-width': 3 });
    }
    draw(ctx, t, `M${x + 130} 580h22M${x + 10} 535Q${x + 63} 498 ${x + 114} 538`, { 'stroke-width': 3 });
    targets.push(t);
  }
  // One enormous sunflower in a planter, with big leaves and a white centre.
  {
    const t = createTarget(ctx, 3, 344), x = t.x, cx = x + 114, cy = 430;
    addRegion(ctx, t, `M${x} 590H${x + 228}L${x + 209} 650H${x + 19}Z`, { x: cx, y: 603 });
    addRegion(ctx, t, `M${cx - 8} 480H${cx + 8}V590H${cx - 8}ZM${cx} 548Q${x + 34} 486 ${x + 13} 517Q${x + 37} 569 ${cx} 565ZM${cx} 555Q${x + 196} 487 ${x + 216} 520Q${x + 191} 573 ${cx} 570Z`, { x: cx, y: 530 });
    addRegion(ctx, t, `M${cx - 105} ${cy}A105 86 0 1 1 ${cx + 105} ${cy}A105 86 0 1 1 ${cx - 105} ${cy}Z`, { x: cx, y: 382 });
    t.surfaceAt = px => {
      const u = (px - cx) / 105;
      return Math.abs(u) <= 1 ? cy - 86 * Math.sqrt(Math.max(0, 1 - u * u)) : 590;
    };
    circle(ctx, t, cx, cy, 36, { 'stroke-width': 3 });
    for (let i = 0; i < 14; i++) {
      const a = i * Math.PI * 2 / 14;
      const ax = cx + Math.cos(a) * 43, ay = cy + Math.sin(a) * 39;
      const bx = cx + Math.cos(a) * 91, by = cy + Math.sin(a) * 75;
      draw(ctx, t, `M${ax.toFixed(1)} ${ay.toFixed(1)}Q${(bx + Math.sin(a) * 5).toFixed(1)} ${(by - Math.cos(a) * 5).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`, { 'stroke-width': 2.5 });
    }
    for (const [dx, dy] of [[-12, -9], [12, -9], [0, 10], [-18, 12], [18, 12]]) circle(ctx, t, cx + dx, cy + dy, 2.5, { fill: ctx.ink, stroke: 'none' });
    draw(ctx, t, `M${x + 7} 605H${x + 221}M${cx - 4} 552L${x + 33} 526M${cx + 4} 558L${x + 195} 530`, { 'stroke-width': 2 });
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
    farm: { palette: ['#f5aaa0', '#c5b6e3', '#a9d1e5', '#f6d575'], render: ctx => safeRender(renderFarm, ctx) }
  };
})();
