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
  const maxHp = Math.max(1, Math.round(def.hp * d.enemyHpMul));
  const startHp = Math.min(maxHp, Math.max(1, Math.round((opts.hp ?? def.hp) * d.enemyHpMul)));
  const eBase = enemySpeedOf(def);
  const maxStab = maxStabilityOf(def);
  const statuses = (opts.statuses || []).map(s => ({ ...s }));
  return {
    enemyId: def.id,
    enemy: {
      ...def,
      attack: Math.max(1, Math.round(def.attack * d.enemyDmgMul)),
      maxHp, hp: startHp,
      baseSpeed: eBase,
      statuses,
      stability: opts.stability ?? maxStab,
      maxStability: maxStab,
      ai: aiOf(def),
      aiCounters: {},
      telegraph: null,          // announced heavy move, executes on its next action
    },
    hpScale: d.enemyHpMul,
    speeds: { player: playerSpeedOf(player) },
    // action-order clock: each side's next action time; the player opens.
    nextAct: { player: 0, enemy: actDelay(eBase, statuses) },
    clock: 0,
    worldId: opts.worldId || null,
    wildGuId: opts.wildGuId || null,
    arena: opts.arena || null,
    trial: opts.trial || null,
    playerStatuses: (opts.playerStatuses || []).map(s => ({ ...s })),
    cooldowns: {},
    log: [opts.intro || `A ${def.name} blocks your path!`],
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
function applyStabilityDamage(enemy, combat, amount, push) {
  const cfg = BALANCE.combat.break;
  if (amount <= 0 || hasStatus(enemy.statuses, 'broken')) return;
  enemy.stability = Math.max(0, (enemy.stability ?? enemy.maxStability) - Math.round(amount));
  if (enemy.stability <= 0) {
    enemy.statuses.push({ type: 'broken', power: 0, duration: cfg.brokenDuration });
    enemy.stability = Math.round(enemy.maxStability * 0.4);
    combat.nextAct.enemy += actDelay(enemy.baseSpeed, enemy.statuses) * cfg.delayPct / 100;
    if (enemy.telegraph) { enemy.telegraph = null; push(`The blow lands clean — ${enemy.name}'s charged attack is scattered!`); }
    push(`⚡ ${enemy.name}'s guard SHATTERS — BROKEN! Its defense collapses and its next action is thrown into disarray.`);
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
        push(`${enemy.name} shrugs off the ${PATH_BY_ID[gu.path].name} essence.`);
      }
      dmg = Math.floor(dmg * (1 + weatherModOf(weather, gu.path) / 100));
      dmg = Math.floor(dmg * (1 + (fx.damagePct || 0) / 100));
      if (gu.path === enemy.weakness) {
        dmg = Math.floor(dmg * (1 + BALANCE.combat.weaknessBonusPct / 100));
        push(`The ${PATH_BY_ID[gu.path].name} roars — ${enemy.name} is vulnerable!`);
      }
      // path synergy — lightning races across a soaked hide
      if (gu.element === 'lightning' && hasStatus(eSt, 'soaked')) {
        dmg = Math.floor(dmg * 1.4);
        push(`The lightning races across ${enemy.name}'s soaked hide!`);
      }
      // setup pays off: broken/exposed targets take amplified damage
      dmg = Math.floor(dmg * damageTakenMul(enemy));
      const guard = eSt.find(s => s.type === 'guard');
      if (guard) { dmg = Math.floor(dmg * (1 - (guard.power || 0) / 100)); push(`${enemy.name} hunkers behind its guard.`); }
      dmg = Math.max(1, dmg - Math.floor(effDefenseOf(enemy) * 0.5));
      enemy.hp -= dmg;
      push(`${gu.name} strikes ${enemy.name} for ${dmg} damage.`);
      meaningful = true;
    }
    if (e.attack.stun && Math.random() * 100 < e.attack.stun) {
      if (enemy.immune?.includes('stun')) push(`${enemy.name}'s will is iron — it cannot be stunned.`);
      else { eSt.push({ type: 'stun', power: 0, duration: 1 }); push(`${enemy.name} is stunned!`); meaningful = true; }
    }
    // Killer fire feasts on burning foes — consuming the Burn for a burst
    if (killer && gu.element === 'fire' && hasStatus(eSt, 'burn')) {
      const feast = eSt.filter(s => s.type === 'burn').reduce((a, s) => a + s.power, 0) * 2;
      for (let i = eSt.length - 1; i >= 0; i--) if (eSt[i].type === 'burn') eSt.splice(i, 1);
      enemy.hp -= feast;
      push(`The Killer flame feasts on the burning — +${feast} damage!`);
      meaningful = true;
    }
  }
  if (e.burn) {
    let power = Math.max(1, Math.round(e.burn.power * mul));
    let dur = e.burn.duration + (fx.burnTurns || 0);
    if (gu.element === 'fire' && hasStatus(eSt, 'soaked')) {
      power = Math.round(power * 1.5);
      for (let i = eSt.length - 1; i >= 0; i--) if (eSt[i].type === 'soaked') eSt.splice(i, 1);
      push('The flames flash the water to scalding steam!');
    }
    addStatus(eSt, { type: 'burn', power, duration: dur });
    push(`${enemy.name} is set ablaze!`);
    meaningful = true;
  }
  if (e.soak) {
    eSt.push({ type: 'soaked', power: 0, duration: 3 });
    push(`${enemy.name} is drenched — lightning will bite deeper, and fire will scald.`);
    meaningful = true;
  }
  if (e.slow) { eSt.push({ type: 'slow', power: e.slow.power, duration: e.slow.duration }); push(`${enemy.name} is bogged down — its actions come slower.`); meaningful = true; }
  if (e.delay) {
    combat.nextAct.enemy += actDelay(enemy.baseSpeed, eSt) * (e.delay.pct / 100);
    push(`The binding coils — ${enemy.name}'s next action is dragged back.`);
    meaningful = true;
  }
  if (e.expose) { eSt.push({ type: 'weakness', power: e.expose.power, duration: e.expose.duration }); push(`${enemy.name} is left exposed — it will take more damage.`); meaningful = true; }
  if (e.armorBreak) { eSt.push({ type: 'armorBreak', power: e.armorBreak.power, duration: e.armorBreak.duration }); push(`${enemy.name}'s guard is cracked — its defense is weakened.`); meaningful = true; }
  if (e.self?.haste) { pSt.push({ type: 'haste', power: e.self.haste.power, duration: e.self.haste.duration }); push(`${gu.name} quickens your form — your next actions come sooner.`); }
  if (e.stab) applyStabilityDamage(enemy, combat, e.stab * (mul >= 1 ? 1 : 0.75), push);
  if (e.summon) {
    const p = Math.max(1, Math.floor(e.summon.power * mul * (1 + (fx.summonPct || 0) / 100) * (syn.has('tamedTides') ? 1.15 : 1)));
    eSt.push({ type: 'summon', power: p, duration: (e.summon.duration || 3) + (fx.summonTurns || 0) });
    push(`Your enslaved beast answers the pact — it will strike for ${p} each turn.`);
    meaningful = true;
  }
  if (e.defense) { pSt.push({ type: 'defense', power: Math.max(1, Math.floor(e.defense.power * mul * (1 + (fx.defensePct || 0) / 100))), duration: e.defense.duration }); push(`${gu.name} hardens your defense.`); }
  if (e.evasion) { pSt.push({ type: 'evasion', power: Math.max(1, Math.floor(e.evasion.power * mul * (1 + (fx.evasionPct || 0) / 100))), duration: e.evasion.duration }); push(`${gu.name} blurs your form.`); }
  if (e.barrier) {
    const power = Math.max(1, Math.floor(e.barrier.power * mul * (1 + (fx.barrierPct || 0) / 100) * (syn.has('mountainSpring') ? 1.15 : 1)));
    pSt.push({ type: 'barrier', power, duration: e.barrier.duration });
    push(`${gu.name} raises a barrier of ${power} strength.`);
  }
  if (e.heal) { const h = Math.max(1, Math.floor(e.heal.power * mul * (1 + (fx.healPct || 0) / 100))); player.hp = Math.min(player.maxHp, player.hp + h); push(`${gu.name} restores ${h} HP.`); }
  if (e.essence) { const r = Math.max(1, Math.round(e.essence.power * mul)); player.primevalEssence = Math.min(player.maxPrimevalEssence, player.primevalEssence + r); push(`${gu.name} restores ${r} essence.`); }
  if (e.control) {
    if (enemy.immune?.includes('control')) push(`${enemy.name} breaks the binding — its mind is not its own to seize.`);
    else { eSt.push({ type: 'control', power: Math.max(1, Math.floor(e.control.power * mul * (1 + (fx.controlPct || 0) / 100))), duration: e.control.duration }); push(`${gu.name} binds ${enemy.name}, weakening its strikes.`); meaningful = true; }
  }
  if (e.buff) { pSt.push({ type: 'buff', element: e.buff.element, power: Math.round(e.buff.power * mul), duration: e.buff.duration }); push(`${gu.name} empowers your ${e.buff.element} Gu.`); }
  if (e.investigate) { combat.revealed = true; push(`${gu.name} reveals the enemy's intent.`); }
  return meaningful;
}

