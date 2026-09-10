import React from 'react';
import { useGame } from '@/game/state/GameContext';

// Compact floating message log, bottom-left. Older lines fade out.
export default function MessageLog() {
  const { state } = useGame();
  const lines = (state.log || []).slice(-6);
  return (
    <div className="absolute left-2.5 bottom-14 sm:bottom-3 z-10 w-56 sm:w-80 max-w-[60vw] pointer-events-none">
      <div className="space-y-0.5">
        {lines.map((l, i) => (
          <div
            key={`${i}-${l}`}
            className={`animate-fade-in text-[10px] sm:text-[11px] leading-snug px-2 py-1 rounded-lg bg-black/40 backdrop-blur-[1px] text-emerald-100/90 ${i === lines.length - 1 ? 'text-emerald-200' : ''}`}
            style={{ opacity: 0.3 + 0.7 * ((i + 1) / Math.max(1, lines.length)) }}
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}