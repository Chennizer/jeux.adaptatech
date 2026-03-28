import I18N from './i18n.js';

const Storage = (() => {
  const KEY = 'routine_preset_v1';
  const DEFAULT_PRESET = {
    version: 1,
    languageDefault: 'en',
    inputDefaults: { mode: 'touch', dwellMs: 1500, scanMs: 1200 },
    audio: { enabled: true, volume: 0.8 },
    students: [],
    attendance: {},
    schedule: [],
    transitions: [],
    ui: { largeTargets: true, highContrast: true }
  };

  const ensureDefaults = preset => {
    const merged = { ...DEFAULT_PRESET, ...preset };
    merged.inputDefaults = { ...DEFAULT_PRESET.inputDefaults, ...(preset?.inputDefaults || {}) };
    merged.audio = { ...DEFAULT_PRESET.audio, ...(preset?.audio || {}) };
    merged.ui = { ...DEFAULT_PRESET.ui, ...(preset?.ui || {}) };
    merged.students = preset?.students || [];
    merged.attendance = preset?.attendance || {};
    merged.schedule = preset?.schedule || [];
    merged.transitions = preset?.transitions || [];
    return merged;
  };

  const loadFallback = async () => {
    const res = await fetch('./presets/example-class.json');
    const data = await res.json();
    return ensureDefaults(data);
  };

  const loadPreset = async () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return ensureDefaults(parsed);
      }
    } catch (e) {
      console.warn('Preset parse error', e);
    }
    return await loadFallback();
  };

  const savePreset = preset => {
    localStorage.setItem(KEY, JSON.stringify(ensureDefaults(preset)));
  };

  const exportPreset = preset => {
    const blob = new Blob([JSON.stringify(ensureDefaults(preset), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'routine-preset.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPreset = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        const preset = ensureDefaults(json);
        savePreset(preset);
        resolve(preset);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });

  return { loadPreset, savePreset, exportPreset, importPreset, ensureDefaults, KEY };
})();

export default Storage;
