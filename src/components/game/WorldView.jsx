import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGame } from '@/game/state/GameContext';
import { NPC_BY_ID } from '@/game/data/npcs';
import { ENEMY_BY_ID } from '@/game/data/enemies';
import { SPECIES_BY_ID, wildGuActive } from '@/game/data/wildGu';
import { BALANCE } from '@/game/config/balance';
import { WORLD, zoneAt, DEFAULT_ZONE, WORLD_NPCS, WORLD_RESOURCES, CAMP_CELLS, TERRACE, FORMATION } from '@/game/data/world';
import { phaseOf } from '@/game/engine/time';
import { drawWorld } from '@/game/gfx/worldRenderer';
import { sfx, primeAudio } from '@/game/audio/sfx';
import { setEnvironment, updateAudioPosition, footstep } from '@/game/audio/ambience';

const DANGER_CHIP = {
  0: 'border-emerald-600/50 bg-emerald-900/30 text-emerald-300',
  1: 'border-lime-600/40 bg-lime-900/20 text-lime-300',
  2: 'border-yellow-600/40 bg-yellow-900/20 text-yellow-300',
  3: 'border-amber-600/50 bg-amber-900/25 text-amber-300',
  4: 'border-orange-700/50 bg-orange-900/30 text-orange-300',
  5: 'border-red-700/60 bg-red-900/35 text-red-300',
};

