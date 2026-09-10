import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { ENEMY_BY_ID, visualOf, DANGER_LABEL, DANGER_COLOR } from '@/game/data/enemies';
import { exploreActive } from '@/game/engine/exploration';
import { useT } from '@/game/i18n/LangContext';

const AGGR = { passive: 'Passive', territorial: 'Territorial', aggressive: 'Aggressive', predator: 'Predator', guard: 'Guardian' };

// One scouted foe — full detail at this scouting level (#34): rank, HP,
// weakness, resistances, aggression; pack leaders are crowned.
function FoeRow({ e, last }) {
  const def = ENEMY_BY_ID[e.defId];
  const v = visualOf(e.defId);
  const leader = e.packRole === 'leader' || def?.packLeader;
  return (
    <div className={`text-[10px] mb-1 pb-1 border-b border-stone-700/40 ${last ? 'last:border-0 last:mb-0 last:pb-0' : ''}`}>
      <div className="flex justify-between gap-2">
        <span className="text-stone-200 font-medium truncate">
          {leader && <span className="text-amber-300">♛ </span>}
          {def.name}
          {e.state === 'chase' && <span className="text-rose-400"> !</span>}
          {e.state === 'alert' && <span className="text-amber-400"> ?</span>}
        </span>
        <span className="text-stone-400 shrink-0">{Math.round(e.hp)}/{def.hp}</span>
      </div>
      <div className="text-stone-500">{v.rank} · {AGGR[e.behavior || def.behavior] || 'Beast'}</div>
      <div className="text-stone-500">
        Weakness: <span className="capitalize">{def.weakness || '—'}</span>
        {def.resists?.length ? ` · Resists: ${def.resists.join(', ')}` : ''}
      </div>
    </div>
  );
}

// Scouting report — while a scouting Gu's vision is active, threats in range
// are laid bare. PACKS (#34, #38): members of one pack are grouped with their
// count, leader, and a combined threat estimate — the call to engage or avoid.
export default function ScoutReport() {
  const { state } = useGame();
  const { t } = useT();
  const act = exploreActive(state);
  if (!act.vision) return null;
  const p = state.player;
  const r = act.vision.radius || 9;
  const seen = (state.worldState.enemies || []).filter(e =>
    !e.dead && Math.max(Math.abs(e.x - p.x), Math.abs(e.y - p.y)) <= r + 6);
  if (!seen.length) {
    return (
      <div className="absolute top-28 left-2.5 z-20 w-52 rounded-lg bg-black/55 backdrop-blur border border-amber-700/40 p-2 animate-fade-in">
        <div className="text-[10px] uppercase tracking-wider text-amber-200/90 mb-1">👁️ {t('scout.title')}</div>
        <div className="text-[10px] text-stone-400">{t('scout.none', { n: r })}</div>
      </div>
    );
  }
  // group packmates; loners render on their own
  const groups = [];
  for (const e of seen) {
    if (!e.packId) continue;
    let g = groups.find(x => x.id === e.packId);
    if (!g) { g = { id: e.packId, pack: true, members: [] }; groups.push(g); }
    g.members.push(e);
  }
  const loners = seen.filter(e => !e.packId);
  let shown = 0;
  return (
    <div className="absolute top-28 left-2.5 z-20 w-52 rounded-lg bg-black/55 backdrop-blur border border-amber-700/40 p-2 animate-fade-in max-h-[46vh] overflow-y-auto scrollbar-thin">
      <div className="text-[10px] uppercase tracking-wider text-amber-200/90 mb-1">👁️ {t('scout.title')}</div>
      {groups.slice(0, 3).map(g => {
        const leader = g.members.find(m => m.packRole === 'leader' || ENEMY_BY_ID[m.defId]?.packLeader);
        const danger = Math.max(...g.members.map(m => visualOf(m.defId).danger || 1));
        return (
          <div key={g.id} className="mb-1.5 rounded border border-rose-800/40 bg-rose-950/20 p-1.5">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-semibold text-rose-200">🐺 {t('scout.pack')} · {t('scout.packMembers', { n: g.members.length })}</span>
              <span className="text-[8px] shrink-0" style={{ color: DANGER_COLOR[danger] }}>{DANGER_LABEL[danger]}</span>
            </div>
            {leader && <div className="text-[9px] text-amber-300 mb-1">♛ {t('scout.leaderDetected')}</div>}
            {g.members.slice(0, 4).map((m, i) => <FoeRow key={m.id} e={m} last={i >= Math.min(3, g.members.length - 1)} />)}
          </div>
        );
      })}
      {loners.slice(0, 5 - Math.min(5, shown)).map((e, i) => <FoeRow key={e.id} e={e} last={i === loners.slice(0, 5).length - 1 && !groups.length} />)}
      {groups.length > 3 && <div className="text-[9px] text-stone-500">+{groups.length - 3} …</div>}
    </div>
  );
}