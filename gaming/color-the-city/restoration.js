(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', INK = '#4c5260';
  let state = null, lives = [], restored = new WeakSet();
  function add(tag, attrs, parent) {
    if (state.svg) return state.svg(tag, attrs, parent);
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, value));
    parent?.appendChild(node); return node;
  }
  function path(d, attrs, parent) {
    return add('path', {d, fill:'none', stroke:INK, 'stroke-width':1.6,
      'stroke-linecap':'round', 'stroke-linejoin':'round', ...attrs}, parent);
  }
  function clear() {
    lives.forEach(life => life.root.remove());
    lives = []; restored = new WeakSet(); state = null;
  }
  function reset({scene, variant = 0, parent, svg, reducedMotion = false}) {
    clear(); if (!parent) return;
    parent.replaceChildren();
    state = {scene, variant, parent, svg, reducedMotion:Boolean(reducedMotion)};
    parent.setAttribute('pointer-events', 'none'); parent.setAttribute('aria-hidden', 'true');
  }
  function flower(life, x, y, colour, phase) {
    const root = add('g', {class:'restored-flower'}, life.root), s = life.scale;
    path(`M${x} ${y}Q${x-4*s} ${y-17*s} ${x} ${y-30*s}`,
      {stroke:'#579f7b', 'stroke-width':2.4*s}, root);
    path(`M${x-s} ${y-9*s}q${-13*s} ${-15*s} ${-16*s} ${-5*s}q${6*s} ${8*s} ${16*s} ${5*s}`,
      {fill:'#9bca8d', stroke:'#579f7b', 'stroke-width':1.1*s}, root);
    const head = add('g', {}, root);
    for (let i=0;i<5;i++) {
      const a=i*Math.PI*2/5-Math.PI/2, cx=Math.cos(a)*6, cy=Math.sin(a)*6;
      add('ellipse', {cx,cy,rx:4.8,ry:6.1,transform:`rotate(${a*180/Math.PI+90} ${cx} ${cy})`,
        fill:colour,stroke:'#fff9e8','stroke-width':.8}, head);
    }
    add('circle',{r:3.7,fill:'#ffe197',stroke:'#d7b65c','stroke-width':.7},head);
    life.flowers.push({head,x,y:y-30*s,phase});
  }
  function bird(life,x,y,colour) {
    const root=add('g',{class:'restored-bird'},life.root);
    path('M-7 4-19 1-13 10Z',{fill:colour},root);
    add('ellipse',{cx:0,cy:3,rx:12,ry:8.2,fill:colour,stroke:INK,'stroke-width':1.5},root);
    add('circle',{cx:8,cy:-4,r:6.6,fill:colour,stroke:INK,'stroke-width':1.5},root);
    path('M14-5 21-1 14 1Z',{fill:'#efb56e',stroke:'#cb8b43','stroke-width':.8},root);
    add('circle',{cx:10,cy:-5.5,r:1.5,fill:'#35434e'},root);
    path('M-3 11-5 15m8-4 1 4',{'stroke-width':1.3},root);
    const wing=path('M-7 1Q-1-5 5 1Q1 8-5 7Z',{fill:'#fff7d4',stroke:'#687875','stroke-width':1},root);
    life.bird={root,wing,x:Math.max(26,Math.min(1174,x)),y:Math.max(326,y)};
  }
  function butterfly(life,x,y,colour) {
    const root=add('g',{class:'restored-butterfly'},life.root), wings=add('g',{},root);
    path('M0 0C-15-22-27-2-9 7C-22 21-1 25 0 7C1 25 22 21 9 7C27-2 15-22 0 0Z',
      {fill:colour,stroke:'#be88a1','stroke-width':1.1},wings);
    path('M0-5V13m0-14-4-6m4 6 4-6',{stroke:'#6d6272','stroke-width':1.4},root);
    life.butterfly={root,wings,x:Math.max(35,Math.min(1165,x)),y:Math.max(335,Math.min(650,y))};
  }
  function windows(life,target,point) {
    const nodes=target.outlines?.querySelectorAll('rect,circle') || [];
    [...nodes].filter(node=>{
      if(node.tagName==='rect') return +node.getAttribute('width')>=25 && +node.getAttribute('width')<=55
        && +node.getAttribute('height')>=25 && +node.getAttribute('height')<=55;
      const r=+node.getAttribute('r');return r>=16 && r<=22;
    }).slice(0,5).forEach(node=>{
      const g=add('g',{class:'restored-window'},life.root);
      if(node.tagName==='rect') {
        const x=+node.getAttribute('x'),y=+node.getAttribute('y'),w=+node.getAttribute('width'),h=+node.getAttribute('height');
        for(const col of [0,1]) for(const row of [0,1]) {
          const a=point(target,x+4+col*w/2,y+4+row*h/2),b=point(target,x+w/2-3+col*w/2,y+h/2-3+row*h/2);
          add('rect',{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(b.x-a.x),height:Math.abs(b.y-a.y),
            rx:2,fill:'#ffe9a8'},g);
        }
      } else {
        const c=point(target,+node.getAttribute('cx'),+node.getAttribute('cy')),r=(+node.getAttribute('r')-4)*life.scale;
        add('circle',{cx:c.x,cy:c.y,r,fill:'#ffe9a8'},g);
        path(`M${c.x-r} ${c.y}h${r*2}M${c.x} ${c.y-r}v${r*2}`,{stroke:INK,'stroke-width':1.6*life.scale},g);
      }
      life.windows.push(g);
    });
  }
  function chimney(life,x,y) {
    life.smoke=Array.from({length:3},(_,i)=>({el:add('ellipse',{cx:x,cy:y-12-i*19,rx:7+i*3,ry:8+i*3,
      fill:'#fff4df',stroke:'#dfceb8','stroke-width':.8,opacity:.7-i*.12},life.root),i}));
  }
  function orbit(life,target,point) {
    const center=point(target,target.x+target.width/2,473),rx=Math.min(149,target.hitWidth?target.hitWidth*.57:135*life.scale),ry=rx*.4;
    life.orbit={center,rx,ry,stars:[]};
    add('ellipse',{cx:center.x,cy:center.y,rx,ry,fill:'none',stroke:'#d7c3ef','stroke-width':1.4,opacity:.6,
      transform:`rotate(-16 ${center.x} ${center.y})`},life.root);
    for(let i=0;i<3;i++) {
      const el=path('M0-8 2.5-2.5 8 0 2.5 2.5 0 8-2.5 2.5-8 0-2.5-2.5Z',
        {fill:i%2?'#fff2b4':'#f4c6db',stroke:'#c8a5d4','stroke-width':.8},life.root);
      life.orbit.stars.push({el,phase:i*Math.PI*2/3});
    }
    life.moon=add('circle',{r:7*life.scale,fill:'#fff4c7',stroke:'#d9c996','stroke-width':1},life.root);
  }
  function restore({target,colour='#b9dfcf',worldPoint}) {
    if(!state || !target || restored.has(target) || lives.length>=4) return null;
    const point=worldPoint || ((b,x,y)=>b.layout?{x:x*b.layout.sx+b.layout.tx,y:y*b.layout.sy+b.layout.ty}:{x,y});
    const life={root:add('g',{class:'restored-life','data-object':target.placement?.dataset.object ?? lives.length,
      'data-life-age':0,opacity:0,'pointer-events':'none','aria-hidden':'true'},state.parent),age:0,
      scale:Math.min(1.2,Math.max(.8,Math.abs(target.layout?.sy || 1))),phase:lives.length*1.7+Number(state.variant)*.2,flowers:[],windows:[]};
    restored.add(target);lives.push(life);
    const center=point(target,target.x+target.width/2,target.top),base=point(target,target.x+target.width/2,650);
    const perchX=target.x+target.width*.68;
    const roofShape=target.roofKind==='dome'?Math.sqrt(1-.36*.36):1-.36;
    const top=target.surfaceAt?target.surfaceAt(perchX):target.top-(target.roofHeight || 0)*roofShape;
    const perch=point(target,perchX,top-15);
    const motif=Number(target.placement?.dataset.motif ?? target.group?.dataset.building ?? 0);
    if(state.scene==='planets') orbit(life,target,point);
    else if(state.scene==='forest') {
      bird(life,perch.x,perch.y,'#f7cf81');
      flower(life,base.x-39*life.scale,Math.min(707,base.y),colour,0);
      flower(life,base.x+41*life.scale,Math.min(707,base.y),'#f3b9d0',1.8);
    } else if(state.scene==='farm') {
      flower(life,base.x-47*life.scale,Math.min(707,base.y),'#f5bdce',0);
      flower(life,base.x+38*life.scale,Math.min(707,base.y),colour,1.7);
      butterfly(life,center.x+67*life.scale,center.y-7,'#ffe3a2');
    } else {
      windows(life,target,point);bird(life,perch.x,perch.y,'#a8dcd4');
      if(state.scene==='city' && motif===3 || state.scene==='village' && motif===0) {
        const vent=point(target,target.x+180,target.top-40);chimney(life,vent.x,vent.y);
      }
    }
    update(life);return life.root;
  }
  function update(life) {
    const reduced=state.reducedMotion,age=Math.max(0,life.age-(reduced ? .1 : 4.2));
    const progress=reduced?Number(life.age>=.1):Math.min(1,age/1.8),reveal=progress*progress*(3-2*progress);
    life.root.setAttribute('opacity',reveal);life.root.dataset.lifeAge=life.age.toFixed(3);
    life.root.dataset.revealed=progress>=1?'true':'false';
    life.flowers.forEach(f=>{
      const tilt=reduced?0:Math.sin(age*.9+f.phase)*4;
      f.head.setAttribute('transform',`translate(${f.x} ${f.y}) rotate(${tilt}) scale(${life.scale*(.15+.85*reveal)})`);
    });
    if(life.bird) {
      const b=life.bird,arrival=reduced?1:Math.min(1,age/1.8),offset=reduced?0:(1-arrival)*72;
      const rise=reduced?0:-Math.sin(arrival*Math.PI)*26+Math.sin(age*.8+life.phase)*1.2*arrival;
      b.root.setAttribute('transform',`translate(${b.x-offset} ${b.y+rise}) scale(${life.scale})`);
      b.wing.setAttribute('transform',`rotate(${reduced?0:arrival<1?Math.sin(age*16)*17:Math.sin(age*.7)*3} -3 2)`);
    }
    if(life.butterfly) {
      const b=life.butterfly,dx=reduced?0:Math.sin(age*.55+life.phase)*19,dy=reduced?0:Math.sin(age*.9)*7;
      b.root.setAttribute('transform',`translate(${b.x+dx} ${b.y+dy}) scale(${life.scale*.75})`);
      b.wings.setAttribute('transform',`scale(${reduced?1:.65+Math.pow(Math.sin(age*2.3),2)*.35} 1)`);
    }
    life.windows.forEach((el,i)=>el.setAttribute('opacity',reduced ? .9 : .83+Math.sin(age*.6+i*.7)*.08));
    life.smoke?.forEach(p=>p.el.setAttribute('transform',`translate(${reduced?0:Math.sin(age*.7+p.i)*5} ${reduced?0:-Math.sin(age*.45+p.i)*3})`));
    if(life.orbit) {
      const {center,rx,ry,stars}=life.orbit,theta=reduced ? .2 : age*.2;
      stars.forEach(({el,phase},i)=>{
        const a=theta+phase+life.phase,x=center.x+Math.cos(a)*rx,y=center.y+Math.sin(a)*ry-Math.cos(a)*rx*.26;
        el.setAttribute('transform',`translate(${x} ${y}) rotate(${reduced?0:age*8+i*22}) scale(${life.scale*(i===1 ? .8 : 1)})`);
      });
      const a=theta+life.phase+1.2;
      life.moon.setAttribute('cx',center.x+Math.cos(a)*rx);
      life.moon.setAttribute('cy',center.y+Math.sin(a)*ry-Math.cos(a)*rx*.26);
    }
  }
  function frame(dt) {
    if(!state || !Number.isFinite(dt) || dt<=0)return;
    lives.forEach(life=>{life.age+=dt;update(life);});
  }
  window.PaintRestoration={reset,restore,frame,clear};
})();

