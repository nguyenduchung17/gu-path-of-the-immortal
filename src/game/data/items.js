export const ITEMS = [
  // Materials
  { id: 'herb', name: 'Spirit Herb', category: 'materials', description: 'A common herb with mild healing essence.', value: 3 },
  { id: 'fireEssence', name: 'Fire Essence', category: 'materials', description: 'A wisp of pure flame energy.', value: 12 },
  { id: 'beastCore', name: 'Beast Core', category: 'materials', description: 'A monster\'s condensed essence. Used in refinement.', value: 8 },
  { id: 'ore', name: 'Jade Ore', category: 'materials', description: 'A chunk of ore humming with qi.', value: 5 },
  { id: 'ironOre', name: 'Iron Ore', category: 'materials', description: 'Hard iron ore for sturdy refinement.', value: 7 },
  { id: 'shadowSilk', name: 'Shadow Silk', category: 'materials', description: 'Thread spun by shadow beasts.', value: 10 },
  { id: 'moonPetal', name: 'Moon Petal', category: 'materials', description: 'A petal that drinks moonlight.', value: 9 },
  { id: 'spiritGrass', name: 'Spirit Grass', category: 'materials', description: 'Grows where qi gathers.', value: 4 },
  // Medicine
  { id: 'medicine', name: 'Healing Salve', category: 'medicine', description: 'Restores 25 HP.', value: 15, use: { hp: 25 } },
  { id: 'healingPill', name: 'Greater Healing Pill', category: 'medicine', description: 'Restores 55 HP.', value: 35, use: { hp: 55 } },
  { id: 'essencePill', name: 'Essence Pill', category: 'medicine', description: 'Restores 20 primeval essence.', value: 30, use: { essence: 20 } },
  // Food
  { id: 'ration', name: 'Travel Ration', category: 'food', description: 'Restores 10 HP. Plain but filling.', value: 4, use: { hp: 10 } },
  // Quest
  { id: 'lostGuFragment', name: 'Lost Gu Fragment', category: 'questItems', description: 'A shard of an ancient Gu. The Gu Master wants it.', value: 0 },
  { id: 'stolenGoods', name: 'Stolen Goods', category: 'questItems', description: 'A merchant\'s stolen wares.', value: 0 },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
export const ITEM_CATEGORIES = ['materials', 'medicine', 'food', 'questItems'];