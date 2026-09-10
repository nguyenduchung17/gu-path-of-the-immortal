import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
// Canonical card for discovered Killer Moves.
import KmMoveCard from './KmMoveCard';

// KNOWN tab — every discovered technique with live stats and actions
// (equip / unequip / dismantle). Dismantling returns the Gu unharmed (#15).
export default function KnownTab() {
  const { state } = useGame();
  const { t } = useT();
  const known = state.killerMoves?.known || [];
  if (!known.length) {
    return (
      <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-center">
        <div className="text-2xl mb-2">⚡</div>
        <p className="text-[11px] text-stone-400">{t('km.known.empty')}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="text-[10px] text-stone-500 px-1">{known.length}</div>
      {known.map(move => <KmMoveCard key={move.id} move={move} />)}
    </div>
  );
}