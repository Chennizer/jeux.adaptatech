# Bell Garden prototype

Open `arcade/bell-garden/index.html`, or choose **Jardin de clochettes / Bell Garden** in the arcade menu. The activity is registered in `data/games.json` for the activity finder and favorites.

The entrance uses the shared arcade control-panel styles and layout. During play, six large flowers fill the screen: a bellflower, daisy, tulip, anemone, poppy, and cosmos. Each has its own silhouette, petal shading, stem, and leaves. There are no visible words, note labels, counters, scores, or demo controls. Activating a flower immediately plays a pentatonic bell note (C, D, E, G, A, high C) and animates that plant. Play continues freely without a goal or time limit.

The garden has a softly lit sky, layered meadow, drifting clouds, and occasional passing birds. Plant stems and their ground shadows share a fixed baseline; the meadow extends behind all rows in portrait layouts. Flower heads retain their proportions while stems adapt to the available height. Independent wind and leaf motions pivot above stationary roots, and hit targets stay fixed. Ambient motion pauses while the menu is open, the tab is hidden, or the window is inactive. Reduced-animation mode and the system motion preference disable wind, cloud movement, and birds.

## Controls

- **Touch / mouse / keyboard:** press a flower; use keys 1–6, or arrows and Space. Focused flower buttons also support native Enter activation.
- **Eye gaze:** dwell for 300–2500 ms (default 800 ms). A fill shows progress. Look away before activating the same flower again.
- **One switch:** automatic scanning at 600–4000 ms per flower (default 1500 ms); Space plays the outlined flower.
- **Two switches:** Enter advances the outline; Space plays that flower.
- **Options:** use the gear icon or Escape to return to the arcade-style menu. Playback, scanning, and pending dwell pause while the menu is open or the tab is hidden. Holding a switch does not repeat notes.

All settings stay in the menu: garden, black, or white background; volume; mute; reduced animations; and optional fullscreen. Input mode, timings, and settings are saved locally when storage is available. The site language preference is shared with the other pages (French, English, Japanese). Screen-reader labels and instructions remain available without introducing visible text in play.

There are no build steps, libraries, or audio downloads. Audio uses Web Audio and starts after a user interaction. The arcade font is loaded from the repository. Vector artwork is shared through `garden-art.js`; the meadow is a local SVG asset. The game remains visually playable if audio or local storage is unavailable.

## Automated checks

From the repository root:

```sh
node --test arcade/bell-garden/tests/garden.test.cjs
```

The checks exercise the page script with deterministic DOM, timing, and Web Audio doubles, including input modes, menu transitions, keyboard navigation, audio cleanup, saved settings, and translations. They also check that the game contains no visible text. Browser rendering and real assistive devices still need manual verification.
