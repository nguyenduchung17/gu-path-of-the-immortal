// Central game-balance configuration — every tunable number lives here.
import { recoveryMulOf } from './aptitude';

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
    elite: { resistPct: 50 }, // share of damage a boss negates from its resisted Paths
    killerActivation: {     // Killer-Move activation chance (normal Gu: 100%)
      base: 85,
      perMasteryLevel: 3,   // + per path mastery level
      repeatPenalty: 10,    // − per prior use of the same Gu this battle
      min: 40, max: 100,
    },
  },
  world: {
    respawnMs: 4 * 60 * 1000,        // world enemy respawn timer
    gatherRespawnMs: 3 * 60 * 1000,  // gathering node respawn timer
    campSafeRadius: 2,               // recovery near a campsite is never interrupted
    recoveryInterruptRadius: 7,      // enemies this close can notice a meditating player
    recoveryInterruptChance: 12,     // % per tick that a nearby enemy interrupts recovery
    detect: { passive: 0, territorial: 3, aggressive: 4, predator: 6, guard: 5 },
    leash: 8,                        // how far from home an enemy will chase
    giveUpDist: 5,                   // losing the player by this margin ends the chase
    activeRadius: 16,                // enemies beyond this distance idle (performance)
  },
  inn: { mealItemId: 'simpleMeal' },
  // The accelerated game clock. Baseline: 1 real second = 1 in-game minute.
  time: {
    tickMs: 1000,             // real-time heartbeat of the clock
    minutesPerTick: 1,       // game minutes gained per tick
    startDay: 1,
    startMinutes: 7 * 60,    // new cultivators begin at 07:00
    moveMinutes: 1,          // per action, in game minutes
    gatherMinutes: 5,
    cultivateMinutes: 20,
    refineMinutes: 15,
    tradeMinutes: 2,
    talkMinutes: 1,
    combatRoundMinutes: 1,
    recoveryMinutesPerTick: 2,
    campRestMinutes: 30,
    arenaMinutes: 5,
    sleepToMinutes: 7 * 60,  // "sleep until morning" target
    sleepFadeMs: 1800,       // night-transition animation length
    nightDetectBonus: 1,      // enemies notice you farther in the dark
    nightGatherBonus: { moonPetal: 1 }, // moonlit materials yield more at night
  },
};

// Difficulty modes — one config object, never hardcoded elsewhere.
// Harder modes raise RISK and REWARD together (reward increases stay moderate).
export const DIFFICULTIES = {
  easy: {
    key: 'easy', label: 'EASY',
    enemyHpMul: 0.75, enemyDmgMul: 0.75, dropMul: 1.3, priceMul: 0.85, refinePct: 0,
    progressLoss: 0, inventoryLoss: 0, stonesLoss: 0, respawn: 'nearestInn',
  },
  standard: {
    key: 'standard', label: 'STANDARD',
    enemyHpMul: 1, enemyDmgMul: 1, dropMul: 1, priceMul: 1, refinePct: 0,
    progressLoss: 0.3, inventoryLoss: 0.25, stonesLoss: 0.15, respawn: 'random',
  },
  hard: {
    key: 'hard', label: 'HARD',
    enemyHpMul: 1.2, enemyDmgMul: 1.2, dropMul: 1.15, priceMul: 1.15, refinePct: 0,
    progressLoss: 0.5, inventoryLoss: 0.5, stonesLoss: 0.3, respawn: 'random',
  },
  trueCultivation: {
    key: 'trueCultivation', label: 'TRUE CULTIVATION',
    enemyHpMul: 1.45, enemyDmgMul: 1.5, dropMul: 1.25, priceMul: 1.25, refinePct: -5,
    permadeath: true, respawn: 'none',
  },
};

export function diffOf(state) {
  return DIFFICULTIES[state?.difficulty] || DIFFICULTIES.standard;
}

// What a merchant charges this character, after difficulty and reputation.
export function shopPrice(base, state) {
  const rep = state?.reputation?.merchants || 0;
  return Math.max(1, Math.floor(base * diffOf(state).priceMul * (1 - rep * 0.02)));
}

export function recoveryRatePerSec(player, mode) {
  const cfg = BALANCE.recovery;
  const stage = player.rank * 4 + (player.stage || 0);
  const secs = Math.max(cfg.minRecoverySeconds, cfg.fullRecoverySeconds * (1 - cfg.rankEfficiencyPerStage * stage));
  // aptitude (and any Special Constitution) speeds essence recovery
  const apt = player.aptitude && typeof player.aptitude === 'object' ? player.aptitude : null;
  const aptMul = apt ? recoveryMulOf(apt) : 1;
  return (player.maxPrimevalEssence / secs) * aptMul * (mode === 'accelerated' ? cfg.acceleratedMultiplier : 1);
}