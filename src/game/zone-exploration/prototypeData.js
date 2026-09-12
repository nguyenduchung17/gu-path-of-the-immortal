export const ZONE_IDS = {
  VILLAGE: 'greenValleyVillage',
  OUTSKIRTS: 'greenValleyOutskirts',
  FOREST: 'moonGrassForest',
  CAVE_ENTRANCE: 'serpentCaveEntrance',
  HIDDEN_SPRING: 'hiddenSpring',
};

export const TILE_TYPES = {
  GROUND: 'ground',
  SAFE: 'safe',
  GRASS: 'grass',
  FOREST: 'forest',
  CAVE: 'cave',
  WATER: 'water',
};

export const ZONE_ORDER = [
  ZONE_IDS.VILLAGE,
  ZONE_IDS.OUTSKIRTS,
  ZONE_IDS.FOREST,
  ZONE_IDS.CAVE_ENTRANCE,
];

export const ZONES = {
  [ZONE_IDS.VILLAGE]: {
    id: ZONE_IDS.VILLAGE,
    key: 'zone.village.name',
    subtitleKey: 'zone.village.subtitle',
    safe: true,
    width: 10,
    height: 7,
    defaultTile: TILE_TYPES.SAFE,
    start: { x: 2, y: 3 },
    decor: [
      { id: 'innRoof', x: 2, y: 1, icon: '🏮', key: 'zone.decor.inn' },
      { id: 'jadeWell', x: 4, y: 4, icon: '◎', key: 'zone.decor.well' },
      { id: 'gate', x: 9, y: 3, icon: '門', key: 'zone.decor.gate' },
    ],
    npcs: [
      { id: 'innkeeper', x: 2, y: 2, icon: '🍵', key: 'zone.npc.innkeeper', roleKey: 'zone.npc.innkeeper.role' },
      { id: 'guMerchant', x: 6, y: 2, icon: '🪲', key: 'zone.npc.guMerchant', roleKey: 'zone.npc.guMerchant.role' },
      { id: 'questBoard', x: 5, y: 5, icon: '📜', key: 'zone.npc.questBoard', roleKey: 'zone.npc.questBoard.role' },
    ],
    resources: [],
    enemies: [],
    exits: [
      { id: 'toOutskirts', x: 9, y: 3, to: ZONE_IDS.OUTSKIRTS, target: { x: 0, y: 3 }, key: 'zone.exit.outskirts' },
    ],
  },

  [ZONE_IDS.OUTSKIRTS]: {
    id: ZONE_IDS.OUTSKIRTS,
    key: 'zone.outskirts.name',
    subtitleKey: 'zone.outskirts.subtitle',
    safe: false,
    width: 12,
    height: 8,
    defaultTile: TILE_TYPES.GROUND,
    start: { x: 1, y: 3 },
    patches: [
      { type: TILE_TYPES.GRASS, cells: [[4, 2], [5, 2], [4, 3], [5, 3], [8, 5], [9, 5]] },
    ],
    decor: [
      { id: 'oldRoad', x: 2, y: 3, icon: '·', key: 'zone.decor.road' },
      { id: 'forestEdge', x: 11, y: 4, icon: '林', key: 'zone.decor.forestEdge' },
    ],
    npcs: [],
    resources: [
      { id: 'spiritHerbPatch', x: 7, y: 2, icon: '🌿', key: 'zone.resource.spiritHerb' },
    ],
    enemies: [
      { id: 'jadeBanditA', x: 5, y: 5, icon: '⚔', key: 'card.enemy.jadeBandit', encounterId: 'single' },
      { id: 'wolfBanditA', x: 9, y: 3, icon: '🐺', key: 'card.enemy.wolfBandit', encounterId: 'waves' },
    ],
    exits: [
      { id: 'toVillage', x: 0, y: 3, to: ZONE_IDS.VILLAGE, target: { x: 8, y: 3 }, key: 'zone.exit.village' },
      { id: 'toForest', x: 11, y: 4, to: ZONE_IDS.FOREST, target: { x: 0, y: 4 }, key: 'zone.exit.forest' },
    ],
  },

  [ZONE_IDS.FOREST]: {
    id: ZONE_IDS.FOREST,
    key: 'zone.forest.name',
    subtitleKey: 'zone.forest.subtitle',
    safe: false,
    width: 12,
    height: 9,
    defaultTile: TILE_TYPES.FOREST,
    start: { x: 1, y: 4 },
    patches: [
      { type: TILE_TYPES.GRASS, cells: [[3, 2], [4, 2], [3, 3], [4, 3], [7, 5], [8, 5], [7, 6], [8, 6]] },
    ],
    decor: [
      { id: 'hiddenPathHint', x: 6, y: 1, icon: '？', key: 'zone.decor.hiddenPath' },
      { id: 'caveTrail', x: 11, y: 5, icon: '石', key: 'zone.decor.caveTrail' },
    ],
    npcs: [],
    resources: [
      { id: 'moonGrass', x: 5, y: 6, icon: '☾', key: 'zone.resource.moonGrass' },
    ],
    enemies: [
      { id: 'ashenCultivatorA', x: 4, y: 5, icon: '🔥', key: 'card.enemy.ashenCultivator', encounterId: 'multi' },
      { id: 'venomAcolyteA', x: 8, y: 2, icon: '☠', key: 'card.enemy.venomAcolyte', encounterId: 'multi' },
      { id: 'ironGuardA', x: 9, y: 6, icon: '🛡', key: 'card.enemy.ironGuard', encounterId: 'multi' },
    ],
    exits: [
      { id: 'toOutskirts', x: 0, y: 4, to: ZONE_IDS.OUTSKIRTS, target: { x: 10, y: 4 }, key: 'zone.exit.outskirts' },
      { id: 'toCaveEntrance', x: 11, y: 5, to: ZONE_IDS.CAVE_ENTRANCE, target: { x: 0, y: 3 }, key: 'zone.exit.caveEntrance' },
    ],
    hiddenExits: [
      { id: 'toHiddenSpring', x: 6, y: 1, to: ZONE_IDS.HIDDEN_SPRING, target: { x: 1, y: 2 }, key: 'zone.exit.hiddenUnknown' },
    ],
  },

  [ZONE_IDS.CAVE_ENTRANCE]: {
    id: ZONE_IDS.CAVE_ENTRANCE,
    key: 'zone.caveEntrance.name',
    subtitleKey: 'zone.caveEntrance.subtitle',
    safe: false,
    width: 10,
    height: 7,
    defaultTile: TILE_TYPES.CAVE,
    start: { x: 1, y: 3 },
    decor: [
      { id: 'sealedCave', x: 8, y: 3, icon: '⛰', key: 'zone.decor.futureCave' },
    ],
    npcs: [],
    resources: [
      { id: 'caveMoss', x: 4, y: 2, icon: '🪨', key: 'zone.resource.caveMoss' },
    ],
    enemies: [
      { id: 'obsidianDaoistA', x: 6, y: 4, icon: '◆', key: 'card.enemy.obsidianDaoist', encounterId: 'elite' },
    ],
    exits: [
      { id: 'toForest', x: 0, y: 3, to: ZONE_IDS.FOREST, target: { x: 10, y: 5 }, key: 'zone.exit.forest' },
    ],
    futureExits: [
      { id: 'futureCaveInterior', x: 8, y: 3, key: 'zone.exit.futureCave' },
    ],
  },

  [ZONE_IDS.HIDDEN_SPRING]: {
    id: ZONE_IDS.HIDDEN_SPRING,
    key: 'zone.hiddenSpring.name',
    hiddenNameKey: 'zone.hidden.unknown',
    subtitleKey: 'zone.hiddenSpring.subtitle',
    safe: true,
    hidden: true,
    width: 6,
    height: 5,
    defaultTile: TILE_TYPES.WATER,
    start: { x: 1, y: 2 },
    decor: [{ id: 'spring', x: 3, y: 2, icon: '泉', key: 'zone.decor.spring' }],
    npcs: [],
    resources: [],
    enemies: [],
    exits: [{ id: 'toForest', x: 0, y: 2, to: ZONE_IDS.FOREST, target: { x: 6, y: 1 }, key: 'zone.exit.forest' }],
  },
};
