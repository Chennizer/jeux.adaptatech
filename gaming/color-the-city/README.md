# Recolor / リカラー

A standalone switch painting game: the colours have disappeared and the worlds have become sad. A giant rainbow zeppelin carries paint across each pale landscape. Every fresh press releases a slow drop that restores colour, warmth and joy. Complete a world, enjoy its colourful transformation, then continue the journey to the next one.

## A journey through five worlds

The initial menu offers five illustrated choices:

- **City:** oversized storybook buildings.
- **Forest:** a scalloped pine, broad oak, apple tree, and weeping willow, with connected organic canopies and branching details.
- **Village:** cottage, windmill, clock tower, and bakery.
- **Farm:** barn, silo, tractor, and a giant sunflower planter.
- **Planets:** ringed, cratered, banded, and star-patterned worlds floating on the white page.

Each world has its own outline artwork, paint regions, collision silhouettes, palette and soundtrack. Objects begin white against a subdued atmosphere. Successful paint hits gradually clear the grey mood and bring warmer light to the landscape. The title is Recolor in French/English and リカラー in Japanese; the story, world names, difficulty descriptions and controls are localized in all three languages.

The journey follows **City → Forest → Village → Farm → Planets → City**, using a fresh composition on each visit. Any world remains directly selectable on the menu. Completed worlds regain colour on the menu map, and their restored state is remembered in `recolorRestoredWorlds` when local storage is available. Scene, difficulty, colour mode and audio choices are also remembered. This is a gentle journey with no time limit, lost lives or penalties.

Each scene has **ten composition templates** that vary motif order, size, placement, and mirroring. A separate shuffle bag for each scene uses all ten before repeating, and prevents an immediate repeat when a new bag starts. Difficulty determines how many motifs from the chosen composition appear.

Selecting a different world or difficulty and pressing Start begins a fresh drawing. Continue during an unfinished drawing preserves its colours, falling drops, animation progress, zeppelin position and direction. Changing a menu choice back before starting also leaves that drawing intact. After completing a world, the menu action becomes Next world and continues the route.

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

The menu's segmented Automatic/Manual selector remembers the chosen mode. Keyboard instructions remain available to assistive technology without explanatory paragraphs on screen. Switching modes on Continue preserves the drawing and selected colour; the automatic timer restarts with a fresh interval. Normal pause/Continue in the same mode preserves the timer remainder.

A large paint-drop badge on the zeppelin, its coloured gondola, and its enlarged paint tank all show the active colour. An accessible stage label also identifies it. Every drop captures its colour on release, so a later selection change cannot recolour a drop already in flight. Painted areas retain their own chosen colours; later hits on other parts do not repaint a completed roof.

## Zeppelin flight

The zeppelin starts flying to the right. It must finish leaving the drawing before reversing, then re-enters from that same edge facing left. The left edge works the same way, producing continuous back-and-forth passes. Speed and altitude remain predictable. Its paint outlet stays under its centre when mirrored, so drops still fall vertically. Already-falling drops keep their original position and target.

## Menu and fullscreen play

The menu loads `css/video-stop-action.css`, shared with the site's Arcade games, and adapts it to Recolor's journey. A light control rail contains a small Arcade heading, a clearer game title, one short story line, Automatic/Manual selection, difficulty and Start. The segmented selector has adjoining equal areas without the previous gap between them. Title spacing and control sizing adapt to the viewport without scrolling.

Five illustrated world cards sit on a pale paper-sky travel map. Muted previews show the missing colours; selection and previously restored worlds bring colour back to the cards. The restored state has an accessible description as well as its visual treatment. Thumbnails reuse independent copies of the scene artwork, so menu previews never change the gameplay drawing. The menu has no long explanations, colour counters or visible keyboard reminders.

Settings open in a native modal dialog. The Game tab holds language, speed, aiming and assistance; the Audio tab holds music/effects toggles and volumes. Only one short panel appears at a time, with no scrolling. Tab stays inside the modal, Escape/X/backdrop closes it, and focus returns to Settings. Space/Enter inside the modal never starts the game. Language changes keep focus inside the modal.

Start requests native fullscreen directly from the click, touch, or switch gesture. Where fullscreen is unsupported or denied, the game fills the browser viewport.

During play, only the drawing, zeppelin, and paint effects are visible. There are no titles, labels, counters, buttons, settings, instructions, or completion text. The entire drawing accepts click/touch and is the sole focusable game control. Status and progress remain available to assistive technology without visible overlays.

- **Space:** start, drop paint, resume, and continue to the next world in either mode. **Enter** also drops paint in automatic mode; in manual play it only cycles colours. Enter still activates Start on the menu. Map switch hardware accordingly; holding never repeats.
- **Mouse or touch:** Start from the menu, then press anywhere in the drawing.
- **Escape / leaving fullscreen:** return to the menu with progress preserved. Changing tabs or leaving the window also pauses.
- **Settings:** three flight speeds, optional aiming line (off initially), near-miss assistance, plus separate music/effects toggles and volume sliders. Audio preferences are remembered. Music and paint sounds start enabled at gentle levels, after Start only.
- **Completion:** the final fill and shimmer finish before the complete colourful landscape fades in. It remains on screen for 6.5 seconds, then fades to white and automatically begins the next world. A fresh press can advance once the reveal has had time to appear; holding the switch never repeats.

## Paint effects

