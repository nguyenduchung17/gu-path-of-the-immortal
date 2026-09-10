// Wild Gu — living Gu creatures that haunt the region's wilds. Unlike shop
// stock, these must be found by exploring: forests, rivers, hills, ruins and
// rare places. Encountering one offers a real choice — capture it alive
// (it becomes yours, but must be fed), attack it for materials, or observe
// and leave. Capture is never guaranteed; weaken it first for better odds.
import { GU_BY_ID } from './gu';
import { BALANCE } from '../config/balance';
import { T, locSpeciesName } from '../i18n/tr';

export const WILD_GU_SPECIES = [
  {
    id: 'flameBeetle', name: 'Flame Beetle Gu', guId: 'emberGu',
    rank: 1, path: 'fire', rarity: 'uncommon', behavior: 'territorial',
    habitat: ['forestOutskirts', 'eastHills', 'ruins'],
    captureDifficulty: 2, hp: 40, attack: 7, defense: 2, weakness: 'water',
    foodType: 'flameGrass',
    drops: [{ itemId: 'flameGrass', chance: 80, qty: 1 }, { itemId: 'fireEssence', chance: 50, qty: 1 }, { itemId: 'beastCore', chance: 60, qty: 1 }],
    sprite: 'beetle', colors: ['#d84a20', '#f08a3a', '#5a1a0a'], glow: '240,120,50', pace: 280,
    sense: 'A husk of ember-red chitin scuttles through the brush, trailing wisps of heat.',
  },
  {
    id: 'mistCarp', name: 'Mist Carp Gu', guId: 'tideBinding',
    rank: 1, path: 'water', rarity: 'uncommon', behavior: 'passive',
    habitat: ['farmland', 'marsh', 'eastPlains'],
    captureDifficulty: 2, hp: 34, attack: 5, defense: 2, weakness: 'earth',
    foodType: 'spiritWater',
    drops: [{ itemId: 'spiritWater', chance: 80, qty: 1 }, { itemId: 'mistSilk', chance: 50, qty: 1 }, { itemId: 'beastCore', chance: 50, qty: 1 }],
    sprite: 'carp', colors: ['#4a9ad8', '#a8d8f0', '#1a3a5a'], glow: '120,200,255', pace: 320,
    sense: 'A sleek fish of living mist hovers above the water, scales catching the light.',
  },
  {
    id: 'stoneScarab', name: 'Stone Scarab Gu', guId: 'stoneShell',
    rank: 1, path: 'earth', rarity: 'common', behavior: 'territorial',
    habitat: ['eastHills', 'ruins'],
    captureDifficulty: 1, hp: 52, attack: 5, defense: 6, weakness: 'wind',
    foodType: 'mineralEssence',
    drops: [{ itemId: 'mineralEssence', chance: 80, qty: 1 }, { itemId: 'ore', chance: 60, qty: 1 }, { itemId: 'beastCore', chance: 50, qty: 1 }],
    sprite: 'scarab', colors: ['#8a8074', '#b8ae9a', '#4a443c'], glow: '200,200,180', pace: 380,
    sense: 'A scarab of veined stone grinds slowly over the rocks, patient as the hills.',
  },
  {
    id: 'galeSparrow', name: 'Gale Sparrow Gu', guId: 'windStep',
    rank: 1, path: 'wind', rarity: 'uncommon', behavior: 'passive',
    habitat: ['wildForest', 'southernWilds', 'eastPlains'],
    captureDifficulty: 3, hp: 26, attack: 4, defense: 1, weakness: 'fire',
    foodType: 'beastMeat',
    drops: [{ itemId: 'windCrystal', chance: 60, qty: 1 }, { itemId: 'beastMeat', chance: 70, qty: 1 }, { itemId: 'beastCore', chance: 40, qty: 1 }],
    sprite: 'bird', colors: ['#4ad0a0', '#a0f0d8', '#1a4a3a'], glow: '120,255,200', pace: 160,
    sense: 'A sparrow of woven wind flickers between branches, never quite touching them.',
  },
  {
    id: 'jadeCicada', name: 'Jade Cicada Gu', guId: 'jadeMarrow',
    rank: 2, path: 'water', rarity: 'rare', behavior: 'territorial', nightOnly: true,
    habitat: ['forestOutskirts', 'southernWilds'],
    captureDifficulty: 4, hp: 44, attack: 9, defense: 3, weakness: 'fire',
    foodType: 'spiritWater',
    drops: [{ itemId: 'moonPetal', chance: 70, qty: 1 }, { itemId: 'spiritWater', chance: 80, qty: 1 }, { itemId: 'beastCore', chance: 70, qty: 1 }],
    sprite: 'cicada', colors: ['#38d8a0', '#c8f5e8', '#0a4a34'], glow: '80,255,190', pace: 260,
    sense: 'A cicada of translucent jade sings only under the moon, and the night listens.',
  },
];

