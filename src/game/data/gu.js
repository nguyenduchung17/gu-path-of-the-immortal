// Every Gu belongs to a Dao Path. Refinement recipes live in recipes.js;
// mastery/cultivation requirements gate the recipe, not the equipment.
export const GU = [
  // ---- Wind ----
  {
    id: 'swiftFang', name: 'Swift Fang Gu', rank: 1, type: 'Attack', path: 'wind', element: 'wind', rarity: 'common',
    description: 'A swift bite of wind-force. Every strike builds WIND MOMENTUM — the longer the fight, the sooner you act.',
    energyCost: 3, cooldown: 0,
    effect: { attack: { power: 7, range: [6, 9] }, self: { momentum: { power: 5, cap: 5 } } },
  },
  {
    id: 'windStep', name: 'Wind Step Gu', rank: 1, type: 'Movement', path: 'wind', element: 'wind', rarity: 'common',
    description: 'Your form blurs like the wind. Greatly raises evasion and escape chance.',
    energyCost: 5, cooldown: 3,
    effect: { evasion: { power: 45, duration: 2 }, self: { haste: { power: 25, duration: 2 } } },
    explore: { kind: 'haste', essence: 4, cooldown: 12, duration: 10 },
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
    effect: { attack: { power: 6, hits: 2 }, advance: { pct: 10 } },
  },
  {
    id: 'tempestGu', name: 'Tempest Gu', rank: 2, type: 'Attack', path: 'wind', element: 'wind', rarity: 'epic',
    description: 'A howling tempest tears at the enemy while hastening your own form.',
    energyCost: 14, cooldown: 3,
    effect: { attack: { power: 18 }, evasion: { power: 30, duration: 2 }, self: { haste: { power: 20, duration: 2 } } },
  },
  // ---- Fire ----
  {
    id: 'emberGu', name: 'Ember Gu', rank: 1, type: 'Attack', path: 'fire', element: 'fire', rarity: 'common',
    description: 'A lash of living flame. Sets the enemy burning for several turns.',
    energyCost: 5, cooldown: 1,
    effect: { attack: { power: 8 }, burn: { power: 3, duration: 3 } },
  },
  {
    id: 'flameSerpent', name: 'Flame Serpent Gu', rank: 1, type: 'Attack', path: 'fire', element: 'fire', rarity: 'uncommon',
    description: 'Conjures a serpent of flame that bites one enemy and leaves it burning.',
    energyCost: 8, cooldown: 2,
    effect: { attack: { power: 11 }, burn: { power: 4, duration: 3 } },
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
    energyCost: 22, cooldown: 5,
    effect: { attack: { power: 30 }, burn: { power: 5, duration: 3 }, selfDelay: { pct: 20 } },
  },
  // ---- Earth ----
  {
    id: 'stoneShell', name: 'Stone Shell Gu', rank: 1, type: 'Defense', path: 'earth', element: 'earth', rarity: 'common',
    description: 'Coats you in living stone, blunting incoming blows for several turns. In the wilds, its earth grip anchors your footing on shifting ground.',
    energyCost: 6, cooldown: 3,
    effect: { defense: { power: 6, duration: 3 } },
    explore: { kind: 'steady', essence: 4, cooldown: 25, duration: 12 },
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
    explore: { kind: 'sense', essence: 4, cooldown: 25, duration: 12, radius: 7 },
  },
  {
    id: 'mountainGuard', name: 'Mountain Guard Gu', rank: 2, type: 'Defense', path: 'earth', element: 'earth', rarity: 'rare',
    description: 'Raises a bulwark like a mountain slope — a mighty, long-lasting barrier.',
    energyCost: 9, cooldown: 3,
    effect: { barrier: { power: 24, duration: 3 }, selfDelay: { pct: 15 } },
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
    effect: { control: { power: 6, duration: 3 }, delay: { pct: 25 }, soak: true, stab: 6 },
    explore: { kind: 'root', essence: 6, cooldown: 20, duration: 5, range: 8 },
  },
  {
    id: 'mistVeil', name: 'Mist Veil Gu', rank: 2, type: 'Movement', path: 'water', element: 'water', rarity: 'rare',
    description: 'A veil of cold mist hides your form and knits your wounds.',
    energyCost: 8, cooldown: 3,
    effect: { evasion: { power: 40, duration: 2 }, heal: { power: 8 }, soak: true },
    explore: { kind: 'stealth', essence: 6, cooldown: 25, duration: 12, power: 50 },
  },
  {
    id: 'jadeMarrow', name: 'Jade Marrow Gu', rank: 2, type: 'Healing', path: 'water', element: 'wood', rarity: 'uncommon',
    description: 'Nourishes the marrow with jade essence, restoring primeval essence instead of health.',
    energyCost: 3, cooldown: 2,
    effect: { essence: { power: 14 } },
  },
  {
    id: 'shadowThread', name: 'Shadow Thread Gu', rank: 2, type: 'Control', path: 'water', element: 'shadow', rarity: 'uncommon',
    description: 'Tangles the enemy in threads of shadow, slowing and weakening their attacks.',
    energyCost: 6, cooldown: 3,
    effect: { control: { power: 5, duration: 3 }, slow: { power: 30, duration: 2 } },
    explore: { kind: 'slow', essence: 5, cooldown: 15, duration: 8, power: 50, range: 8 },
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
    energyCost: 15, cooldown: 4,
    effect: { summon: { power: 10, duration: 3 } },
  },
  {
    id: 'bloodHunter', name: 'Blood Hunter Gu', rank: 2, type: 'Attack', path: 'enslavement', element: 'none', rarity: 'rare',
    description: 'Thrives on the scent of blood. Deals far more damage to wounded enemies.',
    energyCost: 7, cooldown: 2,
    effect: { attack: { power: 12 } },
  },
  // ---- Elite-boss Gu (spoils of the ancient horrors) ----
  {
    id: 'phantomTide', name: 'Phantom Tide Gu', rank: 3, type: 'Attack', path: 'water', element: 'water', rarity: 'legendary',
    description: 'A tide of phantom mist-water torn from the Devourer\u2019s own breath. Strikes hard and leaves your form hidden in fog.',
    energyCost: 20, cooldown: 3,
    effect: { attack: { power: 15 }, evasion: { power: 40, duration: 2 }, soak: true },
  },
  {
    id: 'jadeColossus', name: 'Jade Colossus Gu', rank: 3, type: 'Defense', path: 'earth', element: 'earth', rarity: 'legendary',
    description: 'Raises a colossus of living jade around you — a mighty barrier that hardens your guard while it stands.',
    energyCost: 16, cooldown: 3,
    effect: { barrier: { power: 34, duration: 3 }, defense: { power: 5, duration: 3 }, selfDelay: { pct: 15 } },
  },
  {
    id: 'nightSwarm', name: 'Night Swarm Gu', rank: 3, type: 'Summon', path: 'enslavement', element: 'shadow', rarity: 'epic',
    description: 'Calls a swarm of shadow-fed beasts bound by the Matriarch\u2019s marrow. They maul your foe every turn they prowl.',
    energyCost: 18, cooldown: 4,
    effect: { summon: { power: 13, duration: 3 } },
  },
  // ---- Starter Gu (chosen at character creation) ----
  // Eight philosophies of combat — one per Dao Path. Balanced on TOTAL VALUE,
  // not raw damage: every option can win an early fight, and each teaches a
  // different mechanic (Burn / Paralysis / Essence regain / Freeze / Poison
  // stacks / Momentum / GUARD-breaking / Criticals).
  {
    id: 'emberFang', name: 'Ember Fang Gu', rank: 1, type: 'Attack', path: 'fire', element: 'fire', rarity: 'common',
    description: 'A fang of living flame. Strikes hard and leaves the foe BURNING — fire damage every action.',
    energyCost: 4, cooldown: 1,
    effect: { attack: { power: 10, range: [8, 11] }, burn: { power: 2, duration: 3 } },
  },
  {
    id: 'sparkNeedle', name: 'Spark Needle Gu', rank: 1, type: 'Attack', path: 'lightning', element: 'lightning', rarity: 'common',
    description: 'A needle of drawn lightning. May PARALYZE the foe — its next action simply never comes.',
    energyCost: 4, cooldown: 1,
    effect: { attack: { power: 9, range: [7, 10], paralysis: { chance: 20, duration: 1 } } },
  },
  {
    id: 'flowingDrop', name: 'Flowing Drop Gu', rank: 1, type: 'Attack', path: 'water', element: 'water', rarity: 'common',
    description: 'A drop that flows without spilling. Sometimes the strike\u2019s essence flows back to you.',
    energyCost: 4, cooldown: 1,
    effect: { attack: { power: 8, range: [6, 9] }, essenceRecovery: { chance: 25, min: 1, max: 2 } },
  },
  {
    id: 'frostNeedle', name: 'Frost Needle Gu', rank: 1, type: 'Attack', path: 'ice', element: 'ice', rarity: 'common',
    description: 'A needle of dead-still frost. May FREEZE the foe solid for its next action.',
    energyCost: 4, cooldown: 1,
    effect: { attack: { power: 8, range: [6, 9], freeze: { chance: 15, duration: 1 } } },
  },
  {
    id: 'venomNeedle', name: 'Venom Needle Gu', rank: 1, type: 'Attack', path: 'poison', element: 'poison', rarity: 'common',
    description: 'A hollow needle-bead of venom. Its POISON stacks with every strike — weak now, deadly soon.',
    energyCost: 3, cooldown: 0,
    effect: { attack: { power: 6, range: [4, 7] }, poison: { power: 2, duration: 3 } },
  },
  {
    id: 'stoneFist', name: 'Stone Fist Gu', rank: 1, type: 'Attack', path: 'earth', element: 'earth', rarity: 'common',
    description: 'A fist of grinding stone. Splinters the foe\u2019s GUARD — and sometimes leaves you braced behind Stone Guard.',
    energyCost: 3, cooldown: 1,
    effect: { attack: { power: 7, range: [5, 8], guard: { chance: 25, power: 5, duration: 2 } }, stab: 12 },
  },
  {
    id: 'ironEdge', name: 'Iron Edge Gu', rank: 1, type: 'Attack', path: 'sword', element: 'metal', rarity: 'common',
    description: 'A plain iron edge honed to one truth: the clean cut. High damage, honest criticals, no tricks.',
    energyCost: 4, cooldown: 1,
    effect: { attack: { power: 11, range: [9, 13], crit: 10 } },
  },
  // ---- Legacy starter Gu (retired from the creation roster) ----
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
    explore: { kind: 'vision', essence: 4, cooldown: 25, duration: 12, radius: 7 },
  },
  // ---- Sword (unlocked only by Master Jian) ----
  {
    id: 'flyingSword', name: 'Flying Sword Gu', rank: 2, type: 'Attack', path: 'sword', element: 'metal', rarity: 'rare',
    description: 'A spirit blade that leaves your hand, strikes and returns — the signature of the Sword Path.',
    energyCost: 8, cooldown: 2,
    effect: { attack: { power: 16 }, expose: { power: 20, duration: 2 }, stab: 8 },
  },
  {
    id: 'swordRain', name: 'Sword Rain Gu', rank: 3, type: 'Attack', path: 'sword', element: 'metal', rarity: 'legendary',
    description: 'The fabled Sword Rain — a storm of flying blades few ever live to see twice. A Killer Move of Master Jian\u2019s lineage.',
    energyCost: 24, cooldown: 5,
    effect: { attack: { power: 12, hits: 3 } },
  },
  // ---- Refinement-adjacent ----
  {
    id: 'insightEye', name: 'Insight Eye Gu', rank: 1, type: 'Investigation', path: 'refinement', element: 'none', rarity: 'common',
    description: "Reveals the enemy's true intentions and weaknesses in combat.",
    energyCost: 3, cooldown: 2,
    effect: { investigate: true },
    explore: { kind: 'vision', essence: 5, cooldown: 30, duration: 20, radius: 9 },
  },
  {
    id: 'spiritMoth', name: 'Spirit Moth Gu', rank: 1, type: 'Investigation', path: 'refinement', element: 'wood', rarity: 'common',
    description: 'A faint moth that flutters toward hidden things. Boosts resource finds and reveals foes.',
    energyCost: 3, cooldown: 2,
    effect: { investigate: true },
    passive: { gatheringBonus: 1 },
    explore: { kind: 'sense', essence: 3, cooldown: 20, duration: 15, radius: 8 },
  },
];

export const GU_BY_ID = Object.fromEntries(GU.map(g => [g.id, g]));
// Killer-Move tier: high-rank / rare Gu get the banner + stronger VFX in battle.
export const isKillerMove = (gu) => !!gu && (gu.rank >= 3 || gu.rarity === 'epic' || gu.rarity === 'legendary');
export const GU_TYPES = ['Attack', 'Defense', 'Movement', 'Control', 'Healing', 'Summon', 'Investigation', 'Support'];