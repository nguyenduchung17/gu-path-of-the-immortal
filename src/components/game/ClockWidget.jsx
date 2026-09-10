import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { phaseOf, timeLabel, PHASE_ICON, PHASE_LABEL } from '@/game/engine/time';
import { zoneAt, DEFAULT_ZONE } from '@/game/data/world';

// Compact exploration clock: Day 14 · 🌙 09:35 PM (hover for details).
export default function ClockWidget() {
  const { state } = useGame();
  const t = state.time || { day: 1, min: 7 * 60 };
  const phase = phaseOf(t.min);
  const zone = zoneAt(state.player.x, state.player.y) || DEFAULT_ZONE;
  return (
    <div
      title={`Day ${t.day} · ${PHASE_LABEL[phase]} · ${zone.name} (${zone.safe ? 'Safe Zone' : zone.dangerLabel})`}
      className="text-[10px] px-2 py-1 rounded-full border border-stone-700 bg-black/30 text-stone-300 whitespace-nowrap">
      Day {t.day} · {PHASE_ICON[phase]} {timeLabel(t.min)}
    </div>
  );
}