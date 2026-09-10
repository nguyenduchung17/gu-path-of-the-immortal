// STRENGTH PATH (LỰC ĐẠO) — the body itself is the weapon.
// Pure helpers only (no i18n, no engine imports) so data, reducer, mastery
// and combat can all share them without import cycles.
import { PATH_BY_ID } from '../data/paths';

// Does this cultivator practice the Strength Path at all? Unlike the per-Gu
// damage paths, the Strike / vitality bonuses ARE the Path's identity, so a
// stranger to the Path gets no baseline level-1 bonus — it must be earned by
// starting Strength or discovering the Path.
export function strengthLevelOf(state) {
  if (state?.mastery?.strength) return state.mastery.strength.level;
  if ((state?.knownPaths || []).includes('strength')) return 1;
  return 0;
}

// Merged Strength mastery effects at the cultivator's current level.
export function strengthFxOf(state) {
  const def = PATH_BY_ID.strength;
  const level = strengthLevelOf(state);
  const fx = {};
  if (!level) return fx;
  for (let i = 0; i < Math.min(level, def.levels.length); i++) {
    for (const [k, v] of Object.entries(def.levels[i].fx || {})) fx[k] = (fx[k] || 0) + v;
  }
  return fx;
}

// LỰC THẾ (Strength Momentum) — stacks held as plain player statuses
// (type 'force'); combat.js adds/removes them and reads the count here.
export function forceOf(playerStatuses) {
  return (playerStatuses || []).filter(s => s.type === 'force').length;
}

// The mastery Max-HP bonus (configurable in paths.js levels), summed to the
// cultivator's level. Level 0 (stranger) = 0%.
export function strengthHpPct(level) {
  const def = PATH_BY_ID.strength;
  let pct = 0;
  for (let i = 0; i < Math.min(level, def.levels.length); i++) pct += def.levels[i].fx?.maxHpPct || 0;
  return pct;
}

// Fold the Strength vitality bonus into maxHp. player.baseMaxHp holds the
// UN-bonused stage pool, so the bonus can never stack with itself across
// breakthroughs, mastery level-ups or reloads. Growing the pool also grows
// current HP by the same delta; shrinking only clamps.
export function syncVitality(player, level) {
  const base = player.baseMaxHp ?? player.maxHp;
  const pct = strengthHpPct(level);
  const newMax = Math.max(1, Math.round(base * (1 + pct / 100)));
  if (player.maxHp === newMax && (player.strengthHpPct || 0) === pct) {
    return { ...player, baseMaxHp: base, strengthHpPct: pct };
  }
  const prevMax = player.maxHp || newMax;
  const hp = Math.min(newMax, Math.max(1, (player.hp ?? newMax) + Math.max(0, newMax - prevMax)));
  return { ...player, baseMaxHp: base, strengthHpPct: pct, maxHp: newMax, hp };
}