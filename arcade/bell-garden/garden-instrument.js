/* One shared profile keeps note envelopes, growth, and music ducking in sync. */
(() => {
  'use strict';
  const instrument = Object.freeze({
    durationMs: 1800,
    frequencies: Object.freeze([261.63, 293.66, 329.63, 392, 440, 523.25]),
    partials: Object.freeze([
      { ratio: 1, level: .27, attack: .009, decay: 1.65 },
      { ratio: 2, level: .055, attack: .006, decay: .6 },
      { ratio: 4, level: .03, attack: .003, decay: .14 },
      { ratio: 3, level: .016, attack: .045, decay: 1.7 }
    ])
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = instrument;
  else window.BellGardenInstrument = instrument;
})();
