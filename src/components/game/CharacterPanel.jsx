import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { CULTIVATION_STAGES, BREAKTHROUGH_REQS } from '@/game/data/cultivation';
import { BALANCE } from '@/game/config/balance';
import { breakthroughChecklist } from '@/game/state/gameReducer';
import { TERRACE } from '@/game/data/world';
import { tierOf, scoreOf, constitutionName } from '@/game/config/aptitude';

function Stat({ label, value }) {
  return (
    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-white/5">
      <span className="text-xs text-stone-400">{label}</span>
      <span className="text-sm font-semibold text-emerald-100">{value}</span>
    </div>
  );
}

function ReqLine({ met, text }) {
  return (
    <div className={`text-[11px] flex items-center gap-1.5 ${met ? 'text-emerald-300' : 'text-rose-300'}`}>
      <span>{met ? '✓' : '✗'}</span><span className={met ? '' : 'text-stone-400'}>{text}</span>
    </div>
  );
}

export default function CharacterPanel({ onRecover }) {
  const { state, dispatch } = useGame();
  const { t, lang } = useT();
  const p = state.player;
  const aptTier = tierOf(p.aptitude);
  const conName = constitutionName(p.aptitude, lang);
  const g = p.rank * 4 + (p.stage || 0);
  const stage = CULTIVATION_STAGES[g];
  const peak = g >= 19;
  const req = peak ? null : BREAKTHROUGH_REQS[g];
  const cfg = BALANCE.cultivation;
  const cost = cfg.essenceCostBase + cfg.essenceCostPerRank * p.rank;
  const atSect = p.x === TERRACE[0] && p.y === TERRACE[1];
  const checklist = peak ? null : breakthroughChecklist(state);
  const ready = checklist?.ok;

  return (
    <div className="pt-3 space-y-4 animate-fade-in">
      <div className="rounded-xl border border-emerald-900/40 bg-gradient-to-br from-emerald-900/20 to-transparent p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-900 flex items-center justify-center text-3xl shadow-inner">🧑‍🌾</div>
        <div>
          <h2 className="text-xl font-semibold text-emerald-100">{p.name}</h2>
          <div className="text-xs text-stone-400">{t('ui.years', { n: p.age })} · {p.gender}</div>
          <div className="text-sm text-emerald-200 font-medium mt-0.5">{stage.name}</div>
          <div className="text-[11px] text-amber-200/80">
            {t('ui.aptitude')}: {t(`apt.tier.${aptTier.id}`)} ({scoreOf(p.aptitude).toFixed(1)}/10)
          </div>
          {conName && <div className="text-[11px] text-sky-200/80">{t('ui.constitution')}: {conName}</div>}
        </div>
      </div>

      <div className="rounded-xl border border-stone-800 bg-black/20 p-4">
        <h3 className="text-sm font-semibold text-stone-300 mb-2">{t('ui.cultivationProgress')}</h3>
        <div className="flex justify-between text-xs text-stone-400 mb-1">
          <span>{peak ? 'Peak of known cultivation' : `Toward ${req.target.name}`}</span>
          <span>{Math.floor(p.cultivationProgress)}%</span>
        </div>
        <div className="h-3 rounded-full bg-black/40 overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500" style={{ width: `${p.cultivationProgress}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => dispatch({ type: 'CULTIVATE' })} disabled={state.recovery || state.combat}
            className={`py-2.5 rounded-lg text-white text-sm font-medium transition ${(state.recovery || state.combat || p.primevalEssence < cost) ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
            🧘 {t('ui.cultivate')} ({cost} {t('ui.essence')}{atSect ? ' · sect ×1.5' : ''})
          </button>
          <button onClick={onRecover} disabled={state.combat}
            className={`py-2.5 rounded-lg text-sm font-medium transition border border-sky-700/50 bg-sky-900/20 text-sky-200 hover:bg-sky-800/30 ${state.combat ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {state.recovery ? `💧 ${t('ui.viewRecovery')}` : `💧 ${t('ui.recoverEssence')}`}
          </button>
        </div>

        {!peak && p.cultivationProgress >= 100 && (
          <div className="rounded-lg border border-amber-800/40 bg-amber-900/10 p-3">
            <div className="text-xs font-semibold text-amber-200 mb-1.5">
              {req.major ? '⚡ Major Breakthrough available' : 'Breakthrough available'} — to {req.target.name}
            </div>
            <div className="space-y-0.5 mb-2">
              {checklist.checks.map(c => <ReqLine key={c.key} met={c.met} text={c.text} />)}
            </div>
            <button onClick={() => dispatch({ type: 'BREAKTHROUGH' })} disabled={!ready}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${ready ? 'bg-amber-500 hover:bg-amber-400 text-black animate-pulse' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
              ✦ Break Through
            </button>
          </div>
        )}
        <p className="text-[10px] text-stone-500 mt-2">
          Cultivate at the ✦ terrace in town for ×1.5 progress. Essence never regenerates on its own — recover it deliberately, at inns or campsites when far afield.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Stat label={t('ui.health')} value={`${Math.floor(p.hp)}/${p.maxHp}`} />
        <Stat label={t('ui.essence')} value={`${Math.floor(p.primevalEssence)}/${p.maxPrimevalEssence}`} />
        <Stat label={t('ui.stones')} value={`💎 ${p.spiritStones}`} />
        <Stat label={t('ui.totalInsight')} value={`✦ ${(p.totalInsight || 0).toLocaleString()}`} />
        <Stat label={t('ui.willpower')} value={p.willpower} />
        <Stat label={t('ui.strength')} value={p.strength} />
        <Stat label={t('ui.agility')} value={p.agility} />
        <Stat label={t('ui.perception')} value={p.perception} />
        <Stat label={t('ui.intelligence')} value={p.intelligence} />
        <Stat label={t('ui.luck')} value={p.luck} />
      </div>

      <div className="rounded-xl border border-stone-800 bg-black/20 p-4">
        <h3 className="text-sm font-semibold text-stone-300 mb-2">{t('ui.reputation')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(state.reputation).map(([f, v]) => (
            <div key={f} className="flex justify-between text-xs px-3 py-1.5 rounded-lg bg-white/5">
              <span className="capitalize text-stone-400">{f}</span>
              <span className={v > 0 ? 'text-emerald-300' : v < 0 ? 'text-rose-300' : 'text-stone-300'}>{v > 0 ? '+' : ''}{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}