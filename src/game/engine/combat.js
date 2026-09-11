// Turn-based combat engine — deliberately NOT real-time.
//
// ACTION ORDER: no rigid player→enemy alternation. Every combatant has a
// Speed; its next action comes after BASE/Speed time units. After the player
// acts, every enemy action due before the player's next move resolves in
// order — fast enemies act twice between player moves; a fast (or hastened)
// player double-acts. Speed buffs/debuffs, Action Advance (act sooner) and
// Action Delay (push the enemy back) reshape the visible TIMELINE live.
//
// MULTI-ENEMY PACK COMBAT (#1–#3, #13, #27): a battle holds an `enemies`
// array (a lone foe is simply a one-entry array). Each enemy keeps its own
// HP, GUARD (stability), statuses, telegraph, committed intent and action
// clock; the timeline interleaves all of them. Pack members that joined the
// fight carry their packId / packRole so leader buffs and morale apply.
//
// TARGETING (#14–#18): single-target actions hit the selected enemy; AoE
// kinds (all / cleave / chain / random) resolve via engine/targeting.js.
// Single-target power > per-target AoE power; AoE costs more essence (#42).
//
// GUARD (STABILITY): enemies carry a second pool. Basic Strikes and control
// Gu chip it; at zero the enemy is BROKEN — defense collapses, damage taken
// rises and its next action is thrown back. See BALANCE.combat.gauge / break.
//
// PACK LEADERS (#8–#12, #30, #31): while a leader lives its packmates fight
// under its leaderBuff; the leader may commit a Pack Howl that quickens the
// whole pack; when it falls, survivors suffer the morale debuff (LEADER_DOWN).
//
// PERSISTENCE: a fleeing (or interrupted) battle never resets a foe — see
// persistCombatEnemyState; HP only returns via natural regen or respawn.
import { GU_BY_ID, isKillerMove } from '../data/gu';
import { ENEMY_BY_ID } from '../data/enemies';
import { ITEM_BY_ID } from '../data/items';
import { PATH_BY_ID, SYNERGIES } from '../data/paths';
import { applyEffects, applyFoodBuff } from './effects';
import { mutateEssence, ESSENCE_REASON } from './essence';
import { grantMastery, bonusOf } from './mastery';
import { BALANCE, DIFFICULTIES } from '../config/balance';
import { applyDeath } from './death';
import { weatherOf, weatherModOf, weatherEffectLine } from './weather';
import { guCondition } from './guLife';
import { proficiencyOf, recordUse } from './proficiency';
import { SPECIES_BY_ID } from '../data/wildGu';
import { ecoOf } from '../data/enemies';
import { planIntent } from './intent';
import { terrainModsOf, TERRAIN_LABELS } from '../data/terrain';
import { LEADER_DOWN } from '../data/packs';
import { resolveTargets, targetKindOf } from './targeting';
import { kmCombatEntry, kmActivationOf, kmCdKey } from './killerMoves';
import { strengthFxOf, strengthLevelOf, forceOf } from './strength';
import { T, TL, locGuName, locEnemyName, locPathName, locItemName, locTerrainLabel } from '../i18n/tr';

const G = () => BALANCE.combat.gauge;

// ---- Speed & action scheduling ----
export function playerSpeedOf(p) { return G().playerBase + (p.agility || 0) * G().perAgi; }
export function enemySpeedOf(def) { return G().enemyBase + (def.speed || 5) * G().perEnemySpeed; }
export function maxStabilityOf(def) {
  const s = BALANCE.combat.stability;
  return s.base + (def.defense || 0) * s.perDefense;
}
// Haste/Slow statuses fold into one multiplier — powerful, but clamped so a
// speed build can never fully deny the enemy its turns.
export function speedMulOf(statuses) {
  let m = 1;
  for (const s of statuses || []) {
    if (s.type === 'haste' || s.type === 'momentum') m += (s.power || 0) / 100;
    else if (s.type === 'slow') m -= (s.power || 0) / 100;
  }
  return Math.max(G().speedMulMin, Math.min(G().speedMulMax, m));
}
const effSpeed = (base, statuses) => Math.max(20, Math.round(base * speedMulOf(statuses)));
const actDelay = (base, statuses) => G().act / effSpeed(base, statuses);
// push one enemy's action clock later (freeze-resist, Earth delay, GUARD break)
const delayEnemy = (combat, enemy, amt) => {
  if (combat.nextAct?.enemies) combat.nextAct.enemies[enemy.uid] += amt;
};
const dispOf = (e) => e.label || locEnemyName(ENEMY_BY_ID[e.defId] || e);

// ---- Damage ranges & crits ----
// Every damaging action rolls inside a visible min–max range (BALANCE), so
// damage is variable, never fixed. The battle UI shows these same ranges.
// STRENGTH PATH (LỰC ĐẠO) mastery gradually sharpens the basic Strike —
// visible in the same range the UI shows (never stronger than offensive Gu).
export function strikeRange(player, state) {
  const sc = BALANCE.combat.strike;
  const b = (player.rank || 0) * sc.perRank + Math.floor((player.strength || 0) * sc.perStr);
  const mul = 1 + (state ? (strengthFxOf(state).strikePct || 0) : 0) / 100;
  return { min: Math.max(1, Math.round((sc.min + b) * mul)), max: Math.max(1, Math.round((sc.max + b) * mul)), accuracy: sc.accuracy };
}

// LỰC THẾ (Strength Momentum): one stack per landing Strike / Strength Gu
// blow — capped; at the cap the log says so instead of silently stacking.
function gainForce(pSt, push) {
  const cap = BALANCE.strength.force.cap;
  if (forceOf(pSt) >= cap) { push(T('cmt.forceMax', { cap })); return; }
  pSt.push({ type: 'force', power: 1, duration: 999 });
  push(T('cmt.forceGain', { n: forceOf(pSt) }));
}
export function guAttackRange(gu) {
  const gv = BALANCE.combat.guDamage;
  const atk = gu?.effect?.attack || {};
  // an explicit [min, max] pair on the Gu is the designed damage window —
  // shown to the player everywhere and rolled inside, never fixed damage
  if (Array.isArray(atk.range)) return { min: Math.max(1, atk.range[0]), max: Math.max(1, atk.range[1]) };
  const power = atk.power || 0;
  return { min: Math.max(1, Math.floor(power * gv.minMul)), max: Math.max(1, Math.floor(power * gv.maxMul)) };
}
const rollIn = (r) => r.min + Math.floor(Math.random() * (r.max - r.min + 1));
// small crit system — some Gu carry their own odds (effect.attack.crit)
function critMulOf(gu) {
  const cc = BALANCE.combat.crit;
  const chance = gu?.effect?.attack?.crit ?? cc.baseChance;
  return Math.random() * 100 < chance ? cc.dmgMul : 1;
}

// Visible action order: simulate the schedule ahead so the player can plan.
// With a pack in the fight every enemy's clock interleaves (#27).
export function timelineOf(combat, n = 6) {
  const items = [];
  if (!combat?.nextAct) return items;
  const clocks = (combat.enemies || [])
    .filter(e => e.hp > 0)
    .map(e => ({ e, at: combat.nextAct.enemies[e.uid] ?? Infinity }));
  let tp = combat.nextAct.player;
  const pDelay = actDelay(combat.speeds.player, combat.playerStatuses);
  items.push({ uid: 'player', at: tp });
  tp += pDelay;
  let guard = 0;
  while (items.length < n && guard++ < 40) {
    clocks.sort((a, b) => a.at - b.at);
    const next = clocks[0];
    if (next && next.at <= tp) {
      items.push({ uid: next.e.uid, at: next.at, telegraph: !!next.e.telegraph });
      next.at += actDelay(next.e.baseSpeed, next.e.statuses);
    } else {
      items.push({ uid: 'player', at: tp });
      tp += pDelay;
    }
  }
  return items;
}

// Distinct tactical archetypes — inferred from the definition when unset.
function aiOf(def) {
  if (def.ai) return def.ai;
  if (def.abilities?.includes('poison')) return 'poisoner';
  if (def.charge) return 'brute';
  if ((def.speed || 5) <= 3) return 'brute';
  if ((def.speed || 5) >= 8) return 'skirmisher';
  return 'predator';
}

// Build ONE combatant from its world roster entry (its own def, HP, guard,
// pack identity and any control effects carried in from exploration).
function buildCombatant(r, idx, d, player, opts) {
  const def = r.def;
  const eco = ecoOf(def.id);
  const maxHp = Math.max(1, Math.round(def.hp * d.enemyHpMul));
  const startHp = Math.min(maxHp, Math.max(1, Math.round((r.hp ?? def.hp) * d.enemyHpMul)));
  const maxStab = maxStabilityOf(def);
  const statuses = (r.statuses || []).map(s => ({ ...s }));
  const eBase = enemySpeedOf(def);
  return {
    uid: `e${idx}`,
    ...def,
    activity: eco.activity,
    stabMul: eco.stabMul,
    stabWeakness: eco.stabWeakness,
    ambusher: eco.ambusher,
    attack: Math.max(1, Math.round(def.attack * d.enemyDmgMul)),
    maxHp, hp: startHp,
    baseSpeed: eBase,
    statuses,
    stability: Math.min(maxStab, Math.round((r.stability ?? maxStab))),
    maxStability: maxStab,
    ai: aiOf(def),
    aiCounters: {},
    telegraph: null,          // announced heavy move, executes on its next action
    planned: null,            // committed NEXT action — the Intent system
    worldId: r.worldId || null,
    packId: r.packId || null,
    packRole: r.packRole || null,
    packLeaderId: r.packLeaderId || null,
  };
}

