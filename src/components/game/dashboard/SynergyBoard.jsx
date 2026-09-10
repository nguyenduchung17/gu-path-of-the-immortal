import React from 'react';
import { SYNERGIES, PATH_BY_ID } from '@/game/data/paths';

// Active Gu synergies — a synergy lights up when every listed path is equipped.
export default function SynergyBoard({ equippedPaths }) {
  return (
    <section className="rounded-2xl border border-violet-800/40 bg-[#10181a] p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm text-violet-200">🐉 Gu Synergies</h2>
        <span className="text-[10px] text-stone-500">{equippedPaths.size} path{equippedPaths.size === 1 ? '' : 's'} equipped</span>
      </div>
      <ul className="mt-2.5 space-y-2">
        {SYNERGIES.map(sy => {
          const active = sy.paths.every(p => equippedPaths.has(p));
          return (
            <li key={sy.id} className={`rounded-xl border px-3 py-2 ${active ? 'border-emerald-600/60 bg-emerald-950/30' : 'border-stone-800 bg-black/20 opacity-60'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-stone-100">{sy.name}</span>
                {active ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">ACTIVE</span>
                ) : (
                  <span className="text-[9px] text-stone-500">equip {sy.paths.map(p => PATH_BY_ID[p]?.icon || p).join(' ')}</span>
                )}
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">{sy.desc}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}