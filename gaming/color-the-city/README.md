# Recolor / リカラー

A standalone switch painting game: the colours have disappeared and the worlds have become sad. A giant rainbow zeppelin carries paint across each pale landscape. Every fresh press releases a slow drop that restores colour, warmth and joy. Complete a picture, enjoy its colourful transformation, then restore another layout in the same chosen world.

## Choose a setting

The initial menu offers eight illustrated choices:

- **City:** oversized storybook buildings.
- **Forest:** a scalloped pine, broad oak, apple tree, and weeping willow, with connected organic canopies and branching details. Full restoration also fills the trunks with warm brown and the apples with red/gold accents.
- **Village:** cottage, windmill, clock tower, and bakery.
- **Farm:** barn, silo, tractor, and a giant sunflower planter.
- **Planets:** ringed, cratered, banded, and star-patterned worlds floating on the white page.
- **Pixel Kingdom:** chunky blocks, a pipe, a giant flower and a castle, inspired by platform games.
- **Star Squadron:** a friendly ship, satellite, asteroid outpost and space station, inspired by space shooters.
- **Crystal Dungeon:** a treasure chest, giant crystals, a stone tower and a friendly dragon statue, inspired by fantasy adventures.

Each world has its own outline artwork, paint regions, collision silhouettes, palette and soundtrack. Objects begin white against a subdued atmosphere. Successful paint hits gradually clear the grey mood and bring warmer light to the landscape. The title is Recolor in French/English and リカラー in Japanese; the story, world names, difficulty descriptions and controls are localized in all three languages.

The selected setting stays active across automatic repeats, manual replay, pause/Continue and reload. Completing Forest produces another Forest composition; Planets stays Planets. Only an explicit menu selection changes the setting. Completed worlds regain colour on the menu map, and their restored state is remembered in `recolorRestoredWorlds` when local storage is available. Scene, difficulty, colour mode and audio choices are also remembered. This is a gentle journey with no time limit, lost lives or penalties.

Each scene has **ten composition templates** that vary motif order, size, placement, and mirroring. A separate shuffle bag for each scene uses all ten before repeating, and prevents an immediate repeat when a new bag starts. Difficulty determines how many motifs from the chosen composition appear.

Selecting a different world or difficulty and pressing Start begins a fresh drawing. Continue during an unfinished drawing preserves its colours, falling drops, animation progress, zeppelin position and direction. Changing a menu choice back before starting also leaves that drawing intact. After completing a picture, the menu action offers another picture in the same setting.

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

The zeppelin starts flying to the right and reverses while still partly visible at each edge. Its centre turns near x = −60 and 1260 on the 1200-unit board, instead of waiting until the whole airship has left. A short easing zone slows approach and departure at both edges. All three cruising speeds are 30% faster: 58.5, 97.5 and 156 units/second. Its paint outlet stays under its centre when mirrored, so drops still fall vertically. Already-falling drops keep their original position and target. Completion still lets the zeppelin leave fully so the restored panorama remains clear.

## Menu and fullscreen play

The menu loads `css/video-stop-action.css`, shared with the site's Arcade games, and adapts it to Recolor's journey. A light control rail contains a small Arcade heading, a clearer game title, one short story line, Automatic/Manual selection, difficulty and Start. The segmented selector has adjoining equal areas without the previous gap between them. Title spacing and control sizing adapt to the viewport without scrolling.

Eight illustrated world cards sit on a pale paper-sky travel map. Muted previews show the missing colours; selection and previously restored worlds bring colour back to the cards. The current choice has a visible native radio dot, a persistent thick teal frame, and a teal caption with white text. Hover has a lighter treatment and never changes the choice. Restoration progress adds no checkmark badge and cannot override the selected frame; its accessible description and preview colour remain available. Thumbnails reuse independent copies of the scene artwork, so menu previews never change the gameplay drawing. The menu has no long explanations, colour counters or visible keyboard reminders. All eight cards remain directly available: four columns on desktop, three in taller portrait layouts, and two in compact portrait layouts, with no pagination or scrolling.

Settings open in a native modal dialog. The Game tab holds language, speed, aiming and assistance; the Audio tab holds music/effects toggles and volumes. Only one short panel appears at a time, with no scrolling. Tab stays inside the modal, Escape/X/backdrop closes it, and focus returns to Settings. Space/Enter inside the modal never starts the game. Language changes keep focus inside the modal.

