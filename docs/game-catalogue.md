# Activity catalogue

`data/games.json` is the shared source of truth for activities used by the finder and favorites. The first version deliberately catalogues a representative set of switch, eye-gaze, and touchscreen activities rather than attempting a risky migration of every menu page.

Each activity has a stable `id` (used in `localStorage`), translated titles, its existing URL and image, and filter metadata. Arrays are used for `access`, `skills`, and `objectives` so that future finder controls can be added without changing the card or favorites code. `ageStyle` is included now for the planned childlike / neutral / teen-adult filter. Where an activity itself explicitly identifies SENICT and Switch Progression Roadmap levels, these are recorded in `senictLevels` and `switchRoadmap`; uncertain levels are intentionally left unset rather than inferred.

The compact homepage panel uses the curated `popular` flag. Keep roughly 10–15 popular activities available for each access method and only mark activities that are linked from a public section menu.

## Progression coverage

The SENICT roadmap documented on this site is a switch-specific progression, so it must not be presented as an eye-gaze or touchscreen scale. The popular switch selection currently includes documented SENICT levels 1, 2, 4, and 6. No activity that is both published in a public menu and explicitly labelled level 3 or 5 was found; these are catalogue gaps rather than levels to infer without evidence. The eye-gaze selection instead spans fixation/cause-effect, dwell and choice, literacy/learning, and creative activities. The touchscreen selection spans simple cause-effect, sensory exploration, choice/communication, and creative activities.

To add an activity:

1. Add one object with a unique, permanent `id` to `data/games.json`.
2. Keep the existing activity URL; do not move the game to match the catalogue.
3. Supply `fr`, `en`, and `ja` titles and an image path.
4. Reuse existing metadata values where possible. Planned values include `one-switch`, `two-switches`, `dwell`, `fixation`, `click`, `communication`, `literacy`, `attention`, `creative`, and `music-video`.

Favorites contain only catalogue IDs under the `adaptatechFavoriteGames` key. This keeps stored data small and ensures that finder results and the **My activities** view always render from the same metadata.
