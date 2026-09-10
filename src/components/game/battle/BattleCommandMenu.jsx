import React, { useState } from 'react';
import { useT } from '@/game/i18n/LangContext';
import { sfx } from '@/game/audio/sfx';
import { GU_BY_ID, isKillerMove } from '@/game/data/gu';
import { ITEM_BY_ID, ITEMS } from '@/game/data/items';
import { PATH_BY_ID } from '@/game/data/paths';
import { ROLES, rolesOf } from '@/game/data/roles';
import { effectiveCost, activationChanceOf, strikeRange, guAttackRange } from '@/game/engine/combat';
import { targetKindOf, targetLabelKey, targetSummary } from '@/game/engine/targeting';

// Short localized summary of what a Gu does in battle.
export function effectSummary(gu, t) {
  const e = gu.effect || {};
  const parts = [];
  if (e.attack) {
    const r = guAttackRange(gu);
    parts.push(`${t('fx.attack')} ${r.min}–${r.max}${e.attack.hits ? `×${e.attack.hits}` : ''}${e.attack.stun ? ` · ${t('fx.stun')} ${e.attack.stun}%` : ''}`);
  }
  if (e.burn) parts.push(`${t('fx.burn')} ${e.burn.power}×${e.burn.duration}`);
  if (e.defense) parts.push(`${t('fx.defense')} ${e.defense.power}`);
  if (e.barrier) parts.push(`${t('fx.barrier')} ${e.barrier.power}`);
  if (e.evasion) parts.push(`${t('fx.evasion')} ${e.evasion.power}%`);
  if (e.heal) parts.push(`${t('fx.heal')} ${e.heal.power}`);
  if (e.essence) parts.push(`${t('fx.essence')} ${e.essence.power}`);
  if (e.summon) parts.push(`${t('fx.summon')} ${e.summon.power}×${e.summon.duration}`);
  if (e.control) parts.push(`${t('fx.control')} ${e.control.power}`);
  if (e.buff) parts.push(`${t('fx.buff')} +${e.buff.power}%`);
  if (e.investigate) parts.push(t('fx.investigate'));
  if (e.stab) parts.push(`${t('fx.stab')} ${e.stab}`);
  if (e.slow) parts.push(`${t('fx.slow')} −${e.slow.power}%`);
  if (e.delay) parts.push(`${t('fx.delay')} ${e.delay.pct}%`);
  if (e.advance) parts.push(`${t('fx.advance')} ${e.advance.pct}%`);
  if (e.expose) parts.push(`${t('fx.expose')} +${e.expose.power}%`);
  if (e.self?.haste) parts.push(`${t('fx.haste')} +${e.self.haste.power}%`);
  if (e.self?.momentum) parts.push(`${t('fx.momentum')} +${e.self.momentum.power}%/hit`);
  if (e.attack?.paralysis) parts.push(`${t('fx.paralysis')} ${e.attack.paralysis.chance}%`);
  if (e.attack?.freeze) parts.push(`${t('fx.freeze')} ${e.attack.freeze.chance}%`);
  if (e.attack?.guard) parts.push(`${t('fx.stoneGuard')} ${e.attack.guard.chance}%`);
  if (e.poison) parts.push(`${t('fx.poison')} ${e.poison.power}×${e.poison.duration}`);
  if (e.essenceRecovery) parts.push(`${t('fx.essenceRecovery')} ${e.essenceRecovery.chance}%`);
  if (e.attack?.armorPen) parts.push(`${t('fx.armorPen')} ${e.attack.armorPen}%`);
  if (e.selfDelay) parts.push(`${t('fx.selfDelay')} +${e.selfDelay.pct}%`);
  if (e.soak) parts.push(t('fx.soak'));
  if (e.forceGain) parts.push(`${t('fx.forceGain')} +${e.forceGain}/hit`);
  if (e.consumeForce) parts.push(t('fx.forceConsume', { n: e.consumeForce.max, p: e.consumeForce.dmgPerStackPct }));
  return parts.join(' · ');
}

// Path icon ≠ role icons: the Path badge shows where a Gu's power comes from;
// the role icons show the jobs it does in battle.
function RoleIcons({ gu }) {
  const { t } = useT();
  return (
    <span className="whitespace-nowrap">
      {rolesOf(gu).map(r => (
        <span key={r} title={`${t(`role.${r}`)} — ${t(`role.${r}D`)}`}>{ROLES[r].icon}</span>
      ))}
    </span>
  );
}

