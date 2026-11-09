# Graphics and thematic-audio review

This review covers the five original settings and the three added video-game worlds, the blank-to-restored transformation, menu previews, restoration animations, music/effects assets and playback behavior.

## Changes made

- **All 32 motifs refined.** The ambiguous Star Squadron object is now an observatory/airlock on a cratered asteroid, with windows, a solar panel and communication mast. Every other setting also receives clearer forms or paintable details while retaining the large white drawing-board style.
- **Earlier, faster turns.** Cruising speeds are 30% higher. The zeppelin turns while partly visible at both edges, with eased approach/departure. Completion still clears it from the restored panorama.
- **Less work during painting.** Shared reveal transforms, visible-only glints, cached geometry after the board becomes visible, exact indexed silhouette queries and fewer redundant DOM writes reduce animation work. Intermediate fills are checked in addition to finished artwork.

- **Three video-game worlds added.** Pixel Kingdom, Star Squadron and Crystal Dungeon each include four motifs, ten shuffled layouts, a distinct restored landscape and a soundtrack from the existing library. All eight choices retain the clear selected radio/frame/caption and fit without menu scrolling.

- **The chosen setting stays selected.** Automatic progression, replay and the completed-picture menu action all produce another shuffled layout in the same setting. Only choosing a different menu card changes the theme. The selection survives reload; same-setting music continues without reloading or rewinding.
- **The zeppelin finishes leaving the picture.** It previously froze partially outside the viewport during the restored panorama. It now completes its current pass and stops fully offscreen, with the same pause behavior.
- **Forest restoration includes trunks and apples.** Warm brown trunks and red/gold fruit now fill gradually on the final required hit. Their paint layers sit beneath permanent outlines; the original three main regions and hit requirements are unchanged. Previews show the same accents.
- **Birds perch on tall canopies.** A hardcoded minimum height pushed birds down into some tall trees. Their anchors now follow the actual surface with a viewport safety bound.
- **Chimney puffs follow the vents.** Cottage metadata and the city chimney position replace approximate anchors.
- **Planetary ornaments follow their orbit.** Stars and the moon now use the exact rotation of the drawn ellipse instead of an approximate shear.
- **The success chime accompanies the reveal.** It is requested once after the final fill and shimmer, on the game frame clock. It does not play early, continue through a paused completion, or leak into another drawing.

## Theme-by-theme assessment

| Setting | Visual identity and transformation | Result of this pass |
| --- | --- | --- |
| City | Broad storybook buildings, a subdued beginning, warm windows and birds, then a pastel sunset skyline. | Refined the shop canopy, balcony, rooftop leaves/star and brick chimney, with paintable final accents and corrected smoke anchors. |
| Forest | Four recognizable canopy silhouettes; flowers and birds return before a sunlit woodland backdrop. | Refined rooted trunks, connected canopies and branching; trunks/apples fill on the final hit. Indexed collision queries preserve exact branch edges and bird perches. |
| Village | Cottage, windmill, clock tower and bakery, with a softer sunrise and distant houses. | Clearer cottage eaves/chimney, windmill sails, clock face and bakery bread/awning, including paintable final details. |
| Farm | Barn, silo, tractor and sunflower against a restored countryside and golden fields; small flowers and butterflies. | A gambrel barn roof, grain-silo emblem, tractor tyres/glass/exhaust and rounded sunflower petals make the four large silhouettes easier to recognize. |
| Planets | A faded moon and pale worlds become a rich galaxy, with moving stars and small moons. | Refined paintable ring, crater bowls, storm spot and star details. Exact orbit geometry is retained; reduced motion keeps ornaments static. |

The white drawing-board treatment, thick outlines and restrained pastel object colours remain shared across settings. Completed panoramas supply the stronger thematic colour. The menu uses a paper map rather than applying a space background to terrestrial scenes. Its active card is identified by a native radio dot, a thick teal frame and a teal caption; completion checkmarks are removed and hover remains visually separate from selection. Newly coloured accents and decorations preserve the one-switch interaction and existing difficulty settings.

## Music and effects

The original audit measured the five original tracks, 21 alternatives and three effect recordings using FFmpeg loudness, true-peak, duration and silence analysis. Library usage and actual browser playback were checked. **No listening tool was available, so instrumentation and subjective musical character were not judged by ear.**

| Setting | Active file | Duration | Integrated loudness | Loop observation |
| --- | --- | ---: | ---: | --- |
| City | `songs/artgallery1.mp3` | 240.0 s | −15.0 LUFS | Long painting-library track; retained. |
| Forest | `songs/spring/spring3.mp3` | 67.2 s | −16.3 LUFS | Approximately 1.62 s quiet tail; repetition may become noticeable in this shorter loop. |
| Village | `songs/season/spring1.mp3` | 162.5 s | −16.4 LUFS | Approximately 0.75 s quiet tail and 0.32 s quiet intro. |
| Farm | `songs/bees/beesmusic3.mp3` | 58.8 s | −15.0 LUFS | Short loop; no long quiet gap detected. |
| Planets | `songs/space/space1.mp3` | 236.4 s | −16.2 LUFS | Approximately 0.54 s quiet tail. |

The five original tracks differ by only **1.4 LUFS**. The common 17% initial music setting is reasonable; no normalization or track replacement was justified by the measured evidence. The source collections already correspond to painting, plants/spring, seasonal countryside, bees/nature and space. Same-setting repeats preserve the current recording and position.

Measurements use EBU R128/true-peak analysis and silence detection at −45 dB with a 0.1-second minimum. Quiet-tail figures describe the recordings, not a forced trim applied by the game.