export function initCombat(enemyId, player, opts = {}) {
  const def = opts.def || ENEMY_BY_ID[enemyId];
  const d = DIFFICULTIES[opts.difficulty] || DIFFICULTIES.standard;
  // ---- roster: the engaged foe, then any nearby pack members (#1–#3) ----
  const roster = [{
    def, hp: opts.hp, stability: opts.stability, statuses: opts.statuses, worldId: opts.worldId,
    packId: opts.packId, packRole: opts.packRole, packLeaderId: opts.packLeaderId,
  }];
  for (const m of opts.pack || []) {
    roster.push({
      def: ENEMY_BY_ID[m.defId], hp: m.hp, stability: m.stability, statuses: m.statuses,
      worldId: m.worldId, packId: m.packId, packRole: m.packRole, packLeaderId: m.packLeaderId,
    });
  }
  const ambush = opts.ambush === 'player' || opts.ambush === 'enemy' ? opts.ambush : null;
  const terrain = opts.zoneId ? terrainModsOf(opts.zoneId) : null;
  const log = [opts.intro || T('cmt.intro', { enemy: locEnemyName(def) })];

  // display labels — duplicate species get letter suffixes so the player can
  // tell "Wolf A" from "Wolf B" in the log, timeline and target strip (#13)
  const counts = {};
  for (const r of roster) counts[r.def.id] = (counts[r.def.id] || 0) + 1;
  const seen = {};
  const enemies = roster.map((r, idx) => {
    const c = buildCombatant(r, idx, d, player, opts);
    if ((counts[r.def.id] || 0) > 1) {
      const i = (seen[r.def.id] = (seen[r.def.id] ?? -1) + 1);
      const base = locEnemyName(r.def);
      c.label = `${base} ${String.fromCharCode(65 + i)}`;
      c.short = `${base.split(' ')[0]}${String.fromCharCode(65 + i)}`;
    } else {
      c.label = locEnemyName(r.def);
      c.short = locEnemyName(r.def).split(' ')[0];
    }
    return c;
  });

  // ambush: striking an unaware foe shatters its opening stance
  if (ambush === 'player') {
    const p0 = enemies[0];
    p0.stability = Math.max(0, Math.round(p0.stability - p0.maxStability * BALANCE.combat.ambush.stabLossPct / 100));
    log.push(T('cmt.ambushPlayer', { enemy: p0.label, pct: BALANCE.combat.ambush.stabLossPct }));
  }
  if (ambush === 'enemy') log.push(T('cmt.ambushEnemy', { enemy: enemies[0].label }));
  if (enemies.length > 1) log.push(T('cmt.packIntro', { n: enemies.length }));
  if (terrain) log.push(T('cmt.terrain', { label: locTerrainLabel(opts.zoneId), mods: Object.entries(terrain).map(([p, m]) => `${locPathName(PATH_BY_ID[p]) || p} ${m > 0 ? '+' : ''}${m}%`).join(' · ') }));

  // pack leader buff (#11): while the leader lives, its packmates fight harder
  const leader = enemies.find(e => e.packRole === 'leader' || ENEMY_BY_ID[e.defId]?.packLeader);
  if (leader) {
    const lb = /** @type {any} */ (ENEMY_BY_ID[leader.defId].leaderBuff || {});
    for (const e of enemies) {
      if (e === leader || !e.packId || e.packId !== leader.packId) continue;
      if (lb.dmgPct) e.attack = Math.max(1, Math.round(e.attack * (1 + lb.dmgPct / 100)));
      if (lb.speedPct) e.baseSpeed = Math.max(20, Math.round(e.baseSpeed * (1 + lb.speedPct / 100)));
    }
    if (lb.dmgPct || lb.speedPct) {
      log.push(T('cmt.howl', { enemy: leader.label, sp: lb.speedPct || 0, dmg: lb.dmgPct || 0 }));
    }
  }

  for (const e of enemies) e.planned = planIntent(e, e.statuses);
  const pBase = playerSpeedOf(player);
  const pDelay = actDelay(pBase, opts.playerStatuses || []);
  const clocks = {};
  for (const e of enemies) clocks[e.uid] = e.uid === enemies[0].uid
    ? (ambush === 'player'
      ? actDelay(e.baseSpeed, e.statuses) * (1 + BALANCE.combat.ambush.delayPct / 100)
      : actDelay(e.baseSpeed, e.statuses))
    : actDelay(e.baseSpeed, e.statuses);
  return {
    enemyId: def.id,
    enemy: enemies[0],          // primary combatant (back-compat)
    enemies,
    primaryUid: enemies[0].uid,
    targetUid: enemies[0].uid,
    hpScale: d.enemyHpMul,
    speeds: { player: pBase },
    // action-order clock: the player opens — unless ambushed.
    nextAct: {
      player: ambush === 'enemy' ? Math.round(pDelay * 0.6) : 0,
      enemies: clocks,
    },
    clock: 0,
    worldId: opts.worldId || null,
    wildGuId: opts.wildGuId || null,
    arena: opts.arena || null,
    trial: opts.trial || null,
    zoneId: opts.zoneId || null,
    terrain,
    scouted: !!opts.scouted,  // a scouting Gu's eye carried into battle
    playerStatuses: (opts.playerStatuses || []).map(s => ({ ...s })),
    cooldowns: {},
    log,
    revealed: false,
    rounds: 0,
    over: false,
    result: null,
    masteryUses: {},
    contributed: {},
    lastHits: {},
  };
}

// Killer-Move activation: mastery, Gu condition and decay — plus Focus (from
// Observe / preparation) and a broken enemy's opening.
export function activationChanceOf(gu, inst, state, combat) {
  if (!isKillerMove(gu)) return 100;
  const cfg = BALANCE.combat.killerActivation;
  const level = state?.mastery?.[gu.path]?.level || 1;
  const uses = inst && combat ? (combat.masteryUses?.[inst.instanceId] || 0) : 0;
  const cond = inst && state ? guCondition(state, inst) : null;
  const focus = (combat?.playerStatuses || []).filter(s => s.type === 'focus').reduce((a, s) => a + (s.power || 0), 0);
  const broken = (combat?.enemies || []).some(e => (e.statuses || []).some(s => s.type === 'broken')) ? (cfg.brokenBonus || 0) : 0;
  return Math.max(cfg.min, Math.min(cfg.max, Math.round(
    cfg.base + (level - 1) * cfg.perMasteryLevel - uses * cfg.repeatPenalty
    + (cond?.stability || 0) + focus + broken)));
}

// Stacking caps: damage-over-time effects stack, but never without limit — at
// the cap a fresh application refreshes the strongest stack instead. Poison
// stacks to ×5 (the attrition identity); wind momentum holds at 5 stacks.
const STACK_CAPS = { burn: 3, poison: 5, momentum: 5, ccResist: 2, force: BALANCE.strength.force.cap };
function addStatus(statuses, entry) {
  const cap = STACK_CAPS[entry.type];
  if (cap) {
    const same = statuses.filter(s => s.type === entry.type);
    if (same.length >= cap) {
      const strongest = same.reduce((a, b) => ((b.power || 0) > (a.power || 0) ? b : a));
      strongest.power = Math.max(strongest.power || 0, entry.power || 0);
      strongest.duration = Math.max(strongest.duration || 0, entry.duration || 0);
      return;
    }
  }
  statuses.push(entry);
}

const effValue = (statuses, type) => (statuses || []).filter(s => s.type === type).reduce((a, s) => a + (s.power || 0), 0);
const hasStatus = (statuses, type) => (statuses || []).some(s => s.type === type);
// hard control: stun (legacy), paralysis (Lightning) and freeze (Ice) all
// deny the enemy its next action and scatter any charged attack
const incapacitated = (st) => hasStatus(st, 'stun') || hasStatus(st, 'paralysis') || hasStatus(st, 'frozen');

function elementBuffMul(playerStatuses, element) {
  let m = 1;
  for (const s of playerStatuses) if (s.type === 'buff' && s.element === element) m *= (1 + s.power / 100);
  return m;
}

export function effectiveCost(gu, state, inst = null) {
  const fx = bonusOf(state, gu.path);
  let cost = Math.max(0, Math.ceil(gu.energyCost * (1 - (fx.costPct || 0) / 100)));
  if (inst) {
    const cond = guCondition(state, inst);
    cost = Math.ceil(cost * (1 + cond.costPct / 100));
  }
  return cost;
}

function activeSynergies(state) {
  const equipped = new Set(state.player.equippedGu.map(id => {
    const inst = state.ownedGu.find(g => g.instanceId === id);
    return inst && GU_BY_ID[inst.guId]?.path;
  }));
  return new Set(SYNERGIES.filter(sy => sy.paths.every(p => equipped.has(p))).map(sy => sy.id));
}

