import Storage from '../engine/storage.js';
import I18N from '../engine/i18n.js';
import UI from '../engine/ui.js';
import Media from '../engine/media.js';
import Input from '../engine/input.js';

const HELLO_DURATION = 4000;

const params = new URLSearchParams(location.search);
const mode = params.get('mode') || 'hello';

(async () => {
  const preset = await Storage.loadPreset();
  if (!localStorage.getItem('routine_language')) I18N.setLanguage(preset.languageDefault || 'en');
  document.documentElement.lang = I18N.current();
  Media.init();
  UI.applyTheme(preset);
  UI.renderTopbar();

  document.querySelector('h1').textContent = mode === 'attendance' ? I18N.t('attendanceMode') : I18N.t('helloMode');

  const container = document.querySelector('#students');
  const overlay = document.querySelector('#overlay');
  const overlayTitle = overlay.querySelector('.title');
  const overlayImg = overlay.querySelector('img');

  const setAttendance = (id, state) => {
    preset.attendance[id] = state;
    Storage.savePreset(preset);
  };

  const renderStudents = () => {
    container.innerHTML = '';
    preset.students.forEach(student => {
      const card = document.createElement('button');
      card.className = 'card';
      card.setAttribute('aria-label', student.displayName);
      const img = document.createElement('img');
      img.src = student.photoUrl;
      img.alt = '';
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = student.displayName;
      card.append(img, name);

      const attendanceState = preset.attendance[student.id] || 'unknown';
      if (mode === 'attendance') {
        card.dataset.state = attendanceState;
        if (attendanceState === 'present') card.classList.add('status-present');
        if (attendanceState === 'absent') card.classList.add('status-absent');
      }

      const activate = () => {
        if (mode === 'hello') {
          overlayTitle.textContent = I18N.t('helloScene').replace('{name}', student.displayName);
          overlayImg.src = student.photoUrl;
          overlay.style.display = 'flex';
          Media.playAudio(student.helloAudioUrl);
          setTimeout(() => overlay.style.display = 'none', HELLO_DURATION);
        } else {
          const nextState = attendanceState === 'unknown' ? 'present' : attendanceState === 'present' ? 'absent' : 'unknown';
          preset.attendance[student.id] = nextState;
          Storage.savePreset(preset);
          renderStudents();
        }
      };

      Input.setupButton(card, activate);
      container.appendChild(card);
    });
  };

  renderStudents();
})();
