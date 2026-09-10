import { GU_BY_ID } from '../data/gu';
import { ENEMY_BY_ID } from '../data/enemies';
import { ITEM_BY_ID } from '../data/items';
import { PATH_BY_ID, SYNERGIES } from '../data/paths';
import { applyEffects } from './effects';
import { grantMastery, bonusOf } from './mastery';
import { BALANCE, DIFFICULTIES } from '../config/balance';
import { applyDeath } from './death';

export function initCombat(enemyId, player, opts = {}) {
  const def = opts.def || ENEMY_BY_ID[enemyId];
  const d = DIFFICULTIES[opts.difficulty] || DIFFICULTIES.standard;
  const maxHp = Math.max(1, Math.round(def.hp * d.enemyHpMul));
  const startHp = Math.min(maxHp, Math.max(1, Math.round((opts.hp ?? def.hp) * d.enemyHpMul)));
  return {
    enemyId: def.id,
    enemy: { ...def, attack: Math.max(1, Math.round(def.attack * d.enemyDmgMul)), maxHp, hp: startHp, statuses: [] },
    hpScale: d.enemyHpMul,
    worldId: opts.worldId || null,
    arena: opts.arena || null,
    playerStatuses: [],
    cooldowns: {},
    log: [opts.intro || `A ${def.name} blocks your path!`],
    revealed: false,
    rounds: 0,
    over: false,
    result: null,
    masteryUses: {},   // per-Gu-instance use counter (anti-spam mastery decay)
    contributed: {},   // paths that meaningfully affected the enemy
  };
}

const effValue = (statuses, type) => statuses.filter(s => s.type === type).reduce((a, s) => a + (s.power || 0), 0);
const hasStatus = (statuses, type) => statuses.some(s => s.type === type);

function elementBuffMul(playerStatuses, element) {
  let m = 1;
  for (const s of playerStatuses) if (s.type === 'buff' && s.element === element) m *= (1 + s.power / 100);
  return m;
}

// Essence cost after the Gu's path mastery discounts.
export function effectiveCost(gu, state) {
  const fx = bonusOf(state, gu.path);
  return Math.max(0, Math.ceil(gu.energyCost * (1 - (fx.costPct || 0) / 100)));
}

function activeSynergies(state) {
  const equipped = new Set(state.player.equippedGu.map(id => {
    const inst = state.ownedGu.find(g => g.instanceId === id);
    return inst && GU_BY_ID[inst.guId]?.path;
  }));
  return new Set(SYNERGIES.filter(sy => sy.paths.every(p => equipped.has(p))).map(sy => sy.id));
}

