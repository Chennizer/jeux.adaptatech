import { DANGER_LINE, TILE_SIZE, WORLD } from '../../arcade/space-adventure-coop/protocol.js';

export const ROUND_MS = 5 * 60 * 1000;
export const STEP_MS = 1000 / 30;
const SPAWN_MS = 5000;
const TOP_Y = 125;
const LOWER_Y = 331;
const ROW_HOLD_MS = 10000;
const ROW_MOVE_MS = 2000;
const ATTACK_MS = 16000;
const FIRE_COOLDOWN_MS = 900;
const LANE_X = [WORLD.width * 0.3, WORLD.width * 0.7];
const SHIP_Y = 565;

export function createRound(id, random = Math.random) {
  const round = {
    id, elapsed: 0, score: 0, phase: 'playing', nextSpawn: SPAWN_MS,
    nextLane: 0, nextId: 1, nextEffect: 1, enemies: [], shots: [], effects: [],
    ships: LANE_X.map(x => ({ x, y: SHIP_Y, readyAt: 0 }))
  };
  spawnEnemy(round, 0, random);
  spawnEnemy(round, 1, random);
  return round;
}

function spawnEnemy(round, lane, random) {
  const ageLimit = ROW_HOLD_MS + ROW_MOVE_MS / 2;
  if (round.enemies.some(enemy => enemy.lane === lane && round.elapsed - enemy.bornAt < ageLimit)) return false;
  round.enemies.push({
    id: round.nextId++, lane, variant: Math.floor(random() * 6),
    x: LANE_X[lane], y: -TILE_SIZE / 2, bornAt: round.elapsed, phase: 'entering'
  });
  return true;
}

function emit(round, kind, data) {
  round.effects.push({ id: round.nextEffect++, kind, ...data });
}

function updateEnemy(enemy, age) {
  if (age < 1150) {
    enemy.y = -TILE_SIZE / 2 + (TOP_Y + TILE_SIZE / 2) * age / 1150;
    return;
  }
  enemy.phase = age < ATTACK_MS ? 'target' : 'attacking';
  const progress = Math.max(0, Math.min(1, (age - ROW_HOLD_MS) / ROW_MOVE_MS));
  enemy.y = TOP_Y + (LOWER_Y - TOP_Y) * progress + Math.max(0, age - ATTACK_MS) * 0.22;
}

export function switchTarget(round, seat) {
  return round.enemies.find(enemy => enemy.lane === seat && targetAvailable(round, enemy));
}

function targetAvailable(round, enemy) {
  return enemy.phase === 'target' && !round.shots.some(shot => shot.targetId === enemy.id);
}

export function fire(round, seat, input, targetId) {
  if (round.phase !== 'playing') return false;
  const ship = round.ships[seat];
  if (ship.readyAt > round.elapsed) return false;
  const target = input === 'switch'
    ? switchTarget(round, seat)
    : round.enemies.find(enemy => enemy.id === targetId && targetAvailable(round, enemy));
  if (input === 'gaze' && !target) return false;

  ship.readyAt = round.elapsed + FIRE_COOLDOWN_MS;
  const shot = { id: round.nextId++, seat, x: ship.x, y: ship.y - 30, targetId: target?.id ?? null };
  round.shots.push(shot);
  emit(round, 'fire', { seat, x: shot.x, y: shot.y });
  return true;
}

export function stepRound(round, dt, random = Math.random) {
  if (round.phase !== 'playing') return;
  round.elapsed = Math.min(ROUND_MS, round.elapsed + dt);
  const sway = Math.sin(round.elapsed / 1250) * 25;
  round.ships[0].x = LANE_X[0] + sway;
  round.ships[1].x = LANE_X[1] - sway;

  if (round.elapsed >= round.nextSpawn) {
    const lane = round.nextLane;
    if (spawnEnemy(round, lane, random) || spawnEnemy(round, 1 - lane, random)) {
      round.nextLane = 1 - lane;
      round.nextSpawn += SPAWN_MS;
    } else {
      round.nextSpawn = round.elapsed + 500;
    }
  }

  round.enemies = round.enemies.filter(enemy => {
    updateEnemy(enemy, round.elapsed - enemy.bornAt);
    if (enemy.y < DANGER_LINE) return true;
    emit(round, 'breach', { x: enemy.x, y: DANGER_LINE });
    return false;
  });

  const hit = new Set();
  round.shots = round.shots.filter(shot => {
    const speed = (shot.seat === 0 ? 410 : 710) * dt / 1000;
    const target = round.enemies.find(enemy => enemy.id === shot.targetId && !hit.has(enemy.id));
    if (!target) {
      shot.y -= speed;
      return shot.y > -25;
    }
    const dx = target.x - shot.x;
    const dy = target.y - shot.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= speed + 22) {
      hit.add(target.id);
      round.score += 10;
      emit(round, 'destroy', { x: target.x, y: target.y, seat: shot.seat });
      return false;
    }
    shot.x += dx / distance * speed;
    shot.y += dy / distance * speed;
    return true;
  });
  round.enemies = round.enemies.filter(enemy => !hit.has(enemy.id));
  if (round.elapsed >= ROUND_MS) finishRound(round);
}

export function finishRound(round) {
  round.phase = 'finished';
  round.shots = [];
}

export function snapshot(round) {
  const targeted = new Set(round.shots.map(shot => shot.targetId));
  return {
    id: round.id,
    elapsed: round.elapsed,
    remaining: ROUND_MS - round.elapsed,
    score: round.score,
    ships: round.ships.map(({ x, y, readyAt }) => ({ x, y, ready: readyAt <= round.elapsed })),
    enemies: round.enemies.map(({ id, lane, x, y, variant, phase }) => ({
      id, lane, x, y, variant, phase, available: phase === 'target' && !targeted.has(id)
    })),
    shots: round.shots.map(({ id, seat, x, y }) => ({ id, seat, x, y })),
    effects: round.effects
  };
}
