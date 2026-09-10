import { ENEMY_BY_ID } from './enemies';

const W = 18, H = 12;
function blank() { return Array.from({ length: H }, () => Array.from({ length: W }, () => '.')); }
function border(m) {
  for (let x = 0; x < W; x++) { m[0][x] = 'T'; m[H - 1][x] = 'T'; }
  for (let y = 0; y < H; y++) { m[y][0] = 'T'; m[y][W - 1] = 'T'; }
  return m;
}
function rect(m, x, y, w, h, ch) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (m[y + j] && m[y + j][x + i]) m[y + j][x + i] = ch; }
function scatter(m, coords, ch) { coords.forEach(([x, y]) => { if (m[y] && m[y][x]) m[y][x] = ch; }); }
function gap(m, x, y) { m[y][x] = '.'; }

// Green Valley (town)
function greenValley() {
  const m = border(blank());
  rect(m, 3, 2, 4, 2, '#');
  rect(m, 11, 2, 4, 2, '#');
  rect(m, 3, 8, 4, 2, '#');
  rect(m, 11, 8, 4, 2, '#');
  scatter(m, [[6, 5], [12, 6], [7, 9], [13, 10]], 'T');
  gap(m, 8, 11); gap(m, 17, 6); gap(m, 0, 6);
  return m;
}
// Mist Forest
function mistForest() {
  const m = border(blank());
  scatter(m, [[3,2],[5,3],[8,2],[12,3],[14,2],[4,5],[10,5],[14,6],[3,7],[7,8],[11,7],[15,9],[5,9],[13,10]], 'T');
  rect(m, 2, 9, 2, 1, '~'); rect(m, 13, 4, 3, 1, '~');
  gap(m, 8, 0); gap(m, 8, 11);
  return m;
}
// Ancient Ruins
function ancientRuins() {
  const m = border(blank());
  rect(m, 3, 2, 3, 3, '#'); rect(m, 12, 2, 3, 3, '#'); rect(m, 7, 7, 4, 2, '#');
  scatter(m, [[2,6],[15,6],[2,9],[15,9],[9,5],[8,10]], 'R');
  rect(m, 8, 9, 2, 1, '*');
  gap(m, 8, 0);
  return m;
}
// Black Market
function blackMarket() {
  const m = border(blank());
  rect(m, 4, 3, 4, 3, '#'); rect(m, 10, 3, 4, 3, '#');
  scatter(m, [[2,8],[15,8],[9,9]], 'R');
  gap(m, 0, 6);
  return m;
}
// Cultivation Sect
function cultivationSect() {
  const m = border(blank());
  rect(m, 6, 2, 6, 3, '#');
  rect(m, 8, 6, 2, 1, '*');
  scatter(m, [[3,8],[14,8],[4,10],[13,10]], 'T');
  gap(m, 17, 6);
  return m;
}

