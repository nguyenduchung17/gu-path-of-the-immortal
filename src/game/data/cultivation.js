// 5 ranks x 4 stages = 20 cultivation stages, fully data-driven.
export const STAGE_NAMES = ['Early Stage', 'Middle Stage', 'High Stage', 'Peak Stage'];

// Realm Essence economy: Max Essence = realm base × stage growth × rank
// growth, then × aptitude/constitution modifiers (config/aptitude.js).
// Rank 1 Early base 55 → a B-Tier (~6.3 aptitude) opens with ~66 essence;
// the pool roughly doubles each rank (Rank 3 ≈ 250, Rank 5 ≈ 1000 at B-Tier).
export const ESSENCE = { baseRank: 55, stageGrowth: 1.2, rankGrowth: 2 };
export const RANK_COUNT = 5;
export const STAGES_PER_RANK = 4;

export const CULTIVATION_STAGES = Array.from({ length: RANK_COUNT * STAGES_PER_RANK }, (_, i) => ({
  global: i,
  rank: Math.floor(i / 4),
  stage: i % 4,
  name: `Rank ${Math.floor(i / 4) + 1} · ${STAGE_NAMES[i % 4]}`,
  short: `Rank ${Math.floor(i / 4) + 1} ${['Early', 'Mid', 'High', 'Peak'][i % 4]}`,
  maxHp: 50 + i * 8,
  maxEssence: Math.round(ESSENCE.baseRank * ESSENCE.stageGrowth ** (i % 4) * ESSENCE.rankGrowth ** Math.floor(i / 4)),
}));

export function stageOf(player) {
  return CULTIVATION_STAGES[Math.min(19, player.rank * 4 + (player.stage || 0))];
}

// Realm Insight (Cảm Ngộ) SPENT per breakthrough — earned in the world
// (combat, discovery, quests, refinement, trials), consumed at the door of
// each new stage, so cultivation alone cannot carry a cultivator forward.
const INSIGHT_REQS = [
  20, 35, 60, 100,        // Rank 1 → Rank 2 (the first major milestone)
  140, 180, 230, 300,     // Rank 2 → Rank 3
  350, 420, 500, 600,     // Rank 3 → Rank 4
  680, 780, 880, 1000,    // Rank 4 → Rank 5
  1080, 1180, 1300,
];

// Requirements to break through FROM stage i (target is stage i+1).
// Not every breakthrough requires every condition — different stages ask
// for different things — but a pure safe-zone cultivator always eventually
// runs out of one of them.
export const BREAKTHROUGH_REQS = CULTIVATION_STAGES.slice(0, -1).map((s, i) => {
  const major = s.stage === 3;
  const req = {
    target: CULTIVATION_STAGES[i + 1],
    major,
    // scales with the realm being reached — never trivial next to the pool
    essence: Math.round(CULTIVATION_STAGES[i + 1].maxEssence * (major ? 0.18 : 0.12)),
    stones: major ? 40 * (s.rank + 1) : 0,
    insight: INSIGHT_REQS[i],
    items: {},
    masteryLevel: 0,   // ANY single Path at this level
  };
  if (i === 2) { req.masteryLevel = 2; req.items = { herb: 1 }; }
  if (major) {
    req.masteryLevel = Math.max(3, s.rank + 2);
    req.items = s.rank === 0 ? { herb: 2, beastCore: 1 }
      : s.rank === 1 ? { beastCore: 1 }
      : s.rank === 2 ? { beastCore: 2 }
      : { beastCore: 3, moonPetal: 2 };
  } else if (s.rank >= 2) {
    req.masteryLevel = 2;
  }
  return req;
});