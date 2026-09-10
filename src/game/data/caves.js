// Enterable caves — separate local exploration areas, entered through ordinary
// cave mouths on the surface (no portals). Each cave map is SEMI-handCRAFTED:
// chambers, tunnels, water, decor, contents and enemy dens are carved by a
// seeded generator, so every cave is always the same cave for every player,
// readable and hand-tuned via its level definitions below. Cave types differ in
// vision, decor, fauna and treasure — never identical (see CAVES).
//
// Cave tile legend: '#' wall · '.' floor · '~' underground water · 'E' exit to
// the surface · '<' ascend a level · '>' descend a level · '*' cultivation
// chamber · 'K' cracked secret wall (opens when scouted) · 'C' crystal ·
// 'M' mushrooms · 'B' bones · 't' torch · 'O' broken column.
// Enemies/resources/chests of a cave live in the shared worldState (caveId +
// depth mark their location), so deaths, kills, respawns and opened caches all
// persist exactly like surface events.
import { ENEMY_BY_ID } from './enemies';

// Default node display names by gathered type (English source of truth; vi
// overrides live in i18n keys res.<id>.name).
const RES_NAME = {
  herb: 'Spirit Herb', moonPetal: 'Moon Petal', ore: 'Jade Ore', ironOre: 'Iron Ore',
  windCrystal: 'Wind Crystal', fireEssence: 'Fire Essence', mistSilk: 'Mist Silk',
  shadowSilk: 'Shadow Silk', beastMeat: 'Beast Meat', beastBlood: 'Beast Blood',
  venomSac: 'Venom Sac', spiritGrass: 'Spirit Grass', moonSilver: 'Moon Silver',
  voidLotus: 'Void Lotus',
};

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