function applyGu(gu, player, enemy, pSt, eSt, combat, push, fx, syn) {
  const e = gu.effect;
  let meaningful = false;
  if (e.attack) {
    const hits = e.attack.hits || 1;
    for (let h = 0; h < hits; h++) {
      let dmg = e.attack.power + Math.floor(player.strength * 0.5);
      dmg = Math.floor(dmg * elementBuffMul(pSt, gu.element));
      dmg = Math.floor(dmg * (1 + (fx.damagePct || 0) / 100));
      if (gu.path === enemy.weakness) {
        dmg = Math.floor(dmg * (1 + BALANCE.combat.weaknessBonusPct / 100));
        push(`The ${PATH_BY_ID[gu.path].name} roars — ${enemy.name} is vulnerable!`);
      }
      if (gu.path === 'fire' && syn.has('windFan')) dmg = Math.floor(dmg * 1.1);
      if (gu.id === 'bloodHunter' && enemy.hp < enemy.maxHp * 0.5) { dmg = Math.floor(dmg * 1.5); push('Blood Hunter feasts on the wounded!'); }
      dmg = Math.max(1, dmg - Math.floor(enemy.defense * 0.5));
      enemy.hp -= dmg;
      push(`${gu.name} strikes ${enemy.name} for ${dmg} damage.`);
      meaningful = true;
    }
    if (e.attack.stun && Math.random() * 100 < e.attack.stun) { eSt.push({ type: 'stun', power: 0, duration: 1 }); push(`${enemy.name} is stunned!`); meaningful = true; }
  }
  if (e.burn) {
    eSt.push({ type: 'burn', power: e.burn.power, duration: e.burn.duration + (fx.burnTurns || 0) });
    push(`${enemy.name} is set ablaze!`);
    meaningful = true;
  }
  if (e.summon) {
    const p = Math.floor(e.summon.power * (1 + (fx.summonPct || 0) / 100) * (syn.has('tamedTides') ? 1.15 : 1));
    eSt.push({ type: 'summon', power: p, duration: (e.summon.duration || 3) + (fx.summonTurns || 0) });
    push(`Your enslaved beast answers the pact — it will strike for ${p} each turn.`);
    meaningful = true;
  }
  if (e.defense) { pSt.push({ type: 'defense', power: Math.floor(e.defense.power * (1 + (fx.defensePct || 0) / 100)), duration: e.defense.duration }); push(`${gu.name} hardens your defense.`); }
  if (e.evasion) { pSt.push({ type: 'evasion', power: Math.floor(e.evasion.power * (1 + (fx.evasionPct || 0) / 100)), duration: e.evasion.duration }); push(`${gu.name} blurs your form.`); }
  if (e.barrier) {
    const power = Math.floor(e.barrier.power * (1 + (fx.barrierPct || 0) / 100) * (syn.has('mountainSpring') ? 1.15 : 1));
    pSt.push({ type: 'barrier', power, duration: e.barrier.duration });
    push(`${gu.name} raises a barrier of ${power} strength.`);
  }
  if (e.heal) { const h = Math.floor(e.heal.power * (1 + (fx.healPct || 0) / 100)); player.hp = Math.min(player.maxHp, player.hp + h); push(`${gu.name} restores ${h} HP.`); }
  if (e.essence) { const r = e.essence.power; player.primevalEssence = Math.min(player.maxPrimevalEssence, player.primevalEssence + r); push(`${gu.name} restores ${r} essence.`); }
  if (e.control) { eSt.push({ type: 'control', power: Math.floor(e.control.power * (1 + (fx.controlPct || 0) / 100)), duration: e.control.duration }); push(`${gu.name} binds ${enemy.name}, weakening its strikes.`); meaningful = true; }
  if (e.buff) { pSt.push({ type: 'buff', element: e.buff.element, power: e.buff.power, duration: e.buff.duration }); push(`${gu.name} empowers your ${e.buff.element} Gu.`); }
  if (e.investigate) { combat.revealed = true; push(`${gu.name} reveals the enemy's intent.`); }
  return meaningful;
}

function enemyAct(enemy, player, pSt, push, windEvasion, thorns) {
  const ev = effValue(pSt, 'evasion') + windEvasion;
  if (ev > 0 && Math.random() * 100 < ev) { push(`You dodge ${enemy.name}'s attack!`); return; }
  let dmg = enemy.attack + Math.floor(Math.random() * 3);
  dmg = Math.max(1, dmg - effValue(enemy.statuses, 'control'));
  dmg = Math.max(1, dmg - effValue(pSt, 'defense'));
  const bar = pSt.find(s => s.type === 'barrier' && s.power > 0);
  if (bar) { const absorb = Math.min(bar.power, dmg); bar.power -= absorb; dmg -= absorb; push(`Your barrier absorbs ${absorb} damage.`); }
  player.hp -= dmg;
  push(`${enemy.name} attacks for ${dmg} damage.`);
  if (thorns) { enemy.hp -= thorns; push(`${enemy.name} is cut by thorns for ${thorns} damage.`); }
  if (enemy.abilities && enemy.abilities.includes('poison') && Math.random() < 0.4) {
    pSt.push({ type: 'poison', power: 3, duration: 3 }); push('You are poisoned!');
  }
}

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
  for (const m of pending) s = grantMastery(s, m.pathId, m.xp, 'guUsed');
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
  const masteryGains = [];
  for (const pathId of Object.keys(combat.contributed)) {
    s = grantMastery(s, pathId, BALANCE.mastery.xpVictoryBonus, 'kills');
    masteryGains.push({ pathId, xp: BALANCE.mastery.xpVictoryBonus });
  }
  s = applyPendingMastery(s, pending);
  for (const m of pending) masteryGains.push(m);
  s = { ...s, combat: { ...s.combat, rewards: { ...s.combat.rewards, mastery: masteryGains } } };
  s.quests = { ...s.quests, kills: { ...s.quests.kills, [enemy.id]: (s.quests.kills[enemy.id] || 0) + 1 } };
  return s;
}

