import { buildMaturationWindows, ageParts } from './maturation.js';

const $ = (id) => document.getElementById(id);
const range = $('age');
const stage = $('stage');
const playButton = $('play');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const about = $('about');
let age = Number(range.value) / 12;
let playing = false;
let ready = false;
let frame = 0;
let previousTime = 0;
let paint = () => {};
let resetViews = () => {};

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
  range.style.setProperty('--position', `${selectedMonths / 240 * 100}%`);
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
  if (playing) {
    // Explicit playback is allowed with reduced motion, at discrete yearly steps.
    if (previousTime) {
      const elapsed = Math.min((time - previousTime) / 1000, 0.1);
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
    previousTime = time;
    if (age >= 20) { setPlaying(false); announceAge(); }
  }
  paint(age);
  if (playing) requestPaint();
}

let yearlyAccumulator = 0;
function announceAge() {
  $('announcement').textContent = range.getAttribute('aria-valuetext');
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
  setAge(0);
  resetViews();
  announceAge();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) setPlaying(false); });
$('information').addEventListener('click', () => { setPlaying(false); about.showModal(); });
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

    const response = await fetch('./assets/cortex.bin');
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
    for (let i = 0; i < vertexCount; i++) {
      const [x, y, z] = native.subarray(i * 3, i * 3 + 3);
      positions.set([y, z, x], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('sulcalDepth', new THREE.BufferAttribute(sulcalDepth, 1));
    geometry.setAttribute('maturation', new THREE.BufferAttribute(windows, 4));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.center();
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    const ageUniform = { value: age };
    const palette = ['#e84335', '#f48d32', '#e9cc49', '#a4bf51', '#39a76a'].map((color) => new THREE.Color(color));
    const material = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uAge = ageUniform;
      palette.forEach((color, i) => { shader.uniforms[`uColor${i}`] = { value: color }; });
      shader.vertexShader = `attribute vec4 maturation;\nattribute float sulcalDepth;\nvarying float vMaturity;\nvarying float vSulc;\nuniform float uAge;\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\nfloat later = smoothstep(maturation.x, maturation.y, uAge);\nfloat infant = 1.0 - exp(-max(0.0, uAge) / maturation.w);\nvMaturity = mix(later, infant, maturation.z);\nvSulc = sulcalDepth;`);
      shader.fragmentShader = `varying float vMaturity;\nvarying float vSulc;\nuniform vec3 uColor0;\nuniform vec3 uColor1;\nuniform vec3 uColor2;\nuniform vec3 uColor3;\nuniform vec3 uColor4;\n${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        float p = clamp(vMaturity, 0.0, 1.0) * 4.0;
        vec3 heat = p < 1.0 ? mix(uColor0, uColor1, p) :
                    p < 2.0 ? mix(uColor1, uColor2, p - 1.0) :
                    p < 3.0 ? mix(uColor2, uColor3, p - 2.0) : mix(uColor3, uColor4, p - 3.0);
        float groove = 1.0 - 0.38 * smoothstep(-0.5, 1.3, vSulc);
        diffuseColor.rgb = heat * groove;
      `);
    };

    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
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

    const dragSurface = $('lateral');
    let drag = null;
    dragSurface.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, yaw, pitch, id: event.pointerId };
      dragSurface.setPointerCapture(event.pointerId);
    });
    dragSurface.addEventListener('pointermove', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      yaw = drag.yaw + (event.clientX - drag.x) * 0.007;
      pitch = Math.max(-1.15, Math.min(1.15, drag.pitch + (event.clientY - drag.y) * 0.007));
      updateLateral();
      requestPaint();
    });
    const stopDrag = () => { drag = null; };
    dragSurface.addEventListener('pointerup', stopDrag);
    dragSurface.addEventListener('pointercancel', stopDrag);
    dragSurface.addEventListener('lostpointercapture', stopDrag);
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
      }
      if (!width || !height) return;
      ageUniform.value = value;
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
  } catch (error) {
    renderer?.dispose();
    showFailure('Le cerveau n’a pas pu être affiché. Vérifiez votre connexion et la disponibilité de WebGL dans votre navigateur.', error);
  }
}

initialize();
