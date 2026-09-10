// Enemy Intent — the foe COMMITS its next action one beat ahead, so reading
// and answering the enemy (Defend, delay, a stun, a BREAK) beats mashing the
// strongest attack. Detail shown to the player depends on scouting:
//   base                     → a rough hint (the plan is committed, only its flavor shows)
//   Observe / investigate Gu  → the exact intent + a damage estimate
//   scouting Gu (vision)     → + break weakness + interruptible windows
const has = (st, type) => (st || []).some(s => s.type === type);

// Decide and COMMIT the enemy's next action now, mirroring the archetype AI
// in engine/combat.js — the executed action is always the planned one.
export function planIntent(enemy, eSt) {
  if (enemy.telegraph) return { kind: 'heavy', name: enemy.telegraph.name, power: enemy.telegraph.power };
  const c = enemy.aiCounters || {};
  const acts = (c.acts || 0) + 1;
  const every = enemy.charge?.every || (enemy.ai === 'brute' ? 3 : 4);
  if (acts % every === 0) return { kind: 'heavy', name: enemy.charge?.name || 'a savage surge', power: enemy.charge?.power || 1.8 };
  if (enemy.ai === 'brute' && enemy.hp < enemy.maxHp * 0.5 && !has(eSt, 'guard') && Math.random() < 0.4) return { kind: 'guard' };
  if (enemy.ai === 'skirmisher' && enemy.hp < enemy.maxHp * 0.7 && !c.hasted) return { kind: 'buff' };
  if (enemy.ai === 'poisoner' && Math.random() < 0.6) return { kind: 'poison' };
  return { kind: 'attack' };
}

const KIND = {
  attack: { icon: '⚔', labelKey: 'intent.attack', roughKey: 'intent.rough.attack' },
  heavy:  { icon: '⚠', labelKey: 'intent.heavy',  roughKey: 'intent.rough.heavy' },
  guard:  { icon: '🛡', labelKey: 'intent.guard', roughKey: 'intent.rough.guard' },
  buff:   { icon: '✨', labelKey: 'intent.buff',   roughKey: 'intent.rough.buff' },
  poison: { icon: '☠', labelKey: 'intent.poison', roughKey: 'intent.rough.poison' },
};

// What the player may see of the committed plan, at their scouting level.
export function intentView(combat, enemy) {
  const plan = enemy?.planned;
  if (!plan) return null;
  const meta = KIND[plan.kind] || KIND.attack;
  const heavy = plan.kind === 'heavy';
  const revealed = !!combat.revealed;
  const scouted = !!combat.scouted;
  const v = { kind: plan.kind, icon: meta.icon, heavy, revealed, scouted, roughKey: meta.roughKey, labelKey: meta.labelKey };
  if (heavy) v.name = plan.name; // charged moves are announced publicly
  if (revealed) {
    if (plan.kind === 'attack') v.dmg = (enemy.attack || 0) + 2;
    if (plan.kind === 'heavy') v.dmg = Math.round((enemy.attack || 0) * (plan.power || 1.8)) + 2;
    if (plan.kind === 'poison') { v.dmg = Math.max(1, Math.round((enemy.attack || 0) * 0.6)); v.venom = 3; }
  }
  if (scouted) {
    v.interruptible = heavy;
    v.stabWeak = enemy.stabWeakness || null;
  }
  return v;
}