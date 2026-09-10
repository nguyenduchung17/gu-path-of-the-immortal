import { GU_BY_ID } from '../data/gu';
import { ITEM_BY_ID } from '../data/items';
import { QUEST_BY_ID } from '../data/quests';
import { NPC_BY_ID } from '../data/npcs';
import { EVENT_BY_ID } from '../data/events';
import { ENEMY_BY_ID } from '../data/enemies';
import { initCombat, executeRound } from '../engine/combat';
import { advanceTime, phaseOf } from '../engine/time';
import { applyEffects } from '../engine/effects';
import { grantMastery, learnRecipe, bonusOf } from '../engine/mastery';
import { CULTIVATION_STAGES, BREAKTHROUGH_REQS } from '../data/cultivation';
import { BALANCE, DIFFICULTIES, diffOf, shopPrice } from '../config/balance';
import { RECIPE_BY_ID } from '../data/recipes';
import {
  WORLD, zoneAt, isWalkable, DEFAULT_ZONE, LANDMARKS, WORLD_RESOURCES,
  initialEnemies, TERRACE, FORMATION, CAMP_CELLS, INNS,
} from '../data/world';
import { tickEnemies } from '../engine/enemies';
import { MISSION_BY_ID } from '../data/missions';
import { CONTRIBUTION_OFFERS } from '../data/contribution';
import { ARENA_BY_ID } from '../data/arena';

const APTITUDES = ['Dull', 'Ordinary', 'Good', 'Outstanding', 'Heavenly'];
const START_STAGE = CULTIVATION_STAGES[0];

export function createNewGame(name, gender, age, difficulty, slot) {
  const aptitude = APTITUDES[Math.floor(Math.random() * APTITUDES.length)];
  return {
    version: 4,
    difficulty: DIFFICULTIES[difficulty] ? difficulty : 'standard',
    slot: slot || 1,
    time: { day: BALANCE.time.startDay, min: BALANCE.time.startMinutes },
    playtimeSec: 0,
    deceased: null,
    sleeping: null,
    player: {
      name: name || 'Nameless', gender: gender || 'other', age: Number(age) || 16,
      rank: 0, stage: 0, cultivationProgress: 0,
      aptitude,
      hp: START_STAGE.maxHp, maxHp: START_STAGE.maxHp,
      primevalEssence: START_STAGE.maxEssence, maxPrimevalEssence: START_STAGE.maxEssence,
      willpower: 10,
      strength: 6, agility: 6, perception: 6, intelligence: 6, luck: 6,
      x: 42, y: 44, currentArea: 'greenValleyRegion', facing: 'down',
      spiritStones: 50, equippedGu: ['g_start'], totalInsight: 0,
    },
    ownedGu: [{ instanceId: 'g_start', guId: 'swiftFang', rank: 1 }],
    inventory: { materials: { herb: 3 }, medicine: { medicine: 1 }, food: { ration: 2 }, questItems: {} },
    quests: { active: [], completed: [], kills: {}, flags: {} },
    reputation: { villagers: 0, merchants: 0, sect: 0, blackMarket: 0 },
    worldState: {
      gathered: {},
      discovered: { zones: { greenValleyTown: true }, landmarks: { townGate: true, teleportFormation: true }, inns: { townInn: true } },
      enemies: initialEnemies(),
    },
    mastery: {}, masteryStats: {},
    knownPaths: ['wind'], knownRecipes: [],
    contribution: { greenValley: 0 },
    missions: { active: [], completed: [] },
    arena: { wins: 0, losses: 0 },
    recovery: null, breakthrough: null, toasts: [],
    combat: null, pendingEvent: null, dialogue: null,
    log: ['You stand in Green Valley Town — a Rank 1 · Early Stage cultivator of the Wind Path. Roads lead out into the wilds.'],
    createdAt: Date.now(),
  };
}

function aptitudeMul(apt) {
  return ['Dull', 'Ordinary', 'Good', 'Outstanding', 'Heavenly'].indexOf(apt) * 0.15 + 0.85;
}

