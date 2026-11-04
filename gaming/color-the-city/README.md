# Colour the City / Colore la ville

A standalone, one-switch prototype. A plane flies from left to right on repeated passes. Press to release a paint drop: a landing colours the next grey floor, top to bottom. Complete all 18 floors across six buildings, then press again for a new palette.

## Try it

Serve the repository with any static server, for example `python -m http.server 8000`, then open `/gaming/color-the-city/`. It is also the first tile in the Switch Games (`gaming/`) catalogue. There are no external libraries, fonts, media downloads, or build steps. The HTML, CSS, and JavaScript can also be downloaded together and opened locally in a modern browser.

- **Space or Enter:** start, drop paint, resume, and replay. Switch hardware should send one of these keys. Holding a key does not repeat.
- **Mouse or touch:** use the large green button, or press anywhere in the illustrated scene.
- **Settings:** three constant flight speeds, an optional aiming line, and optional near-miss assistance. Paint falls vertically rather than inheriting flight momentum.
- **Pause:** available in the toolbar; opening settings, switching tabs, or leaving the window also pauses. Resume with the same switch.
- **Sound:** optional, off initially. Short synthesised tones need no audio assets.
- **Languages:** French, English, Japanese. Uses the site's `siteLanguage` preference when storage is available.

No time limit, collisions, lost lives, or penalties. Missing leaves a small paint splash on the street. Progress stays visible through lit windows as well as coloured walls. Reduced-motion preferences remove paint transitions and decorative splash particles; the moving plane and falling drops remain essential to the activity.

## Prototype checks

Browser checks cover a complete 18-floor round and replay, Space/Enter hold and release, pointer and touch input, misses, settings and focus-loss pause, aiming help, all three languages, and narrow-screen overflow. Also check switch hardware and the intended learner's timing needs on the target device; this prototype has not been tested with physical switch hardware or a screen reader.

Manual edge cases to retain: close settings and press the switch immediately; change sound/language then return to switch play; release several drops just before the final floor is painted; hold the switch through completion; move to another tab while paint is falling.
