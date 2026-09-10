import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { KM_BLUEPRINTS } from '@/game/data/killerMoves';

// Requirement text for a blueprint slot spec — roles/Paths, never exact names.
function SpecText({ spec, t }) {
  if (!spec || spec.any) return t('km.bp.any');
  const parts = [];
  if (spec.role) parts.push(t('km.bp.role', { role: t(`role.${spec.role}`) }));
  if (spec.roles) parts.push(spec.roles.map(r => t('km.bp.role', { role: t(`role.${r}`) })).join(' + '));
  if (spec.path) parts.push(t('km.bp.path', { path: t(`path.${spec.path}.name`) }));
  if (spec.paths) parts.push(spec.paths.map(p => t('km.bp.path', { path: t(`path.${p}.name`) })).join(' / '));
  if (spec.element) parts.push(t('km.bp.element', { element: spec.element }));
  return parts.join(' · ');
}

// BLUEPRINTS tab — owned blueprints with requirements and bonuses; unknown
// ones stay hidden behind a count (discovery is part of the game, #19).
export default function BlueprintsTab() {
  const { state } = useGame();
  const { t } = useT();
  const ownedIds = state.killerMoves?.blueprints || [];
  const owned = KM_BLUEPRINTS.filter(b => ownedIds.includes(b.id));
  const unknownN = KM_BLUEPRINTS.length - owned.length;

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-stone-500 px-1">{t('km.blueprints.title')}</p>
      {owned.map(bp => (
        <div key={bp.id} className="rounded-lg border border-sky-800/50 bg-sky-950/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-sky-100">📐 {t(`km.bpName.${bp.id}`)}</span>
            <span className="text-[10px] px-1.5 rounded bg-sky-900/50 border border-sky-700/50 text-sky-200">{t('km.bp.owned')}</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 italic">{t(`km.bpHint.${bp.id}`)}</p>
          <div className="text-[10px] text-stone-300 mt-1.5 space-y-0.5">
            <div>{t('km.bp.requirements')} — {t('km.bp.core')}: <SpecText spec={bp.core} t={t} /></div>
            {bp.supports.map((spec, i) => (
              <div key={i}>{t('km.bp.support')} {i + 1}: <SpecText spec={spec} t={t} /></div>
            ))}
          </div>
          <div className="text-[10px] text-emerald-300/90 mt-1.5">✦ {t('km.bp.bonus', { s: bp.successPct, st: bp.stabilityPct })}</div>
        </div>
      ))}
      {!owned.length && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-[11px] text-stone-400">{t('km.noBlueprint')}</div>
      )}
      {unknownN > 0 && (
        <p className="text-[10px] text-stone-500 px-1">🌀 {t('km.bp.unknown', { n: unknownN })}</p>
      )}
    </div>
  );
}