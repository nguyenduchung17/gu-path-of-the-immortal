// Species-distinct pixel-art beast sheets. Silhouette first: every species
// (wolf / boar / bear / snake / bird / spider / golem / bandit…) has its own
// drawer with a recognizable shape, proportions and posture — color is only
// a secondary accent. Poses: idle(f0/f1) · move(f0/f1) · alert · attack ·
// defeat (hurt = alert + red tint, applied by the battle renderer's filter).
import { makeCanvas, rect, px } from './pixel';
import { ENEMY_VISUALS } from '../data/enemies';

const PAL = {
  wolf:     { body: '#7a6a58', belly: '#a5988a', dark: '#52443a', eye: '#e04a3a' },
  hound:    { body: '#3a3546', belly: '#565170', dark: '#272235', eye: '#c03aff' },
  alpha:    { body: '#5a5568', belly: '#8a85a0', dark: '#3a3648', eye: '#ffb03a' },
  boar:     { body: '#6b4a3a', belly: '#8d6a4f', dark: '#452c1e', eye: '#ffb03a' },
  bear:     { body: '#5a4632', belly: '#8a745a', dark: '#392c1c', eye: '#e04a3a' },
  stone:    { body: '#6b6b72', belly: '#9a9aa2', dark: '#45454d', eye: '#7fe8ff' },
  mutant:   { body: '#4a6b3a', belly: '#6f8d5a', dark: '#2c4520', eye: '#d8ff3a' },
  snake:    { body: '#4a7a3a', belly: '#8fb56f', dark: '#2c5220', eye: '#d8ff3a' },
  bird:     { body: '#2a2a3a', belly: '#6a5a4a', dark: '#171724', eye: '#ff5a4a' },
  spider:   { body: '#3a2f2a', belly: '#5a4a42', dark: '#221a16', eye: '#c03aff' },
  guardian: { body: '#6a7a6a', belly: '#9aaa9a', dark: '#44524f', eye: '#7fe8ff' },
  bandit:   { body: '#4a3a30', belly: '#8a6a43', dark: '#241a12', eye: '#ffe95a', skin: '#d9a878', blade: '#c8ccd8' },
  chief:    { body: '#5a2a24', belly: '#a85a3a', dark: '#331512', eye: '#ffe95a', skin: '#c99767', blade: '#e8ecf4' },
};

const sh = (c, a) => c; // palettes are pre-tuned; shading uses PAL.dark/belly

