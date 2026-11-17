import { buildMaturationCurves, COLOUR_CURVE_GLSL, ageParts } from './maturation.js';
import { loadCorticalAtlas } from './cortical-atlas.js';
import { buildSurfaceGraph } from './cortical-network.js';
import { loadCerebellum, createCerebellum } from './cerebellum.js';
import { insightForAge } from './age-insights.js';
import { mountAgeDescriptions } from './age-descriptions.js';
import { mountResearch } from './research-evidence.js';
import { BRAIN_PALETTE } from './colour-scale.js';
import { PROFILE_DOMAINS, PROFILE_CORE_THRESHOLD, profileLevel, buildProfileInfluences, cerebellarProfileAdjustment } from './development-profiles.js';

const $ = (id) => document.getElementById(id);
const range = $('age');
const stage = $('stage');
const playButton = $('play');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const about = $('about');
mountResearch(about);
const profilesButton = $('profiles');
let currentPanel = null;
const profileValues = new Float32Array(PROFILE_DOMAINS.length);
let age = Number(range.value) / 12;
let playing = false;
let ready = false;
let frame = 0;
let previousTime = 0;
let paint = () => {};
let resetViews = () => {};
const reperesButton = $('reperes');
const ageDescriptions = mountAgeDescriptions({
  root: $('age-callout'), button: reperesButton, filter: $('repere-domain'),
  domains: PROFILE_DOMAINS, getAge: () => age
});

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
  age = Math.max(0, Math.min(20, value));
  const selectedMonths = Math.round(age * 12);
  range.value = String(selectedMonths);
  const start = Number(range.min);
  range.style.setProperty('--position', `${(selectedMonths - start) / (240 - start) * 100}%`);
  const { value: displayed, unit } = ageParts(age);
  $('age-value').textContent = displayed;
  $('age-unit').textContent = unit;
  range.setAttribute('aria-valuetext', `${displayed} ${unit}`);
  updateAgeInsight();
  ageDescriptions.update();
  requestPaint();
}

function updatePanels() {
  $('profile-options').hidden = currentPanel !== 'profile';
  profilesButton.setAttribute('aria-expanded', String(currentPanel === 'profile'));
  reperesButton.setAttribute('aria-expanded', String(currentPanel === 'milestones'));
  $('experience').classList.toggle('milestones-mode', currentPanel === 'milestones');
  if (currentPanel !== 'milestones') $('experience').classList.remove('compact-reperes', 'tight-reperes');
  ageDescriptions.setActive(currentPanel === 'milestones');
  requestPaint();
}

const hasProfileVariation = () => profileValues.some(value => value !== 0);
const showingProfile = hasProfileVariation;
let currentInsightKey = '';
function updateAgeInsight() {
  const insight = insightForAge(age);
  const active = showingProfile();
  const key = `${insight.from}:${active}`;
  if (key === currentInsightKey) return;
  currentInsightKey = key;
  $('age-insight').dataset.phase = String(insight.from);
  $('insight-range').textContent = insight.range;
  $('stage-context').textContent = active ? 'Profil personnalisé' : 'En développement';
  $('scale-context').textContent = active ? 'Contrastes du profil' : 'Progression illustrative';
  $('scale-detail').textContent = active ? 'Variations par domaine' : 'Le développement continue';
  $('illustration-scale').setAttribute('aria-label', active ? 'Contrastes illustratifs des réseaux, sans mesure de maturité ou de capacité' : 'Progression illustrative du rouge au vert puis au bleu, sans pourcentage de maturité');
  $('insight-title').textContent = insight.title;
  $('insight-themes').replaceChildren(...insight.regions.flatMap(region => {
    const note = document.createElement('span'); note.className = 'stage-region';
    const area = document.createElement('strong'); area.textContent = `${region.area} : `;
    note.append(area, document.createTextNode(region.text));
    return [note, document.createTextNode(' ')];
  }));
}

function updateProfileControls() {
  PROFILE_DOMAINS.forEach((domain, i) => {
    const input = $(`profile-${domain.id}`);
    input.value = String(profileValues[i]);
    input.setAttribute('aria-valuetext', profileLevel(profileValues[i]));
    input.style.setProperty('--position', `${(profileValues[i] + 1) * 100}%`);
  });
  $('experience').classList.toggle('profile-active', hasProfileVariation());
  updateAgeInsight(); requestPaint();
}

