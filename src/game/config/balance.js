// Central game-balance configuration — every tunable number lives here.
import { recoveryMulOf } from './aptitude';

export const BALANCE = {
  cultivation: {
    essenceCostBase: 5,       // cultivate cost = base + perStage × global stage
    essenceCostPerStage: 1,   // Rank 1: 5→8 essence; later ranks cost more
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
    xpFleeAssist: 4,                 // Wind Step escape assist — small, and only when the Gu carried a successful escape
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
    wildGuRespawnMs: 10 * 60 * 1000, // wild Gu returns to its haunt after capture/kill
  },
  inn: { mealItemId: 'simpleMeal' },
  // Food & consumable economy — a food's worth is never price-per-HP alone:
  //   value = (base + HP·perHp + portability + utility + rarity) × roleAdj
  //   MEAL      cheapest healing per stone, but sit-down fare (inns/settlements)
  //   TRAVEL    portable expedition food, priced above its raw healing
  //   MEDICINAL drinks that trade raw healing for a real, lasting effect
  //   RARE      uncommon cultivation food carrying a premium effect
  // Shop offers read the computed value (items.foodValueOf) — never a
  // hand-typed price — and shopPrice() multipliers apply on top of it.
  foodValue: {
    base: 0.5,
    perHp: 0.1,
    portability: 1.5,            // can be eaten out in the wilderness
    roleAdj: { meal: 1.5, travel: 1.3, medicinal: 1.0, rare: 1.0 },
    utility: { poisonResist: 2, curePoison: 3, statBonus: 4 },
    rarity: { common: 0, uncommon: 2, rare: 5 },
  },
  // Gu hunger — long-term resource management, not micromanagement.
  hunger: {
    maxSatiety: 100,
    decayPerDay: 30,                 // satiety lost per in-game day (feed roughly every ~3 days)
    bands: { wellFedMin: 75, normalMin: 40, hungryMin: 15 },
    penalties: {
      normal:   { effPct: 0,   costPct: 0,  stability: 0 },
      hungry:   { effPct: -5,  costPct: 5,  stability: -5 },
      starving: { effPct: -15, costPct: 5,  stability: -15 },
      critical: { effPct: -40, costPct: 10, stability: -30 },
    },
    criticalDaysToDeath: 2,          // days at 0 satiety before a Gu may die
    autoFeedThreshold: 35,           // auto-feed kicks in below this satiety
    pathFoods: {                     // what each Dao Path's Gu eats
      fire: 'flameGrass', water: 'spiritWater', earth: 'mineralEssence', poison: 'venomSac',
      wind: 'beastMeat', enslavement: 'beastMeat', sword: 'beastMeat', refinement: 'spiritGrass',
    },
  },
  // Vital Gu (Cổ Bản Mệnh) — one bound companion, protected and empowered.
  vital: {
    effBonusPct: 8,
    stabilityBonusPct: 5,
    switchCooldownDays: 3,
    switchPenaltyPct: 20,            // essence recovery penalty after re-binding
    switchPenaltyDays: 1,
  },
  // Wild Gu capture — never guaranteed.
  capture: {
    base: 55,
    perDifficulty: 8,                // − per captureDifficulty point of the species
    rarityPenalty: { common: 0, uncommon: 8, rare: 18, epic: 30, legendary: 45 },
    rankGapPenalty: 12,              // − per species rank above the player's rank
    hpFullPenalty: 15,              // − at full health
    weakenBonusMax: 35,             // + as the target's HP drops
    luckPerPoint: 0.3,
    masteryPerLevel: 2,             // + per relevant path mastery level
    jarBonus: { sealingJar: 0, bindingVessel: 20 },
    observeBonus: 8,
    min: 5, max: 90,
    fleeChance: 50,                 // skittish Gu slips away after a failed capture
    attemptMinutes: 10,
  },
  // Gu rank-up refinement — risky, meaningful, configurable.
  guRefine: {
    maxRank: 5,
    baseSuccess: 70,
    perInt: 1,
    perLuck: 0.5,
    refineMasteryPerLevel: 3,
    rankPenalty: 12,                 // − per target rank above 1
    stonesPerRank: 60,              // × target rank
    essencePerRank: 12,             // × target rank
    foodPerRank: 3,                 // path food × per rank
    corePerRank: 1,                 // beast cores × per rank
    injuryChance: 45,               // on failure
    deathChance: 8,                 // on failure — normal Gu only
    injuryDays: 2,
    injuryEffPct: -30,
    injuryStability: -10,
    severeInjuryDays: 2,
    severeEffPct: -50,
    refineBlockDays: 2,
    rankPowerStep: 25,              // +25% effect power per rank above base
  },
  // Fog of war — the map is discovered by walking, not given.
  fog: {
    revealRadius: 5,                 // tiles revealed around the player as she moves
    visionRadius: 4,                 // "currently visible" bright radius on the map
  },
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

export function recoveryRatePerSec(player, mode = 'normal') {
  return recoveryBreakdown(player, mode).total;
}

// Why the recovery rate is what it is — shown in the Cultivation menu so the
// player sees aptitude has a real, mechanical effect.
export function recoveryBreakdown(player, mode = 'normal') {
  const cfg = BALANCE.recovery;
  const stage = player.rank * 4 + (player.stage || 0);
  const secs = cfg.fullRecoverySeconds * (1 + cfg.rankTimePerStage * stage);
  const base = player.maxPrimevalEssence / secs;
  // aptitude (and any Special Constitution) speeds essence recovery
  const apt = player.aptitude && typeof player.aptitude === 'object' ? player.aptitude : null;
  const aptMul = apt ? recoveryMulOf(apt) : 1;
  // re-binding the Vital Gu leaves the aperture unstable for a while
  const unstableMul = player.vitalUnstableMin > 0 ? (1 - BALANCE.vital.switchPenaltyPct / 100) : 1;
  const accelMul = mode === 'accelerated' ? cfg.acceleratedMultiplier : 1;
  return { base, aptBonus: base * (aptMul - 1), unstableMul, accelMul, total: base * aptMul * unstableMul * accelMul };
}

// Dynamic recovery prices: 1 stone per missing essence (instant), ½ stone
// per missing essence (accelerated) — recomputed live from the current pool.
export function recoveryCosts(player) {
  const cfg = BALANCE.recovery;
  const missing = Math.max(0, Math.ceil(player.maxPrimevalEssence - player.primevalEssence));
  return {
    missing,
    instant: Math.ceil(missing * cfg.instantStonesPerMissing),
    accelerated: Math.ceil(missing * cfg.acceleratedStonesPerMissing),
  };
}