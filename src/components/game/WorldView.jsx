import React, { useEffect, useState, useCallback } from 'react';
import { useGame } from '@/game/state/GameContext';
import { AREA_BY_ID } from '@/game/data/areas';
import { NPC_BY_ID } from '@/game/data/npcs';

const TILE_STYLE = {
  '.': { bg: '#1e3a25', content: '' },
  ',': { bg: '#3a3326', content: '' },
  'T': { bg: '#14301c', content: '🌲' },
  '~': { bg: '#1e3a52', content: '〜' },
  '#': { bg: '#2a2620', content: '🏠' },
  'R': { bg: '#241f1a', content: '🪨' },
  '^': { bg: '#1a1814', content: '⛰️' },
  '*': { bg: '#2a1e3a', content: '✦' },
};

export default function WorldView() {
  const { state, dispatch } = useGame();
  const area = AREA_BY_ID[state.player.currentArea];
  const [prompt, setPrompt] = useState(null);

  const interactable = (() => {
    const { x, y } = state.player;
    for (const n of area.npcs) if (Math.abs(n.x - x) + Math.abs(n.y - y) <= 1) return { type: 'npc', npc: n };
    for (let i = 0; i < area.resources.length; i++) {
      const r = area.resources[i];
      if (r.x === x && r.y === y && !state.worldState.gathered[`${area.id}-${i}`]) return { type: 'resource', index: i, resource: r };
    }
    for (const e of area.exits) if (e.x === x && e.y === y) return { type: 'exit', exit: e };
    if (area.tiles[y] && area.tiles[y][x] === '*') return { type: 'cultivate' };
    return null;
  })();

  useEffect(() => { setPrompt(interactable); }, [interactable?.type, interactable?.npc?.id, interactable?.index, interactable?.exit?.toArea]);

  const handleKey = useCallback((e) => {
    if (state.combat || state.pendingEvent || state.dialogue) return;
    const k = e.key.toLowerCase();
    const map = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
    if (map[k]) { e.preventDefault(); dispatch({ type: 'MOVE', dx: map[k][0], dy: map[k][1] }); }
    else if (k === 'e' || k === ' ' || k === 'enter') {
      e.preventDefault();
      if (!interactable) return;
      if (interactable.type === 'npc') dispatch({ type: 'TALK_NPC', npcId: interactable.npc.id });
      else if (interactable.type === 'resource') dispatch({ type: 'INTERACT_RESOURCE', index: interactable.index });
      else if (interactable.type === 'exit') dispatch({ type: 'TRAVEL' });
      else if (interactable.type === 'cultivate') dispatch({ type: 'CULTIVATE' });
    }
  }, [state.combat, state.pendingEvent, state.dialogue, interactable, dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const dpad = (dx, dy) => dispatch({ type: 'MOVE', dx, dy });

  return (
    <div className="pt-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-emerald-100">{area.name}</h2>
          <p className="text-xs text-stone-400">{area.description}</p>
        </div>
        <div className="text-[10px] text-stone-500 hidden sm:block">WASD / Arrows to move · E to interact</div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-emerald-900/50 shadow-2xl" style={{ background: area.bgColor }}>
        <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${area.tiles[0].length}, 1fr)`, aspectRatio: `${area.tiles[0].length} / ${area.tiles.length}` }}>
          {area.tiles.map((row, y) => row.map((ch, x) => {
            const npc = area.npcs.find(n => n.x === x && n.y === y);
            const resIdx = area.resources.findIndex(r => r.x === x && r.y === y);
            const res = resIdx >= 0 ? area.resources[resIdx] : null;
            const gathered = res && state.worldState.gathered[`${area.id}-${resIdx}`];
            const exit = area.exits.find(e => e.x === x && e.y === y);
            const isPlayer = state.player.x === x && state.player.y === y;
            const st = TILE_STYLE[ch] || TILE_STYLE['.'];
            return (
              <div key={`${x}-${y}`} className="flex items-center justify-center text-[10px] sm:text-sm relative" style={{ background: st.bg }}>
                <span className="opacity-80 select-none">{st.content}</span>
                {exit && !isPlayer && <span className="absolute inset-0 flex items-center justify-center text-cyan-300 animate-pulse">🌀</span>}
                {res && !gathered && !isPlayer && <span className="absolute inset-0 flex items-center justify-center">{res.emoji}</span>}
                {npc && !isPlayer && <span className="absolute inset-0 flex items-center justify-center">{NPC_BY_ID[npc.id].avatar}</span>}
                {isPlayer && <span className="absolute inset-0 flex items-center justify-center text-base sm:text-lg">🧑‍🌾</span>}
              </div>
            );
          }))}
        </div>
      </div>

      {/* D-pad for mobile */}
      <div className="mt-3 grid grid-cols-3 gap-1 max-w-[180px] mx-auto sm:hidden">
        <div />
        <button onClick={() => dpad(0, -1)} className="py-3 rounded-lg bg-white/10 active:bg-white/20">↑</button>
        <div />
        <button onClick={() => dpad(-1, 0)} className="py-3 rounded-lg bg-white/10 active:bg-white/20">←</button>
        <button onClick={() => { if (interactable) { if (interactable.type === 'npc') dispatch({ type: 'TALK_NPC', npcId: interactable.npc.id }); else if (interactable.type === 'resource') dispatch({ type: 'INTERACT_RESOURCE', index: interactable.index }); else if (interactable.type === 'exit') dispatch({ type: 'TRAVEL' }); else if (interactable.type === 'cultivate') dispatch({ type: 'CULTIVATE' }); } }} className="py-3 rounded-lg bg-emerald-600 active:bg-emerald-500 text-white text-xs">E</button>
        <button onClick={() => dpad(1, 0)} className="py-3 rounded-lg bg-white/10 active:bg-white/20">→</button>
        <div />
        <button onClick={() => dpad(0, 1)} className="py-3 rounded-lg bg-white/10 active:bg-white/20">↓</button>
        <div />
      </div>

      {prompt && (
        <div className="mt-3 text-center text-sm text-emerald-200 bg-emerald-900/20 border border-emerald-800/40 rounded-lg py-2 animate-fade-in">
          {prompt.type === 'npc' && <>Press <b>E</b> to speak with {NPC_BY_ID[prompt.npc.id].name}</>}
          {prompt.type === 'resource' && <>Press <b>E</b> to gather {prompt.resource.name}</>}
          {prompt.type === 'exit' && <>Press <b>E</b> to travel to {prompt.exit.label}</>}
          {prompt.type === 'cultivate' && <>Press <b>E</b> to cultivate here (sect bonus)</>}
        </div>
      )}

      <div className="mt-3 h-24 overflow-y-auto scrollbar-thin text-xs text-stone-400 bg-black/30 rounded-lg p-2 border border-stone-800">
        {state.log.slice(-8).reverse().map((l, i) => <div key={i} className={i === 0 ? 'text-emerald-200' : ''}>{l}</div>)}
      </div>
    </div>
  );
}