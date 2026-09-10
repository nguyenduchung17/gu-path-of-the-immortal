// Gu feeding menus — WHAT each Dao Path's Gu eats. A Gu's fare is known the
// moment it joins the collection (never a mystery); WHERE fare is found stays
// an exploration question (merchants, gathering, spoils).
//
// Entry shape:
//   id        — item id (must exist in items.js)
//   satiety   — hunger-meter points restored (cap: BALANCE.hunger.maxSatiety)
//   tier      — 'preferred' (staple, richest) | 'acceptable' (tolerated substitute)
//   protected — quest-critical or precious fare (#7): Auto Feed NEVER touches
//               it; manual feeding remains the player's explicit choice.
import { BALANCE } from '../config/balance';

const BEAST_FARE = [
  { id: 'beastMeat', satiety: 40, tier: 'preferred' },
  { id: 'beastBlood', satiety: 25, tier: 'acceptable' },
];

export const PATH_FOODS = {
  fire: [
    { id: 'flameGrass', satiety: 40, tier: 'preferred' },
    { id: 'fireEssence', satiety: 25, tier: 'acceptable' },
  ],
  water: [
    { id: 'spiritWater', satiety: 40, tier: 'preferred' },
    // moon petals suit water-natured Gu, but they are quest fare — protected
    { id: 'moonPetal', satiety: 25, tier: 'acceptable', protected: true },
  ],
  ice: [
    { id: 'spiritWater', satiety: 40, tier: 'preferred' },
    { id: 'moonPetal', satiety: 25, tier: 'acceptable', protected: true },
  ],
  earth: [
    { id: 'mineralEssence', satiety: 40, tier: 'preferred' },
    // iron ore is Elder Mo's furnace quest fare — protected from Auto Feed
    { id: 'ironOre', satiety: 25, tier: 'acceptable', protected: true },
    { id: 'ore', satiety: 20, tier: 'acceptable' },
  ],
  poison: [
    { id: 'venomSac', satiety: 40, tier: 'preferred' },
    { id: 'serpentGland', satiety: 25, tier: 'acceptable' },
  ],
  wind: BEAST_FARE,
  enslavement: BEAST_FARE,
  sword: BEAST_FARE,
  lightning: BEAST_FARE,
  strength: BEAST_FARE,
  refinement: [
    { id: 'spiritGrass', satiety: 40, tier: 'preferred' },
    // spirit herbs are Auntie Luo's quest fare — protected from Auto Feed
    { id: 'herb', satiety: 20, tier: 'acceptable', protected: true },
  ],
};

// Preferred staple of a path — the legacy single-food view, also the item the
// rank-up refinement cost expects. Falls back to the legacy BALANCE table for
// any path not listed here.
export function preferredFoodOf(path) {
  const list = PATH_FOODS[path];
  const p = list?.find(f => f.tier === 'preferred') || list?.[0];
  return p?.id || BALANCE.hunger.pathFoods[path] || null;
}