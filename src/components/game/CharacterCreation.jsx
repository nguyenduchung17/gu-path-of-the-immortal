import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import LangSwitch from '@/game/i18n/LangSwitch';
import { DEFAULT_APPEARANCE, PRESETS } from '@/game/data/appearance';
import { tierOf } from '@/game/config/aptitude';
import { starterGuOf } from '@/game/data/starterGu';
import AppearanceEditor from './AppearanceEditor';
import SpritePreview from './SpritePreview';
import PortraitFrame from './PortraitFrame';
import AptitudeStep from './creation/AptitudeStep';
import StarterGuStep from './creation/StarterGuStep';

const MODE_KEYS = ['easy', 'standard', 'hard', 'trueCultivation'];
// Each mode's death rules are spelled out before the character exists —
// difficulty belongs to the save slot and cannot be changed afterwards.
const MODE_TONE = { easy: 'text-emerald-200', standard: 'text-sky-200', hard: 'text-orange-200', trueCultivation: 'text-rose-200' };

export default function CharacterCreation() {
  const { createSlot, finishCreate, cancelCreate } = useGame();
  const { t } = useT();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState(16);
  const [mode, setMode] = useState('standard');
  const [understood, setUnderstood] = useState(false);
  const [appearance, setAppearance] = useState({ ...DEFAULT_APPEARANCE });
  const [aptitude, setAptitude] = useState(null);   // { score, constitution }
  const [starterGu, setStarterGu] = useState(null); // guId
  const isTrue = mode === 'trueCultivation';
  const ready = !isTrue || understood;
  const tier = aptitude ? tierOf(aptitude) : null;
  const starter = starterGu ? starterGuOf(starterGu) : null;
  const presetLabel = PRESETS.find((p) => p.id === appearance.preset)?.label;
  const canBegin = ready && aptitude && starterGu;

  const steps = [1, 2, 3, 4].map((n) => ({ n, label: t(`creation.step${n}`) }));

  const begin = () => {
    if (!canBegin) return;
    finishCreate(name.trim() || t('creation.nameless'), gender, age, mode, appearance, aptitude, starterGu);
  };

  return (
    <div className="min-h-screen bg-[#0d1410] text-stone-100 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-4xl w-full py-4">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">🐉</div>
          <h1 className="text-xl font-heading font-semibold text-emerald-200 tracking-wide">
            {t('creation.title', { n: createSlot })}
          </h1>
          <p className="text-xs text-stone-400 mt-1.5">{t('creation.subtitle')}</p>
          <div className="mt-2 flex justify-center"><LangSwitch /></div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-4">
          {/* left: live preview + life summary */}
          <div className="rounded-2xl border border-emerald-900/40 bg-black/30 p-4 flex flex-col items-center gap-3 lg:sticky lg:top-4">
            <div className="text-[10px] uppercase tracking-widest text-stone-500">{t('creation.livePreview')}</div>
            <div className="rounded-xl bg-gradient-to-b from-emerald-950/80 to-black/50 border border-emerald-900/30 px-6 py-4">
              <SpritePreview appearance={appearance} scale={6} />
            </div>
            <div className="flex items-center gap-2">
              <PortraitFrame appearance={appearance} size={56} />
              <div className="text-left">
                <div className="text-xs font-semibold text-emerald-100">{name.trim() || t('creation.nameless')}</div>
                <div className="text-[10px] text-stone-500 italic">{presetLabel || t('creation.custom')}</div>
              </div>
            </div>
            {/* life summary builds up as steps complete */}
            <div className="w-full space-y-1 text-[10px] text-stone-400 border-t border-white/10 pt-2">
              {mode && <div>⚔️ {t(`diff.${mode === 'trueCultivation' ? 'true' : mode}.title`)}</div>}
              {tier && <div>✦ {t('ui.aptitude')}: {t(`apt.tier.${tier.id}`)} ({aptitude.score.toFixed(1)}/10)</div>}
              {starter && <div>🐉 {starter.name}</div>}
            </div>
          </div>

          {/* right: stepped flow */}
          <div className="space-y-4">
            {/* step indicator */}
            <div className="flex items-center justify-between px-1">
              <div className="text-[10px] uppercase tracking-widest text-stone-500">{t('creation.stepOf', { n: step })}</div>
              <div className="flex gap-1.5">
                {steps.map(s => (
                  <button key={s.n} onClick={() => { if (s.n < step) setStep(s.n); }}
                    className={`px-2 py-1 rounded-lg text-[9px] border transition ${
                      s.n === step ? 'bg-emerald-600/80 border-emerald-400/60 text-white'
                        : s.n < step ? 'bg-emerald-900/30 border-emerald-800/50 text-emerald-300'
                        : 'bg-black/30 border-stone-800 text-stone-500'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ---- step 1: identity + appearance ---- */}
            {step === 1 && (
              <div className="rounded-2xl border border-emerald-900/40 bg-black/30 p-4 animate-fade-in">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-xs text-stone-400 block mb-1">{t('creation.name')}</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder={t('creation.nameless')}
                      className="w-full px-2.5 py-2 rounded-lg bg-black/40 border border-stone-700 text-sm focus:border-emerald-600 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 block mb-1">{t('creation.gender')}</label>
                    <select value={gender} onChange={e => setGender(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg bg-black/40 border border-stone-700 text-sm focus:border-emerald-600 outline-none">
                      <option value="male">{t('creation.male')}</option>
                      <option value="female">{t('creation.female')}</option>
                      <option value="other">{t('creation.other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 block mb-1">{t('creation.age')}</label>
                    <input type="number" min="10" max="80" value={age} onChange={e => setAge(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg bg-black/40 border border-stone-700 text-sm focus:border-emerald-600 outline-none" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs uppercase tracking-wider text-emerald-300/80 mb-2.5">{t('creation.appearance')}</div>
                  <AppearanceEditor value={appearance} onChange={setAppearance} />
                </div>
              </div>
            )}

            {/* ---- step 2: difficulty ---- */}
            {step === 2 && (
              <div className="rounded-2xl border border-emerald-900/40 bg-black/30 p-4 space-y-2 animate-fade-in">
                <div className="text-xs uppercase tracking-wider text-emerald-300/80">{t('creation.difficulty')}</div>
                {MODE_KEYS.map(key => {
                  const sel = mode === key;
                  return (
                    <button key={key} onClick={() => { setMode(key); setUnderstood(false); }}
                      className={`w-full text-left rounded-lg border p-3 transition ${sel ? `${MODE_TONE[key]} border-current bg-white/5` : 'border-stone-800 bg-white/5 hover:bg-white/10'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">{t(`diff.${key === 'trueCultivation' ? 'true' : key}.title`)}</span>
                        {sel && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">{t('starter.chosen')}</span>}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${sel ? 'text-stone-300' : 'text-stone-500'}`}>{t(`diff.${key === 'trueCultivation' ? 'true' : key}.desc`)}</div>
                      {sel && (
                        <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="text-[11px] text-stone-300">• {t(`diff.${key === 'trueCultivation' ? 'true' : key}.l${i}`)}</div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
                {isTrue && (
                  <label className="flex items-start gap-2 text-[11px] text-rose-200 px-1 pt-1">
                    <input type="checkbox" checked={understood} onChange={e => setUnderstood(e.target.checked)} className="mt-0.5" />
                    <span>{t('creation.permadeathCheck')}</span>
                  </label>
                )}
              </div>
            )}

            {/* ---- step 3: aptitude ---- */}
            {step === 3 && (
              <div className="rounded-2xl border border-emerald-900/40 bg-black/30 p-4 animate-fade-in">
                <AptitudeStep difficulty={mode} locked={aptitude} onAccept={(apt) => { setAptitude(apt); setStep(4); }} />
              </div>
            )}

            {/* ---- step 4: starter Gu ---- */}
            {step === 4 && (
              <div className="rounded-2xl border border-emerald-900/40 bg-black/30 p-4 animate-fade-in">
                <StarterGuStep value={starterGu} onChange={setStarterGu} />
              </div>
            )}

            {/* navigation */}
            <div className="flex gap-2">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-3 rounded-lg border border-stone-700 bg-white/5 hover:bg-white/10 text-stone-300 text-sm">
                  ← {t('ui.back')}
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={(step === 2 && isTrue && !understood) || (step === 3 && !aptitude)}
                  className="flex-[2] py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed">
                  {t('ui.next')} →
                </button>
              ) : (
                <button onClick={begin} disabled={!canBegin}
                  className={`flex-[2] py-3 rounded-lg text-white text-sm font-medium transition ${canBegin ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
                  {isTrue
                    ? (ready ? t('creation.beginTrue') : t('creation.trueWarn'))
                    : t('creation.begin', { mode: t(`diff.${mode === 'trueCultivation' ? 'true' : mode}.title`) })}
                </button>
              )}
            </div>
            {step === 3 && !aptitude && (
              <div className="text-[10px] text-amber-300/80 text-center animate-fade-in">⚠ {t('creation.needAptitude')}</div>
            )}
            {step === 4 && !canBegin && (
              <div className="text-[10px] text-amber-300/80 text-center animate-fade-in">
                ⚠ {[!aptitude && t('creation.needAptitude'), !starterGu && t('creation.needStarter')].filter(Boolean).join(' · ')}
              </div>
            )}
            {step === 1 && (
              <button onClick={cancelCreate} className="w-full py-2 text-xs text-stone-500 hover:text-stone-300">{t('creation.backSlots')}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}