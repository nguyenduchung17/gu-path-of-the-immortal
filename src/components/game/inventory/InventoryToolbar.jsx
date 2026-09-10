import React from 'react';

const FILTERS = [
  { id: 'all', icon: '🎒', label: 'All' },
  { id: 'combat', icon: '⚔️', label: 'Gu & Combat' },
  { id: 'consumables', icon: '🍖', label: 'Consumables' },
  { id: 'materials', icon: '🪵', label: 'Materials' },
  { id: 'quest', icon: '📜', label: 'Quest' },
];
const SORTS = [
  { id: 'category', label: 'Category' },
  { id: 'name', label: 'Name' },
  { id: 'value', label: 'Value' },
  { id: 'qty', label: 'Qty' },
];

// Filter + sort controls for the inventory — one-click separation of combat
// gear, consumables and crafting materials.
export default function InventoryToolbar({ filter, onFilter, sort, onSort, counts }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => onFilter(f.id)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
              filter === f.id
                ? 'bg-emerald-700/70 border-emerald-500/60 text-white'
                : 'bg-black/30 border-stone-700 text-stone-300 hover:bg-white/10'
            }`}>
            {f.icon} {f.label}{counts[f.id] > 0 && <span className="opacity-70 ml-1">{counts[f.id]}</span>}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
        <span>Sort:</span>
        {SORTS.map(sd => (
          <button key={sd.id} onClick={() => onSort(sd.id)}
            className={`px-2 py-0.5 rounded border transition ${
              sort === sd.id
                ? 'bg-white/15 border-stone-500 text-stone-100'
                : 'bg-transparent border-stone-800 text-stone-400 hover:text-stone-200'
            }`}>
            {sd.label}
          </button>
        ))}
      </div>
    </div>
  );
}