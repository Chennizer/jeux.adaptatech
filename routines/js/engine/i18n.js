export const LANGS = ['fr', 'en', 'ja'];

export const STRINGS = {
  fr: {
    hello: 'Bonjour', attendance: 'Présence', transitions: 'Transitions', now: 'Maintenant', next: 'Après', advance: 'Avancer', allDone: 'Terminé', edit: 'Éditer', save: 'Sauvegarder', import: 'Importer', export: 'Exporter', back: 'Retour', dwell: 'Maintien', touch: 'Toucher', volume: 'Volume', mute: 'Muet', language: 'Langue', hub: 'Accueil', calm: 'Calme', schedule: 'Planning', helloMode: 'Mode Bonjour', attendanceMode: 'Mode Présence', add: 'Ajouter', delete: 'Supprimer', label: 'Libellé', photo: 'Photo', audio: 'Audio', behavior: 'Comportement', duration: 'Durée (ms)', momentary: 'Momentané', toggle: 'Bascule', nowNext: 'Maintenant/Après', reset: 'Réinitialiser', confirmExit: 'Quitter sans sauvegarder ?', dwellMs: 'Temps de maintien', inputMode: 'Mode d’entrée', tapAdvance: 'Appuyer pour avancer', allStudents: 'Élèves', transitionsTitle: 'Transitions', scheduleTitle: 'Planning', dwellMode: 'Maintien', touchMode: 'Toucher', uploadImage: 'Importer une image', importPreset: 'Importer un preset'
  },
  en: {
    hello: 'Hello', attendance: 'Attendance', transitions: 'Transitions', now: 'Now', next: 'Next', advance: 'Advance', allDone: 'All done', edit: 'Edit', save: 'Save', import: 'Import', export: 'Export', back: 'Back', dwell: 'Dwell', touch: 'Touch', volume: 'Volume', mute: 'Mute', language: 'Language', hub: 'Hub', calm: 'Calm Break', schedule: 'Schedule', helloMode: 'Hello Mode', attendanceMode: 'Attendance Mode', add: 'Add', delete: 'Delete', label: 'Label', photo: 'Photo', audio: 'Audio', behavior: 'Behavior', duration: 'Duration (ms)', momentary: 'Momentary', toggle: 'Toggle', nowNext: 'Now/Next', reset: 'Reset', confirmExit: 'Leave without saving?', dwellMs: 'Dwell time', inputMode: 'Input mode', tapAdvance: 'Tap to advance', allStudents: 'Students', transitionsTitle: 'Transitions', scheduleTitle: 'Schedule', dwellMode: 'Dwell', touchMode: 'Touch', uploadImage: 'Upload image', importPreset: 'Import preset'
  },
  ja: {
    hello: 'こんにちは', attendance: '出欠', transitions: 'トランジション', now: 'いま', next: 'つぎ', advance: 'すすむ', allDone: 'おわり', edit: '編集', save: '保存', import: 'インポート', export: 'エクスポート', back: '戻る', dwell: 'ホバー', touch: 'タッチ', volume: '音量', mute: 'ミュート', language: '言語', hub: 'ホーム', calm: 'クールダウン', schedule: 'スケジュール', helloMode: 'あいさつ', attendanceMode: '出欠', add: '追加', delete: '削除', label: 'ラベル', photo: '写真', audio: '音声', behavior: '動作', duration: '時間 (ms)', momentary: '一時', toggle: '切替', nowNext: 'いま/つぎ', reset: 'リセット', confirmExit: '保存せず戻りますか？', dwellMs: 'ホバー時間', inputMode: '入力モード', tapAdvance: 'タップで進む', allStudents: '学生', transitionsTitle: 'トランジション', scheduleTitle: 'スケジュール', dwellMode: 'ホバー', touchMode: 'タッチ', uploadImage: '画像を取り込む', importPreset: 'プリセットを取り込む'
  }
};

export function getLang() {
  const saved = localStorage.getItem('routine-lang');
  return LANGS.includes(saved) ? saved : 'en';
}

export function setLang(lang) {
  if (LANGS.includes(lang)) {
    localStorage.setItem('routine-lang', lang);
    document.documentElement.lang = lang;
  }
}

export function t(key, lang = getLang()) {
  return STRINGS[lang]?.[key] || STRINGS['en'][key] || key;
}
