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

The white drawing-board treatment, thick outlines and restrained pastel object colours remain shared across settings. Completed panoramas supply the stronger thematic colour. The menu uses a paper map rather than applying a space background to terrestrial scenes. Newly coloured accents and decorations preserve the one-switch interaction and existing difficulty settings.

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

## More traditional arcade settings to consider

These would retain two to four large targets, the five difficulty settings, slow drops and one colouring objective.

| Proposed setting | Paintable objects | Restoration payoff |
| --- | --- | --- |
| **Neon Carnival — first recommendation** | Ferris wheel, carousel, rocket ride and arcade cabinet. | An unlit fairground fills with coloured bulbs and gentle ride motion. |
| **Retro Racetrack** | Race car, pit garage, starting lights and trophy tower. | Flags, wheels and track lights animate around a vivid circuit. |
| **Pinball Garden** | Giant bumpers, star gates, curved ramps and a jackpot tower. | Lights come on; a ball performs a short completion celebration without adding pinball controls. |
| **Toy Factory** | Robot, toy train, wind-up bird and toy rocket. | The restored toys make small friendly movements. |
| **Coral Arcade** | Submarine, octopus, coral towers and treasure arch. | Bubbles and fish return to a luminous reef. |
| **Pixel Islands** | Floating platforms, crystal towers, a small castle and giant flowers. | Stars and a colourful platform-game landscape appear. |

Candidate assets for a later listening pass include `songs/confetti.mp3` for Carnival (137.1 s, −16.2 LUFS) and `songs/synth/synth1.mp3`, metadata title *Neon Heartbeat*, for a neon setting (117.5 s, −14.9 LUFS). These are audition candidates, not selected soundtracks. The existing Space Arcade alternatives measure substantially louder than the current set and should not be substituted solely because of their names.

## Verification

Current verification results are recorded in the README. Geometry checks cover 640 non-city restoration objects and 10,240 orbital positions. Browser checks cover same-setting repeats in all five themes, selection persistence, paint counts, the final reveal, pause/Continue, reduced motion and sound timing. A dedicated Forest round verifies all eight accent shapes remain white until the final required hit, fill completely and clean up their clips while preserving the twelve main regions. Physical switch hardware and screen reader checks remain to be performed on the target devices.