for (const [i, domain] of PROFILE_DOMAINS.entries()) {
  const row = document.createElement('div'); row.className = 'profile-domain';
  const label = document.createElement('label'); label.htmlFor = `profile-${domain.id}`; label.textContent = domain.label;
  const input = document.createElement('input');
  input.id = `profile-${domain.id}`; input.type = 'range';
  input.min = '-1'; input.max = '0'; input.step = '0.01'; input.value = '0';
  input.setAttribute('aria-describedby', 'profile-scale');
  row.append(label, input); $('profile-domains').append(row);
  input.addEventListener('input', () => {
    profileValues[i] = Number(input.value);
    setPlaying(false); updateProfileControls();
  });
  input.addEventListener('change', () => {
    $('announcement').textContent = `${domain.label} : ${profileLevel(profileValues[i])}. L’âge reste inchangé.`;
  });
}
profilesButton.addEventListener('click', () => {
  currentPanel = currentPanel === 'profile' ? null : 'profile';
  setPlaying(false); updatePanels();
});
$('close-profiles').addEventListener('click', () => { currentPanel = null; updatePanels(); profilesButton.focus(); });
reperesButton.addEventListener('click', () => {
  currentPanel = currentPanel === 'milestones' ? null : 'milestones';
  updatePanels();
});
$('close-reperes').addEventListener('click', () => { currentPanel = null; updatePanels(); reperesButton.focus(); });
updateProfileControls();

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
  paint(age);
  if (playing) requestPaint();
}

let yearlyAccumulator = 0;
function announceAge() {
  $('announcement').textContent = `${range.getAttribute('aria-valuetext')}. ${$('insight-title').textContent}. ${showingProfile() ? 'Profil illustratif.' : ''}`;
}

range.addEventListener('input', () => { setPlaying(false); setAge(Number(range.value) / 12); });
range.addEventListener('change', announceAge);
playButton.addEventListener('click', () => {
  if (!playing && age >= 20) setAge(0);
  yearlyAccumulator = 0;
  setPlaying(!playing);
  if (!playing) announceAge();
});
$('reset').addEventListener('click', () => {
  setPlaying(false);
  currentPanel = null; profileValues.fill(0); updateProfileControls(); updatePanels();
  ageDescriptions.reset();
  setAge(0);
  resetViews();
  announceAge();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { setPlaying(false); } });
