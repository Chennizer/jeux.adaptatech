(function (scope) {
  'use strict';
  function layout(width, height, count, gap = 16) {
    const minWidth = Math.min(180, width), minHeight = Math.min(160, height);
    const maxColumns = Math.max(1, Math.min(6, Math.floor((width + gap) / (minWidth + gap))));
    const maxRows = Math.max(1, Math.min(4, Math.floor((height + gap) / (minHeight + gap))));
    const capacity = maxColumns * maxRows;
    const visible = Math.max(1, Math.min(count, capacity));
    let best = { columns: 1, rows: 1, capacity }, score = -1;
    for (let columns = 1; columns <= Math.min(maxColumns, visible); columns++) {
      const rows = Math.ceil(visible / columns);
      if (rows > maxRows) continue;
      const cellWidth = (width - gap * (columns - 1)) / columns;
      const cellHeight = (height - gap * (rows - 1)) / rows;
      const imageWidth = Math.min(Math.max(1, cellWidth - 24), Math.max(1, cellHeight - 64) * 16 / 9);
      const candidate = imageWidth * imageWidth * (visible / (columns * rows));
      if (candidate > score) { score = candidate; best = { columns, rows, capacity }; }
    }
    return best;
  }
  function move(videos, fromId, toId) {
    const from = videos.findIndex(item => item.id === fromId);
    const to = videos.findIndex(item => item.id === toId);
    if (from < 0 || to < 0 || from === to) return false;
    const [video] = videos.splice(from, 1);
    videos.splice(to, 0, video);
    videos.forEach((item, order) => { item.order = order; });
    return true;
  }
  const api = { layout, move };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else scope.VideoGrid = api;
})(typeof window !== 'undefined' ? window : globalThis);