function playerGuardDr(pSt, dmg, push) {
  const g = pSt.find(s => s.type === 'guard');
  if (!g) return dmg;
  const out = Math.max(1, Math.floor(dmg * (1 - (g.power || 0) / 100)));
  push(`Your guard blunts the blow (${dmg} → ${out}).`);
  return out;
}

function enemyAct(enemy, player, pSt, push, windEvasion, thorns) {
  const ev = effValue(pSt, 'evasion') + windEvasion;
  if (ev > 0 && Math.random() * 100 < ev) { push(`You dodge ${enemy.name}'s attack!`); return; }
  let dmg = enemy.attack + Math.floor(Math.random() * 3);
  dmg = Math.max(1, dmg - effValue(enemy.statuses, 'control'));
  dmg = Math.max(1, dmg - effValue(pSt, 'defense'));
  dmg = playerGuardDr(pSt, dmg, push);
  const bar = pSt.find(s => s.type === 'barrier' && s.power > 0);
  if (bar) { const absorb = Math.min(bar.power, dmg); bar.power -= absorb; dmg -= absorb; push(`Your barrier absorbs ${absorb} damage.`); }
  player.hp -= dmg;
  push(`${enemy.name} attacks for ${dmg} damage.`);
  if (thorns) { enemy.hp -= thorns; push(`${enemy.name} is cut by thorns for ${thorns} damage.`); }
  if (enemy.abilities && enemy.abilities.includes('poison')) {
    const resist = (player.foodBuffs || []).filter(b => b.type === 'poisonResist').reduce((a, b) => a + (b.power || 0), 0);
    if (Math.random() < 0.4 * (1 - Math.min(90, resist) / 100)) {
      addStatus(pSt, { type: 'poison', power: 3, duration: 3 }); push('You are poisoned!');
    }
  }
}