export const AREAS = [
  {
    id: 'greenValley', name: 'Green Valley', type: 'town',
    description: 'A quiet village at the edge of the mist. Safe — for now.',
    tiles: greenValley(), bgColor: '#16261c',
    npcs: [{ id: 'merchant', x: 5, y: 4 }, { id: 'herbalist', x: 13, y: 4 }, { id: 'guMaster', x: 5, y: 10 }],
    resources: [{ x: 7, y: 6, type: 'herb', name: 'Spirit Herb', emoji: '🌿' }],
    exits: [
      { x: 8, y: 11, toArea: 'mistForest', toX: 8, toY: 1, label: 'Mist Forest' },
      { x: 17, y: 6, toArea: 'blackMarket', toX: 1, toY: 6, label: 'Black Market' },
      { x: 0, y: 6, toArea: 'cultivationSect', toX: 16, toY: 6, label: 'Cultivation Sect' },
    ],
    encounterZones: [{ x1: 6, y1: 5, x2: 12, y2: 10 }],
    encounterTable: [{ enemyId: 'wildWolf', weight: 70 }, { enemyId: 'bandit', weight: 30 }],
    encounterRate: 8,
  },
  {
    id: 'mistForest', name: 'Mist Forest', type: 'forest',
    description: 'Twisted trees and drifting mist. Stronger beasts dwell here.',
    tiles: mistForest(), bgColor: '#13201a',
    npcs: [],
    resources: [
      { x: 3, y: 3, type: 'herb', name: 'Spirit Herb', emoji: '🌿' },
      { x: 12, y: 5, type: 'spiritGrass', name: 'Spirit Grass', emoji: '🌾' },
      { x: 14, y: 8, type: 'ore', name: 'Jade Ore', emoji: '🪨' },
      { x: 5, y: 8, type: 'moonPetal', name: 'Moon Petal', emoji: '🌸' },
      { x: 10, y: 9, type: 'herb', name: 'Spirit Herb', emoji: '🌿' },
    ],
    exits: [
      { x: 8, y: 11, toArea: 'greenValley', toX: 8, toY: 10, label: 'Green Valley' },
      { x: 8, y: 0, toArea: 'ancientRuins', toX: 8, toY: 10, label: 'Ancient Ruins' },
    ],
    encounterZones: [{ x1: 1, y1: 1, x2: 16, y2: 10 }],
    encounterTable: [{ enemyId: 'wildWolf', weight: 25 }, { enemyId: 'poisonSpider', weight: 25 }, { enemyId: 'stoneBeast', weight: 20 }, { enemyId: 'forestSerpent', weight: 20 }, { enemyId: 'bloodCrow', weight: 10 }],
    encounterRate: 16,
  },
  {
    id: 'ancientRuins', name: 'Ancient Ruins', type: 'dungeon',
    description: 'Broken halls of a fallen sect. Riches — and death — sleep here.',
    tiles: ancientRuins(), bgColor: '#1a1714',
    npcs: [],
    resources: [
      { x: 4, y: 6, type: 'ironOre', name: 'Iron Ore', emoji: '⛏️' },
      { x: 14, y: 6, type: 'fireEssence', name: 'Fire Essence', emoji: '🔥' },
      { x: 3, y: 9, type: 'shadowSilk', name: 'Shadow Silk', emoji: '🕸️' },
      { x: 14, y: 9, type: 'ironOre', name: 'Iron Ore', emoji: '⛏️' },
    ],
    exits: [{ x: 8, y: 0, toArea: 'mistForest', toX: 8, toY: 1, label: 'Mist Forest' }],
    encounterZones: [{ x1: 1, y1: 1, x2: 16, y2: 10 }],
    encounterTable: [{ enemyId: 'shadowHound', weight: 35 }, { enemyId: 'ancientGuardian', weight: 25 }, { enemyId: 'mutatedBeast', weight: 25 }, { enemyId: 'stoneBeast', weight: 15 }],
    encounterRate: 22,
  },
  {
    id: 'blackMarket', name: 'Black Market', type: 'market',
    description: 'A shadowy bazaar where anything has a price. Watch your purse.',
    tiles: blackMarket(), bgColor: '#171520',
    npcs: [{ id: 'mysteriousTraveler', x: 6, y: 7 }, { id: 'blackMarketMerchant', x: 12, y: 7 }],
    resources: [],
    exits: [{ x: 0, y: 6, toArea: 'greenValley', toX: 16, toY: 6, label: 'Green Valley' }],
    encounterZones: [], encounterTable: [], encounterRate: 0,
  },
  {
    id: 'cultivationSect', name: 'Azure Cloud Sect', type: 'sect',
    description: 'A quiet sect courtyard. Cultivation flows swifter within its walls.',
    tiles: cultivationSect(), bgColor: '#15202b',
    npcs: [{ id: 'sectElder', x: 9, y: 6 }],
    resources: [],
    exits: [{ x: 17, y: 6, toArea: 'greenValley', toX: 1, toY: 6, label: 'Green Valley' }],
    encounterZones: [], encounterTable: [], encounterRate: 0,
  },
];

export const AREA_BY_ID = Object.fromEntries(AREAS.map(a => [a.id, a]));

const BLOCKED = new Set(['T', '~', '#', 'R', '^']);
export function isWalkable(area, x, y) {
  if (!area) return false;
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  return !BLOCKED.has(area.tiles[y][x]);
}

export function inEncounterZone(area, x, y) {
  return area.encounterZones.some(z => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2);
}

export function rollEncounter(area) {
  if (!area.encounterRate || area.encounterTable.length === 0) return null;
  if (Math.random() * 100 >= area.encounterRate) return null;
  const total = area.encounterTable.reduce((a, e) => a + e.weight, 0);
  let r = Math.random() * total;
  for (const e of area.encounterTable) { r -= e.weight; if (r <= 0) return e.enemyId; }
  return area.encounterTable[0].enemyId;
}