import React, { useMemo, useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { GU_BY_ID } from '@/game/data/gu';
import { PATH_BY_ID } from '@/game/data/paths';
import { ROLES, rolesOf } from '@/game/data/roles';
import { KM_BLUEPRINTS, blueprintMatches, BLUEPRINT_BY_ID } from '@/game/data/killerMoves';
import { canLead, kmPreview, kmResearchAvailable, maxSupportsOf, bindingOf } from '@/game/engine/killerMoves';
import { sfx } from '@/game/audio/sfx';

// A compact selectable Gu chip (shared by core & support pickers).
function GuChip({ inst, selected, onClick, disabled, badge }) {
  const { state } = useGame();
  const { t } = useT();
  const gu = GU_BY_ID[inst.guId];
  const path = PATH_BY_ID[gu.path];
  const bound = bindingOf(state, inst.instanceId)?.active;
  return (
    <button disabled={disabled} onClick={onClick}
      title={bound ? t('km.errBound', { gu: gu.name, move: '' }) : undefined}
      className={`text-left rounded-lg border px-2 py-1.5 transition ${
        selected ? 'border-amber-500/70 bg-amber-900/30 text-amber-100'
          : disabled ? 'border-stone-800 bg-stone-900/40 text-stone-500'
          : 'border-stone-700/50 bg-white/5 text-stone-200 hover:bg-white/10'}`}>
      <div className="text-[11px] font-medium truncate">{badge} {gu.name}</div>
      <div className="text-[9px] text-stone-400 truncate">{path.icon} {path.name} · {rolesOf(gu).map(r => ROLES[r].icon).join('')} · ⚡{gu.energyCost}</div>
    </button>
  );
}

// CREATE / RESEARCH tab: pick a Core + 1–4 Supports, read compatibility,
// estimates and the full success-chance breakdown, then Experiment.
export default function ResearchTab() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const [coreId, setCoreId] = useState(null);
  const [supportIds, setSupportIds] = useState([]);

  const owned = state.ownedGu || [];
  if (!kmResearchAvailable(state)) {
    // empty state (#27) — never a confusing blank screen
    return (
      <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-center">
        <div className="text-sm font-heading text-amber-200 mb-1.5">⚡ {t('km.empty.title')}</div>
        <p className="text-[11px] text-stone-300">{t('km.empty.body')}</p>
        <p className="text-[11px] text-stone-500 mt-1">{t('km.empty.hint')}</p>
      </div>
    );
  }

  const cores = owned.filter(i => canLead(GU_BY_ID[i.guId]));
  const coreInst = coreId ? owned.find(g => g.instanceId === coreId) : null;
  const maxSupports = coreInst ? maxSupportsOf(state, GU_BY_ID[coreInst.guId]) : 1;

  const pickCore = (id) => { sfx('ui'); setCoreId(id); setSupportIds([]); };
  const toggleSupport = (id) => {
    sfx('ui');
    setSupportIds(prev => prev.includes(id) ? prev.filter(x => x !== id)
      : prev.length >= maxSupports || id === coreId ? prev : [...prev, id]);
  };

  const supportInsts = supportIds.map(id => owned.find(g => g.instanceId === id)).filter(Boolean);
  const coreGu = coreInst ? GU_BY_ID[coreInst.guId] : null;
  // auto-pick the first owned blueprint that matches the current selection
  const bp = useMemo(() => {
    if (!coreGu || !supportInsts.length) return null;
    return KM_BLUEPRINTS.find(b => state.killerMoves?.blueprints?.includes(b.id)
      && blueprintMatches(b, coreGu, supportInsts.map(i => GU_BY_ID[i.guId]))) || null;
  }, [coreId, supportIds.join(','), state.killerMoves?.blueprints?.length]);

  const pv = coreInst ? kmPreview(state, coreInst, supportInsts, bp) : null;
  const COMPAT_TONE = { excellent: 'text-emerald-300', good: 'text-lime-300', unstable: 'text-amber-300', poor: 'text-rose-300' };

  const canExperiment = pv?.ok && state.player.primevalEssence >= pv.researchCost.essence && state.player.spiritStones >= pv.researchCost.stones;
  const experiment = () => { sfx('open'); dispatch({ type: 'KM_RESEARCH', coreId, supportIds, blueprintId: bp?.id || null }); };

  return (
    <div className="space-y-3">
      {/* core picker */}
      <div>
        <div className="text-[10px] font-heading tracking-wider text-amber-300 mb-1">★ {t('km.research.core')}</div>
        <p className="text-[10px] text-stone-500 mb-1.5">{t('km.research.pickCore')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {cores.map(inst => <GuChip key={inst.instanceId} inst={inst} selected={coreId === inst.instanceId} onClick={() => pickCore(inst.instanceId)} badge="★" />)}
        </div>
      </div>

      {/* support picker */}
      {coreInst && (
        <div>
          <div className="text-[10px] font-heading tracking-wider text-sky-300 mb-1">✦ {t('km.research.support')} — {t('km.maxSupports', { have: supportIds.length, max: maxSupports, path: PATH_BY_ID[coreGu.path].name, m: maxSupportsOf(state, coreGu) })}</div>
          <p className="text-[10px] text-stone-500 mb-1.5">{t('km.research.pickSupport', { max: maxSupports })}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {owned.filter(i => i.instanceId !== coreId).map(inst => (
              <GuChip key={inst.instanceId} inst={inst} selected={supportIds.includes(inst.instanceId)}
                disabled={bindingOf(state, inst.instanceId)?.active}
                onClick={() => toggleSupport(inst.instanceId)} badge="✦" />
            ))}
          </div>
        </div>
      )}

      {/* estimate panel */}
      {pv && pv.ok && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 space-y-1.5">
          <div className="text-[11px] font-heading text-amber-200 mb-1">⚡ {t('km.research.title')}</div>
          <div className={`text-xs font-semibold ${COMPAT_TONE[pv.grade.key]}`}>
            {t('km.compatibility')}: {t(`compat.${pv.grade.key}`)}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-stone-300">
            <span>{t('km.estDamage')}: <b className="text-amber-200">{pv.dmg.min}–{pv.dmg.max}</b></span>
            <span>{t('km.essenceCost')}: <b className="text-sky-200">{pv.essence}</b></span>
            <span>{t('km.activationEst')}: <b className="text-emerald-200">{pv.activation}%</b></span>
            <span>{t('km.cooldown')}: <b>{pv.cooldown}</b></span>
            <span>{t('km.targetType')}: <b>{t(`tg.${pv.targetKind}`)}</b></span>
            <span>{t('km.possibleRole')}: <b>{pv.roles.map(r => t(`role.${r}`)).join(' / ')}</b></span>
          </div>
          {/* success chance breakdown (#10) */}
          <div className="pt-1 border-t border-amber-900/40 text-[10px] text-stone-400 space-y-0.5">
            <div className="text-stone-300 font-semibold">{t('km.chance')}</div>
            <div>{t('km.chanceBase')}: {pv.chanceParts.base}% · {t('km.chanceMastery')}: +{pv.chanceParts.mastery}% · {t('km.chanceCompat')}: {pv.chanceParts.compat >= 0 ? '+' : ''}{pv.chanceParts.compat}%{pv.chanceParts.blueprint ? ` · ${t('km.chanceBlueprint')}: +${pv.chanceParts.blueprint}%` : ''}</div>
            <div className="text-emerald-300">{t('km.chanceTotal')}: <b>{pv.chance}%</b></div>
          </div>
          {bp
            ? <div className="text-[10px] text-amber-300/90">📐 {t('km.usesBlueprint', { name: t(`km.bpName.${bp.id}`), s: bp.successPct, st: bp.stabilityPct })}</div>
            : <div className="text-[10px] text-stone-500">{t('km.noBlueprint')}</div>}
          <div className="text-[10px] text-stone-400 pt-1">
            {t('km.researchCost')}: ⚡{pv.researchCost.essence} · ◉{pv.researchCost.stones}
          </div>
          <button onClick={experiment} disabled={!canExperiment}
            className={`w-full py-2 mt-1 rounded-lg text-sm font-heading tracking-wide transition ${canExperiment ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
            ⚡ {t('km.experiment')}
          </button>
        </div>
      )}

      {/* a chosen-but-invalid selection still explains itself (no dead UI) */}
      {pv && !pv.ok && (
        <div className="rounded-lg border border-rose-800/50 bg-rose-950/20 p-3 text-[11px] text-rose-200">
          {t(pv.reasonKey, pv.reasonParams)}
        </div>
      )}
    </div>
  );
}