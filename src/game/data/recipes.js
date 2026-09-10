// Gu Recipes — collectible knowledge. A recipe is required to refine its Gu.
// Sources: shop / drop / quest / event / milestone (auto-granted at Path mastery level).
//
// KNOWLEDGE TIERS — undiscovered recipes are a knowledge journal, not a
// walkthrough. The player only ever sees:
//   rumored    → "Unknown Recipe" + a vague rumor (no names, no places, no path)
//   identified → recipe name + path + type + a general connection
//   located    → + a reliable lead naming its source (no coordinates)
// The old exact-source `hint` text now lives ONLY in `lead`, reachable after
// in-game discovery. Full detail (materials, costs, chance) shows once acquired.
export const RECIPES = [
  {
    id: 'emberGu', guId: 'emberGu', path: 'fire', masteryReq: 1, stageReq: 0,
    materials: { fireEssence: 2, beastCore: 1 }, essence: 15, stones: 20,
    rumor: 'Valley folk say the first spark can be bound by those who know the binding words.',
    clue: 'A beginner fire recipe — valley Gu merchants are said to carry it.',
    lead: 'Sold by Gu Master Bai in Green Valley Town.',
  },
  {
    id: 'flameSerpent', guId: 'flameSerpent', path: 'fire', masteryReq: 2, stageReq: 3,
    materials: { fireEssence: 5, beastCore: 2 }, essence: 25, stones: 60,
    rumor: 'A peddler walks the mist-forest trails with serpentfire knowledge in his pack — so the road-talk goes.',
    clue: 'A mid-rank fire recipe connected to a traveling Gu peddler — and, some say, to the serpents of the deep forest.',
    lead: 'Sold by Gu Peddler Wan in Willow Hamlet; the serpents of the Mist Forest sometimes carry it.',
  },
  {
    id: 'scarletInferno', guId: 'scarletInferno', path: 'fire', masteryReq: 5, stageReq: 8,
    materials: { fireEssence: 12, beastCore: 6, moonPetal: 3 }, essence: 45, stones: 180, milestoneLevel: 5,
    rumor: 'Fire masters whisper of a scripture that reveals itself only to true devotion.',
    clue: 'It is said to reveal itself to Masters of the Fire Path.',
    lead: 'Granted at Fire Mastery Level 5.',
  },
  {
    id: 'windStep', guId: 'windStep', path: 'wind', masteryReq: 1, stageReq: 1,
    materials: { spiritGrass: 3 }, essence: 12, stones: 25,
    rumor: 'Somewhere in the valley, they teach the first step of riding the wind.',
    clue: 'A beginner wind recipe stocked by valley Gu merchants.',
    lead: 'Sold by Gu Master Bai in Green Valley Town.',
  },
  {
    id: 'galeBlade', guId: 'galeBlade', path: 'wind', masteryReq: 2, stageReq: 2,
    materials: { windCrystal: 2, beastBlood: 2 }, essence: 20, stones: 50,
    rumor: 'Certain markets trade in forbidden wind-steel — where no questions are asked.',
    clue: 'A wind recipe said to circulate in a market that does not exist.',
    lead: 'A prize of the Black Market (The Broker).',
  },
  {
    id: 'tempestGu', guId: 'tempestGu', path: 'wind', masteryReq: 4, stageReq: 6,
    materials: { windCrystal: 5, beastCore: 3 }, essence: 35, stones: 120, milestoneLevel: 4,
    rumor: 'Deep mastery of wind is said to birth a storm scripture on its own.',
    clue: 'It reveals itself to Experts of the Wind Path.',
    lead: 'Granted at Wind Mastery Level 4; the Ironfang vault mission also carries it.',
  },
  {
    id: 'stoneShell', guId: 'stoneShell', path: 'earth', masteryReq: 1, stageReq: 1,
    materials: { ore: 4 }, essence: 15, stones: 25,
    rumor: 'They say a valley shop sells the first stone-skin binding.',
    clue: 'A beginner earth recipe stocked by valley Gu merchants.',
    lead: 'Sold by Gu Master Bai in Green Valley Town.',
  },
  {
    id: 'mountainGuard', guId: 'mountainGuard', path: 'earth', masteryReq: 3, stageReq: 5,
    materials: { ore: 5, ironOre: 4 }, essence: 30, stones: 90,
    rumor: 'The Gu Master is said to reward those who cull the stone menace.',
    clue: 'An earth recipe tied to a valley task involving stone beasts.',
    lead: 'Rewarded by Gu Master Bai for completing The Stone Menace.',
  },
  {
    id: 'vitalSpring', guId: 'vitalSpring', path: 'water', masteryReq: 1, stageReq: 0,
    materials: { herb: 4, spiritGrass: 2 }, essence: 12, stones: 15,
    rumor: 'A herbalist of the valley brews healing water into Gu — or so the sick swear.',
    clue: 'A water recipe carried by a valley herbalist.',
    lead: 'Sold by Auntie Luo the herbalist, Green Valley Town.',
  },
  {
    id: 'tideBinding', guId: 'tideBinding', path: 'water', masteryReq: 2, stageReq: 3,
    materials: { moonPetal: 2, shadowSilk: 2 }, essence: 20, stones: 60,
    rumor: 'A sealed scroll lies hidden in a cave off the forest trail — the tavern drunks insist it.',
    clue: 'A water recipe, part merchant stock, part lost in the wilds.',
    lead: 'Sold by Gu Peddler Wan in Willow Hamlet; hidden in a cave off the forest trail.',
  },
  {
    id: 'mistVeil', guId: 'mistVeil', path: 'water', masteryReq: 3, stageReq: 4,
    materials: { mistSilk: 4, shadowSilk: 2 }, essence: 25, stones: 80, milestoneLevel: 3,
    rumor: 'Water adepts speak of a veil that reveals itself only to the skilled.',
    clue: 'It reveals itself to the Skilled of the Water Path.',
    lead: 'Granted at Water Mastery Level 3.',
  },
  {
    id: 'jadeMarrow', guId: 'jadeMarrow', path: 'water', masteryReq: 2, stageReq: 5,
    materials: { moonPetal: 3, herb: 3 }, essence: 20, stones: 50,
    rumor: 'Somewhere in the valley, jade-touched healing water is bound into Gu.',
    clue: 'A water recipe carried by a valley herbalist.',
    lead: 'Sold by Auntie Luo the herbalist; the Contribution Exchange also transcribes it.',
  },
  {
    id: 'beastPact', guId: 'beastPact', path: 'enslavement', masteryReq: 2, stageReq: 3,
    materials: { beastBlood: 3, beastCore: 2 }, essence: 25, stones: 70,
    rumor: 'Forbidden markets trade in beast-binding pacts.',
    clue: 'An enslavement recipe circulating where no questions are asked.',
    lead: 'A prize of the Black Market (The Broker); the arena\u2019s captive wolf carries it too.',
  },
  {
    id: 'serpentSwarm', guId: 'serpentSwarm', path: 'enslavement', masteryReq: 3, stageReq: 6,
    materials: { serpentGland: 3, beastCore: 4 }, essence: 35, stones: 110, milestoneLevel: 3,
    rumor: 'Beast adepts speak of a swarm scripture earned through pacts.',
    clue: 'It reveals itself to the Skilled of the Enslavement Path.',
    lead: 'Granted at Enslavement Mastery Level 3.',
  },
  {
    id: 'flyingSword', guId: 'flyingSword', path: 'sword', masteryReq: 2, stageReq: 4,
    materials: { ironOre: 4, windCrystal: 2 }, essence: 30, stones: 90,
    rumor: 'Rumors mention an old swordsman somewhere beyond the northern ridge.',
    clue: 'May be connected to a hidden Sword cultivator.',
    lead: 'Taught by Master Jian, the hidden sword cultivator by the waterfall.',
  },
  {
    id: 'insightEye', guId: 'insightEye', path: 'refinement', masteryReq: 2, stageReq: 2,
    materials: { herb: 3, beastCore: 1 }, essence: 15, stones: 40,
    rumor: 'A refiner in the valley is said to see through the furnace\u2019s flame.',
    clue: 'May be connected to a refinement master of Green Valley Town.',
    lead: 'Taught by Elder Mo, the refinement master of Green Valley Town.',
  },
  // ---- Pack warfare: single-target & AoE recipes (#10 — leaders carry them) ----
  {
    id: 'flameWave', guId: 'flameWave', path: 'fire', masteryReq: 2, stageReq: 4,
    materials: { fireEssence: 4, beastBlood: 2 }, essence: 24, stones: 70,
    rumor: 'They say the alpha of the Ironfang pack carries a scroll of rolling fire.',
    clue: 'A fire recipe connected to the leader of a northern wolf pack.',
    lead: 'Carried by the Ironfang Alpha, deep in the northern forest.',
  },
  {
    id: 'swordArc', guId: 'swordArc', path: 'sword', masteryReq: 2, stageReq: 4,
    materials: { ironOre: 3, beastCore: 2 }, essence: 24, stones: 70,
    rumor: 'The bandit chief of the northeast is said to keep a sweeping-cut manual as a trophy.',
    clue: 'A sword recipe in the hands of a bandit leader.',
    lead: 'Kept by the Bandit Chief at the northeast camp.',
  },
  {
    id: 'piercingEdge', guId: 'piercingEdge', path: 'sword', masteryReq: 3, stageReq: 5,
    materials: { ironOre: 5, windCrystal: 2, beastCore: 2 }, essence: 30, stones: 100,
    rumor: 'They say there is a thrust that ignores armor — and the bandit chief reads.',
    clue: 'A rare sword recipe of the bandit leader, scarcer than his cut.',
    lead: 'Sometimes carried by the Bandit Chief; the Black Market whispers of it too.',
  },
  {
    id: 'chainBolt', guId: 'chainBolt', path: 'lightning', masteryReq: 2, stageReq: 4,
    materials: { beastBlood: 2, beastCore: 2 }, essence: 24, stones: 70,
    rumor: 'Shadow hounds are said to carry a spark that jumps the whole pack.',
    clue: 'A lightning recipe sometimes hidden within the shadow hounds.',
    lead: 'Shadow hounds of the deep forest and ruins sometimes carry it.',
  },
  {
    id: 'toxicMist', guId: 'toxicMist', path: 'poison', masteryReq: 2, stageReq: 3,
    materials: { serpentGland: 2, herb: 3 }, essence: 20, stones: 60,
    rumor: 'Spiders of the mist breathe a fog that learns.',
    clue: 'A poison recipe hidden within the mist spiders.',
    lead: 'Mist spiders of the wild forest and the marsh carry it.',
  },
  {
    id: 'galeStorm', guId: 'galeStorm', path: 'wind', masteryReq: 2, stageReq: 4,
    materials: { windCrystal: 3, beastBlood: 2 }, essence: 24, stones: 70,
    rumor: 'Blood crows carry back feathers that cut the wind.',
    clue: 'A wind recipe sometimes held by blood crows.',
    lead: 'Blood crows of the hills and plains carry it.',
  },
  {
    id: 'frostField', guId: 'frostField', path: 'ice', masteryReq: 2, stageReq: 4,
    materials: { moonPetal: 3, shadowSilk: 2 }, essence: 22, stones: 65, milestoneLevel: 3,
    rumor: 'Ice adepts of old spoke of a field of dead-still frost.',
    clue: 'It reveals itself to the Skilled of the Ice Path.',
    lead: 'Granted at Ice Mastery Level 3.',
  },
  {
    id: 'earthTremor', guId: 'earthTremor', path: 'earth', masteryReq: 2, stageReq: 4,
    materials: { ore: 5, beastCore: 2 }, essence: 24, stones: 70, milestoneLevel: 3,
    rumor: 'Earth masters of old heard the ground tremble at their call.',
    clue: 'It reveals itself to the Skilled of the Earth Path.',
    lead: 'Granted at Earth Mastery Level 3.',
  },
  {
    id: 'phantomTide', guId: 'phantomTide', path: 'water', masteryReq: 3, stageReq: 6,
    materials: { mistHeart: 1, mistSilk: 3, moonPetal: 3 }, essence: 40, stones: 150,
    rumor: 'Deep in the mist, something ancient keeps water-forged knowledge.',
    clue: 'A water recipe carried by an elite horror of the deep forest.',
    lead: 'Carried within the heart of the Mist Devourer, deep in the Mist Forest.',
  },
  {
    id: 'jadeColossus', guId: 'jadeColossus', path: 'earth', masteryReq: 3, stageReq: 6,
    materials: { wardenCore: 1, ironOre: 4, ore: 4 }, essence: 38, stones: 140,
    rumor: 'The old ruins are said to guard rune-knowledge of stone giants.',
    clue: 'An earth recipe bound into the runes of the ruins\u2019 elite warden.',
    lead: 'The rune-glyphs are pried from the Ruin Warden\u2019s core.',
  },
  {
    id: 'nightSwarm', guId: 'nightSwarm', path: 'enslavement', masteryReq: 3, stageReq: 6,
    materials: { dreadMarrow: 1, serpentGland: 2, beastBlood: 4 }, essence: 36, stones: 130,
    rumor: 'In the deep north, a brood-mother\u2019s marrow holds a pact.',
    clue: 'An enslavement recipe written in an elite horror\u2019s marrow.',
    lead: 'A pact written in the Dread Matriarch\u2019s own marrow.',
  },
  // ---- Strength Path (Lực Đạo): the three phantom Killer Moves ----
  // Each reveals itself as body-forging mastery deepens (milestone grants).
  {
    id: 'giantFistPhantom', guId: 'giantFistPhantom', path: 'strength', masteryReq: 3, stageReq: 5,
    materials: { beastCore: 3, ironOre: 3, beastBlood: 2 }, essence: 30, stones: 90, milestoneLevel: 3,
    rumor: 'Body-forgers speak of a phantom fist that answers only those who strike true.',
    clue: 'It reveals itself to the Skilled of the Strength Path.',
    lead: 'Granted at Strength Mastery Level 3.',
  },
  {
    id: 'rhinoCharge', guId: 'rhinoCharge', path: 'strength', masteryReq: 4, stageReq: 6,
    materials: { ironOre: 5, beastCore: 3, beastBlood: 3 }, essence: 35, stones: 120, milestoneLevel: 4,
    rumor: 'Old hunters swear a beast of spirit-light once shattered a stone gate in one charge.',
    clue: 'It reveals itself to Experts of the Strength Path.',
    lead: 'Granted at Strength Mastery Level 4.',
  },
  {
    id: 'bullRushPhantom', guId: 'bullRushPhantom', path: 'strength', masteryReq: 5, stageReq: 8,
    materials: { beastBlood: 4, beastCore: 4, ironOre: 4 }, essence: 40, stones: 150, milestoneLevel: 5,
    rumor: 'The wildest of the body-forging scriptures is said to trample whole lines of foes.',
    clue: 'It is said to reveal itself only to Masters of the Strength Path.',
    lead: 'Granted at Strength Mastery Level 5.',
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));