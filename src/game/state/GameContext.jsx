import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { gameReducer } from './gameReducer';
import { migrateSave } from './migrate';
import { recoveryRatePerSec } from '../config/balance';

const GameContext = createContext(null);
const SAVE_KEY = 'gu_path_of_the_immortal_v1';

function loadSave() {
  try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

// After a page refresh: clear stale UI state and grant any essence accrued
// while recovery was running offline (capped at max).
function normalize(raw) {
  let s = raw.version >= 2 ? raw : migrateSave(raw);
  s = { ...s, toasts: [], breakthrough: null };
  if (s.recovery) {
    const rate = recoveryRatePerSec(s.player, s.recovery.mode);
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
  const [state, dispatch] = useReducer(gameReducer, null, () => {
    const s = loadSave();
    return s ? normalize(s) : { noSave: true };
  });

  useEffect(() => {
    if (state && !state.noSave) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, toasts: [], breakthrough: null })); } catch {}
    }
  }, [state]);

  const newGame = useCallback((name, gender, age) => dispatch({ type: 'NEW_GAME', name, gender, age }), []);
  const reset = useCallback(() => { localStorage.removeItem(SAVE_KEY); dispatch({ type: 'RESET' }); }, []);

  return <GameContext.Provider value={{ state, dispatch, newGame, reset }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}