// Gu Recipes — collectible knowledge. A recipe is required to refine its Gu.
// Sources: shop / drop / quest / event / milestone (auto-granted at Path mastery level).
export const RECIPES = [
  { id: 'emberGu', guId: 'emberGu', path: 'fire', masteryReq: 1, stageReq: 0, materials: { fireEssence: 2, beastCore: 1 }, essence: 15, stones: 20, hint: 'Sold by Gu Master Bai in Green Valley.' },
  { id: 'flameSerpent', guId: 'flameSerpent', path: 'fire', masteryReq: 2, stageReq: 3, materials: { fireEssence: 5, beastCore: 2 }, essence: 25, stones: 60, hint: 'Sold by Gu Peddler Wan in Willow Hamlet; also carried by the serpents of the Mist Forest.' },
  { id: 'scarletInferno', guId: 'scarletInferno', path: 'fire', masteryReq: 5, stageReq: 8, materials: { fireEssence: 12, beastCore: 6, moonPetal: 3 }, essence: 45, stones: 180, milestoneLevel: 5, hint: 'Grants itself to Masters of the Fire Path.' },
  { id: 'windStep', guId: 'windStep', path: 'wind', masteryReq: 1, stageReq: 1, materials: { spiritGrass: 3 }, essence: 12, stones: 25, hint: 'Sold by Gu Master Bai in Green Valley Town.' },
  { id: 'galeBlade', guId: 'galeBlade', path: 'wind', masteryReq: 2, stageReq: 2, materials: { windCrystal: 2, beastBlood: 2 }, essence: 20, stones: 50, hint: 'A prize of the Black Market.' },
  { id: 'tempestGu', guId: 'tempestGu', path: 'wind', masteryReq: 4, stageReq: 6, materials: { windCrystal: 5, beastCore: 3 }, essence: 35, stones: 120, milestoneLevel: 4, hint: 'Grants itself to Experts of the Wind Path.' },
  { id: 'stoneShell', guId: 'stoneShell', path: 'earth', masteryReq: 1, stageReq: 1, materials: { ore: 4 }, essence: 15, stones: 25, hint: 'Sold by Gu Master Bai in Green Valley.' },
  { id: 'mountainGuard', guId: 'mountainGuard', path: 'earth', masteryReq: 3, stageReq: 5, materials: { ore: 5, ironOre: 4 }, essence: 30, stones: 90, hint: 'Rewarded by Gu Master Bai for culling the Stone Menace.' },
  { id: 'vitalSpring', guId: 'vitalSpring', path: 'water', masteryReq: 1, stageReq: 0, materials: { herb: 4, spiritGrass: 2 }, essence: 12, stones: 15, hint: 'Sold by Auntie Luo the herbalist.' },
  { id: 'tideBinding', guId: 'tideBinding', path: 'water', masteryReq: 2, stageReq: 3, materials: { moonPetal: 2, shadowSilk: 2 }, essence: 20, stones: 60, hint: 'Sold by Gu Peddler Wan in Willow Hamlet; also hidden in a cave off the forest trail.' },
  { id: 'mistVeil', guId: 'mistVeil', path: 'water', masteryReq: 3, stageReq: 4, materials: { mistSilk: 4, shadowSilk: 2 }, essence: 25, stones: 80, milestoneLevel: 3, hint: 'Grants itself to the Skilled of the Water Path.' },
  { id: 'jadeMarrow', guId: 'jadeMarrow', path: 'water', masteryReq: 2, stageReq: 5, materials: { moonPetal: 3, herb: 3 }, essence: 20, stones: 50, hint: 'Sold by Auntie Luo the herbalist.' },
  { id: 'beastPact', guId: 'beastPact', path: 'enslavement', masteryReq: 2, stageReq: 3, materials: { beastBlood: 3, beastCore: 2 }, essence: 25, stones: 70, hint: 'A prize of the Black Market.' },
  { id: 'serpentSwarm', guId: 'serpentSwarm', path: 'enslavement', masteryReq: 3, stageReq: 6, materials: { serpentGland: 3, beastCore: 4 }, essence: 35, stones: 110, milestoneLevel: 3, hint: 'Grants itself to the Skilled of the Enslavement Path.' },
  { id: 'flyingSword', guId: 'flyingSword', path: 'sword', masteryReq: 2, stageReq: 4, materials: { ironOre: 4, windCrystal: 2 }, essence: 30, stones: 90, hint: 'Taught by Master Jian, the hidden sword cultivator by the waterfall.' },
  { id: 'insightEye', guId: 'insightEye', path: 'refinement', masteryReq: 2, stageReq: 2, materials: { herb: 3, beastCore: 1 }, essence: 15, stones: 40, hint: 'Taught by Elder Mo, the refinement master of Green Valley Town.' },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));