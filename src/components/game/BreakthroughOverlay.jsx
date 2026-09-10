import React from 'react';
import { useGame } from '@/game/state/GameContext';

export default function BreakthroughOverlay() {
  const { state, dispatch } = useGame();
  const b = state.breakthrough;
  if (!b) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-hidden">
      <div className={`absolute inset-0 pointer-events-none ${b.major ? 'animate-flash' : ''}`} style={{ background: b.major ? 'radial-gradient(circle, rgba(251,191,36,0.35), transparent 60%)' : 'radial-gradient(circle, rgba(16,185,129,0.25), transparent 60%)' }} />
      <div className={`relative max-w-sm w-full rounded-2xl border p-6 text-center animate-burst ${b.major ? 'border-amber-500/60 bg-[#1a1408]' : 'border-emerald-700/50 bg-[#0d1410]'}`}>
        <div className="text-4xl mb-2">{b.major ? '🔥' : '✦'}</div>
        <div className={`text-[10px] tracking-[0.3em] uppercase mb-1 ${b.major ? 'text-amber-400' : 'text-emerald-400'}`}>
          {b.major ? 'Major Breakthrough' : 'Breakthrough Successful'}
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${b.major ? 'text-amber-200' : 'text-emerald-200'}`}>{b.name}</h2>
        <p className="text-xs text-stone-400 mb-4">Essence fully restored. Your foundation deepens.</p>
        <button onClick={() => dispatch({ type: 'DISMISS_BREAKTHROUGH' })}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold text-black ${b.major ? 'bg-amber-400 hover:bg-amber-300' : 'bg-emerald-500 hover:bg-emerald-400'}`}>
          Continue
        </button>
      </div>
    </div>
  );
}