function finishDefeat(state, combat, player) {
  if (combat.arena) {
    const ap = { ...player, hp: Math.max(1, Math.floor(player.maxHp * 0.3)) };
    const alog = [...combat.log, 'The arena master halts the duel. Your stake is forfeit.'];
    return { ...state, player: ap, combat: { ...combat, log: alog, over: true, result: 'defeat' }, log: [...state.log, 'You were defeated in the arena.'] };
  }
  return applyDeath(state, combat, player, 'defeated in combat');
}

export function executeRound(state, action) {
  if (!state.combat || state.combat.over) return state;
  let combat = { ...state.combat, enemy: { ...state.combat.enemy, statuses: state.combat.enemy.statuses.map(s => ({ ...s })) } };
  let player = { ...state.player };
  let log = combat.log.slice();
  let cooldowns = { ...combat.cooldowns };
  let pSt = combat.playerStatuses.map(s => ({ ...s }));
  let eSt = combat.enemy.statuses;
  let enemy = combat.enemy;
  const push = (m) => log.push(m);
  const syn = activeSynergies(state);
  const windFx = bonusOf(state, 'wind');
  const earthFx = bonusOf(state, 'earth');
  const pending = [];

  if (action.type === 'flee') {
    const hasWind = state.player.equippedGu.some(id => { const g = state.ownedGu.find(o => o.instanceId === id); return g && GU_BY_ID[g.guId].id === 'windStep'; });
    const chance = 40 + player.agility * 2 + (hasWind ? 20 : 0) + (windFx.fleePct || 0);
    if (Math.random() * 100 < chance) {
      push('You slipped away into the mist!');
      return { ...state, combat: { ...combat, log, over: true, result: 'flee' }, player };
    }
    push('You failed to escape!');
  } else if (action.type === 'item') {
    const it = ITEM_BY_ID[action.itemId];
    if (!it || !it.use) return state;
    if ((state.inventory[it.category]?.[action.itemId] || 0) <= 0) return state;
    if (it.use.hp) player.hp = Math.min(player.maxHp, player.hp + it.use.hp);
    if (it.use.essence) player.primevalEssence = Math.min(player.maxPrimevalEssence, player.primevalEssence + it.use.essence);
    push(`You use ${it.name}.`);
    combat.usedItem = action.itemId;
  } else if (action.type === 'gu') {
    const inst = state.ownedGu.find(g => g.instanceId === action.guInstanceId);
    if (!inst) return state;
    const gu = GU_BY_ID[inst.guId];
    const cost = effectiveCost(gu, state);
    if (player.primevalEssence < cost) { push('Not enough primeval essence!'); return { ...state, combat: { ...combat, log } }; }
    if ((cooldowns[inst.instanceId] || 0) > 0) { push(`${gu.name} is on cooldown.`); return { ...state, combat: { ...combat, log } }; }
    player.primevalEssence -= cost;
    cooldowns[inst.instanceId] = gu.cooldown;
    const fx = bonusOf(state, gu.path);
    const meaningful = applyGu(gu, player, enemy, pSt, eSt, combat, push, fx, syn);
    if (meaningful) {
      combat.contributed[gu.path] = true;
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

  if (enemy.hp <= 0) { push(`${enemy.name} is defeated!`); return finishVictory(state, { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player, pending); }

  if (hasStatus(eSt, 'stun')) { push(`${enemy.name} is stunned and cannot move!`); }
  else { enemyAct(enemy, player, pSt, push, windFx.evasionPct || 0, earthFx.thorns || 0); }

  eSt = tick(eSt, push, enemy, 'enemy');
  pSt = tick(pSt, push, player, 'player');
  if (syn.has('mountainSpring') && player.hp > 0) { player.hp = Math.min(player.maxHp, player.hp + 2); }
  for (const k in cooldowns) cooldowns[k] = Math.max(0, cooldowns[k] - 1);
  combat.rounds++;

  if (player.hp <= 0) { push('You have been defeated...'); return finishDefeat(state, { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player); }
  if (enemy.hp <= 0) { push(`${enemy.name} is defeated!`); return finishVictory(state, { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player, pending); }

  let s = { ...state, combat: { ...combat, enemy: { ...enemy, statuses: eSt }, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player };
  s = applyPendingMastery(s, pending);
  return s;
}