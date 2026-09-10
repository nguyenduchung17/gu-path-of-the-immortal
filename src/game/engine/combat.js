// Turn-based combat engine — deliberately NOT real-time.
//
// ACTION ORDER: no rigid player→enemy alternation. Every combatant has a
// Speed; its next action comes after BASE/Speed time units. After the player
// acts, every enemy action due before the player's next move resolves in
// order — a fast enemy acts twice between player moves; a fast (or hastened)
// player double-acts. Speed buffs/debuffs, Action Advance (act sooner) and
// Action Delay (push the enemy back) reshape the visible TIMELINE live.
//
// GUARD (STABILITY): enemies carry a second pool. Basic Strikes and control
// Gu chip it; at zero the enemy is BROKEN — defense collapses, damage taken
// rises and its next action is thrown back. See BALANCE.combat.gauge / break.
//
// PERSISTENCE: a fleeing (or interrupted) battle never resets a foe — see
// persistCombatEnemyState; HP only returns via natural regen or respawn.
import { GU_BY_ID, isKillerMove } from '../data/gu';
import { ENEMY_BY_ID } from '../data/enemies';
import { ITEM_BY_ID } from '../data/items';
import { PATH_BY_ID, SYNERGIES } from '../data/paths';
import { applyEffects, applyFoodBuff } from './effects';
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
    if (s.type === 'haste') m += (s.power || 0) / 100;
    else if (s.type === 'slow') m -= (s.power || 0) / 100;
  }
  return Math.max(G().speedMulMin, Math.min(G().speedMulMax, m));
}
const effSpeed = (base, statuses) => Math.max(20, Math.round(base * speedMulOf(statuses)));
const actDelay = (base, statuses) => G().act / effSpeed(base, statuses);

