// Contribution Exchange — organization rewards bought with Contribution Points.
// Structured per faction so faction-specific ledgers can be added later;
// for now everything draws on the general 'greenValley' ledger.
export const CONTRIBUTION_OFFERS = [
  {
    id: 'co_pills', name: 'Essence Pill ×2', desc: 'Emergency essence stores for deep expeditions.',
    cost: 40, grant: { items: { essencePill: 2 } }, req: {}, faction: 'greenValley',
  },
  {
    id: 'co_petals', name: 'Moon Petal ×3', desc: 'Rare refinement materials from the organization vault.',
    cost: 60, grant: { items: { moonPetal: 3 } }, req: {}, faction: 'greenValley',
  },
  {
    id: 'co_jade', name: 'Jade Marrow Gu Recipe', desc: "Water Path healing knowledge, transcribed by the valley's record keepers.",
    cost: 120, grant: { recipe: 'jadeMarrow' }, req: {}, faction: 'greenValley',
  },
  {
    id: 'co_flameSerpent', name: 'Flame Serpent Gu Recipe', desc: 'Fire Path attack knowledge earned through service.',
    cost: 200, grant: { recipe: 'flameSerpent' }, req: { stageReq: 3 }, faction: 'greenValley',
  },
  {
    id: 'co_beastPact', name: 'Beast Pact Gu Recipe', desc: 'Enslavement Path summoning knowledge — granted only to trusted hands.',
    cost: 300, grant: { recipe: 'beastPact' }, req: { mastery: { path: 'enslavement', level: 3 } }, faction: 'greenValley',
  },
  {
    id: 'co_gale', name: 'Gale Blade Gu Recipe', desc: "Wind Path blade knowledge. The vault's greatest prize.",
    cost: 650, grant: { recipe: 'galeBlade' }, req: { stageReq: 9, mastery: { path: 'wind', level: 4 } }, faction: 'greenValley',
  },
  {
    id: 'co_bp_flameGale', name: 'Blueprint: Flame Gale', desc: 'A Killer Move design — fuse a Fire core with a swift companion.',
    cost: 80, grant: { blueprint: 'flameGale' }, req: { stageReq: 2 }, faction: 'greenValley',
  },
  {
    id: 'co_bp_thunderBind', name: 'Blueprint: Thunder Bind', desc: 'A Killer Move design — a paralyzing storm that binds the foe.',
    cost: 150, grant: { blueprint: 'thunderBind' }, req: { stageReq: 4 }, faction: 'greenValley',
  },
];