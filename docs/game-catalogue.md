# Activity catalogue

`data/games.json` is the shared source of truth for activities used by the finder and favorites. The first version deliberately catalogues a representative set of switch, eye-gaze, and touchscreen activities rather than attempting a risky migration of every menu page.

Each activity has a stable `id` (used in `localStorage`), translated titles, its existing URL and image, and filter metadata. Arrays are used for `access`, `skills`, and `objectives` so that future finder controls can be added without changing the card or favorites code. `ageStyle` is included now for the planned childlike / neutral / teen-adult filter. Where an activity itself explicitly identifies SENICT and Switch Progression Roadmap levels, these are recorded in `senictLevels` and `switchRoadmap`; uncertain levels are intentionally left unset rather than inferred.

To add an activity:

1. Add one object with a unique, permanent `id` to `data/games.json`.
2. Keep the existing activity URL; do not move the game to match the catalogue.
3. Supply `fr`, `en`, and `ja` titles and an image path.
4. Reuse existing metadata values where possible. Planned values include `one-switch`, `two-switches`, `dwell`, `fixation`, `click`, `communication`, `literacy`, `attention`, `creative`, and `music-video`.

Favorites contain only catalogue IDs under the `adaptatechFavoriteGames` key. This keeps stored data small and ensures that finder results and the **My activities** view always render from the same metadata.
