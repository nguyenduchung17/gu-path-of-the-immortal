// Starter Gu — the one Gu a new cultivator begins with. All options are rank 1,
// useful, and roughly equal in value; they differ in playstyle and shape the
// player's early Dao Mastery progression.
import { GU_BY_ID } from './gu';

export const STARTER_GU = [
  { guId: 'flameSpark', icon: '🔥', key: 'flameSpark' },
  { guId: 'swiftFang', icon: '🌪️', key: 'swiftFang' },
  { guId: 'stoneSkin', icon: '🪨', key: 'stoneSkin' },
  { guId: 'healingDew', icon: '💧', key: 'healingDew' },
  { guId: 'beastCall', icon: '🐉', key: 'beastCall' },
  { guId: 'spiritMoth', icon: '🦋', key: 'spiritMoth' },
];

export const DEFAULT_STARTER_GU = 'swiftFang';

export function starterGuOf(guId) {
  return GU_BY_ID[guId] || GU_BY_ID[DEFAULT_STARTER_GU];
}