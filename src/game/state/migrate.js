// Save migrations: v1 (realm/exp) → v2 (stages/mastery) → v3 (large world)
//                 → v4 (game clock, difficulty modes, save slots).
import { CULTIVATION_STAGES } from '../data/cultivation';
import { GU_BY_ID } from '../data/gu';
import { initialEnemies } from '../data/world';

export function migrateSave(old) {
  if (!old) return old;
  let s = old;

  if (s.version < 2) {
    const p = s.player || {};
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
    const ownedGu = (s.ownedGu || []).filter(g => GU_BY_ID[g.guId]);
    const knownPaths = Array.from(new Set(['wind', ...ownedGu.map(g => GU_BY_ID[g.guId].path)]));
    s = {
      ...s,
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
      log: [...(s.log || []), 'The world shifts — cultivation now follows twenty stages and the Dao Paths awaken.'],
    };
  }

  if (s.version < 3) {
    s = {
      ...s,
      version: 3,
      player: { ...s.player, currentArea: 'greenValleyRegion', x: 42, y: 44 },
      contribution: s.contribution || { greenValley: 0 },
      missions: { active: [], completed: [] },
      arena: { wins: 0, losses: 0 },
      worldState: {
        gathered: {},
        discovered: { zones: { greenValleyTown: true }, landmarks: { townGate: true, teleportFormation: true } },
        enemies: initialEnemies(),
      },
      log: [...(s.log || []), 'The world has opened — roads, wilderness, ruins and distant dangers await beyond the town walls.'],
    };
  }

  if (s.version < 4) {
    const disc = s.worldState?.discovered || {};
    s = {
      ...s,
      version: 4,
      difficulty: s.difficulty || 'standard',
      time: s.time || { day: 1, min: 7 * 60 },
      playtimeSec: s.playtimeSec || 0,
      deceased: null,
      sleeping: null,
      worldState: {
        ...s.worldState,
        discovered: { ...disc, inns: { ...(disc.inns || {}), townInn: true } },
      },
      log: [...(s.log || []), 'The world breathes — day and night now pass over the Green Valley.'],
    };
  }

  return s;
}