import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { gameReducer } from './gameReducer';

const GameContext = createContext(null);
const SAVE_KEY = 'gu_path_of_the_immortal_v1';

function loadSave() {
  try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, null, () => {
    const s = loadSave();
    return s || { noSave: true };
  });

  useEffect(() => {
    if (state && !state.noSave) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
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