// each drawer paints one 16×16 frame facing LEFT (toward the player in battle)
const DRAWERS = {
  wolf(g, pose, f, P) {
    const move = pose === 'move';
    const bob = move && f === 1 ? 1 : 0;
    const atk = pose === 'attack';
    const up = pose === 'alert';
    const hy = up ? 2 : atk ? 5 : 4;
    // tail (right)
    rect(g, 13, 6 + bob, 2, 2, P.dark);
    if (move && f === 1) rect(g, 14, 5, 1, 2, P.dark);
    // body — narrow, low stance
    rect(g, 3, 7 + bob, 11, 5, P.body);
    rect(g, 3, 7 + bob, 11, 1, sh(P.belly));
    rect(g, 4, 11 + bob, 9, 1, P.belly);
    // legs
    if (move) {
      if (f === 0) { rect(g, 2, 12, 2, 3, P.dark); rect(g, 12, 12, 2, 3, P.dark); }
      else { rect(g, 5, 12, 2, 3, P.dark); rect(g, 9, 12, 2, 3, P.dark); }
    } else { rect(g, 4, 12, 2, 3, P.dark); rect(g, 10, 12, 2, 3, P.dark); }
    // head — snout, pointed ears
    rect(g, 1, hy + bob, 5, 5, P.body);
    rect(g, 0, hy + 2 + bob, 1, 2, P.dark);          // snout
    if (atk) { rect(g, 0, hy + 2 + bob, 1, 2, '#8a1f1f'); px(g, 1, hy + 2 + bob, '#f4f4f4'); }
    px(g, 2, (up ? 1 : 3) + bob, P.dark); px(g, 4, (up ? 1 : 3) + bob, P.dark); // ears
    px(g, 2, hy + 2 + bob, P.eye);
  },
  hound(g, pose, f, P) {
    DRAWERS.wolf(g, pose, f, P);
    const bob = pose === 'move' && f === 1 ? 1 : 0;
    // living-shadow wisps curling off the flank
    px(g, 12, 4 + bob, '#8a5ac0'); px(g, 14, 8, '#8a5ac0'); px(g, 11, 3 + bob, '#6a4a9a');
    px(g, 15, 11, '#8a5ac0');
  },
  alpha(g, pose, f, P) {
    DRAWERS.wolf(g, pose, f, P);
    const bob = pose === 'move' && f === 1 ? 1 : 0;
    // heavy mane over the shoulders + old scar
    for (let i = 0; i < 5; i++) px(g, 5 + i, 5 + bob - (i % 2), P.dark);
    px(g, 6, 6 + bob, P.dark); px(g, 8, 6 + bob, P.dark);
    px(g, 2, 6 + bob, '#f4f4f4'); // scar over the eye
  },
  boar(g, pose, f, P) {
    const move = pose === 'move';
    const bob = move && f === 1 ? 1 : 0;
    const atk = pose === 'attack';
    const up = pose === 'alert';
    // low, heavy body
    rect(g, 3, 9 + bob, 11, 4, P.body);
    rect(g, 3, 9 + bob, 11, 1, sh(P.belly));
    // big head left with snout + tusks
    const hy = up ? 6 : atk ? 9 : 8;
    rect(g, 0, hy + bob, 6, 6, P.body);
    rect(g, 0, hy + 4 + bob, 2, 2, P.dark);          // snout disc
    px(g, 0, hy + 3 + bob, '#e8e4d8'); px(g, 1, hy + 2 + bob, '#e8e4d8'); // tusks
    px(g, 1, (up ? 4 : 6) + bob, P.dark); px(g, 3, (up ? 4 : 6) + bob, P.dark); // ears
    px(g, 1, hy + 2 + bob, P.eye);
    // short thick legs
    if (move) {
      if (f === 0) { rect(g, 3, 13, 2, 2, P.dark); rect(g, 11, 13, 2, 2, P.dark); }
      else { rect(g, 5, 13, 2, 2, P.dark); rect(g, 9, 13, 2, 2, P.dark); }
    } else { rect(g, 4, 13, 2, 2, P.dark); rect(g, 10, 13, 2, 2, P.dark); }
    if (atk) { px(g, 14, 13, '#a89a88'); px(g, 15, 14, '#a89a88'); } // kicked-up dust
    px(g, 14, 9 + bob, P.dark); // curly tail
  },
  bear(g, pose, f, P) {
    const move = pose === 'move';
    const bob = move && f === 1 ? 1 : 0;
    const atk = pose === 'attack';
    const up = pose === 'alert';
    const rear = atk || up;
    const top = rear ? 3 : 4;
    // huge body + broad shoulder hump
    rect(g, 3, top + 2 + bob, 11, 8, P.body);
    rect(g, 2, top + 1 + bob, 7, 4, P.body);         // shoulders
    rect(g, 2, top + 1 + bob, 7, 1, sh(P.belly));
    rect(g, 4, top + 9 + bob, 9, 1, P.belly);
    // small head left
    const hy = rear ? top - 1 : top + 2;
    rect(g, 0, hy + bob, 5, 5, P.body);
    px(g, 0, hy + 3 + bob, P.dark);                  // muzzle
    px(g, 1, hy + 3 + bob, P.dark);
    px(g, 1, hy - 1 + bob, P.dark); px(g, 3, hy - 1 + bob, P.dark); // round ears
    px(g, 1, hy + 1 + bob, P.eye);
    // heavy legs
    if (rear && atk) { rect(g, 0, top + 3 + bob, 2, 5, P.body); px(g, 0, top + 8 + bob, P.dark); } // raised paw
    rect(g, 4, top + 10 + bob, 3, 3, P.dark);
    rect(g, 10, top + 10 + bob, 3, 3, P.dark);
    if (move && f === 0) rect(g, 7, top + 10, 3, 3, P.dark);
  },
  stone(g, pose, f, P) {
    DRAWERS.bear(g, pose, f, P);
    const bob = pose === 'move' && f === 1 ? 1 : 0;
    // granite cracks + glowing core eye
    px(g, 7, 8 + bob, P.dark); px(g, 8, 9 + bob, P.dark); px(g, 9, 8 + bob, P.dark);
    px(g, 12, 10 + bob, P.dark); px(g, 6, 11 + bob, P.dark);
    px(g, 5, 6 + bob, P.eye); px(g, 6, 6 + bob, P.eye);
  },
  mutant(g, pose, f, P) {
    DRAWERS.bear(g, pose, f, P);
    const bob = pose === 'move' && f === 1 ? 1 : 0;
    // bone spikes along the spine + third eye
    for (let i = 0; i < 6; i++) px(g, 3 + i * 2, 5 + bob - (i % 2), '#d8d4c8');
    px(g, 9, 7 + bob, P.eye);
    px(g, 11, 4 + bob, '#d8ff3a');
  },
  snake(g, pose, f, P) {
    const move = pose === 'move';
    const atk = pose === 'attack';
    const up = pose === 'alert';
    const ph = move && f === 1 ? 1 : 0;
    // long S-curved body (no legs)
    rect(g, 2, 9 + ph, 3, 2, P.body);
    rect(g, 5, 8 + ph, 3, 2, P.body);
    rect(g, 8, 9 - ph, 3, 2, P.body);
    rect(g, 11, 8 + ph, 3, 2, P.body);
    rect(g, 13, 10 + ph, 2, 1, P.belly);
    rect(g, 2, 11 + ph, 9, 1, P.belly);
    // raised head left with flicking tongue
    const hy = atk ? 4 : up ? 3 : 5;
    rect(g, 0, hy + ph, 4, 3, P.body);
    px(g, 0, hy + 1 + ph, P.eye);
    if (atk) { px(g, 0, hy + 3 + ph, '#e04a3a'); px(g, 0, hy + 4 + ph, '#e04a3a'); px(g, 1, hy + 3 + ph, '#f4f4f4'); }
    else if (up) px(g, 0, hy - 1 + ph, '#e04a3a');
  },
  bird(g, pose, f, P) {
    const flap = (pose === 'move' || pose === 'attack') ? f : 0;
    const atk = pose === 'attack';
    const up = pose === 'alert';
    // body — small, hovering (renderer adds the bob)
    rect(g, 6, 7, 4, 5, P.body);
    rect(g, 6, 11, 4, 1, P.belly);
    // head left + hooked beak
    const hy = atk ? 5 : up ? 4 : 6;
    rect(g, 4, hy, 3, 3, P.body);
    px(g, 3, hy + 1, '#e8a03a'); px(g, 2, hy + 1, '#e8a03a');
    px(g, 4, hy + 1, P.eye);
    // wings — spread / mid / folded
    if (flap === 0) { rect(g, 1, 5, 5, 3, P.dark); rect(g, 10, 5, 5, 3, P.dark); rect(g, 2, 4, 3, 1, P.body); rect(g, 11, 4, 3, 1, P.body); }
    else if (flap === 1 || pose === 'attack') { rect(g, 1, 8, 5, 2, P.dark); rect(g, 10, 8, 5, 2, P.dark); }
    else { rect(g, 7, 5, 2, 3, P.dark); }
    // tail feathers
    px(g, 10, 10, P.dark); px(g, 11, 11, P.dark); px(g, 12, 12, P.dark);
    if (atk) { px(g, 5, 12, '#e8a03a'); px(g, 5, 13, '#e8a03a'); } // diving talons
  },
  spider(g, pose, f, P) {
    const move = pose === 'move';
    const atk = pose === 'attack';
    const w = move && f === 1 ? 1 : 0;
    // legs — 4 each side, angled
    for (let i = 0; i < 4; i++) {
      const ly = 6 + i * 2;
      rect(g, 2 - (i % 2 === w ? 1 : 0), ly, 3, 1, P.dark);
      rect(g, 11 + (i % 2 === w ? 1 : 0), ly, 3, 1, P.dark);
    }
    if (atk) { rect(g, 1, 4, 3, 1, P.dark); rect(g, 1, 3, 2, 1, P.dark); } // front legs raised
    // bulbous abdomen right + head left
    rect(g, 8, 6, 6, 7, P.body);
    rect(g, 8, 6, 6, 1, sh(P.belly));
    rect(g, 9, 11, 4, 1, P.belly);
    rect(g, 4, 7, 4, 4, P.body);
    px(g, 4, 8, P.eye); px(g, 4, 9, P.eye); px(g, 6, 9, P.eye);
    // fangs
    px(g, 3, 10, '#e8e4d8');
  },
  guardian(g, pose, f, P) {
    const move = pose === 'move';
    const bob = move && f === 1 ? 1 : 0;
    const atk = pose === 'attack';
    // blocky stone golem
    rect(g, 3, 4 + bob, 10, 9, P.body);
    rect(g, 3, 4 + bob, 10, 1, sh(P.belly));
    rect(g, 3, 12 + bob, 10, 1, P.dark);
    // head — flat cap with one glowing eye
    rect(g, 5, 1 + bob, 6, 3, P.body);
    px(g, 7, 2 + bob, P.eye); px(g, 8, 2 + bob, P.eye);
    // arms
    if (atk) { rect(g, 0, 2 + bob, 3, 3, P.body); rect(g, 0, 0 + bob, 3, 2, sh(P.belly)); } // raised slab arm
    else rect(g, 1, 6 + bob, 2, 6, P.body);
    rect(g, 13, 6 + bob, 2, 6, P.body);
    // legs
    rect(g, 4, 13, 3, 3, P.dark); rect(g, 9, 13, 3, 3, P.dark);
    if (move && f === 0) rect(g, 4, 13, 3, 2, P.body);
    // moss + cracks
    px(g, 4, 5 + bob, '#4a7a4a'); px(g, 11, 9 + bob, '#4a7a4a');
    px(g, 6, 8 + bob, P.dark); px(g, 7, 9 + bob, P.dark); px(g, 10, 6 + bob, P.dark);
  },
  bandit(g, pose, f, P) {
    const move = pose === 'move';
    const walkA = move && f === 1;
    const atk = pose === 'attack';
    const up = pose === 'alert';
    const bob = walkA ? 1 : 0;
    // legs
    rect(g, 6, 17 + bob, 2, 4 - (walkA ? 1 : 0), '#2a2a32');
    rect(g, 9, 17 + bob, 2, 4 - (move && f === 0 ? 1 : 0), '#2a2a32');
    // dark tunic — clearly not a civilian robe
    rect(g, 4, 10 + bob, 9, 8, P.body);
    rect(g, 4, 10 + bob, 9, 1, sh(P.belly));
    rect(g, 4, 16 + bob, 9, 1, P.dark);
    // red headband marks him a bandit
    rect(g, 5, 5 + bob, 7, 6, P.skin);
    rect(g, 5, 5 + bob, 7, 1, '#8a2a2a');
    rect(g, 5, 4 + bob, 7, 1, P.dark);
    rect(g, 3, 5 + bob, 1, 3, '#8a2a2a'); // band tail
    px(g, 6, 8 + bob, P.eye); px(g, 10, 8 + bob, P.eye);
    // visible weapon (short blade) in the right hand
    if (atk) { rect(g, 12, 6 + bob, 1, 5, P.blade); px(g, 12, 5 + bob, '#f4f4f4'); rect(g, 12, 11 + bob, 1, 2, '#4a3018'); }
    else { rect(g, 13, 13 + bob, 1, 3, P.blade); rect(g, 13, 12 + bob, 1, 1, '#4a3018'); }
    // off arm
    rect(g, 3, 11 + bob, 1, 5, P.dark);
    if (up) px(g, 8, 9 + bob, P.eye);
  },
  chief(g, pose, f, P) {
    DRAWERS.bandit(g, pose, f, P);
    const bob = pose === 'move' && f === 1 ? 1 : 0;
    // iron pauldrons + face scar + plated sash
    rect(g, 3, 9 + bob, 4, 2, '#8a8f9a');
    rect(g, 10, 9 + bob, 4, 2, '#8a8f9a');
    px(g, 9, 7 + bob, '#c04040'); px(g, 10, 6 + bob, '#c04040'); // scar
    rect(g, 4, 13 + bob, 9, 2, P.belly);
  },
};