export const SPECIES_BY_ID = Object.fromEntries(WILD_GU_SPECIES.map(s => [s.id, s]));

// Fixed haunts across the region — each respawns after capture or death.
export const WILD_GU_SPAWNS = [
  { speciesId: 'flameBeetle', x: 40, y: 20 },
  { speciesId: 'flameBeetle', x: 52, y: 24 },
  { speciesId: 'mistCarp', x: 29, y: 34 },
  { speciesId: 'mistCarp', x: 62, y: 54 },
  { speciesId: 'stoneScarab', x: 58, y: 18 },
  { speciesId: 'stoneScarab', x: 78, y: 46 },
  { speciesId: 'galeSparrow', x: 16, y: 18 },
  { speciesId: 'galeSparrow', x: 70, y: 22 },
  { speciesId: 'jadeCicada', x: 30, y: 26 },
  { speciesId: 'jadeCicada', x: 14, y: 42 },
];

export function initialWildGu() {
  return WILD_GU_SPAWNS.map((w, i) => ({
    id: `wgu${i}`,
    speciesId: w.speciesId,
    x: w.x, y: w.y, home: { x: w.x, y: w.y },
    hp: SPECIES_BY_ID[w.speciesId].hp,
    gone: false, respawnAt: 0,
  }));
}

// Is this wild Gu present right now? (jade cicadas sing only at night)
export function wildGuActive(w, time) {
  const sp = SPECIES_BY_ID[w.speciesId];
  if (!sp?.nightOnly) return true;
  const m = (((time?.min ?? 0) % 1440) + 1440) % 1440;
  return m >= 21 * 60 || m < 4 * 60;
}

// Combat definition used when the player attacks a wild Gu (initCombat opts.def).
export function wildCombatDef(sp) {
  return {
    id: sp.id, name: T('cap.wildName', { name: locSpeciesName(sp) }), hp: sp.hp, attack: sp.attack, defense: sp.defense, speed: 5,
    abilities: [], weakness: sp.weakness, drops: sp.drops, description: sp.sense,
  };
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Capture chance — configurable, never guaranteed. Weakened targets are easier;
// aptitude, path mastery, better containment and observing all help.
export function captureChanceOf(state, wg, encounter = {}, itemId = null) {
  const cfg = BALANCE.capture;
  const sp = SPECIES_BY_ID[wg.speciesId];
  const gu = GU_BY_ID[sp.guId];
  const p = state.player;
  const hpFrac = clamp(wg.hp / sp.hp, 0, 1);
  const chance = cfg.base
    - sp.captureDifficulty * cfg.perDifficulty
    - (cfg.rarityPenalty[gu.rarity] ?? 0)
    - Math.max(0, sp.rank - p.rank) * cfg.rankGapPenalty
    - hpFrac * cfg.hpFullPenalty
    + (1 - hpFrac) * cfg.weakenBonusMax
    + p.luck * cfg.luckPerPoint
    + (state.mastery?.[sp.path]?.level || 1) * cfg.masteryPerLevel
    + (cfg.jarBonus[itemId] ?? 0)
    + (encounter.observed ? cfg.observeBonus : 0);
  return Math.round(clamp(chance, cfg.min, cfg.max));
}

export const CONDITION_FRAC = (wg) => clamp((wg?.hp ?? 1) / (SPECIES_BY_ID[wg.speciesId]?.hp || 1), 0, 1);
export function conditionLabel(frac) {
  if (frac > 0.85) return 'enc.cond.healthy';
  if (frac > 0.4) return 'enc.cond.weakened';
  if (frac > 0.15) return 'enc.cond.badly';
  return 'enc.cond.dying';
}