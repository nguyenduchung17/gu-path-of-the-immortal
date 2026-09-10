// The Green Valley Region — one large continuous world.
// The player walks seamlessly between zones; only the town's teleportation
// formation hints at distant regional travel (reserved for future regions).
import { ENEMY_BY_ID } from './enemies';

export const W = 84;
export const H = 57;

// Zone order matters: earlier zones win overlapping checks (sub-zones first).
export const ZONES = [
  { id: 'ironfangTerritory', name: 'Ironfang Territory', danger: 5, dangerLabel: 'EXTREME DANGER', rect: { x: 4, y: 2, w: 9, h: 8 }, eventRate: 0 },
  { id: 'banditCamp', name: 'Bandit Camp', danger: 4, dangerLabel: 'HIGH DANGER', rect: { x: 62, y: 14, w: 8, h: 7 }, eventRate: 0 },
  { id: 'greenValleyTown', name: 'Green Valley Town', danger: 0, dangerLabel: 'SAFE ZONE', rect: { x: 33, y: 38, w: 20, h: 14 }, safe: true, eventRate: 0 },
  { id: 'willowHamlet', name: 'Willow Hamlet', danger: 0, dangerLabel: 'SAFE ZONE', rect: { x: 56, y: 38, w: 9, h: 8 }, safe: true, eventRate: 0 },
  { id: 'ruins', name: 'Mist-Wreathed Ruins', danger: 4, dangerLabel: 'HIGH DANGER', rect: { x: 66, y: 36, w: 14, h: 12 }, eventRate: 2.5 },
  { id: 'deepForest', name: 'Deep Mist Forest', danger: 4, dangerLabel: 'HIGH DANGER', rect: { x: 4, y: 2, w: 20, h: 9 }, eventRate: 2.5 },
  { id: 'wildForest', name: 'Wild Forest', danger: 3, dangerLabel: 'MODERATE DANGER', rect: { x: 4, y: 11, w: 20, h: 27 }, eventRate: 2 },
  { id: 'forestOutskirts', name: 'Forest Outskirts', danger: 2, dangerLabel: 'LOW DANGER', rect: { x: 24, y: 12, w: 30, h: 16 }, eventRate: 2 },
  { id: 'farmland', name: 'Green Valley Farmland', danger: 2, dangerLabel: 'LOW DANGER', rect: { x: 30, y: 28, w: 26, h: 10 }, eventRate: 1 },
  { id: 'southernWilds', name: 'Southern Wilds', danger: 3, dangerLabel: 'MODERATE DANGER', rect: { x: 4, y: 38, w: 28, h: 18 }, eventRate: 2 },
  { id: 'eastHills', name: 'Copper Hills', danger: 2, dangerLabel: 'LOW DANGER', rect: { x: 54, y: 12, w: 8, h: 12 }, eventRate: 1.5 },
  { id: 'eastPlains', name: 'Eastern Plains', danger: 2, dangerLabel: 'LOW DANGER', rect: { x: 54, y: 12, w: 28, h: 24 }, eventRate: 1.5 },
  { id: 'marsh', name: 'Mistfall Marsh', danger: 3, dangerLabel: 'MODERATE DANGER', rect: { x: 54, y: 48, w: 28, h: 9 }, eventRate: 2 },
];
export const DEFAULT_ZONE = { id: 'region', name: 'Green Valley Region', danger: 1, dangerLabel: 'LOW DANGER', eventRate: 0 };

export function zoneAt(x, y) {
  for (const z of ZONES) {
    const r = z.rect;
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return z;
  }
  return null;
}

export const TERRACE = [49, 43];       // ×1.5 cultivation tile inside town
export const FORMATION = [45, 47];    // teleportation formation (dormant)
export const CAMP_CELLS = [[23, 45], [24, 45]];

