import React from 'react';
import { useT } from '@/game/i18n/LangContext';

// Tactical target strip (#14): shown while two or more enemies live. Click a
// card (or the figure on the battlefield) to aim single-target actions; the
// selected enemy is clearly highlighted, leaders are crowned (#38).
export default function TargetSelect({ combat, targetUid, onPick }) {
  const { t } = useT();
  const living = (combat.enemies || []).filter(e => e.hp > 0);
  if (living.length < 2) return null;
  return (
    <div className="mb-2 animate-fade-in">
      <div className="text-[8px] uppercase tracking-widest text-amber-200/80 mb-1">{t('battle.pickTarget')}</div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
        {living.map(e => {
          const sel = e.uid === targetUid;
          const leader = e.packRole === 'leader' || e.packLeader;
          const hpPct = Math.max(0, (e.hp / e.maxHp) * 100);
          return (
            <button key={e.uid} onClick={() => onPick(e.uid)}
              className={`shrink-0 rounded-lg border px-2 py-1 text-left min-w-[108px] transition ${
                sel ? 'border-amber-400/80 bg-amber-900/30 text-amber-100 shadow-[0_0_10px_rgba(252,211,77,0.25)]'
                  : 'border-stone-700/60 bg-black/40 text-stone-300 hover:border-stone-500'}`}>
              <div className="text-[10px] font-semibold truncate flex items-center gap-1">
                {leader && <span className="text-amber-300 shrink-0" title={t('battle.leader')}>♛</span>}
                <span className="truncate">{e.label}</span>
              </div>
              <div className="h-1.5 mt-1 rounded bg-black/60 overflow-hidden">
                <div className="h-full bg-rose-500/80 transition-all duration-500" style={{ width: `${hpPct}%` }} />
              </div>
              <div className="text-[8px] text-stone-500 mt-0.5 whitespace-nowrap">
                {Math.floor(e.hp)}/{e.maxHp} · {t('battle.guard')} {Math.floor(e.stability ?? e.maxStability)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}