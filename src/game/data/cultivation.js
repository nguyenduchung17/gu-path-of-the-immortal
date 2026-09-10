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

// Requirements to break through FROM stage i (target is stage i+1).
// Not every breakthrough requires every condition — tune freely here.
export const BREAKTHROUGH_REQS = CULTIVATION_STAGES.slice(0, -1).map((s, i) => {
  const major = s.stage === 3;
  const req = {
    target: CULTIVATION_STAGES[i + 1],
    major,
    // scales with the realm being reached — never trivial next to the pool
    essence: Math.round(CULTIVATION_STAGES[i + 1].maxEssence * (major ? 0.18 : 0.12)),
    stones: major ? 40 * (s.rank + 1) : 0,
    items: {},
    masteryLevel: 0,
  };
  if (major && s.rank === 2) req.items = { beastCore: 2 };
  if (major && s.rank === 3) req.items = { beastCore: 3 };
  if (major && s.rank === 4) req.items = { beastCore: 5, moonPetal: 3 };
  if (major && s.rank >= 2) req.masteryLevel = s.rank; // any single Path at this level
  return req;
});