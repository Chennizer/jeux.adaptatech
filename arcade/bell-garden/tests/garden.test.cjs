const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the actual page script with deterministic time and lightweight DOM/
// Web Audio doubles. These checks do not substitute for browser or hardware QA.
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const artScript = fs.readFileSync(path.join(__dirname, '../garden-art.js'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../garden.js'), 'utf8');

function harness({ mode = 'tap', audioSupport = true, brokenStorage = false, saved } = {}) {
  let now = 0;
  let timerId = 0;
  const jobs = new Map();
  const audioContexts = [];
  const schedule = (fn, delay, interval = 0) => {
    const id = ++timerId;
    jobs.set(id, { fn, at: now + delay, interval });
    return id;
  };
  function advance(ms) {
    const until = now + ms;
    for (let guard = 0; guard < 10000; guard++) {
      const next = [...jobs].sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next || next[1].at > until) { now = until; return; }
      const [id, job] = next;
      now = job.at;
      jobs.delete(id);
      if (job.interval) jobs.set(id, { ...job, at: now + job.interval });
      job.fn();
    }
    throw new Error('Timer loop did not settle');
  }

  class Events {
    listeners = new Map();
    addEventListener(type, fn) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(fn);
    }
    emit(type, values = {}) {
      const event = { target: this, button: 0, detail: 0, preventDefault() { this.defaultPrevented = true; }, ...values };
      (this.listeners.get(type) || []).forEach(fn => fn(event));
      return event;
    }
  }
  class Element extends Events {
    constructor(tag = 'div') {
      super();
      this.tagName = tag;
      this.children = [];
      this.dataset = {};
      this.attributes = {};
      this.classes = new Set();
      this.hidden = false;
      this.value = '';
      this.checked = false;
      this.textContent = '';
      this.style = { setProperty() {} };
      this.classList = {
        add: (...names) => names.forEach(name => this.classes.add(name)),
        remove: (...names) => names.forEach(name => this.classes.delete(name)),
        contains: name => this.classes.has(name),
        toggle: (name, force) => {
          const add = force === undefined ? !this.classes.has(name) : force;
          add ? this.classes.add(name) : this.classes.delete(name);
          return add;
        }
      };
    }
    set className(value) { this.classes = new Set(value.split(/\s+/)); }
    set innerHTML(value) {
      this.markup = value;

    }
    append(element) { this.children.push(element); }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key]; }
    closest() {
      return ['input', 'select', 'textarea', 'a'].includes(this.tagName) ||
        (this.tagName === 'button' && !this.classes.has('flower')) ? this : null;
    }
    focus() { document.activeElement = this; this.emit('focus'); }
  }
  const elements = new Map();
  const translated = [];
  for (const match of html.matchAll(/<([\w-]+)\b([^>]*)>/g)) {
    const attrs = Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    const element = new Element(match[1]);
    if (attrs.id) elements.set(attrs.id, element);
    if (attrs.class) element.className = attrs.class;
    if (attrs.value) element.value = attrs.value;
    element.hidden = /\bhidden\b/.test(match[2]);
    element.checked = /\bchecked\b/.test(match[2]);
    if (attrs['data-input-mode']) element.dataset.inputMode = attrs['data-input-mode'];
    if (attrs['data-i18n']) {
      element.dataset.i18n = attrs['data-i18n'];
      translated.push(element);
    }
  }
  const $ = id => elements.get(id);
  $('theme').value = 'sky';
  $('switch-mode').value = 'scan';
  const document = Object.assign(new Events(), {
    hidden: false,
    body: new Element('body'),
    documentElement: new Element('html'),
    getElementById: $,
    createElement: tag => new Element(tag),
    querySelectorAll: selector => selector === '[data-i18n]' ? translated : []
  });

  class AudioParam {
    value = 0;
    setValueAtTime() {}
    linearRampToValueAtTime() {}
    exponentialRampToValueAtTime() {}
    cancelScheduledValues() {}
    setTargetAtTime(value) { this.value = value; }
  }
  class AudioNode {
    gain = new AudioParam();
    frequency = new AudioParam();
    threshold = new AudioParam();
    ratio = new AudioParam();
    connect() {}
    disconnect() { this.disconnected = true; }
  }
  class AudioContext {
    state = 'running';
    destination = new AudioNode();
    oscillators = [];
    gains = [];
    constructor() { audioContexts.push(this); }
    get currentTime() { return now / 1000; }
    resume() { return Promise.resolve(); }
    createGain() { const gain = new AudioNode(); this.gains.push(gain); return gain; }
    createDynamicsCompressor() { return new AudioNode(); }
    createOscillator() {
      const node = new AudioNode();
      node.start = () => { node.started = true; };
      node.stop = time => {
        jobs.delete(node.endTimer);
        node.endTimer = schedule(() => { node.ended = true; node.onended?.(); }, Math.max(0, time * 1000 - now));
      };
      this.oscillators.push(node);
      return node;
    }
  }
  const storage = new Map([['siteLanguage', 'en']]);
  storage.set('bellGardenSettings', JSON.stringify({ mode, ...saved }));
  const localStorage = {
    getItem(key) { if (brokenStorage) throw new Error('Storage disabled'); return storage.get(key) || null; },
    setItem(key, value) { if (brokenStorage) throw new Error('Storage disabled'); storage.set(key, value); }
  };
  const window = Object.assign(new Events(), { matchMedia: () => ({ matches: false }) });
  if (audioSupport) window.AudioContext = AudioContext;
  const context = {
    document, window, localStorage,
    setTimeout: (fn, delay) => schedule(fn, delay), clearTimeout: id => jobs.delete(id),
    setInterval: (fn, delay) => schedule(fn, delay, delay), clearInterval: id => jobs.delete(id)
  };
  vm.runInNewContext(artScript, context);
  vm.runInNewContext(script, context);
  const flowers = $('garden').children;
  const key = (code, values = {}) => document.emit('keydown', { target: $('garden'), code, key: code, ...values });
  const click = id => $(id).emit('click');
  const start = () => click('control-panel-start-button');
  const selectMode = next => {
    if (next === 'scan' || next === 'step') {
      click('mode-switch');
      $('switch-mode').value = next;
      $('switch-mode').emit('change');
    } else click('mode-' + next);
  };
  const played = () => (audioContexts[0]?.oscillators.length || 0) / 4;
  return { $, document, window, flowers, translated, audioContexts, storage, advance, key, click, start, selectMode, played };

}

