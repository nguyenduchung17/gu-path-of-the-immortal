import React, { useState } from 'react';
import { useT } from '@/game/i18n/LangContext';
import { sfx } from '@/game/audio/sfx';
import {
  APTITUDE, tierOf, rollAptitudeScore, rollConstitution,
  recoveryMulOf, cultivateMulOf, constitutionName, scoreOf,
} from '@/game/config/aptitude';
import AptitudeTest from './AptitudeTest';

// Aptitude step of character creation: the player chooses an RNG roll or the
// vessel minigame, sees the tiered result, accepts it, and only then learns
// whether a Special Constitution awakens.
export default function AptitudeStep({ difficulty, onAccept, locked }) {
  const { t, lang } = useT();
  // `locked` carries an already-accepted aptitude when the player steps back —
  // it is final and cannot be re-rolled.
  const [method, setMethod] = useState(locked ? 'locked' : null);
  const [testing, setTesting] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [score, setScore] = useState(locked ? locked.score : null);
  const [rollsUsed, setRollsUsed] = useState(0);
  const [constitution, setConstitution] = useState(locked ? locked.constitution : undefined); // undefined = not rolled yet
  const [examining, setExamining] = useState(false);

  const rerolls = APTITUDE.rerolls[difficulty] ?? 2;
  const rollsLeft = Math.max(0, rerolls - rollsUsed);
  const accepted = constitution !== undefined;
  const tier = score != null ? tierOf(score) : null;
  const conName = accepted ? constitutionName({ score, constitution }, lang) : null;

  const doRoll = () => {
    setRolling(true);
    sfx('cast');
    setTimeout(() => {
      const s = rollAptitudeScore();
      setScore(s);
      setRolling(false);
      sfx('chime');
    }, 900);
  };

  const onTestDone = (perf) => {
    const base = rollAptitudeScore();
    const s = Math.min(APTITUDE.scoreMax, Math.round((base + (perf / 100) * APTITUDE.minigameBonus) * 10) / 10);
    setTesting(false);
    setRolling(true);
    setTimeout(() => { setScore(s); setRolling(false); sfx('chime'); }, 700);
  };

  const accept = () => {
    if (score == null || accepted) return;
    setExamining(true);
    sfx('killer');
    setTimeout(() => {
      setConstitution(rollConstitution());
      setExamining(false);
      sfx('confirm');
    }, 1400);
  };

  // ---- method choice ----
  if (!method) {
    return (
      <div className="animate-fade-in">
        <div className="text-xs uppercase tracking-widest text-emerald-300/80 mb-1">{t('apt.title')}</div>
        <p className="text-[11px] text-stone-400 mb-4">{t('apt.desc')}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={() => { setMethod('roll'); sfx('ui'); }}
            className="text-left rounded-xl border border-emerald-800/50 bg-black/30 hover:bg-black/50 p-4 transition">
            <div className="text-sm font-semibold text-emerald-100">🎲 {t('apt.methodRoll')}</div>
            <div className="text-[11px] text-stone-400 mt-1">{t('apt.methodRollDesc')}</div>
          </button>
          <button onClick={() => { setMethod('test'); sfx('ui'); }}
            className="text-left rounded-xl border border-sky-800/50 bg-black/30 hover:bg-black/50 p-4 transition">
            <div className="text-sm font-semibold text-sky-100">🫧 {t('apt.methodTest')}</div>
            <div className="text-[11px] text-stone-400 mt-1">{t('apt.methodTestDesc')}</div>
          </button>
        </div>
      </div>
    );
  }

  // ---- vessel minigame ----
  if (testing) {
    return <AptitudeTest onDone={onTestDone} onCancel={() => setTesting(false)} />;
  }

  // ---- result panel ----
  return (
    <div className="animate-fade-in">
      <div className="text-xs uppercase tracking-widest text-emerald-300/80 mb-1">{t('apt.title')}</div>
      <p className="text-[11px] text-stone-400 mb-4">{t('apt.desc')}</p>

      {!accepted && (
        <div className="flex flex-wrap gap-2 mb-4">
          {method === 'roll' && score == null && (
            <button onClick={doRoll} disabled={rolling}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50">
              🎲 {t('apt.rollBtn')}
            </button>
          )}
          {method === 'roll' && score != null && rollsLeft > 0 && (
            <button onClick={() => { setRollsUsed(n => n + 1); doRoll(); }} disabled={rolling}
              className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 text-sm disabled:opacity-50">
              🎲 {t('apt.rerollBtn', { n: rollsLeft })}
            </button>
          )}
          {method === 'test' && score == null && (
            <button onClick={() => { setTesting(true); sfx('open'); }}
              className="px-5 py-2.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white text-sm font-medium">
              🫧 {t('aptGame.start')}
            </button>
          )}
        </div>
      )}

      {rolling && <div className="text-center py-8 text-2xl animate-pulse font-heading text-emerald-300">✦ ✦ ✦</div>}

      {score != null && !rolling && (
        <div className={`rounded-xl border p-4 animate-burst ${accepted ? 'border-amber-600/50 bg-amber-950/20' : 'border-emerald-800/50 bg-black/30'}`}>
          <div className="text-center mb-3">
            <div className="text-[10px] uppercase tracking-widest text-stone-500">{t('apt.result')}</div>
            <div className="text-2xl font-heading text-emerald-200 mt-1">{score.toFixed(1)} / 10</div>
            <div className={`text-lg font-heading tracking-wider mt-1 ${
              tier.id === 'perfect' ? 'text-amber-300' : tier.id === 'a' ? 'text-emerald-300' : tier.id === 'b' ? 'text-sky-300' : 'text-stone-300'
            }`}>
              {t(`apt.tier.${tier.id}`)}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-stone-400 mb-3">
            <div className="rounded-lg bg-white/5 py-2">
              <div className="text-stone-500">{t('apt.essenceCap')}</div>
              <div className="text-emerald-200 text-xs font-semibold mt-0.5">×{tier.essenceMul}</div>
            </div>
            <div className="rounded-lg bg-white/5 py-2">
              <div className="text-stone-500">{t('apt.recovery')}</div>
              <div className="text-sky-200 text-xs font-semibold mt-0.5">×{recoveryMulOf({ score }).toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-white/5 py-2">
              <div className="text-stone-500">{t('apt.efficiency')}</div>
              <div className="text-amber-200 text-xs font-semibold mt-0.5">×{cultivateMulOf({ score }).toFixed(2)}</div>
            </div>
          </div>

          {!accepted ? (
            <button onClick={accept}
              className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium">
              ✦ {t('apt.accept')}
            </button>
          ) : examining ? (
            <div className="text-center text-sm text-stone-300 animate-pulse py-2">{t('apt.examining')}</div>
          ) : (
            <div className="text-center border-t border-white/10 pt-3">
              {constitution ? (
                <div className="animate-burst">
                  <div className="text-[10px] uppercase tracking-widest text-amber-300">{t('ui.constitution')}</div>
                  <div className="text-base font-heading text-amber-200 mt-1">✧ {conName} ✧</div>
                  <div className="text-[11px] text-emerald-300 mt-1">{t('apt.constitutionFound')}</div>
                </div>
              ) : (
                <div className="text-[11px] text-stone-400">{t('ui.constitution')}: {t('apt.noConstitution')}</div>
              )}
              <button onClick={() => onAccept({ score: scoreOf({ score }), constitution })}
                className="mt-3 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">
                {t('ui.next')} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}