import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { INNS } from '@/game/data/world';
import { diffOf } from '@/game/config/balance';
import { timeLabel } from '@/game/engine/time';

export default function InnModal({ npcId, onClose }) {
  const { state, dispatch } = useGame();
  const inn = INNS.find(i => i.npcId === npcId);
  if (!inn) return null;
  const cost = Math.max(1, Math.round(inn.cost * diffOf(state).priceMul));
  const afford = state.player.spiritStones >= cost;
  const t = state.time || { day: 1, min: 7 * 60 };

  const sleep = () => {
    dispatch({ type: 'SLEEP_INN', innId: inn.id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="max-w-sm w-full rounded-2xl border border-amber-800/50 bg-[#0d1410] p-5 animate-pop">
        <h2 className="text-base font-semibold text-amber-100">🛏️ {inn.name}</h2>
        <p className="text-[11px] text-stone-400 italic mt-1 mb-3">"A warm room, a locked door, and not a single wolf at the window."</p>

        <div className="rounded-lg border border-stone-800 bg-black/20 p-3 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-stone-300">Room (per night)</span>
            <span className="text-amber-300 font-semibold">💎 {cost}</span>
          </div>
          <div className="flex justify-between text-[11px] mt-1">
            <span className="text-stone-500">Current time</span>
            <span className="text-stone-400">Day {t.day} · {timeLabel(t.min)}</span>
          </div>
        </div>

        <div className="text-[11px] text-stone-400 space-y-1 mb-3">
          <div>✓ Sleep until morning — the clock advances to 07:00 and the day rolls over</div>
          <div>✓ HP fully restored</div>
          <div className="text-stone-500">✗ Essence is <b>not</b> restored — recover it separately</div>
          <div>✓ One free simple morning meal included</div>
        </div>

        <button onClick={sleep} disabled={!afford}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${afford ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
          {afford ? 'Rent Room — Sleep Until Morning' : `Not enough primordial stones (💎 ${cost})`}
        </button>
        <button onClick={onClose} className="mt-2 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-300">Leave</button>
      </div>
    </div>
  );
}