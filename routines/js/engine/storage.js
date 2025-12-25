import I18N from './i18n.js';

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

const Storage = (() => {
  const KEY = 'routine_preset_v1';

  function mergeDefaults(preset) {
    const merged = { ...DEFAULT_PRESET, ...preset };
    merged.inputDefaults = { ...DEFAULT_PRESET.inputDefaults, ...(preset.inputDefaults || {}) };
    merged.audio = { ...DEFAULT_PRESET.audio, ...(preset.audio || {}) };
    merged.ui = { ...DEFAULT_PRESET.ui, ...(preset.ui || {}) };
    merged.attendance = preset.attendance || {};
    merged.students = preset.students || [];
    merged.schedule = preset.schedule || [];
    merged.transitions = preset.transitions || [];
    return merged;
  }

  async function loadFallbackPreset() {
    const res = await fetch('presets/example-class.json');
    const json = await res.json();
    return mergeDefaults(json);
  }

  async function loadPreset() {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return mergeDefaults(parsed);
      } catch (e) {
        console.warn('Preset parsing failed', e);
      }
    }
    return loadFallbackPreset();
  }

  function savePreset(preset) {
    localStorage.setItem(KEY, JSON.stringify(preset));
    if (preset.languageDefault) {
      I18N.setLang(preset.languageDefault);
    }
  }

  function exportPreset(preset) {
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'routine-preset.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importPreset(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          resolve(mergeDefaults(data));
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  return { loadPreset, savePreset, exportPreset, importPreset, mergeDefaults, loadFallbackPreset };
})();

export default Storage;
