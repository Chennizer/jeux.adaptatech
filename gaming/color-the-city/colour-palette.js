(() => {
  'use strict';
  const DWELL = .65;
  let container, pick, interact, buttons = [], selected = -1, hover = null, elapsed = 0, visible = false;
  function suspend() {
    if (hover) hover.querySelector('.palette-dwell').style.transform = 'scale(0)';
    hover = null; elapsed = 0;
  }
  function select(index) {
    selected = index; suspend();
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }
  function choose(index) {
    if (!visible) return;
    suspend();
    if (index !== selected) pick(index);
  }
  function mount({ parent, colours, onPick, onInteraction }) {
    container = parent; pick = onPick; interact = onInteraction;
    buttons = colours.map((colour, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'colour-swatch';
      button.style.backgroundColor = colour; button.dataset.colour = colour;
      const fill = document.createElement('span'); fill.className = 'palette-dwell';
      fill.setAttribute('aria-hidden', 'true'); button.appendChild(fill);
      button.addEventListener('pointerenter', event => {
        if (!visible || event.isPrimary === false) return;
        interact(); suspend();
        if (selected !== index) hover = button;
      });
      ['pointerleave', 'pointercancel'].forEach(name => button.addEventListener(name, suspend));
      button.addEventListener('focus', () => { interact(); suspend(); });
      button.addEventListener('click', () => choose(index));
      button.addEventListener('pointerdown', event => {
        if (event.pointerType === 'touch' && event.isPrimary) choose(index);
      });
      container.appendChild(button); return button;
    });
  }
  function labels(title, names) {
    container.setAttribute('aria-label', title);
    buttons.forEach((button, index) => { button.setAttribute('aria-label', names[index]); button.title = names[index]; });
  }
  function show(value) {
    visible = Boolean(value); container.hidden = !visible;
    if (!visible) suspend();
  }
  function frame(dt) {
    if (!visible || !hover) return;
    elapsed += dt;
    const p = Math.min(1, elapsed / DWELL), ease = p * p * (3 - 2 * p);
    hover.querySelector('.palette-dwell').style.transform = `scale(${ease})`;
    if (p === 1) choose(buttons.indexOf(hover));
  }
  window.PaintColourPalette = { mount, select, labels, show, frame, suspend };
})();
