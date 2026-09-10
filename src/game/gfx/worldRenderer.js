// Canvas world renderer: draws the pixel-art world (tiles, decor, buildings,
// NPCs, beasts, player, lighting, particles) into a 16px-per-tile buffer,
// then blits it scaled to the viewport. All game logic stays in the reducer.
import { WORLD, zoneAt, DEFAULT_ZONE, WORLD_NPCS, WORLD_RESOURCES, CAMP_CELLS, TERRACE, FORMATION, BUILDING_AT, BUILDING_LABELS, HAZARDS } from '../data/world';
import { NPC_BY_ID } from '../data/npcs';
import { ENEMY_BY_ID, DANGER_LABEL, DANGER_COLOR, visualOf } from '../data/enemies';
import { MASTER_BY_ID } from '../data/masters';
import { BALANCE } from '../config/balance';
import { darknessOf, warmthOf } from '../engine/time';
import { buildTiles, buildTrees } from './tiles';
import { makeResourceIcon } from './sprites';
import { getBeastSheet } from './beastSprites';
import { getWildGuSheet } from './wildGuSprites';
import { SPECIES_BY_ID, wildGuActive } from '../data/wildGu';
import { getCharacterSheet, npcAppearance } from './characterSprites';
import { appearanceOf } from '../data/appearance';
import { hash2, makeCanvas, rect, px } from './pixel';

let TILES = null, TREES = null;
const npcSheets = new Map();
const beastSheets = new Map();
const resIcons = new Map();
let buf = null, g = null;

function ensure() {
  if (TILES) return;
  TILES = buildTiles();
  TREES = buildTrees();
}

function npcSheet(id) {
  if (!npcSheets.has(id)) npcSheets.set(id, getCharacterSheet(npcAppearance(id)));
  return npcSheets.get(id);
}

function beastSheet(defId) {
  if (!beastSheets.has(defId)) beastSheets.set(defId, getBeastSheet(defId));
  return beastSheets.get(defId);
}

// role props: a small marker of each trade, drawn beside the NPC
function drawRoleProp(sx, sy, role, t, glows) {
  if (!role) return;
  switch (role) {
    case 'food': rect(g, sx + 12, sy + 9, 3, 3, '#8a6a43'); rect(g, sx + 12, sy + 8, 3, 1, '#d9b45b'); px(g, sx + 13, sy + 8, '#f0e8d8'); break;
    case 'material': rect(g, sx + 11, sy + 9, 4, 4, '#6b4a2f'); rect(g, sx + 11, sy + 9, 4, 1, '#8d6a43'); px(g, sx + 12, sy + 11, '#7fd8e8'); break;
    case 'gu':
      rect(g, sx + 11, sy + 10, 4, 3, '#3a2f4a'); px(g, sx + 12, sy + 8, '#b088ff');
      glows.push({ x: sx + 13, y: sy + 9, r: 10, col: '176,136,255', a: 0.35 + 0.15 * Math.sin(t / 400) });
      break;
    case 'refiner':
      rect(g, sx + 11, sy + 7, 4, 6, '#5a5148'); rect(g, sx + 12, sy + 9, 2, 2, '#e07a2a');
      glows.push({ x: sx + 13, y: sy + 10, r: 12, col: '240,160,60', a: 0.4 + 0.1 * Math.sin(t / 300) });
      break;
    case 'quest': rect(g, sx + 11, sy + 6, 4, 6, '#4a3018'); rect(g, sx + 12, sy + 7, 2, 3, '#e8e4d8'); break;
    case 'inn': rect(g, sx + 11, sy + 10, 4, 1, '#8a6a43'); px(g, sx + 12, sy + 9, '#f0e8d8'); break;
    case 'arena': rect(g, sx + 11, sy + 7, 1, 6, '#4a3018'); rect(g, sx + 12, sy + 7, 3, 2, '#9f1239'); break;
    case 'general': rect(g, sx + 11, sy + 10, 4, 3, '#a8895a'); px(g, sx + 12, sy + 9, '#8a6a43'); break;
    case 'blackmarket': rect(g, sx + 11, sy + 9, 4, 4, '#2a2a32'); px(g, sx + 12, sy + 10, '#5a5a6a'); break;
    default: break;
  }
}

