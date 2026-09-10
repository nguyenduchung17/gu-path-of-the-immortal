// Procedural 16×16 pixel-art tile textures, generated once per session.
// Every terrain type has several variants so large areas never read as flat color.
import { makeCanvas, rect, px, prng } from './pixel';

const S = 16;

function speckle(g, colors, n, seed, rnd) {
  const r = rnd || prng(seed);
  for (let i = 0; i < n; i++) rect(g, (r() * S) | 0, (r() * S) | 0, 1, 1, colors[(r() * colors.length) | 0]);
}

function grassTile(base, light, dark, blade, seed) {
  const c = makeCanvas(S, S), g = c.getContext('2d');
  rect(g, 0, 0, S, S, base);
  speckle(g, [light, dark, light], 18, seed);
  const r = prng(seed + 7);
  for (let i = 0; i < 5; i++) {
    const x = 1 + ((r() * 13) | 0), y = 2 + ((r() * 11) | 0);
    px(g, x, y, blade); px(g, x, y - 1, blade); px(g, x + 1, y, blade);
  }
  return c;
}

function dirtTile(base, light, dark, seed) {
  const c = makeCanvas(S, S), g = c.getContext('2d');
  rect(g, 0, 0, S, S, base);
  speckle(g, [light, dark], 16, seed);
  const r = prng(seed + 3);
  for (let i = 0; i < 3; i++) {
    const x = 2 + ((r() * 11) | 0), y = 2 + ((r() * 11) | 0);
    rect(g, x, y, 2, 1, light); px(g, x + 1, y + 1, dark);
  }
  return c;
}

function plankTile(base, line, seed) {
  const c = makeCanvas(S, S), g = c.getContext('2d');
  rect(g, 0, 0, S, S, base);
  for (let y = 0; y < S; y += 4) rect(g, 0, y, S, 1, line);
  const r = prng(seed + 11);
  for (let i = 0; i < 6; i++) px(g, (r() * S) | 0, (r() * S) | 0, line);
  rect(g, 0, 0, S, 1, shadeOf(base, 0.12));
  return c;
}