Start requests native fullscreen directly from the click, touch, or switch gesture. Where fullscreen is unsupported or denied, the game fills the browser viewport.

During play, only the drawing, zeppelin, and paint effects are visible. There are no titles, labels, counters, buttons, settings, instructions, or completion text. The entire drawing accepts click/touch and is the sole focusable game control. Status and progress remain available to assistive technology without visible overlays.

- **Space:** start, drop paint, resume, and start another picture in the selected setting in either mode. **Enter** also drops paint in automatic mode; in manual play it only cycles colours. Enter still activates Start on the menu. Map switch hardware accordingly; holding never repeats.
- **Mouse or touch:** Start from the menu, then press anywhere in the drawing.
- **Escape / leaving fullscreen:** return to the menu with progress preserved. Changing tabs or leaving the window also pauses.
- **Settings:** three flight speeds, optional aiming line (off initially), near-miss assistance, plus separate music/effects toggles and volume sliders. Audio preferences are remembered. Music and paint sounds start enabled at gentle levels, after Start only.
- **Completion:** the final fill and shimmer finish before the complete colourful landscape fades in. It remains on screen for 6.5 seconds, then fades to white and automatically begins a new composition in the selected setting. A fresh press can advance once the reveal has had time to appear; holding the switch never repeats.

## Paint effects

Each press gives the paint a short, visible release swell, followed by a gentle vertical descent. Drop travel lasts about 1.5–2.25 seconds including the swell, depending on distance; it no longer accelerates into a fast fall. Soft trails follow the drop, and contact makes a slower splat with a few arcing droplets and an expanding ring.

Colour spreads for 4.2 seconds, with a short shimmer tail. Organic reveal shapes are fitted to each part's actual bounds so small windows/roofs and large canopies do not fill all at once. A faint sheen and small, staggered gold/white glints appear only inside the already-coloured shape, beneath static outlines and details. Each glint gently appears and fades once. Completed objects settle and emit stars. The completion sequence allows the entire last fill and shimmer to finish before revealing the background.

All effects share the game frame clock: returning to the menu freezes motion and effects, and Continue resumes an unfinished drawing. Final reveals finish after the logical win. New compositions and world changes clear old drops, clips, particles, life details and transforms. Reduced-motion preferences retain essential flight/drop movement but use immediate paint fills, static restoration details and shorter background fades, with no glitter, sheen, decorative trails, bobbing or object movement.

## Colour brings life back

The mostly white drawing board starts with a faint grey atmosphere: clouds and quiet hills in the terrestrial worlds, a faded moon and stars around the planets, a quiet navigation beacon for Star Squadron, or a dim lantern for Crystal Dungeon. As successful hits restore the drawing, the atmosphere gradually becomes lighter and warmer. The full completion landscape remains the final reveal.

Finishing an object adds a small lasting response after its slow fill has completed: warm details around buildings, birds/leaves or flowers in nature, and little celestial details around planets. These reactions make each restored object feel alive without adding controls or text. They remain through the celebration and clear when the next composition starts.

`atmosphere.js` and `restoration.js` update only from the shared game frame loop. They do not own animation timers, so pause freezes them with the drawing. Reduced motion reveals static details instead of decorative movement. Misses still leave harmless paint dabs.

## Refined artwork and rendering

All 32 motifs across the eight settings have been refined. The Star Squadron outpost is a clear observatory with a glass dome, airlock, windows, solar panel and communications mast on a small cratered asteroid. Other changes clarify spacecraft glass and dish shapes, fantasy silhouettes, trees, windmill sails, bakery bread/awning, barn roof, grain silo, tractor wheels/glass, sunflower petals, planetary details and the city's canopy, balcony, roof ornament and brick chimney. New accent surfaces start white and fill on the object's final required hit.

Painting keeps its 4.2-second spread and clipped glints. Each reveal scales one shared three-lobed shape, while glints and sheen update only during their visible intervals. Static paint bounds are measured together after the game board becomes visible; zero-size cached bounds are rejected. Hidden guides, settled building transforms, unrevealed life details and finished reduced-motion decorations no longer receive redundant per-frame updates. Atmosphere values are cached and expensive curved collision surfaces use exact spatial edge indexes.

