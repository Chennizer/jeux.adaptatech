import { setLang } from './i18n.js';

const STORAGE_KEY = 'routine-preset';

const DEFAULT_PRESET = {
  version: 1,
  languageDefault: 'en',
  inputDefaults: { mode: 'touch', dwellMs: 1500, scanMs: 1200 },
  audio: { enabled: true, volume: 0.8 },
  students: [
    { id: 's1', displayName: 'Alex', photoUrl: 'assets/icons/student1.png', helloAudioUrl: '', tags: [] },
    { id: 's2', displayName: 'Sam', photoUrl: 'assets/icons/student2.png', helloAudioUrl: '', tags: [] }
  ],
  attendance: {},
  schedule: [
    { id: 'p1', pictoUrl: 'assets/icons/snack.png', label: { fr: 'Collation', en: 'Snack', ja: 'おやつ' }, audioUrl: '' },
    { id: 'p2', pictoUrl: 'assets/icons/play.png', label: { fr: 'Jeu', en: 'Play', ja: 'あそび' }, audioUrl: '' }
  ],
  transitions: [
    { id: 't_break', labelKey: 'calm', pictoUrl: 'assets/icons/break.png', audioUrl: '', behavior: 'momentary', durationMs: 4000 }
  ],
  ui: { largeTargets: true, highContrast: true }
};

export async function loadPreset() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return normalizePreset(parsed);
    } catch (e) {
      console.warn('Invalid stored preset', e);
    }
  }
  try {
    const res = await fetch('./presets/example-class.json');
    if (res.ok) {
      const data = await res.json();
      const normalized = normalizePreset(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
  } catch (e) {
    console.warn('Failed to load example preset', e);
  }
  const normalizedDefault = normalizePreset(DEFAULT_PRESET);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedDefault));
  return normalizedDefault;
}

export function savePreset(preset) {
  const normalized = normalizePreset(preset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  if (normalized.languageDefault) setLang(normalized.languageDefault);
  return normalized;
}

function normalizePreset(p) {
  const preset = { ...DEFAULT_PRESET, ...p };
  preset.version = 1;
  preset.inputDefaults = { ...DEFAULT_PRESET.inputDefaults, ...p.inputDefaults };
  preset.audio = { ...DEFAULT_PRESET.audio, ...p.audio };
  preset.students = Array.isArray(p.students) ? p.students : DEFAULT_PRESET.students;
  preset.attendance = p.attendance || {};
  preset.schedule = Array.isArray(p.schedule) ? p.schedule : DEFAULT_PRESET.schedule;
  preset.transitions = Array.isArray(p.transitions) ? p.transitions : DEFAULT_PRESET.transitions;
  preset.ui = { ...DEFAULT_PRESET.ui, ...p.ui };
  if (!['fr', 'en', 'ja'].includes(preset.languageDefault)) preset.languageDefault = DEFAULT_PRESET.languageDefault;
  return preset;
}

export function exportPreset(preset) {
  return JSON.stringify(preset, null, 2);
}

export function importPreset(json) {
  const parsed = JSON.parse(json);
  return normalizePreset(parsed);
}

export function resetPreset() {
  savePreset(DEFAULT_PRESET);
  return DEFAULT_PRESET;
}
