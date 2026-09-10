import React, { useState } from 'react';
import { useT } from '@/game/i18n/LangContext';
import { sfx } from '@/game/audio/sfx';
import { STARTER_GU } from '@/game/data/starterGu';
import { PATH_BY_ID } from '@/game/data/paths';
import { GU_BY_ID } from '@/game/data/gu';
import { guAttackRange } from '@/game/engine/combat';
import { effectSummary } from '@/components/game/battle/BattleCommandMenu';
import { locGuName, locPathName } from '@/game/i18n/tr';
import StarterPreview from './StarterPreview';
import PathEffectsPanel from '@/components/game/PathEffectsPanel';

// Starter Gu step of character creation — the choice is a combat STYLE, not
// "damage versus utility". All eight starters can fight; each teaches a
// different Path mechanic. Cards show role, the real damage window, essence
// cost, proc chances, strength/weakness/playstyle, and a no-battle preview.
export default function StarterGuStep({ value, onChange }) {
  const { t } = useT();
  const [preview, setPreview] = useState(null);
  const [showPaths, setShowPaths] = useState(false);

  return (
    <div className="animate-fade-in">
      <div className="text-xs uppercase tracking-widest text-emerald-300/80 mb-1">{t('starter.title')}</div>
      <p className="text-[11px] text-stone-400 mb-2">{t('starter.desc')}</p>

      {/* the eight combat identities, one glance — open before committing */}
      <div className="mb-3">
        <button onClick={() => { sfx('ui'); setShowPaths((v) => !v); }}
          className="w-full py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] text-stone-300">
          ☯ {t('pathFx.title')} <span className="text-stone-500">{showPaths ? '−' : '+'}</span>
        </button>
        {showPaths && <div className="mt-1.5"><PathEffectsPanel /></div>}
      </div>

      <div className="grid sm:grid-cols-2 gap-2.5">
        {STARTER_GU.map(({ guId, icon, key }) => {
          const gu = GU_BY_ID[guId];
          const path = PATH_BY_ID[gu.path];
          const sel = value === guId;
          const r = guAttackRange(gu);
          return (
            <div key={guId} role="button" onClick={() => { onChange(guId); sfx('confirm'); }}
              className={`cursor-pointer text-left rounded-xl border p-3 transition animate-fade-in ${
                sel ? 'border-amber-400/70 bg-amber-950/20 shadow-[0_0_16px_rgba(251,191,36,0.15)]' : 'border-stone-800 bg-black/30 hover:bg-black/50'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-stone-100 truncate">{locGuName(gu)}</div>
                    <div className="text-[10px] text-stone-400">
                      {t('starter.path')}: <span className={path.color}>{path.icon} {locPathName(path)}</span>
                    </div>
                  </div>
                </div>
                {sel && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold shrink-0">{t('starter.chosen')}</span>}
              </div>

              <div className="text-[10px] text-emerald-300/90 font-medium mt-1.5">{t(`starter.${key}.role`)}</div>
              <div className="text-[10px] text-stone-400 mt-1 space-y-0.5">
                <div>⚔️ {t('fx.attack')} {r.min}–{r.max} · ⚡ {t('starter.essenceCost')}: {gu.energyCost} · ⏳ {t('battle.cooldown')}: {gu.cooldown || 0}</div>
                <div className="text-amber-200/80">✦ {effectSummary(gu, t)}</div>
                <div className="text-emerald-200/80">▲ {t('starter.strength')}: {t(`starter.${key}.strengths`)}</div>
                <div className="text-rose-200/60">▼ {t('starter.weakness')}: {t(`starter.${key}.weaknesses`)}</div>
                <div className="text-sky-200/70">🎭 {t('starter.playstyle')}: {t(`starter.${key}.play`)}</div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); sfx('open'); setPreview(preview === guId ? null : guId); }}
                className={`mt-1.5 text-[10px] px-2 py-1 rounded border transition ${
                  preview === guId
                    ? 'border-sky-500/60 bg-sky-900/40 text-sky-200'
                    : 'border-stone-700 bg-black/30 text-stone-400 hover:text-stone-200'
                }`}>
                👁 {t('starter.preview')}
              </button>
              {preview === guId && <StarterPreview guId={guId} />}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-stone-500 mt-3">✦ {t('starter.permanentNote')}</p>
    </div>
  );
}