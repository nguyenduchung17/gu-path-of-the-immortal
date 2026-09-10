// Central overworld movement-speed calculation. The world is grid-based: the
// player takes discrete steps whose REAL-TIME cadence is decided HERE — the
// single place any movement modifier is ever read.
//
//   stepInterval = base × diagonal × terrain × gu × status
//
// The value is RECOMPUTED from current state on every step and never written
// back anywhere, so entering a road, town or region can never stack a bonus:
// the same terrain applies the same multiplier exactly once per step, no
// matter how many times it is entered or from which direction.
import { BALANCE } from '../config/balance';
import { mapOf } from './location';
import { zoneAt } from '../data/world';

const cfg = () => BALANCE.world.move || { baseStepMs: 170, minIntervalPct: 60 };

// Terrain step-time modifier — a pure function of the tile being stepped
// onto. Tall grass slows a little (BALANCE.grass.slowMul); roads, bridges,
// settlements and every other terrain are exactly 1.0.
export function terrainStepMul(state, x, y) {
  if (!state || state.inCave) return 1; // caves carry no grass
  const ch = (mapOf(state).tiles[y] || [])[x];
  return (BALANCE.grass.slowMul || {})[ch] || 1;
}

// Exploration-Gu modifier — read live from CURRENT active effects only.
// Travel haste (Wind Step) shapes pursuit, not the walker's own pace, so it
// is 1.0 here; if a real-time speed buff is ever added, this is its one home.
// Buffs already carry source + expiry on state.exploreFx (until), so an
// expired or cleared effect contributes nothing.
export function guStepMul(state) {
  return 1;
}

// Temporary status modifier (slow effects, weather) — none affect overworld
// step cadence today; kept explicit so the debug readout is complete.
export function statusStepMul(state) {
  return 1;
}

// THE one real-time step cadence. `state` is read fresh every call — no
// caching, no mutation, no accumulation. A safety floor (#9) clamps anything
// that would push a step below minIntervalPct of base and warns in dev.
export function stepIntervalMs(state, dx, dy) {
  const c = cfg();
  const diag = dx && dy ? Math.SQRT2 : 1; // diagonal covers √2 tiles — speed equal in all 8 directions
  const mul = terrainStepMul(state, state.player.x + dx, state.player.y + dy)
    * guStepMul(state) * statusStepMul(state);
  let interval = c.baseStepMs * diag * mul;
  const floor = c.baseStepMs * diag * (c.minIntervalPct / 100);
  if (interval < floor) {
    console.warn('[movement] step speed above safety cap — clamped', { base: c.baseStepMs, diag, mul, interval, floor });
    interval = floor;
  }
  return Math.round(interval);
}

// Development-only snapshot (#8) — every factor that shaped the last step.
export function moveDebugOf(state, dx = 0, dy = 0) {
  const x = state.player.x + dx, y = state.player.y + dy;
  const interval = stepIntervalMs(state, dx, dy);
  return {
    base: cfg().baseStepMs,
    terrain: terrainStepMul(state, x, y),
    gu: guStepMul(state),
    status: statusStepMul(state),
    intervalMs: interval,
    tilesPerSec: +(1000 / Math.max(1, interval)).toFixed(2),
    dir: `${dx},${dy}`,
    x: state.player.x,
    y: state.player.y,
    region: state.inCave ? state.inCave.caveId : (zoneAt(state.player.x, state.player.y) || { id: 'region' }).id,
    tile: (mapOf(state).tiles[y] || [])[x] ?? '?',
  };
}