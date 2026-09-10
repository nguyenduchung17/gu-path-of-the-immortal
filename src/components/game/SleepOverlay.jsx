import React, { useEffect } from 'react';
import { useGame } from '@/game/state/GameContext';
import { BALANCE } from '@/game/config/balance';

// Fade-to-black night transition while the character sleeps at an inn.
export default function SleepOverlay() {
  const { dispatch } = useGame();
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'WAKE' }), BALANCE.time.sleepFadeMs);
    return () => clearTimeout(t);
  }, [dispatch]);
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-sleep">
      <div className="text-center">
        <div className="text-4xl mb-3">🌙</div>
        <div className="text-sm text-stone-300 tracking-wide">Sleeping until morning…</div>
        <div className="text-[10px] text-stone-500 mt-1">The night passes. A new day dawns.</div>
      </div>
    </div>
  );
}