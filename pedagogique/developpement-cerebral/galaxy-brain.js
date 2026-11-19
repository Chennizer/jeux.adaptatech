export const GALAXY_DURATION = 6000;

// A slow overall rise and fade. Local stars twinkle independently inside it.
export function galaxyEnvelope(seconds) {
  const smooth = x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
  return smooth(seconds / 1.2) * (1 - smooth((seconds - 4.2) / 1.8));
}

export function createGalaxyEffect(THREE, scene, materials, pixelRatio) {
  const intensity = { value: 0 }, time = { value: 0 }, motion = { value: 1 };
  for (const material of materials) {
    const original = material.onBeforeCompile;
    const originalKey = material.customProgramCacheKey();
    material.onBeforeCompile = function(shader, renderer) {
      original.call(this, shader, renderer);
      shader.uniforms.uGalaxy = intensity;
      shader.uniforms.uGalaxyTime = time;
      shader.uniforms.uGalaxyMotion = motion;
      shader.vertexShader = `varying vec3 vGalaxyPosition;\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGalaxyPosition = transformed;');
      shader.fragmentShader = `varying vec3 vGalaxyPosition;\nuniform float uGalaxy;\nuniform float uGalaxyTime;\nuniform float uGalaxyMotion;\n${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
        #include <emissivemap_fragment>
        if (uGalaxy > 0.0) {
          vec3 p = vGalaxyPosition;
          float ribbon = .5 + .5 * sin(p.y * .075 + sin(p.x * .055 + uGalaxyTime * .45 * uGalaxyMotion) * 2.3 + p.z * .035);
          vec3 cosmic = mix(vec3(.035, .16, .8), vec3(.68, .08, .7), ribbon);
          vec3 cell = floor(p * .45);
          float seed = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          float shimmerTime = uGalaxyTime * mix(.45, 1.0, uGalaxyMotion);
          float sparkle = pow(.5 + .5 * sin(shimmerTime * (2.1 + seed * 1.6) + seed * 6.283), 4.0);
          float dust = pow(max(0.0, sin(p.x * 1.47 + p.y * .63) * sin(p.z * 1.13 - p.y * 1.91)), 18.0) * sparkle;
          diffuseColor.rgb = mix(diffuseColor.rgb, cosmic, uGalaxy * .9);
          totalEmissiveRadiance += uGalaxy * (cosmic * .5 + vec3(.72, .88, 1.0) * dust * 3.2);
        }
      `);
    };
    // Keep the cortical colour shader separate from the cerebellar shader.
    material.customProgramCacheKey = () => `${originalKey}|galaxy-v2`;
  }

  let seed = 1947;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const positions = new Float32Array(320 * 3), phases = new Float32Array(320);
  for (let i = 0; i < 320; i++) {
    const theta = random() * Math.PI * 2, elevation = random() * 2 - 1;
    const radius = 76 + random() * 48, ring = Math.sqrt(1 - elevation * elevation);
    positions.set([Math.cos(theta) * ring * radius, elevation * radius * .8, Math.sin(theta) * ring * radius], i * 3);
    phases[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uGalaxy: intensity, uGalaxyTime: time, uGalaxyMotion: motion, uPixelRatio: { value: pixelRatio } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float phase;
      uniform float uGalaxyTime, uGalaxyMotion, uPixelRatio;
      varying float vPhase;
      void main() {
        vPhase = phase;
        vec3 p = position;
        float a = uGalaxyTime * .22 * uGalaxyMotion;
        p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
        p.y += sin(uGalaxyTime * 1.3 + phase * 6.283) * 7.0 * uGalaxyMotion;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        float blink = .5 + .5 * sin(uGalaxyTime * mix(.8, 2.0, uGalaxyMotion) + phase * 6.283);
        gl_PointSize = (4.0 + phase * 10.0) * (.65 + blink * .6) * uPixelRatio;
      }`,
    fragmentShader: `
      uniform float uGalaxy, uGalaxyTime, uGalaxyMotion;
      varying float vPhase;
      void main() {
        vec2 q = gl_PointCoord - .5;
        float core = exp(-dot(q, q) * 50.0);
        float halo = exp(-dot(q, q) * 9.0) * .18;
        float rays = exp(-abs(q.x) * 65.0 - abs(q.y) * 7.0) + exp(-abs(q.y) * 65.0 - abs(q.x) * 7.0);
        float wave = .5 + .5 * sin(uGalaxyTime * mix(1.0, 2.8, uGalaxyMotion) + vPhase * 6.283);
        float twinkle = .04 + .96 * pow(wave, 3.0);
        vec3 colour = mix(vec3(.18, .65, 1.0), vec3(.9, .25, .8), vPhase);
        gl_FragColor = vec4(colour, (core + halo + rays * .8) * uGalaxy * twinkle);
      }`
  });
  const stars = new THREE.Points(geometry, material);
  stars.visible = false;
  scene.add(stars);
  return {
    update(seconds, strength, animateMotion = true) {
      intensity.value = strength;
      time.value = seconds;
      motion.value = animateMotion ? 1 : 0;
      stars.visible = strength > 0;
    }
  };
}
