// Death resolution. The save's difficulty defines how much a defeat costs:
// Easy   → no losses, wake at the nearest discovered inn;
// Std/Hard → lose part of vulnerable progress/resources, wake at a random spot;
// True Cultivation → the character dies permanently and a memorial is kept.
import { diffOf } from '../config/balance';
import { INNS, CAMP_CELLS, zoneAt, isWalkable } from '../data/world';
import { CULTIVATION_STAGES } from '../data/cultivation';
import { T, locStageName, locZoneName } from '../i18n/tr';
import { changeEssence, ESSENCE_REASON } from './essence';

const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

function nearestInn(state, at) {
  const known = INNS.filter(i => state.worldState?.discovered?.inns?.[i.id]);
  const pool = known.length ? known : [INNS[0]]; // fallback: the starting town inn
  return pool.reduce((best, i) => (cheb(at, i) < cheb(at, best) ? i : best));
}

// A semi-random respawn: campsites, roadsides or wilderness near the death
// site — never inside an unavoidable enemy attack, never a free teleport to
// perfect safety (though the town gate is the final fallback).
function randomSpawn(state, at) {
  const enemies = (state.worldState?.enemies || []).filter(e => !e.dead);
  const fallbacks = [...CAMP_CELLS.map(([x, y]) => ({ x, y })), { x: 42, y: 44 }];
  for (let n = 0; n < 60; n++) {
    const isFallback = n % 4 === 3;
    const c = isFallback
      ? fallbacks[(Math.random() * fallbacks.length) | 0]
      : { x: at.x + ((Math.random() * 21) | 0) - 10, y: at.y + ((Math.random() * 21) | 0) - 10 };
    if (!isWalkable(c.x, c.y)) continue;
    if (!isFallback && zoneAt(c.x, c.y)?.safe) continue;
    if (enemies.some(e => cheb(e, c) < 4)) continue;
    return c;
  }
  return fallbacks[fallbacks.length - 1];
}

// Snapshot of a cultivator's life, kept for the memorial when they die.
export function memorialOf(state) {
  const p = state.player;
  const g = Math.min(19, (p.rank || 0) * 4 + (p.stage || 0));
  const levels = Object.values(state.mastery || {}).map(m => m.level || 1);
  const zone = zoneAt(p.x, p.y);
  return {
    name: p.name,
    day: (state.time || {}).day || 1,
    playtimeSec: state.playtimeSec || 0,
    realm: locStageName(CULTIVATION_STAGES[g]),
    highestMastery: levels.length ? Math.max(...levels) : 0,
    gu: (state.ownedGu || []).length,
    recipes: (state.knownRecipes || []).length,
    kills: Object.values(state.quests?.kills || {}).reduce((a, b) => a + b, 0),
    quests: Object.values(state.quests?.byId || {}).filter(r => r.status === 'TURNED_IN' || r.status === 'COMPLETED').length,
    stones: p.spiritStones || 0,
    place: zone ? locZoneName(zone) : T('dth.region'),
  };
}

export function applyDeath(state, combat, player, cause) {
  const d = diffOf(state);
  const day = (state.time || {}).day || 1;
  const mem = memorialOf(state);

  if (d.permadeath) {
    const deathTimestamp = Date.now();
    return {
      ...state,
      status: 'DECEASED',
      player,
      combat: { ...combat, over: true, result: 'defeat' },
      deceased: {
        characterId: state.characterId,
        deathCause: cause,
        deathLocation: mem.place,
        deathTimestamp,
        memorialStats: mem,
        // Backward-compatible names used by the existing memorial UI.
        cause,
        at: mem,
      },
      log: [...state.log, T('dth.permadeath', { name: player.name, day, place: mem.place })],
    };
  }

  const at = { x: player.x, y: player.y };
  const spot = /** @type {any} */ (d.respawn === 'nearestInn' ? nearestInn(state, at) : randomSpawn(state, at));
  const spotZone = zoneAt(spot.x, spot.y);
  const placeName = spot.name || (spotZone ? locZoneName(spotZone) : T('dth.wilds'));

  const p = { ...player };
  p.x = spot.spawn ? spot.spawn[0] : spot.x;
  p.y = spot.spawn ? spot.spawn[1] : spot.y;
  p.currentArea = 'greenValleyRegion';
  p.hp = Math.max(1, Math.floor(p.maxHp * (d.respawn === 'nearestInn' ? 0.6 : 0.3)));
  Object.assign(p, changeEssence(p, {
    setTo: Math.min(player.primevalEssence, Math.floor(player.maxPrimevalEssence * 0.2)),
    reason: ESSENCE_REASON.DEATH_PENALTY,
  }));
  p.cultivationProgress = Math.max(0, Math.floor((p.cultivationProgress || 0) * (1 - (d.progressLoss || 0))));
  p.spiritStones = Math.floor(p.spiritStones * (1 - (d.stonesLoss || 0)));

  let inventory = state.inventory;
  if (d.inventoryLoss) {
    inventory = { ...state.inventory };
    for (const cat of ['materials', 'food', 'medicine']) {
      const bag = state.inventory[cat];
      if (!bag) continue;
      const next = {};
      for (const [id, qty] of Object.entries(bag)) {
        const keep = Math.ceil(qty * (1 - d.inventoryLoss));
        if (keep > 0) next[id] = keep;
      }
      inventory[cat] = next;
    }
    // quest items are always protected — never destroy quest progression
  }

  const lost = [];
  if (d.progressLoss) lost.push(T('dth.lostProgress', { p: Math.round(d.progressLoss * 100) }));
  if (d.inventoryLoss) lost.push(T('dth.lostGoods', { p: Math.round(d.inventoryLoss * 100) }));
  if (d.stonesLoss) lost.push(T('dth.lostStones', { p: Math.round(d.stonesLoss * 100) }));
  const summary = lost.length ? T('dth.lostSummary', { list: lost.join(', ') }) : T('dth.lostNone');

  return {
    ...state,
    player: p,
    inventory,
    combat: { ...combat, over: true, result: 'defeat' },
    log: [...state.log, T('dth.wake', { place: placeName, summary })],
  };
}
