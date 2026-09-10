import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { QUEST_BY_ID } from '@/game/data/quests';
import { NPC_BY_ID } from '@/game/data/npcs';
import { questStatusOf, questView, QS, TRACK_LIMIT } from '@/game/engine/questEngine';
import { sfx } from '@/game/audio/sfx';

// Compact on-HUD quest tracker: up to TRACK_LIMIT followed quests with live
// objective progress, a gold glow + chime when a quest is ready to turn in,
// a brief "+1" pulse when an objective advances, and a collapse toggle.
// Semi-transparent, right side, never over the main play area.
export default function QuestTracker() {
  const { state, dispatch } = useGame();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('gu_tracker_collapsed') === '1'; } catch { return false; } });
  const [flash, setFlash] = useState(null);
  const prevSig = useRef(null);

  const quests = state.quests || {};
  const activeIds = new Set(quests.order || []);
  const blocks = (quests.tracked || [])
    .filter(id => activeIds.has(id))
    .slice(0, TRACK_LIMIT)
    .map(id => {
      const q = QUEST_BY_ID[id];
      if (!q) return null;
      return { q, status: questStatusOf(state, q), view: questView(state, q) };
    })
    .filter(b => b && (b.status === QS.ACTIVE || b.status === QS.TURN_IN_READY));

  const sig = blocks.map(b => `${b.q.id}:${b.status}:${b.view.map(o => o.cur).join('.')}`).join('|');

  useEffect(() => {
    const prev = prevSig.current;
    prevSig.current = sig;
    if (prev === null || prev === sig) return;
    const prevBlocks = {};
    for (const part of prev.split('|')) {
      const [id, status, curs] = part.split(':');
      prevBlocks[id] = { status, curs: (curs || '').split('.').map(Number) };
    }
    let readyNow = false, upText = null;
    for (const b of blocks) {
      const pb = prevBlocks[b.q.id];
      if (!pb) continue;
      if (pb.status !== QS.TURN_IN_READY && b.status === QS.TURN_IN_READY) readyNow = true;
      b.view.forEach((o, i) => {
        if (o.cur > (pb.curs[i] || 0)) upText = `+${o.cur - (pb.curs[i] || 0)} ${o.label}`;
      });
    }
    if (readyNow) sfx('chime');
    else if (upText) sfx('confirm');
    if (upText) {
      setFlash(upText);
      const t = setTimeout(() => setFlash(null), 1700);
      return () => clearTimeout(t);
    }
  }, [sig]);

  if (!blocks.length) return null;

  const toggle = () => setCollapsed(c => {
    try { localStorage.setItem('gu_tracker_collapsed', c ? '0' : '1'); } catch { /* private mode */ }
    return !c;
  });

  return (
    <div className="fixed top-[60px] right-3 z-30 w-52 sm:w-60 pointer-events-none">
      <div className="relative h-5">
        {flash && <div className="absolute right-1 top-0 text-[11px] font-semibold text-emerald-300 animate-battle-dmg">{flash}</div>}
      </div>
      <div className="rounded-xl border border-stone-700/60 bg-black/45 backdrop-blur-md pointer-events-auto opacity-85 hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between px-2 py-1 border-b border-stone-700/40">
          <span className="text-[10px] uppercase tracking-wider text-stone-300">📜 Quest Tracker</span>
          <button onClick={toggle} className="text-[10px] text-stone-400 hover:text-stone-100 px-1">{collapsed ? '[+]' : '[−]'}</button>
        </div>
        <div className="p-1.5 space-y-1.5">
          {blocks.map(b => (
            <div key={b.q.id} className={`rounded-lg border px-2 py-1.5 ${b.status === QS.TURN_IN_READY ? 'border-amber-500/60 bg-amber-950/30 animate-aperture-glow' : 'border-stone-800 bg-black/30'}`}>
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[11px] font-semibold truncate ${b.status === QS.TURN_IN_READY ? 'text-amber-200' : 'text-stone-100'}`}>{b.q.name}</span>
                <button onClick={() => dispatch({ type: 'TRACK_QUEST', questId: b.q.id })} title="Untrack" className="text-[9px] text-stone-500 hover:text-stone-200 shrink-0">✕</button>
              </div>
              {!collapsed && (
                <div className="mt-1 space-y-0.5">
                  {b.view.map(o => (
                    <div key={o.id} className={`text-[10px] flex justify-between gap-2 ${o.done ? 'text-emerald-400' : 'text-stone-300'}`}>
                      <span className="truncate">{o.done ? '✓' : '•'} {o.label}</span>
                      <span className="shrink-0">{o.cur}/{o.req}</span>
                    </div>
                  ))}
                  {b.status === QS.TURN_IN_READY && (
                    <div className="text-[10px] text-amber-300 pt-0.5">➜ Return to {NPC_BY_ID[b.q.giver]?.name || b.q.giver}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}