// A broken enemy's defense collapses; armor break chips it away otherwise.
// Sword's armorPen (#16) ignores part of what remains.
function effDefenseOf(enemy, penPct = 0) {
  let d = enemy.defense;
  for (const s of enemy.statuses) if (s.type === 'armorBreak') d = Math.max(0, d - (s.power || 0));
  if (hasStatus(enemy.statuses, 'broken')) d = 0;
  return Math.max(0, d * (1 - (penPct || 0) / 100));
}
function damageTakenMul(enemy) {
  let m = 1;
  for (const s of enemy.statuses) if (s.type === 'weakness') m += (s.power || 0) / 100;
  if (hasStatus(enemy.statuses, 'broken')) m += BALANCE.combat.break.dmgBonusPct / 100;
  return m;
}

// Guard damage → BREAK: the payoff target beside HP.
function applyStabilityDamage(enemy, combat, amount, push, path) {
  const cfg = BALANCE.combat.break;
  if (amount <= 0 || hasStatus(enemy.statuses, 'broken')) return;
  let amt = amount * (enemy.stabMul || 1);
  // some hides are built to be broken — the right Path finds the flaw
  if (path && path === enemy.stabWeakness) {
    amt *= 1.5;
    push(T('cmt.flaw', { path: locPathName(PATH_BY_ID[path]), enemy: dispOf(enemy) }));
  }
  enemy.stability = Math.max(0, (enemy.stability ?? enemy.maxStability) - Math.round(amt));
  if (enemy.stability <= 0) {
    enemy.statuses.push({ type: 'broken', power: 0, duration: cfg.brokenDuration });
    enemy.stability = Math.round(enemy.maxStability * 0.4);
    delayEnemy(combat, enemy, actDelay(enemy.baseSpeed, enemy.statuses) * cfg.delayPct / 100);
    if (enemy.telegraph) { enemy.telegraph = null; push(T('cmt.telegraphScattered', { enemy: dispOf(enemy) })); }
    push(T('cmt.shatters', { enemy: dispOf(enemy) }));
  }
}

