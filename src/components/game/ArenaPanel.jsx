import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { ARENA_CHALLENGES } from '@/game/data/arena';

export default function ArenaPanel({ onClose }) {
  const { state, dispatch } = useGame();
  const p = state.player;
  const arena = state.arena || { wins: 0, losses: 0 };
  const [confirmId, setConfirmId] = useState(null);
  const ch = confirmId ? ARENA_CHALLENGES.find(c => c.id === confirmId) : null;

  const start = () => {
    dispatch({ type: 'ARENA_FIGHT', challengeId: ch.id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="max-w-lg w-full max-h-[85vh] overflow-y-auto scrollbar-thin rounded-2xl border border-rose-900/60 bg-[#0d1410] p-5 animate-pop">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div>
            <h2 className="text-base font-semibold text-rose-100">⚔️ Green Valley Arena</h2>
            <p className="text-[11px] text-stone-400">Controlled duels. Post a stake in primordial stones — win, and you take your opponent's stake too.</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] text-emerald-300 font-semibold">W {arena.wins || 0} · L {arena.losses || 0}</div>
            <div className="text-[10px] text-stone-500">Record</div>
          </div>
        </div>

        {ch ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-rose-800/50 bg-rose-900/10 p-3">
              <div className="flex justify-between items-start">
                <div className="text-sm font-semibold text-rose-100">{ch.name}</div>
                <div className="text-[11px] text-stone-400">Recommended: {ch.recRank}</div>
              </div>
              <p className="text-[11px] text-stone-400 mt-1"><b className="text-stone-200">{ch.opponent.name}</b> — {ch.opponent.description}</p>
              <div className="text-[11px] text-stone-300 mt-2">HP {ch.opponent.hp} · ATK {ch.opponent.attack} · DEF {ch.opponent.defense}</div>
              <div className="text-[11px] text-stone-300 mt-1">
                Your stake: <b className="text-amber-300">💎 {ch.stake}</b> · Opponent stake: <b className="text-amber-300">💎 {ch.opponentStake}</b>
                {ch.rewards?.contribution ? <> · Win bonus: 🏛 {ch.rewards.contribution} contribution</> : null}
              </div>
              <div className="mt-3 rounded-lg border border-amber-700/40 bg-amber-900/10 p-2 text-[11px] text-amber-200">
                ⚠️ If you lose or flee the duel, your {ch.stake} primordial stones are forfeit.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmId(null)} className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-stone-200">Back</button>
              <button onClick={start} disabled={p.spiritStones < ch.stake}
                className={`py-2 rounded-lg text-sm font-medium ${p.spiritStones >= ch.stake ? 'bg-rose-700 hover:bg-rose-600 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
                {p.spiritStones < ch.stake ? `Need 💎 ${ch.stake}` : 'Post Stake & Fight'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {ARENA_CHALLENGES.map(c => (
              <button key={c.id} onClick={() => setConfirmId(c.id)}
                className="w-full text-left rounded-xl border border-stone-800 bg-black/20 hover:bg-rose-900/10 p-3">
                <div className="flex justify-between items-start">
                  <div className="text-sm font-semibold text-stone-100">{c.name}</div>
                  <div className="text-[11px] text-amber-300 whitespace-nowrap">Stake: 💎 {c.stake} vs 💎 {c.opponentStake}</div>
                </div>
                <div className="text-[11px] text-stone-400 mt-1">{c.opponent.name} · Recommended {c.recRank}</div>
              </button>
            ))}
          </div>
        )}

        <button onClick={onClose} className="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-300">Close</button>
      </div>
    </div>
  );
}