import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { GU_BY_ID } from '@/game/data/gu';
import { PATH_BY_ID, SYNERGIES } from '@/game/data/paths';
import { effectiveCost } from '@/game/engine/combat';

const TYPE_COLOR = {
  Attack: 'text-rose-300 border-rose-700/40',
  Defense: 'text-sky-300 border-sky-700/40',
  Movement: 'text-emerald-300 border-emerald-700/40',
  Control: 'text-violet-300 border-violet-700/40',
  Healing: 'text-lime-300 border-lime-700/40',
  Summon: 'text-fuchsia-300 border-fuchsia-700/40',
  Investigation: 'text-amber-300 border-amber-700/40',
  Support: 'text-fuchsia-300 border-fuchsia-700/40',
};

function GuCard({ inst, equipped, onEquip, onUnequip, state }) {
  const gu = GU_BY_ID[inst.guId];
  const path = PATH_BY_ID[gu.path];
  const cost = effectiveCost(gu, state);
  return (
    <div className={`rounded-lg border p-3 bg-black/20 ${equipped ? 'border-emerald-500/60 bg-emerald-900/10' : 'border-stone-800'}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-semibold text-stone-100">{gu.name}</div>
          <div className="flex gap-1 items-center mt-0.5">
            <div className={`text-[10px] inline-block px-1.5 rounded border ${TYPE_COLOR[gu.type]}`}>{gu.type}</div>
            <div className={`text-[10px] inline-block px-1.5 rounded border ${path.border} ${path.color}`}>{path.icon} {path.name}</div>
          </div>
        </div>
        {equipped
          ? <button onClick={() => onUnequip(inst.instanceId)} className="text-[10px] px-2 py-1 rounded bg-emerald-700/40 text-emerald-200">Equipped</button>
          : <button onClick={() => onEquip(inst.instanceId)} className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20">Equip</button>}
      </div>
      <p className="text-[11px] text-stone-400 mt-1.5">{gu.description}</p>
      <div className="text-[10px] text-stone-500 mt-1.5 flex gap-3">
        <span>⚡ {cost}{cost !== gu.energyCost && <span className="text-emerald-400"> (−mastery)</span>}</span>
        <span>⏳ {gu.cooldown}</span>
        <span className="capitalize">{gu.rarity}</span>
      </div>
    </div>
  );
}

export default function GuPanel() {
  const { state, dispatch } = useGame();
  const equipped = new Set(state.player.equippedGu);
  const equippedPaths = new Set(state.player.equippedGu.map(id => {
    const inst = state.ownedGu.find(g => g.instanceId === id);
    return inst && GU_BY_ID[inst.guId].path;
  }));
  const activeSyn = SYNERGIES.filter(sy => sy.paths.every(p => equippedPaths.has(p)));

  return (
    <div className="pt-3 animate-fade-in">
      <p className="text-xs text-stone-400 mb-2">
        Equipped Gu are usable in combat (up to 6). Using Gu of a Path in battle deepens your mastery of that Path.
      </p>

      {activeSyn.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-700/40 bg-amber-900/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-amber-300/80 mb-1">Active Synergies</div>
          {activeSyn.map(sy => (
            <div key={sy.id} className="text-xs text-amber-200"><b>{sy.name}</b> — <span className="text-stone-400">{sy.desc}</span></div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        {state.ownedGu.map(inst => (
          <GuCard key={inst.instanceId} inst={inst} equipped={equipped.has(inst.instanceId)} state={state}
            onEquip={(id) => dispatch({ type: 'EQUIP_GU', instanceId: id })}
            onUnequip={(id) => dispatch({ type: 'UNEQUIP_GU', instanceId: id })} />
        ))}
      </div>
      {state.ownedGu.length === 0 && <div className="text-stone-500 text-sm py-6 text-center">You own no Gu yet.</div>}
    </div>
  );
}