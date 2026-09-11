import React, { useEffect, useState } from 'react';

// Development-only movement readout (#8): Base / Terrain / Gu / Status /
// Final speed, position, region and tile of the last step. Opt-in via
// localStorage 'gu_move_debug' = '1' — players never see it.
export default function MoveDebugPanel({ on }) {
  const [dbg, setDbg] = useState(null);
  useEffect(() => {
    if (!on) return undefined;
    const iv = setInterval(() => setDbg(/** @type {any} */ (window).__guMoveDebug || null), 250);
    return () => clearInterval(iv);
  }, [on]);
  if (!on || !dbg) return null;
  const row = (k, v) => (
    <div key={k} className="flex justify-between gap-3">
      <span className="text-stone-500">{k}</span>
      <span className="text-emerald-300">{v}</span>
    </div>
  );
  return (
    <div className="absolute top-16 right-2.5 z-30 w-48 rounded-lg bg-black/70 backdrop-blur border border-emerald-800/50 p-2 text-[10px] font-mono leading-relaxed pointer-events-none">
      <div className="text-emerald-400 font-semibold mb-1">MOVE DEBUG</div>
      {row('Base', dbg.base)}
      {row('Terrain', dbg.terrain.toFixed(2))}
      {row('Gu', dbg.gu.toFixed(2))}
      {row('Status', dbg.status.toFixed(2))}
      {row('Interval', `${dbg.intervalMs} ms`)}
      {row('Speed', `${dbg.tilesPerSec} t/s`)}
      {row('Dir', dbg.dir)}
      {row('Pos', `${dbg.x},${dbg.y}`)}
      {row('Region', dbg.region)}
      {row('Tile', dbg.tile)}
      {row('dt', `${Math.round(dbg.dtMs)} ms`)}
    </div>
  );
}