## Completion landscapes

The pale world gains subtle warmth during painting. Once every object is coloured, a separate full-viewport SVG landscape slowly appears behind the finished drawing:

- **City:** a colourful sunset with distant city silhouettes.
- **Forest:** a green woodland sky, warm sunlight, layered trees and firefly-like points.
- **Village:** a pastel sunrise above hills and distant cottages.
- **Farm:** a blue countryside sky above green and golden fields.
- **Planets:** a rich galaxy with nebula clouds, stars, a moon and orbital arcs.
- **Pixel Kingdom:** bright hills, floating block islands, clouds and a distant castle.
- **Star Squadron:** a vivid starfield, navigation lanes and distant friendly spacecraft.
- **Crystal Dungeon:** a glowing layered cavern, crystals, torches and a magical portal.

Each theme has ten deterministic background variations matched to the composition. The normal completion sequence waits for the final 4.2-second fill and shimmer tail, fades in over 1.8 seconds, holds for 6.5 seconds, then fades to white over 0.9 seconds before the next composition in the selected setting. Reduced motion uses shorter fades and the same viewing hold. The grey atmosphere fades away as the final background appears. The zeppelin finishes exiting during the celebration, leaving the restored panorama clear. The landscape stays behind the outlined objects, with no text or controls appearing during the celebration.

## Music and sounds

Audio reuses the existing repository library; no new recordings or external downloads are added.

| Scene | Background music |
| --- | --- |
| City | `songs/artgallery1.mp3` (Art Gallery / painting) |
| Forest | `songs/spring/spring3.mp3` |
| Village | `songs/season/spring1.mp3` (pastoral spring) |
| Farm | `songs/bees/beesmusic3.mp3` |
| Planets | `songs/space/space1.mp3` (Space) |
| Pixel Kingdom | `songs/marioarcademusic.mp3` (platformer) |
| Star Squadron | `songs/space/spacearcade1.mp3` (space shooter) |
| Crystal Dungeon | `songs/eyegazefirefly1.mp3` (glowing magic) |

These recordings follow the scenes' themes: Art Gallery for the painted city, Plant/Spring for the forest, seasonal spring for the village, Bees for the farm, and Space for the planets. They reuse the same themed collections as the site's painting, nature and stars activities. The new settings use the existing Mario Arcade and Space Arcade game recordings, plus Firefly for the magical cavern. Star Squadron applies a 0.72 music gain because its source measures louder than the other themes; this also applies during the completion dip and recovery. Music loops at a low initial volume (17%) with a gentle fade-in. The source recordings retain their existing loop boundaries/quiet tails. Only the active scene's soundtrack loads.

- **Release:** `sounds/bubbles/bubble3.mp3`, a quiet, slightly higher soft pop.
- **Landing:** the same bubble sample, slower and lower for a paint plop.
- **Colour spread/glitter:** `sounds/space/twinklingstar1.mp3`, softly faded to match the slower fill.
- **Completed drawing:** `sounds/success4.mp3`, a short chime with a gentle music dip, triggered on the game frame clock when the completed background starts appearing, after the final fill and shimmer.

Effects start at 40% with additional per-sample attenuation. Closely spaced inputs coalesce sound effects and there is a six-voice limit. Music and effects are independently adjustable/mutable in the settings modal, without playing preview sounds there. Music starts only in the user's Start gesture, pauses on the menu/tab/window exit, and continues from its previous position on Continue. Repeating a setting keeps its soundtrack playing without reloading or rewinding it. Choosing a different world in the menu selects that world’s soundtrack. Transient effects stop on pause/new compositions/world changes and do not restart late after an asynchronous load. Unsupported audio or missing library files never block painting.

## Try it

Serve the repository, for example with `python -m http.server 8000`, then open `/gaming/color-the-city/`. The existing URL is retained, and the Switch Games (`gaming/`) catalogue lists Recolor. All assets are local, including `scenes.js`, `arcade-scenes.js`, `menu-previews.js`, `templates.js`, `backgrounds.js`, `atmosphere.js`, `restoration.js`, `audio.js`, the existing `songs/` and `sounds/` files, and the city cover at `images/color-the-city.svg`. The Arcade heading self-hosts Press Start 2P from the official Google Fonts collection; its SIL Open Font License is included at `fonts/pressstart2p-OFL.txt`. No external libraries, font requests, media downloads or build steps are required.

