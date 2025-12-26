(() => {
  const canvas = document.getElementById('fluid-canvas');
  const langBtn = document.getElementById('language-toggle');

  // Translation button mirrors other games script behaviour
  function setupLanguageToggle() {
    if (!langBtn) return;
    const langs = ['fr', 'en', 'ja'];
    let current = localStorage.getItem('lang') || 'fr';
    updateText(current);
    langBtn.textContent = current.toUpperCase();
    langBtn.addEventListener('click', () => {
      const idx = langs.indexOf(current);
      current = langs[(idx + 1) % langs.length];
      localStorage.setItem('lang', current);
      updateText(current);
      langBtn.textContent = current.toUpperCase();
    });
  }

  function updateText(lang) {
    document.querySelectorAll('.translate').forEach(el => {
      const val = el.dataset[lang];
      if (val) el.textContent = val;
    });
    document.documentElement.lang = lang;
  }

  setupLanguageToggle();

  const config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 0.985,
    VELOCITY_DISSIPATION: 0.98,
    PRESSURE: 0.8,
    CURL: 24,
    SPLAT_RADIUS: 0.28,
    SPLAT_FORCE: 1.2,
    AUTO_SPLATS: 25,
    COLOR_SOFT: false,
  };

  const pointers = [pointerPrototype()];
  let splatStack = 0;
  let colorAcc = 0;

  function pointerPrototype() {
    return {
      id: -1,
      down: false,
      moved: false,
      color: generateColor(),
      posX: 0,
      posY: 0,
      prevX: 0,
      prevY: 0,
    };
  }

  function generateColor() {
    const soft = config.COLOR_SOFT;
    const palette = soft
      ? [
          [129, 140, 248],
          [244, 114, 182],
          [52, 211, 153],
          [125, 211, 252],
          [248, 180, 117],
        ]
      : [
          [45, 212, 191],
          [244, 63, 94],
          [139, 92, 246],
          [248, 113, 113],
          [34, 211, 238],
        ];
    const pick = palette[Math.floor(Math.random() * palette.length)];
    return pick.map(v => v / 255);
  }

  const gl = canvas.getContext('webgl2', { alpha: true, depth: false });
  if (!gl) {
    alert('WebGL 2 is required to run this simulation.');
    return;
  }

  let ext;
  function initExtensions() {
    gl.getExtension('OES_texture_float');
    gl.getExtension('OES_texture_half_float');
    gl.getExtension('OES_texture_float_linear');
    gl.getExtension('OES_texture_half_float_linear');
    ext = gl.getExtension('EXT_color_buffer_float');
    if (!ext) {
      alert('Float render targets are not supported by this browser.');
      return false;
    }
    return true;
  }
  if (!initExtensions()) return;

  const baseVertexShader = `#version 300 es
  precision highp float;
  layout (location = 0) in vec2 aPosition;
  out vec2 vUv;
  void main () {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
  `;

  const clearShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uTexture;
  uniform float value;
  void main () {
    fragColor = texture(uTexture, vUv) * value;
  }
  `;

  const displayShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uTexture;
  void main () {
    vec3 c = texture(uTexture, vUv).rgb;
    fragColor = vec4(pow(c, vec3(1.0/1.2)), 1.0);
  }
  `;

  const splatShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uTarget;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  void main () {
    vec2 p = vUv - point;
    p.x *= 1.0 + 0.3 * sin(point.y * 3.14159);
    vec3 splat = color * exp(-dot(p, p) / radius);
    vec3 base = texture(uTarget, vUv).rgb;
    fragColor = vec4(base + splat, 1.0);
  }
  `;

  const advectionShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;
  void main () {
    vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
    vec4 result = texture(uSource, coord);
    fragColor = result * dissipation;
  }
  `;

  const divergenceShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;
  void main () {
    float L = texture(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
    float B = texture(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
    float T = texture(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
    float div = (R - L + T - B) * 0.5;
    fragColor = vec4(div, 0.0, 0.0, 1.0);
  }
  `;

  const curlShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;
  void main () {
    float L = texture(uVelocity, vUv - vec2(texelSize.x, 0.0)).y;
    float R = texture(uVelocity, vUv + vec2(texelSize.x, 0.0)).y;
    float B = texture(uVelocity, vUv - vec2(0.0, texelSize.y)).x;
    float T = texture(uVelocity, vUv + vec2(0.0, texelSize.y)).x;
    float c = R - L - T + B;
    fragColor = vec4(c, 0.0, 0.0, 1.0);
  }
  `;

  const vorticityShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform vec2 texelSize;
  uniform float curl;
  uniform float dt;
  void main () {
    float L = texture(uCurl, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture(uCurl, vUv + vec2(texelSize.x, 0.0)).x;
    float B = texture(uCurl, vUv - vec2(0.0, texelSize.y)).x;
    float T = texture(uCurl, vUv + vec2(0.0, texelSize.y)).x;
    float C = texture(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    vec2 vel = texture(uVelocity, vUv).xy;
    vel += force * dt;

    fragColor = vec4(vel, 0.0, 1.0);
  }
  `;

  const pressureShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 texelSize;
  void main () {
    float L = texture(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float B = texture(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    float T = texture(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    float div = texture(uDivergence, vUv).x;
    float pressure = (L + R + B + T - div) * 0.25;
    fragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
  `;

  const gradSubtractShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform sampler2D uVelocity;
  uniform sampler2D uPressure;
  uniform vec2 texelSize;
  void main () {
    float L = texture(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float B = texture(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    float T = texture(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    vec2 vel = texture(uVelocity, vUv).xy;
    vel -= vec2(R - L, T - B);
    fragColor = vec4(vel, 0.0, 1.0);
  }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(vertexSource, fragmentSource) {
    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  function getUniforms(program) {
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return uniforms;
  }

  const baseProgram = createProgram(baseVertexShader, displayShader);
  const clearProgram = createProgram(baseVertexShader, clearShader);
  const splatProgram = createProgram(baseVertexShader, splatShader);
  const advectionProgram = createProgram(baseVertexShader, advectionShader);
  const divergenceProgram = createProgram(baseVertexShader, divergenceShader);
  const curlProgram = createProgram(baseVertexShader, curlShader);
  const vorticityProgram = createProgram(baseVertexShader, vorticityShader);
  const pressureProgram = createProgram(baseVertexShader, pressureShader);
  const gradProgram = createProgram(baseVertexShader, gradSubtractShader);

  const programs = {
    base: { program: baseProgram, uniform: getUniforms(baseProgram) },
    clear: { program: clearProgram, uniform: getUniforms(clearProgram) },
    splat: { program: splatProgram, uniform: getUniforms(splatProgram) },
    advect: { program: advectionProgram, uniform: getUniforms(advectionProgram) },
    divergence: { program: divergenceProgram, uniform: getUniforms(divergenceProgram) },
    curl: { program: curlProgram, uniform: getUniforms(curlProgram) },
    vorticity: { program: vorticityProgram, uniform: getUniforms(vorticityProgram) },
    pressure: { program: pressureProgram, uniform: getUniforms(pressureProgram) },
    grad: { program: gradProgram, uniform: getUniforms(gradProgram) },
  };

  const quadVAO = gl.createVertexArray();
  gl.bindVertexArray(quadVAO);
  const quadVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function createFBO(w, h, internalFormat, format, type) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return { fbo, texture: tex, width: w, height: h };
  }

  function createDoubleFBO(w, h, internalFormat, format, type) {
    let fbo1 = createFBO(w, h, internalFormat, format, type);
    let fbo2 = createFBO(w, h, internalFormat, format, type);

    return {
      get read() { return fbo1; },
      get write() { return fbo2; },
      swap() { const tmp = fbo1; fbo1 = fbo2; fbo2 = tmp; },
    };
  }

  const HALF_FLOAT = gl.HALF_FLOAT;
  const RGBA = gl.RGBA;
  const RG = gl.RG;
  const RG16F = gl.RG16F;
  const RGBA16F = gl.RGBA16F;

  let velocity, density, divergence, curl, pressure;

  function initFramebuffers() {
    const simRes = config.SIM_RESOLUTION;
    const dyeRes = config.DYE_RESOLUTION;
    velocity = createDoubleFBO(simRes, simRes, RG16F, RG, HALF_FLOAT);
    density = createDoubleFBO(dyeRes, dyeRes, RGBA16F, RGBA, HALF_FLOAT);
    divergence = createFBO(simRes, simRes, RG16F, RG, HALF_FLOAT);
    curl = createFBO(simRes, simRes, RG16F, RG, HALF_FLOAT);
    pressure = createDoubleFBO(simRes, simRes, RG16F, RG, HALF_FLOAT);
  }
  initFramebuffers();
  splatStack = 8;

  function resizeCanvas() {
    const { clientWidth, clientHeight } = canvas.parentElement;
    canvas.width = clientWidth;
    canvas.height = clientHeight;
    gl.viewport(0, 0, clientWidth, clientHeight);
  }

  new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
  resizeCanvas();

  function blit(target) {
    if (target == null) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width, target.height);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function splat(x, y, dx, dy, color) {
    gl.useProgram(programs.splat.program);
    gl.uniform1i(programs.splat.uniform['uTarget'], 0);
    gl.uniform1f(programs.splat.uniform['radius'], config.SPLAT_RADIUS);

    gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo);
    gl.viewport(0, 0, velocity.write.width, velocity.write.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    gl.uniform2f(programs.splat.uniform['point'], x, y);
    gl.uniform3f(programs.splat.uniform['color'], dx, dy, 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    velocity.swap();

    gl.bindFramebuffer(gl.FRAMEBUFFER, density.write.fbo);
    gl.viewport(0, 0, density.write.width, density.write.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, density.read.texture);
    gl.uniform3f(programs.splat.uniform['color'], color[0], color[1], color[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    density.swap();
  }

  function multipleSplats(count) {
    for (let i = 0; i < count; i++) {
      const color = generateColor();
      const x = Math.random();
      const y = Math.random();
      const dx = (Math.random() - 0.5) * config.SPLAT_FORCE;
      const dy = (Math.random() - 0.5) * config.SPLAT_FORCE;
      splat(x, y, dx, dy, color);
    }
  }

  function step(dt) {
    gl.disable(gl.BLEND);

    // Curl
    gl.useProgram(programs.curl.program);
    gl.uniform2f(programs.curl.uniform['texelSize'], 1.0 / velocity.read.width, 1.0 / velocity.read.height);
    gl.uniform1i(programs.curl.uniform['uVelocity'], 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    blit(curl);

    // Vorticity
    gl.useProgram(programs.vorticity.program);
    gl.uniform2f(programs.vorticity.uniform['texelSize'], 1.0 / velocity.read.width, 1.0 / velocity.read.height);
    gl.uniform1f(programs.vorticity.uniform['curl'], config.CURL);
    gl.uniform1f(programs.vorticity.uniform['dt'], dt);
    gl.uniform1i(programs.vorticity.uniform['uVelocity'], 0);
    gl.uniform1i(programs.vorticity.uniform['uCurl'], 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, curl.texture);
    blit(velocity.write);
    velocity.swap();

    // Divergence
    gl.useProgram(programs.divergence.program);
    gl.uniform2f(programs.divergence.uniform['texelSize'], 1.0 / velocity.read.width, 1.0 / velocity.read.height);
    gl.uniform1i(programs.divergence.uniform['uVelocity'], 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    blit(divergence);

    // Clear pressure
    gl.useProgram(programs.clear.program);
    gl.uniform1i(programs.clear.uniform['uTexture'], 0);
    gl.uniform1f(programs.clear.uniform['value'], config.PRESSURE);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
    blit(pressure.write);
    pressure.swap();

    // Pressure solve
    gl.useProgram(programs.pressure.program);
    gl.uniform2f(programs.pressure.uniform['texelSize'], 1.0 / velocity.read.width, 1.0 / velocity.read.height);
    gl.uniform1i(programs.pressure.uniform['uDivergence'], 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, divergence.texture);
    for (let i = 0; i < 16; i++) {
      gl.uniform1i(programs.pressure.uniform['uPressure'], 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
      blit(pressure.write);
      pressure.swap();
    }

    // Gradient subtract
    gl.useProgram(programs.grad.program);
    gl.uniform2f(programs.grad.uniform['texelSize'], 1.0 / velocity.read.width, 1.0 / velocity.read.height);
    gl.uniform1i(programs.grad.uniform['uPressure'], 0);
    gl.uniform1i(programs.grad.uniform['uVelocity'], 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    blit(velocity.write);
    velocity.swap();

    // Advect velocity
    gl.useProgram(programs.advect.program);
    gl.uniform2f(programs.advect.uniform['texelSize'], 1.0 / velocity.read.width, 1.0 / velocity.read.height);
    gl.uniform1f(programs.advect.uniform['dt'], dt);
    gl.uniform1f(programs.advect.uniform['dissipation'], config.VELOCITY_DISSIPATION);
    gl.uniform1i(programs.advect.uniform['uVelocity'], 0);
    gl.uniform1i(programs.advect.uniform['uSource'], 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    blit(velocity.write);
    velocity.swap();

    // Advect dye
    gl.uniform1f(programs.advect.uniform['dissipation'], config.DENSITY_DISSIPATION);
    gl.uniform1i(programs.advect.uniform['uSource'], 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, density.read.texture);
    blit(density.write);
    density.swap();
  }

  function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(programs.base.program);
    gl.uniform1i(programs.base.uniform['uTexture'], 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, density.read.texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  let last = Date.now();
  function loop() {
    const now = Date.now();
    const dt = Math.min((now - last) / 1000, 0.016);
    last = now;

    if (splatStack > 0) {
      multipleSplats(splatStack);
      splatStack = 0;
    }

    // Auto splats
    colorAcc += dt * (config.AUTO_SPLATS / 60);
    while (colorAcc > 1) {
      splat(Math.random(), Math.random(), 0.12 * (Math.random() - 0.5), 0.12 * (Math.random() - 0.5), generateColor());
      colorAcc -= 1;
    }

    pointers.forEach(p => {
      if (!p.moved) return;
      p.moved = false;
      splat(p.posX, p.posY, (p.posX - p.prevX) * config.SPLAT_FORCE, (p.posY - p.prevY) * config.SPLAT_FORCE, p.color);
    });

    step(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function convertEventToPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: 1 - (e.clientY - rect.top) / rect.height,
    };
  }

  canvas.addEventListener('pointerdown', e => {
    const point = convertEventToPoint(e);
    const pointer = pointers[0];
    pointer.down = true;
    pointer.moved = true;
    pointer.prevX = pointer.posX = point.x;
    pointer.prevY = pointer.posY = point.y;
  });

  canvas.addEventListener('pointermove', e => {
    const pointer = pointers[0];
    if (!pointer.down) return;
    const point = convertEventToPoint(e);
    pointer.prevX = pointer.posX;
    pointer.prevY = pointer.posY;
    pointer.posX = point.x;
    pointer.posY = point.y;
    pointer.moved = true;
  });

  window.addEventListener('pointerup', () => {
    pointers[0].down = false;
  });

  // UI bindings
  const forceInput = document.getElementById('force');
  const forceValue = document.getElementById('forceValue');
  const dyeInput = document.getElementById('dyeDissipation');
  const dyeValue = document.getElementById('dyeValue');
  const curlInput = document.getElementById('curl');
  const curlValue = document.getElementById('curlValue');
  const splatInput = document.getElementById('splatRate');
  const splatValue = document.getElementById('splatValue');
  const resetBtn = document.getElementById('reset');
  const paletteBtn = document.getElementById('colorShift');

  function updateUI() {
    forceValue.textContent = `${Number(config.SPLAT_FORCE).toFixed(1)}x`;
    dyeValue.textContent = Number(config.DENSITY_DISSIPATION).toFixed(3);
    curlValue.textContent = `${config.CURL}`;
    splatValue.textContent = `${config.AUTO_SPLATS}`;
    forceInput.value = config.SPLAT_FORCE;
    dyeInput.value = config.DENSITY_DISSIPATION;
    curlInput.value = config.CURL;
    splatInput.value = config.AUTO_SPLATS;
  }

  forceInput.addEventListener('input', e => {
    config.SPLAT_FORCE = Number(e.target.value);
    updateUI();
  });

  dyeInput.addEventListener('input', e => {
    config.DENSITY_DISSIPATION = Number(e.target.value);
    updateUI();
  });

  curlInput.addEventListener('input', e => {
    config.CURL = Number(e.target.value);
    updateUI();
  });

  splatInput.addEventListener('input', e => {
    config.AUTO_SPLATS = Number(e.target.value);
    updateUI();
  });

  resetBtn.addEventListener('click', () => {
    initFramebuffers();
    splatStack = 10;
  });

  paletteBtn.addEventListener('click', () => {
    config.COLOR_SOFT = !config.COLOR_SOFT;
    paletteBtn.classList.toggle('active', config.COLOR_SOFT);
  });

  // keyboard accessibility
  resetBtn.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') resetBtn.click(); });
  paletteBtn.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') paletteBtn.click(); });

  updateUI();
})();
