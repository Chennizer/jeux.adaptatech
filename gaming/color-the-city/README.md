# Colorful / Coloré / カラフル

A standalone colouring-book prototype with automatic one-switch play and a manual colour-selection mode. A giant rainbow zeppelin flies over a white drawing board. Each fresh press releases paint onto a large outlined object. Complete the drawing to reveal a colourful themed landscape, then continue automatically to another composition.

## Choose a drawing

The initial menu offers five illustrated choices:

- **City:** oversized storybook buildings.
- **Forest:** a scalloped pine, broad oak, apple tree, and weeping willow, with connected organic canopies and branching details.
- **Village:** cottage, windmill, clock tower, and bakery.
- **Farm:** barn, silo, tractor, and a giant sunflower planter.
- **Planets:** ringed, cratered, banded, and star-patterned worlds floating on the white page.

Each scene has its own outline artwork, paint regions, collision silhouettes, and palette. All start white. The title, scene names, difficulty descriptions, and controls support French, English, and Japanese. The selected scene and difficulty are remembered when local storage is available.

Each scene has **ten composition templates** that vary motif order, size, placement, and mirroring. A separate shuffle bag for each scene uses all ten before repeating, and prevents an immediate repeat when a new bag starts. Difficulty determines how many motifs from the chosen composition appear.

Selecting a different scene or difficulty and pressing Start begins a fresh drawing. Continue during an unfinished drawing preserves its colours, falling drops, animation progress, zeppelin position, and direction. Changing a menu choice back before starting also leaves that drawing intact.

## Difficulty

The menu slider has five steps, from left to right:

| Level | Objects | Hits needed per object | Total successful hits |
| --- | --- | --- | --- |
| 1 | 2 | 1 | 2 |
| 2 | 3 | 1 | 3 |
| 3 | 3 | 2 | 6 |
| 4 | 4 | 2 | 8 |
| 5 | 4 | 3 | 12 |

At levels 1 and 2, one paint hit fills the whole object, including its roof and final details, with the slow spreading animation. At levels 3 and 4, the first hit colours two of its three main regions and the second finishes it. At level 5, each hit colours one main region. The selected difficulty stays active as new compositions appear.

## Colour modes

- **One switch / automatic:** holds the active colour for 12 seconds, then selects the next palette colour. Space or Enter drops paint. Crossing from one object to another does not change the colour.
- **Choose the colour / manual:** Space, click, or touch drops paint. Each fresh Enter or NumpadEnter press cycles to the next colour without dropping paint. Holding Enter changes it only once. The colour never changes on a timer in this mode.

The settings modal offers Automatic and Manual modes and remembers the chosen mode. Keyboard instructions remain available to assistive technology without explanatory paragraphs on screen. Switching modes on Continue preserves the drawing and selected colour; the automatic timer restarts with a fresh interval. Normal pause/Continue in the same mode preserves the timer remainder.

A large paint-drop badge on the zeppelin, its coloured gondola, and its enlarged paint tank all show the active colour. An accessible stage label also identifies it. Every drop captures its colour on release, so a later selection change cannot recolour a drop already in flight. Painted areas retain their own chosen colours; later hits on other parts do not repaint a completed roof.

## Zeppelin flight

The zeppelin starts flying to the right. It must finish leaving the drawing before reversing, then re-enters from that same edge facing left. The left edge works the same way, producing continuous back-and-forth passes. Speed and altitude remain predictable. Its paint outlet stays under its centre when mirrored, so drops still fall vertically. Already-falling drops keep their original position and target.

## Menu and fullscreen play

The menu follows the recent Mario and Mario: Peach Challenge pages: a full-height light control panel on the left and a large illustration on the right. It shows only the title, five scene pictograms, difficulty, Start, back and settings. Narrow portrait screens use a single control panel; short landscape screens compact the choices into one row. There are no visible explanatory paragraphs, colour counters, or keyboard reminders, and the menu does not scroll.

Settings open in a native modal dialog. The Game tab holds colour mode, language, speed, aiming and assistance; the Audio tab holds music/effects toggles and volumes. Only one short panel appears at a time, with no scrolling. Tab stays inside the modal, Escape/X/backdrop closes it, and focus returns to Settings. Space/Enter inside the modal never starts the game. Language changes keep focus inside the modal.

Start requests native fullscreen directly from the click, touch, or switch gesture. Where fullscreen is unsupported or denied, the game fills the browser viewport.

During play, only the drawing, zeppelin, and paint effects are visible. There are no titles, labels, counters, buttons, settings, instructions, or completion text. The entire drawing accepts click/touch and is the sole focusable game control. Status and progress remain available to assistive technology without visible overlays.

