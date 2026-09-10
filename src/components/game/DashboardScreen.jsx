import React, { useMemo } from 'react';
import { useGame } from '@/game/state/GameContext';
import { GU_BY_ID } from '@/game/data/gu';
import { SYNERGIES, PATH_BY_ID } from '@/game/data/paths';
import { CULTIVATION_STAGES } from '@/game/data/cultivation';
import CultivationSummary from './dashboard/CultivationSummary';
import SynergyBoard from './dashboard/SynergyBoard';
import MasteryBoard from './dashboard/MasteryBoard';
import SheetSyncPanel from './dashboard/SheetSyncPanel';

// Dedicated full-screen dashboard: cultivation progress, active Gu synergies
// and path mastery in one view — plus daily Google Sheets milestone sync.
export default function DashboardScreen({ onClose }) {
  const { state: s } = useGame();
  const p = s.player;
  const g = p.rank * 4 + (p.stage || 0);
  const stage = CULTIVATION_STAGES[Math.min(19, g)];

  const equippedPaths = useMemo(() => new Set((p.equippedGu || []).map(id => {
    const inst = s.ownedGu.find(o => o.instanceId === id);
    return inst && GU_BY_ID[inst.guId]?.path;
  }).filter(Boolean)), [p.equippedGu, s.ownedGu]);

  const masteryPaths = useMemo(() => {
    const ids = [...new Set([...(s.knownPaths || []), ...Object.keys(s.mastery || {})])];
    return ids
      .map(id => ({ id, m: s.mastery?.[id] || { level: 1, xp: 0 } }))
      .sort((a, b) => b.m.level - a.m.level || b.m.xp - a.m.xp);
  }, [s.knownPaths, s.mastery]);

  const snapshot = {
    dateKey: new Date().toLocaleDateString('sv-SE'), // local YYYY-MM-DD
    inGameDay: s.time?.day || 1,
    character: p.name,
    stageName: stage.name,
    cultivationProgress: Math.floor(p.cultivationProgress || 0),
    maxEssence: Math.round(p.maxPrimevalEssence || 0),
    currentEssence: Math.floor(p.primevalEssence || 0),
    hp: Math.floor(p.hp || 0),
    maxHp: p.maxHp || 0,
    spiritStones: p.spiritStones || 0,
    totalInsight: p.totalInsight || 0,
    topMasteryLevel: masteryPaths.length ? Math.max(...masteryPaths.map(x => x.m.level)) : 1,
    masterySummary: masteryPaths.map(x => `${PATH_BY_ID[x.id]?.name || x.id} ${x.m.level}`)
      .join(' · ').slice(0, 300),
    synergies: SYNERGIES.filter(sy => sy.paths.every(x => equippedPaths.has(x)))
      .map(sy => sy.name).join(', '),
    guOwned: (s.ownedGu || []).length,
    playtimeMin: Math.round((s.playtimeSec || 0) / 60),
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#0d1410] overflow-y-auto scrollbar-thin animate-pop">
      <div className="max-w-5xl mx-auto px-4 py-5">
        <header className="flex items-center justify-between">
          <h1 className="font-heading text-xl text-stone-100">📈 Growth Dashboard</h1>
          <button onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-stone-200">
            ✕ Esc
          </button>
        </header>

        <div className="grid md:grid-cols-3 gap-3 mt-4 items-start">
          <CultivationSummary player={p} stage={stage} day={s.time?.day || 1} />
          <SynergyBoard equippedPaths={equippedPaths} />
          <MasteryBoard paths={masteryPaths} />
        </div>

        <SheetSyncPanel snapshot={snapshot} />
      </div>
    </div>
  );
}