test('the shared arcade menu opens first; play has no visible words, labels or counters', () => {
  const h = harness();
  assert.match(html, /css\/video-stop-action\.css/);
  assert.match(html, /game-menu-layout stop-action-menu-layout/);
  assert.match(html, /game-menu-art-image/);
  assert.equal(h.$('control-panel').hidden, false);
  assert.equal(h.$('game-screen').hidden, true);
  assert.equal(h.audioContexts.length, 0);
  const gameMarkup = html.match(/<main id="game-screen"[\s\S]*?<\/main>/)[0];
  assert.equal(gameMarkup.replace(/<[^>]+>/g, '').trim(), '');
  h.start();
  assert.equal(h.$('control-panel').hidden, true);
  assert.equal(h.$('game-screen').hidden, false);
  assert.equal(h.$('language-toggle').hidden, true);
  assert.equal(h.document.body.classList.contains('garden-running'), true);
  assert.equal(h.flowers.length, 6);
  assert.ok(h.flowers.every(flower => flower.markup.replace(/<[^>]+>/g, '').trim() === ''));
  assert.ok(h.flowers.every(flower => flower.getAttribute('aria-label')));
});

test('a pointer tap rings once; all six flowers have distinct notes and immediate feedback', () => {
  const h = harness();
  h.start();
  for (const flower of h.flowers) {
    flower.emit('pointerdown');
    flower.emit('click', { detail: 1 });
    assert.equal(flower.classList.contains('is-playing'), true);
  }
  assert.equal(h.played(), 6);
  const fundamentals = h.audioContexts[0].oscillators.filter((_, i) => i % 4 === 0).map(o => o.frequency.value);
  assert.equal(new Set(fundamentals).size, 6);
  h.flowers[0].emit('click');
  assert.equal(h.played(), 7);
  h.advance(700);
  assert.ok(h.flowers.every(flower => !flower.classList.contains('is-playing')));
});

test('dwell cancels on leaving, fires once per visit, and cannot double-fire after a tap', () => {
  const h = harness({ mode: 'gaze' });
  h.start();
  const flower = h.flowers[0];
  flower.emit('pointerenter', { pointerType: 'mouse' });
  h.advance(799);
  assert.equal(h.played(), 0);
  flower.emit('pointerleave');
  h.advance(1000);
  assert.equal(h.played(), 0);
  flower.emit('pointerenter', { pointerType: 'mouse' });
  h.advance(800);
  assert.equal(h.played(), 1);
  h.advance(3200);
  assert.equal(h.played(), 1);
  flower.emit('pointerleave');
  flower.emit('pointerenter', { pointerType: 'mouse' });
  h.advance(400);
  flower.emit('pointerdown');
  flower.emit('click', { detail: 1 });
  h.advance(1000);
  assert.equal(h.played(), 2);
  flower.emit('pointerleave');
  flower.emit('pointerenter', { pointerType: 'touch' });
  h.advance(1000);
  assert.equal(h.played(), 2);
});

