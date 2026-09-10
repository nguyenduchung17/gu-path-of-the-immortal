// Combat roles — the second visual axis beside the Dao Path. A Gu's Path
// (Wind, Fire…) says where its power comes from; its role(s) say what job it
// does in battle. Roles are derived from a Gu's effect keys so data stays
// single-sourced; an explicit `roles` array on a Gu overrides the derivation.
export const ROLES = {
  attack: { id: 'attack', icon: '⚔️', tone: 'text-rose-300 border-rose-700/40' },
  defense: { id: 'defense', icon: '🛡️', tone: 'text-sky-300 border-sky-700/40' },
  movement: { id: 'movement', icon: '💨', tone: 'text-emerald-300 border-emerald-700/40' },
  scouting: { id: 'scouting', icon: '🔎', tone: 'text-amber-300 border-amber-700/40' },
  healing: { id: 'healing', icon: '🌿', tone: 'text-lime-300 border-lime-700/40' },
  control: { id: 'control', icon: '⛓️', tone: 'text-violet-300 border-violet-700/40' },
  support: { id: 'support', icon: '✨', tone: 'text-fuchsia-300 border-fuchsia-700/40' },
  debuff: { id: 'debuff', icon: '🪓', tone: 'text-orange-300 border-orange-700/40' },
  summon: { id: 'summon', icon: '🐉', tone: 'text-teal-300 border-teal-700/40' },
};
export const ROLE_IDS = Object.keys(ROLES);

export function rolesOf(gu) {
  if (!gu) return [];
  if (Array.isArray(gu.roles) && gu.roles.length) return gu.roles.filter(r => ROLES[r]);
  const e = gu.effect || {};
  const r = [];
  const add = (x) => { if (!r.includes(x)) r.push(x); };
  if (e.attack || e.stab) add('attack');
  if (e.defense || e.barrier) add('defense');
  if (e.evasion || e.self?.haste || e.advance) add('movement');
  if (e.investigate) add('scouting');
  if (e.heal) add('healing');
  if (e.control || e.delay || e.attack?.stun) add('control');
  if (e.burn || e.slow || e.expose || e.armorBreak || e.soak) add('debuff');
  if (e.summon) add('summon');
  if (e.buff || e.essence) add('support');
  if (!r.length) add('attack');
  return r;
}