import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';

export default function CharacterCreation() {
  const { newGame } = useGame();
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState(16);

  return (
    <div className="min-h-screen bg-[#0d1410] text-stone-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🐉</div>
          <h1 className="text-2xl font-semibold text-emerald-200 tracking-wide">GU: PATH OF THE IMMORTAL</h1>
          <p className="text-xs text-stone-400 mt-2">A mortal. A single Gu. A long road to immortality. Resources are scarce — choose wisely.</p>
        </div>
        <div className="rounded-2xl border border-emerald-900/40 bg-black/30 p-5 space-y-4">
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
          <button onClick={() => newGame(name.trim() || 'Nameless', gender, age)}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition">
            Begin the Path
          </button>
          <p className="text-[10px] text-stone-500 text-center">Your aptitude and starting stats are fated at birth. Progress saves automatically.</p>
        </div>
      </div>
    </div>
  );
}