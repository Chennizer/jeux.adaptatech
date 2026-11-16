const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the actual page script with deterministic time and lightweight DOM/
// Web Audio doubles. These checks do not substitute for browser or hardware QA.
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
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
      this.noteName = new Element('span');
    }
    append(element) { this.children.push(element); }
    querySelector(selector) { return selector === '.note-name' ? this.noteName : null; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key]; }
    closest() {
      return ['input', 'select', 'textarea', 'a'].includes(this.tagName) ||
        (this.tagName === 'button' && !this.classes.has('flower')) ? this : null;
    }
    showModal() { this.open = true; }
    close() { this.open = false; }
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
    if (attrs['data-i18n']) {
      element.dataset.i18n = attrs['data-i18n'];
      translated.push(element);
    }
  }
  const $ = id => elements.get(id);
  $('input-mode').value = mode;
  $('note-count').textContent = '0';
  $('awakened-count').textContent = '0 / 6';
  const scene = new Element();
  const document = Object.assign(new Events(), {
    hidden: false,
    body: new Element('body'),
    documentElement: new Element('html'),
    getElementById: $,
    createElement: tag => new Element(tag),
    querySelector: selector => selector === '.garden-scene' ? scene : null,
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
  if (saved) storage.set('bellGardenSettings', JSON.stringify(saved));
  const localStorage = {
    getItem(key) { if (brokenStorage) throw new Error('Storage disabled'); return storage.get(key) || null; },
    setItem(key, value) { if (brokenStorage) throw new Error('Storage disabled'); storage.set(key, value); }
  };
  const window = Object.assign(new Events(), { matchMedia: () => ({ matches: false }) });
  if (audioSupport) window.AudioContext = AudioContext;
  vm.runInNewContext(script, {
    document, window, localStorage,
    setTimeout: (fn, delay) => schedule(fn, delay), clearTimeout: id => jobs.delete(id),
    setInterval: (fn, delay) => schedule(fn, delay, delay), clearInterval: id => jobs.delete(id)
  });
  const flowers = $('garden').children;
  const key = (code, values = {}) => document.emit('keydown', { target: $('garden'), code, key: code, ...values });
  const click = id => $(id).emit('click');
  const start = () => click('start-button');
  return { $, document, scene, flowers, translated, audioContexts, storage, advance, key, click, start };
}

test('audio starts after entry; a pointer tap rings once and all six flowers awaken', () => {
  const h = harness();
  assert.equal(h.audioContexts.length, 0);
  assert.equal(h.$('settings-dialog').open, true);
  assert.equal(h.flowers.length, 6);
  h.start();
  assert.equal(h.$('settings-dialog').open, false);
  for (const flower of h.flowers) {
    flower.emit('pointerdown');
    flower.emit('click', { detail: 1 });
  }
  assert.equal(Number(h.$('note-count').textContent), 6);
  assert.equal(h.$('awakened-count').textContent, '6 / 6');
  assert.equal(h.scene.classList.contains('garden-complete'), true);
  assert.equal(h.audioContexts[0].oscillators.length, 24);
  h.flowers[0].emit('click'); // Screen-reader/native keyboard activation.
  assert.equal(Number(h.$('note-count').textContent), 7);
  assert.equal(h.$('awakened-count').textContent, '6 / 6');
});

test('dwell cancels on leaving, fires once per visit, and cannot double-fire after a tap', () => {
  const h = harness({ mode: 'gaze' });
  h.start();
  const flower = h.flowers[0];
  flower.emit('pointerenter', { pointerType: 'mouse' });
  h.advance(799);
  assert.equal(h.$('note-count').textContent, '0');
  flower.emit('pointerleave');
  h.advance(1000);
  assert.equal(h.$('note-count').textContent, '0');
  flower.emit('pointerenter', { pointerType: 'mouse' });
  h.advance(800);
  assert.equal(Number(h.$('note-count').textContent), 1);
  h.advance(3200);
  assert.equal(Number(h.$('note-count').textContent), 1);
  flower.emit('pointerleave');
  flower.emit('pointerenter', { pointerType: 'mouse' });
  h.advance(400);
  flower.emit('pointerdown');
  flower.emit('click', { detail: 1 });
  h.advance(1000);
  assert.equal(Number(h.$('note-count').textContent), 2);
  flower.emit('pointerleave');
  flower.emit('pointerenter', { pointerType: 'touch' });
  h.advance(1000);
  assert.equal(Number(h.$('note-count').textContent), 2);
});

test('one-switch scanning moves the outline, ignores held keys, and pauses in options and hidden tabs', () => {
  const h = harness({ mode: 'scan' });
  h.start();
  assert.equal(h.flowers[0].classList.contains('is-selected'), true);
  h.advance(1500);
  assert.equal(h.flowers[1].classList.contains('is-selected'), true);
  h.key('Space');
  h.key('Space', { repeat: true });
  assert.equal(Number(h.$('note-count').textContent), 1);
  h.click('settings-button');
  h.advance(4000);
  h.key('Space');
  assert.equal(Number(h.$('note-count').textContent), 1);
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

test('two switches separate moving from playing; form controls keep their keyboard input', () => {
  const h = harness({ mode: 'step' });
  h.start();
  h.key('Enter');
  h.key('Enter', { repeat: true });
  assert.equal(h.flowers[1].classList.contains('is-selected'), true);
  assert.equal(h.$('note-count').textContent, '0');
  h.key('Space');
  assert.equal(Number(h.$('note-count').textContent), 1);
  assert.equal(h.flowers[1].classList.contains('is-discovered'), true);
  h.key('Space', { target: h.$('volume') });
  h.key('Digit6', { key: '6', ctrlKey: true });
  assert.equal(Number(h.$('note-count').textContent), 1);
});

test('keyboard arrows move focus so native Enter activates the selected flower', () => {
  const h = harness();
  h.start();
  h.key('ArrowRight');
  assert.equal(h.document.activeElement, h.flowers[1]);
  h.document.activeElement.emit('click');
  assert.equal(Number(h.$('note-count').textContent), 1);
  assert.equal(h.flowers[1].classList.contains('is-discovered'), true);
  h.key('ArrowLeft');
  h.key('ArrowLeft');
  assert.equal(h.document.activeElement, h.flowers[5]);
});

test('demo never advances player progress, is interrupted by playing, and can be stopped', () => {
  const h = harness();
  h.start();
  h.click('demo-button');
  h.advance(1000);
  assert.equal(h.$('note-count').textContent, '0');
  assert.equal(h.$('awakened-count').textContent, '0 / 6');
  assert.ok(h.audioContexts[0].oscillators.length > 0);
  h.flowers[3].emit('pointerdown');
  assert.equal(h.$('demo-button').getAttribute('aria-pressed'), 'false');
  const played = h.audioContexts[0].oscillators.length;
  h.advance(7000);
  assert.equal(h.audioContexts[0].oscillators.length, played);
  assert.equal(Number(h.$('note-count').textContent), 1);
  h.click('demo-button');
  h.advance(0);
  h.click('demo-button');
  const stopped = h.audioContexts[0].oscillators.length;
  h.advance(7000);
  assert.equal(h.audioContexts[0].oscillators.length, stopped);
});

test('reset clears discovery, celebrations, sound, and scheduled demo notes', () => {
  const h = harness();
  h.start();
  h.flowers.forEach(flower => flower.emit('pointerdown'));
  h.click('demo-button');
  h.advance(0);
  h.click('reset-button');
  const played = h.audioContexts[0].oscillators.length;
  h.advance(7000);
  assert.equal(h.audioContexts[0].oscillators.length, played);
  assert.equal(h.$('note-count').textContent, '0');
  assert.equal(h.$('awakened-count').textContent, '0 / 6');
  assert.equal(h.scene.classList.contains('garden-complete'), false);
  assert.ok(h.flowers.every(flower => !flower.classList.contains('is-discovered')));
  assert.ok(h.audioContexts[0].oscillators.every(oscillator => oscillator.ended && oscillator.disconnected));
});

test('rapid playing releases audio nodes, volume and mute operate on the master gain', () => {
  const h = harness();
  h.start();
  const audio = h.audioContexts[0];
  assert.equal(audio.gains[0].gain.value, .55);
  for (let i = 0; i < 30; i++) h.flowers[i % 6].emit('pointerdown');
  assert.equal(Number(h.$('note-count').textContent), 30);
  h.advance(50);
  assert.ok(audio.oscillators.filter(oscillator => !oscillator.ended).length <= 48);
  h.click('mute-button');
  assert.equal(audio.gains[0].gain.value, 0);
  h.click('mute-button');
  assert.equal(audio.gains[0].gain.value, .55);
  h.$('volume').value = '25';
  h.$('volume').emit('input');
  assert.equal(audio.gains[0].gain.value, .25);
  h.advance(3000);
  assert.ok(audio.oscillators.every(oscillator => oscillator.ended && oscillator.disconnected));
});

test('all languages update note labels and the shared language preference', () => {
  const h = harness();
  assert.ok(h.translated.every(element => typeof element.textContent === 'string' && element.textContent.length > 0));
  assert.match(h.flowers[0].getAttribute('aria-label'), /Play bell C/);
  h.click('language-button');
  assert.equal(h.document.documentElement.lang, 'ja');
  assert.equal(h.storage.get('siteLanguage'), 'ja');
  assert.match(h.flowers[0].getAttribute('aria-label'), /ド/);
  assert.ok(h.translated.every(element => typeof element.textContent === 'string' && element.textContent.length > 0));
  h.click('language-button');
  assert.equal(h.document.documentElement.lang, 'fr');
  assert.match(h.flowers[0].getAttribute('aria-label'), /Do/);
  assert.ok(h.translated.every(element => typeof element.textContent === 'string' && element.textContent.length > 0));
});

test('the garden remains playable when audio or browser storage is unavailable', () => {
  const h = harness({ audioSupport: false, brokenStorage: true });
  h.start();
  h.flowers[0].emit('pointerdown');
  assert.equal(Number(h.$('note-count').textContent), 1);
  assert.equal(h.$('awakened-count').textContent, '1 / 6');
  assert.equal(h.$('audio-notice').hidden, false);
  h.click('language-button');
  assert.equal(h.document.documentElement.lang, 'en');
});

test('saved settings are restored with bounded values, and options cancel a pending dwell', () => {
  const h = harness({ saved: { mode: 'gaze', dwell: 9999, scan: -500, volume: 200, gentle: true } });
  assert.equal(Number(h.$('dwell-time').value), 2500);
  assert.equal(Number(h.$('scan-time').value), 600);
  assert.equal(Number(h.$('volume').value), 100);
  assert.equal(h.document.body.classList.contains('gentle'), true);
  h.start();
  h.flowers[0].emit('pointerenter', { pointerType: 'mouse' });
  h.advance(1000);
  h.click('settings-button');
  h.advance(3000);
  assert.equal(h.$('note-count').textContent, '0');
  h.$('input-mode').value = 'scan';
  h.start();
  assert.equal(JSON.parse(h.storage.get('bellGardenSettings')).mode, 'scan');
});
