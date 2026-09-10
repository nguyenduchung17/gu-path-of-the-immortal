// The Green Valley Region — one large continuous world.
// The player walks seamlessly between zones; only the town's teleportation
// formation hints at distant regional travel (reserved for future regions).
import { ENEMY_BY_ID } from './enemies';
import { WILD_GU_SPAWNS } from './wildGu';

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
  // elite boss lairs
  { id: 'mistLair', name: 'Devourer Hollow', x: 13, y: 6, r: 3, hidden: true },
  { id: 'wardenLair', name: 'Warden Court', x: 73, y: 41, r: 3, hidden: true },
  { id: 'matriarchLair', name: 'Matriarch Web', x: 5, y: 3, r: 3, hidden: true },
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
  elderMo: [46, 42],           // refinement master, by the Gu district
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
  masterJian: [23, 24],        // hidden sword master by the river falls
  hermitSpring: [13, 25],      // hermit at the spirit spring
  drunkenFang: [56, 17],       // wandering fist master in the copper hills
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
  // Rare harvests — the essence hides from mundane senses; Spirit Moth's sense reveals them
  { id: 'rn1', x: 8, y: 41, type: 'moonSilver', name: 'Moon Silver Bloom', rare: true },
  { id: 'rn2', x: 73, y: 51, type: 'voidLotus', name: 'Void Lotus Pool', rare: true },
  // an early rare bloom on the forest edge north of the farmland — a new
  // cultivator's first taste of what a sensing Gu can find, and a short walk
  // from the Serpent's Stepping Stones ford it can reveal
  { id: 'rn3', x: 32, y: 27, type: 'moonSilver', name: 'Moon Silver Bloom', rare: true },
];
export const WORLD_RESOURCES = RESOURCES;

// Secret passages — river crossings walled off until a scouting Gu's
// perception reveals them. 'P' tiles stay impassable to enemies forever;
// for the player they open permanently once discovered.paths[id] is set.
export const HIDDEN_PATHS = [
  { id: 'stones', name: "Serpent's Stepping Stones", x: 26, y: 30, r: 3, cells: [[26, 30], [27, 30]] },
  { id: 'moonFord', name: 'Moonlit Ford', x: 26, y: 10, r: 3, cells: [[26, 10], [27, 10]] },
];

// Environmental hazards — each demands a specific Gu to bypass safely, and
// every unprotected step costs extra game minutes (movement efficiency).
// Rapids need Tide Binding's water-stilling; the miasma sears unprotected
// lungs but Mist Veil's shroud filters it; unstable terrain drags at every
// stride unless Stone Shell's earth grip anchors your footing.
export const HAZARDS = [
  { id: 'rapids', name: 'Raging Rapids', kind: 'rapids', bypassKind: 'waterwalk', cells: [[26, 50], [27, 50]] },
  { id: 'miasma', name: 'Poison Miasma', kind: 'miasma', bypassKind: 'stealth', rect: { x: 58, y: 49, w: 6, h: 3 } },
  { id: 'fenWest', name: 'Quaking Fen', kind: 'unstable', bypassKind: 'steady', rect: { x: 8, y: 36, w: 5, h: 3 } },
  { id: 'fenEast', name: 'Scree Slopes', kind: 'unstable', bypassKind: 'steady', rect: { x: 53, y: 44, w: 3, h: 2 } },
];
const HAZARD_CELL = new Map();
for (const h of HAZARDS) {
  if (h.cells) for (const [x, y] of h.cells) HAZARD_CELL.set(`${x},${y}`, h);
  else for (let j = 0; j < h.rect.h; j++) for (let i = 0; i < h.rect.w; i++) HAZARD_CELL.set(`${h.rect.x + i},${h.rect.y + j}`, h);
}
export function hazardAt(x, y) { return HAZARD_CELL.get(`${x},${y}`) || null; }

