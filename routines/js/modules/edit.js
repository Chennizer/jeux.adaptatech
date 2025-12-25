import { renderTopbar, localizedLabel } from '../engine/ui.js';
import { loadPreset, savePreset, exportPreset, importPreset, resetPreset } from '../engine/storage.js';
import { t, getLang } from '../engine/i18n.js';
import { makeActivatable } from '../engine/input.js';

let currentPreset = null;

window.addEventListener('DOMContentLoaded', async () => {
  await renderTopbar({ confirmOnBack: true });
  currentPreset = await loadPreset();
  const lang = getLang();
  document.getElementById('title').textContent = `${t('edit', lang)} - Routine Engine`;
  renderStudents(lang);
  renderSchedule(lang);
  renderTransitions(lang);
  document.getElementById('save').textContent = t('save', lang);
  document.getElementById('save').addEventListener('click', () => { savePreset(currentPreset); alert('Saved'); });
  document.getElementById('export').textContent = t('export', lang);
  document.getElementById('export').addEventListener('click', () => {
    const blob = new Blob([exportPreset(currentPreset)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'routine-preset.json'; a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById('import').textContent = t('import', lang);
  document.getElementById('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    currentPreset = importPreset(text);
    savePreset(currentPreset);
    renderStudents(lang); renderSchedule(lang); renderTransitions(lang);
  });
  document.getElementById('reset').textContent = t('reset', lang);
  document.getElementById('reset').addEventListener('click', () => { currentPreset = resetPreset(); location.reload(); });
});

function renderStudents(lang) {
  const list = document.getElementById('students');
  list.innerHTML = '';
  currentPreset.students.forEach((stu, idx) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <label>${t('label', lang)}<input data-field="displayName" data-idx="${idx}" value="${stu.displayName}"></label>
      <label>${t('photo', lang)}<input data-field="photoUrl" data-idx="${idx}" value="${stu.photoUrl}"></label>
      <label>${t('audio', lang)}<input data-field="helloAudioUrl" data-idx="${idx}" value="${stu.helloAudioUrl}"></label>
      <button class="control-btn" data-action="delete" data-idx="${idx}">${t('delete', lang)}</button>
    `;
    list.appendChild(div);
  });
  const addBtn = document.getElementById('add-student');
  addBtn.textContent = t('add', lang);
  addBtn.onclick = () => { currentPreset.students.push({ id: `s${Date.now()}`, displayName: 'New', photoUrl: '', helloAudioUrl: '' }); renderStudents(lang); };
  list.querySelectorAll('input').forEach(inp => inp.addEventListener('input', handleStudentChange));
  list.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', () => { currentPreset.students.splice(btn.dataset.idx,1); renderStudents(lang);}));
}

function handleStudentChange(e) {
  const idx = Number(e.target.dataset.idx);
  const field = e.target.dataset.field;
  currentPreset.students[idx][field] = e.target.value;
}

function renderSchedule(lang) {
  const list = document.getElementById('schedule');
  list.innerHTML = '';
  currentPreset.schedule.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <label>${t('label', lang)} FR<input data-sfield="fr" data-idx="${idx}" value="${item.label?.fr||''}"></label>
      <label>${t('label', lang)} EN<input data-sfield="en" data-idx="${idx}" value="${item.label?.en||''}"></label>
      <label>${t('label', lang)} JA<input data-sfield="ja" data-idx="${idx}" value="${item.label?.ja||''}"></label>
      <label>${t('photo', lang)}<input data-sfield="pictoUrl" data-idx="${idx}" value="${item.pictoUrl}"></label>
      <label>${t('audio', lang)}<input data-sfield="audioUrl" data-idx="${idx}" value="${item.audioUrl||''}"></label>
      <button class="control-btn" data-action="delete" data-idx="${idx}">${t('delete', lang)}</button>
    `;
    list.appendChild(div);
  });
  const addBtn = document.getElementById('add-schedule');
  addBtn.textContent = t('add', lang);
  addBtn.onclick = () => { currentPreset.schedule.push({ id: `p${Date.now()}`, pictoUrl: '', label: { fr:'', en:'', ja:'' }, audioUrl:'' }); renderSchedule(lang); };
  list.querySelectorAll('input').forEach(inp => inp.addEventListener('input', handleScheduleChange));
  list.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', () => { currentPreset.schedule.splice(btn.dataset.idx,1); renderSchedule(lang);}));
}

function handleScheduleChange(e) {
  const idx = Number(e.target.dataset.idx);
  const field = e.target.dataset.sfield;
  if (['fr','en','ja'].includes(field)) {
    currentPreset.schedule[idx].label = currentPreset.schedule[idx].label || {};
    currentPreset.schedule[idx].label[field] = e.target.value;
  } else {
    currentPreset.schedule[idx][field] = e.target.value;
  }
}

function renderTransitions(lang) {
  const list = document.getElementById('transitions');
  list.innerHTML = '';
  currentPreset.transitions.forEach((tr, idx) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <label>${t('label', lang)}<input data-tfield="label" data-idx="${idx}" value="${localizedLabel(tr, lang)}"></label>
      <label>${t('photo', lang)}<input data-tfield="pictoUrl" data-idx="${idx}" value="${tr.pictoUrl}"></label>
      <label>${t('audio', lang)}<input data-tfield="audioUrl" data-idx="${idx}" value="${tr.audioUrl||''}"></label>
      <label>${t('behavior', lang)}<select data-tfield="behavior" data-idx="${idx}"><option value="momentary" ${tr.behavior==='momentary'?'selected':''}>${t('momentary', lang)}</option><option value="toggle" ${tr.behavior==='toggle'?'selected':''}>${t('toggle', lang)}</option></select></label>
      <label>${t('duration', lang)}<input data-tfield="durationMs" data-idx="${idx}" type="number" value="${tr.durationMs||3000}"></label>
      <button class="control-btn" data-action="delete" data-idx="${idx}">${t('delete', lang)}</button>
    `;
    list.appendChild(div);
  });
  const addBtn = document.getElementById('add-transition');
  addBtn.textContent = t('add', lang);
  addBtn.onclick = () => { currentPreset.transitions.push({ id: `t${Date.now()}`, label: { fr:'', en:'', ja:'' }, pictoUrl:'', behavior:'momentary', durationMs:3000 }); renderTransitions(lang); };
  list.querySelectorAll('input,select').forEach(inp => inp.addEventListener('input', handleTransitionChange));
  list.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', () => { currentPreset.transitions.splice(btn.dataset.idx,1); renderTransitions(lang);}));
}

function handleTransitionChange(e) {
  const idx = Number(e.target.dataset.idx);
  const field = e.target.dataset.tfield;
  if (field === 'label') {
    currentPreset.transitions[idx].label = currentPreset.transitions[idx].label || { fr:'', en:'', ja:'' };
    currentPreset.transitions[idx].label[getLang()] = e.target.value;
  } else if (field === 'durationMs') {
    currentPreset.transitions[idx][field] = Number(e.target.value);
  } else {
    currentPreset.transitions[idx][field] = e.target.value;
  }
}
