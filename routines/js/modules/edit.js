import Storage from '../engine/storage.js';
import I18N from '../engine/i18n.js';
import UI from '../engine/ui.js';
import Media from '../engine/media.js';
import Input from '../engine/input.js';

(async () => {
  let preset = await Storage.loadPreset();
  if (!localStorage.getItem('routine_language')) I18N.setLanguage(preset.languageDefault || 'en');
  document.documentElement.lang = I18N.current();
  Media.init();
  UI.applyTheme(preset);
  let dirty = false;
  const markDirty = () => dirty = true;
  UI.renderTopbar({ confirmExit: () => !dirty || confirm(I18N.t('confirmExit')) });

  document.querySelector('h1').textContent = I18N.t('editTitle');
  document.querySelector('#save').textContent = I18N.t('save');
  document.querySelector('#reset').textContent = I18N.t('reset');
  document.querySelector('#export').textContent = I18N.t('export');
  document.querySelector('#import-label').textContent = I18N.t('import');
  document.querySelector('#students-title').textContent = I18N.t('students');
  document.querySelector('#schedule-title').textContent = I18N.t('schedule');
  document.querySelector('#transitions-title').textContent = I18N.t('transitionsEdit');
  document.querySelector('#add-student').textContent = I18N.t('addStudent');
  document.querySelector('#add-schedule').textContent = I18N.t('addSchedule');
  document.querySelector('#add-transition').textContent = I18N.t('addTransition');

  const studentsList = document.querySelector('#students-list');
  const scheduleList = document.querySelector('#schedule-list');
  const transitionsList = document.querySelector('#transitions-list');

  const renderStudents = () => {
    studentsList.innerHTML = '';
    preset.students.forEach((s, idx) => {
      const card = document.createElement('div');
      card.className = 'form-card';
      card.innerHTML = `
        <label>${I18N.t('label')}: <input type="text" value="${s.displayName}" data-field="displayName"></label>
        <label>Photo URL: <input type="url" value="${s.photoUrl}" data-field="photoUrl"></label>
        <label>${I18N.t('audio')}: <input type="url" value="${s.helloAudioUrl || ''}" data-field="helloAudioUrl"></label>
        <button class="btn secondary" data-action="delete">${I18N.t('delete')}</button>
      `;
      card.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => { s[input.dataset.field] = input.value; markDirty(); });
      });
      card.querySelector('[data-action="delete"]').addEventListener('click', () => { preset.students.splice(idx,1); markDirty(); renderStudents(); });
      studentsList.append(card);
    });
  };

  const renderSchedule = () => {
    scheduleList.innerHTML = '';
    preset.schedule.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'form-card';
      card.innerHTML = `
        <label>${I18N.t('label')} FR <input type="text" value="${p.label?.fr || ''}" data-field="fr"></label>
        <label>${I18N.t('label')} EN <input type="text" value="${p.label?.en || ''}" data-field="en"></label>
        <label>${I18N.t('label')} JA <input type="text" value="${p.label?.ja || ''}" data-field="ja"></label>
        <label>Picto URL <input type="url" value="${p.pictoUrl}" data-field="pictoUrl"></label>
        <label>${I18N.t('audio')} <input type="url" value="${p.audioUrl || ''}" data-field="audioUrl"></label>
        <button class="btn secondary" data-action="delete">${I18N.t('delete')}</button>
      `;
      card.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
          if (!p.label) p.label = { fr:'', en:'', ja:'' };
          if (['fr','en','ja'].includes(input.dataset.field)) {
            p.label[input.dataset.field] = input.value;
          } else {
            p[input.dataset.field] = input.value;
          }
          markDirty();
        });
      });
      card.querySelector('[data-action="delete"]').addEventListener('click', () => { preset.schedule.splice(idx,1); markDirty(); renderSchedule(); });
      scheduleList.append(card);
    });
  };

  const renderTransitions = () => {
    transitionsList.innerHTML = '';
    preset.transitions.forEach((t, idx) => {
      const card = document.createElement('div');
      card.className = 'form-card';
      card.innerHTML = `
        <label>${I18N.t('label')} FR <input type="text" value="${t.label?.fr || ''}" data-field="fr"></label>
        <label>${I18N.t('label')} EN <input type="text" value="${t.label?.en || ''}" data-field="en"></label>
        <label>${I18N.t('label')} JA <input type="text" value="${t.label?.ja || ''}" data-field="ja"></label>
        <label>Label key <input type="text" value="${t.labelKey || ''}" data-field="labelKey"></label>
        <label>Picto URL <input type="url" value="${t.pictoUrl}" data-field="pictoUrl"></label>
        <label>${I18N.t('audio')} <input type="url" value="${t.audioUrl || ''}" data-field="audioUrl"></label>
        <label>${I18N.t('behavior')} <select data-field="behavior">
          <option value="momentary" ${t.behavior==='momentary'?'selected':''}>${I18N.t('momentary')}</option>
          <option value="toggle" ${t.behavior==='toggle'?'selected':''}>${I18N.t('toggle')}</option>
        </select></label>
        <label>${I18N.t('durationMs')} <input type="number" value="${t.durationMs || 4000}" data-field="durationMs"></label>
        <button class="btn secondary" data-action="delete">${I18N.t('delete')}</button>
      `;
      card.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => {
          if (['fr','en','ja'].includes(input.dataset.field)) {
            t.label = t.label || { fr:'', en:'', ja:'' };
            t.label[input.dataset.field] = input.value;
          } else if (input.dataset.field === 'durationMs') {
            t.durationMs = Number(input.value);
          } else {
            t[input.dataset.field] = input.value;
          }
          markDirty();
        });
      });
      card.querySelector('[data-action="delete"]').addEventListener('click', () => { preset.transitions.splice(idx,1); markDirty(); renderTransitions(); });
      transitionsList.append(card);
    });
  };

  document.querySelector('#add-student').addEventListener('click', () => {
    preset.students.push({ id: `s${Date.now()}`, displayName: 'New', photoUrl: '', helloAudioUrl: '', tags: [] });
    markDirty();
    renderStudents();
  });

  document.querySelector('#add-schedule').addEventListener('click', () => {
    preset.schedule.push({ id: `p${Date.now()}`, pictoUrl: '', label: { fr:'', en:'', ja:'' }, audioUrl: '' });
    markDirty();
    renderSchedule();
  });

  document.querySelector('#add-transition').addEventListener('click', () => {
    preset.transitions.push({ id: `t${Date.now()}`, pictoUrl: '', label: { fr:'', en:'', ja:'' }, audioUrl: '', behavior: 'momentary', durationMs: 4000 });
    markDirty();
    renderTransitions();
  });

  document.querySelector('#save').addEventListener('click', () => {
    Storage.savePreset(preset);
    dirty = false;
    alert(I18N.t('saved'));
  });

  document.querySelector('#export').addEventListener('click', () => Storage.exportPreset(preset));
  document.querySelector('#import').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (file) {
      preset = await Storage.importPreset(file);
      dirty = false;
      renderStudents(); renderSchedule(); renderTransitions();
    }
  });

  document.querySelector('#reset').addEventListener('click', async () => {
    preset = await Storage.ensureDefaults(await (await fetch('./presets/example-class.json')).json());
    Storage.savePreset(preset);
    dirty = false;
    renderStudents(); renderSchedule(); renderTransitions();
  });

  renderStudents();
  renderSchedule();
  renderTransitions();
})();