// Visible world enemies — behaviour drives detection radius and aggression.
// detect: optional per-spawn override of the behaviour default.
//
// PACKS & HERDS (#1–#6): social species spawn as groups in loose formations
// (never stacked). `cells` lists the anchor first, then members with spacing;
// `leader` (optional) heads the pack from the FIRST cell and its packmates
// share packId / packLeaderId. Group sizes differ per species — wolves 3–4,
// boars 2–3, spider nests 2–3, bandit patrols 4 + chief, hound trios; large
// solitary predators (stone beasts, serpents, mutated beasts) walk alone.
const SPAWN_CELLS = [
  // wolf packs — forest outskirts
  { packId: 'pk_wolves_out_a', member: 'wildWolf', behavior: 'aggressive', cells: [[28, 16], [29, 16], [28, 17]] },
  { packId: 'pk_wolves_out_b', member: 'wildWolf', behavior: 'aggressive', cells: [[36, 22], [37, 22], [35, 23], [36, 23]] },
  { packId: 'pk_wolves_out_c', member: 'wildWolf', behavior: 'aggressive', cells: [[48, 18], [49, 18], [48, 17]] },
  // the Ironfang pack — the alpha and its wolves, deep in the north
  { packId: 'pk_ironfang', member: 'wildWolf', behavior: 'predator', leader: 'ironfangAlpha', cells: [[7, 6], [8, 6], [6, 7], [7, 7]] },
  // southern wilds wolf packs
  { packId: 'pk_wolves_s_a', member: 'wildWolf', behavior: 'aggressive', cells: [[10, 42], [11, 42], [10, 43]] },
  { packId: 'pk_wolves_s_b', member: 'wildWolf', behavior: 'aggressive', cells: [[22, 48], [23, 48], [21, 49]] },
  // copper hills wolf pack
  { packId: 'pk_wolves_east', member: 'wildWolf', behavior: 'aggressive', cells: [[58, 21], [59, 21], [58, 20]] },
  // boar herds — farmland and eastern plains
  { packId: 'pk_boars_a', member: 'wildBoar', behavior: 'passive', cells: [[34, 31], [35, 31], [34, 32]] },
  { packId: 'pk_boars_b', member: 'wildBoar', behavior: 'passive', cells: [[49, 34], [49, 35]] },
  { packId: 'pk_boars_c', member: 'wildBoar', behavior: 'passive', cells: [[66, 30], [67, 30]] },
  { packId: 'pk_boars_d', member: 'wildBoar', behavior: 'passive', cells: [[74, 26], [75, 26]] },
  // blood crow flocks
  { packId: 'pk_crows_a', member: 'bloodCrow', behavior: 'aggressive', cells: [[33, 14], [34, 14]] },
  { packId: 'pk_crows_b', member: 'bloodCrow', behavior: 'aggressive', cells: [[58, 16], [59, 16], [57, 15]] },
  // spider nests — wild forest and marsh
  { packId: 'pk_spiders_a', member: 'poisonSpider', behavior: 'territorial', cells: [[8, 18], [9, 18], [8, 19]] },
  { packId: 'pk_spiders_b', member: 'poisonSpider', behavior: 'territorial', cells: [[17, 28], [18, 28]] },
  { packId: 'pk_spiders_marsh', member: 'poisonSpider', behavior: 'territorial', cells: [[58, 52], [59, 52], [58, 53]] },
  { packId: 'pk_spiders_r', member: 'poisonSpider', behavior: 'territorial', cells: [[76, 52], [77, 52]] },
  // shadow hound trios — deep forest
  { packId: 'pk_hounds_a', member: 'shadowHound', behavior: 'predator', cells: [[16, 6], [17, 6], [15, 7]] },
  { packId: 'pk_hounds_b', member: 'shadowHound', behavior: 'predator', cells: [[8, 5], [9, 4], [7, 6]] },
  // the bandit patrol — the chief and his men hold the camp
  { packId: 'pk_bandits', member: 'bandit', behavior: 'guard', leader: 'banditChief', cells: [[65, 16], [62, 17], [68, 19], [64, 21], [67, 20]] },
  // solitary creatures — large predators need no pack
  { packId: null, member: 'stoneBeast', behavior: 'territorial', cells: [[44, 24]] },
  { packId: null, member: 'stoneBeast', behavior: 'territorial', cells: [[6, 24]] },
  { packId: null, member: 'stoneBeast', behavior: 'territorial', cells: [[8, 44]] },
  { packId: null, member: 'forestSerpent', behavior: 'predator', cells: [[12, 32]] },
  { packId: null, member: 'forestSerpent', behavior: 'predator', cells: [[20, 16]] },
  { packId: null, member: 'forestSerpent', behavior: 'predator', cells: [[16, 52]] },
  { packId: null, member: 'forestSerpent', behavior: 'predator', cells: [[68, 54]] },
  { packId: null, member: 'shadowHound', behavior: 'predator', cells: [[20, 9]] },
  { packId: null, member: 'shadowHound', behavior: 'predator', cells: [[72, 44]] },
  { packId: null, member: 'mutatedBeast', behavior: 'territorial', cells: [[14, 3]] },
  { packId: null, member: 'mutatedBeast', behavior: 'territorial', cells: [[78, 39]] },
  { packId: null, member: 'ancientGuardian', behavior: 'guard', cells: [[70, 40]] },
  { packId: null, member: 'ancientGuardian', behavior: 'guard', cells: [[75, 45]] },
  { packId: null, member: 'bandit', behavior: 'aggressive', cells: [[70, 33]] },
];

