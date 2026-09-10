import React, { useEffect } from 'react';
import { useGame } from '@/game/state/GameContext';

function Toast({ toast }) {
  const { dispatch } = useGame();
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'DISMISS_TOAST', id: toast.id }), 4200);
    return () => clearTimeout(t);
  }, [toast.id]);
  const big = toast.kind === 'pathLevel';
  return (
    <div className={`pointer-events-auto rounded-xl border p-3 shadow-xl animate-pop max-w-xs ${big ? 'border-amber-600/50 bg-[#1a1408]' : 'border-emerald-700/50 bg-[#0d1410]'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{toast.icon}</span>
        <div className={`text-xs font-semibold ${big ? 'text-amber-200' : 'text-emerald-200'}`}>{toast.title}</div>
      </div>
      {(toast.lines || []).map((l, i) => <div key={i} className="text-[10px] text-stone-400 leading-relaxed">{l}</div>)}
    </div>
  );
}

export default function Toasts() {
  const { state } = useGame();
  if (!state.toasts || state.toasts.length === 0) return null;
  return (
    <div className="fixed top-24 right-3 z-40 flex flex-col gap-2 pointer-events-none">
      {state.toasts.slice(-3).map(t => <Toast key={t.id} toast={t} />)}
    </div>
  );
}