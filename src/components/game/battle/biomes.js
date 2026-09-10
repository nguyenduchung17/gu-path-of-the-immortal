// Battle biomes — the battle backdrop matches the zone where the encounter
// happened, so fights feel like they belong to the world being explored.
export const BIOMES = {
  town: {
    id: 'town', labelKey: 'biome.town',
    sky: 'linear-gradient(180deg, #1a2230 0%, #26303e 52%, #3a4640 53%, #2c352c 100%)',
    midline: 'repeating-linear-gradient(90deg, #33404a 0 8px, #2a3640 8px 16px)',
    ground: 'repeating-linear-gradient(90deg, #3d4a3a 0 5px, #364234 5px 10px)',
  },
  arena: {
    id: 'arena', labelKey: 'biome.arena',
    sky: 'linear-gradient(180deg, #241c12 0%, #33281a 52%, #4a3a24 53%, #3a2e1e 100%)',
    midline: 'repeating-linear-gradient(90deg, #4a3018 0 8px, #3a2413 8px 16px)',
    ground: 'repeating-linear-gradient(90deg, #5a4830 0 5px, #4e3e28 5px 10px)',
  },
  forest: {
    id: 'forest', labelKey: 'biome.forest',
    sky: 'linear-gradient(180deg, #101828 0%, #16222c 52%, #243524 53%, #1c2a1c 100%)',
    midline: 'repeating-linear-gradient(90deg, #14291a 0 8px, #0f2015 8px 16px)',
    ground: 'repeating-linear-gradient(90deg, #2c4228 0 5px, #263a22 5px 10px)',
  },
  deepForest: {
    id: 'deepForest', labelKey: 'biome.deepForest',
    sky: 'linear-gradient(180deg, #0a1220 0%, #0e1c1a 52%, #16301e 53%, #0e1c12 100%)',
    midline: 'repeating-linear-gradient(90deg, #0c2416 0 7px, #081a10 7px 14px)',
    ground: 'repeating-linear-gradient(90deg, #1c3322 0 5px, #16291b 5px 10px)',
    mist: 'rgba(140,180,170,0.10)',
  },
  plains: {
    id: 'plains', labelKey: 'biome.plains',
    sky: 'linear-gradient(180deg, #16243c 0%, #22344a 52%, #3d5340 53%, #31452e 100%)',
    midline: 'repeating-linear-gradient(90deg, #2c3f30 0 9px, #253629 9px 18px)',
    ground: 'repeating-linear-gradient(90deg, #3c5236 0 5px, #354a30 5px 10px)',
  },
  farmland: {
    id: 'farmland', labelKey: 'biome.farmland',
    sky: 'linear-gradient(180deg, #1c2a3a 0%, #2c3c48 52%, #4a5c38 53%, #3a4a2c 100%)',
    midline: 'repeating-linear-gradient(90deg, #3a4c2c 0 10px, #324426 10px 20px)',
    ground: 'repeating-linear-gradient(90deg, #4c5c34 0 5px, #44502c 5px 10px)',
  },
  ruins: {
    id: 'ruins', labelKey: 'biome.ruins',
    sky: 'linear-gradient(180deg, #14182a 0%, #20243a 52%, #333848 53%, #262a36 100%)',
    midline: 'repeating-linear-gradient(90deg, #2e3244 0 9px, #262a3a 9px 18px)',
    ground: 'repeating-linear-gradient(90deg, #343a48 0 5px, #2c303c 5px 10px)',
    mist: 'rgba(150,160,200,0.10)',
  },
  mountain: {
    id: 'mountain', labelKey: 'biome.mountain',
    sky: 'linear-gradient(180deg, #101826 0%, #1a2434 52%, #3a3428 53%, #2c2a22 100%)',
    midline: 'repeating-linear-gradient(90deg, #3a3226 0 10px, #302a20 10px 20px)',
    ground: 'repeating-linear-gradient(90deg, #443c2c 0 5px, #3a3428 5px 10px)',
  },
  swamp: {
    id: 'swamp', labelKey: 'biome.swamp',
    sky: 'linear-gradient(180deg, #101c1a 0%, #16262a 52%, #22382e 53%, #16261e 100%)',
    midline: 'repeating-linear-gradient(90deg, #1c3026 0 9px, #142420 9px 18px)',
    ground: 'repeating-linear-gradient(90deg, #26382a 0 5px, #1e2e24 5px 10px)',
    mist: 'rgba(120,200,180,0.10)',
  },
  camp: {
    id: 'camp', labelKey: 'biome.camp',
    sky: 'linear-gradient(180deg, #1a1410 0%, #2a2018 52%, #3c2e20 53%, #2c2418 100%)',
    midline: 'repeating-linear-gradient(90deg, #3a2c1c 0 8px, #302416 8px 16px)',
    ground: 'repeating-linear-gradient(90deg, #42352a 0 5px, #382e24 5px 10px)',
  },
  dark: {
    id: 'dark', labelKey: 'biome.dark',
    sky: 'linear-gradient(180deg, #0a0a18 0%, #14102a 52%, #1c1830 53%, #120e22 100%)',
    midline: 'repeating-linear-gradient(90deg, #170f22 0 8px, #0e0a16 8px 16px)',
    ground: 'repeating-linear-gradient(90deg, #221a30 0 5px, #1a1426 5px 10px)',
  },
};

const ZONE_BIOME = {
  greenValleyTown: 'town',
  willowHamlet: 'town',
  farmland: 'farmland',
  forestOutskirts: 'forest',
  wildForest: 'forest',
  deepForest: 'deepForest',
  ruins: 'ruins',
  southernWilds: 'plains',
  eastHills: 'mountain',
  eastPlains: 'plains',
  marsh: 'swamp',
  banditCamp: 'camp',
  ironfangTerritory: 'dark',
};

export function biomeOf(zoneId, isArena) {
  if (isArena) return BIOMES.arena;
  return BIOMES[ZONE_BIOME[zoneId]] || BIOMES.plains;
}