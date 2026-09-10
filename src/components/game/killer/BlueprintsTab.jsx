import React from 'react';
import { useT } from '@/game/i18n/LangContext';
import { useGame } from '@/game/state/GameContext';
import { PATH_BY_ID } from '@/game/data/paths';
import { kmState, kmBlueprintName } from '@/game/engine/killerMoves';
import { KM_BLUEPRINTS } from '@/game/data/killerMoves';

// BLUEPRINTS (#8): owned designs with role/Path requirements and bonuses.
// Unknown designs stay hidden — discovery belongs to experimentation (#19).
export default function BlueprintsTab() {
  const { state } = useGame();
  const { t } = useT();
  const km = kmState(state);
  const owned = KM_BLUEPRINTS.filter(b => km.blueprints?.[b.id]);

  return (
    <div className="space-y-2">
      {!owned.length && (
        <div className="rounded-lg border border-stone-700/60 bg-black/30 p-4 text-center">
          <div className="text-2xl mb-1">📜</div>
          <p className="text-[11px] text-stone-400">{t('km.bp.none')}</p>
          <p className="text-[10px] text-stone-600 mt-1.5">{t('km.bp.unknown')}</p>
        </div>
      )}
      {owned.map(b => (
        <div key={b.id} className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-amber-100">{b.icon} {kmBlueprintName(b)}</span>
            <span className="text-[10px] text-emerald-300">{t('km.bp.bonus', { r: b.bonus.researchPct, s: b.bonus.stabilityPct })}</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1">{b.desc?.[localStorage.getItem('gu_lang') === 'vi' ? 'vi' : 'en'] || ''}</p>
          <div className="text-[10px] text-stone-300 mt-1.5 space-y-0.5">
            <div>{t('km.bp.reqCore', { paths: b.corePaths.map(p => PATH_BY_ID[p]?.icon + ' ' + (PATH_BY_ID[p]?.name || p)).join(' / ') })}</div>
            <div>{t('km.bp.reqSupport', { roles: b.supportRoles.join(' / ') })}</div>
          </div>
        </div>
      ))}
    </div>
  );
}