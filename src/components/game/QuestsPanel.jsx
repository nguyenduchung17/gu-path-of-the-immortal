import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { QUEST_BY_ID } from '@/game/data/quests';
import { objectiveMet } from '@/game/state/gameReducer';
import { ITEM_BY_ID } from '@/game/data/items';

function progressText(state, q) {
  const o = q.objective;
  if (o.type === 'gather') return `${state.inventory.materials[o.item] || 0} / ${o.qty} ${ITEM_BY_ID[o.item]?.name}`;
  if (o.type === 'hunt' || o.type === 'defeat') return `${state.quests.kills[o.enemy] || 0} / ${o.qty}`;
  if (o.type === 'reach') return !!(state.worldState.discovered?.zones?.[o.area]) ? 'Reached' : 'Not reached';
  return '';
}

export default function QuestsPanel() {
  const { state } = useGame();
  const active = state.quests.active.map(id => QUEST_BY_ID[id]).filter(Boolean);
  const done = state.quests.completed.map(id => QUEST_BY_ID[id]).filter(Boolean);
  return (
    <div className="pt-3 space-y-4 animate-fade-in">
      <div>
        <h3 className="text-sm font-semibold text-stone-300 mb-2">Active Quests</h3>
        {active.length === 0 && <div className="text-stone-500 text-sm">No active quests. Speak with NPCs to begin.</div>}
        <div className="space-y-2">
          {active.map(q => {
            const met = objectiveMet(state, q);
            return (
              <div key={q.id} className="rounded-lg border border-stone-800 bg-black/20 p-3">
                <div className="flex justify-between items-start">
                  <div className="text-sm font-semibold text-emerald-100">{q.name}</div>
                  <div className={`text-[10px] px-2 py-0.5 rounded ${met ? 'bg-emerald-700/50 text-emerald-200' : 'bg-stone-800 text-stone-400'}`}>
                    {met ? 'Ready to turn in' : progressText(state, q)}
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">{q.description}</p>
                <p className="text-[10px] text-amber-300/70 mt-1">Reward available from {q.giver}</p>
              </div>
            );
          })}
        </div>
      </div>
      {done.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-400 mb-2">Completed</h3>
          <div className="space-y-2">
            {done.map(q => (
              <div key={q.id} className="rounded-lg border border-stone-800/50 bg-black/10 p-2 opacity-70">
                <div className="text-sm text-stone-300">✓ {q.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}