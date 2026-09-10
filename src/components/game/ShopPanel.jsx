import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { NPC_BY_ID } from '@/game/data/npcs';
import { ITEM_BY_ID, ITEMS } from '@/game/data/items';

export default function ShopPanel({ npcId, onClose }) {
  const { state, dispatch } = useGame();
  const npc = NPC_BY_ID[npcId];
  const [tab, setTab] = useState('buy');
  if (!npc || !npc.shop) return null;
  const rep = state.reputation.merchants || 0;
  const sellable = npc.shop.buys.map(id => ITEM_BY_ID[id]).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3">
      <div className="max-w-md w-full rounded-2xl border border-amber-800/50 bg-[#0d1410] p-4 animate-pop">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm font-semibold text-amber-100">{npc.name} — Trade</div>
          <div className="text-xs text-amber-300">💎 {state.player.spiritStones} {rep !== 0 && <span className="text-stone-500">({rep > 0 ? '-' : '+'}{Math.abs(rep * 2)}%)</span>}</div>
        </div>
        <div className="flex gap-1 mb-3">
          <button onClick={() => setTab('buy')} className={`flex-1 py-1.5 rounded-lg text-xs ${tab === 'buy' ? 'bg-amber-600 text-white' : 'bg-white/5 text-stone-300'}`}>Buy</button>
          <button onClick={() => setTab('sell')} className={`flex-1 py-1.5 rounded-lg text-xs ${tab === 'sell' ? 'bg-amber-600 text-white' : 'bg-white/5 text-stone-300'}`}>Sell</button>
        </div>
        <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-1.5">
          {tab === 'buy' && npc.shop.sells.map(o => {
            const it = ITEM_BY_ID[o.itemId];
            const price = Math.max(1, Math.floor(o.price * (1 - rep * 0.02)));
            const afford = state.player.spiritStones >= price;
            return (
              <div key={o.itemId} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5">
                <div><div className="text-sm text-stone-100">{it.name}</div><div className="text-[10px] text-stone-500">{it.description}</div></div>
                <button disabled={!afford} onClick={() => dispatch({ type: 'BUY', npcId, itemId: o.itemId, qty: 1 })}
                  className={`text-xs px-2.5 py-1 rounded ${afford ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-stone-800 text-stone-500'}`}>💎 {price}</button>
              </div>
            );
          })}
          {tab === 'sell' && sellable.map(it => {
            const have = state.inventory[it.category]?.[it.id] || 0;
            if (have <= 0) return null;
            const price = Math.floor(it.value * 0.5);
            return (
              <div key={it.id} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5">
                <div><div className="text-sm text-stone-100">{it.name} <span className="text-stone-500">×{have}</span></div><div className="text-[10px] text-stone-500">{it.description}</div></div>
                <button onClick={() => dispatch({ type: 'SELL', npcId, itemId: it.id, qty: 1 })}
                  className="text-xs px-2.5 py-1 rounded bg-emerald-700/50 hover:bg-emerald-700/70 text-emerald-100">💎 {price}</button>
              </div>
            );
          })}
          {tab === 'sell' && sellable.every(it => (state.inventory[it.category]?.[it.id] || 0) <= 0) && (
            <div className="text-center text-stone-500 text-sm py-6">Nothing to sell here.</div>
          )}
        </div>
        <button onClick={onClose} className="mt-3 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-300">Close</button>
      </div>
    </div>
  );
}