function roundRectPath(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function resIcon(type) {
  if (!resIcons.has(type)) resIcons.set(type, makeResourceIcon(type));
  return resIcons.get(type);
}

const inWorld = (x, y) => y >= 0 && y < WORLD.h && x >= 0 && x < WORLD.w;

function label(text, x, y, size = 5, color = '#e8e4d8') {
  g.font = `bold ${size}px monospace`;
  g.textAlign = 'center';
  g.fillStyle = '#000';
  g.fillText(text, x + 0.5, y + 0.5);
  g.fillStyle = color;
  g.fillText(text, x, y);
}

function shadow(x, y, w = 8) {
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x - w / 2, y, w, 2);
}

// ---------------------------------------------------------------- decorations
function drawDecor(x, y, sx, sy, ch, zoneDanger, t, glows) {
  const h = hash2(x, y, 5);
  const sway = Math.round(Math.sin(t / 620 + h * 9) * 0.6);
  if (ch === '.' || ch === ',') {
    if (h < 0.14) { // flower cluster
      const col = h < 0.05 ? '#e5c95c' : h < 0.09 ? '#d97a9a' : '#cfe4ff';
      g.fillStyle = col;
      g.fillRect(sx + 6 + sway, sy + 7, 1, 1); g.fillRect(sx + 8 + sway, sy + 9, 1, 1); g.fillRect(sx + 5, sy + 10, 1, 1);
      g.fillStyle = '#3f6b3a';
      g.fillRect(sx + 6 + sway, sy + 8, 1, 2); g.fillRect(sx + 8 + sway, sy + 10, 1, 1);
    } else if (h < 0.34) { // grass tuft
      g.fillStyle = ch === '.' ? '#5d8a4c' : '#44703c';
      g.fillRect(sx + 4 + sway, sy + 6, 1, 3); g.fillRect(sx + 7 + sway, sy + 5, 1, 4); g.fillRect(sx + 10 + sway, sy + 7, 1, 3);
    } else if (h < 0.37) { // bush
      g.fillStyle = '#2f5e3a'; g.fillRect(sx + 4, sy + 7, 8, 5);
      g.fillStyle = '#3f7a4c'; g.fillRect(sx + 5, sy + 7, 6, 2); g.fillRect(sx + 4, sy + 9, 2, 2);
      g.fillStyle = '#e5c95c'; g.fillRect(sx + 7, sy + 9, 1, 1); g.fillRect(sx + 10, sy + 10, 1, 1);
    } else if (h < 0.39) { // small rock
      g.fillStyle = '#6b6258'; g.fillRect(sx + 6, sy + 9, 4, 3);
      g.fillStyle = '#8a8074'; g.fillRect(sx + 6, sy + 9, 4, 1);
    } else if (zoneDanger >= 2 && h < 0.40) { // stump
      g.fillStyle = '#6b4a2f'; g.fillRect(sx + 5, sy + 8, 5, 4);
      g.fillStyle = '#8d6a43'; g.fillRect(sx + 5, sy + 8, 5, 2);
      g.fillStyle = '#54371f'; g.fillRect(sx + 6, sy + 9, 1, 1);
    } else if (zoneDanger >= 3 && h < 0.41) { // fallen log
      g.fillStyle = '#5a3f26'; g.fillRect(sx + 3, sy + 9, 10, 3);
      g.fillStyle = '#6b4a2f'; g.fillRect(sx + 3, sy + 9, 10, 1);
      g.fillStyle = '#8d6a43'; g.fillRect(sx + 3, sy + 10, 1, 1); g.fillRect(sx + 12, sy + 10, 1, 1);
    } else if (zoneDanger >= 3 && h < 0.415) { // ruin bricks
      g.fillStyle = '#7a7062'; g.fillRect(sx + 4, sy + 8, 3, 4); g.fillRect(sx + 9, sy + 10, 3, 2);
      g.fillStyle = '#5a5148'; g.fillRect(sx + 4, sy + 11, 3, 1);
    }
  }
  // settlement dressing on roads: lanterns, well, stalls, signs
  if (ch === 'r' && zoneDanger === 0) {
    if (h >= 0.14 && h < 0.19) { // lantern post
      g.fillStyle = '#4a3018'; g.fillRect(sx + 7, sy + 5, 2, 9);
      g.fillStyle = '#2a2018'; g.fillRect(sx + 6, sy + 3, 4, 3);
      const flick = 0.72 + 0.28 * Math.sin(t / 90 + h * 40);
      g.fillStyle = `rgba(252,211,77,${flick})`; g.fillRect(sx + 7, sy + 4, 2, 2);
      glows.push({ x: sx + 8, y: sy + 5, r: 22, col: '252,211,77', a: 0.5 * flick });
    } else if (h >= 0.19 && h < 0.21) { // well
      g.fillStyle = '#6b6258'; g.fillRect(sx + 4, sy + 8, 8, 5);
      g.fillStyle = '#8a8074'; g.fillRect(sx + 4, sy + 8, 8, 1);
      g.fillStyle = '#16324a'; g.fillRect(sx + 6, sy + 10, 4, 2);
      g.fillStyle = '#4a3018'; g.fillRect(sx + 5, sy + 3, 1, 5); g.fillRect(sx + 10, sy + 3, 1, 5);
      g.fillStyle = '#8a5a3a'; g.fillRect(sx + 4, sy + 3, 8, 1);
    } else if (h >= 0.21 && h < 0.235) { // market stall
      g.fillStyle = '#8a6a43'; g.fillRect(sx + 3, sy + 6, 10, 1);
      g.fillStyle = '#4a3018'; g.fillRect(sx + 3, sy + 6, 1, 8); g.fillRect(sx + 12, sy + 6, 1, 8);
      for (let i = 0; i < 5; i++) g.fillStyle = i % 2 ? '#c04a3a' : '#e8e4d8', g.fillRect(sx + 2 + i * 2, sy + 3, 2, 3);
      g.fillStyle = '#d9b45b'; g.fillRect(sx + 5, sy + 9, 2, 2); g.fillStyle = '#c04a3a'; g.fillRect(sx + 9, sy + 9, 2, 2);
    } else if (h >= 0.235 && h < 0.25) { // signpost
      g.fillStyle = '#4a3018'; g.fillRect(sx + 7, sy + 6, 1, 8);
      g.fillStyle = '#8a6a43'; g.fillRect(sx + 4, sy + 6, 7, 3);
      g.fillStyle = '#5a3f26'; g.fillRect(sx + 5, sy + 7, 5, 1);
    }
  }
}

