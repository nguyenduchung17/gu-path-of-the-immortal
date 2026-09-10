import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { GU_BY_ID, isKillerMove } from '@/game/data/gu';
import { PATH_BY_ID } from '@/game/data/paths';
import { ROLES, rolesOf } from '@/game/data/roles';
import { BALANCE } from '@/game/config/balance';
import { effectiveCost } from '@/game/engine/combat';
import { proficiencyOf } from '@/game/engine/proficiency';
import { HUNGER_META, foodsOf, foodCount, feedingEstimate, guCondition, autoFeedStatus, isProtectedFood } from '@/game/engine/guLife';
import { bindingOf, kmNameOf } from '@/game/engine/killerMoves';
import { effectSummary } from '../battle/BattleCommandMenu';
import { sfx } from '@/game/audio/sfx';

// One living companion: rank, hunger meter, injuries, Vital-Gu bond, feeding
// and risky rank-up refinement — the card shows the Gu's whole life at a glance.
export default function GuCard({ inst, equipped, onEquip, onUnequip, onRefine }) {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const gu = GU_BY_ID[inst.guId];
  const path = PATH_BY_ID[gu.path];
  const cond = guCondition(state, inst);
  const binding = bindingOf(state, inst.instanceId);
  const meta = HUNGER_META[cond.band];
  // feeding menu — preferred staple + acceptable substitutes, all visible (#1, #32)
  const foods = foodsOf(gu).map(f => ({ ...f, count: foodCount(state, f.id) }));
  const ownedFoods = foods.filter(f => f.count > 0);
  const preferred = foods.find(f => f.tier === 'preferred') || foods[0];
  const acceptables = foods.filter(f => f !== preferred);
  const af = autoFeedStatus(state, inst);
  const AF_CHIP = {
    notRequired: { label: t('feed.notRequired'), cls: 'text-amber-200/80' },
    disabled: { label: t('feed.autoDisabled'), cls: 'text-stone-500' },
    ready: { label: t('feed.autoActive'), cls: 'text-emerald-300/90' },
    missing: { label: t('feed.autoMissing'), cls: 'text-rose-300' },
  };
  const afChip = AF_CHIP[af] || AF_CHIP.disabled;
  const pellets = state.inventory.guGear?.restorationPellet || 0;
  const rank = inst.rank || gu.rank;
  const est = feedingEstimate(state, inst);
  const prof = proficiencyOf(inst);
  const [armVital, setArmVital] = useState(false);

  const setVital = () => {
    if (!armVital) {
      setArmVital(true);
      sfx('ui');
      setTimeout(() => setArmVital(false), 4000);
      return;
    }
    sfx('confirm');
    dispatch({ type: 'SET_VITAL_GU', instanceId: inst.instanceId });
    setArmVital(false);
  };

  const satPct = Math.max(0, Math.min(100, (inst.satiety ?? 100)));
  const border = cond.vital ? 'border-amber-400/70' : cond.injured ? 'border-rose-700/60' : equipped ? 'border-emerald-500/60' : 'border-stone-800';

  return (
    <div className={`rounded-lg border p-3 bg-black/20 ${border} ${cond.vital ? 'bg-amber-900/10' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-100 flex items-center gap-1.5">
            {cond.vital && <span className="text-amber-300" title={t('vit.title')}>◍</span>}
            {isKillerMove(gu) && <span className="text-amber-300">★</span>}
            <span className="truncate">{gu.name}</span>
            <span className="text-[10px] text-stone-400">R{rank}</span>
          </div>
          <div className="flex gap-1 items-center mt-0.5 flex-wrap">
            {rolesOf(gu).map(r => (
              <div key={r} title={t(`role.${r}D`)} className={`text-[10px] inline-block px-1.5 rounded border ${ROLES[r].tone}`}>{ROLES[r].icon} {t(`role.${r}`)}</div>
            ))}
            <div className={`text-[10px] inline-block px-1.5 rounded border ${path.border} ${path.color}`}>{path.icon} {path.name}</div>
            {cond.injured && (
              <div className="text-[10px] px-1.5 rounded border border-rose-700/60 bg-rose-900/30 text-rose-200">🩹 {inst.injurySeverity === 'severe' ? t('hun.injuredSevere', { p: BALANCE.guRefine.severeEffPct, d: cond.injuredUntilDay }) : t('hun.injured', { p: BALANCE.guRefine.injuryEffPct, d: cond.injuredUntilDay })}</div>
            )}
          </div>
        </div>
        {equipped
          ? <button onClick={() => onUnequip(inst.instanceId)} className="text-[10px] px-2 py-1 rounded bg-emerald-700/40 text-emerald-200 shrink-0">Equipped</button>
          : <button onClick={() => onEquip(inst.instanceId)} className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 shrink-0">Equip</button>}
      </div>

      {binding && (
        <div className="text-[10px] mt-1.5 px-1.5 py-0.5 inline-block rounded border border-amber-700/50 bg-amber-900/20 text-amber-200">
          ⚡ {t('km.bound')}: {kmNameOf(state, binding.move)}{binding.active ? '' : ` (${t('km.standby')})`}
        </div>
      )}
      <p className="text-[11px] text-stone-400 mt-1.5">{gu.description}</p>
      <div className="text-[10px] text-stone-500 mt-1.5 flex gap-3">
        <span>⚡ {effectiveCost(gu, state, inst)}{cond.costPct > 0 && <span className="text-amber-400"> (+hunger)</span>}</span>
        <span>⏳ {gu.cooldown}</span>
        <span className="capitalize">{gu.rarity}</span>
        <span className={cond.effPct > 0 ? 'text-emerald-400' : cond.effPct < 0 ? 'text-rose-400' : ''}>
          ✦ {cond.effPct > 0 ? '+' : ''}{Math.round(cond.effPct)}%
        </span>
      </div>
      <div className="text-[10px] text-stone-500 mt-1">{effectSummary(gu, t)}</div>

      {/* hunger & feeding — the whole requirement is always visible */}
      <div className="mt-2">
        {cond.vital ? (
          <div className="text-[10px] text-amber-200/90">🩸 {t('feed.notRequired')} — {t('feed.vitalReason')} · {t('vit.bonus', { e: BALANCE.vital.effBonusPct, s: BALANCE.vital.stabilityBonusPct })}</div>
        ) : (
          <>
            <div className="flex justify-between items-center text-[10px] mb-0.5">
              <span className={meta.tone}>{meta.icon} {t(`hun.${cond.band}`)} · {Math.round(inst.satiety ?? 100)}/{BALANCE.hunger.maxSatiety}</span>
              <span className={afChip.cls}>{afChip.label}</span>
            </div>
            <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${meta.bar}`} style={{ width: `${satPct}%` }} />
            </div>
            <div className="text-[9px] text-stone-500 mt-1">
              {est <= 0 ? t('hun.hungryNow') : t('hun.nextFeed', { n: Math.max(1, Math.round(est)) })}
              {' · '}{t('feed.category')}: <span className="text-stone-400">{path.name}</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">
              {t('feed.preferred')}: <span className="text-stone-300">{preferred?.item ? `${preferred.item.name} +${preferred.satiety}` : '—'}</span>
              {acceptables.length > 0 && (
                <span>{' · '}{t('feed.acceptable')}: <span className="text-stone-400">{acceptables.map(f => `${f.item?.name || f.id} +${f.satiety}${isProtectedFood(f) ? ' 🔒' : ''}`).join(', ')}</span></span>
              )}
            </div>
            {cond.effPct < 0 && (
              <div className="text-[9px] text-rose-300/80">⚠ {t('feed.penalty', { e: cond.effPct, s: cond.stability })}</div>
            )}
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {ownedFoods.length > 0 ? ownedFoods.map(f => (
                <button key={f.id}
                  onClick={() => { sfx('ui'); dispatch({ type: 'FEED_GU', instanceId: inst.instanceId, itemId: f.id }); }}
                  title={`${t('feed.satiety')}: ${Math.round(inst.satiety ?? 100)} → ${Math.min(BALANCE.hunger.maxSatiety, Math.round((inst.satiety ?? 100) + f.satiety))}${isProtectedFood(f) ? ` · ${t('feed.protectedNote')}` : ''}`}
                  className="text-[10px] px-2 py-1 rounded bg-lime-800/50 hover:bg-lime-700/60 text-lime-100">
                  🍖 {f.item?.name || f.id} +{f.satiety} ×{f.count}
                </button>
              )) : (
                <div className="text-[10px] text-rose-300/90">
                  ⚠ {t('feed.noValidFood')} <span className="text-stone-500">— {t('feed.hint')}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* proficiency — practice with this companion sharpens it */}
      <div className="mt-2">
        <div className="flex justify-between items-center text-[10px] mb-0.5">
          <span className="text-sky-300/90">✎ {t('prof.title')} <span className="text-sky-200 font-semibold">Lv.{prof.level}</span></span>
          <span className="text-stone-500">{prof.maxed ? t('prof.max') : `${prof.uses}/${prof.nextAt}`}</span>
        </div>
        <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-700 to-cyan-300 transition-all duration-700" style={{ width: `${prof.pct}%` }} />
        </div>
        {prof.level > 1 && (
          <div className="text-[9px] text-sky-300/70 mt-0.5">
            ✦ {t('prof.combat', { p: prof.powerPct })}{gu.explore ? ` · ${t('prof.wild', { d: prof.durationPct })}` : ''}
          </div>
        )}
      </div>

      {/* actions */}
      <div className="flex gap-1.5 mt-2.5 flex-wrap">
        {!cond.vital && (
          <button
            onClick={setVital}
            className={`text-[10px] px-2 py-1 rounded ${armVital ? 'bg-amber-500 text-black animate-pulse' : 'bg-amber-900/40 hover:bg-amber-800/60 text-amber-200'}`}>
            🩸 {armVital ? t('ui.confirm') + '?' : t('vit.set')}
          </button>
        )}
        {cond.injured && pellets > 0 && (
          <button onClick={() => { sfx('confirm'); dispatch({ type: 'CURE_GU', instanceId: inst.instanceId }); }}
            className="text-[10px] px-2 py-1 rounded bg-sky-800/60 hover:bg-sky-700 text-sky-100">
            💊 {t('hun.cure')} ({pellets})
          </button>
        )}
        <button
          onClick={() => onRefine(inst)}
          disabled={rank >= BALANCE.guRefine.maxRank}
          className={`text-[10px] px-2 py-1 rounded ${rank >= BALANCE.guRefine.maxRank ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : 'bg-amber-900/40 hover:bg-amber-800/60 text-amber-200'}`}>
          ✦ {t('ref.title')} → R{rank + 1}
        </button>
      </div>
    </div>
  );
}