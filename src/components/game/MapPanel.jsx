import React, { useEffect, useRef } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { WORLD, ZONES, LANDMARKS } from '@/game/data/world';
import { BALANCE } from '@/game/config/balance';

// Terrain colors per tile character (mirrors the world renderer's palette).
const TILE_COLORS = {
  '.': '#1c2e20', ',': '#24382a', 'T': '#173421', 'f': '#8a7a3a', '~': '#1e4a6e',
  'r': '#7a6248', 'b': '#8a6a43', 'W': '#3a3a3a', '#': '#5a4a3a', 'R': '#4a4a44',
  's': '#8a5a3a', '*': '#4a3a7a', 'F': '#2a6a7a', 'c': '#7a4a2a',
};
const DANGER_TINT = { 0: [22, 101, 52], 1: [63, 98, 18], 2: [77, 124, 15], 3: [146, 64, 14], 4: [154, 52, 18], 5: [127, 29, 29] };
const T = 9; // canvas pixels per world tile

// Fog of war, three states: UNEXPLORED (black), EXPLORED (dim terrain) and
// CURRENT VISION (bright ring around the player). The map is walked into
// existence — hidden places appear only when found, not when terrain nearby
// is revealed.
export default function MapPanel() {
  const { state } = useGame();
  const { t } = useT();
  const p = state.player;
  const ref = useRef(null);
  const fog = new Set(state.worldState.fog || []);
  const discovered = state.worldState.discovered || { zones: {}, landmarks: {} };
  const exploredPct = Math.round((fog.size / (WORLD.w * WORLD.h)) * 100);
  const visibleLms = LANDMARKS.filter(l => discovered.landmarks[l.id]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const vis = BALANCE.fog.visionRadius;

    // unexplored: heavy fog
    ctx.fillStyle = '#08090a';
    ctx.fillRect(0, 0, c.width, c.height);

    // explored terrain; bright inside the player's current vision
    for (let y = 0; y < WORLD.h; y++) {
      for (let x = 0; x < WORLD.w; x++) {
        if (!fog.has(`${x},${y}`)) continue;
        const ch = WORLD.tiles[y][x];
        const dist = Math.hypot(x - p.x, y - p.y);
        const bright = dist <= vis ? 1 : 0.4;
        ctx.globalAlpha = bright;
        ctx.fillStyle = TILE_COLORS[ch] || TILE_COLORS['.'];
        ctx.fillRect(x * T, y * T, T, T);
        const z = ZONES.find(zz => { const r = zz.rect; return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; });
        if (z && discovered.zones[z.id] && (ch === '.' || ch === ',')) {
          const tint = DANGER_TINT[z.danger] || DANGER_TINT[2];
          ctx.fillStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},${0.5 * bright})`;
          ctx.fillRect(x * T, y * T, T, T);
        }
        ctx.globalAlpha = 1;
      }
    }

    // zone names for charted regions
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    for (const z of ZONES) {
      if (!discovered.zones[z.id]) continue;
      const r = z.rect;
      ctx.fillStyle = 'rgba(232,228,216,0.92)';
      ctx.fillText(z.name, (r.x + r.w / 2) * T, (r.y + r.h / 2) * T);
    }

    // discovered landmarks — permanent markers
    for (const lm of visibleLms) {
      ctx.fillStyle = lm.hidden ? '#fbbf24' : '#a3e635';
      ctx.beginPath();
      ctx.arc((lm.x + 0.5) * T, (lm.y + 0.5) * T, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // current vision ring + the player
    ctx.strokeStyle = 'rgba(160,240,200,0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc((p.x + 0.5) * T, (p.y + 0.5) * T, vis * T, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc((p.x + 0.5) * T, (p.y + 0.5) * T, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  }, [p.x, p.y, state.worldState.fog?.length, state.worldState.discovered]);

  return (
    <div className="pt-3 space-y-3 animate-fade-in">
      <p className="text-xs text-stone-400">{t('fog.hint')}</p>

      <div className="rounded-xl border border-emerald-900/50 bg-[#0d1410] p-3 overflow-x-auto scrollbar-thin">
        <canvas
          ref={ref}
          width={WORLD.w * T}
          height={WORLD.h * T}
          className="w-full min-w-[480px] rounded-lg"
          style={{ maxHeight: 440 }}
        />
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/30 border border-stone-800">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#08090a' }} />
          <span className="text-stone-400">{t('fog.unexplored')}</span>
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/30 border border-stone-800">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#24382a', opacity: 0.5 }} />
          <span className="text-stone-400">{t('fog.explored')}</span>
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/30 border border-stone-800">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-emerald-400" />
          <span className="text-stone-400">{t('fog.vision')}</span>
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-900/25 border border-emerald-700/40">
          <span className="text-emerald-300">🧭 {t('fog.progress', { p: exploredPct })}</span>
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/30 border border-stone-800">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-amber-400" />
          <span className="text-stone-400">Hidden landmark</span>
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