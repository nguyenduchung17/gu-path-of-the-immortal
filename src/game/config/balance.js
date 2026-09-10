// Central game-balance configuration — every tunable number lives here.
export const BALANCE = {
  cultivation: {
    essenceCostBase: 8,      // cultivate cost = base + perRank * rank
    essenceCostPerRank: 4,
    progressBase: 5,         // % progress per session before modifiers
    progressPerInt: 0.2,     // % per point of intelligence
    progressCap: 12,         // max % per session
    sectBonus: 1.5,          // multiplier at the Azure Cloud Sect marker
  },
  recovery: {
    fullRecoverySeconds: 270,     // 0 -> max essence at Rank 1
    rankEfficiencyPerStage: 0.02, // -2% recovery time per cultivation stage
    minRecoverySeconds: 180,
    acceleratedMultiplier: 2,
    acceleratedCost: 100,
    instantCost: 300,
    tickMs: 1000,
  },
  mastery: {
    tiers: [
      { level: 1, title: 'Initiate', xp: 500 },
      { level: 2, title: 'Apprentice', xp: 800 },
      { level: 3, title: 'Skilled', xp: 1200 },
      { level: 4, title: 'Expert', xp: 1800 },
      { level: 5, title: 'Master', xp: 2600 },
    ],
    xpCombatUse: 12,
    xpVictoryBonus: 25,
    xpRefineSuccess: 30,
    xpRefineFail: 6,
    xpRecipeDiscovery: 15,
    repeatDecay: [1, 0.5, 0.25, 0.25, 0], // multiplier per repeated use in one fight
  },
  refinement: {
    baseSuccess: 60,
    successPerInt: 1.5,
    successPerLuck: 0.5,
  },
  combat: {
    victoryProgress: 2,     // % cultivation progress per victory
    weaknessBonusPct: 25,   // damage bonus when Gu path matches enemy weakness
  },
};

export function recoveryRatePerSec(player, mode) {
  const cfg = BALANCE.recovery;
  const stage = player.rank * 4 + (player.stage || 0);
  const secs = Math.max(cfg.minRecoverySeconds, cfg.fullRecoverySeconds * (1 - cfg.rankEfficiencyPerStage * stage));
  return (player.maxPrimevalEssence / secs) * (mode === 'accelerated' ? cfg.acceleratedMultiplier : 1);
}