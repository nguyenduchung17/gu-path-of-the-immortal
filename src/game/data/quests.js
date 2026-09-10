export const QUESTS = [
  {
    id: 'q_herbs', name: 'Auntie\'s Request', giver: 'herbalist',
    description: 'Auntie Luo needs 5 Spirit Herbs. Gather them from the valley and forest.',
    objective: { type: 'gather', item: 'herb', qty: 5 },
    rewards: { items: { medicine: 2 }, spiritStones: 20, reputation: { villagers: 1 }, message: 'Auntie Luo rewards you with salve and stones.' },
  },
  {
    id: 'q_wolves', name: 'Restless Wolves', giver: 'guMaster',
    description: 'Cull 3 Wild Wolves troubling the valley.',
    objective: { type: 'hunt', enemy: 'wildWolf', qty: 3 },
    rewards: { items: { fireEssence: 2 }, spiritStones: 25, reputation: { sect: 1 }, message: 'Gu Master Bai nods. Take these fire essences.' },
  },
  {
    id: 'q_stoneBeast', name: 'The Stone Menace', giver: 'guMaster',
    description: 'A Stone Beast blocks the forest path. Defeat it.',
    objective: { type: 'defeat', enemy: 'stoneBeast', qty: 1 },
    rewards: { giveGu: 'ironSkin', recipes: ['mountainGuard'], spiritStones: 30, reputation: { sect: 2 }, message: 'You earn the Iron Skin Gu and the Mountain Guard recipe for your courage.' },
  },
  {
    id: 'q_lostGu', name: 'The Lost Gu', giver: 'mysteriousTraveler',
    description: 'Deep in the Ancient Ruins lies a Lost Gu Fragment. Retrieve it from the Ancient Guardian.',
    objective: { type: 'defeat', enemy: 'ancientGuardian', qty: 1 },
    rewards: { giveGu: 'thunderPalm', spiritStones: 60, reputation: { blackMarket: 2 }, message: 'The Traveler trades you the Thunder Palm Gu.' },
  },
  {
    id: 'q_ruins', name: 'Whispers of the Ruins', giver: 'mysteriousTraveler',
    description: 'Reach the Ancient Ruins beyond the Mist Forest.',
    objective: { type: 'reach', area: 'ruins' },
    rewards: { spiritStones: 30, reputation: { blackMarket: 1 }, message: 'The Traveler notes your daring.' },
  },
  {
    id: 'q_faction', name: 'A Fork in the Path', giver: 'mysteriousTraveler',
    description: 'The Broker and Gu Master Bai both want a rare Moon Petal you carry. Choose a side.',
    requires: { flag: 'hasMoonPetal' },
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
    id: 'q_jian_fragment', name: 'The Broken Blade', giver: 'masterJian',
    description: 'Master Jian\u2019s blade broke long ago. The Bandit Chief of the northeast camp wears its fragment as a trophy — take it back.',
    objective: { type: 'defeat', enemy: 'banditChief', qty: 1 },
    rewards: { message: 'Master Jian turns the fragment over in his palm. "Steel remembers. Now — your hands remember too."' },
  },
  {
    id: 'q_jian_beasts', name: 'The Training Ground', giver: 'masterJian',
    description: 'Stone beasts crushed Master Jian\u2019s old training ground in the wild forest. Cull 2 of them.',
    objective: { type: 'hunt', enemy: 'stoneBeast', qty: 2 },
    rewards: { spiritStones: 30, message: '"Hm. You strike with intent now. There may be a disciple in you after all."' },
  },
  {
    id: 'q_jian_forge', name: 'Tempering the Rain', giver: 'masterJian',
    description: 'To etch the Sword Rain into your essence, bring Master Jian 2 Wind Crystals.',
    objective: { type: 'gather', item: 'windCrystal', qty: 2 },
    rewards: { giveGu: 'swordRain', message: 'Master Jian traces a final diagram in the dust — the Sword Rain Killer Move is yours. He calls you his successor.' },
  },
  {
    id: 'q_hermit_gift', name: 'A Gift for the Spring', giver: 'hermitSpring',
    description: 'The hermit asks for 2 Moon Petals — the spirit spring\u2019s own flowers — to open a beast pact.',
    objective: { type: 'gather', item: 'moonPetal', qty: 2 },
    rewards: { giveGu: 'beastPact', message: 'The hermit presses an old pact-seal into your hand. "Feed it your will, not your fear."' },
  },
  {
    id: 'q_fang_etch', name: 'Scatter the Crows', giver: 'drunkenFang',
    description: 'Old Drunken Fang wants the blood crows scattered off the copper hills — 3 of them.',
    objective: { type: 'hunt', enemy: 'bloodCrow', qty: 3 },
    rewards: { spiritStones: 80, message: 'Old Fang shares his wine and etches his last fist-diagram in your memory. Successor of the wandering fist — try not to drink like him.' },
  },
  {
    id: 'q_mo_ores', name: 'Stocking the Furnace', giver: 'elderMo',
    description: 'Elder Mo\u2019s student stocks the furnace himself. Bring him 3 Iron Ore from the copper hills.',
    objective: { type: 'gather', item: 'ironOre', qty: 3 },
    rewards: { giveGu: 'spiritMoth', message: '"Waste ratios: acceptable. Take this moth — it will find what your eyes cannot."' },
  },
  {
    id: 'q_mo_core', name: 'The Corrupted Core', giver: 'elderMo',
    description: 'A mutated beast in the deep forest carries a corrupted core. Fetch it — carefully.',
    objective: { type: 'defeat', enemy: 'mutatedBeast', qty: 1 },
    rewards: { spiritStones: 60, items: { fireEssence: 3 }, message: 'Elder Mo decants the core with steady hands. "You have a refiner\u2019s patience. My furnace is open to you, successor."' },
  },
];

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map(q => [q.id, q]));