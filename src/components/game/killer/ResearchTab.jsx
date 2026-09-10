import React, { useMemo, useState } from 'react';
import { useT } from '@/game/i18n/LangContext';
import { useGame } from '@/game/state/GameContext';
import { GU_BY_ID } from '@/game/data/gu';
import { PATH_BY_ID } from '@/game/data/paths';
import { ROLES, rolesOf } from '@/game/data/roles';
import { BALANCE } from '@/game/config/balance';
import {
  kmState, kmUnlocked, kmMaxTotal, kmBoundOf, kmEstimate, kmResearchChance,
  kmMatchesBlueprint, kmBlueprintName,
} from '@/game/engine/killerMoves';
import { KM_BLUEPRINTS, KM_BLUEPRINT_BY_ID } from '@/game/data/killerMoves';
import { sfx } from '@/game/audio/sfx';
import ResonanceGame from './ResonanceGame';

const TIER_TONE = {
  excellent: 'bg-emerald-900/40 border-emerald-600/60 text-emerald-200',
  good: 'bg-lime-900/30 border-lime-700/50 text-lime-200',
  unstable: 'bg-amber-900/30 border-amber-600/50 text-amber-200',
  poor: 'bg-orange-950/40 border-orange-800/60 text-orange-200',
  invalid: 'bg-rose-950/50 border-rose-800/70 text-rose-200',
};

// One owned Gu as a pickable component chip.
function GuPick({ inst, state, role, onClick, disabled }) {
  const { t } = useT();
  const gu = GU_BY_ID[inst.guId];
  const path = PATH_BY_ID[gu.path];
  return (
    <button onClick={onClick} disabled={disabled}
      title={gu.description}
      className={`text-left rounded-lg border px-2 py-1.5 transition ${
        disabled ? 'border-stone-800 bg-stone-900/30 text-stone-600'
          : role === 'core' ? 'border-amber-500/70 bg-amber-900/30 text-amber-100'
          : role === 'support' ? 'border-sky-500/60 bg-sky-900/25 text-sky-100'
          : 'border-stone-700/50 bg-white/5 text-stone-200 hover:bg-white/10'
      }`}>
      <div className="text-[11px] font-medium truncate">{role === 'core' ? '◈ ' : role === 'support' ? '✚ ' : ''}{gu.name}</div>
      <div className="text-[9px] text-stone-400 truncate mt-0.5">{path.icon} {rolesOf(gu).map(r => ROLES[r].icon).join('')}</div>
    </button>
  );
}

