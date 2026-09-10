import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { CODEX_TOPICS } from '@/game/data/tutorial';

// Help & Codex — short rereadable guides to every core system, plus the
// tutorial replay. All text localized (codex.* keys).
export default function HelpCodexPanel() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const [open, setOpen] = useState(CODEX_TOPICS[0]);

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 p-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs font-heading text-emerald-200">🐉 {t('codex.replay')}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">{t('codex.replayHint')}</p>
        </div>
        <button
          onClick={() => dispatch({ type: 'TUTORIAL_REPLAY' })}
          disabled={!!state.tutorial?.active}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium"
        >
          {t('codex.replayBtn')}
        </button>
      </div>
      <p className="text-[11px] text-stone-500 px-1">{t('codex.intro')}</p>
      {CODEX_TOPICS.map((topic) => (
        <div key={topic} className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <button
            onClick={() => setOpen(open === topic ? null : topic)}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-200 hover:bg-white/10 flex items-center justify-between gap-2"
          >
            <span>{t(`codex.${topic}.title`)}</span>
            <span className="text-stone-500">{open === topic ? '−' : '+'}</span>
          </button>
          {open === topic && (
            <p className="px-3 pb-3 text-[11px] text-stone-400 leading-relaxed">{t(`codex.${topic}.body`)}</p>
          )}
        </div>
      ))}
    </div>
  );
}