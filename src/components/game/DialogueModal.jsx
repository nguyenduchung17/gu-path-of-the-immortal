import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { NPC_BY_ID } from '@/game/data/npcs';
import { QUESTS } from '@/game/data/quests';
import { objectiveMet } from '@/game/state/gameReducer';
import { diffOf } from '@/game/config/balance';
import { shopOpen } from '@/game/engine/time';
import { INNS } from '@/game/data/world';

export default function DialogueModal({ onShop, onService, onInn }) {
  const { state, dispatch } = useGame();
  const npc = NPC_BY_ID[state.dialogue.npcId];
  const [view, setView] = useState('main');
  if (!npc) return null;

  const npcQuests = QUESTS.filter(q => q.giver === npc.id);
  const close = () => dispatch({ type: 'CLOSE_DIALOGUE' });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-3">
      <div className="max-w-md w-full rounded-2xl border border-emerald-800/50 bg-[#0d1410] p-4 animate-pop">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-emerald-900/40 flex items-center justify-center text-2xl">{npc.avatar}</div>
          <div>
            <div className="text-sm font-semibold text-emerald-100">{npc.name}</div>
            <p className="text-[11px] text-stone-400 italic">"{npc.greeting}"</p>
          </div>
        </div>

        {view === 'main' && (
          <div className="space-y-2">
            {npc.shop && (shopOpen(npc, state.time)
              ? <button onClick={() => { onShop(npc.id); close(); }} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">🛒 Trade</button>
              : <div className="w-full px-3 py-2 rounded-lg bg-white/5 text-sm text-stone-500">🛒 Trade — closed for the night (opens 06:00)</div>
            )}
            {npc.service === 'inn' && (() => {
              const inn = INNS.find(i => i.npcId === npc.id);
              const cost = inn ? Math.max(1, Math.round(inn.cost * diffOf(state).priceMul)) : 0;
              return (
                <button onClick={() => { close(); onInn(npc.id); }} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">
                  🛏️ Rent a Room — sleep until morning (💎 {cost})
                </button>
              );
            })()}
            {npc.service === 'missions' && <button onClick={() => { onService('missions'); close(); }} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">📋 Mission Board</button>}
            {npc.service === 'contribution' && <button onClick={() => { onService('contribution'); close(); }} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">🏛️ Contribution Exchange</button>}
            {npc.service === 'arena' && <button onClick={() => { onService('arena'); close(); }} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">⚔️ Arena Challenges</button>}
            {npcQuests.length > 0 && <button onClick={() => setView('quests')} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">📜 Quests ({npcQuests.length})</button>}
            {npc.id === 'sectElder' && <p className="text-[11px] text-stone-400 px-3">Cultivate at the ✦ terrace by the training ground for ×1.5 cultivation progress.</p>}
            <button onClick={close} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-400">Leave</button>
          </div>
        )}

        {view === 'quests' && (
          <div className="space-y-3">
            <button onClick={() => setView('main')} className="text-[11px] text-stone-400 hover:text-stone-200">← Back</button>
            {npcQuests.map(q => {
              const isActive = state.quests.active.includes(q.id);
              const isDone = state.quests.completed.includes(q.id);
              if (isDone) return <div key={q.id} className="text-xs text-stone-500 px-3 py-2 rounded bg-black/20">✓ {q.name} — completed</div>;
              if (q.requires?.flag && !state.quests.flags?.[q.requires.flag]) return null;
              if (q.objective?.type === 'choice') {
                if (isActive) return (
                  <div key={q.id} className="rounded-lg border border-violet-800/40 bg-violet-900/10 p-3">
                    <div className="text-sm font-semibold text-violet-100">{q.name}</div>
                    <p className="text-[11px] text-stone-400 mt-1 mb-2">{q.description}</p>
                    {q.choices.map((ch, i) => (
                      <button key={i} onClick={() => { dispatch({ type: 'QUEST_CHOICE', questId: q.id, choiceIndex: i }); close(); }}
                        className="block w-full text-left text-xs px-2 py-1.5 rounded bg-white/5 hover:bg-violet-800/30 mb-1">{ch.label}</button>
                    ))}
                  </div>
                );
                return null;
              }
              const met = isActive && objectiveMet(state, q);
              return (
                <div key={q.id} className="rounded-lg border border-stone-800 bg-black/20 p-3">
                  <div className="text-sm font-semibold text-emerald-100">{q.name}</div>
                  <p className="text-[11px] text-stone-400 mt-1">{q.description}</p>
                  {!isActive ? (
                    <button onClick={() => dispatch({ type: 'ACCEPT_QUEST', questId: q.id })} className="mt-2 text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white">Accept</button>
                  ) : met ? (
                    <button onClick={() => { dispatch({ type: 'TURN_IN_QUEST', questId: q.id }); }} className="mt-2 text-xs px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white">Turn in</button>
                  ) : (
                    <div className="mt-2 text-[10px] text-stone-500">In progress…</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}