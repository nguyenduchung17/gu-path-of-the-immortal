// Procedural pixel-art character & beast sprite sheets (16×24 / 16×16).
import { makeCanvas, rect, px } from './pixel';

const SKINS = ['#e8b88a', '#d9a878', '#c99767'];
const HAIRS = ['#2a2018', '#4a3018', '#141414', '#5a4a2a', '#6e3a1f'];
const ROBES = ['#3a6b8a', '#8a4a4a', '#6b4a8a', '#8a7a3a', '#4a8a6b', '#7a3a5a', '#556077'];
const HATS = ['#d9b45b', '#c9a04a', '#b98f3f'];

// draws one 16×24 humanoid frame
function drawHuman(g, dir, frame, o) {
  const { robe, hair, skin, hat } = o;
  const bob = frame === 2 ? 1 : 0;
  const top = 3 + bob;

  // shadowy feet / legs
  const legA = frame === 1 ? 2 : 0;   // walk frame: legs alternate
  rect(g, 6, 20 + bob, 2, 2 - 0, '#2a2a2a');
  rect(g, 9, 20 + bob, 2, 2, '#2a2a2a');
  if (frame === 1) { rect(g, 5, 20 + bob, 2, 2, '#2a2a2a'); rect(g, 10, 19 + bob, 2, 2, '#2a2a2a'); }

  // robe body
  rect(g, 4, 10 + bob, 9, 10, robe);
  rect(g, 4, 10 + bob, 9, 1, shadeHex(robe, 0.18));
  rect(g, 4, 13 + bob, 9, 1, shadeHex(robe, -0.3)); // belt
  rect(g, 7, 14 + bob, 2, 1, '#d9b45b');            // buckle
  // arms
  rect(g, 3, 11 + bob, 1, 6, shadeHex(robe, -0.15));
  rect(g, 13, 11 + bob, 1, 6, shadeHex(robe, -0.15));
  px(g, 3, 17 + bob, skin); px(g, 13, 17 + bob, skin);

  // head
  rect(g, 5, top, 7, 6, skin);
  rect(g, 5, top + 5, 7, 1, shadeHex(skin, -0.2));
  // hair / hat
  if (hat) {
    rect(g, 4, top - 2, 9, 2, hat);
    rect(g, 3, top, 11, 1, shadeHex(hat, -0.25));
    rect(g, 6, top - 3, 5, 1, shadeHex(hat, 0.15));
  } else {
    rect(g, 5, top - 1, 7, 2, hair);
    px(g, 4, top + 1, hair); px(g, 12, top + 1, hair);
  }

  // eyes per direction
  if (dir === 'down') { px(g, 6, top + 3, '#1a1a1a'); px(g, 10, top + 3, '#1a1a1a'); }
  if (dir === 'left') { px(g, 5, top + 3, '#1a1a1a'); rect(g, 9, top, 3, 6, shadeHex(skin, -0.08)); }
  if (dir === 'right') { px(g, 11, top + 3, '#1a1a1a'); rect(g, 4, top, 3, 6, shadeHex(skin, -0.08)); }
  if (dir === 'up') { rect(g, 5, top - 1, 7, 4, hair); }
}

