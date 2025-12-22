  (() => {
    /* =======================
       ASSETS
    ======================= */
    const BG_SRC = "../../images/samurai/lampbg.png";

    // Pointer image (square, per your update)
    const POINTER_SRC = "../../images/samurai/chi.png";

    // Moonrock shards (random)
    const ROCK_SRCS = [
      "../../images/samurai/moonrock1.png",
      "../../images/samurai/moonrock2.png",
      "../../images/samurai/moonrock3.png",
    ];

    // Moon HUD icon (add an icon file here)
    const MOON_ICON_SRC = "../../images/samurai/transparentchi.png";

    // SFX
    const SFX_RELEASE = "../../sounds/samurai/energyball.mp3";
    const SFX_IMPACT_SRCS = [
      "../../sounds/samurai/spacerockexplosion1.mp3",
      "../../sounds/samurai/spacerockexplosion2.mp3",
    ];

    /* =======================
       TUNABLES
    ======================= */
    const MIN_DIAMETER = 100;
    const MAX_DIAMETER = 200;
    const DWELL_MS     = 2000;
    const DECAY_PER_SEC= 0.5;
    const ENTRY_GRACE_MS = 200;

    // Spawn area (bottom third)
    const SPAWN_X_MIN_FRAC = 0.20;
    const SPAWN_X_MAX_FRAC = 0.80;
    const SPAWN_Y_MIN_FRAC = 0.68;
    const SPAWN_Y_MAX_FRAC = 0.90;

    // Launch path → to the moon (constant speed along curve)
    const LAUNCH_SPEED_PX  = 360;   // px/s
    const END_RADIUS       = 10;    // size at the moon
    const BEZIER_PEAK      = 0.34;  // arc height (fraction of screen)
    const RESPAWN_DELAY_MS = 2500;  // wait before next orb

    // For glow stops
    const BALL_RGB       = "120,220,210";

    // Local jitter only
    const ORB_SHAKE_MAX  = 8;
    const ORB_SHAKE_FX   = 23, ORB_SHAKE_FY = 17;

    // Audio (crescendo while charging)
    const HUM_GAIN_MAX   = 0.6;

    // Moon (bigger + designed halo)
    const MOON_R         = 140;
    const MOON_GLOW_R    = 560;
    const MOON_X_FRAC    = 0.78;
    const MOON_Y_FRAC    = 0.24;

    // Impact FX
    const IMPACT_PETALS  = 180;
    const IMPACT_SPEED   = 460;
    const IMPACT_LIFE    = 1.9;
    const SHOCKWAVE_MAX_R= 340;
    const FLASH_MAX_ALPHA= 0.7;

    // Craters
    const MAX_CRATERS      = 24;
    const CRATER_FADE_MS   = 250;
    const CRATER_R_MIN_FR  = 0.06;
    const CRATER_R_MAX_FR  = 0.14;
    const CRATER_MARGIN_FR = 0.04;

    // Moon-only shake — STRONGER and SLOWER
    const SHAKE_STIFFNESS = 8;
    const SHAKE_DAMPING   = 5;
    const SHAKE_IMPULSE   = 240;
    let mShake = { ox: 0, oy: 0, vx: 0, vy: 0 };

    /* ==== Energy Sphere Look (no border) ==== */
    const LIGHT_DIR = { x: -0.6, y: -0.8 }; // normalized later
    const CORE_COLOR      = { r:255, g:255, b:255 };
    const MID_COLOR       = { r:160, g:230, b:255 };
    const EDGE_COLOR      = { r: 70, g:150, b:210 };
    const AURA_COLOR      = { r:120, g:220, b:255 };
    const RING_COUNT      = 3;
    const RING_ALPHA      = 0.18;
    const RING_PULSE_HZ   = 1.0;

    // Inflow particles: near-rim and outer ring
    const INFLOW_RATE      = 60;
    const INFLOW_MAX       = 260;
    const INFLOW_ALPHA     = 0.55;
    const INFLOW_INNER_MIN = 0.90;
    const INFLOW_INNER_MAX = 1.20;
    const INFLOW_OUTER_MIN = 1.40;
    const INFLOW_OUTER_MAX = 2.30;

    // Pointer sizing
    const POINTER_PX_MAX = 120;      // hard cap
    const POINTER_BASE_PX = 96;      // nominal size before breathing/charge
    const POINTER_BREATH = 0.04;     // ±4% breathing
    const POINTER_CHARGE_SCALE = 0.15; // up to +15% with full charge

    // Hover / charge zone tuning
    const HOVER_RADIUS_MULT   = 1.30; // 1.0 = exact ball radius; 1.3 = +30% larger
    const HOVER_PAD_PX        = 48;   // extra fixed pixels beyond the scaled radius
    const CHARGE_EDGE_FALLOFF = 0.6;  // 0..1 min charge-rate at the outer hover edge

    /* =======================
       SETUP
    ======================= */
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const bgImg = new Image(); bgImg.src = BG_SRC;

    // Pointer image
    const pointerImg = new Image(); pointerImg.src = POINTER_SRC;

    // Load moonrock images
    const rockImgs = ROCK_SRCS.map(src => { const im = new Image(); im.src = src; return im; });

    // Moon HUD icon
    const moonIcon = new Image(); moonIcon.src = MOON_ICON_SRC;

    // Audio
    const sfxRelease = new Audio(SFX_RELEASE); sfxRelease.volume = 0.7;
    const sfxImpactClips = SFX_IMPACT_SRCS.map(p => { const a = new Audio(p); a.volume = 0.75; return a; });
    const play = a => { try { a.currentTime = 0; a.play(); } catch(_){} };
    const playImpact = () => {
      const i = (Math.random() * sfxImpactClips.length) | 0;
      play(sfxImpactClips[i]);
    };

    const rand  = (a,b)=>a+Math.random()*(b-a);
    const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
    const nowS  = ()=> performance.now()/1000;

    // normalize light dir
    (function(){ const L = Math.hypot(LIGHT_DIR.x, LIGHT_DIR.y)||1; LIGHT_DIR.x/=L; LIGHT_DIR.y/=L; })();

    // Pointer / eye-gaze
    const pointer = { x:-9999, y:-9999, px:-9999, py:-9999, moved:0, inside:false };
    canvas.addEventListener('pointermove', e=>{
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (canvas.width / r.width);
      const y = (e.clientY - r.top ) * (canvas.height / r.height);
      if (pointer.px !== -9999) pointer.moved = Math.hypot(x-pointer.px, y-pointer.py);
      pointer.x=x; pointer.y=y; pointer.px=x; pointer.py=y; pointer.inside=true;
    });
    canvas.addEventListener('pointerleave', ()=> pointer.inside=false);

    // Moon position (responsive)
    let moon = { x: W*MOON_X_FRAC, y: H*MOON_Y_FRAC };
    function resize(){
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      moon.x = W*MOON_X_FRAC; moon.y = H*MOON_Y_FRAC;
      if (orb && !launching){
        orb.cx = clamp(orb.cx, W*SPAWN_X_MIN_FRAC, W*SPAWN_X_MAX_FRAC);
        orb.cy = clamp(orb.cy, H*SPAWN_Y_MIN_FRAC, H*SPAWN_Y_MAX_FRAC);
      }
    }
    window.addEventListener('resize', resize);

    /* =======================
       AUDIO — charging hum
    ======================= */
    let audioCtx=null, masterGain=null;
    let chargeGain=null, filter=null, osc1=null, osc2=null, o1g=null, o2g=null;

    function setupAudio(){
      audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain(); masterGain.gain.value = 0.9; masterGain.connect(audioCtx.destination);

      osc1 = audioCtx.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.value = 90;
      osc2 = audioCtx.createOscillator(); osc2.type = 'triangle';  osc2.frequency.value = 180;

      o1g = audioCtx.createGain(); o1g.gain.value = 0.35;
      o2g = audioCtx.createGain(); o2g.gain.value = 0.25;

      filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 700; filter.Q.value = 0.7;

      chargeGain = audioCtx.createGain(); chargeGain.gain.value = 0.0;

      osc1.connect(o1g); osc2.connect(o2g);
      o1g.connect(filter); o2g.connect(filter);
      filter.connect(chargeGain); chargeGain.connect(masterGain);

      osc1.start(); osc2.start();
    }
    function updateHum(level){
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      const gTarget = clamp(HUM_GAIN_MAX * Math.pow(level,1.15), 0, HUM_GAIN_MAX);
      chargeGain.gain.setTargetAtTime(gTarget, t, 0.06);

      const f1 = 90  + (240-90)  * level;
      const f2 = 180 + (520-180) * level;
      const ff = 700 + (4200-700)* level;
      osc1.frequency.setTargetAtTime(f1, t, 0.05);
      osc2.frequency.setTargetAtTime(f2, t, 0.05);
      filter.frequency.setTargetAtTime(ff, t, 0.08);
    }
    function cutHumPunch(){
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      const cur = chargeGain.gain.value || 0.0001;
      chargeGain.gain.setValueAtTime(cur, t);
      chargeGain.gain.exponentialRampToValueAtTime(Math.max(0.001, cur*1.6), t+0.05);
      chargeGain.gain.exponentialRampToValueAtTime(0.0001, t+0.18);
      filter.frequency.setTargetAtTime(6000, t, 0.03);
    }

    /* =======================
       ORB (single)
    ======================= */
    let orb = null;            // {cx,cy,charge,inZone,enterMs,launching,launchT0,startR,trail,renderR, path, s}
    let launching = false;
    let respawnAtMs = 0;

    function spawnOrb(){
      orb = {
        cx: W*rand(SPAWN_X_MIN_FRAC, SPAWN_X_MAX_FRAC),
        cy: H*SPAWN_Y_MIN_FRAC + rand(0, (H*SPAWN_Y_MAX_FRAC - H*SPAWN_Y_MIN_FRAC)),
        charge: 0, inZone:false, enterMs:0,
        launching:false, launchT0:0, startR:MIN_DIAMETER*0.5,
        trail: [], renderR: MIN_DIAMETER*0.5,
        path: null, s: 0
      };
    }
    function radiusFromCharge(o){ return (MIN_DIAMETER + (MAX_DIAMETER - MIN_DIAMETER)*o.charge) * 0.5; }

    /* =======================
       IMPACT FX
    ======================= */
    const shards=[];
    function burstAt(x,y){
      const tBorn = nowS();
      for (let i=0;i<IMPACT_PETALS;i++){
        const a = Math.random()*Math.PI*2;
        const sp= IMPACT_SPEED*(0.4+0.6*Math.random());
        const size=rand(24,72);
        shards.push({
          x, y, w:size, h:size, ang:rand(-Math.PI,Math.PI),
          vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - rand(60,120),
          rot:rand(-1.6,1.6), born:tBorn, life:IMPACT_LIFE,
          img: rockImgs[(Math.random()*rockImgs.length)|0]
        });
      }
    }
    let flashLife=0, flashT=0, shockLife=0, shockT=0, shockX=0, shockY=0;
    function flash(a=FLASH_MAX_ALPHA, life=0.16){ flashLife=life; flashT=0; }
    function shock(cx,cy,life=0.9){ shockLife=life; shockT=0; shockX=cx; shockY=cy; }

    /* =======================
       CRATERS
    ======================= */
    const craters = [];
    function addCraterFromImpact() {
      let ang = -Math.PI/2;
      if (orb && orb.trail && orb.trail.length >= 2) {
        const a = orb.trail[orb.trail.length - 1];
        const b = orb.trail[orb.trail.length - 2];
        ang = Math.atan2(a.y - b.y, a.x - b.x);
      }
      const rFrac = rand(CRATER_R_MIN_FR, CRATER_R_MAX_FR);
      const distMax = Math.max(0, 1 - rFrac - CRATER_MARGIN_FR);
      const dist = rand(0.10, distMax);
      craters.push({ ang, dist, rFrac, bornMs: performance.now() });
      if (craters.length > MAX_CRATERS) craters.shift();
    }

    function drawCraters() {
      if (!craters.length) return;
      const LVX = -0.5, LVY = -0.9;
      const lvLen = Math.hypot(LVX, LVY) || 1;
      const lx = LVX / lvLen, ly = LVY / lvLen;
      const nowMs = performance.now();

      for (const c of craters) {
        const age = nowMs - c.bornMs;
        const k = Math.min(1, age / CRATER_FADE_MS);
        const scale = 0.7 + 0.3 * k;
        const alpha = k;

        const cx = moon.x + Math.cos(c.ang) * c.dist * MOON_R;
        const cy = moon.y + Math.sin(c.ang) * c.dist * MOON_R;
        const r  = c.rFrac * MOON_R * scale;

        const g = ctx.createRadialGradient(
          cx - (lx * r * 0.25), cy - (ly * r * 0.25), r * 0.15,
          cx, cy, r
        );
        g.addColorStop(0, `rgba(185,190,205,${0.45*alpha})`);
        g.addColorStop(1, `rgba(160,165,185,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();

        const shadowAng = Math.atan2(-ly, -lx);
        ctx.strokeStyle = `rgba(90,100,130,${0.20*alpha})`;
        ctx.lineWidth = Math.max(1, r * 0.12);
        ctx.beginPath();
        ctx.arc(cx, cy, r, shadowAng - 0.9, shadowAng + 0.9);
        ctx.stroke();

        const lightAng = Math.atan2(ly, lx);
        ctx.strokeStyle = `rgba(255,255,255,${0.12*alpha})`;
        ctx.lineWidth = Math.max(1, r * 0.08);
        ctx.beginPath();
        ctx.arc(cx, cy, r, lightAng - 0.9, lightAng + 0.9);
        ctx.stroke();
      }
    }

    /* =======================
       MOON SHAKE HELPERS
    ======================= */
    function moonKick(ix, iy, power = 1) {
      const len = Math.hypot(ix, iy) || 1;
      const ux = ix / len, uy = iy / len;
      mShake.vx += ux * SHAKE_IMPULSE * power;
      mShake.vy += uy * SHAKE_IMPULSE * power;
    }
    function updateMoonShake(dt) {
      mShake.vx += (-SHAKE_STIFFNESS * mShake.ox - SHAKE_DAMPING * mShake.vx) * dt;
      mShake.vy += (-SHAKE_STIFFNESS * mShake.oy - SHAKE_DAMPING * mShake.vy) * dt;
      mShake.ox += mShake.vx * dt;
      mShake.oy += mShake.vy * dt;
      if (Math.abs(mShake.ox) < 0.01) mShake.ox = 0;
      if (Math.abs(mShake.oy) < 0.01) mShake.oy = 0;
    }

    /* =======================
       LEGACY HELPERS (kept)
    ======================= */
    function orbJitter(charge01){
      const t = performance.now()/1000;
      const amp = ORB_SHAKE_MAX * Math.pow(charge01,1.2);
      const ox = Math.sin(t*ORB_SHAKE_FX*2*Math.PI + 0.31) * amp;
      const oy = Math.cos(t*ORB_SHAKE_FY*2*Math.PI + 1.13) * amp * 0.8;
      return [ox, oy];
    }

    /* =======================
       MOON + DESIGNED HALO
    ======================= */
    function drawMoonHaloLayers(){
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      let g = ctx.createRadialGradient(moon.x, moon.y, MOON_R*0.8, moon.x, moon.y, MOON_GLOW_R);
      g.addColorStop(0.00, 'rgba(255,244,220,0.22)');
      g.addColorStop(0.45, 'rgba(230,240,255,0.10)');
      g.addColorStop(1.00, 'rgba(190,210,255,0.00)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(moon.x, moon.y, MOON_GLOW_R, 0, Math.PI*2); ctx.fill();

      const coronaR = MOON_R * 1.35;
      g = ctx.createRadialGradient(moon.x, moon.y, MOON_R*0.95, moon.x, moon.y, coronaR);
      g.addColorStop(0.00, 'rgba(255,248,235,0.42)');
      g.addColorStop(1.00, 'rgba(255,248,235,0.00)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(moon.x, moon.y, coronaR, 0, Math.PI*2); ctx.fill();

      ctx.save();
      ctx.translate(moon.x, moon.y);
      ctx.rotate(-0.12);
      ctx.scale(1.35, 0.85);
      const ellR = MOON_R * 2.4;
      g = ctx.createRadialGradient(0, 0, MOON_R*0.9, 0, 0, ellR);
      g.addColorStop(0.00, 'rgba(255,240,210,0.10)');
      g.addColorStop(1.00, 'rgba(180,200,255,0.00)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, ellR, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = Math.max(1, MOON_R * 0.04);
      ctx.beginPath(); ctx.arc(moon.x, moon.y, MOON_R * 1.05, 0, Math.PI*2); ctx.stroke();

      const RAY_COUNT = 6;
      for (let i=0;i<RAY_COUNT;i++){
        const ang = i * (Math.PI / RAY_COUNT);
        ctx.save();
        ctx.translate(moon.x, moon.y);
        ctx.rotate(ang + 0.2);
        const grad = ctx.createLinearGradient(0, 0, MOON_R * 3.2, 0);
        grad.addColorStop(0, 'rgba(255,240,210,0.08)');
        grad.addColorStop(1, 'rgba(255,240,210,0.00)');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.22;
        ctx.fillRect(0, -1.5, MOON_R * 3.2, 3);
        ctx.restore();
      }

      ctx.restore();
    }

    function drawMoon(){
      ctx.save();
      ctx.translate(mShake.ox, mShake.oy);
      drawMoonHaloLayers();
      ctx.save();
      ctx.fillStyle = 'rgb(245,245,250)';
      ctx.beginPath(); ctx.arc(moon.x, moon.y, MOON_R, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      drawCraters();
      ctx.restore();
    }

    /* =======================
       BACKGROUND + FX
    ======================= */
    function drawBackground(){
      if (bgImg.complete && bgImg.naturalWidth>0){
        const iw=bgImg.width, ih=bgImg.height;
        const sc=Math.max(W/iw, H/ih);
        ctx.drawImage(bgImg, (W-iw*sc)/2, (H-ih*sc)/2, iw*sc, ih*sc);
      } else {
        ctx.fillStyle="#041017"; ctx.fillRect(0,0,W,H);
      }
    }

    function drawShards(){
      const t=nowS();
      for (let i=shards.length-1; i>=0; i--){
        const s = shards[i];
        const a = Math.max(0, 1 - (t - s.born)/s.life);
        ctx.save(); ctx.globalAlpha = a;
        ctx.translate(s.x, s.y); ctx.rotate(s.ang);
        const img = s.img;
        if (img && img.complete && img.naturalWidth>0) {
          ctx.drawImage(img, -s.w/2, -s.h/2, s.w, s.h);
        }
        ctx.restore();
        if (a<=0) shards.splice(i,1);
      }
    }
    function drawFlash(){
      if (flashLife<=0) return;
      const p = Math.min(1, flashT/flashLife);
      const a = FLASH_MAX_ALPHA*(1-p);
      if (a<=0.01) return;
      ctx.save(); ctx.fillStyle=`rgba(255,255,255,${a})`; ctx.fillRect(0,0,W,H); ctx.restore();
    }
    function drawShockwave(){
      if (shockLife<=0) return;
      const p = Math.min(1, shockT/shockLife);
      const r = SHOCKWAVE_MAX_R*p;
      const a = 0.35*(1-p);
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      ctx.strokeStyle=`rgba(255,255,255,${a})`;
      ctx.lineWidth = 6*(1-p);
      ctx.beginPath(); ctx.arc(shockX, shockY, r, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }

    /* =======================
       CONSTANT-SPEED PATH HELPERS
    ======================= */
    function bezierPoint(p0, p1, p2, t){
      const u = 1 - t;
      const x = u*u*p0.x + 2*u*t*p1.x + t*t*p2.x;
      const y = u*u*p0.y + 2*u*t*p1.y + t*t*p2.y;
      return { x, y };
    }
    function makePathLUT(p0, p1, p2, segments = 260){
      const ts = [], xs = [], ys = [], cum = [];
      let total = 0;
      let prev = bezierPoint(p0, p1, p2, 0);
      ts.push(0); xs.push(prev.x); ys.push(prev.y); cum.push(0);
      for (let i=1;i<=segments;i++){
        const t = i/segments;
        const p = bezierPoint(p0, p1, p2, t);
        total += Math.hypot(p.x - prev.x, p.y - prev.y);
        ts.push(t); xs.push(p.x); ys.push(p.y); cum.push(total);
        prev = p;
      }
      return { ts, xs, ys, cum, total };
    }
    function samplePathByS(lut, s){
      const target = Math.max(0, Math.min(lut.total, s));
      let lo = 0, hi = lut.cum.length - 1;
      while (lo < hi){
        const mid = (lo + hi) >> 1;
        if (lut.cum[mid] < target) lo = mid + 1; else hi = mid;
      }
      if (lo === 0) return { x: lut.xs[0], y: lut.ys[0], t: lut.ts[0] };
      const i = lo, j = lo - 1;
      const c0 = lut.cum[j], c1 = lut.cum[i];
      const ratio = (target - c0) / Math.max(1e-6, (c1 - c0));
      const x = lut.xs[j] + (lut.xs[i] - lut.xs[j]) * ratio;
      const y = lut.ys[j] + (lut.ys[i] - lut.ys[j]) * ratio;
      const t = lut.ts[j] + (lut.ts[i] - lut.ts[j]) * ratio;
      return { x, y, t };
    }

    /* =======================
       ENERGY SPHERE RENDERER (no border)
    ======================= */
    const inflow = []; // {x,y,vx,vy,life}
    function rgbStr(c, a=1){ return `rgba(${c.r},${c.g},${c.b},${a})`; }

    function drawEnergySphere(cx, cy, r, charge=0, vel=null){
      ctx.save();

      if (vel){
        const vlen = Math.hypot(vel.vx, vel.vy);
        const stretch = clamp(1 + Math.min(0.35, vlen/900), 1, 1.35);
        const ang = Math.atan2(vel.vy, vel.vx);
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.scale(stretch, 1/stretch);
        cx = 0; cy = 0;
      }

      // 1) Opaque body shading
      ctx.globalCompositeOperation = 'source-over';
      const lightOffset = 0.35 * r;
      const gx = cx - LIGHT_DIR.x * lightOffset;
      const gy = cy - LIGHT_DIR.y * lightOffset;
      let g = ctx.createRadialGradient(gx, gy, r*0.05, cx, cy, r*1.02);
      g.addColorStop(0.00, rgbStr(CORE_COLOR, 0.98));
      g.addColorStop(0.35, rgbStr(MID_COLOR, 0.98));
      g.addColorStop(1.00, rgbStr(EDGE_COLOR, 0.98));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();

      // 2) Rim occlusion
      const ao = ctx.createRadialGradient(cx, cy, r*0.70, cx, cy, r*1.02);
      ao.addColorStop(0.0, 'rgba(0,0,0,0)');
      ao.addColorStop(1.0, 'rgba(0,0,0,0.16)');
      ctx.fillStyle = ao;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();

      // 3) Specular
      ctx.globalCompositeOperation = 'lighter';
      const hx = cx - LIGHT_DIR.x * r*0.35;
      const hy = cy - LIGHT_DIR.y * r*0.35;
      const spec = ctx.createRadialGradient(hx, hy, 0, hx, hy, r*0.45);
      spec.addColorStop(0.00, 'rgba(255,255,255,0.65)');
      spec.addColorStop(1.00, 'rgba(255,255,255,0)');
      ctx.fillStyle = spec;
      ctx.beginPath(); ctx.arc(hx, hy, r*0.48, 0, Math.PI*2); ctx.fill();

      // 4) Hot core glow
      const coreR = r * (0.40 + 0.10*charge);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0.00, 'rgba(255,255,255,0.90)');
      core.addColorStop(1.00, `rgba(${BALL_RGB},0.00)`);
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI*2); ctx.fill();

      // 5) Outer aura
      const auraR = r * (1.25 + 0.10*charge);
      const aura = ctx.createRadialGradient(cx, cy, r*0.9, cx, cy, auraR);
      aura.addColorStop(0.00, rgbStr(AURA_COLOR, 0.22 + 0.18*charge));
      aura.addColorStop(1.00, 'rgba(120,220,255,0)');
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(cx, cy, auraR, 0, Math.PI*2); ctx.fill();

      // 6) Pressure rings (no border)
      const t = performance.now()/1000;
      for (let i=0;i<RING_COUNT;i++){
        const k = (i+1)/(RING_COUNT+1);
        const pr = r*(1.05 + 0.25*k + 0.03*Math.sin(2*Math.PI*(RING_PULSE_HZ*t + i*0.17)));
        ctx.globalAlpha = (RING_ALPHA*(0.6 + 0.4*charge));
        ctx.beginPath(); ctx.arc(cx, cy, pr, 0, Math.PI*2); ctx.strokeStyle = rgbStr(AURA_COLOR, 1);
        ctx.lineWidth = Math.max(1, r*0.02*(1-k));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.restore();
    }

    /* =======================
       POINTER DRAW (uses expanded hover zone)
    ======================= */
    function drawPointer(){
      if (!pointer.inside) return;
      const ready = pointerImg && pointerImg.complete && pointerImg.naturalWidth > 0;

      const t = performance.now()/1000;
      const breathe = 1 + POINTER_BREATH * Math.sin(t*2*Math.PI*0.8);
      const charge  = (orb && !launching) ? orb.charge : 0;
      const scale   = breathe * (1 + POINTER_CHARGE_SCALE * charge);

      // final side length, clamped to max
      const size = Math.min(POINTER_PX_MAX, POINTER_BASE_PX * scale);
      const w = size, h = size;

      // mild pull toward the orb over expanded hover zone
      let x = pointer.x, y = pointer.y;
      if (orb && !launching){
        const dx = orb.cx - x, dy = orb.cy - y;
        const d  = Math.hypot(dx,dy) || 1;
        const r  = radiusFromCharge(orb);
        const exR = r * HOVER_RADIUS_MULT + HOVER_PAD_PX;

        const near = 1 - Math.min(1, d / exR); // 0..1 inside expanded zone
        const pull = 6 * (0.35 + 0.65*near) * (charge || 0); // up to ~6px
        x += (dx/d)*pull; y += (dy/d)*pull;
      }

      // glow scales with size
      const glowR = size * 0.8;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
      g.addColorStop(0, `rgba(255,255,255,${0.22 + 0.28*charge})`);
      g.addColorStop(1, 'rgba(120,220,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI*2); ctx.fill();

      ctx.globalCompositeOperation = 'source-over';
      if (ready){
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(pointerImg, x - w/2, y - h/2, w, h);
      } else {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, y, Math.max(2, size*0.08), 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }

    /* =======================
       UPDATE (expanded hover zone + rate falloff)
    ======================= */
    let started=false, lastT=performance.now(), lastDt=0, rafId=0;

    function maybeCharge(dt){
      if (!orb || launching) return;

      const r   = radiusFromCharge(orb);
      const exR = r * HOVER_RADIUS_MULT + HOVER_PAD_PX;

      const dx = pointer.x - orb.cx, dy = pointer.y - orb.cy;
      const dist = Math.hypot(dx, dy);

      const inside = pointer.inside && dist <= exR;   // expanded hover area

      if (inside){
        if (!orb.inZone){ orb.inZone = true; orb.enterMs = performance.now(); }
        const ok = (performance.now() - orb.enterMs) >= ENTRY_GRACE_MS;
        if (ok){
          // prox = 1 at center/ball, 0 at expanded edge
          const prox = 1 - Math.min(1, Math.max(0, (dist - r) / Math.max(1, exR - r)));
          const rateScale = CHARGE_EDGE_FALLOFF + (1 - CHARGE_EDGE_FALLOFF) * prox;

          orb.charge = Math.min(1, orb.charge + dt * (1000 / DWELL_MS) * rateScale);

          if (orb.charge >= 1 && !launching){
            launching = true;
            cutHumPunch();
            play(sfxRelease);
            orb.launching = true;
            orb.launchT0 = performance.now();
            orb.startR  = radiusFromCharge(orb);
            orb.trail.length = 0;

            const p0   = { x:orb.cx, y:orb.cy };
            const ctrl = { x:orb.cx + (moon.x - orb.cx)*0.35, y: Math.min(orb.cy, moon.y) - H*BEZIER_PEAK };
            const p1   = { x:moon.x, y:moon.y };
            orb.path = makePathLUT(p0, ctrl, p1, 260);
            orb.s = 0;
          }
        }
      } else {
        orb.inZone = false;
        if (!launching) orb.charge = Math.max(0, orb.charge - DECAY_PER_SEC*dt);
      }
    }

    function update(dt){
      if (!orb && !launching && respawnAtMs && performance.now() >= respawnAtMs){
        respawnAtMs = 0;
        spawnOrb();
      } else if (!orb && !launching && !respawnAtMs){
        spawnOrb();
      }

      maybeCharge(dt);

      // inflow while charging
      if (orb && !launching){
        const r = radiusFromCharge(orb);
        const want = Math.min(INFLOW_MAX, inflow.length + INFLOW_RATE*dt*clamp(orb.charge*1.2, 0.2, 1.0));
        while (inflow.length < want){
          const ang = Math.random()*Math.PI*2;
          const useInner = Math.random() < 0.6;
          const bandMin = useInner ? INFLOW_INNER_MIN : INFLOW_OUTER_MIN;
          const bandMax = useInner ? INFLOW_INNER_MAX : INFLOW_OUTER_MAX;
          const rrMul = rand(bandMin, bandMax);
          const rr  = r * rrMul;
          const x = orb.cx + Math.cos(ang)*rr;
          const y = orb.cy + Math.sin(ang)*rr;

          const toCdx = orb.cx - x, toCdy = orb.cy - y;
          const d = Math.hypot(toCdx, toCdy) || 1;
          const sp = (useInner ? 220 : 160) + Math.random()*200;
          const jitterA = (Math.random()-0.5)*0.25;
          const cosJ = Math.cos(jitterA), sinJ = Math.sin(jitterA);
          const ux = toCdx/d, uy = toCdy/d;
          const jx = ux*cosJ - uy*sinJ, jy = ux*sinJ + uy*cosJ;

          inflow.push({ x, y, vx:jx*sp, vy:jy*sp, life: 0.35 + Math.random()*0.45 });
        }
      }

      updateHum(orb && !launching ? orb.charge : 0);

      if (launching && orb && orb.path){
        orb.s += LAUNCH_SPEED_PX * dt;
        const done = orb.s >= orb.path.total - 0.5;
        const P = samplePathByS(orb.path, orb.s);

        const u = Math.min(1, orb.s / Math.max(1e-6, orb.path.total));
        const r = orb.startR + (END_RADIUS - orb.startR) * u;

        orb.trail.push({ x:P.x, y:P.y, r, a:1 });
        if (orb.trail.length>18) orb.trail.shift();
        for (const tr of orb.trail) tr.a *= 0.9;

        orb.cx = P.x; orb.cy = P.y; orb.renderR = r;

        if (done){
          let ix = 0, iy = -1;
          if (orb.trail.length >= 2) {
            const a = orb.trail[orb.trail.length - 1];
            const b = orb.trail[orb.trail.length - 2];
            ix = a.x - b.x; iy = a.y - b.y;
          }

          const len = Math.hypot(ix, iy) || 1;
          const ux = ix/len, uy = iy/len;
          mShake.ox += ux * 12;
          mShake.oy += uy * 12;
          moonKick(ix, iy, 1.6);

          addCraterFromImpact();
          burstAt(moon.x, moon.y);
          flash(); shock(moon.x, moon.y);
          playImpact();

          // ===== INCREMENT HUD COUNTER HERE =====
          launchCount++;

          launching = false;
          orb = null;
          respawnAtMs = performance.now() + RESPAWN_DELAY_MS;
        }
      }

      if (flashLife>0){ flashT += dt; if (flashT>=flashLife) flashLife=0; }
      if (shockLife>0){ shockT += dt; if (shockT>=shockLife) shockLife=0; }

      const t = nowS();
      for (let i=shards.length-1;i>=0;i--){
        const s=shards[i];
        s.x += s.vx*dt; s.y += s.vy*dt; s.vy += 360*dt; s.ang += s.rot*dt;
        if (t - s.born > s.life) shards.splice(i,1);
      }

      updateMoonShake(dt);
    }

    /* =======================
       HUD (Moon icon + launch count)
    ======================= */
    let launchCount = 0;
    function drawHUD(){
      const pad = Math.max(10, Math.min(24, Math.floor((W + H) * 0.012)));
      const iconSize = Math.max(22, Math.min(40, Math.floor((W + H) * 0.02)));
      const textSize = Math.max(18, Math.min(30, Math.floor((W + H) * 0.018)));

      const xRight = W - pad;
      const yTop = pad;

      ctx.save();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${textSize}px ui-rounded, ui-sans-serif, system-ui, Segoe UI, Roboto, Arial`;
      ctx.fillStyle = '#6ad1c9';
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Number
      const text = `${launchCount}`;
      ctx.fillText(text, xRight, yTop + iconSize/2);

      // Icon to the left of the number
      if (moonIcon.complete && moonIcon.naturalWidth > 0) {
        const textW = ctx.measureText(text).width;
        const iconX = xRight - textW - 10 - iconSize;
        const iconY = yTop;
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.drawImage(moonIcon, iconX, iconY, iconSize, iconSize);
      }
      ctx.restore();
    }

    /* =======================
       RENDER
    ======================= */
    function drawInflow(){
      for (let i=inflow.length-1; i>=0; i--){
        const p = inflow[i];
        p.life -= lastDt;
        p.x += p.vx*lastDt; p.y += p.vy*lastDt;
        if (p.life <= 0){ inflow.splice(i,1); }
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of inflow){
        const a = INFLOW_ALPHA * Math.max(0, Math.min(1, p.life/0.5));
        if (a <= 0.01) continue;
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI*2);
        ctx.fillStyle = 'white'; ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function drawOrb(){
      if (!orb) return;
      if (!launching){
        const r = radiusFromCharge(orb);
        const [ox, oy] = orbJitter(orb.charge);
        const cx = orb.cx + ox, cy = orb.cy + oy;
        drawEnergySphere(cx, cy, r, orb.charge, null);
      } else {
        ctx.save();
        ctx.globalCompositeOperation='source-over';
        for (const tr of orb.trail){
          if (tr.a<=0.02) continue;
          ctx.globalAlpha = 0.10 * tr.a;
          drawEnergySphere(tr.x, tr.y, tr.r*0.9, 1, null);
        }
        ctx.restore(); ctx.globalAlpha=1;

        const v = (orb.trail.length>=2)
          ? { vx: orb.trail.at(-1).x - orb.trail.at(-2).x,
              vy: orb.trail.at(-1).y - orb.trail.at(-2).y }
          : null;
        drawEnergySphere(orb.cx, orb.cy, orb.renderR||END_RADIUS, 1, v);
      }
    }

    function render(){
      drawBackground();
      drawMoon();
      drawInflow();
      drawOrb();        // draw the ball first
      drawPointer();    // then pointer on top of the ball
      drawShards();
      drawShockwave();
      drawFlash();
      drawHUD();        // HUD above everything
    }

    function tick(tMs){
      if (!started) {
        rafId = 0;
        return;
      }
      const dt = Math.min(0.033, (tMs - lastT)/1000);
      lastT = tMs;
      lastDt = dt;
      update(dt);
      render();
      rafId = requestAnimationFrame(tick);
    }

    /* =======================
       LIFECYCLE
    ======================= */
    const startOverlay = document.getElementById('startOverlay');

    function resetMutableState() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      orb = null;
      launching = false;
      respawnAtMs = 0;
      inflow.length = 0;
      shards.length = 0;
      craters.length = 0;
      flashLife = 0;
      flashT = 0;
      shockLife = 0;
      shockT = 0;
      shockX = 0;
      shockY = 0;
      launchCount = 0;
      pointer.inside = false;
      pointer.x = pointer.y = -9999;
      pointer.px = pointer.py = -9999;
      pointer.moved = 0;
      mShake = { ox: 0, oy: 0, vx: 0, vy: 0 };
      if (chargeGain && audioCtx) {
        try {
          const t = audioCtx.currentTime || 0;
          if (chargeGain.gain && typeof chargeGain.gain.cancelScheduledValues === 'function') {
            chargeGain.gain.cancelScheduledValues(t);
          }
          if (chargeGain.gain && typeof chargeGain.gain.setValueAtTime === 'function') {
            chargeGain.gain.setValueAtTime(0.0001, t);
          } else if (chargeGain.gain) {
            chargeGain.gain.value = 0;
          }
        } catch (error) {
          if (chargeGain && chargeGain.gain) chargeGain.gain.value = 0;
        }
      }
      lastT = performance.now();
      lastDt = 0;
    }

    function waitForAssetsAndStart() {
      const begin = () => {
        if (!started) return;
        lastT = performance.now();
        lastDt = 0;
        rafId = requestAnimationFrame(tick);
      };

      const assets = [bgImg, pointerImg, moonIcon, ...rockImgs];
      let pending = 0;

      const markReady = () => {
        pending -= 1;
        if (pending <= 0) begin();
      };

      for (const asset of assets) {
        if (!asset) continue;
        if (asset.complete && asset.naturalWidth > 0) continue;
        pending += 1;
        asset.addEventListener('load', markReady, { once: true });
        asset.addEventListener('error', markReady, { once: true });
      }

      if (pending === 0) begin();
    }

    async function startExperience(options = {}) {
      if (started) return;
      resetMutableState();
      started = true;
      if (startOverlay) startOverlay.style.display = 'none';
      resize();

      try {
        if (!audioCtx) {
          setupAudio();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
      } catch (error) {
        /* ignore audio resume errors */
      }

      waitForAssetsAndStart();
    }

    function stopExperience() {
      if (!started) return;
      started = false;

      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }

      if (startOverlay) startOverlay.style.display = 'block';

      try {
        if (audioCtx && audioCtx.state === 'running') {
          audioCtx.suspend().catch(() => {});
        }
      } catch (error) {
        /* ignore suspend errors */
      }

      [sfxRelease, ...sfxImpactClips].forEach((audio) => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (error) {
          /* ignore audio stop errors */
        }
      });

      resetMutableState();
    }

    window.startExperience = (options) => startExperience(options);
    window.stopExperience = stopExperience;
    window.storyGameApi = { start: startExperience, stop: stopExperience };

    window.requestAnimationFrame(() => startExperience());

  })();
  
