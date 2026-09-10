import React from 'react';
import { useT } from '@/game/i18n/LangContext';
import { useGame } from '@/game/state/GameContext';
import { kmState, kmSlots, kmMissing, kmName } from '@/game/engine/killerMoves';
import { GU_BY_ID } from '@/game/data/gu';
import { sfx } from '@/game/audio/sfx';

// KILLER MOVE LOADOUT (#16): limited battle slots, the component binding each
// slot creates (#14), and one-click swapping.
export default function LoadoutTab() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const km = kmState(state);
  const equippedIds = km.equipped || [];
  const known = (km.known || []).filter(k => !equippedIds.includes(k.id));
  const slots = kmSlots(state);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-heading tracking-wider text-amber-200">⚡ {t('km.loadout.title')}</span>
        <span className="text-[10px] text-stone-500">{t('km.loadout.slots', { n: slots })}</span>
      </div>
      <p className="text-[10px] text-stone-500">{t('km.loadout.lockNote')}</p>

      {Array.from({ length: slots }).map((_, i) => {
        const id = equippedIds[i];
        const rec = (km.known || []).find(k => k.id === id);
        if (!rec) {
          return (
            <div key={i} className="rounded-lg border border-dashed border-stone-700 bg-black/20 p-3 text-center">
              <span className="text-[10px] text-stone-500">{t('km.loadout.slot', { n: i + 1 })} — {t('km.loadout.empty')}</span>
            </div>
          );
        }
        const miss = kmMissing(state, rec);
        return (
          <div key={i} className="rounded-lg border border-amber-500/60 bg-amber-950/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-amber-100 truncate">⚡ {kmName(rec)}</span>
              <button onClick={() => { sfx('ui'); dispatch({ type: 'KM_UNEQUIP', kmId: rec.id }); }}
                className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-stone-200 text-[11px] hover:bg-white/15 shrink-0">
                {t('km.btn.unequip')}
              </button>
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              ⚔️ {rec.damage[0]}–{rec.damage[1]} · ⚡{rec.essence} · 🎯{rec.activation}% · ⏳{rec.cooldown}
            </div>
            <div className="mt-1.5">
              <div className="text-[9px] text-stone-500 uppercase tracking-wide">{t('km.loadout.boundTo')}</div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {[rec.coreInstanceId, ...rec.supportInstanceIds].map(cid => {
                  const inst = state.ownedGu.find(g => g.instanceId === cid);
                  return (
                    <span key={cid} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/25 border border-emerald-700/40 text-emerald-200">
                      {inst ? GU_BY_ID[inst.guId].name : '?'}
                    </span>
                  );
                })}
              </div>
            </div>
            {miss.length > 0 && (
              <div className="mt-1.5 text-[10px] text-rose-300">⚠ {t('km.incomplete')} — {t('km.incomplete.missing', { names: miss.join(', ') })}</div>
            )}
          </div>
        );
      })}

      {known.length > 0 && equippedIds.length < slots && (
        <div>
          <div className="text-[10px] text-stone-400 mb-1">{t('km.loadout.pick')}</div>
          <div className="flex flex-wrap gap-1.5">
            {known.map(k => (
              <button key={k.id} onClick={() => { sfx('confirm'); dispatch({ type: 'KM_EQUIP', kmId: k.id }); }}
                className="px-2.5 py-1 rounded-lg bg-amber-800/60 hover:bg-amber-700 border border-amber-600/40 text-amber-100 text-[11px]">
                + {kmName(k)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}