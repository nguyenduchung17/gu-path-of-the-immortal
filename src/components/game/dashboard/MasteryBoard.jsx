import React from 'react';
import { PATH_BY_ID } from '@/game/data/paths';
import { masteryThreshold, masteryTitle } from '@/game/engine/mastery';

function xpPct(level, xp) {
  if (level >= 5) return 100;
  const cur = masteryThreshold(level);
  const next = masteryThreshold(level + 1);
  if (next <= cur) return 100;
  return Math.max(0, Math.min(100, ((xp - cur) / (next - cur)) * 100));
}

// Path mastery levels at a glance — level, title, next-level progress, current bonus.
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
            <li key={id} className="rounded-xl border border-stone-800 bg-black/20 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-stone-100">{def.icon} {def.name}</span>
                <span className="text-[10px] text-amber-200/90">Lv {m.level} · {masteryTitle(m.level)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-black/50 overflow-hidden mt-1.5">
                <div className="h-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-700" style={{ width: `${xpPct(m.level, m.xp)}%` }} />
              </div>
              <div className="mt-1 flex justify-between items-start gap-2">
                <p className="text-[10px] text-stone-400 flex-1">{def.levels[Math.min(m.level, 5) - 1].text}</p>
                <span className="text-[9px] text-stone-500 shrink-0">{maxed ? 'MAX' : `✦ ${m.xp}/${masteryThreshold(m.level + 1)}`}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}