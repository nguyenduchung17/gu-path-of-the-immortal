import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGame } from '@/game/state/GameContext';
import { NPC_BY_ID } from '@/game/data/npcs';
import { ENEMY_BY_ID } from '@/game/data/enemies';
import { BALANCE } from '@/game/config/balance';
import {
  WORLD, zoneAt, DEFAULT_ZONE, WORLD_NPCS, WORLD_RESOURCES, CAMP_CELLS,
  TERRACE, FORMATION, BUILDING_AT, BUILDING_LABELS,
} from '@/game/data/world';
import { darknessOf, warmthOf } from '@/game/engine/time';

const TILE_BG = {
  '.': '#1c3226', ',': '#182a20', 'r': '#463d2c', 'f': '#33421f',
  '~': '#16324a', 'b': '#5a4a30', 'T': '#14301c', 'R': '#242320',
  'W': '#4d4842', 'c': '#3d332a', 's': '#6b4d2a', '*': '#2a1e3a', 'F': '#1e2a4a',
};

const DANGER_CHIP = {
  0: 'border-emerald-600/50 bg-emerald-900/30 text-emerald-300',
  1: 'border-lime-600/40 bg-lime-900/20 text-lime-300',
  2: 'border-yellow-600/40 bg-yellow-900/20 text-yellow-300',
  3: 'border-amber-600/50 bg-amber-900/25 text-amber-300',
  4: 'border-orange-700/50 bg-orange-900/30 text-orange-300',
  5: 'border-red-700/60 bg-red-900/35 text-red-300',
};

function TileDecor({ ch }) {
  if (ch === 'T') return <div className="absolute inset-[10%] rounded-full" style={{ background: 'radial-gradient(circle at 50% 38%, #3f7050 0%, #2a5238 55%, #1c3d28 100%)' }} />;
  if (ch === '~') return <div className="absolute inset-0 opacity-80" style={{ background: 'repeating-linear-gradient(180deg, #1d4260 0 3px, #1a3a55 3px 6px)' }} />;
  if (ch === 'R') return <div className="absolute inset-[14%] rounded-[40%]" style={{ background: 'radial-gradient(circle at 35% 30%, #6b6258 0%, #443f38 70%)' }} />;
  if (ch === 'W') return <div className="absolute inset-x-0 top-0 h-1/3 bg-stone-500/40" />;
  if (ch === 'f') return <div className="absolute inset-0 opacity-50" style={{ background: 'repeating-linear-gradient(90deg, #55702f 0 3px, transparent 3px 8px), repeating-linear-gradient(0deg, #55702f 0 2px, transparent 2px 7px)' }} />;
  if (ch === 'c') return <div className="absolute inset-[18%] rounded-sm bg-amber-600/50 border border-amber-500/40" />;
  if (ch === 'F') return <div className="absolute inset-[15%] rounded-full border-2 border-cyan-400/50 animate-pulse" />;
  if (ch === '*') return <div className="absolute inset-0 flex items-center justify-center text-violet-300">✦</div>;
  if (ch === 'r') return <div className="absolute inset-0 opacity-30" style={{ background: 'repeating-linear-gradient(0deg, #000 0 1px, transparent 1px 4px)' }} />;
  if (ch === 'b') return <div className="absolute inset-x-0 top-0 h-1/3 bg-amber-900/40" />;
  return null;
}