// ---- the caves of the Green Valley Region (8 entrances, 9 maps) ----
// c_moon has two depths (the only multi-level cave); its stair '>' on depth 0
// leads to the deep chamber — bosses and secret vaults sit at the far ends.
export const CAVES = [
  {
    id: 'c_dusk', type: 'smallNatural', name: 'Duskgloom Hollow', x: 31, y: 22, danger: 2, seed: 11,
    levels: [{
      w: 20, h: 14, rooms: 3, water: 1,
      decor: { mushroom: 4, bones: 1, crystal: 1 },
      spawns: [{ def: 'caveBat', n: 2, behavior: 'territorial' }],
      res: [{ type: 'herb', n: 2, name: 'Cave Herb' }, { type: 'moonPetal', n: 1, name: 'Pale Cave Bloom' }],
      chests: [{ id: 'cache', loot: { items: { beastCore: 2, herb: 2 }, spiritStones: 20, insight: 6 } }],
    }],
  },
  {
    id: 'c_moon', type: 'deep', name: 'Moonstone Deep', x: 54, y: 14, danger: 4, seed: 23,
    levels: [
      {
        w: 26, h: 18, rooms: 4, water: 1, stairsDown: true,
        decor: { crystal: 4, mushroom: 3 },
        spawns: [
          { def: 'caveBat', n: 2, behavior: 'territorial' },
          { def: 'crystalSpider', n: 2, behavior: 'territorial', packId: 'pk_moon0' },
        ],
        res: [{ type: 'windCrystal', n: 2, name: 'Moonstone Cluster' }],
        chests: [{ id: 'cache', loot: { items: { windCrystal: 1, herb: 2 }, spiritStones: 30, insight: 8 } }],
      },
      {
        w: 24, h: 16, rooms: 3, water: 2, secret: true,
        secretChest: { loot: { items: { moonSilver: 1, fireEssence: 1 }, spiritStones: 60, insight: 15 } },
        decor: { crystal: 6, bones: 2 },
        spawns: [
          { def: 'crystalSpider', n: 2, behavior: 'territorial', packId: 'pk_moon1' },
          { def: 'paleSerpent', n: 1, behavior: 'predator' },
          { def: 'tunnelLurker', n: 1, behavior: 'guard' },
        ],
        res: [{ type: 'fireEssence', n: 1, name: 'Deepfire Vein' }, { type: 'ironOre', n: 2, name: 'Deep Iron Vein' }],
        chests: [{ id: 'cache', loot: { items: { beastCore: 2, moonPetal: 2 }, spiritStones: 40, insight: 10 } }],
      },
    ],
  },
  {
    id: 'c_mine', type: 'mining', name: 'Old Kingsmine', x: 9, y: 48, danger: 3, seed: 37,
    levels: [{
      w: 24, h: 16, rooms: 4, water: 1,
      decor: { torch: 4, bones: 2, column: 2 },
      spawns: [
        { def: 'bandit', n: 2, behavior: 'guard', packId: 'pk_mine' },
        { def: 'caveBat', n: 1, behavior: 'territorial' },
      ],
      res: [{ type: 'ore', n: 2, name: 'Kingsmine Jade Vein' }, { type: 'ironOre', n: 2, name: 'Iron Vein' }],
      chests: [{ id: 'cache', loot: { items: { stolenGoods: 1, beastCore: 1 }, spiritStones: 45, insight: 8 } }],
    }],
  },
  {
    id: 'c_den', type: 'beastDen', name: 'Ironfang Den', x: 9, y: 4, danger: 4, seed: 41,
    levels: [{
      w: 22, h: 15, rooms: 3,
      decor: { bones: 5 },
      spawns: [
        { def: 'ironfangAlpha', n: 1, behavior: 'guard', packId: 'pk_den', role: 'leader' },
        { def: 'wildWolf', n: 2, behavior: 'predator', packId: 'pk_den' },
        { def: 'ironfangCub', n: 2, behavior: 'passive', packId: 'pk_den' },
      ],
      res: [{ type: 'beastMeat', n: 2, name: 'Fresh Kill' }, { type: 'beastBlood', n: 1, name: 'Bloodied Cache' }],
      chests: [{ id: 'cache', loot: { items: { beastBlood: 2, beastCore: 2, windCrystal: 1 }, spiritStones: 35, insight: 10 } }],
    }],
  },
  {
    id: 'c_nest', type: 'guNest', name: 'Silkspinner Nest', x: 64, y: 53, danger: 4, seed: 53,
    levels: [{
      w: 24, h: 16, rooms: 4, water: 1, secret: true,
      secretChest: { loot: { items: { mistSilk: 2, serpentGland: 1 }, spiritStones: 55, insight: 14 } },
      decor: { bones: 3, mushroom: 2 },
      spawns: [
        { def: 'webBroodmother', n: 1, behavior: 'guard', packId: 'pk_nest', role: 'leader' },
        { def: 'crystalSpider', n: 3, behavior: 'territorial', packId: 'pk_nest' },
      ],
      res: [{ type: 'mistSilk', n: 2, name: 'Silkspinner Webbing' }, { type: 'venomSac', n: 1, name: 'Dripping Venom Sac' }],
      chests: [{ id: 'cache', loot: { items: { shadowSilk: 2, herb: 2 }, spiritStones: 30, insight: 8 } }],
    }],
  },
  {
    id: 'c_ruin', type: 'ancientRuin', name: 'Vault of the Silent Court', x: 70, y: 44, danger: 5, seed: 67,
    levels: [{
      w: 26, h: 17, rooms: 4, secret: true,
      secretChest: { loot: { items: { voidLotus: 1, moonSilver: 1 }, spiritStones: 90, insight: 22 } },
      decor: { torch: 3, column: 4, bones: 2 },
      spawns: [
        { def: 'ancientGuardian', n: 2, behavior: 'guard' },
        { def: 'paleSerpent', n: 1, behavior: 'predator' },
      ],
      res: [{ type: 'ironOre', n: 1, name: 'Ruin Iron' }, { type: 'fireEssence', n: 1, name: 'Vault Ember' }],
      chests: [{ id: 'cache', loot: { items: { fireEssence: 2, ironOre: 1 }, spiritStones: 40, insight: 10 } }],
    }],
  },
  {
    id: 'c_grotto', type: 'cultivationChamber', name: 'Stillwater Grotto', x: 18, y: 26, danger: 1, seed: 71,
    levels: [{
      w: 18, h: 13, rooms: 2, water: 2, chamber: true,
      decor: { crystal: 2, mushroom: 3 },
      spawns: [],
      res: [{ type: 'moonPetal', n: 1, name: 'Grotto Moon Petal' }, { type: 'herb', n: 1, name: 'Stillwater Herb' }],
      chests: [{ id: 'cache', loot: { items: { spiritGrass: 2, moonPetal: 1 }, spiritStones: 25, insight: 6 } }],
    }],
  },
  {
    id: 'c_tomb', type: 'inheritance', name: 'Tomb of the First Ascendant', x: 5, y: 9, danger: 5, seed: 89,
    levels: [{
      w: 26, h: 17, rooms: 4, water: 1, secret: true,
      secretChest: { loot: { items: { moonSilver: 2, voidLotus: 1 }, spiritStones: 120, insight: 30 } },
      decor: { bones: 4, column: 3, torch: 2 },
      spawns: [
        { def: 'tunnelLurker', n: 1, behavior: 'guard' },
        { def: 'paleSerpent', n: 2, behavior: 'predator' },
      ],
      res: [{ type: 'ironOre', n: 1, name: 'Tomb Iron' }, { type: 'moonPetal', n: 1, name: 'Grave Bloom' }],
      chests: [{ id: 'cache', loot: { items: { beastCore: 2, moonPetal: 1 }, spiritStones: 50, insight: 12 } }],
    }],
  },
];

