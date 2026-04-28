import I18N from '../engine/i18n.js';
import Storage from '../engine/storage.js';
import UI from '../engine/ui.js';
import Input from '../engine/input.js';

let preset;

function createStudentEditor(student) {
  const container = document.createElement('div');
  container.className = 'editor-item';
  const nameInput = document.createElement('input');
  nameInput.value = student.displayName || '';
  nameInput.placeholder = 'Name';
  nameInput.addEventListener('input', () => { student.displayName = nameInput.value; });
  const photoInput = document.createElement('input');
  photoInput.value = student.photoUrl || '';
  photoInput.placeholder = 'Photo URL';
  photoInput.addEventListener('input', () => { student.photoUrl = photoInput.value; });
  const audioInput = document.createElement('input');
  audioInput.value = student.helloAudioUrl || '';
  audioInput.placeholder = 'Hello audio URL';
  audioInput.addEventListener('input', () => { student.helloAudioUrl = audioInput.value; });
  const delBtn = document.createElement('button');
  delBtn.textContent = I18N.t('delete');
  delBtn.addEventListener('click', () => {
    preset.students = preset.students.filter((s) => s !== student);
    render();
  });
  container.append(nameInput, photoInput, audioInput, delBtn);
  return container;
}

function createScheduleEditor(item) {
  const container = document.createElement('div');
  container.className = 'editor-item';
  const picto = document.createElement('input');
  picto.value = item.pictoUrl || '';
  picto.placeholder = 'Picto URL';
  picto.addEventListener('input', () => item.pictoUrl = picto.value);
  const labelFr = document.createElement('input');
  labelFr.value = item.label?.fr || '';
  labelFr.placeholder = 'Label FR';
  labelFr.addEventListener('input', () => { item.label = item.label || {}; item.label.fr = labelFr.value; });
  const labelEn = document.createElement('input');
  labelEn.value = item.label?.en || '';
  labelEn.placeholder = 'Label EN';
  labelEn.addEventListener('input', () => { item.label = item.label || {}; item.label.en = labelEn.value; });
  const labelJa = document.createElement('input');
  labelJa.value = item.label?.ja || '';
  labelJa.placeholder = 'Label JA';
  labelJa.addEventListener('input', () => { item.label = item.label || {}; item.label.ja = labelJa.value; });
  const audio = document.createElement('input');
  audio.value = item.audioUrl || '';
  audio.placeholder = 'Audio URL';
  audio.addEventListener('input', () => item.audioUrl = audio.value);
  const delBtn = document.createElement('button');
  delBtn.textContent = I18N.t('delete');
  delBtn.addEventListener('click', () => {
    preset.schedule = preset.schedule.filter((s) => s !== item);
    render();
  });
  container.append(picto, labelFr, labelEn, labelJa, audio, delBtn);
  return container;
}

function createTransitionEditor(item) {
  const container = document.createElement('div');
  container.className = 'editor-item';
  const picto = document.createElement('input');
  picto.value = item.pictoUrl || '';
  picto.placeholder = 'Picto URL';
  picto.addEventListener('input', () => item.pictoUrl = picto.value);
  const labelKey = document.createElement('input');
  labelKey.value = item.labelKey || '';
  labelKey.placeholder = 'labelKey (optional)';
  labelKey.addEventListener('input', () => item.labelKey = labelKey.value);
  const duration = document.createElement('input');
  duration.type = 'number';
  duration.value = item.durationMs || 3000;
  duration.placeholder = 'durationMs';
  duration.addEventListener('input', () => item.durationMs = parseInt(duration.value, 10));
  const behavior = document.createElement('input');
  behavior.value = item.behavior || 'momentary';
  behavior.placeholder = 'behavior';
  behavior.addEventListener('input', () => item.behavior = behavior.value);
  const audio = document.createElement('input');
  audio.value = item.audioUrl || '';
  audio.placeholder = 'Audio URL';
  audio.addEventListener('input', () => item.audioUrl = audio.value);
  const delBtn = document.createElement('button');
  delBtn.textContent = I18N.t('delete');
  delBtn.addEventListener('click', () => {
    preset.transitions = preset.transitions.filter((t) => t !== item);
    render();
  });
  container.append(picto, labelKey, duration, behavior, audio, delBtn);
  return container;
}

function render() {
  const studentList = document.getElementById('studentsList');
  studentList.innerHTML = '';
  preset.students.forEach((s) => studentList.appendChild(createStudentEditor(s)));
  const addStudent = document.getElementById('addStudent');
  addStudent.textContent = I18N.t('add');
  addStudent.onclick = () => {
    preset.students.push({ id: `s${Date.now()}`, displayName: 'New', photoUrl: '', helloAudioUrl: '' });
    render();
  };

  const scheduleList = document.getElementById('scheduleList');
  scheduleList.innerHTML = '';
  preset.schedule.forEach((s) => scheduleList.appendChild(createScheduleEditor(s)));
  const addStep = document.getElementById('addStep');
  addStep.textContent = I18N.t('add');
  addStep.onclick = () => {
    preset.schedule.push({ id: `p${Date.now()}`, pictoUrl: '', label: { fr: '', en: '', ja: '' }, audioUrl: '' });
    render();
  };

  const transList = document.getElementById('transitionList');
  transList.innerHTML = '';
  preset.transitions.forEach((t) => transList.appendChild(createTransitionEditor(t)));
  const addTrans = document.getElementById('addTransition');
  addTrans.textContent = I18N.t('add');
  addTrans.onclick = () => {
    preset.transitions.push({ id: `t${Date.now()}`, pictoUrl: '', label: { fr: '', en: '', ja: '' }, behavior: 'momentary', durationMs: 3000 });
    render();
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  I18N.init();
  preset = await Storage.loadPreset();
  UI.setPreset(preset);
  Input.init(preset.inputDefaults);

  UI.renderTopBar(document.getElementById('top'), { title: I18N.t('edit') });
  UI.setKeyEscape(() => window.location.href = 'index.html');

  document.getElementById('savePreset').textContent = I18N.t('save');
  document.getElementById('exportPreset').textContent = I18N.t('export');
  document.getElementById('importPreset').textContent = I18N.t('import');
  document.getElementById('resetPreset').textContent = I18N.t('confirm');

  document.getElementById('savePreset').onclick = () => {
    Storage.savePreset(preset);
    alert('Saved');
  };
  document.getElementById('exportPreset').onclick = () => Storage.exportPreset(preset);
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      preset = await Storage.importPreset(file);
      Storage.savePreset(preset);
      UI.setPreset(preset);
      render();
    }
  });
  document.getElementById('importPreset').onclick = () => document.getElementById('importFile').click();
  document.getElementById('resetPreset').onclick = async () => {
    preset = await Storage.loadFallbackPreset();
    Storage.savePreset(preset);
    UI.setPreset(preset);
    render();
  };

  render();
});
