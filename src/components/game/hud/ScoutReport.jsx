import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { ENEMY_BY_ID, visualOf } from '@/game/data/enemies';
import { exploreActive } from '@/game/engine/exploration';

const AGGR = { passive: 'Passive', territorial: 'Territorial', aggressive: 'Aggressive', predator: 'Predator', guard: 'Guardian' };

// Scouting report — while a scouting Gu's vision is active, every enemy in
// range is laid bare: rank, exact HP, weakness, resistances and aggression.
// Without scouting, the wilds show you shapes, not stats.
export default function ScoutReport() {
  const { state } = useGame();
  const act = exploreActive(state);
  if (!act.vision) return null;
  const p = state.player;
  const r = act.vision.radius || 9;
  const seen = (state.worldState.enemies || []).filter(e =>
    !e.dead && Math.max(Math.abs(e.x - p.x), Math.abs(e.y - p.y)) <= r + 6);

  return (
    <div className="absolute top-28 left-2.5 z-20 w-52 rounded-lg bg-black/55 backdrop-blur border border-amber-700/40 p-2 animate-fade-in">
      <div className="text-[10px] uppercase tracking-wider text-amber-200/90 mb-1">👁️ Scouting</div>
      {!seen.length && <div className="text-[10px] text-stone-400">No threats within {r} paces.</div>}
      {seen.slice(0, 5).map(e => {
        const def = ENEMY_BY_ID[e.defId];
        const v = visualOf(e.defId);
        return (
          <div key={e.id} className="text-[10px] mb-1 pb-1 border-b border-stone-700/40 last:border-0 last:mb-0 last:pb-0">
            <div className="flex justify-between gap-2">
              <span className="text-stone-200 font-medium truncate">
                {def.name}{e.state === 'chase' && <span className="text-rose-400"> !</span>}{e.state === 'alert' && <span className="text-amber-400"> ?</span>}
              </span>
              <span className="text-stone-400 shrink-0">{Math.round(e.hp)}/{def.hp}</span>
            </div>
            <div className="text-stone-500">{v.rank} · {AGGR[e.behavior || def.behavior] || 'Beast'}</div>
            <div className="text-stone-500">
              Weakness: <span className="capitalize">{def.weakness || '—'}</span>
              {def.resists?.length ? ` · Resists: ${def.resists.join(', ')}` : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}