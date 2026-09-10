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
  { id: 'windCrystal', name: 'Wind Crystal', category: 'materials', description: 'A shard of solidified wind. Hums when storms near.', value: 14 },
  { id: 'beastBlood', name: 'Beast Blood', category: 'materials', description: 'Vital blood of a wild beast, still warm with qi.', value: 8 },
  { id: 'serpentGland', name: 'Serpent Gland', category: 'materials', description: 'A venom gland prized by Gu refiners.', value: 16 },
  { id: 'mistSilk', name: 'Mist Silk', category: 'materials', description: 'Gossamer silk spun from drifting mist.', value: 12 },
  // Rare spoils of the elite bosses
  { id: 'mistHeart', name: 'Mist Heart', category: 'materials', rarity: 'rare', description: 'The still heart of the Mist Devourer, heavy with centuries of essence.', value: 60 },
  { id: 'wardenCore', name: 'Warden Core', category: 'materials', rarity: 'rare', description: 'A rune-carved core pried from the Ruin Warden\u2019s chest.', value: 70 },
  { id: 'dreadMarrow', name: 'Dread Marrow', category: 'materials', rarity: 'rare', description: 'Marrow drawn from the Dread Matriarch, thrumming with venom and shadow.', value: 65 },
  // Medicine
  { id: 'medicine', name: 'Healing Salve', category: 'medicine', description: 'Restores 25 HP.', value: 15, use: { hp: 25 } },
  { id: 'healingPill', name: 'Greater Healing Pill', category: 'medicine', description: 'Restores 55 HP.', value: 35, use: { hp: 55 } },
  { id: 'essencePill', name: 'Essence Pill', category: 'medicine', description: 'Restores 20 primeval essence.', value: 30, use: { essence: 20 } },
  // Food
  { id: 'ration', name: 'Travel Ration', category: 'food', description: 'Restores 10 HP. Plain but filling.', value: 4, use: { hp: 10 } },
  { id: 'simpleMeal', name: 'Simple Rice Meal', category: 'food', rarity: 'common', description: 'A humble inn meal. Restores 15 HP.', value: 2, use: { hp: 15, essence: 0 } },
  // More food (the food merchant's trade)
  { id: 'riceBun', name: 'Steamed Rice Bun', category: 'food', description: 'A warm bun from the market stalls. Restores 12 HP.', value: 2, use: { hp: 12 } },
  { id: 'gingerTea', name: 'Ginger Tea', category: 'food', description: 'A warming clay cup of tea. Restores 6 HP.', value: 2, use: { hp: 6 } },
  // Gu food — each Dao Path's Gu eats its own fare (fed via the Gu panel)
  { id: 'flameGrass', name: 'Flame Grass', category: 'guFood', description: 'A warm-bladed grass that smolders faintly. Food for Fire-path Gu.', value: 5 },
  { id: 'spiritWater', name: 'Spirit Spring Water', category: 'guFood', description: 'Spring water that glimmers with qi. Food for Water-path Gu.', value: 5 },
  { id: 'mineralEssence', name: 'Mineral Essence', category: 'guFood', description: 'Ground essence-bearing ore. Food for Earth-path Gu.', value: 5 },
  { id: 'venomSac', name: 'Venom Sac', category: 'guFood', description: 'A gland of concentrated venom — a delicacy for venomous Gu.', value: 7 },
  { id: 'beastMeat', name: 'Beast Meat', category: 'guFood', description: 'Qi-rich meat from wild beasts. Feeds beast-natured Gu.', value: 4 },
  // Gu gear — containment for capturing wild Gu, and care for injured ones
  { id: 'sealingJar', name: 'Gu Sealing Jar', category: 'guGear', description: 'A clay jar sealed with a paper charm. Holds one wild Gu during capture.', value: 20 },
  { id: 'bindingVessel', name: 'Spirit Binding Vessel', category: 'guGear', rarity: 'rare', description: 'An inscribed vessel that carries a bound spirit — far stronger than a mere jar.', value: 80 },
  { id: 'restorationPellet', name: 'Spirit Restoration Pellet', category: 'guGear', description: 'A medicinal pellet that mends an injured Gu instantly.', value: 60 },
  // Quest
  { id: 'lostGuFragment', name: 'Lost Gu Fragment', category: 'questItems', description: 'A shard of an ancient Gu. The Gu Master wants it.', value: 0 },
  { id: 'brokenSwordFragment', name: 'Broken Sword Fragment', category: 'questItems', description: 'Half a blade, snapped long ago. A master might want it back.', value: 0 },
  { id: 'stolenGoods', name: 'Stolen Goods', category: 'questItems', description: 'A merchant\'s stolen wares.', value: 0 },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
export const ITEM_CATEGORIES = ['materials', 'medicine', 'food', 'guFood', 'guGear', 'questItems'];