import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { GU_BY_ID } from '@/game/data/gu';
import { PATH_BY_ID } from '@/game/data/paths';
import { ROLES } from '@/game/data/roles';
import { kmMoveStats, kmSlotsOf } from '@/game/engine/killerMoves';
import { sfx } from '@/game/audio/sfx';

// One discovered Killer Move: identity, live stats, component status
// (exactly which component is missing when incomplete) and slot actions.
export default function KmMoveCard({ move, showActions = true }) {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const st = kmMoveStats(state, move);
  const slots = kmSlotsOf(state);

  const equip = () => { sfx('confirm'); dispatch({ type: 'KM_EQUIP', moveId: move.id }); };
  const unequip = () => { sfx('ui'); dispatch({ type: 'KM_UNEQUIP', slot: st.slot }); };
  const dismantle = () => { sfx('ui'); dispatch({ type: 'KM_DISMANTLE', moveId: move.id }); };

  return (
    <div className={`rounded-lg border p-3 bg-black/20 ${st.status.complete ? 'border-amber-800/50' : 'border-rose-800/60'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-amber-100 flex items-center gap-1.5">
            <span className="text-amber-300">★</span>
            <span className="truncate">{st.name}</span>
            {st.slot != null && <span className="text-[10px] px-1.5 rounded bg-amber-900/50 border border-amber-700/50 text-amber-200">{t('km.slot', { n: st.slot + 1 })}</span>}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5 flex flex-wrap gap-1.5 items-center">
            {st.corePath && <span className={PATH_BY_ID[st.corePath]?.color}>{PATH_BY_ID[st.corePath]?.icon} {PATH_BY_ID[st.corePath]?.name}</span>}
            {(st.rolesOf ?? []).length > 0 && st.rolesOf.map(r => (
              <span key={r} className={`px-1 rounded border ${ROLES[r]?.tone || ''}`}>{ROLES[r]?.icon} {t(`role.${r}`)}</span>
            ))}
          </div>
        </div>
        {!st.status.complete && (
          <div className="text-[10px] px-1.5 py-0.5 rounded border border-rose-700/60 bg-rose-900/30 text-rose-200 shrink-0">{t('km.incomplete')}</div>
        )}
      </div>

      {/* live stats — the same numbers battle shows */}
      <div className="text-[10px] text-stone-400 mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {st.dmg && <span className="text-amber-200/90">⚔ {t('km.damage')}: {st.dmg.min}–{st.dmg.max}</span>}
        <span className="text-sky-200/80">⚡ {t('km.essence')}: {st.essence}</span>
        <span className="text-emerald-200/80">🎯 {t('km.activation')}: {st.activation}%</span>
      </div>

      {/* component status (#18): exactly which component is missing */}
      <div className="mt-1.5 text-[10px]">
        <span className="text-stone-500">{t('km.components')}: </span>
        <span className="text-amber-200/80">★ {t('km.component.core')} {st.coreName}</span>
        {st.supportNames.map((n, i) => (
          <span key={i} className="text-stone-300"> + {n}</span>
        ))}
        {!st.status.complete && st.status.missing.length > 0 && (
          <span className="text-rose-300 block mt-0.5">
            ⚠ {t('km.incomplete')}: {st.status.missing.map(m => {
              const inst = (state.ownedGu || []).find(g => g.instanceId === m.id);
              return inst ? `${GU_BY_ID[inst.guId].name} (${t(m.key)})` : `??? (${t(m.key)})`;
            }).join(' · ')}
          </span>
        )}
      </div>

      {showActions && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {st.slot != null
            ? <button onClick={unequip} className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-stone-200">{t('km.unequip')}</button>
            : <button onClick={equip} disabled={slots <= 0 || !st.status.complete}
              disabled-reason={st.status.complete ? undefined : t('km.equipIncomplete')}
              title={!st.status.complete ? t('km.equipIncomplete') : undefined}
              className={`text-[10px] px-2 py-1 rounded ${st.status.complete ? 'bg-amber-800/60 hover:bg-amber-700/70 text-amber-100' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>{t('km.equip')}</button>}
          <button onClick={dismantle} title={t('km.dismantleHint')}
            className="text-[10px] px-2 py-1 rounded bg-stone-800/60 hover:bg-stone-700/70 text-stone-300">{t('km.dismantle')}</button>
        </div>
      )}
    </div>
  );
}