import React, { useEffect } from 'react';
import { useGame } from '@/game/state/GameContext';
import { BALANCE, recoveryRatePerSec } from '@/game/config/balance';
import { zoneAt, CAMP_CELLS } from '@/game/data/world';

function fmt(sec) {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RecoveryModal({ open, onClose }) {
  const { state, dispatch } = useGame();
  const p = state.player;
  const recovering = !!state.recovery;
  const rate = recovering ? recoveryRatePerSec(p, state.recovery.mode) : recoveryRatePerSec(p, 'normal');
  const missing = p.maxPrimevalEssence - p.primevalEssence;
  const fullSecs = missing / rate;

  // drive essence recovery one tick at a time; in dangerous wilderness a
  // nearby enemy can notice the meditating player and interrupt them
  useEffect(() => {
    if (!recovering) return;
    const cfg = BALANCE.world;
    const t = setInterval(() => {
      const mode = state.recovery.mode;
      const zone = zoneAt(p.x, p.y);
      const nearCamp = mode === 'camp' || CAMP_CELLS.some(([cx, cy]) => Math.max(Math.abs(cx - p.x), Math.abs(cy - p.y)) <= cfg.campSafeRadius);
      const safe = zone?.safe || nearCamp;
      if (!safe) {
        const intruder = (state.worldState.enemies || []).find(e => {
          if (e.dead) return false;
          const d = Math.max(Math.abs(e.x - p.x), Math.abs(e.y - p.y));
          return d <= cfg.recoveryInterruptRadius && (e.detect ?? (cfg.detect[e.behavior] ?? 4)) > 0;
        });
        if (intruder && Math.random() * 100 < cfg.recoveryInterruptChance) {
          dispatch({ type: 'RECOVERY_INTERRUPTED', enemyId: intruder.id });
          return;
        }
      }
      dispatch({ type: 'RECOVERY_TICK', amount: recoveryRatePerSec(p, mode) });
    }, BALANCE.recovery.tickMs);
    return () => clearInterval(t);
  }, [recovering, state.recovery?.mode, p.x, p.y, state.worldState?.enemies]);

  if (!open && !recovering) return null;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-3">
      <div className="max-w-sm w-full rounded-2xl border border-sky-800/50 bg-[#0d1410] p-5 animate-pop">
        <h2 className="text-base font-semibold text-sky-200 mb-1">💧 Essence Recovery</h2>
        <div className="text-[11px] text-stone-400 mb-3">
          Current Essence: {Math.floor(p.primevalEssence)} / {p.maxPrimevalEssence}
        </div>

        {recovering ? (
          <>
            <div className="h-3 rounded-full bg-black/40 overflow-hidden mb-1">
              <div className="h-full bg-gradient-to-r from-sky-600 to-cyan-300 transition-all duration-1000" style={{ width: `${(p.primevalEssence / p.maxPrimevalEssence) * 100}%` }} />
            </div>
            <div className="text-[11px] text-sky-300/80 mb-3">
              {state.recovery.mode === 'accelerated' ? 'Accelerated recovery...' : state.recovery.mode === 'camp' ? 'Recovering by the campfire...' : 'Recovering slowly...'}
              {' '}Est. {fmt(fullSecs)} remaining
            </div>
            <p className="text-[10px] text-stone-500 mb-3">
              While recovering you cannot move, fight, gather, trade, refine or cultivate. Cancelled recovery keeps all essence already gained.
              Outside settlements and camps, nearby beasts may interrupt your meditation.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => dispatch({ type: 'CANCEL_RECOVERY' })}
                className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 text-sm">Cancel Recovery</button>
              <button onClick={() => dispatch({ type: 'INSTANT_RECOVERY' })} disabled={p.spiritStones < BALANCE.recovery.instantCost}
                className={`py-2 rounded-lg text-sm ${p.spiritStones >= BALANCE.recovery.instantCost ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
                💎 {BALANCE.recovery.instantCost} — Instant
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <button onClick={() => dispatch({ type: 'START_RECOVERY', mode: 'normal' })}
              className="w-full text-left px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-stone-800">
              <div className="text-sm text-stone-100">Normal Recovery — <span className="text-emerald-300">Free</span></div>
              <div className="text-[10px] text-stone-500">Slow. Est. {fmt(fullSecs)} for full essence.</div>
            </button>
            <button onClick={() => dispatch({ type: 'START_RECOVERY', mode: 'accelerated' })} disabled={p.spiritStones < BALANCE.recovery.acceleratedCost}
              className={`w-full text-left px-3 py-2.5 rounded-lg border ${p.spiritStones >= BALANCE.recovery.acceleratedCost ? 'bg-white/5 hover:bg-white/10 border-stone-800' : 'border-stone-900 bg-black/20 opacity-60 cursor-not-allowed'}`}>
              <div className="text-sm text-stone-100">Accelerated — <span className="text-amber-300">💎 {BALANCE.recovery.acceleratedCost}</span></div>
              <div className="text-[10px] text-stone-500">≈2× speed. Est. {fmt(fullSecs / BALANCE.recovery.acceleratedMultiplier)}.</div>
            </button>
            <button onClick={() => dispatch({ type: 'INSTANT_RECOVERY' })} disabled={p.spiritStones < BALANCE.recovery.instantCost}
              className={`w-full text-left px-3 py-2.5 rounded-lg border ${p.spiritStones >= BALANCE.recovery.instantCost ? 'bg-white/5 hover:bg-white/10 border-stone-800' : 'border-stone-900 bg-black/20 opacity-60 cursor-not-allowed'}`}>
              <div className="text-sm text-stone-100">Instant — <span className="text-amber-300">💎 {BALANCE.recovery.instantCost}</span></div>
              <div className="text-[10px] text-stone-500">Essence restored to maximum immediately.</div>
            </button>
          </div>
        )}
        <button onClick={onClose} className="mt-3 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-300">
          {recovering ? 'Hide (recovery continues)' : 'Close'}
        </button>
      </div>
    </div>
  );
}