// applyGu: the Gu's living condition (hunger, injury, Vital bond, rank) scales
// only the Gu's contribution — never the player's own strength.
//   mul  — total power multiplier for THIS target (AoE falloff, cleave %…)
//   opt.selfFx — self-side effects (defenses, momentum, regain) apply ONCE,
//                on the first target only, never once per enemy
//   opt.procMul — control proc chance scale for secondary targets (chain: 0.6)
function applyGu(gu, player, enemy, pSt, eSt, combat, push, fx, syn, weather, mul = 1, opt = {}) {
  const e = gu.effect;
  const G_ = BALANCE.combat;
  const selfFx = opt.selfFx !== false;
  const procMul = opt.procMul ?? 1;
  let meaningful = false;
  const killer = isKillerMove(gu);
  if (e.attack) {
    const hits = e.attack.hits || 1;
    for (let h = 0; h < hits; h++) {
      let dmg = Math.floor(rollIn(guAttackRange(gu)) * mul) + Math.floor(player.strength * 0.5);
      dmg = Math.floor(dmg * elementBuffMul(pSt, gu.element));
      if (enemy.resists?.includes(gu.path)) {
        dmg = Math.floor(dmg * (1 - BALANCE.combat.elite.resistPct / 100));
        push(T('cmt.resist', { enemy: dispOf(enemy), path: locPathName(PATH_BY_ID[gu.path]) }));
      }
      dmg = Math.floor(dmg * (1 + weatherModOf(weather, gu.path) / 100));
      // the ground lends its essence — battlefield terrain shifts Path power
      const terr = (combat.terrain || {})[gu.path] || 0;
      if (terr) {
        dmg = Math.floor(dmg * (1 + terr / 100));
        if (h === 0) push(T('cmt.terrainLends', { label: locTerrainLabel(combat.zoneId), path: locPathName(PATH_BY_ID[gu.path]), m: terr }));
      }
      dmg = Math.floor(dmg * (1 + (fx.damagePct || 0) / 100));
      if (gu.path === enemy.weakness) {
        dmg = Math.floor(dmg * (1 + BALANCE.combat.weaknessBonusPct / 100));
        push(T('cmt.weaknessRoar', { path: locPathName(PATH_BY_ID[gu.path]), enemy: dispOf(enemy) }));
      }
      // STRENGTH — LỰC THẾ momentum drives the blow deeper; airborne foes
      // blunt pure force (the Path's weakness), while the Iron & Gale pairing
      // lets a wind-carried charge land at full weight
      if (gu.path === 'strength') {
        const fstacks = forceOf(pSt);
        if (fstacks) dmg = Math.floor(dmg * (1 + fstacks * BALANCE.strength.force.dmgPerStackPct / 100));
        if (enemy.abilities?.includes('evasive')) {
          dmg = Math.floor(dmg * (1 - BALANCE.strength.strikeVsFlyingPct / 100));
          if (h === 0) push(T('cmt.strikeVsFlier', { enemy: dispOf(enemy) }));
        }
        if (syn.has('ironGale')) dmg = Math.floor(dmg * 1.1);
      }
      // path synergy — lightning races across a soaked hide
      if (gu.element === 'lightning' && hasStatus(eSt, 'soaked')) {
        dmg = Math.floor(dmg * 1.4);
        push(T('cmt.lightningSoaked', { enemy: dispOf(enemy) }));
      }
      // setup pays off: broken/exposed targets take amplified damage
      dmg = Math.floor(dmg * damageTakenMul(enemy));
      const guard = eSt.find(s => s.type === 'guard');
      if (guard) { dmg = Math.floor(dmg * (1 - (guard.power || 0) / 100)); push(T('cmt.guardHunker', { enemy: dispOf(enemy) })); }
      dmg = Math.max(1, dmg - Math.floor(effDefenseOf(enemy, e.attack.armorPen) * 0.5));
      const critMul = critMulOf(gu);
      if (critMul > 1) { dmg = Math.floor(dmg * critMul); push(T('cmt.crit', { gu: locGuName(gu) })); }
      enemy.hp -= dmg;
      push(T('cmt.guStrike', { gu: locGuName(gu), enemy: dispOf(enemy), dmg }));
      meaningful = true;
    }
    if (e.attack.stun && Math.random() * 100 < e.attack.stun * procMul) {
      if (enemy.immune?.includes('stun')) push(T('cmt.stunImmune', { enemy: dispOf(enemy) }));
      else { eSt.push({ type: 'stun', power: 0, duration: 1 }); push(T('cmt.stunned', { enemy: dispOf(enemy) })); meaningful = true; }
    }
    // LIGHTNING — paralysis: the foe may lose its next action. After it lands,
    // its nerves harden (+30% control resistance for 2 actions), so paralysis
    // can never chain-lock; resistant foes (bosses, elites) shake it off in
    // proportion to their statusResist. Secondary (chain) targets proc less.
    if (e.attack.paralysis) {
      const res = (enemy.statusResist?.paralysis || 0) + effValue(eSt, 'ccResist');
      if (enemy.immune?.includes('stun')) push(T('cmt.stunImmune', { enemy: dispOf(enemy) }));
      else if (Math.random() * 100 < e.attack.paralysis.chance * procMul * (1 - Math.min(100, res) / 100)) {
        eSt.push({ type: 'paralysis', power: 0, duration: e.attack.paralysis.duration || 1 });
        addStatus(eSt, { type: 'ccResist', power: 30, duration: 2 });
        push(T('cmt.paralyzed', { enemy: dispOf(enemy) }));
        meaningful = true;
      } else push(T('cmt.paralysisShrugs', { enemy: dispOf(enemy) }));
    }
    // ICE — freeze: a frozen foe loses its next action outright. Fully
    // freeze-resistant foes (rune-bound colossi) only slow: action delay
    // replaces the lost action. A frozen foe chills wary afterwards
    // (+control resistance), preventing chain-freezes.
    if (e.attack.freeze) {
      const res = (enemy.statusResist?.freeze || 0) + effValue(eSt, 'ccResist');
      if (enemy.immune?.includes('stun')) push(T('cmt.stunImmune', { enemy: dispOf(enemy) }));
      else if (res >= 100) {
        delayEnemy(combat, enemy, actDelay(enemy.baseSpeed, eSt) * 0.4);
        push(T('cmt.frozenSlows', { enemy: dispOf(enemy) }));
      } else if (Math.random() * 100 < e.attack.freeze.chance * procMul * (1 - res / 100)) {
        eSt.push({ type: 'frozen', power: 0, duration: e.attack.freeze.duration || 1 });
        addStatus(eSt, { type: 'ccResist', power: 30, duration: 2 });
        push(T('cmt.frozen', { enemy: dispOf(enemy) }));
        meaningful = true;
      } else push(T('cmt.freezeShrugs', { enemy: dispOf(enemy) }));
    }
    // EARTH — some strikes leave your stance rooted: a chance at Stone Guard.
    if (selfFx && e.attack.guard && Math.random() * 100 < e.attack.guard.chance) {
      pSt.push({ type: 'defense', power: e.attack.guard.power, duration: e.attack.guard.duration });
      push(T('cmt.stoneGuard', { p: e.attack.guard.power }));
    }
    // WATER — flowing essence: a small chance to draw essence back after the
    // strike. Capped at 1–2 per activation — efficiency, never free casting.
    if (selfFx && e.essenceRecovery && Math.random() * 100 < e.essenceRecovery.chance) {
      const er = e.essenceRecovery;
      const amt = er.min + Math.floor(Math.random() * (er.max - er.min + 1));
      mutateEssence(player, { delta: amt, reason: ESSENCE_REASON.GU_EFFECT, source: 'water-flow' });
      push(T('cmt.essenceFlow', { n: amt }));
    }
    // Killer fire feasts on burning foes — consuming the Burn for a burst
    if (killer && gu.element === 'fire' && hasStatus(eSt, 'burn')) {
      const feast = eSt.filter(s => s.type === 'burn').reduce((a, s) => a + s.power, 0) * 2;
      for (let i = eSt.length - 1; i >= 0; i--) if (eSt[i].type === 'burn') eSt.splice(i, 1);
      enemy.hp -= feast;
      push(T('cmt.killerFeast', { n: feast }));
      meaningful = true;
    }
  }
  if (e.burn) {
    let power = Math.max(1, Math.round(e.burn.power * mul));
    let dur = e.burn.duration + (fx.burnTurns || 0);
    if (gu.element === 'fire' && hasStatus(eSt, 'soaked')) {
      power = Math.round(power * 1.5);
      for (let i = eSt.length - 1; i >= 0; i--) if (eSt[i].type === 'soaked') eSt.splice(i, 1);
      push(T('cmt.burnSteam'));
    }
    if ((enemy.statusResist?.burn || 0) >= 100) push(T('cmt.burnImmune', { enemy: dispOf(enemy) }));
    else if (Math.random() * 100 < (e.burn.chance ?? 100)) {
      addStatus(eSt, { type: 'burn', power, duration: dur });
      push(T('cmt.ablaze', { enemy: dispOf(enemy) }));
      meaningful = true;
    }
  }
  // POISON — stacking damage over time: every strike adds another layer of
  // venom (×n, up to the cap). Weak immediately, brutal in long fights.
  if (e.poison) {
    if ((enemy.statusResist?.poison || 0) >= 100) push(T('cmt.poisonImmune', { enemy: dispOf(enemy) }));
    else {
      addStatus(eSt, { type: 'poison', power: Math.max(1, Math.round(e.poison.power * (mul >= 1 ? 1 : mul))), duration: e.poison.duration });
      push(T('cmt.venomApplied', { enemy: dispOf(enemy), n: eSt.filter(s => s.type === 'poison').length, d: e.poison.power }));
      meaningful = true;
    }
  }
  if (e.soak) {
    eSt.push({ type: 'soaked', power: 0, duration: 3 });
    push(T('cmt.soaked', { enemy: dispOf(enemy) }));
    meaningful = true;
  }
  if (e.slow) { eSt.push({ type: 'slow', power: e.slow.power, duration: e.slow.duration }); push(T('cmt.slowed', { enemy: dispOf(enemy) })); meaningful = true; }
  if (e.delay) {
    delayEnemy(combat, enemy, actDelay(enemy.baseSpeed, eSt) * (e.delay.pct / 100));
    push(T('cmt.dragged', { enemy: dispOf(enemy) }));
    meaningful = true;
  }
  if (e.expose) { eSt.push({ type: 'weakness', power: e.expose.power, duration: e.expose.duration }); push(T('cmt.exposed', { enemy: dispOf(enemy) })); meaningful = true; }
  if (e.armorBreak) { eSt.push({ type: 'armorBreak', power: e.armorBreak.power, duration: e.armorBreak.duration }); push(T('cmt.armorBreak', { enemy: dispOf(enemy) })); meaningful = true; }
  if (selfFx && e.self?.haste) { pSt.push({ type: 'haste', power: e.self.haste.power, duration: e.self.haste.duration }); push(T('cmt.selfHaste', { gu: locGuName(gu) })); }
  // WIND — momentum: each meaningful strike adds a stack of +power% Speed (up
  // to cap). Stacks last the whole battle — wind grows stronger as it blows.
  if (selfFx && e.self?.momentum) {
    const mom = e.self.momentum;
    const stacks = pSt.filter(s => s.type === 'momentum').length;
    if (stacks < (mom.cap || 5)) {
      addStatus(pSt, { type: 'momentum', power: mom.power, duration: 999 });
      push(T('cmt.momentum', { n: stacks + 1, p: mom.power }));
    } else push(T('cmt.momentumMax', { cap: mom.cap || 5 }));
  }
  if (e.stab) {
    let stabAmt = e.stab * (mul >= 1 ? 1 : 0.75);
    // STRENGTH: momentum deepens the shatter (+ per stack), and the Mountain
    // Breaker pairing (Strength+Earth — the tank/Break build) deepens it again
    if (gu.path === 'strength') {
      stabAmt *= 1 + forceOf(pSt) * BALANCE.strength.force.breakPerStackPct / 100;
      if (syn.has('mountainBreaker')) stabAmt *= 1.25;
    }
    applyStabilityDamage(enemy, combat, stabAmt, push, gu.path);
  }
  if (selfFx && e.summon) {
    const p = Math.max(1, Math.floor(e.summon.power * mul * (1 + (fx.summonPct || 0) / 100) * (syn.has('tamedTides') ? 1.15 : 1)));
    eSt.push({ type: 'summon', power: p, duration: (e.summon.duration || 3) + (fx.summonTurns || 0) });
    push(T('cmt.summon', { p }));
    meaningful = true;
  }
  if (selfFx && e.defense) { pSt.push({ type: 'defense', power: Math.max(1, Math.floor(e.defense.power * mul * (1 + (fx.defensePct || 0) / 100))), duration: e.defense.duration }); push(T('cmt.hardens', { gu: locGuName(gu) })); }
  if (selfFx && e.evasion) { pSt.push({ type: 'evasion', power: Math.max(1, Math.floor(e.evasion.power * mul * (1 + (fx.evasionPct || 0) / 100))), duration: e.evasion.duration }); push(T('cmt.blurs', { gu: locGuName(gu) })); }
  if (selfFx && e.barrier) {
    const power = Math.max(1, Math.floor(e.barrier.power * mul * (1 + (fx.barrierPct || 0) / 100) * (syn.has('mountainSpring') ? 1.15 : 1)));
    pSt.push({ type: 'barrier', power, duration: e.barrier.duration });
    push(T('cmt.barrier', { gu: locGuName(gu), p: power }));
  }
  if (selfFx && e.heal) { const h = Math.max(1, Math.floor(e.heal.power * mul * (1 + (fx.healPct || 0) / 100))); player.hp = Math.min(player.maxHp, player.hp + h); push(T('cmt.heal', { gu: locGuName(gu), n: h })); }
  if (selfFx && e.essence) { const r = Math.max(1, Math.round(e.essence.power * mul)); mutateEssence(player, { delta: r, reason: ESSENCE_REASON.GU_EFFECT, source: gu.id }); push(T('cmt.essence', { gu: locGuName(gu), n: r })); }
  if (e.control) {
    if (enemy.immune?.includes('control')) push(T('cmt.controlImmune', { enemy: dispOf(enemy) }));
    else { eSt.push({ type: 'control', power: Math.max(1, Math.floor(e.control.power * mul * (1 + (fx.controlPct || 0) / 100))), duration: e.control.duration }); push(T('cmt.controlBound', { gu: locGuName(gu), enemy: dispOf(enemy) })); meaningful = true; }
  }
  if (selfFx && e.buff) { pSt.push({ type: 'buff', element: e.buff.element, power: Math.round(e.buff.power * mul), duration: e.buff.duration }); push(T('cmt.buff', { gu: locGuName(gu), element: TL(`guEl.${e.buff.element}`, e.buff.element) })); }
  if (selfFx && e.investigate) { combat.revealed = true; combat.scouted = true; push(T('cmt.investigate', { gu: locGuName(gu) })); }
  return meaningful;
}

function playerGuardDr(pSt, dmg, push) {
  const g = pSt.find(s => s.type === 'guard');
  if (!g) return dmg;
  const out = Math.max(1, Math.floor(dmg * (1 - (g.power || 0) / 100)));
  push(T('cmt.playerGuard', { dmg, out }));
  return out;
}

