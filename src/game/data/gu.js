// Every Gu belongs to a Dao Path. Refinement recipes live in recipes.js;
// mastery/cultivation requirements gate the recipe, not the equipment.
export const GU = [
  // ---- Wind ----
  {
    id: 'swiftFang', name: 'Swift Fang Gu', rank: 1, type: 'Attack', path: 'wind', element: 'none', rarity: 'common',
    description: 'A swift bite of primeval force. Cheap and reliable — the first Gu of many a young master.',
    energyCost: 3, cooldown: 0,
    effect: { attack: { power: 8 } },
  },
  {
    id: 'windStep', name: 'Wind Step Gu', rank: 1, type: 'Movement', path: 'wind', element: 'wind', rarity: 'common',
    description: 'Your form blurs like the wind. Greatly raises evasion and escape chance.',
    energyCost: 5, cooldown: 3,
    effect: { evasion: { power: 45, duration: 2 } },
  },
  {
    id: 'thunderPalm', name: 'Thunder Palm Gu', rank: 2, type: 'Attack', path: 'wind', element: 'lightning', rarity: 'rare',
    description: 'A palm strike that channels crackling storm-thunder. May stun a foe for a turn.',
    energyCost: 9, cooldown: 3,
    effect: { attack: { power: 14, stun: 35 } },
  },
  {
    id: 'galeBlade', name: 'Gale Blade Gu', rank: 1, type: 'Attack', path: 'wind', element: 'wind', rarity: 'uncommon',
    description: 'A blade of cutting wind that strikes twice in a single breath.',
    energyCost: 6, cooldown: 1,
    effect: { attack: { power: 6, hits: 2 } },
  },
  {
    id: 'tempestGu', name: 'Tempest Gu', rank: 2, type: 'Attack', path: 'wind', element: 'wind', rarity: 'epic',
    description: 'A howling tempest tears at the enemy while hastening your own form.',
    energyCost: 10, cooldown: 3,
    effect: { attack: { power: 18 }, evasion: { power: 30, duration: 2 } },
  },
  // ---- Fire ----
  {
    id: 'emberGu', name: 'Ember Gu', rank: 1, type: 'Attack', path: 'fire', element: 'fire', rarity: 'common',
    description: 'A lash of living flame. Sets the enemy burning for several turns.',
    energyCost: 5, cooldown: 1,
    effect: { attack: { power: 10 }, burn: { power: 3, duration: 3 } },
  },
  {
    id: 'flameSerpent', name: 'Flame Serpent Gu', rank: 1, type: 'Attack', path: 'fire', element: 'fire', rarity: 'uncommon',
    description: 'Conjures a serpent of flame that bites one enemy and leaves it burning.',
    energyCost: 8, cooldown: 2,
    effect: { attack: { power: 16 }, burn: { power: 4, duration: 3 } },
  },
  {
    id: 'flameHeart', name: 'Flame Heart Gu', rank: 2, type: 'Support', path: 'fire', element: 'fire', rarity: 'rare',
    description: 'Kindles a heart of flame that empowers all your fire-based Gu.',
    energyCost: 8, cooldown: 4,
    effect: { buff: { element: 'fire', power: 50, duration: 3 } },
  },
  {
    id: 'scarletInferno', name: 'Scarlet Inferno Gu', rank: 3, type: 'Attack', path: 'fire', element: 'fire', rarity: 'legendary',
    description: 'A catastrophic bloom of scarlet fire. Few enemies survive its burning.',
    energyCost: 14, cooldown: 3,
    effect: { attack: { power: 30 }, burn: { power: 5, duration: 3 } },
  },
  // ---- Earth ----
  {
    id: 'stoneShell', name: 'Stone Shell Gu', rank: 1, type: 'Defense', path: 'earth', element: 'earth', rarity: 'common',
    description: 'Coats you in living stone, blunting incoming blows for several turns.',
    energyCost: 6, cooldown: 3,
    effect: { defense: { power: 6, duration: 3 } },
  },
  {
    id: 'ironSkin', name: 'Iron Skin Gu', rank: 1, type: 'Defense', path: 'earth', element: 'metal', rarity: 'common',
    description: 'Hardens your skin like iron. A short, strong bulwark.',
    energyCost: 4, cooldown: 2,
    effect: { defense: { power: 4, duration: 2 } },
  },
  {
    id: 'earthRoot', name: 'Earth Root Gu', rank: 2, type: 'Defense', path: 'earth', element: 'earth', rarity: 'uncommon',
    description: 'Roots you to the earth and raises a barrier that absorbs damage.',
    energyCost: 7, cooldown: 3,
    effect: { barrier: { power: 14, duration: 2 } },
  },
  {
    id: 'mountainGuard', name: 'Mountain Guard Gu', rank: 2, type: 'Defense', path: 'earth', element: 'earth', rarity: 'rare',
    description: 'Raises a bulwark like a mountain slope — a mighty, long-lasting barrier.',
    energyCost: 9, cooldown: 3,
    effect: { barrier: { power: 24, duration: 3 } },
  },
  // ---- Water ----
  {
    id: 'vitalSpring', name: 'Vital Spring Gu', rank: 1, type: 'Healing', path: 'water', element: 'wood', rarity: 'common',
    description: 'A spring of life wells up within you, restoring health.',
    energyCost: 6, cooldown: 3,
    effect: { heal: { power: 18 } },
  },
  {
    id: 'tideBinding', name: 'Tide Binding Gu', rank: 1, type: 'Control', path: 'water', element: 'water', rarity: 'uncommon',
    description: 'Waters coil like chains around the foe, sapping its strength.',
    energyCost: 7, cooldown: 3,
    effect: { control: { power: 6, duration: 3 } },
  },
  {
    id: 'mistVeil', name: 'Mist Veil Gu', rank: 2, type: 'Movement', path: 'water', element: 'water', rarity: 'rare',
    description: 'A veil of cold mist hides your form and knits your wounds.',
    energyCost: 8, cooldown: 3,
    effect: { evasion: { power: 40, duration: 2 }, heal: { power: 8 } },
  },
  {
    id: 'jadeMarrow', name: 'Jade Marrow Gu', rank: 2, type: 'Healing', path: 'water', element: 'wood', rarity: 'uncommon',
    description: 'Nourishes the marrow with jade essence, restoring primeval essence instead of health.',
    energyCost: 0, cooldown: 2,
    effect: { essence: { power: 14 } },
  },
  {
    id: 'shadowThread', name: 'Shadow Thread Gu', rank: 2, type: 'Control', path: 'water', element: 'shadow', rarity: 'uncommon',
    description: 'Tangles the enemy in threads of shadow, slowing and weakening their attacks.',
    energyCost: 6, cooldown: 3,
    effect: { control: { power: 5, duration: 3 } },
  },
  // ---- Enslavement ----
  {
    id: 'beastPact', name: 'Beast Pact Gu', rank: 1, type: 'Summon', path: 'enslavement', element: 'none', rarity: 'uncommon',
    description: 'A pact-seal that calls a tamed beast to maul your foe for several turns.',
    energyCost: 7, cooldown: 3,
    effect: { summon: { power: 5, duration: 3 } },
  },
  {
    id: 'serpentSwarm', name: 'Serpent Swarm Gu', rank: 2, type: 'Summon', path: 'enslavement', element: 'shadow', rarity: 'epic',
    description: 'Commands a swarm of enslaved serpents that strike every turn they prowl.',
    energyCost: 12, cooldown: 4,
    effect: { summon: { power: 10, duration: 3 } },
  },
  {
    id: 'bloodHunter', name: 'Blood Hunter Gu', rank: 2, type: 'Attack', path: 'enslavement', element: 'none', rarity: 'rare',
    description: 'Thrives on the scent of blood. Deals far more damage to wounded enemies.',
    energyCost: 7, cooldown: 2,
    effect: { attack: { power: 12 } },
  },
  // ---- Starter Gu (chosen at character creation) ----
  {
    id: 'flameSpark', name: 'Flame Spark Gu', rank: 1, type: 'Attack', path: 'fire', element: 'fire', rarity: 'common',
    description: 'A drifting spark of living flame that clings to the foe and burns on.',
    energyCost: 4, cooldown: 1,
    effect: { attack: { power: 5 }, burn: { power: 2, duration: 3 } },
  },
  {
    id: 'stoneSkin', name: 'Stone Skin Gu', rank: 1, type: 'Defense', path: 'earth', element: 'earth', rarity: 'common',
    description: 'Coats you in a skin of soft stone that steadily hardens against blows.',
    energyCost: 5, cooldown: 3,
    effect: { defense: { power: 7, duration: 3 } },
  },
  {
    id: 'healingDew', name: 'Healing Dew Gu', rank: 1, type: 'Healing', path: 'water', element: 'water', rarity: 'common',
    description: 'Condenses healing dew from the air, knitting wounds and steadying essence.',
    energyCost: 5, cooldown: 3,
    effect: { heal: { power: 14 }, essence: { power: 4 } },
  },
  {
    id: 'beastCall', name: 'Beast Call Gu', rank: 1, type: 'Summon', path: 'enslavement', element: 'none', rarity: 'common',
    description: 'A low call that binds a tamed beast to your will for a short pact.',
    energyCost: 5, cooldown: 3,
    effect: { summon: { power: 4, duration: 3 } },
  },
  // ---- Refinement-adjacent ----
  {
    id: 'insightEye', name: 'Insight Eye Gu', rank: 1, type: 'Investigation', path: 'refinement', element: 'none', rarity: 'common',
    description: "Reveals the enemy's true intentions and weaknesses in combat.",
    energyCost: 3, cooldown: 2,
    effect: { investigate: true },
  },
  {
    id: 'spiritMoth', name: 'Spirit Moth Gu', rank: 1, type: 'Investigation', path: 'refinement', element: 'wood', rarity: 'common',
    description: 'A faint moth that flutters toward hidden things. Boosts resource finds and reveals foes.',
    energyCost: 3, cooldown: 2,
    effect: { investigate: true },
    passive: { gatheringBonus: 1 },
  },
];

export const GU_BY_ID = Object.fromEntries(GU.map(g => [g.id, g]));
// Killer-Move tier: high-rank / rare Gu get the banner + stronger VFX in battle.
export const isKillerMove = (gu) => !!gu && (gu.rank >= 3 || gu.rarity === 'epic' || gu.rarity === 'legendary');
export const GU_TYPES = ['Attack', 'Defense', 'Movement', 'Control', 'Healing', 'Summon', 'Investigation', 'Support'];