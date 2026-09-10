import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { DIFFICULTIES } from '@/game/config/balance';

// Each mode's death rules are spelled out before the character exists —
// difficulty belongs to the save slot and cannot be changed afterwards.
const MODES = [
  {
    key: 'easy', title: '🌱 EASY', tone: 'text-emerald-200',
    desc: 'Accessible mode for new or casual cultivators.',
    lines: [
      'Enemies: weaker — reduced damage and HP.',
      'Drops: higher · Shop prices: cheaper.',
      'Death: no losses. You wake at the nearest discovered inn with enough HP to continue.',
    ],
  },
  {
    key: 'standard', title: '⚖️ STANDARD', tone: 'text-sky-200',
    desc: 'The intended, balanced experience. Recommended for a first life.',
    lines: [
      'Enemies, drops and prices exactly as designed.',
      'Death: lose part of your cultivation progress and carried resources.',
      'Respawn: a semi-random location — roadside, campsite or wilderness. Not always safe.',
    ],
  },
  {
    key: 'hard', title: '🔥 HARD', tone: 'text-orange-200',
    desc: 'A high-risk path for experienced cultivators.',
    lines: [
      'Enemies: moderately stronger. Drops: slightly richer. Prices: higher.',
      'Death: lose roughly half of your vulnerable progress and carried goods.',
    ],
  },
  {
    key: 'trueCultivation', title: '💀 TRUE CULTIVATION', tone: 'text-rose-200',
    desc: 'PERMADEATH. There are no revives — death permanently ends this character.',
    lines: [
      'Enemies: significantly stronger; refinement is slightly harder.',
      'If this cultivator dies, everything is lost — Gu, items, cultivation, Dao Mastery and stones.',
      'The character cannot be revived. Only a memorial remains.',
    ],
  },
];

export default function CharacterCreation() {
  const { createSlot, finishCreate, cancelCreate } = useGame();
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState(16);
  const [mode, setMode] = useState('standard');
  const [understood, setUnderstood] = useState(false);
  const isTrue = mode === 'trueCultivation';
  const ready = !isTrue || understood;

  return (
    <div className="min-h-screen bg-[#0d1410] text-stone-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-5">
          <div className="text-3xl mb-1">🐉</div>
          <h1 className="text-xl font-semibold text-emerald-200 tracking-wide">CREATE CULTIVATOR — SLOT {createSlot}</h1>
          <p className="text-xs text-stone-400 mt-2">A mortal. A single Gu. A long road to immortality. Difficulty cannot be changed once this life begins.</p>
        </div>

        <div className="rounded-2xl border border-emerald-900/40 bg-black/30 p-5 space-y-4 mb-4">
          <div>
            <label className="text-xs text-stone-400 block mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nameless cultivator"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-stone-700 text-sm focus:border-emerald-600 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-400 block mb-1">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-stone-700 text-sm focus:border-emerald-600 outline-none">
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-400 block mb-1">Age</label>
              <input type="number" min="10" max="80" value={age} onChange={e => setAge(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-stone-700 text-sm focus:border-emerald-600 outline-none" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-900/40 bg-black/30 p-4 space-y-2">
          <div className="text-xs text-stone-400 mb-1">Choose your difficulty</div>
          {MODES.map(m => {
            const sel = mode === m.key;
            return (
              <button key={m.key} onClick={() => { setMode(m.key); setUnderstood(false); }}
                className={`w-full text-left rounded-lg border p-3 transition ${sel ? `${m.tone} border-current bg-white/5` : 'border-stone-800 bg-white/5 hover:bg-white/10'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">{m.title}</span>
                  {sel && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">SELECTED</span>}
                </div>
                <div className={`text-[11px] mt-0.5 ${sel ? 'text-stone-300' : 'text-stone-500'}`}>{m.desc}</div>
                {sel && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                    {m.lines.map((l, i) => <div key={i} className="text-[11px] text-stone-300">• {l}</div>)}
                  </div>
                )}
              </button>
            );
          })}
          {isTrue && (
            <label className="flex items-start gap-2 text-[11px] text-rose-200 px-1 pt-1">
              <input type="checkbox" checked={understood} onChange={e => setUnderstood(e.target.checked)} className="mt-0.5" />
              <span>I understand that this character can be permanently lost.</span>
            </label>
          )}
        </div>

        <button
          onClick={() => ready && finishCreate(name.trim() || 'Nameless', gender, age, mode)}
          disabled={!ready}
          className={`w-full mt-4 py-3 rounded-lg text-white text-sm font-medium transition ${ready ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
          {isTrue
            ? (ready ? 'Begin True Cultivation' : 'Confirm the warning above to begin')
            : `Begin the Path — ${DIFFICULTIES[mode].label}`}
        </button>
        <button onClick={cancelCreate} className="w-full mt-2 py-2 text-xs text-stone-500 hover:text-stone-300">← Back to Save Slots</button>
      </div>
    </div>
  );
}