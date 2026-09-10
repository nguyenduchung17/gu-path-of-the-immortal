import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { hazardAt } from '@/game/data/world';
import { exploreActive } from '@/game/engine/exploration';
import { BALANCE } from '@/game/config/balance';

const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// World-hazard indicator: warns while standing in the poison miasma (or
// notes Mist Veil's protection) and hints at the uncrossable rapids ahead.
export default function HazardBadge() {
  const { state } = useGame();
  const p = state.player;
  const act = exploreActive(state);

  const here = hazardAt(p.x, p.y);
  const slowOf = (k) => (BALANCE.exploration.hazardSlowMinutes || {})[k] || 0;
  if (here?.kind === 'miasma') {
    return act.stealth
      ? <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 rounded-full bg-sky-950/70 border border-sky-700/60 px-3 py-1 text-[10px] text-sky-200 backdrop-blur animate-fade-in">🌫️ Mist Veil shields you — the miasma slides past harmlessly</div>
      : <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 rounded-full bg-rose-950/70 border border-rose-700/60 px-3 py-1 text-[10px] text-rose-200 backdrop-blur animate-fade-in">☠️ Poison Miasma — every step burns (-{BALANCE.exploration.hazardDmg} HP, +{slowOf('miasma')} min)</div>;
  }
  if (here?.kind === 'unstable') {
    return act.steady
      ? <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 rounded-full bg-amber-950/70 border border-amber-700/60 px-3 py-1 text-[10px] text-amber-200 backdrop-blur animate-fade-in">⛰️ Stone Shell anchors you — {here.name} cannot slow your steps</div>
      : <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 rounded-full bg-orange-950/70 border border-orange-700/60 px-3 py-1 text-[10px] text-orange-200 backdrop-blur animate-fade-in">⚠️ {here.name} — shifting ground slows every step (+{slowOf('unstable')} min)</div>;
  }
  const nearRapids = ORTH.some(([dx, dy]) => hazardAt(p.x + dx, p.y + dy)?.kind === 'rapids');
  if (nearRapids && !act.waterwalk) {
    return <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 rounded-full bg-rose-950/70 border border-rose-700/60 px-3 py-1 text-[10px] text-rose-200 backdrop-blur animate-fade-in">⚠️ Raging Rapids ahead — a binding Gu could still the waters</div>;
  }
  return null;
}