function shadeOf(color, amt) {
  // local import-free shade for palette strings stored as hex
  const n = parseInt(color.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function waterFrame(base, waveA, waveB, phase) {
  const c = makeCanvas(S, S), g = c.getContext('2d');
  rect(g, 0, 0, S, S, base);
  for (let y = 2; y < S; y += 5) {
    const off = ((y + phase) % 10) < 5 ? 0 : 3;
    for (let x = 0; x < S; x += 7) rect(g, (x + off) % S, y, 3, 1, waveA);
    rect(g, (4 + off) % S, y + 2, 2, 1, waveB);
  }
  return c;
}

function stoneTile(base, light, dark, seed) {
  const c = makeCanvas(S, S), g = c.getContext('2d');
  rect(g, 0, 0, S, S, base);
  // rough brick pattern
  const r = prng(seed + 5);
  for (let y = 0; y < S; y += 4) {
    const shift = ((y / 4) % 2) * 4;
    for (let x = 0; x < S; x += 8) {
      rect(g, x + shift, y, 7, 3, shadeOf(base, 0.06));
      rect(g, x + shift, y, 7, 1, light);
      px(g, x + shift + 2, y + 2, dark);
    }
  }
  speckle(g, [dark, light], 8, seed + 9);
  return c;
}

function farmTile(seed) {
  const c = makeCanvas(S, S), g = c.getContext('2d');
  rect(g, 0, 0, S, S, '#5d4a2e');
  for (let y = 1; y < S; y += 4) {
    rect(g, 0, y, S, 2, '#4a3820');
    const r = prng(seed + y);
    for (let x = 1; x < S; x += 3) {
      const h = 1 + ((r() * 2) | 0);
      rect(g, x, y - h, 1, h, r() < 0.5 ? '#6fae4f' : '#87c25b');
      if (r() < 0.3) px(g, x, y - h - 1, '#e5c95c');
    }
  }
  return c;
}

function cliffTile(seed) {
  const c = makeCanvas(S, S), g = c.getContext('2d');
  rect(g, 0, 0, S, S, '#5a5148');
  rect(g, 0, 0, S, 3, '#7a7062');
  rect(g, 0, 3, S, 1, '#3c352e');
  const r = prng(seed + 2);
  for (let i = 0; i < 5; i++) rect(g, 1 + ((r() * 12) | 0), 5 + ((r() * 9) | 0), 2 + ((r() * 2) | 0), 1, r() < 0.5 ? '#6b6255' : '#453d35');
  rect(g, 0, S - 2, S, 2, '#453d35');
  return c;
}

function terraceTile(phase) {
  const c = makeCanvas(S, S), g = c.getContext('2d');
  rect(g, 0, 0, S, S, '#2c2440');
  rect(g, 0, 0, S, 1, '#443a63'); rect(g, 0, S - 1, S, 1, '#1d1830');
  // rune circle
  const cx = 8, cy = 8;
  g.strokeStyle = phase === 0 ? '#8f7fd8' : '#b7a7ff';
  g.strokeRect(cx - 5.5, cy - 5.5, 11, 11);
  rect(g, cx - 1, cy - 3, 2, 6, '#c9b8ff');
  rect(g, cx - 3, cy - 1, 6, 2, '#c9b8ff');
  px(g, 2, 2, '#8f7fd8'); px(g, 13, 3, '#8f7fd8'); px(g, 3, 13, '#8f7fd8'); px(g, 12, 12, '#8f7fd8');
  return c;
}

function formationTile(phase) {
  const c = makeCanvas(S, S), g = c.getContext('2d');
  rect(g, 0, 0, S, S, '#1c2a4a');
  rect(g, 0, 0, S, 1, '#31486e'); rect(g, 0, S - 1, S, 1, '#101a30');
  const col = phase === 0 ? '#54d8e8' : '#9ef0ff';
  g.strokeStyle = col;
  g.strokeRect(3.5, 3.5, 9, 9);
  px(g, 7, 2, col); px(g, 8, 2, col); px(g, 7, 13, col); px(g, 8, 13, col);
  px(g, 2, 7, col); px(g, 2, 8, col); px(g, 13, 7, col); px(g, 13, 8, col);
  px(g, 7, 7, '#e8fbff'); px(g, 8, 8, '#e8fbff');
  return c;
}

function makeVariants(fn, n, seedBase) {
  return Array.from({ length: n }, (_, i) => fn(seedBase + i * 101));
}

// Big tree sprite: 16×24, canopy overhangs the tile above.
function treeSprite(seed) {
  const c = makeCanvas(16, 24), g = c.getContext('2d');
  const r = prng(seed);
  // trunk
  rect(g, 7, 16, 2, 7, '#6b4a2f');
  px(g, 7, 17, '#7d5a3a'); px(g, 8, 20, '#54371f');
  rect(g, 6, 22, 4, 1, '#4a3018');
  // canopy: layered blobs
  const greens = ['#2f5e3a', '#3f7a4c', '#2a4f33', '#4f8f5b'];
  const blob = (cx, cy, w, h, col) => {
    for (let dy = 0; dy < h; dy++) {
      const ww = Math.round(w * Math.sqrt(1 - Math.pow(dy / h - 0.5, 2) * 3.5));
      rect(g, Math.round(cx - ww / 2), cy + dy, ww, 1, col);
    }
  };
  blob(8, 6, 15, 10, greens[0]);
  blob(5, 8, 8, 7, greens[1]);
  blob(11, 7, 7, 6, greens[2]);
  const hl = 3 + ((r() * 3) | 0);
  for (let i = 0; i < hl; i++) { px(g, 3 + ((r() * 10) | 0), 4 + ((r() * 5) | 0), greens[3]); }
  return c;
}

export function buildTiles() {
  return {
    '.': makeVariants((s) => grassTile('#3e6b3a', '#4f7f46', '#32582e', '#5d8a4c', s), 4, 10),
    ',': makeVariants((s) => grassTile('#2e5230', '#3a6340', '#24401f', '#44703c', s), 4, 20),
    'r': makeVariants((s) => dirtTile('#7a6142', '#8d7350', '#634e33', s), 4, 30),
    's': makeVariants((s) => dirtTile('#8a6a44', '#9d7d55', '#6d5233', s), 3, 40),
    'c': makeVariants((s) => plankTile('#6d5233', '#57402a', s), 3, 50),
    'b': makeVariants((s) => plankTile('#8a6a43', '#6d5233', s), 2, 60),
    'W': makeVariants((s) => stoneTile('#4d4842', '#5f5a52', '#3a362f', s), 3, 70),
    'R': makeVariants((s) => cliffTile(s), 3, 80),
    'f': makeVariants((s) => farmTile(s), 3, 90),
    '~': [waterFrame('#1c4a72', '#2f6a9a', '#63a8d8', 0), waterFrame('#1c4a72', '#2f6a9a', '#63a8d8', 5)],
    '*': [terraceTile(0), terraceTile(1)],
    'F': [formationTile(0), formationTile(1)],
  };
}

export function buildTrees() {
  return [treeSprite(1), treeSprite(77), treeSprite(313)];
}