function enemyAct(enemy, player, pSt, push, windEvasion, thorns) {
  const ev = effValue(pSt, 'evasion') + windEvasion;
  if (ev > 0 && Math.random() * 100 < ev) { push(T('cmt.dodge', { enemy: dispOf(enemy) })); return; }
  let dmg = enemy.attack + Math.floor(Math.random() * 3);
  dmg = Math.max(1, dmg - effValue(enemy.statuses, 'control'));
  dmg = Math.max(1, dmg - effValue(pSt, 'defense'));
  dmg = playerGuardDr(pSt, dmg, push);
  const bar = pSt.find(s => s.type === 'barrier' && s.power > 0);
  if (bar) { const absorb = Math.min(bar.power, dmg); bar.power -= absorb; dmg -= absorb; push(T('cmt.barrierAbsorb', { n: absorb })); }
  player.hp -= dmg;
  push(T('cmt.enemyAttack', { enemy: dispOf(enemy), dmg }));
  if (thorns) { enemy.hp -= thorns; push(T('cmt.thorns', { enemy: dispOf(enemy), dmg: thorns })); }
  if (enemy.abilities && enemy.abilities.includes('poison')) {
    const resist = (player.foodBuffs || []).filter(b => b.type === 'poisonResist').reduce((a, b) => a + (b.power || 0), 0);
    if (Math.random() < 0.4 * (1 - Math.min(90, resist) / 100)) {
      addStatus(pSt, { type: 'poison', power: 3, duration: 3 }); push(T('cmt.youPoisoned'));
    }
  }
  // a numbing creature (stray lightning-qi in its bite) drags the player's
  // next actions later — the enemy side of the paralysis lesson
  if (enemy.abilities && enemy.abilities.includes('numb') && Math.random() < 0.18) {
    addStatus(pSt, { type: 'slow', power: 30, duration: 2 });
    push(T('cmt.youNumbed', { enemy: dispOf(enemy) }));
  }
}

// The telegraphed heavy blow — announced one action ahead so Defend, delay,
// stuns or a BREAK can answer it.
function executeTelegraph(enemy, player, pSt, push) {
  const tg = enemy.telegraph;
  enemy.telegraph = null;
  const ev = effValue(pSt, 'evasion');
  if (ev > 0 && Math.random() * 100 < Math.max(0, ev - 15)) { push(T('cmt.slipClear', { name: tg.name })); return; }
  let dmg = Math.round(enemy.attack * (tg.power || 1.8)) + Math.floor(Math.random() * 6);
  dmg = Math.max(1, dmg - Math.floor(effValue(pSt, 'defense') * 1.5));
  dmg = playerGuardDr(pSt, dmg, push);
  const bar = pSt.find(s => s.type === 'barrier' && s.power > 0);
  if (bar) { const absorb = Math.min(bar.power, dmg); bar.power -= absorb; dmg -= absorb; push(T('cmt.barrierAbsorbHeavy', { n: absorb })); }
  player.hp -= dmg;
  push(T('cmt.telegraphHit', { name: tg.name, dmg }));
}

// Archetype AI — driven by the INTENT system: the enemy commits its next
// action one beat ahead (see engine/intent.js) and executes exactly that plan,
// so what the player reads is what the enemy does. Battles begun before the
// system existed (old saves mid-fight) fall back to deciding on the spot.
// PACK LEADERS (#12, #30): a committed Pack Howl quickens the whole pack.
function enemyAI(enemy, player, pSt, eSt, push, windEvasion, thorns, combat) {
  const c = enemy.aiCounters || (enemy.aiCounters = {});
  c.acts = (c.acts || 0) + 1;
  let plan = enemy.planned;
  enemy.planned = null;
  if (!plan) {
    const isLeader = enemy.packRole === 'leader' || enemy.packLeader;
    const every = enemy.charge?.every || (enemy.ai === 'brute' ? 3 : 4);
    if (isLeader && !c.howled && c.acts >= 2 && Math.random() < 0.3) plan = { kind: 'howl' };
    else if (enemy.ai === 'brute' && enemy.hp < enemy.maxHp * 0.5 && !hasStatus(eSt, 'guard') && Math.random() < 0.4) plan = { kind: 'guard' };
    else if (enemy.ai === 'skirmisher' && enemy.hp < enemy.maxHp * 0.7 && !c.hasted) plan = { kind: 'buff' };
    else if (enemy.ai === 'poisoner' && Math.random() < 0.6) plan = { kind: 'poison' };
    else if (c.acts % every === 0) plan = { kind: 'heavy', name: enemy.charge ? TL(`charge.${enemy.id}`, enemy.charge.name) : T('cmt.savage'), power: enemy.charge?.power || 1.8 };
    else plan = { kind: 'attack' };
  }
  if (plan.kind === 'howl') {
    c.howled = true;
    if (!c.howlBuffed) {
      c.howlBuffed = true;
      enemy.attack = Math.max(1, Math.round(enemy.attack * 1.1));
    }
    let pack = 0;
    for (const mate of (combat.enemies || [])) {
      if (mate === enemy || mate.hp <= 0 || !mate.packId || mate.packId !== enemy.packId) continue;
      addStatus(mate.statuses, { type: 'haste', power: 20, duration: 2 });
      if (!mate.aiCounters?.howlBuffed) {
        mate.aiCounters = mate.aiCounters || {};
        mate.aiCounters.howlBuffed = true;
        mate.attack = Math.max(1, Math.round(mate.attack * 1.1));
      }
      pack++;
    }
    push(T('cmt.howl', { enemy: dispOf(enemy), sp: 20, dmg: 10 }));
    if (!pack) push(T('cmt.aiBuff', { enemy: dispOf(enemy) }));
    return;
  }
  if (plan.kind === 'guard') {
    eSt.push({ type: 'guard', power: 40, duration: 1 });
    push(T('cmt.aiGuard', { enemy: dispOf(enemy) }));
    return;
  }
  if (plan.kind === 'buff') {
    c.hasted = true;
    eSt.push({ type: 'haste', power: 25, duration: 2 });
    push(T('cmt.aiBuff', { enemy: dispOf(enemy) }));
    return;
  }
  if (plan.kind === 'poison') {
    let dmg = Math.max(1, Math.round(enemy.attack * 0.6) - effValue(pSt, 'defense'));
    dmg = playerGuardDr(pSt, dmg, push);
    player.hp -= dmg;
    addStatus(pSt, { type: 'poison', power: 3, duration: 3 });
    push(T('cmt.aiPoison', { enemy: dispOf(enemy), dmg }));
    return;
  }
  if (plan.kind === 'heavy') {
    enemy.telegraph = { name: plan.name, power: plan.power || 1.8 };
    push(T('cmt.aiHeavy', { enemy: dispOf(enemy), name: plan.name }));
    return;
  }
  enemyAct(enemy, player, pSt, push, windEvasion, thorns);
}

// Statuses tick on their owner's actions: a status applied between two of a
// unit's actions lasts exactly its duration in that unit's actions.
function tick(statuses, push, target, who) {
  const out = [];
  for (const s of statuses) {
    if (s.type === 'poison') {
      target.hp -= s.power;
      push(who === 'player' ? T('cmt.poisonTickYou', { n: s.power }) : T('cmt.poisonTick', { enemy: dispOf(target), n: s.power }));
    } else if (s.type === 'burn') {
      target.hp -= s.power;
      push(T('cmt.burnTick', { enemy: dispOf(target), n: s.power }));
    } else if (s.type === 'summon') {
      target.hp -= s.power;
      push(T('cmt.summonTick', { enemy: dispOf(target), n: s.power }));
    }
    const nd = s.duration - 1;
    if (nd > 0 && !(s.type === 'barrier' && s.power <= 0)) out.push({ ...s, duration: nd });
  }
  return out;
}

function applyPendingMastery(s, pending) {
  for (const m of pending) s = grantMastery(s, m.pathId, m.xp, 'guUsed', 'guUse');
  return s;
}

// A pack leader's death breaks the pack's spirit (#31): survivors lose damage
// and speed for the rest of the battle — the simple morale architecture.
function packMorale(combat, leader, push) {
  const cfg = LEADER_DOWN;
  let hit = false;
  for (const m of combat.enemies) {
    if (m === leader || m.hp <= 0 || !m.packId || m.packId !== leader.packId) continue;
    hit = true;
    m.attack = Math.max(1, Math.round(m.attack * (1 - cfg.dmgPct / 100)));
    m.baseSpeed = Math.max(20, Math.round(m.baseSpeed * (1 - cfg.speedPct / 100)));
    addStatus(m.statuses, { type: 'demoralized', power: 0, duration: 99 });
  }
  if (hit) push(T('cmt.leaderDown', { enemy: dispOf(leader), dmg: cfg.dmgPct, sp: cfg.speedPct }));
}

// Mid-battle death bookkeeping: announce each newly-dead foe, and shatter the
// pack's morale if that foe was its leader.
function settleDeaths(combat, hpBefore, push) {
  for (const en of combat.enemies) {
    if ((hpBefore[en.uid] ?? en.hp) > 0 && en.hp <= 0) {
      push(T('cmt.enemyDefeated', { enemy: dispOf(en) }));
      if (en.packRole === 'leader' || en.packLeader) packMorale(combat, en, push);
    }
  }
}

