import React from 'react';
import { useT } from '@/game/i18n/LangContext';
import { intentView } from '@/game/engine/intent';
import { PATH_BY_ID } from '@/game/data/paths';

// The enemy's committed NEXT action, shown at the player's scouting level:
// rough hint → exact intent (Observe / investigate Gu) → weaknesses (scouting).
export default function IntentPanel({ combat, enemy }) {
  const { t } = useT();
  const v = intentView(combat, enemy);
  if (!v) return null;
  return (
    <div className="mt-1.5 rounded-lg bg-black/40 border border-white/10 px-2 py-1.5">
      <div className="text-[8px] uppercase tracking-widest text-stone-500 mb-0.5">{t('intent.title')}</div>
      {!v.revealed && !v.heavy ? (
        <div className="text-[10px] text-stone-400 italic">{v.icon} {t(v.roughKey)}</div>
      ) : (
        <div className="text-[10px] text-amber-200 font-semibold leading-snug">
          {v.icon} {v.name || t(v.labelKey)}
          {v.dmg != null && <span className="text-stone-400 font-normal"> · ≈{v.dmg} {t('intent.dmgUnit')}</span>}
          {v.venom != null && <span className="text-purple-300 font-normal"> · +{t('intent.venom')}</span>}
        </div>
      )}
      {v.scouted && (v.interruptible || v.stabWeak) && (
        <div className="text-[9px] space-y-0.5 mt-0.5">
          {v.interruptible && <div className="text-sky-300">⏱ {t('intent.interruptible')}</div>}
          {v.stabWeak && <div className="text-emerald-300">🔨 {t('intent.breakWeak')}: {PATH_BY_ID[v.stabWeak]?.name || v.stabWeak}</div>}
        </div>
      )}
    </div>
  );
}