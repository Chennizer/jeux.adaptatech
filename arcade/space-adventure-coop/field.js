import { DANGER_LINE, DWELL_MS, SNAPSHOT_MS, TILE_SIZE, WORLD } from './protocol.js';

const COLORS = ['#78dcff', '#ff9c89'];
const { width, height } = WORLD;

function sprite(name) {
  const image = new Image();
  image.src = `/images/spaceadventure/${name}.png`;
  return image;
}

export function createField(canvas, fire) {
  const context = canvas.getContext('2d');
  const ships = ['blueship', 'redship'].map(sprite);
  const enemies = Array.from({ length: 6 }, (_, i) => sprite(`enemy${i + 1}`));
  const stars = Array.from({ length: 130 }, () => ({ x: Math.random() * width, y: Math.random() * height, alpha: .18 + Math.random() * .5 }));

  let state = null;
  let previous = null;
  let receivedAt = 0;
  let running = false;
  let frame = 0;
  let seat = 0;
  let mode = 'switch';
  let enabled = false;
  let pointer = null;
  let dwell = null;
  let bursts = [];

  canvas.addEventListener('pointermove', event => {
    pointer = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointerleave', () => { pointer = null; dwell = null; });

  function interpolate(items, oldItems, progress) {
    return items.map((item, i) => {
      const old = item.id === undefined ? oldItems[i] : oldItems.find(value => value.id === item.id);
      if (!old) return item;
      return { ...item, x: old.x + (item.x - old.x) * progress, y: old.y + (item.y - old.y) * progress };
    });
  }

  function updateDwell(visible, now) {
    if (!pointer || mode !== 'gaze' || !enabled) {
      dwell = null;
      return null;
    }
    const bounds = canvas.getBoundingClientRect();
    const x = (pointer.x - bounds.left) * width / bounds.width;
    const y = (pointer.y - bounds.top) * height / bounds.height;
    const target = visible.find(enemy => enemy.available && Math.abs(enemy.x - x) <= TILE_SIZE / 2 && Math.abs(enemy.y - y) <= TILE_SIZE / 2);
    if (!target) {
      dwell = null;
      return null;
    }
    if (dwell?.id !== target.id) dwell = { id: target.id, since: now, fired: false };
    const progress = Math.min(1, (now - dwell.since) / DWELL_MS);
    if (progress === 1 && state.ships[seat].ready && !dwell.fired) dwell.fired = fire(target.id);
    return { id: target.id, progress };
  }

  function drawSprite(image, x, y, size, fallback) {
    if (image.complete && image.naturalWidth) {
      const scale = size / Math.max(image.naturalWidth, image.naturalHeight);
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      context.drawImage(image, x - w / 2, y - h / 2, w, h);
    } else {
      context.fillStyle = fallback;
      context.beginPath();
      context.moveTo(x, y - size * .27);
      context.lineTo(x + size * .3, y + size * .22);
      context.lineTo(x - size * .3, y + size * .22);
      context.closePath();
      context.fill();
    }
  }

  function draw(now) {
    if (!running || !state) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const bounds = canvas.getBoundingClientRect();
    const pixelWidth = Math.max(1, Math.round(bounds.width * ratio));
    const pixelHeight = Math.max(1, Math.round(bounds.height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#050a18');
    sky.addColorStop(1, '#162345');
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);

    for (const star of stars) {
      context.fillStyle = `rgba(218,233,255,${star.alpha})`;
      context.fillRect(star.x, star.y, 1.8, 1.8);
    }
    context.fillStyle = '#91bafe21';
    context.fillRect(width / 2 - 1, 12, 2, DANGER_LINE - 12);
    context.fillStyle = '#76c6fa74';
    context.fillRect(0, DANGER_LINE, width, 3);

    const progress = Math.min(1, (now - receivedAt) / SNAPSHOT_MS);
    const visible = interpolate(state.enemies, previous.enemies, progress);
    const switchTarget = mode === 'switch' && visible.find(enemy => enemy.lane === seat && enemy.available);
    const gazeTarget = updateDwell(visible, now);

    for (const enemy of visible) {
      const { id, x, y, phase, variant } = enemy;
      context.fillStyle = phase === 'attacking' ? '#541b38' : '#1d304c';
      context.strokeStyle = switchTarget?.id === id ? COLORS[seat] : phase === 'attacking' ? '#ff9c89' : '#7895b8';
      context.lineWidth = switchTarget?.id === id ? 5 : 2;
      context.beginPath();
      context.roundRect(x - TILE_SIZE / 2, y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 18);
      context.fill();
      context.stroke();
      drawSprite(enemies[variant], x, y, TILE_SIZE * .84, '#ffc4ac');
      if (gazeTarget?.id === id) {
        context.strokeStyle = '#fff';
        context.lineWidth = 7;
        context.beginPath();
        context.arc(x, y, TILE_SIZE * .58, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * gazeTarget.progress);
        context.stroke();
      }
    }

    for (const shot of interpolate(state.shots, previous.shots, progress)) {
      context.fillStyle = COLORS[shot.seat];
      context.beginPath();
      context.ellipse(shot.x, shot.y, 4.5, 13, 0, 0, 2 * Math.PI);
      context.fill();
    }

    interpolate(state.ships, previous.ships, progress).forEach((ship, i) => {
      drawSprite(ships[i], ship.x, ship.y, 140, COLORS[i]);
      context.fillStyle = COLORS[i];
      context.fillRect(ship.x - 24, ship.y + 54, 48, i === seat ? 4 : 2);
    });

    bursts = bursts.filter(effect => now - effect.at < 390);
    for (const effect of bursts) {
      const age = (now - effect.at) / 390;
      context.globalAlpha = 1 - age;
      context.strokeStyle = effect.kind === 'breach' ? '#ffbd83' : COLORS[effect.seat];
      context.lineWidth = 5;
      context.beginPath();
      context.arc(effect.x, effect.y, 8 + age * (effect.kind === 'fire' ? 16 : 72), 0, Math.PI * 2);
      context.stroke();
    }
    context.globalAlpha = 1;
    frame = requestAnimationFrame(draw);
  }

  return {
    update(round, playerSeat, input, active, effects) {
      const now = performance.now();
      if (state?.id !== round.id) {
        bursts = [];
        dwell = null;
      }
      seat = playerSeat;
      mode = input;
      enabled = active;
      previous = state?.id === round.id ? state : round;
      state = round;
      receivedAt = now;
      for (const effect of effects) bursts.push({ ...effect, at: now });
      if (!running) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    },
    disable() { enabled = false; dwell = null; },
    hide() {
      cancelAnimationFrame(frame);
      running = false;
      state = null;
      dwell = null;
      pointer = null;
      bursts = [];
    }
  };
}
