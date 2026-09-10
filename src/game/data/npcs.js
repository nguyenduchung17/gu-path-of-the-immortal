export const NPCS = [
  {
    id: 'merchant', name: 'Old Merchant Chen', area: 'greenValley', avatar: '🧑‍💼',
    greeting: 'Ah, a new face. Chen\'s goods are honest and Chen\'s prices are fair. Mostly.',
    shop: {
      sells: [
        { itemId: 'medicine', price: 15 }, { itemId: 'ration', price: 4 },
        { itemId: 'herb', price: 4 }, { itemId: 'spiritGrass', price: 6 },
      ],
      buys: ['herb', 'beastCore', 'ore', 'ironOre', 'shadowSilk', 'spiritGrass', 'moonPetal', 'fireEssence', 'beastBlood', 'windCrystal', 'mistSilk'],
      recipes: [{ recipeId: 'windStep', price: 30 }],
    },
  },
  {
    id: 'herbalist', name: 'Auntie Luo', area: 'greenValley', avatar: '🌿',
    greeting: 'Mind the wolves, child. Bring me herbs and I\'ll pay in medicine.',
    shop: {
      sells: [
        { itemId: 'medicine', price: 15 }, { itemId: 'healingPill', price: 35 },
        { itemId: 'essencePill', price: 30 }, { itemId: 'herb', price: 4 },
      ],
      buys: ['herb', 'spiritGrass', 'moonPetal', 'mistSilk'],
      recipes: [{ recipeId: 'vitalSpring', price: 20 }, { recipeId: 'jadeMarrow', price: 55 }],
    },
  },
  {
    id: 'guMaster', name: 'Gu Master Bai', area: 'greenValley', avatar: '🧙',
    greeting: 'You wish to walk the Gu path? Prove your worth. The valley wolves are restless — cull them.',
    shop: {
      sells: [
        { itemId: 'fireEssence', price: 14 }, { itemId: 'beastCore', price: 10 },
        { itemId: 'shadowSilk', price: 12 }, { itemId: 'ore', price: 6 },
      ],
      buys: ['beastCore', 'fireEssence', 'shadowSilk', 'ore', 'ironOre', 'moonPetal', 'beastBlood', 'serpentGland', 'windCrystal', 'mistSilk'],
      recipes: [{ recipeId: 'emberGu', price: 25 }, { recipeId: 'stoneShell', price: 25 }],
    },
  },
  {
    id: 'sectElder', name: 'Sect Elder Wei', area: 'cultivationSect', avatar: '👴',
    greeting: 'The sect opens its doors to those with will. Cultivate here, and your essence flows swifter.',
  },
  {
    id: 'mysteriousTraveler', name: 'Mysterious Traveler', area: 'blackMarket', avatar: '🎭',
    greeting: '...You have the look of someone who listens. There are ruins in the mist. Old Gu sleep there. Fetch one for me, and I\'ll owe you.',
  },
  {
    id: 'blackMarketMerchant', name: 'The Broker', area: 'blackMarket', avatar: '🦝',
    greeting: 'No questions. No refunds. The Broker has what the sects forbid.',
    shop: {
      sells: [
        { itemId: 'fireEssence', price: 18 }, { itemId: 'shadowSilk', price: 16 },
        { itemId: 'moonPetal', price: 14 }, { itemId: 'healingPill', price: 45 },
        { itemId: 'essencePill', price: 40 }, { itemId: 'windCrystal', price: 22 },
        { itemId: 'beastBlood', price: 12 }, { itemId: 'serpentGland', price: 30 },
      ],
      buys: ['shadowSilk', 'fireEssence', 'ironOre', 'beastCore', 'moonPetal', 'stolenGoods', 'beastBlood', 'windCrystal', 'serpentGland', 'mistSilk'],
      recipes: [{ recipeId: 'galeBlade', price: 60 }, { recipeId: 'beastPact', price: 70 }],
    },
  },
  {
    id: 'innkeeper', name: 'Innkeeper Ma', area: 'greenValleyRegion', avatar: '🛏️',
    greeting: 'A room, a hot meal, and not a single wolf at the window. Twenty stones a night.',
    service: 'inn', innCost: 20,
  },
  {
    id: 'questOfficer', name: 'Quest Officer Han', area: 'greenValleyRegion', avatar: '📋',
    greeting: 'The board is full and the patrols are thin. Take a mission — the valley rewards those who serve.',
    service: 'missions',
  },
  {
    id: 'contributionOfficer', name: 'Exchange Keeper Rong', area: 'greenValleyRegion', avatar: '🏛️',
    greeting: 'Stones buy goods. Contribution buys what coins cannot. Serve the valley, and its vaults open to you.',
    service: 'contribution',
  },
  {
    id: 'arenaManager', name: 'Arena Master Kun', area: 'greenValleyRegion', avatar: '⚔️',
    greeting: 'Blood on the sand, stakes on the table. Pick your challenge — and pray your Gu are sharp.',
    service: 'arena',
  },
  {
    id: 'guPeddler', name: 'Gu Peddler Wan', area: 'willowHamlet', avatar: '🧳',
    greeting: 'Fresh off the mist-forest trails — recipes and rarities straight from my pack. Stones only, friend.',
    shop: {
      sells: [
        { itemId: 'moonPetal', price: 10 }, { itemId: 'windCrystal', price: 18 },
        { itemId: 'shadowSilk', price: 14 }, { itemId: 'serpentGland', price: 22 },
        { itemId: 'mistSilk', price: 15 }, { itemId: 'beastBlood', price: 10 },
        { itemId: 'ironOre', price: 9 }, { itemId: 'essencePill', price: 30 },
        { itemId: 'healingPill', price: 35 },
      ],
      buys: ['herb', 'spiritGrass', 'medicine', 'ration', 'beastCore', 'beastBlood', 'moonPetal', 'windCrystal', 'shadowSilk', 'mistSilk', 'serpentGland', 'fireEssence', 'ironOre', 'ore'],
      recipes: [{ recipeId: 'tideBinding', price: 50 }, { recipeId: 'flameSerpent', price: 95 }],
    },
  },
  {
    id: 'villageElder', name: 'Willow Elder Shu', area: 'greenValleyRegion', avatar: '👴',
    greeting: 'The hamlet is small but its hearth is warm. Rest if the road has worn you, and trade a little if you must.',
    shop: {
      sells: [{ itemId: 'ration', price: 3 }, { itemId: 'medicine', price: 14 }, { itemId: 'herb', price: 4 }],
      buys: ['herb', 'spiritGrass', 'moonPetal', 'beastCore'],
    },
    service: 'inn', innCost: 10,
  },
];

export const NPC_BY_ID = Object.fromEntries(NPCS.map(n => [n.id, n]));