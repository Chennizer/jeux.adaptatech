(() => {
  'use strict';
  // Reuse the site's existing audio library; nothing plays on the menu.
  const tracks = {
    city: '../../songs/artgallery1.mp3',
    forest: '../../songs/spring/spring3.mp3',
    village: '../../songs/season/spring1.mp3',
    farm: '../../songs/bees/beesmusic3.mp3',
    planets: '../../songs/space/space1.mp3'
  };
  const samples = {
    release: { path: '../../sounds/bubbles/bubble3.mp3', gain: .36, rate: 1.12, cooldown: .09, max: .5 },
    impact: { path: '../../sounds/bubbles/bubble3.mp3', gain: .52, rate: .78, cooldown: .12, max: .7 },
    fill: { path: '../../sounds/space/twinklingstar1.mp3', gain: .9, rate: .85, cooldown: .55, delay: .15, max: 4.3, fade: .85 },
    complete: { path: '../../sounds/success4.mp3', gain: .45, rate: .95, cooldown: 1.5, delay: .25, max: 2.2, fade: .35 }
  };
  let settings = { music: true, effects: true, musicVolume: .17, effectsVolume: .4 };
  let context, musicGain, effectsGain;
  let unavailable = false;
  let active = false, epoch = 0, currentScene = '', currentTrack = '';
  const buffers = new Map(), failedTracks = new Set(), cooldowns = new Map(), voices = new Set();
  const music = document.createElement('audio');
  music.id = 'paintMusic'; music.loop = true; music.preload = 'none';
  music.setAttribute('playsinline', ''); music.setAttribute('aria-hidden', 'true');
  music.hidden = true; document.body.appendChild(music);
  music.addEventListener('error', () => { if (currentTrack) failedTracks.add(currentTrack); music.pause(); });

  function ensureContext() {
    if (unavailable) return false;
    if (context) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      musicGain = context.createGain(); effectsGain = context.createGain();
      context.createMediaElementSource(music).connect(musicGain);
      musicGain.connect(context.destination); effectsGain.connect(context.destination);
      musicGain.gain.value = 0; effectsGain.gain.value = settings.effectsVolume;
      return true;
    } catch (_) {
      unavailable = true;
      try { if (context) context.close().catch(() => {}); } catch (_) {}
      context = undefined; musicGain = undefined; effectsGain = undefined;
      return false;
    }
  }
  function gainTo(node, value, seconds = .08) {
    const now = context.currentTime;
    node.gain.cancelScheduledValues(now);
    node.gain.setTargetAtTime(value, now, seconds);
  }
  function stopVoice(voice) {
    if (!context) return;
    try {
      voice.gain.gain.cancelScheduledValues(context.currentTime);
      voice.gain.gain.setTargetAtTime(.0001, context.currentTime, .008);
      voice.source.stop(context.currentTime + .04);
    } catch (_) { /* It may have ended already. */ }
    voices.delete(voice);
  }
  function clearVoices() { [...voices].forEach(stopVoice); cooldowns.clear(); }
  function loadSample(path) {
    if (!buffers.has(path)) {
      buffers.set(path, fetch(new URL(path, document.baseURI))
        .then(response => { if (!response.ok) throw new Error('Missing audio'); return response.arrayBuffer(); })
        .then(bytes => context.decodeAudioData(bytes))
        .catch(() => null));
    }
    return buffers.get(path);
  }
  function configure(next) {
    settings = { ...settings, ...next };
    settings.musicVolume = Math.max(0, Math.min(1, Number(settings.musicVolume) || 0));
    settings.effectsVolume = Math.max(0, Math.min(1, Number(settings.effectsVolume) || 0));
    if (context && musicGain && effectsGain) {
      gainTo(musicGain, active && settings.music ? settings.musicVolume : 0);
      gainTo(effectsGain, settings.effects ? settings.effectsVolume : 0);
    }
    if (!settings.music) music.pause();
    if (!settings.effects) clearVoices();
  }
  function start(scene) {
    active = true; const token = ++epoch;
    const changed = currentScene !== scene;
    currentScene = scene;
    if (changed) clearVoices();
    if (!ensureContext()) return;
    // Unlock synchronously in the Start gesture, before fullscreen can consume it.
    try { if (context.state !== 'running' && context.state !== 'closed') context.resume().catch(() => {}); } catch (_) {}
    gainTo(effectsGain, settings.effects ? settings.effectsVolume : 0);
    const path = tracks[scene] || tracks.city;
    if (settings.music && !failedTracks.has(path)) {
      if (currentTrack !== path) {
        music.pause(); currentTrack = path; music.src = path;
      }
      musicGain.gain.cancelScheduledValues(context.currentTime);
      musicGain.gain.setValueAtTime(0, context.currentTime);
      musicGain.gain.setTargetAtTime(settings.musicVolume, context.currentTime, .35);
      try {
        const playing = music.play();
        if (playing) playing.then(() => { if (!active) music.pause(); }).catch(() => {});
      } catch (_) { /* Autoplay/format failure never blocks the drawing. */ }
    } else music.pause();
    if (settings.effects) Object.values(samples).forEach(sample => loadSample(sample.path));
    // Context resume and media playback may complete after leaving the menu.
    if (token !== epoch || !active) music.pause();
  }
  function pause() {
    active = false; epoch++; music.pause(); clearVoices();
    if (context && musicGain) gainTo(musicGain, 0, .03);
  }
  function reset(scene) {
    epoch++; clearVoices();
    // A replay in the same scene keeps the soundtrack flowing rather than restarting.
    if (scene !== currentScene && active) start(scene);
  }
  async function effect(kind) {
    const sample = samples[kind];
    if (!sample || !active || !settings.effects || !context || context.state !== 'running') return;
    const token = epoch, requestedAt = context.currentTime;
    const buffer = await loadSample(sample.path);
    if (!buffer || !active || !settings.effects || token !== epoch || context.state !== 'running') return;
    const now = context.currentTime;
    if (now - requestedAt > .5 || now - (cooldowns.get(kind) ?? -Infinity) < sample.cooldown) return;
    cooldowns.set(kind, now);
    while (voices.size >= 6) stopVoice(voices.values().next().value);
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer; source.playbackRate.value = sample.rate;
    source.connect(gain); gain.connect(effectsGain);
    const when = now + (sample.delay || 0), duration = Math.min(buffer.duration / sample.rate, sample.max);
    const fade = Math.min(sample.fade || .1, duration / 2);
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(sample.gain, when + .025);
    gain.gain.setValueAtTime(sample.gain, Math.max(when + .03, when + duration - fade));
    gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    const voice = { source, gain };
    voices.add(voice);
    source.onended = () => { voices.delete(voice); source.disconnect(); gain.disconnect(); };
    try { source.start(when); source.stop(when + duration); } catch (_) { voices.delete(voice); source.disconnect(); gain.disconnect(); }
    if (kind === 'complete' && settings.music && musicGain) {
      musicGain.gain.cancelScheduledValues(now);
      musicGain.gain.setTargetAtTime(settings.musicVolume * .6, now, .15);
      musicGain.gain.setTargetAtTime(settings.musicVolume, now + 2.5, .45);
    }
  }
  window.PaintAudio = { configure, start, pause, reset, effect };
})();
