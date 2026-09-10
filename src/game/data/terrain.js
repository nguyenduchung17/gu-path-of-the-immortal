// Battlefield terrain by zone — Gu power shifts with the ground a fight
// stands on. Announced at battle start and applied to that Path's damage.
export const ZONE_TERRAIN = {
  wildForest:         { fire: 10 },
  forestOutskirts:    { fire: 10 },
  deepForest:         { fire: 15 },
  marsh:              { poison: 15, fire: -15 },
  eastHills:          { wind: 15, earth: 10 },
  ruins:              { earth: 10 },
  farmland:           { earth: 5 },
  ironfangTerritory:  { wind: -10 },
};

export const TERRAIN_LABELS = {
  wildForest: 'Deep Woods', forestOutskirts: 'Forest', deepForest: 'Deep Mist Forest',
  marsh: 'Swamp', eastHills: 'Copper Hills', ruins: 'Ancient Ruins',
  farmland: 'Farmland', ironfangTerritory: 'Ironfang Hollow',
};

export function terrainModsOf(zoneId) {
  return ZONE_TERRAIN[zoneId] || null;
}