import { GU_BY_ID } from '../data/gu';
import { ITEM_BY_ID } from '../data/items';
import { QUEST_BY_ID, QUESTS } from '../data/quests';
import { NPC_BY_ID, guOfferOf } from '../data/npcs';
import { MASTERS, MASTER_BY_ID, reqChecks, syncMasterSteps } from '../data/masters';
import { EVENT_BY_ID } from '../data/events';
import { ENEMY_BY_ID } from '../data/enemies';
import { initCombat, executeRound, persistCombatEnemyState } from '../engine/combat';
import { advanceTime, phaseOf } from '../engine/time';
import { applyEffects } from '../engine/effects';
import { grantMastery, learnRecipe, bonusOf, learnClue, CLUE_RANK } from '../engine/mastery';
import { CULTIVATION_STAGES, BREAKTHROUGH_REQS } from '../data/cultivation';
import { BALANCE, DIFFICULTIES, diffOf, shopPrice, recoveryCosts } from '../config/balance';
import { RECIPE_BY_ID } from '../data/recipes';
import {
  WORLD, zoneAt, isWalkable, DEFAULT_ZONE, LANDMARKS, WORLD_RESOURCES,
  initialEnemies, TERRACE, FORMATION, CAMP_CELLS, INNS, ZONE_FAUNA,
} from '../data/world';
import { tickEnemies, regenWorldEnemies } from '../engine/enemies';
import { MISSION_BY_ID } from '../data/missions';
import { CONTRIBUTION_OFFERS } from '../data/contribution';
import { ARENA_BY_ID } from '../data/arena';
import { DEFAULT_APPEARANCE } from '../data/appearance';
import { essenceCapFor, cultivateMulOf, normalizeAptitude, rollAptitudeScore, rollConstitution } from '../config/aptitude';
import { starterGuOf } from '../data/starterGu';
import { SPECIES_BY_ID, wildCombatDef, captureChanceOf, initialWildGu } from '../data/wildGu';
import { revealFog, seedFog, foodOf } from '../engine/guLife';
import { applyExploreGu, carryIntoCombat, visionRadiusOf, checkHiddenPaths, hazardStep, moveOverride, exploreActive, ambushOf, nearbyPackCount } from '../engine/exploration';
import { startInstability } from '../engine/vitalGu';
import { QS, acceptQuest, turnInQuest, toggleTrack, abandonQuest, applyQuestEvent, emptyQuests, markDiscovered } from '../engine/questEngine';
import { PATH_BY_ID } from '../data/paths';
import {
  T, locGuName, locItemName, locEnemyName, locZoneName, locLandmarkName, locStageName,
  locQuestName, locQuestRewardMsg, locMissionName, locContribName, locArenaOpponentName,
  locSpeciesName, locPathName, locEventMsg, locResourceName,
} from '../i18n/tr';

const START_STAGE = CULTIVATION_STAGES[0];

export function createNewGame(name, gender, age, difficulty, slot, appearance, aptitude, starterGuId) {
  const starter = starterGuOf(starterGuId);
  const apt = normalizeAptitude(
    aptitude && typeof aptitude.score === 'number' ? aptitude : { score: rollAptitudeScore(), constitution: rollConstitution() }
  );
  const essenceCap = essenceCapFor(START_STAGE.maxEssence, apt);
  const starterFood = foodOf(starter);
  return {
    version: 12,
    difficulty: DIFFICULTIES[difficulty] ? difficulty : 'standard',
    slot: slot || 1,
    time: { day: BALANCE.time.startDay, min: BALANCE.time.startMinutes },
    playtimeSec: 0,
    deceased: null,
    sleeping: null,
    player: {
      name: name || 'Nameless', gender: gender || 'other', age: Number(age) || 16,
      rank: 0, stage: 0, cultivationProgress: 0,
      aptitude: apt,
      hp: START_STAGE.maxHp, maxHp: START_STAGE.maxHp,
      primevalEssence: essenceCap, maxPrimevalEssence: essenceCap,
      willpower: 10,
      strength: 6, agility: 6, perception: 6, intelligence: 6, luck: 6,
      x: 42, y: 44, currentArea: 'greenValleyRegion', facing: 'down',
      spiritStones: 50, equippedGu: ['g_start'], totalInsight: 0, vitalInstability: null,
      appearance: appearance || DEFAULT_APPEARANCE,
    },
    ownedGu: [{ instanceId: 'g_start', guId: starter.id, rank: starter.rank }],
    inventory: { materials: { herb: 3 }, medicine: { medicine: 1 }, food: { ration: 2 }, guFood: starterFood ? { [starterFood]: 2 } : {}, guGear: { sealingJar: 1 }, questItems: {} },
    settings: { autoFeed: false },
    vitalGu: null,
    vitalSwitchDay: -99,
    quests: emptyQuests(),
    reputation: { villagers: 0, merchants: 0, sect: 0, blackMarket: 0 },
    worldState: {
      gathered: {},
      discovered: { zones: { greenValleyTown: true }, landmarks: { townGate: true, teleportFormation: true }, inns: { townInn: true }, paths: {} },
      enemies: initialEnemies(),
      wildGu: initialWildGu(),
      fog: seedFog(42, 44, 6),
    },
    mastery: {}, masteryStats: {},
    knownPaths: [starter.path], knownRecipes: [], recipeKnowledge: {},
    contribution: { greenValley: 0 },
    masters: {},
    bestiary: {},
    missions: { active: [], completed: [] },
    arena: { wins: 0, losses: 0 },
    recovery: null, breakthrough: null, toasts: [],
    combat: null, pendingEvent: null, dialogue: null,
    log: [
      T('wld.intro1', { stage: `${T('cult.rank0')} · ${T('cult.stage0')}`, path: locPathName(PATH_BY_ID[starter.path]) }),
      T('wld.intro2', { gu: locGuName(starter) }),
    ],
    createdAt: Date.now(),
  };
}



export function globalStage(p) { return p.rank * 4 + (p.stage || 0); }

let _toastN = 0;
function pushToast(s, t) {
  return { ...s, toasts: [...(s.toasts || []), { id: `t${Date.now().toString(36)}${_toastN++}`, ...t }] };
}

