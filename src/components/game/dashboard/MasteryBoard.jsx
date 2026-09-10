import React from 'react';
import { PATH_BY_ID } from '@/game/data/paths';
import { masteryThreshold, masteryTitle } from '@/game/engine/mastery';

// each Path's signature bar color — at-a-glance recognition by icon + gradient
const BAR = {
  fire: 'from-rose-600 to-orange-300',
  water: 'from-sky-600 to-cyan-300',
  wind: 'from-teal-600 to-emerald-300',
  earth: 'from-amber-700 to-yellow-300',
  enslavement: 'from-violet-600 to-purple-300',
  refinement: 'from-emerald-600 to-lime-300',
  sword: 'from-zinc-500 to-slate-200',
};

function xpPct(level, xp) {
  if (level >= 5) return 100;
  const cur = masteryThreshold(level);
  const next = masteryThreshold(level + 1);
  if (next <= cur) return 100;
  return Math.max(0, Math.min(100, ((xp - cur) / (next - cur)) * 100));
}

// Path mastery levels at a glance — icon medallion, level, title and a
// color-coded progress bar to the next level.
export default function MasteryBoard({ paths }) {
  return (
    <section className="rounded-2xl border border-amber-800/40 bg-[#10181a] p-4">
      <h2 className="font-heading text-sm text-amber-200">☯️ Path Mastery</h2>
      <ul className="mt-2.5 space-y-2">
        {paths.map(({ id, m }) => {
          const def = PATH_BY_ID[id];
          if (!def) return null;
          const maxed = m.level >= 5;
          return (
            <li key={id} className="rounded-xl border border-stone-800 bg-black/20 px-3 py-2 flex items-center gap-3">
              <span className="shrink-0 w-9 h-9 rounded-lg bg-black/40 border border-stone-700 flex items-center justify-center text-lg leading-none">{def.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-stone-100 truncate">{def.name}</span>
                  <span className="text-[10px] text-amber-200/90 shrink-0">Lv {m.level} · {masteryTitle(m.level)}</span>
                </div>
                <div className="h-2 rounded-full bg-black/50 overflow-hidden mt-1.5 border border-black/40">
                  <div className={`h-full bg-gradient-to-r ${BAR[id] || 'from-stone-600 to-stone-300'} transition-all duration-700`} style={{ width: `${xpPct(m.level, m.xp)}%` }} />
                </div>
                <div className="mt-1 flex justify-between items-start gap-2">
                  <p className="text-[10px] text-stone-400 flex-1">{def.levels[Math.min(m.level, 5) - 1].text}</p>
                  <span className="text-[9px] text-stone-500 shrink-0">{maxed ? 'MAX' : `✦ ${m.xp}/${masteryThreshold(m.level + 1)}`}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}