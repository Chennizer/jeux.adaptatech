const Media = (() => {
  let userHasInteracted = false;
  let audioEnabled = true;
  let volume = 0.8;

  const setAudio = (enabled, vol) => {
    audioEnabled = enabled;
    volume = vol;
    localStorage.setItem('routine_audio_enabled', enabled ? '1' : '0');
    localStorage.setItem('routine_audio_volume', volume);
  };

  const init = () => {
    const storedEnabled = localStorage.getItem('routine_audio_enabled');
    if (storedEnabled !== null) audioEnabled = storedEnabled === '1';
    const storedVol = localStorage.getItem('routine_audio_volume');
    if (storedVol) volume = Number(storedVol);

    const mark = () => { userHasInteracted = true; window.removeEventListener('pointerdown', mark); window.removeEventListener('keydown', mark); };
    window.addEventListener('pointerdown', mark);
    window.addEventListener('keydown', mark);
  };

  const preloadImages = urls => urls.filter(Boolean).forEach(url => {
    const img = new Image();
    img.src = url;
  });

  const playAudio = url => {
    if (!audioEnabled || !url) return;
    const audio = new Audio(url);
    audio.volume = volume;
    if (userHasInteracted) audio.play().catch(() => {});
  };

  return { init, setAudio, playAudio, preloadImages, get volume() { return volume; }, get audioEnabled() { return audioEnabled; } };
})();

export default Media;