// Centralized quest-event application: advance every matching ACTIVE quest
// objective, then celebrate each advance and each quest that just became
// ready to turn in (or auto-completed).
function withQuestEvents(s, event) {
  const res = applyQuestEvent(s, event);
  let out = res.state;
  for (const u of res.updates) {
    out = pushToast(out, { icon: '📜', title: T('toast.objUpdated'), lines: [T('qs.objLine', { delta: u.delta, label: u.label })] });
  }
  for (const qid of res.ready) {
    const q = QUEST_BY_ID[qid];
    out = pushToast(out, { icon: '✅', title: T('toast.objComplete'), lines: [locQuestName(q), T('qs.returnTo', { name: NPC_BY_ID[q.giver]?.name || '?' })] });
  }
  for (const qid of res.autoCompleted) {
    const q = QUEST_BY_ID[qid];
    out = applyEffects(out, { ...q.rewards, message: locQuestRewardMsg(q) || undefined });
    out = pushToast(out, { icon: '🎉', title: T('toast.questComplete'), lines: [locQuestName(q)] });
  }
  return out;
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
    { key: 'progress', met: p.cultivationProgress >= 100, text: T('chk.progress') },
    { key: 'essence', met: p.primevalEssence >= req.essence, text: T('chk.essence', { cur: Math.floor(p.primevalEssence), req: req.essence }) },
    ...(req.stones ? [{ key: 'stones', met: p.spiritStones >= req.stones, text: T('chk.stones', { cur: p.spiritStones, req: req.stones }) }] : []),
    ...matEntries.map(([id, qty]) => ({ key: `item-${id}`, met: (state.inventory.materials?.[id] || 0) >= qty, text: T('chk.item', { name: ITEM_BY_ID[id] ? locItemName(ITEM_BY_ID[id]) : id, cur: state.inventory.materials?.[id] || 0, req: qty }) })),
    ...(req.masteryLevel ? [{ key: 'mastery', met: maxMastery >= req.masteryLevel, text: T('chk.mastery', { n: req.masteryLevel }) }] : []),
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
      { key: 'site', met: atSite, text: T('chk.site') },
      { key: 'stage', met: globalStage(p) >= r.stageReq, text: T('chk.stage', { stage: locStageName(CULTIVATION_STAGES[r.stageReq]) }) },
      { key: 'mastery', met: (state.mastery?.[r.path]?.level || 1) >= r.masteryReq, text: T('chk.pathMastery', { path: locPathName(PATH_BY_ID[r.path]), n: r.masteryReq }) },
      ...mats.map(([id, q]) => ({ key: `item-${id}`, met: (state.inventory.materials?.[id] || 0) >= q, text: T('chk.item', { name: ITEM_BY_ID[id] ? locItemName(ITEM_BY_ID[id]) : id, cur: state.inventory.materials?.[id] || 0, req: q }) })),
      { key: 'essence', met: p.primevalEssence >= essenceCost, text: T('chk.essence', { cur: Math.floor(p.primevalEssence), req: essenceCost }) },
      { key: 'stones', met: p.spiritStones >= r.stones, text: T('chk.stones', { cur: p.spiritStones, req: r.stones }) },
    ],
  };
}

// Rank-up refinement checklist — ✓/✗ lines with a live success chance and
// the exact failure risks. All tuning lives in BALANCE.guRefine.
export function refineGuChecklist(state, inst) {
  const cfg = BALANCE.guRefine;
  const gu = GU_BY_ID[inst.guId];
  const cur = inst.rank || gu.rank;
  const target = cur + 1;
  const vital = state.vitalGu === inst.instanceId;
  const day = state.time?.day || 1;
  const p = state.player;
  const refFx = bonusOf(state, 'refinement');
  const food = foodOf(gu);
  const materials = { ...(food ? { [food]: cfg.foodPerRank * target } : {}), beastCore: cfg.corePerRank * target };
  const stonesCost = cfg.stonesPerRank * target;
  const essenceCost = Math.max(1, Math.ceil(cfg.essencePerRank * target * (1 - (refFx.refineEssencePct || 0) / 100)));
  const chance = Math.max(5, Math.min(95, Math.round(
    cfg.baseSuccess + p.intelligence * cfg.perInt + Math.floor(p.luck * cfg.perLuck)
    + (state.mastery?.refinement?.level || 1) * cfg.refineMasteryPerLevel
    - (target - 1) * cfg.rankPenalty + (refFx.successPct || 0) + diffOf(state).refinePct)));
  const injured = (inst.injuredUntilDay || 0) > day;
  const blocked = (inst.refineBlockedUntilDay || 0) > day;
  const matEntries = Object.entries(materials);
  const checks = [
    { key: 'max', met: cur < cfg.maxRank, text: T('chk.maxRank', { n: cfg.maxRank }) },
    { key: 'rank', met: p.rank >= target - 1, text: T('chk.rank', { need: T(`cult.rank${target - 2}`), cur: T(`cult.rank${p.rank}`) }) },
    { key: 'injury', met: !injured && !blocked, text: injured ? T('chk.injured', { d: inst.injuredUntilDay }) : blocked ? T('chk.blocked', { d: inst.refineBlockedUntilDay }) : T('chk.healthy') },
    ...matEntries.map(([id, q]) => ({ key: `item-${id}`, met: (state.inventory[ITEM_BY_ID[id].category]?.[id] || 0) >= q, text: T('chk.item', { name: locItemName(ITEM_BY_ID[id]), cur: state.inventory[ITEM_BY_ID[id].category]?.[id] || 0, req: q }) })),
    { key: 'essence', met: p.primevalEssence >= essenceCost, text: T('chk.essence', { cur: Math.floor(p.primevalEssence), req: essenceCost }) },
    { key: 'stones', met: p.spiritStones >= stonesCost, text: T('chk.stones', { cur: p.spiritStones, req: stonesCost }) },
  ];
  return {
    ok: checks.every(c => c.met), cur, target, vital, chance, stonesCost, essenceCost, materials,
    injuryChance: cfg.injuryChance, deathChance: vital ? 0 : cfg.deathChance, checks,
  };
}

const busy = (state) => !!(state.combat || state.recovery || state.pendingEvent || state.dialogue || state.sleeping || state.wildEncounter);

// Wild-Gu bookkeeping: after a successful capture or kill the haunt empties
// until the (slow) respawn timer elapses.
function wildGuAfterEncounter(state, worldId, gone) {
  if (!gone) return state;
  return {
    ...state,
    worldState: {
      ...state.worldState,
      wildGu: (state.worldState.wildGu || []).map(w => w.id !== worldId ? w : {
        ...w, gone: true,
        respawnAt: Date.now() + BALANCE.world.wildGuRespawnMs,
        hp: SPECIES_BY_ID[w.speciesId].hp,
        x: w.home.x, y: w.home.y,
      }),
    },
  };
}