// The world is the app's background layer, rendered as pixel art on a canvas.
// Camera follows the player smoothly; movement supports diagonals and animates
// between cells instead of jumping. All game logic stays in the reducer.
export default function WorldView({ paused, inputLocked }) {
  const { state, dispatch } = useGame();
  const canvasRef = useRef(null);
  const camRef = useRef(null);
  const animRef = useRef({ toX: null, toY: null, fromX: null, fromY: null, t0: 0 });
  const keysRef = useRef(new Set());
  const lastMoveRef = useRef(0);

  const stateRef = useRef(state);
  stateRef.current = state;
  const propsRef = useRef({});
  propsRef.current = { paused, inputLocked };
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

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
  }, [zone.id, zone.name, zone.dangerLabel, zone.danger]);

  // layered ambience follows the environment + time of day
  useEffect(() => {
    const night = phaseOf(state.time?.min) === 'night';
    setEnvironment({ zoneId: zone.id, night });
  }, [zone.id, phaseOf(state.time?.min)]);

  // interaction target for the [E] prompt
  const now = Date.now();
  const interactable = (() => {
    const enemies = state.worldState.enemies || [];
    const npc = WORLD_NPCS.find(n => Math.abs(n.x - p.x) <= 1 && Math.abs(n.y - p.y) <= 1 && !(n.x === p.x && n.y === p.y));
    const wgu = (state.worldState.wildGu || []).find(w => !w.gone && wildGuActive(w, state.time)
      && Math.abs(w.x - p.x) <= 1 && Math.abs(w.y - p.y) <= 1 && !(w.x === p.x && w.y === p.y));
    const node = WORLD_RESOURCES.find(r => Math.abs(r.x - p.x) + Math.abs(r.y - p.y) <= 1 && now - (state.worldState.gathered[r.id] || 0) >= BALANCE.world.gatherRespawnMs);
    const camp = CAMP_CELLS.some(([cx, cy]) => Math.abs(cx - p.x) + Math.abs(cy - p.y) <= 1);
    const terrace = p.x === TERRACE[0] && p.y === TERRACE[1];
    const formation = Math.abs(FORMATION[0] - p.x) + Math.abs(FORMATION[1] - p.y) <= 1;
    const enemy = enemies.find(e => !e.dead && Math.abs(e.x - p.x) + Math.abs(e.y - p.y) === 1);
    if (npc) return { type: 'npc', npc };
    if (wgu) return { type: 'wildgu', wgu };
    if (node) return { type: 'resource', node };
    if (camp) return { type: 'camp' };
    if (terrace) return { type: 'cultivate' };
    if (formation) return { type: 'formation' };
    if (enemy) return { type: 'enemy', enemy };
    return null;
  })();

  const interact = useCallback(() => {
    if (propsRef.current.inputLocked || propsRef.current.paused) return;
    const s = stateRef.current;
    if (s.combat || s.pendingEvent || s.dialogue || s.recovery || s.sleeping) return;
    const p2 = s.player;
    const t = now;
    const enemies = s.worldState.enemies || [];
    const npc = WORLD_NPCS.find(n => Math.abs(n.x - p2.x) <= 1 && Math.abs(n.y - p2.y) <= 1 && !(n.x === p2.x && n.y === p2.y));
    const wgu = (s.worldState.wildGu || []).find(w => !w.gone && wildGuActive(w, s.time)
      && Math.abs(w.x - p2.x) <= 1 && Math.abs(w.y - p2.y) <= 1 && !(w.x === p2.x && w.y === p2.y));
    const node = WORLD_RESOURCES.find(r => Math.abs(r.x - p2.x) + Math.abs(r.y - p2.y) <= 1 && t - (s.worldState.gathered[r.id] || 0) >= BALANCE.world.gatherRespawnMs);
    const camp = CAMP_CELLS.some(([cx, cy]) => Math.abs(cx - p2.x) + Math.abs(cy - p2.y) <= 1);
    const terrace = p2.x === TERRACE[0] && p2.y === TERRACE[1];
    const formation = Math.abs(FORMATION[0] - p2.x) + Math.abs(FORMATION[1] - p2.y) <= 1;
    const enemy = enemies.find(e => !e.dead && Math.abs(e.x - p2.x) + Math.abs(e.y - p2.y) === 1);
    if (npc) { sfx('open'); dispatchRef.current({ type: 'TALK_NPC', npcId: npc.id }); }
    else if (wgu) { sfx('open'); dispatchRef.current({ type: 'ENCOUNTER_WILD_GU', worldId: wgu.id }); }
    else if (node) { sfx('ui'); dispatchRef.current({ type: 'INTERACT_RESOURCE', nodeId: node.id }); }
    else if (camp) { sfx('open'); dispatchRef.current({ type: 'REST_CAMP' }); }
    else if (terrace) dispatchRef.current({ type: 'CULTIVATE' });
    else if (formation) dispatchRef.current({ type: 'USE_FORMATION' });
    else if (enemy) { sfx('encounter'); dispatchRef.current({ type: 'ATTACK_ENEMY', }); }
  }, [now]);

  const interactRef = useRef(interact);
  interactRef.current = interact;

  // keyboard: held keys give smooth continuous movement (diagonals supported);
  // E interacts once per press.
  useEffect(() => {
    const DIR_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
    const onDown = (e) => {
      primeAudio();
      const k = e.key.toLowerCase();
      if (DIR_KEYS.includes(k)) {
        e.preventDefault();
        keysRef.current.add(k);
        // a fresh press moves on the very next frame — a quick tap shorter
        // than the 170ms hold-gate must not be swallowed silently
        if (!e.repeat) lastMoveRef.current = 0;
      }
      else if ((k === 'e' || k === ' ' || k === 'enter') && !e.repeat) { e.preventDefault(); interactRef.current(); }
    };
    const onUp = (e) => keysRef.current.delete(e.key.toLowerCase());
    const onBlur = () => keysRef.current.clear();
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // render + held-movement loop
  useEffect(() => {
    let raf;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const s = stateRef.current;
      const canvas = canvasRef.current;
      if (!s || !s.player || !canvas) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const tile = w < 640 ? 24 : w < 1024 ? 30 : 36;

      // held-key movement
      const locked = propsRef.current.inputLocked || propsRef.current.paused
        || s.combat || s.pendingEvent || s.dialogue || s.recovery || s.sleeping || s.deceased || s.wildEncounter;
      if (!locked) {
        const keys = keysRef.current;
        const nowMs = performance.now();
        if (nowMs - lastMoveRef.current > 170) {
          const dx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
          const dy = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
          if (dx || dy) { lastMoveRef.current = nowMs; dispatchRef.current({ type: 'MOVE', dx, dy }); }
        }
      }

      // animate the player between cells (no grid snapping)
      const p2 = s.player;
      const anim = animRef.current;
      if (anim.toX !== p2.x || anim.toY !== p2.y) {
        const had = anim.toX !== null;
        anim.fromX = had ? anim.toX : p2.x;
        anim.fromY = had ? anim.toY : p2.y;
        anim.toX = p2.x;
        anim.toY = p2.y;
        anim.t0 = t;
        if (had && (anim.fromX !== p2.x || anim.fromY !== p2.y)) {
          const inBounds = p2.y >= 0 && p2.y < WORLD.h && p2.x >= 0 && p2.x < WORLD.w;
          footstep(inBounds ? WORLD.tiles[p2.y][p2.x] : '.');
        }
      }
      const k = Math.min(1, (t - (anim.t0 || t)) / 150);
      const pX = anim.fromX + (anim.toX - anim.fromX) * k;
      const pY = anim.fromY + (anim.toY - anim.fromY) * k;

      // positional ambience (river / market / beasts) — throttled internally
      updateAudioPosition({ x: p2.x, y: p2.y, enemies: s.worldState?.enemies || [] });

      // smooth camera follows the animated player
      const cols = Math.ceil(w / tile), rows = Math.ceil(h / tile);
      const tx = Math.max(0, Math.min(Math.max(0, WORLD.w - cols), pX - cols / 2 + 0.5));
      const ty = Math.max(0, Math.min(Math.max(0, WORLD.h - rows), pY - rows / 2 + 0.5));
      if (!camRef.current) camRef.current = { x: tx, y: ty };
      const cam = camRef.current;
      cam.x += (tx - cam.x) * 0.16;
      cam.y += (ty - cam.y) * 0.16;

      drawWorld(canvas, s, { camX: cam.x, camY: cam.y, pX, pY, moving: k < 1, facing: p2.facing, t, tile });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const dpad = (dx, dy) => dispatch({ type: 'MOVE', dx, dy });

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a120d]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' }} />
      {/* soft vignette to frame the world */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 140px 30px rgba(0,0,0,0.55)' }} />

      {/* zone discovery banner */}
      {banner && (
        <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-[10px] border backdrop-blur animate-fade-in ${DANGER_CHIP[banner.danger] ?? DANGER_CHIP[2]}`}>
          Entering {banner.name} · {banner.label}
        </div>
      )}

      {/* interaction prompt */}
      {interactable && !inputLocked && !paused && (
        <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-10 text-[11px] sm:text-xs text-emerald-100 bg-black/55 backdrop-blur border border-emerald-700/50 rounded-full px-3 py-1.5 animate-fade-in whitespace-nowrap">
          {interactable.type === 'npc' && (() => {
            const n = NPC_BY_ID[interactable.npc.id];
            const name = n.master && !state.masters?.[n.id]?.found ? '???' : n.name;
            return <><b>[E]</b> Talk — {name}</>;
          })()}
          {interactable.type === 'wildgu' && <><b>[E]</b> Wild Gu — {SPECIES_BY_ID[interactable.wgu.speciesId].name}</>}
          {interactable.type === 'resource' && <><b>[E]</b> Gather — {interactable.node.name}</>}
          {interactable.type === 'camp' && <><b>[E]</b> Rest at the campsite</>}
          {interactable.type === 'cultivate' && <><b>[E]</b> Cultivate at the terrace (×1.5)</>}
          {interactable.type === 'formation' && <><b>[E]</b> Examine the formation</>}
          {interactable.type === 'enemy' && <><b>[E]</b> Attack — {ENEMY_BY_ID[interactable.enemy.defId].name}</>}
        </div>
      )}

      {/* controls reminder — only shown while movement is actually possible */}
      {!inputLocked && !paused && (
        <div className="absolute top-16 left-2.5 z-10 text-[9px] text-stone-400 bg-black/40 backdrop-blur rounded-full px-2 py-0.5 hidden sm:block">
          WASD / arrows move · E interact · Esc menu
        </div>
      )}

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