test('one-switch scanning advances, ignores held switches and pauses in the menu and hidden tabs', () => {
  const h = harness({ mode: 'scan' });
  h.start();
  assert.equal(h.flowers[0].classList.contains('is-selected'), true);
  h.advance(1500);
  assert.equal(h.flowers[1].classList.contains('is-selected'), true);
  h.key('Space');
  h.key('Space', { repeat: true });
  assert.equal(h.played(), 1);
  h.click('settings-button');
  h.advance(4000);
  h.key('Space');
  assert.equal(h.played(), 1);
  assert.equal(h.flowers[1].classList.contains('is-selected'), true);
  h.start();
  h.document.hidden = true;
  h.document.emit('visibilitychange');
  h.advance(4000);
  assert.equal(h.flowers[1].classList.contains('is-selected'), true);
  h.document.hidden = false;
  h.document.emit('visibilitychange');
  h.advance(1500);
  assert.equal(h.flowers[2].classList.contains('is-selected'), true);
});

test('two switches separate moving and playing, while form controls keep their keys', () => {
  const h = harness({ mode: 'step' });
  h.start();
  h.key('Enter');
  h.key('Enter', { repeat: true });
  assert.equal(h.flowers[1].classList.contains('is-selected'), true);
  assert.equal(h.played(), 0);
  h.key('Space');
  assert.equal(h.played(), 1);
  assert.equal(h.flowers[1].classList.contains('is-playing'), true);
  h.key('Space', { target: h.$('volume') });
  h.key('Digit6', { key: '6', ctrlKey: true });
  assert.equal(h.played(), 1);
});

test('keyboard arrows move focus and number keys play notes directly', () => {
  const h = harness();
  h.start();
  h.key('ArrowRight');
  assert.equal(h.document.activeElement, h.flowers[1]);
  h.document.activeElement.emit('click');
  assert.equal(h.played(), 1);
  h.key('ArrowLeft');
  h.key('ArrowLeft');
  assert.equal(h.document.activeElement, h.flowers[5]);
  h.key('Digit6', { key: '6' });
  assert.equal(h.played(), 2);
  assert.equal(h.flowers[5].classList.contains('is-playing'), true);
});

test('the gear and Escape reopen the menu, cancel dwell and stop all sounding notes', () => {
  const h = harness({ mode: 'gaze' });
  h.start();
  h.flowers[1].emit('pointerdown');
  h.flowers[0].emit('pointerenter', { pointerType: 'mouse' });
  h.advance(400);
  h.click('settings-button');
  assert.equal(h.$('control-panel').hidden, false);
  assert.equal(h.$('game-screen').hidden, true);
  assert.equal(h.$('language-toggle').hidden, false);
  assert.equal(h.$('control-panel-start-button').textContent, 'Resume');
  h.advance(3000);
  assert.equal(h.played(), 1);
  assert.ok(h.audioContexts[0].oscillators.every(o => o.ended && o.disconnected));
  h.start();
  h.flowers[0].emit('pointerenter', { pointerType: 'mouse' });
  h.advance(800);
  assert.equal(h.played(), 2);
  h.key('Escape', { target: h.$('settings-button') });
  assert.equal(h.$('control-panel').hidden, false);
});

test('rapid playing has bounded polyphony, and menu volume/mute control the master gain', () => {
  const h = harness();
  h.start();
  const audio = h.audioContexts[0];
  assert.equal(audio.gains[0].gain.value, .55);
  for (let i = 0; i < 30; i++) h.flowers[i % 6].emit('pointerdown');
  assert.equal(h.played(), 30);
  h.advance(50);
  assert.ok(audio.oscillators.filter(o => !o.ended).length <= 48);
  h.click('settings-button');
  h.$('mute-toggle').checked = true;
  h.$('mute-toggle').emit('change');
  assert.equal(audio.gains[0].gain.value, 0);
  h.$('mute-toggle').checked = false;
  h.$('mute-toggle').emit('change');
  h.$('volume').value = '25';
  h.$('volume').emit('input');
  assert.equal(audio.gains[0].gain.value, .25);
  h.advance(3000);
  assert.ok(audio.oscillators.every(o => o.ended && o.disconnected));
});

test('all menu translations and invisible flower names follow the shared language', () => {
  const h = harness();
  assert.ok(h.translated.every(e => typeof e.textContent === 'string' && e.textContent.length > 0));
  assert.match(h.flowers[0].getAttribute('aria-label'), /Play bell C/);
  h.click('language-toggle');
  assert.equal(h.document.documentElement.lang, 'ja');
  assert.equal(h.storage.get('siteLanguage'), 'ja');
  assert.match(h.flowers[0].getAttribute('aria-label'), /ド/);
  assert.ok(h.translated.every(e => typeof e.textContent === 'string' && e.textContent.length > 0));
  h.click('language-toggle');
  assert.equal(h.document.documentElement.lang, 'fr');
  assert.match(h.flowers[0].getAttribute('aria-label'), /Do/);
  assert.ok(h.translated.every(e => typeof e.textContent === 'string' && e.textContent.length > 0));
});

