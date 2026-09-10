import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { AREAS, AREA_BY_ID } from '@/game/data/areas';

export default function MapPanel() {
  const { state, dispatch } = useGame();
  return (
    <div className="pt-3 space-y-3 animate-fade-in">
      <p className="text-xs text-stone-400">Travel instantly between unlocked locations. Resources regrow when you leave an area.</p>
      {AREAS.map(a => {
        const unlocked = state.worldState.unlockedAreas.includes(a.id);
        const here = state.player.currentArea === a.id;
        return (
          <div key={a.id} className={`rounded-xl border p-4 flex justify-between items-center ${here ? 'border-emerald-500/60 bg-emerald-900/10' : unlocked ? 'border-stone-800 bg-black/20' : 'border-stone-900 bg-black/10 opacity-50'}`}>
            <div>
              <div className="text-sm font-semibold text-stone-100">{a.name} {here && <span className="text-[10px] text-emerald-300">(here)</span>}</div>
              <div className="text-[11px] text-stone-400 capitalize">{a.type}</div>
              <p className="text-[11px] text-stone-500 mt-1">{a.description}</p>
            </div>
            {unlocked && !here && (
              <button onClick={() => dispatch({ type: 'APPLY_EFFECTS', effects: { teleport: { area: a.id, x: 8, y: 6 } } })}
                className="text-xs px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap">
                Travel
              </button>
            )}
            {!unlocked && <span className="text-[10px] text-stone-600">🔒 Locked</span>}
          </div>
        );
      })}
    </div>
  );
}