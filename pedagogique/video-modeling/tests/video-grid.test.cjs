const { test } = require('node:test');
const assert = require('node:assert/strict');
const { layout, move } = require('../js/grid-utils.js');
test('one video fills the grid, two share a row, four form a square on a tablet', () => {
  for (const [count, columns, rows] of [[1,1,1],[2,2,1],[4,2,2]]) {
    const actual = layout(984,445,count);
    assert.deepEqual([actual.columns,actual.rows], [columns,rows]);
  }
});
test('portrait stacks two videos and pagination retains usable targets', () => {
  const two = layout(366,499,2);
  assert.deepEqual([two.columns,two.rows], [1,2]);
  for (const [width,height] of [[366,346],[984,445],[1366,700],[640,140]]) {
    for (const count of [0,1,2,3,4,8,17,100]) {
      const grid = layout(width,height,count);
      assert.ok(grid.columns * grid.rows >= Math.min(Math.max(1,count),grid.capacity));
      assert.ok((height-16*(grid.rows-1))/grid.rows >= Math.min(160,height));
      assert.ok((width-16*(grid.columns-1))/grid.columns >= Math.min(180,width));
    }
  }
});
test('drop inserts in order, renumbers steps, and ignores invalid drops', () => {
  const videos = ['a','b','c','d'].map((id,order)=>({id,order}));
  assert.equal(move(videos,'a','c'),true);
  assert.deepEqual(videos.map(v=>v.id),['b','c','a','d']);
  assert.deepEqual(videos.map(v=>v.order),[0,1,2,3]);
  assert.equal(move(videos,'d','b'),true);
  assert.deepEqual(videos.map(v=>v.id),['d','b','c','a']);
  assert.equal(move(videos,'d','d'),false);
  assert.equal(move(videos,'missing','d'),false);
});
