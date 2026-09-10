import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { CONTRIBUTION_OFFERS } from '@/game/data/contribution';
import { CULTIVATION_STAGES } from '@/game/data/cultivation';
import { PATH_BY_ID } from '@/game/data/paths';
import { globalStage } from '@/game/state/gameReducer';

function reqText(offer) {
  if (!offer.req || Object.keys(offer.req).length === 0) return null;
  const parts = [];
  if (offer.req.stageReq !== undefined) parts.push(`Requires ${CULTIVATION_STAGES[offer.req.stageReq].name}`);
  if (offer.req.mastery) parts.push(`Requires ${PATH_BY_ID[offer.req.mastery.path].name} Mastery Lv ${offer.req.mastery.level}`);
  return parts.join(' · ');
}

export default function ContributionShopPanel({ onClose }) {
  const { state, dispatch } = useGame();
  const cp = state.contribution?.greenValley || 0;
  const g = globalStage(state.player);
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="max-w-lg w-full max-h-[85vh] overflow-y-auto scrollbar-thin rounded-2xl border border-cyan-800/50 bg-[#0d1410] p-5 animate-pop">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div>
            <h2 className="text-base font-semibold text-cyan-100">🏛️ Contribution Exchange</h2>
            <p className="text-[11px] text-stone-400">Stones buy goods. Contribution buys what coins cannot. Earn it by completing missions.</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-cyan-300 font-semibold">🏛 {cp}</div>
            <div className="text-[10px] text-stone-500">Contribution</div>
          </div>
        </div>

        <div className="space-y-2">
          {CONTRIBUTION_OFFERS.map(o => {
            const req = reqText(o);
            const recipeKnown = o.grant.recipe && state.knownRecipes.includes(o.grant.recipe);
            const stageOk = o.req?.stageReq === undefined || g >= o.req.stageReq;
            const masteryOk = !o.req?.mastery || (state.mastery?.[o.req.mastery.path]?.level || 1) >= o.req.mastery.level;
            const canBuy = cp >= o.cost && !recipeKnown && stageOk && masteryOk;
            return (
              <div key={o.id} className={`rounded-xl border p-3 ${recipeKnown ? 'border-stone-800/50 bg-black/10 opacity-60' : 'border-cyan-900/50 bg-cyan-900/10'}`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="text-sm font-semibold text-stone-100">{o.name}</div>
                  <div className="text-[11px] text-cyan-300 whitespace-nowrap">🏛 {o.cost}</div>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">{o.desc}</p>
                {req && <p className={`text-[10px] mt-1 ${stageOk && masteryOk ? 'text-stone-500' : 'text-rose-400'}`}>{req}</p>}
                {recipeKnown ? (
                  <div className="mt-2 text-[11px] text-stone-500">✓ Already known</div>
                ) : (
                  <button onClick={() => dispatch({ type: 'BUY_CONTRIBUTION', offerId: o.id })} disabled={!canBuy}
                    className={`mt-2 text-xs px-3 py-1.5 rounded ${canBuy ? 'bg-cyan-700 hover:bg-cyan-600 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
                    Exchange
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-300">Close</button>
      </div>
    </div>
  );
}