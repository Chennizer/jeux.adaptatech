(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', INK = '#4c5260';
  const ORBIT_ANGLE = -16, ORBIT_COS = Math.cos(ORBIT_ANGLE*Math.PI/180), ORBIT_SIN = Math.sin(ORBIT_ANGLE*Math.PI/180);
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
    life.bird={root,wing,x:Math.max(26,Math.min(1174,x)),y:Math.max(30,Math.min(680,y))};
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
      transform:`rotate(${ORBIT_ANGLE} ${center.x} ${center.y})`},life.root);
    for(let i=0;i<3;i++) {
      const el=path('M0-8 2.5-2.5 8 0 2.5 2.5 0 8-2.5 2.5-8 0-2.5-2.5Z',
        {fill:i%2?'#fff2b4':'#f4c6db',stroke:'#c8a5d4','stroke-width':.8},life.root);
      life.orbit.stars.push({el,phase:i*Math.PI*2/3});
    }
    life.moon=add('circle',{r:7*life.scale,fill:'#fff4c7',stroke:'#d9c996','stroke-width':1},life.root);
  }
  function orbitPoint({center,rx,ry},angle) {
    const x=Math.cos(angle)*rx,y=Math.sin(angle)*ry;
    return {x:center.x+x*ORBIT_COS-y*ORBIT_SIN,y:center.y+x*ORBIT_SIN+y*ORBIT_COS};
  }
  function arcadeLife(life,target,point,colour) {
    const source=target.lifeAnchor || {x:target.x+target.width/2,y:target.top+25};
    const anchor=point(target,source.x,source.y),motif=target.motif || '';
    const x=Math.max(48,Math.min(1152,anchor.x));
    const y=Math.max(80,Math.min(state.scene==='squadron'?675:680,anchor.y));
    const root=add('g',{class:`restored-${state.scene}-${motif}`,transform:`translate(${x} ${y}) scale(${life.scale})`},life.root);
    life.arcade={root,x,y,motif,sparks:[],rings:[],flag:null};
    const scene=state.scene;
    if(scene==='kingdom' && motif==='castle') {
      path('M0 0V-42',{stroke:'#6a7589','stroke-width':2.5},root);
      const flag=path('M1-42H37L29-30 37-18H1Z',{fill:'#ff9bb8',stroke:'#c9799d','stroke-width':1.3},root);
      add('circle',{cx:0,cy:-45,r:3,fill:'#ffe4a1',stroke:'#b79a6a','stroke-width':1},root);
      life.arcade.flag=flag;
    } else if(scene==='squadron') {
      const engine=motif==='ship';
      for(let i=0;i<3;i++) {
        const ring=add('ellipse',{cx:0,cy:engine?11:0,rx:11+i*8,ry:engine?8+i*7:11+i*8,
          fill:i===0?'#c3f2fa':'none',stroke:i===0?'#a4dbe7':'#b1e9ee','stroke-width':1.4,opacity:.48-i*.12},root);
        life.arcade.rings.push({el:ring,index:i});
      }
      if(engine) path('M-8 9Q-12 23 0 33Q12 23 8 9Z',{fill:'#b9eff3',stroke:'#95c7dc','stroke-width':1.2,opacity:.65},root);
      else {
        add('circle',{r:5,fill:'#fff3bf',stroke:'#a3d4dc','stroke-width':1},root);
        path('M-15 0h-7m37 0h7M0-15v-7m0 37v7',{stroke:'#c4edf3','stroke-width':1.5},root);
      }
    } else {
      const dungeon=scene==='dungeon';
      if(dungeon) {
        add('ellipse',{rx:27,ry:19,fill:'#b9e8ed',opacity:.14},root);
        add('ellipse',{rx:17,ry:12,fill:'#fff0bd',opacity:.2},root);
      }
      const count=dungeon?5:3;
      for(let i=0;i<count;i++) {
        const el=path('M0-6 1.8-1.8 6 0 1.8 1.8 0 6-1.8 1.8-6 0-1.8-1.8Z',
          {fill:i%2?'#fff1b9':dungeon?'#c0eff2':colour,stroke:dungeon?'#acbddc':'#c6b38f','stroke-width':.8},root);
        life.arcade.sparks.push({el,index:i});
      }
      if(scene==='kingdom' && motif==='block') {
        const gem=path('M0-52 9-43 0-34-9-43Z',{fill:'#ffe49b',stroke:'#c3a16e','stroke-width':1.3},root);
        life.arcade.gem=gem;
      }
    }
  }
  function restore({target,colour='#b9dfcf',worldPoint}) {
    if(!state || !target || restored.has(target) || lives.length>=4) return null;
    const point=worldPoint || ((b,x,y)=>b.layout?{x:x*b.layout.sx+b.layout.tx,y:y*b.layout.sy+b.layout.ty}:{x,y});
    const life={root:add('g',{class:'restored-life','data-object':target.placement?.dataset.object ?? lives.length,
      'data-revealed':'false','data-scene':state.scene,opacity:0,'pointer-events':'none','aria-hidden':'true'},state.parent),age:0,reveal:0,
      scale:Math.min(1.2,Math.max(.8,Math.abs(target.layout?.sy || 1))),phase:lives.length*1.7+Number(state.variant)*.2,flowers:[],windows:[]};
    restored.add(target);lives.push(life);
    const center=point(target,target.x+target.width/2,target.top),base=point(target,target.x+target.width/2,650);
    const perchX=target.x+target.width*.68;
    const roofShape=target.roofKind==='dome'?Math.sqrt(1-.36*.36):1-.36;
    const top=target.surfaceAt?target.surfaceAt(perchX):target.top-(target.roofHeight || 0)*roofShape;
    const perch=point(target,perchX,top-15);
    const motif=Number(target.placement?.dataset.motif ?? target.group?.dataset.building ?? 0);
    if(['kingdom','squadron','dungeon'].includes(state.scene)) arcadeLife(life,target,point,colour);
    else if(state.scene==='planets') orbit(life,target,point);
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
        const source=target.chimney || {x:target.x+175,y:target.top-51};
        const vent=point(target,source.x,source.y);chimney(life,vent.x,vent.y);
      }
    }
    update(life);return life.root;
  }
  function update(life) {
    if (life.age < (state.reducedMotion ? .1 : 4.2)) return;
    const reduced=state.reducedMotion,age=Math.max(0,life.age-(reduced ? .1 : 4.2));
    const progress=reduced?Number(life.age>=.1):Math.min(1,age/1.8),reveal=progress*progress*(3-2*progress);
    if(life.reveal!==reveal) {
      life.root.setAttribute('opacity',reveal);life.reveal=reveal;
      if(progress>=1) life.root.dataset.revealed='true';
    }
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
    if(life.arcade) {
      const a=life.arcade;
      if(a.flag) a.flag.setAttribute('transform',`scale(${reduced?1:1+Math.sin(age*.85+life.phase)*.035} 1)`);
      if(a.gem) a.gem.setAttribute('transform',`translate(0 ${reduced?0:Math.sin(age*.8+life.phase)*2.5})`);
      a.rings.forEach(({el,index})=>{
        const pulse=reduced?1:1+Math.sin(age*.9+index*.6)*.045;
        el.setAttribute('transform',`scale(${pulse})`);
      });
      a.sparks.forEach(({el,index},i)=>{
        const theta=index*Math.PI*2/a.sparks.length+(reduced?0:age*.15)+life.phase;
        const radius=state.scene==='dungeon'?23:26;
        const sx=Math.cos(theta)*radius,sy=Math.sin(theta)*radius*.66-(state.scene==='kingdom'?12:0);
        const size=reduced?1:.88+Math.sin(age*.85+i*1.7)*.12;
        el.setAttribute('transform',`translate(${sx} ${sy}) scale(${size})`);
      });
    }
    if(life.orbit) {
      const {stars}=life.orbit,theta=reduced ? .2 : age*.2;
      stars.forEach(({el,phase},i)=>{
        const position=orbitPoint(life.orbit,theta+phase+life.phase);
        el.setAttribute('transform',`translate(${position.x} ${position.y}) rotate(${reduced?0:age*8+i*22}) scale(${life.scale*(i===1 ? .8 : 1)})`);
      });
      const position=orbitPoint(life.orbit,theta+life.phase+1.2);
      life.moon.setAttribute('cx',position.x);
      life.moon.setAttribute('cy',position.y);
    }
  }
  function frame(dt) {
    if(!state || !Number.isFinite(dt) || dt<=0)return;
    lives.forEach(life=>{
      if(state.reducedMotion && life.reveal===1) return;
      life.age+=dt;update(life);
    });
  }
  window.PaintRestoration={reset,restore,frame,clear};
})();