The bubble release/landing samples, fill twinkle and completion chime retain separate attenuation and independent sound/music controls. Cooldowns, a six-voice cap and cancellation of stale asynchronous effects limit overlap. Menus remain silent. The completion chime is now aligned with the restored-background reveal, after approximately 4.65 seconds normally or 0.35 seconds with reduced motion.

The twinkle recording's audible content ends before its configured voice/fade finishes. A future listening pass could tighten its envelope or compare another sample. Likewise, Forest and Farm could benefit from longer alternative recordings if their short loops become repetitive. This pass does not trim musical endings or substitute unreviewed recordings.

## Added traditional video-game worlds

The three traditional video-game settings are implemented as selectable worlds. Each retains the same slow one-switch painting, two to four large objects, five difficulty settings and ten shuffled compositions. Choosing a setting keeps subsequent pictures in that setting.

| Setting | Video-game reference | Paintable objects and restoration payoff |
| --- | --- | --- |
| **Pixel Kingdom** | Colourful side-scrolling platformers. | Chunky blocks, pipe, giant flower and castle, with bright hills, clouds and floating block islands. |
| **Star Squadron** | Classic space-shooter stages. | Friendly ship, satellite, asteroid outpost and space station, with luminous details, navigation lanes and a vivid starfield. |
| **Crystal Dungeon** | Fantasy adventure and dungeon games. | Treasure chest, crystals, stone tower and friendly dragon statue, with magical lights and a glowing cavern. |

All three have white outline artwork, gradual paint regions, their own palette, subtle pre-completion atmosphere, restored details and ten matched background variants. The menu shows all eight settings directly, with localized names, independent preview drawings and a clear selected radio/frame/caption.

The soundtrack additions reuse recordings from the site's games and activities. All decode successfully. Measured with the same EBU R128 and −45 dB / 0.1-second silence checks:

| Setting | Recording | Duration | Integrated loudness | Quiet tail |
| --- | --- | ---: | ---: | ---: |
| Pixel Kingdom | `songs/marioarcademusic.mp3` | 59.98 s | −15.9 LUFS | 0.43 s |
| Star Squadron | `songs/space/spacearcade1.mp3` | 180.12 s | −12.6 LUFS | 0.51 s |
| Crystal Dungeon | `songs/eyegazefirefly1.mp3` | 178.03 s | −14.6 LUFS | 0.88 s |

Star Squadron's 0.72 music gain reduces playback by about 2.85 dB, bringing its effective level near −15.45 LUFS. The same gain applies when configuring volume, starting music and ducking/restoring it for the completion chime. Existing settings keep their previous recordings and levels. Mario Arcade and Space Arcade already accompany the corresponding game genres on the site; Firefly supplies the glowing-magic association for the cavern. This choice uses existing associations and measurements, with no claim of subjective listening.

## Rendering measurements

A frozen pre-refinement snapshot and the final version were profiled in Chromium at 1440×900, with audio off and reduced motion disabled. Each run includes five seconds of flight, then twelve simultaneous paint drops across all four objects at difficulty 5 and ten seconds of fill/completion effects. Cached paint bounds are checked after the board becomes visible. Separate pixel tests verify that the actual paint appears and grows during the fill, so reduced work is not measured from empty clips.

| Normal burst metric | Forest before → after | Crystal Dungeon before → after |
| --- | ---: | ---: |
| SVG attribute writes | 178,672 → 78,673 | 179,419 → 79,466 |
| Mean animation callback work | 0.99 → 0.53 ms | 1.03 → 0.54 ms |
| 95th-percentile callback work | 3.3 → 1.4 ms | 2.6 → 1.4 ms |
| Renderer task duration | 2.54 → 1.60 s | 2.50 → 1.62 s |

That is approximately 56% fewer SVG writes, 46–48% less callback work and 35–37% less renderer task time in these runs, with no JavaScript errors. Attribute instrumentation adds overhead to both versions.

The same extreme Forest burst with 4× CPU throttling reduces mean callback work from 3.09 to 2.07 ms and renderer task time from 6.55 to 5.34 seconds. It still misses frames: the 95th-percentile interval remains about 33.4 ms, and the worst observed interval increases from 66.7 to 83.3 ms. These measurements support reduced rendering work, not a guarantee of 60 FPS on every device. Normal slow switch input is less demanding than the twelve-drop burst; target-device testing remains useful.

## Verification

Current verification results are recorded in the README. Refinement geometry covers all 400 world/template/difficulty combinations (1,280 objects), and all 32 motifs paint fully in browser rounds. Pixel-based checks of all 165 main/accent regions confirm positive cached bounds, visible gradual area growth before cleanup, exact pause freezing and removal of all clips/shimmers. Motion checks confirm all three 1.3× cruising speeds and both earlier turns with no fully invisible playing frames. Original geometry checks cover 640 non-city restoration objects and 10,240 orbital positions. All fifteen normal and three reduced-motion added-world rounds pass complete painting, accent/clip cleanup, final background reveals, pause/Continue, same-setting repeats, manual input and saved selection with no JavaScript errors. Added-world checks cover all 150 layout/difficulty combinations, 480 objects, 39,000 surface samples, 28,800 restoration positions and ten distinct backgrounds per added theme. All eight menu choices, colour modes and settings panels fit eleven viewport sizes in French, English and Japanese. Actual browser media checks pass Start, advancing playback, pause/Continue and track changes for all three new recordings. Browser checks cover same-setting repeats in all five themes, selection persistence, paint counts, the final reveal, pause/Continue, reduced motion and sound timing. A dedicated Forest round verifies all eight accent shapes remain white until the final required hit, fill completely and clean up their clips while preserving the twelve main regions. Physical switch hardware and screen reader checks remain to be performed on the target devices.