export function gameReducer(state, action) {
  // a deceased (True Cultivation) character can no longer act — only leave or reset
  if (state && state.deceased && !['LOAD', 'RESET', 'END_COMBAT'].includes(action.type)) return state;
  switch (action.type) {
    case 'LOAD':
      return action.state;
    case 'NEW_GAME':
      return createNewGame(action.name, action.gender, action.age, action.difficulty, action.slot, action.appearance, action.aptitude, action.starterGuId);
    case 'RESET':
      return { noSave: true };

    // ---------- World ----------
    case 'MOVE': {
      if (busy(state)) return state;
      const p = state.player;
      const nx = p.x + action.dx, ny = p.y + action.dy;
      let passNote = null;
      if (!isWalkable(nx, ny)) {
        // secret passages & hazard crossings — exploration Gu open the way
        const ov = moveOverride(state, nx, ny);
        if (!ov) return state;
        if (ov.blocked) return { ...state, log: [...state.log, ov.blocked] };
        passNote = ov.reason;
      }
      const facing = action.dx === 1 ? 'right' : action.dx === -1 ? 'left' : action.dy === 1 ? 'down' : 'up';
      let s = revealFog(advanceTime({ ...state, player: { ...p, x: nx, y: ny, facing } }, BALANCE.time.moveMinutes), nx, ny, visionRadiusOf(state));

      const zone = zoneAt(nx, ny) || DEFAULT_ZONE;
      const ws = s.worldState;
      const zonesFound = { ...(ws.discovered?.zones || {}) };
      const logAdd = [];
      if (!zonesFound[zone.id]) {
        zonesFound[zone.id] = true;
        const dangerTxt = zone.safe ? T('danger.safe')
          : T(zone.danger >= 5 ? 'danger.extreme' : zone.danger >= 4 ? 'danger.high' : zone.danger >= 3 ? 'danger.moderate' : 'danger.low');
        logAdd.push(T('wld.entered', { zone: locZoneName(zone), danger: dangerTxt }));
        // territory knowledge — learning what haunts a land is itself a reward
        const fauna = ZONE_FAUNA[zone.id];
        if (fauna?.length) logAdd.push(T(fauna.length > 1 ? 'wld.territoryPl' : 'wld.territory', { fauna: fauna.map(id => ENEMY_BY_ID[id] ? locEnemyName(ENEMY_BY_ID[id]) : id).join(', ') }));
      }
      const lms = ws.discovered?.landmarks || {};
      let newLm = null;
      for (const lm of LANDMARKS) {
        if (!lms[lm.id] && Math.abs(lm.x - nx) <= lm.r && Math.abs(lm.y - ny) <= lm.r) { newLm = lm; break; }
      }
      let discovered = { ...(ws.discovered || {}), zones: zonesFound, landmarks: lms };
      if (newLm) discovered = { ...discovered, landmarks: { ...lms, [newLm.id]: true } };
      s = { ...s, worldState: { ...ws, discovered } };
      if (!(ws.discovered?.zones || {})[zone.id]) s = withQuestEvents(s, { type: 'LOCATION_DISCOVERED', id: zone.id });
      if (newLm) {
        s = pushToast(s, { icon: '📍', title: T('toast.discovered'), lines: [locLandmarkName(newLm)] });
        logAdd.push(T('wld.discovered', { name: locLandmarkName(newLm) }));
      }
      if (passNote) logAdd.push(passNote);
      if (logAdd.length) s = { ...s, log: [...s.log, ...logAdd] };
      s = checkHiddenPaths(s);
      s = hazardStep(s);

      // hidden masters reveal themselves when you come near — no map markers
      let masterFound = null;
      for (const m of MASTERS) {
        if ((s.masters || {})[m.id]?.found) continue;
        if (Math.abs(m.x - nx) <= m.discoverRadius && Math.abs(m.y - ny) <= m.discoverRadius) { masterFound = m; break; }
      }
      if (masterFound) {
        s = {
          ...s,
          masters: { ...(s.masters || {}), [masterFound.id]: { found: true, step: 0, duels: {} } },
        };
        s = pushToast(s, { icon: '👁️', title: 'An Extraordinary Presence', lines: [masterFound.sense] });
      }

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
      // rare harvests hide their essence — only a sensing Gu can gather them
      if (node.rare && !exploreActive(state).sense) {
        return { ...state, log: [...state.log, T('gather.rareHidden', { name: locResourceName(node) })] };
      }
      const nightBonus = phaseOf((state.time || {}).min) === 'night' ? (BALANCE.time.nightGatherBonus[node.type] || 0) : 0;
      const qty = 1 + nightBonus + gatherBonus(state) + (Math.random() < state.player.perception * 0.01 ? 1 : 0);
      let s = applyEffects(state, { items: { [node.type]: qty }, message: T('gather.gathered', { qty, name: locResourceName(node) }) });
      s = { ...s, worldState: { ...s.worldState, gathered: { ...s.worldState.gathered, [node.id]: Date.now() } } };
      s = withQuestEvents(s, { type: 'ITEM_COLLECTED', id: node.type, qty });
      return advanceTime(s, BALANCE.time.gatherMinutes);
    }

    case 'ATTACK_ENEMY': {
      if (busy(state)) return state;
      const p = state.player;
      const e = (state.worldState.enemies || []).find(en => !en.dead && Math.abs(en.x - p.x) + Math.abs(en.y - p.y) === 1);
      if (!e) return state;
      const def = ENEMY_BY_ID[e.defId];
      const carry = carryIntoCombat(state, e);
      // ambush: striking an unaware foe (or one you are veiled from) opens its guard
      const amb = ambushOf(state, e, true);
      const pack = nearbyPackCount(state, e.defId, e.x, e.y, e.id);
      const combat = initCombat(e.defId, p, {
        hp: e.hp, stability: e.stability, statuses: carry.statuses, playerStatuses: carry.playerStatuses,
        worldId: e.id, difficulty: state.difficulty, zoneId: zoneAt(p.x, p.y)?.id,
        ambush: amb.amb, allies: pack, scouted: !!exploreActive(state).vision,
        intro: amb.amb === 'player' ? T('cmt.ambushIntroPlayer', { enemy: locEnemyName(def) }) : T('cmt.strikeFirst', { enemy: locEnemyName(def) }),
      });
      // the pack answers: same-species kin nearby converge on the fight
      let s = { ...state, combat };
      if (pack) {
        s = { ...s, worldState: { ...s.worldState, enemies: (s.worldState.enemies || []).map(o =>
          (!o.dead && o.id !== e.id && o.defId === e.defId && Math.abs(o.x - e.x) <= 3 && Math.abs(o.y - e.y) <= 3)
            ? { ...o, state: 'chase' } : o) } };
      }
      return s;
    }

    case 'SLEEP_INN': {
      if (busy(state)) return state;
      const inn = INNS.find(i => i.id === action.innId);
      if (!inn) return state;
      const p = state.player;
      const cost = Math.max(1, Math.round(inn.cost * diffOf(state).priceMul));
      if (p.spiritStones < cost) return { ...state, log: [...state.log, T('inn.noStones', { cost })] };
      // sleep restores HP (not essence) and includes one free morning meal
      let s = applyEffects(state, {
        hp: p.maxHp, spiritStones: -cost,
        items: { [BALANCE.inn.mealItemId]: 1 },
        message: T('inn.rented', { cost }),
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
        log: [...s.log, T('inn.wake', { day: wake.day })],
      };
      return s;
    }
    case 'WAKE':
      return { ...state, sleeping: null };

    case 'REST_CAMP': {
      if (state.combat || state.recovery) return state;
      const p = state.player;
      let s = advanceTime(applyEffects(state, { hp: Math.floor(p.maxHp * 0.35), message: T('camp.rest') }), BALANCE.time.campRestMinutes);
      if (s.player.primevalEssence < s.player.maxPrimevalEssence) {
        s = { ...s, recovery: { mode: 'camp', startedAt: Date.now() }, log: [...s.log, T('camp.recovery')] };
      }
      return s;
    }

    case 'USE_FORMATION': {
      if (state.combat || state.recovery) return state;
      return advanceTime({ ...state, log: [...state.log, T('wld.formation')] }, BALANCE.time.talkMinutes);
    }

    case 'TALK_NPC': {
      if (state.combat || state.recovery) return state;
      const npc = NPC_BY_ID[action.npcId];
      let s = syncMasterSteps({ ...state, dialogue: { npcId: action.npcId } });
      // Speaking with people is how knowledge spreads. A merchant openly
      // identifies what he sells; a found mentor is a reliable source for the
      // recipes he teaches. Neither reveals anything until met in person.
      if (npc?.shop?.recipes) for (const o of npc.shop.recipes) s = learnClue(s, o.recipeId, 'identified');
      if (npc?.mentor) {
        const m = MASTER_BY_ID[action.npcId];
        for (const step of m?.steps || []) for (const rid of step.grants?.recipes || []) s = learnClue(s, rid, 'located');
      }
      for (const qd of QUESTS) if (qd.giver === action.npcId) s = markDiscovered(s, qd.id);
      s = withQuestEvents(s, { type: 'NPC_TALKED', id: action.npcId });
      return advanceTime(s, BALANCE.time.talkMinutes);
    }
    case 'CLOSE_DIALOGUE':
      return { ...state, dialogue: null };

    // ---------- Trade ----------
    case 'BUY': {
      if (state.combat || state.recovery) return state;
      const npc = NPC_BY_ID[action.npcId];
      const offer = npc.shop.sells.find(o => o.itemId === action.itemId);
      if (!offer) return state;
      const qty = action.qty || 1;
      const total = shopPrice(offer.price * qty * (npc.shop.priceMul || 1), state);
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
      return advanceTime(applyEffects(state, { removeItems: { [action.itemId]: qty }, spiritStones: price, message: T('shop.sold', { qty, name: locItemName(ITEM_BY_ID[action.itemId]), price }) }), BALANCE.time.tradeMinutes);
    }

    // ---------- Rumors & intel ----------
    case 'BUY_INTEL': {
      if (state.combat || state.recovery) return state;
      const npc = NPC_BY_ID[action.npcId];
      const offer = (npc?.shop?.intel || []).find(o => o.id === action.offerId);
      if (!offer) return state;
      // never pay for what is already known (or owned outright)
      const already = state.knownRecipes.includes(offer.clue.recipeId)
        || ((CLUE_RANK[state.recipeKnowledge?.[offer.clue.recipeId]] || 0) >= (CLUE_RANK[offer.clue.level] || 0));
      if (already) return state;
      const total = shopPrice(offer.price, state);
      if (state.player.spiritStones < total) return { ...state, log: [...state.log, T('shop.noStonesWhisper')] };
      let s = { ...state, player: { ...state.player, spiritStones: state.player.spiritStones - total } };
      s = learnClue(s, offer.clue.recipeId, offer.clue.level);
      return advanceTime(s, BALANCE.time.tradeMinutes);
    }

    // ---------- Missions & contribution ----------
    case 'MISSION_ACCEPT': {
      if (state.combat || state.recovery) return state;
      const m = MISSION_BY_ID[action.missionId];
      if (!m || state.missions.active.includes(m.id) || state.missions.completed.includes(m.id)) return state;
      return advanceTime({ ...state, missions: { ...state.missions, active: [...state.missions.active, m.id] }, log: [...state.log, T('qs.missionAccepted', { name: locMissionName(m) })] }, BALANCE.time.tradeMinutes);
    }
    case 'MISSION_TURN_IN': {
      if (state.combat || state.recovery) return state;
      const m = MISSION_BY_ID[action.missionId];
      if (!m || !state.missions.active.includes(m.id) || !objectiveMet(state, m)) return state;
      let s = consumeForObjective(state, m);
      s = applyEffects(s, {
        ...(m.rewards || {}),
        contribution: (m.rewards && m.rewards.contribution) || 0,
        message: T('qs.missionDone', { name: locMissionName(m), c: (m.rewards && m.rewards.contribution) || 0 }),
      });
      s = { ...s, missions: { ...s.missions, active: s.missions.active.filter(id => id !== m.id), completed: [...s.missions.completed, m.id] } };
      return advanceTime(s, BALANCE.time.tradeMinutes);
    }
    case 'BUY_CONTRIBUTION': {
      if (state.combat || state.recovery) return state;
      const offer = CONTRIBUTION_OFFERS.find(o => o.id === action.offerId);
      if (!offer) return state;
      const contrib = (state.contribution && state.contribution.greenValley) || 0;
      if (contrib < offer.cost) return { ...state, log: [...state.log, T('shop.noContribution')] };
      if (offer.grant.recipe && state.knownRecipes.includes(offer.grant.recipe)) return state;
      if (offer.req) {
        if (offer.req.stageReq !== undefined && globalStage(state.player) < offer.req.stageReq)
          return { ...state, log: [...state.log, T('shop.needStage')] };
        if (offer.req.mastery && (state.mastery?.[offer.req.mastery.path]?.level || 1) < offer.req.mastery.level)
          return { ...state, log: [...state.log, T('shop.needMastery')] };
      }
      let s = { ...state, contribution: { ...state.contribution, greenValley: contrib - offer.cost } };
      if (offer.grant.recipe) s = learnRecipe(s, offer.grant.recipe);
      if (offer.grant.items) s = applyEffects(s, { items: offer.grant.items, message: T('shop.contribExchanged', { name: locContribName(offer), cost: offer.cost }) });
      else s = { ...s, log: [...s.log, T('shop.contribExchanged', { name: locContribName(offer), cost: offer.cost })] };
      return s;
    }

    // ---------- Arena ----------
    case 'ARENA_FIGHT': {
      if (busy(state)) return state;
      const ch = ARENA_BY_ID[action.challengeId];
      if (!ch) return state;
      if (state.player.spiritStones < ch.stake) return { ...state, log: [...state.log, T('arena.needStake', { n: ch.stake })] };
      let s = applyEffects(state, { spiritStones: -ch.stake, message: T('arena.stakePosted', { n: ch.stake }) });
      s = {
        ...s,
        combat: initCombat(null, s.player, {
          def: ch.opponent,
          difficulty: s.difficulty,
          arena: { challengeId: ch.id, stake: ch.stake, opponentStake: ch.opponentStake },
          intro: T('arena.intro', { name: locArenaOpponentName(ch) }),
        }),
      };
      return advanceTime(s, BALANCE.time.arenaMinutes);
    }

    // ---------- Mentors / masters ----------
    case 'MASTER_CLAIM': {
      if (busy(state)) return state;
      const m = MASTER_BY_ID[action.masterId];
      const ms = (state.masters || {})[m?.id];
      if (!m || !ms?.found) return state;
      const step = m.steps[ms.step];
      if (!step || step.kind !== 'req') return state;
      const list = reqChecks(state, step.req);
      if (!list.ok) return { ...state, log: [...state.log, T('master.noReq')] };
      let s = applyEffects(state, step.grants || {});
      s = syncMasterSteps({ ...s, masters: { ...s.masters, [m.id]: { ...ms, step: ms.step + 1 } } });
      return advanceTime(s, BALANCE.time.talkMinutes);
    }
    case 'MASTER_DUEL': {
      if (busy(state)) return state;
      const m = MASTER_BY_ID[action.masterId];
      const ms = (state.masters || {})[m?.id];
      if (!m || !ms?.found) return state;
      const step = m.steps[ms.step];
      if (!step || step.kind !== 'duel') return state;
      const tr = step.trial;
      return {
        ...state,
        combat: initCombat(null, state.player, {
          def: tr.def,
          difficulty: state.difficulty,
          trial: { masterId: m.id, stepIndex: ms.step, type: tr.type, turns: tr.turns, amount: tr.amount },
          intro: tr.intro,
        }),
        log: [...state.log, tr.intro || `${tr.def.name} awaits your trial.`],
      };
    }
    case 'BUY_GU': {
      if (state.combat || state.recovery) return state;
      const npc = NPC_BY_ID[action.npcId];
      if (!npc?.shop) return state;
      const offers = [...(npc.shop.gu || [])];
      const rot = guOfferOf(npc, state);
      if (rot) offers.push(rot);
      const offer = offers.find(o => o.guId === action.guId);
      if (!offer) return state;
      if (state.ownedGu.some(g => g.guId === offer.guId)) return state; // one of each
      const total = shopPrice(offer.price, state);
      if (state.player.spiritStones < total) return state;
      let s = { ...state, player: { ...state.player, spiritStones: state.player.spiritStones - total } };
      s = applyEffects(s, { giveGu: offer.guId });
      return advanceTime(s, BALANCE.time.tradeMinutes);
    }

    // ---------- Gu ----------
    case 'EQUIP_GU': {
      if (state.player.equippedGu.includes(action.instanceId)) return state;
      if (state.player.equippedGu.length >= 6) return state;
      return { ...state, player: { ...state.player, equippedGu: [...state.player.equippedGu, action.instanceId] } };
    }
    case 'UNEQUIP_GU':
      return { ...state, player: { ...state.player, equippedGu: state.player.equippedGu.filter(id => id !== action.instanceId) } };

    // ---------- Exploration Gu ----------
    case 'USE_EXPLORE_GU': {
      if (busy(state)) return state;
      const inst = state.ownedGu.find(g => g.instanceId === action.instanceId);
      const res = inst ? applyExploreGu(state, inst) : null;
      if (!res || !res.ok) return { ...state, log: [...state.log, res ? res.reason : 'No such Gu.'] };
      let s = res.state;
      if (res.toast) s = pushToast(s, res.toast);
      return advanceTime(s, BALANCE.time.talkMinutes);
    }

    // ---------- Saved loadout presets ----------
    case 'SAVE_LOADOUT': {
      const loadouts = [...(state.loadouts || [])];
      if (loadouts.length >= 3) return { ...state, log: [...state.log, T('lo.full')] };
      if (!state.player.equippedGu.length) return state;
      const name = (action.name || '').trim().slice(0, 18) || `Loadout ${loadouts.length + 1}`;
      loadouts.push({ id: `lo_${Date.now().toString(36)}`, name, guIds: [...state.player.equippedGu] });
      return { ...state, loadouts, log: [...state.log, T('lo.saved', { name, n: state.player.equippedGu.length })] };
    }
    case 'APPLY_LOADOUT': {
      const lo = (state.loadouts || []).find(l => l.id === action.loadoutId);
      if (!lo) return state;
      // presets only re-equip Gu that still exist in the collection
      const owned = new Set(state.ownedGu.map(g => g.instanceId));
      const guIds = lo.guIds.filter(id => owned.has(id));
      return { ...state, player: { ...state.player, equippedGu: guIds }, log: [...state.log, T('lo.applied', { name: lo.name, n: guIds.length })] };
    }
    case 'DELETE_LOADOUT':
      return { ...state, loadouts: (state.loadouts || []).filter(l => l.id !== action.loadoutId) };

    case 'REFINE_RECIPE': {
      if (state.combat || state.recovery) return state;
      const r = RECIPE_BY_ID[action.recipeId];
      const list = refineChecklist(state, action.recipeId);
      if (!r || !state.knownRecipes.includes(r.id)) return state;
      if (!list.ok) return { ...state, log: [...state.log, T('refine.cannot')] };
      const p = state.player;
      const refFx = bonusOf(state, 'refinement');
      let s = applyEffects(state, {
        essence: -list.essenceCost,
        spiritStones: -r.stones,
        removeItems: r.materials,
      });
      const chance = Math.min(95, BALANCE.refinement.baseSuccess + p.intelligence * BALANCE.refinement.successPerInt + Math.floor(p.luck * BALANCE.refinement.successPerLuck) + (refFx.successPct || 0) + diffOf(state).refinePct);
      if (Math.random() * 100 < chance) {
        s = applyEffects(s, { giveGu: r.guId, message: T('refine.recipeOk', { gu: locGuName(GU_BY_ID[r.guId]) }) });
        s = withQuestEvents(s, { type: 'GU_REFINED', id: r.guId });
        s = grantMastery(s, 'refinement', BALANCE.mastery.xpRefineSuccess, 'refined', 'refine');
        s = grantMastery(s, r.path, Math.round(BALANCE.mastery.xpRefineSuccess * 0.6), 'refined', 'refine');
        if (Math.random() * 100 < (refFx.saveChancePct || 0)) {
          const firstMat = Object.keys(r.materials)[0];
          if (firstMat) s = applyEffects(s, { items: { [firstMat]: 1 }, message: T('refine.recipeKeep', { name: locItemName(ITEM_BY_ID[firstMat]) }) });
        }
      } else {
        s = { ...s, log: [...s.log, T('refine.recipeFail')] };
        s = grantMastery(s, 'refinement', BALANCE.mastery.xpRefineFail, 'refined', 'refine');
      }
      return advanceTime(s, BALANCE.time.refineMinutes);
    }

    // ---------- Cultivation ----------
    case 'CULTIVATE': {
      if (state.combat) return state;
      // recovery is a deliberate activity that blocks cultivation — never a silent ignore
      if (state.recovery) return { ...state, log: [...state.log, T('cult.blockedRecovery')] };
      const cfg = BALANCE.cultivation;
      const p = state.player;
      const cost = cfg.essenceCostBase + cfg.essenceCostPerStage * (p.rank * 4 + (p.stage || 0));
      if (p.primevalEssence < cost) return { ...state, log: [...state.log, T('cult.noEssence')] };
      const atSect = WORLD.tiles[p.y] && WORLD.tiles[p.y][p.x] === '*';
      const gain = Math.min(cfg.progressCap, Math.floor((cfg.progressBase + p.intelligence * cfg.progressPerInt) * cultivateMulOf(p.aptitude) * (atSect ? cfg.sectBonus : 1)));
      const progress = Math.min(100, (p.cultivationProgress || 0) + gain);
      const np = {
        ...p,
        primevalEssence: p.primevalEssence - cost,
        cultivationProgress: progress,
        totalInsight: (p.totalInsight || 0) + gain,
      };
      let s = { ...state, player: np, log: [...state.log, atSect ? T('cult.cultivatedTerrace', { gain }) : T('cult.cultivated', { gain })] };
      // the moment the aperture fills, a milestone alert fires
      if (progress >= 100 && (p.cultivationProgress || 0) < 100) {
        s = pushToast(s, { icon: '✦', title: T('toast.breakthroughReady'), lines: [T('cult.breakthroughReady1'), T('cult.breakthroughReady2')] });
      }
      return advanceTime(s, BALANCE.time.cultivateMinutes);
    }

    // ---------- Secluded cultivation (closed-door training) ----------
    // One click compresses the cultivate → recover grind into a batch of
    // sessions separated by nights of deep meditation. All per-session
    // balance is honored (essence cost, progress gain, terrace bonus) and
    // the whole span is paid in game time via advanceTime (days pass, Gu
    // hunger ticks) — only the real-time waiting is removed.
    case 'SECLUDE': {
      if (busy(state)) return state;
      const p = state.player;
      const g = globalStage(p);
      if (g >= 19) return state;
      if ((p.cultivationProgress || 0) >= 100) return { ...state, log: [...state.log, T('cult.secludeFull')] };
      if (!(zoneAt(p.x, p.y) || DEFAULT_ZONE).safe) return { ...state, log: [...state.log, T('cult.secludeNeedTown')] };
      const cfg = BALANCE.cultivation;
      const cost = cfg.essenceCostBase + cfg.essenceCostPerStage * g;
      const atSect = WORLD.tiles[p.y] && WORLD.tiles[p.y][p.x] === '*';
      const t = state.time || { day: BALANCE.time.startDay, min: BALANCE.time.startMinutes };
      const startAbs = t.day * 1440 + t.min;
      let abs = startAbs;
      let progress = p.cultivationProgress || 0;
      let essence = p.primevalEssence;
      let insight = p.totalInsight || 0;
      let sessions = 0, nights = 0;
      while (progress < 100 && nights < 10) {
        while (progress < 100 && essence >= cost) {
          const gain = Math.min(cfg.progressCap, Math.floor((cfg.progressBase + p.intelligence * cfg.progressPerInt) * cultivateMulOf(p.aptitude) * (atSect ? cfg.sectBonus : 1)));
          if (gain <= 0) break;
          progress = Math.min(100, progress + gain);
          essence -= cost;
          insight += gain;
          sessions++;
          abs += BALANCE.time.cultivateMinutes;
        }
        if (progress >= 100) break;
        // a night of deep meditation refills the aperture by morning
        const dayStart = Math.floor(abs / 1440) * 1440;
        let wake = dayStart + BALANCE.time.sleepToMinutes;
        if (wake <= abs) wake += 1440;
        abs = wake;
        essence = p.maxPrimevalEssence;
        nights++;
      }
      if (progress >= 100 && essence < p.maxPrimevalEssence) {
        // one final night: emerge with a full aperture so the breakthrough
        // requirements (essence held) are always met on the spot
        const dayStart = Math.floor(abs / 1440) * 1440;
        let wake = dayStart + BALANCE.time.sleepToMinutes;
        if (wake <= abs) wake += 1440;
        abs = wake;
        essence = p.maxPrimevalEssence;
        nights++;
      }
      let s = { ...state, player: { ...p, primevalEssence: essence, cultivationProgress: progress, totalInsight: insight } };
      s = advanceTime(s, abs - startAbs);
      s = { ...s, log: [...s.log, atSect ? T('cult.secluded', { sessions, nights, progress: Math.floor(progress) }) : T('cult.secludedPlain', { sessions, nights, progress: Math.floor(progress) })] };
      if (progress >= 100 && (p.cultivationProgress || 0) < 100) {
        s = pushToast(s, { icon: '🏯', title: T('toast.seclude'), lines: [T('cult.secludeToast1', { sessions, nights }), T('cult.secludeToast2')] });
      }
      return s;
    }

    case 'BREAKTHROUGH': {
      if (busy(state)) return state;
      const p = state.player;
      const g = globalStage(p);
      if (g >= 19) return state;
      const list = breakthroughChecklist(state);
      if (!list.ok) return { ...state, log: [...state.log, T('cult.notReady')] };
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
      np.maxPrimevalEssence = essenceCapFor(st.maxEssence, np.aptitude);
      np.primevalEssence = np.maxPrimevalEssence; // fully restored
      const statGain = major ? 2 : 1;
      np.strength += statGain; np.agility += statGain; np.perception += statGain; np.intelligence += statGain;
      s = {
        ...s,
        player: np,
        breakthrough: { major, name: locStageName(st) },
        log: [...s.log, major ? T('cult.majorOk', { stage: locStageName(st) }) : T('cult.minorOk', { stage: locStageName(st) })],
      };
      return s;
    }
    case 'DISMISS_BREAKTHROUGH':
      return { ...state, breakthrough: null };

    // ---------- Game clock ----------
    case 'TIME_TICK': {
      let s = advanceTime(state, BALANCE.time.minutesPerTick);
      // wounded world enemies slowly mend — never instantly (BALANCE.combat.regen)
      s = regenWorldEnemies(s, BALANCE.time.minutesPerTick);
      s = { ...s, playtimeSec: (s.playtimeSec || 0) + BALANCE.time.tickMs / 1000 };
      return s;
    }

    // ---------- Essence recovery ----------
    case 'START_RECOVERY': {
      if (state.combat || state.recovery) return state;
      const p = state.player;
      if (p.primevalEssence >= p.maxPrimevalEssence) return state;
      let s = state;
      let accelCost = 0;
      if (action.mode === 'accelerated') {
        accelCost = recoveryCosts(p).accelerated;
        if (p.spiritStones < accelCost) return { ...state, log: [...state.log, T('rec.noStones')] };
        s = { ...s, player: { ...p, spiritStones: p.spiritStones - accelCost } };
      }
      return { ...s, recovery: { mode: action.mode, startedAt: Date.now() }, log: [...s.log, action.mode === 'accelerated' ? T('rec.accel', { cost: accelCost }) : T('rec.slow')] };
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
        log: done ? [...state.log, T('rec.done')] : state.log,
      }, BALANCE.time.recoveryMinutesPerTick);
    }
    case 'RECOVERY_INTERRUPTED': {
      if (!state.recovery) return state;
      const e = (state.worldState.enemies || []).find(en => en.id === action.enemyId && !en.dead);
      if (!e) return { ...state, recovery: null };
      const def = ENEMY_BY_ID[e.defId];
      const carry = carryIntoCombat(state, e);
      const amb = ambushOf(state, e, false);
      const intro = amb.amb === 'enemy'
        ? T('rec.ambushInterrupt', { enemy: locEnemyName(def) })
        : T('rec.interrupt', { enemy: locEnemyName(def) });
      return {
        ...state,
        recovery: null,
        combat: initCombat(e.defId, state.player, {
          hp: e.hp, stability: e.stability, statuses: carry.statuses, playerStatuses: carry.playerStatuses,
          worldId: e.id, difficulty: state.difficulty, zoneId: zoneAt(state.player.x, state.player.y)?.id,
          ambush: amb.amb, scouted: !!exploreActive(state).vision, intro,
        }),
        log: [...state.log, intro],
      };
    }
    case 'CANCEL_RECOVERY':
      if (!state.recovery) return state;
      return { ...state, recovery: null, log: [...state.log, T('rec.cancel')] };
    case 'INSTANT_RECOVERY': {
      const p = state.player;
      const costs = recoveryCosts(p);
      if (costs.missing <= 0) return state;
      if (p.spiritStones < costs.instant) return { ...state, log: [...state.log, T('rec.noStonesInstant')] };
      return {
        ...state,
        player: { ...p, spiritStones: p.spiritStones - costs.instant, primevalEssence: p.maxPrimevalEssence },
        recovery: null,
        log: [...state.log, T('rec.instant', { n: costs.instant })],
      };
    }

    // ---------- Items / quests / events ----------
    case 'USE_ITEM': {
      if (state.combat || state.recovery) return state;
      const it = ITEM_BY_ID[action.itemId];
      if (!it || !it.use) return state;
      if ((state.inventory[it.category]?.[action.itemId] || 0) <= 0) return state;
      // meals are sit-down fare — only eaten where it is safe to sit
      if (it.role === 'meal' && !(zoneAt(state.player.x, state.player.y) || DEFAULT_ZONE).safe) {
        return { ...state, log: [...state.log, T('item.mealOnly', { name: locItemName(it) })] };
      }
      return applyEffects(state, {
        hp: it.use.hp || 0, essence: it.use.essence || 0,
        foodBuff: it.use.buff || null,
        removeItems: { [action.itemId]: 1 }, message: T('item.used', { name: locItemName(it) }),
      });
    }

    case 'ACCEPT_QUEST': {
      if (state.combat || state.recovery) return state;
      const q = QUEST_BY_ID[action.questId];
      if (!q) return state;
      const res = acceptQuest(state, action.questId);
      if (res.state === state) return state;
      let s = res.state;
      s = pushToast(s, { icon: '📜', title: T('toast.questAccepted'), lines: [locQuestName(q), T('qs.giver', { name: NPC_BY_ID[q.giver]?.name || q.giver }), res.autoTracked ? T('qs.trackedNow') : T('qs.trackHint')] });
      return syncMasterSteps({ ...s, log: [...s.log, T('qs.accepted', { name: locQuestName(q) })] });
    }
    case 'TURN_IN_QUEST': {
      if (state.combat || state.recovery) return state;
      const q = QUEST_BY_ID[action.questId];
      const res = turnInQuest(state, action.questId);
      if (res.state === state) return state;
      let s = applyEffects(res.state, { ...(q.rewards || {}), message: locQuestRewardMsg(q) || undefined, ...(Object.keys(res.removeItems).length ? { removeItems: res.removeItems } : {}) });
      s = pushToast(s, { icon: '🎉', title: T('toast.questComplete'), lines: [locQuestName(q), locQuestRewardMsg(q) || T('qs.rewards')] });
      return syncMasterSteps(s);
    }
    case 'TRACK_QUEST': {
      const s = toggleTrack(state, action.questId);
      return s === state ? state : s;
    }
    case 'ABANDON_QUEST': {
      const q = QUEST_BY_ID[action.questId];
      const s = abandonQuest(state, action.questId);
      if (s === state) return state;
      return { ...s, log: [...s.log, T('qs.abandoned', { name: q ? locQuestName(q) : '?' })] };
    }
    case 'QUEST_CHOICE': {
      if (state.combat || state.recovery) return state;
      const q = QUEST_BY_ID[action.questId];
      const choice = q.choices[action.choiceIndex];
      const rec = state.quests.byId?.[action.questId];
      if (!choice || !rec || rec.status !== QS.ACTIVE) return state;
      let s = applyEffects(state, choice.effects);
      const quests = s.quests;
      const byId = { ...quests.byId, [action.questId]: { ...rec, status: QS.COMPLETED } };
      s = { ...s, quests: { ...quests, byId, order: (quests.order || []).filter(id => id !== action.questId), tracked: (quests.tracked || []).filter(id => id !== action.questId) } };
      return syncMasterSteps(s);
    }

    // ---------- Combat ----------
    case 'PLAYER_ACTION': {
      if (state.recovery) return state;
      let s = executeRound(state, { type: action.action, guInstanceId: action.guInstanceId, itemId: action.itemId });
      // the first clash records the foe in your bestiary
      if (state.combat && !state.combat.seen && ENEMY_BY_ID[state.combat.enemyId]) {
        const b = { ...(state.bestiary || {}) };
        const prev = b[state.combat.enemyId] || { seen: 0, kills: 0 };
        b[state.combat.enemyId] = { seen: prev.seen + 1, kills: prev.kills };
        s = { ...s, bestiary: b, combat: { ...s.combat, seen: true } };
      }
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
      // world bookkeeping — the exact combat state (HP, guard, lingering wounds,
      // last-combat time) survives a flee or an interrupted battle; only a kill
      // (respawn timer) or natural regen ever returns a foe to full strength.
      s = persistCombatEnemyState(s, c);
      // quest events — a valid kill and its loot advance objectives (flees never count)
      if (c.result === 'victory') {
        s = withQuestEvents(s, { type: 'ENEMY_KILLED', id: c.enemyId });
        for (const [lootId, lootQty] of Object.entries(c.rewards?.items || {})) s = withQuestEvents(s, { type: 'ITEM_COLLECTED', id: lootId, qty: lootQty });
        if (c.arena) s = withQuestEvents(s, { type: 'ARENA_WON' });
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
      // master trial resolution — pass (survive / damage objective) grants the teaching
      if (c.trial) {
        const m = MASTER_BY_ID[c.trial.masterId];
        const ms = (s.masters || {})[c.trial.masterId];
        if (m && ms && (c.result === 'trial' || c.result === 'victory')) {
          const step = m.steps[c.trial.stepIndex];
          s = applyEffects(s, step.grants || {});
          s = syncMasterSteps({
            ...s,
            masters: {
              ...s.masters,
              [m.id]: { ...ms, duels: { ...(ms.duels || {}), [c.trial.stepIndex]: true }, step: (ms.step || 0) + 1 },
            },
          });
        } else {
          s = { ...s, log: [...s.log, 'The trial ends in failure. The master waits — you may try again.'] };
        }
      }
      return s;
    }

    case 'CHOOSE_EVENT': {
      const ev = EVENT_BY_ID[state.pendingEvent];
      const opt = ev.options[action.optionIndex];
      let s = applyEffects(state, { ...opt.effects, message: locEventMsg(ev, action.optionIndex) || undefined });
      const pending = s._pendingCombat;
      delete s._pendingCombat;
      s = { ...s, pendingEvent: null };
      if (pending) s = { ...s, combat: initCombat(pending, s.player, { difficulty: s.difficulty }) };
      return s;
    }
    case 'CLOSE_EVENT':
      return { ...state, pendingEvent: null };

    // ---------- Wild Gu encounters ----------
    case 'ENCOUNTER_WILD_GU': {
      if (state.wildEncounter) return state;
      const wg = (state.worldState.wildGu || []).find(w => w.id === action.worldId && !w.gone);
      if (!wg) return state;
      return advanceTime({ ...state, wildEncounter: { worldId: wg.id, observed: false } }, BALANCE.time.talkMinutes);
    }
    case 'ENCOUNTER_OBSERVE': {
      const e = state.wildEncounter;
      if (!e || e.observed) return state;
      return advanceTime({ ...state, wildEncounter: { ...e, observed: true } }, 5);
    }
    case 'ENCOUNTER_LEAVE':
      return { ...state, wildEncounter: null };
    case 'ENCOUNTER_CAPTURE': {
      const e = state.wildEncounter;
      if (!e) return state;
      const wg = (state.worldState.wildGu || []).find(w => w.id === e.worldId && !w.gone);
      if (!wg) return { ...state, wildEncounter: null };
      const sp = SPECIES_BY_ID[wg.speciesId];
      if (action.itemId) {
        const jar = ITEM_BY_ID[action.itemId];
        if (!jar || (state.inventory[jar.category]?.[jar.id] || 0) <= 0) return state;
      }
      const chance = captureChanceOf(state, wg, e, action.itemId);
      let s = action.itemId ? applyEffects(state, { removeItems: { [action.itemId]: 1 } }) : state;
      if (Math.random() * 100 < chance) {
        s = applyEffects(s, { giveGu: sp.guId, message: T('cap.ok', { name: locSpeciesName(sp) }) });
        s = withQuestEvents(s, { type: 'GU_CAPTURED', id: sp.guId });
        s = wildGuAfterEncounter(s, wg.id, true);
        s = pushToast(s, { icon: '🐉', title: T('toast.wildCaptured'), lines: [T('cap.joins', { name: locSpeciesName(sp) }), T('cap.feedsOn', { food: ITEM_BY_ID[sp.foodType] ? locItemName(ITEM_BY_ID[sp.foodType]) : sp.foodType })] });
        return advanceTime({ ...s, wildEncounter: null }, BALANCE.capture.attemptMinutes);
      }
      if (sp.behavior === 'passive' && Math.random() * 100 < BALANCE.capture.fleeChance) {
        s = wildGuAfterEncounter(s, wg.id, true);
        s = { ...s, log: [...s.log, T('cap.fled', { name: locSpeciesName(sp) })] };
        return advanceTime({ ...s, wildEncounter: null }, BALANCE.capture.attemptMinutes);
      }
      return advanceTime({ ...s, wildEncounter: null, combat: initCombat(null, s.player, { def: wildCombatDef(sp), difficulty: s.difficulty, wildGuId: wg.id, hp: wg.hp, intro: T('cap.brokeFree', { name: locSpeciesName(sp) }) }) }, BALANCE.capture.attemptMinutes);
    }
    case 'ENCOUNTER_ATTACK': {
      const e = state.wildEncounter;
      if (!e) return state;
      const wg = (state.worldState.wildGu || []).find(w => w.id === e.worldId && !w.gone);
      if (!wg) return { ...state, wildEncounter: null };
      const sp = SPECIES_BY_ID[wg.speciesId];
      return { ...state, wildEncounter: null, combat: initCombat(null, state.player, { def: wildCombatDef(sp), difficulty: state.difficulty, wildGuId: wg.id, hp: wg.hp, intro: T('cap.attackIntro', { name: locSpeciesName(sp) }) }) };
    }

    // ---------- Gu feeding & care ----------
    case 'FEED_GU': {
      const inst = state.ownedGu.find(g => g.instanceId === action.instanceId);
      const it = ITEM_BY_ID[action.itemId];
      if (!inst || !it || action.itemId !== foodOf(GU_BY_ID[inst.guId])) return state;
      if ((state.inventory[it.category]?.[it.id] || 0) <= 0) return state;
      let s = applyEffects(state, { removeItems: { [it.id]: 1 }, message: T('gl.fed', { name: locGuName(GU_BY_ID[inst.guId]) }) });
      s = { ...s, ownedGu: s.ownedGu.map(g => g.instanceId === inst.instanceId ? { ...g, satiety: BALANCE.hunger.maxSatiety, criticalSinceDay: null, warnDay: null } : g) };
      return advanceTime(s, BALANCE.time.talkMinutes);
    }
    case 'TOGGLE_AUTO_FEED': {
      const autoFeed = !(state.settings?.autoFeed);
      return { ...state, settings: { ...(state.settings || {}), autoFeed }, log: [...state.log, autoFeed ? T('gl.autoOn') : T('gl.autoOff')] };
    }
    case 'CURE_GU': {
      const inst = state.ownedGu.find(g => g.instanceId === action.instanceId);
      if (!inst || (state.inventory.guGear?.restorationPellet || 0) <= 0) return state;
      let s = applyEffects(state, { removeItems: { restorationPellet: 1 }, message: T('gl.cured', { name: locGuName(GU_BY_ID[inst.guId]) }) });
      s = { ...s, ownedGu: s.ownedGu.map(g => g.instanceId === inst.instanceId ? { ...g, injuredUntilDay: 0, injurySeverity: null, refineBlockedUntilDay: 0 } : g) };
      return advanceTime(s, BALANCE.time.talkMinutes);
    }

    // ---------- Vital Gu (Cổ Bản Mệnh) ----------
    case 'SET_VITAL_GU': {
      const inst = state.ownedGu.find(g => g.instanceId === action.instanceId);
      if (!inst || state.vitalGu === inst.instanceId) return state;
      const cfg = BALANCE.vital;
      const day = state.time?.day || 1;
      const cooldownEnd = (state.vitalSwitchDay ?? -99) + cfg.switchCooldownDays;
      if (day < cooldownEnd) {
        return { ...state, log: [...state.log, T('vit.cd', { n: cooldownEnd - day })] };
      }
      const gu = GU_BY_ID[inst.guId];
      const prev = state.vitalGu ? state.ownedGu.find(g => g.instanceId === state.vitalGu) : null;
      // The FIRST bond is stable from the very start — instability follows only
      // a re-binding that replaces an existing Vital Gu (explicit cause).
      const switching = !!prev;
      let s = { ...state, vitalGu: inst.instanceId, vitalSwitchDay: day };
      if (switching) s = startInstability(s, 'switched', cfg.switchPenaltyPct, cfg.switchPenaltyDays * 24 * 60);
      s = pushToast(s, {
        icon: '🩸', title: T('toast.vital'),
        lines: [
          T('vit.bound', { gu: locGuName(gu) }),
          ...(prev ? [T('vit.released', { gu: locGuName(GU_BY_ID[prev.guId]) })] : []),
          switching
            ? T('vit.causeSwitch', { p: cfg.switchPenaltyPct, d: cfg.switchPenaltyDays })
            : T('vit.stableLine'),
        ],
      });
      s = { ...s, log: [...s.log, switching
        ? T('vit.reboundLog', { gu: locGuName(gu), p: cfg.switchPenaltyPct, d: cfg.switchPenaltyDays })
        : T('vit.firstLog', { gu: locGuName(gu) })] };
      return advanceTime(s, BALANCE.time.talkMinutes);
    }

    // ---------- Gu rank-up refinement (risky) ----------
    case 'REFINE_GU': {
      const inst = state.ownedGu.find(g => g.instanceId === action.instanceId);
      if (!inst) return state;
      const gu = GU_BY_ID[inst.guId];
      const cfg = BALANCE.guRefine;
      const list = refineGuChecklist(state, inst);
      if (!list.ok) return { ...state, log: [...state.log, T('refinegu.refused')] };
      const day = state.time?.day || 1;
      let s = applyEffects(state, { essence: -list.essenceCost, spiritStones: -list.stonesCost, removeItems: list.materials });
      if (Math.random() * 100 < list.chance) {
        s = { ...s, ownedGu: s.ownedGu.map(g => g.instanceId === inst.instanceId ? { ...g, rank: list.target } : g) };
        s = withQuestEvents(s, { type: 'GU_REFINED', id: gu.id });
        s = grantMastery(s, 'refinement', BALANCE.mastery.xpRefineSuccess, 'refined', 'refine');
        s = pushToast(s, { icon: '✦', title: T('toast.guRefined'), lines: [T('refinegu.ok', { gu: locGuName(gu), n: list.target }), T('refinegu.power', { p: cfg.rankPowerStep })] });
        s = { ...s, log: [...s.log, T('refinegu.okLog', { gu: locGuName(gu), n: list.target })] };
      } else {
        s = grantMastery(s, 'refinement', BALANCE.mastery.xpRefineFail, 'refined', 'refine');
        if (Math.random() * 100 >= cfg.injuryChance) {
          s = { ...s, log: [...s.log, T('refinegu.failSafe', { gu: locGuName(gu) })] };
        } else if (list.vital) {
          // the bond shields the Vital Gu: never death — a severe weakening instead
          s = { ...s, ownedGu: s.ownedGu.map(g => g.instanceId === inst.instanceId ? { ...g, injuredUntilDay: day + cfg.severeInjuryDays, injurySeverity: 'severe', refineBlockedUntilDay: day + cfg.refineBlockDays } : g) };
          s = startInstability(s, 'refinement', BALANCE.vital.refineRecoveryPct, cfg.severeInjuryDays * 24 * 60);
          s = pushToast(s, { icon: '🩹', title: T('toast.vitalWeakened'), lines: [T('refinegu.sevLine1', { gu: locGuName(gu), p: cfg.severeEffPct }), T('refinegu.sevLine2', { d: cfg.refineBlockDays }), T('vit.causeRefine', { p: BALANCE.vital.refineRecoveryPct, d: cfg.severeInjuryDays })] });
          s = { ...s, log: [...s.log, T('refinegu.sevLog', { gu: locGuName(gu), p: BALANCE.vital.refineRecoveryPct, d: cfg.severeInjuryDays })] };
        } else if (Math.random() * 100 < cfg.deathChance) {
          s = { ...s, ownedGu: s.ownedGu.filter(g => g.instanceId !== inst.instanceId), player: { ...s.player, equippedGu: s.player.equippedGu.filter(id => id !== inst.instanceId) } };
          s = pushToast(s, { icon: '☠', title: T('toast.guDestroyed'), lines: [T('refinegu.destroyedLine1', { gu: locGuName(gu) }), T('refinegu.destroyedLine2')] });
          s = { ...s, log: [...s.log, T('refinegu.destroyedLog', { gu: locGuName(gu) })] };
        } else {
          s = { ...s, ownedGu: s.ownedGu.map(g => g.instanceId === inst.instanceId ? { ...g, injuredUntilDay: day + cfg.injuryDays, injurySeverity: 'minor', refineBlockedUntilDay: day + cfg.injuryDays } : g) };
          s = pushToast(s, { icon: '🩹', title: T('toast.guInjured'), lines: [T('refinegu.injuredLine1', { gu: locGuName(gu), p: cfg.injuryEffPct }), T('refinegu.injuredLine2')] });
          s = { ...s, log: [...s.log, T('refinegu.injuredLog', { gu: locGuName(gu), p: cfg.injuryEffPct, d: cfg.injuryDays })] };
        }
      }
      return advanceTime(s, BALANCE.time.refineMinutes);
    }

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