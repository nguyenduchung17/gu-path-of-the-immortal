import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { REALMS } from '@/game/state/gameReducer';

function Stat({ label, value }) {
  return (
    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-white/5">
      <span className="text-xs text-stone-400">{label}</span>
      <span className="text-sm font-semibold text-emerald-100">{value}</span>
    </div>
  );
}

export default function CharacterPanel() {
  const { state, dispatch } = useGame();
  const p = state.player;
  const realm = REALMS[p.realmIndex];
  const cost = 10 * (p.realmIndex + 1);
  const atSect = p.currentArea === 'cultivationSect';
  const expPct = Math.min(100, (p.exp / p.expToNext) * 100);

  return (
    <div className="pt-3 space-y-4 animate-fade-in">
      <div className="rounded-xl border border-emerald-900/40 bg-gradient-to-br from-emerald-900/20 to-transparent p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-900 flex items-center justify-center text-3xl shadow-inner">🧑‍🌾</div>
          <div>
            <h2 className="text-xl font-semibold text-emerald-100">{p.name}</h2>
            <div className="text-xs text-stone-400">{p.age} yrs · {p.gender} · {realm.name} cultivator</div>
            <div className="text-xs text-amber-200/80 mt-0.5">Aptitude: {p.aptitude}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-800 bg-black/20 p-4">
        <h3 className="text-sm font-semibold text-stone-300 mb-2">Cultivation</h3>
        <div className="text-xs text-stone-400 mb-1">Insight toward {REALMS[Math.min(3, p.realmIndex + 1)].name}</div>
        <div className="h-3 rounded-full bg-black/40 overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500" style={{ width: `${expPct}%` }} />
        </div>
        <div className="text-[11px] text-stone-500 mb-3">{p.exp} / {p.expToNext} insight · Realm {p.realmIndex + 1} / 4</div>
        <button onClick={() => dispatch({ type: 'CULTIVATE' })}
          className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition">
          🧘 Cultivate (cost {cost} essence{atSect ? ' · +50% sect bonus' : ''})
        </button>
        <p className="text-[10px] text-stone-500 mt-2">Cultivate at the Azure Cloud Sect for faster breakthroughs. Higher aptitude grants more insight per session.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Stat label="Health" value={`${p.hp}/${p.maxHp}`} />
        <Stat label="Primeval Essence" value={`${p.primevalEssence}/${p.maxPrimevalEssence}`} />
        <Stat label="Willpower" value={p.willpower} />
        <Stat label="Strength" value={p.strength} />
        <Stat label="Agility" value={p.agility} />
        <Stat label="Perception" value={p.perception} />
        <Stat label="Intelligence" value={p.intelligence} />
        <Stat label="Luck" value={p.luck} />
        <Stat label="Spirit Stones" value={p.spiritStones} />
      </div>

      <div className="rounded-xl border border-stone-800 bg-black/20 p-4">
        <h3 className="text-sm font-semibold text-stone-300 mb-2">Reputation</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(state.reputation).map(([f, v]) => (
            <div key={f} className="flex justify-between text-xs px-3 py-1.5 rounded-lg bg-white/5">
              <span className="capitalize text-stone-400">{f}</span>
              <span className={v > 0 ? 'text-emerald-300' : v < 0 ? 'text-rose-300' : 'text-stone-300'}>{v > 0 ? '+' : ''}{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}