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
    objective: { type: 'reach', area: 'ancientRuins' },
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
];

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map(q => [q.id, q]));