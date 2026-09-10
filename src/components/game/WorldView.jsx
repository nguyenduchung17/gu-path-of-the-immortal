import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGame } from '@/game/state/GameContext';
import { NPC_BY_ID } from '@/game/data/npcs';
import { ENEMY_BY_ID } from '@/game/data/enemies';
import { BALANCE } from '@/game/config/balance';
import {
  WORLD, zoneAt, DEFAULT_ZONE, WORLD_NPCS, WORLD_RESOURCES, CAMP_CELLS,
  TERRACE, FORMATION, BUILDING_AT, BUILDING_LABELS,
} from '@/game/data/world';

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
  if (ch === '*') return <div className="absolute inset-0 flex items-center justify-center text-violet-300 text-[9px] sm:text-[11px]">✦</div>;
  if (ch === 'r') return <div className="absolute inset-0 opacity-30" style={{ background: 'repeating-linear-gradient(0deg, #000 0 1px, transparent 1px 4px)' }} />;
  if (ch === 'b') return <div className="absolute inset-x-0 top-0 h-1/3 bg-amber-900/40" />;
  return null;
}

export default function WorldView() {
  const { state, dispatch } = useGame();
  const p = state.player;
  const zone = zoneAt(p.x, p.y) || DEFAULT_ZONE;
  const [banner, setBanner] = useState(null);
  const prevZone = useRef(zone.id);

  useEffect(() => {
    if (prevZone.current !== zone.id) {
      prevZone.current = zone.id;
      setBanner({ name: zone.name, label: zone.dangerLabel, danger: zone.danger });
      const t = setTimeout(() => setBanner(null), 2200);
      return () => clearTimeout(t);
    }
  }, [zone.id, zone.name, zone.dangerLabel]);

  // viewport camera follows the player across one large region
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const VW = isMobile ? 17 : 27;
  const VH = isMobile ? 15 : 17;
  const camX = Math.max(0, Math.min(WORLD.w - VW, p.x - ((VW / 2) | 0)));
  const camY = Math.max(0, Math.min(WORLD.h - VH, p.y - ((VH / 2) | 0)));

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
    const it = interactable;
    if (!it) return;
    if (it.type === 'npc') dispatch({ type: 'TALK_NPC', npcId: it.npc.id });
    else if (it.type === 'resource') dispatch({ type: 'INTERACT_RESOURCE', nodeId: it.node.id });
    else if (it.type === 'camp') dispatch({ type: 'REST_CAMP' });
    else if (it.type === 'cultivate') dispatch({ type: 'CULTIVATE' });
    else if (it.type === 'formation') dispatch({ type: 'USE_FORMATION' });
    else if (it.type === 'enemy') dispatch({ type: 'ATTACK_ENEMY' });
  }, [interactable, dispatch]);

  const handleKey = useCallback((e) => {
    if (state.combat || state.pendingEvent || state.dialogue || state.recovery) return;
    const k = e.key.toLowerCase();
    const map = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
    if (map[k]) { e.preventDefault(); dispatch({ type: 'MOVE', dx: map[k][0], dy: map[k][1] }); }
    else if (k === 'e' || k === ' ' || k === 'enter') { e.preventDefault(); interact(); }
  }, [state.combat, state.pendingEvent, state.dialogue, state.recovery, interact, dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const dpad = (dx, dy) => dispatch({ type: 'MOVE', dx, dy });

  const cells = [];
  for (let y = camY; y < camY + VH; y++) {
    for (let x = camX; x < camX + VW; x++) {
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
        <div key={key} className="relative aspect-square overflow-hidden" style={{ background: bg }}>
          <TileDecor ch={ch} />
          {BUILDING_LABELS.has(key) && (
            <div className="absolute inset-0 flex items-center justify-center text-center text-[4.5px] sm:text-[6px] leading-[1.05] font-bold text-stone-100/90 px-px">
              {BUILDING_AT.get(key).label}
            </div>
          )}
          {res && !isPlayer && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-amber-300 text-[8px] sm:text-[10px] drop-shadow">✦</span>
            </div>
          )}
          {npc && !isPlayer && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] sm:text-xs leading-none">{NPC_BY_ID[npc.id].avatar}</span>
              <span className="absolute -bottom-0.5 text-[5px] sm:text-[6.5px] text-emerald-100/90 whitespace-nowrap">{NPC_BY_ID[npc.id].name.split(' ').slice(-1)}</span>
            </div>
          )}
          {en && !isPlayer && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[62%] h-[62%] rounded-full bg-gradient-to-br from-red-900 to-rose-600 border border-red-300/30 flex items-center justify-center">
                <span className="text-[6px] sm:text-[7px] text-red-100">{enDef?.hp > 60 ? '◆◆' : '◆'}</span>
              </div>
              {alert && <div className={`absolute top-0 right-0 text-[8px] font-bold ${alert === '!' ? 'text-red-400' : 'text-amber-300'}`}>{alert}</div>}
              {dist <= 6 && <div className="absolute -bottom-0.5 text-[5px] sm:text-[6px] text-rose-200/80 whitespace-nowrap">{enDef?.name.split(' ').slice(-1)}</div>}
            </div>
          )}
          {isPlayer && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] sm:text-base drop-shadow">🧑‍🌾</span>
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="pt-3">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-emerald-100">{zone.name}</h2>
          <span className={`text-[9px] px-2 py-0.5 rounded-full border whitespace-nowrap ${DANGER_CHIP[zone.danger] ?? DANGER_CHIP[2]}`}>{zone.dangerLabel}</span>
        </div>
        <div className="text-[10px] text-stone-500 hidden sm:block">WASD / Arrows to move · E to interact</div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-emerald-900/50 shadow-2xl bg-[#101d15]">
        {banner && (
          <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-[10px] border backdrop-blur animate-fade-in ${DANGER_CHIP[banner.danger] ?? DANGER_CHIP[2]}`}>
            Entering {banner.name} · {banner.label}
          </div>
        )}
        <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${VW}, 1fr)` }}>
          {cells}
        </div>
      </div>

      {/* D-pad for mobile */}
      <div className="mt-3 grid grid-cols-3 gap-1 max-w-[180px] mx-auto sm:hidden">
        <div />
        <button onClick={() => dpad(0, -1)} className="py-3 rounded-lg bg-white/10 active:bg-white/20">↑</button>
        <div />
        <button onClick={() => dpad(-1, 0)} className="py-3 rounded-lg bg-white/10 active:bg-white/20">←</button>
        <button onClick={interact} className="py-3 rounded-lg bg-emerald-600 active:bg-emerald-500 text-white text-xs">E</button>
        <button onClick={() => dpad(1, 0)} className="py-3 rounded-lg bg-white/10 active:bg-white/20">→</button>
        <div />
        <button onClick={() => dpad(0, 1)} className="py-3 rounded-lg bg-white/10 active:bg-white/20">↓</button>
        <div />
      </div>

      {interactable && (
        <div className="mt-3 text-center text-sm text-emerald-200 bg-emerald-900/20 border border-emerald-800/40 rounded-lg py-2 animate-fade-in">
          {interactable.type === 'npc' && <>Press <b>E</b> to speak with {NPC_BY_ID[interactable.npc.id].name}</>}
          {interactable.type === 'resource' && <>Press <b>E</b> to gather {interactable.node.name}</>}
          {interactable.type === 'camp' && <>Press <b>E</b> to rest at the campsite</>}
          {interactable.type === 'cultivate' && <>Press <b>E</b> to cultivate at the terrace (×1.5 progress)</>}
          {interactable.type === 'formation' && <>Press <b>E</b> to examine the teleportation formation</>}
          {interactable.type === 'enemy' && <>Press <b>E</b> to attack the {ENEMY_BY_ID[interactable.enemy.defId].name}</>}
        </div>
      )}

      <div className="mt-3 h-24 overflow-y-auto scrollbar-thin text-xs text-stone-400 bg-black/30 rounded-lg p-2 border border-stone-800">
        {state.log.slice(-8).reverse().map((l, i) => <div key={i} className={i === 0 ? 'text-emerald-200' : ''}>{l}</div>)}
      </div>
    </div>
  );
}