// Inns — safe lodging. cost is the per-night room price (scaled by difficulty);
// spawn is the adjacent cell where an Easy-mode death returns the player.
export const INNS = [
  { id: 'townInn', name: 'Green Valley Inn', npcId: 'innkeeper', x: 35, y: 42, spawn: [35, 43], cost: 15 },
  { id: 'hamletInn', name: 'Willow Hearth', npcId: 'villageElder', x: 62, y: 44, spawn: [62, 45], cost: 8 },
];

// Map-discovery landmarks. hidden ones only appear once the player comes close.
export const LANDMARKS = [
  { id: 'townGate', name: 'Green Valley Town', x: 42, y: 38, r: 4 },
  { id: 'riversideCamp', name: 'Riverside Camp', x: 23, y: 45, r: 3 },
  { id: 'oldBridge', name: 'Old Stone Bridge', x: 26, y: 44, r: 3 },
  { id: 'willowHamletLm', name: 'Willow Hamlet', x: 60, y: 40, r: 4 },
  { id: 'witheredOak', name: 'Withered Oak', x: 30, y: 18, r: 4 },
  { id: 'teleportFormation', name: 'Teleportation Formation', x: 45, y: 47, r: 3 },
  { id: 'hiddenCaveLm', name: 'Hidden Cave', x: 8, y: 46, r: 2, hidden: true },
  { id: 'spiritSpringLm', name: 'Spirit Spring', x: 12, y: 22, r: 2, hidden: true },
  { id: 'banditCampLm', name: 'Bandit Camp', x: 65, y: 17, r: 4, hidden: true },
  { id: 'ruinsLm', name: 'Mist-Wreathed Ruins', x: 72, y: 41, r: 4, hidden: true },
  { id: 'ironfangLm', name: 'Ironfang Territory', x: 8, y: 5, r: 4, hidden: true },
];

// Buildings are solid blocks ('#' tiles) with a label rendered on their centre.
export const BUILDINGS = [
  { id: 'inn', label: 'INN', x: 34, y: 39, w: 4, h: 3, color: '#8a5a2b' },
  { id: 'guShop', label: 'GU SHOP', x: 47, y: 39, w: 4, h: 3, color: '#6d3fa8' },
  { id: 'questHall', label: 'QUEST HALL', x: 34, y: 46, w: 5, h: 3, color: '#4d7c0f' },
  { id: 'exchange', label: 'EXCHANGE', x: 39, y: 46, w: 3, h: 3, color: '#0e7490' },
  { id: 'arena', label: 'ARENA', x: 47, y: 45, w: 5, h: 4, color: '#9f1239' },
  { id: 'house1', label: '', x: 35, y: 50, w: 2, h: 1, color: '#57534e' },
  { id: 'house2', label: '', x: 44, y: 50, w: 2, h: 1, color: '#57534e' },
  { id: 'hamHouse1', label: '', x: 57, y: 39, w: 2, h: 2, color: '#57534e' },
  { id: 'hamHouse2', label: '', x: 60, y: 39, w: 2, h: 2, color: '#57534e' },
  { id: 'hamHall', label: 'ELDER', x: 61, y: 42, w: 3, h: 2, color: '#4d7c0f' },
  { id: 'tent1', label: '', x: 62, y: 15, w: 2, h: 2, color: '#7c2d12' },
  { id: 'tent2', label: '', x: 67, y: 15, w: 2, h: 2, color: '#7c2d12' },
  { id: 'tent3', label: '', x: 65, y: 18, w: 2, h: 2, color: '#7c2d12' },
];

export const NPC_POSITIONS = {
  innkeeper: [35, 42],
  guMaster: [48, 42],
  merchant: [39, 43],
  herbalist: [40, 43],
  questOfficer: [35, 49],
  contributionOfficer: [40, 49],
  arenaManager: [49, 49],
  sectElder: [50, 43],
  villageElder: [62, 44],
  guPeddler: [57, 44],
  blackMarketMerchant: [58, 43],
  mysteriousTraveler: [59, 42],
};
export const WORLD_NPCS = Object.entries(NPC_POSITIONS).map(([id, [x, y]]) => ({ id, x, y }));

