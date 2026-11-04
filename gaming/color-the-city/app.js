(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SVG = 'http://www.w3.org/2000/svg';
  const text = {
    en: {
      games:'Switch games', language:'Language', eyebrow:'ONE BUTTON. A WORLD OF COLOUR.', title:'Colour the city.', description:'A little plane. A drop of paint. A city coming to life.', note:'At your own pace.\nOne colour at a time.', neighborhood:'THE COLOUR QUARTER', pause:'Pause', resume:'Continue', soundOff:'Sound off', soundOn:'Sound on', settings:'Settings', sceneCaption:'A quiet sky. A street full of possibilities.', progress:'Bringing the city to life', space:'SPACE', orSwitch:'or your switch · click · touch', step1:'Watch the plane', step1copy:'It crosses the sky all by itself.', step2:'Find your moment', step2copy:'One press, one drop of colour.', step3:'Bring the city to life', step3copy:'Every painted floor stays colourful.', footer:'No timer. No lost lives. Just the joy of making something.', prototype:'PLAYABLE PROTOTYPE', yourPace:'AT YOUR OWN PACE', settingsHint:'The game waits while you adjust things.', speed:'Flight speed', slow:'Gentle', normal:'Easygoing', fast:'Brisk', guide:'Aiming guide', guideHint:'A line shows where the paint will fall.', assist:'A helping hand', assistHint:'Drops near a building gently find their way to it.', done:'Done', start:'Let’s paint!', drop:'Drop some colour', replay:'Paint another city', readyTag:'READY FOR TAKEOFF', readyTitle:'A little colour goes a long way.', readyCopy:'Press Space, Enter, your switch, or the button to begin.', pausedTag:'TAKE YOUR TIME', pausedTitle:'Your city can wait.', pausedCopy:'Press your switch or Continue when you’re ready.', completeTag:'LOOK WHAT YOU MADE', completeTitle:'A brighter place, thanks to you.', completeCopy:'Press again to paint a fresh city.', initial:'Paint the grey floors. The plane always comes around again.', falling:'A little colour on its way…', hit:'A new splash of colour!', miss:'A splash on the street! Another pass is coming.', already:'This building is already full of colour.', win:'All 18 floors painted. Your city is complete!', paused:'Paused. Press again to continue.', sceneTitle:'Colour the City game', sceneDescription:'A plane flies over six buildings. Release paint above a building to colour one floor.', paintedLabel:'Painted floors', instructions:'How to play'
    },
    fr: {
      games:'Jeux pour switch', language:'Langue', eyebrow:'UN BOUTON, TOUT UN MONDE', title:'Colore la ville.', description:'Un petit avion. Une goutte de peinture. Une ville qui prend vie.', note:'À ton rythme.\nUne couleur à la fois.', neighborhood:'LE QUARTIER DES COULEURS', pause:'Pause', resume:'Continuer', soundOff:'Son désactivé', soundOn:'Son activé', settings:'Réglages', sceneCaption:'Un ciel tranquille. Des possibilités plein les rues.', progress:'La ville s’éveille', space:'ESPACE', orSwitch:'ou ta switch · clic · toucher', step1:'Regarde l’avion', step1copy:'Il traverse le ciel tout seul.', step2:'Appuie au bon moment', step2copy:'Une pression, une goutte de couleur.', step3:'Fais vivre la ville', step3copy:'Chaque étage peint reste en couleur.', footer:'Pas de chrono. Pas de vies perdues. Juste le plaisir de créer.', prototype:'PROTOTYPE JOUABLE', yourPace:'À TON RYTHME', settingsHint:'Le jeu attend pendant les réglages.', speed:'Vitesse de l’avion', slow:'Douce', normal:'Tranquille', fast:'Rapide', guide:'Guide de visée', guideHint:'Une ligne montre où la peinture tombera.', assist:'Coup de pouce', assistHint:'Les gouttes proches d’un immeuble le rejoignent.', done:'Terminé', start:'C’est parti !', drop:'Une goutte de couleur', replay:'Une nouvelle ville', readyTag:'PRÊT POUR LE DÉCOLLAGE', readyTitle:'Une goutte change tout.', readyCopy:'Appuie sur Espace, Entrée, ta switch ou le bouton pour commencer.', pausedTag:'PRENDS TON TEMPS', pausedTitle:'Ta ville peut attendre.', pausedCopy:'Appuie sur ta switch ou Continuer quand tu veux.', completeTag:'REGARDE TA CRÉATION', completeTitle:'Une ville plus belle, grâce à toi.', completeCopy:'Appuie à nouveau pour peindre une autre ville.', initial:'Peins les étages gris. L’avion revient toujours.', falling:'Une petite couleur en chemin…', hit:'Une nouvelle touche de couleur !', miss:'Une tache dans la rue ! L’avion va revenir.', already:'Cet immeuble est déjà plein de couleurs.', win:'Les 18 étages sont peints. Ta ville est terminée !', paused:'En pause. Appuie pour continuer.', sceneTitle:'Jeu Colore la ville', sceneDescription:'Un avion survole six immeubles. Lâche de la peinture au-dessus d’un immeuble pour peindre un étage.', paintedLabel:'Étages peints', instructions:'Comment jouer'
    },
    ja: {
      games:'スイッチゲーム', language:'言語', eyebrow:'ひとつのボタンで、色とりどりの世界へ', title:'街を彩ろう。', description:'小さな飛行機。一滴の絵の具。街が色づいていく。', note:'自分のペースで。\nひとつずつ、色を。', neighborhood:'いろどりの街', pause:'一時停止', resume:'続ける', soundOff:'音なし', soundOn:'音あり', settings:'設定', sceneCaption:'穏やかな空。可能性いっぱいの街。', progress:'街が色づいていく', space:'スペース', orSwitch:'スイッチ・クリック・タッチでも', step1:'飛行機を見よう', step1copy:'空を自動で飛んでいくよ。', step2:'タイミングを合わせよう', step2copy:'一回押すと、一滴の絵の具。', step3:'街を彩ろう', step3copy:'塗った階の色はそのまま残るよ。', footer:'時間制限もライフもなし。つくる楽しさを、自分のペースで。', prototype:'プレイできる試作版', yourPace:'自分のペースで', settingsHint:'設定中はゲームが止まります。', speed:'飛行機の速さ', slow:'ゆっくり', normal:'ふつう', fast:'はやい', guide:'ねらいのガイド', guideHint:'絵の具が落ちる場所を線で示します。', assist:'おたすけ', assistHint:'建物の近くに落ちた絵の具が建物に届きます。', done:'完了', start:'はじめよう！', drop:'色を落とす', replay:'新しい街を塗る', readyTag:'出発の準備ができたよ', readyTitle:'一滴の色で、街が変わる。', readyCopy:'スペース、エンター、スイッチ、またはボタンで開始。', pausedTag:'あせらずに', pausedTitle:'街は待っているよ。', pausedCopy:'準備ができたら、スイッチか「続ける」を押そう。', completeTag:'できあがり', completeTitle:'あなたの色で、明るい街に。', completeCopy:'もう一度押すと、新しい街を塗れるよ。', initial:'灰色の階を塗ろう。飛行機は何度でも戻ってくるよ。', falling:'絵の具が落ちていくよ…', hit:'新しい色が増えたよ！', miss:'道に色がついたね！次のチャンスを待とう。', already:'この建物はもう色いっぱい。', win:'18階すべて塗れたね。街の完成！', paused:'一時停止中。もう一度押すと続けられます。', sceneTitle:'街を彩ろうゲーム', sceneDescription:'6つの建物の上を飛行機が飛びます。建物の上で絵の具を落とすと、一階ずつ色がつきます。', paintedLabel:'塗った階', instructions:'遊び方'
    }
  };
  let lang = 'fr';
  try { const saved = localStorage.getItem('siteLanguage'); if (text[saved]) lang = saved; } catch (_) { /* Storage is optional. */ }
  let phase = 'ready';
  let planeX = 110;
  let lastTime = null;
  let soundEnabled = false;
  let audio;
  let feedbackKey = 'initial';
  let totalPainted = 0;
  let drops = [];
  let effects = [];
  let streetSplashes = [];
  let paletteIndex = 0;
  const heldKeys = new Set();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const palettes = [
    ['#e59a79','#e7bc62','#86afa0','#8eabc2','#b5a0bf','#dc9d9c'],
    ['#a2b87d','#d7a26e','#91b7c9','#d29fbb','#e7bd73','#8cb7aa']
  ];
  const buildings = [2,3,4,3,4,2].map((floors, index) => ({x:100 + index * 172, width:140, floors, painted:0, floorEls:[], windowEls:[], roof:null}));

  function svg(tag, attrs = {}, parent) {
    const node = document.createElementNS(SVG, tag);
    Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, value));
    if (parent) parent.appendChild(node);
    return node;
  }
  function buildCity() {
    $('buildings').replaceChildren();
    buildings.forEach((b, i) => {
      const g = svg('g', {'data-building':i}, $('buildings'));
      const top = 500 - b.floors * 57;
      b.painted = 0; b.floorEls = []; b.windowEls = [];
      svg('rect', {x:b.x+7,y:top+8,width:b.width,height:500-top,rx:5,fill:'#46655a',opacity:'.12'},g);
      svg('rect', {x:b.x,y:top,width:b.width,height:500-top,rx:5,fill:'#c4cbc2'},g);
      for (let floor = 0; floor < b.floors; floor++) {
        const y = 500 - (floor+1)*57;
        b.floorEls.push(svg('rect', {x:b.x+2,y:y+2,width:b.width-4,height:55,rx:3,fill:'#c4cbc2',class:'floor'},g));
        const windows = [];
        for (let col = 0; col < 3; col++) {
          const x = b.x+20+col*37;
          windows.push(svg('rect', {x,y:y+16,width:23,height:27,rx:2,fill:'#8fa5a0',class:'window'},g));
          svg('path', {d:`M${x+11.5} ${y+16}v27M${x} ${y+29}h23`,stroke:'#edf1df','stroke-width':1.4,opacity:'.75'},g);
          svg('rect', {x:x-3,y:y+43,width:29,height:3,rx:1,fill:'#fcf9ec',opacity:'.8'},g);
        }
        b.windowEls.push(windows);
        svg('line', {x1:b.x,y1:y+56,x2:b.x+b.width,y2:y+56,stroke:'#f8f5e5','stroke-width':2,opacity:'.7'},g);
      }
      b.roof = svg('rect', {x:b.x-5,y:top-8,width:b.width+10,height:11,rx:3,fill:'#8da39c'},g);
      svg('rect', {x:b.x+58,y:476,width:25,height:24,rx:3,fill:'#607e76'},g);
      svg('circle', {cx:b.x+76,cy:489,r:1.4,fill:'#f7db91'},g);
      svg('rect', {x:b.x-7,y:500,width:b.width+14,height:7,rx:2,fill:'#f8f5e5'},g);
      svg('path', {d:`M${b.x+18} ${top-8}v-12h15v12`,fill:'#a7b7a9'},g);
    });
    $('streetDetails').replaceChildren();
    [70,265,438,610,783,955,1142].forEach((x,i) => {
      const g=svg('g',{},$('streetDetails'));
      svg('rect',{x:x-3,y:478,width:6,height:45,rx:2,fill:'#6e8270'},g);
      svg('ellipse',{cx:x,cy:474,rx:18,ry:24,fill:i%2?'#80a58c':'#769b82'},g);
      svg('ellipse',{cx:x-7,cy:480,rx:12,ry:15,fill:'#8db095'},g);
    });
    for (const x of [322,838]) {
      svg('path',{d:`M${x} 519h44m-39 0v9m34-9v9m-39-20h44v7h-44z`,stroke:'#728d7f','stroke-width':3,fill:'#b79b75','stroke-linecap':'round'},$('streetDetails'));
    }
  }
  function announce(key) { feedbackKey = key; $('feedback').textContent = text[lang][key]; }
  function setPhase(next) { phase = next; $('playSurface').dataset.state=phase; updateUI(); }
  function updateUI() {
    const t = text[lang];
    $('actionLabel').textContent = t[phase==='ready'?'start':phase==='paused'?'resume':phase==='complete'?'replay':'drop'];
    $('pause').disabled=phase==='ready'||phase==='complete';
    $('pause').textContent=t[phase==='paused'?'resume':'pause'];
    $('sound').textContent=t[soundEnabled?'soundOn':'soundOff'];
    $('sound').setAttribute('aria-pressed',String(soundEnabled));
    $('sceneMessage').hidden=phase==='playing';
    if (phase!=='playing') {
      const prefix=phase==='complete'?'complete':phase==='paused'?'paused':'ready';
      $('messageTag').textContent=t[prefix+'Tag'];
      $('messageTitle').textContent=t[prefix+'Title'];
      $('messageCopy').textContent=t[prefix+'Copy'];
    }
    $('progressText').textContent=`${totalPainted} / 18`;
    $('progress').value=totalPainted;
  }
  function translate() {
    document.documentElement.lang=lang;
    document.title=text[lang].title+' · Adaptatech';
    $('language').value=lang;
    document.querySelectorAll('[data-i18n]').forEach(el=> { el.textContent=text[lang][el.dataset.i18n]; });
    document.querySelector('[data-i18n="note"]').style.whiteSpace='pre-line';
    $('scene-title').textContent=text[lang].sceneTitle;
    $('scene-description').textContent=text[lang].sceneDescription;
    $('progress').setAttribute('aria-label',text[lang].paintedLabel);
    document.querySelector('.how-to').setAttribute('aria-label',text[lang].instructions);
    announce(feedbackKey); updateUI();
  }
  function tone(success=false) {
    if(!soundEnabled) return;
    try {
      audio ||= new (window.AudioContext||window.webkitAudioContext)();
      if(audio.state==='suspended') audio.resume().catch(()=>{});
      const now=audio.currentTime;
      const oscillator=audio.createOscillator(), gain=audio.createGain();
      oscillator.type='sine'; oscillator.frequency.setValueAtTime(success?523.25:349.23,now);
      oscillator.frequency.exponentialRampToValueAtTime(success?783.99:440,now+.13);
      gain.gain.setValueAtTime(.0001,now); gain.gain.exponentialRampToValueAtTime(.07,now+.015); gain.gain.exponentialRampToValueAtTime(.0001,now+.3);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now+.32);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    } catch (_) { /* Visual play remains available when audio is unavailable. */ }
  }
  function drawPlane() {
    $('plane').setAttribute('transform',`translate(${planeX} 115)`);
    const target = targetAt(planeX);
    const bottom=target?500-target.floors*57-10:500;
    $('aimGuide').setAttribute('x1',planeX); $('aimGuide').setAttribute('x2',planeX); $('aimGuide').setAttribute('y2',bottom);
    $('aimMark').setAttribute('cx',planeX); $('aimMark').setAttribute('cy',bottom);
    $('aimGuide').style.display=$('guide').checked?'':'none'; $('aimMark').style.display=$('guide').checked?'':'none';
  }
  function targetAt(x) {
    // Assistance widens only the landing area; the plane never changes speed.
    const margin=$('assist').checked?14:0;
    return buildings.find(b=>x>=b.x-margin&&x<=b.x+b.width+margin);
  }
  function splash(x,y,color) {
    const g=svg('g',{},$('effects'));
    svg('ellipse',{cx:x,cy:y,rx:22,ry:5,fill:color,opacity:'.8'},g);
    if(!reducedMotion.matches) {
      for(let i=0;i<5;i++) svg('circle',{cx:x+(i-2)*9,cy:y-7-Math.sin(i)*9,r:3,fill:color},g);
    }
    effects.push({el:g,life:.6});
  }
  function land(drop) {
    const b=drop.target;
    if(b&&b.painted<b.floors) {
      const floor=b.floors-b.painted-1;
      const color=palettes[paletteIndex][buildings.indexOf(b)];
      b.floorEls[floor].setAttribute('fill',color);
      b.floorEls[floor].classList.add('painted');
      b.windowEls[floor].forEach(w=>w.setAttribute('fill','#fff0b5'));
      b.roof.setAttribute('fill',color);
      b.painted++;totalPainted++;
      splash(Math.max(b.x+10,Math.min(b.x+b.width-10,drop.x)),drop.landingY,color);
      tone(true); announce('hit');updateUI();
      if(totalPainted===18) { setPhase('complete');announce('win'); }
    } else {
      splash(drop.x,drop.landingY,'#dba171');
      if(!b) {
        const el=svg('ellipse',{cx:drop.x,cy:532,rx:13,ry:3,fill:'#dca885',opacity:'.6'},$('streetDetails'));
        streetSplashes.push(el);if(streetSplashes.length>20)streetSplashes.shift().remove();
      }
      announce(b?'already':'miss');
    }
  }
  function startCity() {
    totalPainted=0; drops.forEach(d=>d.el.remove());drops=[];
    effects.forEach(e=>e.el.remove());effects=[];streetSplashes=[];
    buildCity();planeX=110;drawPlane();setPhase('playing');announce('initial');
  }
  function activate() {
    if($('settings').open || document.hidden) return;
    if(phase==='ready') { startCity();return; }
    if(phase==='complete') { paletteIndex=(paletteIndex+1)%palettes.length; startCity();return; }
    if(phase==='paused') { setPhase('playing');announce('initial');return; }
    // Each rising switch press releases one drop. Holding never repeats.
    const target=targetAt(planeX);
    const landingY=target?500-target.floors*57-8:531;
    const el=svg('path',{d:'M0-11C-3-6-8-1-8 4A8 8 0 0 0 8 4C8-1 3-6 0-11Z',fill:target?palettes[paletteIndex][buildings.indexOf(target)]:'#e6b562',stroke:'#fff8e6','stroke-width':2},$('drops'));
    el.setAttribute('transform',`translate(${planeX} 145)`);
    drops.push({x:planeX,y:145,target,landingY,el});tone();announce('falling');
  }
  function pause() {
    if(phase==='playing') {setPhase('paused');announce('paused');}
  }
  function frame(time) {
    const dt=lastTime===null?0:Math.min((time-lastTime)/1000,.05);
    lastTime=time;
    if(phase==='playing') {
      planeX+=Number($('speed').value)*dt;
      if(planeX>1280)planeX=-80;
      drawPlane();
      // Iterate a snapshot so several drops can land without losing any.
      const active=drops; drops=[];
      active.forEach(drop=> {
        if(phase!=='playing') { drop.el.remove(); return; }
        drop.y+=390*dt;
        if(drop.y>=drop.landingY) {drop.el.remove();land(drop);}
        else {drop.el.setAttribute('transform',`translate(${drop.x} ${drop.y})`);drops.push(drop);}
      });
      if(phase==='complete') { drops.forEach(drop=>drop.el.remove()); drops=[]; }
    }
    // Effects finish even when a completed city has stopped the plane.
    if(phase!=='paused') effects=effects.filter(effect=> {
      effect.life-=dt;effect.el.setAttribute('opacity',Math.max(0,effect.life/.6));
      if(effect.life<=0){effect.el.remove();return false;}return true;
    });
    requestAnimationFrame(frame);
  }
  document.addEventListener('keydown',event=> {
    if(event.code!=='Space'&&event.code!=='Enter'&&event.code!=='NumpadEnter')return;
    const control=event.target.closest('button,a,input,select,textarea,[contenteditable="true"]');
    if($('settings').open || (control&&control!==$('mainAction')))return;
    event.preventDefault();
    if(event.repeat||heldKeys.has(event.code))return;
    heldKeys.add(event.code);activate();
  });
  document.addEventListener('keyup',event=>heldKeys.delete(event.code));
  [$('playSurface'),$('mainAction')].forEach(el=> {
    el.addEventListener('pointerdown',event=> {
      if(!event.isPrimary||event.button!==0)return;
      event.preventDefault();activate();$('mainAction').focus({preventScroll:true});
    });
  });
  // Assistive software may dispatch a click without a preceding pointer event.
  $('mainAction').addEventListener('click',event=>{if(event.detail===0)activate();});
  $('pause').addEventListener('click',()=>{
    if(phase==='playing')pause();else if(phase==='paused')activate();
    $('mainAction').focus({preventScroll:true});
  });
  $('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;updateUI();tone();$('mainAction').focus({preventScroll:true});});
  $('settingsButton').addEventListener('click',()=>{pause();$('settings').showModal();});
  $('closeSettings').addEventListener('click',()=>{
    $('settings').close();$('mainAction').focus({preventScroll:true});
  });
  $('settings').addEventListener('close',()=>{$('mainAction').focus({preventScroll:true});});
  $('guide').addEventListener('change',drawPlane);
  $('assist').addEventListener('change',drawPlane);
  $('language').addEventListener('change',event=> {
    lang=event.target.value;try{localStorage.setItem('siteLanguage',lang);}catch(_){} translate();$('mainAction').focus({preventScroll:true});
  });
  window.addEventListener('blur',()=>{heldKeys.clear();pause();});
  document.addEventListener('visibilitychange',()=>{heldKeys.clear();lastTime=null;if(document.hidden)pause();});
  buildCity();translate();drawPlane();requestAnimationFrame(frame);
})();
