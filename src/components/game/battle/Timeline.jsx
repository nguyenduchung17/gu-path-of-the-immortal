import React from 'react';
import { timelineOf } from '@/game/engine/combat';

// Visible action timeline: who acts next and the ~5 actions after that —
// interleaving every pack member's clock (#27). Speed buffs, Action Advance
// and enemy Delay reshape it in real time so the player can plan ahead.
export default function Timeline({ combat }) {
  const items = timelineOf(combat, 6);
  if (!items.length) return null;
  const byUid = {};
  for (const e of combat.enemies || []) byUid[e.uid] = e;
  const label = (it) => (it.uid === 'player' ? 'YOU' : (byUid[it.uid]?.short || '?'));
  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 animate-fade-in pointer-events-none max-w-[92vw] overflow-hidden">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1 shrink-0">
          {i > 0 && <span className="text-stone-600 text-[9px]">▸</span>}
          <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-heading tracking-wide border whitespace-nowrap ${
            i === 0
              ? 'bg-emerald-700/80 border-emerald-400/60 text-white shadow'
              : it.uid === 'player'
                ? 'bg-black/50 border-emerald-700/50 text-emerald-200'
                : it.telegraph
                  ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                  : 'bg-black/50 border-rose-800/60 text-rose-200'
          }`}>
            {i === 0 ? '▶ ' : ''}{label(it)}{it.telegraph ? ' ⚠' : ''}
          </span>
        </span>
      ))}
    </div>
  );
}