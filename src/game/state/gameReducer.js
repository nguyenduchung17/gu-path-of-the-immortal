import { AREA_BY_ID, isWalkable, rollEncounter } from '../data/areas';
import { GU_BY_ID } from '../data/gu';
import { ITEM_BY_ID } from '../data/items';
import { QUEST_BY_ID } from '../data/quests';
import { NPC_BY_ID } from '../data/npcs';
import { EVENT_BY_ID } from '../data/events';
import { initCombat, executeRound } from '../engine/combat';
import { applyEffects } from '../engine/effects';
import { grantMastery, learnRecipe, bonusOf } from '../engine/mastery';
import { CULTIVATION_STAGES, BREAKTHROUGH_REQS } from '../data/cultivation';
import { BALANCE } from '../config/balance';
import { RECIPE_BY_ID } from '../data/recipes';

const APTITUDES = ['Dull', 'Ordinary', 'Good', 'Outstanding', 'Heavenly'];
const START_STAGE = CULTIVATION_STAGES[0];

export function createNewGame(name, gender, age) {
  const aptitude = APTITUDES[Math.floor(Math.random() * APTITUDES.length)];
  return {
    version: 2,
    player: {
      name: name || 'Nameless', gender: gender || 'other', age: Number(age) || 16,
      rank: 0, stage: 0, cultivationProgress: 0,
      aptitude,
      hp: START_STAGE.maxHp, maxHp: START_STAGE.maxHp,
      primevalEssence: START_STAGE.maxEssence, maxPrimevalEssence: START_STAGE.maxEssence,
      willpower: 10,
      strength: 6, agility: 6, perception: 6, intelligence: 6, luck: 6,
      x: 9, y: 6, currentArea: 'greenValley', facing: 'down',
      spiritStones: 50, equippedGu: ['g_start'], totalInsight: 0,
    },
    ownedGu: [{ instanceId: 'g_start', guId: 'swiftFang', rank: 1 }],
    inventory: { materials: { herb: 3 }, medicine: { medicine: 1 }, food: { ration: 2 }, questItems: {} },
    quests: { active: [], completed: [], kills: {}, flags: {} },
    reputation: { villagers: 0, merchants: 0, sect: 0, blackMarket: 0 },
    worldState: { gathered: {}, unlockedAreas: ['greenValley', 'mistForest', 'blackMarket', 'cultivationSect'] },
    mastery: {}, masteryStats: {},
    knownPaths: ['wind'], knownRecipes: [],
    recovery: null, breakthrough: null, toasts: [],
    combat: null, pendingEvent: null, dialogue: null,
    log: ['You awaken as a Rank 1 · Early Stage cultivator of the Wind Path. The road to immortality begins.'],
    createdAt: Date.now(),
  };
}

function aptitudeMul(apt) {
  return ['Dull', 'Ordinary', 'Good', 'Outstanding', 'Heavenly'].indexOf(apt) * 0.15 + 0.85;
}

export function globalStage(p) { return p.rank * 4 + (p.stage || 0); }

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

function metReq(checks) {
  return { ok: checks.every(c => c.met), checks };
}

// Requirement checklists for breakthrough & refinement (UI shows ✓/✗ per line).
export function breakthroughChecklist(state) {
  const p = state.player;
  const g = globalStage(p);
  if (g >= 19) return null;
  const req = BREAKTHROUGH_REQS[g];
  const matEntries = Object.entries(req.items || {});
  const maxMastery = Math.max(0, ...Object.values(state.mastery || {}).map(m => m.level || 1));
  return metReq([
    { key: 'progress', met: p.cultivationProgress >= 100, text: '100% Cultivation Progress' },
    { key: 'essence', met: p.primevalEssence >= req.essence, text: `Essence: ${Math.floor(p.primevalEssence)}/${req.essence}` },
    ...(req.stones ? [{ key: 'stones', met: p.spiritStones >= req.stones, text: `Primordial Stones: ${p.spiritStones}/${req.stones}` }] : []),
    ...matEntries.map(([id, qty]) => ({ key: `item-${id}`, met: (state.inventory.materials?.[id] || 0) >= qty, text: `${ITEM_BY_ID[id]?.name || id}: ${state.inventory.materials?.[id] || 0}/${qty}` })),
    ...(req.masteryLevel ? [{ key: 'mastery', met: maxMastery >= req.masteryLevel, text: `Any Dao Path at Mastery Level ${req.masteryLevel}` }] : []),
  ]);
}

