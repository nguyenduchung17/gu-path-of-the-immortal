import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '@/game/state/GameContext';

// Milestone celebration overlay — a distinct burst per kind: emerald sparkle
// for a minor stage rise, golden storm for a major breakthrough.
export default function BreakthroughOverlay() {
  const { state, dispatch } = useGame();
  const b = state.breakthrough;

  useEffect(() => {
    if (!b) return;
    if (b.major) {
      const gold = ['#fbbf24', '#f59e0b', '#fde68a', '#fff7cf'];
      confetti({ particleCount: 90, spread: 110, origin: { y: 0.6 }, colors: gold });
      setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: gold }), 200);
      setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: gold }), 400);
    } else {
      confetti({ particleCount: 34, spread: 80, scalar: 0.8, origin: { y: 0.55 }, colors: ['#34d399', '#6ee7b7', '#a7f3d0'] });
    }
  }, [b]);

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
        <p className="text-xs text-stone-400 mb-4">
          {b.major ? 'Your meridians widen — all attributes surge. Essence fully restored.' : 'Your foundation deepens. A portion of your Essence is restored.'}
        </p>
        <button onClick={() => dispatch({ type: 'DISMISS_BREAKTHROUGH' })}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold text-black ${b.major ? 'bg-amber-400 hover:bg-amber-300' : 'bg-emerald-500 hover:bg-emerald-400'}`}>
          Continue
        </button>
      </div>
    </div>
  );
}