// ---------------------------------------------------------------- defeat poses
// every species collapses differently: quadrupeds roll onto their side,
// snakes straighten, birds splay on the ground, golems crumble.
function drawDefeat(g, kind, P) {
  const dark = P.dark || P.body;
  const flat = (x, y, w, h, c) => rect(g, x, y, w, h, c);
  switch (kind) {
    case 'snake':
      rect(g, 1, 12, 14, 2, P.body);
      rect(g, 0, 11, 3, 2, P.body);
      px(g, 0, 12, P.eye);
      break;
    case 'bird':
      rect(g, 4, 12, 8, 2, P.body);          // splayed body
      rect(g, 1, 13, 4, 1, dark); rect(g, 11, 13, 4, 1, dark); // wings out flat
      px(g, 3, 11, '#e8a03a');
      px(g, 5, 12, P.eye);
      break;
    case 'guardian':
      rect(g, 3, 12, 10, 4, P.body);         // crumbled slab
      rect(g, 5, 11, 4, 2, P.body);
      px(g, 7, 12, dark); px(g, 9, 13, dark);
      rect(g, 1, 13, 3, 3, dark); rect(g, 12, 12, 3, 2, dark); // rubble
      break;
    case 'bandit': case 'chief':
      rect(g, 3, 19, 10, 3, P.body);         // collapsed
      rect(g, 11, 18, 4, 3, P.skin);
      rect(g, 12, 17, 3, 1, P.dark);
      px(g, 13, 19, P.eye);
      rect(g, 1, 20, 2, 2, dark);
      break;
    default: // quadrupeds — rolled onto their side, legs in the air
      flat(3, 11, 11, 4, P.body);
      flat(3, 11, 11, 1, P.belly);
      rect(g, 5, 9, 2, 2, dark); rect(g, 9, 9, 2, 2, dark); // legs up
      rect(g, 0, 12, 4, 3, P.body);          // head on the ground
      px(g, 1, 13, '#f4f4f4');
      if (kind === 'boar') px(g, 0, 11, '#e8e4d8');
  }
}