function GuOption({ inst, state, combat, killer, onClick }) {
  const { t } = useT();
  const gu = GU_BY_ID[inst.guId];
  const path = PATH_BY_ID[gu.path];
  const cd = combat.cooldowns[inst.instanceId] || 0;
  const cost = effectiveCost(gu, state, inst);
  const chance = activationChanceOf(gu, inst, state, combat);
  const noEssence = state.player.primevalEssence < cost;
  const disabled = cd > 0 || noEssence;
  // targeting (#15–#18): the card names its category, and area Gu show how
  // many living enemies they would hit right now
  const kind = targetKindOf(gu);
  const livingN = (combat.enemies || []).filter(x => x.hp > 0).length;
  const areaN = kind !== 'single' && livingN > 1
    ? (kind === 'random' ? Math.min(livingN, gu.effect.target?.hits || 3) : livingN)
    : 0;
  return (
    <button disabled={disabled} onClick={onClick}
      className={`text-left rounded-lg border px-2.5 py-2 transition ${
        disabled ? 'border-stone-800 bg-stone-900/40 text-stone-500'
          : killer ? 'border-amber-500/50 bg-amber-900/20 text-amber-100 hover:bg-amber-800/30'
          : 'border-emerald-700/40 bg-emerald-900/20 text-emerald-100 hover:bg-emerald-800/30'
      }`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium truncate">{killer && <span className="text-amber-300">★ </span>}{gu.name}</span>
        <span className={`text-[10px] shrink-0 ${noEssence ? 'text-rose-300' : 'text-stone-400'}`}>⚡{cost}{cd > 0 ? ` · ⏳${cd}` : ''}</span>
      </div>
      <div className="text-[10px] text-stone-400 truncate mt-0.5">
        {path.icon} {path.name} · <RoleIcons gu={gu} />
      </div>
      <div className="text-[10px] text-stone-500 truncate mt-0.5">
        {gu.effect?.attack && <span className="text-amber-200/80">🎯 {t('battle.crit')} {gu.effect.attack.crit ?? 5}% · </span>}
        <span className="text-sky-200/80">{t(targetLabelKey(gu))}{targetSummary(gu) ? ` (${targetSummary(gu)})` : ''}{areaN ? ` · ${t('fx.targets')} ${areaN}` : ''} · </span>
        {t('battle.activation')} {chance}% · {effectSummary(gu, t)}
      </div>
    </button>
  );
}

// Bottom battle command interface. STRIKE is the free fallback (0 essence,
// chips the enemy's guard); DEFEND appears only when a defensive Gu is
// actually equipped — a normal body alone cannot simply "defend" against
// beasts. Gu are filterable by combat role so a toolkit build stays readable.
export default function BattleCommandMenu({ state, combat, busy, onGu, onItem, onStrike, onObserve, onDefend, onFlee }) {
  const { t } = useT();
  const [tab, setTab] = useState('main');
  const [guFilter, setGuFilter] = useState('all');
  const p = state.player;
  const equipped = p.equippedGu.map(id => state.ownedGu.find(g => g.instanceId === id)).filter(Boolean);
  const normalGu = equipped.filter(inst => !isKillerMove(GU_BY_ID[inst.guId]));
  const killerGu = equipped.filter(inst => isKillerMove(GU_BY_ID[inst.guId]));
  // generic DEFEND requires an equipped defensive Gu (barrier / damage reduction)
  const hasDefensiveGu = equipped.some(inst => rolesOf(GU_BY_ID[inst.guId]).includes('defense'));
  // only fare meant for a fight can be consumed mid-battle
  const meds = ITEMS.filter(it => it.combatUsable)
    .filter(it => (state.inventory[it.category]?.[it.id] || 0) > 0);
  const disabled = busy || combat.over;
  // Strike's real numbers, always visible — never guess basic damage
  // (Strength Path mastery raises this exact same range)
  const sr = strikeRange(p, state);

  const FILTERS = [
    { id: 'all', label: t('battle.tabAll'), roles: null },
    { id: 'attack', label: `${ROLES.attack.icon} ${t('role.attack')}`, roles: ['attack'] },
    { id: 'defense', label: `${ROLES.defense.icon} ${t('role.defense')}`, roles: ['defense'] },
    { id: 'control', label: `${ROLES.control.icon} ${t('role.control')}`, roles: ['control'] },
    { id: 'support', label: `${ROLES.healing.icon} ${t('battle.tabSupport')}`, roles: ['healing', 'support'] },
    { id: 'utility', label: `${ROLES.movement.icon} ${t('battle.tabUtility')}`, roles: ['movement', 'scouting', 'summon', 'debuff'] },
  ];
  const filterOf = FILTERS.find(f => f.id === guFilter) || FILTERS[0];
  const visibleGu = filterOf.roles
    ? normalGu.filter(inst => { const rs = rolesOf(GU_BY_ID[inst.guId]); return filterOf.roles.some(r => rs.includes(r)); })
    : normalGu;

  const MAIN = [
    { id: 'strike', label: t('battle.cmdStrike'), icon: '⚔️', tone: 'bg-amber-800/60 hover:bg-amber-700 border-amber-600/40' },
    { id: 'gu', label: t('battle.cmdGu'), icon: '🐉', tone: 'bg-emerald-700/80 hover:bg-emerald-600 border-emerald-500/40' },
    { id: 'killer', label: t('battle.cmdKiller'), icon: '⚡', tone: 'bg-amber-700/70 hover:bg-amber-600 border-amber-500/40' },
    { id: 'item', label: t('battle.cmdItem'), icon: '🧪', tone: 'bg-sky-800/70 hover:bg-sky-700 border-sky-600/40' },
    ...(hasDefensiveGu ? [{ id: 'defend', label: t('battle.cmdDefend'), icon: '🛡️', tone: 'bg-stone-700/80 hover:bg-stone-600 border-stone-500/40' }] : []),
    { id: 'observe', label: t('battle.cmdObserve'), icon: '👁️', tone: 'bg-slate-700/70 hover:bg-slate-600 border-slate-500/40' },
    { id: 'flee', label: t('battle.cmdFlee'), icon: '🏃', tone: 'bg-rose-900/60 hover:bg-rose-800 border-rose-700/50' },
  ];

  const act = (fn) => () => { if (!disabled) fn(); };

  return (
    <div>
      {/* sub-list above the main row */}
      {tab !== 'main' && (
        <div className="mb-2 animate-fade-in">
          {tab === 'gu' && normalGu.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => { sfx('ui'); setGuFilter(f.id); }}
                  className={`text-[9px] px-2 py-0.5 rounded-full border transition ${
                    guFilter === f.id
                      ? 'bg-emerald-700/60 border-emerald-500/50 text-emerald-100'
                      : 'bg-black/30 border-stone-700 text-stone-400 hover:text-stone-200'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto scrollbar-thin">
            {tab === 'gu' && (visibleGu.length
              ? visibleGu.map(inst => <GuOption key={inst.instanceId} inst={inst} state={state} combat={combat} killer={false}
                  onClick={act(() => { sfx('ui'); setTab('main'); onGu(inst); })} />)
              : <div className="text-[11px] text-stone-500 col-span-2 px-2 py-1">— {filterOf.label} —</div>)}
            {tab === 'killer' && (killerGu.length
              ? killerGu.map(inst => <GuOption key={inst.instanceId} inst={inst} state={state} combat={combat} killer
                  onClick={act(() => { sfx('ui'); setTab('main'); onGu(inst); })} />)
              : <div className="text-[11px] text-stone-500 col-span-2 px-2 py-1">{t('battle.noKiller')}</div>)}
            {tab === 'item' && (meds.length
              ? meds.map(it => (
                <button key={it.id} disabled={disabled} onClick={act(() => { setTab('main'); onItem(it.id); })}
                  className="text-left rounded-lg border border-sky-700/40 bg-sky-900/20 text-sky-100 hover:bg-sky-800/30 px-2.5 py-2">
                  <div className="text-xs font-medium">🧪 {it.name} <span className="text-stone-400">×{state.inventory[it.category]?.[it.id]}</span></div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {it.use?.hp ? `+${it.use.hp} ${t('ui.hp')}` : ''}{it.use?.hp && it.use?.essence ? ' · ' : ''}{it.use?.essence ? `+${it.use.essence} ${t('ui.essence')}` : ''}
                    {it.use?.cure?.includes('poison') ? ' · cures poison' : ''}
                    {it.use?.buff?.type === 'poisonResist' ? ` · poison resist +${it.use.buff.power}%` : ''}
                    {it.use?.buff?.type === 'statBonus' ? ` · +${it.use.buff.power} ${it.use.buff.stat}` : ''}
                  </div>
                </button>
              ))
              : <div className="text-[11px] text-stone-500 col-span-2 px-2 py-1">{t('battle.noItems')}</div>)}
            <button onClick={() => setTab('main')} className="text-[10px] text-stone-500 hover:text-stone-300 col-span-full text-right px-1">
              ← {t('ui.back')}
            </button>
          </div>
        </div>
      )}

      {/* main command row */}
      {tab === 'main' && (
        <div className={`grid gap-1.5 grid-cols-3 ${MAIN.length >= 7 ? 'sm:grid-cols-7' : 'sm:grid-cols-6'}`}>
          {MAIN.map(cmd => {
            const dim = disabled || (cmd.id === 'item' && meds.length === 0);
            return (
              <button key={cmd.id} disabled={dim}
                onClick={() => {
                  if (cmd.id === 'gu' || cmd.id === 'killer' || cmd.id === 'item') { sfx('open'); setTab(cmd.id); }
                  else if (cmd.id === 'defend') { sfx('ui'); onDefend(); }
                  else if (cmd.id === 'strike') { sfx('ui'); onStrike(); }
                  else if (cmd.id === 'observe') { sfx('sense'); onObserve(); }
                  else { sfx('cancel'); onFlee(); }
                }}
                title={cmd.id === 'strike' ? t('battle.strikeHint') : undefined}
                className={`rounded-lg border px-1 py-2.5 text-white text-[11px] sm:text-xs font-heading tracking-wide transition active:scale-95 ${cmd.tone} ${dim ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <div className="text-base leading-none">{cmd.icon}</div>
                <div className="mt-1 truncate">{cmd.label}</div>
                {cmd.id === 'strike' && (
                  <div className="text-[8px] leading-tight text-amber-200/70">⚔️ {sr.min}–{sr.max} · ⚡0 · 🎯{sr.accuracy}%</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}