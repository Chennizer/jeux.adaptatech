# Graphics and thematic-audio review

This pass covers the five existing settings, the blank-to-restored transformation, the menu previews, restoration animations, music/effects assets and playback behavior. New arcade settings below are proposals, not added levels.

## Changes made

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
| City | Broad storybook buildings, a subdued beginning, warm windows and birds, then a pastel sunset skyline. | The existing forms and lighting are coherent. Corrected the chimney anchor and the zeppelin's completion exit. |
| Forest | Four recognizable canopy silhouettes; flowers and birds return before a sunlit woodland backdrop. | The most visible unfinished details were the white trunks and apples. Added final-hit accents and corrected tall-tree perches. |
| Village | Cottage, windmill, clock tower and bakery, with a softer sunrise and distant houses. | Retained the readable silhouettes and corrected the cottage's smoke position. Its pink sky remains close to City's palette; a distinct morning treatment is a possible later refinement. |
| Farm | Barn, silo, tractor and sunflower against a restored countryside and golden fields; small flowers and butterflies. | Large objects remain distinct. Completion now clears the zeppelin from the finished panorama. |
| Planets | A faded moon and pale worlds become a rich galaxy, with moving stars and small moons. | Strongest contrast between initial and restored scenes. Corrected orbit geometry; reduced motion retains fixed ornaments. |

The white drawing-board treatment, thick outlines and restrained pastel object colours remain shared across settings. Completed panoramas supply the stronger thematic colour. The menu uses a paper map rather than applying a space background to terrestrial scenes. Its active card is identified by a native radio dot, a thick teal frame and a teal caption; completion checkmarks are removed and hover remains visually separate from selection. Newly coloured accents and decorations preserve the one-switch interaction and existing difficulty settings.

## Music and effects

The audit measured the five active tracks, 21 alternatives and three effect recordings using FFmpeg loudness, true-peak, duration and silence analysis. Library usage and actual browser playback were checked. **No listening tool was available, so instrumentation and subjective musical character were not judged by ear.**

| Setting | Active file | Duration | Integrated loudness | Loop observation |
| --- | --- | ---: | ---: | --- |
| City | `songs/artgallery1.mp3` | 240.0 s | −15.0 LUFS | Long painting-library track; retained. |
| Forest | `songs/spring/spring3.mp3` | 67.2 s | −16.3 LUFS | Approximately 1.62 s quiet tail; repeated listening is more noticeable in this shorter loop. |
| Village | `songs/season/spring1.mp3` | 162.5 s | −16.4 LUFS | Approximately 0.75 s quiet tail and 0.32 s quiet intro. |
| Farm | `songs/bees/beesmusic3.mp3` | 58.8 s | −15.0 LUFS | Short loop; no long quiet gap detected. |
| Planets | `songs/space/space1.mp3` | 236.4 s | −16.2 LUFS | Approximately 0.54 s quiet tail. |

The active music differs by only **1.4 LUFS**. The common 17% initial music setting is reasonable; no normalization or track replacement was justified by the measured evidence. The source collections already correspond to painting, plants/spring, seasonal countryside, bees/nature and space. Same-setting repeats preserve the current recording and position.

Measurements use EBU R128/true-peak analysis and silence detection at −45 dB with a 0.1-second minimum. Quiet-tail figures describe the recordings, not a forced trim applied by the game.

The bubble release/landing samples, fill twinkle and completion chime retain separate attenuation and independent sound/music controls. Cooldowns, a six-voice cap and cancellation of stale asynchronous effects limit overlap. Menus remain silent. The completion chime is now aligned with the restored-background reveal, after approximately 4.65 seconds normally or 0.35 seconds with reduced motion.

The twinkle recording's audible content ends before its configured voice/fade finishes. A future listening pass could tighten its envelope or compare another sample. Likewise, Forest and Farm could benefit from longer alternative recordings if their short loops become repetitive. This pass does not trim musical endings or substitute unreviewed recordings.

## Traditional video-game worlds to consider

The intended reference is classic video-game environments: platformers, space shooters and fantasy adventures. Each proposal keeps the same slow one-switch painting, two to four large objects, five difficulty settings and shuffled layouts.

| Proposed setting | Video-game reference | Paintable objects and restoration payoff |
| --- | --- | --- |
| **Pixel Kingdom — first recommendation** | Colourful side-scrolling platformers. | Chunky blocks, pipes, giant flowers and a castle; colour restores bright hills, clouds and a flag on the castle. |
| **Star Squadron** | Classic space-shooter stages. | Friendly ships, satellites, asteroid outposts and a space station; engines, windows and a vivid starfield light up as colour returns. |
| **Crystal Dungeon** | Fantasy adventure and dungeon games. | Treasure chests, giant crystals, stone towers and a friendly dragon statue; torches and magical light reveal the completed cavern. |

These are proposed new settings, not implemented levels. A later listening pass could compare melodic chiptune for Pixel Kingdom, the existing Space collections for Star Squadron, and gentle fantasy music for Crystal Dungeon. No new soundtrack has been chosen. The earlier physical-arcade/carnival suggestions are superseded by this direction.

## Verification

Current verification results are recorded in the README. Geometry checks cover 640 non-city restoration objects and 10,240 orbital positions. Browser checks cover same-setting repeats in all five themes, selection persistence, paint counts, the final reveal, pause/Continue, reduced motion and sound timing. A dedicated Forest round verifies all eight accent shapes remain white until the final required hit, fill completely and clean up their clips while preserving the twelve main regions. Physical switch hardware and screen reader checks remain to be performed on the target devices.
