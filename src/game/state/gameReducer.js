import { AREA_BY_ID, isWalkable, inEncounterZone, rollEncounter } from '../data/areas';
import { GU_BY_ID } from '../data/gu';
import { ITEM_BY_ID } from '../data/items';
import { QUEST_BY_ID } from '../data/quests';
import { NPC_BY_ID } from '../data/npcs';
import { EVENT_BY_ID } from '../data/events';
import { initCombat, executeRound } from '../engine/combat';
import { applyEffects } from '../engine/effects';

export const REALMS = [
  { id: 'mortal', name: 'Mortal', index: 0 },
  { id: 'rank1', name: 'Rank 1', index: 1 },
  { id: 'rank2', name: 'Rank 2', index: 2 },
  { id: 'rank3', name: 'Rank 3', index: 3 },
];

const APTITUDES = ['Dull', 'Ordinary', 'Good', 'Outstanding', 'Heavenly'];

export function createNewGame(name, gender, age) {
  const aptitude = APTITUDES[Math.floor(Math.random() * APTITUDES.length)];
  return {
    version: 1,
    player: {
      name: name || 'Nameless', gender: gender || 'other', age: Number(age) || 16,
      realm: 'mortal', realmIndex: 0, aptitude,
      hp: 50, maxHp: 50, primevalEssence: 30, maxPrimevalEssence: 30, willpower: 10,
      strength: 6, agility: 6, perception: 6, intelligence: 6, luck: 6,
      x: 9, y: 6, currentArea: 'greenValley', facing: 'down',
      spiritStones: 50, equippedGu: ['g_start'], exp: 0, expToNext: 100,
    },
    ownedGu: [{ instanceId: 'g_start', guId: 'swiftFang', rank: 1 }],
    inventory: { materials: { herb: 3 }, medicine: { medicine: 1 }, food: { ration: 2 }, questItems: {}, equipment: {} },
    quests: { active: [], completed: [], kills: {}, flags: {} },
    reputation: { villagers: 0, merchants: 0, sect: 0, blackMarket: 0 },
    worldState: { gathered: {}, unlockedAreas: ['greenValley', 'mistForest', 'blackMarket', 'cultivationSect'] },
    combat: null, pendingEvent: null, dialogue: null,
    log: ['You awaken in Green Valley — a mortal with a single Gu and a long road ahead.'],
    createdAt: Date.now(),
  };
}

function aptitudeMul(apt) {
  return ['Dull', 'Ordinary', 'Good', 'Outstanding', 'Heavenly'].indexOf(apt) * 0.15 + 0.85;
}

function objectiveMet(state, q) {
  const o = q.objective;
  if (!o) return false;
  if (o.type === 'gather') return (state.inventory.materials[o.item] || 0) >= o.qty;
  if (o.type === 'hunt' || o.type === 'defeat') return (state.quests.kills[o.enemy] || 0) >= o.qty;
  if (o.type === 'reach') return state.player.currentArea === o.area;
  if (o.type === 'choice') return false;
  return false;
}

function consumeForObjective(state, q) {
  const o = q.objective;
  if (o.type === 'gather') return applyEffects(state, { removeItems: { [o.item]: o.qty } });
  return state;
}

