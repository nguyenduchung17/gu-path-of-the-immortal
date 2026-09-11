export const ESSENCE_REASON = Object.freeze({
  EFFECT: 'EFFECT',
  SAVE_MIGRATION: 'SAVE_MIGRATION',
  OFFLINE_RECOVERY: 'OFFLINE_RECOVERY',
  CULTIVATION_COST: 'CULTIVATION_COST',
  BREAKTHROUGH_COST: 'BREAKTHROUGH_COST',
  BREAKTHROUGH_RESTORE: 'BREAKTHROUGH_RESTORE',
  ACTIVE_RECOVERY: 'ACTIVE_RECOVERY',
  PAID_RECOVERY: 'PAID_RECOVERY',
  ITEM: 'ITEM',
  GU_EFFECT: 'GU_EFFECT',
  GU_COST: 'GU_COST',
  KILLER_MOVE_COST: 'KILLER_MOVE_COST',
  COMBAT_TECHNIQUE: 'COMBAT_TECHNIQUE',
  EXPLORATION_COST: 'EXPLORATION_COST',
  EVENT: 'EVENT',
  DEATH_PENALTY: 'DEATH_PENALTY',
  REFINEMENT_COST: 'REFINEMENT_COST',
});

const REASONS = new Set(Object.values(ESSENCE_REASON));
const HISTORY_LIMIT = 80;

// The only gameplay path for changing current Essence. It validates the cause,
// clamps the result to the aperture, and records a compact audit trail in the
// character save. Callers can request either a delta or an exact target.
export function changeEssence(player, change) {
  if (!player || !change || !REASONS.has(change.reason)) {
    throw new Error(`[essence] invalid or missing reason: ${change?.reason || 'none'}`);
  }
  const hasDelta = Number.isFinite(change.delta);
  const hasTarget = Number.isFinite(change.setTo);
  if (hasDelta === hasTarget) throw new Error('[essence] provide exactly one of delta or setTo');

  const max = Math.max(0, Number(player.maxPrimevalEssence) || 0);
  const before = Math.min(max, Math.max(0, Number(player.primevalEssence) || 0));
  const requested = hasTarget ? Number(change.setTo) : before + Number(change.delta);
  const after = Math.min(max, Math.max(0, requested));
  if (after === before) return { ...player, primevalEssence: after };

  const entry = {
    reason: change.reason,
    before,
    after,
    delta: after - before,
    at: Date.now(),
    ...(change.source ? { source: String(change.source) } : {}),
  };
  return {
    ...player,
    primevalEssence: after,
    essenceHistory: [...(player.essenceHistory || []), entry].slice(-HISTORY_LIMIT),
  };
}

// Combat resolves against a cloned player object and intentionally mutates that
// clone. This adapter keeps those hot paths on the same audited API.
export function mutateEssence(player, change) {
  Object.assign(player, changeEssence(player, change));
  return player;
}