// Victory sweeps EVERY defeated combatant (#40): normal loot per enemy,
// leader-only rare recipe rolls, and rewards that grow with the pack — but
// per-species Insight decay (#41) keeps weak-pack farming thin.
function finishVictory(state, combat, player, pending) {
  const dropMul = DIFFICULTIES[state.difficulty]?.dropMul ?? 1;
  const items = {};
  let spiritStones = 0, progress = 0, insight = 0;
  const killed = [];
  const droppedRecipes = [];
  const droppedBlueprints = [];
  const icfg = BALANCE.insight;
  const b = { ...(state.bestiary || {}) };
  for (const en of combat.enemies) {
    if (en.hp > 0) continue;
    const def = ENEMY_BY_ID[en.defId] || en;
    killed.push(def.id);
    for (const d of def.drops || []) {
      if (Math.random() * 100 < Math.min(100, (d.chance || 100) * dropMul)) items[d.itemId] = (items[d.itemId] || 0) + (d.qty || 1);
    }
    for (const d of def.recipeDrops || []) {
      if (Math.random() * 100 < (d.chance || 100)) droppedRecipes.push(d.recipeId);
    }
    for (const d of def.kmDrops || []) {
      if (Math.random() * 100 < (d.chance || 100) && !droppedBlueprints.includes(d.blueprintId)) droppedBlueprints.push(d.blueprintId);
    }
    spiritStones += Math.floor(en.maxHp / 4) + Math.floor(Math.random() * 5);
    progress += BALANCE.combat.victoryProgress + Math.floor(en.maxHp / 40);
    const kills = state.bestiary?.[def.id]?.kills || 0;
    const decay = Math.max(icfg.killDecayFloor, icfg.killDecay[Math.min(kills, icfg.killDecay.length - 1)]);
    insight += Math.max(1, Math.round((icfg.victoryBase + (kills === 0 ? icfg.firstKillBonus : 0)) * decay));
    const rec = b[def.id] || { seen: 0, kills: 0 };
    b[def.id] = { ...rec, kills: rec.kills + 1 };
  }
  let s = { ...state, player, combat: { ...combat, over: true, result: 'victory', killed, rewards: { items, spiritStones, progress, insight, mastery: [], blueprints: droppedBlueprints } } };
  s = applyEffects(s, { items, spiritStones, progress, insight, recipes: droppedRecipes, message: T('cmt.victory', { stones: spiritStones, progress }) });
  s = { ...s, bestiary: b };
  const masteryGains = [];
  for (const pathId of Object.keys(combat.contributed)) {
    s = grantMastery(s, pathId, BALANCE.mastery.xpVictoryBonus, 'kills', 'guUse');
    masteryGains.push({ pathId, xp: BALANCE.mastery.xpVictoryBonus });
  }
  s = applyPendingMastery(s, pending);
  for (const m of pending) masteryGains.push(m);
  s = { ...s, combat: { ...s.combat, rewards: { ...s.combat.rewards, mastery: masteryGains } } };
  const qk = { ...(s.quests.kills || {}) };
  for (const id of killed) qk[id] = (qk[id] || 0) + 1;
  s = { ...s, quests: { ...s.quests, kills: qk } };
  return s;
}

function finishTrial(state, combat, player) {
  return { ...state, player, combat: { ...combat, over: true, result: 'trial', rewards: null } };
}

function finishDefeat(state, combat, player) {
  if (combat.arena) {
    const ap = { ...player, hp: Math.max(1, Math.floor(player.maxHp * 0.3)) };
    const alog = [...combat.log, T('cmt.arenaDefeat1')];
    return { ...state, player: ap, combat: { ...combat, log: alog, over: true, result: 'defeat' }, log: [...state.log, T('cmt.arenaDefeatLog')] };
  }
  return applyDeath(state, combat, player, 'defeated in combat');
}

// ---- Persistence: the flee-fix heart ----
// Carries the exact combat state (HP, guard/stability, lingering burn &
// poison, last-combat time) back onto the world record — for a finished
// battle via END_COMBAT and for one interrupted by a page refresh via
// normalize(). Every pack member is settled separately (#45): dead members
// stay dead on their own respawn timers (leaders return far slower, #46),
// survivors keep their exact wounds. Only a kill or natural regen ever restores.
export function persistCombatEnemyState(state, c) {
  if (!c) return state;
  const list = (c.enemies?.length ? c.enemies : (c.enemy ? [c.enemy] : [])).filter(Boolean);
  const now = Date.now();
  let s = state;
  if (s.worldState?.enemies && list.length) {
    s = {
      ...s,
      worldState: {
        ...s.worldState,
        enemies: s.worldState.enemies.map(rec => {
          const ce = list.find(e => e.worldId === rec.id);
          if (!ce) return rec;
          const def = ENEMY_BY_ID[rec.defId];
          const isLeader = ce.packRole === 'leader' || def?.packLeader;
          if (c.result === 'victory' || (c.result && ce.hp <= 0)) {
            return {
              ...rec, dead: true, state: 'idle',
              respawnAt: now + BALANCE.world.respawnMs * (def?.respawnMul || 1)
                * (isLeader ? (BALANCE.world.pack.leaderRespawnMul || 3) : 1),
              x: rec.home?.x ?? rec.x, y: rec.home?.y ?? rec.y,
              hp: def?.hp ?? rec.hp, stability: def ? maxStabilityOf(def) : rec.stability, statuses: [],
            };
          }
          // survived the battle (flee / defeat): keep the exact remaining state
          const lingering = (ce.statuses || []).filter(st => st.type === 'burn' || st.type === 'poison').map(st => ({ ...st }));
          return {
            ...rec,
            hp: Math.max(1, Math.round(ce.hp / (c.hpScale || 1))),
            stability: Math.round(ce.stability ?? rec.stability ?? (def ? maxStabilityOf(def) : 0)),
            statuses: lingering,
            lastCombatAt: now,
            state: 'idle',
          };
        }),
      },
    };
  }
  if (c.wildGuId && s.worldState?.wildGu) {
    s = {
      ...s,
      worldState: {
        ...s.worldState,
        wildGu: s.worldState.wildGu.map(w => {
          if (w.id !== c.wildGuId) return w;
          if (c.result === 'victory') {
            return { ...w, gone: true, respawnAt: now + BALANCE.world.wildGuRespawnMs, hp: SPECIES_BY_ID[w.speciesId].hp, x: w.home.x, y: w.home.y };
          }
          return { ...w, hp: Math.max(1, Math.round(c.enemy.hp / (c.hpScale || 1))), lastCombatAt: now };
        }),
      },
    };
  }
  return s;
}

export function executeRound(state, action) {
  if (!state.combat || state.combat.over) return state;
  // snapshot per-enemy HP so the round can report exact damage deltas to the
  // battle VFX — language-independent, works for every AoE shape (#48)
  const hpBefore = {};
  for (const en of state.combat.enemies || []) hpBefore[en.uid] = en.hp;
  const s = executeRoundInner(state, action, hpBefore);
  if (s.combat && !s.combat.over) {
    const hits = {};
    for (const en of s.combat.enemies || []) {
      const d = (hpBefore[en.uid] ?? en.hp) - en.hp;
      if (d > 0) hits[en.uid] = d;
    }
    return { ...s, combat: { ...s.combat, lastHits: hits } };
  }
  return s;
}