// Visible action order: simulate the schedule ahead so the player can plan.
export function timelineOf(combat, n = 6) {
  const items = [];
  if (!combat?.nextAct) return items;
  let tp = combat.nextAct.player;
  let te = combat.nextAct.enemy;
  const pDelay = actDelay(combat.speeds.player, combat.playerStatuses);
  const eDelay = actDelay(combat.enemy.baseSpeed, combat.enemy.statuses);
  items.push({ uid: 'player', at: tp });
  tp += pDelay;
  let guard = 0;
  while (items.length < n && guard++ < 24) {
    if (te <= tp) { items.push({ uid: 'enemy', at: te, telegraph: !!combat.enemy.telegraph }); te += eDelay; }
    else { items.push({ uid: 'player', at: tp }); tp += pDelay; }
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

export function initCombat(enemyId, player, opts = {}) {
  const def = opts.def || ENEMY_BY_ID[enemyId];
  const d = DIFFICULTIES[opts.difficulty] || DIFFICULTIES.standard;
  const eco = ecoOf(def.id);
  const maxHp = Math.max(1, Math.round(def.hp * d.enemyHpMul));
  const startHp = Math.min(maxHp, Math.max(1, Math.round((opts.hp ?? def.hp) * d.enemyHpMul)));
  const eBase = enemySpeedOf(def);
  const maxStab = maxStabilityOf(def);
  const statuses = (opts.statuses || []).map(s => ({ ...s }));
  // pack support: kin within sight embolden the fighter — never a free win
  const allies = opts.allies || 0;
  const packAtk = allies ? 1 + (BALANCE.combat.pack.atkPct / 100) : 1;
  const packStab = allies ? 1 + (BALANCE.combat.pack.stabPct / 100) : 1;
  // ambush: striking an unaware foe shatters its opening stance
  const ambush = opts.ambush === 'player' || opts.ambush === 'enemy' ? opts.ambush : null;
  let stability = opts.stability ?? maxStab;
  if (ambush === 'player') stability = Math.max(0, Math.round(stability - maxStab * BALANCE.combat.ambush.stabLossPct / 100));
  const terrain = opts.zoneId ? terrainModsOf(opts.zoneId) : null;
  const log = [opts.intro || T('cmt.intro', { enemy: locEnemyName(def) })];
  if (ambush === 'player') log.push(T('cmt.ambushPlayer', { enemy: locEnemyName(def), pct: BALANCE.combat.ambush.stabLossPct }));
  if (ambush === 'enemy') log.push(T('cmt.ambushEnemy', { enemy: locEnemyName(def) }));
  if (allies) log.push(T('cmt.pack', { n: allies, enemy: locEnemyName(def), atk: BALANCE.combat.pack.atkPct, stab: BALANCE.combat.pack.stabPct }));
  if (terrain) log.push(T('cmt.terrain', { label: locTerrainLabel(opts.zoneId), mods: Object.entries(terrain).map(([p, m]) => `${locPathName(PATH_BY_ID[p]) || p} ${m > 0 ? '+' : ''}${m}%`).join(' · ') }));
  const enemy = {
    ...def,
    activity: eco.activity,
    stabMul: eco.stabMul,
    stabWeakness: eco.stabWeakness,
    ambusher: eco.ambusher,
    attack: Math.max(1, Math.round(def.attack * d.enemyDmgMul * packAtk)),
    maxHp, hp: startHp,
    baseSpeed: eBase,
    statuses,
    stability: Math.min(Math.round(maxStab * packStab), Math.round(stability * packStab)),
    maxStability: Math.round(maxStab * packStab),
    ai: aiOf(def),
    aiCounters: {},
    telegraph: null,          // announced heavy move, executes on its next action
    planned: null,            // committed NEXT action — the Intent system
  };
  enemy.planned = planIntent(enemy, statuses);
  const pBase = playerSpeedOf(player);
  const pDelay = actDelay(pBase, opts.playerStatuses || []);
  const eDelay = actDelay(eBase, statuses);
  return {
    enemyId: def.id,
    enemy,
    hpScale: d.enemyHpMul,
    speeds: { player: pBase },
    // action-order clock: the player opens — unless ambushed.
    nextAct: {
      player: ambush === 'enemy' ? Math.round(pDelay * 0.6) : 0,
      enemy: ambush === 'player' ? Math.round(eDelay * (1 + BALANCE.combat.ambush.delayPct / 100)) : eDelay,
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
  const broken = (combat?.enemy?.statuses || []).some(s => s.type === 'broken') ? (cfg.brokenBonus || 0) : 0;
  return Math.max(cfg.min, Math.min(cfg.max, Math.round(
    cfg.base + (level - 1) * cfg.perMasteryLevel - uses * cfg.repeatPenalty
    + (cond?.stability || 0) + focus + broken)));
}

// Stacking caps: damage-over-time effects stack, but never without limit — at
// the cap a fresh application refreshes the strongest stack instead.
const STACK_CAPS = { burn: 3, poison: 3 };
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
function effDefenseOf(enemy) {
  let d = enemy.defense;
  for (const s of enemy.statuses) if (s.type === 'armorBreak') d = Math.max(0, d - (s.power || 0));
  if (hasStatus(enemy.statuses, 'broken')) d = 0;
  return d;
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
    push(T('cmt.flaw', { path: locPathName(PATH_BY_ID[path]), enemy: locEnemyName(enemy) }));
  }
  enemy.stability = Math.max(0, (enemy.stability ?? enemy.maxStability) - Math.round(amt));
  if (enemy.stability <= 0) {
    enemy.statuses.push({ type: 'broken', power: 0, duration: cfg.brokenDuration });
    enemy.stability = Math.round(enemy.maxStability * 0.4);
    combat.nextAct.enemy += actDelay(enemy.baseSpeed, enemy.statuses) * cfg.delayPct / 100;
    if (enemy.telegraph) { enemy.telegraph = null; push(T('cmt.telegraphScattered', { enemy: locEnemyName(enemy) })); }
    push(T('cmt.shatters', { enemy: locEnemyName(enemy) }));
  }
}

// applyGu: the Gu's living condition (hunger, injury, Vital bond, rank) scales
// only the Gu's contribution — never the player's own strength.
function applyGu(gu, player, enemy, pSt, eSt, combat, push, fx, syn, weather, mul = 1) {
  const e = gu.effect;
  const G_ = BALANCE.combat;
  let meaningful = false;
  const killer = isKillerMove(gu);
  if (e.attack) {
    const hits = e.attack.hits || 1;
    for (let h = 0; h < hits; h++) {
      let dmg = Math.floor(e.attack.power * mul) + Math.floor(player.strength * 0.5);
      dmg = Math.floor(dmg * elementBuffMul(pSt, gu.element));
      if (enemy.resists?.includes(gu.path)) {
        dmg = Math.floor(dmg * (1 - BALANCE.combat.elite.resistPct / 100));
        push(T('cmt.resist', { enemy: locEnemyName(enemy), path: locPathName(PATH_BY_ID[gu.path]) }));
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
        push(T('cmt.weaknessRoar', { path: locPathName(PATH_BY_ID[gu.path]), enemy: locEnemyName(enemy) }));
      }
      // path synergy — lightning races across a soaked hide
      if (gu.element === 'lightning' && hasStatus(eSt, 'soaked')) {
        dmg = Math.floor(dmg * 1.4);
        push(T('cmt.lightningSoaked', { enemy: locEnemyName(enemy) }));
      }
      // setup pays off: broken/exposed targets take amplified damage
      dmg = Math.floor(dmg * damageTakenMul(enemy));
      const guard = eSt.find(s => s.type === 'guard');
      if (guard) { dmg = Math.floor(dmg * (1 - (guard.power || 0) / 100)); push(T('cmt.guardHunker', { enemy: locEnemyName(enemy) })); }
      dmg = Math.max(1, dmg - Math.floor(effDefenseOf(enemy) * 0.5));
      enemy.hp -= dmg;
      push(T('cmt.guStrike', { gu: locGuName(gu), enemy: locEnemyName(enemy), dmg }));
      meaningful = true;
    }
    if (e.attack.stun && Math.random() * 100 < e.attack.stun) {
      if (enemy.immune?.includes('stun')) push(T('cmt.stunImmune', { enemy: locEnemyName(enemy) }));
      else { eSt.push({ type: 'stun', power: 0, duration: 1 }); push(T('cmt.stunned', { enemy: locEnemyName(enemy) })); meaningful = true; }
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
    addStatus(eSt, { type: 'burn', power, duration: dur });
    push(T('cmt.ablaze', { enemy: locEnemyName(enemy) }));
    meaningful = true;
  }
  if (e.soak) {
    eSt.push({ type: 'soaked', power: 0, duration: 3 });
    push(T('cmt.soaked', { enemy: locEnemyName(enemy) }));
    meaningful = true;
  }
  if (e.slow) { eSt.push({ type: 'slow', power: e.slow.power, duration: e.slow.duration }); push(T('cmt.slowed', { enemy: locEnemyName(enemy) })); meaningful = true; }
  if (e.delay) {
    combat.nextAct.enemy += actDelay(enemy.baseSpeed, eSt) * (e.delay.pct / 100);
    push(T('cmt.dragged', { enemy: locEnemyName(enemy) }));
    meaningful = true;
  }
  if (e.expose) { eSt.push({ type: 'weakness', power: e.expose.power, duration: e.expose.duration }); push(T('cmt.exposed', { enemy: locEnemyName(enemy) })); meaningful = true; }
  if (e.armorBreak) { eSt.push({ type: 'armorBreak', power: e.armorBreak.power, duration: e.armorBreak.duration }); push(T('cmt.armorBreak', { enemy: locEnemyName(enemy) })); meaningful = true; }
  if (e.self?.haste) { pSt.push({ type: 'haste', power: e.self.haste.power, duration: e.self.haste.duration }); push(T('cmt.selfHaste', { gu: locGuName(gu) })); }
  if (e.stab) applyStabilityDamage(enemy, combat, e.stab * (mul >= 1 ? 1 : 0.75), push, gu.path);
  if (e.summon) {
    const p = Math.max(1, Math.floor(e.summon.power * mul * (1 + (fx.summonPct || 0) / 100) * (syn.has('tamedTides') ? 1.15 : 1)));
    eSt.push({ type: 'summon', power: p, duration: (e.summon.duration || 3) + (fx.summonTurns || 0) });
    push(T('cmt.summon', { p }));
    meaningful = true;
  }
  if (e.defense) { pSt.push({ type: 'defense', power: Math.max(1, Math.floor(e.defense.power * mul * (1 + (fx.defensePct || 0) / 100))), duration: e.defense.duration }); push(T('cmt.hardens', { gu: locGuName(gu) })); }
  if (e.evasion) { pSt.push({ type: 'evasion', power: Math.max(1, Math.floor(e.evasion.power * mul * (1 + (fx.evasionPct || 0) / 100))), duration: e.evasion.duration }); push(T('cmt.blurs', { gu: locGuName(gu) })); }
  if (e.barrier) {
    const power = Math.max(1, Math.floor(e.barrier.power * mul * (1 + (fx.barrierPct || 0) / 100) * (syn.has('mountainSpring') ? 1.15 : 1)));
    pSt.push({ type: 'barrier', power, duration: e.barrier.duration });
    push(T('cmt.barrier', { gu: locGuName(gu), p: power }));
  }
  if (e.heal) { const h = Math.max(1, Math.floor(e.heal.power * mul * (1 + (fx.healPct || 0) / 100))); player.hp = Math.min(player.maxHp, player.hp + h); push(T('cmt.heal', { gu: locGuName(gu), n: h })); }
  if (e.essence) { const r = Math.max(1, Math.round(e.essence.power * mul)); player.primevalEssence = Math.min(player.maxPrimevalEssence, player.primevalEssence + r); push(T('cmt.essence', { gu: locGuName(gu), n: r })); }
  if (e.control) {
    if (enemy.immune?.includes('control')) push(T('cmt.controlImmune', { enemy: locEnemyName(enemy) }));
    else { eSt.push({ type: 'control', power: Math.max(1, Math.floor(e.control.power * mul * (1 + (fx.controlPct || 0) / 100))), duration: e.control.duration }); push(T('cmt.controlBound', { gu: locGuName(gu), enemy: locEnemyName(enemy) })); meaningful = true; }
  }
  if (e.buff) { pSt.push({ type: 'buff', element: e.buff.element, power: Math.round(e.buff.power * mul), duration: e.buff.duration }); push(T('cmt.buff', { gu: locGuName(gu), element: TL(`guEl.${e.buff.element}`, e.buff.element) })); }
  if (e.investigate) { combat.revealed = true; combat.scouted = true; push(T('cmt.investigate', { gu: locGuName(gu) })); }
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
  if (ev > 0 && Math.random() * 100 < ev) { push(T('cmt.dodge', { enemy: locEnemyName(enemy) })); return; }
  let dmg = enemy.attack + Math.floor(Math.random() * 3);
  dmg = Math.max(1, dmg - effValue(enemy.statuses, 'control'));
  dmg = Math.max(1, dmg - effValue(pSt, 'defense'));
  dmg = playerGuardDr(pSt, dmg, push);
  const bar = pSt.find(s => s.type === 'barrier' && s.power > 0);
  if (bar) { const absorb = Math.min(bar.power, dmg); bar.power -= absorb; dmg -= absorb; push(T('cmt.barrierAbsorb', { n: absorb })); }
  player.hp -= dmg;
  push(T('cmt.enemyAttack', { enemy: locEnemyName(enemy), dmg }));
  if (thorns) { enemy.hp -= thorns; push(T('cmt.thorns', { enemy: locEnemyName(enemy), dmg: thorns })); }
  if (enemy.abilities && enemy.abilities.includes('poison')) {
    const resist = (player.foodBuffs || []).filter(b => b.type === 'poisonResist').reduce((a, b) => a + (b.power || 0), 0);
    if (Math.random() < 0.4 * (1 - Math.min(90, resist) / 100)) {
      addStatus(pSt, { type: 'poison', power: 3, duration: 3 }); push(T('cmt.youPoisoned'));
    }
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

// Archetype AI — now driven by the INTENT system: the enemy commits its next
// action one beat ahead (see engine/intent.js) and executes exactly that plan,
// so what the player reads is what the enemy does. Battles begun before the
// system existed (old saves mid-fight) fall back to deciding on the spot.
function enemyAI(enemy, player, pSt, eSt, push, windEvasion, thorns) {
  const c = enemy.aiCounters || (enemy.aiCounters = {});
  c.acts = (c.acts || 0) + 1;
  let plan = enemy.planned;
  enemy.planned = null;
  if (!plan) {
    const every = enemy.charge?.every || (enemy.ai === 'brute' ? 3 : 4);
    if (enemy.ai === 'brute' && enemy.hp < enemy.maxHp * 0.5 && !hasStatus(eSt, 'guard') && Math.random() < 0.4) plan = { kind: 'guard' };
    else if (enemy.ai === 'skirmisher' && enemy.hp < enemy.maxHp * 0.7 && !c.hasted) plan = { kind: 'buff' };
    else if (enemy.ai === 'poisoner' && Math.random() < 0.6) plan = { kind: 'poison' };
    else if (c.acts % every === 0) plan = { kind: 'heavy', name: enemy.charge ? TL(`charge.${enemy.id}`, enemy.charge.name) : T('cmt.savage'), power: enemy.charge?.power || 1.8 };
    else plan = { kind: 'attack' };
  }
  if (plan.kind === 'guard') {
    eSt.push({ type: 'guard', power: 40, duration: 1 });
    push(T('cmt.aiGuard', { enemy: locEnemyName(enemy) }));
    return;
  }
  if (plan.kind === 'buff') {
    c.hasted = true;
    eSt.push({ type: 'haste', power: 25, duration: 2 });
    push(T('cmt.aiBuff', { enemy: locEnemyName(enemy) }));
    return;
  }
  if (plan.kind === 'poison') {
    let dmg = Math.max(1, Math.round(enemy.attack * 0.6) - effValue(pSt, 'defense'));
    dmg = playerGuardDr(pSt, dmg, push);
    player.hp -= dmg;
    addStatus(pSt, { type: 'poison', power: 3, duration: 3 });
    push(T('cmt.aiPoison', { enemy: locEnemyName(enemy), dmg }));
    return;
  }
  if (plan.kind === 'heavy') {
    enemy.telegraph = { name: plan.name, power: plan.power || 1.8 };
    push(T('cmt.aiHeavy', { enemy: locEnemyName(enemy), name: plan.name }));
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
      push(who === 'player' ? T('cmt.poisonTickYou', { n: s.power }) : T('cmt.poisonTick', { enemy: locEnemyName(target), n: s.power }));
    } else if (s.type === 'burn') {
      target.hp -= s.power;
      push(T('cmt.burnTick', { enemy: locEnemyName(target), n: s.power }));
    } else if (s.type === 'summon') {
      target.hp -= s.power;
      push(T('cmt.summonTick', { enemy: locEnemyName(target), n: s.power }));
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

function finishVictory(state, combat, player, pending) {
  const enemy = combat.enemy;
  const items = {};
  const dropMul = DIFFICULTIES[state.difficulty]?.dropMul ?? 1;
  for (const d of enemy.drops || []) {
    if (Math.random() * 100 < Math.min(100, (d.chance || 100) * dropMul)) items[d.itemId] = (items[d.itemId] || 0) + (d.qty || 1);
  }
  const spiritStones = Math.floor(enemy.maxHp / 4) + Math.floor(Math.random() * 5);
  const progress = BALANCE.combat.victoryProgress + Math.floor(enemy.maxHp / 40);
  const droppedRecipes = (enemy.recipeDrops || []).filter(d => Math.random() * 100 < (d.chance || 100)).map(d => d.recipeId);
  let s = { ...state, player, combat: { ...combat, over: true, result: 'victory', rewards: { items, spiritStones, progress, mastery: [] } } };
  s = applyEffects(s, { items, spiritStones, progress, recipes: droppedRecipes, message: T('cmt.victory', { stones: spiritStones, progress }) });
  const b = { ...(state.bestiary || {}) };
  const rec = b[enemy.id] || { seen: 0, kills: 0 };
  b[enemy.id] = { ...rec, kills: rec.kills + 1 };
  s = { ...s, bestiary: b };
  const masteryGains = [];
  for (const pathId of Object.keys(combat.contributed)) {
    s = grantMastery(s, pathId, BALANCE.mastery.xpVictoryBonus, 'kills', 'guUse');
    masteryGains.push({ pathId, xp: BALANCE.mastery.xpVictoryBonus });
  }
  s = applyPendingMastery(s, pending);
  for (const m of pending) masteryGains.push(m);
  s = { ...s, combat: { ...s.combat, rewards: { ...s.combat.rewards, mastery: masteryGains } } };
  s.quests = { ...s.quests, kills: { ...s.quests.kills, [enemy.id]: (s.quests.kills[enemy.id] || 0) + 1 } };
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
// normalize(). Only a kill (respawn timer) or natural regen ever restores.
export function persistCombatEnemyState(state, c) {
  if (!c?.enemy) return state;
  const now = Date.now();
  let s = state;
  if (c.worldId && s.worldState?.enemies) {
    s = {
      ...s,
      worldState: {
        ...s.worldState,
        enemies: s.worldState.enemies.map(e => {
          if (e.id !== c.worldId) return e;
          const def = ENEMY_BY_ID[e.defId];
          if (c.result === 'victory') {
            return {
              ...e, dead: true, state: 'idle',
              respawnAt: now + BALANCE.world.respawnMs * (def?.respawnMul || 1),
              x: e.home?.x ?? e.x, y: e.home?.y ?? e.y,
              hp: def?.hp ?? e.hp, stability: def ? maxStabilityOf(def) : e.stability, statuses: [],
            };
          }
          // survived the battle (flee / defeat): keep the exact remaining state
          const lingering = (c.enemy.statuses || []).filter(st => st.type === 'burn' || st.type === 'poison').map(st => ({ ...st }));
          return {
            ...e,
            hp: Math.max(1, Math.round(c.enemy.hp / (c.hpScale || 1))),
            stability: Math.round(c.enemy.stability ?? e.stability ?? (def ? maxStabilityOf(def) : 0)),
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
  const cfg = BALANCE.combat;
  let combat = { ...state.combat, enemy: { ...state.combat.enemy, statuses: state.combat.enemy.statuses.map(s => ({ ...s })) } };
  let player = { ...state.player };
  let log = combat.log.slice();
  let cooldowns = { ...combat.cooldowns };
  let pSt = combat.playerStatuses.map(s => ({ ...s }));
  let enemy = combat.enemy;
  let eSt = enemy.statuses;
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

  // the player's own statuses act first: poison bites, auras fade
  pSt = tick(pSt, push, player, 'player');

  if (action.type === 'flee') {
    const hasWind = state.player.equippedGu.some(id => { const g = state.ownedGu.find(o => o.instanceId === id); return g && GU_BY_ID[g.guId].id === 'windStep'; });
    const pSpd = effSpeed(combat.speeds.player, pSt);
    const eSpd = effSpeed(enemy.baseSpeed, eSt);
    const chance = 38 + player.agility * 2 + (pSpd - eSpd) * 0.25 + (hasWind ? 20 : 0) + (windFx.fleePct || 0);
    if (Math.random() * 100 < chance) {
      push(T('cmt.fleeOk'));
      // Escaping is a generic action — no mastery for Flee itself; only a Gu
      // that actively carried the escape (Wind Step) earns its Path a little.
      if (hasWind) push(T('cmt.windCarry', { n: BALANCE.mastery.xpFleeAssist }));
      let s = { ...state, combat: { ...combat, enemy, playerStatuses: pSt, log, over: true, result: 'flee' }, player };
      if (hasWind) s = grantMastery(s, 'wind', BALANCE.mastery.xpFleeAssist, 'guUsed', 'guUse');
      return s;
    }
    push(T('cmt.fleeFail'));
    // a failed escape invites the enemy's next action immediately
    combat.nextAct.enemy = Math.min(combat.nextAct.enemy, combat.clock + 1);
  } else if (action.type === 'item') {
    const it = ITEM_BY_ID[action.itemId];
    if (!it || !it.use || !it.combatUsable) return state;
    if ((state.inventory[it.category]?.[action.itemId] || 0) <= 0) return state;
    if (it.use.hp) player.hp = Math.min(player.maxHp, player.hp + it.use.hp);
    if (it.use.essence) player.primevalEssence = Math.min(player.maxPrimevalEssence, player.primevalEssence + it.use.essence);
    if (it.use.cure && pSt.some(s => it.use.cure.includes(s.type))) {
      pSt = pSt.filter(s => !it.use.cure.includes(s.type));
      push(T('cmt.cured'));
    }
    if (it.use.buff) { player = applyFoodBuff(player, it.use.buff, state.time); push(T('cmt.itemBuff', { name: locItemName(it) })); }
    push(T('cmt.itemUse', { name: locItemName(it) }));
    combat.usedItem = action.itemId;
  } else if (action.type === 'strike') {
    // free basic attack — preserves essence, chips the enemy's GUARD
    const sc = cfg.strike;
    let dmg = Math.floor(sc.power + player.strength * sc.perStr);
    dmg = Math.floor(dmg * damageTakenMul(enemy));
    const guard = eSt.find(s => s.type === 'guard');
    if (guard) { dmg = Math.floor(dmg * (1 - (guard.power || 0) / 100)); push(T('cmt.guardHunker', { enemy: locEnemyName(enemy) })); }
    dmg = Math.max(1, dmg - Math.floor(effDefenseOf(enemy) * 0.5));
    enemy.hp -= dmg;
    push(T('cmt.strike', { enemy: locEnemyName(enemy), dmg }));
    applyStabilityDamage(enemy, combat, Math.round(sc.stab + player.strength * sc.stabPerStr), push);
  } else if (action.type === 'observe') {
    // free recon: reveal the foe and steady your Killer-Move focus
    const oc = cfg.observe;
    combat.revealed = true;
    combat.scouted = true;
    const regen = Math.min(player.maxPrimevalEssence - player.primevalEssence, oc.essence);
    player.primevalEssence += regen;
    pSt.push({ type: 'focus', power: oc.focusPct, duration: 3 });
    push(T('cmt.observe', { enemy: locEnemyName(enemy), n: regen, p: oc.focusPct }));
  } else if (action.type === 'defend') {
    const dc = cfg.defend;
    pSt.push({ type: 'guard', power: dc.dmgRedPct, duration: 1 });
    const regen = Math.ceil(player.maxPrimevalEssence * dc.essenceRegenPct / 100);
    player.primevalEssence = Math.min(player.maxPrimevalEssence, player.primevalEssence + regen);
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
    player.primevalEssence -= cost;
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
      const meaningful = applyGu(gu, player, enemy, pSt, eSt, combat, push, fx, syn, weather, cond.effMul * (1 + prof.powerPct / 100));
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

  // a meaningful use deepens the cultivator's bond with this specific Gu
  if (guUsedName) {
    const res = recordUse(state, action.guInstanceId);
    state = res.state;
    if (res.leveledTo) push(T('cmt.profLevel', { gu: guUsedName, n: res.leveledTo, p: (res.leveledTo - 1) * BALANCE.proficiency.powerPerLevel }));
  }

  // cooldowns tick per OWNER action — the player's own actions
  for (const k in cooldowns) cooldowns[k] = Math.max(0, cooldowns[k] - 1);
  combat.rounds++;

  if (enemy.hp <= 0) {
    push(T('cmt.enemyDefeated', { enemy: locEnemyName(enemy) }));
    const done = { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed };
    if (combat.trial) return finishTrial(state, done, player);
    return finishVictory(state, done, player, pending);
  }

  // elite enrage — once per battle, crossing the threshold ignites a fury
  if (enemy.enrage && !combat.enraged && enemy.hp > 0 && enemy.hp <= enemy.maxHp * enemy.enrage.at) {
    combat.enraged = true;
    enemy.attack = Math.max(1, Math.round(enemy.attack * (1 + (enemy.enrage.atkPct || 0) / 100)));
    enemy.defense = Math.max(0, enemy.defense - (enemy.enrage.defPen || 0));
    push(T('cmt.enrage', { enemy: locEnemyName(enemy) }));
  }

  // schedule the player's next action (Advance/aftermath reshaped above)
  const pDelay = actDelay(combat.speeds.player, pSt);
  combat.nextAct.player += pDelay * (1 - actAdvancePct / 100 + actSelfDelayPct / 100);
  combat.nextAct.player = Math.max(combat.nextAct.player, combat.clock);
  // anti-starve / anti-delay cap: the enemy never falls further behind than
  // catchUpFactor × its own delay — speed is powerful, never infinite
  const eDelayNow = actDelay(enemy.baseSpeed, eSt);
  combat.nextAct.enemy = Math.min(combat.nextAct.enemy, combat.nextAct.player + eDelayNow * G().catchUpFactor);

  // ---- enemy phase: every enemy action due before the player's next move ----
  let phaseGuard = 0;
  while (enemy.hp > 0 && player.hp > 0 && combat.nextAct.enemy <= combat.nextAct.player && phaseGuard++ < 12) {
    combat.clock = combat.nextAct.enemy;
    eSt = tick(eSt, push, enemy, 'enemy');
    enemy.statuses = eSt;
    // a stunned or BROKEN enemy loses any charged attack
    if (enemy.telegraph && (hasStatus(eSt, 'stun') || hasStatus(eSt, 'broken'))) {
      enemy.telegraph = null;
      enemy.planned = null;
      push(T('cmt.interrupted', { enemy: locEnemyName(enemy) }));
    }
    if (hasStatus(eSt, 'broken')) {
      push(T('cmt.reel', { enemy: locEnemyName(enemy) }));
    } else if (hasStatus(eSt, 'stun')) {
      push(T('cmt.stunCannot', { enemy: locEnemyName(enemy) }));
    } else if (enemy.telegraph) {
      executeTelegraph(enemy, player, pSt, push);
    } else {
      enemyAI(enemy, player, pSt, eSt, push, windFx.evasionPct || 0, earthFx.thorns || 0);
    }
    if (!hasStatus(eSt, 'broken')) {
      enemy.stability = Math.min(enemy.maxStability, (enemy.stability ?? enemy.maxStability)
        + Math.round(enemy.maxStability * cfg.break.stabRegenPctPerAction / 100));
    }
    combat.nextAct.enemy += actDelay(enemy.baseSpeed, eSt);
    // commit the NEXT intent one action ahead — the player can read and answer it
    if (enemy.hp > 0 && !hasStatus(eSt, 'broken') && !hasStatus(eSt, 'stun')) enemy.planned = planIntent(enemy, eSt);
    if (enemy.hp <= 0) break;
  }

  if (player.hp <= 0) { push(T('cmt.youDefeated')); return finishDefeat(state, { ...combat, enemy, statuses: eSt, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player); }
  if (enemy.hp <= 0) {
    push(T('cmt.enemyDefeated', { enemy: locEnemyName(enemy) }));
    const done = { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed };
    if (combat.trial) return finishTrial(state, done, player);
    return finishVictory(state, done, player, pending);
  }
  // a master's trial: survive N of the player's own actions, or deal set damage
  if (combat.trial && player.hp > 0) {
    const tr = combat.trial;
    const passed = tr.type === 'survive' ? combat.rounds >= tr.turns : (enemy.maxHp - enemy.hp) >= (tr.amount || 0);
    if (passed) {
      push(T('cmt.trialComplete'));
      return finishTrial(state, { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player);
    }
  }

  let s = { ...state, combat: { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player };
  s = applyPendingMastery(s, pending);
  return s;
}