# Bell Garden prototype

Open `arcade/bell-garden/index.html` directly, or choose **Jardin de clochettes / Bell Garden** in the arcade menu. The activity is also registered in `data/games.json` for the activity finder and favorites.

Six illustrated flowers play synthesized pentatonic bell notes (C, D, E, G, A, high C). Each distinct flower awakens once; awakening all six reveals a butterfly. Play can continue indefinitely, without scoring penalties or time limits. **Listen** plays a demonstration without advancing the player's progress. Playing a flower interrupts the demonstration.

## Controls

- **Touch / mouse / keyboard:** press a flower; use keys 1–6, or arrows and Space. Focused flower buttons also support native Enter activation.
- **Eye gaze:** dwell on a flower for 300–2500 ms (default 800 ms). The progress ring shows the remaining dwell. Look away before activating the same flower again. Touch and synthesized clicks remain available.
- **One switch:** automatic scanning at 600–4000 ms per flower (default 1500 ms); Space plays the outlined flower.
- **Two switches:** Enter advances the outline; Space plays that flower.

Options pause scanning, pending dwell activation, and the demo. Holding a switch does not repeat notes. Hiding the tab stops scanning, pending dwell, demo playback, and sounding notes. Reset clears the session's progress. Master volume, mute, and reduced-animation support are included.

The page follows the site's `siteLanguage` preference (French, English, Japanese). Input mode, dwell, scanning speed, volume, and reduced-animation settings are saved locally when storage is available. The garden still works with storage disabled and provides visual feedback when Web Audio is unavailable.

There are no build steps, external assets, libraries, or audio downloads. Web Audio starts only after the initial user interaction. Real eye-tracker and switch hardware testing remains necessary before treating this as a finished accessible activity.

## Automated checks

From the repository root, run:

```sh
node --test arcade/bell-garden/tests/garden.test.cjs
```

The checks exercise the page script with deterministic DOM, timing, and Web Audio doubles. They cover activation, dwell cancellation, both switch modes, keyboard navigation, demo interruption, reset, sound cleanup, translations, and unavailable storage/audio. They do not verify browser rendering or physical assistive devices.