Each press gives the paint a short, visible release swell, followed by a gentle vertical descent. Drop travel lasts about 1.5–2.25 seconds including the swell, depending on distance; it no longer accelerates into a fast fall. Soft trails follow the drop, and contact makes a slower splat with a few arcing droplets and an expanding ring.

Colour spreads for 4.2 seconds, with a short shimmer tail. Organic reveal shapes are fitted to each part's actual bounds so small windows/roofs and large canopies do not fill all at once. A faint sheen and small, staggered gold/white glints appear only inside the already-coloured shape, beneath static outlines and details. Each glint gently appears and fades once. Completed objects settle and emit stars. The completion sequence allows the entire last fill and shimmer to finish before revealing the background.

All effects share the game frame clock: returning to the menu freezes motion and effects, and Continue resumes an unfinished drawing. Final reveals finish after the logical win. New compositions and world changes clear old drops, clips, particles, life details and transforms. Reduced-motion preferences retain essential flight/drop movement but use immediate paint fills, static restoration details and shorter background fades, with no glitter, sheen, decorative trails, bobbing or object movement.

## Colour brings life back

The mostly white drawing board starts with a faint grey atmosphere: clouds and quiet hills in the terrestrial worlds, or a faded moon and stars around the planets. As successful hits restore the drawing, the atmosphere gradually becomes lighter and warmer. The full completion landscape remains the final reveal.

Finishing an object adds a small lasting response after its slow fill has completed: warm details around buildings, birds/leaves or flowers in nature, and little celestial details around planets. These reactions make each restored object feel alive without adding controls or text. They remain through the celebration and clear when the next world starts.

`atmosphere.js` and `restoration.js` update only from the shared game frame loop. They do not own animation timers, so pause freezes them with the drawing. Reduced motion reveals static details instead of decorative movement. Misses still leave harmless paint dabs.

## Completion landscapes

The pale world gains subtle warmth during painting. Once every object is coloured, a separate full-viewport SVG landscape slowly appears behind the finished drawing:

- **City:** a colourful sunset with distant city silhouettes.
- **Forest:** a green woodland sky, warm sunlight, layered trees and firefly-like points.
- **Village:** a pastel sunrise above hills and distant cottages.
- **Farm:** a blue countryside sky above green and golden fields.
- **Planets:** a rich galaxy with nebula clouds, stars, a moon and orbital arcs.

Each theme has ten deterministic background variations matched to the composition. The normal completion sequence waits for the final 4.2-second fill and shimmer tail, fades in over 1.8 seconds, holds for 6.5 seconds, then fades to white over 0.9 seconds before the next world. Reduced motion uses shorter fades and the same viewing hold. The grey atmosphere fades away as the final background appears. The landscape stays behind the outlined objects and zeppelin, with no text or controls appearing during the celebration.

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

Effects start at 40% with additional per-sample attenuation. Closely spaced inputs coalesce sound effects and there is a six-voice limit. Music and effects are independently adjustable/mutable in the settings modal, without playing preview sounds there. Music starts only in the user's Start gesture, pauses on the menu/tab/window exit, and continues from its previous position on Continue. Moving to another world selects its thematic soundtrack automatically. Transient effects stop on pause/new compositions/world changes and do not restart late after an asynchronous load. Unsupported audio or missing library files never block painting.

## Try it

Serve the repository, for example with `python -m http.server 8000`, then open `/gaming/color-the-city/`. The existing URL is retained, and the Switch Games (`gaming/`) catalogue lists Recolor. All assets are local, including `scenes.js`, `menu-previews.js`, `templates.js`, `backgrounds.js`, `atmosphere.js`, `restoration.js`, `audio.js`, the existing `songs/` and `sounds/` files, and the city cover at `images/color-the-city.svg`. The Arcade heading self-hosts Press Start 2P from the official Google Fonts collection; its SIL Open Font License is included at `fonts/pressstart2p-OFL.txt`. No external libraries, font requests, media downloads or build steps are required.

## Prototype checks

The earlier prototype regression checks cover fullscreen and pause/Continue, both offscreen flight reversals, held switch input, slow clipped fills and glitter, colour modes, active-colour indicators, thematic soundtracks and audio lifecycle, saved settings, localization and modal keyboard behavior. Earlier composition checks cover all 25 world/difficulty rounds, all 250 template/difficulty combinations (800 objects) without clipping or overlapping assisted hit regions, and 500 shuffled drawings without repeats at bag boundaries.

Recolor checks passed the title/story, map and both settings panels at eleven portrait/landscape sizes from 320×320 to 2560×1440 in French, English and Japanese. Both pill states have no gap, equal halves and immediately readable labels. Completed rounds in all five worlds cover all five difficulty settings, grey-to-warm progress, delayed life details, exact pause freezing, completed backgrounds, automatic world changes, cleanup and remembered map colours. Focused reduced-motion checks confirm static visual decorations, no glitter, paused life, next-world transition and held manual Enter behavior. A real-audio check confirms automatic City → Forest soundtrack switching after one Start, followed by pause/Continue with position retained. Isolated atmosphere checks cover all 50 scene/variant combinations; restoration checks cover all five themes, bounded reactions, delay, duplicate protection, finite geometry and cleanup. Screenshots, syntax, unique HTML IDs and whitespace were checked. Physical switch hardware and screen reader testing remain to be done on the target device.
