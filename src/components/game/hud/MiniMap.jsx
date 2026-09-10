import React, { useEffect, useRef } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { WORLD, WORLD_RESOURCES, HAZARDS, HIDDEN_PATHS } from '@/game/data/world';

const SCALE = 2; // px per tile — the whole 84×57 region fits in a small widget
const TILE_COLORS = {
  '.': '#1e3325', ',': '#24382a', 'f': '#2c4a2c', 'r': '#4a4232', 'b': '#6b5a3a',
  '~': '#123a52', 'T': '#16301c', 'R': '#3d4245', '#': '#5a4630', 'W': '#57503f',
  '*': '#a38a3c', 'F': '#5d3fa8', 'c': '#8a5a2b', 's': '#7a6a4a', 'P': '#26262e',
};
const HAZARD_COLORS = { rapids: '#38bdf8', miasma: '#a855f7', unstable: '#f59e0b' };

function hazardCells(hz) {
  if (hz.cells) return hz.cells;
  const out = [];
  for (let j = 0; j < hz.rect.h; j++) for (let i = 0; i < hz.rect.w; i++) out.push([hz.rect.x + i, hz.rect.y + j]);
  return out;
}

// Mini-map — the region at a glance: your position, charted resource nodes,
// and the hazards / secret passages your own feet (or a scouting Gu) have
// uncovered. Undiscovered ground stays dark, just like the world map.
export default function MiniMap() {
  const { state } = useGame();
  const { t } = useT();
  const ref = useRef(null);
  const p = state.player;
  const fog = state.worldState?.fog || [];
  const paths = state.worldState?.discovered?.paths || {};
  const sig = `${p.x},${p.y},${fog.length},${Object.keys(paths).sort().join('.')}`;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = WORLD.w * SCALE, h = WORLD.h * SCALE;
    canvas.width = w;
    canvas.height = h;
    const seen = new Set(fog);
    const openPaths = new Set(
      HIDDEN_PATHS.filter(hp => paths[hp.id]).flatMap(hp => hp.cells.map(([x, y]) => `${x},${y}`))
    );

    ctx.fillStyle = '#0a0f0c';
    ctx.fillRect(0, 0, w, h);

    // charted terrain only — fog hides the rest
    for (let y = 0; y < WORLD.h; y++) {
      const row = WORLD.tiles[y];
      for (let x = 0; x < WORLD.w; x++) {
        if (!seen.has(`${x},${y}`)) continue;
        ctx.fillStyle = TILE_COLORS[row[x]] || '#1a2a20';
        ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
      }
    }

    // hazards — only where you (or a scout) have actually charted the ground
    for (const hz of HAZARDS) {
      ctx.fillStyle = HAZARD_COLORS[hz.kind] || '#eab308';
      for (const [x, y] of hazardCells(hz)) if (seen.has(`${x},${y}`)) ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    }

    // scouted secret passages — charted permanently once revealed
    ctx.fillStyle = '#e879f9';
    for (const key of openPaths) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    }

    // resource nodes on charted ground (rare harvests glow gold)
    for (const r of WORLD_RESOURCES) {
      if (!seen.has(`${r.x},${r.y}`)) continue;
      ctx.fillStyle = r.rare ? '#fbbf24' : '#4ade80';
      ctx.fillRect(r.x * SCALE, r.y * SCALE - 1, SCALE, SCALE + 1);
    }

    // you — amber ring, bright core
    const px = p.x * SCALE, py = p.y * SCALE;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px - 2, py - 2, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px - 1, py - 1, 4, 4);
  }, [sig]);

  return (
    <div className="absolute bottom-3 right-3 z-20 hidden md:block animate-fade-in pointer-events-none">
      <div className="rounded-lg bg-black/55 backdrop-blur border border-emerald-900/50 p-1.5 shadow-lg">
        <div className="text-[9px] uppercase tracking-wider text-emerald-300/80 px-0.5 mb-1">🧭 {t('minimap.title')}</div>
        <canvas ref={ref} className="rounded" style={{ width: WORLD.w * SCALE, height: WORLD.h * SCALE, imageRendering: 'pixelated' }} />
        <div className="flex items-center gap-2 px-0.5 mt-1 text-[8px] text-stone-400 whitespace-nowrap">
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />{t('minimap.you')}</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />{t('minimap.resource')}</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />{t('minimap.hazard')}</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 inline-block" />{t('minimap.secret')}</span>
        </div>
      </div>
    </div>
  );
}