export const CAVE_BY_ID = Object.fromEntries(CAVES.map(c => [c.id, c]));

// Cave mouths as map landmarks — hidden until the player comes near; discovery
// (proximity) already grants insight + a toast through the landmark system.
export const CAVE_LANDMARKS = CAVES.map(c => ({ id: `cave_${c.id}`, name: c.name, x: c.x, y: c.y, r: 3, hidden: true, caveId: c.id }));

export function caveEntranceAt(x, y) {
  return CAVES.find(c => Math.abs(c.x - x) <= 1 && Math.abs(c.y - y) <= 1) || null;
}

// ---------------------------------------------------------------- generator
function buildLevel(cave, depth) {
  const lv = cave.levels[depth];
  const w = lv.w, h = lv.h;
  const rng = mulberry32(cave.seed * 7919 + depth * 104729 + 11);
  const g = Array.from({ length: h }, () => Array(w).fill('#'));
  const set = (x, y, c) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 1) g[y][x] = c; };
  const carveRect = (x, y, rw, rh) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) set(x + i, y + j, '.'); };

  // entry room at the bottom edge — the mouth of the cave
  const entry = { x: Math.floor(w / 2), y: h - 2 };
  carveRect(entry.x - 2, entry.y - 2, 5, 3);
  g[entry.y][entry.x] = depth > 0 ? '<' : 'E';

  // chambers, chain-linked by winding tunnels (plus an occasional loop)
  const rooms = [];
  for (let i = 0; i < lv.rooms; i++) {
    for (let t = 0; t < 60; t++) {
      const rw = 4 + ((rng() * 4) | 0), rh = 3 + ((rng() * 3) | 0);
      const rx = 1 + ((rng() * (w - rw - 2)) | 0), ry = 1 + ((rng() * (h - rh - 3)) | 0);
      if (Math.abs((rx + rw / 2) - entry.x) < rw / 2 + 3 && ry + rh > entry.y - 4) continue; // keep the mouth clear
      if (rooms.some(r => rx < r.x + r.w + 2 && rx + rw + 2 > r.x && ry < r.y + r.h + 2 && ry + rh + 2 > r.y)) continue;
      rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: rx + (rw >> 1), cy: ry + (rh >> 1) });
      break;
    }
  }
  for (const r of rooms) carveRect(r.x, r.y, r.w, r.h);
  const hLine = (x1, x2, y) => { for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) if (g[y][x] !== 'E' && g[y][x] !== '<') set(x, y, '.'); };
  const vLine = (y1, y2, x) => { for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) if (g[y][x] !== 'E' && g[y][x] !== '<') set(x, y, '.'); };
  let prev = { x: entry.x, y: entry.y - 1 };
  const link = (a, b) => {
    if (rng() < 0.5) { hLine(a.x, b.x, a.y); vLine(a.y, b.y, b.x); }
    else { vLine(a.y, b.y, a.x); hLine(a.x, b.x, b.y); }
  };
  for (const r of rooms) { link(prev, r); prev = r; }
  if (rooms.length > 2 && rng() < 0.5) link(rooms[0], rooms[rooms.length - 1]);

  // underground water pools
  for (let i = 0; i < (lv.water || 0); i++) {
    const r = rooms[(rng() * rooms.length) | 0];
    if (!r) break;
    const px = r.x + 1 + ((rng() * Math.max(1, r.w - 3)) | 0), py = r.y + 1 + ((rng() * Math.max(1, r.h - 2)) | 0);
    set(px, py, '~'); set(px + 1, py, '~'); if (rng() < 0.7) set(px, py + 1, '~');
  }

  // decor sprinkled over open floor
  const floors = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (g[y][x] === '.') floors.push({ x, y });
  const used = [];
  const take = (f) => used.push(f);
  const free = (f) => !used.some(u => u.x === f.x && u.y === f.y);
  const decorChars = { crystal: 'C', mushroom: 'M', bones: 'B', torch: 't', column: 'O' };
  for (const [k, ch] of Object.entries(decorChars)) {
    for (let i = 0; i < ((lv.decor || {})[k] || 0); i++) {
      for (let t = 0; t < 20; t++) {
        const f = floors[(rng() * floors.length) | 0];
        if (Math.abs(f.x - entry.x) + Math.abs(f.y - entry.y) < 3) continue;
        if (!free(f)) continue;
        set(f.x, f.y, ch); take(f);
        break;
      }
    }
  }

  // cultivation chamber — a still, resonant stone circle at the far end
  if (lv.chamber && rooms.length) {
    const r = rooms[rooms.length - 1];
    g[r.cy][r.cx] = '*';
  }

  // stair down to the next depth, at the deepest chamber
  let stair = null;
  if (lv.stairsDown && rooms.length) {
    const r = rooms[rooms.length - 1];
    stair = { x: r.cx, y: r.cy };
    g[stair.y][stair.x] = '>';
  }

  // secret chamber — a cracked wall ('K') hides a dug room off the last chamber
  let secret = null;
  if (lv.secret && rooms.length) {
    const r = rooms[rooms.length - 1];
    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].sort(() => rng() - 0.5);
    for (const d of dirs) {
      const sx = d.x !== 0 ? (d.x > 0 ? r.x + r.w : r.x - 1) : r.cx;
      const sy = d.y !== 0 ? (d.y > 0 ? r.y + r.h : r.y - 1) : r.cy;
      const c2x = sx + d.x, c2y = sy + d.y;
      const rcx = sx + d.x * 3, rcy = sy + d.y * 3;
      if (rcx - 1 <= 0 || rcx + 1 >= w - 1 || rcy - 1 <= 0 || rcy + 1 >= h - 1) continue;
      let clear = g[sy]?.[sx] === '#';
      if (clear && g[c2y]?.[c2x] !== '#') clear = false;
      if (clear) {
        for (let j = -1; j <= 1 && clear; j++) for (let i = -1; i <= 1; i++) {
          if (g[rcy + j]?.[rcx + i] !== '#') { clear = false; break; }
        }
      }
      if (!clear) continue;
      g[sy][sx] = 'K';
      set(c2x, c2y, '.');
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) set(rcx + i, rcy + j, '.');
      secret = { id: `${cave.id}_d${depth}_s`, caveId: cave.id, depth, x: sx, y: sy, room: { x: rcx, y: rcy } };
      break;
    }
  }

  // ---- deterministic contents on open floor (away from the mouth) ----
  const open = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (g[y][x] === '.') open.push({ x, y });
  const picked = [];
  const pick = (entryDist, spread) => {
    for (let t = 0; t < 60; t++) {
      const f = open[(rng() * open.length) | 0];
      if (Math.abs(f.x - entry.x) + Math.abs(f.y - entry.y) < entryDist) continue;
      if (picked.some(u => cheb(u, f) < spread)) continue;
      picked.push(f);
      return f;
    }
    const f = open.find(o => !picked.some(u => u.x === o.x && u.y === o.y)) || open[0];
    picked.push(f);
    return f;
  };

  const res = [];
  for (const spec of lv.res || []) {
    for (let i = 0; i < (spec.n || 1); i++) {
      const f = pick(3, 2);
      res.push({
        id: `${cave.id}_d${depth}_r${res.length}`, caveId: cave.id, depth,
        x: f.x, y: f.y, type: spec.type, name: spec.name || RES_NAME[spec.type] || spec.type,
      });
    }
  }
  const chests = [];
  for (const c of lv.chests || []) {
    const f = pick(5, 2);
    chests.push({ ...c, id: `${cave.id}_d${depth}_${c.id}`, caveId: cave.id, depth, x: f.x, y: f.y });
  }
  if (secret && lv.secretChest) {
    chests.push({ ...lv.secretChest, id: `${cave.id}_d${depth}_secret`, caveId: cave.id, depth, x: secret.room.x, y: secret.room.y });
  }
  const spots = [];
  for (const sp of lv.spawns || []) {
    for (let i = 0; i < sp.n; i++) {
      const f = pick(4, 2);
      spots.push({ def: sp.def, x: f.x, y: f.y, behavior: sp.behavior, packId: sp.packId || null, role: sp.role || null });
    }
  }

  return { w, h, tiles: g, entry, stair, secret, spots, res, chests };
}

