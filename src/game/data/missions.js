// Quest Hall missions — accepted from the Mission Board in town. Contribution
// points are the organization-facing currency earned by completing them.
export const MISSIONS = [
  {
    id: 'm_boars', name: 'Boar Trouble', difficulty: 1,
    description: "The farmers' plots are trampled. Drive off 2 Wild Boars in the farmland or plains.",
    objective: { type: 'hunt', enemy: 'wildBoar', qty: 2 },
    rewards: { spiritStones: 60, contribution: 15, items: { herb: 3 } },
  },
  {
    id: 'm_moonGrass', name: 'Gather Moon Grass', difficulty: 1,
    description: 'The medicine hall is short on Moon Petals. Gather 4 from the wilds.',
    objective: { type: 'gather', item: 'moonPetal', qty: 4 },
    rewards: { spiritStones: 50, contribution: 10, items: { medicine: 1 } },
  },
  {
    id: 'm_wolves', name: 'Hunt Restless Wolves', difficulty: 2,
    description: 'Wolves prowl the forest outskirts and the southern wilds. Cull 3 of them.',
    objective: { type: 'hunt', enemy: 'wildWolf', qty: 3 },
    rewards: { spiritStones: 120, contribution: 35, items: { beastCore: 3 } },
  },
  {
    id: 'm_caravan', name: 'Investigate Missing Caravan', difficulty: 3,
    description: 'A trade caravan vanished on the east road. Bandits of the northeast camp are suspected. Defeat 4 bandits.',
    objective: { type: 'hunt', enemy: 'bandit', qty: 4 },
    rewards: { spiritStones: 300, contribution: 80, items: { medicine: 2 } },
  },
  {
    id: 'm_ruinsGuardian', name: 'Silence the Sentinels', difficulty: 4,
    description: 'Two Ancient Guardians stir in the Mist-Wreathed Ruins. Destroy them before they wander.',
    objective: { type: 'defeat', enemy: 'ancientGuardian', qty: 2 },
    rewards: { spiritStones: 500, contribution: 150, items: { ironOre: 3 } },
  },
  {
    id: 'm_beast', name: 'The Ironfang Alpha', difficulty: 5,
    description: 'An alpha beast rules the Ironfang Territory deep in the northern forest. Slay it and earn the vault\'s greatest prize.',
    objective: { type: 'defeat', enemy: 'ironfangAlpha', qty: 1 },
    rewards: { spiritStones: 800, contribution: 200, recipes: ['tempestGu'] },
  },
];

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map(m => [m.id, m]));