## Prototype checks

The earlier prototype regression checks cover fullscreen and pause/Continue, both flight reversals, held switch input, slow clipped fills and glitter, colour modes, active-colour indicators, thematic soundtracks and audio lifecycle, saved settings, localization and modal keyboard behavior. Earlier composition checks cover all 25 world/difficulty rounds, all 250 template/difficulty combinations (800 objects) without clipping or overlapping assisted hit regions, and 500 shuffled drawings without repeats at bag boundaries.

Current Recolor checks cover the title/story, map and both settings panels at eleven portrait/landscape sizes from 320×320 to 2560×1440 in French, English and Japanese. Both pill states have no gap, equal halves and immediately readable labels. Completed rounds in all five settings cover all five difficulty settings, gradual colour and life, exact pause freezing, backgrounds, new shuffled layouts in the same setting, retained selection/storage, cleanup and reduced motion. Manual held Enter changes colour once without dropping paint.

Selection checks cover all eight image cards with every world already restored, at those eleven sizes in all three languages. Exactly one radio, teal frame and teal caption identify the active world; completion adds no checkmark. Image clicks, touch taps, native arrow-key selection, distinct hover, reload and Start/Continue preserve the expected choice. Cards and captions fit without scrolling and no JavaScript errors were reported.

The graphics/audio review additionally checks 640 restoration objects across 200 non-city layout/difficulty combinations, with no clipping or bad bird perches after the fixes, and 10,240 planet-orbit positions with no reduced-motion changes. Focused audio checks confirm the completion effect at approximately 4.65 seconds normally or 0.35 seconds with reduced motion, once only, with no paused/stale chime. Same-setting repeat retains one music source/load and advances playback without rewinding; pause/Continue preserves the position. Screenshots, syntax, unique HTML IDs and whitespace were checked. Physical switch hardware and screen reader testing remain to be done on the target device.

The original five-world browser regression also passes after the additions, including completion, same-setting repeat, pause/Continue, reduced motion, mode controls and both settings panels.

The three added worlds complete all fifteen normal world/difficulty rounds and three reduced-motion rounds. End-to-end checks confirm final region/accent fills and clip cleanup, full background reveals, exact pause/Continue freezing, another shuffled layout in the same world, restoration cleanup, manual colour changes without dropping paint and retained selection/restoration flags after reload. No JavaScript errors were reported.

The three added video-game worlds pass geometry checks across all 150 layout/difficulty combinations: 480 placed objects, 39,000 surface samples and 28,800 restoration positions. Each has ten distinct completion backgrounds. Their regions and accents begin white, assisted hit areas do not overlap, restored details wait for the fill, and reduced-motion decorations remain static. All eight menu cards, both colour modes and both modal panels fit at the eleven sizes in all three languages. Actual Chromium media checks confirm Start unlocks all three new recordings, playback advances, Escape pauses, Continue retains the position and changing worlds chooses the expected track with a single audio element.

The refinement checks cover all 400 world/template/difficulty combinations (1,280 objects), exact indexed collision equivalence and all 32 motifs through actual painting. Motion checks measure 58.5 / 97.5 / 156 units/second, both earlier turns with zero fully invisible playing frames, exact corner pause/Continue and unchanged vertical release anchors. Pixel-based intermediate-fill checks cover all 165 main/accent regions across the eight worlds: positive visible geometry caches, growing painted area at 0.5 / 1.5 / 3.5 seconds, visible colour in every region before cleanup, partial-fill pause freezing and full clip/shimmer cleanup. The full original-world and arcade-world regressions, plus extra City/Forest/Village rounds at difficulty 5, pass after the refinements.

Final Chromium profiling with visibly growing paint shows approximately 56% fewer SVG attribute writes, 46–48% less animation callback work and 35–37% less renderer task time in the normal Forest/Dungeon twelve-drop bursts. The 4× CPU stress case still misses frames; the full measurements and limits are documented in the graphics review.

See [ART_AUDIO_REVIEW.md](ART_AUDIO_REVIEW.md) for the per-theme visual review, measured music levels and loop observations, changes made and the three added video-game settings.
