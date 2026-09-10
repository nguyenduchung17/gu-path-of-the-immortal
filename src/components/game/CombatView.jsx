import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { GU_BY_ID } from '@/game/data/gu';
import { ITEM_BY_ID, ITEMS } from '@/game/data/items';
import { PATH_BY_ID } from '@/game/data/paths';
import { CULTIVATION_STAGES } from '@/game/data/cultivation';
import { effectiveCost } from '@/game/engine/combat';

function Bar({ value, max, color, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="text-[10px] text-stone-400 mb-0.5">{label} {Math.floor(value)}/{max}</div>
      <div className="h-2.5 rounded-full bg-black/50 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function CombatView() {
  const { state, dispatch } = useGame();
  const c = state.combat;
  const p = state.player;
  const enemy = c.enemy;
  const stage = CULTIVATION_STAGES[Math.min(19, p.rank * 4 + (p.stage || 0))];

  if (c.over) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-emerald-800/50 bg-[#0d1410] p-6 text-center animate-pop">
          <div className="text-4xl mb-2">{c.result === 'victory' ? '⚔️' : c.result === 'flee' ? '🌫️' : '💀'}</div>
          <h2 className="text-xl font-semibold text-emerald-100 mb-2">
            {c.result === 'victory' ? 'Victory' : c.result === 'flee' ? 'Escaped' : 'Defeated'}
          </h2>
          <div className="text-xs text-stone-400 space-y-1 mb-4 max-h-40 overflow-y-auto scrollbar-thin">
            {c.log.slice(-8).map((l, i) => <div key={i}>{l}</div>)}
          </div>
          {c.result === 'victory' && c.rewards && (
            <div className="text-xs text-amber-200/90 space-y-0.5 mb-3">
              {Object.keys(c.rewards.items).length > 0 && <div>Loot: {Object.entries(c.rewards.items).map(([k, v]) => `${v} ${ITEM_BY_ID[k]?.name || k}`).join(', ')}</div>}
              <div>💎 +{c.rewards.spiritStones} primordial stones · ✦ +{c.rewards.progress}% cultivation</div>
              {(c.rewards.mastery || []).map((m, i) => (
                <div key={i} className="text-emerald-300/90">{PATH_BY_ID[m.pathId].icon} {PATH_BY_ID[m.pathId].name} mastery +{m.xp}</div>
              ))}
            </div>
          )}
          <button onClick={() => dispatch({ type: 'END_COMBAT' })} className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">Continue</button>
        </div>
      </div>
    );
  }

  const equipped = state.player.equippedGu.map(id => state.ownedGu.find(g => g.instanceId === id)).filter(Boolean);
  const meds = ITEMS.filter(it => it.category === 'medicine' || it.category === 'food').filter(it => (state.inventory[it.category]?.[it.id] || 0) > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3">
      <div className="max-w-lg w-full rounded-2xl border border-rose-900/50 bg-[#0d1410] p-4 animate-pop">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg border border-emerald-800/40 bg-emerald-900/10 p-3">
            <div className="flex items-center gap-2 mb-2"><span className="text-2xl">🧑‍🌾</span><div><div className="text-sm font-semibold text-emerald-100">{p.name}</div><div className="text-[10px] text-stone-400">{stage.name}</div></div></div>
            <Bar value={p.hp} max={p.maxHp} color="linear-gradient(90deg,#e11d48,#fb7185)" label="HP" />
            <div className="mt-1.5"><Bar value={p.primevalEssence} max={p.maxPrimevalEssence} color="linear-gradient(90deg,#0284c7,#7dd3fc)" label="Essence" /></div>
            {c.playerStatuses.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{c.playerStatuses.map((s, i) => <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-stone-300">{s.type}{s.duration}</span>)}</div>}
          </div>
          <div className="rounded-lg border border-rose-800/40 bg-rose-900/10 p-3">
            <div className="flex items-center gap-2 mb-2"><span className="text-2xl">👹</span><div><div className="text-sm font-semibold text-rose-100">{enemy.name}</div><div className="text-[10px] text-stone-400">ATK {enemy.attack} · DEF {enemy.defense}</div></div></div>
            <Bar value={enemy.hp} max={enemy.maxHp} color="linear-gradient(90deg,#9f1239,#fb7185)" label="HP" />
            {c.revealed && <div className="text-[10px] text-amber-300/80 mt-1">Weakness: <span className="capitalize">{enemy.weakness === 'none' ? 'none' : `${PATH_BY_ID[enemy.weakness]?.name || enemy.weakness} Path`}</span></div>}
            {enemy.statuses.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{enemy.statuses.map((s, i) => <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-stone-300">{s.type}{s.duration}</span>)}</div>}
          </div>
        </div>

        <div className="h-28 overflow-y-auto scrollbar-thin text-[11px] text-stone-400 bg-black/30 rounded-lg p-2 mb-3 border border-stone-800">
          {c.log.slice(-7).map((l, i) => <div key={i} className={i === c.log.slice(-7).length - 1 ? 'text-emerald-200' : ''}>{l}</div>)}
        </div>

        <div className="text-[10px] text-stone-500 mb-1">Use Gu — path mastery bonuses are applied automatically:</div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {equipped.map(inst => {
            const gu = GU_BY_ID[inst.guId];
            const path = PATH_BY_ID[gu.path];
            const cd = c.cooldowns[inst.instanceId] || 0;
            const cost = effectiveCost(gu, state);
            const noEssence = p.primevalEssence < cost;
            const disabled = cd > 0 || noEssence;
            return (
              <button key={inst.instanceId} disabled={disabled}
                onClick={() => dispatch({ type: 'PLAYER_ACTION', action: 'gu', guInstanceId: inst.instanceId })}
                className={`text-left px-2 py-1.5 rounded-lg text-xs border ${disabled ? 'border-stone-800 bg-stone-900/40 text-stone-500' : 'border-emerald-700/40 bg-emerald-900/20 text-emerald-100 hover:bg-emerald-800/30'}`}>
                <div className="font-medium truncate">{gu.name}</div>
                <div className={`text-[9px] ${disabled ? 'text-stone-500' : 'text-stone-400'}`}>{path.icon} {path.name} · ⚡{cost}{cd > 0 ? ` · ⏳${cd}` : ''}</div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {meds.map(it => (
            <button key={it.id} onClick={() => dispatch({ type: 'PLAYER_ACTION', action: 'item', itemId: it.id })}
              className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-stone-200">
              🧪 {it.name} ({state.inventory[it.category]?.[it.id]})
            </button>
          ))}
          <button onClick={() => dispatch({ type: 'PLAYER_ACTION', action: 'flee' })}
            className="text-[10px] px-2 py-1 rounded bg-amber-700/30 hover:bg-amber-700/50 text-amber-200 ml-auto">
            🏃 Flee
          </button>
        </div>
      </div>
    </div>
  );
}