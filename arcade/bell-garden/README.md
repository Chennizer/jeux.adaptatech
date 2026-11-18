# Bell Garden prototype

Open `arcade/bell-garden/index.html`, or choose **Jardin de clochettes / Bell Garden** in the arcade menu. The activity is registered in `data/games.json` for the activity finder and favorites.

The entrance uses the shared arcade control-panel styles and layout, with just input type, music on/off, and Start visible. Other settings are folded into Options. During play, six cartoon flowers fill the garden: a bellflower, daisy, tulip, anemone, poppy, and cosmos. Each has its own size, silhouette, petal shading, stem, and leaves. Large rounded heads sit on short, thick stems; heights depend on each flower's width, rather than stretching to fill the screen. There are no visible words, note labels, counters, scores, or demo controls. Activating a flower immediately plays a pentatonic bell note (C, D, E, G, A, high C), with a pronounced one-second squash/stretch bounce and a separate head wobble. Roots stay stationary, and repeated notes restart the full response. Play continues freely without a goal or time limit.

The garden has a bright blue sky, a large sun with rounded rays, a vivid layered meadow, drifting clouds, and occasional passing birds. Plant stems and their ground shadows share a fixed baseline; the meadow extends behind all rows in portrait layouts. Flower heads retain their proportions while stems adapt to the available height. Independent wind and leaf motions pivot above stationary roots, and hit targets stay fixed. The upper sky is outside the flower targets in landscape play. Ambient motion pauses while the menu is open, the tab is hidden, or the window is inactive. Reduced-animation mode and the system motion preference disable wind, cloud movement, and birds.

## Controls

- **Touch / mouse / keyboard:** press a flower; use keys 1–6, or arrows and Space. Focused flower buttons also support native Enter activation.
- **Eye gaze:** dwell for 300–2500 ms (default 800 ms). A warm fill grows from the flower's centre, clipped to its painted silhouette. Look away before activating the same flower again.
- **One switch:** automatic scanning at 600–4000 ms per flower (default 1500 ms); Space plays the highlighted flower. Selection lights the bloom itself without drawing a rectangular frame.
- **Two switches:** Enter advances the bloom highlight; Space plays that flower.
- **Options:** use the gear icon or Escape to return to the arcade-style menu. Playback, scanning, and pending dwell pause while the menu is open or the tab is hidden. Holding a switch does not repeat notes.

All settings stay in the menu: garden, black, or white background; separate flower/music volumes; bell mute; reduced animations; and optional fullscreen. Input mode, timings, and settings are saved locally when storage is available. The site language preference is shared with the other pages (French, English, Japanese). Screen-reader labels and instructions remain available without introducing visible text in play.

Music is enabled at a quiet 10% by default and uses existing calm project tracks: `songs/zenitude/v5calmmusic1.mp3`, `songs/zenitude/v5calmmusic2.mp3`, and `songs/zenitude/v5calmmusic3.mp3`. The previous 20% default is lowered once when restoring older settings; custom levels remain intact. Tracks advance and loop automatically. Music drops to a quarter of its set volume while a bell plays, pauses in menus and inactive/hidden windows, and resumes from the same position. The music switch, music volume, and bell volume are independent. Missing tracks have bounded retries; playback restrictions are reported without interrupting the flowers.

There are no build steps or new dependencies. Bell notes use Web Audio; music files load only after play starts. The arcade font is loaded from the repository. Vector artwork is shared through `garden-art.js`; the meadow is a local SVG asset. The game remains visually playable if audio or local storage is unavailable.

## Automated checks

From the repository root:

```sh
node --test arcade/bell-garden/tests/garden.test.cjs
```

The checks exercise the page script with deterministic DOM, timing, Web Audio, and media doubles, including input modes, menu transitions, keyboard navigation, audio cleanup, saved settings, translations, playlist looping, music controls, and playback failures. They also check that the game contains no visible text. Browser rendering, real audio mixing, and assistive devices still need manual verification.
