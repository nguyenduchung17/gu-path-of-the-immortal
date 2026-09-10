// Killer Moves (Sát Chiêu) — static design data: what each Dao Path
// contributes when its Gu serves as a Support, which Path pairings clash,
// and the known Blueprints. All runtime logic lives in engine/killerMoves.js.
import { SYNERGIES } from './paths';
import { rolesOf } from './roles';

// Opposed Path pairings — a Support from the opposing current destabilizes
// the technique (Poor compatibility).
export const KM_OPPOSED = [
  ['fire', 'water'],
  ['fire', 'ice'],
  ['earth', 'wind'],
  ['lightning', 'earth'],
];

// What a Path adds when its Gu supports the Core. The Core's own effect is
// the skeleton; each Support grafts its Path's signature onto it (numbers
// stack, object powers add). `activation` is a plain stability bonus.
export const KM_SUPPORT_FX = {
  fire: { burn: { power: 3, duration: 2 } },
  wind: { advance: { pct: 12 }, self: { momentum: { power: 5, cap: 5 } } },
  lightning: { attack: { paralysis: { chance: 15, duration: 1 } } },
  ice: { attack: { freeze: { chance: 12, duration: 1 } }, slow: { power: 20, duration: 2 } },
  poison: { poison: { power: 2, duration: 3 } },
  earth: { stab: 10 },
  water: { essenceRecovery: { chance: 30, min: 1, max: 3 } },
  sword: { attack: { crit: 10, armorPen: 15 } },
  strength: { stab: 12 },
  enslavement: { summon: { power: 4, duration: 2 } },
  refinement: { activation: 5 }, // the crafter's insight steadies the technique
};

// Blueprints — role/Path-based requirements (never exact Gu names) with
// research bonuses. Owned blueprints make creation easier; a successful
// experiment on a matching pattern records the blueprint forever.
export const KM_BLUEPRINTS = [
  {
    id: 'bpFlameGale',
    core: { roles: ['attack'], element: 'fire' },
    supports: [{ path: 'wind' }, { any: true }],
    successPct: 20, stabilityPct: 10,
  },
  {
    id: 'bpSwordStorm',
    core: { path: 'sword', roles: ['attack'] },
    supports: [{ path: 'wind' }, { any: true }],
    successPct: 20, stabilityPct: 10,
  },
  {
    id: 'bpIronHowl',
    core: { roles: ['attack'], paths: ['strength', 'earth'] },
    supports: [{ paths: ['strength', 'earth'] }, { any: true }],
    successPct: 20, stabilityPct: 10,
  },
];

export const BLUEPRINT_BY_ID = Object.fromEntries(KM_BLUEPRINTS.map(b => [b.id, b]));

// Does one Gu satisfy a blueprint slot spec (roles derived from its effect)?
function specMatch(spec, gu) {
  if (!spec || spec.any) return true;
  if (spec.path && gu.path !== spec.path) return false;
  if (spec.paths && !spec.paths.includes(gu.path)) return false;
  if (spec.element && gu.element !== spec.element) return false;
  if (spec.roles && !spec.roles.every(r => rolesOf(gu).includes(r))) return false;
  return true;
}

// Requirements are role/Path-based (#8) — a blueprint never names exact Gu.
export function blueprintMatches(bp, coreGu, supportGus) {
  if (!specMatch(bp.core, coreGu)) return false;
  const remaining = [...supportGus];
  for (const spec of bp.supports) {
    const i = remaining.findIndex(g => specMatch(spec, g));
    if (i < 0) return false;
    remaining.splice(i, 1);
  }
  return true;
}