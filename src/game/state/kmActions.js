// Compatibility bridge for an older reducer import retained by a stale build.
// The single source of truth remains engine/killerMoves.js.
import { kmAction } from '../engine/killerMoves';

export function kmActions(state, action) {
  const next = kmAction(state, action);
  return next === undefined ? null : next;
}