export function refineChecklist(state, recipeId) {
  const r = RECIPE_BY_ID[recipeId];
  const p = state.player;
  const refFx = bonusOf(state, 'refinement');
  const essenceCost = Math.max(1, Math.ceil(r.essence * (1 - (refFx.refineEssencePct || 0) / 100)));
  const mats = Object.entries(r.materials);
  return {
    ok: state.knownRecipes.includes(recipeId)
      && globalStage(p) >= r.stageReq
      && (state.mastery?.[r.path]?.level || 1) >= r.masteryReq
      && p.primevalEssence >= essenceCost
      && p.spiritStones >= r.stones
      && mats.every(([id, q]) => (state.inventory.materials?.[id] || 0) >= q),
    essenceCost,
    checks: [
      { key: 'stage', met: globalStage(p) >= r.stageReq, text: `Cultivation: ${CULTIVATION_STAGES[r.stageReq].name}` },
      { key: 'mastery', met: (state.mastery?.[r.path]?.level || 1) >= r.masteryReq, text: `${r.path[0].toUpperCase() + r.path.slice(1)} Mastery Level ${r.masteryReq}` },
      ...mats.map(([id, q]) => ({ key: `item-${id}`, met: (state.inventory.materials?.[id] || 0) >= q, text: `${ITEM_BY_ID[id]?.name || id}: ${state.inventory.materials?.[id] || 0}/${q}` })),
      { key: 'essence', met: p.primevalEssence >= essenceCost, text: `Essence: ${Math.floor(p.primevalEssence)}/${essenceCost}` },
      { key: 'stones', met: p.spiritStones >= r.stones, text: `Primordial Stones: ${p.spiritStones}/${r.stones}` },
    ],
  };
}

const busy = (state) => !!(state.combat || state.recovery || state.pendingEvent || state.dialogue);

