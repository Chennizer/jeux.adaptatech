(() => {
  const channelName = 'eyegaze-broadcast-tiles';
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null;
  const tileContainer = document.getElementById('tile-container');
  const tileCount = document.getElementById('tile-count');
  const status = document.getElementById('viewer-status');

  const HOVER_DELAY = 1600;
  let hoverTimer = null;
  let activeTile = null;

  function clearHover() {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    if (activeTile) {
      activeTile.classList.remove('selected');
      activeTile = null;
    }
  }

  function armHover(tile) {
    clearHover();
    hoverTimer = setTimeout(() => {
      tile.classList.add('selected');
      activeTile = tile;
    }, HOVER_DELAY);
  }

  function createTileElement(tile, index, total) {
    const tileEl = document.createElement('div');
    tileEl.className = 'tile';
    tileEl.setAttribute('role', 'button');
    tileEl.setAttribute('aria-label', tile.alt || `Choice ${index + 1}`);

    if (total === 2) {
      tileContainer.classList.add('two-tiles');
    } else {
      tileContainer.classList.remove('two-tiles');
    }

    if (tile.type === 'image' && tile.image) {
      tileEl.style.backgroundImage = `url(${tile.image})`;
    } else {
      tileEl.style.backgroundImage = 'linear-gradient(135deg, #84fab0, #8fd3f4)';
    }

    const caption = document.createElement('div');
    caption.className = 'caption';
    caption.textContent = tile.text || tile.alt || `Choice ${index + 1}`;
    tileEl.appendChild(caption);

    tileEl.addEventListener('pointerenter', () => armHover(tileEl));
    tileEl.addEventListener('pointerleave', clearHover);
    tileEl.addEventListener('click', () => {
      clearHover();
      tileEl.classList.add('selected');
      activeTile = tileEl;
    });

    return tileEl;
  }

  function renderTiles(payload) {
    if (!payload?.tiles?.length) {
      tileContainer.innerHTML = '<p style="color:#cbd5e1;">No tiles received yet.</p>';
      tileCount.textContent = '0 tile(s)';
      status.textContent = 'Waiting for tiles…';
      return;
    }

    const { tiles, tileSize } = payload;
    tileContainer.innerHTML = '';
    clearHover();

    const tileSizeValue = parseInt(tileSize, 10);
    if (!Number.isNaN(tileSizeValue)) {
      tileContainer.style.setProperty('--tile-size', `${tileSizeValue}vh`);
    }

    tiles.forEach((tile, index) => {
      const tileEl = createTileElement(tile, index, tiles.length);
      tileContainer.appendChild(tileEl);
    });

    tileCount.textContent = `${tiles.length} tile(s)`;
    status.textContent = 'Tiles ready';
  }

  function handleMessage(event) {
    if (event.data?.kind === 'tile-set') {
      renderTiles(event.data);
    }
  }

  if (channel) {
    channel.addEventListener('message', handleMessage);
  } else {
    status.textContent = 'BroadcastChannel not supported in this browser';
  }

  // Initial state
  renderTiles({ tiles: [] });
})();
