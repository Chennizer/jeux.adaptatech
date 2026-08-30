# Activity catalogue

`data/games.json` is the shared source of truth for activities used by the finder and favorites. The first version deliberately catalogues a representative set of switch, eye-gaze, and touchscreen activities rather than attempting a risky migration of every menu page.

Each activity has a stable `id` (used in `localStorage`), translated titles, its existing URL and image, and filter metadata. `accessMethods` lists only the independent `switch`, `eyegaze`, and `touch` pathways. Each supported pathway in `senictProgressions` stores one or more `senictLevel`, `senictLabel`, optional `senictCategory`, `skills`, and `difficultyWithinLevel` records. `ageStyle` is included for the planned childlike / neutral / teen-adult filter.

The compact homepage panel currently filters the curated `popular` activities by access method and objective. Progression metadata remains in the catalogue for a later finder version, but is intentionally not exposed in the current interface.

## Progression coverage

Switch, Eye Gaze, and Touch use independent SENict progressions. A numeric level must therefore always be interpreted together with its access method, and the interface changes its progression choices when the access method changes. The catalogue preserves the supplied SENict labels rather than replacing them with generic labels.

The popular Switch and Eye Gaze selections currently cover all seven stages of their respective pathways. The popular Touch selection covers stages 1–5. No published popular activity currently demonstrates **Touch in a Sequence** (stage 6) or a true destination-based **Drag and Drop** task (stage 7); these remain content gaps and are not assigned speculatively. The pathway is called **Touch**, never “Tactile,” in catalogue metadata and SENict labels.

To add an activity:

1. Add one object with a unique, permanent `id` to `data/games.json`.
2. Keep the existing activity URL; do not move the game to match the catalogue.
3. Supply `fr`, `en`, and `ja` titles and an image path.
4. Use the original SENict label for the relevant access pathway. Never assume that the same number means the same skill for Switch, Eye Gaze, and Touch.

Favorites contain only catalogue IDs under the `adaptatechFavoriteGames` key. This keeps stored data small and ensures that finder results and the **Favorites** view always render from the same metadata.
