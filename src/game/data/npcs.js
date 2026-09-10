// Specialized NPCs. Every shopkeeper has ONE clear role (food / materials /
// Gu / refinement), inventories never cross categories, and each role has its
// own look + daily schedule. Hidden masters are appended from masters.js.
import { MASTERS } from './masters';

export const NPCS = [
  {
    id: 'merchant', name: 'Old Merchant Chen', area: 'greenValley', role: 'food', avatar: '🧑‍💼',
    greeting: 'Fresh buns, honest tea, and rations that survive a long road — Chen sells food, nothing fancier.',
    look: { body: 'male', hair: 'short', hairColor: '#4a3018', skin: '#e8b88a', eyes: '#3a2a18', outfit: 'tunic', outfitPrimary: '#8a7a3a', outfitSecondary: '#c9a45a', accessory: 'belt' },
    shop: {
      sells: [
        { itemId: 'simpleMeal', price: 3 }, { itemId: 'ration', price: 4 },
        { itemId: 'riceBun', price: 3 }, { itemId: 'gingerTea', price: 3 },
        { itemId: 'herb', price: 4 }, { itemId: 'spiritGrass', price: 5 }, // cooking ingredients
      ],
      buys: ['herb', 'spiritGrass', 'moonPetal'],
      hours: { open: 6 * 60, close: 20 * 60 },
    },
  },
  {
    id: 'herbalist', name: 'Auntie Luo', area: 'greenValley', role: 'material', avatar: '🌿',
    greeting: 'Herbs, ores, beast materials — if it feeds a refinement furnace, I stock it. Bring me your gathers and I\u2019ll pay fair.',
    look: { body: 'female', hair: 'bun', hairColor: '#5a4a2a', skin: '#d9a878', eyes: '#3a2a18', outfit: 'robe', outfitPrimary: '#4a8a6b', outfitSecondary: '#8a6a43', accessory: 'scarf' },
    shop: {
      sells: [
        { itemId: 'herb', price: 4 }, { itemId: 'spiritGrass', price: 5 },
        { itemId: 'ore', price: 6 }, { itemId: 'ironOre', price: 8 },
        { itemId: 'beastBlood', price: 9 }, { itemId: 'moonPetal', price: 10 },
      ],
      buys: ['herb', 'spiritGrass', 'moonPetal', 'mistSilk', 'shadowSilk', 'ore', 'ironOre', 'beastCore', 'beastBlood', 'serpentGland', 'windCrystal', 'fireEssence'],
      hours: { open: 6 * 60, close: 20 * 60 },
      recipes: [{ recipeId: 'vitalSpring', price: 20 }, { recipeId: 'jadeMarrow', price: 55 }],
    },
  },
  {
    id: 'guMaster', name: 'Gu Master Bai', area: 'greenValley', role: 'gu', avatar: '🧙',
    greeting: 'You wish to walk the Gu path? My cases hold low-rank Gu, today\u2019s rare specimen, and the recipes to refine your own.',
    look: { body: 'male', hair: 'topknot', hairColor: '#141414', skin: '#c99767', eyes: '#2a5a8a', outfit: 'robe', outfitPrimary: '#6b4a8a', outfitSecondary: '#d9b45b', accessory: 'ornament' },
    shop: {
      sells: [
        { itemId: 'sealingJar', price: 20 }, { itemId: 'bindingVessel', price: 80 },
        { itemId: 'restorationPellet', price: 60 },
      ],
      buys: ['beastCore', 'fireEssence', 'shadowSilk', 'ore', 'ironOre', 'moonPetal', 'beastBlood', 'serpentGland', 'windCrystal', 'mistSilk'],
      hours: { open: 6 * 60, close: 20 * 60 },
      gu: [{ guId: 'ironSkin', price: 60 }],                                     // low-rank Gu, ready-bound
      guPool: [{ guId: 'thunderPalm', price: 150 }, { guId: 'spiritMoth', price: 50 }], // rare rotating stock (daily)
      recipes: [{ recipeId: 'emberGu', price: 25 }, { recipeId: 'stoneShell', price: 25 }, { recipeId: 'windStep', price: 30 }],
    },
  },
  {
    id: 'sectElder', name: 'Sect Elder Wei', area: 'cultivationSect', role: 'sect', avatar: '👴',
    greeting: 'The sect opens its doors to those with will. Cultivate here, and your essence flows swifter.',
  },
  {
    id: 'mysteriousTraveler', name: 'Mysterious Traveler', area: 'blackMarket', role: 'unknown', avatar: '🎭',
    greeting: '...You have the look of someone who listens. There are ruins in the mist. Old Gu sleep there. Fetch one for me, and I\u2019ll owe you.',
  },
  {
    id: 'blackMarketMerchant', name: 'The Broker', area: 'blackMarket', role: 'blackmarket', avatar: '🦝',
    greeting: 'No questions. No refunds. The Broker has what the sects forbid.',
    look: { body: 'male', hair: 'spiky', hairColor: '#141414', skin: '#a8785a', eyes: '#7a3a3a', outfit: 'martial', outfitPrimary: '#3a3a44', outfitSecondary: '#a83a3a', accessory: 'scarf' },
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
    id: 'innkeeper', name: 'Innkeeper Ma', area: 'greenValleyRegion', role: 'inn', avatar: '🛏️',
    greeting: 'A room, a hot meal, and not a single wolf at the window. Twenty stones a night — and yes, I keep a little food for travelers.',
    look: { body: 'female', hair: 'braids', hairColor: '#3a2a18', skin: '#e8b88a', eyes: '#3a2a18', outfit: 'tunic', outfitPrimary: '#8a5a2b', outfitSecondary: '#e8e4d8', accessory: 'belt' },
    service: 'inn', innCost: 20,
    shop: {
      sells: [{ itemId: 'simpleMeal', price: 3 }, { itemId: 'ration', price: 4 }, { itemId: 'gingerTea', price: 3 }],
      buys: [],
    },
  },
  {
    id: 'questOfficer', name: 'Quest Officer Han', area: 'greenValleyRegion', role: 'quest', avatar: '📋',
    greeting: 'The board is full and the patrols are thin. Take a mission — the valley rewards those who serve.',
    service: 'missions',
    hours: { open: 6 * 60, close: 20 * 60 },
    look: { body: 'male', hair: 'short', hairColor: '#141414', skin: '#d9a878', eyes: '#2a5a8a', outfit: 'robe', outfitPrimary: '#4d7c0f', outfitSecondary: '#e8e4d8', accessory: 'headband' },
  },
  {
    id: 'contributionOfficer', name: 'Exchange Keeper Rong', area: 'greenValleyRegion', role: 'contribution', avatar: '🏛️',
    greeting: 'Stones buy goods. Contribution buys what coins cannot. Serve the valley, and its vaults open to you.',
    service: 'contribution',
    hours: { open: 6 * 60, close: 20 * 60 },
    look: { body: 'female', hair: 'topknot', hairColor: '#141414', skin: '#c99767', eyes: '#3a2a18', outfit: 'robe', outfitPrimary: '#0e7490', outfitSecondary: '#d9b45b', accessory: 'ornament' },
  },
  {
    id: 'arenaManager', name: 'Arena Master Kun', area: 'greenValleyRegion', role: 'arena', avatar: '⚔️',
    greeting: 'Blood on the sand, stakes on the table. Pick your challenge — and pray your Gu are sharp.',
    service: 'arena',
    hours: { open: 8 * 60, close: 22 * 60 },
    look: { body: 'male', hair: 'spiky', hairColor: '#6e3a1f', skin: '#a8785a', eyes: '#7a3a3a', outfit: 'martial', outfitPrimary: '#9f1239', outfitSecondary: '#e8e4d8', accessory: 'belt' },
  },
  {
    id: 'guPeddler', name: 'Gu Peddler Wan', area: 'willowHamlet', role: 'gu', avatar: '🧳',
    greeting: 'Fresh off the mist-forest trails — a bound Gu or two, today\u2019s rare catch, and recipes straight from my pack. Stones only, friend.',
    look: { body: 'male', hair: 'long', hairColor: '#5a4a2a', skin: '#c99767', eyes: '#7a3a3a', outfit: 'tunic', outfitPrimary: '#7a3a5a', outfitSecondary: '#8a6a43', accessory: 'scarf' },
    shop: {
      sells: [
        { itemId: 'sealingJar', price: 25 },
        { itemId: 'flameGrass', price: 5 }, { itemId: 'spiritWater', price: 5 },
        { itemId: 'mineralEssence', price: 5 }, { itemId: 'venomSac', price: 7 },
        { itemId: 'beastMeat', price: 4 },
      ],
      buys: ['beastCore', 'beastBlood', 'moonPetal', 'windCrystal', 'shadowSilk', 'mistSilk', 'serpentGland', 'fireEssence', 'ironOre', 'ore'],
      hours: { open: 6 * 60, close: 20 * 60 },
      gu: [{ guId: 'insightEye', price: 45 }],
      guPool: [{ guId: 'galeBlade', price: 130 }, { guId: 'shadowThread', price: 90 }],
      recipes: [{ recipeId: 'tideBinding', price: 50 }, { recipeId: 'flameSerpent', price: 95 }],
    },
  },
  {
    id: 'villageElder', name: 'Willow Elder Shu', area: 'greenValleyRegion', role: 'general', avatar: '👴',
    greeting: 'The hamlet is small but its hearth is warm. A general store — plain necessities, nothing rare.',
    look: { body: 'male', hair: 'long', hairColor: '#e8e4d8', skin: '#a8785a', eyes: '#3a2a18', outfit: 'robe', outfitPrimary: '#556077', outfitSecondary: '#8a6a43', accessory: 'shoulderCloth' },
    shop: {
      sells: [{ itemId: 'ration', price: 3 }, { itemId: 'medicine', price: 14 }, { itemId: 'herb', price: 4 }, { itemId: 'simpleMeal', price: 3 }],
      buys: ['herb', 'spiritGrass', 'moonPetal', 'beastCore'],
    },
    service: 'inn', innCost: 10,
  },
];