export function gameReducer(state, action) {
  switch (action.type) {
    case 'NEW_GAME':
      return createNewGame(action.name, action.gender, action.age);
    case 'RESET':
      return { noSave: true };

    // ---------- World ----------
    case 'MOVE': {
      if (busy(state)) return state;
      const area = AREA_BY_ID[state.player.currentArea];
      const nx = state.player.x + action.dx, ny = state.player.y + action.dy;
      if (!isWalkable(area, nx, ny)) return state;
      const facing = action.dx === 1 ? 'right' : action.dx === -1 ? 'left' : action.dy === 1 ? 'down' : 'up';
      let s = { ...state, player: { ...state.player, x: nx, y: ny, facing } };
      const enc = rollEncounter(area);
      if (enc) { s = { ...s, combat: initCombat(enc, s.player) }; }
      if (!enc && area.type !== 'town' && area.type !== 'sect' && Math.random() * 100 < 4) {
        const evs = ['strangeHerb', 'injuredCultivator', 'hiddenCave', 'spiritSpring', 'wanderingMerchant'];
        s = { ...s, pendingEvent: evs[Math.floor(Math.random() * evs.length)] };
      }
      return s;
    }

    case 'INTERACT_RESOURCE': {
      if (state.combat || state.recovery) return state;
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
      if (state.combat || state.recovery) return state;
      const area = AREA_BY_ID[state.player.currentArea];
      const exit = area.exits.find(e => e.x === state.player.x && e.y === state.player.y) || action.exit;
      if (!exit) return state;
      const gathered = { ...state.worldState.gathered };
      Object.keys(gathered).forEach(k => { if (k.startsWith(state.player.currentArea + '-')) delete gathered[k]; });
      return { ...state, player: { ...state.player, currentArea: exit.toArea, x: exit.toX, y: exit.toY }, worldState: { ...state.worldState, gathered }, log: [...state.log, `You travel to ${AREA_BY_ID[exit.toArea].name}.`] };
    }

    case 'TALK_NPC':
      if (state.combat || state.recovery) return state;
      return { ...state, dialogue: { npcId: action.npcId } };
    case 'CLOSE_DIALOGUE':
      return { ...state, dialogue: null };

    // ---------- Trade ----------
    case 'BUY': {
      if (state.combat || state.recovery) return state;
      const npc = NPC_BY_ID[action.npcId];
      const offer = npc.shop.sells.find(o => o.itemId === action.itemId);
      if (!offer) return state;
      const qty = action.qty || 1;
      const price = offer.price * qty;
      const rep = state.reputation.merchants || 0;
      const total = Math.max(1, Math.floor(price * (1 - rep * 0.02)));
      if (state.player.spiritStones < total) return state;
      let s = { ...state, player: { ...state.player, spiritStones: state.player.spiritStones - total } };
      s = applyEffects(s, { items: { [action.itemId]: qty } });
      return s;
    }
    case 'BUY_RECIPE': {
      if (state.combat || state.recovery) return state;
      const npc = NPC_BY_ID[action.npcId];
      const offer = (npc.shop.recipes || []).find(o => o.recipeId === action.recipeId);
      if (!offer || state.knownRecipes.includes(action.recipeId)) return state;
      const rep = state.reputation.merchants || 0;
      const total = Math.max(1, Math.floor(offer.price * (1 - rep * 0.02)));
      if (state.player.spiritStones < total) return state;
      let s = { ...state, player: { ...state.player, spiritStones: state.player.spiritStones - total } };
      s = learnRecipe(s, action.recipeId);
      return s;
    }
    case 'SELL': {
      if (state.combat || state.recovery) return state;
      const npc = NPC_BY_ID[action.npcId];
      if (!npc.shop || !npc.shop.buys.includes(action.itemId)) return state;
      const qty = action.qty || 1;
      const have = state.inventory[ITEM_BY_ID[action.itemId].category]?.[action.itemId] || 0;
      if (have < qty) return state;
      const price = Math.floor(ITEM_BY_ID[action.itemId].value * 0.5 * qty);
      return applyEffects(state, { removeItems: { [action.itemId]: qty }, spiritStones: price, message: `Sold ${qty} ${ITEM_BY_ID[action.itemId].name} for ${price} primordial stones.` });
    }

    // ---------- Gu ----------
    case 'EQUIP_GU': {
      if (state.player.equippedGu.includes(action.instanceId)) return state;
      if (state.player.equippedGu.length >= 6) return state;
      return { ...state, player: { ...state.player, equippedGu: [...state.player.equippedGu, action.instanceId] } };
    }
    case 'UNEQUIP_GU':
      return { ...state, player: { ...state.player, equippedGu: state.player.equippedGu.filter(id => id !== action.instanceId) } };

    case 'REFINE_RECIPE': {
      if (state.combat || state.recovery) return state;
      const r = RECIPE_BY_ID[action.recipeId];
      const list = refineChecklist(state, action.recipeId);
      if (!r || !state.knownRecipes.includes(r.id)) return state;
      if (!list.ok) return { ...state, log: [...state.log, 'You cannot refine yet — requirements are unmet.'] };
      const p = state.player;
      const refFx = bonusOf(state, 'refinement');
      let s = applyEffects(state, {
        essence: -list.essenceCost,
        spiritStones: -r.stones,
        removeItems: r.materials,
      });
      const chance = Math.min(95, BALANCE.refinement.baseSuccess + p.intelligence * BALANCE.refinement.successPerInt + Math.floor(p.luck * BALANCE.refinement.successPerLuck) + (refFx.successPct || 0));
      if (Math.random() * 100 < chance) {
        s = applyEffects(s, { giveGu: r.guId, message: `Refinement succeeds! You create ${GU_BY_ID[r.guId].name}.` });
        s = grantMastery(s, 'refinement', BALANCE.mastery.xpRefineSuccess, 'refined');
        s = grantMastery(s, r.path, Math.round(BALANCE.mastery.xpRefineSuccess * 0.6), 'refined');
        if (Math.random() * 100 < (refFx.saveChancePct || 0)) {
          const firstMat = Object.keys(r.materials)[0];
          if (firstMat) s = applyEffects(s, { items: { [firstMat]: 1 }, message: `Your refinement craft lets you keep one ${ITEM_BY_ID[firstMat]?.name}.` });
        }
      } else {
        s = { ...s, log: [...s.log, 'Refinement failed. The materials are lost.'] };
        s = grantMastery(s, 'refinement', BALANCE.mastery.xpRefineFail, 'refined');
      }
      return s;
    }

    // ---------- Cultivation ----------
    case 'CULTIVATE': {
      if (state.combat || state.recovery) return state;
      const cfg = BALANCE.cultivation;
      const p = state.player;
      const cost = cfg.essenceCostBase + cfg.essenceCostPerRank * p.rank;
      if (p.primevalEssence < cost) return { ...state, log: [...state.log, 'Not enough essence to cultivate.'] };
      const atSect = p.currentArea === 'cultivationSect';
      const gain = Math.min(cfg.progressCap, Math.floor((cfg.progressBase + p.intelligence * cfg.progressPerInt) * aptitudeMul(p.aptitude) * (atSect ? cfg.sectBonus : 1)));
      const progress = Math.min(100, (p.cultivationProgress || 0) + gain);
      const np = {
        ...p,
        primevalEssence: p.primevalEssence - cost,
        cultivationProgress: progress,
        totalInsight: (p.totalInsight || 0) + gain,
      };
      return { ...state, player: np, log: [...state.log, `You cultivate. (+${gain}% progress${atSect ? ' · sect bonus' : ''})`] };
    }

    case 'BREAKTHROUGH': {
      if (busy(state)) return state;
      const p = state.player;
      const g = globalStage(p);
      if (g >= 19) return state;
      const list = breakthroughChecklist(state);
      if (!list.ok) return { ...state, log: [...state.log, 'You are not ready to break through.'] };
      const req = BREAKTHROUGH_REQS[g];
      let s = applyEffects(state, {
        essence: -req.essence,
        spiritStones: -(req.stones || 0),
        removeItems: req.items || {},
      });
      const major = p.stage === 3;
      const np = {
        ...s.player,
        rank: major ? p.rank + 1 : p.rank,
        stage: major ? 0 : p.stage + 1,
        cultivationProgress: 0,
      };
      const st = CULTIVATION_STAGES[np.rank * 4 + np.stage];
      np.maxHp = st.maxHp;
      np.hp = Math.min(st.maxHp, np.hp + (st.maxHp - p.maxHp));
      np.maxPrimevalEssence = st.maxEssence;
      np.primevalEssence = st.maxEssence; // fully restored
      const statGain = major ? 2 : 1;
      np.strength += statGain; np.agility += statGain; np.perception += statGain; np.intelligence += statGain;
      s = {
        ...s,
        player: np,
        breakthrough: { major, name: st.name },
        log: [...s.log, major ? `MAJOR BREAKTHROUGH! You ascend to ${st.name}!` : `Breakthrough — you steady yourself at ${st.name}.`],
      };
      return s;
    }
    case 'DISMISS_BREAKTHROUGH':
      return { ...state, breakthrough: null };

    // ---------- Essence recovery ----------
    case 'START_RECOVERY': {
      if (state.combat || state.recovery) return state;
      const p = state.player;
      if (p.primevalEssence >= p.maxPrimevalEssence) return state;
      let s = state;
      if (action.mode === 'accelerated') {
        if (p.spiritStones < BALANCE.recovery.acceleratedCost) return { ...state, log: [...state.log, 'Not enough primordial stones.'] };
        s = { ...s, player: { ...p, spiritStones: p.spiritStones - BALANCE.recovery.acceleratedCost } };
      }
      return { ...s, recovery: { mode: action.mode, startedAt: Date.now() }, log: [...s.log, action.mode === 'accelerated' ? 'You settle into accelerated recovery. (-100 primordial stones)' : 'You settle into slow meditation to recover essence.'] };
    }
    case 'RECOVERY_TICK': {
      if (!state.recovery) return state;
      const p = state.player;
      const essence = Math.min(p.maxPrimevalEssence, p.primevalEssence + (action.amount || 0));
      const done = essence >= p.maxPrimevalEssence;
      return {
        ...state,
        player: { ...p, primevalEssence: essence },
        recovery: done ? null : state.recovery,
        log: done ? [...state.log, 'Your essence is fully restored.'] : state.log,
      };
    }
    case 'CANCEL_RECOVERY':
      if (!state.recovery) return state;
      return { ...state, recovery: null, log: [...state.log, 'You cease recovering. The essence gained is kept.'] };
    case 'INSTANT_RECOVERY': {
      const p = state.player;
      if (p.spiritStones < BALANCE.recovery.instantCost) return { ...state, log: [...state.log, 'Not enough primordial stones for instant recovery.'] };
      return {
        ...state,
        player: { ...p, spiritStones: p.spiritStones - BALANCE.recovery.instantCost, primevalEssence: p.maxPrimevalEssence },
        recovery: null,
        log: [...state.log, `You burn ${BALANCE.recovery.instantCost} primordial stones — essence floods back to full. (-${BALANCE.recovery.instantCost} stones)`],
      };
    }

    // ---------- Items / quests / events ----------
    case 'USE_ITEM': {
      if (state.combat || state.recovery) return state;
      const it = ITEM_BY_ID[action.itemId];
      if (!it || !it.use) return state;
      if ((state.inventory[it.category]?.[action.itemId] || 0) <= 0) return state;
      return applyEffects(state, { hp: it.use.hp || 0, essence: it.use.essence || 0, removeItems: { [action.itemId]: 1 }, message: `You use ${it.name}.` });
    }

    case 'ACCEPT_QUEST': {
      if (state.combat || state.recovery) return state;
      if (state.quests.active.includes(action.questId) || state.quests.completed.includes(action.questId)) return state;
      return { ...state, quests: { ...state.quests, active: [...state.quests.active, action.questId] }, log: [...state.log, `Accepted quest: ${QUEST_BY_ID[action.questId].name}`] };
    }
    case 'TURN_IN_QUEST': {
      if (state.combat || state.recovery) return state;
      const q = QUEST_BY_ID[action.questId];
      if (!state.quests.active.includes(action.questId) || !objectiveMet(state, q)) return state;
      let s = consumeForObjective(state, q);
      s = applyEffects(s, q.rewards || {});
      s = { ...s, quests: { ...s.quests, active: s.quests.active.filter(id => id !== action.questId), completed: [...s.quests.completed, action.questId] } };
      return s;
    }
    case 'QUEST_CHOICE': {
      if (state.combat || state.recovery) return state;
      const q = QUEST_BY_ID[action.questId];
      const choice = q.choices[action.choiceIndex];
      let s = applyEffects(state, choice.effects);
      s = { ...s, quests: { ...s.quests, active: s.quests.active.filter(id => id !== action.questId), completed: [...s.quests.completed, action.questId] } };
      return s;
    }

    // ---------- Combat ----------
    case 'PLAYER_ACTION': {
      if (state.recovery) return state;
      let s = executeRound(state, { type: action.action, guInstanceId: action.guInstanceId, itemId: action.itemId });
      if (s.combat && s.combat.usedItem) {
        const it = ITEM_BY_ID[s.combat.usedItem];
        s = { ...s, inventory: { ...s.inventory, [it.category]: { ...s.inventory[it.category], [s.combat.usedItem]: (s.inventory[it.category]?.[s.combat.usedItem] || 0) - 1 } } };
        if (s.inventory[it.category][s.combat.usedItem] <= 0) delete s.inventory[it.category][s.combat.usedItem];
        const c = { ...s.combat }; delete c.usedItem; s = { ...s, combat: c };
      }
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

    case 'APPLY_EFFECTS': {
      if (state.recovery) return state;
      return applyEffects(state, action.effects);
    }

    case 'DISMISS_TOAST':
      return { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.id) };

    default:
      return state;
  }
}

export { objectiveMet };