import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { PATHS, PATH_BY_ID } from '@/game/data/paths';
import { RECIPES } from '@/game/data/recipes';
import { GU, GU_BY_ID } from '@/game/data/gu';
import { masteryOf, masteryThreshold, masteryTitle } from '@/game/engine/mastery';

function XpBar({ m }) {
  const base = masteryThreshold(m.level);
  const next = masteryThreshold(m.level + 1);
  const pct = m.level >= 5 ? 100 : Math.max(0, Math.min(100, ((m.xp - base) / (next - base)) * 100));
  return (
    <div>
      <div className="h-2 rounded-full bg-black/40 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-300 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-stone-500 mt-0.5">{m.level >= 5 ? 'Peak mastery' : `${m.xp} / ${next} mastery XP`}</div>
    </div>
  );
}

function PathDetail({ path, onBack }) {
  const { state } = useGame();
  const m = masteryOf(state, path.id);
  const stats = state.masteryStats?.[path.id] || {};
  const pathRecipes = RECIPES.filter(r => r.path === path.id);
  const pathGu = GU.filter(g => g.path === path.id);

  return (
    <div className="pt-3 space-y-3 animate-fade-in">
      <button onClick={onBack} className="text-[11px] text-stone-400 hover:text-stone-200">← All Paths</button>
      <div className={`rounded-xl border p-4 bg-black/20 ${path.border}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{path.icon}</span>
          <div>
            <h2 className={`text-lg font-semibold ${path.color}`}>{path.name}</h2>
            <div className="text-xs text-stone-400">Level {m.level} — {masteryTitle(m.level)}</div>
          </div>
        </div>
        <p className="text-[11px] text-stone-400 mb-3">{path.description}</p>
        <XpBar m={m} />
      </div>

      <div className="rounded-xl border border-stone-800 bg-black/20 p-4">
        <h3 className="text-sm font-semibold text-stone-300 mb-2">Mastery Progression</h3>
        <div className="space-y-1.5">
          {path.levels.map((lv, i) => {
            const level = i + 1;
            const reached = m.level >= level;
            const milestone = pathRecipes.filter(r => r.milestoneLevel === level);
            return (
              <div key={level} className={`flex items-start gap-2 p-2 rounded-lg border ${reached ? 'border-emerald-800/40 bg-emerald-900/10' : 'border-stone-800 bg-black/10'}`}>
                <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${reached ? 'bg-emerald-700/50 text-emerald-200' : 'bg-stone-800 text-stone-500'}`}>L{level}</div>
                <div className="flex-1">
                  <div className={`text-xs font-medium ${reached ? 'text-stone-200' : 'text-stone-500'}`}>{masteryTitle(level)} — {lv.text}</div>
                  {milestone.map(r => (
                    <div key={r.id} className="text-[10px] text-amber-300/80 mt-0.5">
                      {state.knownRecipes.includes(r.id) ? '✓' : '🔓 unlocks'} recipe: {GU_BY_ID[r.guId].name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-stone-800 bg-black/20 p-4">
        <h3 className="text-sm font-semibold text-stone-300 mb-2">Statistics</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-white/5 flex justify-between"><span className="text-stone-400">Gu uses in battle</span><span>{stats.guUsed || 0}</span></div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 flex justify-between"><span className="text-stone-400">Victories contributed</span><span>{stats.kills || 0}</span></div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 flex justify-between"><span className="text-stone-400">Gu refined</span><span>{stats.refined || 0}</span></div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 flex justify-between"><span className="text-stone-400">Recipes learned</span><span>{stats.recipes || 0}</span></div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-800 bg-black/20 p-4">
        <h3 className="text-sm font-semibold text-stone-300 mb-2">Gu of this Path</h3>
        <div className="flex flex-wrap gap-1.5">
          {pathGu.map(g => {
            const owned = state.ownedGu.some(o => o.guId === g.id);
            return <span key={g.id} className={`text-[10px] px-2 py-1 rounded-full border ${owned ? 'border-emerald-700/50 text-emerald-200' : 'border-stone-800 text-stone-500'}`}>{owned ? g.name : '???'}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

function PathCard({ path, onView }) {
  const { state } = useGame();
  const m = masteryOf(state, path.id);
  const bonuses = path.levels.slice(0, m.level).map(l => l.text);
  const unlocked = RECIPES.filter(r => r.path === path.id && r.masteryReq <= m.level);

  return (
    <div className={`rounded-xl border bg-black/20 p-4 ${path.border}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{path.icon}</span>
        <div>
          <div className={`text-sm font-semibold ${path.color}`}>{path.name}</div>
          <div className="text-[10px] text-stone-400">Level {m.level} — {masteryTitle(m.level)}</div>
        </div>
      </div>
      <XpBar m={m} />
      {bonuses.length > 0 && (
        <div className="mt-2">
          <div className="text-[10px] uppercase tracking-wider text-stone-500 mb-1">Current Bonuses</div>
          {bonuses.map((b, i) => <div key={i} className="text-[11px] text-emerald-300/90">• {b}</div>)}
        </div>
      )}
      {unlocked.length > 0 && (
        <div className="mt-1.5 text-[10px] text-stone-500">
          Recipes: {unlocked.map(r => `✓ ${GU_BY_ID[r.guId].name}`).join(' · ')}
        </div>
      )}
      <button onClick={onView} className="mt-2 text-[11px] px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-stone-200">View Path</button>
    </div>
  );
}

export default function DaoMasteryPanel() {
  const { state } = useGame();
  const [selected, setSelected] = useState(null);
  if (selected) return <PathDetail path={PATH_BY_ID[selected]} onBack={() => setSelected(null)} />;

  const known = PATHS.filter(p => state.knownPaths.includes(p.id));
  const unknown = PATHS.filter(p => !state.knownPaths.includes(p.id));

  return (
    <div className="pt-3 space-y-4 animate-fade-in">
      <p className="text-xs text-stone-400">
        Your cultivation Rank is raw power; Path Mastery is earned expertise. Master Paths by using their Gu in battle and refining their recipes.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {known.map(p => <PathCard key={p.id} path={p} onView={() => setSelected(p.id)} />)}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-stone-400 mb-2">Undiscovered Paths</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {unknown.map(p => (
            <div key={p.id} className="rounded-xl border border-stone-900 bg-black/10 p-4 opacity-60">
              <div className="text-sm text-stone-500">??? Undiscovered Path</div>
              <div className="text-[10px] text-stone-600 italic mt-1">Discover a Gu, recipe or teacher of this path to begin walking it.</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}