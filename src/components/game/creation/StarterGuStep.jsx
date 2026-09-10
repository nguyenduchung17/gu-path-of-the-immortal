import React from 'react';
import { useT } from '@/game/i18n/LangContext';
import { sfx } from '@/game/audio/sfx';
import { STARTER_GU, starterGuOf } from '@/game/data/starterGu';
import { PATH_BY_ID } from '@/game/data/paths';
import { GU_BY_ID } from '@/game/data/gu';

// Starter Gu step of character creation — the classic "choose your first
// companion" moment. Each option shows path, playstyle, cost and strengths.
export default function StarterGuStep({ value, onChange }) {
  const { t } = useT();

  return (
    <div className="animate-fade-in">
      <div className="text-xs uppercase tracking-widest text-emerald-300/80 mb-1">{t('starter.title')}</div>
      <p className="text-[11px] text-stone-400 mb-4">{t('starter.desc')}</p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {STARTER_GU.map(({ guId, icon, key }) => {
          const gu = GU_BY_ID[guId] || starterGuOf(guId);
          const path = PATH_BY_ID[gu.path];
          const sel = value === guId;
          return (
            <button key={guId} onClick={() => { onChange(guId); sfx('confirm'); }}
              className={`text-left rounded-xl border p-3 transition animate-fade-in ${
                sel ? 'border-amber-400/70 bg-amber-950/20 shadow-[0_0_16px_rgba(251,191,36,0.15)]' : 'border-stone-800 bg-black/30 hover:bg-black/50'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-stone-100 truncate">{gu.name}</div>
                    <div className="text-[10px] text-stone-400">
                      {t('starter.path')}: {path.icon} {path.name}
                    </div>
                  </div>
                </div>
                {sel && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold shrink-0">{t('starter.chosen')}</span>}
              </div>
              <div className="text-[10px] text-emerald-300/90 font-medium mt-1.5">{t(`starter.${key}.style`)}</div>
              <div className="text-[10px] text-stone-400 mt-1 space-y-0.5">
                <div>⚡ {t('starter.essenceCost')}: {gu.energyCost} · ⏳ {t('battle.cooldown')}: {gu.cooldown || 0}</div>
                <div className="text-emerald-200/80">▲ {t(`starter.${key}.strengths`)}</div>
                <div className="text-rose-200/60">▼ {t(`starter.${key}.weaknesses`)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}