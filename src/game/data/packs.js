// Species social behavior — the wilds are an ecology, not a scatter of loners.
//   cohesion:    world tiles a member strays from its pack anchor before
//                wandering home; members drift back when separated (#7)
//   assistRadius: how far a packmate may be from an engaged member to join
//                the battle — nobody teleports in from across the map (#3)
//   leader:      the stronger species def that may head a pack (#8)
//   leaderBuff:  applied to packmates while the leader lives (#11)
// Group SIZES live in the spawn sites (world.js SPAWN_CELLS) — wolves 3–4,
// boars 2–3, bandit patrols 4 + chief, spider nests 2–3, hounds 3; large
// solitary predators spawn alone (#4, #5).
export const SOCIAL = {
  wildWolf:       { cohesion: 3, assistRadius: 12 },
  wildBoar:       { cohesion: 2, assistRadius: 10 },
  bandit:         { cohesion: 3, assistRadius: 12 },
  banditChief:    { cohesion: 3, assistRadius: 12 },
  poisonSpider:   { cohesion: 2, assistRadius: 10 },
  bloodCrow:      { cohesion: 3, assistRadius: 10 },
  shadowHound:    { cohesion: 3, assistRadius: 12 },
  ironfangAlpha:  { cohesion: 3, assistRadius: 14 },
};
export const socialOf = (defId) => SOCIAL[defId] || { cohesion: 3, assistRadius: 10 };

// Pack leaders — visibly stronger variants of local species (#8). NOT major
// bosses (#44): no elite mechanics, just a hard head on a local pack.
export const LEADER_BUFF = {
  ironfangAlpha: { speedPct: 10, dmgPct: 5 },
  banditChief: { speedPct: 0, dmgPct: 10 },
};
export const isLeaderDef = (defId) => !!LEADER_BUFF[defId];

// Which species a leader def organizes — used by save migration to bind
// existing world records into packs (alpha → wolves, chief → bandits).
export const LEADER_LINKS = { ironfangAlpha: 'wildWolf', banditChief: 'bandit' };

// Morale — the simple Leader-Defeated debuff (#31): surviving packmates lose
// 15% damage and 10% speed when the leader falls mid-battle.
export const LEADER_DOWN = { dmgPct: 15, speedPct: 10 };