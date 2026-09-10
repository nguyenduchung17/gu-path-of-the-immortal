import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { ITEM_BY_ID, ITEM_CATEGORIES } from '@/game/data/items';
import InventoryToolbar from './inventory/InventoryToolbar';
import QuickLoadout from './inventory/QuickLoadout';

const CAT_LABEL = { materials: 'Materials', medicine: 'Medicine', food: 'Food', guFood: 'Gu Feed', guGear: 'Gu Gear', questItems: 'Quest Items', equipment: 'Equipment' };
const FILTER_CATS = {
  all: ITEM_CATEGORIES,
  combat: ['guFood', 'guGear'],
  consumables: ['food', 'medicine'],
  materials: ['materials'],
  quest: ['questItems'],
};
const SORTERS = {
  category: null,
  name: (a, b) => (ITEM_BY_ID[a[0]]?.name || '').localeCompare(ITEM_BY_ID[b[0]]?.name || ''),
  value: (a, b) => (ITEM_BY_ID[b[0]]?.value || 0) - (ITEM_BY_ID[a[0]]?.value || 0),
  qty: (a, b) => b[1] - a[1],
};

export default function InventoryPanel() {
  const { state, dispatch } = useGame();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('category');

  const stacksOf = (cats) => cats.reduce((n, c) => n + Object.values(state.inventory[c] || {}).filter(q => q > 0).length, 0);
  const counts = Object.fromEntries(Object.keys(FILTER_CATS).map(k => [k, stacksOf(FILTER_CATS[k])]));

  const sections = FILTER_CATS[filter]
    .map(cat => ({ cat, entries: Object.entries(state.inventory[cat] || {}).filter(([, q]) => q > 0) }))
    .filter(sec => sec.entries.length > 0)
    .map(sec => ({ ...sec, entries: SORTERS[sort] ? [...sec.entries].sort(SORTERS[sort]) : sec.entries }));

  const total = stacksOf(ITEM_CATEGORIES);

  return (
    <div className="pt-2 space-y-4 animate-fade-in">
      <QuickLoadout />
      <InventoryToolbar filter={filter} onFilter={setFilter} sort={sort} onSort={setSort} counts={counts} />
      {sections.map(({ cat, entries }) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-stone-300 mb-2">{CAT_LABEL[cat] || cat}</h3>
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
      ))}
      {total === 0 && <div className="text-center text-stone-500 py-12 text-sm">Your pouch is empty. Go gather.</div>}
      {total > 0 && sections.length === 0 && (
        <div className="text-center text-stone-500 py-10 text-sm">Nothing in this category.</div>
      )}
    </div>
  );
}