// Elder Mo the refinement master keeps a materials stall beside his furnace.
const MASTER_SHOPS = {
  elderMo: {
    sells: [
      { itemId: 'medicine', price: 15 },
      { itemId: 'restorationPellet', price: 55 },
      { itemId: 'beastCore', price: 10 }, { itemId: 'fireEssence', price: 14 },
      { itemId: 'shadowSilk', price: 12 }, { itemId: 'serpentGland', price: 30 },
    ],
    buys: ['beastCore', 'fireEssence', 'shadowSilk', 'serpentGland', 'ironOre', 'ore'],
    hours: { open: 6 * 60, close: 21 * 60 },
  },
};

// Hidden masters join the roster (worldRenderer draws their aura + "???" tag).
for (const m of MASTERS) {
  NPCS.push({
    id: m.id, name: m.name, role: m.role, mentor: true, hidden: m.hidden,
    greeting: m.greeting, look: m.look, hours: m.hours, master: true,
    shop: MASTER_SHOPS[m.id] || undefined,
  });
}

export const NPC_BY_ID = Object.fromEntries(NPCS.map(n => [n.id, n]));

// Is the NPC at their post right now? (simple daily schedules)
export function npcAvailable(npc, time) {
  const h = npc.hours || npc.shop?.hours;
  if (!h) return true;
  const m = ((time?.min % 1440) + 1440) % 1440;
  if (h.open <= h.close) return m >= h.open && m < h.close;
  return m >= h.open || m < h.close;
}

// Today's rare rotating Gu offer for a Gu merchant (changes each game day).
export function guOfferOf(npc, state) {
  if (!npc?.shop?.guPool?.length) return null;
  const day = state?.time?.day || 1;
  return npc.shop.guPool[day % npc.shop.guPool.length];
}