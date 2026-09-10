export const ENEMIES = [
  {
    id: 'wildWolf', name: 'Wild Wolf', hp: 30, attack: 8, defense: 2, speed: 6,
    abilities: [], weakness: 'fire',
    drops: [{ itemId: 'beastCore', chance: 50, qty: 1 }, { itemId: 'herb', chance: 40, qty: 1 }, { itemId: 'beastBlood', chance: 40, qty: 1 }],
    description: 'A gaunt wolf prowling the valley. Weak alone, dangerous in packs.',
  },
  {
    id: 'poisonSpider', name: 'Poison Spider', hp: 26, attack: 6, defense: 1, speed: 5,
    abilities: ['poison'], weakness: 'fire',
    drops: [{ itemId: 'shadowSilk', chance: 35, qty: 1 }, { itemId: 'herb', chance: 45, qty: 1 }, { itemId: 'mistSilk', chance: 40, qty: 1 }],
    description: 'Lurks in misted hollows. Its bite festers long after the fight.',
  },
  {
    id: 'stoneBeast', name: 'Stone Beast', hp: 50, attack: 7, defense: 6, speed: 3,
    abilities: [], weakness: 'wind',
    drops: [{ itemId: 'ore', chance: 70, qty: 1 }, { itemId: 'beastCore', chance: 40, qty: 1 }],
    description: 'A lumbering beast with hide like granite. Patience beats power here.',
  },
  {
    id: 'bloodCrow', name: 'Blood Crow', hp: 22, attack: 7, defense: 1, speed: 8,
    abilities: [], weakness: 'wind',
    drops: [{ itemId: 'herb', chance: 40, qty: 1 }, { itemId: 'beastCore', chance: 25, qty: 1 }, { itemId: 'windCrystal', chance: 30, qty: 1 }],
    description: 'Quick and vicious. It strikes before you can steady yourself.',
  },
  {
    id: 'forestSerpent', name: 'Forest Serpent', hp: 34, attack: 8, defense: 2, speed: 6,
    abilities: ['poison'], weakness: 'fire',
    drops: [{ itemId: 'beastCore', chance: 50, qty: 1 }, { itemId: 'herb', chance: 50, qty: 1 }, { itemId: 'serpentGland', chance: 25, qty: 1 }],
    recipeDrops: [{ recipeId: 'flameSerpent', chance: 10 }],
    description: 'Slips through the undergrowth, fangs dripping venom.',
  },
  {
    id: 'shadowHound', name: 'Shadow Hound', hp: 45, attack: 11, defense: 3, speed: 9,
    abilities: [], weakness: 'fire',
    drops: [{ itemId: 'shadowSilk', chance: 60, qty: 1 }, { itemId: 'beastCore', chance: 50, qty: 1 }, { itemId: 'windCrystal', chance: 25, qty: 1 }],
    description: 'A hound woven from living shadow. Fast, cruel, and silent.',
  },
  {
    id: 'ancientGuardian', name: 'Ancient Guardian', hp: 90, attack: 12, defense: 8, speed: 3,
    abilities: [], weakness: 'fire',
    drops: [{ itemId: 'ironOre', chance: 70, qty: 1 }, { itemId: 'beastCore', chance: 80, qty: 1 }, { itemId: 'fireEssence', chance: 30, qty: 1 }],
    description: 'A stone sentinel guarding forgotten halls. It does not tire.',
  },
  {
    id: 'mutatedBeast', name: 'Mutated Beast', hp: 70, attack: 14, defense: 4, speed: 7,
    abilities: ['poison'], weakness: 'earth',
    drops: [{ itemId: 'beastCore', chance: 90, qty: 1 }, { itemId: 'fireEssence', chance: 50, qty: 1 }, { itemId: 'beastBlood', chance: 60, qty: 1 }, { itemId: 'serpentGland', chance: 20, qty: 1 }],
    description: 'Twisted by stray primeval essence. Unpredictable and savage.',
  },
  {
    id: 'bandit', name: 'Roving Bandit', hp: 40, attack: 9, defense: 3, speed: 5,
    abilities: [], weakness: 'none',
    drops: [{ itemId: 'spiritStone', chance: 100, qty: 3 }],
    description: 'A desperate thief. Dangerous to the weak, trivial to the prepared.',
  },
  {
    id: 'wildBoar', name: 'Wild Boar', hp: 26, attack: 6, defense: 2, speed: 4,
    abilities: [], weakness: 'fire',
    drops: [{ itemId: 'beastBlood', chance: 60, qty: 1 }, { itemId: 'herb', chance: 30, qty: 1 }],
    description: 'A bad-tempered boar rooting through the farmland. Only fights back when provoked.',
  },
  {
    id: 'banditChief', name: 'Bandit Chief', hp: 80, attack: 12, defense: 5, speed: 6,
    abilities: [], weakness: 'wind',
    drops: [{ itemId: 'beastCore', chance: 60, qty: 1 }, { itemId: 'moonPetal', chance: 50, qty: 1 }, { itemId: 'brokenSwordFragment', chance: 100, qty: 1 }],
    description: 'Scarred and shrewd, the leader of the northeast camp. Guards his plunder personally.',
  },
  {
    id: 'ironfangAlpha', name: 'Ironfang Alpha', hp: 120, attack: 16, defense: 6, speed: 9,
    abilities: [], weakness: 'fire',
    drops: [{ itemId: 'beastBlood', chance: 100, qty: 2 }, { itemId: 'beastCore', chance: 100, qty: 2 }, { itemId: 'windCrystal', chance: 60, qty: 1 }],
    description: 'The alpha of the Ironfang pack. Its howl carries across the whole deep forest.',
  },
  // ---- Elite bosses (ancient horrors; lairs in world.js BOSS_SPAWNS) ----
  {
    id: 'mistDevourer', name: 'Mist Devourer', hp: 160, attack: 14, defense: 5, speed: 4,
    abilities: ['poison'], weakness: 'earth', elite: true, respawnMul: 6,
    resists: ['water', 'wind'], immune: ['stun'],
    charge: { name: 'the Devouring Maw', every: 3, power: 2.2 },
    enrage: { at: 0.5, atkPct: 40, defPen: 2 },
    drops: [{ itemId: 'mistHeart', chance: 100, qty: 1 }, { itemId: 'mistSilk', chance: 100, qty: 2 }, { itemId: 'beastCore', chance: 100, qty: 2 }],
    recipeDrops: [{ recipeId: 'phantomTide', chance: 100 }],
    description: 'An ancient mist-serpent grown vast on centuries of stray essence. It breathes the fog, and the fog obeys it.',
  },
  {
    id: 'ruinWarden', name: 'Ruin Warden', hp: 210, attack: 17, defense: 9, speed: 2,
    abilities: [], weakness: 'fire', elite: true, respawnMul: 6,
    resists: ['earth', 'water'], immune: ['stun', 'control'],
    charge: { name: 'the Colossus Slam', every: 4, power: 2.6 },
    enrage: { at: 0.4, atkPct: 30, defPen: 4 },
    drops: [{ itemId: 'wardenCore', chance: 100, qty: 1 }, { itemId: 'ironOre', chance: 100, qty: 2 }, { itemId: 'beastCore', chance: 100, qty: 2 }],
    recipeDrops: [{ recipeId: 'jadeColossus', chance: 100 }],
    description: 'The rune-bound colossus that has kept the ruins since before the sects were founded. It does not chase — it does not need to.',
  },
  {
    id: 'dreadMatriarch', name: 'Dread Matriarch', hp: 190, attack: 16, defense: 4, speed: 8,
    abilities: ['poison'], weakness: 'fire', elite: true, respawnMul: 6,
    resists: ['wind', 'enslavement'], immune: ['control'],
    charge: { name: 'a Rain of Venom', every: 3, power: 1.8 },
    enrage: { at: 0.45, atkPct: 50, defPen: 1 },
    drops: [{ itemId: 'dreadMarrow', chance: 100, qty: 1 }, { itemId: 'shadowSilk', chance: 100, qty: 2 }, { itemId: 'serpentGland', chance: 100, qty: 1 }, { itemId: 'beastCore', chance: 100, qty: 2 }],
    recipeDrops: [{ recipeId: 'nightSwarm', chance: 100 }],
    description: 'The mother of every spider in the mist. Her web spans the whole Ironfang hollow, and she remembers each strand.',
  },
];

