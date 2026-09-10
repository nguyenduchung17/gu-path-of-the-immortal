// Staged tutorial — short lessons taught by playing, not by walls of text.
// Each step knows its own completion trigger (a state predicate, or the UI
// panel the player must open); GameScreen dispatches TUTORIAL_STEP /
// TUTORIAL_PANEL when it observes the trigger. All display text lives in
// i18n keys (tut.<id>.*) — never hardcoded here.

// Starter supplies — granted for finishing the tutorial AND for skipping it,
// so no one feels forced to play through just for the rewards.
export const TUTORIAL_SUPPLIES = { ration: 2, herb: 2, beastCore: 1 };
export const TUTORIAL_STONES = 10;

import { GU_BY_ID } from './gu';
import { rolesOf } from './roles';

// lines = number of tut.<id>.lN keys the lesson card renders.
export const TUTORIAL_STEPS = [
  { id: 'move', lines: 1, check: s => (s.tutorial?.moves || 0) >= 6 },
  { id: 'interact', lines: 2, check: s => !!s.tutorial?.talkedNpc },
  { id: 'hpEssence', lines: 3 },
  { id: 'aperture', lines: 2, panel: 'cultivation' },
  { id: 'cultivate', lines: 3, check: s => (s.player?.cultivationProgress || 0) > 0 },
  { id: 'aptitude', lines: 3 },
  { id: 'gu', lines: 2, panel: 'gu' },
  { id: 'vitalGu', lines: 2 },
  { id: 'combat', lines: 3, check: s => !!s.tutorial?.foughtOnce },
  { id: 'roles', lines: 3 },
  { id: 'quests', lines: 2, check: s => !!s.tutorial?.questAccepted },
  { id: 'mapFog', lines: 2, panel: 'map' },
  { id: 'inn', lines: 2, check: s => !!s.tutorial?.sleptOnce },
  { id: 'death', lines: 1 },
  { id: 'done' },
];

// One-time contextual tips — advanced systems explained the moment they
// first touch the player, whatever the state of the main tutorial.
// The Killer Move tip (#22, #23, #47): the moment the player CAN research —
// two owned Gu, one able to lead — the door is pointed out. No wall of text.
export const TIP_DEFS = [
  { id: 'killerMoves', due: s => (s.ownedGu || []).length >= 2 && !(s.killerMoves?.known || []).length
    && (s.ownedGu || []).some(g => rolesOf(GU_BY_ID[g.guId]).includes('attack')) },
  // One tip per Dao Path — only the player's OWN starter path ever becomes
  // due (it is knownPaths[0]), so the tutorial explains exactly the mechanic
  // their first Gu uses, never all the paths at once.
  { id: 'pathFire', due: s => (s.tutorial?.moves || 0) >= 3 && (s.knownPaths || [])[0] === 'fire' },
  { id: 'pathLightning', due: s => (s.tutorial?.moves || 0) >= 3 && (s.knownPaths || [])[0] === 'lightning' },
  { id: 'pathWater', due: s => (s.tutorial?.moves || 0) >= 3 && (s.knownPaths || [])[0] === 'water' },
  { id: 'pathIce', due: s => (s.tutorial?.moves || 0) >= 3 && (s.knownPaths || [])[0] === 'ice' },
  { id: 'pathPoison', due: s => (s.tutorial?.moves || 0) >= 3 && (s.knownPaths || [])[0] === 'poison' },
  { id: 'pathWind', due: s => (s.tutorial?.moves || 0) >= 3 && (s.knownPaths || [])[0] === 'wind' },
  { id: 'pathEarth', due: s => (s.tutorial?.moves || 0) >= 3 && (s.knownPaths || [])[0] === 'earth' },
  { id: 'pathStrength', due: s => (s.tutorial?.moves || 0) >= 3 && (s.knownPaths || [])[0] === 'strength' },
  { id: 'pathSword', due: s => (s.tutorial?.moves || 0) >= 3 && (s.knownPaths || [])[0] === 'sword' },
  { id: 'pathEnslavement', due: s => (s.tutorial?.moves || 0) >= 3 && (s.knownPaths || [])[0] === 'enslavement' },
  { id: 'pathRefinement', due: s => (s.tutorial?.moves || 0) >= 3 && (s.knownPaths || [])[0] === 'refinement' },
  { id: 'night', due: s => { const m = (s.time || {}).min ?? 0; return m >= 18 * 60 || m < 5 * 60; } },
  { id: 'hunger', due: s => (s.ownedGu || []).some(g => s.vitalGu !== g.instanceId && (g.satiety ?? 100) < 40) },
  { id: 'wildGu', due: s => !!s.wildEncounter },
  { id: 'mastery', due: s => Object.values(s.mastery || {}).some(m => (m?.level || 1) >= 2) },
  { id: 'refine', due: s => (s.knownRecipes || []).length > 0 },
  { id: 'contribution', due: s => (s.missions?.completed || []).length > 0 },
];

export const CODEX_TOPICS = [
  'essence', 'cultivation', 'insight', 'aptitude', 'gu', 'vitalGu', 'paths',
  'killerMove', 'kmCreate', 'refinement', 'hunger', 'death', 'fog', 'scouting', 'wildGu', 'contribution',
];