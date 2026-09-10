import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { kmSlotsOf, kmMoveStats } from '@/game/engine/killerMoves';
import { sfx } from '@/game/audio/sfx';
import KmMoveCard from './KmMoveCard';

// LOADOUT tab — the limited battle slots (2, a 3rd at Rank 2). Only moves
// slotted here appear on the battle command bar.
export default function LoadoutTab() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const km = state.killerMoves;
  const slots = kmSlotsOf(state);
  const loadout = km?.loadout || [null, null, null];
  const equippedIds = new Set(loadout.filter(Boolean));
  const reserve = (km?.known || []).filter(m => !equippedIds.has(m.id));

  const unequip = (slot) => { sfx('ui'); dispatch({ type: 'KM_UNEQUIP', slot }); };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-stone-500 px-1">{t('km.loadout.slots')}</p>
      <div className="grid gap-2">
        {loadout.slice(0, 3).map((id, i) => {
          const locked = i >= slots;
          const move = id ? (km.known || []).find(m => m.id === id) : null;
          return (
            <div key={i} className={`rounded-lg border p-3 ${locked ? 'border-stone-800 bg-stone-900/30' : move ? 'border-amber-800/50 bg-black/20' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-heading tracking-wider text-stone-400">{t('km.slot', { n: i + 1 })}</span>
                {locked
                  ? <span className="text-[10px] text-stone-500">🔒 {t('km.slot.locked')}</span>
                  : move
                    ? <button onClick={() => unequip(i)} className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-stone-200">{t('km.unequip')}</button>
                    : <span className="text-[10px] text-stone-500">{t('km.slot.empty')}</span>}
              </div>
              {move && <div className="mt-2"><KmMoveCard move={move} showActions={false} /></div>}
            </div>
          );
        })}
      </div>
      {reserve.length > 0 && (
        <div>
          <div className="text-[10px] font-heading tracking-wider text-stone-400 mb-1.5">✦ {t('km.reserve')}</div>
          <div className="space-y-2">
            {reserve.map(move => <KmMoveCard key={move.id} move={move} />)}
          </div>
        </div>
      )}
    </div>
  );
}