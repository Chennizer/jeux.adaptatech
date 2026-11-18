/* Gentle local accompaniment, independent of the bell synth. */
(() => {
  'use strict';

  const tracks = Object.freeze([
    '../../songs/zenitude/v5calmmusic1.mp3',
    '../../songs/zenitude/v5calmmusic2.mp3',
    '../../songs/zenitude/v5calmmusic3.mp3'
  ]);

  function create(player, { canPlay, enabled, volume, onFailure }) {
    let index = 0;
    let loaded = false;
    let attempt = 0;
    let failures = 0;
    let exhausted = false;
    let ducked = false;
    let duckTimer = null;
    const wanted = () => canPlay() && enabled() && volume() > 0;
    const applyVolume = () => { player.volume = Math.min(1, Math.max(0, volume())) * (ducked ? .25 : 1); };

    function pause() {
      attempt++;
      clearTimeout(duckTimer);
      ducked = false;
      player.pause();
      applyVolume();
    }

    function load(next) {
      index = next;
      player.src = tracks[index];
      loaded = true;
    }

    function fail(token, error) {
      if (token !== attempt || !wanted() || error?.name === 'AbortError') return;
      attempt++;
      if (error?.name === 'NotAllowedError' || ++failures >= tracks.length) {
        exhausted = true;
        pause();
        onFailure(true);
        return;
      }
      load((index + 1) % tracks.length);
      play();
    }

    function play(retry = false) {
      if (!wanted()) { pause(); return; }
      if (retry) {
        failures = 0;
        exhausted = false;
        onFailure(false);
      }
      if (exhausted) return;
      if (!loaded) load(0);
      applyVolume();
      const token = ++attempt;
      try {
        player.play()?.then(() => {
          if (token === attempt && !wanted()) pause();
        }).catch(error => fail(token, error));
      } catch (error) { fail(token, error); }
    }

    player.addEventListener('ended', () => {
      if (!wanted() || exhausted) return;
      failures = 0;
      load((index + 1) % tracks.length);
      play();
    });
    player.addEventListener('error', () => fail(attempt, player.error));
    player.addEventListener('playing', () => {
      if (!wanted()) { pause(); return; }
      failures = 0;
      onFailure(false);
    });

    return Object.freeze({
      start: () => play(true),
      resume: () => play(),
      pause,
      update() {
        applyVolume();
        if (!enabled() || volume() === 0) onFailure(false);
        if (!wanted()) pause();
        else if (player.paused) play(true);
      },
      duck(durationMs = 900) {
        if (!wanted() || player.paused) return;
        clearTimeout(duckTimer);
        ducked = true;
        applyVolume();
        duckTimer = setTimeout(() => { ducked = false; applyVolume(); }, durationMs);
      }
    });
  }

  const music = Object.freeze({ tracks, create });
  if (typeof module !== 'undefined' && module.exports) module.exports = music;
  else window.BellGardenMusic = music;
})();