// ---------------------------------------------------------------- buildings
function drawBuilding(x, y, sx, sy, b, dark, t, glows) {
  const wallTop = !BUILDING_AT.get(`${x},${y - 1}`);
  // plank wall texture in the building's color
  const base = b.color;
  g.fillStyle = base;
  g.fillRect(sx, sy, 16, 16);
  for (let yy = 3; yy < 16; yy += 4) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(sx, sy + yy, 16, 1); }
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(sx, sy, 16, 1);
  if (wallTop) {
    // roof band
    g.fillStyle = 'rgba(0,0,0,0.38)';
    g.fillRect(sx, sy, 16, 5);
    g.fillStyle = 'rgba(255,255,255,0.16)';
    g.fillRect(sx, sy, 16, 2);
    // chimney + smoke
    if (hash2(x, y, 9) < 0.4) {
      g.fillStyle = '#6b6258'; g.fillRect(sx + 10, sy - 1, 3, 3);
      const phase = (t / 500 + x) % 3;
      g.fillStyle = `rgba(200,200,200,${0.35 - phase * 0.09})`;
      g.fillRect(sx + 10 + Math.round(Math.sin(phase * 2 + x) * 1.5), sy - 2 - Math.round(phase * 2), 2, 2);
    }
  } else if (hash2(x, y, 13) < 0.26) {
    // window
    const lit = dark > 0.22;
    g.fillStyle = '#2a2018'; g.fillRect(sx + 5, sy + 4, 6, 7);
    g.fillStyle = lit ? '#f0c95a' : '#26313a';
    g.fillRect(sx + 6, sy + 5, 4, 5);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(sx + 7, sy + 5, 1, 5);
    if (lit) glows.push({ x: sx + 8, y: sy + 7, r: 16, col: '240,201,90', a: 0.45 });
  }
  // door at street side
  const below = inWorld(x, y + 1) ? WORLD.tiles[y + 1][x] : '.';
  if (below === 'r' || below === 'c') {
    g.fillStyle = '#3a2413'; g.fillRect(sx + 6, sy + 10, 4, 6);
    g.fillStyle = '#5a3f26'; g.fillRect(sx + 6, sy + 10, 4, 1);
    g.fillStyle = '#d9b45b'; g.fillRect(sx + 8, sy + 13, 1, 1);
  }
  if (BUILDING_LABELS.has(`${x},${y}`)) {
    label(b.label, sx + 8, sy + 13, 5);
  }
}

