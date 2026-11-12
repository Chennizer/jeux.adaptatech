(() => {
  'use strict';
  // Original storybook shapes with the broad silhouettes of classic game worlds.
  // Every large surface belongs to a paint region or a final-hit accent.
  const positions = [56, 342, 628, 914];
  function localPath(x, d) {
    return d.replace(/([MLCQ])([^MLCQZ]*)/g, (_, command, values) => command +
      values.trim().split(/[ ,]+/).map((n, i) => Number(n) + (i % 2 ? 0 : x)).join(' '));
  }
  function round(cx, cy, rx, ry = rx) {
    const k = .55228475;
    return `M${cx-rx} ${cy}C${cx-rx} ${cy-ry*k} ${cx-rx*k} ${cy-ry} ${cx} ${cy-ry}C${cx+rx*k} ${cy-ry} ${cx+rx} ${cy-ry*k} ${cx+rx} ${cy}C${cx+rx} ${cy+ry*k} ${cx+rx*k} ${cy+ry} ${cx} ${cy+ry}C${cx-rx*k} ${cy+ry} ${cx-rx} ${cy+ry*k} ${cx-rx} ${cy}Z`;
  }
  // Sample only the visible path edges; separate subpaths never gain phantom
  // connecting edges. The same paths feed painting and the collision surface.
  function segments(d) {
    const edges = [];
    let current = [0,0], first = current;
    for (const match of d.matchAll(/([MLCQZ])([^MLCQZ]*)/g)) {
      const command = match[1], v = match[2].trim().split(/[ ,]+/).filter(Boolean).map(Number);
      if (command === 'M') { current = v; first = current; continue; }
      if (command === 'L' || command === 'Z') {
        const next = command === 'Z' ? first : v;
        edges.push([current,next]); current = next; continue;
      }
      const start = current, cubic = command === 'C';
      for (let i=1;i<=40;i++) {
        const t=i/40,u=1-t;
        const next=[0,1].map(axis=>cubic
          ? u*u*u*start[axis]+3*u*u*t*v[axis]+3*u*t*t*v[axis+2]+t*t*t*v[axis+4]
          : u*u*start[axis]+2*u*t*v[axis]+t*t*v[axis+2]);
        edges.push([current,next]);current=next;
      }
    }
    return edges;
  }
  function target(ctx, index, top, motif, anchorY) {
    const group = ctx.svg('g', {'data-building':index,'data-motif-name':motif}, ctx.parent);
    const paint = ctx.svg('g',{class:'scene-paint'},group);
    const outlines = ctx.svg('g',{class:'scene-outlines'},group);
    return {x:positions[index],width:228,floors:3,painted:0,top,floorHeight:80,roofHeight:0,
      floorEls:[],origins:[],accents:[],group,paint,outlines,bounce:0,roof:null,door:null,
      motif,lifeAnchor:{x:positions[index]+114,y:anchorY},silhouettes:[]};
  }
  function line(ctx,t,d,attrs={}) {
    return ctx.inkPath(localPath(t.x,d),t.outlines,{'stroke-width':2.5,...attrs});
  }
  function region(ctx,t,d,y,outline=true) {
    t.floorEls.push(ctx.svg('path',{d:localPath(t.x,d),fill:'#fff',class:'floor'},t.paint));
    t.origins.push({x:t.x+114,y});t.silhouettes.push(d);
    if(outline)line(ctx,t,d,{'stroke-width':3});
  }
  function accent(ctx,t,d,colour,x,y,outline=true) {
    const el=ctx.svg('path',{d:localPath(t.x,d),fill:'#fff',class:'accent-colour'},t.paint);
    t.accents.push({el,colour,x:t.x+x,y});t.silhouettes.push(d);
    if(outline)line(ctx,t,d,{'stroke-width':2.2});
  }
  function finish(t) {
    const edges=t.silhouettes.flatMap(segments);
    // Index the silhouette once. A moving drop/guide only inspects edges that
    // cross its pixel column, rather than rescanning every sampled curve.
    // Contact stays exact, including the steps of blocks and castle battlements.
    const columns=Array.from({length:t.width+1},()=>[]);
    edges.forEach(edge=>{
      const left=Math.max(0,Math.floor(Math.min(edge[0][0],edge[1][0])-.001));
      const right=Math.min(t.width,Math.floor(Math.max(edge[0][0],edge[1][0])));
      for(let i=left;i<=right;i++)columns[i].push(edge);
    });
    const surface=px=>{
      let y=Infinity;
      for(const [a,b] of columns[Math.floor(px)]){
        const dx=b[0]-a[0];
        if(Math.abs(dx)<.00001){if(Math.abs(px-a[0])<.001)y=Math.min(y,a[1],b[1]);}
        else if(px>=Math.min(a[0],b[0])&&px<=Math.max(a[0],b[0]))y=Math.min(y,a[1]+(px-a[0])*(b[1]-a[1])/dx);
      }
      return Number.isFinite(y)?y:t.top;
    };
    const samples=columns.map((_,x)=>surface(x));
    t.surfaceAt=point=>{
      const px=Math.max(0,Math.min(t.width,point-t.x));
      return Number.isInteger(px)?samples[px]:surface(px);
    };
    delete t.silhouettes;return t;
  }
  function eyes(ctx,t,x,y,gap=28) {
    for(const dx of [-gap/2,gap/2])ctx.svg('circle',{cx:t.x+x+dx,cy:y,r:3.6,fill:ctx.ink},t.outlines);
    line(ctx,t,`M${x-8} ${y+12}Q${x} ${y+20} ${x+8} ${y+12}`,{'stroke-width':2});
  }
  function renderKingdom(ctx) {
    const targets=[];
    {
      const t=target(ctx,0,330,'block',420);
      region(ctx,t,'M5 542L223 542Q228 542 228 547L228 645Q228 650 223 650L5 650Q0 650 0 645L0 547Q0 542 5 542Z',591);
      region(ctx,t,'M29 436L199 436Q204 436 204 441L204 542L24 542L24 441Q24 436 29 436Z',484);
      region(ctx,t,'M63 330L165 330Q170 330 170 335L170 436L58 436L58 335Q58 330 63 330Z',380);
      line(ctx,t,'M12 554L216 554M36 448L192 448M70 342L158 342M12 554L12 638M36 448L36 530M70 342L70 421',{'stroke-width':2,opacity:.5});
      accent(ctx,t,'M114 356L134 383L114 410L94 383Z','#ffe285',114,383);
      line(ctx,t,'M114 356L114 410M94 383L134 383M114 447L114 530M76 553L76 638M152 553L152 638',{'stroke-width':1.8});
      for(const [x,y] of [[16,564],[208,630],[40,458],[188,522],[74,350],[154,416]])
        ctx.svg('circle',{cx:t.x+x,cy:y,r:2.8,fill:ctx.ink},t.outlines);
      targets.push(finish(t));
    }
    {
      const t=target(ctx,1,395,'pipe',418);
      region(ctx,t,'M32 556L196 556L196 642Q196 650 114 650Q32 650 32 642Z',606);
      region(ctx,t,'M32 455L196 455L196 556L32 556Z',507);
      region(ctx,t,'M0 418Q0 395 114 395Q228 395 228 418L228 449Q228 472 114 472Q0 472 0 449Z',438);
      accent(ctx,t,round(114,418,97,14),'#a8e7bc',114,418);
      line(ctx,t,'M0 418Q0 443 114 443Q228 443 228 418M51 483L51 629M177 483L177 629M52 638Q114 645 176 638',{'stroke-width':2});
      eyes(ctx,t,114,510,42);
      targets.push(finish(t));
    }
    {
      const t=target(ctx,2,336,'flower',395);
      region(ctx,t,'M101 500L127 500L127 571Q170 530 206 555Q180 610 127 610L127 650L101 650L101 591Q48 604 22 557Q69 535 101 568Z',586);
      region(ctx,t,'M0 442Q1 414 35 414Q13 381 45 362Q70 347 89 371Q92 336 114 336Q141 336 144 371Q169 347 195 363Q222 384 196 414Q227 414 228 442Q228 471 195 473Q217 503 188 521Q160 537 140 511Q136 542 114 542Q90 542 86 511Q62 536 36 520Q11 502 33 473Q0 470 0 442Z',484,false);
      region(ctx,t,'M0 442Q1 414 35 414Q13 381 45 362Q70 347 89 371Q92 336 114 336Q141 336 144 371Q169 347 195 363Q222 384 196 414Q227 414 228 442Z',389,false);
      line(ctx,t,'M0 442Q1 414 35 414Q13 381 45 362Q70 347 89 371Q92 336 114 336Q141 336 144 371Q169 347 195 363Q222 384 196 414Q227 414 228 442Q228 471 195 473Q217 503 188 521Q160 537 140 511Q136 542 114 542Q90 542 86 511Q62 536 36 520Q11 502 33 473Q0 470 0 442Z',{'stroke-width':3});
      accent(ctx,t,round(114,442,48),'#ffe28a',114,442);
      accent(ctx,t,'M101 566Q69 539 22 557Q48 604 101 591Z M127 572Q170 530 206 555Q180 610 127 610Z','#9ed79d',114,582);
      line(ctx,t,'M35 414L63 424M89 371L98 397M144 371L134 397M196 414L165 424M33 473L64 461M86 511L97 488M140 511L132 488M195 473L164 461M31 559Q67 564 101 585M195 557Q162 575 127 590',{'stroke-width':2});
      eyes(ctx,t,114,438,29);targets.push(finish(t));
    }
    {
      const t=target(ctx,3,330,'castle',352);
      region(ctx,t,'M0 490L228 490L228 650L0 650Z',585);
      region(ctx,t,'M0 410L20 410L20 432L40 432L40 410L60 410L60 490L78 490L78 390L150 390L150 490L168 490L168 410L188 410L188 432L208 432L208 410L228 410L228 490L0 490Z',451);
      region(ctx,t,'M66 390L114 330L162 390Z',369);
      accent(ctx,t,'M85 650L85 588Q85 557 114 557Q143 557 143 588L143 650Z','#e8b477',114,601);
      for(const x of [23,181])accent(ctx,t,`M${x} 500L${x} 466Q${x+12} 453 ${x+24} 466L${x+24} 500Z`,'#ace5ed',x+12,480);
      accent(ctx,t,round(114,438,16),'#ffe58c',114,438);
      line(ctx,t,'M0 540L61 540M168 540L228 540M0 591L61 591M168 591L228 591M30 540L30 590M198 540L198 590M101 568L101 638M127 568L127 638M85 609L143 609M78 403L150 403',{'stroke-width':2});
      targets.push(finish(t));
    }
    return targets;
  }
  function renderSquadron(ctx) {
    const targets=[];
    {
      const t=target(ctx,0,330,'ship',620);
      region(ctx,t,'M52 516Q24 540 0 594L0 612L75 583L84 624L144 624L153 583L228 612L228 594Q204 540 176 516Z',579);
      region(ctx,t,'M52 440L176 440L176 550Q176 579 151 598L77 598Q52 579 52 550Z',509);
      region(ctx,t,'M52 440Q63 374 114 330Q165 374 176 440Z',398);
      accent(ctx,t,round(114,472,35),'#ade8f1',114,472);
      accent(ctx,t,'M84 605L144 605L144 624L84 624Z','#aab8db',114,615);
      line(ctx,t,'M64 419Q114 427 164 419M78 558L150 558M78 570L150 570M20 593L63 545M208 593L165 545M92 612L136 612',{'stroke-width':2});
      line(ctx,t,'M92 455Q101 445 116 446',{'stroke-width':4,opacity:.65});
      eyes(ctx,t,114,472,23);targets.push(finish(t));
    }
    {
      const t=target(ctx,1,348,'satellite',470);
      region(ctx,t,'M0 426L62 426L62 574L0 574Z',499);
      region(ctx,t,'M166 426L228 426L228 574L166 574Z',499);
      region(ctx,t,'M62 487L74 487L74 435Q74 413 96 413L110 413L110 385Q91 383 79 355Q114 341 149 355Q137 383 118 385L118 413L132 413Q154 413 154 435L154 487L166 487L166 511L154 511L154 553Q154 576 132 576L96 576Q74 576 74 553L74 511L62 511Z',464);
      line(ctx,t,'M20 426L20 574M42 426L42 574M0 463L62 463M0 500L62 500M0 537L62 537M187 426L187 574M207 426L207 574M166 463L228 463M166 500L228 500M166 537L228 537',{'stroke-width':1.8});
      accent(ctx,t,round(114,465,23),'#b5e8ed',114,465);
      accent(ctx,t,'M94 526L134 526L134 545L94 545Z','#ffe395',114,536);
      line(ctx,t,'M80 355Q114 369 148 355M114 355L114 348M88 558L140 558M96 536L132 536M105 450Q115 447 123 451',{'stroke-width':2});
      eyes(ctx,t,114,465,18);targets.push(finish(t));
    }
    {
      const t=target(ctx,2,366,'outpost',417);
      t.lifeAnchor={x:t.x+188,y:417};
      // A real observatory stands above its rounded asteroid: a glass dome,
      // panelled habitat, airlock, solar array and a small communication mast.
      region(ctx,t,'M0 602Q2 580 34 574L74 569L105 574L139 568L170 575L204 574Q228 583 228 602L220 620L203 635L172 642L145 640L117 650L88 645L58 649L31 636L12 623Z',614,false);
      region(ctx,t,'M37 475L191 475L191 576L207 583L207 595L21 595L21 583L37 576Z M4 497L36 497L36 536L4 536Z',539);
      region(ctx,t,'M48 475L48 449C48 407 76 382 114 382C152 382 180 407 180 449L180 475Z M185 475L185 421L191 421L191 475Z',431);
      accent(ctx,t,'M60 464L60 449C60 414 82 395 114 395C146 395 168 414 168 449L168 464Z','#b4e7ed',114,431);
      accent(ctx,t,'M88 582L88 533Q88 510 114 510Q140 510 140 533L140 582Z','#d9c9ef',114,549);
      accent(ctx,t,'M48 494L76 494L76 516L48 516Z M152 494L180 494L180 516L152 516Z','#ffe6a8',62,505);
      accent(ctx,t,round(188,417,7),'#ffe69c',188,417);
      line(ctx,t,'M114 395L114 464M65 426Q114 441 163 426M48 475L180 475M37 482L191 482M114 521L114 578M99 542L105 542M123 542L129 542M83 585L145 585M77 595L151 595M10 510L30 510M10 523L30 523M20 497L20 536M37 545L58 545M170 546L191 546',{'stroke-width':1.9});
      line(ctx,t,'M37 574L34 574Q2 580 0 602L12 623L31 636L58 649L88 645L117 650L145 640L172 642L203 635L220 620L228 602Q228 583 204 574L191 574',{'stroke-width':3});
      line(ctx,t,round(38,611,12,5)+' '+round(177,616,16,6)+' '+round(106,635,10,4),{'stroke-width':1.8,opacity:.6});
      targets.push(finish(t));
    }
    {
      const t=target(ctx,3,360,'station',466);
      region(ctx,t,'M0 474C0 500 51 524 114 524C177 524 228 500 228 474L228 495C228 527 177 550 114 550C51 550 0 527 0 495Z',521);
      region(ctx,t,'M0 474C0 442 51 419 114 419C177 419 228 442 228 474C228 500 177 524 114 524C51 524 0 500 0 474Z',467);
      region(ctx,t,'M76 547L76 407Q76 382 101 382L107 382L107 360L121 360L121 382L127 382Q152 382 152 407L152 547Q152 573 127 573L101 573Q76 573 76 547Z',466);
      accent(ctx,t,round(114,459,29),'#b4e6f2',114,459);
      accent(ctx,t,'M91 523L137 523L137 544L91 544Z','#ffe58f',114,534);
      for(const x of [25,53,175,203])accent(ctx,t,round(x,477,7),'#ffe1a4',x,477);
      line(ctx,t,'M9 493Q41 516 68 519M160 519Q193 516 219 493M94 403L134 403M89 556L139 556M94 420L134 420M100 442Q113 434 126 441M12 461Q34 445 62 440M166 440Q194 445 216 461',{'stroke-width':2});
      targets.push(finish(t));
    }
    return targets;
  }
  function renderDungeon(ctx) {
    const targets=[];
    {
      const t=target(ctx,0,380,'chest',460);
      region(ctx,t,'M0 554L228 554L228 650L0 650Z',604);
      region(ctx,t,'M0 474L228 474L228 554L0 554Z',514);
      region(ctx,t,'M0 474L0 442Q0 380 62 380L166 380Q228 380 228 442L228 474Z',423);
      accent(ctx,t,'M24 391Q36 380 50 380L50 650L24 650Z M178 380Q192 380 204 391L204 650L178 650Z','#efd183',114,504);
      accent(ctx,t,'M94 455L134 455L134 507L94 507Z','#ffe59c',114,481);
      accent(ctx,t,'M108 476L120 476L120 491L108 491Z','#b094bd',114,483);
      line(ctx,t,'M0 477L94 477M134 477L228 477M66 397L162 397M66 632L162 632M66 570L162 570M76 494L76 543M152 494L152 543M76 584L76 619M152 584L152 619M8 524L18 524M210 524L220 524',{'stroke-width':1.8});
      line(ctx,t,'M8 506Q17 497 18 507L18 542M210 507Q211 497 220 506L220 542',{'stroke-width':2.4});
      targets.push(finish(t));
    }
    {
      const t=target(ctx,1,330,'crystals',410);
      region(ctx,t,'M0 466L39 412L82 452L82 615L53 650L0 615Z',540);
      region(ctx,t,'M146 443L189 389L228 449L228 611L191 650L146 615Z',534);
      region(ctx,t,'M67 393L114 330L161 393L161 611L114 650L67 611Z',470);
      line(ctx,t,'M0 466L39 479L82 452M39 412L39 479L53 650M146 443L189 474L228 449M189 389L189 474L191 650M67 393L114 420L161 393M114 330L114 420L114 650M67 611L114 581L161 611',{'stroke-width':2.1});
      accent(ctx,t,'M96 446L114 430L132 446L114 463Z','#e4f8ff',114,447);
      line(ctx,t,'M17 506L17 551M207 500L207 547M86 461L86 510M97 376L106 362M178 431L183 421',{'stroke-width':3,opacity:.5});
      targets.push(finish(t));
    }
    {
      const t=target(ctx,2,350,'tower',420);
      region(ctx,t,'M23 550L205 550L205 650L23 650Z',605);
      region(ctx,t,'M23 428L205 428L205 550L23 550Z',484);
      region(ctx,t,'M0 350L37 350L37 377L76 377L76 350L152 350L152 377L191 377L191 350L228 350L228 428L0 428Z',399);
      accent(ctx,t,'M89 650L89 596Q89 569 114 569Q139 569 139 596L139 650Z','#e7bd89',114,611);
      accent(ctx,t,'M93 506L93 467Q93 444 114 444Q135 444 135 467L135 506Z','#bddef3',114,477);
      line(ctx,t,'M0 414L228 414M23 525L205 525M23 576L74 576M154 576L205 576M23 626L74 626M154 626L205 626M63 429L63 475M23 475L79 475M149 475L205 475M166 475L166 525M63 525L63 575M166 576L166 626M114 458L114 495M102 586L102 638M126 586L126 638M35 440L35 462M193 440L193 462',{'stroke-width':1.9});
      targets.push(finish(t));
    }
    {
      const t=target(ctx,3,332,'dragon',435);
      region(ctx,t,'M0 615L228 615L228 650L0 650Z',634);
      region(ctx,t,'M62 470Q38 500 53 553Q21 528 9 552Q-3 578 24 595Q50 613 79 602Q104 621 137 609Q173 606 178 570L207 568L228 548L212 498L222 455L177 473L157 505Q156 474 145 465Z',548);
      region(ctx,t,'M64 400Q59 377 55 346Q77 351 85 364Q113 345 140 365Q145 344 165 332L159 386Q181 401 178 429Q212 430 209 449Q205 475 171 477L153 475Q140 490 116 485Q76 488 65 457Q43 439 64 400Z',415);
      accent(ctx,t,'M93 523Q112 504 137 523L148 577Q117 600 87 578Z','#ffe3a6',116,552);
      accent(ctx,t,'M175 497L218 465L208 501L224 529L202 531L215 551L178 548Z','#cfb2ed',193,518);
      line(ctx,t,'M67 399Q77 389 86 396M134 391Q146 384 154 394M168 454Q180 463 197 451M70 575L83 580M145 583L160 576M99 620L99 643M165 620L165 643M180 511L218 465M180 511L224 529M180 511L215 551M141 510Q154 525 148 541L161 539M18 572Q37 591 58 580M101 584L107 589M122 586L128 590',{'stroke-width':2});
      for(const [x,y] of [[85,418],[139,416]])ctx.svg('circle',{cx:t.x+x,cy:y,r:4,fill:ctx.ink},t.outlines);
      ctx.svg('circle',{cx:t.x+190,cy:441,r:2.4,fill:ctx.ink},t.outlines);
      targets.push(finish(t));
    }
    return targets;
  }
  Object.assign(window.PaintSceneArt, {
    kingdom:{palette:['#f5ae74','#91d5ac','#b7a1e6','#f2b0c7'],render:renderKingdom},
    squadron:{palette:['#a5c9f2','#b9a9e9','#86d6d1','#efbd9e'],render:renderSquadron},
    dungeon:{palette:['#b4a2e7','#8ed4d4','#e5b8dc','#e8cb8a'],render:renderDungeon}
  });
})();
