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
];

export const NPC_BY_ID = Object.fromEntries(NPCS.map(n => [n.id, n]));