const LEVEL_CACHE = new Map();
export function levelMapOf(caveId, depth) {
  const key = `${caveId}:${depth}`;
  if (!LEVEL_CACHE.has(key)) LEVEL_CACHE.set(key, buildLevel(CAVE_BY_ID[caveId], depth));
  return LEVEL_CACHE.get(key);
}

// ---- flattened registries (renderers, gathering and the reducer read these) ----
export const CAVE_RESOURCES = CAVES.flatMap(c => c.levels.flatMap((_, d) => levelMapOf(c.id, d).res));
export const CAVE_CHESTS = CAVES.flatMap(c => c.levels.flatMap((_, d) => levelMapOf(c.id, d).chests));
export const CAVE_SECRETS = CAVES.flatMap(c => c.levels.flatMap((_, d) => levelMapOf(c.id, d).secret ? [levelMapOf(c.id, d).secret] : []));
export const caveSecretAt = (caveId, depth, x, y) =>
  CAVE_SECRETS.find(s => s.caveId === caveId && s.depth === depth && s.x === x && s.y === y) || null;

// Cave enemies join the shared world roster (initialEnemies + these) — the
// tick/render loops only ever process the location the player is in (#34).
export function initialCaveEnemies() {
  let n = 0;
  const out = [];
  for (const cave of CAVES) {
    cave.levels.forEach((_, depth) => {
      const map = levelMapOf(cave.id, depth);
      const recs = map.spots.map(sp => ({
        id: `cv${n++}`, defId: sp.def, x: sp.x, y: sp.y, home: { x: sp.x, y: sp.y },
        behavior: sp.behavior, caveId: cave.id, depth,
        hp: ENEMY_BY_ID[sp.def].hp,
        state: 'idle', alertTicks: 0, dead: false, respawnAt: 0,
        packId: sp.packId, packRole: sp.role, packLeaderId: null,
      }));
      const leader = recs.find(r => r.packRole === 'leader');
      if (leader) for (const r of recs) if (r.packId === leader.packId && r !== leader) r.packLeaderId = leader.id;
      out.push(...recs);
    });
  }
  return out;
}