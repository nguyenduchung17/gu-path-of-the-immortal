// Central game-balance configuration — every tunable number lives here.
import { recoveryMulOf, cultivateMulOf } from './aptitude';

export const BALANCE = {
  cultivation: {
    essenceCostPct: 0.10,        // cultivate cost ≈ 10% of current max essence —
    essenceCostMin: 5,           // scales WITH the aperture, never a flat +1
    progressBase: 8,             // % progress per session before modifiers (stage 0)
    progressPerInt: 0.4,        // % per point of intelligence
    progressCap: 12,             // max % per session
    sectBonus: 1.5,              // multiplier at the Azure Cloud Sect terrace
    stageFactor: [1, 0.7, 0.55, 0.45], // realms slow down within a rank
    rankFactor: 0.75,            // …and again per rank above Rank 1
    streakFree: 3,               // back-to-back sessions at full efficiency
    streakStep: 0.1,             // −10% efficiency per session beyond the free ones
    streakMin: 0.6,              // efficiency floor — subtle, never a hard lock
    minorEssenceRestorePct: 40,   // essence refill after a minor stage breakthrough
    majorEssenceRestorePct: 100, // full refill only on a major rank breakthrough
  },
  // Realm Insight (Cảm Ngộ) — the second progression resource, earned by
  // experiencing the world and spent on breakthroughs, so safe-zone
  // cultivation alone can never carry a cultivator through the realms.
  insight: {
    victoryBase: 6, firstKillBonus: 6,   // per combat victory; a species' first kill
    killDecay: [1, 1, 0.8, 0.65, 0.5], killDecayFloor: 0.35, // anti-grind on repeat kills
    zone: 25, landmark: 12, quest: 15, mission: 10,
    capture: 20, refineRecipe: 10, refineGu: 8, trial: 30, arenaWin: 8,
  },
  recovery: {
    // Baseline (C-Tier) seconds for a full 0 → max recovery at Rank 1 Early.
    // Aptitude divides this time; rank STRETCHES it (+15% per stage) so a
    // large high-realm pool stays valuable — the rate improves with rank,
    // but more slowly than the pool itself grows.
    fullRecoverySeconds: 150,
    rankTimePerStage: 0.15,
    acceleratedMultiplier: 2,      // accelerated recovery ≈ half the time
    tickMs: 1000,
    // Dynamic prices — stones per point of MISSING essence, never flat:
    // costs grow with the character and fall as the aperture refills.
    acceleratedStonesPerMissing: 0.5,
    instantStonesPerMissing: 1,
  },
  mastery: {
    tiers: [
      { level: 1, title: 'Initiate', xp: 400 },
      { level: 2, title: 'Apprentice', xp: 650 },
      { level: 3, title: 'Skilled', xp: 1000 },
      { level: 4, title: 'Expert', xp: 1500 },
      { level: 5, title: 'Master', xp: 2100 },
    ],
    xpCombatUse: 16,
    xpVictoryBonus: 35,
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
      brokenBonus: 15,      // + while the enemy is BROKEN
      min: 40, max: 100,
    },
    // Action-order system: every combatant's next action comes after
    // act / Speed time units — Speed decides who moves when, not rigid turns.
    gauge: {
      act: 1000,              // action points per action (delay = act / speed)
      playerBase: 100,        // player Speed = base + agility × perAgi
      perAgi: 4,
      enemyBase: 55,          // enemy Speed = base + data speed × perEnemySpeed
      perEnemySpeed: 9,
      speedMulMin: 0.55,      // Haste/Slow clamps — speed is powerful, never broken
      speedMulMax: 1.9,
      catchUpFactor: 1.6,     // an enemy never falls more than 1.6× its delay behind
    },
    stability: { base: 40, perDefense: 6 },  // enemy GUARD pool = base + defense × perDefense
    // STRIKE — the weak emergency fallback (0 essence): finish wounded foes,
    // chip GUARD, preserve essence. Never outperforms offensive Gu.
    strike: { min: 3, max: 6, perRank: 1, perStr: 0.1, stab: 8, stabPerStr: 0.5, accuracy: 95 },
    crit: { baseChance: 5, dmgMul: 1.5 },       // small critical-hit system — never dominant
    guDamage: { minMul: 0.75, maxMul: 1.25 },   // every Gu attack rolls in a visible range
    observe: { essence: 4, focusPct: 10 },    // free recon + Killer-Move focus
    defend: { dmgRedPct: 40, essenceRegenPct: 8 },
    pack: { atkPct: 15, stabPct: 10 },     // packmates in sight embolden a fighter
    maxPackCombat: 4,                      // the most pack members that may enter ONE battle (#37)
    ambush: { stabLossPct: 35, delayPct: 50 }, // striking the unaware; ambusher species catch travelers
    break: {
      dmgBonusPct: 30,        // a BROKEN enemy takes this much more damage
      delayPct: 80,           // …and its next action is pushed back this share of a delay
      brokenDuration: 2,      // statuses tick on the owner's actions
      stabRegenPctPerAction: 25,
    },
    // Natural enemy recovery between fights (% of max HP per in-game minute).
    // Slow by design — fleeing leaves a wound that persists for a long while.
    regen: { defaultPctPerMin: 0.25, elitePctPerMin: 0.5, stabilityPctPerMin: 5 },
  },
  // STRENGTH PATH (LỰC ĐẠO) — the body as weapon: a sharper basic Strike,
  // deeper vitality (Max HP) and LỰC THẾ (Strength Momentum) built by landing
  // melee hits and devoured by phantom Killer Moves. Never a flat damage
  // multiplier: force stacks gate damage AND GUARD-crushing, and what feeds
  // on momentum cannot also build it.
  strength: {
    force: {
      cap: 5,               // max LỰC THẾ stacks
      dmgPerStackPct: 4,    // per stack: Strength damage +
      breakPerStackPct: 8, // per stack: GUARD (stability) damage +
    },
    killerConsume: { max: 3, dmgPerStackPct: 8 }, // Killer Moves devour stacks for force
    strikeVsFlyingAcc: 25,  // Strike accuracy lost vs airborne foes
    strikeVsFlyingPct: 35,  // Strength Gu damage lost vs airborne foes
    counterDmg: 3,          // SPINED foes rake this back per basic Strike
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
    pack: {
      assistRadius: 12,              // default join-the-fight radius (species overrides in packs.js)
      cohesion: 3,                   // tiles a member may stray from its pack before drifting back
      leaderRespawnMul: 3,           // a fallen leader returns far slower than its packmates (#46)
    },
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
      lightning: 'beastMeat', ice: 'spiritWater', strength: 'beastMeat',
    },
  },
  // Vital Gu (Cổ Bản Mệnh) — one bound companion, protected and empowered.
  vital: {
    effBonusPct: 8,
    stabilityBonusPct: 5,
    switchCooldownDays: 3,
    switchPenaltyPct: 20,            // essence recovery penalty after RE-binding (never the first bond)
    switchPenaltyDays: 1,
    refineRecoveryPct: 15,           // temporary recovery penalty while a failed refinement destabilizes the bond
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
  // FUNCTIONAL VEGETATION — tall grass ('g') and dense growth ('G'): cover that
  // trades a little travel time for a big drop in how far enemies notice you.
  // Keen-nosed species (ECOLOGY.keenSmell) barely fall for it.
  grass: {
    slowMul: { g: 1.1, G: 1.25 },        // step-time multiplier per tile
    detectMul: { g: 0.75, G: 0.65 },     // enemy detection multiplier while the player hides inside
    keenDetectMul: 0.9,                  // keen senses are almost never fooled
    revealDist: 2,                       // a lurking beast rouses within this range
  },
  // KILLER MOVES (Sát Chiêu) — techniques forged from the player's own Gu.
  // Research must be affordable early (#11): essence/stones scale with the
  // number of components, and failure never destroys Gu (#12) — it only
  // strains them for a day and cools the resonance for a short while.
  km: {
    supportDamagePct: 45,                // slice of a Support Gu's damage lent to the move
    supportEffectPct: 60,                // slice of its statuses/protection
    maxHits: 3,
    essencePerSupportPct: 50,            // supports cost half their own essence
    minCooldown: 2, maxCooldown: 6,
    activationBase: 72,
    activationPerMastery: 3,             // per level of the Core Path's mastery
    activationPerSupport: -3,            // complexity makes activation harder
    researchBase: 35,
    researchPerMastery: 4,
    tierBonus: { excellent: 20, good: 12, unstable: 4, poor: -10 },
    refinementPerLevel: 2,               // "Mentor Knowledge" — refinement mastery
    essenceFlat: 8, essencePerComponent: 4,
    stonesPerComponent: 5,
    researchMinutes: 120,
    failCooldownDays: 2,
    strainChance: 50,                    // per component, on a failed experiment
    strainDays: 1,
    masteryXp: 60,                        // to the Core Path on discovery
    minigameHits: 3,
    minigameBonusPerHit: 8,              // each calibration hit, max +24%
    minigameSpeed: 0.05,                 // pulse speed (% per ms)
  },
  // CAVES — separate underground maps with their own fog. Vision underground
  // is a fraction of surface sight; a scouting Gu claws most of it back.
  cave: {
    visionMul: 0.65,                      // surface → cave reveal radius scale
    scoutedMul: 0.9,                      // while a scouting Gu's eye is active
    dark: 0.3,                            // base darkness overlay underground (readable, never black)
    firstEnterInsight: 10,                // Realm Insight for a cave's first descent
    secretInsight: 8,                    // for finding a secret passage
  },
  // Fog of war — the map is discovered by walking, not given.
  fog: {
    revealRadius: 5,                 // tiles revealed around the player as she moves
    visionRadius: 4,                 // "currently visible" bright radius on the map
  },
  // Exploration Gu — dual-use effects outside battle. Costs are essence;
  // durations/cooldowns are game minutes (≈1 real second at rest). Strong
  // enemies partially resist control instead of being fully immune.
  exploration: {
    range: 8,                        // paces for control-Gu targeting
    masteryXp: 15,                   // meaningful-use reward only
    resist: { elite: 0.7, boss: 0.5 }, // duration factor on elite / high-danger foes
    hazardDmg: 3,                    // HP per unprotected step through miasma
    hazardSlowMinutes: { miasma: 2, unstable: 3 }, // extra game minutes per unprotected step
  },
  // Gu proficiency — the bond with one specific Gu instance deepens with
  // meaningful use: combat power and exploration duration improve together.
  // Independent of Dao-path mastery (which tracks the path, not the companion).
  proficiency: {
    usesPerLevel: 10,       // meaningful uses per proficiency level
    maxLevel: 5,
    powerPerLevel: 5,       // +5% combat effect power per level above 1
    durationPerLevel: 10,   // +10% exploration-effect duration per level above 1
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
    cultProgressMul: 1.25, insightMul: 1.2,
    progressLoss: 0, inventoryLoss: 0, stonesLoss: 0, respawn: 'nearestInn',
  },
  standard: {
    key: 'standard', label: 'STANDARD',
    enemyHpMul: 1, enemyDmgMul: 1, dropMul: 1, priceMul: 1, refinePct: 0,
    cultProgressMul: 1, insightMul: 1,
    progressLoss: 0.3, inventoryLoss: 0.25, stonesLoss: 0.15, respawn: 'random',
  },
  hard: {
    key: 'hard', label: 'HARD',
    enemyHpMul: 1.2, enemyDmgMul: 1.2, dropMul: 1.15, priceMul: 1.15, refinePct: 0,
    cultProgressMul: 0.9, insightMul: 0.9,
    progressLoss: 0.5, inventoryLoss: 0.5, stonesLoss: 0.3, respawn: 'random',
  },
  trueCultivation: {
    key: 'trueCultivation', label: 'TRUE CULTIVATION',
    enemyHpMul: 1.45, enemyDmgMul: 1.5, dropMul: 1.25, priceMul: 1.25, refinePct: -5,
    cultProgressMul: 0.95, insightMul: 1,
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

export function recoveryRatePerSec(player, mode = 'normal', nowMin) {
  return recoveryBreakdown(player, mode, nowMin).total;
}

// Why the recovery rate is what it is — shown in the Cultivation menu so the
// player sees aptitude has a real, mechanical effect. Vital-Gu instability is
// an explicit, cause-driven record — never inferred from cultivation.
export function recoveryBreakdown(player, mode = 'normal', nowMin) {
  const cfg = BALANCE.recovery;
  const stage = player.rank * 4 + (player.stage || 0);
  const secs = cfg.fullRecoverySeconds * (1 + cfg.rankTimePerStage * stage);
  const base = player.maxPrimevalEssence / secs;
  // aptitude (and any Special Constitution) speeds essence recovery
  const apt = player.aptitude && typeof player.aptitude === 'object' ? player.aptitude : null;
  const aptMul = apt ? recoveryMulOf(apt) : 1;
  // instability only counts while its recorded window is open
  const inst = player.vitalInstability;
  const active = inst && (nowMin === undefined || nowMin < inst.endMin) ? inst : null;
  const unstableMul = active ? (1 - active.recoveryPct / 100) : 1;
  const accelMul = mode === 'accelerated' ? cfg.acceleratedMultiplier : 1;
  return {
    base,
    aptBonus: base * (aptMul - 1),
    instability: active,
    instabilityRemaining: active && nowMin !== undefined ? Math.max(0, active.endMin - nowMin) : 0,
    unstableMul,
    accelMul,
    total: base * aptMul * unstableMul * accelMul,
  };
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

// Cultivate cost scales WITH the essence pool (≈10% of max) — the aperture
// doubling no longer makes sessions nearly free.
export function cultivationCost(player) {
  const cfg = BALANCE.cultivation;
  return Math.max(cfg.essenceCostMin, Math.round((player.maxPrimevalEssence || 0) * cfg.essenceCostPct));
}

// Diminishing-returns efficiency for back-to-back cultivation sessions —
// meaningful activity (any Realm Insight gain) resets the streak.
export function cultStreakEff(streak) {
  const cfg = BALANCE.cultivation;
  if ((streak || 0) <= cfg.streakFree) return 1;
  return Math.max(cfg.streakMin, 1 - ((streak || 0) - cfg.streakFree) * cfg.streakStep);
}

// Progress % per cultivate session — readably combining stage, rank, streak,
// aptitude, terrace, and difficulty. Returns { gain, eff, cost }.
export function cultivationGain(state, atSect) {
  const cfg = BALANCE.cultivation;
  const p = state.player;
  const base = cfg.progressBase + (p.intelligence || 0) * cfg.progressPerInt;
  const factor = (cfg.stageFactor[p.stage || 0] ?? 0.45) * cfg.rankFactor ** (p.rank || 0);
  const eff = cultStreakEff(p.cultStreak);
  const gain = Math.max(1, Math.min(cfg.progressCap, Math.floor(
    base * factor * cultivateMulOf(p.aptitude) * (atSect ? cfg.sectBonus : 1) * eff * diffOf(state).cultProgressMul)));
  return { gain, eff, cost: cultivationCost(p) };
}