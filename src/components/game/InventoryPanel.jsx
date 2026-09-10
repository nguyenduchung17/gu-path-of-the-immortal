import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { ITEM_BY_ID, ITEM_CATEGORIES } from '@/game/data/items';

const CAT_LABEL = { materials: 'Materials', medicine: 'Medicine', food: 'Food', questItems: 'Quest Items', equipment: 'Equipment' };

export default function InventoryPanel() {
  const { state, dispatch } = useGame();
  return (
    <div className="pt-3 space-y-4 animate-fade-in">
      {ITEM_CATEGORIES.map(cat => {
        const items = state.inventory[cat] || {};
        const entries = Object.entries(items).filter(([, q]) => q > 0);
        if (entries.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="text-sm font-semibold text-stone-300 mb-2">{CAT_LABEL[cat]}</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {entries.map(([id, qty]) => {
                const it = ITEM_BY_ID[id];
                if (!it) return null;
                return (
                  <div key={id} className="rounded-lg border border-stone-800 bg-black/20 p-3 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-stone-100">{it.name} <span className="text-stone-500">×{qty}</span></div>
                      <p className="text-[11px] text-stone-400 mt-0.5">{it.description}</p>
                      <div className="text-[10px] text-amber-300/70 mt-1">Value: {it.value} 💎</div>
                    </div>
                    {it.use && (
                      <button onClick={() => dispatch({ type: 'USE_ITEM', itemId: id })}
                        className="ml-2 text-[11px] px-2 py-1 rounded bg-emerald-700/40 text-emerald-200 hover:bg-emerald-700/60 whitespace-nowrap">
                        Use
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {ITEM_CATEGORIES.every(c => Object.values(state.inventory[c] || {}).filter(q => q > 0).length === 0) && (
        <div className="text-center text-stone-500 py-12 text-sm">Your pouch is empty. Go gather.</div>
      )}
    </div>
  );
}