const ABLY_KEY = 'cdtKhA.qjdiYA:nbUbeaXqiQWHgQF1F9Nn0glvP62CRod3LcbAQDWJaIE';
const $ = id => document.getElementById(id);
const canvas = $('aquarium');
const ctx = canvas.getContext('2d');
let role = '', room = '', ably, channel, selectedItem = 'plant', lastSend = 0;
let state = { hero: { x: .5, y: .45 }, bubbles: [], food: [], items: [] };

function code() { return Math.random().toString(36).slice(2, 7).toUpperCase(); }
$('randomRoom').onclick = () => $('room').value = code();
document.querySelectorAll('.role').forEach(button => button.onclick = () => start(button.dataset.role));
$('back').onclick = () => location.reload();
document.querySelectorAll('#touchTools button').forEach(button => button.onclick = () => {
  selectedItem = button.dataset.item;
  document.querySelectorAll('#touchTools button').forEach(b => b.classList.toggle('selected', b === button));
});

function start(nextRole) {
  room = ($('room').value.trim() || code()).replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase();
  role = nextRole; $('welcome').hidden = true; $('activity').hidden = false;
  $('roomBadge').textContent = `Code : ${room}`;
  const copy = { display:'Les élèves créent ensemble sur cet écran.', gaze:'Déplacez le regard pour guider le grand poisson.', switch:'Appuyez pour nourrir les poissons et créer des bulles.', touch:'Touchez l’eau pour ajouter un élément.' };
  $('instructions').textContent = copy[role];
  $('touchTools').hidden = role !== 'touch'; $('switchButton').hidden = role !== 'switch';
  $('gazePointer').style.display = role === 'gaze' ? 'block' : 'none';
  connect(); resize(); requestAnimationFrame(draw);
}

function connect() {
  if (!window.Ably) { $('status').textContent = 'Mode local'; return; }
  ably = new Ably.Realtime({ key: ABLY_KEY, clientId: `${role}-${code()}` });
  channel = ably.channels.get(`aquarium-ensemble:${room}`);
  channel.subscribe(message => apply(message.name, message.data));
  ably.connection.on('connected', () => $('status').textContent = '● Connecté');
  ably.connection.on('disconnected', () => $('status').textContent = 'Reconnexion…');
}
function publish(name, data) { if (channel) channel.publish(name, data); else apply(name, data); }
function apply(name, data={}) {
  if (name === 'move') state.hero = { x:data.x, y:data.y };
  if (name === 'bubble') for (let i=0;i<8;i++) state.bubbles.push({ x:data.x+(Math.random()-.5)*.08, y:.9, r:3+Math.random()*9, s:.001+Math.random()*.002 });
  if (name === 'food') state.food.push({ x:data.x, y:.08, s:.001+Math.random()*.001 });
  if (name === 'item') state.items.push(data);
  if (state.items.length > 80) state.items.shift();
}

function point(event) { const r=canvas.getBoundingClientRect(); return { x:(event.clientX-r.left)/r.width, y:(event.clientY-r.top)/r.height }; }
canvas.addEventListener('pointermove', event => {
  if (role !== 'gaze' || performance.now()-lastSend < 45) return;
  lastSend=performance.now(); const p=point(event); $('gazePointer').style.left=`${event.clientX}px`; $('gazePointer').style.top=`${event.clientY}px`; publish('move',p);
});
canvas.addEventListener('pointerdown', event => { if(role==='touch') publish('item',{...point(event), type:selectedItem}); if(role==='switch') switchAction(); });
function switchAction(){ const x=.2+Math.random()*.6; publish(Math.random()>.35?'bubble':'food',{x}); }
addEventListener('keydown', event => { if(role==='switch' && ['Space','Enter'].includes(event.code)){ event.preventDefault(); switchAction(); } });

function resize(){ canvas.width=innerWidth*devicePixelRatio; canvas.height=innerHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
addEventListener('resize',resize);
function emoji(char,x,y,size){ ctx.font=`${size}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(char,x,y); }
function draw(){
  const w=innerWidth,h=innerHeight,t=performance.now()/1000;
  const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#48c6d9');g.addColorStop(.25,'#087da2');g.addColorStop(1,'#043651');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#e5c47b';ctx.fillRect(0,h*.88,w,h*.12);
  ctx.globalAlpha=.12;ctx.fillStyle='white';for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(i*w/7,0);ctx.lineTo(i*w/7-120,h);ctx.lineTo(i*w/7+80,h);ctx.fill();}ctx.globalAlpha=1;
  state.items.forEach(item => { const icons={plant:'🌿',coral:'🪸',shell:'🐚',fish:'🐠'}; emoji(icons[item.type]||'🌿',item.x*w,item.y*h,item.type==='fish'?48:58); });
  state.bubbles.forEach(b=>{b.y-=b.s;ctx.strokeStyle='#dfffffcc';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x*w,b.y*h,b.r,0,7);ctx.stroke();});state.bubbles=state.bubbles.filter(b=>b.y>-.05);
  state.food.forEach(f=>{f.y+=f.s;emoji('●',f.x*w,f.y*h,15);});state.food=state.food.filter(f=>f.y<.9);
  const hx=state.hero.x*w,hy=state.hero.y*h;ctx.save();ctx.translate(hx,hy);ctx.scale(1+.04*Math.sin(t*4),1);emoji('🐟',0,0,90);ctx.restore();
  requestAnimationFrame(draw);
}
