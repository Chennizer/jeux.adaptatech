const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/video-utils.js'), 'utf8');
function setup(document = {}) {
  const context = { window: {}, document, URL, Set, Promise };
  vm.runInNewContext(source, context);
  return context.window.VideoUtils;
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('requests fullscreen on the application container and exits it', async () => {
  const document = {};
  const element = { requestFullscreen() { document.fullscreenElement = this; return Promise.resolve(); } };
  document.exitFullscreen = () => { document.fullscreenElement = null; };
  const utils = setup(document);
  utils.enterFullscreen(element);
  await settle();
  assert.equal(document.fullscreenElement, element);
  utils.exitFullscreen(element);
  assert.equal(document.fullscreenElement, null);
});
test('supports the Safari prefixed container API', async () => {
  const document = {};
  const element = { webkitRequestFullscreen() { document.webkitFullscreenElement = this; } };
  document.webkitExitFullscreen = () => { document.webkitFullscreenElement = null; };
  const utils = setup(document);
  utils.enterFullscreen(element);
  await settle();
  assert.equal(document.webkitFullscreenElement, element);
  utils.exitFullscreen(element);
  assert.equal(document.webkitFullscreenElement, null);
});
test('unsupported, throwing, and rejected fullscreen leave playback free to continue', async () => {
  const utils = setup();
  utils.enterFullscreen({});
  utils.enterFullscreen({ requestFullscreen() { throw new Error('Unavailable'); } });
  utils.enterFullscreen({ requestFullscreen() { return Promise.reject(new Error('Not allowed')); } });
  await settle();
});
test('a delayed fullscreen request is closed if the teacher has already returned', async () => {
  const document = {};
  let complete;
  const element = { requestFullscreen() { return new Promise(resolve => { complete = () => { document.fullscreenElement = this; resolve(); }; }); } };
  document.exitFullscreen = () => { document.fullscreenElement = null; };
  const utils = setup(document);
  let student = true;
  utils.enterFullscreen(element, () => student);
  student = false;
  complete();
  await settle();
  assert.equal(document.fullscreenElement, null);
});
test('does not exit fullscreen owned by another element', () => {
  const document = { fullscreenElement: {}, exitFullscreen() { assert.fail('Unexpected fullscreen exit'); } };
  setup(document).exitFullscreen({});
});
