# Bell Garden prototype

Open `arcade/bell-garden/index.html`, or choose **Jardin de clochettes / Bell Garden** in the arcade menu. The activity is registered in `data/games.json` for the activity finder and favorites.

The entrance uses the shared arcade control-panel styles and layout, with just input type, music on/off, and Start visible. Other settings are folded into Options. During play, six cartoon flowers fill the garden: a bellflower, daisy, tulip, anemone, poppy, and cosmos. Each has its own size, silhouette, petal shading, stem, and leaves. Large rounded heads sit on short, thick stems; heights depend on each flower's width, rather than stretching to fill the screen. There are no visible words, note labels, counters, scores, or demo controls. Activating a flower immediately plays a warm, woody pluck with a soft ringing tail, in a pentatonic scale (C, D, E, G, A, high C). The plant grows upward and its petals open, then settle back over the full 1.8-second note. Roots stay stationary, and repeated notes restart the full response. Small-screen spacing leaves room for the growing blooms. Play continues freely without a goal or time limit.

The garden has a bright blue sky, a large sun with rounded rays, a vivid layered meadow, drifting clouds, and occasional passing birds. Plant stems and their ground shadows share a fixed baseline; the meadow extends behind all rows in portrait layouts. Flower heads retain their proportions while stems adapt to the available height. Growth begins with a small anticipatory dip, then a bending stretch and a soft spring back. Each flower leans differently; the bloom follows slightly later, while left and right leaves unfold on separate hinges with staggered timing. All motion settles within the note duration. Independent wind and leaf motions pivot above stationary roots, and hit targets stay fixed. The upper sky is outside the flower targets in landscape play. Ambient motion pauses while the menu is open, the tab is hidden, or the window is inactive. Reduced-animation mode and the system motion preference disable wind, cloud movement, birds, and the growth animation; the flower still lights up when played.

Each played note also releases a small spray of pollen and musical-note shapes. A cartoon butterfly flutters over to the latest flower and leaves after five seconds of quiet. Playing three different flowers reveals a soft rainbow for three seconds; discovery has no time limit and never triggers extra sounds. All input modes share these surprises. Particles use a fixed pool of seven elements per flower. Butterfly placement stays inside the viewport and updates on resize. Opening the menu or leaving the window clears active surprises and drag gestures. Reduced-animation settings hide all three effects; plain black/white backgrounds omit the butterfly and rainbow.

## Controls

- **Touch / mouse / keyboard:** press a flower, or hold and swipe across the flowers to strum them. Strumming plays each newly entered flower and ends on release or cancellation. Use keys 1–6, or arrows and Space. Focused flower buttons also support native Enter activation.
- **Eye gaze:** dwell for 300–2500 ms (default 800 ms). A warm fill grows from the flower's centre, clipped to its painted silhouette. Look away before activating the same flower again.
- **One switch:** automatic scanning at 600–4000 ms per flower (default 1500 ms); Space plays the highlighted flower. Selection lights the bloom itself without drawing a rectangular frame.
- **Two switches:** Enter advances the bloom highlight; Space plays that flower.
- **Options:** use the gear icon or Escape to return to the arcade-style menu. Playback, scanning, and pending dwell pause while the menu is open or the tab is hidden. Holding a switch does not repeat notes.

All settings stay in the menu: garden, black, or white background; separate flower/music volumes; flower-note mute; reduced animations; and optional fullscreen. Input mode, timings, and settings are saved locally when storage is available. The site language preference is shared with the other pages (French, English, Japanese). Screen-reader labels and instructions remain available without introducing visible text in play.

Music is enabled at a quiet 10% by default and uses existing calm project tracks: `songs/zenitude/v5calmmusic1.mp3`, `songs/zenitude/v5calmmusic2.mp3`, and `songs/zenitude/v5calmmusic3.mp3`. The previous 20% default is lowered once when restoring older settings; custom levels remain intact. Tracks advance and loop automatically. Music drops to a quarter of its set volume for the full flower note, pauses in menus and inactive/hidden windows, and resumes from the same position. The music switch, music volume, and flower volume are independent. Missing tracks have bounded retries; playback restrictions are reported without interrupting the flowers.

There are no build steps or new dependencies. Flower notes use Web Audio, with a shared profile in `garden-instrument.js` for harmonic envelopes, growth duration, and music ducking. A strong fundamental, a short wooden tap, and a quiet upper-harmonic tail replace the metallic bell overtones. Music files load only after play starts. The arcade font is loaded from the repository. Vector artwork is shared through `garden-art.js`; the meadow is a local SVG asset. The game remains visually playable if audio or local storage is unavailable.

## Automated checks

From the repository root:

```sh
node --test arcade/bell-garden/tests/garden.test.cjs
```

The checks exercise the page script with deterministic DOM, timing, Web Audio, and media doubles, including input modes, strumming and cancellation, untimed discovery across every control mode, butterfly positioning and cleanup, reduced-motion settings, menu transitions, keyboard navigation, audio cleanup, saved settings, translations, playlist looping, music controls, and playback failures. They also check that the game contains no visible text. Browser rendering, real audio mixing, and assistive devices still need manual verification.
