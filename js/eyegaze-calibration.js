(() => {
  const translations = {
    fr: {
      verdictGood: 'Le pointeur suit votre regard avec précision.', verdictFair: 'Le suivi fonctionne, mais pourrait être plus précis.', verdictLow: 'Un nouvel étalonnage est recommandé avant de continuer.',
      tipGood: 'Vous êtes prêt. Si la précision change, vérifiez votre position et l’éclairage.', tipFair: 'Essayez de recentrer l’écran, de stabiliser votre tête et de refaire le test.', tipLow: 'Ouvrez le logiciel Tobii, refaites son étalonnage, puis relancez Talon et ce test.'
    },
    en: {
      verdictGood: 'The pointer is following your gaze accurately.', verdictFair: 'Tracking works, but it could be more precise.', verdictLow: 'A new calibration is recommended before continuing.',
      tipGood: 'You are ready. If accuracy changes, check your position and lighting.', tipFair: 'Try centring the screen, keeping your head steady, and running the check again.', tipLow: 'Open the Tobii software, repeat its calibration, then restart Talon and this check.'
    },
    ja: {
      verdictGood: 'ポインターは視線を正確に追跡しています。', verdictFair: '追跡は動作していますが、より正確にできる可能性があります。', verdictLow: '続行する前に再調整することをおすすめします。',
      tipGood: '準備完了です。精度が変わった場合は、姿勢と照明を確認してください。', tipFair: '画面を中央に置き、頭を安定させて、もう一度お試しください。', tipLow: 'Tobiiソフトウェアで再調整し、Talonを再起動してからもう一度お試しください。'
    }
  };
  const positions = [[50,50],[12,15],[88,15],[88,85],[12,85],[50,15],[88,50],[50,85],[12,50]];
  const welcome = document.querySelector('#welcome');
  const test = document.querySelector('#test');
  const results = document.querySelector('#results');
  const target = document.querySelector('#target');
  const current = document.querySelector('#current');
  const overall = document.querySelector('#overall-progress');
  const getSavedLanguage = () => {
    try {
      return window.localStorage.getItem('selectedLanguage');
    } catch (error) {
      return null;
    }
  };
  const saveLanguage = value => {
    try {
      window.localStorage.setItem('selectedLanguage', value);
    } catch (error) {
      // Storage can be unavailable when the cloud app is embedded. The tool
      // remains fully usable; only language persistence is skipped.
    }
  };
  let lang = getSavedLanguage() || document.documentElement.lang || 'fr';
  let index = 0, timer = 0, startTime = 0, pointSamples = [], runResults = [], pointer = null;

  function applyLanguage() {
    if (!['fr','en','ja'].includes(lang)) lang = 'fr';
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-fr]').forEach(el => { el.textContent = el.dataset[lang] || el.dataset.fr; });
    document.querySelector('#language').textContent = lang === 'fr' ? 'EN' : lang === 'en' ? '日' : 'FR';
    document.title = document.querySelector('#page-title').textContent + ' · Adaptatech';
    saveLanguage(lang);
  }

  function start() {
    welcome.hidden = true; results.hidden = true; test.hidden = false;
    index = 0; runResults = []; pointer = null;
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    showPoint();
  }

  function showPoint() {
    clearTimeout(timer); pointSamples = [];
    const [x,y] = positions[index];
    target.style.left = `${x}%`; target.style.top = `${y}%`;
    target.classList.remove('active','arrive');
    void target.offsetWidth;
    target.classList.add('arrive');
    current.textContent = index + 1;
    overall.style.width = `${index / positions.length * 100}%`;
    timer = setTimeout(() => {
      startTime = performance.now();
      target.classList.add('active');
      timer = setTimeout(capturePoint, 1800);
    }, 450);
  }

  function capturePoint() {
    const rect = target.getBoundingClientRect();
    const expected = {x:rect.left + rect.width/2, y:rect.top + rect.height/2};
    const valid = pointSamples.slice(Math.floor(pointSamples.length * .25));
    const observed = valid.length ? {
      x: valid.reduce((sum,p) => sum+p.x,0)/valid.length,
      y: valid.reduce((sum,p) => sum+p.y,0)/valid.length
    } : (pointer || expected);
    const distance = pointer || valid.length ? Math.hypot(observed.x-expected.x, observed.y-expected.y) : 180;
    runResults.push({expected, observed, distance});
    index++;
    if (index < positions.length) showPoint(); else finish();
  }

  function finish() {
    test.hidden = true; results.hidden = false;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    const average = runResults.reduce((sum,r) => sum+r.distance,0) / runResults.length;
    const score = Math.max(0, Math.round(100 - average * .72));
    document.querySelector('#score').textContent = score;
    const level = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Low';
    document.querySelector('#verdict').textContent = translations[lang][`verdict${level}`];
    document.querySelector('#tip').textContent = translations[lang][`tip${level}`];
    document.querySelector('#result-icon').textContent = level === 'Good' ? '✓' : level === 'Fair' ? '!' : '↻';
    const map = document.querySelector('#map'); map.replaceChildren();
    runResults.forEach((r,i) => {
      const marker = document.createElement('span'); marker.className = 'map-point';
      marker.style.left = `${positions[i][0]}%`; marker.style.top = `${positions[i][1]}%`;
      marker.style.setProperty('--dx', `${11 + Math.max(-28,Math.min(28,r.observed.x-r.expected.x))}px`);
      marker.style.setProperty('--dy', `${11 + Math.max(-28,Math.min(28,r.observed.y-r.expected.y))}px`);
      map.append(marker);
    });
  }

  function cancel() {
    clearTimeout(timer); test.hidden = true; results.hidden = true; welcome.hidden = false;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  addEventListener('pointermove', e => {
    pointer = {x:e.clientX,y:e.clientY};
    if (!test.hidden && startTime && performance.now()-startTime > 250) pointSamples.push(pointer);
  }, {passive:true});
  document.querySelector('#start').addEventListener('click', start);
  document.querySelector('#retry').addEventListener('click', start);
  document.querySelector('#cancel').addEventListener('click', cancel);
  document.querySelector('#language').addEventListener('click', () => { lang = lang === 'fr' ? 'en' : lang === 'en' ? 'ja' : 'fr'; applyLanguage(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !test.hidden) cancel(); });
  applyLanguage();
})();