export const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map(e => [e.id, e]));

// ---- Ecology & habits ----
// activity:    'nocturnal' (sharper senses & bolder after dark) | 'diurnal' (day creature)
// pack:        same-species kin nearby embolden a fighter and converge on a fight
// ambusher:    can catch an unprepared traveler off guard — a scouting Gu negates it
// stabMul:     how readily its GUARD (stability) shatters (higher = breaks easier)
// stabWeakness: the Path whose techniques find the flaw in its stance (guard damage ×1.5)
export const ECOLOGY = {
  wildWolf:        { activity: 'nocturnal', pack: true, stabMul: 1.25 },
  shadowHound:     { activity: 'nocturnal', pack: true, ambusher: true, stabMul: 1.15 },
  ironfangAlpha:   { activity: 'nocturnal', pack: true, stabWeakness: 'wind' },
  wildBoar:        { activity: 'diurnal' },
  bloodCrow:       { activity: 'diurnal', stabMul: 1.3 },
  forestSerpent:   { activity: 'diurnal', ambusher: true },
  poisonSpider:    { activity: 'nocturnal', ambusher: true, stabMul: 1.2 },
  stoneBeast:      { stabMul: 0.85, stabWeakness: 'earth' },
  mutatedBeast:    { activity: 'nocturnal' },
  bandit:          { activity: 'nocturnal', pack: true },
  ancientGuardian: { stabMul: 0.8, stabWeakness: 'earth' },
  mistDevourer:    { activity: 'nocturnal', stabWeakness: 'earth' },
  ruinWarden:      { stabMul: 0.75, stabWeakness: 'earth' },
  dreadMatriarch:  { activity: 'nocturnal', ambusher: true },
};
export const ecoOf = (id) => ECOLOGY[id] || {};

