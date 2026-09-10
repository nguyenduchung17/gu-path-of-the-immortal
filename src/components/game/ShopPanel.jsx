import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { NPC_BY_ID, guOfferOf } from '@/game/data/npcs';
import { ITEM_BY_ID, ITEMS } from '@/game/data/items';
import { RECIPE_BY_ID } from '@/game/data/recipes';
import { GU_BY_ID } from '@/game/data/gu';
import { PATH_BY_ID } from '@/game/data/paths';
import { shopPrice } from '@/game/config/balance';
import { CLUE_RANK } from '@/game/engine/mastery';

export default function ShopPanel({ npcId, onClose }) {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const npc = NPC_BY_ID[npcId];
  const [tab, setTab] = useState(null);
  if (!npc || !npc.shop) return null;
  const rep = state.reputation.merchants || 0;
  const sellable = (npc.shop.buys || []).map(id => ITEM_BY_ID[id]).filter(Boolean);
  const recipeOffers = npc.shop.recipes || [];
  const rotating = guOfferOf(npc, state);
  const guOffers = [...(npc.shop.gu || []), ...(rotating ? [rotating] : [])];
  const tabs = [
    ...((npc.shop.sells || []).length ? ['buy'] : []),
    ...(sellable.length ? ['sell'] : []),
    ...(guOffers.length ? ['gu'] : []),
    ...(recipeOffers.length ? ['recipes'] : []),
    ...((npc.shop.intel || []).length ? ['intel'] : []),
  ];
  const active = tab && tabs.includes(tab) ? tab : tabs[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3">
      <div className="max-w-md w-full rounded-2xl border border-amber-800/50 bg-[#0d1410] p-4 animate-pop">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm font-semibold text-amber-100">{npc.name} <span className="text-[10px] text-stone-400 font-normal">{t(`role.${npc.role || 'unknown'}`)}</span></div>
          <div className="text-xs text-amber-300" title="Primordial Stones">💎 {state.player.spiritStones} {rep !== 0 && <span className="text-stone-500">({rep > 0 ? '-' : '+'}{Math.abs(rep * 2)}%)</span>}</div>
        </div>
        <div className="flex gap-1 mb-3">
          {tabs.map(id => (
            <button key={id} onClick={() => setTab(id)} className={`flex-1 py-1.5 rounded-lg text-xs capitalize ${active === id ? 'bg-amber-600 text-white' : 'bg-white/5 text-stone-300'}`}>
              {id === 'recipes' ? 'Recipes' : id === 'intel' ? 'Intel' : id === 'gu' ? t('shop.gu') : id}
            </button>
          ))}
        </div>
        <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-1.5">
          {active === 'buy' && npc.shop.sells.map(o => {
            const it = ITEM_BY_ID[o.itemId];
            const price = shopPrice(o.price, state);
            const afford = state.player.spiritStones >= price;
            return (
              <div key={o.itemId} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5">
                <div><div className="text-sm text-stone-100">{it.name}</div><div className="text-[10px] text-stone-500">{it.description}</div></div>
                <button disabled={!afford} onClick={() => dispatch({ type: 'BUY', npcId, itemId: o.itemId, qty: 1 })}
                  className={`text-xs px-2.5 py-1 rounded ${afford ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-stone-800 text-stone-500'}`}>💎 {price}</button>
              </div>
            );
          })}
          {active === 'sell' && sellable.map(it => {
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
          {active === 'sell' && sellable.every(it => (state.inventory[it.category]?.[it.id] || 0) <= 0) && (
            <div className="text-center text-stone-500 text-sm py-6">Nothing to sell here.</div>
          )}
          {active === 'gu' && guOffers.map(o => {
            const gu = GU_BY_ID[o.guId];
            const path = PATH_BY_ID[gu.path];
            const owned = state.ownedGu.some(g => g.guId === o.guId);
            const price = shopPrice(o.price, state);
            const afford = state.player.spiritStones >= price;
            const isRotating = rotating?.guId === o.guId;
            return (
              <div key={o.guId} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5">
                <div>
                  <div className="text-sm text-stone-100">🐉 {gu.name}</div>
                  <div className="text-[10px] text-stone-500">{path.icon} {path.name} · Rank {gu.rank} {gu.type}{isRotating && <span className="text-amber-300"> · {t('shop.guRotating')}</span>}</div>
                </div>
                {owned
                  ? <span className="text-[10px] text-emerald-400">✓ Bound</span>
                  : <button disabled={!afford} onClick={() => dispatch({ type: 'BUY_GU', npcId, guId: o.guId })}
                      className={`text-xs px-2.5 py-1 rounded ${afford ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-stone-800 text-stone-500'}`}>💎 {price}</button>}
              </div>
            );
          })}
          {active === 'recipes' && recipeOffers.map(o => {
            const r = RECIPE_BY_ID[o.recipeId];
            const gu = GU_BY_ID[r.guId];
            const path = PATH_BY_ID[r.path];
            const known = state.knownRecipes.includes(r.id);
            const price = shopPrice(o.price, state);
            const afford = state.player.spiritStones >= price;
            return (
              <div key={o.recipeId} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5">
                <div>
                  <div className="text-sm text-stone-100">📖 {gu.name} recipe</div>
                  <div className="text-[10px] text-stone-500">{path.icon} {path.name} · needs mastery level {r.masteryReq}</div>
                </div>
                {known
                  ? <span className="text-[10px] text-emerald-400">✓ Known</span>
                  : <button disabled={!afford} onClick={() => dispatch({ type: 'BUY_RECIPE', npcId, recipeId: o.recipeId })}
                      className={`text-xs px-2.5 py-1 rounded ${afford ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-stone-800 text-stone-500'}`}>💎 {price}</button>}
              </div>
            );
          })}
          {active === 'intel' && (npc.shop.intel || []).map(o => {
            const r = RECIPE_BY_ID[o.clue.recipeId];
            const owned = state.knownRecipes.includes(r.id);
            const stale = (CLUE_RANK[state.recipeKnowledge?.[r.id]] || 0) >= (CLUE_RANK[o.clue.level] || 0);
            const price = shopPrice(o.price, state);
            const afford = state.player.spiritStones >= price;
            return (
              <div key={o.id} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5">
                <div>
                  <div className="text-sm text-stone-100">🔍 {o.name}</div>
                  <div className="text-[10px] text-stone-500">{o.clue.level === 'located' ? 'Reliable lead — names its source' : 'A rumor — a thread to pull, nothing more'}</div>
                </div>
                {owned || stale
                  ? <span className="text-[10px] text-emerald-400">✓ Known</span>
                  : <button disabled={!afford} onClick={() => dispatch({ type: 'BUY_INTEL', npcId, offerId: o.id })}
                      className={`text-xs px-2.5 py-1 rounded ${afford ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-stone-800 text-stone-500'}`}>💎 {price}</button>}
              </div>
            );
          })}
        </div>
        <button onClick={onClose} className="mt-3 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-300">Close</button>
      </div>
    </div>
  );
}