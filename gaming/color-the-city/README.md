# Colour the City / Colore la ville

A standalone, one-switch colouring-book prototype. A giant rainbow zeppelin floats across a plain white drawing board. One press releases a large paint drop. A landing colours the next white floor, top to bottom. Finish four oversized storybook houses (12 floors), then press again for a fresh white drawing and a new palette.

The scene uses simple dark outlines, large windows, playful roofs, and a white background. Its only surrounding controls are a title/navigation row, the paint button, a small progress indicator, and a switch hint. Sound, speed, aiming help, and assistance live in Settings. There are no sky/ground fills, scenery textures, or instructional panels.

## Try it

Serve the repository with any static server, for example `python -m http.server 8000`, then open `/gaming/color-the-city/`. It is also the first tile in the Switch Games (`gaming/`) catalogue. All assets are local: no external libraries, fonts, media downloads, or build steps. The HTML, CSS, and JavaScript can also be downloaded together and opened locally in a modern browser.

- **Space or Enter:** start, drop paint, resume, and replay. Switch hardware should send one of these keys. Holding a key does not repeat.
- **Mouse or touch:** press the large paint button or anywhere in the drawing.
- **Settings:** three constant flight speeds, an optional aiming line (off initially for a clean page), and optional near-miss assistance. Drops fall vertically and meet the visible sloped or domed roof.
- **Pause:** available at the top; opening settings, switching tabs, or leaving the window also pauses. Resume with the same switch.
- **Sound:** optional, off initially. Short synthesised tones need no audio assets.
- **Languages:** French, English, Japanese. Uses the site's `siteLanguage` preference when storage is available.

No time limit, collisions, lost lives, or penalties. Misses add a paint dab to the page. Progress is available as a numeric count and native progress element as well as coloured house sections. Reduced-motion preferences remove paint transitions and decorative splash particles; the moving zeppelin and falling drops remain essential to the activity.

## Prototype checks

Browser checks cover a complete 12-floor round and replay, held and fresh Space/Enter presses, pointer/touch input, white initial/reset floors, misses, full zeppelin wrapping, settings/focus-loss pause, aiming help, all three languages, and narrow-screen overflow. Physical switch hardware and screen reader testing remain to be done on the target device.

Manual edge cases to retain: close settings and press the switch immediately; change language then return to switch play; release several drops just before the final floor is painted; hold the switch through completion; move to another tab while paint is falling.