// Gathering nodes. Each respawns after BALANCE.world.gatherRespawnMs.
export const RESOURCES = [
  { id: 'f1', x: 33, y: 30, type: 'spiritGrass', name: 'Spirit Grass' },
  { id: 'f2', x: 48, y: 31, type: 'spiritGrass', name: 'Spirit Grass' },
  { id: 'f3', x: 36, y: 34, type: 'herb', name: 'Spirit Herb' },
  { id: 'f4', x: 51, y: 29, type: 'herb', name: 'Spirit Herb' },
  { id: 'o1', x: 27, y: 15, type: 'herb', name: 'Spirit Herb' },
  { id: 'o2', x: 33, y: 20, type: 'herb', name: 'Spirit Herb' },
  { id: 'o3', x: 50, y: 16, type: 'herb', name: 'Spirit Herb' },
  { id: 'o4', x: 29, y: 23, type: 'moonPetal', name: 'Moon Petal' },
  { id: 'w1', x: 10, y: 26, type: 'moonPetal', name: 'Moon Petal' },
  { id: 'w2', x: 16, y: 30, type: 'mistSilk', name: 'Mist Silk' },
  { id: 'w3', x: 7, y: 33, type: 'ore', name: 'Jade Ore' },
  { id: 'w4', x: 19, y: 22, type: 'spiritGrass', name: 'Spirit Grass' },
  { id: 'd1', x: 18, y: 4, type: 'moonPetal', name: 'Moon Petal' },
  { id: 'd2', x: 22, y: 8, type: 'windCrystal', name: 'Wind Crystal' },
  { id: 'd3', x: 15, y: 8, type: 'herb', name: 'Spirit Herb' },
  { id: 'd4', x: 6, y: 10, type: 'moonPetal', name: 'Moon Petal' },
  { id: 'h1', x: 57, y: 15, type: 'ore', name: 'Jade Ore' },
  { id: 'h2', x: 60, y: 20, type: 'ore', name: 'Jade Ore' },
  { id: 'h3', x: 55, y: 19, type: 'ironOre', name: 'Iron Ore' },
  { id: 'r1', x: 69, y: 39, type: 'ironOre', name: 'Iron Ore' },
  { id: 'r2', x: 74, y: 37, type: 'fireEssence', name: 'Fire Essence' },
  { id: 'r3', x: 77, y: 42, type: 'shadowSilk', name: 'Shadow Silk' },
  { id: 'r4', x: 72, y: 46, type: 'ironOre', name: 'Iron Ore' },
  { id: 's1', x: 10, y: 40, type: 'herb', name: 'Spirit Herb' },
  { id: 's2', x: 20, y: 50, type: 'ore', name: 'Jade Ore' },
  { id: 's3', x: 14, y: 52, type: 'moonPetal', name: 'Moon Petal' },
  { id: 's4', x: 6, y: 49, type: 'ironOre', name: 'Iron Ore' },
  { id: 'bc1', x: 66, y: 20, type: 'stolenGoods', name: "Merchant's Stolen Wares" },
  { id: 'm1', x: 58, y: 52, type: 'mistSilk', name: 'Mist Silk' },
  { id: 'm2', x: 70, y: 50, type: 'herb', name: 'Spirit Herb' },
  { id: 'm3', x: 76, y: 53, type: 'serpentGland', name: 'Serpent Gland' },
  { id: 'cave1', x: 8, y: 47, type: 'ironOre', name: 'Cave Cache' },
  { id: 'spring1', x: 12, y: 23, type: 'moonPetal', name: 'Spring-Touched Moon Petal' },
];
export const WORLD_RESOURCES = RESOURCES;

