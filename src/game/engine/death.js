// Death resolution. The save's difficulty defines how much a defeat costs:
// Easy   → no losses, wake at the nearest discovered inn;
// Std/Hard → lose part of vulnerable progress/resources, wake at a random spot;
// True Cultivation → the character dies permanently and a memorial is kept.
import { diffOf } from '../config/balance';
import { INNS, CAMP_CELLS, zoneAt, isWalkable } from '../data/world';
import { CULTIVATION_STAGES } from '../data/cultivation';

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
  return {
    name: p.name,
    day: (state.time || {}).day || 1,
    playtimeSec: state.playtimeSec || 0,
    realm: CULTIVATION_STAGES[g].name,
    highestMastery: levels.length ? Math.max(...levels) : 0,
    gu: (state.ownedGu || []).length,
    recipes: (state.knownRecipes || []).length,
    kills: Object.values(state.quests?.kills || {}).reduce((a, b) => a + b, 0),
    quests: Object.values(state.quests?.byId || {}).filter(r => r.status === 'TURNED_IN' || r.status === 'COMPLETED').length,
    stones: p.spiritStones || 0,
    place: (zoneAt(p.x, p.y) || {}).name || 'the Green Valley Region',
  };
}

export function applyDeath(state, combat, player, cause) {
  const d = diffOf(state);
  const day = (state.time || {}).day || 1;
  const mem = memorialOf(state);

  if (d.permadeath) {
    return {
      ...state,
      player,
      combat: { ...combat, over: true, result: 'defeat' },
      deceased: { cause, at: mem },
      log: [...state.log, `${player.name} has fallen on Day ${day}, struck down in ${mem.place}. This cultivator's story ends here.`],
    };
  }

  const at = { x: player.x, y: player.y };
  const spot = d.respawn === 'nearestInn' ? nearestInn(state, at) : randomSpawn(state, at);
  const placeName = spot.name || (zoneAt(spot.x, spot.y) || {}).name || 'the wilds';

  const p = { ...player };
  p.x = spot.spawn ? spot.spawn[0] : spot.x;
  p.y = spot.spawn ? spot.spawn[1] : spot.y;
  p.currentArea = 'greenValleyRegion';
  p.hp = Math.max(1, Math.floor(p.maxHp * (d.respawn === 'nearestInn' ? 0.6 : 0.3)));
  p.primevalEssence = Math.min(player.primevalEssence, Math.floor(player.maxPrimevalEssence * 0.2));
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
  if (d.progressLoss) lost.push(`${Math.round(d.progressLoss * 100)}% of cultivation progress`);
  if (d.inventoryLoss) lost.push(`~${Math.round(d.inventoryLoss * 100)}% of carried goods`);
  if (d.stonesLoss) lost.push(`${Math.round(d.stonesLoss * 100)}% of primordial stones`);
  const summary = lost.length ? ` Lost: ${lost.join(', ')}.` : ' Nothing was lost.';

  return {
    ...state,
    player: p,
    inventory,
    combat: { ...combat, over: true, result: 'defeat' },
    log: [...state.log, `You collapse... You wake at ${placeName}, battered but alive.${summary}`],
  };
}