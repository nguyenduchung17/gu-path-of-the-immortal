import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { sfx } from '@/game/audio/sfx';

const MAX_LOADOUTS = 3;

// Saved Gu loadout presets: capture the currently equipped squad under a name,
// then re-apply it with one click — e.g. "Exploration" vs "Combat".
export default function LoadoutBar() {
  const { state, dispatch } = useGame();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const loadouts = state.loadouts || [];
  if (!state.ownedGu.length) return null;

  const equippedKey = JSON.stringify(state.player.equippedGu);
  const canSave = state.player.equippedGu.length > 0 && name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    sfx('confirm');
    dispatch({ type: 'SAVE_LOADOUT', name: name.trim() });
    setName('');
    setNaming(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-stone-300">🗂️ Saved Loadouts</span>
        {loadouts.length < MAX_LOADOUTS && !naming && (
          <button onClick={() => { sfx('ui'); setNaming(true); }}
            className="text-[10px] text-emerald-300 hover:text-emerald-200">+ Save current</button>
        )}
      </div>
      {naming && (
        <div className="flex gap-1.5 mb-1.5">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={18} autoFocus
            placeholder="e.g. Exploration"
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
            className="flex-1 min-w-0 text-[11px] px-2 py-1 rounded bg-black/40 border border-stone-700 text-stone-200 placeholder:text-stone-600 outline-none focus:border-emerald-600" />
          <button onClick={save} disabled={!canSave}
            className={`text-[10px] px-2 py-1 rounded ${canSave ? 'bg-emerald-700/50 text-emerald-100 hover:bg-emerald-700/70' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>Save</button>
          <button onClick={() => { setNaming(false); setName(''); }}
            className="text-[10px] px-1.5 py-1 rounded text-stone-400 hover:text-stone-100">✕</button>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {loadouts.map(l => {
          const active = JSON.stringify(l.guIds) === equippedKey;
          return (
            <div key={l.id} className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${active ? 'border-emerald-500/60 bg-emerald-900/20' : 'border-stone-800 bg-black/30'}`}>
              <span className={`text-[11px] font-medium ${active ? 'text-emerald-100' : 'text-stone-200'}`}>{l.name}</span>
              <span className="text-[9px] text-stone-500">{l.guIds.length} Gu</span>
              <button onClick={() => { sfx('confirm'); dispatch({ type: 'APPLY_LOADOUT', loadoutId: l.id }); }}
                title={`Equip this squad (${l.guIds.length} Gu)`}
                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-700/40 text-emerald-200 hover:bg-emerald-700/60">Apply</button>
              <button onClick={() => { sfx('ui'); dispatch({ type: 'DELETE_LOADOUT', loadoutId: l.id }); }}
                title="Delete loadout" className="text-[10px] text-stone-500 hover:text-rose-300 px-0.5">✕</button>
            </div>
          );
        })}
        {!loadouts.length && !naming && (
          <span className="text-[10px] text-stone-500">Save your current Gu squad as a preset for one-click switching.</span>
        )}
      </div>
    </div>
  );
}