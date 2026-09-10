export const ENEMIES = [
  {
    id: 'wildWolf', name: 'Wild Wolf', hp: 30, attack: 8, defense: 2, speed: 6,
    abilities: [], weakness: 'fire',
    drops: [{ itemId: 'beastCore', chance: 50, qty: 1 }, { itemId: 'herb', chance: 40, qty: 1 }],
    description: 'A gaunt wolf prowling the valley. Weak alone, dangerous in packs.',
  },
  {
    id: 'poisonSpider', name: 'Poison Spider', hp: 26, attack: 6, defense: 1, speed: 5,
    abilities: ['poison'], weakness: 'fire',
    drops: [{ itemId: 'shadowSilk', chance: 35, qty: 1 }, { itemId: 'herb', chance: 45, qty: 1 }],
    description: 'Lurks in misted hollows. Its bite festers long after the fight.',
  },
  {
    id: 'stoneBeast', name: 'Stone Beast', hp: 50, attack: 7, defense: 6, speed: 3,
    abilities: [], weakness: 'lightning',
    drops: [{ itemId: 'ore', chance: 70, qty: 1 }, { itemId: 'beastCore', chance: 40, qty: 1 }],
    description: 'A lumbering beast with hide like granite. Patience beats power here.',
  },
  {
    id: 'bloodCrow', name: 'Blood Crow', hp: 22, attack: 7, defense: 1, speed: 8,
    abilities: [], weakness: 'wind',
    drops: [{ itemId: 'herb', chance: 40, qty: 1 }, { itemId: 'beastCore', chance: 25, qty: 1 }],
    description: 'Quick and vicious. It strikes before you can steady yourself.',
  },
  {
    id: 'forestSerpent', name: 'Forest Serpent', hp: 34, attack: 8, defense: 2, speed: 6,
    abilities: ['poison'], weakness: 'fire',
    drops: [{ itemId: 'beastCore', chance: 50, qty: 1 }, { itemId: 'herb', chance: 50, qty: 1 }],
    description: 'Slips through the undergrowth, fangs dripping venom.',
  },
  {
    id: 'shadowHound', name: 'Shadow Hound', hp: 45, attack: 11, defense: 3, speed: 9,
    abilities: [], weakness: 'lightning',
    drops: [{ itemId: 'shadowSilk', chance: 60, qty: 1 }, { itemId: 'beastCore', chance: 50, qty: 1 }],
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
    drops: [{ itemId: 'beastCore', chance: 90, qty: 1 }, { itemId: 'fireEssence', chance: 50, qty: 1 }],
    description: 'Twisted by stray primeval essence. Unpredictable and savage.',
  },
  {
    id: 'bandit', name: 'Roving Bandit', hp: 40, attack: 9, defense: 3, speed: 5,
    abilities: [], weakness: 'none',
    drops: [{ itemId: 'spiritStone', chance: 100, qty: 3 }],
    description: 'A desperate thief. Dangerous to the weak, trivial to the prepared.',
  },
];

export const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map(e => [e.id, e]));