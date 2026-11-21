import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRound, fire, ROUND_MS, snapshot, stepRound, STEP_MS } from './match.js';

const random = () => 0;

function advance(round, ms) {
  for (let left = ms; left > 0; left -= STEP_MS) stepRound(round, Math.min(left, STEP_MS), random);
}

test('switch targets its own lane and gaze can contribute to the same score', () => {
  const round = createRound('test', random);
  advance(round, 1200);
  const [left, right] = round.enemies;

  assert.equal(fire(round, 0, 'switch', right.id), true);
  assert.equal(round.shots[0].targetId, left.id);
  assert.equal(fire(round, 1, 'gaze', left.id), false);
  assert.equal(fire(round, 1, 'gaze', right.id), true);
  assert.equal(fire(round, 0, 'switch'), false);

  advance(round, 1400);
  const state = snapshot(round);
  assert.equal(state.score, 20);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.effects.filter(effect => effect.kind === 'destroy').length, 2);
});

test('a match ends after five minutes of simulated play', () => {
  const round = createRound('test', random);
  advance(round, ROUND_MS - 20);
  assert.equal(round.phase, 'playing');
  stepRound(round, 25, random);
  assert.equal(snapshot(round).remaining, 0);
  assert.equal(round.phase, 'finished');
  assert.equal(fire(round, 0, 'switch'), false);
});
