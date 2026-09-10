import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { NPC_BY_ID } from '@/game/data/npcs';
import { ITEM_BY_ID } from '@/game/data/items';
import { GU_BY_ID } from '@/game/data/gu';
import { questStatusOf, questView, QS } from '@/game/engine/questEngine';

export const rewardText = (rw) => {
  if (!rw) return null;
  const parts = [];
  if (rw.spiritStones) parts.push(`💎 ${rw.spiritStones}`);
  if (rw.contribution) parts.push(`🏛️ +${rw.contribution} contribution`);
  if (rw.items) for (const [id, n] of Object.entries(rw.items)) parts.push(`${ITEM_BY_ID[id]?.name || id} ×${n}`);
  if (rw.giveGu && GU_BY_ID[rw.giveGu]) parts.push(`🐉 ${GU_BY_ID[rw.giveGu].name}`);
  if (rw.recipes?.length) parts.push(`📖 ${rw.recipes.length} recipe${rw.recipes.length > 1 ? 's' : ''}`);
  if (rw.reputation) for (const [f, d] of Object.entries(rw.reputation)) parts.push(`${f} ${d > 0 ? '+' : ''}${d} rep`);
  return parts.join(' · ');
};

// One active-quest card: giver, description, per-objective progress, hint,
// rewards, suggested difficulty and track/abandon controls.
export default function QuestCard({ q, tracked }) {
  const { state, dispatch } = useGame();
  const status = questStatusOf(state, q);
  const view = questView(state, q);
  const ready = status === QS.TURN_IN_READY;
  return (
    <div className={`rounded-lg border p-3 ${ready ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800 bg-black/20'}`}>
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="text-sm font-semibold text-emerald-100">{q.name}</div>
          <div className="text-[10px] text-stone-500">
            Giver: {NPC_BY_ID[q.giver]?.name || q.giver}{q.difficulty ? ` · Suggested: ${q.difficulty}` : ''}
          </div>
        </div>
        <span className={`text-[9px] px-2 py-0.5 rounded shrink-0 ${ready ? 'bg-amber-700/60 text-amber-100' : 'bg-stone-800 text-stone-400'}`}>
          {ready ? 'READY TO TURN IN' : 'IN PROGRESS'}
        </span>
      </div>
      <p className="text-[11px] text-stone-400 mt-1">{q.description}</p>
      <div className="mt-2 space-y-1">
        {view.map(o => (
          <div key={o.id} className="flex justify-between text-[11px]">
            <span className={o.done ? 'text-emerald-300' : 'text-stone-300'}>{o.done ? '✓' : '•'} {o.label}</span>
            <span className={o.done ? 'text-emerald-300' : 'text-stone-400'}>{o.cur} / {o.req}</span>
          </div>
        ))}
      </div>
      {q.hint && <p className="text-[10px] text-stone-500 mt-1.5 italic">🗺️ {q.hint}</p>}
      <div className="text-[10px] text-amber-300/70 mt-1.5">Rewards: {rewardText(q.rewards) || '—'}</div>
      <div className="flex gap-2 mt-2">
        <button onClick={() => dispatch({ type: 'TRACK_QUEST', questId: q.id })}
          className={`text-[10px] px-2.5 py-1 rounded ${tracked ? 'bg-emerald-700/50 text-emerald-100' : 'bg-white/5 text-stone-300 hover:bg-white/10'}`}>
          {tracked ? '✓ Tracking' : 'Track'}
        </button>
        <button onClick={() => dispatch({ type: 'ABANDON_QUEST', questId: q.id })}
          className="text-[10px] px-2.5 py-1 rounded bg-white/5 text-stone-500 hover:text-rose-300 hover:bg-white/10">Abandon</button>
      </div>
    </div>
  );
}