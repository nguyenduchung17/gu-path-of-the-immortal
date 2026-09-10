import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { DIFFICULTIES } from '@/game/config/balance';
import { DEFAULT_APPEARANCE, PRESETS } from '@/game/data/appearance';
import AppearanceEditor from './AppearanceEditor';
import SpritePreview from './SpritePreview';
import PortraitFrame from './PortraitFrame';

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
  const [appearance, setAppearance] = useState({ ...DEFAULT_APPEARANCE });
  const isTrue = mode === 'trueCultivation';
  const ready = !isTrue || understood;
  const presetLabel = PRESETS.find((p) => p.id === appearance.preset)?.label;

  return (
    <div className="min-h-screen bg-[#0d1410] text-stone-100 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-4xl w-full py-4">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">🐉</div>
          <h1 className="text-xl font-heading font-semibold text-emerald-200 tracking-wide">CREATE CULTIVATOR — SLOT {createSlot}</h1>
          <p className="text-xs text-stone-400 mt-1.5">A mortal. A single Gu. A long road to immortality. Difficulty cannot be changed once this life begins.</p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-4">
          {/* left: live preview */}
          <div className="rounded-2xl border border-emerald-900/40 bg-black/30 p-4 flex flex-col items-center gap-3 lg:sticky lg:top-4">
            <div className="text-[10px] uppercase tracking-widest text-stone-500">Live Preview</div>
            <div className="rounded-xl bg-gradient-to-b from-emerald-950/80 to-black/50 border border-emerald-900/30 px-6 py-4">
              <SpritePreview appearance={appearance} scale={6} />
            </div>
            <div className="flex items-center gap-2">
              <PortraitFrame appearance={appearance} size={56} />
              <div className="text-left">
                <div className="text-xs font-semibold text-emerald-100">{name.trim() || 'Nameless'}</div>
                <div className="text-[10px] text-stone-500 italic">{presetLabel || 'Custom cultivator'}</div>
              </div>
            </div>
          </div>

          {/* right: identity, appearance, difficulty */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-900/40 bg-black/30 p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs text-stone-400 block mb-1">Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Nameless"
                    className="w-full px-2.5 py-2 rounded-lg bg-black/40 border border-stone-700 text-sm focus:border-emerald-600 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-black/40 border border-stone-700 text-sm focus:border-emerald-600 outline-none">
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Age</label>
                  <input type="number" min="10" max="80" value={age} onChange={e => setAge(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-black/40 border border-stone-700 text-sm focus:border-emerald-600 outline-none" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs uppercase tracking-wider text-emerald-300/80 mb-2.5">Appearance</div>
                <AppearanceEditor value={appearance} onChange={setAppearance} />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-900/40 bg-black/30 p-4 space-y-2">
              <div className="text-xs uppercase tracking-wider text-emerald-300/80">Choose your difficulty</div>
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
              onClick={() => ready && finishCreate(name.trim() || 'Nameless', gender, age, mode, appearance)}
              disabled={!ready}
              className={`w-full py-3 rounded-lg text-white text-sm font-medium transition ${ready ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
              {isTrue
                ? (ready ? 'Begin True Cultivation' : 'Confirm the warning above to begin')
                : `Begin the Path — ${DIFFICULTIES[mode].label}`}
            </button>
            <button onClick={cancelCreate} className="w-full py-2 text-xs text-stone-500 hover:text-stone-300">← Back to Save Slots</button>
          </div>
        </div>
      </div>
    </div>
  );
}