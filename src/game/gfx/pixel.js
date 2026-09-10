// Tiny helpers for procedural pixel-art generation.

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// deterministic 0..1 hash per world coordinate — stable decor/variants
export function hash2(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = ((h ^ s.charCodeAt(i)) * 16777619) >>> 0;
  return h / 4294967296;
}

// lighten (amt > 0) / darken (amt < 0) a #rrggbb color
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= (1 + amt); g *= (1 + amt); b *= (1 + amt); }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

export function rect(g, x, y, w, h, color) { g.fillStyle = color; g.fillRect(x, y, w, h); }
export function px(g, x, y, color) { rect(g, x, y, 1, 1, color); }

// seeded PRNG for texture generation (stable across reloads)
export function prng(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}