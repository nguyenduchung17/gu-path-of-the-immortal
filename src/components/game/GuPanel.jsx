import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { GU_BY_ID } from '@/game/data/gu';
import { PATH_BY_ID, SYNERGIES } from '@/game/data/paths';
import { BALANCE } from '@/game/config/balance';
import { hungerBand, isVital, pickAutoFeedFood } from '@/game/engine/guLife';
import { vitalStatusOf, fmtRemaining } from '@/game/engine/vitalGu';
import GuCard from './gu/GuCard';
import RefineGuModal from './RefineGuModal';

// The Gu collection — living companions, not a skill list: hunger warnings,
// Auto Feed, the Vital Gu bond, and risky rank-up refinement.
export default function GuPanel() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const [refineId, setRefineId] = useState(null);

  const equipped = new Set(state.player.equippedGu);
  const equippedPaths = new Set(state.player.equippedGu.map(id => {
    const inst = state.ownedGu.find(g => g.instanceId === id);
    return inst && GU_BY_ID[inst.guId].path;
  }));
  const activeSyn = SYNERGIES.filter(sy => sy.paths.every(p => equippedPaths.has(p)));

  const vitalInst = state.vitalGu ? state.ownedGu.find(g => g.instanceId === state.vitalGu) : null;
  const vital = vitalStatusOf(state);
  const soon = state.ownedGu.filter(g => !isVital(state, g) && hungerBand(g.satiety) === 'hungry').length;
  const starving = state.ownedGu.filter(g => !isVital(state, g) && ['starving', 'critical'].includes(hungerBand(g.satiety))).length;
  const autoFeed = !!state.settings?.autoFeed;
  const allowRare = !!state.settings?.allowRareFood;
  // hungry Gu with no valid food in the pack — the panel-level warning (#23)
  const missingFed = state.ownedGu.filter(g => {
    if (isVital(state, g)) return false;
    const b = hungerBand(g.satiety);
    return (b === 'hungry' || b === 'starving' || b === 'critical') && !pickAutoFeedFood(state, GU_BY_ID[g.guId]);
  });
  const missingCats = [...new Set(missingFed.map(g => PATH_BY_ID[GU_BY_ID[g.guId].path].name))];
  const feedable = state.ownedGu.filter(g => !isVital(state, g)
    && (g.satiety ?? 100) < BALANCE.hunger.autoFeedThreshold
    && pickAutoFeedFood(state, GU_BY_ID[g.guId]));
  const feedAll = () => {
    for (const g of feedable) {
      const pick = pickAutoFeedFood(state, GU_BY_ID[g.guId]);
      if (pick) dispatch({ type: 'FEED_GU', instanceId: g.instanceId, itemId: pick.id });
    }
  };

  return (
    <div className="pt-3 animate-fade-in">
      <p className="text-xs text-stone-400 mb-2">
        Your Gu are living creatures — they grow hungry, can be injured refining, and one may be bound as your Vital Gu (Cổ Bản Mệnh). Equipped Gu are usable in combat (up to 6).
      </p>

      {/* hunger summary + auto feed */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_AUTO_FEED' })}
          className={`text-[10px] px-2.5 py-1.5 rounded-lg border ${autoFeed ? 'border-emerald-600/60 bg-emerald-900/30 text-emerald-200' : 'border-stone-700 bg-black/30 text-stone-400'}`}>
          {autoFeed ? '🍖 ' + t('hun.autoFeedOn') : '💤 ' + t('hun.autoFeedOff')}
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_ALLOW_RARE_FOOD' })}
          title={allowRare ? t('feed.rareOn') : t('feed.rareOff')}
          className={`text-[10px] px-2.5 py-1.5 rounded-lg border ${allowRare ? 'border-amber-600/60 bg-amber-900/30 text-amber-200' : 'border-stone-700 bg-black/30 text-stone-400'}`}>
          {allowRare ? '🔓' : '🔒'} {t('feed.allowRare')}
        </button>
        {feedable.length > 0 && (
          <button onClick={feedAll}
            className="text-[10px] px-2.5 py-1.5 rounded-lg border border-lime-700/60 bg-lime-900/30 text-lime-200">
            🍖 {t('feed.feedAll')} ({feedable.length})
          </button>
        )}
        {soon > 0 && (
          <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-900/25 border border-amber-700/50 text-amber-200">
            ⚠️ {t('hun.warnSoon', { n: soon })}
          </span>
        )}
        {starving > 0 && (
          <span className="text-[10px] px-2 py-1 rounded-lg bg-rose-900/30 border border-rose-700/60 text-rose-200">
            ☠️ {t('hun.warnStarving', { n: starving })}
          </span>
        )}
        {autoFeed && missingFed.length > 0 && (
          <span className="text-[10px] px-2 py-1 rounded-lg bg-rose-900/30 border border-rose-700/60 text-rose-200">
            ⚠️ {t('feed.missingSummary', { n: missingFed.length, cats: missingCats.join(', ') })}
          </span>
        )}
      </div>

      {/* vital Gu */}
      {vitalInst ? (
        <div className="mb-3 rounded-lg border border-amber-600/50 bg-gradient-to-r from-amber-900/20 to-transparent p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] font-heading tracking-[0.25em] text-amber-300/90">{t('vit.title')}</div>
            {vital && (
              <div className={`text-[9px] px-1.5 py-0.5 rounded border ${vital.status === 'stable' ? 'border-emerald-700/60 bg-emerald-900/30 text-emerald-300' : 'border-rose-700/60 bg-rose-900/30 text-rose-200'}`}>
                {t('vit.status')}: {t(`vit.state.${vital.status}`)}
              </div>
            )}
          </div>
          <div className="text-sm font-semibold text-amber-100 mt-1">
            {GU_BY_ID[vitalInst.guId].name} <span className="text-[10px] text-stone-400">Rank {vitalInst.rank || GU_BY_ID[vitalInst.guId].rank} · {PATH_BY_ID[GU_BY_ID[vitalInst.guId].path].name}</span>
          </div>
          {vital && (
            <div className="text-[10px] mt-0.5 space-y-0.5">
              {vital.status === 'stable' && <div className="text-emerald-200/80">✦ {t('vit.stableNote')}</div>}
              {vital.instability && (
                <div className="text-rose-200/90">
                  <div>{t('vit.cause')}: {t(`vit.cause.${vital.causeKey}`)}</div>
                  <div>{t('vit.remaining')}: {fmtRemaining(vital.remainingMin)} · {t('vit.recoveryPenalty')}: −{vital.recoveryPct}%</div>
                </div>
              )}
              {vital.injured && (
                <div className="text-rose-200/90">
                  🩹 {t(vital.severity === 'severe' ? 'hun.injuredSevere' : 'hun.injured', { p: vital.severity === 'severe' ? BALANCE.guRefine.severeEffPct : BALANCE.guRefine.injuryEffPct, d: vital.injuredUntilDay })}
                </div>
              )}
            </div>
          )}
          <div className="text-[10px] text-amber-200/80 mt-0.5 space-x-2">
            <span>✦ {t('vit.bonus', { e: BALANCE.vital.effBonusPct, s: BALANCE.vital.stabilityBonusPct })}</span>
            <span>🍖 {t('vit.noFeed')}</span>
            <span>🛡️ {t('ref.vitalProtect')}</span>
          </div>
        </div>
      ) : (
        <div className="mb-3 rounded-lg border border-amber-900/40 bg-amber-900/5 p-2.5 text-[10px] text-amber-200/70">
          🩸 {t('vit.confirmBody')}
        </div>
      )}

      {activeSyn.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-700/40 bg-amber-900/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-amber-300/80 mb-1">Active Synergies</div>
          {activeSyn.map(sy => (
            <div key={sy.id} className="text-xs text-amber-200"><b>{sy.name}</b> — <span className="text-stone-400">{sy.desc}</span></div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        {state.ownedGu.map(inst => (
          <GuCard key={inst.instanceId} inst={inst} equipped={equipped.has(inst.instanceId)}
            onEquip={(id) => dispatch({ type: 'EQUIP_GU', instanceId: id })}
            onUnequip={(id) => dispatch({ type: 'UNEQUIP_GU', instanceId: id })}
            onRefine={(g) => setRefineId(g.instanceId)} />
        ))}
      </div>
      {state.ownedGu.length === 0 && <div className="text-stone-500 text-sm py-6 text-center">You own no Gu yet.</div>}

      {refineId && <RefineGuModal instanceId={refineId} onClose={() => setRefineId(null)} />}
    </div>
  );
}