$('information').addEventListener('click', () => { setPlaying(false); about.showModal(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !about.open && currentPanel) {
    const trigger = currentPanel === 'profile' ? profilesButton : reperesButton;
    currentPanel = null; updatePanels(); trigger.focus();
  }
});
reducedMotion.addEventListener('change', requestPaint);
$('close-about').addEventListener('click', () => about.close());
about.addEventListener('click', (event) => {
  if (event.target !== about) return;
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
  currentPanel = null;
  setPlaying(false);
  ready = false;
  range.disabled = true;
  playButton.disabled = true;
  $('reset').disabled = true;
  profilesButton.disabled = true;
  updatePanels();
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
    // The translated views can overlap in their transparent margins.
    // Clear colour once per frame so the second view cannot erase the first.
    renderer.autoClear = false;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    const [response, vertexLabels, cerebellumData] = await Promise.all([
      fetch('./assets/cortex.bin'),
      loadCorticalAtlas().catch((error) => { console.warn('Atlas anatomique indisponible', error); return null; }),
      loadCerebellum(),
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
    for (let i = 0; i < vertexCount; i++) {
      const [x, y, z] = native.subarray(i * 3, i * 3 + 3);
      positions.set([y, z, x], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('sulcalDepth', new THREE.BufferAttribute(sulcalDepth, 1));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingBox();
    const corticalCenter = geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.center();
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const surfaceGraph = buildSurfaceGraph(positions, indices);
    const curves = new THREE.InterleavedBuffer(buildMaturationCurves(native, vertexLabels, surfaceGraph), 8);
    geometry.setAttribute('maturationEarly', new THREE.InterleavedBufferAttribute(curves, 4, 0));
    geometry.setAttribute('maturationLate', new THREE.InterleavedBufferAttribute(curves, 4, 4));
    const influences = new THREE.InterleavedBuffer(buildProfileInfluences(vertexLabels, surfaceGraph), PROFILE_DOMAINS.length);
    geometry.setAttribute('profileInfluenceA', new THREE.InterleavedBufferAttribute(influences, 3, 0));
    geometry.setAttribute('profileInfluenceB', new THREE.InterleavedBufferAttribute(influences, 4, 3));
    geometry.setAttribute('profileInfluenceC', new THREE.InterleavedBufferAttribute(influences, 3, 7));
    geometry.setAttribute('profileInfluenceD', new THREE.InterleavedBufferAttribute(influences, 3, 10));

    const ageUniform = { value: age };
    const profileA = new THREE.Vector3(), profileB = new THREE.Vector4(), profileC = new THREE.Vector3(), profileD = new THREE.Vector3();
    const profileUniformA = { value: profileA }, profileUniformB = { value: profileB }, profileUniformC = { value: profileC }, profileUniformD = { value: profileD };
    const palette = BRAIN_PALETTE.map((color) => new THREE.Color(color));
    const material = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uAge = ageUniform;
      shader.uniforms.uProfileA = profileUniformA;
      shader.uniforms.uProfileB = profileUniformB;
      shader.uniforms.uProfileC = profileUniformC;
      shader.uniforms.uProfileD = profileUniformD;
      palette.forEach((color, i) => { shader.uniforms[`uColor${i}`] = { value: color }; });
      shader.vertexShader = `attribute vec4 maturationEarly;\nattribute vec4 maturationLate;\nattribute vec3 profileInfluenceA;\nattribute vec4 profileInfluenceB;\nattribute vec3 profileInfluenceC;\nattribute vec3 profileInfluenceD;\nuniform vec3 uProfileA;\nuniform vec4 uProfileB;\nuniform vec3 uProfileC;\nuniform vec3 uProfileD;\nattribute float sulcalDepth;\nvarying float vMaturity;\nvarying float vSulc;\nuniform float uAge;\n${COLOUR_CURVE_GLSL}\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        vMaturity = regionalColour(uAge, maturationEarly, maturationLate);
        vec3 remainingA = vec3(1.0) + smoothstep(0.0, ${PROFILE_CORE_THRESHOLD.toFixed(2)}, profileInfluenceA) * uProfileA;
        vec4 remainingB = vec4(1.0) + smoothstep(0.0, ${PROFILE_CORE_THRESHOLD.toFixed(2)}, profileInfluenceB) * uProfileB;
        vec3 remainingC = vec3(1.0) + smoothstep(0.0, ${PROFILE_CORE_THRESHOLD.toFixed(2)}, profileInfluenceC) * uProfileC;
        vec3 remainingD = vec3(1.0) + smoothstep(0.0, ${PROFILE_CORE_THRESHOLD.toFixed(2)}, profileInfluenceD) * uProfileD;
        float profileRemaining = remainingA.x * remainingA.y * remainingA.z
          * remainingB.x * remainingB.y * remainingB.z * remainingB.w
          * remainingC.x * remainingC.y * remainingC.z
          * remainingD.x * remainingD.y * remainingD.z;
        vMaturity *= clamp(profileRemaining, 0.0, 1.0);
        vSulc = sulcalDepth;
      `);
      shader.fragmentShader = `varying float vMaturity;\nvarying float vSulc;\nuniform vec3 uColor0;\nuniform vec3 uColor1;\nuniform vec3 uColor2;\nuniform vec3 uColor3;\nuniform vec3 uColor4;\nuniform vec3 uColor5;\nuniform vec3 uColor6;\n${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        float p = clamp(vMaturity, 0.0, 1.0) * 6.0;
        vec3 heat = p < 1.0 ? mix(uColor0, uColor1, p) :
                    p < 2.0 ? mix(uColor1, uColor2, p - 1.0) :
                    p < 3.0 ? mix(uColor2, uColor3, p - 2.0) :
                    p < 4.0 ? mix(uColor3, uColor4, p - 3.0) :
                    p < 5.0 ? mix(uColor4, uColor5, p - 4.0) : mix(uColor5, uColor6, p - 5.0);
        float groove = 1.0 - 0.38 * smoothstep(-0.5, 1.3, vSulc);
        diffuseColor.rgb = heat * groove;
      `);
    };

    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const cerebellum = createCerebellum(THREE, cerebellumData, corticalCenter);
    scene.add(cerebellum.group);
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

    const lateralSurface = $('lateral');
    let drag = null;
    lateralSurface.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, yaw, pitch, id: event.pointerId, moved: false };
      lateralSurface.setPointerCapture(event.pointerId);
    });
    lateralSurface.addEventListener('pointermove', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6) drag.moved = true;
      if (!drag.moved) return;
      yaw = drag.yaw + (event.clientX - drag.x) * 0.007;
      pitch = Math.max(-1.15, Math.min(1.15, drag.pitch + (event.clientY - drag.y) * 0.007));
      updateLateral(); requestPaint();
    });
    const stopDrag = () => { drag = null; };
    lateralSurface.addEventListener('pointerup', stopDrag);
    lateralSurface.addEventListener('pointercancel', stopDrag);
    lateralSurface.addEventListener('lostpointercapture', stopDrag);
    $('brain').addEventListener('keydown', (event) => {
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
    const box = geometry.boundingBox.clone().union(cerebellum.box);
    const corners = [];
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
      }
    }
    const projected = new THREE.Vector3();
    function prepareView(element, camera, baseHeight) {
      const bounds = element.getBoundingClientRect();
      // Ignore floating-point noise from the translation when fitting cameras.
      const viewWidth = Math.round(bounds.width * 64) / 64;
      const pixelHeight = Math.round(bounds.height * 64) / 64;
      const aspect = viewWidth / pixelHeight;
      // Fit the rotated bounding box so dragging never clips the anatomy.
      camera.updateMatrixWorld();
      let extentX = 0;
      let extentY = 0;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const corner of corners) {
        projected.copy(corner).applyMatrix4(camera.matrixWorldInverse);
        extentX = Math.max(extentX, Math.abs(projected.x));
        extentY = Math.max(extentY, Math.abs(projected.y));
        minX = Math.min(minX, projected.x); maxX = Math.max(maxX, projected.x);
        minY = Math.min(minY, projected.y); maxY = Math.max(maxY, projected.y);
      }
      const viewHeight = Math.max(baseHeight, 205 / aspect, extentY * 2.12, extentX * 2.12 / aspect);
      camera.left = -viewHeight * aspect / 2;
      camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      const scale = pixelHeight / viewHeight;
      return { element, camera, width: viewWidth, height: pixelHeight,
        imageWidth: (maxX - minX) * scale, imageHeight: (maxY - minY) * scale,
        insetX: viewWidth / 2 + minX * scale, insetY: pixelHeight / 2 - maxY * scale };
    }
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    function arrangeViews(side, top) {
      const active = currentPanel === 'milestones';
      const phone = width <= 650 && height > width;
      const initialTop = parseFloat(getComputedStyle($('experience')).getPropertyValue('--scene-top'));
      const originTop = $('experience').getBoundingClientRect().top;
      const bottom = $('play').closest('.timeline').getBoundingClientRect().top - originTop - 12;
      const rowSpace = width - 32 - side.imageWidth - top.imageWidth - 44;
      const canStackModels = side.imageHeight + top.imageHeight + 24 <= bottom - initialTop;
      const compact = active && (phone || height < 440 || (rowSpace < 220 && !(height > width && canStackModels)));
      $('experience').classList.toggle('compact-reperes', compact);
      $('experience').classList.toggle('tight-reperes', compact && height < 440);
      const margin = compact ? 12 : clamp(width * .02, 16, 36);
      const gap = compact ? 16 : clamp(width * .025, 20, 36);
      const textGap = compact ? 16 : clamp(width * .025, 24, 40);
      const usable = width - margin * 2;
      const sceneTop = compact ? 64 : initialTop;
      const rowWidth = side.imageWidth + gap + top.imageWidth;
      const columnWidth = Math.max(side.imageWidth, top.imageWidth);
      const columnHeight = side.imageHeight + gap + top.imageHeight;
      let vertical = rowWidth > usable;
      let stackedText = phone;
      let textWidth = Math.min(360, usable);
      if (active && !phone) {
        const alongsideRow = usable - rowWidth - textGap;
        const columnFits = usable - columnWidth - textGap >= 220 && columnHeight <= bottom - sceneTop;
        if (columnFits && height > width && alongsideRow < 280) {
          vertical = true; textWidth = Math.min(360, usable - columnWidth - textGap);
        } else if (alongsideRow >= 160) {
          vertical = false; textWidth = Math.min(360, alongsideRow);
        } else if (columnFits) {
          vertical = true; textWidth = Math.min(360, usable - columnWidth - textGap);
        } else {
          stackedText = true;
        }
      }
      const copy = $('age-callout');
      if (active) copy.style.width = `${textWidth}px`;
      const textHeight = active ? copy.getBoundingClientRect().height : 0;
      const groupWidth = vertical ? columnWidth : rowWidth;
      const groupHeight = vertical ? columnHeight : Math.max(side.imageHeight, top.imageHeight);
      let groupX, groupY, textX = 0, textY = 0;
      if (active && stackedText) {
        groupX = (width - groupWidth) / 2;
        textX = (width - textWidth) / 2;
        if (vertical) {
          textY = sceneTop;
          groupY = textY + textHeight + textGap;
        } else {
          groupY = sceneTop;
          textY = groupY + groupHeight + textGap;
        }
      } else {
        const totalWidth = groupWidth + (active ? textGap + textWidth : 0);
        groupX = (width - totalWidth) / 2;
        groupY = sceneTop + (bottom - sceneTop - groupHeight) / 2;
        if (active) {
          textX = groupX + groupWidth + textGap;
          const centre = vertical ? groupY + side.imageHeight + gap + top.imageHeight / 2 : groupY + groupHeight / 2;
          textY = clamp(centre - textHeight / 2, sceneTop, bottom - textHeight);
        }
      }
      function position(view, x, y) {
        view.left = x - view.insetX; view.top = y - view.insetY;
        view.element.style.setProperty('--view-x', `${view.left - view.element.offsetLeft}px`);
        view.element.style.setProperty('--view-y', `${view.top - view.element.offsetTop}px`);
      }
      if (vertical) {
        position(side, groupX + (groupWidth - side.imageWidth) / 2, groupY);
        position(top, groupX + (groupWidth - top.imageWidth) / 2, groupY + side.imageHeight + gap);
      } else {
        position(side, groupX, groupY + (groupHeight - side.imageHeight) / 2);
        position(top, groupX + side.imageWidth + gap, groupY + (groupHeight - top.imageHeight) / 2);
      }
      if (active) { copy.style.left = `${textX}px`; copy.style.top = `${textY}px`; }
    }
    function renderView(view) {
      const bottom = height - view.top - view.height;
      renderer.setViewport(view.left, bottom, view.width, view.height);
      renderer.setScissor(view.left, bottom, view.width, view.height);
      renderer.clearDepth();
      renderer.render(scene, view.camera);
    }
    paint = (value) => {
      if (stage.clientWidth !== width || stage.clientHeight !== height) {
        width = stage.clientWidth;
        height = stage.clientHeight;
        renderer.setSize(width, height, false);
      }
      if (!width || !height) return;
      ageUniform.value = value;
      const profile = profileValues;
      profileA.set(profile[0], profile[1], profile[2]); profileB.set(profile[3], profile[4], profile[5], profile[6]);
      profileC.set(profile[7], profile[8], profile[9]);
      profileD.set(profile[10], profile[11], profile[12]);
      cerebellum.update(value, cerebellarProfileAdjustment(profile));
      renderer.setScissorTest(false);
      renderer.clear();
      renderer.setScissorTest(true);
      const side = prepareView($('lateral'), lateralCamera, 172);
      const top = prepareView($('superior'), topCamera, 214);
      arrangeViews(side, top);
      renderView(side);
      renderView(top);
      renderer.setScissorTest(false);
    };
    new ResizeObserver(requestPaint).observe(stage);
    new ResizeObserver(requestPaint).observe($('age-callout'));
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
    profilesButton.disabled = !vertexLabels;
    if (!vertexLabels) profilesButton.title = 'Atlas anatomique indisponible. Rechargez la page pour réessayer.';
  } catch (error) {
    renderer?.dispose();
    showFailure('Le cerveau n’a pas pu être affiché. Vérifiez votre connexion et la disponibilité de WebGL dans votre navigateur.', error);
  }
}

initialize();
