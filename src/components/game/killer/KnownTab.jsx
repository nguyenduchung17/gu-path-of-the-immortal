import React from 'react';
import { useT } from '@/game/i18n/LangContext';
import { useGame } from '@/game/state/GameContext';
import { kmState, kmName } from '@/game/engine/killerMoves';
import KmCard from './KmCard';

// KNOWN KILLER MOVES — every discovered technique, its live condition, equip
// and dismantle actions. Dismantling returns the Gu unharmed (#15).
export default function KnownTab() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const km = kmState(state);
  const known = km.known || [];

  if (!known.length) {
    return (
      <div className="rounded-lg border border-stone-700/60 bg-black/30 p-6 text-center">
        <div className="text-2xl mb-2">⚡</div>
        <p className="text-[11px] text-stone-400">{t('km.known.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] text-stone-500">{t('km.known.count', { n: known.length })}</div>
      {known.map(kmRec => (
        <KmCard key={kmRec.id} km={kmRec}
          onEquip={() => dispatch({ type: 'KM_EQUIP', kmId: kmRec.id })}
          onUnequip={() => dispatch({ type: 'KM_UNEQUIP', kmId: kmRec.id })}
          onDismantle={() => {
            if (window.confirm(t('km.dismantle.confirm', { name: kmName(kmRec) }))) {
              dispatch({ type: 'KM_DISMANTLE', kmId: kmRec.id });
            }
          }} />
      ))}
    </div>
  );
}