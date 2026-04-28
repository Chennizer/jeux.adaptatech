import { getLang, t } from './i18n.js';

let mode = localStorage.getItem('routine-input-mode') || 'touch';
let dwellMs = Number(localStorage.getItem('routine-dwell-ms') || 1500);
let userHasInteracted = false;

export function getInputState() { return { mode, dwellMs }; }

export function setMode(newMode) {
  mode = newMode;
  localStorage.setItem('routine-input-mode', mode);
}

export function setDwell(ms) {
  dwellMs = ms;
  localStorage.setItem('routine-dwell-ms', String(ms));
}

export function markInteracted() { userHasInteracted = true; }
export function hasInteracted() { return userHasInteracted; }

export function makeActivatable(el, onActivate) {
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  el.addEventListener('click', (e) => { userHasInteracted = true; onActivate(e); });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    if (e.key === 'Escape') { window.location.href = './index.html'; }
  });
  if (mode === 'dwell') attachDwell(el, onActivate);
}

function attachDwell(el, onActivate) {
  let timer = null;
  const indicator = document.createElement('div');
  indicator.className = 'dwell-indicator';
  el.style.position = 'relative';
  el.appendChild(indicator);

  const start = () => {
    indicator.style.animationDuration = `${dwellMs}ms`;
    indicator.classList.add('active');
    timer = setTimeout(() => { indicator.classList.remove('active'); el.click(); }, dwellMs);
  };
  const cancel = () => {
    indicator.classList.remove('active');
    if (timer) clearTimeout(timer);
    timer = null;
  };
  el.addEventListener('pointerenter', start);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointerdown', () => { cancel(); });
}

export function applyInputMode(root = document) {
  root.querySelectorAll('[data-activatable]')?.forEach(btn => {
    makeActivatable(btn, () => btn.dispatchEvent(new CustomEvent('activated')));
  });
}

export function applyLangToAria(root = document) {
  const lang = getLang();
  root.querySelectorAll('[data-i18n]')?.forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.setAttribute('aria-label', t(key, lang));
  });
}

window.addEventListener('click', () => markInteracted());
window.addEventListener('keydown', () => markInteracted());