// Elite bosses — ancient horrors rooted in the most dangerous corners of the
// region. Each holds a lair, resists common Paths, and is slow to return.
export const BOSS_SPAWNS = [
  { defId: 'mistDevourer', x: 13, y: 6, behavior: 'guard', detect: 6 },
  { defId: 'ruinWarden', x: 73, y: 41, behavior: 'guard', detect: 6 },
  { defId: 'dreadMatriarch', x: 5, y: 3, behavior: 'guard', detect: 6 },
];
export const INITIAL_ENEMIES = [
  ...SPAWN_CELLS.flatMap(s => s.cells.map(([x, y], idx) => ({
    defId: s.leader && idx === 0 ? s.leader : s.member,
    x, y, behavior: s.behavior, detect: s.detect,
  }))),
  ...BOSS_SPAWNS,
];

export function initialEnemies() {
  const out = [];
  let i = 0;
  const push = (defId, x, y, behavior, detect, packId, packRole, packLeaderId) => out.push({
    id: `w${i++}`, defId, x, y, home: { x, y }, behavior, detect,
    packId, packRole, packLeaderId,
    hp: ENEMY_BY_ID[defId].hp,
    state: 'idle', alertTicks: 0, dead: false, respawnAt: 0,
  });
  for (const s of SPAWN_CELLS) {
    const leaderId = s.leader ? `w${i}` : null;
    s.cells.forEach(([x, y], idx) => {
      const isLeader = !!s.leader && idx === 0;
      const defId = isLeader ? s.leader : s.member;
      push(defId, x, y, s.behavior, s.detect, s.packId || null,
        s.packId ? (isLeader ? 'leader' : 'member') : null,
        s.leader && !isLeader ? leaderId : null);
    });
  }
  for (const b of BOSS_SPAWNS) push(b.defId, b.x, b.y, b.behavior, b.detect, null, null, null);
  return out;
}

// Territory ecology — which species hold each zone. Logged on first entry
// (knowledge is itself a reward) and grounds future spawns in habitats.
export const ZONE_FAUNA = {
  wildForest: ['wildWolf', 'poisonSpider', 'forestSerpent'],
  deepForest: ['shadowHound', 'ironfangAlpha', 'mutatedBeast'],
  forestOutskirts: ['wildWolf', 'wildBoar', 'bloodCrow'],
  southernWilds: ['wildWolf', 'forestSerpent', 'stoneBeast'],
  farmland: ['wildBoar'],
  eastHills: ['bloodCrow', 'wildBoar', 'bandit'],
  eastPlains: ['wildBoar', 'bandit'],
  marsh: ['forestSerpent', 'poisonSpider'],
  ruins: ['poisonSpider', 'ancientGuardian', 'shadowHound'],
  banditCamp: ['bandit', 'banditChief'],
  ironfangTerritory: ['ironfangAlpha', 'shadowHound'],
};

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
  WILD_GU_SPAWNS.forEach(w => protect(w.x, w.y));
  // secret-passage mouths and hazard approaches stay clear of scatter
  HIDDEN_PATHS.forEach(hp => hp.cells.forEach(([x, y]) => protect(x, y)));
  HAZARDS.forEach(hz => {
    if (hz.cells) hz.cells.forEach(([x, y]) => protect(x, y));
    else for (let j = 0; j < hz.rect.h; j++) for (let i = 0; i < hz.rect.w; i++) protect(hz.rect.x + i, hz.rect.y + j);
  });
  // never scatter trees over hidden masters' spots
  Object.values(NPC_POSITIONS).forEach(([x, y]) => protect(x, y));
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
  // secret passages — blocked ('P') until a scouting Gu reveals them
  HIDDEN_PATHS.forEach(hp => hp.cells.forEach(([x, y]) => set(x, y, 'P')));
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

const BLOCKED = new Set(['T', '~', '#', 'W', 'R', 's', 'P']);
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