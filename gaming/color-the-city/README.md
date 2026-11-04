# Colour the City / Colore la ville

A standalone, one-switch colouring-book prototype. A giant rainbow zeppelin floats across a white drawing board. A fresh switch press drops paint onto one of four oversized storybook houses. Finish all 12 floors, enjoy the visual celebration, then press again for a new white drawing and palette.

## Menu and fullscreen play

The initial menu contains Start, language, and optional settings. Start requests native fullscreen directly from the click, touch, or switch gesture. Where native fullscreen is unsupported or denied, the game still fills the browser viewport.

During play, the screen contains only the zeppelin, drawing, and paint effects. There are no visible titles, labels, counters, buttons, settings, instructions, or completion text. The entire drawing is the click/touch target and the sole focusable game control. Status and progress remain available to assistive technology without visible overlays.

- **Space or Enter:** start, drop one paint blob per fresh press, resume, and replay. Map switch hardware to either key. Holding does not repeat.
- **Mouse or touch:** Start from the menu, then press anywhere in the drawing.
- **Escape / leaving fullscreen:** return to the menu with the current drawing preserved. Continue resumes it. Changing tabs or leaving the window also pauses and returns to the menu.
- **Settings, before play:** three flight speeds, optional aiming line (off initially), near-miss assistance, sound (off initially), and French/English/Japanese. Uses the site's `siteLanguage` preference when available.
- **Completion:** a visual star celebration; after it settles, a fresh press starts another drawing. A held switch cannot accidentally replay.

## Paint animation

The bucket squeezes as each drop releases. The drop stretches, accelerates, and leaves a trail of smaller paint beads. Roof contact makes a broad squash-and-splat with arcing droplets and an expanding ring. Colour spreads through organic blot shapes clipped to the floor, with a paint run beneath the house's static outlines/windows. Each house settles gently and sends up stars when finished.

All animation uses the same frame clock: returning to the menu freezes drops, reveals, and effects; resuming continues them. Final-floor reveals finish after the logical win. Replay removes temporary clips, particles, and transforms. Reduced-motion preferences use immediate fills and a brief static splat, with no decorative trails, particles, stars, bobbing, or house movement. Essential flight/drop movement remains.

There is no timer, collision, lost life, or penalty. Misses leave harmless paint dabs.

## Try it

Serve the repository with any static server, for example `python -m http.server 8000`, then open `/gaming/color-the-city/`. A tile also appears in the Switch Games (`gaming/`) catalogue. All assets are local, including the menu illustration at `images/color-the-city.svg`; there are no external libraries, fonts, media downloads, or build steps.

## Prototype checks

Browser checks cover native fullscreen entry, Escape/menu/continue, fullscreen-denied fallback, text-free gameplay, a complete 12-floor round/replay, fresh and held Space/Enter, pointer/touch, animated trails/splat/spread, frozen reveals while paused, final effect cleanup, multiple final drops, held-switch completion, menu options, FR/EN/JA, reduced motion, and narrow-screen overflow. Physical switch hardware and screen reader testing remain to be done on the target device.