// The world is the app's background layer: the camera viewport fills the browser,
// the player stays near the center, and all HUD/menus float above it.
export default function WorldView({ paused, inputLocked }) {
  const { state, dispatch } = useGame();
  const p = state.player;
  const zone = zoneAt(p.x, p.y) || DEFAULT_ZONE;
  const [banner, setBanner] = useState(null);
  const prevZone = useRef(zone.id);

  // viewport camera: measure the browser and compute how many tiles fit
  const [vp, setVp] = useState({ w: 1280, h: 800 });
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const tile = vp.w < 640 ? 24 : vp.w < 1024 ? 30 : 36;
  const cols = Math.min(WORLD.w, Math.max(8, Math.ceil(vp.w / tile)));
  const rows = Math.min(WORLD.h, Math.max(8, Math.ceil(vp.h / tile)));
  const camX = Math.max(0, Math.min(WORLD.w - cols, p.x - (cols >> 1)));
  const camY = Math.max(0, Math.min(WORLD.h - rows, p.y - (rows >> 1)));

  useEffect(() => {
    if (prevZone.current !== zone.id) {
      prevZone.current = zone.id;
      setBanner({ name: zone.name, label: zone.dangerLabel, danger: zone.danger });
      const t = setTimeout(() => setBanner(null), 2200);
      return () => clearTimeout(t);
    }
  }, [zone.id, zone.name, zone.dangerLabel, zone.danger]);

  // day/night: gradual darkness + warm dawn/dusk glow; settlements stay cozier
  const rawDark = darknessOf(state.time?.min);
  const dark = rawDark * (zone.safe ? 0.55 : 1);
  const warm = warmthOf(state.time?.min);

  const enemies = state.worldState.enemies || [];
  const enemyMap = new Map(enemies.filter(e => !e.dead).map(e => [`${e.x},${e.y}`, e]));
  const npcMap = new Map(WORLD_NPCS.map(n => [`${n.x},${n.y}`, n]));
  const now = Date.now();

  const interactable = (() => {
    const npc = WORLD_NPCS.find(n => Math.abs(n.x - p.x) <= 1 && Math.abs(n.y - p.y) <= 1 && !(n.x === p.x && n.y === p.y));
    const node = WORLD_RESOURCES.find(r => Math.abs(r.x - p.x) + Math.abs(r.y - p.y) <= 1 && now - (state.worldState.gathered[r.id] || 0) >= BALANCE.world.gatherRespawnMs);
    const camp = CAMP_CELLS.some(([cx, cy]) => Math.abs(cx - p.x) + Math.abs(cy - p.y) <= 1);
    const terrace = p.x === TERRACE[0] && p.y === TERRACE[1];
    const formation = Math.abs(FORMATION[0] - p.x) + Math.abs(FORMATION[1] - p.y) <= 1;
    const enemy = enemies.find(e => !e.dead && Math.abs(e.x - p.x) + Math.abs(e.y - p.y) === 1);
    if (npc) return { type: 'npc', npc };
    if (node) return { type: 'resource', node };
    if (camp) return { type: 'camp' };
    if (terrace) return { type: 'cultivate' };
    if (formation) return { type: 'formation' };
    if (enemy) return { type: 'enemy', enemy };
    return null;
  })();

  const interact = useCallback(() => {
    if (inputLocked) return;
    const it = interactable;
    if (!it) return;
    if (it.type === 'npc') dispatch({ type: 'TALK_NPC', npcId: it.npc.id });
    else if (it.type === 'resource') dispatch({ type: 'INTERACT_RESOURCE', nodeId: it.node.id });
    else if (it.type === 'camp') dispatch({ type: 'REST_CAMP' });
    else if (it.type === 'cultivate') dispatch({ type: 'CULTIVATE' });
    else if (it.type === 'formation') dispatch({ type: 'USE_FORMATION' });
    else if (it.type === 'enemy') dispatch({ type: 'ATTACK_ENEMY' });
  }, [interactable, dispatch, inputLocked]);

  const handleKey = useCallback((e) => {
    if (state.combat || state.pendingEvent || state.dialogue || state.recovery || inputLocked || paused) return;
    const k = e.key.toLowerCase();
    const map = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
    if (map[k]) { e.preventDefault(); dispatch({ type: 'MOVE', dx: map[k][0], dy: map[k][1] }); }
    else if (k === 'e' || k === ' ' || k === 'enter') { e.preventDefault(); interact(); }
  }, [state.combat, state.pendingEvent, state.dialogue, state.recovery, inputLocked, paused, interact, dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const dpad = (dx, dy) => dispatch({ type: 'MOVE', dx, dy });

  // font sizes scale with tile size so the world stays readable at any zoom
  const fs = (ratio) => `${Math.max(5, Math.round(tile * ratio))}px`;

  const cells = [];
  for (let y = camY; y < camY + rows; y++) {
    for (let x = camX; x < camX + cols; x++) {
      const key = `${x},${y}`;
      const ch = WORLD.tiles[y][x];
      const b = BUILDING_AT.get(key);
      const bg = b ? b.color : (TILE_BG[ch] || '#1c3226');
      const npc = npcMap.get(key);
      const res = WORLD_RESOURCES.find(r => r.x === x && r.y === y && now - (state.worldState.gathered[r.id] || 0) >= BALANCE.world.gatherRespawnMs);
      const en = enemyMap.get(key);
      const isPlayer = p.x === x && p.y === y;
      const enDef = en ? ENEMY_BY_ID[en.defId] : null;
      const dist = en ? Math.max(Math.abs(en.x - p.x), Math.abs(en.y - p.y)) : 99;
      const detect = en ? (en.detect ?? (BALANCE.world.detect[en.behavior] ?? 4)) : 0;
      const alert = en ? (en.state === 'chase' ? '!' : (detect > 0 && dist <= detect + 2 ? '?' : null)) : null;
      cells.push(
        <div key={key} className="relative overflow-hidden" style={{ width: tile, height: tile, background: bg }}>
          <TileDecor ch={ch} />
          {BUILDING_LABELS.has(key) && (
            <div className="absolute inset-0 flex items-center justify-center text-center font-bold text-stone-100/90 px-px" style={{ fontSize: fs(0.16), lineHeight: 1.05 }}>
              {BUILDING_AT.get(key).label}
            </div>
          )}
          {b && dark > 0.2 && (
            <div className="absolute left-[15%] top-[15%] w-[22%] h-[22%] rounded-[2px] bg-amber-300"
              style={{ boxShadow: '0 0 5px 2px rgba(252, 211, 77, 0.75)', opacity: Math.min(1, dark) }} />
          )}
          {res && !isPlayer && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-amber-300 drop-shadow" style={{ fontSize: fs(0.3) }}>✦</span>
            </div>
          )}
          {npc && !isPlayer && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="leading-none" style={{ fontSize: fs(0.5) }}>{NPC_BY_ID[npc.id].avatar}</span>
              <span className="absolute -bottom-0.5 text-emerald-100/90 whitespace-nowrap" style={{ fontSize: fs(0.2) }}>{NPC_BY_ID[npc.id].name.split(' ').slice(-1)}</span>
            </div>
          )}
          {en && !isPlayer && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[62%] h-[62%] rounded-full bg-gradient-to-br from-red-900 to-rose-600 border border-red-300/30 flex items-center justify-center">
                <span className="text-red-100" style={{ fontSize: fs(0.22) }}>{enDef?.hp > 60 ? '◆◆' : '◆'}</span>
              </div>
              {alert && <div className={`absolute top-0 right-0 font-bold ${alert === '!' ? 'text-red-400' : 'text-amber-300'}`} style={{ fontSize: fs(0.3) }}>{alert}</div>}
              {dist <= 6 && <div className="absolute -bottom-0.5 text-rose-200/80 whitespace-nowrap" style={{ fontSize: fs(0.18) }}>{enDef?.name.split(' ').slice(-1)}</div>}
            </div>
          )}
          {isPlayer && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="drop-shadow" style={{ fontSize: fs(0.6) }}>🧑‍🌾</span>
            </div>
          )}
        </div>
      );
    }
  }

  const gridW = cols * tile;
  const gridH = rows * tile;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a120d]">
      {/* camera viewport — centered if the world is narrower than the screen */}
      <div
        className="grid absolute shadow-2xl"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${tile}px)`,
          width: gridW,
          height: gridH,
          left: Math.max(0, (vp.w - gridW) / 2),
          top: Math.max(0, (vp.h - gridH) / 2),
        }}
      >
        {cells}
      </div>

      {/* day/night overlays — transition smoothly as the clock turns */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgb(8 12 44)', opacity: dark * 0.5, transition: 'opacity 1.2s linear' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,140,50,0.9), rgba(255,90,40,0.6))', opacity: warm, transition: 'opacity 1.2s linear' }} />
      {/* soft vignette to frame the world */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 140px 30px rgba(0,0,0,0.55)' }} />

      {/* zone discovery banner */}
      {banner && (
        <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-[10px] border backdrop-blur animate-fade-in ${DANGER_CHIP[banner.danger] ?? DANGER_CHIP[2]}`}>
          Entering {banner.name} · {banner.label}
        </div>
      )}

      {/* interaction hint — floats above the hotbar */}
      {interactable && !inputLocked && (
        <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-10 text-[11px] sm:text-xs text-emerald-100 bg-black/55 backdrop-blur border border-emerald-700/50 rounded-full px-3 py-1.5 animate-fade-in whitespace-nowrap">
          {interactable.type === 'npc' && <>Press <b>E</b> — speak with {NPC_BY_ID[interactable.npc.id].name}</>}
          {interactable.type === 'resource' && <>Press <b>E</b> — gather {interactable.node.name}</>}
          {interactable.type === 'camp' && <>Press <b>E</b> — rest at the campsite</>}
          {interactable.type === 'cultivate' && <>Press <b>E</b> — cultivate at the terrace (×1.5)</>}
          {interactable.type === 'formation' && <>Press <b>E</b> — examine the formation</>}
          {interactable.type === 'enemy' && <>Press <b>E</b> — attack the {ENEMY_BY_ID[interactable.enemy.defId].name}</>}
        </div>
      )}

      {/* controls reminder */}
      <div className="absolute top-16 right-2.5 z-10 text-[9px] text-stone-400 bg-black/40 backdrop-blur rounded-full px-2 py-0.5 hidden sm:block">
        WASD / arrows move · E interact · Esc menu
      </div>

      {/* touch d-pad */}
      <div className="absolute bottom-3 right-3 z-10 grid grid-cols-3 gap-1 sm:hidden">
        <div />
        <button onClick={() => dpad(0, -1)} className="w-11 h-11 rounded-lg bg-black/50 backdrop-blur border border-white/10 active:bg-white/20 text-stone-200">↑</button>
        <div />
        <button onClick={() => dpad(-1, 0)} className="w-11 h-11 rounded-lg bg-black/50 backdrop-blur border border-white/10 active:bg-white/20 text-stone-200">←</button>
        <button onClick={interact} className="w-11 h-11 rounded-lg bg-emerald-600/90 active:bg-emerald-500 text-white text-sm">E</button>
        <button onClick={() => dpad(1, 0)} className="w-11 h-11 rounded-lg bg-black/50 backdrop-blur border border-white/10 active:bg-white/20 text-stone-200">→</button>
        <div />
        <button onClick={() => dpad(0, 1)} className="w-11 h-11 rounded-lg bg-black/50 backdrop-blur border border-white/10 active:bg-white/20 text-stone-200">↓</button>
        <div />
      </div>
    </div>
  );
}