# A World of Colour / Un monde de couleurs

A standalone, one-switch colouring-book prototype. A giant rainbow zeppelin flies over a white drawing board. A fresh press releases paint onto one of four large objects. Finish all 12 parts, enjoy the visual celebration, then press again for a fresh drawing and palette.

## Choose a drawing

The initial menu offers four illustrated choices:

- **City:** four oversized storybook buildings.
- **Forest:** pine, broadleaf, orchard, and stacked-canopy trees.
- **Village:** cottage, windmill, clock tower, and bakery.
- **Farm:** barn, silo, tractor, and a giant sunflower planter.

Each scene has its own real outline artwork, paint regions, collision silhouettes, and palette. All start white. Scene names and controls support French, English, and Japanese. The selected scene is remembered when local storage is available.

Selecting a different scene and pressing Start begins a fresh drawing. Continue on the same scene preserves the current colours, falling drops, animation progress, zeppelin position, and direction. Changing the menu choice back before starting also leaves the current drawing intact.

## Zeppelin flight

The zeppelin starts flying to the right. It must finish leaving the drawing before reversing, then re-enters from that same edge facing left. The left edge works the same way, producing continuous back-and-forth passes. Speed and altitude remain predictable. Its paint outlet stays under its centre when mirrored, so drops still fall vertically. Already-falling drops keep their original position and target.

## Menu and fullscreen play

The menu contains Start and optional language, speed, sound, aiming, and assistance settings. Start requests native fullscreen directly from the click, touch, or switch gesture. Where fullscreen is unsupported or denied, the game fills the browser viewport.

During play, only the drawing, zeppelin, and paint effects are visible. There are no titles, labels, counters, buttons, settings, instructions, or completion text. The entire drawing accepts click/touch and is the sole focusable game control. Status and progress remain available to assistive technology without visible overlays.

- **Space or Enter:** start, release one paint blob per fresh press, resume, and replay. Map switch hardware to either key. Holding does not repeat.
- **Mouse or touch:** Start from the menu, then press anywhere in the drawing.
- **Escape / leaving fullscreen:** return to the menu with progress preserved. Changing tabs or leaving the window also pauses.
- **Settings:** three flight speeds, optional aiming line (off initially), near-miss assistance, and sound (off initially).
- **Completion:** after the visual celebration settles, a fresh press starts another drawing in the same scene. A held switch cannot accidentally replay.

## Paint effects

The bucket squeezes as each drop releases. Paint stretches, accelerates, and trails smaller beads. Contact makes a broad splat, arcing droplets, and an expanding ring. Organic colour blots spread through the target's paintable parts beneath static outlines and details. Completed objects settle and emit stars.

All effects share the game frame clock: returning to the menu freezes everything, and Continue resumes it. Final reveals finish after the logical win. Replay and scene changes clear old drops, clips, particles, and transforms. Reduced-motion preferences use immediate fills and a brief static splat, with no decorative trails, particles, stars, bobbing, or object movement. Essential flight/drop movement remains.

No timer, collision, lost life, or penalty. Misses leave harmless paint dabs.

## Try it

Serve the repository, for example with `python -m http.server 8000`, then open `/gaming/color-the-city/`. A tile also appears in the Switch Games (`gaming/`) catalogue. All assets are local, including `scenes.js` and the menu illustration at `images/color-the-city.svg`. No external libraries, fonts, media downloads, or build steps.

## Prototype checks

Browser checks cover both fully offscreen reversals, leftward paint drops, same-scene direction/progress preservation, scene-change cleanup, all four white drawings, a complete 12-part round and replay for every scene, animation cleanup, localized menu choices, and narrow-screen overflow. Earlier checks also cover native/full-viewport fullscreen, Escape/Continue, held Space/Enter, pointer/touch, reduced motion, and completion effects. Physical switch hardware and screen reader testing remain to be done on the target device.
