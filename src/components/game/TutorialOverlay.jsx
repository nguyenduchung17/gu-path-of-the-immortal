import React, { useState } from 'react';

const STORAGE_KEY = 'gu_tutorial_seen';

export default function TutorialOverlay() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));
  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-3">
      <div className="max-w-sm w-full rounded-xl border border-emerald-800/60 bg-[#141c16] p-5 shadow-2xl animate-pop">
        <div className="text-center mb-4">
          <div className="text-2xl mb-1">🐉</div>
          <h2 className="text-lg font-semibold text-emerald-100">Welcome, Cultivator</h2>
          <p className="text-xs text-stone-400 mt-1">The path to immortality begins with a single step.</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg bg-white/5 p-3">
            <div className="text-xs font-semibold text-emerald-200 mb-1">🗺️ Moving Around</div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Use <b className="text-emerald-100">WASD</b> / <b className="text-emerald-100">Arrow keys</b> to move, and <b className="text-emerald-100">E</b> to interact with people, resources, camps and formations. On mobile, use the on-screen D-pad.
            </p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <div className="text-xs font-semibold text-emerald-200 mb-1">🔄 The Core Loop</div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              <b className="text-emerald-100">Explore</b> the world → <b className="text-emerald-100">gather</b> materials → <b className="text-emerald-100">refine</b> new Gu → <b className="text-emerald-100">fight</b> beasts → <b className="text-emerald-100">cultivate</b> to raise your realm.
            </p>
          </div>
          <p className="text-[10px] text-stone-500 text-center px-2">
            Tip: Essence never regenerates on its own — recover it from the Cultivation tab. Recipes are sold by town masters, and every Gu belongs to a Dao Path you can master.
          </p>
        </div>

        <button onClick={dismiss}
          className="mt-4 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition">
          Begin the Path
        </button>
      </div>
    </div>
  );
}