function gatherBonus(state) {
  let b = 0;
  for (const id of state.player.equippedGu) {
    const inst = state.ownedGu.find(g => g.instanceId === id);
    if (inst && GU_BY_ID[inst.guId].passive?.gatheringBonus) b += GU_BY_ID[inst.guId].passive.gatheringBonus;
  }
  return b;
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'NEW_GAME':
      return createNewGame(action.name, action.gender, action.age);
    case 'RESET':
      return { noSave: true };

    case 'MOVE': {
      if (state.combat || state.pendingEvent || state.dialogue) return state;
      const area = AREA_BY_ID[state.player.currentArea];
      const nx = state.player.x + action.dx, ny = state.player.y + action.dy;
      if (!isWalkable(area, nx, ny)) return state;
      const facing = action.dx === 1 ? 'right' : action.dx === -1 ? 'left' : action.dy === 1 ? 'down' : 'up';
      let s = { ...state, player: { ...state.player, x: nx, y: ny, facing } };
      const enc = rollEncounter(area);
      if (enc) { s = { ...s, combat: initCombat(enc, s.player) }; }
      // random event chance while exploring dangerous areas
      if (!enc && area.type !== 'town' && area.type !== 'sect' && Math.random() * 100 < 4) {
        const evs = ['strangeHerb', 'injuredCultivator', 'hiddenCave', 'spiritSpring', 'wanderingMerchant'];
        s = { ...s, pendingEvent: evs[Math.floor(Math.random() * evs.length)] };
      }
      return s;
    }

    case 'INTERACT_RESOURCE': {
      const area = AREA_BY_ID[state.player.currentArea];
      const r = area.resources[action.index];
      if (!r) return state;
      const key = `${state.player.currentArea}-${action.index}`;
      if (state.worldState.gathered[key]) return state;
      const qty = 1 + gatherBonus(state) + (Math.random() < state.player.perception * 0.01 ? 1 : 0);
      let s = applyEffects(state, { items: { [r.type]: qty }, message: `Gathered ${qty} ${r.name}.` });
      s = { ...s, worldState: { ...s.worldState, gathered: { ...s.worldState.gathered, [key]: true } } };
      return s;
    }

    case 'TRAVEL': {
      const area = AREA_BY_ID[state.player.currentArea];
      const exit = area.exits.find(e => e.x === state.player.x && e.y === state.player.y) || action.exit;
      if (!exit) return state;
      // regrow resources in the area being left
      const gathered = { ...state.worldState.gathered };
      Object.keys(gathered).forEach(k => { if (k.startsWith(state.player.currentArea + '-')) delete gathered[k]; });
      return { ...state, player: { ...state.player, currentArea: exit.toArea, x: exit.toX, y: exit.toY }, worldState: { ...state.worldState, gathered }, log: [...state.log, `You travel to ${AREA_BY_ID[exit.toArea].name}.`] };
    }

    case 'TALK_NPC': {
      return { ...state, dialogue: { npcId: action.npcId } };
    }
    case 'CLOSE_DIALOGUE':
      return { ...state, dialogue: null };

    case 'BUY': {
      const npc = NPC_BY_ID[action.npcId];
      const offer = npc.shop.sells.find(o => o.itemId === action.itemId);
      if (!offer) return state;
      const qty = action.qty || 1;
      const price = offer.price * qty;
      // reputation discount
      const rep = state.reputation.merchants || 0;
      const total = Math.max(1, Math.floor(price * (1 - rep * 0.02)));
      if (state.player.spiritStones < total) return state;
      let s = { ...state, player: { ...state.player, spiritStones: state.player.spiritStones - total } };
      s = applyEffects(s, { items: { [action.itemId]: qty } });
      return s;
    }
    case 'SELL': {
      const npc = NPC_BY_ID[action.npcId];
      if (!npc.shop || !npc.shop.buys.includes(action.itemId)) return state;
      const qty = action.qty || 1;
      const have = state.inventory[ITEM_BY_ID[action.itemId].category]?.[action.itemId] || 0;
      if (have < qty) return state;
      const price = Math.floor(ITEM_BY_ID[action.itemId].value * 0.5 * qty);
      let s = applyEffects(state, { removeItems: { [action.itemId]: qty }, spiritStones: price, message: `Sold ${qty} ${ITEM_BY_ID[action.itemId].name} for ${price} stones.` });
      return s;
    }

    case 'EQUIP_GU': {
      if (state.player.equippedGu.includes(action.instanceId)) return state;
      if (state.player.equippedGu.length >= 6) return state;
      return { ...state, player: { ...state.player, equippedGu: [...state.player.equippedGu, action.instanceId] } };
    }
    case 'UNEQUIP_GU': {
      return { ...state, player: { ...state.player, equippedGu: state.player.equippedGu.filter(id => id !== action.instanceId) } };
    }

    case 'REFINE_GU': {
      const gu = GU_BY_ID[action.guId];
      const recipe = gu.refinement;
      // check materials
      const need = { ...recipe };
      delete need.primevalEssence;
      let canAfford = true;
      for (const [id, qty] of Object.entries(need)) {
        if ((state.inventory.materials?.[id] || 0) < qty) { canAfford = false; break; }
      }
      if (state.player.primevalEssence < (recipe.primevalEssence || 0)) canAfford = false;
      if (!canAfford) return state;
      // consume
      let s = { ...state, player: { ...state.player, primevalEssence: state.player.primevalEssence - (recipe.primevalEssence || 0) } };
      const remove = {};
      for (const [id, qty] of Object.entries(need)) remove[id] = qty;
      s = applyEffects(s, { removeItems: remove });
      const successChance = Math.min(95, 70 + state.player.intelligence * 2 + Math.floor(state.player.luck * 0.5));
      if (Math.random() * 100 < successChance) {
        s = applyEffects(s, { giveGu: gu.id, message: `Refinement succeeds! You create ${gu.name}.` });
      } else {
        s = { ...s, log: [...s.log, 'Refinement failed. The materials are lost.'] };
      }
      return s;
    }

    case 'CULTIVATE': {
      const cost = 10 * (state.player.realmIndex + 1);
      if (state.player.primevalEssence < cost) return { ...state, log: [...state.log, 'Not enough primeval essence to cultivate.'] };
      let p = { ...state.player, primevalEssence: state.player.primevalEssence - cost };
      const atSect = state.player.currentArea === 'cultivationSect';
      const gain = Math.floor((18 + state.player.intelligence * 1.5) * aptitudeMul(state.player.aptitude) * (atSect ? 1.5 : 1));
      p.exp += gain;
      let log = [...state.log, `You cultivate. (+${gain} insight${atSect ? ' · sect bonus' : ''})`];
      let s = { ...state, player: p, log };
      // realm breakthrough (loop in case insight overflows the threshold by a lot)
      while (p.exp >= p.expToNext && p.realmIndex < 3) {
        const nextRealm = REALMS[p.realmIndex + 1];
        p = { ...p, realmIndex: p.realmIndex + 1, realm: nextRealm.id, exp: p.exp - p.expToNext, expToNext: p.expToNext * 2 };
        p.maxHp += 25; p.hp = p.maxHp;
        p.maxPrimevalEssence += 15; p.primevalEssence = p.maxPrimevalEssence;
        p.strength += 2; p.agility += 2; p.perception += 2; p.intelligence += 2;
        s = { ...s, player: p, log: [...s.log, `Breakthrough! You advance to ${nextRealm.name}!`] };
      }
      return s;
    }

    case 'USE_ITEM': {
      const it = ITEM_BY_ID[action.itemId];
      if (!it || !it.use) return state;
      if ((state.inventory[it.category]?.[action.itemId] || 0) <= 0) return state;
      let s = applyEffects(state, { hp: it.use.hp || 0, essence: it.use.essence || 0, removeItems: { [action.itemId]: 1 }, message: `You use ${it.name}.` });
      return s;
    }

    case 'ACCEPT_QUEST': {
      if (state.quests.active.includes(action.questId) || state.quests.completed.includes(action.questId)) return state;
      return { ...state, quests: { ...state.quests, active: [...state.quests.active, action.questId] }, log: [...state.log, `Accepted quest: ${QUEST_BY_ID[action.questId].name}`] };
    }
    case 'TURN_IN_QUEST': {
      const q = QUEST_BY_ID[action.questId];
      if (!state.quests.active.includes(action.questId) || !objectiveMet(state, q)) return state;
      let s = consumeForObjective(state, q);
      s = applyEffects(s, q.rewards || {});
      s = { ...s, quests: { ...s.quests, active: s.quests.active.filter(id => id !== action.questId), completed: [...s.quests.completed, action.questId] } };
      return s;
    }
    case 'QUEST_CHOICE': {
      const q = QUEST_BY_ID[action.questId];
      const choice = q.choices[action.choiceIndex];
      let s = applyEffects(state, choice.effects);
      s = { ...s, quests: { ...s.quests, active: s.quests.active.filter(id => id !== action.questId), completed: [...s.quests.completed, action.questId] } };
      return s;
    }

    case 'PLAYER_ACTION': {
      let s = executeRound(state, { type: action.action, guInstanceId: action.guInstanceId, itemId: action.itemId });
      // consume used item
      if (s.combat && s.combat.usedItem) {
        const it = ITEM_BY_ID[s.combat.usedItem];
        s = { ...s, inventory: { ...s.inventory, [it.category]: { ...s.inventory[it.category], [s.combat.usedItem]: (s.inventory[it.category]?.[s.combat.usedItem] || 0) - 1 } } };
        if (s.inventory[it.category][s.combat.usedItem] <= 0) delete s.inventory[it.category][s.combat.usedItem];
        const c = { ...s.combat }; delete c.usedItem; s = { ...s, combat: c };
      }
      // pending combat from victory? none
      return s;
    }
    case 'END_COMBAT':
      return { ...state, combat: null };

    case 'CHOOSE_EVENT': {
      const ev = EVENT_BY_ID[state.pendingEvent];
      const opt = ev.options[action.optionIndex];
      let s = applyEffects(state, opt.effects);
      const pending = s._pendingCombat;
      delete s._pendingCombat;
      s = { ...s, pendingEvent: null };
      if (pending) s = { ...s, combat: initCombat(pending, s.player) };
      return s;
    }
    case 'CLOSE_EVENT':
      return { ...state, pendingEvent: null };

    case 'APPLY_EFFECTS':
      return applyEffects(state, action.effects);

    default:
      return state;
  }
}

export { objectiveMet };