// Visible world enemies — behaviour drives detection radius and aggression.
// detect: optional per-spawn override of the behaviour default.
export const INITIAL_ENEMIES = [
  { defId: 'wildBoar', x: 34, y: 31, behavior: 'passive' },
  { defId: 'wildBoar', x: 49, y: 34, behavior: 'passive' },
  { defId: 'wildWolf', x: 28, y: 16, behavior: 'aggressive' },
  { defId: 'wildWolf', x: 36, y: 22, behavior: 'aggressive' },
  { defId: 'wildWolf', x: 48, y: 18, behavior: 'aggressive' },
  { defId: 'bloodCrow', x: 33, y: 14, behavior: 'aggressive' },
  { defId: 'stoneBeast', x: 44, y: 24, behavior: 'territorial' },
  { defId: 'poisonSpider', x: 8, y: 18, behavior: 'territorial' },
  { defId: 'poisonSpider', x: 17, y: 28, behavior: 'territorial' },
  { defId: 'forestSerpent', x: 12, y: 32, behavior: 'predator' },
  { defId: 'forestSerpent', x: 20, y: 16, behavior: 'predator' },
  { defId: 'stoneBeast', x: 6, y: 24, behavior: 'territorial' },
  { defId: 'shadowHound', x: 16, y: 6, behavior: 'predator' },
  { defId: 'shadowHound', x: 20, y: 9, behavior: 'predator' },
  { defId: 'mutatedBeast', x: 14, y: 3, behavior: 'territorial' },
  { defId: 'shadowHound', x: 6, y: 4, behavior: 'predator' },
  { defId: 'shadowHound', x: 10, y: 7, behavior: 'predator' },
  { defId: 'ironfangAlpha', x: 7, y: 6, behavior: 'predator' },
  { defId: 'wildWolf', x: 10, y: 42, behavior: 'aggressive' },
  { defId: 'wildWolf', x: 22, y: 48, behavior: 'aggressive' },
  { defId: 'forestSerpent', x: 16, y: 52, behavior: 'predator' },
  { defId: 'stoneBeast', x: 8, y: 44, behavior: 'territorial' },
  { defId: 'bloodCrow', x: 57, y: 18, behavior: 'aggressive' },
  { defId: 'bloodCrow', x: 60, y: 15, behavior: 'aggressive' },
  { defId: 'wildWolf', x: 58, y: 21, behavior: 'aggressive' },
  { defId: 'wildBoar', x: 66, y: 30, behavior: 'passive' },
  { defId: 'wildBoar', x: 74, y: 26, behavior: 'passive' },
  { defId: 'bandit', x: 70, y: 33, behavior: 'aggressive' },
  { defId: 'bandit', x: 62, y: 16, behavior: 'guard' },
  { defId: 'bandit', x: 68, y: 19, behavior: 'guard' },
  { defId: 'bandit', x: 64, y: 20, behavior: 'guard' },
  { defId: 'bandit', x: 67, y: 20, behavior: 'guard' },
  { defId: 'banditChief', x: 65, y: 16, behavior: 'guard' },
  { defId: 'ancientGuardian', x: 70, y: 40, behavior: 'guard' },
  { defId: 'ancientGuardian', x: 75, y: 45, behavior: 'guard' },
  { defId: 'shadowHound', x: 72, y: 44, behavior: 'predator' },
  { defId: 'mutatedBeast', x: 78, y: 39, behavior: 'territorial' },
  { defId: 'poisonSpider', x: 58, y: 51, behavior: 'territorial' },
  { defId: 'poisonSpider', x: 76, y: 52, behavior: 'territorial' },
  { defId: 'forestSerpent', x: 68, y: 54, behavior: 'predator' },
];

export function initialEnemies() {
  return INITIAL_ENEMIES.map((e, i) => ({
    id: `w${i}`,
    defId: e.defId,
    x: e.x, y: e.y,
    home: { x: e.x, y: e.y },
    behavior: e.behavior,
    detect: e.detect,
    hp: ENEMY_BY_ID[e.defId].hp,
    state: 'idle',
    alertTicks: 0,
    dead: false,
    respawnAt: 0,
  }));
}

