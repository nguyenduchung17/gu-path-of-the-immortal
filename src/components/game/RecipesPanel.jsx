import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { RECIPES, RECIPE_BY_ID } from '@/game/data/recipes';
import { GU_BY_ID } from '@/game/data/gu';
import { PATH_BY_ID } from '@/game/data/paths';
import { refineChecklist } from '@/game/state/gameReducer';
import { BALANCE } from '@/game/config/balance';

function ReqLine({ met, text }) {
  return (
    <div className={`text-[10px] flex items-center gap-1.5 ${met ? 'text-emerald-300' : 'text-rose-300'}`}>
      <span>{met ? '✓' : '✗'}</span><span className={met ? '' : 'text-stone-400'}>{text}</span>
    </div>
  );
}

function RecipeCard({ recipeId }) {
  const { state, dispatch } = useGame();
  const r = RECIPE_BY_ID[recipeId];
  const gu = GU_BY_ID[r.guId];
  const path = PATH_BY_ID[r.path];
  const list = refineChecklist(state, recipeId);
  const refBonus = list.essenceCost < r.essence ? ` (−${r.essence - list.essenceCost} refinement craft)` : '';
  const success = Math.min(95,
    BALANCE.refinement.baseSuccess
    + state.player.intelligence * BALANCE.refinement.successPerInt
    + Math.floor(state.player.luck * BALANCE.refinement.successPerLuck));
  const owned = state.ownedGu.some(o => o.guId === r.guId);

  return (
    <div className="rounded-lg border border-stone-800 bg-black/20 p-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-semibold text-stone-100">{gu.name} {owned && <span className="text-[9px] text-emerald-400">· refined</span>}</div>
          <div className="text-[10px] text-stone-500">{gu.type} · {gu.description}</div>
        </div>
        <div className={`text-[10px] px-1.5 rounded border whitespace-nowrap ${path.border} ${path.color}`}>{path.icon} L{r.masteryReq}</div>
      </div>
      <div className="mt-2 space-y-0.5">
        {list.checks.map(c => <ReqLine key={c.key} met={c.met} text={c.text} />)}
        <div className="text-[10px] text-stone-500">Success chance: ≈{Math.round(success)}%{refBonus}</div>
      </div>
      <button disabled={!list.ok || state.recovery || state.combat} onClick={() => dispatch({ type: 'REFINE_RECIPE', recipeId })}
        className={`mt-2 w-full py-1.5 rounded-lg text-xs font-medium ${list.ok && !state.recovery && !state.combat ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
        ⚗️ Refine
      </button>
    </div>
  );
}

export default function RecipesPanel() {
  const { state } = useGame();
  const known = RECIPES.filter(r => state.knownRecipes.includes(r.id));
  const unknown = RECIPES.filter(r => !state.knownRecipes.includes(r.id));

  return (
    <div className="pt-3 space-y-4 animate-fade-in">
      <p className="text-xs text-stone-400">
        A Gu cannot be refined without its recipe. Recipes are bought, found, rewarded — or granted by deep Path mastery.
      </p>
      <div>
        <h3 className="text-sm font-semibold text-stone-300 mb-2">Known Recipes ({known.length})</h3>
        {known.length === 0
          ? <div className="text-stone-500 text-sm">You know no recipes yet — the Gu Master and herbalist in Green Valley sell some.</div>
          : <div className="grid sm:grid-cols-2 gap-2">{known.map(r => <RecipeCard key={r.id} recipeId={r.id} />)}</div>}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-stone-400 mb-2">Undiscovered ({unknown.length})</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {unknown.map(r => (
            <div key={r.id} className="rounded-lg border border-stone-900 bg-black/10 p-3 opacity-75">
              <div className="text-sm text-stone-500">🔒 Unknown Recipe</div>
              <div className="text-[10px] text-stone-600 italic mt-1">{r.hint}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}