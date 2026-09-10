import React, { useEffect } from 'react';
import { useGame } from '@/game/state/GameContext';
import { GU_BY_ID } from '@/game/data/gu';
import { exploreActive, exploreCdLeft } from '@/game/engine/exploration';
import { sfx } from '@/game/audio/sfx';

// Quick-use exploration Gu bar (hotkeys 1–4): scouting, stealth, travel haste
// and tactical root/slow — activated without opening any menu. Essence cost
// and cooldown are shown right on the chip; control Gu auto-target the
// nearest enemy in range.
export default function ExploreBar() {
  const { state, dispatch } = useGame();
  const busy = !!(state.combat || state.pendingEvent || state.dialogue || state.recovery || state.sleeping || state.wildEncounter || state.deceased);
  const items = state.player.equippedGu
    .map(id => state.ownedGu.find(g => g.instanceId === id))
    .filter(inst => inst && GU_BY_ID[inst.guId].explore)
    .slice(0, 4);

  useEffect(() => {
    const onKey = (e) => {
      const n = parseInt(e.key, 10);
      if (!n || n < 1 || n > items.length || busy || e.repeat) return;
      sfx('ui');
      dispatch({ type: 'USE_EXPLORE_GU', instanceId: items[n - 1].instanceId });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.map(i => i.instanceId).join(','), busy]);

  if (!items.length || busy) return null;
  const act = exploreActive(state);

  return (
    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
      {items.map((inst, i) => {
        const gu = GU_BY_ID[inst.guId];
        const ex = gu.explore;
        const cd = exploreCdLeft(state, inst);
        const noEss = state.player.primevalEssence < ex.essence;
        const activeNow = act[ex.kind];
        const dim = cd > 0 || noEss;
        return (
          <button key={inst.instanceId}
            onClick={() => { sfx('ui'); dispatch({ type: 'USE_EXPLORE_GU', instanceId: inst.instanceId }); }}
            title={`${gu.name} — ${ex.kind} · ${ex.essence} essence · ${cd > 0 ? `${Math.ceil(cd)} min cooldown` : 'ready'}`}
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 backdrop-blur text-left transition ${
              activeNow ? 'border-amber-400/70 bg-amber-900/40 text-amber-100'
                : dim ? 'bg-black/40 border-stone-700/60 text-stone-500'
                : 'bg-black/50 border-emerald-700/50 text-emerald-100 hover:bg-emerald-900/40'}`}>
            <span className="text-[9px] text-stone-400 border border-stone-600/60 rounded px-1 shrink-0">{i + 1}</span>
            <span className="text-[11px] truncate">{gu.name.replace(' Gu', '')}</span>
            <span className="text-[9px] shrink-0">⚡{ex.essence}</span>
            {cd > 0 && <span className="text-[9px] shrink-0">⏳{Math.ceil(cd)}</span>}
          </button>
        );
      })}
    </div>
  );
}