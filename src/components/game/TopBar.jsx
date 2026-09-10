import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { REALMS } from '@/game/state/gameReducer';

const TABS = [
  { id: 'world', label: 'World', icon: '🗺️' },
  { id: 'character', label: 'Cultivator', icon: '🧘' },
  { id: 'gu', label: 'Gu', icon: '🐉' },
  { id: 'inventory', label: 'Inventory', icon: '🎒' },
  { id: 'quests', label: 'Quests', icon: '📜' },
  { id: 'map', label: 'Map', icon: '🧭' },
];

function Bar({ value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 rounded-full bg-black/40 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function TopBar({ tab, setTab }) {
  const { state, reset } = useGame();
  const p = state.player;
  const realm = REALMS[p.realmIndex];
  return (
    <div className="sticky top-0 z-30 bg-[#0d1410]/95 backdrop-blur border-b border-emerald-900/40">
      <div className="max-w-6xl mx-auto px-3 py-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 flex items-center justify-center text-lg shadow-inner">🧑</div>
            <div>
              <div className="text-sm font-semibold leading-tight">{p.name}</div>
              <div className="text-[10px] text-emerald-300/80 leading-tight">{realm.name} · {p.aptitude} apt</div>
            </div>
          </div>
          <div className="flex-1 min-w-[140px] grid grid-cols-2 gap-2 max-w-xs">
            <div>
              <div className="text-[10px] text-rose-300/80">HP {p.hp}/{p.maxHp}</div>
              <Bar value={p.hp} max={p.maxHp} color="linear-gradient(90deg,#e11d48,#fb7185)" />
            </div>
            <div>
              <div className="text-[10px] text-sky-300/80">Essence {p.primevalEssence}/{p.maxPrimevalEssence}</div>
              <Bar value={p.primevalEssence} max={p.maxPrimevalEssence} color="linear-gradient(90deg,#0284c7,#7dd3fc)" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-200">
            💎 {p.spiritStones}
          </div>
          <button onClick={() => { if (confirm('Abandon this cultivator and start anew? Progress will be lost.')) reset(); }} className="text-[10px] text-stone-400 hover:text-rose-300 px-2 py-1 rounded border border-stone-700">Reset</button>
        </div>
        <div className="mt-2 flex gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${tab === t.id ? 'bg-emerald-600 text-white shadow' : 'bg-white/5 text-stone-300 hover:bg-white/10'}`}>
              <span className="mr-1">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}