test('visual play remains available without audio or storage; errors do not add visible game text', () => {
  const h = harness({ audioSupport: false, brokenStorage: true });
  h.start();
  h.flowers[0].emit('pointerdown');
  assert.equal(h.flowers[0].classList.contains('is-playing'), true);
  assert.equal(h.$('audio-notice').hidden, false);
  assert.equal(h.$('control-panel').hidden, true);
  assert.match(h.$('audio-status').textContent, /son/);
  h.click('settings-button');
  h.click('language-toggle');
  assert.equal(h.document.documentElement.lang, 'en');
});

test('saved settings restore safely, including background, mute and reduced animations', () => {
  const h = harness({ saved: { mode: 'gaze', dwell: 9999, scan: -500, volume: 200, gentle: true, theme: 'dark', muted: true } });
  assert.equal(Number(h.$('dwell-time').value), 2500);
  assert.equal(Number(h.$('scan-time').value), 600);
  assert.equal(Number(h.$('volume').value), 100);
  assert.equal(h.$('mode-gaze').getAttribute('aria-pressed'), 'true');
  h.start();
  assert.equal(h.document.body.dataset.theme, 'dark');
  assert.equal(h.document.body.classList.contains('gentle'), true);
  assert.equal(h.audioContexts[0].gains[0].gain.value, 0);
  h.click('settings-button');
  h.$('theme').value = 'light';
  h.selectMode('scan');
  h.start();
  const saved = JSON.parse(h.storage.get('bellGardenSettings'));
  assert.equal(saved.mode, 'scan');
  assert.equal(saved.theme, 'light');
  assert.equal(h.$('scan-field').hidden, false);
  assert.equal(h.$('dwell-field').hidden, true);
});

test('switch selection and dwell controls expose only the relevant settings', () => {
  const h = harness();
  assert.equal(h.$('switch-field').hidden, true);
  assert.equal(h.$('dwell-field').hidden, true);
  h.selectMode('gaze');
  assert.equal(h.$('dwell-field').hidden, false);
  h.selectMode('step');
  assert.equal(h.$('switch-field').hidden, false);
  assert.equal(h.$('dwell-field').hidden, true);
  assert.equal(h.$('scan-field').hidden, true);
  h.start();
  h.key('Enter');
  h.key('Space');
  assert.equal(h.flowers[1].classList.contains('is-playing'), true);
});

test('fullscreen is optional and start still works when the browser does not offer it', () => {
  const h = harness();
  let requests = 0;
  h.document.documentElement.requestFullscreen = () => { requests++; return Promise.resolve(); };
  h.start();
  assert.equal(requests, 1);
  h.click('settings-button');
  h.$('fullscreen-toggle').checked = false;
  h.start();
  assert.equal(requests, 1);
  assert.equal(h.$('game-screen').hidden, false);
});

test('six botanical silhouettes share the same controls and keep text out of their artwork', () => {
  const h = harness();
  assert.deepEqual(h.flowers.map(flower => flower.dataset.flower), ['bell', 'daisy', 'tulip', 'anemone', 'poppy', 'cosmos']);
  const crowns = h.flowers.map(flower => flower.markup.match(/<svg class="flower-crown"[\s\S]*?<\/svg>/)[0]);
  assert.equal(new Set(crowns).size, 6);
  assert.ok(crowns.every(crown => !crown.includes('preserveAspectRatio="none"')));
  assert.ok(h.flowers.every(flower => flower.markup.includes('root-art')));
  assert.ok(h.flowers.every(flower => flower.markup.replace(/<[^>]+>/g, '').trim() === ''));
});

test('ambient motion pauses with visibility and resumes only when gameplay is active', () => {
  const h = harness({ mode: 'scan' });
  h.start();
  h.window.emit('blur');
  assert.equal(h.document.body.classList.contains('garden-paused'), true);
  h.advance(4000);
  assert.equal(h.flowers[0].classList.contains('is-selected'), true);
  h.window.emit('focus');
  assert.equal(h.document.body.classList.contains('garden-paused'), false);
  h.advance(1500);
  assert.equal(h.flowers[1].classList.contains('is-selected'), true);
  h.click('settings-button');
  h.window.emit('focus');
  assert.equal(h.document.body.classList.contains('garden-paused'), true);
  h.document.hidden = true;
  h.document.emit('visibilitychange');
  h.document.hidden = false;
  h.document.emit('visibilitychange');
  assert.equal(h.$('control-panel').hidden, false);
});