function shadeHex(color, amt) {
  const n = parseInt(color.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function frameCanvas(draw) {
  const c = makeCanvas(16, 24), g = c.getContext('2d');
  draw(g);
  return c;
}

const DIRS = ['down', 'up', 'left', 'right'];

// sheet: { down:[3 frames], up:[...], left:[...], right:[...] }
export function makeHumanSheet(opts = {}) {
  const o = {
    robe: opts.robe || '#3a7a5a',
    hair: opts.hair || HAIRS[0],
    skin: opts.skin || SKINS[0],
    hat: opts.hat || null,
  };
  const sheet = {};
  for (const dir of DIRS) {
    sheet[dir] = [0, 1, 2].map((f) => frameCanvas((g) => drawHuman(g, dir, f, o)));
  }
  return sheet;
}

// small quadruped beast, 2 frames
function drawBeast(g, frame, o) {
  const { body, belly, eye } = o;
  const bob = frame === 1 ? 1 : 0;
  // legs
  rect(g, 3, 13, 2, 3, shadeHex(body, -0.3));
  rect(g, 11, 13, 2, 3, shadeHex(body, -0.3));
  if (frame === 1) { rect(g, 5, 13, 2, 2, shadeHex(body, -0.3)); rect(g, 9, 12, 2, 3, shadeHex(body, -0.3)); }
  // body
  rect(g, 2, 7 + bob, 12, 7, body);
  rect(g, 2, 7 + bob, 12, 2, shadeHex(body, 0.15));
  rect(g, 3, 11 + bob, 10, 2, belly);
  // head
  rect(g, 10, 4 + bob, 5, 5, body);
  rect(g, 14, 5 + bob, 1, 2, shadeHex(body, -0.2)); // snout
  px(g, 15, 4 + bob, shadeHex(body, -0.3));         // ear tip
  px(g, 12, 5 + bob, eye);                          // eye
  // tail
  rect(g, 0, 6 + bob, 2, 1, shadeHex(body, -0.2));
  if (frame === 1) rect(g, 0, 5 + bob, 2, 1, shadeHex(body, -0.2));
}

export function makeBeastSheet(opts = {}) {
  const o = {
    body: opts.body || '#6b5a4a',
    belly: opts.belly || '#8d7d6a',
    eye: opts.eye || '#e04a3a',
  };
  return [0, 1].map((f) => {
    const c = makeCanvas(16, 16), g = c.getContext('2d');
    drawBeast(g, f, o);
    return c;
  });
}

// resource node icons, 16×16
export function makeResourceIcon(type) {
  const c = makeCanvas(16, 16), g = c.getContext('2d');
  const t = String(type);
  if (t.includes('petal') || t.includes('moon')) {
    // moonpetal flower
    rect(g, 7, 8, 2, 6, '#3f6b3a');
    rect(g, 5, 5, 6, 1, '#cfe4ff'); rect(g, 5, 8, 6, 1, '#cfe4ff');
    rect(g, 4, 6, 1, 2, '#cfe4ff'); rect(g, 11, 6, 1, 2, '#cfe4ff');
    rect(g, 6, 6, 4, 2, '#9fc4f0'); px(g, 7, 6, '#fff');
  } else if (t.includes('ore') || t.includes('crystal') || t.includes('core')) {
    rect(g, 5, 6, 6, 6, '#7fd8e8');
    rect(g, 6, 5, 2, 7, '#b7f0ff'); rect(g, 9, 7, 1, 4, '#4fa8c0');
    px(g, 4, 8, '#4fa8c0'); px(g, 11, 9, '#4fa8c0');
    rect(g, 3, 12, 10, 2, '#5a5148');
  } else if (t.includes('mush')) {
    rect(g, 6, 8, 4, 5, '#e8e0d0');
    rect(g, 3, 4, 10, 4, '#c04a3a');
    rect(g, 4, 3, 8, 1, '#d96a5a');
    px(g, 6, 5, '#f0d8c8'); px(g, 9, 6, '#f0d8c8');
  } else {
    // herb sprout (default)
    rect(g, 7, 6, 2, 8, '#4f8f5b');
    rect(g, 4, 8, 3, 1, '#6fae4f'); rect(g, 9, 10, 3, 1, '#6fae4f');
    px(g, 3, 8, '#6fae4f'); px(g, 12, 10, '#6fae4f');
    rect(g, 6, 4, 4, 2, '#87c25b');
  }
  return c;
}

// player uses the cultivator robe; NPCs get deterministic palettes
export function npcPalette(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return {
    robe: ROBES[h % ROBES.length],
    hair: HAIRS[(h >> 3) % HAIRS.length],
    skin: SKINS[(h >> 6) % SKINS.length],
    hat: (h >> 9) % 3 === 0 ? HATS[(h >> 4) % HATS.length] : null,
  };
}

export function beastPalette(defId) {
  const palettes = [
    { body: '#6b5a4a', belly: '#8d7d6a', eye: '#e04a3a' }, // wolfish
    { body: '#7a4a3a', belly: '#a8785f', eye: '#ffb03a' }, // boarish
    { body: '#4a6b3a', belly: '#6f8d5a', eye: '#d8ff3a' }, // serpent
    { body: '#5a4a7a', belly: '#7d6b9d', eye: '#c03aff' }, // corrupted
    { body: '#3a4a5a', belly: '#5a6b7d', eye: '#3ac0ff' }, // frost
  ];
  let h = 0;
  for (let i = 0; i < defId.length; i++) h = (h * 33 + defId.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length];
}