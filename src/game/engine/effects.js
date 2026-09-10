import { GU_BY_ID } from '../data/gu';
import { ITEM_BY_ID } from '../data/items';

let _idc = 0;
const newInstanceId = () => 'g' + Date.now().toString(36) + (_idc++).toString(36);

export function applyEffects(state, effects) {
  if (!effects) return state;
  let player = { ...state.player };
  let inventory = { ...state.inventory };
  let ownedGu = state.ownedGu ? state.ownedGu.slice() : [];
  let reputation = { ...state.reputation };
  let quests = { ...state.quests };
  let worldState = { ...state.worldState };
  let log = state.log ? state.log.slice() : [];
  let pendingCombat = null;

  const add = (cat, id, qty) => {
    const cur = inventory[cat] || {};
    const next = { ...cur, [id]: (cur[id] || 0) + qty };
    if (next[id] <= 0) delete next[id];
    inventory[cat] = next;
  };

  if (effects.hp) player.hp = Math.min(player.maxHp, Math.max(0, player.hp + effects.hp));
  if (effects.essence) player.primevalEssence = Math.min(player.maxPrimevalEssence, Math.max(0, player.primevalEssence + effects.essence));
  if (effects.spiritStones) player.spiritStones = Math.max(0, player.spiritStones + effects.spiritStones);
  if (effects.exp) player.exp += effects.exp;
  if (effects.items) for (const [id, qty] of Object.entries(effects.items)) {
    const it = ITEM_BY_ID[id]; if (it) add(it.category, id, qty);
  }
  if (effects.removeItems) for (const [id, qty] of Object.entries(effects.removeItems)) {
    const it = ITEM_BY_ID[id]; if (it) add(it.category, id, -qty);
  }
  if (effects.giveGu) {
    const gu = GU_BY_ID[effects.giveGu];
    if (gu) { ownedGu.push({ instanceId: newInstanceId(), guId: effects.giveGu, rank: gu.rank }); log.push(`Obtained ${gu.name}!`); }
  }
  if (effects.reputation) for (const [f, d] of Object.entries(effects.reputation)) reputation[f] = (reputation[f] || 0) + d;
  if (effects.unlockArea && !worldState.unlockedAreas.includes(effects.unlockArea)) worldState.unlockedAreas.push(effects.unlockArea);
  if (effects.startCombat) pendingCombat = effects.startCombat;
  if (effects.teleport) { player.currentArea = effects.teleport.area; player.x = effects.teleport.x; player.y = effects.teleport.y; }
  if (effects.flag) quests.flags = { ...quests.flags, [effects.flag]: true };
  if (effects.message) log.push(effects.message);

  const next = { ...state, player, inventory, ownedGu, reputation, quests, worldState, log };
  if (pendingCombat) next._pendingCombat = pendingCombat;
  return next;
}

export { newInstanceId };