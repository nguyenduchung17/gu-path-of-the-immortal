import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { GU_BY_ID } from '@/game/data/gu';
import { ROLES, rolesOf } from '@/game/data/roles';

// Role overview of the equipped squad: counts per combat role plus warnings
// for a missing defense / recovery option — informational only, never blocking.
export default function LoadoutRoles() {
  const { state } = useGame();
  const { t } = useT();
  const equipped = state.player.equippedGu
    .map(id => state.ownedGu.find(g => g.instanceId === id))
    .filter(Boolean);
  if (!equipped.length) return null;

  const counts = {};
  for (const inst of equipped) for (const r of rolesOf(GU_BY_ID[inst.guId])) counts[r] = (counts[r] || 0) + 1;

  const warnings = [];
  if (!counts.defense) warnings.push(t('loadout.noDefense'));
  if (!counts.healing && !counts.support) warnings.push(t('loadout.noHealing'));

  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-stone-300 mb-1.5">{t('loadout.roles')}</div>
      <div className="flex flex-wrap gap-1.5">
        {Object.values(ROLES).map(r => (
          <span key={r.id} title={`${t(`role.${r.id}`)} — ${t(`role.${r.id}D`)}`}
            className={`text-[10px] px-1.5 py-0.5 rounded border ${r.tone} ${(counts[r.id] || 0) === 0 ? 'opacity-40' : ''}`}>
            {r.icon} {t(`role.${r.id}`)} {counts[r.id] || 0}
          </span>
        ))}
      </div>
      {warnings.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {warnings.map(w => <div key={w} className="text-[10px] text-amber-300/90">⚠ {w}</div>)}
        </div>
      )}
      <div className="text-[9px] text-stone-500 mt-1.5">{t('loadout.hint')}</div>
    </div>
  );
}