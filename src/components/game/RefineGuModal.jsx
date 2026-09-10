import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { GU_BY_ID } from '@/game/data/gu';
import { PATH_BY_ID } from '@/game/data/paths';
import { BALANCE } from '@/game/config/balance';
import { refineGuChecklist } from '@/game/state/gameReducer';
import { sfx } from '@/game/audio/sfx';

// Rank-up refinement, with eyes open: success chance, exact costs, and the
// real risks — injury, and for a normal Gu a small chance of destruction.
// The Vital Gu can never be destroyed here.
export default function RefineGuModal({ instanceId, onClose }) {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const inst = state.ownedGu.find(g => g.instanceId === instanceId);
  if (!inst) return null;
  const gu = GU_BY_ID[inst.guId];
  const list = refineGuChecklist(state, inst);
  const path = PATH_BY_ID[gu.path];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="max-w-sm w-full rounded-2xl border border-amber-800/60 bg-[#0d1410] p-5 animate-pop">
        <div className="text-center text-[11px] font-heading tracking-[0.25em] text-amber-200/90">{t('ref.title')}</div>
        <div className="flex items-center justify-between mt-2 mb-3">
          <div className="text-sm font-semibold text-amber-100">{path.icon} {gu.name}</div>
          <div className="text-xs text-stone-300">{t('ref.rankUp', { a: list.cur, b: list.target })}</div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-amber-900/15 border border-amber-800/40 px-3 py-2 mb-3">
          <span className="text-xs text-stone-300">{t('ref.success')}</span>
          <span className={`text-xl font-bold ${list.chance >= 60 ? 'text-emerald-300' : list.chance >= 35 ? 'text-amber-300' : 'text-rose-300'}`}>{list.chance}%</span>
        </div>

        <div className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">{t('ref.required')}</div>
        <div className="space-y-0.5 mb-3">
          {list.checks.map(c => (
            <div key={c.key} className={`text-[11px] flex items-center gap-1.5 ${c.met ? 'text-emerald-300' : 'text-rose-300'}`}>
              <span>{c.met ? '✓' : '✗'}</span><span className={c.met ? '' : 'text-stone-400'}>{c.text}</span>
            </div>
          ))}
        </div>

        <div className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">{t('ref.risk')}</div>
        <div className="rounded-lg border border-rose-800/40 bg-rose-900/10 p-2.5 mb-3 text-[10px] text-rose-200/90 space-y-0.5">
          <div>• {t('ref.materialsLost')}</div>
          <div>• {t('ref.injury', { c: list.injuryChance })}</div>
          {list.vital
            ? <div className="text-amber-300/90">• {t('ref.vitalProtect')}</div>
            : <div>• {t('ref.death', { c: list.deathChance })}</div>}
        </div>
        <p className="text-[9px] text-stone-500 mb-3">✦ {t('ref.power', { n: BALANCE.guRefine.rankPowerStep })}</p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { sfx('confirm'); dispatch({ type: 'REFINE_GU', instanceId: inst.instanceId }); onClose(); }}
            disabled={!list.ok}
            className={`py-2.5 rounded-lg text-sm font-semibold ${list.ok ? 'bg-amber-600 hover:bg-amber-500 text-black' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
            🔥 {t('ref.confirm')}
          </button>
          <button onClick={onClose} className="py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 text-sm">
            {t('ui.close')}
          </button>
        </div>
      </div>
    </div>
  );
}