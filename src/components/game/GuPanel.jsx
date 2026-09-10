import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { GU, GU_BY_ID } from '@/game/data/gu';
import { ITEM_BY_ID } from '@/game/data/items';

const TYPE_COLOR = {
  Attack: 'text-rose-300 border-rose-700/40',
  Defense: 'text-sky-300 border-sky-700/40',
  Movement: 'text-emerald-300 border-emerald-700/40',
  Control: 'text-violet-300 border-violet-700/40',
  Healing: 'text-lime-300 border-lime-700/40',
  Investigation: 'text-amber-300 border-amber-700/40',
  Support: 'text-fuchsia-300 border-fuchsia-700/40',
};

function GuCard({ inst, equipped, onEquip, onUnequip }) {
  const gu = GU_BY_ID[inst.guId];
  return (
    <div className={`rounded-lg border p-3 bg-black/20 ${equipped ? 'border-emerald-500/60 bg-emerald-900/10' : 'border-stone-800'}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-semibold text-stone-100">{gu.name}</div>
          <div className={`text-[10px] inline-block px-1.5 rounded border ${TYPE_COLOR[gu.type]}`}>{gu.type} · Rank {gu.rank}</div>
        </div>
        {equipped
          ? <button onClick={() => onUnequip(inst.instanceId)} className="text-[10px] px-2 py-1 rounded bg-emerald-700/40 text-emerald-200">Equipped</button>
          : <button onClick={() => onEquip(inst.instanceId)} className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20">Equip</button>}
      </div>
      <p className="text-[11px] text-stone-400 mt-1.5">{gu.description}</p>
      <div className="text-[10px] text-stone-500 mt-1.5 flex gap-3">
        <span>⚡ {gu.energyCost}</span><span>⏳ {gu.cooldown}</span>
        {gu.element !== 'none' && <span className="capitalize">◈ {gu.element}</span>}
      </div>
    </div>
  );
}

export default function GuPanel() {
  const { state, dispatch } = useGame();
  const [mode, setMode] = useState('owned');
  const equipped = new Set(state.player.equippedGu);

  return (
    <div className="pt-3 animate-fade-in">
      <div className="flex gap-1 mb-3">
        <button onClick={() => setMode('owned')} className={`px-3 py-1.5 rounded-lg text-xs ${mode === 'owned' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-stone-300'}`}>My Gu ({state.ownedGu.length})</button>
        <button onClick={() => setMode('refine')} className={`px-3 py-1.5 rounded-lg text-xs ${mode === 'refine' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-stone-300'}`}>Refine</button>
      </div>

      {mode === 'owned' ? (
        <>
          <p className="text-xs text-stone-400 mb-2">Equipped Gu are usable in combat. Up to 6 may be equipped — build synergies.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {state.ownedGu.map(inst => (
              <GuCard key={inst.instanceId} inst={inst} equipped={equipped.has(inst.instanceId)}
                onEquip={(id) => dispatch({ type: 'EQUIP_GU', instanceId: id })}
                onUnequip={(id) => dispatch({ type: 'UNEQUIP_GU', instanceId: id })} />
            ))}
          </div>
        </>
      ) : (
        <RefineView />
      )}
    </div>
  );
}

function RefineView() {
  const { state, dispatch } = useGame();
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {GU.map(gu => {
        const recipe = gu.refinement;
        const need = { ...recipe }; delete need.primevalEssence;
        const canAfford = Object.entries(need).every(([id, q]) => (state.inventory.materials?.[id] || 0) >= q) && state.player.primevalEssence >= (recipe.primevalEssence || 0);
        const chance = Math.min(95, 70 + state.player.intelligence * 2 + Math.floor(state.player.luck * 0.5));
        return (
          <div key={gu.id} className="rounded-lg border border-stone-800 bg-black/20 p-3">
            <div className="text-sm font-semibold text-stone-100">{gu.name}</div>
            <div className="text-[10px] text-stone-500 mb-1">Rank {gu.rank} · {gu.type}</div>
            <p className="text-[11px] text-stone-400 mb-2">{gu.description}</p>
            <div className="text-[10px] text-stone-400 space-y-0.5">
              {Object.entries(need).map(([id, q]) => {
                const have = state.inventory.materials?.[id] || 0;
                return <div key={id} className={have >= q ? '' : 'text-rose-400'}>{ITEM_BY_ID[id]?.name || id}: {have}/{q}</div>;
              })}
              <div className={state.player.primevalEssence >= (recipe.primevalEssence || 0) ? '' : 'text-rose-400'}>Essence: {state.player.primevalEssence}/{recipe.primevalEssence || 0}</div>
              <div className="text-amber-300/70">Success: {chance}%</div>
            </div>
            <button disabled={!canAfford} onClick={() => dispatch({ type: 'REFINE_GU', guId: gu.id })}
              className={`mt-2 w-full py-1.5 rounded-lg text-xs font-medium ${canAfford ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
              Refine
            </button>
          </div>
        );
      })}
    </div>
  );
}