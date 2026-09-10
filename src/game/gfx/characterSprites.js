// Modular, recolorable pixel character sprite generator (16×24 frames) plus
// pixel bust portraits. One appearance object → a full pose sheet + portrait,
// cached by appearance so each save's cultivator renders cheaply.
import { makeCanvas, rect, px, hashStr } from './pixel';
import { DEFAULT_APPEARANCE } from '../data/appearance';
import { NPC_BY_ID } from '../data/npcs';

const DIRS = ['down', 'up', 'left', 'right'];

function shade(c, amt) {
  const n = parseInt(c.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

// pose: 'base' | 'cast' | 'attack' | 'hurt' | 'faint'; frame: 0 idle, 1/2 walk
function drawFigure(g, dir, frame, app, pose) {
  const P = app.outfitPrimary, S = app.outfitSecondary;
  const skin = app.skin, hairC = app.hairColor, eyeC = app.eyes;
  const female = app.body === 'female', slight = app.body === 'slight';
  const bw = slight ? 7 : female ? 8 : 9;
  const bx = slight ? 5 : 4;

  // ---- collapsed (defeat) ----
  if (pose === 'faint') {
    rect(g, 2, 19, 11, 3, shade(P, -0.05));
    rect(g, 2, 19, 11, 1, shade(P, 0.15));
    rect(g, 11, 18, 5, 4, skin);
    rect(g, 12, 17, 4, 2, hairC);
    rect(g, 1, 19, 2, 2, '#2a2018');
    rect(g, 13, 20, 1, 1, shade(skin, -0.2));
    return;
  }

  const walkA = frame === 1, walkB = frame === 2;
  const bob = walkA ? 1 : 0;
  const top = 4 + bob;

  // ---- legs / robe hem ----
  if (app.outfit === 'robe') {
    rect(g, bx, 17 + bob, bw, 4, shade(P, -0.12));
    rect(g, bx, 20 + bob, bw, 1, shade(P, -0.28));
    if (walkA) rect(g, bx + bw - 2, 21, 2, 1, '#2a2018');
    if (walkB) rect(g, bx, 21, 2, 1, '#2a2018');
    if (female) rect(g, bx - 1, 19 + bob, bw + 2, 2, shade(P, -0.08));
  } else {
    rect(g, 6, 16 + bob, 2, 4 - (walkA ? 1 : 0), '#3a3a44');
    rect(g, 9, 16 + bob, 2, 4 - (walkB ? 1 : 0), '#3a3a44');
    rect(g, 6, 20 + bob - (walkA ? 1 : 0), 2, 2, '#2a2018');
    rect(g, 9, 20 + bob - (walkB ? 1 : 0), 2, 2, '#2a2018');
  }

  // ---- torso ----
  rect(g, bx, 10 + bob, bw, 8, P);
  rect(g, bx, 10 + bob, bw, 1, shade(P, 0.18));
  rect(g, bx, 17 + bob, bw, 1, shade(P, -0.25));
  if (app.outfit === 'robe') { rect(g, 7, 11 + bob, 1, 7, S); rect(g, 8, 11 + bob, 1, 7, shade(S, -0.25)); }
  if (app.outfit === 'tunic') rect(g, bx, 14 + bob, bw, 1, S);
  if (app.outfit === 'martial') {
    for (let i = 0; i < 5; i++) px(g, bx + 1 + i, 11 + i + bob, S);
    rect(g, bx, 15 + bob, bw, 2, shade(S, -0.15));
    px(g, 7, 16 + bob, shade(S, 0.3));
  }
  if (app.outfit === 'armor') {
    rect(g, bx, 10 + bob, bw, 2, shade(P, 0.25));
    rect(g, bx, 12 + bob, bw, 1, shade(P, -0.3));
    px(g, bx + 1, 10 + bob, shade(P, 0.5));
    rect(g, bx - 1, 10 + bob, 2, 3, shade(P, 0.12));
    rect(g, bx + bw - 1, 10 + bob, 2, 3, shade(P, 0.12));
  }

  // ---- torso accessories ----
  if (app.accessory === 'scarf') { rect(g, 5, 9 + bob, 7, 1, S); rect(g, 4, 10 + bob, 1, 3, S); }
  if (app.accessory === 'belt') { rect(g, bx, 14 + bob, bw, 2, S); px(g, 7, 15 + bob, shade(S, 0.35)); }
  if (app.accessory === 'shoulderCloth') { rect(g, bx - 1, 10 + bob, 3, 7, S); rect(g, bx - 1, 16 + bob, 3, 1, shade(S, -0.3)); }

  // ---- arms (poses lean toward the enemy side, used in battle) ----
  const sleeve = shade(P, -0.12);
  if (pose === 'attack') {
    rect(g, bx + bw - 1, 12 + bob, 4, 1, sleeve);
    px(g, bx + bw + 3, 12 + bob, skin);
  } else if (pose === 'cast') {
    rect(g, bx - 1, 11 + bob, 1, 6, sleeve);
    rect(g, bx + bw, 8 + bob, 1, 4, sleeve);
    px(g, bx + bw, 7 + bob, skin);
    px(g, bx + bw - 1, 6 + bob, '#fff');
  } else {
    rect(g, bx - 1, 11 + bob, 1, 6, sleeve);
    rect(g, bx + bw, 11 + bob, 1, 6, sleeve);
    px(g, bx - 1, 17 + bob, skin);
    px(g, bx + bw, 17 + bob, skin);
  }

  // ---- head ----
  rect(g, 5, top, 7, 6, skin);
  rect(g, 5, top + 5, 7, 1, shade(skin, -0.12));
  // hair cap
  rect(g, 5, top - 1, 7, 2, hairC);
  if (dir === 'up') rect(g, 5, top - 1, 7, 5, hairC);
  switch (app.hair) {
    case 'short': px(g, 4, top + 1, hairC); px(g, 12, top + 1, hairC); break;
    case 'topknot': rect(g, 6, top - 3, 4, 2, hairC); rect(g, 6, top - 1, 4, 1, S); break;
    case 'bun': rect(g, 6, top - 3, 4, 2, hairC); rect(g, 6, top - 3, 4, 1, shade(hairC, 0.2)); break;
    case 'long':
      rect(g, 4, top, 1, 9, hairC); rect(g, 12, top, 1, 9, hairC);
      if (dir === 'up') rect(g, 4, top, 9, 7, hairC);
      break;
    case 'braids':
      rect(g, 4, top + 2, 1, 6, hairC); rect(g, 12, top + 2, 1, 6, hairC);
      px(g, 4, top + 8, S); px(g, 12, top + 8, S);
      break;
    case 'spiky':
      rect(g, 5, top - 2, 7, 1, hairC);
      px(g, 5, top - 3, hairC); px(g, 8, top - 3, hairC); px(g, 11, top - 3, hairC);
      break;
  }
  if (app.accessory === 'headband') rect(g, 5, top + 1, 7, 1, S);
  if (app.accessory === 'ornament') { px(g, 12, top - 2, '#e8c95a'); px(g, 12, top - 1, '#d9b45b'); }

  // ---- face ----
  if (dir === 'down') { px(g, 6, top + 3, eyeC); px(g, 10, top + 3, eyeC); px(g, 8, top + 5, shade(skin, -0.3)); }
  if (dir === 'left') { px(g, 5, top + 3, eyeC); rect(g, 9, top, 3, 6, shade(skin, -0.07)); }
  if (dir === 'right') { px(g, 11, top + 3, eyeC); rect(g, 4, top, 3, 6, shade(skin, -0.07)); }

  // ---- hurt tint ----
  if (pose === 'hurt') { g.fillStyle = 'rgba(255,80,60,0.45)'; g.fillRect(3, 2, 11, 21); }
}

function frameCanvas(app, dir, frame, pose) {
  const c = makeCanvas(16, 24), g = c.getContext('2d');
  drawFigure(g, dir, frame, app, pose);
  return c;
}

function buildPortrait(app) {
  const c = makeCanvas(24, 24), g = c.getContext('2d');
  const P = app.outfitPrimary, S = app.outfitSecondary, skin = app.skin, hairC = app.hairColor;
  // shoulders + lapel
  rect(g, 3, 18, 18, 6, P);
  rect(g, 3, 18, 18, 1, shade(P, 0.15));
  rect(g, 10, 18, 4, 6, S);
  rect(g, 3, 23, 18, 1, shade(P, -0.3));
  if (app.accessory === 'shoulderCloth') { rect(g, 2, 18, 6, 6, S); rect(g, 2, 23, 6, 1, shade(S, -0.3)); }
  if (app.accessory === 'scarf') { rect(g, 6, 16, 12, 2, S); rect(g, 17, 17, 2, 4, S); }
  if (app.accessory === 'belt') rect(g, 3, 18, 18, 2, S);
  // neck + head
  rect(g, 10, 15, 4, 4, shade(skin, -0.12));
  rect(g, 7, 4, 10, 12, skin);
  rect(g, 7, 14, 10, 2, shade(skin, -0.1));
  px(g, 6, 10, skin); px(g, 17, 10, skin);
  // hair
  rect(g, 7, 2, 10, 4, hairC);
  rect(g, 7, 5, 1, 3, hairC); rect(g, 16, 5, 1, 3, hairC);
  switch (app.hair) {
    case 'topknot': rect(g, 10, 0, 4, 2, hairC); rect(g, 10, 2, 4, 1, S); break;
    case 'bun': rect(g, 10, 0, 4, 2, hairC); break;
    case 'long': rect(g, 6, 2, 2, 14, hairC); rect(g, 16, 2, 2, 14, hairC); break;
    case 'braids':
      rect(g, 6, 6, 1, 9, hairC); rect(g, 17, 6, 1, 9, hairC);
      px(g, 6, 15, S); px(g, 17, 15, S);
      break;
    case 'spiky': rect(g, 7, 1, 10, 1, hairC); px(g, 8, 0, hairC); px(g, 12, 0, hairC); px(g, 15, 0, hairC); break;
  }
  if (app.accessory === 'headband') rect(g, 7, 5, 10, 1, S);
  if (app.accessory === 'ornament') { px(g, 16, 2, '#e8c95a'); px(g, 16, 3, '#d9b45b'); }
  // brows + eyes + mouth
  rect(g, 9, 8, 2, 1, shade(hairC, -0.1)); rect(g, 13, 8, 2, 1, shade(hairC, -0.1));
  rect(g, 9, 10, 2, 2, '#f4f4f4'); rect(g, 13, 10, 2, 2, '#f4f4f4');
  px(g, 10, 11, app.eyes); px(g, 14, 11, app.eyes);
  px(g, 11, 13, shade(skin, -0.35)); px(g, 12, 13, shade(skin, -0.35));
  return c;
}

const sheetCache = new Map();
const portraitCache = new Map();
const keyOf = (app) => JSON.stringify(app);

// Full pose sheet for one appearance:
// { frames: {dir: [idle, walkA, walkB]}, cast: {dir: frame}, attack: {...}, hurt: {...}, faint: canvas }
export function getCharacterSheet(app) {
  const key = keyOf(app);
  if (sheetCache.has(key)) return sheetCache.get(key);
  const build = (pose) => {
    const out = {};
    for (const dir of DIRS) out[dir] = [0, 1, 2].map((f) => frameCanvas(app, dir, f, pose));
    return out;
  };
  const sheet = { frames: build('base'), cast: build('cast'), attack: build('attack'), hurt: build('hurt'), faint: frameCanvas(app, 'down', 0, 'faint') };
  sheetCache.set(key, sheet);
  return sheet;
}

export function portraitDataURL(app) {
  const key = keyOf(app);
  if (!portraitCache.has(key)) portraitCache.set(key, buildPortrait(app).toDataURL());
  return portraitCache.get(key);
}

export function canvasURL(c) {
  if (!c._u) c._u = c.toDataURL();
  return c._u;
}

// Deterministic full appearance for an NPC id — replaces the old flat palettes.
const NPC_HAIR = ['short', 'topknot', 'long', 'bun', 'braids'];
const NPC_ROBE = ['#3a6b8a', '#8a4a4a', '#6b4a8a', '#8a7a3a', '#4a8a6b', '#7a3a5a', '#556077'];
const NPC_HAIRCOL = ['#141414', '#3a2a18', '#4a3018', '#6e3a1f', '#5a4a2a', '#8a5a2a', '#e8e4d8'];
const NPC_SKIN = ['#f2cfa5', '#e8b88a', '#d9a878', '#c99767', '#a8785a', '#8a5f42'];
const NPC_ACC = ['none', 'scarf', 'belt', 'shoulderCloth', 'headband'];

export function npcAppearance(id) {
  const pick = (arr, salt) => arr[Math.floor(hashStr(`${id}:${salt}`) * arr.length) % arr.length];
  const look = NPC_BY_ID[id]?.look || {}; // role-specific looks override the picks
  return {
    body: look.body || pick(['male', 'female'], 'b'),
    hair: look.hair || pick(NPC_HAIR, 'h'),
    hairColor: look.hairColor || pick(NPC_HAIRCOL, 'hc'),
    skin: look.skin || pick(NPC_SKIN, 's'),
    eyes: look.eyes || pick(['#3a2a18', '#2a5a8a', '#7a3a3a'], 'e'),
    outfit: look.outfit || pick(['robe', 'tunic', 'martial'], 'o'),
    outfitPrimary: look.outfitPrimary || pick(NPC_ROBE, 'p'),
    outfitSecondary: look.outfitSecondary || pick(['#c9a45a', '#d9b45b', '#8a6a43', '#3a3a44', '#a8b8c8'], 'sec'),
    accessory: look.accessory || pick(NPC_ACC, 'a'),
  };
}

// Old saves: fall back to the default cultivator look.
export function sheetFor(player) {
  return getCharacterSheet({ ...DEFAULT_APPEARANCE, ...(player?.appearance || {}) });
}