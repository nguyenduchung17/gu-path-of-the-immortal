// Tutorial progression — recorded by the outer gameReducer wrapper after
// every action, so guided lessons advance from real play, never scripts.
import { TUTORIAL_STEPS, TIP_DEFS } from '../data/tutorial';

// Progression counters, written only while the tutorial is running.
export function tutorialObserve(state, action) {
  const tut = state && state.tutorial;
  if (!tut || tut.completed || tut.skipped || !tut.active) return state;
  let patch = null;
  switch (action.type) {
    case 'MOVE': patch = { moves: (tut.moves || 0) + 1 }; break;
    case 'TALK_NPC': patch = { talkedNpc: true }; break;
    case 'END_COMBAT': patch = { foughtOnce: true }; break;
    case 'ACCEPT_QUEST': patch = { questAccepted: true }; break;
    case 'SLEEP_INN': patch = { sleptOnce: true }; break;
    default: return state;
  }
  return { ...state, tutorial: { ...tut, ...patch } };
}

// Has the current lesson's own trigger been met? (Panel lessons advance via
// TUTORIAL_PANEL instead — they are UI events, not state predicates.)
export function tutorialStepMet(state) {
  const tut = state.tutorial;
  if (!tut?.active || tut.completed) return false;
  const step = TUTORIAL_STEPS[tut.step];
  return !!(step && !step.panel && step.check && step.check(state));
}

// First contextual tip whose moment has come (shown one at a time).
export function dueTip(state) {
  const tut = state.tutorial;
  if (!tut || tut.welcome || tut.currentTip || state.deceased) return null;
  for (const tip of TIP_DEFS) {
    if (!tut.tipsSeen?.[tip.id] && tip.due(state)) return tip;
  }
  return null;
}