export function globalStage(p) { return p.rank * 4 + (p.stage || 0); }

let _toastN = 0;
function pushToast(s, t) {
  return { ...s, toasts: [...(s.toasts || []), { id: `t${Date.now().toString(36)}${_toastN++}`, ...t }] };
}

function objectiveMet(state, q) {
  const o = q.objective;
  if (!o) return false;
  if (o.type === 'gather') return (state.inventory.materials[o.item] || 0) >= o.qty;
  if (o.type === 'hunt' || o.type === 'defeat') return (state.quests.kills[o.enemy] || 0) >= o.qty;
  if (o.type === 'reach') return !!(state.worldState.discovered?.zones?.[o.area]);
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
  const atSite = (zoneAt(p.x, p.y) || DEFAULT_ZONE).safe;
  return {
    ok: atSite
      && state.knownRecipes.includes(recipeId)
      && globalStage(p) >= r.stageReq
      && (state.mastery?.[r.path]?.level || 1) >= r.masteryReq
      && p.primevalEssence >= essenceCost
      && p.spiritStones >= r.stones
      && mats.every(([id, q]) => (state.inventory.materials?.[id] || 0) >= q),
    essenceCost,
    checks: [
      { key: 'site', met: atSite, text: 'At a settlement (refinement grounds)' },
      { key: 'stage', met: globalStage(p) >= r.stageReq, text: `Cultivation: ${CULTIVATION_STAGES[r.stageReq].name}` },
      { key: 'mastery', met: (state.mastery?.[r.path]?.level || 1) >= r.masteryReq, text: `${r.path[0].toUpperCase() + r.path.slice(1)} Mastery Level ${r.masteryReq}` },
      ...mats.map(([id, q]) => ({ key: `item-${id}`, met: (state.inventory.materials?.[id] || 0) >= q, text: `${ITEM_BY_ID[id]?.name || id}: ${state.inventory.materials?.[id] || 0}/${q}` })),
      { key: 'essence', met: p.primevalEssence >= essenceCost, text: `Essence: ${Math.floor(p.primevalEssence)}/${essenceCost}` },
      { key: 'stones', met: p.spiritStones >= r.stones, text: `Primordial Stones: ${p.spiritStones}/${r.stones}` },
    ],
  };
}

const busy = (state) => !!(state.combat || state.recovery || state.pendingEvent || state.dialogue || state.sleeping);

