import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { CULTIVATION_STAGES, BREAKTHROUGH_REQS } from '@/game/data/cultivation';
import { BALANCE, recoveryBreakdown } from '@/game/config/balance';
import { breakthroughChecklist } from '@/game/state/gameReducer';
import { TERRACE } from '@/game/data/world';
import { tierOf, scoreOf, constitutionName } from '@/game/config/aptitude';
import EssenceSphere from './EssenceSphere';
import { totalGameMin, fmtRemaining } from '@/game/engine/vitalGu';

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

// The Cultivation menu. Essence lives in the aperture — a translucent spherical
// vessel whose liquid level IS the player's essence; it rises and falls
// smoothly, breathes during recovery and glows when a breakthrough is ready.
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
  const cost = cfg.essenceCostBase + cfg.essenceCostPerStage * g;
  const atSect = p.x === TERRACE[0] && p.y === TERRACE[1];
  const checklist = peak ? null : breakthroughChecklist(state);
  const ready = checklist?.ok;
  const breakthroughReady = !peak && p.cultivationProgress >= 100;
  const bd = recoveryBreakdown(p, state.recovery?.mode || 'normal', totalGameMin(state.time));
  const missingEss = p.maxPrimevalEssence - p.primevalEssence;
  const recSecs = missingEss > 0 ? missingEss / bd.total : 0;
  const estFull = missingEss <= 0 ? 'Full'
    : recSecs >= 60 ? `${Math.floor(recSecs / 60)}m ${Math.round(recSecs % 60)}s` : `${Math.round(recSecs)}s`;

  return (
    <div className="pt-3 space-y-4 animate-fade-in">
      <div className="rounded-xl border border-emerald-900/40 bg-gradient-to-br from-emerald-900/20 to-transparent p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-900 flex items-center justify-center text-3xl shadow-inner">🧑‍🌾</div>
        <div>
          <h2 className="text-xl font-semibold text-emerald-100">{p.name}</h2>
          <div className="text-xs text-stone-400">{t('ui.years', { n: p.age })} · {p.gender}</div>
          <div className="text-sm text-emerald-200 font-medium mt-0.5">RANK {p.rank + 1} · {stage.name.split('·').pop().trim().toUpperCase()}</div>
          <div className="text-[11px] text-amber-200/80">
            {t('ui.aptitude')}: {t(`apt.tier.${aptTier.id}`)} ({scoreOf(p.aptitude).toFixed(1)}/10)
          </div>
          {conName && <div className="text-[11px] text-sky-200/80">{t('ui.constitution')}: {conName}</div>}
        </div>
      </div>

      <div className="grid md:grid-cols-[auto_1fr] gap-4 items-start">
        {/* ---- the aperture: a living vessel of essence ---- */}
        <div className="rounded-xl border border-sky-800/40 bg-gradient-to-b from-sky-900/15 to-transparent p-4 flex flex-col items-center gap-2 mx-auto">
          <div className="text-[10px] uppercase tracking-[0.25em] text-sky-300/80">Cultivation Aperture</div>
          <EssenceSphere
            value={p.primevalEssence}
            max={p.maxPrimevalEssence}
            size={150}
            glow={breakthroughReady}
            breathing={!!state.recovery}
          />
          <div className="text-xs text-sky-100">{Math.floor(p.primevalEssence)} / {p.maxPrimevalEssence} {t('ui.essence')}</div>
          <div className="text-[11px] text-stone-400">
            {t('sp.recovery')}: <span className="text-sky-300">+{bd.total.toFixed(2)}/s</span>
          </div>
          <div className="text-[11px] text-stone-400">
            Est. full recovery: <span className="text-sky-300">{estFull}</span>
          </div>
          {missingEss > 0 && (
            <div className="w-full text-[10px] text-stone-500 space-y-0.5 rounded-lg bg-black/30 px-2.5 py-1.5">
              <div className="flex justify-between"><span>Base Recovery</span><span>+{bd.base.toFixed(2)}/s</span></div>
              <div className="flex justify-between"><span>Aptitude Bonus</span><span className={bd.aptBonus >= 0 ? 'text-emerald-400/90' : 'text-rose-300/80'}>+{bd.aptBonus.toFixed(2)}/s</span></div>
              {bd.instability ? (
                <div className="text-rose-300/80">
                  <div className="flex justify-between"><span>Aperture Unstable</span><span>−{bd.instability.recoveryPct}%</span></div>
                  <div className="flex justify-between"><span>Cause: {t(`vit.cause.${bd.instability.cause}`)}</span><span>{fmtRemaining(bd.instabilityRemaining)}</span></div>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-400/80"><span>Vital Gu</span><span>Stable</span></div>
              )}
              {bd.accelMul > 1 && <div className="flex justify-between text-sky-300/80"><span>Accelerated</span><span>×{bd.accelMul}</span></div>}
              <div className="flex justify-between border-t border-white/5 pt-0.5 text-sky-300/90"><span>Total</span><span>+{bd.total.toFixed(2)}/s</span></div>
            </div>
          )}
          <div className="text-[11px] text-stone-400">{t('ui.stones')}: <span className="text-amber-300">💎 {p.spiritStones}</span></div>
          {bd.instability && (
            <div className="text-[10px] text-rose-300/80 text-center">
              <div>Aperture Unstable — Cause: {t(`vit.cause.${bd.instability.cause}`)}</div>
              <div>Remaining: {fmtRemaining(bd.instabilityRemaining)} · Effect: Essence Recovery −{bd.instability.recoveryPct}%</div>
            </div>
          )}
        </div>

        {/* ---- progress + actions ---- */}
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
              aria-disabled={state.recovery || state.combat}
              className={`py-2.5 rounded-lg text-white text-sm font-medium transition ${(state.recovery || state.combat || p.primevalEssence < cost) ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
              {state.recovery ? '🧘 Cultivate — paused while recovering' : <>🧘 {t('ui.cultivate')} ({cost} {t('ui.essence')}{atSect ? ' · sect ×1.5' : ''})</>}
            </button>
            <button onClick={onRecover} disabled={state.combat}
              className={`py-2.5 rounded-lg text-sm font-medium transition border border-sky-700/50 bg-sky-900/20 text-sky-200 hover:bg-sky-800/30 ${state.combat ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {state.recovery ? `💧 ${t('ui.viewRecovery')}` : `💧 ${t('ui.recoverEssence')}`}
            </button>
          </div>

          {state.recovery && (
            <div className="text-[10px] text-sky-300/90 mb-3 animate-fade-in">
              💧 Recovering essence — cultivation is paused until you stop recovering.
            </div>
          )}

          {breakthroughReady && (
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