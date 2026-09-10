import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { EVENT_BY_ID } from '@/game/data/events';
import { locEventTitle, locEventText, locEventOption } from '@/game/i18n/tr';

export default function EventModal() {
  const { state, dispatch } = useGame();
  const ev = EVENT_BY_ID[state.pendingEvent];
  if (!ev) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-violet-800/50 bg-[#13101a] p-5 animate-pop">
        <div className="text-3xl mb-2">✦</div>
        <h2 className="text-lg font-semibold text-violet-100 mb-2">{locEventTitle(ev)}</h2>
        <p className="text-sm text-stone-300 mb-4">{locEventText(ev)}</p>
        <div className="space-y-2">
          {ev.options.map((opt, i) => (
            <button key={i} onClick={() => dispatch({ type: 'CHOOSE_EVENT', optionIndex: i })}
              className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-violet-800/30 text-sm text-stone-200 transition">
              {locEventOption(ev, i)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}