// Monster visual identity — species kind (distinct silhouette in beastSprites),
// cultivation rank label and danger rating for the proximity nameplate.
// pace: world animation speed per species (ms per frame).
export const ENEMY_VISUALS = {
  wildWolf:        { kind: 'wolf',     rank: 'Rank 1 · Middle Stage', danger: 1, pace: 140 },
  shadowHound:     { kind: 'hound',    rank: 'Rank 2 · Middle Stage', danger: 3, pace: 130 },
  ironfangAlpha:   { kind: 'alpha',    rank: 'Rank 3 · Middle Stage', danger: 5, pace: 150 },
  wildBoar:        { kind: 'boar',     rank: 'Rank 1 · Early Stage',  danger: 1, pace: 240 },
  stoneBeast:      { kind: 'stone',    rank: 'Rank 2 · Early Stage',  danger: 2, pace: 300 },
  mutatedBeast:    { kind: 'mutant',   rank: 'Rank 2 · Late Stage',   danger: 4, pace: 220 },
  bloodCrow:       { kind: 'bird',     rank: 'Rank 1 · Early Stage',  danger: 1, pace: 120 },
  forestSerpent:   { kind: 'snake',    rank: 'Rank 1 · Late Stage',   danger: 2, pace: 200 },
  poisonSpider:    { kind: 'spider',   rank: 'Rank 1 · Middle Stage', danger: 2, pace: 200 },
  ancientGuardian: { kind: 'guardian', rank: 'Rank 3 · Early Stage',  danger: 4, pace: 400 },
  bandit:          { kind: 'bandit',   rank: 'Rank 1 · Late Stage',   danger: 2, pace: 160 },
  banditChief:     { kind: 'chief',    rank: 'Rank 2 · Early Stage',  danger: 3, pace: 170 },
  // master trial opponents (fought only in mentor trials)
  trial_jian:      { kind: 'chief',    rank: 'Rank 5 · Peak Stage',   danger: 5, pace: 170 },
  trial_hound:     { kind: 'hound',    rank: 'Rank 3 · Late Stage',   danger: 3, pace: 130 },
  trial_fang:        { kind: 'bandit', rank: 'Rank 4 · Late Stage', danger: 4, pace: 160 },
  // elite bosses
  mistDevourer:     { kind: 'devourer', rank: 'Rank 3 · Peak Stage', danger: 5, pace: 180 },
  ruinWarden:       { kind: 'warden', rank: 'Rank 3 · Peak Stage', danger: 5, pace: 320 },
  dreadMatriarch:   { kind: 'matriarch', rank: 'Rank 3 · Peak Stage', danger: 5, pace: 150 },
  // wild Gu (world encounters — captured or hunted)
  flameBeetle:  { kind: 'spider', rank: 'Rank 1 · Wild Gu', danger: 1, pace: 280 },
  mistCarp:     { kind: 'snake',   rank: 'Rank 1 · Wild Gu', danger: 1, pace: 320 },
  stoneScarab:  { kind: 'stone',   rank: 'Rank 1 · Wild Gu', danger: 1, pace: 380 },
  galeSparrow:  { kind: 'bird',    rank: 'Rank 1 · Wild Gu', danger: 1, pace: 160 },
  jadeCicada:   { kind: 'bird',    rank: 'Rank 2 · Wild Gu', danger: 2, pace: 260 },
  };

export const DANGER_LABEL = { 1: 'Danger: Low', 2: 'Danger: Moderate', 3: 'Danger: High', 4: 'Danger: Severe', 5: 'Danger: Deadly' };
export const DANGER_COLOR = { 1: '#6ee7a0', 2: '#f0c95a', 3: '#fb923c', 4: '#f87171', 5: '#ff4a5a' };
export const visualOf = (defId) => ENEMY_VISUALS[defId] || { kind: 'wolf', rank: 'Rank 1 · Early Stage', danger: 1, pace: 200 };