- **Space:** start, drop paint, resume, and replay in either mode. **Enter** also drops paint in automatic mode; in manual play it only cycles colours. Enter still activates Start on the menu. Map switch hardware accordingly; holding never repeats.
- **Mouse or touch:** Start from the menu, then press anywhere in the drawing.
- **Escape / leaving fullscreen:** return to the menu with progress preserved. Changing tabs or leaving the window also pauses.
- **Settings:** three flight speeds, optional aiming line (off initially), near-miss assistance, plus separate music/effects toggles and volume sliders. Audio preferences are remembered. Music and paint sounds start enabled at gentle levels, after Start only.
- **Completion:** the final fill and shimmer finish before a colourful background fades in. After a short viewing pause, it fades back to white and the next shuffled composition starts automatically. A fresh press can advance once the reveal has had time to appear; holding the switch never repeats.

## Paint effects

Each press gives the paint a short, visible release swell, followed by a gentle vertical descent. Drop travel lasts about 1.5–2.25 seconds including the swell, depending on distance; it no longer accelerates into a fast fall. Soft trails follow the drop, and contact makes a slower splat with a few arcing droplets and an expanding ring.

Colour spreads for 4.2 seconds, with a short shimmer tail. Organic reveal shapes are fitted to each part's actual bounds so small windows/roofs and large canopies do not fill all at once. A faint sheen and small, staggered gold/white glints appear only inside the already-coloured shape, beneath static outlines and details. Each glint gently appears and fades once. Completed objects settle and emit stars. The completion sequence allows the entire last fill and shimmer to finish before revealing the background.

All effects share the game frame clock: returning to the menu freezes motion and effects, and Continue resumes an unfinished drawing. Final reveals finish after the logical win. New compositions and scene changes clear old drops, clips, particles, and transforms. Reduced-motion preferences retain the slower essential drop movement but use immediate fills and a brief static splat, with no glitter, sheen, decorative trails, particles, stars, bobbing, or object movement. Essential flight/drop movement remains.

There is no time limit, lost life, or penalty. Misses leave harmless paint dabs.

## Completion landscapes

The white drawing board remains blank behind the objects throughout painting. Once everything is coloured, a separate full-viewport SVG landscape slowly appears behind the finished drawing:

- **City:** a colourful sunset with distant city silhouettes.
- **Forest:** a green woodland sky, warm sunlight, layered trees and firefly-like points.
- **Village:** a pastel sunrise above hills and distant cottages.
- **Farm:** a blue countryside sky above green and golden fields.
- **Planets:** a rich galaxy with nebula clouds, stars, a moon and orbital arcs.

Each theme has ten deterministic background variations matched to the composition. The normal completion sequence starts the background after the final 4.2-second fill and shimmer tail, fades in over 1.8 seconds, holds for 4.5 seconds, then fades to white before the next drawing. Reduced motion uses shorter fades without decorative movement. The background stays behind the outlined objects and zeppelin, with no text or controls appearing during the celebration.

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

Effects start at 40% with additional per-sample attenuation. Closely spaced inputs coalesce sound effects and there is a six-voice limit. Music and effects are independently adjustable/mutable in the settings modal, without playing preview sounds there. Music starts only in the user's Start gesture, pauses on the menu/tab/window exit, and continues from its previous position on Continue. Replaying the same scene keeps its soundtrack flowing; changing scenes selects its own track. Transient effects stop on pause/replay/scene changes and do not restart late after an asynchronous load. Unsupported audio or missing library files never block painting.

## Try it

Serve the repository, for example with `python -m http.server 8000`, then open `/gaming/color-the-city/`. A tile also appears in the Switch Games (`gaming/`) catalogue. All assets are local, including `scenes.js`, `templates.js`, `backgrounds.js`, `audio.js`, the existing `songs/` and `sounds/` files, and the menu illustration at `images/color-the-city.svg`. No external libraries, fonts, media downloads, or build steps.

## Prototype checks

The existing browser regression scripts cover fullscreen and pause/Continue, both offscreen flight reversals, held switch input, slow clipped fills and glitter, colour modes, active-colour indicators, all five thematic soundtrack mappings, audio preferences and fallback behavior, localization, and narrow-screen overflow.

Composition checks cover completed rounds in all 25 scene/difficulty combinations, exact hit counts and whole-object fills, captured drop colours, intermediate two-hit fills, completion background timing and automatic advancement. A separate geometry sweep covers all 250 scene/template/difficulty combinations (800 objects), with no clipping or overlapping assisted hit regions; 500 shuffled drawings cover complete bags and no immediate repeats at their boundaries. Lifecycle checks cover native fullscreen, held inputs, paused fills, retained layouts, saved difficulty, and reduced-motion progression. Localized menus and open settings fit widths from 320 to 2560 pixels without horizontal overflow. Physical switch hardware and screen reader testing remain to be done on the target device.

The simplified menu and both settings tabs were checked in all three languages at ten portrait/landscape sizes from 320×480 and 568×320 to 2560×1440, with additional 320×320 checks. Controls remain within the viewport without scrolling or clipped content. Modal checks cover Tab/Shift+Tab wrapping, arrow/Home/End tab selection, Escape/X/backdrop dismissal and focus return, switch-key isolation, retained focus when translating, saved mode/audio preferences, and manual painting/Continue after adjusting settings.
