import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { gameReducer } from './gameReducer';
import { migrateSave } from './migrate';
import { recoveryRatePerSec } from '../config/balance';
import { totalGameMin } from '../engine/vitalGu';
import { ENEMY_BY_ID } from '../data/enemies';
import { persistCombatEnemyState } from '../engine/combat';

const GameContext = createContext(null);
export const SLOT_COUNT = 5;
const LEGACY_KEY = 'gu_path_of_the_immortal_v1';
const slotKey = (i) => `gu_slot_${i}`;

function loadSlotRaw(i) {
  try { const r = localStorage.getItem(slotKey(i)); return r ? JSON.parse(r) : null; } catch { return null; }
}

function saveSlot(i, s) {
  try {
    localStorage.setItem(slotKey(i), JSON.stringify({ ...s, toasts: [], breakthrough: null }));
  } catch (err) {
    // silent data loss is the worst failure mode a save system can have —
    // surface it so it shows in the runtime logs
    console.warn('[save] failed to write slot', i, err);
  }
}

// One-time: adopt the old pre-slot single save file (if any) as Save Slot 1.
function adoptLegacySave() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw || loadSlotRaw(1)) return;
    const s = migrateSave(JSON.parse(raw));
    saveSlot(1, { ...s, slot: 1 });
  } catch {}
}
if (typeof window !== 'undefined') adoptLegacySave();

// After a page refresh: clear stale UI state, settle any unfinished sleep, and
// grant essence accrued while recovery was running offline (capped at max).
function normalize(raw) {
  // migrateSave is version-gated and idempotent — it must run on EVERY load so
  // saves from any older build (v7 boss-era, v8 living-Gu-era, …) pick up the
  // fields the current game expects. The old `>= 7` guard froze saves at v7.
  let s = migrateSave(raw);
  // a battle cut short by a page refresh must not heal the foe — carry the
  // combat record back onto the world before the transient state is dropped
  if (s.combat?.enemy && (s.combat.worldId || s.combat.wildGuId)) {
    s = persistCombatEnemyState(s, s.combat);
  }
  s = { ...s, toasts: [], breakthrough: null, dialogue: null, pendingEvent: null, combat: null };
  if (s.sleeping && (!s.sleeping.wakeAt || Date.now() >= s.sleeping.wakeAt)) s = { ...s, sleeping: null };
  // respawn any world enemies whose timer elapsed while away
  if (s.worldState?.enemies) {
    s = {
      ...s,
      worldState: {
        ...s.worldState,
        enemies: s.worldState.enemies.map(e =>
          e.dead && Date.now() >= (e.respawnAt || 0)
            ? { ...e, dead: false, hp: ENEMY_BY_ID[e.defId]?.hp || 30, x: e.home?.x ?? e.x, y: e.home?.y ?? e.y, state: 'idle', alertTicks: 0 }
            : e
        ),
      },
    };
  }
  if (s.recovery) {
    const rate = recoveryRatePerSec(s.player, s.recovery.mode, totalGameMin(s.time));
    const elapsed = Math.max(0, (Date.now() - (s.recovery.startedAt || Date.now())) / 1000);
    const essence = Math.min(s.player.maxPrimevalEssence, (s.player.primevalEssence || 0) + rate * elapsed);
    s = {
      ...s,
      player: { ...s.player, primevalEssence: essence },
      recovery: essence >= s.player.maxPrimevalEssence ? null : { ...s.recovery, startedAt: Date.now() },
    };
  }
  return s;
}

export function GameProvider({ children }) {
  const [activeSlot, setActiveSlot] = useState(null);
  const [createSlot, setCreateSlot] = useState(null);
  const [state, dispatch] = useReducer(gameReducer, null, () => ({ noSave: true }));

  // persist the active slot on every game-state change
  useEffect(() => {
    if (activeSlot != null && state && !state.noSave) saveSlot(activeSlot, state);
  }, [state, activeSlot]);

  const startSlot = useCallback((i) => {
    const raw = loadSlotRaw(i);
    if (!raw || raw.deceased) return false;
    dispatch({ type: 'LOAD', state: normalize(raw) });
    setActiveSlot(i);
    return true;
  }, []);

  const beginCreate = useCallback((i) => setCreateSlot(i), []);
  const cancelCreate = useCallback(() => setCreateSlot(null), []);
  const finishCreate = useCallback((name, gender, age, difficulty, appearance, aptitude, starterGuId) => {
    const slot = createSlot;
    dispatch({ type: 'NEW_GAME', name, gender, age, difficulty, slot, appearance, aptitude, starterGuId });
    setCreateSlot(null);
    setActiveSlot(slot);
  }, [createSlot]);

  const deleteSlot = useCallback((i) => {
    try { localStorage.removeItem(slotKey(i)); } catch {}
  }, []);

  const exitToSlots = useCallback(() => setActiveSlot(null), []);

  const reset = useCallback(() => {
    if (activeSlot != null) {
      try { localStorage.removeItem(slotKey(activeSlot)); } catch {}
    }
    setActiveSlot(null);
    dispatch({ type: 'RESET' });
  }, [activeSlot]);

  return (
    <GameContext.Provider value={{
      state, dispatch,
      activeSlot, createSlot,
      loadSlotRaw, startSlot,
      beginCreate, cancelCreate, finishCreate,
      deleteSlot, exitToSlots, reset,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}