// Where the player is — surface or inside a cave — and everything that must
// answer differently depending on it: which map is walked, which zone applies,
// which resources can be gathered, whether terrain is grass. One small module
// so the reducer, the enemy AI, the renderer and the HUD all agree.
import { WORLD, zoneAt, DEFAULT_ZONE, isWalkable, WORLD_RESOURCES } from '../data/world';
import { CAVE_BY_ID, CAVE_RESOURCES, levelMapOf, caveSecretAt } from '../data/caves';
import { BALANCE } from '../config/balance';

// The active map: the overworld, or the cave depth the player stands in.
export function mapOf(state) {
  return state.inCave ? levelMapOf(state.inCave.caveId, state.inCave.depth) : WORLD;
}

export function tileOf(state, x, y) {
  const m = mapOf(state);
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return null;
  return m.tiles[y][x];
}

// Passability for the player's current location. Cracked walls ('K') open only
// once a scouting Gu has found the secret beyond them.
export function walkableFor(state, x, y) {
  if (!state.inCave) return isWalkable(x, y);
  const ch = tileOf(state, x, y);
  if (ch == null) return false;
  if (ch === 'K') return !!(state.worldState.discovered?.caveSecrets?.[state.inCave.caveId]);
  return ch !== '#' && ch !== '~' && ch !== 'O';
}

// Is this world enemy in the same location as the player? Enemies of other
// locations (surface vs each cave depth) are never ticked, rendered or fought.
export function enemyAt(e, inCave) {
  return inCave
    ? e.caveId === inCave.caveId && (e.depth ?? 0) === inCave.depth
    : !e.caveId;
}

// Zone metadata for the current location — cave zones carry their own danger
// and a depth tag for the HUD/banner.
export function zoneOf(state) {
  if (!state.inCave) return zoneAt(state.player.x, state.player.y) || DEFAULT_ZONE;
  const cave = CAVE_BY_ID[state.inCave.caveId];
  const d = cave.danger;
  return {
    id: cave.id,
    name: cave.name,
    danger: d,
    dangerLabel: d >= 5 ? 'EXTREME DANGER' : d >= 4 ? 'HIGH DANGER' : d >= 3 ? 'MODERATE DANGER' : 'LOW DANGER',
    safe: false,
    cave: true,
    depth: state.inCave.depth,
  };
}

// Gathering nodes of the current location (surface list or this cave depth's).
export function resourcesOf(state) {
  if (!state.inCave) return WORLD_RESOURCES;
  return CAVE_RESOURCES.filter(r => r.caveId === state.inCave.caveId && r.depth === state.inCave.depth);
}

// ---- functional terrain: tall grass ('g') and dense growth ('G') ----
export const isGrassTile = (ch) => ch === 'g' || ch === 'G';

// Is the player standing in grass right now? (surface only — caves have none)
export function inGrass(state) {
  if (state.inCave) return null;
  const ch = (WORLD.tiles[state.player.y] || [])[state.player.x];
  return isGrassTile(ch) ? ch : null;
}

// Grass slows a step a little (never annoyingly) — expressed in game minutes,
// so dense reeds trade travel time for the cover they give.
export function moveMinutesFor(state, x, y) {
  const base = BALANCE.time.moveMinutes;
  if (state.inCave) return base;
  const ch = (WORLD.tiles[y] || [])[x];
  return base * ((BALANCE.grass.slowMul || {})[ch] || 1);
}

// How well an enemy can notice a player standing in grass. Keen-nosed species
// (ECOLOGY.keenSmell) are barely fooled.
export function grassDetectMul(state, defEco) {
  const ch = inGrass(state);
  if (!ch) return 1;
  if (defEco?.keenSmell) return BALANCE.grass.keenDetectMul;
  return (BALANCE.grass.detectMul || {})[ch] || 1;
}

export { caveSecretAt };