import { hasInteracted } from './input.js';

export function preloadImages(urls = []) {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

export function createAudio(url, volume = 0.8) {
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.volume = volume;
  return audio;
}

export function playAudio(url, volume = 0.8) {
  if (!url) return;
  if (!hasInteracted()) return; // avoid autoplay before gesture
  const audio = createAudio(url, volume);
  audio.play().catch(() => {});
}
