import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { QUEST_BY_ID } from '@/game/data/quests';
import { objectiveMet } from '@/game/state/gameReducer';
import { MASTER_BY_ID, MASTER_STAGES, masterStageOf, reqChecks, syncMasterSteps } from '@/game/data/masters';
import { GU_BY_ID } from '@/game/data/gu';
import { PATH_BY_ID } from '@/game/data/paths';
import PortraitFrame from './PortraitFrame';
import { npcAppearance } from '@/game/gfx/characterSprites';
import { sfx } from '@/game/audio/sfx';

// Mentor dialogue for hidden masters: relationship progression, requirement
// checklists, master quests, trial duels and teachings (Paths, Gu, recipes,
// Killer Moves). Masters are never plain shops.
export default function MentorPanel({ npc, onShop, onClose }) {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const m = MASTER_BY_ID[npc.id];
  if (!m) return null;
  const ms = (state.masters || {})[m.id];
  if (!ms?.found) return null;

  const synced = syncMasterSteps(state);
  const cur = (synced !== state ? synced : state).masters[m.id];
  const stepIdx = cur.step;
  const allDone = stepIdx >= m.steps.length;
  const step = allDone ? null : m.steps[stepIdx];
  const stageIdx = masterStageOf(m, cur);
  const stage = MASTER_STAGES[stageIdx];
  const checks = step?.kind === 'req' ? reqChecks(synced, step.req) : null;

  // available only during the master's hours (e.g. Old Drunken Fang at night)
  const h = m.hours;
  const mm = ((state.time?.min % 1440) + 1440) % 1440;
  const available = !h || (h.open <= h.close ? mm >= h.open && mm < h.close : mm >= h.open || mm < h.close);

  const grantLine = (g) => {
    if (!g) return null;
    if (g.unlockPath) return `⚔️ ${PATH_BY_ID[g.unlockPath]?.name} unlocked`;
    if (g.giveGu) return `🐉 ${GU_BY_ID[g.giveGu]?.name}`;
    return null;
  };
  const teach = step && grantLine(step.grants);

  const q = step?.kind === 'quest' ? QUEST_BY_ID[step.questId] : null;
  const qActive = q && state.quests.active.includes(q.id);
  const qDone = q && state.quests.completed.includes(q.id);
  const qMet = q && qActive && objectiveMet(synced, q);

  return (
    <div className="space-y-3">
      {/* header: portrait, name, role, relationship stage */}
      <div className="flex items-center gap-3">
        <PortraitFrame appearance={npcAppearance(npc.id)} size={52} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-cyan-100">{m.name}</div>
          <div className="text-[10px] text-stone-400">{t(`role.${m.role}`)} · {t('master.relationship')}: <span className="text-cyan-300">{t(stage.key)}</span></div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {npc.shop && <button onClick={() => { sfx('open'); onShop(npc.id); onClose(); }} className="text-[11px] px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-stone-200">🛒 {t('master.trade')}</button>}
          <button onClick={onClose} className="text-[11px] text-stone-400 hover:text-stone-200 px-2">{t('ui.close')}</button>
        </div>
      </div>

      {/* step progress dots */}
      <div className="flex items-center gap-1.5">
        {m.steps.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < stepIdx ? 'bg-cyan-500' : i === stepIdx ? 'bg-cyan-900 border border-cyan-600/50' : 'bg-stone-800'}`} />
        ))}
      </div>

      {/* flavor */}
      <p className="text-[11px] text-stone-400 italic px-1">"{stepIdx === 0 ? m.greeting : allDone ? t('master.doneFlavor') : step.text}"</p>

      {!available && (
        <div className="rounded-lg bg-white/5 px-3 py-2 text-[11px] text-stone-500">{t('master.away')}</div>
      )}

      {allDone ? (
        <div className="rounded-xl border border-cyan-800/50 bg-cyan-900/10 p-3">
          <div className="text-sm font-semibold text-cyan-100">{t('master.completed')}</div>
          <p className="text-[11px] text-stone-400 mt-1">{t('master.completedNote')}</p>
        </div>
      ) : !available ? null : step.kind === 'req' ? (
        <div className="rounded-xl border border-stone-800 bg-black/20 p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-stone-500">{t('master.requirements')}</div>
          {checks.checks.map((c, i) => (
            <div key={i} className={`text-[11px] flex items-center gap-2 ${c.met ? 'text-emerald-300' : 'text-stone-500'}`}>
              <span>{c.met ? '✓' : '✗'}</span><span>{c.text}</span>
            </div>
          ))}
          {teach && <div className="text-[10px] text-amber-300/90">{t('master.teaches')}: {teach}</div>}
          <button disabled={!checks.ok} onClick={() => { sfx('confirm'); dispatch({ type: 'MASTER_CLAIM', masterId: m.id }); }}
            className={`w-full py-2 rounded-lg text-xs ${checks.ok ? 'bg-cyan-700 hover:bg-cyan-600 text-white' : 'bg-stone-800 text-stone-500'}`}>
            {t('master.claim')}
          </button>
        </div>
      ) : step.kind === 'quest' && q ? (
        <div className="rounded-xl border border-stone-800 bg-black/20 p-3 space-y-2">
          <div>
            <div className="text-sm font-semibold text-emerald-100">📜 {q.name}</div>
            <p className="text-[11px] text-stone-400 mt-1">{q.description}</p>
          </div>
          {teach && <div className="text-[10px] text-amber-300/90">{t('master.teaches')}: {teach}</div>}
          {qDone ? <div className="text-[11px] text-emerald-300">✓ {t('master.stepDone')}</div>
            : !qActive ? <button onClick={() => { sfx('confirm'); dispatch({ type: 'ACCEPT_QUEST', questId: q.id }); }}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs">{t('master.acceptTask')}</button>
            : qMet ? <button onClick={() => { sfx('confirm'); dispatch({ type: 'TURN_IN_QUEST', questId: q.id }); }}
                className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs">{t('master.turnIn')}</button>
            : <div className="text-[10px] text-stone-500">{t('master.inProgress')}</div>}
        </div>
      ) : step.kind === 'duel' ? (
        <div className="rounded-xl border border-rose-900/50 bg-rose-900/10 p-3 space-y-2">
          <div className="text-[11px] text-rose-100">
            {step.trial.type === 'survive'
              ? t('master.trialSurvive', { n: step.trial.turns, name: step.trial.def.name })
              : t('master.trialDamage', { n: step.trial.amount, t: step.trial.turns, name: step.trial.def.name })}
          </div>
          {teach && <div className="text-[10px] text-amber-300/90">{t('master.teaches')}: {teach}</div>}
          <button disabled={!!state.combat} onClick={() => { sfx('encounter'); dispatch({ type: 'MASTER_DUEL', masterId: m.id }); onClose(); }}
            className={`w-full py-2 rounded-lg text-xs ${state.combat ? 'bg-stone-800 text-stone-500' : 'bg-rose-700 hover:bg-rose-600 text-white'}`}>
            ⚔️ {t('master.duel')}
          </button>
        </div>
      ) : null}
    </div>
  );
}