// CREATE KILLER MOVE (#3–#12): pick Core + Supports, review the estimate and
// chance breakdown, then experiment (minigame) or research via blueprint.
export default function ResearchTab() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const [coreId, setCoreId] = useState(null);
  const [supportIds, setSupportIds] = useState([]);
  const [blueprintId, setBlueprintId] = useState(null);
  const [gameOpen, setGameOpen] = useState(false);

  const km = kmState(state);
  const day = state.time?.day || 1;
  const cooldownLeft = Math.max(0, (km.researchUntilDay || 0) - day);

  const coreInst = state.ownedGu.find(g => g.instanceId === coreId);
  const coreGu = coreInst ? GU_BY_ID[coreInst.guId] : null;
  const supportInsts = supportIds.map(id => state.ownedGu.find(g => g.instanceId === id)).filter(Boolean);
  const supportGus = supportInsts.map(i => GU_BY_ID[i.guId]);
  const bp = blueprintId ? KM_BLUEPRINT_BY_ID[blueprintId] : null;

  const cap = coreGu ? kmMaxTotal(state, coreGu.path) : 5;
  const pickable = state.ownedGu.filter(g => !kmBoundOf(state, g.instanceId));

  const est = useMemo(
    () => (coreGu && supportGus.length ? kmEstimate(state, coreGu, supportGus, bp) : null),
    [coreId, supportIds.join(','), blueprintId, state.mastery],
  );
  const chance = useMemo(
    () => (est ? kmResearchChance(state, est, bp, 0) : null),
    [est && est.tier, est && est.essence, blueprintId],
  );

  const total = 1 + supportInsts.length;
  const essenceCost = BALANCE.km.essenceFlat + BALANCE.km.essencePerComponent * total;
  const stonesCost = BALANCE.km.stonesPerComponent * total;
  const canAttempt = !!est && est.tier !== 'invalid' && !cooldownLeft
    && state.player.primevalEssence >= essenceCost && state.player.spiritStones >= stonesCost;

  const ownedBps = KM_BLUEPRINTS.filter(b => km.blueprints?.[b.id]);

  const pickCore = (inst) => {
    sfx('ui');
    if (coreId === inst.instanceId) { setCoreId(null); return; }
    setCoreId(inst.instanceId);
    setSupportIds(ids => ids.filter(id => id !== inst.instanceId));
  };
  const toggleSupport = (inst) => {
    sfx('ui');
    setSupportIds(ids => {
      if (ids.includes(inst.instanceId)) return ids.filter(id => id !== inst.instanceId);
      if (coreId === inst.instanceId || ids.length + 1 >= cap) return ids;
      return [...ids, inst.instanceId];
    });
  };

  const attempt = (minigameBonus) => {
    setGameOpen(false);
    sfx('cast');
    dispatch({
      type: 'KM_RESEARCH', coreInstanceId: coreId, supportInstanceIds: supportIds,
      blueprintId: bp ? bp.id : null, minigameBonus: minigameBonus || 0,
    });
    setCoreId(null);
    setSupportIds([]);
    setBlueprintId(null);
  };

  const clear = () => { setCoreId(null); setSupportIds([]); setBlueprintId(null); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-heading tracking-wider text-amber-200">⚡ {t('km.research.title')}</span>
        <span className="text-[10px] text-stone-500">{t('km.cap', { n: cap })}</span>
      </div>

      {/* Core Gu (#5) */}
      <div>
        <div className="text-[10px] text-stone-400 mb-1">{t('km.core')} <span className="text-stone-600">— {t('km.core.hint')}</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {pickable.map(inst => (
            <GuPick key={inst.instanceId} inst={inst} state={state}
              role={coreId === inst.instanceId ? 'core' : null}
              disabled={!!coreGu && supportIds.includes(inst.instanceId) && coreId !== inst.instanceId}
              onClick={() => pickCore(inst)} />
          ))}
        </div>
      </div>

      {/* Support Gu (#6) */}
      {coreGu && (
        <div>
          <div className="text-[10px] text-stone-400 mb-1">{t('km.support')} ({supportInsts.length}/{cap - 1}) <span className="text-stone-600">— {t('km.support.hint')}</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {pickable.filter(g => g.instanceId !== coreId).map(inst => (
              <GuPick key={inst.instanceId} inst={inst} state={state}
                role={supportIds.includes(inst.instanceId) ? 'support' : null}
                disabled={supportIds.length + 1 >= cap && !supportIds.includes(inst.instanceId)}
                onClick={() => toggleSupport(inst)} />
            ))}
          </div>
        </div>
      )}

      {/* Estimate + chance (#3, #7, #10) */}
      {est && chance && (
        <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${TIER_TONE[est.tier]}`}>
              {t('km.compat')}: {t(`km.tier.${est.tier}`)} · {est.score}
            </span>
            <span className="text-[10px] text-stone-400">
              {ROLES[est.roles[0]]?.icon} {t('km.est.role')}: {est.roles.map(r => t(`role.${r}`)).join(' / ')}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 text-[10px] text-stone-300">
            <span>⚔️ {t('km.est.damage')}: <b className="text-amber-200">{est.damage[0]}–{est.damage[1]}</b></span>
            <span>⚡ {t('km.est.essence')}: <b className="text-sky-200">{est.essence}</b></span>
            <span>🎯 {t('km.est.stability')}: <b className="text-emerald-200">{est.activation}%</b></span>
            <span>⏳ {t('km.est.cooldown')}: <b className="text-stone-200">{est.cooldown}</b></span>
          </div>

          {/* chance breakdown */}
          <div className="border-t border-white/5 pt-2 space-y-0.5 text-[10px]">
            <div className="text-stone-400 font-semibold">{t('km.chance.title')}</div>
            {[
              [t('km.chance.base'), chance.parts.base],
              [t('km.chance.mastery'), `+${chance.parts.mastery}%`],
              [t('km.chance.compat'), `${chance.parts.compat >= 0 ? '+' : ''}${chance.parts.compat}%`],
              [t('km.chance.mentor'), `+${chance.parts.mentor}%`],
              ...(chance.parts.blueprint ? [[t('km.chance.blueprint'), `+${chance.parts.blueprint}%`]] : []),
              [t('km.chance.minigame'), bp ? '—' : t('km.chance.minigamePending')],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-stone-400"><span>{label}</span><span>{val}</span></div>
            ))}
            <div className="flex justify-between text-amber-200 font-semibold pt-0.5 border-t border-white/5">
              <span>{t('km.chance.total')}</span><span>{chance.total}%{bp ? '' : ' +?'}</span>
            </div>
          </div>

          {/* blueprints (#8) */}
          {ownedBps.length > 0 && (
            <div className="border-t border-white/5 pt-2 space-y-1">
              <div className="text-[10px] text-stone-400 font-semibold">{t('km.bp.title')}</div>
              {ownedBps.map(b => {
                const match = kmMatchesBlueprint(coreGu, supportGus, b);
                return (
                  <button key={b.id} disabled={!match}
                    onClick={() => { sfx('confirm'); setBlueprintId(cur => cur === b.id ? null : b.id); }}
                    title={t('km.bp.bonus', { r: b.bonus.researchPct, s: b.bonus.stabilityPct })}
                    className={`w-full text-left rounded-lg border px-2 py-1.5 transition ${
                      blueprintId === b.id ? 'border-amber-500/70 bg-amber-900/30'
                        : match ? 'border-stone-600/50 bg-white/5 hover:bg-white/10'
                        : 'border-stone-800 bg-stone-900/30 opacity-60 cursor-not-allowed'
                    }`}>
                    <div className="text-[11px] text-stone-100">{b.icon} {t('km.bp.req')} — {kmBlueprintName(b)}
                      <span className={`ml-1.5 text-[9px] ${match ? 'text-emerald-300' : 'text-stone-500'}`}>
                        {match ? (blueprintId === b.id ? `· ${t('km.bp.inUse')}` : `· ${t('km.bp.match')}`) : `· ${t('km.bp.noMatch')}`}
                      </span>
                    </div>
                    <div className="text-[9px] text-stone-500 mt-0.5">
                      {t('km.bp.reqCore', { paths: b.corePaths.join(' / ') })} · {t('km.bp.reqSupport', { roles: b.supportRoles.join(' / ') })}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* costs + actions (#11) */}
          <div className="flex items-center justify-between flex-wrap gap-2 border-t border-white/5 pt-2">
            <div className="text-[10px] text-stone-400">
              ⚡ {t('km.cost.essence')} {essenceCost} · 💎 {t('km.cost.stones')} {stonesCost} · ⏱ {t('km.cost.time')} {Math.round(BALANCE.km.researchMinutes / 60)}h
            </div>
            <div className="flex gap-1.5">
              <button onClick={clear} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-stone-300 text-[11px] hover:bg-white/10">{t('km.btn.clear')}</button>
              {gameOpen ? (
                <span />
              ) : bp ? (
                <button onClick={() => attempt(0)} disabled={!canAttempt}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-[11px] font-heading tracking-wide">
                  📜 {t('km.btn.research')}
                </button>
              ) : (
                <button onClick={() => { sfx('open'); setGameOpen(true); }} disabled={!canAttempt}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-[11px] font-heading tracking-wide">
                  ⚡ {t('km.btn.experiment')}
                </button>
              )}
            </div>
          </div>
          {cooldownLeft > 0 && <div className="text-[10px] text-amber-300/80">{t('km.cooldownLeft', { n: cooldownLeft })}</div>}
        </div>
      )}

      {gameOpen && <ResonanceGame onDone={attempt} onCancel={() => setGameOpen(false)} />}

      {!kmUnlocked(state) && (
        <div className="rounded-lg border border-stone-700/60 bg-black/30 p-3 text-center">
          <div className="text-xs font-heading text-stone-300">{t('km.locked.title')}</div>
          <p className="text-[11px] text-stone-500 mt-1">{t('km.locked.body')}</p>
        </div>
      )}
    </div>
  );
}