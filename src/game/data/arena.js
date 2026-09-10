// PvE arena challenges. Stakes are fictional in-game resources only.
// The challenge record shape is mode-agnostic, so PvP duels can reuse it later.
export const ARENA_CHALLENGES = [
  {
    id: 'novice', name: 'Novice Duel', recRank: 'Rank 1 Early', stake: 50, opponentStake: 50,
    opponent: {
      id: 'arenaRookie', name: 'Rookie Fire Cultivator', hp: 35, attack: 8, defense: 2, speed: 5,
      weakness: 'water', abilities: [], drops: [], description: 'Wields the Flame Spark Gu — raw and unrefined.',
    },
    rewards: { contribution: 10 },
  },
  {
    id: 'veteran', name: 'Veteran Duel', recRank: 'Rank 1 High', stake: 100, opponentStake: 100,
    opponent: {
      id: 'arenaVeteran', name: 'Defensive Earth Cultivator', hp: 60, attack: 9, defense: 7, speed: 4,
      weakness: 'wind', abilities: [], drops: [], description: 'Wields Stone Skin Gu and Earth Wall Gu. A grinding fight.',
    },
    rewards: { contribution: 20 },
  },
  {
    id: 'beast', name: 'Beast Challenge', recRank: 'Rank 1 Peak', stake: 30, opponentStake: 150,
    opponent: {
      id: 'ironfangWolf', name: 'Ironfang Wolf', hp: 55, attack: 12, defense: 3, speed: 7,
      weakness: 'fire', abilities: [], drops: [], recipeDrops: [{ recipeId: 'beastPact', chance: 100 }],
      description: 'A captive Ironfang wolf, hungry and half-mad.',
    },
    rewards: {},
  },
  {
    id: 'elite', name: 'Elite Cultivator Challenge', recRank: 'Rank 2', stake: 200, opponentStake: 200,
    opponent: {
      id: 'arenaElite', name: 'Azure Cloud Disciple', hp: 90, attack: 14, defense: 6, speed: 6,
      weakness: 'none', abilities: [], drops: [], description: 'A visiting sect disciple. Sword, shield and no mercy.',
    },
    rewards: { contribution: 60, items: { essencePill: 1 } },
  },
];

export const ARENA_BY_ID = Object.fromEntries(ARENA_CHALLENGES.map(c => [c.id, c]));