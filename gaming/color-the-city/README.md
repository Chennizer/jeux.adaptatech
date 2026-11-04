# A World of Colour / Un monde de couleurs

A standalone colouring-book prototype with automatic one-switch play and a manual colour-selection mode. A giant rainbow zeppelin flies over a white drawing board. A fresh press releases paint onto one of four large objects. Finish all 12 parts, enjoy the visual celebration, then press again for a fresh drawing and palette.

## Choose a drawing

The initial menu offers five illustrated choices:

- **City:** four oversized storybook buildings.
- **Forest:** a scalloped pine, broad oak, apple tree, and weeping willow, with connected organic canopies and branching details.
- **Village:** cottage, windmill, clock tower, and bakery.
- **Farm:** barn, silo, tractor, and a giant sunflower planter.
- **Planets:** ringed, cratered, banded, and star-patterned worlds floating on the white page.

Each scene has its own real outline artwork, paint regions, collision silhouettes, and palette. All start white. Scene names and controls support French, English, and Japanese. The selected scene is remembered when local storage is available.

Selecting a different scene and pressing Start begins a fresh drawing. Continue on the same scene preserves the current colours, falling drops, animation progress, zeppelin position, and direction. Changing the menu choice back before starting also leaves the current drawing intact.

## Colour modes

- **One switch / automatic:** holds the active colour for 12 seconds, then selects the next palette colour. Space or Enter drops paint. Crossing from one object to another does not change the colour.
- **Choose the colour / manual:** Space, click, or touch drops paint. Each fresh Enter or NumpadEnter press cycles to the next colour without dropping paint. Holding Enter changes it only once. The colour never changes on a timer in this mode.

The menu explains both modes and remembers the chosen mode. Switching modes on Continue preserves the drawing and selected colour; the automatic timer restarts with a fresh interval. Normal pause/Continue in the same mode preserves the timer remainder.

A large paint-drop badge on the zeppelin, its coloured gondola, and its enlarged paint tank all show the active colour. A menu swatch and accessible stage label also identify it. Every drop captures its colour on release, so a later selection change cannot recolour a drop already in flight. Painted areas retain their own chosen colours; later hits on other parts do not repaint a completed roof.

## Zeppelin flight

The zeppelin starts flying to the right. It must finish leaving the drawing before reversing, then re-enters from that same edge facing left. The left edge works the same way, producing continuous back-and-forth passes. Speed and altitude remain predictable. Its paint outlet stays under its centre when mirrored, so drops still fall vertically. Already-falling drops keep their original position and target.

## Menu and fullscreen play

The menu follows the site's shared game-options style (`css/choiceeyegaze.css`): a dark backdrop, white panel, teal title/borders and an orange Start button. It contains scene/mode choices, a current-colour preview and optional language, speed, sound, aiming, and assistance settings. Start requests native fullscreen directly from the click, touch, or switch gesture. Where fullscreen is unsupported or denied, the game fills the browser viewport.

During play, only the drawing, zeppelin, and paint effects are visible. There are no titles, labels, counters, buttons, settings, instructions, or completion text. The entire drawing accepts click/touch and is the sole focusable game control. Status and progress remain available to assistive technology without visible overlays.

- **Space:** start, drop paint, resume, and replay in either mode. **Enter** also drops paint in automatic mode; in manual play it only cycles colours. Enter still activates Start on the menu. Map switch hardware accordingly; holding never repeats.
- **Mouse or touch:** Start from the menu, then press anywhere in the drawing.
- **Escape / leaving fullscreen:** return to the menu with progress preserved. Changing tabs or leaving the window also pauses.
- **Settings:** three flight speeds, optional aiming line (off initially), near-miss assistance, plus separate music/effects toggles and volume sliders. Audio preferences are remembered. Music and paint sounds start enabled at gentle levels, after Start only.
- **Completion:** after the visual celebration settles, a fresh press starts another drawing in the same scene. A held switch cannot accidentally replay.

## Paint effects

Each press gives the paint a short, visible release swell, followed by a gentle vertical descent. Drop travel lasts about 1.5–2.25 seconds including the swell, depending on distance; it no longer accelerates into a fast fall. Soft trails follow the drop, and contact makes a slower splat with a few arcing droplets and an expanding ring.

