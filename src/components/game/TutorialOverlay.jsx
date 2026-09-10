import React, { useState, useEffect } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { TUTORIAL_STEPS } from '@/game/data/tutorial';

// Staged tutorial UI — the welcome choice, compact non-blocking lesson
// cards, one-time contextual tips and the completion card. Every visible
// string is localized (tut.*/tip.* keys); progression lives in the save.
export default function TutorialOverlay() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const [confirmSkip, setConfirmSkip] = useState(false);
  // The welcome card is keyboard-dismissable — Enter starts the guided path, so
  // keyboard-only players are never trapped behind it.
  useEffect(() => {
    if (!state.tutorial?.welcome) return;
    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); dispatch({ type: 'TUTORIAL_START' }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.tutorial?.welcome]);
  const tut = state.tutorial;
  if (!tut) return null;

  // ---- welcome screen (fresh character) ----
  if (tut.welcome) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-3">
        <div className="max-w-sm w-full rounded-xl border border-emerald-800/60 bg-[#141c16] p-5 shadow-2xl animate-pop">
          <div className="text-center mb-4">
            <div className="text-2xl mb-1">🐉</div>
            <h2 className="text-lg font-heading text-emerald-100">{t('tut.welcome.title')}</h2>
            <p className="text-xs text-stone-400 mt-1">{t('tut.welcome.subtitle')}</p>
          </div>
          {confirmSkip ? (
            <div className="space-y-3">
              <p className="text-xs text-stone-300 leading-relaxed">{t('tut.welcome.skipConfirm')}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmSkip(false)} className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 text-xs">{t('tut.welcome.cancel')}</button>
                <button onClick={() => dispatch({ type: 'TUTORIAL_SKIP' })} className="flex-1 py-2 rounded-lg bg-rose-800/80 hover:bg-rose-700 text-rose-100 text-xs font-medium">{t('tut.welcome.skipBtn')}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button onClick={() => dispatch({ type: 'TUTORIAL_START' })} className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition">{t('tut.welcome.start')}</button>
              <button onClick={() => setConfirmSkip(true)} className="w-full py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-stone-300 text-xs">{t('tut.welcome.skip')}</button>
              <p className="text-[10px] text-stone-500 text-center">{t('tut.welcome.skipNote')}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- one-time contextual tip (takes precedence over the lesson card) ----
  if (tut.currentTip) {
    return (
      <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 w-full max-w-[20rem] px-2">
        <div className="rounded-xl border border-amber-700/60 bg-[#1a1610] p-3.5 shadow-2xl animate-pop">
          <div className="text-xs font-heading tracking-wider text-amber-300 mb-1.5">💡 {t(`tip.${tut.currentTip}.title`)}</div>
          <p className="text-[11px] text-stone-300 leading-relaxed">{t(`tip.${tut.currentTip}.body`)}</p>
          <button onClick={() => dispatch({ type: 'TUTORIAL_TIP_SEEN', id: tut.currentTip })} className="mt-2.5 w-full py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-medium">{t('tut.gotIt')}</button>
        </div>
      </div>
    );
  }

  if (!tut.active || tut.completed) return null;
  const step = TUTORIAL_STEPS[tut.step];
  if (!step) return null;

  // full-screen flows pause the lessons; combat shows only its own slim banner
  if (state.combat) {
    if (step.id !== 'combat') return null;
    return (
      <div className="fixed top-16 left-1/2 z-40 -translate-x-1/2 px-2 pointer-events-none">
        <div className="rounded-full border border-emerald-700/60 bg-[#101812]/95 px-4 py-1.5 text-[11px] text-emerald-200 shadow-lg">
          {t('tut.combat.banner')}
        </div>
      </div>
    );
  }
  const busy = !!(state.pendingEvent || state.dialogue || state.sleeping || state.deceased || state.breakthrough || state.wildEncounter);
  if (busy) return null;

  // ---- completion card ----
  if (step.id === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3">
        <div className="max-w-sm w-full rounded-xl border border-emerald-700/60 bg-[#141c16] p-5 text-center shadow-2xl animate-pop">
          <div className="text-3xl mb-1">🎉</div>
          <h2 className="font-heading text-emerald-200 tracking-wide">{t('tut.done.title')}</h2>
          <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">{t('tut.done.body')}</p>
          <div className="rounded-lg bg-white/5 p-2.5 mt-3 text-[11px] text-amber-200">{t('tut.done.rewards')}</div>
          <button onClick={() => dispatch({ type: 'TUTORIAL_COMPLETE' })} className="mt-3.5 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">{t('tut.done.finish')}</button>
        </div>
      </div>
    );
  }

  // ---- lesson card ----
  const hasObjective = !!(step.check || step.panel);
  const lines = Array.from({ length: step.lines || 0 }, (_, i) => t(`tut.${step.id}.l${i + 1}`));
  const deathLine = step.id === 'death'
    ? t(state.difficulty === 'easy' ? 'tut.death.easy' : state.difficulty === 'trueCultivation' ? 'tut.death.true' : 'tut.death.mid')
    : null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-2">
      <div className="rounded-xl border border-emerald-800/60 bg-[#101812]/95 p-3.5 shadow-2xl animate-pop">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-heading tracking-widest text-emerald-400/80">{t('tut.step.of', { n: tut.step + 1, total: TUTORIAL_STEPS.length - 1 })}</span>
          <span className="text-[10px] text-stone-500">🐉 {t('tut.lesson')}</span>
        </div>
        <h3 className="text-sm font-heading text-emerald-200 mb-1.5">{t(`tut.${step.id}.title`)}</h3>
        <div className="space-y-1">
          {lines.map((l, i) => <p key={i} className="text-[11px] text-stone-300 leading-relaxed">{l}</p>)}
          {deathLine && <p className="text-[11px] text-rose-300/90 leading-relaxed">{deathLine}</p>}
          {hasObjective && <p className="text-[11px] text-amber-300/90 pt-1">🎯 {t(`tut.${step.id}.obj`)}</p>}
        </div>
        <button onClick={() => dispatch({ type: 'TUTORIAL_STEP' })} className="mt-2.5 w-full py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium">
          {hasObjective ? t('tut.skipLesson') : t('tut.gotIt')}
        </button>
      </div>
    </div>
  );
}