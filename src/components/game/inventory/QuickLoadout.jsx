import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { GU_BY_ID, isKillerMove } from '@/game/data/gu';
import { PATH_BY_ID } from '@/game/data/paths';
import { ITEM_BY_ID } from '@/game/data/items';
import { guCondition, HUNGER_META } from '@/game/engine/guLife';
import { sfx } from '@/game/audio/sfx';

const EQUIP_MAX = 6;

// Quick loadout strip at the top of the Inventory: one-click equip/unequip for
// every owned Gu and quick-use buttons for tactical consumables (medicine +
// combat-usable trail food) — no sub-menu navigation mid-exploration.
export default function QuickLoadout() {
  const { state, dispatch } = useGame();
  const equipped = new Set(state.player.equippedGu);
  const equippedCount = equipped.size;

  // primary tactical items owned: all medicine, plus combat-usable food
  const primary = [];
  for (const cat of ['medicine', 'food']) {
    for (const [id, qty] of Object.entries(state.inventory[cat] || {})) {
      const it = ITEM_BY_ID[id];
      if (!it || qty <= 0 || !it.use) continue;
      if (cat === 'food' && !it.combatUsable) continue;
      primary.push({ it, qty });
    }
  }

  // every owned Gu as a compact chip — equipped ones first
  const chips = state.ownedGu.map(inst => {
    const gu = GU_BY_ID[inst.guId];
    const cond = guCondition(state, inst);
    const isEq = equipped.has(inst.instanceId);
    return { inst, gu, path: PATH_BY_ID[gu.path], cond, meta: HUNGER_META[cond.band], isEq };
  }).sort((a, b) => b.isEq - a.isEq);

  if (!chips.length && !primary.length) return null;

  return (
    <div className="rounded-lg border border-stone-700/70 bg-black/25 p-3 space-y-3 animate-fade-in">
      {chips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-300">⚔️ Gu Loadout</span>
            <span className={`text-[10px] ${equippedCount >= EQUIP_MAX ? 'text-amber-300' : 'text-stone-500'}`}>{equippedCount}/{EQUIP_MAX} equipped</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map(({ inst, gu, path, cond, meta, isEq }) => (
              <div key={inst.instanceId} title={gu.name}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${isEq ? 'border-emerald-500/60 bg-emerald-900/20' : 'border-stone-800 bg-black/30'}`}>
                <span className="text-[11px]">{path.icon}</span>
                <span className={`text-[11px] font-medium max-w-[9rem] truncate ${isEq ? 'text-emerald-100' : 'text-stone-300'}`}>
                  {cond.vital && '🩸'}{isKillerMove(gu) && '★'}{gu.name}
                </span>
                <span className="text-[9px] text-stone-500">R{inst.rank || gu.rank}</span>
                {cond.injured && <span title="Injured">🩹</span>}
                {!cond.vital && <span className={meta.tone} title="Hunger">{meta.icon}</span>}
                {isEq ? (
                  <button onClick={() => { sfx('ui'); dispatch({ type: 'UNEQUIP_GU', instanceId: inst.instanceId }); }}
                    title="Unequip" className="text-[10px] text-stone-400 hover:text-rose-300 px-0.5">✕</button>
                ) : (
                  <button onClick={() => { sfx('confirm'); dispatch({ type: 'EQUIP_GU', instanceId: inst.instanceId }); }}
                    disabled={equippedCount >= EQUIP_MAX} title="Equip"
                    className={`text-[10px] font-bold px-1 rounded ${equippedCount >= EQUIP_MAX ? 'text-stone-600 cursor-not-allowed' : 'text-emerald-300 hover:text-emerald-200'}`}>+</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {primary.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-stone-300 mb-1.5">🎒 Quick Use</div>
          <div className="flex flex-wrap gap-1.5">
            {primary.map(({ it, qty }) => (
              <button key={it.id} onClick={() => { sfx('confirm'); dispatch({ type: 'USE_ITEM', itemId: it.id }); }}
                title={it.description}
                className={`text-[11px] px-2 py-1 rounded-lg border ${it.combatUsable ? 'border-rose-700/50 bg-rose-900/20 text-rose-100 hover:bg-rose-900/40' : 'border-stone-700 bg-black/30 text-stone-200 hover:bg-white/10'}`}>
                {it.name} <span className="opacity-70">×{qty}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}