const TREE_DENSITY = { deepForest: 0.42, wildForest: 0.3, forestOutskirts: 0.17, southernWilds: 0.15, ruins: 0.05, marsh: 0.08, eastHills: 0.04, eastPlains: 0.05 };
const ROCK_DENSITY = { eastHills: 0.12, southernWilds: 0.03 };

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTiles() {
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); };

  // ground tints
  rect(24, 12, 30, 16, ',');
  rect(4, 2, 20, 9, ',');
  rect(4, 11, 20, 27, ',');
  rect(4, 38, 28, 18, ',');
  rect(66, 36, 14, 12, ',');
  rect(54, 48, 28, 9, ',');
  // farmland plots
  [[32, 29], [37, 31], [44, 29], [50, 31], [35, 34], [46, 34]].forEach(([x, y]) => rect(x, y, 2, 2, 'f'));
  // river + spring pond
  rect(26, 2, 2, 55, '~');
  rect(12, 22, 2, 1, '~');
  // roads (safer than the wilderness around them)
  rect(42, 12, 2, 39, 'r');
  rect(20, 44, 33, 1, 'r');
  rect(53, 44, 14, 1, 'r');
  // bridge over the river
  set(26, 44, 'b'); set(27, 44, 'b');
  // town walls + gates
  rect(33, 38, 20, 1, 'W'); rect(33, 51, 20, 1, 'W');
  rect(33, 38, 1, 14, 'W'); rect(52, 38, 1, 14, 'W');
  set(42, 38, 'r'); set(43, 38, 'r'); set(33, 44, 'r'); set(52, 44, 'r');
  // buildings
  for (const b of BUILDINGS) rect(b.x, b.y, b.w, b.h, '#');
  // market stalls, cultivation terrace, teleport formation, campsite
  set(39, 42, 's'); set(40, 42, 's');
  set(TERRACE[0], TERRACE[1], '*');
  set(FORMATION[0], FORMATION[1], 'F');
  CAMP_CELLS.forEach(([x, y]) => set(x, y, 'c'));
  // broken ruin walls
  [[68, 38, 3, 1], [74, 38, 1, 3], [70, 42, 3, 1], [76, 44, 3, 1], [68, 45, 1, 3]].forEach(([x, y, w, h]) => rect(x, y, w, h, '#'));

  // scatter trees & rocks — never inside safe zones, roads, water or around protected spots
  const prot = new Set();
  const protect = (x, y) => {
    prot.add(`${x},${y}`); prot.add(`${x + 1},${y}`); prot.add(`${x - 1},${y}`);
    prot.add(`${x},${y + 1}`); prot.add(`${x},${y - 1}`);
  };
  RESOURCES.forEach(r => protect(r.x, r.y));
  INITIAL_ENEMIES.forEach(e => protect(e.x, e.y));
  const rng = mulberry32(20260910);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = g[y][x];
      if (c !== '.' && c !== ',') continue;
      const z = zoneAt(x, y);
      if (!z || z.safe) continue;
      if (prot.has(`${x},${y}`)) continue;
      const rocks = ROCK_DENSITY[z.id] || 0;
      const r = rng();
      if (r < rocks) set(x, y, 'R');
      else if (r < rocks + (TREE_DENSITY[z.id] || 0)) set(x, y, 'T');
    }
  }
  // world border
  rect(0, 0, W, 2, 'T'); rect(0, H - 2, W, 2, 'T');
  rect(0, 0, 2, H, 'T'); rect(W - 2, 0, 2, H, 'T');
  return g;
}

export const WORLD = {
  id: 'greenValleyRegion',
  name: 'Green Valley Region',
  w: W, h: H,
  tiles: buildTiles(),
};

const BLOCKED = new Set(['T', '~', '#', 'W', 'R', 's']);
export function isWalkable(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  return !BLOCKED.has(WORLD.tiles[y][x]);
}

// Lookup maps for the renderer
export const BUILDING_AT = new Map();
for (const b of BUILDINGS) {
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) BUILDING_AT.set(`${b.x + i},${b.y + j}`, b);
}
export const BUILDING_LABELS = new Set(
  BUILDINGS.filter(b => b.label).map(b => `${b.x + ((b.w - 1) >> 1)},${b.y + ((b.h - 1) >> 1)}`)
);