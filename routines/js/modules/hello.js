import { renderTopbar, localizedLabel } from '../engine/ui.js';
import { loadPreset, savePreset } from '../engine/storage.js';
import { t, getLang } from '../engine/i18n.js';
import { applyLangToAria, makeActivatable } from '../engine/input.js';
import { playAudio } from '../engine/media.js';

const HELLO_DURATION = 4000;

window.addEventListener('DOMContentLoaded', async () => {
  await renderTopbar();
  const lang = getLang();
  const preset = await loadPreset();
  const params = new URLSearchParams(location.search);
  const attendanceMode = params.get('mode') === 'attendance';
  document.getElementById('mode-title').textContent = attendanceMode ? t('attendanceMode', lang) : t('helloMode', lang);
  const grid = document.getElementById('student-grid');
  grid.innerHTML = '';
  const layout = computeGridLayout(preset.students.length);
  grid.style.setProperty('--student-cols', layout.cols);
  grid.style.setProperty('--student-rows', layout.rows);
  preset.students.forEach(stu => {
    const card = document.createElement('button');
    card.className = 'card student-card';
    card.dataset.activatable = 'true';
    card.setAttribute('data-i18n', 'hello');
    card.innerHTML = `<img src="${stu.photoUrl}" alt="${stu.displayName}"><div class="name-banner"><span>${stu.displayName}</span></div>`;
    const status = preset.attendance?.[stu.id] || 'unknown';
    if (attendanceMode) {
      card.classList.add(status);
      const badge = document.createElement('div');
      badge.className = 'status-badge';
      badge.textContent = status;
      card.appendChild(badge);
    }
    makeActivatable(card, () => handleStudent(stu, card, preset, attendanceMode, lang));
    grid.appendChild(card);
  });
  document.getElementById('back').textContent = t('back', lang);
  document.getElementById('back').addEventListener('click', () => location.href = './index.html');
  applyLangToAria();
});

function computeGridLayout(count) {
  if (count <= 0) return { cols: 1, rows: 1 };
  let cols;
  if (count <= 4) {
    cols = Math.min(4, count);
  } else if (count <= 9) {
    cols = 3;
  } else {
    cols = 4;
  }
  let rows = Math.ceil(count / cols);
  if (rows > 4) {
    rows = 4;
    cols = Math.min(4, Math.ceil(count / rows));
  }
  return { cols, rows };
}

function handleStudent(stu, card, preset, attendanceMode, lang) {
  if (attendanceMode) {
    const current = preset.attendance?.[stu.id] || 'unknown';
    const next = current === 'unknown' ? 'present' : current === 'present' ? 'absent' : 'unknown';
    preset.attendance = { ...preset.attendance, [stu.id]: next };
    savePreset(preset);
    card.classList.remove('unknown', 'present', 'absent');
    card.classList.add(next);
    const badge = card.querySelector('.status-badge');
    badge.textContent = next;
    showOverlay(stu, lang, next);
  } else {
    showOverlay(stu, lang);
    playAudio(stu.helloAudioUrl, preset.audio.volume);
  }
}

function showOverlay(stu, lang, status) {
  const overlay = document.getElementById('overlay');
  overlay.querySelector('img').src = stu.photoUrl;
  overlay.querySelector('.big-label').textContent = status ? `${stu.displayName} - ${status}` : `${t('hello', lang)} ${stu.displayName}!`;
  overlay.classList.add('active');
  setTimeout(() => overlay.classList.remove('active'), HELLO_DURATION);
}
