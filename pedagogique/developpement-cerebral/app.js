import { buildMaturationWindows, ageParts } from './maturation.js';
import { loadCorticalData, sampleThickness, regionName } from './cortical-data.js';
import { buildSurfaceGraph, surfaceDistances, UNREACHED } from './cortical-network.js';
import { EPILEPSY_EFFECTS, epilepsyEffect } from './epilepsy-effects.js';

const $ = (id) => document.getElementById(id);
const range = $('age');
const stage = $('stage');
const playButton = $('play');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const about = $('about');
const scientificButton = $('scientific');
const epilepsyButton = $('epilepsy');
const effectSelect = $('epilepsy-effect');
let selectedEffect = EPILEPSY_EFFECTS[0];
let developmentDelayMonths = Number($('development-delay').value);
let age = Number(range.value) / 12;
let scientificMode = false;
let infantAge = null;
let epilepsyMode = false;
let seizureRunning = false;
let seizureElapsed = 0;
let seizureStarted = 0;
let playing = false;
let ready = false;
let frame = 0;
let previousTime = 0;
let paint = () => {};
let resetViews = () => {};
let clearFocal = () => {};
let restartFocalEffect = () => {};

const minimumAge = () => scientificMode ? 5 : 0;
const seizureMoving = () => seizureRunning && !reducedMotion.matches;

function stopSeizureAnimation() {
  seizureRunning = false;
  seizureElapsed = 10;
  requestPaint();
}

function setEpilepsyMode(active) {
  epilepsyMode = active;
  setPlaying(false);
  epilepsyButton.setAttribute('aria-pressed', String(active));
  $('experience').classList.toggle('epilepsy-mode', active);
  const label = active ? 'Désactiver le mode épilepsie' : 'Activer le mode épilepsie : choisir un foyer';
  epilepsyButton.setAttribute('aria-label', label);
  epilepsyButton.title = label;
  if (active && selectedEffect.usesIllustration && scientificMode) setScientificMode(false);
  if (!active) clearFocal();
  updateEffectControls();
  $('announcement').textContent = active ? 'Mode épilepsie : cliquez sur une zone du cerveau, ou utilisez Entrée sur le cerveau.' : 'Mode épilepsie désactivé.';
  requestPaint();
}

function updateEffectControls() {
  $('epilepsy-options').hidden = !epilepsyMode;
  $('development-options').hidden = !selectedEffect.usesIllustration;
  effectSelect.value = selectedEffect.id;
  $('effect-description').textContent = selectedEffect.description;
  const parts = ageParts(developmentDelayMonths / 12);
  const label = `${parts.value} ${parts.unit}`;
  $('delay-value').textContent = label;
  $('development-delay').setAttribute('aria-valuetext', label);
  $('development-delay').style.setProperty('--position', `${developmentDelayMonths / 60 * 100}%`);
  requestPaint();
}

function setPlaying(next) {
  playing = next;
  playButton.setAttribute('aria-pressed', String(next));
  const label = next ? 'Mettre en pause' : 'Lire l’animation';
  playButton.setAttribute('aria-label', label);
  playButton.title = label;
  if (next) {
    previousTime = 0;
    requestPaint();
  }
}

function setAge(value) {
  age = Math.max(minimumAge(), Math.min(20, value));
  const selectedMonths = Math.round(age * 12);
  range.value = String(selectedMonths);
  const start = Number(range.min);
  range.style.setProperty('--position', `${(selectedMonths - start) / (240 - start) * 100}%`);
  const { value: displayed, unit } = ageParts(age);
  $('age-value').textContent = displayed;
  $('age-unit').textContent = unit;
  range.setAttribute('aria-valuetext', `${displayed} ${unit}`);
  requestPaint();
}

function requestPaint() {
  if (ready && !frame) frame = requestAnimationFrame(tick);
}

function tick(time) {
  frame = 0;
  const elapsed = previousTime ? Math.min((time - previousTime) / 1000, 0.1) : 0;
  previousTime = time;
  if (playing) {
    // Explicit playback is allowed with reduced motion, at discrete yearly steps.
    if (elapsed) {
      if (reducedMotion.matches) {
        yearlyAccumulator += elapsed;
        if (yearlyAccumulator >= 1) {
          setAge(Math.floor(age) + 1);
          yearlyAccumulator = 0;
          announceAge();
        }
      } else {
        setAge(age + elapsed);
      }
    }
    if (age >= 20) { setPlaying(false); announceAge(); }
  }
  if (seizureMoving()) {
    const seconds = Math.max(0, (time - seizureStarted) / 1000);
    seizureElapsed = selectedEffect.animation === 'spread' ? Math.min(10, seconds) : seconds;
    if (selectedEffect.animation === 'spread' && seizureElapsed >= 10) seizureRunning = false;
  }
  paint(age);
  if (playing || seizureMoving()) requestPaint();
}

