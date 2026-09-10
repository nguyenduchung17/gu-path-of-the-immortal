import { GU_BY_ID } from '../data/gu';
import { ENEMY_BY_ID } from '../data/enemies';
import { ITEM_BY_ID } from '../data/items';
import { applyEffects } from './effects';

export function initCombat(enemyId, player) {
  const def = ENEMY_BY_ID[enemyId];
  return {
    enemyId,
    enemy: { ...def, maxHp: def.hp, hp: def.hp, statuses: [] },
    playerStatuses: [],
    cooldowns: {},
    log: [`A ${def.name} blocks your path!`],
    revealed: false,
    rounds: 0,
    over: false,
    result: null,
  };
}

const effValue = (statuses, type) => statuses.filter(s => s.type === type).reduce((a, s) => a + (s.power || 0), 0);
const hasStatus = (statuses, type) => statuses.some(s => s.type === type);

function elementBuffMul(playerStatuses, element) {
  let m = 1;
  for (const s of playerStatuses) if (s.type === 'buff' && s.element === element) m *= (1 + s.power / 100);
  return m;
}

function applyGu(gu, player, enemy, pSt, eSt, combat, push) {
  const e = gu.effect;
  if (e.attack) {
    let dmg = e.attack.power + Math.floor(player.strength * 0.5);
    dmg = Math.floor(dmg * elementBuffMul(pSt, gu.element));
    if (gu.id === 'bloodHunter' && enemy.hp < enemy.maxHp * 0.5) { dmg = Math.floor(dmg * 1.5); push('Blood Hunter feasts on the wounded!'); }
    dmg = Math.max(1, dmg - Math.floor(enemy.defense * 0.5));
    enemy.hp -= dmg;
    push(`${gu.name} strikes ${enemy.name} for ${dmg} damage.`);
    if (e.attack.stun && Math.random() * 100 < e.attack.stun) { eSt.push({ type: 'stun', power: 0, duration: 1 }); push(`${enemy.name} is stunned!`); }
  }
  if (e.defense) { pSt.push({ type: 'defense', power: e.defense.power, duration: e.defense.duration }); push(`${gu.name} hardens your defense.`); }
  if (e.evasion) { pSt.push({ type: 'evasion', power: e.evasion.power, duration: e.evasion.duration }); push(`${gu.name} blurs your form.`); }
  if (e.barrier) { pSt.push({ type: 'barrier', power: e.barrier.power, duration: e.barrier.duration }); push(`${gu.name} raises a barrier.`); }
  if (e.heal) { const h = e.heal.power; player.hp = Math.min(player.maxHp, player.hp + h); push(`${gu.name} restores ${h} HP.`); }
  if (e.essence) { const r = e.essence.power; player.primevalEssence = Math.min(player.maxPrimevalEssence, player.primevalEssence + r); push(`${gu.name} restores ${r} essence.`); }
  if (e.control) { eSt.push({ type: 'control', power: e.control.power, duration: e.control.duration }); push(`${gu.name} binds ${enemy.name}, weakening its strikes.`); }
  if (e.buff) { pSt.push({ type: 'buff', element: e.buff.element, power: e.buff.power, duration: e.buff.duration }); push(`${gu.name} empowers your ${e.buff.element} Gu.`); }
  if (e.investigate) { combat.revealed = true; push(`${gu.name} reveals the enemy's intent.`); }
}

function enemyAct(enemy, player, pSt, push) {
  const ev = effValue(pSt, 'evasion');
  if (ev > 0 && Math.random() * 100 < ev) { push(`You dodge ${enemy.name}'s attack!`); return; }
  let dmg = enemy.attack + Math.floor(Math.random() * 3);
  dmg = Math.max(1, dmg - effValue(enemy.statuses, 'control'));
  dmg = Math.max(1, dmg - effValue(pSt, 'defense'));
  const bar = pSt.find(s => s.type === 'barrier' && s.power > 0);
  if (bar) { const absorb = Math.min(bar.power, dmg); bar.power -= absorb; dmg -= absorb; push(`Your barrier absorbs ${absorb} damage.`); }
  player.hp -= dmg;
  push(`${enemy.name} attacks for ${dmg} damage.`);
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
    }
    const nd = s.duration - 1;
    if (nd > 0 && !(s.type === 'barrier' && s.power <= 0)) out.push({ ...s, duration: nd });
  }
  return out;
}