Colour spreads for 4.2 seconds, with a short shimmer tail. Organic reveal shapes are fitted to each part's actual bounds so small windows/roofs and large canopies do not fill all at once. A faint sheen and small, staggered gold/white glints appear only inside the already-coloured shape, beneath static outlines and details. Each glint gently appears and fades once. Completed objects settle and emit stars. The final replay lock allows the entire last fill and shimmer to finish.

All effects share the game frame clock: returning to the menu freezes everything, and Continue resumes it. Final reveals finish after the logical win. Replay and scene changes clear old drops, clips, particles, and transforms. Reduced-motion preferences retain the slower essential drop movement but use immediate fills and a brief static splat, with no glitter, sheen, decorative trails, particles, stars, bobbing, or object movement. Essential flight/drop movement remains.

No timer, collision, lost life, or penalty. Misses leave harmless paint dabs.

## Music and sounds

Audio reuses the existing repository library; no new recordings or external downloads are added.

| Scene | Background music |
| --- | --- |
| City | `songs/artgallery1.mp3` (Art Gallery / painting) |
| Forest | `songs/spring/spring3.mp3` |
| Village | `songs/season/spring1.mp3` (pastoral spring) |
| Farm | `songs/bees/beesmusic3.mp3` |
| Planets | `songs/space/space1.mp3` (Space) |

These recordings follow the scenes' themes: Art Gallery for the painted city, Plant/Spring for the forest, seasonal spring for the village, Bees for the farm, and Space for the planets. They reuse the same themed collections as the site's painting, nature and stars activities. Music loops at a low initial volume (17%) with a gentle fade-in. The source recordings retain their existing loop boundaries/quiet tails. Only the active scene's soundtrack loads.

- **Release:** `sounds/bubbles/bubble3.mp3`, a quiet, slightly higher soft pop.
- **Landing:** the same bubble sample, slower and lower for a paint plop.
- **Colour spread/glitter:** `sounds/space/twinklingstar1.mp3`, softly faded to match the slower fill.
- **Completed drawing:** `sounds/success4.mp3`, a short chime with a gentle music dip.

Effects start at 40% with additional per-sample attenuation. Closely spaced inputs coalesce sound effects and there is a six-voice limit. Music and effects are independently adjustable/mutable on the menu, without playing preview sounds there. Music starts only in the user's Start gesture, pauses on the menu/tab/window exit, and continues from its previous position on Continue. Replaying the same scene keeps its soundtrack flowing; changing scenes selects its own track. Transient effects stop on pause/replay/scene changes and do not restart late after an asynchronous load. Unsupported audio or missing library files never block painting.

## Try it

Serve the repository, for example with `python -m http.server 8000`, then open `/gaming/color-the-city/`. A tile also appears in the Switch Games (`gaming/`) catalogue. All assets are local, including `scenes.js`, `audio.js`, the existing `songs/` and `sounds/` files, and the menu illustration at `images/color-the-city.svg`. No external libraries, fonts, media downloads, or build steps.

## Prototype checks

Browser checks cover both fully offscreen reversals, leftward paint drops, same-scene direction/progress preservation, scene-change cleanup, all four white drawings, a complete 12-part round and replay for the original scenes, animation cleanup, localized menu choices, and narrow-screen overflow. Slow-paint checks also cover visible in-flight drops after 0.9 seconds, sustained clipped fills, staggered glints, frozen pause/resume state, overlapping fills in all four scenes, final reveal/replay timing, shimmer cleanup, and reduced motion. Earlier checks cover native/full-viewport fullscreen, Escape/Continue, held Space/Enter, and pointer/touch. Audio checks cover all five thematic soundtrack mappings, real playback/pause/Continue for each, silent menus, decoded effects, held input, pause/stop, Continue position, mute/volume preferences, scene soundtrack changes, bounded overlap, and missing/unsupported audio fallback. Colour-mode checks cover the 12-second automatic interval, pause remainder, manual Enter/hold/NumpadEnter, stable colours while crossing objects, captured in-flight colours, synchronized paint indicators, slower fills, full rounds/replays for the refined forest and planets, localized menus and mobile overflow. Physical switch hardware and screen reader testing remain to be done on the target device.
