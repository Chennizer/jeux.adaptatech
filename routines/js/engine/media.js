let userHasInteracted = false;

const Media = (() => {
  const audioCache = new Map();

  function markInteraction() {
    userHasInteracted = true;
  }

  function preloadImages(urls = []) {
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }

  function getAudio(url) {
    if (!url) return null;
    if (audioCache.has(url)) return audioCache.get(url);
    const audio = new Audio(url);
    audio.preload = 'auto';
    audioCache.set(url, audio);
    return audio;
  }

  function play(url, volume = 1) {
    if (!userHasInteracted) return;
    const audio = getAudio(url);
    if (audio) {
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  function attachInteractionListeners() {
    const once = () => {
      markInteraction();
      window.removeEventListener('pointerdown', once);
      window.removeEventListener('keydown', once);
    };
    window.addEventListener('pointerdown', once);
    window.addEventListener('keydown', once);
  }

  return { preloadImages, play, attachInteractionListeners, getAudio };
})();

export { userHasInteracted };
export default Media;
