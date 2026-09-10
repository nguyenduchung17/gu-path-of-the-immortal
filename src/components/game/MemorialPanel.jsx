import React from 'react';

const fmtPlay = (sec) => {
  if (!sec) return '0h 0m';
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return `${h}h ${m}m`;
};

// Memorial record for a deceased (True Cultivation) character.
export default function MemorialPanel({ record, onCloseLabel = 'Close', onClose, onDelete, onDeleteLabel = 'Delete Save' }) {
  const a = record?.at || {};
  const rows = [
    ['Days Survived', a.day ?? '—'],
    ['Playtime', fmtPlay(a.playtimeSec)],
    ['Final Cultivation Realm', a.realm],
    ['Highest Dao Mastery', a.highestMastery ? `Level ${a.highestMastery}` : '—'],
    ['Gu Collected', a.gu],
    ['Recipes Known', a.recipes],
    ['Enemies Defeated', a.kills],
    ['Quests Completed', a.quests],
    ['Primordial Stones at Death', `💎 ${a.stones}`],
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3">
      <div className="max-w-sm w-full rounded-2xl border border-rose-800/60 bg-[#100d10] p-5 animate-pop">
        <div className="text-center mb-3">
          <div className="text-3xl mb-1">🕯️</div>
          <h2 className="text-base font-semibold text-rose-100">{a.name || 'A Cultivator'} — Deceased</h2>
          <p className="text-[11px] text-stone-500 mt-1">{record?.cause || 'Fallen in the world'}{a.place ? ` · ${a.place}` : ''}</p>
        </div>
        <div className="rounded-lg border border-stone-800 bg-black/20 p-3 space-y-1.5 mb-4">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px]">
              <span className="text-stone-500">{k}</span>
              <span className="text-stone-200">{String(v)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {onClose && (
            <button onClick={onClose} className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-stone-200">{onCloseLabel}</button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="w-full py-2 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 border border-rose-800/50 text-sm text-rose-200">{onDeleteLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}