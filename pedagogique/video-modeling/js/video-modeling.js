(async function () {
  'use strict';
  const root = document.getElementById('video-app');
  const status = document.getElementById('save-status');
  const modes = [
    ['sequence-once', 'Vidéo puis image', 'Regarder une fois, puis passer à la suite.'],
    ['sequence-repeat', 'Vidéo répétable', 'Toucher l’image pour revoir la vidéo.'],
    ['gallery', 'Galerie', 'Choisir librement une vidéo dans la grille.']
  ];
  let activities = [], activity, student = false, index = 0, phase = '', generation = 0, holdTimer;
  let saved = Promise.resolve(), saveError = false, pendingSaves = 0, actionableAt = 0;
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const button = (text, action, cls = '') => `<button type="button" class="${cls}" data-action="${action}">${text}</button>`;
  function announce(text) { status.textContent = text; }
  function save() {
    const snapshot = structuredClone(activity);
    pendingSaves++;
    announce('Enregistrement…');
    saved = saved.catch(() => {}).then(() => VideoDB.save(snapshot)).then(() => {
      saveError = false; announce('Enregistré sur cet appareil.');
    }).catch(error => {
      saveError = true;
      announce(`Échec de l’enregistrement. ${error.name === 'QuotaExceededError' ? 'Le stockage de cet appareil est plein.' : error.message} Vos changements restent ouverts. Réessayez avant de fermer cette page.`);
    }).finally(() => { pendingSaves--; });
    return saved;
  }
  function clean() {
    generation++;
    document.body.classList.remove('vm-playing');
    clearTimeout(holdTimer);
    holdTimer = null;
    root.querySelectorAll('video').forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); });
    VideoUtils.clear();
  }
  function teacher() {
    clean(); student = false; phase = '';
    VideoUtils.exitFullscreen(root);
    document.body.classList.remove('student');
    root.innerHTML = `
      <header class="vm-header"><a class="vm-link" href="../index.html">← Outils pédagogiques</a><h1>Activités vidéo</h1>${button('Mode élève →', 'student', 'primary')}</header>
      <div class="vm-toolbar"><label>Activité<select id="activity-select">${activities.map(item => `<option value="${item.id}" ${item.id === activity.id ? 'selected' : ''}>${escape(item.title || 'Sans titre')}</option>`).join('')}</select></label>${button('+ Nouvelle activité', 'new')}</div>
      <section class="vm-panel"><label>Titre de l’activité<input class="vm-title" id="activity-title" value="${escape(activity.title)}" placeholder="Ex. Faire une collation"></label>
      <fieldset class="vm-modes"><legend>Présentation pour l’élève</legend>${modes.map(([value, title, description]) => `<label><input type="radio" name="student-mode" value="${value}" ${activity.studentMode === value ? 'checked' : ''}><span>${title}<small>${description}</small></span></label>`).join('')}</fieldset></section>
      <h2>Les vidéos <span>(${activity.videos.length})</span></h2>
      <div class="vm-grid">${activity.videos.map((video, i) => `<article class="vm-card" data-id="${video.id}"><img src="${VideoUtils.url(video.thumbnailBlob)}" alt=""><h3>${i + 1}. ${escape(video.title)}</h3><div class="vm-card-actions">${button('Modifier le titre', 'rename')}${button('Remplacer', 'replace')}<button data-action="earlier" ${i === 0 ? 'disabled' : ''} aria-label="Déplacer ${escape(video.title)} avant">← Avant</button><button data-action="later" ${i === activity.videos.length - 1 ? 'disabled' : ''} aria-label="Déplacer ${escape(video.title)} après">Après →</button>${button('Supprimer', 'delete', 'danger')}</div></article>`).join('')}${button('+ Ajouter une vidéo', 'add', 'vm-add')}</div>
      <p class="vm-note">Les vidéos sont conservées uniquement sur cet appareil. Elles peuvent être effacées si vous supprimez les données du navigateur. Utilisez le même navigateur pour retrouver vos activités.</p>
      <p class="vm-note">Pour revenir du Mode élève : maintenez le coin supérieur gauche pendant 3 secondes (ou maintenez Espace sur ce coin avec le clavier).</p>
      ${button('Réessayer la sauvegarde', 'save')}`;
    root.querySelector('[data-action="student"]').disabled = !activity.videos.length;
  }
  function newActivity() {
    activity = { id: uid(), title: 'Nouvelle activité', studentMode: 'sequence-once', videos: [] };
    activities.push(activity); save(); teacher();
  }
  function modal(html) {
    const dialog = document.createElement('dialog');
    dialog.innerHTML = html;
    root.append(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
    return dialog;
  }
  function editTitle(video) {
    const dialog = modal(`<form><h2>Modifier le titre</h2><label>Titre de la vidéo<input name="title" required value="${escape(video.title)}"></label><div class="vm-toolbar"><button class="primary">Enregistrer</button><button type="button" data-cancel>Annuler</button></div></form>`);
    dialog.querySelector('[data-cancel]').onclick = () => dialog.close();
    dialog.querySelector('form').onsubmit = event => {
      event.preventDefault(); video.title = dialog.querySelector('input').value.trim() || 'Vidéo'; save(); dialog.close(); teacher();
    };
  }
  function importVideo(existing) {
    const dialog = modal(`<h2>${existing ? 'Remplacer la vidéo' : 'Ajouter une vidéo'}</h2><div class="vm-toolbar">${button('Choisir un fichier', 'file')}${button('Filmer une vidéo', 'camera')}</div><input hidden type="file" accept="video/*" id="file-input"><input hidden type="file" accept="video/*" capture="environment" id="camera-input"><p data-message role="status">Choisissez une vidéo ou utilisez la caméra de votre appareil.</p><video hidden playsinline controls preload="metadata"></video><label>Titre de la vidéo<input id="video-title" value="${escape(existing?.title || '')}"></label><div class="vm-toolbar"><button class="primary" data-confirm disabled>Enregistrer</button><button data-cancel>Annuler</button></div>`);
    let pending, preview, busy = false, token = 0;
    dialog.querySelector('[data-action="file"]').onclick = () => dialog.querySelector('#file-input').click();
    dialog.querySelector('[data-action="camera"]').onclick = () => dialog.querySelector('#camera-input').click();
    dialog.querySelector('[data-cancel]').onclick = () => { if (!busy) dialog.close(); };
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    dialog.addEventListener('close', () => {
      token++; const video = dialog.querySelector('video'); video.pause(); video.removeAttribute('src'); video.load();
      if (preview) VideoUtils.release(preview);
    });
    dialog.querySelectorAll('input[type="file"]').forEach(input => input.onchange = async () => {
      const file = input.files[0]; if (!file) return;
      const current = ++token;
      pending = null; dialog.querySelector('[data-confirm]').disabled = true;
      const message = dialog.querySelector('[data-message]');
      message.textContent = 'Préparation de la vignette…';
      if (preview) VideoUtils.release(preview);
      preview = VideoUtils.url(file);
      const video = dialog.querySelector('video'); video.src = preview; video.hidden = false;
      if (!existing) dialog.querySelector('#video-title').value = file.name.replace(/\.[^.]+$/, '') || 'Vidéo';
      try {
        const thumbnailBlob = await VideoUtils.thumbnail(file);
        if (current !== token || !dialog.open) return;
        pending = { videoBlob: file, thumbnailBlob };
        message.textContent = 'Vidéo prête. Vérifiez l’aperçu et le titre.';
        dialog.querySelector('[data-confirm]').disabled = false;
      } catch (error) { if (current === token) message.textContent = error.message; }
    });
    dialog.querySelector('[data-confirm]').onclick = async () => {
      if (!pending || busy) return;
      busy = true;
      dialog.querySelectorAll('button, input').forEach(element => element.disabled = true);
      const video = { ...pending, id: existing?.id || uid(), title: dialog.querySelector('#video-title').value.trim() || 'Vidéo', order: existing?.order ?? activity.videos.length };
      const candidate = { ...activity, videos: existing ? activity.videos.map(item => item.id === existing.id ? video : item) : [...activity.videos, video] };
      await saved;
      try {
        await VideoDB.save(candidate);
        Object.assign(activity, candidate); saveError = false;
        announce('Enregistré sur cet appareil.'); dialog.close(); teacher();
      } catch (error) {
        dialog.querySelector('[data-message]').textContent = `Impossible d’enregistrer la vidéo. ${error.name === 'QuotaExceededError' ? 'Libérez du stockage sur cet appareil.' : error.message}`;
        busy = false; dialog.querySelectorAll('button, input').forEach(element => element.disabled = false);
      }
    };
  }
  function studentShell() {
    clean(); student = true; document.body.classList.add('student');
    root.innerHTML = `<button class="exit-hold" aria-label="Maintenir 3 secondes pour revenir au mode intervenant">···</button><h1 class="vm-student-title">${escape(activity.title)}</h1><div id="student-content"></div>`;
    const exit = root.querySelector('.exit-hold');
    const cancel = () => { clearTimeout(holdTimer); holdTimer = null; exit.classList.remove('holding'); };
    const start = () => { if (holdTimer) return; exit.classList.add('holding'); holdTimer = setTimeout(teacher, 3000); };
    exit.onpointerdown = event => { if (event.button !== 0) return; exit.setPointerCapture(event.pointerId); start(); };
    exit.onpointerup = exit.onpointercancel = exit.onlostpointercapture = exit.onblur = cancel;
    exit.onpointermove = event => { const rect = exit.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) cancel(); };
    exit.oncontextmenu = event => event.preventDefault();
    exit.onkeydown = event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); if (!event.repeat) start(); } };
    exit.onkeyup = cancel;
  }
  function gallery() {
    studentShell(); phase = 'gallery';
    actionableAt = Date.now() + 500;
    const content = root.querySelector('#student-content');
    content.innerHTML = `<div class="vm-grid vm-gallery">${activity.videos.map((video, i) => `<button data-play="${i}"><img src="${VideoUtils.url(video.thumbnailBlob)}" alt=""><span>${escape(video.title)}</span></button>`).join('')}</div>`;
    content.querySelectorAll('[data-play]').forEach(card => card.onclick = () => { if (phase !== 'gallery' || Date.now() < actionableAt) return; index = Number(card.dataset.play); play(); });
    content.querySelector('button')?.focus();
  }
  function still() {
    studentShell(); phase = 'still';
    actionableAt = Date.now() + 500;
    const video = activity.videos[index], repeat = activity.studentMode === 'sequence-repeat';
    const picture = `<img src="${VideoUtils.url(video.thumbnailBlob)}" alt="${escape(video.title)}">`;
    root.querySelector('#student-content').innerHTML = `<div class="vm-stage"><h2>${escape(video.title)}</h2>${repeat ? `<button class="repeat-image" data-repeat>${picture}<span>↻ Revoir la vidéo</span></button>` : picture}<button class="primary" data-next>${index === activity.videos.length - 1 ? 'Terminé' : 'Suivant →'}</button><span>Étape ${index + 1} sur ${activity.videos.length}</span></div>`;
    if (repeat) root.querySelector('[data-repeat]').onclick = () => { if (phase === 'still' && Date.now() >= actionableAt) play(); };
    const next = root.querySelector('[data-next]');
    next.onclick = () => {
      if (phase !== 'still' || Date.now() < actionableAt) return; phase = 'transition';
      if (++index < activity.videos.length) play();
      else { studentShell(); phase = 'finished'; root.querySelector('#student-content').innerHTML = '<h2 class="vm-finish" tabindex="-1">Terminé</h2>'; root.querySelector('.vm-finish').focus(); }
    };
    (repeat ? root.querySelector('[data-repeat]') : next).focus();
  }
  function play() {
    studentShell(); phase = 'playing';
    document.body.classList.add('vm-playing');
    const token = generation, item = activity.videos[index];
    root.querySelector('#student-content').innerHTML = `<div class="vm-stage vm-player"><video aria-label="${escape(item.title)}" playsinline preload="auto" disablepictureinpicture disableremoteplayback tabindex="-1"></video><div class="vm-playback-feedback"><p role="status">Chargement de la vidéo…</p><button class="primary" data-retry hidden>Lire la vidéo</button></div></div>`;
    const video = root.querySelector('video'), message = root.querySelector('[role="status"]'), retry = root.querySelector('[data-retry]');
    let starting = false;
    function failed() {
      if (token !== generation) return;
      starting = false; message.textContent = 'Lecture impossible. Réessayez, ou maintenez le coin supérieur gauche pour remplacer la vidéo.';
      retry.hidden = false; retry.textContent = 'Réessayer'; retry.focus();
    }
    async function begin() {
      if (starting || token !== generation) return;
      starting = true; retry.hidden = true;
      try {
        const playback = video.play();
        VideoUtils.enterFullscreen(root, () => student);
        await playback;
      }
      catch (error) {
        if (token !== generation) return;
        starting = false;
        if (error.name === 'NotAllowedError') { message.textContent = 'Touchez pour démarrer la vidéo.'; retry.hidden = false; retry.focus(); }
        else failed();
      }
    }
    video.onloadedmetadata = () => { if (token === generation) message.textContent = 'Préparation de la lecture…'; };
    video.oncanplay = () => { if (token === generation && !video.paused) message.textContent = ''; };
    video.onplaying = () => { if (token === generation) { starting = false; message.textContent = ''; retry.hidden = true; } };
    video.onended = () => { if (token !== generation || phase !== 'playing') return; activity.studentMode === 'gallery' ? gallery() : still(); };
    video.onerror = failed;
    retry.onclick = () => { if (video.error) video.load(); begin(); };
    video.src = VideoUtils.url(item.videoBlob);
    begin();
  }
  root.addEventListener('input', event => {
    if (event.target.id === 'activity-title') {
      activity.title = event.target.value;
      root.querySelector('#activity-select').selectedOptions[0].textContent = activity.title || 'Sans titre'; save();
    }
  });
  root.addEventListener('change', async event => {
    if (event.target.name === 'student-mode') { activity.studentMode = event.target.value; save(); }
    if (event.target.id === 'activity-select') { activity = activities.find(item => item.id === event.target.value); teacher(); }
  });
  root.addEventListener('click', async event => {
    const target = event.target.closest('[data-action]');
    if (!target || student || target.closest('dialog')) return;
    const action = target.dataset.action;
    const video = activity.videos.find(item => item.id === target.closest('[data-id]')?.dataset.id);
    if (action === 'save') save();
    if (action === 'new') newActivity();
    if (action === 'add') importVideo();
    if (action === 'replace') importVideo(video);
    if (action === 'rename') editTitle(video);
    if (action === 'delete') {
      const dialog = modal(`<h2>Supprimer cette vidéo ?</h2><p>${escape(video.title)}</p><div class="vm-toolbar"><button class="danger" data-confirm>Supprimer</button><button data-cancel>Annuler</button></div>`);
      dialog.querySelector('[data-cancel]').onclick = () => dialog.close();
      dialog.querySelector('[data-confirm]').onclick = () => { activity.videos = activity.videos.filter(item => item.id !== video.id); activity.videos.forEach((item, i) => item.order = i); save(); dialog.close(); teacher(); };
    }
    if (['earlier', 'later'].includes(action)) {
      const i = activity.videos.indexOf(video), j = i + (action === 'earlier' ? -1 : 1);
      if (j < 0 || j >= activity.videos.length) return;
      [activity.videos[i], activity.videos[j]] = [activity.videos[j], activity.videos[i]];
      activity.videos.forEach((item, order) => item.order = order); save(); teacher();
      root.querySelector(`[data-id="${video.id}"] [data-action="rename"]`).focus();
    }
    if (action === 'student' && activity.videos.length) {
      index = 0;
      activity.studentMode === 'gallery' ? gallery() : play();
    }
  });
  document.addEventListener('keydown', event => {
    if (student && event.code === 'Space' && event.repeat) event.preventDefault();
  });
  window.addEventListener('blur', () => { clearTimeout(holdTimer); holdTimer = null; root.querySelector('.exit-hold')?.classList.remove('holding'); });
  window.addEventListener('beforeunload', event => { if (saveError || pendingSaves) { event.preventDefault(); event.returnValue = ''; } });
  try {
    await VideoDB.open(); activities = await VideoDB.all();
    activities.forEach(item => item.videos.sort((a, b) => a.order - b.order));
    activity = activities[0];
    if (!activity) newActivity(); else teacher();
  } catch (error) {
    root.innerHTML = '<h1>Stockage local indisponible</h1><p>Ouvrez cette page dans un navigateur autorisant IndexedDB, puis rechargez.</p>';
    announce(error.message);
  }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
