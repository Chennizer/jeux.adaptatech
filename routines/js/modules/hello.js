import I18N from '../engine/i18n.js';
import Storage from '../engine/storage.js';
import UI from '../engine/ui.js';
import Input from '../engine/input.js';
import Media from '../engine/media.js';

const HELLO_DURATION = 4000;

function renderStudents(preset) {
  const grid = document.getElementById('studentGrid');
  grid.innerHTML = '';
  preset.students.forEach((student) => {
    const btn = document.createElement('button');
    const state = preset.attendance[student.id] || 'unknown';
    btn.className = `card attendance-state ${state}`;
    btn.dataset.id = student.id;
    const img = document.createElement('img');
    img.src = student.photoUrl || 'images/default-avatar.png';
    const name = document.createElement('div');
    name.textContent = student.displayName;
    const stateLabel = document.createElement('div');
    stateLabel.textContent = I18N.t(state);
    btn.append(img, name, stateLabel);
    btn.addEventListener('click', () => handleStudentClick(student, preset));
    grid.appendChild(btn);
  });
  Input.bindAll(grid);
}

function handleStudentClick(student, preset) {
  const mode = document.querySelector('input[name="helloMode"]:checked').value;
  if (mode === 'hello') showHelloScene(student, preset);
  else toggleAttendance(student, preset);
}

function showHelloScene(student, preset) {
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-overlay';
  const img = document.createElement('img');
  img.src = student.photoUrl || 'images/default-avatar.png';
  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = `${I18N.t('helloScene')} ${student.displayName}`;
  overlay.append(img, label);
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), HELLO_DURATION);
  if (preset.audio.enabled) Media.play(student.helloAudioUrl, preset.audio.volume);
}

function toggleAttendance(student, preset) {
  const current = preset.attendance[student.id] || 'unknown';
  const next = current === 'unknown' ? 'present' : current === 'present' ? 'absent' : 'unknown';
  preset.attendance[student.id] = next;
  Storage.savePreset(preset);
  renderStudents(preset);
}

document.addEventListener('DOMContentLoaded', async () => {
  I18N.init();
  const preset = await Storage.loadPreset();
  UI.setPreset(preset);
  Input.init(preset.inputDefaults);
  Media.attachInteractionListeners();

  UI.renderTopBar(document.getElementById('top'), { title: `${I18N.t('helloModule')} / ${I18N.t('attendanceModule')}` });
  UI.setKeyEscape(() => window.location.href = 'index.html');

  document.getElementById('helloLabel').textContent = I18N.t('hello');
  document.getElementById('attendanceLabel').textContent = I18N.t('attendance');

  renderStudents(preset);
});