// The telegraphed heavy blow — announced one action ahead so Defend, delay,
// stuns or a BREAK can answer it.
function executeTelegraph(enemy, player, pSt, push) {
  const tg = enemy.telegraph;
  enemy.telegraph = null;
  const ev = effValue(pSt, 'evasion');
  if (ev > 0 && Math.random() * 100 < Math.max(0, ev - 15)) { push(`You slip clear of ${tg.name}!`); return; }
  let dmg = Math.round(enemy.attack * (tg.power || 1.8)) + Math.floor(Math.random() * 6);
  dmg = Math.max(1, dmg - Math.floor(effValue(pSt, 'defense') * 1.5));
  dmg = playerGuardDr(pSt, dmg, push);
  const bar = pSt.find(s => s.type === 'barrier' && s.power > 0);
  if (bar) { const absorb = Math.min(bar.power, dmg); bar.power -= absorb; dmg -= absorb; push(`Your barrier absorbs ${absorb} of the blow.`); }
  player.hp -= dmg;
  push(`${tg.name} hits you for ${dmg} damage!`);
}

// Archetype AI: tanks guard when hurt, skirmishers haste, poisoners stack
// venom, brutes/predators telegraph heavy moves on a rhythm.
function enemyAI(enemy, player, pSt, eSt, push, windEvasion, thorns) {
  const c = enemy.aiCounters || (enemy.aiCounters = {});
  c.acts = (c.acts || 0) + 1;
  const def = enemy;
  if (enemy.ai === 'brute' && enemy.hp < enemy.maxHp * 0.5 && !hasStatus(eSt, 'guard') && Math.random() < 0.4) {
    eSt.push({ type: 'guard', power: 40, duration: 1 });
    push(`${enemy.name} hunkers behind its bulk — its guard is up.`);
    return;
  }
  if (enemy.ai === 'skirmisher' && enemy.hp < enemy.maxHp * 0.7 && !c.hasted) {
    c.hasted = true;
    eSt.push({ type: 'haste', power: 25, duration: 2 });
    push(`${enemy.name} moves like quicksilver — its next actions come faster!`);
    return;
  }
  if (enemy.ai === 'poisoner' && Math.random() < 0.6) {
    let dmg = Math.max(1, Math.round(enemy.attack * 0.6) - effValue(pSt, 'defense'));
    dmg = playerGuardDr(pSt, dmg, push);
    player.hp -= dmg;
    addStatus(pSt, { type: 'poison', power: 3, duration: 3 });
    push(`${enemy.name} sinks its fangs in for ${dmg} damage — venom floods your veins!`);
    return;
  }
  const every = def.charge?.every || (enemy.ai === 'brute' ? 3 : 4);
  if (!enemy.telegraph && c.acts % every === 0) {
    enemy.telegraph = { name: def.charge?.name || 'a savage surge', power: def.charge?.power || 1.8 };
    push(`${enemy.name} gathers monstrous power — ${enemy.telegraph.name} comes next! BRACE YOURSELF!`);
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
      push(`${who === 'player' ? 'You suffer' : target.name + ' suffers'} ${s.power} poison damage.`);
    } else if (s.type === 'burn') {
      target.hp -= s.power;
      push(`${target.name} suffers ${s.power} burn damage.`);
    } else if (s.type === 'summon') {
      target.hp -= s.power;
      push(`Your enslaved beast strikes ${target.name} for ${s.power} damage.`);
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
  s = applyEffects(s, { items, spiritStones, progress, recipes: droppedRecipes, message: `Victory! +${spiritStones} primordial stones, +${progress}% cultivation progress.` });
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
    const alog = [...combat.log, 'The arena master halts the duel. Your stake is forfeit.'];
    return { ...state, player: ap, combat: { ...combat, log: alog, over: true, result: 'defeat' }, log: [...state.log, 'You were defeated in the arena.'] };
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
      push('You slipped away into the mist!');
      // Escaping is a generic action — no mastery for Flee itself; only a Gu
      // that actively carried the escape (Wind Step) earns its Path a little.
      if (hasWind) push(`Wind Step carries your escape — Wind mastery +${BALANCE.mastery.xpFleeAssist}.`);
      let s = { ...state, combat: { ...combat, enemy, playerStatuses: pSt, log, over: true, result: 'flee' }, player };
      if (hasWind) s = grantMastery(s, 'wind', BALANCE.mastery.xpFleeAssist, 'guUsed', 'guUse');
      return s;
    }
    push('You failed to escape!');
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
      push('The toxins wash from your blood — the poison is cured.');
    }
    if (it.use.buff) { player = applyFoodBuff(player, it.use.buff, state.time); push(`${it.name}'s effect settles over you.`); }
    push(`You use ${it.name}.`);
    combat.usedItem = action.itemId;
  } else if (action.type === 'strike') {
    // free basic attack — preserves essence, chips the enemy's GUARD
    const sc = cfg.strike;
    let dmg = Math.floor(sc.power + player.strength * sc.perStr);
    dmg = Math.floor(dmg * damageTakenMul(enemy));
    const guard = eSt.find(s => s.type === 'guard');
    if (guard) { dmg = Math.floor(dmg * (1 - (guard.power || 0) / 100)); push(`${enemy.name} hunkers behind its guard.`); }
    dmg = Math.max(1, dmg - Math.floor(effDefenseOf(enemy) * 0.5));
    enemy.hp -= dmg;
    push(`You strike ${enemy.name} for ${dmg} damage.`);
    applyStabilityDamage(enemy, combat, Math.round(sc.stab + player.strength * sc.stabPerStr), push);
  } else if (action.type === 'observe') {
    // free recon: reveal the foe and steady your Killer-Move focus
    const oc = cfg.observe;
    combat.revealed = true;
    const regen = Math.min(player.maxPrimevalEssence - player.primevalEssence, oc.essence);
    player.primevalEssence += regen;
    pSt.push({ type: 'focus', power: oc.focusPct, duration: 3 });
    push(`You read ${enemy.name}'s intent — weaknesses and tells laid bare. (+${regen} essence, Killer Move focus +${oc.focusPct}%)`);
  } else if (action.type === 'defend') {
    const dc = cfg.defend;
    pSt.push({ type: 'guard', power: dc.dmgRedPct, duration: 1 });
    const regen = Math.ceil(player.maxPrimevalEssence * dc.essenceRegenPct / 100);
    player.primevalEssence = Math.min(player.maxPrimevalEssence, player.primevalEssence + regen);
    push(`You brace behind your Gu aura — the next blows are blunted (-${dc.dmgRedPct}% damage, +${regen} essence).`);
  } else if (action.type === 'gu') {
    const inst = state.ownedGu.find(g => g.instanceId === action.guInstanceId);
    if (!inst) return state;
    const gu = GU_BY_ID[inst.guId];
    const cond = guCondition(state, inst);
    const prof = proficiencyOf(inst); // a practiced Gu strikes harder
    const cost = effectiveCost(gu, state, inst);
    if (player.primevalEssence < cost) { push('Not enough primeval essence!'); return { ...state, combat: { ...combat, log } }; }
    if ((cooldowns[inst.instanceId] || 0) > 0) { push(`${gu.name} is on cooldown.`); return { ...state, combat: { ...combat, log } }; }
    player.primevalEssence -= cost;
    cooldowns[inst.instanceId] = gu.cooldown;
    actAdvancePct = gu.effect.advance?.pct || 0;
    actSelfDelayPct = gu.effect.selfDelay?.pct || 0;
    if (actAdvancePct) push(`You flow like the wind — your next action comes ${actAdvancePct}% sooner.`);
    if (actSelfDelayPct) push(`The essence sits heavy — your next action comes ${actSelfDelayPct}% later.`);
    let activated = true;
    if (isKillerMove(gu)) {
      const chance = activationChanceOf(gu, inst, state, combat);
      if (Math.random() * 100 > chance) {
        activated = false;
        push(`${gu.name} fails to activate! The essence burns away.`);
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
          push(`${PATH_BY_ID[gu.path].icon} ${PATH_BY_ID[gu.path].name} mastery +${xp}`);
          pending.push({ pathId: gu.path, xp });
        }
      }
    }
  }

  // a meaningful use deepens the cultivator's bond with this specific Gu
  if (guUsedName) {
    const res = recordUse(state, action.guInstanceId);
    state = res.state;
    if (res.leveledTo) push(`${guUsedName} grows practiced — Proficiency Lv.${res.leveledTo}! (effect power +${(res.leveledTo - 1) * BALANCE.proficiency.powerPerLevel}%)`);
  }

  // cooldowns tick per OWNER action — the player's own actions
  for (const k in cooldowns) cooldowns[k] = Math.max(0, cooldowns[k] - 1);
  combat.rounds++;

  if (enemy.hp <= 0) {
    push(`${enemy.name} is defeated!`);
    const done = { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed };
    if (combat.trial) return finishTrial(state, done, player);
    return finishVictory(state, done, player, pending);
  }

  // elite enrage — once per battle, crossing the threshold ignites a fury
  if (enemy.enrage && !combat.enraged && enemy.hp > 0 && enemy.hp <= enemy.maxHp * enemy.enrage.at) {
    combat.enraged = true;
    enemy.attack = Math.max(1, Math.round(enemy.attack * (1 + (enemy.enrage.atkPct || 0) / 100)));
    enemy.defense = Math.max(0, enemy.defense - (enemy.enrage.defPen || 0));
    push(`${enemy.name} ENRAGES — its blows fall like landslides, but its guard drops!`);
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
      push(`${enemy.name}'s charged attack is INTERRUPTED!`);
    }
    if (hasStatus(eSt, 'broken')) {
      push(`${enemy.name} reels, guard shattered — the opening is yours!`);
    } else if (hasStatus(eSt, 'stun')) {
      push(`${enemy.name} is stunned and cannot move!`);
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
    if (enemy.hp <= 0) break;
  }

  if (player.hp <= 0) { push('You have been defeated...'); return finishDefeat(state, { ...combat, enemy, statuses: eSt, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player); }
  if (enemy.hp <= 0) {
    push(`${enemy.name} is defeated!`);
    const done = { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed };
    if (combat.trial) return finishTrial(state, done, player);
    return finishVictory(state, done, player, pending);
  }
  // a master's trial: survive N of the player's own actions, or deal set damage
  if (combat.trial && player.hp > 0) {
    const tr = combat.trial;
    const passed = tr.type === 'survive' ? combat.rounds >= tr.turns : (enemy.maxHp - enemy.hp) >= (tr.amount || 0);
    if (passed) {
      push('The master raises a hand — the trial is complete.');
      return finishTrial(state, { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player);
    }
  }

  let s = { ...state, combat: { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player };
  s = applyPendingMastery(s, pending);
  return s;
}