import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { WORLD, ZONES, LANDMARKS } from '@/game/data/world';

const DANGER_FILL = { 0: '#166534', 1: '#3f6212', 2: '#4d7c0f', 3: '#92400e', 4: '#9a3412', 5: '#7f1d1d' };
const DANGER_LABEL = { 0: 'Safe zone', 1: 'Low', 2: 'Low danger', 3: 'Moderate danger', 4: 'High danger', 5: 'Extreme danger' };

export default function MapPanel() {
  const { state } = useGame();
  const p = state.player;
  const discovered = state.worldState.discovered || { zones: {}, landmarks: {} };
  const visibleZones = ZONES.filter(z => discovered.zones[z.id]);
  const visibleLms = LANDMARKS.filter(l => discovered.landmarks[l.id]);

  return (
    <div className="pt-3 space-y-3 animate-fade-in">
      <p className="text-xs text-stone-400">
        The region reveals itself as you travel — walk to discover zones, landmarks and hidden places.
        There is no instant travel: distance and danger are real.
      </p>

      <div className="rounded-xl border border-emerald-900/50 bg-[#0d1410] p-3 overflow-x-auto scrollbar-thin">
        <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} className="w-full min-w-[480px]" style={{ maxHeight: 420 }}>
          {/* undiscovered regions stay dark */}
          <rect x={0} y={0} width={WORLD.w} height={WORLD.h} fill="#0b100c" />
          {visibleZones.map(z => {
            const r = z.rect;
            return (
              <g key={z.id}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={DANGER_FILL[z.danger]} opacity={0.55} rx={0.5} />
                <text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" fill="#e7e5e4" fontSize={2} opacity={0.9}>{z.name}</text>
              </g>
            );
          })}
          {visibleLms.map(lm => (
            <g key={lm.id}>
              <circle cx={lm.x + 0.5} cy={lm.y + 0.5} r={0.9} fill={lm.hidden ? '#fbbf24' : '#a3e635'} stroke="#000" strokeWidth={0.15} />
              <text x={lm.x + 0.5} y={lm.y + 3} textAnchor="middle" fill={lm.hidden ? '#fcd34d' : '#bef264'} fontSize={1.7}>{lm.name}</text>
            </g>
          ))}
          {/* the player */}
          <circle cx={p.x + 0.5} cy={p.y + 0.5} r={1.1} fill="#34d399" stroke="#fff" strokeWidth={0.25} />
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        {[0, 2, 3, 4, 5].map(d => (
          <span key={d} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/30 border border-stone-800">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: DANGER_FILL[d] }} />
            <span className="text-stone-400">{DANGER_LABEL[d]}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/30 border border-stone-800">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-amber-400" /> <span className="text-stone-400">Hidden landmark</span>
        </span>
      </div>

      {visibleLms.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-300 mb-2">Discovered Locations</h3>
          <div className="flex flex-wrap gap-1.5">
            {visibleLms.map(lm => (
              <span key={lm.id} className="text-[11px] px-2 py-1 rounded-lg border border-stone-800 bg-black/20 text-stone-300">
                📍 {lm.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}