export function gameReducer(state, action) {
  // a deceased (True Cultivation) character can no longer act — only leave or reset
  if (state && state.deceased && !['LOAD', 'RESET', 'END_COMBAT'].includes(action.type)) return state;
  switch (action.type) {
    case 'LOAD':
      return action.state;
    case 'NEW_GAME':
      return createNewGame(action.name, action.gender, action.age, action.difficulty, action.slot);
    case 'RESET':
      return { noSave: true };

    // ---------- World ----------
    case 'MOVE': {
      if (busy(state)) return state;
      const p = state.player;
      const nx = p.x + action.dx, ny = p.y + action.dy;
      if (!isWalkable(nx, ny)) return state;
      const facing = action.dx === 1 ? 'right' : action.dx === -1 ? 'left' : action.dy === 1 ? 'down' : 'up';
      let s = advanceTime({ ...state, player: { ...p, x: nx, y: ny, facing } }, BALANCE.time.moveMinutes);

      const zone = zoneAt(nx, ny) || DEFAULT_ZONE;
      const ws = s.worldState;
      const zonesFound = { ...(ws.discovered?.zones || {}) };
      const logAdd = [];
      if (!zonesFound[zone.id]) {
        zonesFound[zone.id] = true;
        logAdd.push(`Entered ${zone.name} — ${zone.dangerLabel.toLowerCase()}.`);
      }
      const lms = ws.discovered?.landmarks || {};
      let newLm = null;
      for (const lm of LANDMARKS) {
        if (!lms[lm.id] && Math.abs(lm.x - nx) <= lm.r && Math.abs(lm.y - ny) <= lm.r) { newLm = lm; break; }
      }
      let discovered = { zones: zonesFound, landmarks: lms };
      if (newLm) discovered = { zones: zonesFound, landmarks: { ...lms, [newLm.id]: true } };
      s = { ...s, worldState: { ...ws, discovered } };
      if (newLm) {
        s = pushToast(s, { icon: '📍', title: 'Discovered', lines: [newLm.name] });
        logAdd.push(`Discovered: ${newLm.name}.`);
      }
      if (logAdd.length) s = { ...s, log: [...s.log, ...logAdd] };

      // occasional world events in the wilderness (rare, never in safe zones)
      if (zone.eventRate && Math.random() * 100 < zone.eventRate) {
        const evs = ['strangeHerb', 'injuredCultivator', 'hiddenCave', 'spiritSpring', 'wanderingMerchant'];
        s = { ...s, pendingEvent: evs[(Math.random() * evs.length) | 0] };
      }

      // visible enemies take their turn
      const res = tickEnemies(s);
      s = res.state;
      if (res.combat) s = { ...s, combat: res.combat, log: [...s.log, res.combat.log[0]] };
      return s;
    }

    case 'INTERACT_RESOURCE': {
      if (state.combat || state.recovery) return state;
      const node = WORLD_RESOURCES.find(r => r.id === action.nodeId);
      if (!node) return state;
      const last = state.worldState.gathered[node.id] || 0;
      if (Date.now() - last < BALANCE.world.gatherRespawnMs) return state;
      const nightBonus = phaseOf((state.time || {}).min) === 'night' ? (BALANCE.time.nightGatherBonus[node.type] || 0) : 0;
      const qty = 1 + nightBonus + gatherBonus(state) + (Math.random() < state.player.perception * 0.01 ? 1 : 0);
      let s = applyEffects(state, { items: { [node.type]: qty }, message: `Gathered ${qty} ${node.name}.` });
      s = { ...s, worldState: { ...s.worldState, gathered: { ...s.worldState.gathered, [node.id]: Date.now() } } };
      return advanceTime(s, BALANCE.time.gatherMinutes);
    }

    case 'ATTACK_ENEMY': {
      if (busy(state)) return state;
      const p = state.player;
      const e = (state.worldState.enemies || []).find(en => !en.dead && Math.abs(en.x - p.x) + Math.abs(en.y - p.y) === 1);
      if (!e) return state;
      const def = ENEMY_BY_ID[e.defId];
      return { ...state, combat: initCombat(e.defId, p, { hp: e.hp, worldId: e.id, difficulty: state.difficulty, intro: `You strike first — the ${def.name} turns on you!` }) };
    }

    case 'SLEEP_INN': {
      if (busy(state)) return state;
      const inn = INNS.find(i => i.id === action.innId);
      if (!inn) return state;
      const p = state.player;
      const cost = Math.max(1, Math.round(inn.cost * diffOf(state).priceMul));
      if (p.spiritStones < cost) return { ...state, log: [...state.log, `Not enough primordial stones — the room costs ${cost}.`] };
      // sleep restores HP (not essence) and includes one free morning meal
      let s = applyEffects(state, {
        hp: p.maxHp, spiritStones: -cost,
        items: { [BALANCE.inn.mealItemId]: 1 },
        message: `You rent a room and sleep until morning. (-${cost} primordial stones)`,
      });
      const t = s.time || { day: BALANCE.time.startDay, min: BALANCE.time.startMinutes };
      const wake = t.min < BALANCE.time.sleepToMinutes
        ? { day: t.day, min: BALANCE.time.sleepToMinutes }
        : { day: t.day + 1, min: BALANCE.time.sleepToMinutes };
      s = {
        ...s,
        time: wake,
        sleeping: { wakeAt: Date.now() + BALANCE.time.sleepFadeMs },
        worldState: { ...s.worldState, discovered: { ...s.worldState.discovered, inns: { ...(s.worldState.discovered.inns || {}), [inn.id]: true } } },
        log: [...s.log, `Day ${wake.day}, 07:00 — you wake rested, a simple morning meal from the innkeeper in your pack.`],
      };
      return s;
    }
    case 'WAKE':
      return { ...state, sleeping: null };

    case 'REST_CAMP': {
      if (state.combat || state.recovery) return state;
      const p = state.player;
      let s = advanceTime(applyEffects(state, { hp: Math.floor(p.maxHp * 0.35), message: 'You rest at the campsite. Beasts rarely stray here.' }), BALANCE.time.campRestMinutes);
      if (s.player.primevalEssence < s.player.maxPrimevalEssence) {
        s = { ...s, recovery: { mode: 'camp', startedAt: Date.now() }, log: [...s.log, 'You begin recovering essence by the fire — it will not be interrupted here.'] };
      }
      return s;
    }

    case 'USE_FORMATION': {
      if (state.combat || state.recovery) return state;
      return advanceTime({ ...state, log: [...state.log, 'The formation hums with dormant power — no distant regions are charted yet.'] }, BALANCE.time.talkMinutes);
    }

    case 'TALK_NPC':
      if (state.combat || state.recovery) return state;
      return advanceTime({ ...state, dialogue: { npcId: action.npcId } }, BALANCE.time.talkMinutes);
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
      const total = shopPrice(offer.price * qty, state);
      if (state.player.spiritStones < total) return state;
      let s = { ...state, player: { ...state.player, spiritStones: state.player.spiritStones - total } };
      s = applyEffects(s, { items: { [action.itemId]: qty } });
      return advanceTime(s, BALANCE.time.tradeMinutes);
    }
    case 'BUY_RECIPE': {
      if (state.combat || state.recovery) return state;
      const npc = NPC_BY_ID[action.npcId];
      const offer = (npc.shop.recipes || []).find(o => o.recipeId === action.recipeId);
      if (!offer || state.knownRecipes.includes(action.recipeId)) return state;
      const total = shopPrice(offer.price, state);
      if (state.player.spiritStones < total) return state;
      let s = { ...state, player: { ...state.player, spiritStones: state.player.spiritStones - total } };
      s = learnRecipe(s, action.recipeId);
      return advanceTime(s, BALANCE.time.tradeMinutes);
    }
    case 'SELL': {
      if (state.combat || state.recovery) return state;
      const npc = NPC_BY_ID[action.npcId];
      if (!npc.shop || !npc.shop.buys.includes(action.itemId)) return state;
      const qty = action.qty || 1;
      const have = state.inventory[ITEM_BY_ID[action.itemId].category]?.[action.itemId] || 0;
      if (have < qty) return state;
      const price = Math.floor(ITEM_BY_ID[action.itemId].value * 0.5 * qty);
      return advanceTime(applyEffects(state, { removeItems: { [action.itemId]: qty }, spiritStones: price, message: `Sold ${qty} ${ITEM_BY_ID[action.itemId].name} for ${price} primordial stones.` }), BALANCE.time.tradeMinutes);
    }

    // ---------- Missions & contribution ----------
    case 'MISSION_ACCEPT': {
      if (state.combat || state.recovery) return state;
      const m = MISSION_BY_ID[action.missionId];
      if (!m || state.missions.active.includes(m.id) || state.missions.completed.includes(m.id)) return state;
      return advanceTime({ ...state, missions: { ...state.missions, active: [...state.missions.active, m.id] }, log: [...state.log, `Mission accepted: ${m.name}.`] }, BALANCE.time.tradeMinutes);
    }
    case 'MISSION_TURN_IN': {
      if (state.combat || state.recovery) return state;
      const m = MISSION_BY_ID[action.missionId];
      if (!m || !state.missions.active.includes(m.id) || !objectiveMet(state, m)) return state;
      let s = consumeForObjective(state, m);
      s = applyEffects(s, {
        ...(m.rewards || {}),
        contribution: (m.rewards && m.rewards.contribution) || 0,
        message: `Mission complete: ${m.name}. (+${(m.rewards && m.rewards.contribution) || 0} contribution)`,
      });
      s = { ...s, missions: { ...s.missions, active: s.missions.active.filter(id => id !== m.id), completed: [...s.missions.completed, m.id] } };
      return advanceTime(s, BALANCE.time.tradeMinutes);
    }
    case 'BUY_CONTRIBUTION': {
      if (state.combat || state.recovery) return state;
      const offer = CONTRIBUTION_OFFERS.find(o => o.id === action.offerId);
      if (!offer) return state;
      const contrib = (state.contribution && state.contribution.greenValley) || 0;
      if (contrib < offer.cost) return { ...state, log: [...state.log, 'Not enough contribution points.'] };
      if (offer.grant.recipe && state.knownRecipes.includes(offer.grant.recipe)) return state;
      if (offer.req) {
        if (offer.req.stageReq !== undefined && globalStage(state.player) < offer.req.stageReq)
          return { ...state, log: [...state.log, 'Your cultivation is not sufficient for this reward.'] };
        if (offer.req.mastery && (state.mastery?.[offer.req.mastery.path]?.level || 1) < offer.req.mastery.level)
          return { ...state, log: [...state.log, 'Your path mastery is not sufficient for this reward.'] };
      }
      let s = { ...state, contribution: { ...state.contribution, greenValley: contrib - offer.cost } };
      if (offer.grant.recipe) s = learnRecipe(s, offer.grant.recipe);
      if (offer.grant.items) s = applyEffects(s, { items: offer.grant.items, message: `Exchanged contribution for ${offer.name}. (-${offer.cost} contribution)` });
      else s = { ...s, log: [...s.log, `Exchanged contribution for ${offer.name}. (-${offer.cost} contribution)`] };
      return s;
    }

    // ---------- Arena ----------
    case 'ARENA_FIGHT': {
      if (busy(state)) return state;
      const ch = ARENA_BY_ID[action.challengeId];
      if (!ch) return state;
      if (state.player.spiritStones < ch.stake) return { ...state, log: [...state.log, `You need ${ch.stake} primordial stones to post this stake.`] };
      let s = applyEffects(state, { spiritStones: -ch.stake, message: `You post your stake of ${ch.stake} primordial stones. The bout begins!` });
      s = {
        ...s,
        combat: initCombat(null, s.player, {
          def: ch.opponent,
          difficulty: s.difficulty,
          arena: { challengeId: ch.id, stake: ch.stake, opponentStake: ch.opponentStake },
          intro: `${ch.opponent.name} salutes — the duel begins!`,
        }),
      };
      return advanceTime(s, BALANCE.time.arenaMinutes);
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
      const chance = Math.min(95, BALANCE.refinement.baseSuccess + p.intelligence * BALANCE.refinement.successPerInt + Math.floor(p.luck * BALANCE.refinement.successPerLuck) + (refFx.successPct || 0) + diffOf(state).refinePct);
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
      return advanceTime(s, BALANCE.time.refineMinutes);
    }

    // ---------- Cultivation ----------
    case 'CULTIVATE': {
      if (state.combat || state.recovery) return state;
      const cfg = BALANCE.cultivation;
      const p = state.player;
      const cost = cfg.essenceCostBase + cfg.essenceCostPerRank * p.rank;
      if (p.primevalEssence < cost) return { ...state, log: [...state.log, 'Not enough essence to cultivate.'] };
      const atSect = WORLD.tiles[p.y] && WORLD.tiles[p.y][p.x] === '*';
      const gain = Math.min(cfg.progressCap, Math.floor((cfg.progressBase + p.intelligence * cfg.progressPerInt) * aptitudeMul(p.aptitude) * (atSect ? cfg.sectBonus : 1)));
      const progress = Math.min(100, (p.cultivationProgress || 0) + gain);
      const np = {
        ...p,
        primevalEssence: p.primevalEssence - cost,
        cultivationProgress: progress,
        totalInsight: (p.totalInsight || 0) + gain,
      };
      return advanceTime({ ...state, player: np, log: [...state.log, `You cultivate. (+${gain}% progress${atSect ? ' · terrace bonus' : ''})`] }, BALANCE.time.cultivateMinutes);
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

    // ---------- Game clock ----------
    case 'TIME_TICK': {
      let s = advanceTime(state, BALANCE.time.minutesPerTick);
      s = { ...s, playtimeSec: (s.playtimeSec || 0) + BALANCE.time.tickMs / 1000 };
      return s;
    }

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
      return advanceTime({
        ...state,
        player: { ...p, primevalEssence: essence },
        recovery: done ? null : state.recovery,
        log: done ? [...state.log, 'Your essence is fully restored.'] : state.log,
      }, BALANCE.time.recoveryMinutesPerTick);
    }
    case 'RECOVERY_INTERRUPTED': {
      if (!state.recovery) return state;
      const e = (state.worldState.enemies || []).find(en => en.id === action.enemyId && !en.dead);
      if (!e) return { ...state, recovery: null };
      const def = ENEMY_BY_ID[e.defId];
      return {
        ...state,
        recovery: null,
        combat: initCombat(e.defId, state.player, { hp: e.hp, worldId: e.id, difficulty: state.difficulty, intro: `Your meditation shatters — the ${def.name} found you!` }),
        log: [...state.log, `Your meditation shatters — the ${def.name} found you!`],
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
      s = advanceTime(s, BALANCE.time.combatRoundMinutes);
      if (s.combat && s.combat.usedItem) {
        const it = ITEM_BY_ID[s.combat.usedItem];
        s = { ...s, inventory: { ...s.inventory, [it.category]: { ...s.inventory[it.category], [s.combat.usedItem]: (s.inventory[it.category]?.[s.combat.usedItem] || 0) - 1 } } };
        if (s.inventory[it.category][s.combat.usedItem] <= 0) delete s.inventory[it.category][s.combat.usedItem];
        const c = { ...s.combat }; delete c.usedItem; s = { ...s, combat: c };
      }
      return s;
    }
    case 'END_COMBAT': {
      const c = state.combat;
      if (!c) return state;
      let s = { ...state, combat: null };
      // world enemy bookkeeping: dead → respawn timer; surviving → keep damage dealt
      if (c.worldId && s.worldState.enemies) {
        s = {
          ...s,
          worldState: {
            ...s.worldState,
            enemies: s.worldState.enemies.map(e => {
              if (e.id !== c.worldId) return e;
              if (c.result === 'victory') {
                return { ...e, dead: true, respawnAt: Date.now() + BALANCE.world.respawnMs, x: e.home.x, y: e.home.y, state: 'idle', hp: ENEMY_BY_ID[e.defId].hp };
              }
              return { ...e, hp: Math.max(1, Math.min(ENEMY_BY_ID[e.defId].hp, Math.round(c.enemy.hp / (c.hpScale || 1)))), state: 'idle' };
            }),
          },
        };
      }
      // arena resolution — stake was posted up front
      if (c.arena) {
        const ch = ARENA_BY_ID[c.arena.challengeId];
        if (c.result === 'victory') {
          s = applyEffects(s, {
            spiritStones: c.arena.stake + c.arena.opponentStake,
            contribution: (ch && ch.rewards && ch.rewards.contribution) || 0,
            items: (ch && ch.rewards && ch.rewards.items) || {},
            message: `Arena victory! You claim both stakes: +${c.arena.stake + c.arena.opponentStake} primordial stones.`,
          });
          s = { ...s, arena: { ...s.arena, wins: (s.arena.wins || 0) + 1 } };
        } else {
          s = {
            ...s,
            arena: { ...s.arena, losses: (s.arena.losses || 0) + 1 },
            log: [...s.log, c.result === 'defeat' ? 'Defeated in the arena — your stake is forfeit.' : 'You forfeit the duel and your stake.'],
          };
        }
      }
      return s;
    }

    case 'CHOOSE_EVENT': {
      const ev = EVENT_BY_ID[state.pendingEvent];
      const opt = ev.options[action.optionIndex];
      let s = applyEffects(state, opt.effects);
      const pending = s._pendingCombat;
      delete s._pendingCombat;
      s = { ...s, pendingEvent: null };
      if (pending) s = { ...s, combat: initCombat(pending, s.player, { difficulty: s.difficulty }) };
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