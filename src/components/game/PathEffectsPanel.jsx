import React from 'react';
import { useT } from '@/game/i18n/LangContext';
import { locPathName } from '@/game/i18n/tr';
import { PATHS } from '@/game/data/paths';

// "Path Combat Effects" — the eight combat identities in one glance. Shown
// during starter selection and available later from the Help codex.
const FX_PATHS = ['fire', 'lightning', 'water', 'ice', 'poison', 'wind', 'earth', 'sword', 'strength'];

export default function PathEffectsPanel() {
  const { t } = useT();
  const defs = FX_PATHS.map((id) => PATHS.find((p) => p.id === id)).filter(Boolean);
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="text-[11px] font-heading tracking-wider text-emerald-300 mb-2">☯ {t('pathFx.title')}</div>
      <div className="grid sm:grid-cols-2 gap-x-3 gap-y-1">
        {defs.map((p) => (
          <div key={p.id} className="flex items-start gap-1.5 text-[11px] text-stone-300 leading-snug">
            <span className="shrink-0">{p.icon}</span>
            <span>
              <span className={`font-medium ${p.color}`}>{locPathName(p)}:</span> {t(`pathFx.${p.id}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}