import React from 'react';
import { useT } from '@/game/i18n/LangContext';
import { useGame } from '@/game/state/GameContext';
import { PATH_BY_ID } from '@/game/data/paths';
import { ROLES } from '@/game/data/roles';
import { GU_BY_ID } from '@/game/data/gu';
import { kmName, kmMissing, kmPseudoGu } from '@/game/engine/killerMoves';
import { locPathName } from '@/game/i18n/tr';
import { effectSummary } from '../battle/BattleCommandMenu';
import { sfx } from '@/game/audio/sfx';

// One forged technique: identity, live stats, bound components and its state.
// Incomplete moves name exactly which component is missing (#18).
export default function KmCard({ km, onEquip, onUnequip, onDismantle }) {
  const { state } = useGame();
  const { t } = useT();
  const miss = kmMissing(state, km);
  const equipped = (state.killerMoves?.equipped || []).includes(km.id);
  const inst = (id) => state.ownedGu.find(g => g.instanceId === id);
  const pseudo = kmPseudoGu(km);

  return (
    <div className={`rounded-lg border p-3 bg-black/25 ${equipped ? 'border-amber-500/60' : 'border-stone-700/60'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-amber-100 flex items-center gap-1.5">
            ⚡<span className="truncate">{kmName(km)}</span>
            {equipped && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-900/50 border border-amber-600/50 text-amber-200 shrink-0">{t('km.btn.equip')}✓</span>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {km.paths.map(p => (
              <span key={p} className="text-[9px] px-1.5 py-0.5 rounded border border-stone-700 text-stone-300">{PATH_BY_ID[p]?.icon} {locPathName(PATH_BY_ID[p]) || p}</span>
            ))}
            {km.roles.map(r => (
              <span key={r} className={`text-[9px] px-1.5 py-0.5 rounded border ${ROLES[r]?.tone || 'border-stone-700 text-stone-300'}`}>{ROLES[r]?.icon} {t(`role.${r}`)}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-[10px] text-stone-300">
        <span>⚔️ {t('km.est.damage')}: <b className="text-amber-200">{km.damage[0]}–{km.damage[1]}</b></span>
        <span>⚡ {t('ui.essence')}: <b className="text-sky-200">{km.essence}</b></span>
        <span>🎯 {t('km.est.stability')}: <b className="text-emerald-200">{km.activation}%</b></span>
        <span>⏳ {t('km.est.cooldown')}: <b className="text-stone-200">{km.cooldown} {t('km.est.actions')}</b></span>
      </div>
      <div className="text-[10px] text-stone-500 mt-1 truncate">{effectSummary(pseudo, t)}</div>

      {/* components — bound while equipped (#14) */}
      <div className="mt-2 border-t border-white/5 pt-1.5">
        <div className="text-[9px] text-stone-500 uppercase tracking-wide mb-0.5">{t('km.loadout.boundTo')}</div>
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/30 border border-emerald-700/40 text-emerald-200">
            ◈ {t('km.core')}: {(() => { const i = inst(km.coreInstanceId); return i ? GU_BY_ID[i.guId].name : '?'; })()}
          </span>
          {km.supportInstanceIds.map(id => (
            <span key={id} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-900/25 border border-sky-700/40 text-sky-200">
              ✚ {(() => { const i = inst(id); return i ? GU_BY_ID[i.guId].name : '?'; })()}
            </span>
          ))}
        </div>
      </div>

      {miss.length > 0 && (
        <div className="mt-1.5 text-[10px] text-rose-300 border border-rose-800/50 bg-rose-950/40 rounded px-2 py-1">
          ⚠ {t('km.incomplete')} — {t('km.incomplete.missing', { names: miss.join(', ') })}
        </div>
      )}

      {(onEquip || onUnequip || onDismantle) && (
        <div className="flex gap-1.5 mt-2">
          {equipped
            ? onUnequip && <button onClick={() => { sfx('ui'); onUnequip(); }} className="flex-1 py-1 rounded-lg bg-white/5 border border-white/10 text-stone-200 text-[11px] hover:bg-white/15">{t('km.btn.unequip')}</button>
            : onEquip && <button onClick={() => { sfx('confirm'); onEquip(); }} disabled={miss.length > 0} className="flex-1 py-1 rounded-lg bg-amber-700/80 hover:bg-amber-600 disabled:opacity-40 text-white text-[11px]">{t('km.btn.equip')}</button>}
          {onDismantle && (
            <button onClick={() => { sfx('cancel'); onDismantle(); }}
              className="py-1 px-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-200 text-[11px] hover:bg-rose-900/60">
              {t('km.btn.dismantle')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}