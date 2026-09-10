import React from 'react';

// In-game overlay window: dims the world behind it, ESC/backdrop/click-outside closes.
export default function OverlayWindow({ title, icon, onClose, wide, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-3 sm:p-6 animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[88vh] flex flex-col rounded-xl border border-emerald-800/60 bg-[#101812]/95 shadow-2xl`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800/80 shrink-0">
          <h2 className="text-sm font-heading font-semibold tracking-wide text-emerald-200">{icon} {title}</h2>
          <button onClick={onClose} className="text-xs text-stone-400 hover:text-amber-300 px-2.5 py-1 rounded-lg border border-stone-700 bg-white/5 transition">
            ✕ Esc
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-thin px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}