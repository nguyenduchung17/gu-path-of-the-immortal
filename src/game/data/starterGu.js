// Starter Gu — the one Gu a new cultivator begins with. The roster spans
// EIGHT combat philosophies, one per Dao Path, so the choice is "which
// fighting style do I enjoy?" — never "damage versus utility". All options
// are rank 1, immediately useful, roughly equal in total value, and each
// teaches a different mechanic.
import { GU_BY_ID } from './gu';

export const STARTER_GU = [
  { guId: 'emberFang', icon: '🔥', key: 'emberFang' },
  { guId: 'sparkNeedle', icon: '⚡', key: 'sparkNeedle' },
  { guId: 'flowingDrop', icon: '💧', key: 'flowingDrop' },
  { guId: 'frostNeedle', icon: '❄️', key: 'frostNeedle' },
  { guId: 'venomNeedle', icon: '☠️', key: 'venomNeedle' },
  { guId: 'swiftFang', icon: '🌪️', key: 'swiftFang' },
  { guId: 'stoneFist', icon: '🪨', key: 'stoneFist' },
  { guId: 'ironEdge', icon: '⚔️', key: 'ironEdge' },
];

export const DEFAULT_STARTER_GU = 'emberFang';

export function starterGuOf(guId) {
  return GU_BY_ID[guId] || GU_BY_ID[DEFAULT_STARTER_GU];
}