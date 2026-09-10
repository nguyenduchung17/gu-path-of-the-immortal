import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { QUEST_BY_ID } from '@/game/data/quests';
import { NPC_BY_ID } from '@/game/data/npcs';
import { questStatusOf, QS } from '@/game/engine/questEngine';
import QuestCard from './quests/QuestCard';

// The Quest tab — ACTIVE / DISCOVERED / FAILED / COMPLETED, all read from the
// single centralized quest state (never from NPC or dialogue state).
export default function QuestsPanel() {
  const { state } = useGame();
  const qs = state.quests || {};
  const recs = qs.byId || {};
  const active = (qs.order || []).map(id => QUEST_BY_ID[id]).filter(Boolean);
  const done = Object.entries(recs).filter(([, r]) => r.status === QS.TURNED_IN || r.status === QS.COMPLETED).map(([id]) => QUEST_BY_ID[id]).filter(Boolean);
  const failed = Object.entries(recs).filter(([, r]) => r.status === QS.FAILED).map(([id]) => QUEST_BY_ID[id]).filter(Boolean);
  const discovered = (qs.discovered || []).map(id => QUEST_BY_ID[id]).filter(q => q && !recs[q.id] && questStatusOf(state, q) === QS.AVAILABLE);
  const tracked = qs.tracked || [];

  return (
    <div className="pt-3 space-y-4 animate-fade-in">
      <div>
        <h3 className="text-sm font-semibold text-stone-300 mb-2">Active ({active.length})</h3>
        {active.length === 0 && <div className="text-stone-500 text-sm">No active quests. Speak with NPCs to begin.</div>}
        <div className="space-y-2">
          {active.map(q => <QuestCard key={q.id} q={q} tracked={tracked.includes(q.id)} />)}
        </div>
      </div>

      {discovered.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-400 mb-2">Discovered · not yet taken</h3>
          <div className="space-y-2">
            {discovered.map(q => (
              <div key={q.id} className="rounded-lg border border-stone-800/60 bg-black/10 p-2.5">
                <div className="text-xs text-stone-200">{q.name}</div>
                <div className="text-[10px] text-stone-500">from {NPC_BY_ID[q.giver]?.name || q.giver} — speak with them to accept</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {failed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-rose-400 mb-2">Failed</h3>
          <div className="space-y-1.5">
            {failed.map(q => <div key={q.id} className="rounded-lg border border-rose-900/50 bg-rose-950/20 p-2 opacity-80"><div className="text-sm text-rose-300">✗ {q.name}</div></div>)}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-400 mb-2">Completed ({done.length})</h3>
          <div className="space-y-1.5">
            {done.map(q => (
              <div key={q.id} className="rounded-lg border border-stone-800/50 bg-black/10 p-2 opacity-70">
                <div className="text-sm text-stone-300">✓ {q.name}</div>
                <div className="text-[10px] text-stone-500">{NPC_BY_ID[q.giver]?.name || q.giver}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}