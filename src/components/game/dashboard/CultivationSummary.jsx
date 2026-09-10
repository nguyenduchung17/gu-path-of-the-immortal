import React from 'react';
import { tierOf } from '@/game/config/aptitude';
import { CULTIVATION_STAGES } from '@/game/data/cultivation';

// Cultivation snapshot card — stage, progress toward breakthrough, essence, insight.
export default function CultivationSummary({ player, stage, day }) {
  const p = player;
  const g = p.rank * 4 + (p.stage || 0);
  const next = g < 19 ? CULTIVATION_STAGES[g + 1] : null;
  const tier = tierOf(p.aptitude);
  const prog = Math.max(0, Math.min(100, p.cultivationProgress || 0));
  return (
    <section className="rounded-2xl border border-emerald-800/40 bg-[#10181a] p-4">
      <h2 className="font-heading text-sm text-emerald-200">🧘 Cultivation Progress</h2>
      <div className="mt-2 text-lg font-semibold text-stone-100">{p.name}</div>
      <div className="text-[11px] text-stone-400">{stage.name} · Aptitude {tier.id.toUpperCase()}-TIER</div>
      <div className="mt-3 text-[11px] text-stone-400 flex justify-between">
        <span>{prog >= 100 ? 'Breakthrough ready!' : `Toward ${next ? next.name : 'Ascension'}`}</span>
        <span>{Math.floor(prog)}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-black/50 overflow-hidden border border-black/40 mt-1">
        <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-all duration-700" style={{ width: `${prog}%` }} />
      </div>
      <div className="mt-3 text-[11px] text-stone-400 flex justify-between">
        <span>Primeval Essence</span>
        <span>{Math.floor(p.primevalEssence)}/{Math.round(p.maxPrimevalEssence)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-black/50 overflow-hidden border border-black/40 mt-1">
        <div className="h-full bg-gradient-to-r from-sky-600 to-cyan-300 transition-all duration-700" style={{ width: `${Math.max(0, (p.primevalEssence / p.maxPrimevalEssence) * 100)}%` }} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
        <div className="flex justify-between"><dt className="text-stone-400">Insight</dt><dd>✦ {p.totalInsight || 0}</dd></div>
        <div className="flex justify-between"><dt className="text-stone-400">Stones</dt><dd>💎 {p.spiritStones}</dd></div>
        <div className="flex justify-between"><dt className="text-stone-400">HP</dt><dd>{Math.floor(p.hp)}/{p.maxHp}</dd></div>
        <div className="flex justify-between"><dt className="text-stone-400">In-game day</dt><dd>{day}</dd></div>
      </dl>
    </section>
  );
}