let yearlyAccumulator = 0;
function announceAge() {
  $('announcement').textContent = range.getAttribute('aria-valuetext');
}

range.addEventListener('input', () => { setPlaying(false); setAge(Number(range.value) / 12); });
range.addEventListener('change', announceAge);
playButton.addEventListener('click', () => {
  if (!playing && age >= 20) setAge(minimumAge());
  yearlyAccumulator = 0;
  setPlaying(!playing);
  if (!playing) announceAge();
});
$('reset').addEventListener('click', () => {
  setPlaying(false);
  setEpilepsyMode(false);
  setAge(minimumAge());
  resetViews();
  announceAge();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { setPlaying(false); stopSeizureAnimation(); } });
$('information').addEventListener('click', () => { setPlaying(false); stopSeizureAnimation(); about.showModal(); });
epilepsyButton.addEventListener('click', () => setEpilepsyMode(!epilepsyMode));
$('clear-focal').addEventListener('click', () => { clearFocal(); $('announcement').textContent = 'Foyer effacé.'; });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !about.open && epilepsyMode) setEpilepsyMode(false);
});
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stopSeizureAnimation(); requestPaint(); });
effectSelect.replaceChildren(...EPILEPSY_EFFECTS.map((effect) => {
  const option = document.createElement('option'); option.value = effect.id; option.textContent = effect.label; return option;
}));
effectSelect.addEventListener('change', () => {
  selectedEffect = epilepsyEffect(effectSelect.value);
  if (epilepsyMode && selectedEffect.usesIllustration && scientificMode) setScientificMode(false);
  updateEffectControls();
  restartFocalEffect();
  $('announcement').textContent = `${selectedEffect.label}. ${selectedEffect.description}`;
});
$('development-delay').addEventListener('input', () => {
  developmentDelayMonths = Number($('development-delay').value);
  updateEffectControls();
});
updateEffectControls();
function setScientificMode(active) {
  if (active && epilepsyMode && selectedEffect.usesIllustration) setEpilepsyMode(false);
  setPlaying(false);
  scientificMode = active;
  if (scientificMode && age < 5) infantAge = age;
  range.min = scientificMode ? '60' : '0';
  scientificButton.setAttribute('aria-pressed', String(scientificMode));
  const label = scientificMode ? 'Revenir à l’illustration, de 0 à 20 ans' : 'Afficher les données IRM, de 5 à 20 ans';
  scientificButton.setAttribute('aria-label', label);
  scientificButton.title = label;
  $('view-caption').textContent = scientificMode ? 'Épaisseur corticale · référence IRM · 5–20 ans' : 'Illustration · 0–20 ans';
  $('mri-scale').hidden = !scientificMode;
  $('legend-start').textContent = scientificMode ? '4 mm · plus épais' : 'Moins avancée';
  $('legend-end').textContent = scientificMode ? '1,5 mm · plus fin' : 'Plus avancée';
  $('illustration-note').hidden = scientificMode;
  $('mri-note').hidden = !scientificMode;
  document.querySelector('.ticks').replaceChildren(...(scientificMode ? [5, 10, 15, 20] : [0, 5, 10, 15, 20]).map((value) => {
    const span = document.createElement('span'); span.textContent = value; return span;
  }));
  const resetLabel = scientificMode ? 'Revenir à 5 ans et rétablir les vues' : 'Revenir à la naissance et rétablir les vues';
  $('reset').setAttribute('aria-label', resetLabel);
  $('reset').title = resetLabel;
  if (!scientificMode && infantAge !== null) { setAge(infantAge); infantAge = null; }
  else setAge(age);
  $('announcement').textContent = scientificMode ? 'Épaisseur corticale de référence. Données disponibles de 5 à 20 ans.' : 'Illustration du développement, de 0 à 20 ans.';
}
scientificButton.addEventListener('click', () => setScientificMode(!scientificMode));
$('close-about').addEventListener('click', () => about.close());
about.addEventListener('click', (event) => {
  const rect = about.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) about.close();
});
const fullscreen = $('fullscreen');
fullscreen.hidden = !document.fullscreenEnabled;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $('experience').requestFullscreen();
  } catch {
    $('announcement').textContent = 'Le plein écran n’est pas disponible dans ce navigateur.';
  }
});
document.addEventListener('fullscreenchange', () => {
  const active = Boolean(document.fullscreenElement);
  const label = active ? 'Quitter le plein écran' : 'Passer en plein écran';
  fullscreen.setAttribute('aria-label', label);
  fullscreen.title = label;
  requestPaint();
});
$('retry').addEventListener('click', () => location.reload());

