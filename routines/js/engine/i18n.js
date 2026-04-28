const I18N_STRINGS = {
  fr: {
    languageName: 'Français',
    hello: 'Bonjour',
    attendance: 'Présence',
    transitions: 'Transitions',
    now: 'Maintenant',
    next: 'Ensuite',
    advance: 'Avancer',
    allDone: 'Terminé',
    edit: 'Éditer',
    save: 'Sauvegarder',
    import: 'Importer',
    export: 'Exporter',
    back: 'Retour',
    dwell: 'Regard',
    touch: 'Toucher',
    volume: 'Volume',
    mute: 'Muet',
    hub: 'Routine Hub',
    helloModule: 'Bonjour',
    attendanceModule: 'Présence',
    transitionsModule: 'Transitions',
    calm: 'Calme',
    schedule: 'Maintenant / Ensuite',
    dwellTime: 'Temps de regard',
    inputMode: 'Mode',
    language: 'Langue',
    add: 'Ajouter',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    students: 'Élèves',
    scheduleSteps: 'Étapes',
    transitionsTitle: 'Transitions',
    helloScene: 'Bonjour',
    attendanceScene: 'Présence mise à jour',
    present: 'Présent',
    absent: 'Absent',
    unknown: 'Inconnu',
    transitionAdvance: 'Montrer',
    dwellMs: 'ms',
    calmBreak: 'Pause calme',
    loading: 'Chargement...',
    break: 'Pause'
  },
  en: {
    languageName: 'English',
    hello: 'Hello',
    attendance: 'Attendance',
    transitions: 'Transitions',
    now: 'Now',
    next: 'Next',
    advance: 'Advance',
    allDone: 'All done',
    edit: 'Edit',
    save: 'Save',
    import: 'Import',
    export: 'Export',
    back: 'Back',
    dwell: 'Dwell',
    touch: 'Touch',
    volume: 'Volume',
    mute: 'Mute',
    hub: 'Routine Hub',
    helloModule: 'Hello',
    attendanceModule: 'Attendance',
    transitionsModule: 'Transitions',
    calm: 'Calm',
    schedule: 'Now / Next',
    dwellTime: 'Dwell time',
    inputMode: 'Input',
    language: 'Language',
    add: 'Add',
    delete: 'Delete',
    confirm: 'Confirm',
    cancel: 'Cancel',
    students: 'Students',
    scheduleSteps: 'Steps',
    transitionsTitle: 'Transitions',
    helloScene: 'Hello',
    attendanceScene: 'Attendance updated',
    present: 'Present',
    absent: 'Absent',
    unknown: 'Unknown',
    transitionAdvance: 'Show',
    dwellMs: 'ms',
    calmBreak: 'Calm break',
    loading: 'Loading...',
    break: 'Break'
  },
  ja: {
    languageName: '日本語',
    hello: 'こんにちは',
    attendance: '出欠',
    transitions: 'トランジション',
    now: 'いま',
    next: 'つぎ',
    advance: '進む',
    allDone: 'すべて完了',
    edit: '編集',
    save: '保存',
    import: 'インポート',
    export: 'エクスポート',
    back: '戻る',
    dwell: '視線',
    touch: 'タッチ',
    volume: '音量',
    mute: 'ミュート',
    hub: 'ルーティンハブ',
    helloModule: 'こんにちは',
    attendanceModule: '出欠',
    transitionsModule: 'トランジション',
    calm: 'リラックス',
    schedule: 'いま / つぎ',
    dwellTime: '視線時間',
    inputMode: '入力',
    language: '言語',
    add: '追加',
    delete: '削除',
    confirm: '確認',
    cancel: 'キャンセル',
    students: '学生',
    scheduleSteps: 'ステップ',
    transitionsTitle: 'トランジション',
    helloScene: 'こんにちは',
    attendanceScene: '出欠更新',
    present: '出席',
    absent: '欠席',
    unknown: '不明',
    transitionAdvance: '表示',
    dwellMs: 'ミリ秒',
    calmBreak: 'クールダウン',
    loading: '読み込み中...',
    break: 'やすみ'
  }
};

const I18N = (() => {
  const fallbackLang = 'en';
  let currentLang = fallbackLang;

  function setLang(lang) {
    if (!I18N_STRINGS[lang]) lang = fallbackLang;
    currentLang = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('routine_lang', lang);
  }

  function init() {
    const saved = localStorage.getItem('routine_lang');
    setLang(saved || fallbackLang);
  }

  function t(key) {
    const bundle = I18N_STRINGS[currentLang] || I18N_STRINGS[fallbackLang];
    return bundle[key] || key;
  }

  function getLang() {
    return currentLang;
  }

  return { init, t, setLang, getLang };
})();

export { I18N_STRINGS };
export default I18N;
