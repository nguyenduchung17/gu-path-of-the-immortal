// Migrates v1 saves (realm/exp system) to the v2 stage/mastery system.
import { CULTIVATION_STAGES } from '../data/cultivation';
import { GU_BY_ID } from '../data/gu';

export function migrateSave(old) {
  if (!old || old.version >= 2) return old;
  const p = old.player || {};
  const oldRank = p.realmIndex || 0; // 0 = Mortal, 1..3 = Rank 1..3
  const estStage = Math.min(3, Math.floor((p.exp || 0) / (p.expToNext || 100) * 4));
  const global = Math.max(0, Math.min(19, Math.max(0, oldRank - 1) * 4 + estStage));
  const st = CULTIVATION_STAGES[global];
  const player = {
    ...p,
    rank: Math.floor(global / 4),
    stage: global % 4,
    cultivationProgress: Math.min(99, Math.floor((p.exp || 0) / (p.expToNext || 100) * 100)),
    totalInsight: p.totalInsight || 0,
    maxHp: st.maxHp,
    maxPrimevalEssence: st.maxEssence,
  };
  delete player.realm; delete player.realmIndex; delete player.exp; delete player.expToNext;
  // drop Gu that no longer exist; re-discover their paths
  const ownedGu = (old.ownedGu || []).filter(g => GU_BY_ID[g.guId]);
  const knownPaths = Array.from(new Set(['wind', ...ownedGu.map(g => GU_BY_ID[g.guId].path)]));
  return {
    ...old,
    version: 2,
    player,
    ownedGu,
    mastery: {},
    masteryStats: {},
    knownPaths,
    knownRecipes: [],
    recovery: null,
    breakthrough: null,
    toasts: [],
    log: [...(old.log || []), 'The world shifts — cultivation now follows twenty stages and the Dao Paths awaken.'],
  };
}