import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { MISSIONS } from '@/game/data/missions';
import { objectiveMet } from '@/game/state/gameReducer';
import { ITEM_BY_ID } from '@/game/data/items';
import { GU_BY_ID } from '@/game/data/gu';
import { RECIPE_BY_ID } from '@/game/data/recipes';

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

function progressText(state, o) {
  if (o.type === 'gather') return `${state.inventory.materials[o.item] || 0} / ${o.qty} ${ITEM_BY_ID[o.item]?.name || o.item}`;
  if (o.type === 'hunt' || o.type === 'defeat') return `Defeated: ${state.quests.kills[o.enemy] || 0} / ${o.qty}`;
  return '';
}

function rewardText(m) {
  const parts = [`💎 ${m.rewards.spiritStones}`, `🏛 ${m.rewards.contribution} contribution`];
  if (m.rewards.items) parts.push(Object.entries(m.rewards.items).map(([k, v]) => `${v}× ${ITEM_BY_ID[k]?.name || k}`).join(', '));
  if (m.rewards.recipes) parts.push(m.rewards.recipes.map(r => `${GU_BY_ID[RECIPE_BY_ID[r].guId].name} Recipe`).join(', '));
  return parts.join(' · ');
}

export default function MissionBoard({ onClose }) {
  const { state, dispatch } = useGame();
  const cp = state.contribution?.greenValley || 0;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="max-w-lg w-full max-h-[85vh] overflow-y-auto scrollbar-thin rounded-2xl border border-amber-800/50 bg-[#0d1410] p-5 animate-pop">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div>
            <h2 className="text-base font-semibold text-amber-100">📋 Valley Mission Board</h2>
            <p className="text-[11px] text-stone-400">Accept a mission, complete its objective, then return here to claim the reward.</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-amber-300 font-semibold">🏛 {cp}</div>
            <div className="text-[10px] text-stone-500">Contribution</div>
          </div>
        </div>

        <div className="space-y-2">
          {MISSIONS.map(m => {
            const active = (state.missions?.active || []).includes(m.id);
            const done = (state.missions?.completed || []).includes(m.id);
            const met = active && objectiveMet(state, m);
            return (
              <div key={m.id} className={`rounded-xl border p-3 ${done ? 'border-stone-800/50 bg-black/10 opacity-60' : active ? 'border-amber-700/40 bg-amber-900/10' : 'border-stone-800 bg-black/20'}`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="text-sm font-semibold text-stone-100">{m.name}</div>
                  <div className="text-[11px] text-amber-400/90 whitespace-nowrap">{stars(m.difficulty)}</div>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">{m.description}</p>
                <div className="text-[11px] text-stone-300 mt-2">
                  <span className="text-stone-500">Reward:</span> {rewardText(m)}
                </div>
                {done ? (
                  <div className="mt-2 text-[11px] text-stone-500">✓ Completed</div>
                ) : met ? (
                  <button onClick={() => dispatch({ type: 'MISSION_TURN_IN', missionId: m.id })}
                    className="mt-2 text-xs px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white">Claim Reward</button>
                ) : active ? (
                  <div className="mt-2 text-[11px] text-amber-300/80">{progressText(state, m.objective)} — in progress</div>
                ) : (
                  <button onClick={() => dispatch({ type: 'MISSION_ACCEPT', missionId: m.id })}
                    className="mt-2 text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white">Accept Mission</button>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-300">Close</button>
      </div>
    </div>
  );
}