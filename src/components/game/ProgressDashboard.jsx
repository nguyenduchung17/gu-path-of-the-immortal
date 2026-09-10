import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { REALMS } from '@/game/state/gameReducer';

export default function ProgressDashboard() {
  const { state } = useGame();
  const p = state.player;
  const realm = REALMS[p.realmIndex];
  const atPeak = p.realmIndex >= REALMS.length - 1;
  const nextRealm = atPeak ? null : REALMS[p.realmIndex + 1];
  const pct = atPeak ? 100 : Math.min(100, (p.exp / p.expToNext) * 100);
  const totalInsight = p.totalInsight || 0;

  return (
    <div className="pt-3 space-y-4 animate-fade-in">
      <div className="rounded-xl border border-emerald-900/40 bg-gradient-to-br from-emerald-900/20 to-transparent p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-900 flex items-center justify-center text-2xl shadow-inner">🧘</div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-emerald-300/70">Current Rank</div>
          <div className="text-xl font-semibold text-emerald-100">{realm.name}</div>
          <div className="text-xs text-stone-400">Realm {p.realmIndex + 1} of {REALMS.length} · {p.aptitude} aptitude</div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-800 bg-black/20 p-4">
        <h3 className="text-sm font-semibold text-stone-300 mb-2">Breakthrough Progress</h3>
        {atPeak ? (
          <p className="text-xs text-emerald-200">You stand at the peak of known cultivation.</p>
        ) : (
          <>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>Toward {nextRealm.name}</span>
              <span>{p.exp} / {p.expToNext}</span>
            </div>
            <div className="h-3 rounded-full bg-black/40 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[10px] text-stone-500 mt-1">{p.expToNext - p.exp} insight remaining</div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-stone-800 bg-black/20 p-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-300">Total Insight Gathered</h3>
          <div className="text-[10px] text-stone-500">Lifetime insight from cultivation, battles and deeds</div>
        </div>
        <div className="text-2xl font-bold text-amber-200 whitespace-nowrap">✦ {totalInsight.toLocaleString()}</div>
      </div>
    </div>
  );
}