function frameCanvas(w, h, draw) {
  const c = makeCanvas(w, h), g = c.getContext('2d');
  draw(g);
  return c;
}

const sheetCache = new Map();

// Full pose sheet for one enemy definition id.
export function getBeastSheet(defId) {
  if (sheetCache.has(defId)) return sheetCache.get(defId);
  const v = ENEMY_VISUALS[defId] || {};
  const kind = v.kind || 'wolf';
  const P = PAL[kind];
  const humanoid = kind === 'bandit' || kind === 'chief';
  const h = humanoid ? 24 : 16;
  const sheet = {
    h,
    idle: [0, 1].map((f) => frameCanvas(16, h, (g) => DRAWERS[kind](g, 'idle', f, P))),
    move: [0, 1].map((f) => frameCanvas(16, h, (g) => DRAWERS[kind](g, 'move', f, P))),
    alert: frameCanvas(16, h, (g) => DRAWERS[kind](g, 'alert', 0, P)),
    attack: frameCanvas(16, h, (g) => DRAWERS[kind](g, 'attack', 0, P)),
    hurt: frameCanvas(16, h, (g) => {
      DRAWERS[kind](g, 'alert', 0, P);
      g.fillStyle = 'rgba(255,70,50,0.42)';
      g.fillRect(0, 0, 16, h);
    }),
    defeat: frameCanvas(16, h, (g) => drawDefeat(g, kind, P)),
  };
  sheetCache.set(defId, sheet);
  return sheet;
}