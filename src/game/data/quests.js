// Quest definitions. Objectives: a single legacy `objective` or a multi-entry
// `objectives` array. Gather objectives default to OWNED semantics (what you
// carry; handed over at turn-in) — set countMode:'total' for cumulative
// collection that is never consumed. Hints describe only what the character
// can plausibly know — never exact coordinates.
export const QUESTS = [
  {
    id: 'q_herbs', name: 'Auntie\'s Request', giver: 'herbalist', difficulty: 'Rank 1 · Early',
    description: 'Auntie Luo needs 5 Spirit Herbs. Gather them from the valley and forest.',
    hint: 'Spirit herbs grow in the farmland and forest outskirts around Green Valley Town.',
    objective: { type: 'gather', item: 'herb', qty: 5 },
    rewards: { items: { medicine: 2 }, spiritStones: 20, reputation: { villagers: 1 }, message: 'Auntie Luo rewards you with salve and stones.' },
  },
  {
    id: 'q_ironfang', name: 'Hunt the Ironfang Wolves', giver: 'guMaster', difficulty: 'Rank 1 · Middle+',
    description: 'The wolves grow bold — two herdsmen mauled this season. Gu Master Bai asks you to cull 3 of them and bring 2 beast cores as proof.',
    hint: 'Wolves prowl the forest outskirts and the southern wilds. Beast cores come from any culled beast.',
    objectives: [
      { type: 'hunt', enemy: 'wildWolf', qty: 3, label: 'Kill Wild Wolves' },
      { type: 'gather', item: 'beastCore', qty: 2, countMode: 'total', label: 'Collect Beast Cores' },
    ],
    rewards: { spiritStones: 120, contribution: 35, reputation: { villagers: 1 }, message: '"The valley breathes easier. Take your bounty from the communal vault."' },
  },
  {
    id: 'q_wolves', name: 'Restless Wolves', giver: 'guMaster', difficulty: 'Rank 1 · Middle',
    description: 'Cull 3 Wild Wolves troubling the valley.',
    hint: 'Wolf packs have been seen off the road, in the forest west of the valley.',
    objective: { type: 'hunt', enemy: 'wildWolf', qty: 3 },
    rewards: { items: { fireEssence: 2 }, spiritStones: 25, reputation: { sect: 1 }, message: 'Gu Master Bai nods. Take these fire essences.' },
  },
  {
    id: 'q_stoneBeast', name: 'The Stone Menace', giver: 'guMaster', difficulty: 'Rank 1 · Late',
    description: 'A Stone Beast blocks the forest path. Defeat it.',
    hint: 'Stone beasts wallow along the wild forest paths northwest of town.',
    objective: { type: 'defeat', enemy: 'stoneBeast', qty: 1 },
    rewards: { giveGu: 'ironSkin', recipes: ['mountainGuard'], spiritStones: 30, reputation: { sect: 2 }, message: 'You earn the Iron Skin Gu and the Mountain Guard recipe for your courage.' },
  },
  {
    id: 'q_lostGu', name: 'The Lost Gu', giver: 'mysteriousTraveler', difficulty: 'Rank 2 · Middle+',
    description: 'Deep in the Ancient Ruins lies a Lost Gu Fragment. Retrieve it from the Ancient Guardian.',
    hint: 'The mist-wreathed ruins lie far to the east, past the marsh — the Traveler\'s directions are deliberately vague.',
    objective: { type: 'defeat', enemy: 'ancientGuardian', qty: 1 },
    rewards: { giveGu: 'thunderPalm', spiritStones: 60, reputation: { blackMarket: 2 }, message: 'The Traveler trades you the Thunder Palm Gu.' },
  },
  {
    id: 'q_ruins', name: 'Whispers of the Ruins', giver: 'mysteriousTraveler', difficulty: 'Rank 1 · Late',
    description: 'Reach the Ancient Ruins beyond the Mist Forest.',
    hint: 'Follow the east road past Willow Hamlet until the mist thickens.',
    objective: { type: 'reach', area: 'ruins' },
    rewards: { spiritStones: 30, reputation: { blackMarket: 1 }, message: 'The Traveler notes your daring.' },
  },
  {
    id: 'q_faction', name: 'A Fork in the Path', giver: 'mysteriousTraveler', difficulty: '—',
    description: 'The Broker and Gu Master Bai both want a rare Moon Petal you carry. Choose a side.',
    requires: { flag: 'hasMoonPetal' },
    hint: 'A choice made cannot be unmade.',
    objective: { type: 'choice' },
    choices: [
      { label: 'Give it to Gu Master Bai (Sect)', effects: { removeItems: { moonPetal: 1 }, giveGu: 'flameHeart', reputation: { sect: 3, blackMarket: -2 }, message: 'Bai gifts you the Flame Heart Gu.' } },
      { label: 'Sell it to The Broker (Black Market)', effects: { removeItems: { moonPetal: 1 }, spiritStones: 80, reputation: { blackMarket: 3, sect: -2 }, message: 'The Broker pays handsomely.' } },
      { label: 'Keep it for yourself', effects: { removeItems: { moonPetal: 1 }, reputation: { sect: -1, blackMarket: -1 }, message: 'You keep the petal. Both sides remember.' } },
    ],
    rewards: { message: 'A choice made is a path taken.' },
  },
  // ---- Master questlines (givers are hidden mentors; see masters.js) ----
  {
    id: 'q_jian_fragment', name: 'The Broken Blade', giver: 'masterJian', difficulty: 'Rank 2 · Early+',
    description: 'Master Jian\u2019s blade broke long ago. The Bandit Chief of the northeast camp wears its fragment as a trophy — take it back.',
    hint: 'Bandits hold a camp in the northeast hills.',
    objective: { type: 'defeat', enemy: 'banditChief', qty: 1 },
    rewards: { message: 'Master Jian turns the fragment over in his palm. "Steel remembers. Now — your hands remember too."' },
  },
  {
    id: 'q_jian_beasts', name: 'The Training Ground', giver: 'masterJian', difficulty: 'Rank 2 · Early+',
    description: 'Stone beasts crushed Master Jian\u2019s old training ground in the wild forest. Cull 2 of them.',
    hint: 'Stone beasts roam the deep forest paths.',
    objective: { type: 'hunt', enemy: 'stoneBeast', qty: 2 },
    rewards: { spiritStones: 30, message: '"Hm. You strike with intent now. There may be a disciple in you after all."' },
  },
  {
    id: 'q_jian_forge', name: 'Tempering the Rain', giver: 'masterJian', difficulty: 'Rank 2 · Middle+',
    description: 'To etch the Sword Rain into your essence, bring Master Jian 2 Wind Crystals.',
    hint: 'Wind crystals glimmer in the deepest part of the mist forest.',
    objective: { type: 'gather', item: 'windCrystal', qty: 2 },
    rewards: { giveGu: 'swordRain', message: 'Master Jian traces a final diagram in the dust — the Sword Rain Killer Move is yours. He calls you his successor.' },
  },
  {
    id: 'q_hermit_gift', name: 'A Gift for the Spring', giver: 'hermitSpring', difficulty: 'Rank 1 · Late+',
    description: 'The hermit asks for 2 Moon Petals — the spirit spring\u2019s own flowers — to open a beast pact.',
    hint: 'Moon petals bloom by night, near the spring and along the western wilds.',
    objective: { type: 'gather', item: 'moonPetal', qty: 2 },
    rewards: { giveGu: 'beastPact', message: 'The hermit presses an old pact-seal into your hand. "Feed it your will, not your fear."' },
  },
  {
    id: 'q_fang_etch', name: 'Scatter the Crows', giver: 'drunkenFang', difficulty: 'Rank 2 · Early+',
    description: 'Old Drunken Fang wants the blood crows scattered off the copper hills — 3 of them.',
    hint: 'Blood crows wheel over the copper hills at all hours.',
    objective: { type: 'hunt', enemy: 'bloodCrow', qty: 3 },
    rewards: { spiritStones: 80, message: 'Old Fang shares his wine and etches his last fist-diagram in your memory. Successor of the wandering fist — try not to drink like him.' },
  },
  {
    id: 'q_mo_ores', name: 'Stocking the Furnace', giver: 'elderMo', difficulty: 'Rank 1 · Middle+',
    description: 'Elder Mo\u2019s student stocks the furnace himself. Bring him 3 Iron Ore from the copper hills.',
    hint: 'Iron ore veins dot the copper hills east of town.',
    objective: { type: 'gather', item: 'ironOre', qty: 3 },
    rewards: { giveGu: 'spiritMoth', message: '"Waste ratios: acceptable. Take this moth — it will find what your eyes cannot."' },
  },
  {
    id: 'q_mo_core', name: 'The Corrupted Core', giver: 'elderMo', difficulty: 'Rank 2 · Middle+',
    description: 'A mutated beast in the deep forest carries a corrupted core. Fetch it — carefully.',
    hint: 'Mutated beasts lurk where the mist grows thickest.',
    objective: { type: 'defeat', enemy: 'mutatedBeast', qty: 1 },
    rewards: { spiritStones: 60, items: { fireEssence: 3 }, message: 'Elder Mo decants the core with steady hands. "You have a refiner\u2019s patience. My furnace is open to you, successor."' },
  },
];

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map(q => [q.id, q]));