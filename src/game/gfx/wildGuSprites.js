// Wild-Gu world sprites — small pixel creatures drawn procedurally, one pair of
// animation frames per species. Each species has its own silhouette, colors
// and movement pattern (wiggle / hover / crawl / flutter / pulse).
import { makeCanvas, rect, px } from './pixel';
import { SPECIES_BY_ID } from '../data/wildGu';

const cache = new Map();

function drawBeetle(g, c, f) {
  const [main, shell, dark] = c;
  rect(g, 3, 9 + (f ? 1 : 0), 2, 1, dark);
  rect(g, 11, 9 + (f ? 0 : 1), 2, 1, dark);
  rect(g, 5, 7, 6, 5, main);
  rect(g, 6, 6, 4, 1, shell);
  rect(g, 6, 8, 4, 3, shell);
  px(g, 7, 8, dark); px(g, 9, 9, dark);
  rect(g, 7, 5, 2, 2, dark);
  px(g, 6, 4, main); px(g, 10, 4, main);
  px(g, 8, 3 - f, '#ffd080');
}

function drawCarp(g, c, f) {
  const [main, fin, dark] = c;
  rect(g, 4, 8, 7, 3, main);
  rect(g, 5, 7, 5, 1, fin);
  px(g, 5, 9, fin);
  rect(g, 2, 7 - (f ? 1 : 0), 2, 4 - (f ? 0 : 1), fin); // tail flips
  px(g, 11, 8, dark); // eye
  px(g, 12, 8, main);
  rect(g, 7, 11, 1, 1 + (f ? 1 : 0), fin); // ventral fin
  px(g, 8, 6, fin);
}

function drawScarab(g, c, f) {
  const [main, shell, dark] = c;
  rect(g, 3, 10 + (f ? 1 : 0), 2, 1, dark);
  rect(g, 11, 10 + (f ? 0 : 1), 2, 1, dark);
  rect(g, 5, 7, 6, 6, main);
  rect(g, 5, 7, 6, 2, shell);
  px(g, 7, 10, '#7fd8e8'); px(g, 9, 11, '#7fd8e8'); // mineral glints
  px(g, 6, 8, dark); px(g, 9, 9, dark);
  rect(g, 7, 5, 2, 2, dark);
  px(g, 6, 4, main); px(g, 10, 4, main);
}

function drawBird(g, c, f) {
  const [main, wing, dark] = c;
  rect(g, 6, 8, 4, 3, main);           // body
  rect(g, 10, 7, 2, 2, main);          // head
  px(g, 12, 7, dark);                  // beak/eye
  rect(g, 9, 8, 1, 1, dark);
  rect(g, 9, 8 - (f ? 2 : 0), 4, 2, wing);  // wing up/down
  px(g, 10, 5 - (f ? 2 : 0), wing);
  rect(g, 7, 11, 1, 2, dark);          // legs
  px(g, 9, 11, dark);
  rect(g, 5, 9 - (f ? 1 : 0), 2, 1, wing); // tail
}

function drawCicada(g, c, f) {
  const [main, wing, dark] = c;
  rect(g, 6, 8, 4, 4, main);
  rect(g, 7, 7, 2, 1, main);
  rect(g, 5, 6 - (f ? 1 : 0), 6, 2, wing);  // wings shimmer
  px(g, 5, 7, wing); px(g, 10, 7, wing);
  rect(g, 7, 12, 2, 1, dark);
  px(g, 6, 5, dark); px(g, 9, 5, dark);     // eyes
  px(g, 8, 3 + (f ? 1 : 0), wing);          // song-notes upward
  px(g, 10, 2 + (f ? 0 : 1), wing);
}

const PAINTERS = { beetle: drawBeetle, carp: drawCarp, scarab: drawScarab, bird: drawBird, cicada: drawCicada };

export function getWildGuSheet(speciesId) {
  if (cache.has(speciesId)) return cache.get(speciesId);
  const sp = SPECIES_BY_ID[speciesId];
  const painter = PAINTERS[sp.sprite] || drawBeetle;
  const frames = [0, 1].map(f => {
    const c = makeCanvas(16, 16);
    painter(c.getContext('2d'), sp.colors, f);
    return c;
  });
  const sheet = { frames, pace: sp.pace || 300, move: sp.sprite === 'carp' || sp.sprite === 'cicada' ? 'hover' : sp.sprite === 'bird' ? 'flutter' : 'ground' };
  cache.set(speciesId, sheet);
  return sheet;
}