function finishVictory(state, combat, player) {
  const enemy = combat.enemy;
  const items = {};
  for (const d of enemy.drops || []) {
    if (Math.random() * 100 < (d.chance || 100)) items[d.itemId] = (items[d.itemId] || 0) + (d.qty || 1);
  }
  const spiritStones = Math.floor(enemy.maxHp / 4) + Math.floor(Math.random() * 5);
  const exp = Math.floor(15 + enemy.maxHp / 4);
  let s = { ...state, player, combat: { ...combat, over: true, result: 'victory', rewards: { items, spiritStones, exp } } };
  s = applyEffects(s, { items, spiritStones, exp, message: `Victory! +${exp} insight, +${spiritStones} stones.` });
  s.quests = { ...s.quests, kills: { ...s.quests.kills, [enemy.id]: (s.quests.kills[enemy.id] || 0) + 1 } };
  return s;
}

function finishDefeat(state, combat, player) {
  const p = { ...player, hp: Math.max(1, Math.floor(player.maxHp * 0.2)), primevalEssence: 0, currentArea: 'greenValley', x: 8, y: 6, spiritStones: Math.floor(player.spiritStones * 0.8) };
  const log = [...combat.log, 'You collapse... You wake in Green Valley, battered and lighter of purse.'];
  return { ...state, player: p, combat: { ...combat, log, over: true, result: 'defeat' }, log: [...state.log, 'You were defeated in combat.'] };
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

  if (action.type === 'flee') {
    const hasWind = state.player.equippedGu.some(id => { const g = state.ownedGu.find(o => o.instanceId === id); return g && GU_BY_ID[g.guId].id === 'windStep'; });
    const chance = 40 + player.agility * 2 + (hasWind ? 20 : 0);
    if (Math.random() * 100 < chance) {
      push('You slipped away into the mist!');
      return { ...state, combat: { ...combat, log, over: true, result: 'flee' }, player };
    }
    push('You failed to escape!');
  } else if (action.type === 'item') {
    const it = ITEM_BY_ID[action.itemId];
    if (!it || !it.use) return state;
    if ((state.inventory[it.category]?.[action.itemId] || 0) <= 0) return state;
    if (it.use.hp) { player.hp = Math.min(player.maxHp, player.hp + it.use.hp); }
    if (it.use.essence) { player.primevalEssence = Math.min(player.maxPrimevalEssence, player.primevalEssence + it.use.essence); }
    push(`You use ${it.name}.`);
    combat.usedItem = action.itemId;
  } else if (action.type === 'gu') {
    const inst = state.ownedGu.find(g => g.instanceId === action.guInstanceId);
    if (!inst) return state;
    const gu = GU_BY_ID[inst.guId];
    if (player.primevalEssence < gu.energyCost) { push('Not enough primeval essence!'); return state; }
    if ((cooldowns[inst.instanceId] || 0) > 0) { push(`${gu.name} is on cooldown.`); return state; }
    player.primevalEssence -= gu.energyCost;
    cooldowns[inst.instanceId] = gu.cooldown;
    applyGu(gu, player, enemy, pSt, eSt, combat, push);
  }

  if (enemy.hp <= 0) { push(`${enemy.name} is defeated!`); return finishVictory(state, { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player); }

  if (hasStatus(eSt, 'stun')) { push(`${enemy.name} is stunned and cannot move!`); }
  else { enemyAct(enemy, player, pSt, push); }

  eSt = tick(eSt, push, enemy, 'enemy');
  pSt = tick(pSt, push, player, 'player');
  for (const k in cooldowns) cooldowns[k] = Math.max(0, cooldowns[k] - 1);
  combat.rounds++;

  if (player.hp <= 0) { push('You have been defeated...'); return finishDefeat(state, { ...combat, enemy, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player); }

  return { ...state, combat: { ...combat, enemy: { ...enemy, statuses: eSt }, playerStatuses: pSt, cooldowns, log, revealed: combat.revealed }, player };
}