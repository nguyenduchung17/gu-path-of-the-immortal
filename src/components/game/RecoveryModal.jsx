import React, { useEffect } from 'react';
import { useGame } from '@/game/state/GameContext';
import { BALANCE, recoveryRatePerSec, recoveryCosts } from '@/game/config/balance';
import { zoneAt, CAMP_CELLS } from '@/game/data/world';
import { totalGameMin } from '@/game/engine/vitalGu';

function fmt(sec) {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Essence Recovery — three deliberate paths back to a full aperture.
// Prices are never flat: they are computed from the MISSING essence, so they
// fall live as the pool refills and grow as the cultivator grows stronger.
export default function RecoveryModal({ open, onClose }) {
  const { state, dispatch } = useGame();
  const p = state.player;
  const recovering = !!state.recovery;
  const costs = recoveryCosts(p);
  const mode = recovering ? state.recovery.mode : 'normal';
  const rate = recoveryRatePerSec(p, mode, totalGameMin(state.time));
  const fullSecs = costs.missing / Math.max(0.01, rate);
  const canInstant = p.spiritStones >= costs.instant;
  const canAccel = p.spiritStones >= costs.accelerated;

  // drive essence recovery one tick at a time; in dangerous wilderness a
  // nearby enemy can notice the meditating player and interrupt them
  useEffect(() => {
    if (!recovering) return;
    const cfg = BALANCE.world;
    const t = setInterval(() => {
      const m = state.recovery.mode;
      const zone = zoneAt(p.x, p.y);
      const nearCamp = m === 'camp' || CAMP_CELLS.some(([cx, cy]) => Math.max(Math.abs(cx - p.x), Math.abs(cy - p.y)) <= cfg.campSafeRadius);
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
      dispatch({ type: 'RECOVERY_TICK', amount: recoveryRatePerSec(p, m, totalGameMin(state.time)) });
    }, BALANCE.recovery.tickMs);
    return () => clearInterval(t);
  }, [recovering, state.recovery?.mode, p.x, p.y, state.worldState?.enemies]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-3">
      <div className="max-w-sm w-full rounded-2xl border border-sky-800/50 bg-[#0d1410] p-5 animate-pop">
        <h2 className="text-base font-semibold text-sky-200 mb-1">💧 Essence Recovery</h2>
        <div className="text-[11px] text-stone-400 mb-3 flex justify-between">
          <span>Essence: <span className="text-sky-100">{Math.floor(p.primevalEssence)} / {p.maxPrimevalEssence}</span></span>
          <span>Missing: <span className="text-sky-100">{costs.missing}</span></span>
        </div>

        {costs.missing <= 0 ? (
          <div className="text-center text-sm text-emerald-300 py-4">Your essence is already full.</div>
        ) : recovering ? (
          <>
            <div className="h-3 rounded-full bg-black/40 overflow-hidden mb-1">
              <div className="h-full bg-gradient-to-r from-sky-600 to-cyan-300 transition-all duration-1000" style={{ width: `${(p.primevalEssence / p.maxPrimevalEssence) * 100}%` }} />
            </div>
            <div className="text-[11px] text-sky-300/80 mb-3">
              {mode === 'accelerated' ? 'Accelerated recovery...' : mode === 'camp' ? 'Recovering by the campfire...' : 'Recovering slowly...'}
              {' '}+{rate.toFixed(2)}/s — est. {fmt(fullSecs)} remaining
            </div>
            <p className="text-[10px] text-stone-500 mb-3">
              Stop any time — all essence already gained is kept. Outside settlements and camps, nearby beasts may interrupt your meditation.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => dispatch({ type: 'CANCEL_RECOVERY' })}
                className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 text-sm">Stop Recovering</button>
              <button onClick={() => dispatch({ type: 'INSTANT_RECOVERY' })} disabled={!canInstant}
                className={`py-2 rounded-lg text-sm ${canInstant ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
                💎 {costs.instant} — Instant
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <button onClick={() => dispatch({ type: 'START_RECOVERY', mode: 'normal' })}
              className="w-full text-left px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-stone-800">
              <div className="flex justify-between text-sm text-stone-100">Normal Recovery <span className="text-emerald-300">Free</span></div>
              <div className="text-[10px] text-stone-500">
                +{recoveryRatePerSec(p, 'normal', totalGameMin(state.time)).toFixed(2)}/s — est. {fmt(costs.missing / recoveryRatePerSec(p, 'normal', totalGameMin(state.time)))} to full
              </div>
            </button>
            <button onClick={() => dispatch({ type: 'START_RECOVERY', mode: 'accelerated' })} disabled={!canAccel}
              className={`w-full text-left px-3 py-2.5 rounded-lg border ${canAccel ? 'bg-white/5 hover:bg-white/10 border-stone-800' : 'border-stone-900 bg-black/20 opacity-60 cursor-not-allowed'}`}>
              <div className="flex justify-between text-sm text-stone-100">Accelerated <span className="text-amber-300">💎 {costs.accelerated}</span></div>
              <div className="text-[10px] text-stone-500">
                ≈{BALANCE.recovery.acceleratedMultiplier}× speed — est. {fmt(costs.missing / recoveryRatePerSec(p, 'accelerated', totalGameMin(state.time)))} to full
              </div>
            </button>
            <button onClick={() => dispatch({ type: 'INSTANT_RECOVERY' })} disabled={!canInstant}
              className={`w-full text-left px-3 py-2.5 rounded-lg border ${canInstant ? 'bg-white/5 hover:bg-white/10 border-stone-800' : 'border-stone-900 bg-black/20 opacity-60 cursor-not-allowed'}`}>
              <div className="flex justify-between text-sm text-stone-100">Instant <span className="text-amber-300">💎 {costs.instant}</span></div>
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