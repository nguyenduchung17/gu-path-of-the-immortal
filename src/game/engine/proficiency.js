import { BALANCE } from '../config/balance';

// Per-Gu proficiency — the bond between a cultivator and one specific Gu
// instance deepens with use. Separate from Dao-path mastery (which tracks
// the PATH as a whole): proficiency is practice with THIS companion, and it
// improves both its combat power and its exploration-effect duration.
export function proficiencyOf(inst) {
  const cfg = BALANCE.proficiency;
  const uses = inst?.uses || 0;
  const level = Math.min(cfg.maxLevel, 1 + Math.floor(uses / cfg.usesPerLevel));
  const floorAt = (level - 1) * cfg.usesPerLevel;
  const nextAt = level * cfg.usesPerLevel;
  const maxed = level >= cfg.maxLevel;
  return {
    uses,
    level,
    maxed,
    nextAt: maxed ? null : nextAt,
    pct: maxed ? 100 : Math.round(((uses - floorAt) / (nextAt - floorAt)) * 100),
    powerPct: (level - 1) * cfg.powerPerLevel,
    durationPct: (level - 1) * cfg.durationPerLevel,
  };
}

// Record one meaningful use on the instance. Returns the new state plus the
// level the Gu just reached (null when no threshold was crossed).
export function recordUse(state, instanceId) {
  const inst = (state.ownedGu || []).find(g => g.instanceId === instanceId);
  if (!inst) return { state, leveledTo: null };
  const before = proficiencyOf(inst).level;
  const uses = (inst.uses || 0) + 1;
  const after = proficiencyOf({ ...inst, uses });
  return {
    state: { ...state, ownedGu: state.ownedGu.map(g => g.instanceId === instanceId ? { ...g, uses } : g) },
    leveledTo: after.level > before ? after.level : null,
  };
}