// ---------------------------------------------------------------- main
export function drawWorld(display, state, view) {
  ensure();
  const p = state.player;
  const zone = zoneAt(Math.round(view.pX), Math.round(view.pY)) || DEFAULT_ZONE;
  const dark = darknessOf(state.time?.min) * (zone.safe ? 0.55 : 1);
  const warm = warmthOf(state.time?.min);
  const t = view.t;

  const W = display.width, H = display.height;
  const tile = view.tile;
  const scale = tile / 16;
  const cols = Math.ceil(W / tile) + 2;
  const rows = Math.ceil(H / tile) + 2;
  if (!buf || buf.width !== cols * 16 || buf.height !== rows * 16) {
    buf = makeCanvas(cols * 16, rows * 16);
    g = buf.getContext('2d');
  }

  const x0 = Math.floor(view.camX) - 1;
  const y0 = Math.floor(view.camY) - 1;
  const waterF = Math.floor(t / 620) % 2;
  const runeF = Math.floor(t / 900) % 2;
  const glows = [];
  const trees = [];

  // --- terrain
  for (let y = y0; y < y0 + rows; y++) {
    for (let x = x0; x < x0 + cols; x++) {
      const sx = (x - x0) * 16, sy = (y - y0) * 16;
      if (!inWorld(x, y)) { g.fillStyle = '#0a120d'; g.fillRect(sx, sy, 16, 16); continue; }
      const ch = WORLD.tiles[y][x];
      const b = BUILDING_AT.get(`${x},${y}`);
      if (b) { drawBuilding(x, y, sx, sy, b, dark, t, glows); continue; }
      const set = TILES[ch] || (ch === '#' ? TILES['W'] : TILES['.']);
      const img = ch === '~' ? set[waterF] : (ch === '*' || ch === 'F') ? set[runeF] : set[(x * 7 + y * 13) % set.length];
      g.drawImage(img, sx, sy);
      if (ch === 'T') trees.push([x, y, sx, sy]);
      else if (inWorld(x, y)) drawDecor(x, y, sx, sy, ch, zoneAt(x, y)?.danger ?? 2, t, glows);
    }
  }

  // --- environmental hazard tints: miasma haze / shifting scree cracks
  for (const hz of HAZARDS) {
    if (hz.kind === 'rapids') continue;
    const list = hz.cells ? hz.cells.slice() : [];
    if (hz.rect) for (let j = 0; j < hz.rect.h; j++) for (let i = 0; i < hz.rect.w; i++) list.push([hz.rect.x + i, hz.rect.y + j]);
    for (const [hx, hy] of list) {
      if (!inWorld(hx, hy) || hx < x0 - 1 || hx > x0 + cols || hy < y0 - 1 || hy > y0 + rows) continue;
      const sx = (hx - x0) * 16, sy = (hy - y0) * 16;
      const wob = Math.sin(t / 700 + hx * 2 + hy);
      if (hz.kind === 'miasma') {
        g.fillStyle = `rgba(140,60,190,${0.15 + 0.06 * wob})`;
        g.fillRect(sx, sy, 16, 16);
        g.fillStyle = `rgba(190,120,220,${0.3 + 0.12 * wob})`;
        for (let k = 0; k < 4; k++) {
          const dx = (k * 5 + 2 + Math.floor(t / 130 + hx * 4 + hy * 9)) % 14;
          const dy = (k * 3 + 3 + Math.floor(t / 170 + hx * 7 + hy * 5)) % 13;
          g.fillRect(sx + dx, sy + dy, 2, 1);
        }
      } else { // unstable ground — cracked, shifting scree
        g.fillStyle = 'rgba(70,55,40,0.30)';
        g.fillRect(sx, sy, 16, 16);
        g.strokeStyle = 'rgba(30,22,15,0.55)';
        g.lineWidth = 1;
        const sh = Math.round(wob * 1.5);
        g.beginPath();
        g.moveTo(sx + 3 + sh, sy + 2); g.lineTo(sx + 8, sy + 8); g.lineTo(sx + 4, sy + 14);
        g.moveTo(sx + 12 - sh, sy + 3); g.lineTo(sx + 9, sy + 9); g.lineTo(sx + 13, sy + 13);
        g.stroke();
      }
    }
  }

  // --- trees after terrain so canopies overlap neighbors
  for (const [x, y, sx, sy] of trees) {
    const img = TREES[(x * 5 + y * 3) % TREES.length];
    const sway = Math.round(Math.sin(t / 900 + x * 0.7) * 0.5);
    g.drawImage(img, sx + sway, sy - 7);
  }

  // --- resource nodes
  const now = Date.now();
  for (const r of WORLD_RESOURCES) {
    if (r.x < x0 || r.x > x0 + cols || r.y < y0 || r.y > y0 + rows) continue;
    if (now - (state.worldState.gathered?.[r.id] || 0) < BALANCE.world.gatherRespawnMs) continue;
    const sx = (r.x - x0) * 16, sy = (r.y - y0) * 16;
    const pulse = 0.55 + 0.45 * Math.sin(t / 400 + r.x);
    g.drawImage(resIcon(r.type), sx, sy - 4);
    g.fillStyle = `rgba(255,240,180,${0.25 * pulse})`;
    g.fillRect(sx + 6, sy - 6, 1, 1); g.fillRect(sx + 10, sy - 4, 1, 1);
  }

  // --- campfires
  for (const [cx, cy] of CAMP_CELLS) {
    const sx = (cx - x0) * 16, sy = (cy - y0) * 16;
    if (sx < -16 || sy < -16 || sx > cols * 16 || sy > rows * 16) continue;
    g.fillStyle = '#4a3018'; g.fillRect(sx + 4, sy + 11, 9, 2);
    g.fillStyle = '#6b4a2f'; g.fillRect(sx + 5, sy + 10, 7, 1);
    const f = Math.floor(t / 140) % 2;
    g.fillStyle = '#e07a2a'; g.fillRect(sx + 6, sy + 6 - f, 4, 4 + f);
    g.fillStyle = '#f0c95a'; g.fillRect(sx + 7, sy + 8, 2, 2);
    glows.push({ x: sx + 8, y: sy + 8, r: 26, col: '240,160,60', a: 0.5 + f * 0.08 });
  }

  // --- spirit spring / terrace / formation glows
  const fx = (TERRACE[0] - x0) * 16, fy = (TERRACE[1] - y0) * 16;
  glows.push({ x: fx + 8, y: fy + 8, r: 20, col: '160,140,255', a: 0.35 + 0.15 * Math.sin(t / 700) });
  const fmX = (FORMATION[0] - x0) * 16, fmY = (FORMATION[1] - y0) * 16;
  glows.push({ x: fmX + 8, y: fmY + 8, r: 22, col: '84,216,232', a: 0.4 + 0.2 * Math.sin(t / 500) });

  // --- entities, painter-sorted by y
  const ents = [];
  for (const n of WORLD_NPCS) {
    if (n.x < x0 - 1 || n.x > x0 + cols || n.y < y0 - 1 || n.y > y0 + rows) continue;
    ents.push({ y: n.y, kind: 'npc', ref: n });
  }
  for (const e of state.worldState.enemies || []) {
    if (e.dead || e.x < x0 - 1 || e.x > x0 + cols || e.y < y0 - 1 || e.y > y0 + rows) continue;
    ents.push({ y: e.y, kind: 'enemy', ref: e });
  }
  for (const w of state.worldState.wildGu || []) {
    if (w.gone || !wildGuActive(w, state.time)) continue;
    if (w.x < x0 - 1 || w.x > x0 + cols || w.y < y0 - 1 || w.y > y0 + rows) continue;
    ents.push({ y: w.y, kind: 'wildgu', ref: w });
  }
  ents.push({ y: view.pY, kind: 'player' });
  ents.sort((a, b) => a.y - b.y);

  for (const ent of ents) {
    const moving = view.moving && ent.kind === 'player';
    if (ent.kind === 'player') {
      const sx = (view.pX - x0) * 16, sy = (view.pY - y0) * 16;
      shadow(sx + 8, sy + 13);
      const frame = moving ? [1, 0, 2, 0][Math.floor(t / 100) % 4] : 0;
      g.drawImage(getCharacterSheet(appearanceOf(state.player)).frames[view.facing || 'down'][frame], sx, sy - 8);
      if (dark > 0.15) glows.push({ x: sx + 8, y: sy + 2, r: 30, col: '255,230,170', a: dark * 0.35 });
    } else if (ent.kind === 'npc') {
      const n = ent.ref;
      const h = hash2(n.x, n.y, 3);
      const sx = (n.x - x0) * 16, sy = (n.y - y0) * 16;
      const bob = Math.round(Math.sin(t / 750 + h * 8) * 0.5);
      const npcDef = NPC_BY_ID[n.id];
      const isMaster = !!npcDef?.master;
      // face the player when close (interaction behavior)
      let dir = 'down';
      const dx = view.pX - n.x, dy = view.pY - n.y;
      if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      else dir = ['down', 'left', 'right', 'up'][(h * 4) | 0];
      shadow(sx + 8, sy + 13);
      if (isMaster) {
        // hidden masters meditate, wrapped in a pale aura
        g.drawImage(npcSheet(n.id).cast.down[0], sx, sy - 8 - bob);
        glows.push({ x: sx + 8, y: sy, r: 28, col: MASTER_BY_ID[n.id]?.aura || '150,200,255', a: 0.45 + 0.18 * Math.sin(t / 500 + n.x) });
        label((state.masters?.[n.id]?.found) ? npcDef.name.split(' ').slice(-1)[0] : '???', sx + 8, sy + 16, 5, '#a8e8ff');
      } else {
        g.drawImage(npcSheet(n.id).frames[dir][0], sx, sy - 8 - bob);
        label(npcDef?.name?.split(' ').slice(-1)[0] || '', sx + 8, sy + 16, 5);
        drawRoleProp(sx, sy, npcDef?.role, t, glows);
      }
      if (state.dialogue?.npcId === n.id) { // talking
        g.fillStyle = '#f0c95a'; g.fillRect(sx + 6, sy - 16, 1, 2); g.fillRect(sx + 8, sy - 18, 1, 2); g.fillRect(sx + 10, sy - 15, 1, 1);
      }
    } else if (ent.kind === 'wildgu') {
      // a wild Gu at its haunt — small animated creature in a faint Gu-aura
      const w = ent.ref;
      const sp = SPECIES_BY_ID[w.speciesId];
      const sheet = getWildGuSheet(w.speciesId);
      const sx = (w.x - x0) * 16, sy = (w.y - y0) * 16;
      const f = Math.floor(t / sheet.pace) % 2;
      const hover = sheet.move === 'hover' ? -2 + (f ? -1 : 0) : sheet.move === 'flutter' ? -4 + Math.round(Math.sin(t / 260) * 2) : 0;
      const wig = (sp.sprite === 'beetle' || sp.sprite === 'scarab') ? (f ? 1 : -1) : 0;
      shadow(sx + 8, sy + 13);
      g.drawImage(sheet.frames[f], sx + wig, sy - 4 + hover);
      glows.push({ x: sx + 8, y: sy + 6, r: 15, col: sp.glow, a: 0.32 + 0.16 * Math.sin(t / 420) });
      if (w.hp < sp.hp) { // weakened by a fight: mini HP bar
        g.fillStyle = '#000'; g.fillRect(sx + 3, sy - 6, 10, 2);
        g.fillStyle = '#e04a3a'; g.fillRect(sx + 3, sy - 6, Math.max(1, Math.round(10 * Math.max(0, w.hp) / sp.hp)), 2);
      }
    } else {
      const e = ent.ref;
      const def = ENEMY_BY_ID[e.defId];
      const vis = visualOf(e.defId);
      const sx = (e.x - x0) * 16, sy = (e.y - y0) * 16;
      const chase = e.state === 'chase';
      const alert = e.state === 'alert';
      const pace = vis.pace || 220;
      const f = Math.floor(t / (chase ? pace * 0.55 : pace)) % 2;
      const bob = Math.round(Math.sin(t / (chase ? 160 : 500) + e.x) * 0.5);
      const sheet = beastSheet(e.defId);
      const off = sheet.h > 16 ? 8 : 4; // humanoid enemies stand taller in frame
      const hover = vis.kind === 'bird' ? 3 + (f ? 1 : 0) : 0;
      const leader = e.packRole === 'leader' || def?.packLeader;
      const img = alert ? sheet.alert : (chase ? sheet.move[f] : sheet.idle[f]);
      shadow(sx + 8, sy + 13);
      if (leader) {
        // pack leaders loom (#9): larger, wrapped in a faint red aura, crowned
        const sw = img.width, sh2 = img.height;
        g.drawImage(img, sx - sw * 0.15, sy - off - bob - hover - sh2 * 0.3, sw * 1.3, sh2 * 1.3);
        glows.push({ x: sx + 8, y: sy - 2, r: 24, col: '255,70,70', a: 0.35 + 0.15 * Math.sin(t / 300) });
        g.fillStyle = '#f0c95a';
        g.fillRect(sx + 5, sy - off - 20, 2, 2); g.fillRect(sx + 8, sy - off - 21, 2, 3); g.fillRect(sx + 11, sy - off - 20, 2, 2);
      } else {
        g.drawImage(img, sx, sy - off - bob - hover);
      }
      if (chase) label('!', sx + 8, sy - off - 6, 8, '#ff5a4a');
      else if (alert) label('?', sx + 8, sy - off - 6, 8, '#f0c95a');
      if (def && e.hp < def.hp) { // wounded: mini HP bar
        const hbY = sy - off - 2;
        g.fillStyle = '#000'; g.fillRect(sx + 3, hbY, 10, 2);
        g.fillStyle = '#e04a3a'; g.fillRect(sx + 3, hbY, Math.max(1, Math.round(10 * Math.max(0, e.hp) / def.hp)), 2);
      }
    }
  }

  // --- lighting: darkness, warm dusk, then additive glows
  if (dark > 0.01) {
    g.fillStyle = `rgba(8,12,44,${dark * 0.5})`;
    g.fillRect(0, 0, buf.width, buf.height);
  }
  if (glows.length) {
    g.globalCompositeOperation = 'lighter';
    for (const gl of glows) {
      const grad = g.createRadialGradient(gl.x, gl.y, 1, gl.x, gl.y, gl.r);
      grad.addColorStop(0, `rgba(${gl.col},${gl.a})`);
      grad.addColorStop(1, `rgba(${gl.col},0)`);
      g.fillStyle = grad;
      g.fillRect(gl.x - gl.r, gl.y - gl.r, gl.r * 2, gl.r * 2);
    }
    g.globalCompositeOperation = 'source-over';
  }

  // --- blit to display
  const ctx = display.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0a120d';
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(buf, (x0 - view.camX) * tile, (y0 - view.camY) * tile, cols * 16 * scale, rows * 16 * scale);

  // --- atmosphere on top (screen space)
  if (warm > 0.01) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `rgba(255,140,50,${warm * 0.25})`);
    grad.addColorStop(1, `rgba(255,90,40,${warm * 0.12})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
  // drifting fog in the wilds
  const danger = zone.danger ?? 2;
  if (danger >= 2 && !zone.safe) {
    const n = danger >= 4 ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const fx2 = ((t / (140 + i * 60) + i * 500) % (W + 500)) - 250;
      const fy2 = (H * (0.2 + 0.25 * i)) + Math.sin(t / 3000 + i) * 24;
      const rad = 140 + i * 50;
      const grad = ctx.createRadialGradient(fx2, fy2, 10, fx2, fy2, rad);
      grad.addColorStop(0, `rgba(170,190,180,${0.05 + danger * 0.012})`);
      grad.addColorStop(1, 'rgba(170,190,180,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(fx2 - rad, fy2 - rad, rad * 2, rad * 2);
    }
  }
  // fireflies at night / insects at day
  const night = dark > 0.3;
  const count = night ? 8 : 5;
  for (let i = 0; i < count; i++) {
    const seed = i * 137.5;
    const ix = (Math.sin(t / (1700 + i * 130) + seed) * 0.5 + 0.5) * W;
    const iy = (Math.cos(t / (2100 + i * 90) + seed * 2) * 0.5 + 0.5) * H * 0.8;
    if (night) {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t / 350 + i * 3));
      const grad = ctx.createRadialGradient(ix, iy, 0, ix, iy, 6);
      grad.addColorStop(0, `rgba(220,255,140,${0.8 * tw})`);
      grad.addColorStop(1, 'rgba(220,255,140,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(ix - 6, iy - 6, 12, 12);
    } else if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(30,40,30,0.5)';
      ctx.fillRect(ix, iy, 2, 1);
    }
  }

  // proximity nameplates (screen-space, crisp) — only for beasts within ~4 tiles
  for (const e of state.worldState.enemies || []) {
    if (e.dead) continue;
    if (Math.max(Math.abs(e.x - p.x), Math.abs(e.y - p.y)) > 4) continue;
    const vis = visualOf(e.defId);
    const ex = (e.x - view.camX) * tile + tile / 2;
    const ey = (e.y - view.camY) * tile;
    const w = 132, h = 44, bx = Math.round(ex - w / 2), by = Math.round(ey - 52);
    ctx.fillStyle = 'rgba(10,14,12,0.88)';
    roundRectPath(ctx, bx, by, w, h, 6); ctx.fill();
    ctx.strokeStyle = DANGER_COLOR[vis.danger] || '#f0c95a'; ctx.lineWidth = 1.5;
    roundRectPath(ctx, bx, by, w, h, 6); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2d5d0'; ctx.font = `bold ${Math.max(10, Math.round(tile / 3))}px monospace`;
    // pack identity on the plate (#38): a crown for leaders, ×n for pack size
    const eDef = ENEMY_BY_ID[e.defId];
    const eLeader = e.packRole === 'leader' || eDef?.packLeader;
    let packN = 0;
    if (e.packId) for (const o of state.worldState.enemies || []) if (!o.dead && o.packId === e.packId) packN++;
    ctx.fillText((eLeader ? '♛ ' : '') + (eDef?.name || '') + (packN > 1 ? `  ×${packN}` : ''), ex, by + 15);
    ctx.fillStyle = '#b8c0b8'; ctx.font = `${Math.max(8, Math.round(tile / 4))}px monospace`;
    ctx.fillText(vis.rank || '', ex, by + 28);
    ctx.fillStyle = DANGER_COLOR[vis.danger] || '#f0c95a';
    ctx.fillText(DANGER_LABEL[vis.danger] || 'Danger: ?', ex, by + 40);
  }
}