function executeRoundInner(state, action, hpBefore) {
  if (!state.combat || state.combat.over) return state;
  const cfg = BALANCE.combat;
  let combat = {
    ...state.combat,
    enemies: (state.combat.enemies || [state.combat.enemy]).map(en => ({
      ...en, statuses: (en.statuses || []).map(s => ({ ...s })),
    })),
  };
  let player = { ...state.player };
  let log = combat.log.slice();
  let cooldowns = { ...combat.cooldowns };
  let pSt = combat.playerStatuses.map(s => ({ ...s }));
  const enemies = combat.enemies;
  const push = (m) => log.push(m);
  const syn = activeSynergies(state);
  const windFx = bonusOf(state, 'wind');
  const earthFx = bonusOf(state, 'earth');
  const pending = [];
  let guUsedName = null;   // a meaningfully-used Gu → proficiency practice
  const weather = weatherOf(state.time);
  if (!combat.weatherNoted) {
    combat.weatherNoted = true;
    const wl = weatherEffectLine(weather);
    if (wl) push(wl);
  }
  combat.clock = combat.nextAct.player;
  let actAdvancePct = 0, actSelfDelayPct = 0;

  const livingOf = () => enemies.filter(e => e.hp > 0);
  // the player's own statuses act first: poison bites, auras fade
  pSt = tick(pSt, push, player, 'player');

  // the selected target (#14): an explicit choice, else the primary foe
  const wantedUid = action.targetUid || combat.targetUid || combat.primaryUid;
  let target = livingOf().find(e => e.uid === wantedUid) || livingOf()[0] || enemies[0];
  combat.targetUid = target.uid;
  combat.enemy = enemies.find(e => e.uid === combat.primaryUid) || enemies[0];

  if (action.type === 'flee') {
    const hasWind = state.player.equippedGu.some(id => { const g = state.ownedGu.find(o => o.instanceId === id); return g && GU_BY_ID[g.guId].id === 'windStep'; });
    // escape is judged against the FASTEST able pursuer — not one random
    // packmate; a slowed or frozen foe cannot cut you off (#32)
    const pursuers = livingOf().filter(e => !incapacitated(e.statuses));
    const fastest = pursuers.length ? Math.max(...pursuers.map(e => effSpeed(e.baseSpeed, e.statuses))) : 0;
    const pSpd = effSpeed(combat.speeds.player, pSt);
    const chance = 38 + player.agility * 2 + (pSpd - fastest) * 0.25 + (hasWind ? 20 : 0) + (windFx.fleePct || 0);
    if (Math.random() * 100 < chance) {
      push(T('cmt.fleeOk'));
      // Escaping is a generic action — no mastery for Flee itself; only a Gu
      // that actively carried the escape (Wind Step) earns its Path a little.
      if (hasWind) push(T('cmt.windCarry', { n: BALANCE.mastery.xpFleeAssist }));
      let s = { ...state, combat: { ...combat, enemy: combat.enemy, playerStatuses: pSt, log, over: true, result: 'flee' }, player };
      if (hasWind) s = grantMastery(s, 'wind', BALANCE.mastery.xpFleeAssist, 'guUsed', 'guUse');
      return s;
    }
    push(T('cmt.fleeFail'));
    // a failed escape invites every enemy's next action immediately
    for (const e of livingOf()) combat.nextAct.enemies[e.uid] = Math.min(combat.nextAct.enemies[e.uid], combat.clock + 1);
  } else if (action.type === 'item') {
    const it = ITEM_BY_ID[action.itemId];
    if (!it || !it.use || !it.combatUsable) return state;
    if ((state.inventory[it.category]?.[action.itemId] || 0) <= 0) return state;
    if (it.use.hp) player.hp = Math.min(player.maxHp, player.hp + it.use.hp);
    if (it.use.essence) mutateEssence(player, { delta: it.use.essence, reason: ESSENCE_REASON.ITEM, source: it.id });
    if (it.use.cure && pSt.some(s => it.use.cure.includes(s.type))) {
      pSt = pSt.filter(s => !it.use.cure.includes(s.type));
      push(T('cmt.cured'));
    }
    if (it.use.buff) { player = applyFoodBuff(player, it.use.buff, state.time); push(T('cmt.itemBuff', { name: locItemName(it) })); }
    push(T('cmt.itemUse', { name: locItemName(it) }));
    combat.usedItem = action.itemId;
  } else if (action.type === 'strike') {
    // free basic attack — the weak emergency fallback (0 essence, chips GUARD).
    // 95% accuracy; rolls inside the visible strike range, may crit.
    // STRENGTH PATH (LỰC ĐẠO): mastery sharpens the strike, LỰC THẾ momentum
    // raises both its damage and its GUARD-crushing — and every landing hit
    // builds the momentum a phantom Killer Move devours later. Airborne foes
    // are hard to reach with a bare fist; spined foes punish Strike spam.
    const sc = cfg.strike;
    const sLv = strengthLevelOf(state);
    const fcfg = BALANCE.strength;
    const flying = !!target.abilities?.includes('evasive');
    const rng = strikeRange(player, state);
    const acc = rng.accuracy - (flying ? fcfg.strikeVsFlyingAcc : 0);
    if (Math.random() * 100 >= acc) {
      push(flying ? T('cmt.strikeAirMiss', { enemy: dispOf(target) }) : T('cmt.strikeMiss', { enemy: dispOf(target) }));
    } else {
      const stacks = forceOf(pSt);
      let dmg = rollIn(rng);
      dmg = Math.floor(dmg * (1 + stacks * fcfg.force.dmgPerStackPct / 100));
      dmg = Math.floor(dmg * damageTakenMul(target));
      const guard = target.statuses.find(s => s.type === 'guard');
      if (guard) { dmg = Math.floor(dmg * (1 - (guard.power || 0) / 100)); push(T('cmt.guardHunker', { enemy: dispOf(target) })); }
      dmg = Math.max(1, dmg - Math.floor(effDefenseOf(target) * 0.5));
      if (syn.has('bladeBrawn')) dmg = Math.floor(dmg * 1.15); // Strength+Sword: physical burst
      const critMul = critMulOf(null);
      if (critMul > 1) { dmg = Math.floor(dmg * critMul); push(T('cmt.strikeCrit')); }
      target.hp -= dmg;
      push(T('cmt.strike', { enemy: dispOf(target), dmg }));
      const stabAmt = (sc.stab + player.strength * sc.stabPerStr) * (1 + stacks * fcfg.force.breakPerStackPct / 100);
      applyStabilityDamage(target, combat, Math.round(stabAmt), push, sLv > 0 ? 'strength' : null);
      if (sLv > 0) gainForce(pSt, push);
      if (target.abilities?.includes('counter')) {
        player.hp -= fcfg.counterDmg;
        push(T('cmt.strikeCounter', { enemy: dispOf(target), dmg: fcfg.counterDmg }));
      }
    }
  } else if (action.type === 'observe') {
    // free recon: reveal the foes and steady your Killer-Move focus
    const oc = cfg.observe;
    combat.revealed = true;
    combat.scouted = true;
    const regen = Math.min(player.maxPrimevalEssence - player.primevalEssence, oc.essence);
    mutateEssence(player, { delta: regen, reason: ESSENCE_REASON.COMBAT_TECHNIQUE, source: 'observe' });
    pSt.push({ type: 'focus', power: oc.focusPct, duration: 3 });
    push(T('cmt.observe', { enemy: dispOf(target), n: regen, p: oc.focusPct }));
  } else if (action.type === 'defend') {
    const dc = cfg.defend;
    pSt.push({ type: 'guard', power: dc.dmgRedPct, duration: 1 });
    const regen = Math.ceil(player.maxPrimevalEssence * dc.essenceRegenPct / 100);
    mutateEssence(player, { delta: regen, reason: ESSENCE_REASON.COMBAT_TECHNIQUE, source: 'defend' });
    push(T('cmt.defend', { pct: dc.dmgRedPct, n: regen }));
  } else if (action.type === 'gu') {
    const inst = state.ownedGu.find(g => g.instanceId === action.guInstanceId);
    if (!inst) return state;
    const gu = GU_BY_ID[inst.guId];
    const cond = guCondition(state, inst);
    const prof = proficiencyOf(inst); // a practiced Gu strikes harder
    const cost = effectiveCost(gu, state, inst);
    if (player.primevalEssence < cost) { push(T('cmt.noEssence')); return { ...state, combat: { ...combat, log } }; }
    if ((cooldowns[inst.instanceId] || 0) > 0) { push(T('cmt.cd', { gu: locGuName(gu) })); return { ...state, combat: { ...combat, log } }; }
    mutateEssence(player, { delta: -cost, reason: ESSENCE_REASON.GU_COST, source: gu.id });
    cooldowns[inst.instanceId] = gu.cooldown;
    actAdvancePct = gu.effect.advance?.pct || 0;
    actSelfDelayPct = gu.effect.selfDelay?.pct || 0;
    if (actAdvancePct) push(T('cmt.advance', { p: actAdvancePct }));
    if (actSelfDelayPct) push(T('cmt.selfDelay', { p: actSelfDelayPct }));
    let activated = true;
    if (isKillerMove(gu)) {
      const chance = activationChanceOf(gu, inst, state, combat);
      if (Math.random() * 100 > chance) {
        activated = false;
        push(T('cmt.killerFail', { gu: locGuName(gu) }));
      }
    }
    if (activated) {
      const fx = bonusOf(state, gu.path);
      // STRENGTH — LỰC THẾ consumption: a momentum-eating Killer Move devours
      // stacks for raw crushing force before the blow lands
      let forceBonusPct = 0;
      const cons = gu.effect.consumeForce;
      if (cons && strengthLevelOf(state) > 0) {
        const take = Math.min(cons.max, forceOf(pSt));
        if (take > 0) {
          let removed = 0;
          for (let i = pSt.length - 1; i >= 0 && removed < take; i--) {
            if (pSt[i].type === 'force') { pSt.splice(i, 1); removed++; }
          }
          forceBonusPct = take * (cons.dmgPerStackPct || BALANCE.strength.killerConsume.dmgPerStackPct);
          push(T('cmt.forceConsume', { n: take, p: forceBonusPct }));
        }
      }
      // targeting categories (#15–#23): resolve who is hit and how hard
      const tlist = resolveTargets(combat, gu, target.uid);
      let meaningful = false;
      tlist.forEach((t, i) => {
        const foe = enemies.find(e => e.uid === t.e.uid);
        if (!foe || foe.hp <= 0) return;
        const kind = targetKindOf(gu);
        if (kind === 'chain' && i > 0) push(T('cmt.chainLeap', { enemy: dispOf(foe) }));
        if (kind === 'cleave' && i > 0) push(T('cmt.cleaveHit', { enemy: dispOf(foe) }));
        const m = applyGu(gu, player, foe, pSt, foe.statuses, combat, push, fx, syn, weather,
          cond.effMul * (1 + prof.powerPct / 100) * t.mul * (1 + forceBonusPct / 100), { selfFx: i === 0, procMul: t.sec ? 0.6 : 1 });
        if (m) meaningful = true;
      });
      // STRENGTH — landing a Strength Gu blow feeds LỰC THẾ; a momentum-
      // devouring Killer Move feasts instead of feeding
      if (meaningful && gu.path === 'strength' && !gu.effect.consumeForce && strengthLevelOf(state) > 0) {
        gainForce(pSt, push);
      }
      if (meaningful) {
        combat.contributed[gu.path] = true;
        guUsedName = gu.name;
        const uses = (combat.masteryUses[inst.instanceId] || 0) + 1;
        combat.masteryUses[inst.instanceId] = uses;
        const decay = BALANCE.mastery.repeatDecay[Math.min(uses - 1, BALANCE.mastery.repeatDecay.length - 1)];
        const xp = Math.round(BALANCE.mastery.xpCombatUse * decay);
        if (xp > 0) {
          push(T('cmt.masteryGain', { icon: PATH_BY_ID[gu.path].icon, path: locPathName(PATH_BY_ID[gu.path]), xp }));
          pending.push({ pathId: gu.path, xp });
        }
      }
    }
  }

  // KILLER MOVE (Sát Chiêu) — a researched technique from the battle loadout.
  // Only equipped, complete moves resolve; the activation roll uses mastery,
  // component condition, Focus and the broken-enemy opening. A failed
  // activation still spends essence and the cooldown — power has a price.
  if (action.type === 'km') {
    const move = (state.killerMoves?.known || []).find(m => m.id === action.moveId);
    const entry = move ? kmCombatEntry(state, move) : null;
    if (!entry) { push(T('cmt.kmIncomplete')); return { ...state, combat: { ...combat, log } }; }
    const cdKey = kmCdKey(move);
    if ((cooldowns[cdKey] || 0) > 0) { push(T('cmt.cd', { gu: entry.gu.name })); return { ...state, combat: { ...combat, log } }; }
    if (player.primevalEssence < entry.gu.energyCost) { push(T('cmt.noEssence')); return { ...state, combat: { ...combat, log } }; }
    mutateEssence(player, { delta: -entry.gu.energyCost, reason: ESSENCE_REASON.KILLER_MOVE_COST, source: move.id });
    cooldowns[cdKey] = entry.gu.cooldown;
    if (Math.random() * 100 > kmActivationOf(combat, entry)) {
      push(T('cmt.killerFail', { gu: entry.gu.name }));
    } else {
      const fx = bonusOf(state, entry.corePath);
      const tlist = resolveTargets(combat, entry.gu, target.uid);
      let meaningful = false;
      tlist.forEach((tt, i) => {
        const foe = enemies.find(e => e.uid === tt.e.uid);
        if (!foe || foe.hp <= 0) return;
        const kind = targetKindOf(entry.gu);
        if (kind === 'chain' && i > 0) push(T('cmt.chainLeap', { enemy: dispOf(foe) }));
        if (kind === 'cleave' && i > 0) push(T('cmt.cleaveHit', { enemy: dispOf(foe) }));
        const m = applyGu(entry.gu, player, foe, pSt, foe.statuses, combat, push, fx, syn, weather,
          entry.effMul * tt.mul, { selfFx: i === 0, procMul: tt.sec ? 0.6 : 1 });
        if (m) meaningful = true;
      });
      if (meaningful) {
        combat.contributed[entry.corePath] = true;
        const uses = (combat.masteryUses[cdKey] || 0) + 1;
        combat.masteryUses[cdKey] = uses;
        const decay = BALANCE.mastery.repeatDecay[Math.min(uses - 1, BALANCE.mastery.repeatDecay.length - 1)];
        const xp = Math.round(BALANCE.mastery.xpCombatUse * decay);
        if (xp > 0) {
          push(T('cmt.masteryGain', { icon: PATH_BY_ID[entry.corePath].icon, path: locPathName(PATH_BY_ID[entry.corePath]), xp }));
          pending.push({ pathId: entry.corePath, xp });
        }
      }
    }
  }

  // a meaningful use deepens the cultivator's bond with this specific Gu
  if (guUsedName) {
    const res = recordUse(state, action.guInstanceId);
    state = res.state;
    if (res.leveledTo) push(T('cmt.profLevel', { gu: guUsedName, n: res.leveledTo, p: (res.leveledTo - 1) * BALANCE.proficiency.powerPerLevel }));
  }

  // cooldowns tick per OWNER action — the player's own actions
  for (const k in cooldowns) cooldowns[k] = Math.max(0, cooldowns[k] - 1);
  combat.rounds++;

  // mid-action deaths: announce, settle morale, then check the battle's end
  settleDeaths(combat, hpBefore, push);
  if (enemies.every(e => e.hp <= 0)) {
    const done = { ...combat, enemy: combat.enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed };
    if (combat.trial) return finishTrial(state, done, player);
    return finishVictory(state, done, player, pending);
  }

  // elite enrage — once per battle, crossing the threshold ignites a fury
  for (const enemy of livingOf()) {
    if (enemy.enrage && !combat.enraged?.[enemy.uid] && enemy.hp > 0 && enemy.hp <= enemy.maxHp * enemy.enrage.at) {
      combat.enraged = { ...(combat.enraged || {}), [enemy.uid]: true };
      enemy.attack = Math.max(1, Math.round(enemy.attack * (1 + (enemy.enrage.atkPct || 0) / 100)));
      enemy.defense = Math.max(0, enemy.defense - (enemy.enrage.defPen || 0));
      push(T('cmt.enrage', { enemy: dispOf(enemy) }));
    }
  }

  // schedule the player's next action (Advance/aftermath reshaped above)
  const pDelay = actDelay(combat.speeds.player, pSt);
  combat.nextAct.player += pDelay * (1 - actAdvancePct / 100 + actSelfDelayPct / 100);
  combat.nextAct.player = Math.max(combat.nextAct.player, combat.clock);
  // anti-starve / anti-delay cap: no enemy ever falls further behind than
  // catchUpFactor × its own delay — speed is powerful, never infinite
  for (const e of livingOf()) {
    const eDelayNow = actDelay(e.baseSpeed, e.statuses);
    combat.nextAct.enemies[e.uid] = Math.min(combat.nextAct.enemies[e.uid], combat.nextAct.player + eDelayNow * G().catchUpFactor);
  }

  // ---- enemy phase: every enemy action due before the player's next move ----
  let phaseGuard = 0;
  for (;;) {
    const due = livingOf()
      .filter(e => combat.nextAct.enemies[e.uid] <= combat.nextAct.player)
      .sort((a, b) => (combat.nextAct.enemies[a.uid] - combat.nextAct.enemies[b.uid]) || (a.uid < b.uid ? -1 : 1));
    if (!due.length || phaseGuard++ > 24) break;
    const enemy = due[0];
    combat.clock = combat.nextAct.enemies[enemy.uid];
    let eSt = tick(enemy.statuses, push, enemy, 'enemy');
    enemy.statuses = eSt;
    // a stunned, paralyzed, FROZEN or BROKEN enemy loses any charged attack
    if (enemy.telegraph && (incapacitated(eSt) || hasStatus(eSt, 'broken'))) {
      enemy.telegraph = null;
      enemy.planned = null;
      push(T('cmt.interrupted', { enemy: dispOf(enemy) }));
    }
    if (hasStatus(eSt, 'broken')) {
      push(T('cmt.reel', { enemy: dispOf(enemy) }));
    } else if (hasStatus(eSt, 'frozen')) {
      push(T('cmt.frozenCannot', { enemy: dispOf(enemy) }));
    } else if (hasStatus(eSt, 'paralysis')) {
      push(T('cmt.paralysisCannot', { enemy: dispOf(enemy) }));
    } else if (hasStatus(eSt, 'stun')) {
      push(T('cmt.stunCannot', { enemy: dispOf(enemy) }));
    } else if (enemy.telegraph) {
      executeTelegraph(enemy, player, pSt, push);
    } else {
      enemyAI(enemy, player, pSt, eSt, push, windFx.evasionPct || 0, earthFx.thorns || 0, combat);
    }
    if (!hasStatus(eSt, 'broken')) {
      enemy.stability = Math.min(enemy.maxStability, (enemy.stability ?? enemy.maxStability)
        + Math.round(enemy.maxStability * cfg.break.stabRegenPctPerAction / 100));
    }
    combat.nextAct.enemies[enemy.uid] += actDelay(enemy.baseSpeed, eSt);
    // commit the NEXT intent one action ahead — the player can read and answer it
    if (enemy.hp > 0 && !hasStatus(eSt, 'broken') && !incapacitated(eSt)) enemy.planned = planIntent(enemy, eSt);
    if (player.hp <= 0) break;
    if (enemies.every(e => e.hp <= 0)) break;
  }
  settleDeaths(combat, hpBefore, push);

  if (player.hp <= 0) { push(T('cmt.youDefeated')); return finishDefeat(state, { ...combat, enemy: combat.enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player); }
  if (enemies.every(e => e.hp <= 0)) {
    const done = { ...combat, enemy: combat.enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed };
    if (combat.trial) return finishTrial(state, done, player);
    return finishVictory(state, done, player, pending);
  }
  // a master's trial: survive N of the player's own actions, or deal set damage
  if (combat.trial && player.hp > 0) {
    const tr = combat.trial;
    const foe = enemies[0];
    const passed = tr.type === 'survive' ? combat.rounds >= tr.turns : (foe.maxHp - foe.hp) >= (tr.amount || 0);
    if (passed) {
      push(T('cmt.trialComplete'));
      return finishTrial(state, { ...combat, enemy: combat.enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player);
    }
  }

  let s = { ...state, combat: { ...combat, enemy: combat.enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player };
  s = applyPendingMastery(s, pending);
  return s;
}