function showFailure(message, error) {
  setPlaying(false);
  ready = false;
  range.disabled = true;
  playButton.disabled = true;
  $('reset').disabled = true;
  scientificButton.disabled = true;
  epilepsyButton.disabled = true;
  setEpilepsyMode(false);
  stage.setAttribute('aria-busy', 'false');
  $('loading').hidden = true;
  $('failure-message').textContent = message;
  $('failure').hidden = false;
  console.error(error);
}

async function initialize() {
  let renderer;
  try {
    // Vendored and version-pinned: no external request is needed at runtime.
    const THREE = await import('./vendor/three.module.min.js');
    renderer = new THREE.WebGLRenderer({ canvas: $('brain'), antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    const [response, corticalData] = await Promise.all([
      fetch('./assets/cortex.bin'),
      loadCorticalData().catch((error) => { console.warn('Mode IRM indisponible', error); return null; }),
    ]);
    if (!response.ok) throw new Error(`Cortex HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    const header = new DataView(buffer);
    if (buffer.byteLength < 16 || header.getUint32(0, true) !== 0x42524e31) throw new Error('Invalid cortex asset');
    const vertexCount = header.getUint32(4, true);
    const indexCount = header.getUint32(8, true);
    const expectedBytes = 16 + vertexCount * 16 + indexCount * 2;
    if (buffer.byteLength !== expectedBytes) throw new Error('Incomplete cortex asset');
    const native = new Float32Array(buffer, 16, vertexCount * 3);
    const sulcalDepth = new Float32Array(buffer, 16 + vertexCount * 12, vertexCount);
    const indices = new Uint16Array(buffer, 16 + vertexCount * 16, indexCount);
    const positions = new Float32Array(vertexCount * 3);
    const windows = buildMaturationWindows(native, sulcalDepth);
    const thickness = new Float32Array(vertexCount).fill(-1);
    const focalDistances = new Float32Array(vertexCount).fill(UNREACHED);
    for (let i = 0; i < vertexCount; i++) {
      const [x, y, z] = native.subarray(i * 3, i * 3 + 3);
      positions.set([y, z, x], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('sulcalDepth', new THREE.BufferAttribute(sulcalDepth, 1));
    geometry.setAttribute('maturation', new THREE.BufferAttribute(windows, 4));
    geometry.setAttribute('corticalThickness', new THREE.BufferAttribute(thickness, 1));
    geometry.setAttribute('seizureDistance', new THREE.BufferAttribute(focalDistances, 1));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.center();
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const surfaceGraph = buildSurfaceGraph(positions, indices);

    const ageUniform = { value: age };
    const scientificUniform = { value: 0 };
    const seizureUniform = { value: 0 };
    const seizureTimeUniform = { value: 0 };
    const staticSeizureUniform = { value: 0 };
    const effectUniform = { value: 0 };
    const delayUniform = { value: developmentDelayMonths / 12 };
    const focalColor = new THREE.Color('#a06ac2');
    const palette = ['#e84335', '#f48d32', '#e9cc49', '#a4bf51', '#39a76a'].map((color) => new THREE.Color(color));
    const material = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uAge = ageUniform;
      shader.uniforms.uScientific = scientificUniform;
      shader.uniforms.uSeizure = seizureUniform;
      shader.uniforms.uSeizureTime = seizureTimeUniform;
      shader.uniforms.uStaticSeizure = staticSeizureUniform;
      shader.uniforms.uFocalColor = { value: focalColor };
      shader.uniforms.uEpilepsyEffect = effectUniform;
      shader.uniforms.uDevelopmentDelay = delayUniform;
      palette.forEach((color, i) => { shader.uniforms[`uColor${i}`] = { value: color }; });
      shader.vertexShader = `attribute vec4 maturation;\nattribute float sulcalDepth;\nattribute float corticalThickness;\nattribute float seizureDistance;\nvarying float vMaturity;\nvarying float vSulc;\nvarying float vKnown;\nvarying float vSeizureDistance;\nuniform float uAge;\nuniform float uScientific;\nuniform float uSeizure;\nuniform float uEpilepsyEffect;\nuniform float uDevelopmentDelay;\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        float effectiveAge = uAge;
        if (uScientific < 0.5 && uSeizure > 0.5 && uEpilepsyEffect > 1.5) {
          float influence = 1.0 - smoothstep(0.0, 35.0, seizureDistance);
          effectiveAge = max(0.0, uAge - uDevelopmentDelay * influence);
        }
        float later = smoothstep(maturation.x, maturation.y, effectiveAge);
        float infant = 1.0 - exp(-max(0.0, effectiveAge) / maturation.w);
        vMaturity = uScientific > 0.5 ? clamp((4.0 - corticalThickness) / 2.5, 0.0, 1.0) : mix(later, infant, maturation.z);
        vKnown = step(0.0, corticalThickness);
        vSulc = sulcalDepth;
        vSeizureDistance = min(100.0, seizureDistance);
      `);
      shader.fragmentShader = `varying float vMaturity;\nvarying float vSulc;\nvarying float vKnown;\nvarying float vSeizureDistance;\nuniform float uScientific;\nuniform float uSeizure;\nuniform float uSeizureTime;\nuniform float uStaticSeizure;\nuniform float uEpilepsyEffect;\nuniform vec3 uFocalColor;\nuniform vec3 uColor0;\nuniform vec3 uColor1;\nuniform vec3 uColor2;\nuniform vec3 uColor3;\nuniform vec3 uColor4;\n${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        float p = clamp(vMaturity, 0.0, 1.0) * 4.0;
        vec3 heat = p < 1.0 ? mix(uColor0, uColor1, p) :
                    p < 2.0 ? mix(uColor1, uColor2, p - 1.0) :
                    p < 3.0 ? mix(uColor2, uColor3, p - 2.0) : mix(uColor3, uColor4, p - 3.0);
        if (uScientific > 0.5 && vKnown < 0.99) heat = vec3(0.43, 0.45, 0.41);
        float focus = 0.90 * (1.0 - smoothstep(2.0, 18.0, vSeizureDistance));
        float radius = min(uSeizureTime, 4.0) * 14.0;
        float spread = 0.90 * (1.0 - smoothstep(max(0.0, radius - 12.0), radius + 6.0, vSeizureDistance));
        spread *= smoothstep(0.0, 1.0, uSeizureTime) * (1.0 - smoothstep(6.0, 10.0, uSeizureTime));
        float focalMix = 0.0;
        if (uEpilepsyEffect < 0.5) {
          focalMix = uSeizure * max(focus, spread * (1.0 - uStaticSeizure));
        } else if (uEpilepsyEffect < 1.5) {
          float localRadius = uStaticSeizure > 0.5 ? 16.0 : 16.0 + 4.0 * sin(uSeizureTime * 1.5707963);
          focalMix = uSeizure * 0.90 * (1.0 - smoothstep(2.0, localRadius, vSeizureDistance));
        }
        heat = mix(heat, uFocalColor, focalMix);
        float groove = 1.0 - 0.38 * smoothstep(-0.5, 1.3, vSulc);
        diffuseColor.rgb = heat * groove;
      `);
    };

    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const focalMarker = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 8), new THREE.MeshBasicMaterial({ color: focalColor }));
    focalMarker.visible = false;
    scene.add(focalMarker);
    let focalVertex = -1;
    const parcelThickness = new Float32Array(148);
    let lastThicknessAge = null;
    const thicknessFormat = new Intl.NumberFormat('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    function updateFocalReadout() {
      const readout = $('focal-readout');
      readout.hidden = focalVertex < 0;
      $('clear-focal').hidden = focalVertex < 0;
      if (focalVertex < 0) { readout.textContent = ''; delete readout.dataset.region; return; }
      const id = corticalData?.vertexLabels[focalVertex] || 0;
      let value = scientificMode && id ? ` · ${thicknessFormat.format(parcelThickness[id - 1])} mm` : '';
      if (selectedEffect.usesIllustration) {
        const parts = ageParts(developmentDelayMonths / 12);
        value += ` · décalage illustratif : ${parts.value} ${parts.unit}`;
      }
      const text = `Foyer : ${regionName(id)}${value}`;
      if (readout.textContent !== text) readout.textContent = text;
      readout.title = text;
      readout.dataset.region = String(id);
    }
    clearFocal = () => {
      focalVertex = -1;
      seizureRunning = false;
      seizureUniform.value = 0;
      focalMarker.visible = false;
      updateFocalReadout();
      requestPaint();
    };
    restartFocalEffect = () => {
      if (focalVertex < 0) return;
      seizureElapsed = 0;
      seizureStarted = performance.now();
      seizureRunning = selectedEffect.animation !== 'none' && !reducedMotion.matches;
      previousTime = 0;
      updateFocalReadout();
      requestPaint();
    };
    scene.add(new THREE.HemisphereLight(0xffffff, 0x888e7a, 2.1));
    const key = new THREE.DirectionalLight(0xfff7e8, 2.4);
    key.position.set(-130, 200, -220);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe7f1ff, 1.1);
    fill.position.set(100, 60, 160);
    scene.add(fill);

    const lateralCamera = new THREE.OrthographicCamera();
    const topCamera = new THREE.OrthographicCamera();
    lateralCamera.near = topCamera.near = 1;
    lateralCamera.far = topCamera.far = 1000;
    topCamera.position.set(0, 400, 0);
    topCamera.up.set(1, 0, 0);
    topCamera.lookAt(0, 0, 0);
    let yaw = -Math.PI / 2;
    let pitch = 0.06;
    const updateLateral = () => {
      lateralCamera.position.set(400 * Math.cos(yaw) * Math.cos(pitch), 400 * Math.sin(pitch), 400 * Math.sin(yaw) * Math.cos(pitch));
      lateralCamera.lookAt(0, 0, 0);
    };
    updateLateral();
    resetViews = () => { yaw = -Math.PI / 2; pitch = 0.06; updateLateral(); requestPaint(); };

    const raycaster = new THREE.Raycaster();
    const hitPosition = new THREE.Vector3();
    const hitNormal = new THREE.Vector3();
    function placeFocal(surface, camera, clientX, clientY) {
      // Refresh viewport/camera and metric state before projecting the click.
      paint(age);
      const bounds = surface.getBoundingClientRect();
      const pointer = new THREE.Vector2((clientX - bounds.left) / bounds.width * 2 - 1, 1 - (clientY - bounds.top) / bounds.height * 2);
      camera.updateMatrixWorld();
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(mesh, false)[0];
      if (!hit) return;
      let nearest = -1;
      let nearestDistance = Infinity;
      for (const vertex of [hit.face.a, hit.face.b, hit.face.c]) {
        hitPosition.fromBufferAttribute(geometry.attributes.position, vertex);
        const distance = hitPosition.distanceToSquared(hit.point);
        if (distance < nearestDistance) { nearestDistance = distance; nearest = vertex; }
      }
      focalVertex = nearest;
      focalDistances.set(surfaceDistances(surfaceGraph, nearest));
      geometry.attributes.seizureDistance.needsUpdate = true;
      focalMarker.position.fromBufferAttribute(geometry.attributes.position, nearest);
      hitNormal.fromBufferAttribute(geometry.attributes.normal, nearest).normalize();
      focalMarker.position.addScaledVector(hitNormal, 1.5);
      focalMarker.visible = true;
      seizureUniform.value = 1;
      setPlaying(false);
      restartFocalEffect();
      updateFocalReadout();
      $('announcement').textContent = `${$('focal-readout').textContent}. ${selectedEffect.label}.`;
      requestPaint();
    }
    function bindSurface(surface, camera, canRotate) {
      let drag = null;
      surface.addEventListener('pointerdown', (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        drag = { x: event.clientX, y: event.clientY, yaw, pitch, id: event.pointerId, moved: false };
        surface.setPointerCapture(event.pointerId);
      });
      surface.addEventListener('pointermove', (event) => {
        if (!drag || drag.id !== event.pointerId) return;
        if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6) drag.moved = true;
        if (!canRotate || !drag.moved) return;
        yaw = drag.yaw + (event.clientX - drag.x) * 0.007;
        pitch = Math.max(-1.15, Math.min(1.15, drag.pitch + (event.clientY - drag.y) * 0.007));
        updateLateral();
        requestPaint();
      });
      surface.addEventListener('pointerup', (event) => {
        if (drag?.id === event.pointerId && !drag.moved && epilepsyMode) placeFocal(surface, camera, event.clientX, event.clientY);
        drag = null;
      });
      const stopDrag = () => { drag = null; };
      surface.addEventListener('pointercancel', stopDrag);
      surface.addEventListener('lostpointercapture', stopDrag);
    }
    bindSurface($('lateral'), lateralCamera, true);
    bindSurface($('superior'), topCamera, false);
    $('brain').addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && epilepsyMode) {
        event.preventDefault();
        const bounds = $('lateral').getBoundingClientRect();
        placeFocal($('lateral'), lateralCamera, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') { resetViews(); return; }
      if (event.key === 'ArrowLeft') yaw -= 0.12;
      if (event.key === 'ArrowRight') yaw += 0.12;
      if (event.key === 'ArrowUp') pitch = Math.max(-1.15, pitch - 0.12);
      if (event.key === 'ArrowDown') pitch = Math.min(1.15, pitch + 0.12);
      updateLateral();
      requestPaint();
    });

    let width = 0;
    let height = 0;
    const box = geometry.boundingBox;
    const corners = [];
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
      }
    }
    const projected = new THREE.Vector3();
    function renderView(element, camera, baseHeight) {
      const bounds = element.getBoundingClientRect();
      const stageBounds = stage.getBoundingClientRect();
      const aspect = bounds.width / bounds.height;
      // Fit the rotated bounding box so dragging never clips the anatomy.
      camera.updateMatrixWorld();
      let extentX = 0;
      let extentY = 0;
      for (const corner of corners) {
        projected.copy(corner).applyMatrix4(camera.matrixWorldInverse);
        extentX = Math.max(extentX, Math.abs(projected.x));
        extentY = Math.max(extentY, Math.abs(projected.y));
      }
      const viewHeight = Math.max(baseHeight, 205 / aspect, extentY * 2.12, extentX * 2.12 / aspect);
      camera.left = -viewHeight * aspect / 2;
      camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      const left = bounds.left - stageBounds.left;
      const bottom = stageBounds.bottom - bounds.bottom;
      renderer.setViewport(left, bottom, bounds.width, bounds.height);
      renderer.setScissor(left, bottom, bounds.width, bounds.height);
      renderer.render(scene, camera);
    }
    paint = (value) => {
      if (stage.clientWidth !== width || stage.clientHeight !== height) {
        width = stage.clientWidth;
        height = stage.clientHeight;
        renderer.setSize(width, height, false);
        $('experience').style.setProperty('--feature-center', `${stage.offsetTop + height / 2}px`);
      }
      if (!width || !height) return;
      ageUniform.value = value;
      scientificUniform.value = scientificMode ? 1 : 0;
      seizureTimeUniform.value = seizureElapsed;
      staticSeizureUniform.value = reducedMotion.matches ? 1 : 0;
      effectUniform.value = selectedEffect.shader;
      delayUniform.value = developmentDelayMonths / 12;
      if (scientificMode && corticalData && lastThicknessAge !== value) {
        sampleThickness(corticalData, value, parcelThickness);
        for (let i = 0; i < vertexCount; i++) {
          const id = corticalData.vertexLabels[i];
          thickness[i] = id ? parcelThickness[id - 1] : -1;
        }
        geometry.attributes.corticalThickness.needsUpdate = true;
        lastThicknessAge = value;
      }
      updateFocalReadout();
      renderer.setScissorTest(false);
      renderer.clear();
      renderer.setScissorTest(true);
      renderView($('lateral'), lateralCamera, 172);
      renderView($('superior'), topCamera, 214);
      renderer.setScissorTest(false);
    };
    new ResizeObserver(requestPaint).observe(stage);
    $('brain').addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      showFailure('L’affichage 3D a été interrompu. Réessayez pour le relancer.', new Error('WebGL context lost'));
    });
    ready = true;
    setAge(age);
    // Compile and draw before removing the loading indicator.
    paint(age);
    $('loading').hidden = true;
    stage.setAttribute('aria-busy', 'false');
    range.disabled = false;
    playButton.disabled = false;
    $('reset').disabled = false;
    epilepsyButton.disabled = false;
    scientificButton.disabled = !corticalData;
    if (!corticalData) scientificButton.title = 'Données IRM indisponibles. Rechargez la page pour réessayer.';
  } catch (error) {
    renderer?.dispose();
    showFailure('Le cerveau n’a pas pu être affiché. Vérifiez votre connexion et la disponibilité de WebGL dans votre navigateur.', error);
  }
}

initialize();
